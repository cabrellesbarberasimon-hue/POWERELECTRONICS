import type { Localized } from '@/types/domain';
import { allSteps, levelPercent, ADVANCED_UNLOCK_PERCENT, nextStep } from '@/modules/university/progress';
import type { ChallengeDraft, LearnerContext, Recommendation, RecommendationEngine, TeamContext } from './types';

const DAY = 86_400_000;

export const REASONS = {
  failed: { en: 'You had trouble with this lesson — review it', es: 'Tuviste dificultades con esta lección: repásala' },
  continue: { en: 'Continue where you left off', es: 'Continúa donde lo dejaste' },
  alert: { en: 'Related to active alerts in the field', es: 'Relacionado con alertas activas en campo' },
  history: { en: 'Frequent issue in the Technical History', es: 'Incidencia frecuente en el Historial Técnico' },
  community: { en: 'Colleagues rated this as a good idea', es: 'Tus compañeros lo marcaron como buena idea' },
  gap: { en: 'Covers a topic you struggled with', es: 'Trata un tema en el que tuviste dificultades' },
  practice: { en: 'Practise it in Augmented Reality before going on site', es: 'Practícalo en Realidad Aumentada antes de ir a campo' },
} satisfies Record<string, Localized>;

export interface RuleWeights {
  failedStep: number;
  nextStep: number;
  alertUrgent: number;
  alertPreventive: number;
  historyEntry: number;
  historyRepeatFailure: number;
  tagCap: number;
  lockedAdvancedPenalty: number;
  historyWindowDays: number;
}

export const DEFAULT_WEIGHTS: RuleWeights = {
  failedStep: 5,
  nextStep: 3,
  alertUrgent: 3,
  alertPreventive: 1.5,
  historyEntry: 0.5,
  historyRepeatFailure: 2,
  tagCap: 6,
  lockedAdvancedPenalty: 4,
  historyWindowDays: 90,
};

/** Weighted "heat" of each tag and part from alerts and technical history. */
export function fieldSignals(ctx: Pick<LearnerContext, 'alerts' | 'history' | 'equipment'>, w = DEFAULT_WEIGHTS, now = Date.now()) {
  const partTags = new Map<string, string[]>();
  ctx.equipment.forEach((e) => e.parts.forEach((p) => partTags.set(p.id, p.tags)));

  const tagHeat = new Map<string, { alert: number; history: number }>();
  const partHeat = new Map<string, number>();
  const bump = (partId: string, kind: 'alert' | 'history', value: number) => {
    partHeat.set(partId, (partHeat.get(partId) ?? 0) + value);
    for (const tag of partTags.get(partId) ?? []) {
      const cur = tagHeat.get(tag) ?? { alert: 0, history: 0 };
      cur[kind] += value;
      tagHeat.set(tag, cur);
    }
  };

  ctx.alerts
    .filter((a) => !a.resolved)
    .forEach((a) => bump(a.partId, 'alert', a.severity === 'urgent' ? w.alertUrgent : w.alertPreventive));
  ctx.history
    .filter((h) => now - new Date(h.date).getTime() <= w.historyWindowDays * DAY)
    .forEach((h) => bump(h.partId, 'history', w.historyEntry + (h.firstTimeFix ? 0 : w.historyRepeatFailure)));

  return { tagHeat, partHeat };
}

export class RuleBasedEngine implements RecommendationEngine {
  readonly name = 'rule-based-v1';

  constructor(
    private readonly weights: RuleWeights = DEFAULT_WEIGHTS,
    private readonly now: () => number = Date.now,
  ) {}

  async recommend(ctx: LearnerContext, limit = 6): Promise<Recommendation[]> {
    const w = this.weights;
    const { tagHeat, partHeat } = fieldSignals(ctx, w, this.now());
    const failed = new Set(ctx.progress.flatMap((p) => p.failedStepIds));
    const completed = new Set(ctx.progress.flatMap((p) => p.completedStepIds));
    const expert = ctx.user.role !== 'employee';
    const advancedUnlocked = expert || levelPercent(ctx.courses, 'basic', ctx.progress) >= ADVANCED_UNLOCK_PERCENT;

    const failedTags = new Set<string>();
    ctx.courses.forEach((c) => allSteps(c).forEach((s) => failed.has(s.id) && s.tags.forEach((t) => failedTags.add(t))));

    const recs: Recommendation[] = [];

    // 1. Course steps
    for (const course of ctx.courses) {
      const p = ctx.progress.find((x) => x.courseId === course.id);
      const next = p && p.completedStepIds.length ? nextStep(course, p) : undefined;
      for (const step of allSteps(course)) {
        const isFailed = failed.has(step.id);
        if (completed.has(step.id) && !isFailed) continue;
        let score = 0;
        const reasons: Localized[] = [];
        if (isFailed) {
          score += w.failedStep;
          reasons.push(REASONS.failed);
        }
        if (next?.id === step.id) {
          score += w.nextStep;
          reasons.push(REASONS.continue);
        }
        let alertHeat = 0;
        let historyHeat = 0;
        step.tags.forEach((t) => {
          alertHeat += tagHeat.get(t)?.alert ?? 0;
          historyHeat += tagHeat.get(t)?.history ?? 0;
        });
        if (step.partId) alertHeat += (partHeat.get(step.partId) ?? 0) * 0.5;
        const field = Math.min(w.tagCap, alertHeat + historyHeat);
        if (field > 0) {
          score += field;
          reasons.push(alertHeat >= historyHeat ? REASONS.alert : REASONS.history);
        }
        if (course.level === 'advanced' && !advancedUnlocked) score -= w.lockedAdvancedPenalty;
        if (score > 0 && reasons.length) {
          recs.push({ kind: 'step', id: `step:${step.id}`, courseId: course.id, stepId: step.id, score: round(score), reasons });
        }
      }
    }

    // 2. Community content from colleagues
    for (const post of ctx.posts) {
      if (post.authorId === ctx.user.id) continue;
      const tagScore = post.tags.reduce((acc, t) => acc + (failedTags.has(t) ? 2 : 0) + Math.min(2, (tagHeat.get(t)?.alert ?? 0) * 0.4), 0);
      if (tagScore <= 0) continue;
      const ideas = post.reactions.idea.length;
      const score = Math.min(w.tagCap, tagScore) + Math.min(3, ideas * 0.4);
      const reasons: Localized[] = [];
      if (post.tags.some((t) => failedTags.has(t))) reasons.push(REASONS.gap);
      if (ideas >= 2) reasons.push(REASONS.community);
      if (!reasons.length) reasons.push(REASONS.alert);
      recs.push({ kind: 'post', id: `post:${post.id}`, postId: post.id, score: round(score * 0.8), reasons });
    }

    // 3. AR training on hot parts
    for (const eq of ctx.equipment) {
      for (const part of eq.parts) {
        const heat = partHeat.get(part.id) ?? 0;
        if (heat < w.alertUrgent) continue;
        recs.push({
          kind: 'training',
          id: `training:${part.id}`,
          equipmentId: eq.id,
          partId: part.id,
          score: round(Math.min(w.tagCap + 2, heat)),
          reasons: [REASONS.practice, REASONS.alert],
        });
      }
    }

    return recs.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
  }

  async generateChallenges(ctx: TeamContext): Promise<ChallengeDraft[]> {
    const { partHeat, tagHeat } = fieldSignals(
      { alerts: ctx.alerts, history: ctx.history, equipment: ctx.equipment },
      this.weights,
      this.now(),
    );
    const drafts: ChallengeDraft[] = [];
    const parts = ctx.equipment.flatMap((e) => e.parts);

    // Monthly: practise the hottest part in AR.
    const hottest = [...partHeat.entries()].sort((a, b) => b[1] - a[1])[0];
    const part = hottest && parts.find((p) => p.id === hottest[0]);
    if (part && !ctx.existing.some((c) => c.goal.type === 'training' && c.goal.partId === part.id)) {
      drafts.push({
        period: 'monthly',
        points: 80,
        goal: { type: 'training', target: 1, partId: part.id },
        title: { en: `${part.name.en} in AR`, es: `${part.name.es} en RA` },
        description: {
          en: `Most field issues this quarter involve the ${part.name.en.toLowerCase()}. Complete one Step by Step training on it.`,
          es: `La mayoría de incidencias de campo del trimestre afectan a: ${part.name.es.toLowerCase()}. Completa un training paso a paso sobre ello.`,
        },
      });
    }

    // Quarterly: share knowledge on the hottest tag with little community content.
    const coverage = (tag: string) => ctx.posts.filter((p) => p.tags.includes(tag)).length;
    const gapTag = [...tagHeat.entries()]
      .map(([tag, h]) => ({ tag, need: h.alert + h.history - coverage(tag) }))
      .sort((a, b) => b.need - a.need)[0];
    if (gapTag && gapTag.need > 0 && !ctx.existing.some((c) => c.goal.type === 'publish' && c.goal.tag === gapTag.tag)) {
      drafts.push({
        period: 'quarterly',
        points: 120,
        goal: { type: 'publish', target: 2, tag: gapTag.tag },
        title: { en: `Teach us about #${gapTag.tag}`, es: `Enséñanos sobre #${gapTag.tag}` },
        description: {
          en: `The team needs more content about #${gapTag.tag}. Publish 2 posts with that tag.`,
          es: `El equipo necesita más contenido sobre #${gapTag.tag}. Publica 2 posts con esa etiqueta.`,
        },
      });
    }

    // Monthly: lessons related to repeated failures.
    const repeatTags = new Set(ctx.history.filter((h) => !h.firstTimeFix).flatMap((h) => parts.find((p) => p.id === h.partId)?.tags ?? []));
    const tag = [...repeatTags][0];
    if (tag && !ctx.existing.some((c) => c.goal.type === 'complete_steps' && c.goal.tag === tag)) {
      drafts.push({
        period: 'monthly',
        points: 60,
        goal: { type: 'complete_steps', target: 3, tag },
        title: { en: `First-time fix: #${tag}`, es: `A la primera: #${tag}` },
        description: {
          en: `Interventions on #${tag} needed a second visit. Complete 3 lessons tagged #${tag}.`,
          es: `Las intervenciones sobre #${tag} requirieron una segunda visita. Completa 3 lecciones con #${tag}.`,
        },
      });
    }

    return drafts;
  }
}

const round = (n: number) => Math.round(n * 10) / 10;
