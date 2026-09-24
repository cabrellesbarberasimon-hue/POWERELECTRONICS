import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type CourseFilter, type NewPost, type NotificationFilter, type PostFilter } from '@/services';
import { useUser } from '@/stores/session';
import type { ChallengeDraft } from '@/modules/ai';
import type { Challenge, Rating, ReactionKind, Role, TeamNotification, TrainingSession, CourseStep, LicenseTier } from '@/types/domain';

/** Query keys grouped by domain, so mutations can invalidate whole areas. */
export const keys = {
  users: ['users'] as const,
  courses: (f?: CourseFilter) => ['university', 'courses', f ?? {}] as const,
  course: (id: string) => ['university', 'course', id] as const,
  progress: (userId: string) => ['university', 'progress', userId] as const,
  posts: (f?: PostFilter) => ['social', 'posts', f ?? {}] as const,
  post: (id: string) => ['social', 'post', id] as const,
  ratings: (userId: string, f?: object) => ['social', 'ratings', userId, f ?? {}] as const,
  challenges: ['social', 'challenges'] as const,
  challengeProgress: (id: string, userId: string) => ['social', 'challengeProgress', id, userId] as const,
  contribution: (userId: string) => ['social', 'contribution', userId] as const,
  ranking: ['social', 'ranking'] as const,
  equipment: ['training', 'equipment'] as const,
  equipmentOne: (id: string) => ['training', 'equipment', id] as const,
  procedures: (id: string) => ['training', 'procedures', id] as const,
  alerts: (id: string) => ['training', 'alerts', id] as const,
  history: (id: string) => ['training', 'history', id] as const,
  notifications: (id: string, f?: NotificationFilter) => ['training', 'notifications', id, f ?? {}] as const,
  sessions: (userId: string) => ['training', 'sessions', userId] as const,
  license: ['admin', 'license'] as const,
  recommendations: (userId: string) => ['ai', 'recommendations', userId] as const,
  suggestions: ['ai', 'suggestions'] as const,
};

// ------------------------------------------------------------------ queries
export const useUsers = () => useQuery({ queryKey: keys.users, queryFn: () => api.auth.listUsers() });
export const useCourses = (f?: CourseFilter) => useQuery({ queryKey: keys.courses(f), queryFn: () => api.university.listCourses(f) });
export const useCourse = (id: string) => useQuery({ queryKey: keys.course(id), queryFn: () => api.university.getCourse(id) });
export const useProgress = (userId: string) =>
  useQuery({ queryKey: keys.progress(userId), queryFn: () => api.university.listProgress(userId) });
export const usePosts = (f?: PostFilter) => useQuery({ queryKey: keys.posts(f), queryFn: () => api.social.listPosts(f) });
export const usePost = (id: string) => useQuery({ queryKey: keys.post(id), queryFn: () => api.social.getPost(id) });
export const useChallenges = () => useQuery({ queryKey: keys.challenges, queryFn: () => api.social.listChallenges() });
export const useChallengeProgress = (id: string, userId: string) =>
  useQuery({ queryKey: keys.challengeProgress(id, userId), queryFn: () => api.social.challengeProgress(id, userId) });
export const useContribution = (userId: string) =>
  useQuery({ queryKey: keys.contribution(userId), queryFn: () => api.social.contribution(userId) });
export const useRanking = () => useQuery({ queryKey: keys.ranking, queryFn: () => api.social.ranking() });
export const useEquipmentList = () => useQuery({ queryKey: keys.equipment, queryFn: () => api.training.listEquipment() });
export const useEquipment = (id: string) => useQuery({ queryKey: keys.equipmentOne(id), queryFn: () => api.training.getEquipment(id) });
export const useProcedures = (id: string) => useQuery({ queryKey: keys.procedures(id), queryFn: () => api.training.listProcedures(id) });
export const useAlerts = (id: string) => useQuery({ queryKey: keys.alerts(id), queryFn: () => api.training.listAlerts(id) });
export const useHistory = (id: string) => useQuery({ queryKey: keys.history(id), queryFn: () => api.training.listHistory(id) });
export const useTeamNotifications = (id: string, f?: NotificationFilter) =>
  useQuery({ queryKey: keys.notifications(id, f), queryFn: () => api.training.listTeamNotifications(id, f) });
export const useSessions = (userId: string) =>
  useQuery({ queryKey: keys.sessions(userId), queryFn: () => api.training.listSessions(userId) });
export const useLicense = () => useQuery({ queryKey: keys.license, queryFn: () => api.admin.getLicense() });
export const useRecommendations = (userId: string) =>
  useQuery({ queryKey: keys.recommendations(userId), queryFn: () => api.ai.recommendationsFor(userId, 6) });
export const useChallengeSuggestions = () => useQuery({ queryKey: keys.suggestions, queryFn: () => api.ai.challengeSuggestions() });

export function useRatings(filter?: { authorId?: string; month?: string }) {
  const user = useUser();
  return useQuery({ queryKey: keys.ratings(user.id, filter), queryFn: () => api.social.listRatings(user, filter) });
}

// ---------------------------------------------------------------- mutations
/** Invalidate the given roots plus AI (recommendations depend on everything). */
function useInvalidate() {
  const qc = useQueryClient();
  return (...roots: string[]) => Promise.all([...roots, 'ai'].map((r) => qc.invalidateQueries({ queryKey: [r] })));
}

export function useStepOutcome() {
  const user = useUser();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { courseId: string; stepId: string; outcome: 'completed' | 'failed' }) =>
      api.university.setStepOutcome(user.id, v.courseId, v.stepId, v.outcome),
    onSuccess: () => invalidate('university', 'social'),
  });
}

export function useAddLesson() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { courseId: string; sectionId: string; lesson: Omit<CourseStep, 'id'> }) =>
      api.university.addLesson(v.courseId, v.sectionId, v.lesson),
    onSuccess: () => invalidate('university'),
  });
}

export function useCreatePost() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (p: NewPost) => api.social.createPost(p), onSuccess: () => invalidate('social') });
}

export function useToggleReaction() {
  const user = useUser();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { postId: string; kind: ReactionKind }) => api.social.toggleReaction(v.postId, user.id, v.kind),
    onSuccess: () => invalidate('social'),
  });
}

export function useAddComment() {
  const user = useUser();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { postId: string; text: string }) => api.social.addComment(v.postId, user.id, v.text),
    onSuccess: () => invalidate('social'),
  });
}

export function useShare() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (postId: string) => api.social.share(postId), onSuccess: () => invalidate('social') });
}

export function useRatePost() {
  const user = useUser();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { postId: string; stars: Rating['stars']; note?: string }) => api.social.ratePost(user, v.postId, v.stars, v.note),
    onSuccess: () => invalidate('social'),
  });
}

export function useJoinChallenge() {
  const user = useUser();
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => api.social.joinChallenge(id, user.id), onSuccess: () => invalidate('social') });
}

export function useCreateChallenge() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { draft: ChallengeDraft; createdBy: Challenge['createdBy'] }) => api.social.createChallenge(v.draft, v.createdBy),
    onSuccess: () => invalidate('social'),
  });
}

export function useResolveAlert() {
  const user = useUser();
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => api.training.resolveAlert(id, user.id), onSuccess: () => invalidate('training') });
}

export function useAddTeamNotification() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (n: Omit<TeamNotification, 'id' | 'createdAt'>) => api.training.addTeamNotification(n),
    onSuccess: () => invalidate('training'),
  });
}

export function useSaveSession() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (s: TrainingSession) => api.training.saveSession(s),
    onSuccess: () => invalidate('training', 'social'),
  });
}

export function useSetUserRole() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { userId: string; role: Role }) => api.admin.setUserRole(v.userId, v.role),
    onSuccess: () => invalidate('users', 'social'),
  });
}

export function useUpdateTierPrice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { tierId: LicenseTier['id']; monthlyEur: number }) => api.admin.updateTierPrice(v.tierId, v.monthlyEur),
    onSuccess: () => invalidate('admin'),
  });
}

export function useSetEmployees() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (n: number) => api.admin.setEmployees(n), onSuccess: () => invalidate('admin') });
}
