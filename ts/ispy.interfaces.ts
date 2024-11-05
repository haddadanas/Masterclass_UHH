export interface Ispy {
    subfoldersReduced: any;
    scenes: any;
    current_event: any;
    event_list: any;
    cleanupData(arg0: any): string;
    ig_data: any;
    getMetInformation(type: any, arg1: any): any;
    getFourVector(collec: string, type: any, part: any): any;
    event_index: number;
    detector: { Collections: Record<string, unknown> };
    version: string;
    POINT: number;
    LINE: number;
    BOX: number;
    SOLIDBOX: number;
    SCALEDBOX: number;
    SCALEDSOLIDBOX: number;
    SCALEDSOLIDTOWER: number;
    MODEL: number;
    ASSOC: number;
    SHAPE: number;
    TEXT: number;
    BUFFERBOX: number;
    STACKEDTOWER: number;
}

export interface Analysis {
    file_events_summary: Map<number, Map<string, ParticleCollection>>;
    getSelectionResults?: () => void;
    getSelectionCuts?: () => Record<string, any>;
    getPassingEvents?: () => number[];
    createCSV?: () => string;
    buildFileSummary?: () => void;
    checkCurrentSelection?: () => void;
    getSceneObjects?: () => Record<string, string>;
}

interface ParticleCollection {
    ptype: string;
    [key: string]: number | string;
}