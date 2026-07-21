// ── Effects layer ───────────────────────────────────────────────
// ── Default transform ──────────────────────────────────────────
const DEFAULT_TRANSFORM = {
    dx: 0,
    dy: 0,
    opacity: 1,
    scale: 1,
    rotation: 0,
};
// ── Apply effects ──────────────────────────────────────────────
/**
 * Apply a list of effects to a flow result.
 * Returns per-line arrays of per-character transforms.
 * The result's `characterTransforms` is also set.
 */
export function applyEffects(result, effects, context) {
    const transforms = [];
    for (const line of result.lines) {
        if (!line.characters || line.characters.length === 0) {
            transforms.push([]);
            continue;
        }
        const lineTransforms = line.characters.map(char => {
            const t = { ...DEFAULT_TRANSFORM };
            for (const effect of effects) {
                const delta = effect.apply(char, line, context);
                if (delta.dx !== undefined)
                    t.dx += delta.dx;
                if (delta.dy !== undefined)
                    t.dy += delta.dy;
                if (delta.opacity !== undefined)
                    t.opacity *= delta.opacity;
                if (delta.scale !== undefined)
                    t.scale *= delta.scale;
                if (delta.rotation !== undefined)
                    t.rotation += delta.rotation;
            }
            return t;
        });
        transforms.push(lineTransforms);
    }
    result.characterTransforms = transforms;
    return transforms;
}
// ── Deterministic noise helper ─────────────────────────────────
function noise(x, y, seed) {
    return Math.sin(x * 0.1 + seed) * Math.sin(y * 0.07 + seed * 1.3) *
        Math.cos(x * 0.03 + y * 0.05 + seed * 0.7);
}
// ── Built-in effects ───────────────────────────────────────────
export function ambientDrift(config) {
    const speed = config?.speed ?? 0.2;
    const amplitude = config?.amplitude ?? 4;
    return {
        id: 'ambientDrift',
        apply(char, line, context) {
            const t = context.time * speed * 0.001;
            const dx = noise(char.x, line.y, t) * amplitude;
            const dy = noise(char.x + 100, line.y + 100, t + 50) * amplitude;
            return { dx, dy };
        },
    };
}
export function cursorRipple(config) {
    const speed = config?.speed ?? 0.7;
    const strength = config?.strength ?? 8;
    const decay = config?.decay ?? 0.02;
    return {
        id: 'cursorRipple',
        apply(char, line, context) {
            if (!context.cursor)
                return {};
            const dx = char.x - context.cursor.x;
            const dy = line.y - context.cursor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const t = context.time * speed * 0.001;
            const wave = Math.sin(dist * 0.05 - t * 10) * strength * Math.exp(-dist * decay);
            return { dy: wave };
        },
    };
}
export function wave(config) {
    const amplitude = config?.amplitude ?? 3;
    const frequency = config?.frequency ?? 0.05;
    const spd = config?.speed ?? 1;
    return {
        id: 'wave',
        apply(char, _line, context) {
            const t = context.time * spd * 0.001;
            const dy = Math.sin(char.x * frequency + t * 5) * amplitude;
            return { dy };
        },
    };
}
export function inkDensity(config) {
    const base = config?.base ?? 0.8;
    const variation = config?.variation ?? 0.4;
    const spd = config?.speed ?? 0.1;
    return {
        id: 'inkDensity',
        apply(char, line, context) {
            const t = context.time * spd * 0.001;
            const n = noise(char.x * 0.5, line.y * 0.5, t);
            const opacity = base + n * variation;
            return { opacity: Math.max(0, Math.min(1, opacity)) };
        },
    };
}
