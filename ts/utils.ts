// Type: TypeScript file
// Description: This file contains utility functions that are used in the analysis code.
import JSZip from "jszip";
import { Material, Object3D } from "three";

import { ispy, supportedLanguages } from "./config.js";
import { Particle, EventObject, EventSummary, MET, FourVector, SelectionFieldController } from "./ispy.interfaces.js";
import { GUI, GUIController } from "dat.gui";

const mMuon2 = 0.10566 * 0.10566;
const mElectron2 = 0.511e-3 * 0.511e-3;

declare namespace bootstrap {
  class Modal {
    static getOrCreateInstance(element: HTMLElement): Modal;
    show(): void;
    hide(): void;
  }
  class Tooltip {
    constructor(element: HTMLElement);
    show(): void;
    hide(): void;
  }
}

/**
 * Add tooltip support to the document.
 */
export function setupTooltips() {
  const triggers = [].slice.call(document.querySelectorAll("[data-bs-toggle='tooltip']"));
  triggers.forEach((el) => new bootstrap.Tooltip(el));
}

/**
 * Updates the content of the HTML elements with the provided language data.
 * @param langData An object containing key-value pairs for translation.
 */
function updateContent(element: Document | HTMLElement, langData: { [key: string]: { [key: string]: string } }) {
  element.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n") || "";
    const [namespace, keyName] = key.split(".");
    if (!namespace || !keyName) return;
    if (!(namespace in langData)) return;
    element.innerHTML = langData[namespace][keyName] || element.innerHTML;
  });
}

export function updateGUILang() {
  if (!ispy.guiLangData) return;
  const guiElem = ispy.gui.domElement;
  updateContent(guiElem, { gui: ispy.guiLangData });
}

/**
 * Sets the language preference in local storage and reloads the page.
 * @param lang The language code to set as preference.
 */
function setLanguagePreference(lang: string) {
  document.documentElement.lang = lang;
  localStorage.setItem("language", lang);
  ispy.lang = lang;
  // location.reload();
}

/**
 * Fetches language data from a JSON file.
 * @param lang The language code to fetch data for.
 * @returns A promise that resolves to the language data object.
 */
async function fetchLanguageData(lang: string): Promise<{ [key: string]: { [key: string]: string } }> {
  const response = await fetch(`assets/locales/${lang}.json`);
  return response.json();
}

/**
 * Checks if the provided language is supported, defaults to 'en' if not.
 * @param lang The language code to check.
 * @returns A valid language code.
 */
function checkLanguage(lang: string): string {
  if (supportedLanguages.includes(lang)) {
    return lang;
  }
  // check if the language has a region subtag and try to match the base language
  if (lang.split(/[-_]/).length > 1) {
    for (const l of supportedLanguages) {
      if (lang.includes(l)) {
        return l;
      }
    }
  }
  console.warn(`Language ${lang} not supported, defaulting to English.`);
  return "en";
}

/**
 * Toggles the language
 * @param lang The selected language code.
 */
export async function setLanguage(lang: string) {
  lang = checkLanguage(lang);
  setLanguagePreference(lang);
  const langData = await fetchLanguageData(lang);
  updateContent(document, langData);
  // keep the gui lang data to update them inbetween events
  ispy.guiLangData = langData["gui"];
}

/**
 * Overwride the addFolder method of dat.gui to add data-i18n attributes to the folder titles.
 * @param gui
 * @param key
 * @returns
 */
export function addFolder(gui: GUI, key: string) {
  const folder = gui.addFolder(key);
  const titleElem = folder.domElement.querySelector(".title");
  if (!titleElem) throw new Error(`Folder ${key} does not have a title element.`);
  titleElem.setAttribute("data-i18n", `gui.${key}`);
  return folder;
}

/**
 * Overwride the addController method of dat.gui to add data-i18n attributes to the controller titles.
 * @param gui
 * @param target
 * @param key
 * @param min
 * @param max
 * @param step
 * @returns
 */
export function addController<T extends object>(gui: GUI, target: T, key: keyof T, ...args: any[]) {
  const controller = gui.add(target, key, ...args);
  const titleElem = controller.domElement.parentNode?.querySelector("span.property-name");
  if (!titleElem) throw new Error(`Controller ${key.toString()} does not have a title element.`);
  titleElem.setAttribute("data-i18n", `gui.${key.toString()}`);
  return controller;
}

/**
 * Overwride the addColor method of dat.gui to add data-i18n attributes to the color controller titles.
 * @param gui
 * @param target
 * @param propName
 * @returns
 */
export function addColor(gui: GUI, target: Object, propName: string): GUIController {
  const controller = gui.addColor(target, propName);
  const titleElem = controller.domElement.parentNode?.querySelector("span.property-name");
  if (!titleElem) throw new Error(`Color controller ${propName} does not have a title element.`);
  titleElem.setAttribute("data-i18n", `gui.${propName}`);
  return controller;
}

/**
 * Checks if property exists on a given object
 * @param obj The object to check.
 * @param prop The property to check for.
 * @returns True if the property exists, false otherwise.
 */
export function hasProperty<T extends object, K extends PropertyKey>(obj: T, prop: K): obj is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Asserts that a value is defined (not null or undefined).
 * @param value The value to assert is defined.
 */
export function assertDefined<T>(value: T | undefined | null, msg = "Value is undefined or null"): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(msg);
  }
}

/**
 * Gets the current event index.
 * @returns current event index
 */
export function getCurrentIndex(): number {
  return ispy.event_index;
}

/**
 * Gets the current event object.
 * @returns the current event object
 */
export function getCurrentEvent(): EventObject | undefined {
  return ispy.current_event;
}

/**
 * Gets the particle information (kinematics and charge) for a specific particle.
 * @param key The key of the particle.
 * @param type The type information of the particle.
 * @param eventObjectData The event object data.
 * @returns The particle information.
 */
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

/**
 * Gets the four-momentum vector for a specific particle by its index.
 * @param key The key of the particle.
 * @param objectUserData The user data associated with the particle.
 * @returns The four-momentum vector and particle type.
 */
export function getFourVectorByIndex(
  key: string,
  objectUserData: { originalIndex: number; [key: string]: unknown },
): [FourVector, string?] {
  const currentEvent = getCurrentEvent();
  if (!currentEvent) {
    throw new Error("Current event is not defined.");
  }
  const type = currentEvent.Types[key];
  const eventObjectData = currentEvent.Collections[key][objectUserData.originalIndex];

  const result = getParticleInfo(key, type, eventObjectData as number[]);

  return [{ px: result.px, py: result.py, pz: result.pz, E: result.E }, result.ptype];
}

/**
 * Gets the missing transverse energy (MET) information for a specific event.
 * @param type The type information of the MET.
 * @param eventObjectData The event object data.
 * @returns The MET information.
 */
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

/**
 * Cleans up the data string by removing non-standard JSON bits.
 * @param d The data string to clean up.
 * @returns The cleaned-up data string.
 */
export function cleanupData(d: string): string {
  // rm non-standard json bits
  // newer files will not have this problem
  d = d.replace(/\(/g, "[").replace(/\)/g, "]").replace(/'/g, "\"").replace(/nan/g, "0");

  return d;
}

function getEventsSummary(event_json: EventObject): EventSummary {
  const part_names = ["TrackerMuons", "GsfElectrons", "Photons", "METs"];
  const keys = Object.keys(event_json.Collections);
  const keyMap: { [key: string]: string } = {
    TrackerMuons: "selMuons",
    GsfElectrons: "selElectrons",
    Photons: "selPhotons",
  };
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

    particles.set(keyMap[key], tmp);
  });

  return { particles: particles, met: met };
}

export class EventCollection {
  events: Map<string, EventSummary> = new Map();

  constructor();
  constructor(eventList: string[], igData: JSZip);

  /**
   * constructor for EventCollection.
   * If no parameters are provided, it initializes an empty collection.
   * @param eventList List of event paths to load.
   * @param igData The JSZip instance containing the event data.
   * @returns void
   */
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

/**
 * Shows an info bubble with the specified text at the given pointer position.
 * @param bubbleText The text to display in the info bubble.
 * @param pointer The position to display the bubble at.
 */
export function showInfoBubble(bubbleText: string, pointer: { x: number; y: number }): void {
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerText = bubbleText;
  document.body.appendChild(bubble);

  // Position the bubble at the cursor position
  bubble.style.left = `${(pointer.x * window.innerWidth) / 2 + window.innerWidth / 2}px`;
  bubble.style.top = `${(-pointer.y * window.innerHeight) / 2 + window.innerHeight / 2}px`;
}

/**
 * Removes any existing info bubble from the document.
 */
export function removeExistingBubble(): void {
  const existingBubble = document.querySelector(".bubble");
  if (existingBubble) {
    existingBubble.remove();
  }
}

/**
 * Shows a track info bubble for the intersected object.
 * @param intersectedObject The object that was intersected.
 * @param pointer The pointer position for the bubble.
 */
export function showTrackInfoBubble(intersectedObject: Object3D, pointer: { x: number; y: number }): void {
  if (intersectedObject.name.match(/Muon|Electron/i) && intersectedObject.parent && intersectedObject.parent.visible) {
    const current_event = getCurrentEvent()!;
    const matchingTrack = current_event.Collections[intersectedObject.name][intersectedObject.userData.originalIndex];
    const chargeIndex = current_event.Types[intersectedObject.name].findIndex(
      (type: [string, string]) => type[0] === "charge",
    );
    const bubbleText = `Charge: ${matchingTrack[chargeIndex]}\nPt: ${intersectedObject.userData.pt.toFixed(2)}`;

    removeExistingBubble();
    showInfoBubble(bubbleText, pointer);
  }
}

/**
 * Retrieves an HTML object by its ID if it exists else throws an error.
 * @param id The ID of the HTML object to retrieve.
 * @returns The HTML object with the specified ID.
 */
export function getHTMLObject<T extends HTMLElement>(id: string): T {
  const obj = document.getElementById(id);
  if (obj === null) {
    throw new Error(`Object with id ${id} not found.`);
  }
  return obj as T;
}

/**
 * Applies a function to each material in a mesh.
 * @param materials Materials to change.
 * @param func Function to apply to each material.
 * @returns void
 */
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

/**
 * Toggles the collapse state of a GUI folder.
 * @param key The key of the group to toggle.
 */
export function toggleCollapse(key: string) {
  const folder = ispy.gui.__folders[key];
  if (folder) {
    folder.close();
  }
}

/**
 * Toggles the expanded state of a GUI folder.
 * @param key The key of the group to toggle.
 */
export function toggleExpand(key: string) {
  const folder = ispy.gui.__folders[key];
  if (folder) {
    folder.open();
  }
}

/**
 * Toggle a dialog modal by its ID.
 * @param id The ID of the dialog modal to toggle.
 */
export function showDialog(id: string) {
  const el = getHTMLObject<HTMLElement>(id);
  bootstrap.Modal.getOrCreateInstance(el).show();
}

/**
 * Toggle a dialog modal by its ID.
 * @param id The ID of the dialog modal to toggle.
 */
export function hideDialog(id: string) {
  const el = getHTMLObject<HTMLElement>(id);
  bootstrap.Modal.getOrCreateInstance(el).hide();
}

/**
 * Create Download link for an ArrayBuffer and trigger the download.
 * @param data The ArrayBuffer data to download.
 * @param filename The name of the file to download.
 * @returns void
 */
export function downloadData(content: string, filename: string) {
  const link = document.createElement("a");
  link.style.display = "none";
  link.setAttribute("href", content);
  link.setAttribute("download", filename);
  link.setAttribute("target", "_blank");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Toggle HTML Button
 * @param button The button id to toggle.
 * @param state The state to set the button to (true = active, false = inactive).
 */
export function toggleButton(button: string, state: boolean) {
  const btn = getHTMLObject<HTMLButtonElement>(button);
  if (state) {
    btn.disabled = false;
    btn.classList.remove("disabled");
  } else {
    btn.disabled = true;
    btn.classList.add("disabled");
  }
}

/**
 * Retrieves the names of the objects in the 3D scene.
 * @returns An object containing the names of the objects in the 3D scene.
 */
function getSceneObjects(): { [key: string]: string } {
  return [
    ...(ispy.scenes?.["3D"]?.getObjectByName("Physics")?.children.map((o: Object3D) => o.name) || []),
    ...(ispy.scenes?.["3D"]?.getObjectByName("Tracking")?.children.map((o: Object3D) => o.name) || []),
  ].reduce((dic: { [key: string]: string }, o) => {
    dic[o.replace(/^(?:PAT|PF)?(.*?)_V\d$/, "$1")] = o;
    return dic;
  }, {});
}

/**
 * Adds controllers for the specified group.
 * @param group The group name to add controllers for.
 */
export function addControllers(group: string) {
  //   let color = new Color();
  //   let linewidth = 1;
  const row_obj = {
    number: 0,
    min_pt: 1.0,
    electrons: true,
    muons: true,
    photons: false,
    jets: false,
    met: false,
    minetjets: 1.0,
    additional: false,
  };

  const gui_elem = ispy.gui;

  const folder = gui_elem.__folders[group];

  const names = getSceneObjects();

  if (group.includes("momentumCut")) {
    addController(folder, row_obj, "min_pt", 0, 100).onChange(() => {
      ispy.views.forEach((v) => {
        const physic_objs = [
          ...ispy.scenes[v].getObjectByName("Physics")!.children,
          ...ispy.scenes[v].getObjectByName("Tracking")!.children,
        ].filter((o) => o.visible && hasProperty(o.children[0].userData, "pt"));

        if (!physic_objs.length) return;

        physic_objs.forEach((obj) => {
          obj.children.forEach((o) => {
            o.visible = o.userData.pt < row_obj.min_pt ? false : true;
          });
        });
      });
    });

    addController(folder, row_obj, "minetjets", 0, 200).onChange(() => {
      ispy.views.forEach((v) => {
        const physic_objs = ispy.scenes[v].getObjectByName(names["Jets"])!.children;

        if (!physic_objs.length) return;

        physic_objs.forEach((o) => {
          o.visible = o.userData.et < row_obj["minetjets"] ? false : true;
        });
      });
    });
  }

  if (group.includes("showFolder")) {
    // Helper function to toggle physics objects
    const togglePhysicsObjects = (leptongroup: string[], visibility: boolean) => {
      ispy.views.forEach((v) => {
        leptongroup.forEach((lepton) => {
          const obj = ispy.scenes[v].getObjectByName(names[lepton]);
          if (!obj) return;
          obj.visible = visibility;
        });
      });
    };

    const pt_controller = ispy.subfolders.controllers.filter((o) => o.property === "min_pt")[0];
    const jet_controller = ispy.subfolders.controllers.filter((o) => o.property === "minetjets")[0];

    addController(folder, row_obj, "electrons").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["GsfElectrons"], Boolean(this.getValue()));
      // retoggle the pt controller to update the visibility
      pt_controller.setValue(pt_controller.getValue());
    });

    addController(folder, row_obj, "muons").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["GlobalMuons", "TrackerMuons"], Boolean(this.getValue()));
      // retoggle the pt controller to update the visibility
      pt_controller.setValue(pt_controller.getValue());
    });

    addController(folder, row_obj, "photons").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["Photons"], Boolean(this.getValue()));
    });

    addController(folder, row_obj, "jets").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["Jets"], Boolean(this.getValue()));
      // retoggle the jet controller to update the visibility
      jet_controller.setValue(jet_controller.getValue());
    });

    addController(folder, row_obj, "met").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["METs"], Boolean(this.getValue()));
    });

    addController(folder, row_obj, "additional").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["Tracks"], Boolean(this.getValue()));
    });
  }

  // add all controllers to the subfolders for convenience
  (folder.__controllers as SelectionFieldController[]).forEach((c) => {
    ispy.subfolders["controllers"].push(c);
  });
}

/**
 * Adds info controllers for the specified group.
 * @param group The group name to add info controllers for.
 */
export function addInfo(group: string) {
  const gui_elem = ispy.gui;

  const folder = gui_elem.__folders[group];

  const names = getSceneObjects();
  // pt is element 1 in the collection object (inconvinient definition by design)
  const currentEvent = getCurrentEvent();
  if (!currentEvent) {
    throw new Error("Current event is not defined.");
  }
  const met_pt = currentEvent.Collections[names["METs"]][0][1] as number;

  const row_obj = {
    met: `${met_pt.toFixed(2)} GeV`,
    selectedTracks: "0",
    trackInfo: false,
  };

  addController(folder, row_obj, "met").onFinishChange(function (this: SelectionFieldController) {
    // reset to original value
    this.setValue(this.initialValue);
  });

  addController(folder, row_obj, "selectedTracks").onFinishChange(function (this: SelectionFieldController) {
    // reset to original value
    this.setValue(ispy.selected_objects.size);
  });

  addController(folder, row_obj, "trackInfo").onChange(function (this: SelectionFieldController) {
    ispy.showTrackInfo = Boolean(this.getValue());
    removeExistingBubble();
  });

  // add all controllers to the subfolders for convenience
  (folder.__controllers as SelectionFieldController[]).forEach((c) => {
    ispy.subfolders["info"].push(c);
  });
}
