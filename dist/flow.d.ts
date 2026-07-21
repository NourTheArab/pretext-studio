import type { FlowConfig, FlowResult } from './types.js';
/**
 * Lay out text with embedded objects that text flows around.
 *
 * Uses `@chenglou/pretext` for all text measurement — zero DOM reads.
 *
 * ```ts
 * import { flowLayout } from 'flowtxt'
 *
 * const result = flowLayout({
 *   text: article,
 *   font: '16px Georgia',
 *   width: 600,
 *   lineHeight: 26,
 *   embeds: [{
 *     id: 'logo',
 *     shape: { type: 'circle', radius: 50 },
 *     position: { type: 'flow', paragraph: 0, progress: 0.3, side: 'right' },
 *     margin: 16,
 *   }],
 * })
 *
 * // result.lines  → positioned text lines
 * // result.embeds → resolved embed rects
 * ```
 */
export declare function flowLayout(config: FlowConfig): FlowResult;
