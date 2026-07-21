/** A 2D point. */
export type Point = {
    x: number;
    y: number;
};
/** An axis-aligned rectangle. */
export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
/** A horizontal interval on one line band. */
export type Interval = {
    left: number;
    right: number;
};
export type CircleShape = {
    type: 'circle';
    radius: number;
};
export type RectShape = {
    type: 'rect';
    width: number;
    height: number;
    borderRadius?: number;
};
export type PolygonShape = {
    type: 'polygon';
    /** Normalized points (0–1 range) — will be scaled to width × height. */
    points: Point[];
    /** Pixel width of the polygon bounding box. */
    width: number;
    /** Pixel height of the polygon bounding box. */
    height: number;
};
export type EllipseShape = {
    type: 'ellipse';
    radiusX: number;
    radiusY: number;
};
export type Shape = CircleShape | RectShape | PolygonShape | EllipseShape;
export type AbsolutePosition = {
    type: 'absolute';
    x: number;
    y: number;
};
export type FlowPosition = {
    type: 'flow';
    /**
     * Which paragraph (0-indexed) to anchor to.
     * Paragraphs are split by `\n`.
     */
    paragraph: number;
    /**
     * Fractional progress through the paragraph's vertical extent (0–1).
     * 0.5 = vertically centered within that paragraph's lines.
     */
    progress: number;
    /**
     * Which side of the column to place the embed on.
     * 'left' | 'right' | 'center'
     */
    side: 'left' | 'right' | 'center';
};
export type EmbedPosition = AbsolutePosition | FlowPosition;
export type Embed = {
    /** Unique id for this embed (used in results). */
    id: string;
    /** Collision shape — text flows around this. */
    shape: Shape;
    /** Where to place the embed. */
    position: EmbedPosition;
    /**
     * Extra breathing room (px) around the shape
     * where text will not be placed.
     * @default 12
     */
    margin?: number;
    /** Arbitrary user data passed through to results. */
    data?: unknown;
};
export type FlowConfig = {
    /** The text content. Newlines (`\n`) delimit paragraphs. */
    text: string;
    /** CSS font shorthand, e.g. `'16px Georgia'`. */
    font: string;
    /** Available width for the text column (px). */
    width: number;
    /** Line height in pixels. */
    lineHeight: number;
    /** Embeds to place within the text flow. */
    embeds?: Embed[];
    /**
     * Minimum usable text slot width (px).
     * Slots narrower than this are discarded.
     * @default 24
     */
    minSlotWidth?: number;
    /**
     * Gap between paragraphs (px).
     * @default 0
     */
    paragraphGap?: number;
    /**
     * Compute per-character positions. Needed for character-level effects.
     * @default false
     */
    characterPositions?: boolean;
};
export type CharacterPosition = {
    /** The character. */
    char: string;
    /** X position within the line (absolute). */
    x: number;
    /** Character width in px. */
    width: number;
    /** Index within the line text. */
    index: number;
};
export type CharacterTransform = {
    dx: number;
    dy: number;
    opacity: number;
    scale: number;
    rotation: number;
};
export type EffectContext = {
    /** Current time in ms. */
    time: number;
    /** Cursor position (null if not hovering). */
    cursor: Point | null;
    /** Total layout height. */
    height: number;
    /** Column width. */
    width: number;
};
export type Effect = {
    id: string;
    apply: (char: CharacterPosition, line: FlowLine, context: EffectContext) => Partial<CharacterTransform>;
};
export type EasingFunction = (t: number) => number;
export type EasingName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring';
export type Keyframe = {
    /** Time in ms from animation start. */
    time: number;
    /** Embed position at this keyframe. */
    position: EmbedPosition;
    /** Easing to the NEXT keyframe. */
    easing?: EasingFunction | EasingName;
};
export type PathSegment = {
    type: 'line';
    to: Point;
} | {
    type: 'bezier';
    cp1: Point;
    cp2: Point;
    to: Point;
} | {
    type: 'arc';
    center: Point;
    radius: number;
    startAngle: number;
    endAngle: number;
};
export type AnimationPath = {
    segments: PathSegment[];
    /** Total duration for one traversal in ms. */
    duration: number;
    easing?: EasingFunction | EasingName;
    loop?: 'none' | 'loop' | 'pingpong';
};
export type AnimatedEmbed = Embed & {
    keyframes?: Keyframe[];
    path?: AnimationPath;
    loop?: 'none' | 'loop' | 'pingpong';
};
export type AnimationControllerConfig = FlowConfig & {
    embeds?: AnimatedEmbed[];
    /** Effects applied per-character on every tick (requires characterPositions: true). */
    effects?: Effect[];
};
export type AnimationController = {
    tick(time: number): FlowResult;
    paused: boolean;
    readonly elapsed: number;
    reset(): void;
    updateConfig(config: Partial<AnimationControllerConfig>): void;
    moveEmbed(id: string, position: EmbedPosition): void;
    /** Set cursor position for cursor-aware effects (e.g. cursorRipple). */
    setCursor(point: Point | null): void;
};
export type FlowLine = {
    /** The text content of this line. */
    text: string;
    /** X offset of this line within the column. */
    x: number;
    /** Y position of the top of this line. */
    y: number;
    /** Rendered width of this line (px). */
    width: number;
    /** Available slot width that was given to Pretext for this line. */
    slotWidth: number;
    /** Which paragraph (0-indexed) this line belongs to. */
    paragraph: number;
    /** Per-character positions (only when characterPositions is true). */
    characters?: CharacterPosition[];
};
export type ResolvedEmbed = {
    /** The embed id. */
    id: string;
    /** Computed bounding rect in the flow coordinate space. */
    rect: Rect;
    /** The original embed definition. */
    embed: Embed;
};
export type FlowResult = {
    /** All positioned text lines. */
    lines: FlowLine[];
    /** Resolved embed positions and bounding rects. */
    embeds: ResolvedEmbed[];
    /** Total height of the laid-out content. */
    height: number;
    /** Per-character transforms from effects (only when effects are applied). */
    characterTransforms?: Array<Array<CharacterTransform>>;
};
