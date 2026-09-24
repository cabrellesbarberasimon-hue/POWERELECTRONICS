/** Domain model shared by services, stores, the AI engine and the UI. */

export type Locale = 'en' | 'es';
/** Seed content is bilingual; user generated content may be a plain string. */
export type Localized = { en: string; es: string };
export type Text = string | Localized;

export type Role = 'employee' | 'sat' | 'instructor' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  department: 'SAT' | 'Training' | 'Engineering' | 'Production' | 'HR';
  country: string; // English country name
  countryCode: string; // ISO 3166-1 alpha-2
  avatarColor: string;
  online: boolean;
  joinedAt: string; // ISO date
}

// ---------------------------------------------------------------------------
// Corporate University
// ---------------------------------------------------------------------------

export type Level = 'basic' | 'advanced';
export type Area = 'solar' | 'drives' | 'power' | 'safety';
export type ContentType = 'text' | '3d' | 'video' | 'document' | 'test';

export interface QuizQuestion {
  question: Localized;
  options: Localized[];
  answer: number;
}

export interface CourseStep {
  id: string;
  title: Localized;
  type: ContentType;
  durationMin: number;
  body: Localized;
  tags: string[];
  /** Equipment part practised in Training Experience for this step. */
  partId?: string;
  quiz?: QuizQuestion[];
}

export interface CourseSection {
  id: string;
  title: Localized;
  steps: CourseStep[];
}

export interface Course {
  id: string;
  code: string;
  area: Area;
  level: Level;
  title: Localized;
  description: Localized;
  /** Breadcrumb, e.g. ['COURSES', 'SOLAR', 'HEM'] */
  path: string[];
  equipmentId?: string;
  tags: string[];
  sections: CourseSection[];
  source: 'corporate' | 'moodle';
}

export interface CourseProgress {
  userId: string;
  courseId: string;
  completedStepIds: string[];
  /** Steps with failed tests or reported difficulty. Feeds the AI engine. */
  failedStepIds: string[];
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Social / community content
// ---------------------------------------------------------------------------

export type ReactionKind = 'like' | 'wow' | 'idea';
export type MediaKind = 'video' | 'image' | 'audio' | 'text' | '3d';

export interface Media {
  kind: MediaKind;
  /** Background tint used by the placeholder renderer. */
  tint: string;
  durationSec?: number;
  /** Predefined animated avatar id overlaid on the media. */
  avatarId?: string;
  /** Local uri of a captured photo, when available. */
  uri?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  text: Text;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  createdAt: string;
  title: Text;
  body: Text;
  media: Media;
  tags: string[];
  /** When set, the post also appears in the course Community tab. */
  courseId?: string;
  sectionId?: string;
  challengeId?: string;
  reactions: Record<ReactionKind, string[]>;
  comments: Comment[];
  shares: number;
}

export interface Rating {
  id: string;
  postId: string;
  authorId: string;
  evaluatorId: string;
  stars: 1 | 2 | 3 | 4 | 5;
  /** Month rated, YYYY-MM. Ratings are private. */
  month: string;
  note?: string;
}

export type ChallengePeriod = 'monthly' | 'quarterly' | 'annual';
export type ChallengeGoal =
  | { type: 'publish'; target: number; tag?: string }
  | { type: 'complete_steps'; target: number; tag?: string }
  | { type: 'training'; target: number; partId?: string }
  | { type: 'reactions'; target: number };

export interface Challenge {
  id: string;
  period: ChallengePeriod;
  title: Localized;
  description: Localized;
  points: number;
  startsAt: string;
  endsAt: string;
  goal: ChallengeGoal;
  createdBy: 'admin' | 'ai';
  participants: string[];
  completedBy: string[];
}

// ---------------------------------------------------------------------------
// Training Experience 4.0
// ---------------------------------------------------------------------------

export interface Parameter {
  value: string;
  label: string; // POWER, MV, IP, TEMP...
}

export interface EquipmentPart {
  id: string;
  name: Localized;
  /** Hotspot position relative to the cabinet illustration (0..1). */
  x: number;
  y: number;
  dot: 'red' | 'blue' | 'orange' | 'green';
  parameters: Parameter[];
  tags: string[];
}

export interface ProcedureStep {
  id: string;
  partId: string;
  instruction: Localized;
}

export interface Procedure {
  id: string;
  equipmentId: string;
  title: Localized;
  steps: ProcedureStep[];
}

export interface Equipment {
  id: string;
  name: string; // Freesun HEMK
  family: string; // Freesun HEM
  kind: 'solar-inverter' | 'drive';
  description: Localized;
  site: string;
  parts: EquipmentPart[];
}

export type Severity = 'urgent' | 'preventive' | 'info';

export interface Alert {
  id: string;
  equipmentId: string;
  partId: string;
  severity: Exclude<Severity, 'info'>;
  title: Localized;
  trigger: Localized;
  description: Localized;
  parameters: Parameter[];
  createdAt: string;
  resolved: boolean;
}

export interface HistoryEntry {
  id: string;
  equipmentId: string;
  partId: string;
  technicianId: string;
  date: string;
  severity: Severity;
  description: Localized;
  parameters: Parameter[];
  /** Whether the intervention fixed the issue on the first attempt. */
  firstTimeFix: boolean;
}

export interface TeamNotification {
  id: string;
  equipmentId: string;
  authorId: string;
  kind: 'note' | 'voice' | 'video';
  topic: 'technical' | 'maintenance' | 'safety';
  text: Text;
  createdAt: string;
  durationSec?: number;
}

export interface TrainingSession {
  id: string;
  userId: string;
  equipmentId: string;
  procedureId?: string;
  mode: 'step' | 'free';
  completedStepIds: string[];
  inspectedPartIds: string[];
  startedAt: string;
  finishedAt?: string;
}

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------

export interface LicenseTier {
  id: 'small' | 'medium' | 'large';
  minEmployees: number;
  maxEmployees: number | null;
  monthlyEur: number;
}

export interface CompanyLicense {
  company: string;
  employees: number;
  tierId: LicenseTier['id'];
  since: string;
  renewsAt: string;
}
