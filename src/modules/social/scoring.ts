import type { Challenge, CourseProgress, Post, ReactionKind, Rating, TrainingSession, User } from '@/types/domain';

/**
 * Employee contribution accounting ("contabilización del aporte del empleado").
 * Weights are deliberately simple and centralised so HR can tune them.
 */
export const WEIGHTS = {
  post: 10,
  reaction: { like: 1, wow: 1, idea: 2 } as Record<ReactionKind, number>,
  comment: 1,
  star: 5,
  step: 2,
  training: 15,
} as const;

export interface ScoringInput {
  posts: Post[];
  ratings: Rating[];
  challenges: Challenge[];
  progress: CourseProgress[];
  trainingSessions: TrainingSession[];
}

export interface Contribution {
  userId: string;
  points: number;
  posts: number;
  reactionsReceived: Record<ReactionKind, number>;
  commentsWritten: number;
  starsReceived: number;
  ratingsCount: number;
  starsAverage: number;
  challengesCompleted: number;
  stepsCompleted: number;
  trainingsCompleted: number;
}

export function reactionCount(post: Post) {
  return post.reactions.like.length + post.reactions.wow.length + post.reactions.idea.length;
}

export function contribution(userId: string, data: ScoringInput): Contribution {
  const own = data.posts.filter((p) => p.authorId === userId);
  const reactionsReceived: Record<ReactionKind, number> = { like: 0, wow: 0, idea: 0 };
  for (const p of own) {
    // Self-reactions do not count.
    (Object.keys(reactionsReceived) as ReactionKind[]).forEach((k) => {
      reactionsReceived[k] += p.reactions[k].filter((u) => u !== userId).length;
    });
  }
  const commentsWritten = data.posts.reduce(
    (acc, p) => acc + p.comments.filter((c) => c.authorId === userId && p.authorId !== userId).length,
    0,
  );
  const myRatings = data.ratings.filter((r) => r.authorId === userId);
  const starsReceived = myRatings.reduce((acc, r) => acc + r.stars, 0);
  const completed = data.challenges.filter((c) => c.completedBy.includes(userId));
  const stepsCompleted = data.progress
    .filter((p) => p.userId === userId)
    .reduce((acc, p) => acc + p.completedStepIds.length, 0);
  const trainingsCompleted = data.trainingSessions.filter((s) => s.userId === userId && s.finishedAt).length;

  const points =
    own.length * WEIGHTS.post +
    (Object.keys(reactionsReceived) as ReactionKind[]).reduce((acc, k) => acc + reactionsReceived[k] * WEIGHTS.reaction[k], 0) +
    commentsWritten * WEIGHTS.comment +
    starsReceived * WEIGHTS.star +
    completed.reduce((acc, c) => acc + c.points, 0) +
    stepsCompleted * WEIGHTS.step +
    trainingsCompleted * WEIGHTS.training;

  return {
    userId,
    points,
    posts: own.length,
    reactionsReceived,
    commentsWritten,
    starsReceived,
    ratingsCount: myRatings.length,
    starsAverage: myRatings.length ? Math.round((starsReceived / myRatings.length) * 10) / 10 : 0,
    challengesCompleted: completed.length,
    stepsCompleted,
    trainingsCompleted,
  };
}

export interface RankingRow extends Contribution {
  position: number;
}

/** Ranking of all users by points (ties broken by stars, then name order). */
export function ranking(users: User[], data: ScoringInput): RankingRow[] {
  return users
    .map((u) => contribution(u.id, data))
    .sort((a, b) => b.points - a.points || b.starsReceived - a.starsReceived || a.userId.localeCompare(b.userId))
    .map((c, i) => ({ ...c, position: i + 1 }));
}
