import type { CharacterTransform, Effect, EffectContext, FlowResult } from './types.js';
/**
 * Apply a list of effects to a flow result.
 * Returns per-line arrays of per-character transforms.
 * The result's `characterTransforms` is also set.
 */
export declare function applyEffects(result: FlowResult, effects: Effect[], context: EffectContext): CharacterTransform[][];
export declare function ambientDrift(config?: {
    speed?: number;
    amplitude?: number;
}): Effect;
export declare function cursorRipple(config?: {
    speed?: number;
    strength?: number;
    decay?: number;
}): Effect;
export declare function wave(config?: {
    amplitude?: number;
    frequency?: number;
    speed?: number;
}): Effect;
export declare function inkDensity(config?: {
    base?: number;
    variation?: number;
    speed?: number;
}): Effect;
