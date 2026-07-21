export function mergeTemplate(template, overrides) {
    const merged = { ...template, ...overrides };
    if (template.embeds && overrides.embeds) {
        const overrideIds = new Set(overrides.embeds.map(embed => embed.id));
        merged.embeds = [
            ...template.embeds.filter(embed => !overrideIds.has(embed.id)),
            ...overrides.embeds,
        ];
    }
    if (typeof merged.text !== 'string' ||
        typeof merged.font !== 'string' ||
        typeof merged.width !== 'number' ||
        typeof merged.lineHeight !== 'number') {
        throw new Error('mergeTemplate: result is missing required FlowConfig fields (text, font, width, lineHeight)');
    }
    return merged;
}
export const TEMPLATES = {
    pullQuoteRight: {
        name: 'Pull quote right',
        description: 'Single right-side pull quote inset for an opening paragraph.',
        embeds: [
            {
                id: 'pullquote',
                shape: { type: 'rect', width: 200, height: 120 },
                position: { type: 'flow', paragraph: 0, progress: 0.3, side: 'right' },
                margin: 18,
            },
        ],
    },
    heroInset: {
        name: 'Hero inset',
        description: 'Centered opener for a lead image or large note block.',
        embeds: [
            {
                id: 'hero',
                shape: { type: 'rect', width: 280, height: 180 },
                position: { type: 'flow', paragraph: 0, progress: 0, side: 'center' },
                margin: 24,
            },
        ],
    },
    magazineSpread: {
        name: 'Magazine spread',
        description: 'Two opposing embeds for a denser editorial spread.',
        embeds: [
            {
                id: 'left',
                shape: { type: 'rect', width: 160, height: 200 },
                position: { type: 'flow', paragraph: 0, progress: 0.2, side: 'left' },
                margin: 16,
            },
            {
                id: 'right',
                shape: { type: 'rect', width: 160, height: 200 },
                position: { type: 'flow', paragraph: 1, progress: 0.5, side: 'right' },
                margin: 16,
            },
        ],
    },
};
