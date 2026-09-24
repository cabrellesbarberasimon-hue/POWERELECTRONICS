import type {
  Alert,
  Challenge,
  Course,
  CourseProgress,
  Equipment,
  HistoryEntry,
  Localized,
  Post,
  User,
} from '@/types/domain';

/** Everything the engine may look at for one learner. */
export interface LearnerContext {
  user: User;
  courses: Course[];
  /** Progress of this user only. */
  progress: CourseProgress[];
  alerts: Alert[];
  history: HistoryEntry[];
  posts: Post[];
  equipment: Equipment[];
}

/** Team-wide data used to generate new challenges. */
export interface TeamContext {
  courses: Course[];
  alerts: Alert[];
  history: HistoryEntry[];
  posts: Post[];
  equipment: Equipment[];
  existing: Challenge[];
}

interface BaseRecommendation {
  id: string;
  score: number;
  /** Human readable explanations, most important first. */
  reasons: Localized[];
}

export type Recommendation =
  | (BaseRecommendation & { kind: 'step'; courseId: string; stepId: string })
  | (BaseRecommendation & { kind: 'post'; postId: string })
  | (BaseRecommendation & { kind: 'training'; equipmentId: string; partId: string });

export type ChallengeDraft = Pick<Challenge, 'period' | 'title' | 'description' | 'points' | 'goal'>;

/**
 * Pluggable recommendation engine. The prototype ships a rule-based
 * implementation; a model-based or LLM-backed engine can implement the same
 * interface (both methods are async for that reason).
 */
export interface RecommendationEngine {
  readonly name: string;
  recommend(ctx: LearnerContext, limit?: number): Promise<Recommendation[]>;
  generateChallenges(ctx: TeamContext): Promise<ChallengeDraft[]>;
}
