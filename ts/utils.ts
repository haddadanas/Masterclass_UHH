// Type: TypeScript file
// Description: This file contains utility functions that are used in the analysis code.
import JSZip from "jszip";
import { Material } from "three";

import { ispy } from "./config.js";

import { Particle, EventObject, EventSummary, MET, FourVector } from "./ispy.interfaces.js";

const mMuon2 = 0.10566 * 0.10566;
const mElectron2 = 0.511e-3 * 0.511e-3;

export function getCurrentIndex(): number {
  return ispy.event_index;
}

export function getCurrentEvent(): EventObject {
  return ispy.current_event;
}

export function getParticleInfo(key: string, type: [string, string][], eventObjectData: number[]): Particle {
  const isMuon = key.includes("Muon");
  const isElectron = key.includes("Electron");
  const isPhoton = key.includes("Photon");

  if (!(isMuon || isElectron || isPhoton)) {
    throw new Error(`Unknown particle type: ${key}, only Muon, Electron, and Photon are supported.`);
  }

  let pt: number, eta: number, phi: number, charge: number, ptype: string;
  let E: number;

  pt = eta = phi = charge = E = 0;
  ptype = "";

  for (const [index, t] of type.entries()) {
    if (t[0] === "pt") {
      pt = eventObjectData[index];
    } else if (t[0] === "energy") {
      E = eventObjectData[index];
    } else if (t[0] === "eta") {
      eta = eventObjectData[index];
    } else if (t[0] === "phi") {
      phi = eventObjectData[index];
    } else if (t[0] === "charge") {
      charge = eventObjectData[index];
    }
  }

  if (!pt) {
    pt = E / Math.cosh(eta);
  }

  const px: number = pt * Math.cos(phi);
  const py: number = pt * Math.sin(phi);
  const pz: number = pt * Math.sinh(eta);

  if (isPhoton) {
    return { E: E, px: px, py: py, pz: pz, pt: pt, ptype: "Photon", charge: 0 };
  }

  E = 0;

  if (isMuon) {
    E += mMuon2;
    ptype = "Muon";
  }

  if (isElectron) {
    E += mElectron2;
    ptype = "Electron";
  }

  E += pt * pt * Math.cosh(eta) * Math.cosh(eta);
  E = Math.sqrt(E);

  return { E: E, px: px, py: py, pz: pz, pt: pt, charge: charge, ptype: ptype };
}

export function getFourVectorByIndex(
  key: string,
  objectUserData: { originalIndex: number; [key: string]: any },
): [FourVector, string?] {
  const type = getCurrentEvent().Types[key];
  const eventObjectData = getCurrentEvent().Collections[key][objectUserData.originalIndex];

  const result = getParticleInfo(key, type, eventObjectData as number[]);

  return [{ px: result.px, py: result.py, pz: result.pz, E: result.E }, result.ptype];
}

export function getMetInformation(type: [string, string][], eventObjectData: number[]): MET {
  let pt: number, px: number, py: number;

  pt = px = py = 0;

  for (const [index, t] of type.entries()) {
    if (t[0] === "pt") {
      pt = eventObjectData[index];
    } else if (t[0] === "px") {
      px = eventObjectData[index];
    } else if (t[0] === "py") {
      py = eventObjectData[index];
    }
  }

  return { Et: pt, px: px, py: py };
}

export function cleanupData(d: string): string {
  // rm non-standard json bits
  // newer files will not have this problem
  d = d.replace(/\(/g, "[").replace(/\)/g, "]").replace(/\'/g, '"').replace(/nan/g, "0");

  return d;
}

function getEventsSummary(event_json: EventObject): EventSummary {
  const part_names = ["TrackerMuons", "GsfElectrons", "Photons", "METs"];
  const keys = Object.keys(event_json.Collections);
  const map = part_names.map((name) => keys.filter((k) => k.includes(name)).reduce((x, y) => (x > y ? x : y)));

  const particles = new Map<string, Particle[]>();
  let met: MET = { px: 0, py: 0, Et: 0 };
  map.forEach((collec) => {
    const type = event_json.Types[collec];
    const key = collec.replace(/^(?:PAT|PF)?(.*?)_V\d$/, "$1");
    if (collec.includes("MET")) {
      met = getMetInformation(type, event_json.Collections[collec][0] as number[]);
      return;
    }
    const tmp = new Array<Particle>();
    event_json.Collections[collec].forEach((part) => {
      tmp.push(getParticleInfo(collec, type, part as number[]));
    });

    particles.set(key, tmp);
  });

  return { particles: particles, met: met };
}

export class EventCollection {
  events: Map<string, EventSummary> = new Map();

  constructor();
  constructor(eventList: string[], igData: JSZip);

  constructor(eventList?: string[], igData?: JSZip) {
    if (eventList === undefined || igData === undefined) {
      return;
    }
    // get the event data
    eventList.forEach((event_path, event_index) => {
      const eventFile = igData.file(event_path);
      if (eventFile === null) {
        alert(`Error encountered reading event ${event_index + 1}: ${event_path} not found.`);
        alert("The event will be skipped in the analysis.");
        return;
      }
      eventFile.async("string").then(
        (rawText) => {
          // TODO check if await is needed
          const _event = JSON.parse(cleanupData(rawText));
          this.events.set(event_index.toString(), getEventsSummary(_event));
        },
        (err) => {
          alert(`Error encountered parsing event ${event_index + 1}: ${err}`);
          alert("The event will be skipped in the analysis.");
        },
      );
    });
  }
}

export function showInfoBubble(bubbleText: string, pointer: { x: number; y: number }): void {
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerText = bubbleText;
  document.body.appendChild(bubble);

  // Position the bubble at the cursor position
  bubble.style.left = `${(pointer.x * window.innerWidth) / 2 + window.innerWidth / 2}px`;
  bubble.style.top = `${(-pointer.y * window.innerHeight) / 2 + window.innerHeight / 2}px`;
}

export function removeExistingBubble(): void {
  const existingBubble = document.querySelector(".bubble");
  if (existingBubble) {
    existingBubble.remove();
  }
}

export function getHTMLObject(id: string): HTMLElement {
  const obj = document.getElementById(id);
  if (obj === null) {
    throw new Error(`Object with id ${id} not found.`);
  }
  return obj;
}

export function changeMeshMaterials(materials: Material | Material[] | undefined, func: (m: Material) => void) {
  if (!materials) {
    return;
  }
  if (!Array.isArray(materials)) {
    func(materials);
    return;
  }
  materials.forEach((material) => {
    func(material);
  });
}

export function toggleCollapse(key: string) {
  const guis = [ispy.gui];
  if (key === "Detector") {
    guis.push(ispy.guiReduced);
  }
  guis.forEach((gui) => {
    const folder = gui.__folders[key];
    if (folder) {
      folder.close();
    }
  });
}
