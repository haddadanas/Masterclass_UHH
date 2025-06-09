import { Color, LineBasicMaterial, Material, MeshBasicMaterial } from "three";

import { ispy } from "./config";
import { data_groups, detector_description, disabled, event_description, reduced_data_groups } from "./objects-config";
import { getHTMLObject, removeExistingBubble } from "./utils";
import { getSceneObjects } from "./uhh_selection";
import { SelectionFieldController } from "./ispy.interfaces";

function addGroups() {
  // Add option to keep user cuts and preferences when switching between events
  ispy.guiReduced.add({ "Keep Settings": false }, "Keep Settings");

  ispy.gui.addFolder("Detector");
  ispy.gui.addFolder("Imported");

  ispy.guiReduced.addFolder("Detector");
  ispy.guiReduced.addFolder("Event Selection");

  // create subfolders to access controllers and objects easily, since we have a lot of them
  ispy.subfolders.Detector = [];
  ispy.subfolders.Imported = [];

  ispy.subfoldersReduced.Detector = [];
  ispy.subfoldersReduced["Controllers"] = [];
  ispy.subfoldersReduced["Info"] = [];
  ispy.subfoldersReduced["Selection"] = [];

  data_groups.forEach((gr) => {
    ispy.gui.addFolder(gr);
    ispy.subfolders[gr] = [];
  });

  reduced_data_groups.forEach((gr) => {
    ispy.guiReduced.addFolder(gr.name);
  });
}

function clearSubfolders() {
  data_groups.forEach((g) => {
    const folder = ispy.gui.__folders[g];

    ispy.subfolders[g].forEach((s) => {
      folder.removeFolder(folder.__folders[s]);
    });

    ispy.subfolders[g] = [];
  });

  ["Controllers", "Info"].forEach((g) => {
    ispy.subfoldersReduced[g].forEach((s) => {
      s.remove();
    });
    ispy.subfoldersReduced[g] = [];
  });
}

function toggle(key: string) {
  disabled[key] = !disabled[key];

  // For event information we display as simple HTML
  // so therefore not part of the scene
  if (key.includes("Event")) {
    const event_text = getHTMLObject("event-text");
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

function showObject(key: string, view: string, show: boolean) {
  const obj = ispy.scenes[view].getObjectByName(key);

  if (obj !== undefined) {
    obj.visible = show;
    disabled[key] = !show;

    const elem = getHTMLObject(key) as HTMLInputElement;

    if (elem != null) elem.checked = show;
  }
}

function addSelectionRow(group: string, key: string, name: string, _objectIds: any[], visible: boolean) {
  let opacity = 1.0;
  const color = new Color();
  let linewidth = 1;
  let nobjects = 0;

  const view = "3D";
  let style;
  if (detector_description[view].hasOwnProperty(key)) {
    style = detector_description[view][key].style;
    opacity = style.opacity;
    color.set(style.color);
  }

  if (event_description[view].hasOwnProperty(key)) {
    style = event_description[view][key].style;

    if (style.hasOwnProperty("opacity")) {
      opacity = style.opacity;
    }

    if (style.hasOwnProperty("color")) {
      color.set(style.color);
    }

    if (style.hasOwnProperty("linewidth")) {
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

  const guis = [ispy.gui];
  ispy.subfolders[group].push(name);
  if (group === "Detector") {
    guis.splice(1, 0, ispy.guiReduced);
    ispy.subfoldersReduced[group].push(name);
  }
  guis.forEach((gui_elem) => {
    const folder = gui_elem.__folders[group];

    const sf = folder.addFolder(name); // TODO check if works right

    if (!(group.includes("Detector") || group.includes("Imported") || group.includes("Provenance"))) {
      sf.add(row_obj, "number");
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

    sf.add(row_obj, "key");

    sf.add(row_obj, "show").onChange(() => {
      toggle(key);
    });

    // Event is not part of the scene and is
    // handled with css so no need for the rest
    if (key.includes("Event_") || group.includes("Imported")) return;

    sf.add(row_obj, "opacity", 0, 1).onChange(() => {
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
        sf.add(row_obj, "linewidth", 1, 5).onChange(() => {
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

    if (ispy.use_line2) {
      if (key.includes("GlobalMuon") || key.includes("Electron") || key.includes("Photon")) {
        sf.add(row_obj, "linewidth", 1, 5).onChange(() => {
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

    if (key.includes("Muons_") || key.includes("Electron") || key.includes("Tracks_")) {
      sf.add(row_obj, "min_pt").onChange(() => {
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
      sf.add(row_obj, "min_et").onChange(() => {
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
      sf.add(row_obj, "min_energy").onChange(() => {
        ispy.views.forEach((v) => {
          const obj = ispy.scenes[v].getObjectByName(key);

          if (!obj) return;

          obj.children.forEach((o) => {
            o.visible = o.userData.energy < row_obj.min_energy ? false : true;
          });
        });
      });
    }

    sf.addColor(row_obj, "color").onChange(() => {
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
                (og.material as LineBasicMaterial | MeshBasicMaterial).color = new Color(
                  row_obj.color,
                );
              });
            } else {
              if (!("material" in oc)) return;
              (oc.material as LineBasicMaterial | MeshBasicMaterial).color = new Color(row_obj.color);
            }
          });
        });
      });
    });
  });
}

function addControllers(group: string) {
  //   let color = new Color();
  //   let linewidth = 1;
  const row_obj = {
    number: 0,
    min_pt: 1.0,
    Electrons: true,
    Muons: true,
    Photons: true,
    Jets: false,
    MET: false,
    "Jet: min Et": 1.0,
    "Additional Tracks": true,
  };

  const gui_elem = ispy.guiReduced;

  const folder = gui_elem.__folders[group];

  const names = getSceneObjects();

  if (group.includes("Momentum Cut (GeV)")) {
    folder
      .add(row_obj, "min_pt", 0, 100)
      .name("min. p<sub>T, visible</sub>")
      .onChange(() => {
        ispy.views.forEach((v) => {
          const physic_objs = [
            ...ispy.scenes[v].getObjectByName("Physics")!.children,
            ...ispy.scenes[v].getObjectByName("Tracking")!.children,
          ].filter((o) => o.visible && o.children[0].userData.hasOwnProperty("pt"));

          if (!physic_objs.length) return;

          physic_objs.forEach((obj) => {
            obj.children.forEach((o) => {
              o.visible = o.userData.pt < row_obj.min_pt ? false : true;
            });
          });
        });
      });

    folder
      .add(row_obj, "Jet: min Et", 0, 200)
      .name("min. E<sub>T, Jets</sub>")
      .onChange(() => {
        ispy.views.forEach((v) => {
          const physic_objs = ispy.scenes[v].getObjectByName(names["Jets"])!.children;

          if (!physic_objs.length) return;

          physic_objs.forEach((o) => {
            o.visible = o.userData.et < row_obj["Jet: min Et"] ? false : true;
          });
        });
      });
  }

  if (group.includes("Show/Hide")) {
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

    const pt_controller = ispy.subfoldersReduced.Controllers.filter((o) => o.property === "min_pt")[0];
    const jet_controller = ispy.subfoldersReduced.Controllers.filter((o) => o.property === "Jet: min Et")[0];

    folder.add(row_obj, "Electrons").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["GsfElectrons"], this.getValue());
      // retoggle the pt controller to update the visibility
      pt_controller.setValue(pt_controller.getValue());
    });

    folder.add(row_obj, "Muons").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["GlobalMuons", "TrackerMuons"], this.getValue());
      // retoggle the pt controller to update the visibility
      pt_controller.setValue(pt_controller.getValue());
    });

    folder.add(row_obj, "Photons").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["Photons"], this.getValue());
    });

    folder.add(row_obj, "Jets").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["Jets"], this.getValue());
      // retoggle the jet controller to update the visibility
      jet_controller.setValue(jet_controller.getValue());
    });

    folder.add(row_obj, "MET").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["METs"], this.getValue());
    });

    folder.add(row_obj, "Additional Tracks").onChange(function (this: SelectionFieldController) {
      togglePhysicsObjects(["Tracks"], this.getValue());
    });
  }

  // add all controllers to the reduced subfolders for convenience
  folder.__controllers.forEach((c) => {
    ispy.subfoldersReduced["Controllers"].push(c);
  });
}

function addInfo(group: string) {
  const gui_elem = ispy.guiReduced;

  const folder = gui_elem.__folders[group];

  const names = getSceneObjects();
  // pt is element 1 in the collection object (inconvinient definition by design)
  const met_pt = ispy.current_event.Collections[names["METs"]][0][1];

  const row_obj = {
    MET: `${met_pt.toFixed(2)} GeV`,
    Sel: "0",
    track: false,
  };

  folder.add(row_obj, "MET").onFinishChange(function (this: SelectionFieldController) {
    // reset to original value
    this.setValue(this.initialValue);
  });

  folder
    .add(row_obj, "Sel")
    .name("Selected Tracks")
    .onFinishChange(function (this: SelectionFieldController) {
      // reset to original value
      this.setValue(ispy.selected_objects.size);
    });

  folder
    .add(row_obj, "track")
    .name("Track Info")
    .onChange(function (this: SelectionFieldController) {
      ispy.showTrackInfo = this.getValue();
      removeExistingBubble();
    });

  // add all controllers to the reduced subfolders for convenience
  folder.__controllers.forEach((c) => {
    ispy.subfoldersReduced["Info"].push(c);
  });
}

function saveCutSettings() {
  const settings: Record<string, any> = {};
  const btn = ispy.guiReduced.__controllers.find((o) => o.property === "Keep Settings");
  if (btn?.getValue()) {
    const controllers = ispy.subfoldersReduced["Controllers"];
    controllers.forEach((c) => {
      settings[c.property] = c.getValue();
    });
  }
  return settings;
}

function applySavedSettings(settings: any) {
  if (!Object.keys(settings).length) {
    return;
  }
  const controllers = ispy.subfoldersReduced["Controllers"];
  controllers.forEach((c) => {
    if (c.property in settings) {
      c.setValue(settings[c.property]);
    }
  });
}

export {
  addGroups,
  clearSubfolders,
  toggle,
  showObject,
  addSelectionRow,
  addControllers,
  addInfo,
  saveCutSettings,
  applySavedSettings,
};
