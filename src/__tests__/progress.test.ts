import { courses } from '@/data/courses';
import { gradeQuiz, levelPercent, markStep, nextStep, progressPercent, sectionPercent, stepCount } from '@/modules/university/progress';
import type { CourseProgress } from '@/types/domain';

const hem = courses.find((c) => c.id === 'c-hem')!;
const empty: CourseProgress = { userId: 'u', courseId: 'c-hem', completedStepIds: [], failedStepIds: [], updatedAt: '' };

describe('course progress', () => {
  it('is 0% without progress and 100% when every step is done', () => {
    expect(progressPercent(hem)).toBe(0);
    const all = hem.sections.flatMap((s) => s.steps.map((st) => st.id));
    expect(progressPercent(hem, { ...empty, completedStepIds: all })).toBe(100);
  });

  it('ignores ids that do not belong to the course', () => {
    const p = { ...empty, completedStepIds: ['hem-hw-1', 'loto-1'] };
    expect(progressPercent(hem, p)).toBe(Math.round((1 / stepCount(hem)) * 100));
  });

  it('computes section progress and the next step', () => {
    const p = markStep(empty, 'hem-hw-1', 'completed');
    expect(sectionPercent(hem, 's-hw', p)).toBe(25);
    expect(nextStep(hem, p)?.id).toBe('hem-hw-2');
  });

  it('keeps completed and failed sets without duplicates', () => {
    let p = markStep(empty, 'hem-hw-4', 'failed');
    p = markStep(p, 'hem-hw-4', 'failed');
    p = markStep(p, 'hem-hw-4', 'completed');
    expect(p.failedStepIds).toEqual(['hem-hw-4']);
    expect(p.completedStepIds).toEqual(['hem-hw-4']);
  });

  it('aggregates level progress', () => {
    expect(levelPercent(courses, 'basic', [])).toBe(0);
    expect(levelPercent(courses, 'advanced', [{ ...empty, courseId: 'c-grid', completedStepIds: ['grid-1', 'grid-2'] }])).toBeGreaterThan(
      0,
    );
  });

  it('grades quizzes with a 70% pass mark', () => {
    expect(gradeQuiz([0, 1, 1], [0, 1, 1])).toEqual({ score: 1, passed: true });
    expect(gradeQuiz([0, 0, 0], [0, 1, 1]).passed).toBe(false);
    expect(gradeQuiz([], []).passed).toBe(true);
  });
});
