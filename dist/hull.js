export function hullFromImage(imageData, threshold = 32) {
    const { width, height, data } = imageData;
    const normalizedThreshold = clamp(Math.round(threshold), 0, 255);
    const edgePoints = [];
    const isSolid = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height)
            return false;
        return data[(y * width + x) * 4 + 3] >= normalizedThreshold;
    };
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!isSolid(x, y))
                continue;
            if (!isSolid(x - 1, y) ||
                !isSolid(x + 1, y) ||
                !isSolid(x, y - 1) ||
                !isSolid(x, y + 1)) {
                edgePoints.push({ x, y });
            }
        }
    }
    const hull = convexHull(edgePoints);
    return {
        type: 'polygon',
        width,
        height,
        points: hull.map(point => ({
            x: normalizePoint(point.x, width),
            y: normalizePoint(point.y, height),
        })),
    };
}
function normalizePoint(value, size) {
    if (size <= 0)
        return 0;
    return clamp((value + 0.5) / size, 0, 1);
}
function convexHull(points) {
    const uniquePoints = dedupeAndSort(points);
    if (uniquePoints.length <= 1)
        return uniquePoints;
    const lower = [];
    for (const point of uniquePoints) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
            lower.pop();
        }
        lower.push(point);
    }
    const upper = [];
    for (let index = uniquePoints.length - 1; index >= 0; index--) {
        const point = uniquePoints[index];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
            upper.pop();
        }
        upper.push(point);
    }
    lower.pop();
    upper.pop();
    return [...lower, ...upper];
}
function dedupeAndSort(points) {
    const seen = new Set();
    const unique = [];
    for (const point of points) {
        const key = `${point.x},${point.y}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        unique.push(point);
    }
    return unique.sort((a, b) => a.x - b.x || a.y - b.y);
}
function cross(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
