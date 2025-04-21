import {
  Object3D,
  Color,
  Line,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  DoubleSide,
  Mesh,
  Points,
  PointsMaterial,
} from "three";

import { Line2 } from "three/addons/lines/Line2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { mergeBufferGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function addDetector() {
  for (let key in ispy.detector_description) {
    const data = ispy.detector.Collections[key];

    if (!data || data.length === 0) {
      continue;
    }

    const descr = ispy.detector_description[key];

    // If something is already disabled via the toggle then this
    // should override what comes from the description
    // -- However it is not used in addSelectionRow()? - C
    const visible = ! ispy.disabled[key] ? descr.on = true : descr.on = false;
    ispy.addSelectionRow(descr.group, key, descr.name, [], visible);

    const obj = new Object3D();
    obj.name = key;
    obj.visible = visible;

    ispy.scene.getObjectByName(descr.group).add(obj);

    const ocolor = new Color(descr.style.color);
    const transp = true;

    switch (descr.type) {
      case ispy.BOX: {

        let box_material = new LineBasicMaterial({
          color: ocolor,
          transparent: transp,
          linewidth: descr.style.linewidth,
          depthWrite: false,
          opacity: descr.style.opacity,
          clippingPlanes: ispy.local_planes
        });

        let box_geometries = [];

        for (var i = 0; i < data.length; i++) {

          box_geometries.push(descr.fn(data[i]));

        }

        let box = new LineSegments(
          mergeBufferGeometries(box_geometries),
          box_material
        );

        box.name = key;
        box.renderOrder = 1;
        ispy.scene.getObjectByName(key).add(box);

        break;
      }
      case ispy.SOLIDBOX: {

        let solidbox_material = new MeshBasicMaterial({
          color: ocolor,
          transparent: transp,
          opacity: descr.style.opacity,
          depthTest: false,
          clippingPlanes: ispy.local_planes
        });

        solidbox_material.side = DoubleSide;

        let boxes = [];
        let lines = [];

        for (let i = 0; i < data.length; i++) {

          const bl = descr.fn(data[i]);

          if (bl.length === 0)
            continue;

          boxes.push(bl[0]);
          lines.push(bl[1]);

        }

        let meshes = new Mesh(
          mergeBufferGeometries(boxes),
          solidbox_material
        );

        meshes.name = key;
        meshes.renderOrder = 1;
        ispy.scene.getObjectByName(key).add(meshes);

        let line_material = new LineBasicMaterial({
          color: 0x000000,
          transparent: false,
          linewidth: 1,
          depthTest: false
        });

        let line_mesh = new LineSegments(
          mergeBufferGeometries(lines),
          line_material
        );

        line_mesh.name = key;
        ispy.scene.getObjectByName(key).add(line_mesh);

        break;

      }
    }
  }
}

function addToScene(event: any, view: string) {
  ispy.scene = ispy.scenes[view];

  ispy.data_groups.forEach((g) => {
    ispy.scene.getObjectByName(g).children.length = 0;
  });

  for (let key in ispy.event_description[view]) {
    const data = event.Collections[key];

    if (!data || data.length === 0) continue;

    const descr = ispy.event_description[view][key];

    let extra = null;
    let assoc = null;

    if (descr.extra) {
      extra = event.Collections[descr.extra];
    }

    if (descr.assoc) {
      assoc = event.Associations[descr.assoc];
      if (!assoc || assoc.length === 0) continue;
    }

    const objectIds = [];
    const visible = !ispy.disabled[key] ? (descr.on = true) : (descr.on = false);

    const obj = new Object3D();
    obj.name = key;
    obj.visible = visible;

    ispy.scene.getObjectByName(descr.group).add(obj);

    let ocolor = null;
    const transp = true;

    if (descr.style.color !== undefined) {
      ocolor = new Color();
      ocolor.setStyle(descr.style.color);
    }

    const is_physics_obj = descr.group === "Physics";

    switch (descr.type) {
      case ispy.BOX: {

        const boxes = [];

        for (let i = 0; i < data.length; i++) {

          boxes.push(descr.fn(data[i]));

        }

        const line = new LineSegments(
          mergeBufferGeometries(boxes),
          new LineBasicMaterial({
            color: ocolor,
            transparent: transp,
            linewidth: descr.style.linewidth,
            opacity: descr.style.opacity
          })
        );

        line.name = key;
        ispy.scene.getObjectByName(key).add(line);

        break;
      }
      case ispy.SOLIDBOX: {

        const sboxes = [];
        const slines = [];

        for (let j = 0; j < data.length; j++) {

          let bl = descr.fn(data[j]);

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
          depthWrite: false
        });

        solidbox_material.side = DoubleSide;

        const smeshes = new Mesh(
          mergeBufferGeometries(sboxes),
          solidbox_material
        );

        smeshes.name = key;
        ispy.scene.getObjectByName(key).add(smeshes);

        if (slines.length > 0) {

          const sline_material = new LineBasicMaterial({
            color: 0xcccccc,
            transparent: false,
            linewidth: 1,
            depthTest: false
          });

          const sline_mesh = new LineSegments(
            mergeBufferGeometries(slines),
            sline_material
          );

          sline_mesh.name = key;
          ispy.scene.getObjectByName(key).add(sline_mesh);

        }

        break;
      }
      case ispy.SCALEDSOLIDBOX: {

        const ss_boxes = [];
        let maxEnergy = 0.0;

        for (let k = 0; k < data.length; k++) {

          let energy = data[k][0];

          if (energy > maxEnergy)
            maxEnergy = energy;

        }

        for (let l = 0; l < data.length; l++) {

          descr.fn(data[l], ss_boxes, maxEnergy, descr.selection);

        }

        if (ss_boxes.length > 0) {

          const ssb_material = new MeshBasicMaterial({
            color: ocolor,
            transparent: transp,
            opacity: descr.style.opacity
          });

          ssb_material.side = DoubleSide;

          const ssb_meshes = new Mesh(
            mergeBufferGeometries(ss_boxes),
            ssb_material
          );

          ssb_meshes.name = key;
          ispy.scene.getObjectByName(key).add(ssb_meshes);

        }

        break;
      }
      case ispy.SCALEDSOLIDTOWER: {

        const sst_boxes = [];
        let maxE = 0.0;

        for (let ee = 0; ee < data.length; ee++) {

          let energy = data[ee][0];

          if (energy > maxE)
            maxE = energy;

        }

        for (var m = 0; m < data.length; m++) {

          descr.fn(data[m], sst_boxes, maxE, descr.selection);

        }

        if (sst_boxes.length > 0) {

          const sst_material = new MeshBasicMaterial({
            color: ocolor,
            transparent: transp,
            opacity: descr.style.opacity
          });

          sst_material.side = DoubleSide;

          var sst_meshes = new Mesh(
            mergeBufferGeometries(sst_boxes),
            sst_material
          );

          sst_meshes.name = key;
          ispy.scene.getObjectByName(key).add(sst_meshes);

        }

        break;
      }
      case ispy.STACKEDTOWER: {

        const eboxes = [];
        const hboxes = [];

        for (let n = 0; n < data.length; n++) {

          descr.fn(data[n], eboxes, hboxes, descr.scale, descr.selection);

        }

        const ematerial = new MeshBasicMaterial({
          color: new Color(descr.style.ecolor),
          transparent: transp,
          opacity: descr.style.opacity
        });

        const hmaterial = new MeshBasicMaterial({
          color: new Color(descr.style.hcolor),
          transparent: transp,
          opacity: descr.style.opacity
        });

        ematerial.side = DoubleSide;
        hmaterial.side = DoubleSide;

        const emeshes = new Mesh(
          mergeBufferGeometries(eboxes),
          ematerial
        );

        const hmeshes = new Mesh(
          mergeBufferGeometries(hboxes),
          hmaterial
        );

        emeshes.name = key;
        hmeshes.name = key;

        if (is_physics_obj && visible) {

          emeshes.layers.enable(2);
          hmeshes.layers.enable(2);

        }

        ispy.scene.getObjectByName(key).add(emeshes);
        ispy.scene.getObjectByName(key).add(hmeshes);

        break;
      }
      case ispy.ASSOC: {

        const objs = descr.fn(data, extra, assoc, descr.style, descr.selection);

        if (objs !== undefined) {

          objs.forEach(function (obj, index) {

            obj.name = key;

            if (is_physics_obj && visible) {

              obj.layers.enable(2);

            }

            obj.userData.originalIndex = index;
            objectIds.push(obj.id);
            ispy.scene.getObjectByName(key).add(obj);

          });

        }

        break;
      }
      case ispy.POINT: {

        const points = new Points(
          descr.fn(data),
          new PointsMaterial({
            color: ocolor,
            size: descr.style.size
          }));

        points.name = key;
        ispy.scene.getObjectByName(key).add(points);

        break;
      }
      case ispy.SHAPE: {

        for (let si = 0; si < data.length; si++) {

          const shape = descr.fn(data[si], descr.style, descr.selection);

          if (shape !== null) {

            shape.name = key;

            shape.traverse(function (s) {

              s.name = key;

              if (is_physics_obj && visible) {

                s.layers.enable(2);

              }

            });

            shape.userData.originalIndex = si;
            objectIds.push(shape.id);
            ispy.scene.getObjectByName(key).add(shape);

          }

        }

        break;
      }
      case ispy.LINE: {

        for (let li = 0; li < data.length; li++) {

          descr.fn(data[li]).forEach(function (g) {

            if (ispy.use_line2) {

              const line2 = new Line2(g, new LineMaterial({
                color: ocolor,
                transparent: transp,
                linewidth: descr.style.linewidth * 0.001,
                opacity: descr.style.opacity
              }));

              line2.name = key;
              line2.computeLineDistances();

              line2.userData.originalIndex = li;
              objectIds.push(line2.id);
              ispy.scene.getObjectByName(key).add(line2);

            } else {

              const line = new Line(g, new LineBasicMaterial({
                color: ocolor,
                transparent: transp,
                opacity: descr.style.opacity
              }));

              line.name = key;

              line.userData.originalIndex = li;
              objectIds.push(line.id);
              ispy.scene.getObjectByName(key).add(line);

            }

          });

        }

        break;
      }
      case ispy.TEXT: {

        descr.fn(data);

        break;
      }
    }

    if (view === "3D") {
      ispy.addSelectionRow(descr.group, key, descr.name, objectIds, visible);
    }
  }
}

function addEvent(event: any) {
  ispy.current_event = event;
  // Clear table from last event and show default caption

  // remove selectors for last event
  $("tr.Event").remove();

  // If saveSetting is active, save the current event preferences
  let currentSetting = ispy.saveCutSettings();

  // Clear the subfolders for event information in the treegui
  ispy.clearSubfolders();

  ispy.views.forEach((v) => {
    addToScene(event, v);
  });

  ispy.reduced_data_groups.forEach(({ name: n, function: addFunc }) => {
    addFunc(n);
  });

  // Load the saved event preferences if currentSetting is active
  ispy.applySavedSettings(currentSetting);

  ispy.showView(ispy.current_view);
}

// export all functions
export {
  addDetector,
  addToScene,
  addEvent
}
