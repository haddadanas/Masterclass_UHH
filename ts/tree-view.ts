import { Color, LineBasicMaterial, Material, MeshBasicMaterial } from "three";
import { GUI, Controller } from "lil-gui";

import { ispy } from "./config.js";
import {
  additionalControls,
  detector_description,
  disabled,
  event_description,
  controls_groups,
} from "./objects-config.js";
import { addController, addFolder, addColor, getHTMLObject, hasProperty, getGUIFolder, getGUIController } from "./utils.js";

/**
 * Adds groups and subfolders to the GUI for better organization.
 */
function addGroups() {
  const gui = ispy.gui;
  // Add option to keep user cuts and preferences when switching between events
  addController(gui, { saveSetting: false }, "saveSetting").domElement.id = "save-setting-controller";

  addFolder(gui, "Detector").domElement.id = "detector-folder";
  addFolder(gui, "selection").domElement.id = "selection-folder";

  controls_groups.forEach((gr) => {
    addFolder(gui, gr.name).domElement.id = `${gr.name}-folder`;
  });
  const additionalFolder = addFolder(gui, "additional");
  additionalControls.forEach((gr) => {
    addFolder(additionalFolder, gr);
    ispy.additionalFolders[gr] = [];
  });

  const additionalFolderElem = additionalFolder.domElement as HTMLElement;
  additionalFolderElem?.style.setProperty("display", "none");
  const additionalControlsElem = getHTMLObject<HTMLInputElement>("js-additional-controls");
  additionalControlsElem.checked = false;

  additionalControlsElem.addEventListener("change", (event: Event) => {
    (event.target as HTMLInputElement).checked
      ? (additionalFolderElem.style.display = "block")
      : (additionalFolderElem.style.display = "none");
  });
}

/**
 * Clears all subfolders in the GUI.
 */
function clearSubfolders() {
  const subfolders = ispy.subfolders;
  const additionalFolders = ispy.additionalFolders;
  additionalControls.forEach((g) => {
    const folder = getGUIFolder(getGUIFolder(ispy.gui, "additional"), g);
    additionalFolders[g].forEach((s) => {
      getGUIFolder(folder, s).destroy();
    });
    additionalFolders[g] = [];
  });

  ["controllers", "info"].forEach((g) => {
    (subfolders[g] as Controller[]).forEach((s) => {
      s.destroy();
    });
    subfolders[g] = [];
  });
}

/**
 *
 * @param key The key to toggle visibility for.
 */
function toggle(key: string) {
  disabled[key] = !disabled[key];

  // For event information we display as simple HTML
  // so therefore not part of the scene
  if (key.includes("Event")) {
    const event_text = getHTMLObject("js-event-text");
    if (disabled[key]) {
      event_text.style.display = "none";
    } else {
      event_text.style.display = "block";
    }
  }

  ispy.views.forEach((v) => {
    const obj = ispy.scenes[v].getObjectByName(key);

    // Not every object (and therefore key) is present in
    // every scene.
    if (!obj) return;

    obj.visible = !disabled[key];

    // This is for picking. The raycaster is in layer 2.
    // In-principle this toggle will add other non-pickable
    // objects to the layer but we only check raycasting for
    // Physics objects so this is fine.
    obj.traverse((s) => {
      s.layers.toggle(2);
    });
  });
}

/**
 * Shows or hides an object in the scene.
 * @param key The key of the object to show or hide.
 * @param view The view to show or hide the object in.
 * @param show Whether to show or hide the object.
 */
function showObject(key: string, view: string, show: boolean) {
  const obj = ispy.scenes[view].getObjectByName(key);

  if (obj !== undefined) {
    obj.visible = show;
    disabled[key] = !show;

    // use getElementById to toggle since some objects from the config are checked, which have no HTML element
    const elem = document.getElementById(key) as HTMLInputElement;

    if (elem !== null) elem.checked = show;
  }
}

/**
 * Helper function to apply thicker lines for specific objects.
 * @param key The key of the object to apply thicker lines to.
 * @param sf The GUI folder to add the line width control to.
 * @param row_obj The row object containing the line width information.
 */
function applyThickerLines(
  key: string,
  sf: GUI,
  row_obj: Record<string, any>, // skipcq: JS-0323
) {
  if (
    key.includes("GEMDigis") ||
    key.includes("GEMSegments") ||
    key.includes("GEMRec") ||
    key.includes("CSCStrip") ||
    key.includes("CSCSegments") ||
    key.includes("CSCRec") ||
    key.includes("CSCWire") ||
    key.includes("RPCRec") ||
    key.includes("DTRecSegment")
  ) {
    addController(sf, row_obj, "linewidth", 1, 5).onChange(() => {
      ispy.views.forEach((v) => {
        const obj = ispy.scenes[v].getObjectByName(key);

        if (!obj) return;

        obj.children.forEach((o) => {
          if (!("material" in o)) return;
          (o.material as LineBasicMaterial).linewidth = row_obj.linewidth * 0.001;
        });
      });
    });
  }
  if (key.includes("GlobalMuon") || key.includes("Electron") || key.includes("Photon")) {
    addController(sf, row_obj, "linewidth", 1, 5).onChange(() => {
      ispy.views.forEach((v) => {
        const obj = ispy.scenes[v].getObjectByName(key);

        if (!obj) return;

        obj.children.forEach((o) => {
          if (!("material" in o)) return;
          (o.material as LineBasicMaterial).linewidth = row_obj.linewidth * 0.001;
        });
      });
    });
  }
}

/**
 * Adds an object to the selection GUI.
 * @param group The group the object belongs to.
 * @param key The key of the object to show or hide.
 * @param name The name of the object to show or hide.
 * @param _objectIds The object IDs to show or hide.
 * @param visible Whether to show or hide the object.
 */
function addSelectionRow(
  group: string,
  key: string,
  name: string,
  _objectIds: any[], // skipcq: JS-0323 --- IGNORE --- objectIds not used
  visible: boolean,
) {
  let opacity = 1.0;
  const color = new Color();
  let linewidth = 1;
  let nobjects = 0;

  const view = "3D";
  let style;
  if (hasProperty(detector_description[view], key)) {
    style = detector_description[view][key].style;
    opacity = style.opacity;
    color.set(style.color);
  }

  if (hasProperty(event_description[view], key)) {
    style = event_description[view][key].style;

    if (hasProperty(style, "opacity")) {
      opacity = style.opacity;
    }

    if (hasProperty(style, "color")) {
      color.set(style.color);
    }

    if (hasProperty(style, "linewidth")) {
      linewidth = style.linewidth;
    }

    if (ispy.current_event !== undefined) {
      nobjects = ispy.current_event.Collections[key].length;
    }
  }

  const row_obj = {
    show: visible,
    number: nobjects,
    key: key,
    opacity: opacity,
    color: `#${color.getHexString()}`,
    linewidth: linewidth,
    min_pt: 1.0,
    min_et: 10.0,
    min_energy: 10.0,
  };

  const isAdditional = additionalControls.includes(group);
  const gui = isAdditional ? getGUIFolder(ispy.gui, "additional") : ispy.gui;
  if (isAdditional) {
    ispy.additionalFolders[group].push(name);
  } else if (group === "Detector") {
    ispy.subfolders[group].push(name);
  }
  const folder = getGUIFolder(gui, group);

  const sf = addFolder(folder, name); // TODO check if works right

  if (!(group.includes("Detector") || group.includes("Imported") || group.includes("Provenance"))) {
    addController(sf, row_obj, "number");
  }

  // For Provenance, ECAL, etc. show table when clicking on
  // tab for objects in the gui
  if (
    group.includes("Provenance") ||
    group.includes("CAL") ||
    group.includes("Tracking") ||
    group.includes("Muon") ||
    group.includes("Physics")
  ) {
    sf.domElement.onclick = null;
  }

  addController(sf, row_obj, "key");

  addController(sf, row_obj, "show").onChange(() => {
    toggle(key);
  });

  // Event is not part of the scene and is
  // handled with css so no need for the rest
  if (key.includes("Event_") || group.includes("Imported")) return;

  addController(sf, row_obj, "opacity", 0, 1).onChange(() => {
    ispy.views.forEach((v) => {
      const obj = ispy.scenes[v].getObjectByName(key);

      if (!obj) return;

      obj.children.forEach((o) => {
        if (!("material" in o)) return;
        (o.material as Material).opacity = row_obj.opacity;
      });
    });
  });

  if (ispy.use_line2) {
    // This conditional could / should be improved
    applyThickerLines(key, sf, row_obj);
  }

  if (key.includes("Muons_") || key.includes("Electron") || key.includes("Tracks_")) {
    addController(sf, row_obj, "min_pt").onChange(() => {
      ispy.views.forEach((v) => {
        const obj = ispy.scenes[v].getObjectByName(key);

        if (!obj) return;

        obj.children.forEach((o) => {
          o.visible = o.userData.pt < row_obj.min_pt ? false : true;
        });
      });
    });
  }

  if (key.includes("Jet")) {
    addController(sf, row_obj, "min_et").onChange(() => {
      ispy.views.forEach((v) => {
        const obj = ispy.scenes[v].getObjectByName(key);

        if (!obj) return;

        obj.children.forEach((o) => {
          o.visible = o.userData.et < row_obj.min_et ? false : true;
        });
      });
    });
  }

  if (key.includes("Photon")) {
    addController(sf, row_obj, "min_energy").onChange(() => {
      ispy.views.forEach((v) => {
        const obj = ispy.scenes[v].getObjectByName(key);

        if (!obj) return;

        obj.children.forEach((o) => {
          o.visible = o.userData.energy < row_obj.min_energy ? false : true;
        });
      });
    });
  }

  addColor(sf, row_obj, "color").onChange(() => {
    ispy.views.forEach((v) => {
      const obj = ispy.scenes[v].getObjectByName(key);

      if (!obj) return;

      // Change color in event_decription for objects in
      // Physics group. Once they are picked (i.e. pointer over)
      // the color will revert to this new one rather than to the original
      if (group.includes("Physics")) {
        event_description[v][key].style.color = row_obj.color;
      }

      obj.children.forEach((o) => {
        o.traverse((oc) => {
          // Special case to handle
          if (oc.type === "ArrowHelper" || key.includes("MET") || key.includes("Proton")) {
            oc.children.forEach((og) => {
              if (!("material" in og)) return;
              (og.material as LineBasicMaterial | MeshBasicMaterial).color = new Color(row_obj.color);
            });
          } else {
            if (!("material" in oc)) return;
            (oc.material as LineBasicMaterial | MeshBasicMaterial).color = new Color(row_obj.color);
          }
        });
      });
    });
  });
}

/**
 * Saves the current cut settings.
 * @returns The settings saved by the user.
 */
function saveCutSettings() {
  const settings: Record<string, number | string | boolean> = {};
  const btn = getGUIController(ispy.gui, "saveSetting");
  if (btn?.getValue()) {
    const controllers = ispy.subfolders["controllers"];
    controllers.forEach((c) => {
      settings[c.property] = c.getValue();
    });
  }
  return settings;
}

/**
 * Applies the saved settings to the GUI.
 * @param settings The settings to apply.
 * @returns void
 */
function applySavedSettings(settings: Record<string, number | string | boolean>) {
  if (!Object.keys(settings).length) {
    return;
  }
  const controllers = ispy.subfolders["controllers"];
  controllers.forEach((c) => {
    if (c.property in settings) {
      c.setValue(settings[c.property]);
    }
  });
}

export { addGroups, clearSubfolders, toggle, showObject, addSelectionRow, saveCutSettings, applySavedSettings };
