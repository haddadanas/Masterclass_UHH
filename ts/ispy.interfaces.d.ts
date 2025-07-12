import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer";
import { GUI, GUIController } from "dat.gui";
import {
  Scene,
  WebGLRenderer,
  Plane,
  PerspectiveCamera,
  OrthographicCamera,
  Raycaster,
  Line,
  LineBasicMaterial,
  Vector3,
} from "three";
import JSZip from "jszip";

interface SubFolderReduced {
  Detector: string[];
  Selection: Array<GUIController>;
  Controllers: Array<GUIController>;
  Info: Array<GUIController>;
  [key: string]: Array<GUIController> | string[];
}

interface SelectionFieldController extends GUIController {
  __input: HTMLInputElement;
  initialValue: string;
  checkbox: boolean;
  property: string;
  getValue: () => number | string | boolean;
  setValue: (value: number | string | boolean) => GUIController;
}

interface EventObject {
  Collections: Record<string, Array<Array<number | number[]>>>;
  Types: Record<string, [string, string][]>;
  [key: string]: any; // skipcq: JS-0323
}

interface TrackLine extends Line {
  current_color: number;
  userData: { pt: number; originalIndex: number; [key: string]: number };
  selected: boolean;
  fourVector: FourVector;
  ptype: string;
  material: LineBasicMaterial;
}

interface EventSummary {
  particles: Map<string, Particle[]>;
  met: MET;
}

interface Ispy {
  highlighted: TrackLine | null;
  show: boolean;
  hide: boolean;
  selected_obj: string;
  selected_gltf: string;
  local_files?: FileList;
  isGeometry: boolean;
  hidden_objects: Line[];
  selected_objects: Map<number, TrackLine>;
  // File and Event Information
  file_name?: string;
  version: string;
  event_index: number;
  current_event?: EventObject;
  event_list: string[];
  ig_data: JSZip | null;
  ievent: number;
  loaded_local: boolean;

  // Rendering and Camera
  renderer?: WebGLRenderer | SVGRenderer;
  inset_renderer?: WebGLRenderer | SVGRenderer;
  renderer_name: string;
  framerate: number;
  is_perspective: boolean;
  camera?: PerspectiveCamera | OrthographicCamera;
  o_camera?: OrthographicCamera;
  p_camera?: PerspectiveCamera;
  inset_camera?: PerspectiveCamera;
  current_view: string;
  views: string[];

  // Scene and Objects
  scene?: Scene;
  scenes: Record<string, Scene>;
  inset_scene: Scene;
  global_planes: Plane[];
  local_planes: Plane[];

  // GUI and Controls
  gui: GUI;
  guiReduced: GUI;
  clipgui?: GUI;
  subfolders: Record<string, string[]>;
  subfoldersReduced: SubFolderReduced;
  controls?: OrbitControls | TrackballControls;

  // Interaction and Animation
  showTrackInfo: boolean;
  intersected: TrackLine | null;
  raycaster: Raycaster;
  animating: boolean;
  autoRotating: boolean;

  // Image and Visualization
  image_data: string | null;
  get_image_data: boolean;
  importTransparency: number;
  inverted_colors: boolean;

  // Detector and Data
  detector: { Collections: Record<string, any> }; // skipcq: JS-0323

  // Stats and Physics
  stats: Stats;
  acceleration: Vector3;
  velocity: Vector3;

  // Viewport Dimensions
  vh: number;
  vw: number;

  // Additional Features
  use_line2: boolean;
}

interface Analysis {
  file_events_summary: Map<string, EventSummary>;
}

interface MET {
  px: number;
  py: number;
  Et: number;
}
interface FourVector {
  px: number;
  py: number;
  pz: number;
  E: number;
}

interface Particle extends FourVector {
  pt: number;
  charge: number;
  ptype: string;
  index?: number;
  // [key: string]: number | string;
}

type Selection = Partial<{
  min_energy: number;
  min_pt: number;
  min_et: number;
  index: number;
}>;

type Style = {
  color: string;
} & Partial<{
  opacity: number;
  linewidth: number;
  size: number;
  scale: number;
  radius: number;
  lineCaps: string;
  ecolor: string;
  hcolor: string;
}>;

type Description = {
  group: string;
  name: string;
  type: number;
  on?: boolean;
  fn: (...args: any[]) => any; // skipcq: JS-0323
  style: {
    color: Color;
    linewidth: number;
    opacity: number;
    ecolor?: Color;
    hcolor?: Color;
    size?: number;
  };
  selection?: string;
  scale?: number;
  extra?: string;
  assoc?: string;
};

export {
  EventObject,
  Particle,
  FourVector,
  Ispy,
  Analysis,
  EventSummary,
  Selection,
  TrackLine,
  SelectionFieldController,
  MET,
  Description,
};
