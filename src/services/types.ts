import type {
  Alert,
  Challenge,
  CompanyLicense,
  Course,
  CourseProgress,
  CourseStep,
  Equipment,
  HistoryEntry,
  LicenseTier,
  Media,
  Post,
  Procedure,
  ReactionKind,
  Rating,
  Role,
  TeamNotification,
  TrainingSession,
  User,
} from '@/types/domain';
import type { ChallengeDraft, Recommendation } from '@/modules/ai';
import type { Contribution, RankingRow } from '@/modules/social/scoring';
import type { ChallengeProgress } from '@/modules/social/challenges';

/**
 * Service contracts used by the screens. The prototype implements them with
 * local mock data (src/services/mock). A Supabase / REST implementation only
 * needs to satisfy these interfaces (see supabase/schema.sql).
 */

export interface AuthService {
  signIn(username: string, password: string): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
}

export interface CourseFilter {
  level?: Course['level'];
  area?: Course['area'];
  query?: string;
}

export interface UniversityService {
  listCourses(filter?: CourseFilter): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  listProgress(userId: string): Promise<CourseProgress[]>;
  setStepOutcome(userId: string, courseId: string, stepId: string, outcome: 'completed' | 'failed'): Promise<CourseProgress>;
  /** Moodle / corporate lesson authored by an instructor. */
  addLesson(courseId: string, sectionId: string, lesson: Omit<CourseStep, 'id'>): Promise<CourseStep>;
}

export interface PostFilter {
  courseId?: string;
  sectionId?: string;
  authorId?: string;
  query?: string;
}

export interface NewPost {
  authorId: string;
  title: string;
  body: string;
  media: Media;
  tags: string[];
  courseId?: string;
  sectionId?: string;
  challengeId?: string;
}

export interface SocialService {
  listPosts(filter?: PostFilter): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(input: NewPost): Promise<Post>;
  toggleReaction(postId: string, userId: string, kind: ReactionKind): Promise<Post>;
  addComment(postId: string, userId: string, text: string): Promise<Post>;
  share(postId: string): Promise<Post>;
  /** Ratings are private: only the author, evaluators and admins may read them. */
  listRatings(viewer: User, filter?: { authorId?: string; month?: string }): Promise<Rating[]>;
  ratePost(evaluator: User, postId: string, stars: Rating['stars'], note?: string): Promise<Rating>;
  listChallenges(): Promise<Challenge[]>;
  joinChallenge(challengeId: string, userId: string): Promise<Challenge>;
  createChallenge(draft: ChallengeDraft, createdBy: Challenge['createdBy']): Promise<Challenge>;
  challengeProgress(challengeId: string, userId: string): Promise<ChallengeProgress>;
  contribution(userId: string): Promise<Contribution>;
  ranking(): Promise<RankingRow[]>;
}

export interface NotificationFilter {
  authorId?: string;
  topic?: TeamNotification['topic'];
  order?: 'newest' | 'oldest';
}

export interface TrainingService {
  listEquipment(): Promise<Equipment[]>;
  getEquipment(id: string): Promise<Equipment | undefined>;
  listProcedures(equipmentId: string): Promise<Procedure[]>;
  listAlerts(equipmentId: string): Promise<Alert[]>;
  resolveAlert(alertId: string, technicianId: string): Promise<Alert>;
  listHistory(equipmentId: string): Promise<HistoryEntry[]>;
  listTeamNotifications(equipmentId: string, filter?: NotificationFilter): Promise<TeamNotification[]>;
  addTeamNotification(input: Omit<TeamNotification, 'id' | 'createdAt'>): Promise<TeamNotification>;
  saveSession(session: TrainingSession): Promise<TrainingSession>;
  listSessions(userId: string): Promise<TrainingSession[]>;
}

export interface AdminService {
  getLicense(): Promise<{ license: CompanyLicense; tiers: LicenseTier[] }>;
  updateTierPrice(tierId: LicenseTier['id'], monthlyEur: number): Promise<LicenseTier[]>;
  setEmployees(employees: number): Promise<CompanyLicense>;
  setUserRole(userId: string, role: Role): Promise<User>;
  resetDemoData(): Promise<void>;
}

export interface AIService {
  recommendationsFor(userId: string, limit?: number): Promise<Recommendation[]>;
  challengeSuggestions(): Promise<ChallengeDraft[]>;
}

export interface Services {
  auth: AuthService;
  university: UniversityService;
  social: SocialService;
  training: TrainingService;
  admin: AdminService;
  ai: AIService;
}
