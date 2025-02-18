var ispy = ispy || {};
var analysis = analysis || {};

ispy = {
  detector: { Collections: {} },
  version: "v1.0.0-UHH (dev)",
  subfoldersReduced: { Selection: [] },
  scenes: undefined,
  current_event: undefined,
  event_list: undefined,
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

analysis = {
  file_events_summary: new Map(),
};
