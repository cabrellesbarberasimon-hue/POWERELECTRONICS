import { RuleBasedEngine } from './ruleBasedEngine';
import type { RecommendationEngine } from './types';

export * from './types';
export { RuleBasedEngine, REASONS, DEFAULT_WEIGHTS, fieldSignals } from './ruleBasedEngine';

/**
 * Active engine. Swap it at startup (e.g. `setEngine(new LlmEngine(client))`)
 * to use a trained model or an LLM without touching the screens.
 */
let engine: RecommendationEngine = new RuleBasedEngine();

export const getEngine = () => engine;
export const setEngine = (next: RecommendationEngine) => {
  engine = next;
};
