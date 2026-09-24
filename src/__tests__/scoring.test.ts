import { createSeed } from '@/data/seed';
import { contribution, ranking, WEIGHTS } from '@/modules/social/scoring';
import { challengeProgress } from '@/modules/social/challenges';
import type { Post } from '@/types/domain';

const base = () => {
  const db = createSeed();
  return { ...db, posts: [] as Post[], ratings: [], challenges: [], progress: [], trainingSessions: [] };
};

const post = (id: string, authorId: string, like: string[] = [], idea: string[] = []): Post => ({
  id, authorId, createdAt: new Date().toISOString(), title: 't', body: 'b', media: { kind: 'text', tint: '#fff' }, tags: ['lever'],
  reactions: { like, wow: [], idea }, comments: [], shares: 0,
});

describe('contribution scoring', () => {
  it('weights posts, reactions (idea x2) and stars and ignores self-reactions', () => {
    const data = base();
    data.posts = [post('p1', 'a', ['b', 'c', 'a'], ['b'])];
    data.ratings = [{ id: 'r', postId: 'p1', authorId: 'a', evaluatorId: 'e', stars: 4, month: '2026-09' }] as never;
    const c = contribution('a', data);
    expect(c.reactionsReceived).toEqual({ like: 2, wow: 0, idea: 1 });
    expect(c.points).toBe(WEIGHTS.post + 2 * WEIGHTS.reaction.like + WEIGHTS.reaction.idea + 4 * WEIGHTS.star);
    expect(c.starsAverage).toBe(4);
  });

  it('ranks users by points', () => {
    const data = base();
    data.posts = [post('p1', 'u-tech', ['x']), post('p2', 'u-tech'), post('p3', 'u-trainee')];
    const rows = ranking(createSeed().users, data);
    expect(rows[0].userId).toBe('u-tech');
    expect(rows[0].position).toBe(1);
    expect(rows.find((r) => r.userId === 'u-trainee')!.position).toBe(2);
  });

  it('measures challenge progress within the period', () => {
    const data = base();
    const now = Date.now();
    const challenge = {
      id: 'c', period: 'monthly' as const, title: { en: '', es: '' }, description: { en: '', es: '' }, points: 50,
      startsAt: new Date(now - 86400000).toISOString(), endsAt: new Date(now + 86400000).toISOString(),
      goal: { type: 'publish' as const, target: 2 }, createdBy: 'admin' as const, participants: ['a'], completedBy: [],
    };
    data.posts = [post('p1', 'a')];
    expect(challengeProgress(challenge, 'a', data)).toMatchObject({ current: 1, target: 2, percent: 50, done: false });
    data.posts.push(post('p2', 'a'));
    expect(challengeProgress(challenge, 'a', data).done).toBe(true);
  });
});
