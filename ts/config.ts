import { GUI } from "dat.gui";
import { Raycaster, Scene, Vector3 } from "three";
import Stats from "stats.js";

import { Ispy, Analysis, EventSummary, TrackLine } from "./ispy.interfaces";

// These need to be defined before adding objects:
const POINT = 0;
const LINE = 1;
const BOX = 2;
const SOLIDBOX = 3;
const SCALEDBOX = 4;
const SCALEDSOLIDBOX = 5;
const SCALEDSOLIDTOWER = 6;
const MODEL = 7;

// =This is something with an associated collection (the extras) and the relationship
// =with it and the primary collection is given by association set.
// The materials and shapes have to be specified in the drawing method.
const ASSOC = 8;
const SHAPE = 9;
const TEXT = 10;
const BUFFERBOX = 11;
const STACKEDTOWER = 12;

export {
  POINT,
  LINE,
  BOX,
  SOLIDBOX,
  SCALEDBOX,
  SCALEDSOLIDBOX,
  SCALEDSOLIDTOWER,
  MODEL,
  ASSOC,
  SHAPE,
  TEXT,
  BUFFERBOX,
  STACKEDTOWER,
};

export const ispy: Ispy = {
  // Metadata and versioning
  version: "v1.0.0-UHH (dev)",
  file_name: undefined,
  event_list: [],
  ig_data: null,
  ievent: 0,
  loaded_local: false,

  // Detector and collections
  detector: { Collections: {} },
  subfoldersReduced: {
    Selection: [],
    Detector: [],
    Controllers: [],
    Info: [],
  },
  subfolders: {},

  // Views and rendering settings
  views: ["3D", "RPhi", "RhoZ"],
  current_view: "",
  is_perspective: true,
  renderer_name: "",
  inverted_colors: false,
  importTransparency: 0.75,
  isGeometry: false,

  // Animation and interaction
  event_index: 0,
  animating: false,
  autoRotating: false,
  framerate: 30,
  acceleration: new Vector3(0, 0, 0),
  velocity: new Vector3(0, 0, 0),

  // Track and object interaction
  showTrackInfo: false,
  intersected: null,
  raycaster: new Raycaster(),
  hidden_objects: [],
  selected_objects: new Map<number, TrackLine>(),

  // Planes and clipping
  global_planes: [],
  local_planes: [],

  // Image and rendering data
  get_image_data: false,
  image_data: null,

  // GUI and stats
  guiReduced: new GUI({
    name: "Controls Reduced",
    hideable: false,
    autoPlace: false,
  }),
  gui: new GUI({
    name: "Controls",
    hideable: false,
    autoPlace: false,
  }),
  stats: new Stats(),

  // Scenes and rendering
  inset_scene: new Scene(),
  scenes: {},

  // Experimental features
  use_line2: false,
  vh: 0,
  vw: 0,
  selected_obj: "",
  selected_gltf: "",
  highlighted: undefined,
  show: false,
  hide: false,
};

export const analysis: Analysis = {
  file_events_summary: new Map<string, EventSummary>(),
};
