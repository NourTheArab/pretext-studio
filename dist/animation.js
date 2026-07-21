// ── Animation engine ────────────────────────────────────────────
import { flowLayout } from './flow.js';
import { applyEffects } from './effects.js';
// ── Built-in easings ───────────────────────────────────────────
export const easings = {
    linear: (t) => t,
    easeIn: (t) => t * t * t,
    easeOut: (t) => 1 - (1 - t) ** 3,
    easeInOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
    spring: (() => {
        const zeta = 0.5;
        const omega = 8;
        const omegaD = omega * Math.sqrt(1 - zeta * zeta);
        const raw = (t) => 1 - Math.exp(-zeta * omega * t) * Math.cos(omegaD * t);
        const endVal = raw(1);
        return ((t) => {
            if (t <= 0)
                return 0;
            if (t >= 1)
                return 1;
            return raw(t) / endVal;
        });
    })(),
};
export function resolveEasing(easing) {
    if (!easing)
        return easings.linear;
    if (typeof easing === 'string')
        return easings[easing] ?? easings.linear;
    return easing;
}
// ── Animation controller ───────────────────────────────────────
export function createAnimationController(config) {
    let currentConfig = { ...config };
    let effects = config.effects ?? [];
    let startTime = null;
    let pauseStartedAt = null;
    let _paused = false;
    let _elapsed = 0;
    let lastResult = null;
    let _cursor = null;
    // Overrides from moveEmbed — clears animation for that embed
    const overrides = new Map();
    function resolveEmbedsAtTime(time) {
        const embeds = (currentConfig.embeds ?? []);
        return embeds.map(embed => {
            // Check for drag override
            const override = overrides.get(embed.id);
            if (override) {
                return { ...embed, position: override };
            }
            // Path animation
            if (embed.path) {
                const pos = evaluatePath(embed.path, time);
                return { ...embed, position: pos };
            }
            // Keyframe animation
            if (embed.keyframes && embed.keyframes.length > 0) {
                const pos = interpolateKeyframes(embed.keyframes, time, embed.loop ?? 'none');
                return { ...embed, position: pos };
            }
            return embed;
        });
    }
    const controller = {
        tick(time) {
            if (startTime === null)
                startTime = time;
            if (_paused) {
                if (pauseStartedAt === null) {
                    pauseStartedAt = startTime + _elapsed;
                }
                if (lastResult)
                    return lastResult;
                // First tick while paused — compute once
            }
            else {
                if (pauseStartedAt !== null) {
                    startTime += time - pauseStartedAt;
                    pauseStartedAt = null;
                }
                _elapsed = time - startTime;
            }
            const resolvedEmbeds = resolveEmbedsAtTime(_elapsed);
            const layoutConfig = {
                ...currentConfig,
                embeds: resolvedEmbeds,
            };
            lastResult = flowLayout(layoutConfig);
            // Apply effects if we have any and characterPositions is on
            if (effects.length > 0 && currentConfig.characterPositions) {
                const ctx = {
                    time: _elapsed,
                    cursor: _cursor,
                    height: lastResult.height,
                    width: currentConfig.width,
                };
                applyEffects(lastResult, effects, ctx);
            }
            return lastResult;
        },
        get paused() {
            return _paused;
        },
        set paused(value) {
            if (value && !_paused) {
                if (startTime !== null) {
                    pauseStartedAt = startTime + _elapsed;
                }
            }
            _paused = value;
        },
        get elapsed() {
            return _elapsed;
        },
        reset() {
            startTime = null;
            pauseStartedAt = null;
            _elapsed = 0;
            lastResult = null;
            overrides.clear();
        },
        updateConfig(partial) {
            currentConfig = { ...currentConfig, ...partial };
            if ('effects' in partial) {
                effects = partial.effects ?? [];
            }
        },
        moveEmbed(id, position) {
            overrides.set(id, position);
        },
        setCursor(point) {
            _cursor = point;
        },
    };
    return controller;
}
// ── Keyframe interpolation ─────────────────────────────────────
export function interpolateKeyframes(keyframes, time, loop) {
    if (keyframes.length === 0) {
        return { type: 'absolute', x: 0, y: 0 };
    }
    if (keyframes.length === 1) {
        return keyframes[0].position;
    }
    const totalDuration = keyframes[keyframes.length - 1].time - keyframes[0].time;
    if (totalDuration <= 0)
        return keyframes[0].position;
    const startOffset = keyframes[0].time;
    let localTime = time - startOffset;
    if (loop === 'loop') {
        localTime = ((localTime % totalDuration) + totalDuration) % totalDuration;
    }
    else if (loop === 'pingpong') {
        const cycle = totalDuration * 2;
        localTime = ((localTime % cycle) + cycle) % cycle;
        if (localTime > totalDuration) {
            localTime = cycle - localTime;
        }
    }
    else {
        // 'none' — clamp
        localTime = Math.max(0, Math.min(localTime, totalDuration));
    }
    const t = localTime + startOffset;
    // Find bracketing keyframes
    let a = keyframes[0];
    let b = keyframes[keyframes.length - 1];
    for (let i = 0; i < keyframes.length - 1; i++) {
        if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
            a = keyframes[i];
            b = keyframes[i + 1];
            break;
        }
    }
    const segDuration = b.time - a.time;
    if (segDuration <= 0)
        return a.position;
    let progress = (t - a.time) / segDuration;
    const easing = resolveEasing(a.easing);
    progress = easing(progress);
    return lerpPosition(a.position, b.position, progress);
}
function lerpPosition(a, b, t) {
    // Convert both to absolute for interpolation
    const ax = positionX(a);
    const ay = positionY(a);
    const bx = positionX(b);
    const by = positionY(b);
    return {
        type: 'absolute',
        x: ax + (bx - ax) * t,
        y: ay + (by - ay) * t,
    };
}
function positionX(p) {
    if (p.type === 'absolute')
        return p.x;
    // For flow positions, use progress as a proxy — not ideal but workable
    return 0;
}
function positionY(p) {
    if (p.type === 'absolute')
        return p.y;
    return 0;
}
// ── Path animation ─────────────────────────────────────────────
export function evaluatePath(path, time) {
    const loop = path.loop ?? 'none';
    let localTime = time;
    if (path.duration <= 0) {
        const start = getPathStart(path.segments);
        return { type: 'absolute', x: start.x, y: start.y };
    }
    if (loop === 'loop') {
        localTime = ((localTime % path.duration) + path.duration) % path.duration;
    }
    else if (loop === 'pingpong') {
        const cycle = path.duration * 2;
        localTime = ((localTime % cycle) + cycle) % cycle;
        if (localTime > path.duration) {
            localTime = cycle - localTime;
        }
    }
    else {
        localTime = Math.max(0, Math.min(localTime, path.duration));
    }
    let progress = localTime / path.duration;
    progress = resolveEasing(path.easing)(progress);
    const point = evaluatePathAtProgressAccurate(path.segments, getPathStart(path.segments), progress);
    return { type: 'absolute', x: point.x, y: point.y };
}
function getPathStart(segments) {
    if (segments.length === 0)
        return { x: 0, y: 0 };
    const seg = segments[0];
    // The start of the first segment is implicit — we need a convention.
    // Use (0,0) as start, or the 'to' of arc center minus radius at startAngle
    if (seg.type === 'arc') {
        return {
            x: seg.center.x + seg.radius * Math.cos(seg.startAngle),
            y: seg.center.y + seg.radius * Math.sin(seg.startAngle),
        };
    }
    return { x: 0, y: 0 };
}
export function evaluatePathAtProgress(segments, progress) {
    if (segments.length === 0)
        return { x: 0, y: 0 };
    // Compute approximate lengths for each segment
    const lengths = segments.map(segmentLength);
    const totalLength = lengths.reduce((a, b) => a + b, 0);
    if (totalLength === 0)
        return { x: 0, y: 0 };
    let targetDist = progress * totalLength;
    let currentPoint = getPathStart(segments);
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const len = lengths[i];
        if (targetDist <= len || i === segments.length - 1) {
            const segProgress = len > 0 ? Math.min(targetDist / len, 1) : 0;
            return evaluateSegment(seg, currentPoint, segProgress);
        }
        targetDist -= len;
        currentPoint = segmentEndPoint(seg, currentPoint);
    }
    return currentPoint;
}
function segmentLength(seg) {
    switch (seg.type) {
        case 'line':
            // We don't know the start, approximate with endpoint distance from origin
            // This gets corrected during traversal
            return 100; // placeholder — actual distance computed in evaluateSegment
        case 'bezier':
            return 100; // placeholder
        case 'arc': {
            const angleSpan = Math.abs(seg.endAngle - seg.startAngle);
            return seg.radius * angleSpan;
        }
    }
}
// Recompute with proper segment length tracking
export function computePathSegmentLengths(segments, start) {
    const lengths = [];
    let current = start;
    for (const seg of segments) {
        switch (seg.type) {
            case 'line': {
                const dx = seg.to.x - current.x;
                const dy = seg.to.y - current.y;
                lengths.push(Math.sqrt(dx * dx + dy * dy));
                current = seg.to;
                break;
            }
            case 'bezier': {
                // Approximate with chord segments
                let len = 0;
                let prev = current;
                const steps = 20;
                for (let i = 1; i <= steps; i++) {
                    const t = i / steps;
                    const p = deCasteljau(current, seg.cp1, seg.cp2, seg.to, t);
                    const dx = p.x - prev.x;
                    const dy = p.y - prev.y;
                    len += Math.sqrt(dx * dx + dy * dy);
                    prev = p;
                }
                lengths.push(len);
                current = seg.to;
                break;
            }
            case 'arc': {
                const angleSpan = Math.abs(seg.endAngle - seg.startAngle);
                lengths.push(seg.radius * angleSpan);
                current = {
                    x: seg.center.x + seg.radius * Math.cos(seg.endAngle),
                    y: seg.center.y + seg.radius * Math.sin(seg.endAngle),
                };
                break;
            }
        }
    }
    return lengths;
}
/** Evaluate path with proper length computation. */
export function evaluatePathAtProgressAccurate(segments, startPoint, progress) {
    if (segments.length === 0)
        return startPoint;
    const lengths = computePathSegmentLengths(segments, startPoint);
    const totalLength = lengths.reduce((a, b) => a + b, 0);
    if (totalLength === 0)
        return startPoint;
    let targetDist = progress * totalLength;
    let current = startPoint;
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const len = lengths[i];
        if (targetDist <= len || i === segments.length - 1) {
            const segProgress = len > 0 ? Math.min(targetDist / len, 1) : 0;
            return evaluateSegment(seg, current, segProgress);
        }
        targetDist -= len;
        current = segmentEndPoint(seg, current);
    }
    return current;
}
function evaluateSegment(seg, from, t) {
    switch (seg.type) {
        case 'line':
            return {
                x: from.x + (seg.to.x - from.x) * t,
                y: from.y + (seg.to.y - from.y) * t,
            };
        case 'bezier':
            return deCasteljau(from, seg.cp1, seg.cp2, seg.to, t);
        case 'arc': {
            const angle = seg.startAngle + (seg.endAngle - seg.startAngle) * t;
            return {
                x: seg.center.x + seg.radius * Math.cos(angle),
                y: seg.center.y + seg.radius * Math.sin(angle),
            };
        }
    }
}
function segmentEndPoint(seg, from) {
    switch (seg.type) {
        case 'line':
            return seg.to;
        case 'bezier':
            return seg.to;
        case 'arc':
            return {
                x: seg.center.x + seg.radius * Math.cos(seg.endAngle),
                y: seg.center.y + seg.radius * Math.sin(seg.endAngle),
            };
    }
}
/** De Casteljau's algorithm for cubic bezier. */
export function deCasteljau(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return {
        x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
}
