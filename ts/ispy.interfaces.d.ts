import { GUIController } from "dat.gui";
import { Scene, WebGLRenderer, Plane } from "three";

interface SubFolderReduced {
  Selection: Array<GUIController>;
  [key: string]: Array<GUIController>;
}

interface Ispy {
  current_view: string | undefined;
  views: string[];
  subfoldersReduced: SubFolderReduced;
  scene: Scene | undefined;
  scenes: Record<string, Scene> | undefined;
  current_event: any;
  event_list: any;
  ig_data: any;
  event_index: number;
  detector: { Collections: Record<string, any> };
  version: string;
  animating: boolean;
  use_line2: boolean;
  renderer?: WebGLRenderer;
  global_planes?: Plane[];
  local_planes?: Plane[];
  clipgui?: GUIController;
}

interface Analysis {
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
};
