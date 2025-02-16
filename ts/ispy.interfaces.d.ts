import {GUIController} from 'dat.gui';
import { Scene } from 'three';

interface SubFolderReduced {
    "Selection": Array<GUIController>;
    [key: string]: Array<GUIController>;
}

export interface Ispy {
    subfoldersReduced: SubFolderReduced;
    scenes: Record<string, Scene> | undefined;
    current_event: any;
    event_list: any;
    cleanupData(arg0: any): string;
    ig_data: any;
    event_index: number;
    detector: { Collections: Record<string, any> };
    version: string;
    
    // These need to be defined before adding objects:
    POINT: number;
    LINE: number;
    BOX: number;
    SOLIDBOX: number;
    SCALEDBOX: number;
    SCALEDSOLIDBOX: number;
    SCALEDSOLIDTOWER: number;
    MODEL: number;
    
    // This is something with an associated collection (the extras) and the relationship
    // with it and the primary collection is given by association set.
    // The materials and shapes have to be specified in the drawing method.
    ASSOC: number;
    
    SHAPE: number;
    TEXT: number;
    BUFFERBOX: number;
    STACKEDTOWER: number;
}

export interface Analysis {
    file_events_summary: Map<string, EventSummary>;
    getSelectionResults: () => void;
    getSelectionCuts: () => Record<string, number>;
    getPassingEvents: () => string[];
    createCSV?: (category: string) => string;
    buildFileSummary: () => void;
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

export interface Particle {
    px: number;
    py: number;
    pz: number;
    pt: number;
    [key: string]: number | string;
}

export interface VisibleParticle extends Particle {
    E: number;
    dtype: string;
}

export interface Lepton extends VisibleParticle {
    charge: number;
}

export interface EventObject {
    Collections: Record<string, Array<Array<number | number[]>>>;
    Types: Record<string, [string, string][]>;
    [key: string]: any;
}
