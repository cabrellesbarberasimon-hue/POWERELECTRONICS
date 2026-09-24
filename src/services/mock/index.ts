import type { Localized, Post, Rating } from '@/types/domain';
import { DEMO_PASSWORD } from '@/data/users';
import { markStep } from '@/modules/university/progress';
import { contribution, ranking } from '@/modules/social/scoring';
import { challengeProgress } from '@/modules/social/challenges';
import { getEngine } from '@/modules/ai';
import { monthKey, periodBounds } from '@/data/time';
import { tierForEmployees } from '@/modules/admin/licensing';
import type { Services } from '../types';
import { copy, getDb, latency, mutate, resetDb, uid } from './db';

const text = (s: Localized | string) => (typeof s === 'string' ? s : `${s.en} ${s.es}`);
const matches = (q: string | undefined, ...fields: (Localized | string)[]) =>
  !q || fields.some((f) => text(f).toLowerCase().includes(q.trim().toLowerCase()));

const scoringInput = () => {
  const db = getDb();
  return {
    posts: db.posts,
    ratings: db.ratings,
    challenges: db.challenges,
    progress: db.progress,
    trainingSessions: db.trainingSessions,
    courses: db.courses,
  };
};

class NotFound extends Error {
  constructor(what: string) {
    super(`${what} not found`);
  }
}

/** Marks challenges as completed for a user when their goal is reached. */
function settleChallenges(userId: string) {
  mutate((db) => {
    for (const ch of db.challenges) {
      if (ch.completedBy.includes(userId) || !ch.participants.includes(userId)) continue;
      if (challengeProgress(ch, userId, scoringInput()).current >= ch.goal.target) ch.completedBy.push(userId);
    }
  });
}

export const mockServices: Services = {
  auth: {
    async signIn(username, password) {
      await latency(300);
      const user = getDb().users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      // Mobile keyboards often capitalise or append a space: normalise the demo password.
      if (!user || password.trim().toLowerCase() !== DEMO_PASSWORD) throw new Error('invalid_credentials');
      return copy(user);
    },
    async getUser(id) {
      return copy(getDb().users.find((u) => u.id === id));
    },
    async listUsers() {
      await latency();
      return copy(getDb().users);
    },
  },

  university: {
    async listCourses(filter = {}) {
      await latency();
      return copy(
        getDb().courses.filter(
          (c) =>
            (!filter.level || c.level === filter.level) &&
            (!filter.area || c.area === filter.area) &&
            matches(filter.query, c.title, c.description, c.code, ...c.tags),
        ),
      );
    },
    async getCourse(id) {
      await latency(60);
      return copy(getDb().courses.find((c) => c.id === id));
    },
    async listProgress(userId) {
      await latency(60);
      return copy(getDb().progress.filter((p) => p.userId === userId));
    },
    async setStepOutcome(userId, courseId, stepId, outcome) {
      await latency();
      const result = mutate((db) => {
        const idx = db.progress.findIndex((p) => p.userId === userId && p.courseId === courseId);
        const current = idx >= 0 ? db.progress[idx] : { userId, courseId, completedStepIds: [], failedStepIds: [], updatedAt: '' };
        const next = markStep(current, stepId, outcome);
        if (idx >= 0) db.progress[idx] = next;
        else db.progress.push(next);
        return next;
      });
      settleChallenges(userId);
      return copy(result);
    },
    async addLesson(courseId, sectionId, lesson) {
      await latency();
      return copy(
        mutate((db) => {
          const section = db.courses.find((c) => c.id === courseId)?.sections.find((s) => s.id === sectionId);
          if (!section) throw new NotFound('section');
          const step = { ...lesson, id: uid('lesson') };
          section.steps.push(step);
          return step;
        }),
      );
    },
  },

  social: {
    async listPosts(filter = {}) {
      await latency();
      return copy(
        getDb()
          .posts.filter(
            (p) =>
              (!filter.courseId || p.courseId === filter.courseId) &&
              (!filter.sectionId || p.sectionId === filter.sectionId) &&
              (!filter.authorId || p.authorId === filter.authorId) &&
              matches(filter.query, p.title, p.body, ...p.tags),
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    },
    async getPost(id) {
      return copy(getDb().posts.find((p) => p.id === id));
    },
    async createPost(input) {
      await latency(250);
      const post: Post = {
        id: uid('po'),
        createdAt: new Date().toISOString(),
        reactions: { like: [], wow: [], idea: [] },
        comments: [],
        shares: 0,
        ...input,
      };
      mutate((db) => db.posts.unshift(post));
      settleChallenges(input.authorId);
      return copy(post);
    },
    async toggleReaction(postId, userId, kind) {
      const post = mutate((db) => {
        const p = db.posts.find((x) => x.id === postId);
        if (!p) throw new NotFound('post');
        const list = p.reactions[kind];
        p.reactions[kind] = list.includes(userId) ? list.filter((u) => u !== userId) : [...list, userId];
        return p;
      });
      settleChallenges(post.authorId);
      return copy(post);
    },
    async addComment(postId, userId, body) {
      await latency();
      return copy(
        mutate((db) => {
          const p = db.posts.find((x) => x.id === postId);
          if (!p) throw new NotFound('post');
          p.comments.push({ id: uid('cm'), authorId: userId, text: body, createdAt: new Date().toISOString() });
          return p;
        }),
      );
    },
    async share(postId) {
      return copy(
        mutate((db) => {
          const p = db.posts.find((x) => x.id === postId);
          if (!p) throw new NotFound('post');
          p.shares += 1;
          return p;
        }),
      );
    },
    async listRatings(viewer, filter = {}) {
      await latency(60);
      const privileged = viewer.role === 'instructor' || viewer.role === 'admin';
      return copy(
        getDb().ratings.filter(
          (r) =>
            (privileged || r.authorId === viewer.id) &&
            (!filter.authorId || r.authorId === filter.authorId) &&
            (!filter.month || r.month === filter.month),
        ),
      );
    },
    async ratePost(evaluator, postId, stars, note) {
      if (evaluator.role !== 'instructor' && evaluator.role !== 'admin') throw new Error('forbidden');
      await latency();
      const rating = mutate((db) => {
        const post = db.posts.find((p) => p.id === postId);
        if (!post) throw new NotFound('post');
        const month = monthKey();
        // One rating per post per month; re-rating replaces it.
        const existing = db.ratings.find((r) => r.postId === postId && r.month === month);
        if (existing) {
          Object.assign(existing, { stars, note, evaluatorId: evaluator.id });
          return existing;
        }
        const r: Rating = { id: uid('r'), postId, authorId: post.authorId, evaluatorId: evaluator.id, stars, month, note };
        db.ratings.push(r);
        return r;
      });
      return copy(rating);
    },
    async listChallenges() {
      await latency(60);
      return copy([...getDb().challenges].sort((a, b) => a.endsAt.localeCompare(b.endsAt)));
    },
    async joinChallenge(challengeId, userId) {
      const ch = mutate((db) => {
        const c = db.challenges.find((x) => x.id === challengeId);
        if (!c) throw new NotFound('challenge');
        if (!c.participants.includes(userId)) c.participants.push(userId);
        return c;
      });
      settleChallenges(userId);
      return copy(getDb().challenges.find((c) => c.id === ch.id)!);
    },
    async createChallenge(draft, createdBy) {
      await latency();
      const [start, end] = periodBounds(draft.period);
      const challenge = {
        ...draft,
        id: uid('ch'),
        createdBy,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        participants: [],
        completedBy: [],
      };
      mutate((db) => db.challenges.push(challenge));
      return copy(challenge);
    },
    async challengeProgress(challengeId, userId) {
      const ch = getDb().challenges.find((c) => c.id === challengeId);
      if (!ch) throw new NotFound('challenge');
      return challengeProgress(ch, userId, scoringInput());
    },
    async contribution(userId) {
      await latency(60);
      return contribution(userId, scoringInput());
    },
    async ranking() {
      await latency();
      return ranking(getDb().users, scoringInput());
    },
  },

  training: {
    async listEquipment() {
      await latency(60);
      return copy(getDb().equipment);
    },
    async getEquipment(id) {
      return copy(getDb().equipment.find((e) => e.id === id));
    },
    async listProcedures(equipmentId) {
      return copy(getDb().procedures.filter((p) => p.equipmentId === equipmentId));
    },
    async listAlerts(equipmentId) {
      await latency(60);
      const order = { urgent: 0, preventive: 1 } as const;
      return copy(
        getDb()
          .alerts.filter((a) => a.equipmentId === equipmentId)
          .sort((a, b) => Number(a.resolved) - Number(b.resolved) || order[a.severity] - order[b.severity]),
      );
    },
    async resolveAlert(alertId, technicianId) {
      await latency();
      return copy(
        mutate((db) => {
          const a = db.alerts.find((x) => x.id === alertId);
          if (!a) throw new NotFound('alert');
          a.resolved = true;
          db.history.unshift({
            id: uid('h'),
            equipmentId: a.equipmentId,
            partId: a.partId,
            technicianId,
            date: new Date().toISOString(),
            severity: a.severity,
            description: a.description,
            parameters: a.parameters.slice(0, 3),
            firstTimeFix: true,
          });
          return a;
        }),
      );
    },
    async listHistory(equipmentId) {
      await latency(60);
      return copy(
        getDb()
          .history.filter((h) => h.equipmentId === equipmentId)
          .sort((a, b) => b.date.localeCompare(a.date)),
      );
    },
    async listTeamNotifications(equipmentId, filter = {}) {
      await latency(60);
      const list = getDb().teamNotifications.filter(
        (n) =>
          n.equipmentId === equipmentId &&
          (!filter.authorId || n.authorId === filter.authorId) &&
          (!filter.topic || n.topic === filter.topic),
      );
      const dir = filter.order === 'oldest' ? 1 : -1;
      return copy(list.sort((a, b) => dir * a.createdAt.localeCompare(b.createdAt)));
    },
    async addTeamNotification(input) {
      await latency();
      const n = { ...input, id: uid('n'), createdAt: new Date().toISOString() };
      mutate((db) => db.teamNotifications.unshift(n));
      return copy(n);
    },
    async saveSession(session) {
      mutate((db) => {
        const i = db.trainingSessions.findIndex((s) => s.id === session.id);
        if (i >= 0) db.trainingSessions[i] = session;
        else db.trainingSessions.push(session);
      });
      if (session.finishedAt) settleChallenges(session.userId);
      return copy(session);
    },
    async listSessions(userId) {
      return copy(getDb().trainingSessions.filter((s) => s.userId === userId));
    },
  },

  admin: {
    async getLicense() {
      await latency(60);
      const db = getDb();
      return copy({ license: db.companyLicense, tiers: db.licenseTiers });
    },
    async updateTierPrice(tierId, monthlyEur) {
      return copy(
        mutate((db) => {
          const t = db.licenseTiers.find((x) => x.id === tierId);
          if (!t) throw new NotFound('tier');
          t.monthlyEur = Math.max(0, Math.round(monthlyEur));
          return db.licenseTiers;
        }),
      );
    },
    async setEmployees(employees) {
      return copy(
        mutate((db) => {
          db.companyLicense.employees = Math.max(1, Math.round(employees));
          db.companyLicense.tierId = tierForEmployees(db.licenseTiers, db.companyLicense.employees).id;
          return db.companyLicense;
        }),
      );
    },
    async setUserRole(userId, role) {
      await latency();
      return copy(
        mutate((db) => {
          const u = db.users.find((x) => x.id === userId);
          if (!u) throw new NotFound('user');
          u.role = role;
          return u;
        }),
      );
    },
    async resetDemoData() {
      await resetDb();
    },
  },

  ai: {
    async recommendationsFor(userId, limit) {
      const db = getDb();
      const user = db.users.find((u) => u.id === userId);
      if (!user) return [];
      return getEngine().recommend(
        {
          user,
          courses: db.courses,
          progress: db.progress.filter((p) => p.userId === userId),
          alerts: db.alerts,
          history: db.history,
          posts: db.posts,
          equipment: db.equipment,
        },
        limit,
      );
    },
    async challengeSuggestions() {
      const db = getDb();
      return getEngine().generateChallenges({
        courses: db.courses,
        alerts: db.alerts,
        history: db.history,
        posts: db.posts,
        equipment: db.equipment,
        existing: db.challenges,
      });
    },
  },
};
