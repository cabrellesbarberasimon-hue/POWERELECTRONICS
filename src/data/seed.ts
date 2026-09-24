import type {
  Alert,
  Challenge,
  CompanyLicense,
  Course,
  CourseProgress,
  Equipment,
  HistoryEntry,
  LicenseTier,
  Post,
  Procedure,
  Rating,
  TeamNotification,
  TrainingSession,
  User,
} from '@/types/domain';
import { companyLicense, licenseTiers, progress } from './admin';
import { courses } from './courses';
import { alerts, equipment, history, procedures, teamNotifications } from './equipment';
import { challenges, posts, ratings } from './social';
import { users } from './users';

/** Shape of the whole mock database. Mirrors the Supabase schema in supabase/schema.sql. */
export interface Database {
  version: number;
  users: User[];
  courses: Course[];
  progress: CourseProgress[];
  posts: Post[];
  ratings: Rating[];
  challenges: Challenge[];
  equipment: Equipment[];
  procedures: Procedure[];
  alerts: Alert[];
  history: HistoryEntry[];
  teamNotifications: TeamNotification[];
  trainingSessions: TrainingSession[];
  licenseTiers: LicenseTier[];
  companyLicense: CompanyLicense;
}

export const DB_VERSION = 1;

/** Returns a fresh deep copy of the seed data. */
export function createSeed(): Database {
  // JSON clone: Hermes does not guarantee structuredClone.
  return JSON.parse(
    JSON.stringify({
      version: DB_VERSION,
      users,
      courses,
      progress,
      posts,
      ratings,
      challenges,
      equipment,
      procedures,
      alerts,
      history,
      teamNotifications,
      trainingSessions: [],
      licenseTiers,
      companyLicense,
    }),
  ) as Database;
}
