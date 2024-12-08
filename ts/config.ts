import {Ispy, Analysis, EventSummary} from './ispy.interfaces';


export const ispy: Ispy = {
    detector: { Collections: {} },
    version: "v1.0.0-UHH (dev)",
    subfoldersReduced: {Selection: []},
    scenes: undefined,
    current_event: undefined,
    event_list: undefined,
    cleanupData: function (arg0: any): string {
        throw new Error('Function not implemented.');
    },
    ig_data: undefined,
    event_index: 0,
    // These need to be defined before adding objects:
    POINT: 0,
    LINE: 1,
    BOX: 2,
    SOLIDBOX: 3,
    SCALEDBOX: 4,
    SCALEDSOLIDBOX: 5,
    SCALEDSOLIDTOWER: 6,
    MODEL: 7,

    // This is something with an associated collection (the extras) and the relationship
    // with it and the primary collection is given by association set.
    // The materials and shapes have to be specified in the drawing method.
    ASSOC: 8,

    SHAPE: 9,
    TEXT: 10,
    BUFFERBOX: 11,
    STACKEDTOWER: 12,
};

export const analysis: Analysis = {
    file_events_summary: new Map<string, EventSummary>(),
    getSelectionCuts: function (): Record<string, any> {
        throw new Error('Function not implemented.');
    },
    getPassingEvents: function (): string[] {
        throw new Error('Function not implemented.');
    },
    checkCurrentSelection: function (): void {
        throw new Error('Function not implemented.');
    },
    getSceneObjects: function (): Record<string, string> {
        throw new Error('Function not implemented.');
    },
    getSelectionResults: function (): any {
        throw new Error('Function not implemented.');
    },
    buildFileSummary: function (): any {
        throw new Error('Function not implemented.');
    },
    
};