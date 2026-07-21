// ── Hit testing ─────────────────────────────────────────────────
/**
 * Returns the embed id at a given point, or null.
 * Checks resolved embed bounding rects with optional tolerance.
 */
export function hitTest(result, point, tolerance = 0) {
    for (const embed of result.embeds) {
        const r = embed.rect;
        if (point.x >= r.x - tolerance &&
            point.x <= r.x + r.width + tolerance &&
            point.y >= r.y - tolerance &&
            point.y <= r.y + r.height + tolerance) {
            return embed.id;
        }
    }
    return null;
}
/**
 * Returns the character at a given point, or null.
 * Uses line positions and per-character data if available.
 */
export function hitTestCharacter(result, point, lineHeight) {
    for (let li = 0; li < result.lines.length; li++) {
        const line = result.lines[li];
        if (point.y < line.y || point.y >= line.y + lineHeight)
            continue;
        // If per-character positions are available, use them
        if (line.characters) {
            for (let ci = 0; ci < line.characters.length; ci++) {
                const ch = line.characters[ci];
                if (point.x >= ch.x && point.x < ch.x + ch.width) {
                    return { line: li, character: ci, char: ch.char };
                }
            }
            continue;
        }
        // Fallback: proportional distribution
        if (point.x < line.x || point.x > line.x + line.width)
            continue;
        const chars = [...line.text];
        if (chars.length === 0)
            continue;
        const charWidth = line.width / chars.length;
        const ci = Math.min(Math.floor((point.x - line.x) / charWidth), chars.length - 1);
        return { line: li, character: ci, char: chars[ci] };
    }
    return null;
}
