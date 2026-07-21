import type { FlowResult, Point } from './types.js';
export type EmbedEventHandlers = {
    onPointerEnter?: (embedId: string, point: Point) => void;
    onPointerLeave?: (embedId: string, point: Point) => void;
    onClick?: (embedId: string, point: Point) => void;
};
export type EmbedEventDispatcher = {
    handlePointerMove(result: FlowResult, point: Point): void;
    handleClick(result: FlowResult, point: Point): void;
    handlePointerLeave(): void;
};
export declare function createEmbedEventDispatcher(handlers: EmbedEventHandlers, tolerance?: number): EmbedEventDispatcher;
