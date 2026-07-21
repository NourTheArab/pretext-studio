// ── Core flow engine ────────────────────────────────────────────
// Takes text + embeds, uses Pretext for line-breaking, and
// routes text around embedded shapes.
import { prepareWithSegments, layoutNextLine, layout, } from '@chenglou/pretext';
import { shapeIntervalForBand, carveSlots } from './shapes.js';
// ── Defaults ───────────────────────────────────────────────────
const DEFAULT_MARGIN = 12;
const DEFAULT_MIN_SLOT_WIDTH = 24;
const DEFAULT_PARAGRAPH_GAP = 0;
// ── Public API ─────────────────────────────────────────────────
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
export function flowLayout(config) {
    const { text, font, width, lineHeight, embeds = [], minSlotWidth = DEFAULT_MIN_SLOT_WIDTH, paragraphGap = DEFAULT_PARAGRAPH_GAP, characterPositions = false, } = config;
    // ── 1. Split into paragraphs ──────────────────────────────
    const paragraphs = text.split('\n');
    // ── 2. Prepare each paragraph with Pretext ────────────────
    const prepared = paragraphs.map(p => prepareWithSegments(p, font));
    // ── 3. First pass: compute paragraph Y extents (no embeds) ─
    //    We need this to resolve `flow` positions.
    const paraExtents = [];
    let baseY = 0;
    for (let i = 0; i < prepared.length; i++) {
        const result = layout(prepared[i], width, lineHeight);
        const h = result.height;
        paraExtents.push({ top: baseY, height: h });
        baseY += h + (i < prepared.length - 1 ? paragraphGap : 0);
    }
    // ── 4. Resolve embed positions to absolute rects ──────────
    const resolvedEmbeds = embeds.map(embed => ({
        id: embed.id,
        rect: resolveEmbedRect(embed, width, paraExtents),
        embed,
    }));
    // ── 5. Second pass: lay out each paragraph with obstacle routing ─
    const lines = [];
    let y = 0;
    for (let pi = 0; pi < prepared.length; pi++) {
        const prep = prepared[pi];
        let cursor = { segmentIndex: 0, graphemeIndex: 0 };
        // Lay out line by line
        while (true) {
            const bandTop = y;
            const bandBottom = y + lineHeight;
            // Compute blocked intervals from all embeds at this band
            const blocked = [];
            for (const re of resolvedEmbeds) {
                const margin = re.embed.margin ?? DEFAULT_MARGIN;
                const interval = shapeIntervalForBand(re.embed.shape, re.rect, bandTop, bandBottom, margin);
                if (interval)
                    blocked.push(interval);
            }
            // Carve available text slots
            const base = { left: 0, right: width };
            const slots = carveSlots(base, blocked, minSlotWidth);
            if (slots.length === 0) {
                // Entire line band is blocked — skip it
                y += lineHeight;
                continue;
            }
            // Use the widest (or leftmost) slot for text
            // For simplicity, pick the widest slot
            let bestSlot = slots[0];
            for (const slot of slots) {
                if (slot.right - slot.left > bestSlot.right - bestSlot.left) {
                    bestSlot = slot;
                }
            }
            const slotWidth = bestSlot.right - bestSlot.left;
            const line = layoutNextLine(prep, cursor, slotWidth);
            if (line === null)
                break; // paragraph done
            const flowLine = {
                text: line.text,
                x: bestSlot.left,
                y,
                width: line.width,
                slotWidth,
                paragraph: pi,
            };
            if (characterPositions && flowLine.text.length > 0) {
                flowLine.characters = computeCharacterPositions(flowLine);
            }
            lines.push(flowLine);
            cursor = line.end;
            y += lineHeight;
        }
        // Paragraph gap
        if (pi < prepared.length - 1) {
            y += paragraphGap;
        }
    }
    return {
        lines,
        embeds: resolvedEmbeds,
        height: y,
    };
}
// ── Internal helpers ───────────────────────────────────────────
function resolveEmbedRect(embed, columnWidth, paraExtents) {
    const shape = embed.shape;
    const { w, h } = shapeExtent(shape);
    if (embed.position.type === 'absolute') {
        return {
            x: embed.position.x,
            y: embed.position.y,
            width: w,
            height: h,
        };
    }
    // flow position
    const pos = embed.position;
    const pIdx = Math.min(pos.paragraph, paraExtents.length - 1);
    const para = paraExtents[pIdx];
    // Vertical: anchor within paragraph
    const centerY = para.top + para.height * pos.progress;
    const top = centerY - h / 2;
    // Horizontal: side
    let x;
    switch (pos.side) {
        case 'left':
            x = 0;
            break;
        case 'right':
            x = columnWidth - w;
            break;
        case 'center':
            x = (columnWidth - w) / 2;
            break;
    }
    return { x, y: top, width: w, height: h };
}
/** Get the pixel extent of a shape. */
function shapeExtent(shape) {
    switch (shape.type) {
        case 'circle':
            return { w: shape.radius * 2, h: shape.radius * 2 };
        case 'rect':
            return { w: shape.width, h: shape.height };
        case 'ellipse':
            return { w: shape.radiusX * 2, h: shape.radiusY * 2 };
        case 'polygon':
            return { w: shape.width, h: shape.height };
    }
}
/**
 * Distribute character positions proportionally within the line's rendered width.
 * Not glyph-exact — distributes evenly based on character count within the line width.
 */
function computeCharacterPositions(line) {
    const chars = [...line.text]; // handle multi-byte chars
    if (chars.length === 0)
        return [];
    const charWidth = line.width / chars.length;
    return chars.map((char, i) => ({
        char,
        x: line.x + i * charWidth,
        width: charWidth,
        index: i,
    }));
}
