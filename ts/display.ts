import { Camera, Color, Mesh, Object3D, OrthographicCamera, PerspectiveCamera, Vector2 } from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";

import {
  getFourVectorByIndex,
  getHTMLObject,
  removeExistingBubble,
  showInfoBubble,
  changeMeshMaterials,
} from "./utils";
import { ispy } from "./config";
import { useRenderer, render } from "./setup";
import { toggleAnimation } from "./animate";
import { nextEvent, prevEvent } from "./files-load";
import { exportScene, zoomIn, zoomOut } from "./controls";
import { event_description } from "./objects-config";

import { TrackLine } from "./ispy.interfaces";

function invertColors() {
  ispy.inverted_colors = !ispy.inverted_colors;

  if (!ispy.inverted_colors) {
    ispy.renderer.setClearColor(0x232323, 1);
  } else {
    ispy.renderer.setClearColor(0xefefef, 1);
  }

  const body = document.querySelector("body");
  if (!body) {
    console.error("Body element not found");
    return;
  }
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

function setTransparency(t: number) {
  if (!ispy.scene) {
    console.error("Scene is not defined");
    return;
  }
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

function updateRendererInfo() {
  const info = ispy.renderer.info;

  let html = `<strong>${ispy.renderer_name} info: </strong>`;

  html += "<dl>";
  html += "<dt><strong> render </strong></dt>";

  for (const prop in info.render) {
    html += `<dd>${prop}: ${info.render[prop]}</dd>`;
  }

  if (info.memory) {
    html += "<dt><strong> memory </strong></dt>";

    for (const prop in info.memory) {
      html += `<dd>${prop}: ${info.memory[prop]}</dd>`;
    }
  }

  getHTMLObject("renderer-info").innerHTML = html;
}

function updateRenderer(type: string) {
  if (type === ispy.renderer_name) {
    alert(`${type} is already in use`);
    return;
  }
  if (!ispy.camera) {
    console.error("Camera is not defined");
    return;
  }

  getHTMLObject("display").removeChild(ispy.renderer.domElement);
  getHTMLObject("axes").removeChild(ispy.inset_renderer.domElement);

  useRenderer(type);

  const controls = new TrackballControls(ispy.camera, ispy.renderer.domElement);
  controls.rotateSpeed = 3.0;
  controls.zoomSpeed = 0.5;
  ispy.controls = controls;

  updateRendererInfo();
}

function onWindowResize() {
  if (!ispy.camera) {
    console.error("Camera is not defined");
    return;
  }
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

function getObjectIds(obj: Object3D): number[] {
  const ids: number[] = [];

  obj.children.forEach((c) => {
    ids.push(c.id);
  });

  return ids;
}

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
  const intersects = ispy.raycaster.intersectObject(ispy.scene!.getObjectByName("Physics")!, true);

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
      if (
        intersectedObject.name.match(/Muon|Electron/i) &&
        intersectedObject.parent &&
        intersectedObject.parent.visible
      ) {
        const matchingTrack =
          ispy.current_event.Collections[intersectedObject.name][intersectedObject.userData.originalIndex];
        const chargeIndex = ispy.current_event.Types[intersectedObject.name].findIndex(
          (type: [string, string]) => type[0] === "charge",
        );
        const bubbleText =
          `Charge: ${matchingTrack[chargeIndex]}` + "\n" + `Pt: ${intersectedObject.userData.pt.toFixed(2)}`;

        removeExistingBubble();
        showInfoBubble(bubbleText, pointer);
      } else {
        removeExistingBubble();
      }
    }
  }
}

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

function addKeyboardListeners() {
  // document.addEventListener("keyup", function (e) {
  //   if (e.shiftKey || e.key === "Shift") {
  //     ispy.shift_pressed = false;
  //   }
  // });

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    // Instead of a button, make output of 3D to JSON a "secret" key binding
    // If shift + e then export
    if (e.which === 69 && e.shiftKey) {
      exportScene();
    }

    // up arrow
    if (e.which === 38 && e.shiftKey) {
      zoomIn();
    }

    // down
    if (e.which === 40 && e.shiftKey) {
      zoomOut();
    }

    // right
    if (e.which === 39) {
      nextEvent();
    }

    // left
    if (e.which === 37) {
      prevEvent();
    }

    // shift+a to toggle animation
    if (e.which === 65 && e.shiftKey) {
      toggleAnimation();
    }

    // if (e.shiftKey || e.key === "Shift") {
    //   ispy.shift_pressed = true;
    // }

    // M
    if (e.which === 77) {
      showMass();
    }

    // H
    if (e.which === 72) {
      ispy.hide = true;

      if (ispy.intersected?.name.includes("Jet")) {
        ispy.intersected.material.color = new Color(
          event_description[ispy.current_view][ispy.intersected.name].style.color,
        );

        ispy.intersected.visible = false;
        ispy.hidden_objects.push(ispy.intersected);
      }
    }

    // S
    if (e.which === 83) {
      ispy.show = true;

      const hidden_object = ispy.hidden_objects.pop();

      if (hidden_object) {
        hidden_object.visible = true;
      }
    }
  });
}

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

function highlightObject(objectId: number) {
  if (!ispy.scene) {
    console.error("Scene is not defined");
    return;
  }
  const selected = ispy.scene.getObjectById(Number(objectId));

  document.body.style.cursor = "pointer";

  if (selected) {
    if (ispy.highlighted !== selected && selected.visible) {
      if (ispy.highlighted) {
        ispy.highlighted.material.color.setHex(ispy.highlighted.current_color);
      }

      ispy.highlighted = selected;
      ispy.highlighted.current_color = ispy.highlighted.material.color.getHex();
      ispy.highlighted.material.color.setHex(0xcccccc);
    }
  }
}

function unHighlightObject() {
  document.body.style.cursor = "default";

  if (ispy.highlighted) {
    ispy.highlighted.material.color.setHex(ispy.highlighted.current_color);
    ispy.highlighted = null;
  }
}

export {
  invertColors,
  setTransparency,
  updateRendererInfo,
  updateRenderer,
  onWindowResize,
  getObjectIds,
  onMouseMove,
  onMouseDown,
  showMass,
  displayEventObjectData,
  highlightObject,
  unHighlightObject,
  addKeyboardListeners,
};
