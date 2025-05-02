import {Ispy, Analysis, EventSummary} from "./ispy.interfaces";


// These need to be defined before adding objects:
const POINT = 0
const LINE = 1
const BOX = 2
const SOLIDBOX = 3
const SCALEDBOX = 4
const SCALEDSOLIDBOX = 5
const SCALEDSOLIDTOWER = 6
const MODEL = 7

// =This is something with an associated collection (the extras) and the relationship
// =with it and the primary collection is given by association set.
// The materials and shapes have to be specified in the drawing method.
const ASSOC = 8
const SHAPE = 9
const TEXT = 10
const BUFFERBOX = 11
const STACKEDTOWER = 12

export { POINT, LINE, BOX, SOLIDBOX, SCALEDBOX, SCALEDSOLIDBOX, SCALEDSOLIDTOWER, MODEL, ASSOC, SHAPE, TEXT, BUFFERBOX, STACKEDTOWER };

export const ispy: Ispy = {
  detector: { Collections: {} },
  version: "v1.0.0-UHH (dev)",
  subfoldersReduced: { Selection: [] },
  views: ["3D", "RPhi", "RhoZ"],
  current_view: undefined,
  scenes: undefined,
  scene: undefined,
  current_event: undefined,
  event_list: undefined,
  ig_data: undefined,
  event_index: 0,
  animating: false,
  use_line2: false,
};

export const analysis: Analysis = {
  file_events_summary: new Map<string, EventSummary>(),
  getSelectionCuts: function (): Record<string, any> {
    throw new Error("Function not implemented.");
  },
  getPassingEvents: function (): string[] {
    throw new Error("Function not implemented.");
  },
  checkCurrentSelection: function (): void {
    throw new Error("Function not implemented.");
  },
  getSceneObjects: function (): Record<string, string> {
    throw new Error("Function not implemented.");
  },
  getSelectionResults: function (): any {
    throw new Error("Function not implemented.");
  },
  buildFileSummary: function (): any {
    throw new Error("Function not implemented.");
  },
    
};