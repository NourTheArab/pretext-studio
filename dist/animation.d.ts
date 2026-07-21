import type { AnimationController, AnimationControllerConfig, AnimationPath, EasingFunction, EasingName, EmbedPosition, Keyframe, PathSegment, Point } from './types.js';
export declare const easings: Record<EasingName, EasingFunction>;
export declare function resolveEasing(easing: EasingFunction | EasingName | undefined): EasingFunction;
export declare function createAnimationController(config: AnimationControllerConfig): AnimationController;
export declare function interpolateKeyframes(keyframes: Keyframe[], time: number, loop: 'none' | 'loop' | 'pingpong'): EmbedPosition;
export declare function evaluatePath(path: AnimationPath, time: number): EmbedPosition;
export declare function evaluatePathAtProgress(segments: PathSegment[], progress: number): Point;
export declare function computePathSegmentLengths(segments: PathSegment[], start: Point): number[];
/** Evaluate path with proper length computation. */
export declare function evaluatePathAtProgressAccurate(segments: PathSegment[], startPoint: Point, progress: number): Point;
/** De Casteljau's algorithm for cubic bezier. */
export declare function deCasteljau(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point;
