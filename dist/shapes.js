// ── Shape geometry ──────────────────────────────────────────────
// Given a shape and its resolved bounding rect, compute the
// horizontal interval that the shape blocks at a given Y band.
/**
 * Return the horizontal interval blocked by `shape` (positioned at `rect`)
 * for a text line band spanning [bandTop, bandBottom).
 *
 * Returns `null` if the shape doesn't overlap this band at all.
 */
export function shapeIntervalForBand(shape, rect, bandTop, bandBottom, margin) {
    // Expand rect by margin for overlap check
    const padTop = rect.y - margin;
    const padBottom = rect.y + rect.height + margin;
    // Quick reject: band doesn't overlap padded rect at all
    if (bandBottom <= padTop || bandTop >= padBottom)
        return null;
    switch (shape.type) {
        case 'rect':
            return rectInterval(rect, margin);
        case 'circle':
            return circleInterval(shape, rect, bandTop, bandBottom, margin);
        case 'ellipse':
            return ellipseInterval(shape, rect, bandTop, bandBottom, margin);
        case 'polygon':
            return polygonInterval(shape, rect, bandTop, bandBottom, margin);
    }
}
function rectInterval(rect, margin) {
    const r = rect;
    const br = 0; // TODO: borderRadius support
    void br;
    return {
        left: r.x - margin,
        right: r.x + r.width + margin,
    };
}
function circleInterval(shape, rect, bandTop, bandBottom, margin) {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const r = shape.radius + margin;
    // Find the widest horizontal extent of the circle within this band
    let maxHalf = 0;
    // Sample top, bottom, and center of band
    const samples = [bandTop, bandBottom, (bandTop + bandBottom) / 2];
    for (const y of samples) {
        const dy = y - cy;
        if (Math.abs(dy) >= r)
            continue;
        const half = Math.sqrt(r * r - dy * dy);
        if (half > maxHalf)
            maxHalf = half;
    }
    if (maxHalf === 0)
        return null;
    return { left: cx - maxHalf, right: cx + maxHalf };
}
function ellipseInterval(shape, rect, bandTop, bandBottom, margin) {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const rx = shape.radiusX + margin;
    const ry = shape.radiusY + margin;
    let maxHalf = 0;
    const samples = [bandTop, bandBottom, (bandTop + bandBottom) / 2];
    for (const y of samples) {
        const dy = y - cy;
        if (Math.abs(dy) >= ry)
            continue;
        const half = rx * Math.sqrt(1 - (dy * dy) / (ry * ry));
        if (half > maxHalf)
            maxHalf = half;
    }
    if (maxHalf === 0)
        return null;
    return { left: cx - maxHalf, right: cx + maxHalf };
}
function polygonInterval(shape, rect, bandTop, bandBottom, margin) {
    // Scale normalized points to actual rect
    const points = shape.points.map(p => ({
        x: rect.x + p.x * rect.width,
        y: rect.y + p.y * rect.height,
    }));
    return getPolygonIntervalForBand(points, bandTop, bandBottom, margin, margin);
}
/**
 * Given a polygon (closed path) and a horizontal band,
 * return the bounding horizontal interval of the polygon within that band.
 *
 * Adapted from Cheng Lou's wrap-geometry.ts (MIT).
 */
export function getPolygonIntervalForBand(points, bandTop, bandBottom, horizontalPadding, verticalPadding) {
    const sampleTop = bandTop - verticalPadding;
    const sampleBottom = bandBottom + verticalPadding;
    const startY = Math.floor(sampleTop);
    const endY = Math.ceil(sampleBottom);
    let left = Infinity;
    let right = -Infinity;
    for (let y = startY; y <= endY; y++) {
        const xs = getPolygonXsAtY(points, y + 0.5);
        for (let i = 0; i + 1 < xs.length; i += 2) {
            const runLeft = xs[i];
            const runRight = xs[i + 1];
            if (runLeft < left)
                left = runLeft;
            if (runRight > right)
                right = runRight;
        }
    }
    if (!Number.isFinite(left) || !Number.isFinite(right))
        return null;
    return { left: left - horizontalPadding, right: right + horizontalPadding };
}
/** Ray-cast to find all X intersections of a polygon at a given Y. */
function getPolygonXsAtY(points, y) {
    const xs = [];
    let a = points[points.length - 1];
    if (!a)
        return xs;
    for (let i = 0; i < points.length; i++) {
        const b = points[i];
        if ((a.y <= y && y < b.y) || (b.y <= y && y < a.y)) {
            xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
        }
        a = b;
    }
    xs.sort((a, b) => a - b);
    return xs;
}
// ── Interval carving ───────────────────────────────────────────
/**
 * Given one full-width base interval and a set of blocked intervals,
 * return the remaining usable text slots.
 *
 * Slots narrower than `minWidth` are discarded.
 *
 * Adapted from Cheng Lou's wrap-geometry.ts (MIT).
 */
export function carveSlots(base, blocked, minWidth) {
    let slots = [base];
    for (const block of blocked) {
        const next = [];
        for (const slot of slots) {
            // No overlap — keep slot as-is
            if (block.right <= slot.left || block.left >= slot.right) {
                next.push(slot);
                continue;
            }
            // Left remainder
            if (block.left > slot.left)
                next.push({ left: slot.left, right: block.left });
            // Right remainder
            if (block.right < slot.right)
                next.push({ left: block.right, right: slot.right });
        }
        slots = next;
    }
    return slots.filter(s => s.right - s.left >= minWidth);
}
