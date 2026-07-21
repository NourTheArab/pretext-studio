import { hitTest } from './hittest.js';
export function createEmbedEventDispatcher(handlers, tolerance = 0) {
    let activeEmbedId = null;
    let lastPoint = { x: 0, y: 0 };
    return {
        handlePointerMove(result, point) {
            lastPoint = point;
            const nextEmbedId = hitTest(result, point, tolerance);
            if (nextEmbedId === activeEmbedId)
                return;
            if (activeEmbedId) {
                handlers.onPointerLeave?.(activeEmbedId, point);
            }
            if (nextEmbedId) {
                handlers.onPointerEnter?.(nextEmbedId, point);
            }
            activeEmbedId = nextEmbedId;
        },
        handleClick(result, point) {
            lastPoint = point;
            const embedId = hitTest(result, point, tolerance);
            if (embedId) {
                handlers.onClick?.(embedId, point);
            }
        },
        handlePointerLeave() {
            if (!activeEmbedId)
                return;
            handlers.onPointerLeave?.(activeEmbedId, lastPoint);
            activeEmbedId = null;
        },
    };
}
