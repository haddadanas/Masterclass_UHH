import {
  Vector3,
  Plane,
  PerspectiveCamera,
  OrthographicCamera,
  Object3D,
  LineBasicMaterial,
  MeshBasicMaterial,
  FontLoader,
  TextGeometry,
  ArrowHelper,
  Mesh,
  Font,
  DirectionalLight,
  Group,
  Scene,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI, GUIController } from "dat.gui";
import { update } from "@tweenjs/tween.js";

import { assertDefined, getHTMLObject } from "./utils.js";
import { ispy } from "./config.js";
import { useRenderer, updateClipping, render } from "./renderer.js";
import { importDetector, loadDroppedFile } from "./files-load.js";
import { data_groups } from "./objects-config.js";
import { initCamera, onMouseDown, onMouseMove, onWindowResize } from "./display.js";
import { CHARGE_MAP, SELEC_NAME_MAP } from "./analysis-config.js";
import { checkCurrentSelection } from "./uhh_selection.js";
import { SelectionFieldController } from "./ispy.interfaces.js";

/**
 * Sets the display vertical height.
 * @param vh The vertical height in viewport height units.
 * @returns void
 */
function setDisplayVerticalHeight(vh: number) {
  assertDefined(ispy.camera, "Camera is not initialized");
  assertDefined(ispy.renderer, "Renderer is not initialized");
  ispy.vh = vh;

  const vh_obj = getHTMLObject("js-vh");
  vh_obj.innerHTML = vh.toString();
  const display = getHTMLObject("js-display");
  display.style.setProperty("height", `${vh}vh`);

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
}

/**
 * Sets the framerate for the rendering loop.
 * @param fr The framerate to set.
 */
function setFramerate(fr: number) {
  ispy.framerate = fr;
  const fr_obj = getHTMLObject("js-fr");
  fr_obj.innerHTML = fr.toString();
}

/**
 * Animation configuration for the ispy application.
 */
function setupClippingGUI() {
  ispy.clipgui = new GUI({
    name: "Clipping Controls",
    hideable: false,
    autoPlace: false,
  });

  ispy.clipgui.domElement.id = "js-clipgui";
  ispy.clipgui.domElement.classList.add("gui-menu");
  const titlebar = getHTMLObject("js-menu-container");
  titlebar.appendChild(ispy.clipgui.domElement);

  const localFolder = ispy.clipgui.addFolder("Local Clipping");
  const globalFolder = ispy.clipgui.addFolder("Global Clipping");

  const local_planeX = localFolder.addFolder("planeX");
  const local_planeY = localFolder.addFolder("planeY");
  const local_planeZ = localFolder.addFolder("planeZ");

  const global_planeX = globalFolder.addFolder("planeX");
  const global_planeY = globalFolder.addFolder("planeY");
  const global_planeZ = globalFolder.addFolder("planeZ");

  const local_params = {
    planeX: {
      constant: 10,
      negated: false,
    },

    planeY: {
      constant: 10,
      negated: false,
    },

    planeZ: {
      constant: 30,
      negated: false,
    },
  };

  const global_params = {
    planeX: {
      constant: 10,
      negated: false,
    },

    planeY: {
      constant: 10,
      negated: false,
    },

    planeZ: {
      constant: 30,
      negated: false,
    },
  };

  ispy.local_planes = [
    new Plane(new Vector3(-1, 0, 0), local_params.planeX.constant),
    new Plane(new Vector3(0, -1, 0), local_params.planeY.constant),
    new Plane(new Vector3(0, 0, -1), local_params.planeZ.constant),
  ];

  ispy.global_planes = [
    new Plane(new Vector3(-1, 0, 0), global_params.planeX.constant),
    new Plane(new Vector3(0, -1, 0), global_params.planeY.constant),
    new Plane(new Vector3(0, 0, -1), global_params.planeZ.constant),
  ];

  local_planeX
    .add(local_params.planeX, "constant")
    .min(-10)
    .max(10)
    .onChange((d) => (ispy.local_planes[0].constant = d));

  local_planeX.add(local_params.planeX, "negated").onChange(() => {
    ispy.local_planes[0].negate();
    local_params.planeX.constant = ispy.local_planes[0].constant;
  });

  local_planeX.open();

  global_planeX
    .add(global_params.planeX, "constant")
    .min(-10)
    .max(10)
    .onChange((d) => (ispy.global_planes[0].constant = d));

  global_planeX.add(global_params.planeX, "negated").onChange(() => {
    ispy.global_planes[0].negate();
    global_params.planeX.constant = ispy.global_planes[0].constant;
  });

  global_planeX.open();

  local_planeY
    .add(local_params.planeY, "constant")
    .min(-10)
    .max(10)
    .onChange((d) => (ispy.local_planes[1].constant = d));

  local_planeY.add(local_params.planeY, "negated").onChange(() => {
    ispy.local_planes[1].negate();
    local_params.planeY.constant = ispy.local_planes[1].constant;
  });

  local_planeY.open();

  global_planeY
    .add(global_params.planeY, "constant")
    .min(-10)
    .max(10)
    .onChange((d) => (ispy.global_planes[1].constant = d));

  global_planeY.add(global_params.planeY, "negated").onChange(() => {
    ispy.global_planes[1].negate();
    global_params.planeY.constant = ispy.global_planes[1].constant;
  });

  global_planeY.open();

  local_planeZ
    .add(local_params.planeZ, "constant")
    .min(-30)
    .max(30)
    .onChange((d) => (ispy.local_planes[2].constant = d));

  local_planeZ.add(local_params.planeZ, "negated").onChange(() => {
    ispy.local_planes[2].negate();
    local_params.planeZ.constant = ispy.local_planes[2].constant;
  });

  local_planeZ.open();

  global_planeZ
    .add(global_params.planeZ, "constant")
    .min(-30)
    .max(30)
    .onChange((d) => (ispy.global_planes[2].constant = d));

  global_planeZ.add(global_params.planeZ, "negated").onChange(() => {
    ispy.global_planes[2].negate();
    global_params.planeZ.constant = ispy.global_planes[2].constant;
  });

  global_planeZ.open();
}

/**
 * Initializes the application.
 */
function setupGUIs() {
  ispy.gui.domElement.id = "js-treegui";
  ispy.guiReduced.domElement.id = "js-treegui-reduced";
  ispy.guiReduced.domElement.classList.add("gui-menu");
  const titlebar = getHTMLObject("js-menu-container");
  titlebar.appendChild(ispy.guiReduced.domElement);

  // It seems currently impossible with dat.gui
  // to fetch the folders as an array and remove them
  // (without knowing the name beforehand).
  // Therefore we have to keep track of them by-hand.
  // TODO check if needed
  // ispy.subfolders = {};
  // ispy.subfoldersReduced = {};
}

/**
 * Sets up the inset camera.
 * @param height The height of the inset camera.
 */
function setupInset(height: number) {
  // fov, aspect, near, far
  const inset_width = height / 5;
  const inset_height = height / 5;
  const inset_camera = new PerspectiveCamera(70, inset_width / inset_height, 1, 100);
  ispy.inset_camera = inset_camera;
  ispy.inset_camera.up = ispy.camera?.up || new Vector3(0, 1, 0);

  const origin = new Vector3(0, 0, 0);

  // dir, origin, length, hex, headLength, headWidth
  const length = 3.5;
  const headLength = 1;
  const headWidth = 1;

  const rx = new ArrowHelper(new Vector3(4, 0, 0), origin, length, 0xff0000, headLength, headWidth);

  const gy = new ArrowHelper(new Vector3(0, 4, 0), origin, length, 0x00ff00, headLength, headWidth);

  const bz = new ArrowHelper(new Vector3(0, 0, 4), origin, length, 0x0000ff, headLength, headWidth);

  (rx.line.material as LineBasicMaterial).linewidth = 2.5;
  (gy.line.material as LineBasicMaterial).linewidth = 2.5;
  (bz.line.material as LineBasicMaterial).linewidth = 2.5;

  ispy.inset_scene.add(rx);
  ispy.inset_scene.add(gy);
  ispy.inset_scene.add(bz);

  const font_loader = new FontLoader();

  font_loader.load("./fonts/helvetiker_regular.typeface.json", (font: Font) => {
    const tps = { size: 0.75, height: 0.1, font: font };

    const x_geo = new TextGeometry("X", tps);
    const y_geo = new TextGeometry("Y", tps);
    const z_geo = new TextGeometry("Z", tps);

    const x_material = new MeshBasicMaterial({ color: 0xff0000 });
    const x_text = new Mesh(x_geo, x_material);
    x_text.position.x = length + headLength;
    x_text.name = "xtext";

    const y_material = new MeshBasicMaterial({ color: 0x00ff00 });
    const y_text = new Mesh(y_geo, y_material);
    y_text.position.y = length + headLength;
    y_text.name = "ytext";

    const z_material = new MeshBasicMaterial({ color: 0x0000ff });
    const z_text = new Mesh(z_geo, z_material);
    z_text.position.z = length + headLength;
    z_text.name = "ztext";

    ispy.inset_scene.add(x_text);
    ispy.inset_scene.add(y_text);
    ispy.inset_scene.add(z_text);
  });
}

/**
 * Initializes the application.
 */
function handleToggles() {
  // On page load hide the stats
  const stats = ispy.stats.dom;
  stats.id = "stats";
  stats.style.display = "none";

  const show_stats = getHTMLObject<HTMLInputElement>("js-show-stats");

  // FF keeps the check state on reload so force an "uncheck"
  show_stats.checked = false;

  show_stats.addEventListener("change", () =>
    show_stats.checked === true ? (stats.style.display = "block") : (stats.style.display = "none"),
  );

  const show_logo = getHTMLObject<HTMLInputElement>("js-show-logo");
  show_logo.checked = true;

  show_logo.addEventListener("change", (event: Event) => {
    const cms_logo = getHTMLObject("js-cms-logo");
    return (event.target as HTMLInputElement).checked
      ? (cms_logo.style.display = "block") // TODO should revert to default
      : (cms_logo.style.display = "none");
  });

  ispy.inverted_colors = false;

  const show_axes = getHTMLObject<HTMLInputElement>("js-show-axes");

  // FF keeps the state after a page refresh. Therefore force uncheck.
  show_axes.checked = false;

  show_axes.addEventListener("change", (event: Event) => {
    const axes = getHTMLObject("js-axes");
    return (event.target as HTMLInputElement).checked ? (axes.style.display = "none") : (axes.style.display = "block");
  });

  ispy.use_line2 = false;
  const pickable_lines = getHTMLObject<HTMLInputElement>("js-pickable_lines");
  pickable_lines.checked = false;
  pickable_lines.addEventListener("change", (event: Event) => {
    ispy.use_line2 = (event.target as HTMLInputElement).checked ? true : false;
  });

  const clipgui = getHTMLObject("js-clipgui");
  clipgui.style.display = "none";

  const clipping = getHTMLObject<HTMLInputElement>("js-clipping");
  clipping.checked = false;

  clipping.addEventListener("change", (event: Event) => {
    (event.target as HTMLInputElement).checked ? (clipgui.style.display = "block") : (clipgui.style.display = "none");
  });
}

/**
 * Handles drag and drop events for the renderer.
 * @returns void
 */
function handleDragAndDrop() {
  assertDefined(ispy.renderer, "Renderer is not initialized");
  assertDefined(ispy.renderer.domElement, "Renderer DOM element is not initialized");

  const canvas = ispy.renderer.domElement as HTMLCanvasElement;

  canvas.ondragover = function (_e: Event) {
    (this as HTMLElement).classList.add("hover");
    return false;
  };

  canvas.ondrop = function (e: DragEvent) {
    e.preventDefault();
    (this as HTMLElement).classList.remove("hover");
    if (e.dataTransfer == null) {
      console.error("No data transfer object");
      return false;
    }
    const file = e.dataTransfer.files[0];
    loadDroppedFile(file);

    return false;
  };

  canvas.addEventListener("ondragover", canvas.ondragover as EventListener);
  canvas.addEventListener("ondrop", canvas.ondrop as EventListener);
}

/**
 * Initializes ispy and all its components.
 * @returns void
 */
function init() {
  const display = getHTMLObject("js-display");

  ispy.scenes = {
    "3D": new Scene(),
    RPhi: new Scene(),
    RhoZ: new Scene(),
  };

  ispy.views = ["3D", "RPhi", "RhoZ"];

  for (const key of Object.keys(ispy.scenes)) {
    ispy.scenes[key].name = key;
  }

  ispy.current_view = "3D";
  ispy.scene = ispy.scenes[ispy.current_view];

  const height = display.clientHeight;

  initCamera();
  setupInset(height);

  useRenderer("WebGLRenderer");

  setupGUIs();
  setupClippingGUI();
  updateClipping();
  handleToggles();
  handleDragAndDrop();

  display.appendChild(ispy.stats.dom); // TODO handle the styling in css
  // The second argument is necessary to make sure that mouse events are
  // handled only when in the canvas
  // TODO check if needed
  // ispy.tcontrols = new TrackballControls(ispy.camera!, ispy.renderer.domElement);
  // ispy.tcontrols.rotateSpeed = 3.0;
  // ispy.tcontrols.zoomSpeed = 0.5;
  // ispy.tcontrols.dynamicDampingFactor = 1.0;
  // ispy.tcontrols.noRotate = false;
  // ispy.tcontrols.noPan = false;
  assertDefined(ispy.camera, "Camera is not initialized");
  assertDefined(ispy.renderer, "Renderer is not initialized");
  const ocontrols = new OrbitControls(ispy.camera, ispy.renderer.domElement as HTMLCanvasElement);
  ocontrols.enableRotate = true;

  ispy.controls = ocontrols;

  ispy.views.forEach((v) => {
    ["Detector", "Imported"].concat(data_groups).forEach((g) => {
      const obj_group = new Group();
      obj_group.name = g;
      ispy.scenes[v].add(obj_group);
    });
  });

  window.addEventListener("resize", onWindowResize, false);

  ispy.raycaster.layers.set(2);

  ispy.renderer.domElement.addEventListener("pointermove", (e) => onMouseMove(e as MouseEvent), false);
  ispy.renderer.domElement.addEventListener("pointerdown", (e) => onMouseDown(e as MouseEvent), false);

  // Are we running an animation?
  ispy.animating = false;

  setDisplayVerticalHeight(90);
  getHTMLObject<HTMLInputElement>("js-vh-slider").value = ispy.vh.toString();

  setFramerate(30);
  getHTMLObject<HTMLInputElement>("js-fps-slider").value = ispy.framerate.toString();

  getHTMLObject<HTMLInputElement>("js-transparency-slider").value = ispy.importTransparency.toString();

  getHTMLObject("js-trspy").innerHTML = ispy.importTransparency.toString();

  // getHTMLObject("js-display").appendChild(getHTMLObject("event-info"));
}

/**
 * Initializes the lighting for the scene.
 * @returns void
 */
function initLight() {
  assertDefined(ispy.scene, "Scene is not initialized");
  const intensity = 1.0;
  const length = 15.0;

  const lights = new Object3D();
  lights.name = "Lights";

  const light1 = new DirectionalLight(0xffffff, intensity);
  light1.name = "Light1";
  light1.position.set(-length, length, length);
  lights.add(light1);

  const light2 = new DirectionalLight(0xffffff, intensity);
  light2.name = "Light2";
  light2.position.set(length, -length, -length);
  lights.add(light2);
  ispy.scene.add(lights);
}

/**
 * Initializes the control panel.
 */
function initControlPanel() {
  importDetector();
  initSelectionFields();
}

/**
 * Creates a checkbox container for a given GUI controller.
 * @param cont The GUI controller to create the checkbox container for.
 */
function createCheckboxContainer(cont: GUIController) {
  const selectionField = cont as unknown as SelectionFieldController;
  
  // Create a checkbox element
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  selectionField.checkbox = false;

  // get input field
  const inputField = selectionField.domElement.querySelector("input") as HTMLInputElement;
  inputField.classList.add("sel-field")

  // Add the checkbox to the DOM
  selectionField.domElement.appendChild(checkbox);

  // Disable the input field initially
  inputField.disabled = true;
  inputField.value = "";

  checkbox.addEventListener("change", function () {
    inputField.disabled = !this.checked;
    inputField.value = this.checked ? selectionField.initialValue : "";
    selectionField.checkbox = this.checked;
  });
}

/**
 * Initializes the selection fields in the control panel.
 * @returns void
 */
function initSelectionFields() {
  const gui_elem = ispy.guiReduced;

  const folder = gui_elem.__folders["Event Selection"];
  folder.domElement.id = "selection-folder";

  const nMuon = 0,
    nElectron = 0,
    nPhoton = 0,
    chargeSign = "",
    minPt = 0,
    maxPt = Infinity,
    test = checkCurrentSelection;

  const row_obj = {
    TrackerMuons: nMuon,
    GsfElectrons: nElectron,
    Photons: nPhoton,
    charge: chargeSign,
    pt: minPt,
    minMETs: minPt,
    maxMETs: maxPt,
    check: test,
    nSelected: "0",
    firstSelected: "",
  };

  //   var help_map = analysis.selection_fields_help;
  let cont: GUIController | null = null;
  (Object.keys(row_obj) as (keyof typeof row_obj)[]).forEach((key) => {
    const elem_name = SELEC_NAME_MAP[key];
    // let help_info = help_map[key] || false;

    // add the controller to the folder
    if (key === "charge") {
      cont = folder.add(row_obj, key, ["", "positive", "negative", "opposite"]).name(elem_name);
      cont.getValue = function () {
        const result = (this.object as Record<string, string | number>)[this.property];
        return CHARGE_MAP[result];
      };
      cont.domElement.style.color = "blue";
      // cont.help(help_info);
      return;
    }

    cont = folder.add(row_obj, key).name(elem_name);
    // if (help_info) {
    //     cont.help(help_info);
    // }

    if (typeof row_obj[key] == "boolean") return;
    if (typeof row_obj[key] == "function") {
      const btnContainer = cont.domElement.previousSibling as HTMLElement;
      btnContainer.style.width = "100%";
      btnContainer.style.height = "auto";
      btnContainer.id = "clickable-button";
      return;
    }
    if (typeof row_obj[key] == "string") {
      cont.onFinishChange(function (this: SelectionFieldController) {
        this.setValue(this.initialValue);
      });
    }
    cont.onFinishChange(function (this: SelectionFieldController, value: number) {
      if (value < 0) this.setValue(0);
    });
    if (["TrackerMuons", "GsfElectrons", "Photons", "maxMETs"].includes(key)) {
      createCheckboxContainer(cont);
    }
    if (key === "pt") {
      cont.onFinishChange(function (this: SelectionFieldController, value: number) {
        if (value < 0) this.setValue(0);
        ispy.subfoldersReduced.Controllers.find((c) => c.property === "min_pt")?.setValue(value);
      });
    }
  });

  // add all controllers to the reduced subfolders for convenience
  folder.__controllers.forEach((c) => {
    ispy.subfoldersReduced.Selection.push(c);
  });
}

/**
 * Runs the application.
 * @returns void
 */
function run() {
  setTimeout(() => {
    requestAnimationFrame(run);
  }, 1000 / ispy.framerate);
  assertDefined(ispy.camera, "Camera is not initialized");
  assertDefined(ispy.inset_camera, "Inset camera is not initialized");
  assertDefined(ispy.controls, "Controls are not initialized");

  ispy.stats.update();

  ispy.controls.update();
  ispy.inset_camera.position.subVectors(ispy.camera.position, ispy.controls.target);

  ispy.inset_camera.up = ispy.camera.up;
  ispy.inset_camera.quaternion.copy(ispy.camera.quaternion);
  ispy.inset_camera.position.setLength(10);
  ispy.inset_camera.lookAt(ispy.inset_scene.position);

  for (const text of ["xtext", "ytext", "ztext"]) {
    const textObj = ispy.inset_scene.getObjectByName(text);
    if (textObj) {
      textObj.quaternion.copy(ispy.inset_camera.quaternion);
    }
  }

  render();

  if (ispy.animating) {
    update();
  }

  if (ispy.autoRotating) {
    const speed = Date.now() * 0.0005;
    ispy.camera.position.x = Math.cos(speed) * 10;
    ispy.camera.position.z = Math.sin(speed) * 10;
  }
}

export {
  init,
  initLight,
  initControlPanel,
  setDisplayVerticalHeight,
  setFramerate,
  setupGUIs,
  setupInset,
  handleToggles,
  handleDragAndDrop,
  run,
  initSelectionFields,
};
