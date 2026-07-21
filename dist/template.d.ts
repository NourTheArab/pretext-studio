import type { FlowConfig } from './types.js';
export type FlowTemplate = Partial<FlowConfig> & {
    name?: string;
    description?: string;
};
export declare function mergeTemplate(template: FlowTemplate, overrides: Partial<FlowConfig>): FlowConfig;
export declare const TEMPLATES: {
    pullQuoteRight: {
        name: string;
        description: string;
        embeds: {
            id: string;
            shape: {
                type: "rect";
                width: number;
                height: number;
            };
            position: {
                type: "flow";
                paragraph: number;
                progress: number;
                side: "right";
            };
            margin: number;
        }[];
    };
    heroInset: {
        name: string;
        description: string;
        embeds: {
            id: string;
            shape: {
                type: "rect";
                width: number;
                height: number;
            };
            position: {
                type: "flow";
                paragraph: number;
                progress: number;
                side: "center";
            };
            margin: number;
        }[];
    };
    magazineSpread: {
        name: string;
        description: string;
        embeds: ({
            id: string;
            shape: {
                type: "rect";
                width: number;
                height: number;
            };
            position: {
                type: "flow";
                paragraph: number;
                progress: number;
                side: "left";
            };
            margin: number;
        } | {
            id: string;
            shape: {
                type: "rect";
                width: number;
                height: number;
            };
            position: {
                type: "flow";
                paragraph: number;
                progress: number;
                side: "right";
            };
            margin: number;
        })[];
    };
};
