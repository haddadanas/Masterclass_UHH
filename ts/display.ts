import { Camera, Color, Mesh, Object3D, OrthographicCamera, PerspectiveCamera, Vector2, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import {
  getFourVectorByIndex,
  getHTMLObject,
  removeExistingBubble,
  changeMeshMaterials,
  showTrackInfoBubble,
  assertDefined,
} from "./utils.js";
import { ispy } from "./config.js";
import { event_description } from "./objects-config.js";
import { TrackLine } from "./ispy.interfaces.js";
import { render } from "./renderer.js";

/**
 * Resets the view to the origin (0, 0, 0) from the current camera position.
 * @returns void
 */
function lookAtOrigin() {
  ispy.camera?.lookAt(new Vector3(0, 0, 0));
}

/**
 * Initializes the camera object, saved to ispy.camera.
 * @returns void
 */
function initCamera() {
  const display = getHTMLObject("display");
  const width = display.clientWidth;
  const height = display.clientHeight;

  ispy.p_camera = new PerspectiveCamera(75, width / height, 0.1, 100);

  ispy.p_camera.name = "PerspectiveCamera";

  ispy.o_camera = new OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 0.1, 100);

  ispy.o_camera.name = "OrthographicCamera";

  ispy.is_perspective = true;
  ispy.camera = ispy.is_perspective ? ispy.p_camera : ispy.o_camera;
  ispy.camera.position.x = 9.5;
  ispy.camera.position.y = 9.5;
  ispy.camera.position.z = 13.0;

  ispy.camera.zoom = 2.0;
  ispy.camera.up = new Vector3(0, 1, 0);

  ispy.camera.updateProjectionMatrix();
  lookAtOrigin();
}

/**
 * Zooms in the camera view.
 * @returns void
 */
function zoomIn() {
  assertDefined(ispy.camera, "Camera is not defined");
  ispy.camera.zoom += 0.5;
  ispy.camera.updateProjectionMatrix();
}

/**
 * Zooms out the camera view.
 * @returns void
 */
function zoomOut() {
  assertDefined(ispy.camera, "Camera is not defined");
  ispy.camera.zoom -= 0.5;
  ispy.camera.updateProjectionMatrix();
}

/**
 * Inverts the colors of the scene.
 * @returns void
 */
function invertColors() {
  assertDefined(ispy.renderer, "Renderer is not defined");
  ispy.inverted_colors = !ispy.inverted_colors;

  if (!ispy.inverted_colors) {
    ispy.renderer.setClearColor(new Color(0x232323), 1);
  } else {
    ispy.renderer.setClearColor(new Color(0xefefef), 1);
  }

  const body = document.querySelector("body");
  assertDefined(body, "Body element not found");
  body.classList.toggle("white");
  body.classList.toggle("black");

  const ids = [
    "event-info",
    "titlebar",
    "toolbar",
    "display",
    "browser-table",
    "browser-files",
    "obj-table",
    "obj-files",
  ];

  ids.forEach((id) => {
    const el = getHTMLObject(id);

    el.classList.toggle("white");
    el.classList.toggle("black");
  });

  const selectors = ["#browser-table th", "#obj-table th", ".modal-content", ".modal-title", "#table-data-eventObject"];

  selectors.forEach((sels) => {
    document.querySelectorAll(sels).forEach((s) => {
      s.classList.toggle("white");
      s.classList.toggle("black");
    });
  });
}

/**
 * Sets the transparency for imported objects.
 * @param t The transparency value to set for the imported objects.
 * @returns void
 */
function setTransparency(t: number) {
  assertDefined(ispy.scene, "Scene is not defined");
  ispy.importTransparency = t;

  getHTMLObject("trspy").innerHTML = t.toString();

  const imported = ispy.scene.getObjectByName("Imported");
  if (!imported) {
    console.error("Imported object not found in the scene");
    return;
  }

  imported.children.forEach((obj) => {
    (obj.children as Mesh[]).forEach((c) => {
      changeMeshMaterials(c.material, (m) => {
        m.transparent = true;
        m.opacity = t;
      });
    });
  });
}

/**
 * Adjusts the configuration to the new window size.
 */
function onWindowResize() {
  assertDefined(ispy.camera, "Camera is not defined");
  assertDefined(ispy.renderer, "Renderer is not defined");
  const display = getHTMLObject("display");
  display.removeAttribute("style");

  const w = display.clientWidth;
  const h = display.clientHeight;

  if (ispy.is_perspective) {
    (ispy.camera as PerspectiveCamera).aspect = w / h;
  } else {
    (ispy.camera as OrthographicCamera).left = -w / 2;
    (ispy.camera as OrthographicCamera).right = w / 2;
    (ispy.camera as OrthographicCamera).top = h / 2;
    (ispy.camera as OrthographicCamera).bottom = -h / 2;
  }

  ispy.camera.updateProjectionMatrix();
  ispy.renderer.setSize(w, h);
  render();
}

/**
 * Gets the IDs of all child objects of the given Object3D.
 * @param obj The Object3D to get the IDs from.
 * @returns An array of child object IDs.
 */
function getObjectIds(obj: Object3D): number[] {
  const ids: number[] = [];

  obj.children.forEach((c) => {
    ids.push(c.id);
  });

  return ids;
}

/**
 * Handles mouse movement events.
 * @param e The mouse event to handle.
 */
function onMouseMove(e: MouseEvent) {
  e.preventDefault();

  const display = getHTMLObject("display");
  const w = display.clientWidth;
  const h = display.clientHeight;

  const doc = document.documentElement;
  const left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
  const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

  const offsetX = display.getBoundingClientRect().left + window.pageXOffset - left;
  const offsetY = display.getBoundingClientRect().top + window.pageYOffset - top;

  const pointer = new Vector2();

  pointer.x = ((e.clientX - offsetX) / w) * 2 - 1;
  pointer.y = -((e.clientY - offsetY) / h) * 2 + 1;

  ispy.raycaster.setFromCamera(pointer, ispy.camera as Camera);
  const physicsObject = ispy.scene?.getObjectByName("Physics");
  const intersects = physicsObject ? ispy.raycaster.intersectObject(physicsObject, true) : [];

  if (ispy.intersected) {
    document.body.style.cursor = "auto";

    if (!ispy.intersected.selected) {
      const original_color = new Color(event_description[ispy.current_view][ispy.intersected.name].style.color);

      ispy.intersected.material.color = original_color;
    } else {
      ispy.intersected.material.color.setHex(0xcccccc);
    }

    ispy.intersected = null;
  }

  if (intersects.length > 0) {
    const res = intersects.filter((res) => {
      return res?.object;
    })[0];

    if (res?.object) {
      ispy.intersected = res.object as TrackLine;

      document.body.style.cursor = "pointer";

      ispy.intersected.material.color.setHex(0xcccccc);
    }

    if (ispy.showTrackInfo) {
      const intersectedObject = intersects[0].object;
      showTrackInfoBubble(intersectedObject, pointer);
    } else {
      removeExistingBubble();
    }
  }
}

/**
 * Handles mouse clicks.
 * @param e The mouse event to handle.
 */
function onMouseDown(_e: MouseEvent) {
  if (ispy.intersected?.visible) {
    if (ispy.intersected.name.includes("Muon") || ispy.intersected.name.includes("Electron")) {
      if (ispy.intersected.selected) {
        const original_color = new Color(event_description[ispy.current_view][ispy.intersected.name].style.color);

        ispy.intersected.material.color = original_color;
        ispy.intersected.selected = false;

        if (ispy.selected_objects.has(ispy.intersected.id)) {
          ispy.selected_objects.delete(ispy.intersected.id);
        }
      } else {
        ispy.intersected.material.color.setHex(0x808080);
        ispy.intersected.selected = true;
        displayEventObjectData();
      }
    }

    ispy.subfoldersReduced["Info"][1].setValue(ispy.selected_objects.size);
  }
}

/**
 * Shows the invariant mass of selected objects in a modal dialog.
 * @returns void
 */
function showMass() {
  let mass = 0;
  let sumE = 0;
  let sumPx = 0;
  let sumPy = 0;
  let sumPz = 0;

  ispy.selected_objects.forEach((o, _key) => {
    sumE += o.fourVector.E;
    sumPx += o.fourVector.px;
    sumPy += o.fourVector.py;
    sumPz += o.fourVector.pz;

    // This is cheating. Should get colors from event_description config.
    if (o.ptype === "Electron") {
      o.material.color.setHex(0x19ff19);
    }

    if (o.ptype === "Muon") {
      o.material.color.setHex(0xff0000);
    }

    o.selected = false;
  });

  mass = sumE * sumE;
  mass -= sumPx * sumPx + sumPy * sumPy + sumPz * sumPz;
  mass = Math.sqrt(mass);

  getHTMLObject("invariant-mass").innerHTML = mass.toFixed(2);
  //document.getElementById('invariant-mass-modal').style.display = 'block';
  $("#invariant-mass-modal").modal("show");

  ispy.selected_objects.clear();
  ispy.subfoldersReduced["Info"][1].setValue(0);
}

/**
 * Displays the data of the intersected object in the event object data modal.
 * @returns void
 */
function displayEventObjectData() {
  if (!ispy.intersected) {
    return;
  }
  const key = ispy.intersected.name;
  const objectUserData = ispy.intersected.userData;

  const [fourVector, ptype] = getFourVectorByIndex(key, objectUserData);

  ispy.intersected.fourVector = fourVector;
  ispy.intersected.ptype = ptype?.toString() || "";

  ispy.selected_objects.set(ispy.intersected.id, ispy.intersected);
}

/**
 * Highlights the object with the given ID.
 * @param objectId The ID of the object to highlight.
 * @returns void
 */
function highlightObject(objectId: number) {
  assertDefined(ispy.scene, "Scene is not defined");
  const selected = ispy.scene.getObjectById(Number(objectId));

  document.body.style.cursor = "pointer";

  if (selected) {
    if (ispy.highlighted !== selected && selected.visible) {
      if (ispy.highlighted) {
        ispy.highlighted.material.color.setHex(ispy.highlighted.current_color);
      }

      ispy.highlighted = selected as TrackLine;
      ispy.highlighted.current_color = ispy.highlighted.material.color.getHex();
      ispy.highlighted.material.color.setHex(0xcccccc);
    }
  }
}

/**
 * Unhighlights the currently highlighted object.
 * @returns void
 */
function unHighlightObject() {
  document.body.style.cursor = "default";

  if (ispy.highlighted) {
    ispy.highlighted.material.color.setHex(ispy.highlighted.current_color);
    ispy.highlighted = null;
  }
}

/**
 * Resets the view to the origin (0, 0, 0), reinitializes the camera, and resets controls.
 * @returns void
 */
function resetView() {
  assertDefined(ispy.controls, "Controls are not defined");
  setPerspective();
  initCamera();

  ispy.controls.reset();

  getHTMLObject("js-3d").classList.add("active");
  getHTMLObject("js-rphi").classList.remove("active");
  getHTMLObject("js-rhoz").classList.remove("active");

  ispy.current_view = "3D";
  ispy.scene = ispy.scenes["3D"];
}

/**
 * Sets the camera position to the XY plane.
 * @returns void
 */
function setXY() {
  assertDefined(ispy.camera, "Camera is not defined");
  const length = ispy.camera.position.length();

  ispy.camera.position.x = 0;
  ispy.camera.position.y = 0;
  ispy.camera.position.z = length;
  ispy.camera.up = new Vector3(0, 1, 0);

  lookAtOrigin();
}

/**
 * Sets the camera position to the ZX plane.
 * @returns void
 */
function setZX() {
  assertDefined(ispy.camera, "Camera is not defined");
  const length = ispy.camera.position.length();

  ispy.camera.position.x = 0;
  ispy.camera.position.y = length;
  ispy.camera.position.z = 0;
  ispy.camera.up = new Vector3(1, 0, 0);

  lookAtOrigin();
}

/**
 * Sets the camera position to the YZ plane.
 * @returns void
 */
function setYZ() {
  assertDefined(ispy.camera, "Camera is not defined");
  const length = ispy.camera.position.length();

  ispy.camera.position.x = -length;
  ispy.camera.position.y = 0;
  ispy.camera.position.z = 0;
  ispy.camera.up = new Vector3(0, 1, 0);

  lookAtOrigin();
}

/**
 * Sets the orthographic camera view.
 * @returns void
 */
function setOrthographic() {
  assertDefined(ispy.o_camera, "Orthographic camera is not defined");
  assertDefined(ispy.p_camera, "Perspective camera is not defined");
  assertDefined(ispy.controls, "Controls are not defined");
  getHTMLObject("js-perspective").classList.remove("active");
  getHTMLObject("js-orthographic").classList.add("active");

  ispy.is_perspective = false;
  ispy.camera = ispy.o_camera;

  ispy.camera.position.x = ispy.p_camera.position.x;
  ispy.camera.position.y = ispy.p_camera.position.y;
  ispy.camera.position.z = ispy.p_camera.position.z;

  ispy.camera.zoom = ispy.p_camera.zoom;
  ispy.camera.up = ispy.p_camera.up;

  const fov = ispy.p_camera.fov;
  const aspect = ispy.p_camera.aspect;
  const near = ispy.p_camera.near;
  const far = ispy.p_camera.far;

  const focus = (near + far) / 2;

  let half_height = Math.tan((fov * Math.PI) / 180 / 2) * focus;
  let half_width = half_height * aspect;

  half_height /= ispy.p_camera.zoom;
  half_width /= ispy.p_camera.zoom;

  ispy.camera.left = -half_width;
  ispy.camera.right = half_width;
  ispy.camera.top = half_height;
  ispy.camera.bottom = -half_height;

  ispy.camera.updateProjectionMatrix();

  ispy.controls.object = ispy.camera;
  ispy.controls.update();
}

/**
 * Sets the perspective camera view.
 * @returns void
 */
function setPerspective() {
  assertDefined(ispy.o_camera, "Orthographic camera is not defined");
  assertDefined(ispy.p_camera, "Perspective camera is not defined");
  assertDefined(ispy.controls, "Controls are not defined");
  getHTMLObject("js-perspective").classList.add("active");
  getHTMLObject("js-orthographic").classList.remove("active");

  ispy.is_perspective = true;
  ispy.camera = ispy.p_camera;

  ispy.camera.position.x = ispy.o_camera.position.x;
  ispy.camera.position.y = ispy.o_camera.position.y;
  ispy.camera.position.z = ispy.o_camera.position.z;

  ispy.camera.zoom = ispy.o_camera.zoom;
  ispy.camera.up = ispy.o_camera.up;

  ispy.camera.aspect = ispy.o_camera.right / ispy.o_camera.top;

  ispy.camera.updateProjectionMatrix();

  ispy.controls.object = ispy.camera;
  ispy.controls.update();
}

/**
 * Shows the specified view.
 * @param view The view to show: "3D", "RPhi", or "RhoZ".
 * @returns void
 */
function showView(view: string) {
  assertDefined(ispy.controls, "Controls are not defined");
  switch (view) {
    case "3D":
      getHTMLObject("js-3d").classList.add("active");
      getHTMLObject("js-rphi").classList.remove("active");
      getHTMLObject("js-rhoz").classList.remove("active");

      getHTMLObject("js-perspective").removeAttribute("disabled");
      getHTMLObject("js-orthographic").removeAttribute("disabled");

      getHTMLObject("js-xy").removeAttribute("disabled");
      getHTMLObject("js-yz").removeAttribute("disabled");
      getHTMLObject("js-xz").removeAttribute("disabled");

      (ispy.controls as OrbitControls).enableRotate = true;

      if (ispy.current_view !== "3D") setPerspective();

      ispy.current_view = "3D";
      ispy.scene = ispy.scenes["3D"];
      break;

    case "RPhi":
      getHTMLObject("js-3d").classList.remove("active");
      getHTMLObject("js-rphi").classList.add("active");
      getHTMLObject("js-rhoz").classList.remove("active");

      getHTMLObject("js-perspective").setAttribute("disabled", "");
      getHTMLObject("js-orthographic").setAttribute("disabled", "");

      getHTMLObject("js-xy").setAttribute("disabled", "");
      getHTMLObject("js-yz").setAttribute("disabled", "");
      getHTMLObject("js-xz").setAttribute("disabled", "");

      (ispy.controls as OrbitControls).enableRotate = false;
      ispy.controls.reset();

      setOrthographic();
      setXY();

      ispy.current_view = "RPhi";
      ispy.scene = ispy.scenes["RPhi"];
      break;

    case "RhoZ":
      getHTMLObject("js-3d").classList.remove("active");
      getHTMLObject("js-rphi").classList.remove("active");
      getHTMLObject("js-rhoz").classList.add("active");

      getHTMLObject("js-perspective").setAttribute("disabled", "");
      getHTMLObject("js-orthographic").setAttribute("disabled", "");

      getHTMLObject("js-xy").setAttribute("disabled", "");
      getHTMLObject("js-yz").setAttribute("disabled", "");
      getHTMLObject("js-xz").setAttribute("disabled", "");

      (ispy.controls as OrbitControls).enableRotate = false;
      ispy.controls.reset();

      setOrthographic();
      setYZ();

      ispy.current_view = "RhoZ";
      ispy.scene = ispy.scenes["RhoZ"];
      break;
    default:
      console.error(`Invalid view: ${view}`);
      break;
  }
}

export {
  initCamera,
  zoomIn,
  zoomOut,
  invertColors,
  setTransparency,
  onWindowResize,
  getObjectIds,
  onMouseMove,
  onMouseDown,
  highlightObject,
  unHighlightObject,
  showMass,
  resetView,
  setXY,
  setZX,
  setYZ,
  showView,
  setOrthographic,
  setPerspective,
};
