import type { Challenge, Course } from '@/types/domain';
import { reactionCount, type ScoringInput } from './scoring';

export interface ChallengeProgress {
  current: number;
  target: number;
  percent: number;
  done: boolean;
}

/** Measures a user's progress towards a challenge goal within its period. */
export function challengeProgress(
  challenge: Challenge,
  userId: string,
  data: ScoringInput & { courses: Course[] },
): ChallengeProgress {
  const inPeriod = (iso: string) => iso >= challenge.startsAt && iso <= challenge.endsAt;
  const { goal } = challenge;
  let current = 0;

  switch (goal.type) {
    case 'publish':
      current = data.posts.filter(
        (p) => p.authorId === userId && inPeriod(p.createdAt) && (!goal.tag || p.tags.includes(goal.tag)),
      ).length;
      break;
    case 'reactions':
      current = data.posts
        .filter((p) => p.authorId === userId && inPeriod(p.createdAt))
        .reduce((acc, p) => acc + reactionCount(p), 0);
      break;
    case 'complete_steps': {
      const tagged = new Set(
        data.courses.flatMap((c) =>
          c.sections.flatMap((s) => s.steps.filter((st) => !goal.tag || st.tags.includes(goal.tag)).map((st) => st.id)),
        ),
      );
      current = data.progress
        .filter((p) => p.userId === userId && inPeriod(p.updatedAt))
        .reduce((acc, p) => acc + p.completedStepIds.filter((id) => tagged.has(id)).length, 0);
      break;
    }
    case 'training':
      current = data.trainingSessions.filter(
        (s) => s.userId === userId && s.finishedAt && inPeriod(s.finishedAt),
      ).length;
      break;
  }

  const target = Math.max(1, goal.target);
  const done = challenge.completedBy.includes(userId) || current >= target;
  return { current: Math.min(current, target), target, percent: done ? 100 : Math.round((current / target) * 100), done };
}
