import type { FlowResult, Point } from './types.js';
/**
 * Returns the embed id at a given point, or null.
 * Checks resolved embed bounding rects with optional tolerance.
 */
export declare function hitTest(result: FlowResult, point: Point, tolerance?: number): string | null;
/**
 * Returns the character at a given point, or null.
 * Uses line positions and per-character data if available.
 */
export declare function hitTestCharacter(result: FlowResult, point: Point, lineHeight: number): {
    line: number;
    character: number;
    char: string;
} | null;
