import type { Interval, Point, Rect, Shape } from './types.js';
/**
 * Return the horizontal interval blocked by `shape` (positioned at `rect`)
 * for a text line band spanning [bandTop, bandBottom).
 *
 * Returns `null` if the shape doesn't overlap this band at all.
 */
export declare function shapeIntervalForBand(shape: Shape, rect: Rect, bandTop: number, bandBottom: number, margin: number): Interval | null;
/**
 * Given a polygon (closed path) and a horizontal band,
 * return the bounding horizontal interval of the polygon within that band.
 *
 * Adapted from Cheng Lou's wrap-geometry.ts (MIT).
 */
export declare function getPolygonIntervalForBand(points: Point[], bandTop: number, bandBottom: number, horizontalPadding: number, verticalPadding: number): Interval | null;
/**
 * Given one full-width base interval and a set of blocked intervals,
 * return the remaining usable text slots.
 *
 * Slots narrower than `minWidth` are discarded.
 *
 * Adapted from Cheng Lou's wrap-geometry.ts (MIT).
 */
export declare function carveSlots(base: Interval, blocked: Interval[], minWidth: number): Interval[];
