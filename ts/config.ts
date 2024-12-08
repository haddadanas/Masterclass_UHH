import {Ispy, Analysis, EventSummary} from './ispy.interfaces';


export const ispy: Ispy = {
    detector: { Collections: {} },
    version: "v1.0.0-UHH (dev)",
    subfoldersReduced: undefined,
    scenes: undefined,
    current_event: undefined,
    event_list: undefined,
    cleanupData: function (arg0: any): string {
        throw new Error('Function not implemented.');
    },
    ig_data: undefined,
    event_index: 0
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
    }
};