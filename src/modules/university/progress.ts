import type { Course, CourseProgress, CourseStep, Level } from '@/types/domain';

export const allSteps = (course: Course): CourseStep[] => course.sections.flatMap((s) => s.steps);

export const stepCount = (course: Course) => allSteps(course).length;

/** Integer percentage (0–100) of completed steps. */
export function progressPercent(course: Course, progress?: CourseProgress): number {
  const total = stepCount(course);
  if (!total || !progress) return 0;
  const ids = new Set(allSteps(course).map((s) => s.id));
  const done = progress.completedStepIds.filter((id) => ids.has(id)).length;
  return Math.round((done / total) * 100);
}

export function sectionPercent(course: Course, sectionId: string, progress?: CourseProgress): number {
  const section = course.sections.find((s) => s.id === sectionId);
  if (!section || !section.steps.length || !progress) return 0;
  const done = section.steps.filter((s) => progress.completedStepIds.includes(s.id)).length;
  return Math.round((done / section.steps.length) * 100);
}

/** First step not yet completed, or undefined if the course is finished. */
export function nextStep(course: Course, progress?: CourseProgress): CourseStep | undefined {
  const done = new Set(progress?.completedStepIds ?? []);
  return allSteps(course).find((s) => !done.has(s.id));
}

export function findStep(course: Course, stepId: string) {
  for (const section of course.sections) {
    const step = section.steps.find((s) => s.id === stepId);
    if (step) return { section, step };
  }
  return undefined;
}

/** Aggregated completion of all courses of a level. */
export function levelPercent(courses: Course[], level: Level, progress: CourseProgress[]): number {
  const levelCourses = courses.filter((c) => c.level === level);
  const total = levelCourses.reduce((acc, c) => acc + stepCount(c), 0);
  if (!total) return 0;
  const done = levelCourses.reduce((acc, c) => {
    const p = progress.find((x) => x.courseId === c.id);
    const ids = new Set(allSteps(c).map((s) => s.id));
    return acc + (p?.completedStepIds.filter((id) => ids.has(id)).length ?? 0);
  }, 0);
  return Math.round((done / total) * 100);
}

/** Advanced level unlocks once the basic level reaches this completion. */
export const ADVANCED_UNLOCK_PERCENT = 60;

/** Grade a quiz. Returns score 0..1 and whether it passes (>= 0.7). */
export function gradeQuiz(answers: number[], correct: number[]) {
  if (!correct.length) return { score: 1, passed: true };
  const hits = correct.filter((a, i) => answers[i] === a).length;
  const score = hits / correct.length;
  return { score, passed: score >= 0.7 };
}

/** Pure update helpers used by the mock service (and reusable server side). */
export function markStep(
  progress: CourseProgress,
  stepId: string,
  outcome: 'completed' | 'failed',
  now = new Date().toISOString(),
): CourseProgress {
  const completed = new Set(progress.completedStepIds);
  const failed = new Set(progress.failedStepIds);
  if (outcome === 'completed') {
    completed.add(stepId);
  } else {
    failed.add(stepId);
  }
  return { ...progress, completedStepIds: [...completed], failedStepIds: [...failed], updatedAt: now };
}
