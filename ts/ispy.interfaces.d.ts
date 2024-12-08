export interface Ispy {
    subfoldersReduced: any;
    scenes: any;
    current_event: any;
    event_list: any;
    cleanupData(arg0: any): string;
    ig_data: any;
    event_index: number;
    detector: { Collections: Record<string, unknown> };
    version: string;
}

export interface Analysis {
    file_events_summary: Map<string, EventSummary>;
    getSelectionResults?: () => void;
    getSelectionCuts: () => Record<string, any>;
    getPassingEvents: () => string[];
    createCSV?: () => string;
    buildFileSummary?: () => void;
    checkCurrentSelection: () => void;
    getSceneObjects: () => Record<string, string>;
}

interface EventSummary {
    particles: Map<string, Particle[]>;
    met: Particle;
}

export interface FourVector {
    px: number;
    py: number;
    pz: number;
    E: number;
}

export interface Particle{
    px: number;
    py: number;
    pz: number;
    pt:number;
    [key: string]: number | string; // get rid of string
}

export interface VisibleParticle extends Particle {
    E: number;
    dtype: string;
}

export interface Lepton extends VisibleParticle {
    charge: number;
}


export interface EventObject {
    Collections: Record<string, Array<Array<number | number[]>>>,
    Types: Record<string, [string, string][]>,
    [key: string]: any
}
