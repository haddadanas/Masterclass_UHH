import {
  Object3D,
  LineSegments,
  MeshBasicMaterial,
  DoubleSide,
  Mesh,
  Points,
  PointsMaterial,
  BufferGeometry,
  Color,
  LineBasicMaterial,
  Line,
} from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import $ from "jquery";

import {
  POINT,
  LINE,
  BOX,
  SOLIDBOX,
  SCALEDSOLIDBOX,
  SCALEDSOLIDTOWER,
  ASSOC,
  SHAPE,
  TEXT,
  STACKEDTOWER,
  ispy,
} from "./config.js";
import {
  data_groups,
  detector_description,
  disabled,
  event_description,
  reduced_data_groups,
} from "./objects-config.js";
import { addSelectionRow, applySavedSettings, clearSubfolders, saveCutSettings } from "./tree-view.js";
import { showView } from "./display.js";
import { EventObject, Description } from "./ispy.interfaces.js";
import { assertDefined } from "./utils.js";

type DataArray = (number | number[] | string)[][];

/**
 * Adds an object to the specified scene group.
 * @param key The key of the group to add the object to.
 * @param obj The object to add.
 * @return void
 */
function addToSceneObject(key: string, obj: Object3D): void {
  const groupObject = ispy.scene?.getObjectByName(key);
  if (groupObject) {
    groupObject.add(obj);
  } else {
    console.warn(`Group object '${key}' not found in the scene.`);
  }
}

/**
 * Adds the detector geometry to the scene. (Deprecated)
 */
function addDetector() {
  for (const key of Object.keys(detector_description)) {
    // TODO: check if same as before!
    const data = ispy.detector.Collections[key];

    if (!data || data.length === 0) {
      continue;
    }

    const descr = detector_description[key];

    // If something is already disabled via the toggle then this
    // should override what comes from the description
    // -- However it is not used in addSelectionRow()? - C
    const visible = !disabled[key] ? (descr.on = true) : (descr.on = false);
    addSelectionRow(descr.group, key, descr.name, [], visible);

    const obj = new Object3D();
    obj.name = key;
    obj.visible = visible;
    assertDefined(ispy.scene, "Scene is not defined");
    addToSceneObject(descr.group, obj);

    const ocolor = new Color(descr.style.color);
    const transp = true;

    switch (descr.type) {
      case BOX: {
        const box_material = new LineBasicMaterial({
          color: ocolor,
          transparent: transp,
          linewidth: descr.style.linewidth,
          depthWrite: false,
          opacity: descr.style.opacity,
          clippingPlanes: ispy.local_planes,
        });

        const box_geometries = [];

        for (const entry of Object.values(data)) {
          box_geometries.push(descr.fn(entry));
        }

        const box = new LineSegments(BufferGeometryUtils.mergeBufferGeometries(box_geometries), box_material);

        box.name = key;
        box.renderOrder = 1;
        addToSceneObject(key, box);

        break;
      }
      case SOLIDBOX: {
        const solidbox_material = new MeshBasicMaterial({
          color: ocolor,
          transparent: transp,
          opacity: descr.style.opacity,
          depthTest: false,
          clippingPlanes: ispy.local_planes,
        });

        solidbox_material.side = DoubleSide;

        const boxes = [];
        const lines = [];

        for (const entry of Object.values(data)) {
          const bl = descr.fn(entry);

          if (bl.length === 0) continue;

          boxes.push(bl[0]);
          lines.push(bl[1]);
        }

        const meshes = new Mesh(BufferGeometryUtils.mergeBufferGeometries(boxes), solidbox_material);

        meshes.name = key;
        meshes.renderOrder = 1;
        addToSceneObject(key, meshes);

        const line_material = new LineBasicMaterial({
          color: 0x000000,
          transparent: false,
          linewidth: 1,
          depthTest: false,
        });

        const line_mesh = new LineSegments(BufferGeometryUtils.mergeBufferGeometries(lines), line_material);

        line_mesh.name = key;
        addToSceneObject(key, line_mesh);

        break;
      }
      default: {
        console.warn(`Detector type '${descr.type}' is not implemented.`);
      }
    }
  }
}

function addBoxToScene(data: DataArray, key: string, descr: Description, ocolor: Color, transp: boolean) {
  const boxes = [];

  for (const entry of Object.values(data)) {
    boxes.push(descr.fn(entry));
  }

  const line = new LineSegments(
    BufferGeometryUtils.mergeBufferGeometries(boxes),
    new LineBasicMaterial({
      color: ocolor,
      transparent: transp,
      linewidth: descr.style.linewidth,
      opacity: descr.style.opacity,
    }),
  );

  line.name = key;
  addToSceneObject(key, line);
}

function addSolidBoxToScene(data: DataArray, key: string, descr: Description, ocolor: Color, transp: boolean) {
  const sboxes = [];
  const slines = [];

  for (const entry of Object.values(data)) {
    const bl = descr.fn(entry);

    if (bl.length === 1) {
      sboxes.push(bl[0]);
    }

    if (bl.length === 2) {
      sboxes.push(bl[0]);
      slines.push(bl[1]);
    }
  }

  const solidbox_material = new MeshBasicMaterial({
    color: ocolor,
    transparent: transp,
    opacity: descr.style.opacity,
    depthTest: false,
    depthWrite: false,
  });

  solidbox_material.side = DoubleSide;

  const smeshes = new Mesh(BufferGeometryUtils.mergeBufferGeometries(sboxes), solidbox_material);

  smeshes.name = key;
  addToSceneObject(key, smeshes);

  if (slines.length > 0) {
    const sline_material = new LineBasicMaterial({
      color: 0xcccccc,
      transparent: false,
      linewidth: 1,
      depthTest: false,
    });
    const sline_mesh = new LineSegments(BufferGeometryUtils.mergeBufferGeometries(slines), sline_material);
    sline_mesh.name = key;
    addToSceneObject(key, sline_mesh);
  }
}

function addScaledSolidBoxToScene(
  data: DataArray,
  key: string,
  descr: Description,
  ocolor: Color,
  transp: boolean,
) {
  const ss_boxes: BufferGeometry[] = [];
  let maxEnergy = 0.0;

  for (const entry of Object.values(data)) {
    if (Array.isArray(entry)) {
      const energy = entry[0] as number;

      if (energy > maxEnergy) maxEnergy = energy;
    }
  }

  for (const entry of Object.values(data)) {
    descr.fn(entry, ss_boxes, maxEnergy, descr.selection);
  }

  if (ss_boxes.length > 0) {
    const ssb_material = new MeshBasicMaterial({
      color: ocolor,
      transparent: transp,
      opacity: descr.style.opacity,
    });
    ssb_material.side = DoubleSide;
    const ssb_meshes = new Mesh(BufferGeometryUtils.mergeBufferGeometries(ss_boxes), ssb_material);
    ssb_meshes.name = key;
    addToSceneObject(key, ssb_meshes);
  }
}

function addScaledSolidTowerToScene(
  data: DataArray,
  key: string,
  descr: Description,
  ocolor: Color,
  transp: boolean,
) {
  const sst_boxes: BufferGeometry[] = [];
  let maxE = 0.0;

  for (const entry of Object.values(data)) {
    if (Array.isArray(entry)) {
      const energy = entry[0] as number;

      if (energy > maxE) maxE = energy;
    }
  }

  for (const entry of Object.values(data)) {
    descr.fn(entry, sst_boxes, maxE, descr.selection);
  }

  if (sst_boxes.length > 0) {
    const sst_material = new MeshBasicMaterial({
      color: ocolor,
      transparent: transp,
      opacity: descr.style.opacity,
    });

    sst_material.side = DoubleSide;

    const sst_meshes = new Mesh(BufferGeometryUtils.mergeBufferGeometries(sst_boxes), sst_material);

    sst_meshes.name = key;
    addToSceneObject(key, sst_meshes);
  }
}

function addStackedTowerToScene(
  data: DataArray,
  key: string,
  descr: Description,
  transp: boolean,
  is_physics_obj: boolean,
  visible: boolean,
) {
  const eboxes: BufferGeometry[] = [];
  const hboxes: BufferGeometry[] = [];

  for (const entry of Object.values(data)) {
    descr.fn(entry, eboxes, hboxes, descr.scale, descr.selection);
  }

  const ematerial = new MeshBasicMaterial({
    color: new Color(descr.style.ecolor),
    transparent: transp,
    opacity: descr.style.opacity,
  });

  const hmaterial = new MeshBasicMaterial({
    color: new Color(descr.style.hcolor),
    transparent: transp,
    opacity: descr.style.opacity,
  });

  ematerial.side = DoubleSide;
  hmaterial.side = DoubleSide;

  const emeshes = new Mesh(BufferGeometryUtils.mergeBufferGeometries(eboxes), ematerial);

  const hmeshes = new Mesh(BufferGeometryUtils.mergeBufferGeometries(hboxes), hmaterial);

  emeshes.name = key;
  hmeshes.name = key;

  if (is_physics_obj && visible) {
    emeshes.layers.enable(2);
    hmeshes.layers.enable(2);
  }

  addToSceneObject(key, emeshes);
  addToSceneObject(key, hmeshes);
}

function addAssocToScene(
  data: DataArray,
  key: string,
  descr: Description,
  extra: (number | number[])[][] | null,
  assoc: [number, number][],
  is_physics_obj: boolean,
  visible: boolean,
  objectIds: number[],
) {
  const objs = descr.fn(data, extra, assoc, descr.style, descr.selection);

  if (objs !== undefined) {
    objs.forEach((obj: Object3D, index: number) => {
      obj.name = key;

      if (is_physics_obj && visible) {
        obj.layers.enable(2);
      }

      obj.userData.originalIndex = index;
      objectIds.push(obj.id);
      addToSceneObject(key, obj);
    });
  }
}

function addLinesToScene(
  data: DataArray,
  key: string,
  descr: Description,
  ocolor: Color,
  transp: boolean,
  objectIds: number[],
) {
  for (let li = 0; li < data.length; li++) {
    descr.fn(data[li]).forEach((g: LineGeometry) => {
      if (ispy.use_line2) {
        const line2 = new Line2(
          g,
          new LineMaterial({
            color: ocolor.getHex(),
            transparent: transp,
            linewidth: descr.style.linewidth * 0.001,
            opacity: descr.style.opacity,
          }),
        );

        line2.name = key;
        line2.computeLineDistances();

        line2.userData.originalIndex = li;
        objectIds.push(line2.id);
        addToSceneObject(key, line2);
      } else {
        const line = new Line(
          g,
          new LineBasicMaterial({
            color: ocolor,
            transparent: transp,
            opacity: descr.style.opacity,
          }),
        );

        line.name = key;

        line.userData.originalIndex = li;
        objectIds.push(line.id);
        addToSceneObject(key, line);
      }
    });
  }
}

function addShapesToScene(
  data: DataArray,
  key: string,
  descr: Description,
  is_physics_obj: boolean,
  visible: boolean,
  objectIds: number[],
) {
  for (let si = 0; si < data.length; si++) {
    const shape = descr.fn(data[si], descr.style, descr.selection);

    if (shape !== null) {
      shape.name = key;

      shape.traverse((s: Object3D) => {
        s.name = key;

        if (is_physics_obj && visible) {
          s.layers.enable(2);
        }
      });

      shape.userData.originalIndex = si;
      objectIds.push(shape.id);
      addToSceneObject(key, shape);
    }
  }
}

function addPointsToScene(data: DataArray, key: string, descr: Description, ocolor: Color) {
  const points = new Points(
    descr.fn(data),
    new PointsMaterial({
      color: ocolor,
      size: descr.style.size,
    }),
  );

  points.name = key;
  addToSceneObject(key, points);
}

/**
 * Adds the event data to the specified scene view.
 * @param event The event data to add.
 * @param view The view to add the event data to.
 * @return void
 */
function addToScene(event: EventObject, view: string) {
  if (ispy.scenes === undefined) {
    console.error("No scenes found");
    return;
  }
  ispy.scene = ispy.scenes[view];

  data_groups.forEach((g) => {
    const dataGroupObj = ispy.scene?.getObjectByName(g);
    if (!dataGroupObj) {
      console.error(`Group object '${g}' not found in the scene.`);
      return;
    }
    dataGroupObj.children.length = 0;
  });

  for (const key of Object.keys(event_description[view])) {
    const data = event.Collections[key];

    if (!data || data.length === 0) continue;

    const descr = event_description[view][key];

    let extra = null;
    let assoc = null;

    if (descr.extra) {
      extra = event.Collections[descr.extra];
    }

    if (descr.assoc) {
      assoc = event.Associations[descr.assoc];
      if (!assoc || assoc.length === 0) continue;
    }

    const objectIds: number[] = [];
    const visible = !disabled[key] ? (descr.on = true) : (descr.on = false);

    const obj = new Object3D();
    obj.name = key;
    obj.visible = visible;

    addToSceneObject(descr.group, obj);

    let ocolor = null;
    const transp = true;

    if (descr.style.color !== undefined) {
      ocolor = new Color();
      ocolor.setStyle(descr.style.color);
    } else {
      ocolor = new Color(0xffffff);
    }

    const is_physics_obj = descr.group === "Physics";

    switch (descr.type) {
      case BOX: {
        addBoxToScene(data, key, descr, ocolor, transp);
        break;
      }
      case SOLIDBOX: {
        addSolidBoxToScene(data, key, descr, ocolor, transp);
        break;
      }
      case SCALEDSOLIDBOX: {
        addScaledSolidBoxToScene(data, key, descr, ocolor, transp);
        break;
      }
      case SCALEDSOLIDTOWER: {
        addScaledSolidTowerToScene(data, key, descr, ocolor, transp);
        break;
      }
      case STACKEDTOWER: {
        addStackedTowerToScene(data, key, descr, transp, is_physics_obj, visible);
        break;
      }
      case ASSOC: {
        addAssocToScene(data, key, descr, extra, assoc, is_physics_obj, visible, objectIds);
        break;
      }
      case POINT: {
        addPointsToScene(data, key, descr, ocolor);
        break;
      }
      case SHAPE: {
        addShapesToScene(data, key, descr, is_physics_obj, visible, objectIds);
        break;
      }
      case LINE: {
        addLinesToScene(data, key, descr, ocolor, transp, objectIds);
        break;
      }
      case TEXT: {
        descr.fn(data);

        break;
      }
      default: {
        console.warn(`Event type '${descr.type}' is not implemented.`);
      }
    }

    if (view === "3D") {
      addSelectionRow(descr.group, key, descr.name, objectIds, visible);
    }
  }
}

/**
 * Adds the event data to the current event.
 * @param event The event data to add.
 */
function addEvent(event: EventObject) {
  ispy.current_event = event;
  // Clear table from last event and show default caption

  // remove selectors for last event
  $("tr.Event").remove();

  // If saveSetting is active, save the current event preferences
  const currentSetting = saveCutSettings();

  // Clear the subfolders for event information in the treegui
  clearSubfolders();

  ispy.views.forEach((v) => {
    addToScene(event, v);
  });

  reduced_data_groups.forEach(({ name: n, function: addFunc }) => {
    addFunc(n);
  });

  // Load the saved event preferences if currentSetting is active
  applySavedSettings(currentSetting);

  showView(ispy.current_view || "3D");
}

// export all functions
export { addDetector, addToScene, addEvent };
