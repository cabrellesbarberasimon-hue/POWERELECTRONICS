import { createSeed } from '@/data/seed';
import { RuleBasedEngine, REASONS, fieldSignals } from '@/modules/ai';
import type { LearnerContext } from '@/modules/ai';

const ctxFor = (userId: string, patch: Partial<LearnerContext> = {}): LearnerContext => {
  const db = createSeed();
  return {
    user: db.users.find((u) => u.id === userId)!,
    courses: db.courses,
    progress: db.progress.filter((p) => p.userId === userId),
    alerts: db.alerts,
    history: db.history,
    posts: db.posts,
    equipment: db.equipment,
    ...patch,
  };
};

describe('rule-based recommendation engine', () => {
  const engine = new RuleBasedEngine();

  it('heats up parts with urgent alerts and repeated failures', () => {
    const db = createSeed();
    const { partHeat } = fieldSignals(db);
    expect(partHeat.get('p-lever')!).toBeGreaterThan(partHeat.get('p-aux') ?? 0);
  });

  it('puts failed lessons first with an explanation', async () => {
    const recs = await engine.recommend(ctxFor('u-trainee'));
    expect(recs.length).toBeGreaterThan(0);
    const failed = recs.find((r) => r.kind === 'step' && r.stepId === 'hem-hw-4');
    expect(failed).toBeDefined();
    expect(failed!.reasons).toContainEqual(REASONS.failed);
    expect(recs[0].score).toBeGreaterThanOrEqual(recs[recs.length - 1].score);
  });

  it('never recommends completed, non-failed lessons', async () => {
    const recs = await engine.recommend(ctxFor('u-trainee'), 50);
    const ids = recs.filter((r) => r.kind === 'step').map((r) => (r.kind === 'step' ? r.stepId : ''));
    expect(ids).not.toContain('hem-hw-1');
  });

  it('suggests AR training on hot parts', async () => {
    const recs = await engine.recommend(ctxFor('u-tech'), 50);
    expect(recs.some((r) => r.kind === 'training' && r.partId === 'p-lever')).toBe(true);
  });

  it('returns no field-driven recommendations when there are no alerts or history', async () => {
    const recs = await engine.recommend(ctxFor('u-admin', { alerts: [], history: [], progress: [] }), 50);
    expect(recs.filter((r) => r.kind === 'training')).toHaveLength(0);
  });

  it('generates challenges from technical history without duplicating existing ones', async () => {
    const db = createSeed();
    const drafts = await engine.generateChallenges({ ...db, existing: [] });
    expect(drafts.length).toBeGreaterThan(0);
    expect(drafts[0].goal.type).toBe('training');
    const again = await engine.generateChallenges({
      ...db,
      existing: drafts.map((d, i) => ({ ...d, id: `x${i}`, createdBy: 'ai', startsAt: '', endsAt: '', participants: [], completedBy: [] })),
    });
    expect(again).toHaveLength(0);
  });
});
