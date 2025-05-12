import { GUI } from "dat.gui";
import { Scene, WebGLRenderer, Plane, PerspectiveCamera, OrthographicCamera, Raycaster } from "three";
import { GUIController } from "dat.gui";

interface SubFolderReduced {
  Selection: Array<GUIController>;
  [key: string]: Array<GUIController>;
}

interface Ispy {
  // File and Event Information
  file_name?: string;
  version: string;
  event_index: number;
  current_event?: any;
  event_list?: any;
  ig_data?: any;

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
  intersected: Set<any> | null;
  raycaster: Raycaster;
  animating: boolean;
  autoRotating: boolean;

  // Image and Visualization
  image_data: string | null;
  get_image_data: boolean;
  importTransparency: number;
  inverted_colors: boolean;

  // Detector and Data
  detector: { Collections: Record<string, any> };

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

interface EventSummary {
  particles: Map<string, Particle[]>;
  met: Particle;
}

interface FourVector {
  px: number;
  py: number;
  pz: number;
  E: number;
}

interface Particle {
  px: number;
  py: number;
  pz: number;
  pt: number;
  [key: string]: number | string;
}

interface VisibleParticle extends Particle {
  E: number;
  dtype: string;
}

interface Lepton extends VisibleParticle {
  charge: number;
}

interface EventObject {
  Collections: Record<string, Array<Array<number | number[]>>>;
  Types: Record<string, [string, string][]>;
  [key: string]: any;
}

type Selection = Partial<{
  min_energy: number;
  min_pt: number;
  min_et: number;
  index: number;
}>;

type DetectorCollectionEntry = [number, ...(number[] | number[][])];

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

interface SelectionFieldController extends GUIController {
  initialValue: string;
  checkbox: boolean;
  __input: HTMLInputElement;
}

export {
  EventObject,
  Particle,
  Lepton,
  VisibleParticle,
  FourVector,
  Ispy,
  Analysis,
  EventSummary,
  Selection,
  DetectorCollectionEntry,
  Style,
  SelectionFieldController,
};
