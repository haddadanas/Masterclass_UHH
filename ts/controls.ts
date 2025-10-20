import { Color, Mesh } from "three";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

import { ispy } from "./config.js";
import {
  assertDefined,
  setLanguage,
  downloadData,
  getHTMLObject,
  hideDialog,
  showDialog,
  changeMeshMaterials,
  updateGuidesLanguage,
} from "./utils.js";
import { render, updateRenderer, updateRendererInfo } from "./renderer.js";
import {
  importModel,
  loadEvent,
  loadLocalFiles,
  loadObjFiles,
  loadSelectedObj,
  nextEvent,
  nextSelectedEvent,
  prevEvent,
  prevSelectedEvent,
  showWebFiles,
} from "./files-load.js";
import { toggleAnimation } from "./animate.js";
import { resetView, showView, setXY, setYZ, setZX, setPerspective, setOrthographic } from "./display.js";
import { setDisplayVerticalHeight, setFramerate } from "./setup.js";
import { buildFileSummary, createCSV } from "./analysis.js";
import { startTutorial } from "./tutorial.js";

// Display Controls
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
 * Enters full screen mode.
 * @returns void
 */
function enterFullscreen() {
  const container = document.body;
  if (!container) {
    alert("Cannot find container element!");
    return;
  }
  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if ((container as any).msRequestFullscreen) { // skipcq: JS-0323
    (container as any).msRequestFullscreen(); // skipcq: JS-0323
  } else if ((container as any).mozRequestFullScreen) { // skipcq: JS-0323
    (container as any).mozRequestFullScreen(); // skipcq: JS-0323
  } else if ((container as any).webkitRequestFullscreen) { // skipcq: JS-0323
    (container as any).webkitRequestFullscreen(); // skipcq: JS-0323
  } else {
    alert("Cannot go to full screen!");
  }
}

/**
 * Exits full screen mode.
 * @returns void
 */
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if ((document as any).msExitFullscreen) { // skipcq: JS-0323
    (document as any).msExitFullscreen(); // skipcq: JS-0323
  } else if ((document as any).mozCancelFullScreen) { // skipcq: JS-0323
    (document as any).mozCancelFullScreen(); // skipcq: JS-0323
  } else if ((document as any).webkitExitFullscreen) { // skipcq: JS-0323
    (document as any).webkitExitFullscreen(); // skipcq: JS-0323
  } else {
    alert("Cannot exit full screen. Try Esc?");
  }
}

/**
 * Toggles full screen mode.
 * @returns void
 */
function toggleFullscreen() {
  // TODO check if works properly
  const fullscreenBtn = getHTMLObject<HTMLButtonElement>("js-toggle-fullscreen");
  if (fullscreenBtn.classList.contains("pressed")) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
  fullscreenBtn.classList.toggle("pressed");
}

// document.addEventListener("webkitfullscreenchange", toggleFullscreen, false);
// document.addEventListener("mozfullscreenchange", toggleFullscreen, false);
// document.addEventListener("fullscreenchange", toggleFullscreen, false);
// document.addEventListener("MSFullscreenChange", toggleFullscreen, false);

/**
 * Reloads the page.
 * @returns void
 */
function reload() {
  location.reload();
}

/**
 * Inverts the colors of the scene. // TODO move to controls
 * @returns void
 */
function invertColors() {
  const htmlEl = document.documentElement;
  assertDefined(ispy.renderer, "Renderer is not defined");
  ispy.inverted_colors = !ispy.inverted_colors;

  if (!ispy.inverted_colors) {
    ispy.renderer.setClearColor(new Color(0x232323), 1);
    htmlEl.setAttribute("data-bs-theme", "dark");
  } else {
    ispy.renderer.setClearColor(new Color(0xefefef), 1);
    htmlEl.setAttribute("data-bs-theme", "light");
  }
}

/**
 * Toggles the auto-rotation state.
 * @returns void
 */
function autoRotate() {
  const autorotateBtn = getHTMLObject<HTMLButtonElement>("js-autorotate");
  ispy.autoRotating = !ispy.autoRotating;
  autorotateBtn.classList.toggle("pressed");
  if (ispy.autoRotating) {
    const animateBtn = getHTMLObject<HTMLButtonElement>("js-animate");
    animateBtn.classList.remove("pressed");
    ispy.animating = false;
  }
}

// Object Controls
/**
 * Sets the transparency for imported objects.
 * @param t The transparency value to set for the imported objects.
 * @returns void
 */
function setTransparency(t: number) {
  assertDefined(ispy.scene, "Scene is not defined");
  ispy.importTransparency = t;

  getHTMLObject("js-trspy").innerHTML = t.toString();

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
 * Exports the current scene as a GLTF file.
 * @returns void
 */
function exportScene() {
  assertDefined(ispy.scene);
  const exporter = new GLTFExporter();

  const options = {
    onlyVisible: true,
    binary: true,
  };

  exporter.parse(
    ispy.scene,
    (result) => {
      exportArrayBuffer(result as ArrayBuffer, "scene.glb");
    },
    options,
  );

  alert("scene.glb created");
}

/**
 * Exports a string as a file.
 * @param output The string content to export.
 * @param filename The name of the file to create.
 */
function exportString(output: BlobPart, filename: string) {
  const blob = new Blob([output], { type: "text/plain" });
  const objectURL = URL.createObjectURL(blob);

  console.log(filename);
  downloadData(objectURL, filename);

  // Use this to output to tab:
  //window.open(objectURL, '_blank');
  //window.focus();
}

/**
 * Exports a binary array buffer as a file.
 * @param output The binary content to export.
 * @param filename The name of the file to create.
 */
function exportArrayBuffer(output: BlobPart, filename: string) {
  const blob = new Blob([output], { type: "application/octect-stream" });
  const objectURL = URL.createObjectURL(blob);

  console.log(filename);
  downloadData(objectURL, filename);
}

/**
 * Exports the scene as a GLTF file in binary format.
 */
function exportGLTF_binary() {
  exportGLTF(true);
}

/**
 * Exports the scene as a GLTF file in text format.
 */
function exportGLTF_text() {
  exportGLTF(false);
}

/**
 * Exports the scene as a GLTF file.
 * @param binary If true, exports in binary format; otherwise, exports in text format.
 */
function exportGLTF(binary: boolean) {
  assertDefined(ispy.scene);

  const exporter = new GLTFExporter();

  const options = {
    binary: binary,
  };

  ispy.scene.children.forEach((c) => {
    if (c.children.length > 0 && c.name !== "Lights") {
      c.children.forEach((o) => {
        if (o.visible) {
          exporter.parse(
            o,
            (result) => {
              if (result instanceof ArrayBuffer) {
                exportArrayBuffer(result, `${o.name}.glb`);
              } else {
                const output = JSON.stringify(result, null, 2);
                exportString(output, `${o.name}.gltf`);
              }
            },
            options,
          );
        }
      });
    }
  });
}

/**
 * Exports the scene as a GLTF file.
 * @returns void
 */
function exportOBJ() {
  assertDefined(ispy.scene);

  const exporter = new OBJExporter();

  ispy.scene.children.forEach((c) => {
    if (c.children.length > 0 && c.name !== "Lights") {
      c.children.forEach((o) => {
        if (o.visible) {
          exportString(exporter.parse(o), `${o.name}.obj`);
        }
      });
    }
  });
}

// Page Controls
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

  getHTMLObject("js-invariant-mass").innerHTML = mass.toFixed(2);
  showDialog("invariant-mass-modal");

  ispy.selected_objects.clear();
  ispy.subfolders["info"][1].setValue(0);
}

/**
 * Prints the current display as Image.
 * @returns void
 */
function printImage() {
  // get the current image data
  ispy.get_image_data = true;
  render();

  assertDefined(ispy.image_data);
  downloadData(ispy.image_data, "ispy_image.png");

  // remove image data to free memory
  ispy.image_data = null;
}

function hideToolbarButtons() {
  const toolbar = getHTMLObject<HTMLDivElement>("js-toolbar");
  toolbar.style.display = "none";
}

function showToolbarButtons() {
  const toolbar = getHTMLObject<HTMLDivElement>("js-toolbar");
  toolbar.style.removeProperty("display");
}

function hideEventName() {
  const eventName = getHTMLObject<HTMLDivElement>("js-event-loaded");
  eventName.style.display = "none";
}

function showEventName() {
  const eventName = getHTMLObject<HTMLDivElement>("js-event-loaded");
  eventName.style.removeProperty("display");
}


function switchMain(view: "about" | "display" | "help") {
  const mainMap = {
    about: getHTMLObject<HTMLDivElement>("js-about"),
    display: getHTMLObject<HTMLDivElement>("js-display"),
    help: getHTMLObject<HTMLDivElement>("js-help"),
  };
  const btnMap = {
    about: getHTMLObject<HTMLButtonElement>("js-about-btn"),
    display: getHTMLObject<HTMLButtonElement>("js-event-display"),
    help: getHTMLObject<HTMLButtonElement>("js-help-btn"),
  };
  for (const key in mainMap) {
    if (key === view) {
      mainMap[key as keyof typeof mainMap].hidden = false;
      btnMap[key as keyof typeof btnMap].classList.add("active");
    } else {
      mainMap[key as keyof typeof mainMap].hidden = true;
      btnMap[key as keyof typeof btnMap].classList.remove("active");
    }
  }
  // Hide all guide containers
  document.querySelectorAll(".guide-container").forEach((el) => {
    (el as HTMLDivElement).removeAttribute("style");
  });
  if (view === "display") {
    showToolbarButtons();
    showEventName();
  } else {
    hideToolbarButtons();
    hideEventName();
  }
}

// Exported function
export function setupControls() {
  // get js buttons
  const jsReload = getHTMLObject("js-reload");
  const jsPrevEventButton = getHTMLObject("js-prev-event-button");
  const jsNextEventButton = getHTMLObject("js-next-event-button");
  const jsResetView = getHTMLObject("js-reset-view");
  const jsZoomIn = getHTMLObject("js-zoom-in");
  const jsZoomOut = getHTMLObject("js-zoom-out");
  const jsAutorotate = getHTMLObject("js-autorotate");
  const js3D = getHTMLObject("js-3d");
  const jsRPhi = getHTMLObject("js-rphi");
  const jsRhoZ = getHTMLObject("js-rhoz");
  const jsXY = getHTMLObject("js-xy");
  const jsYZ = getHTMLObject("js-yz");
  const jsZX = getHTMLObject("js-xz");
  const jsPerspective = getHTMLObject("js-perspective");
  const jsOrthographic = getHTMLObject("js-orthographic");
  const jsToggleFullscreen = getHTMLObject("js-toggle-fullscreen");
  const jsRenderInfo = getHTMLObject("js-render-info");
  const prevSelEvent = getHTMLObject("js-prev-sel-event");
  const nextSelEvent = getHTMLObject("js-next-sel-event");
  const jsPrintBtn = getHTMLObject("js-print-btn");
  const jsAnimate = getHTMLObject("js-animate");
  const jsShowWebFilesBtn = getHTMLObject("js-show-webfiles-btn");
  const jsLocalFilesBtn = getHTMLObject("js-local-files-btn");
  const importFile = getHTMLObject("js-import-file");
  const jsImportWeb = getHTMLObject("js-import-web");
  const jsInvertColors = getHTMLObject<HTMLInputElement>("js-display-mode");
  const jsVhSlider = getHTMLObject<HTMLInputElement>("js-vh-slider");
  const jsFpsSlider = getHTMLObject<HTMLInputElement>("js-fps-slider");
  const jsTransparencySlider = getHTMLObject<HTMLInputElement>("js-transparency-slider");
  const jsWebGLRenderer = getHTMLObject("js-webgl-renderer");
  const jsSVGRenderer = getHTMLObject("js-svg-renderer");
  const jsExportObj = getHTMLObject("js-export-obj");
  const jsExportGltfText = getHTMLObject("js-export-gltf-text");
  const jsExportGltfBinary = getHTMLObject("js-export-gltf-binary");
  const jsLoadObj = getHTMLObject("js-load-obj");
  const jsLoadEvent = getHTMLObject("js-load-event");
  const jsCsvHiggs = getHTMLObject("js-csv-higgs");
  const jsCsvZ = getHTMLObject("js-csv-z");
  const jsCsvWp = getHTMLObject("js-csv-wp");
  const jsCsvWm = getHTMLObject("js-csv-wm");
  const jsAboutBtn = getHTMLObject("js-about-btn");
  const jsHelpBtn = getHTMLObject("js-help-btn");
  const jsDisplayBtn = getHTMLObject("js-event-display");
  const jsLangEN = getHTMLObject<HTMLSelectElement>("js-lang-en");
  const jsLangDE = getHTMLObject<HTMLSelectElement>("js-lang-de");
  const jsBasicsTutorialBtn = getHTMLObject("js-basics-tutorial-btn");
  const jsControlsTutorialBtn = getHTMLObject("js-controls-tutorial-btn");
  const jsAnalysisTutorialBtn = getHTMLObject("js-analysis-tutorial-btn");

  // Tutorial button
  jsBasicsTutorialBtn.addEventListener("click", () => {
    switchMain("display");
    startTutorial("basics");
  });
  jsControlsTutorialBtn.addEventListener("click", () => {
    switchMain("display");
    startTutorial("controls");
  });
  jsAnalysisTutorialBtn.addEventListener("click", () => {
    switchMain("display");
    startTutorial("analysis");
  });

  // connect functions to the buttons
  jsAboutBtn.addEventListener("click", () => switchMain("about"));
  jsHelpBtn.addEventListener("click", () => switchMain("help"));
  jsDisplayBtn.addEventListener("click", () => switchMain("display"));

  jsLangEN.addEventListener("click", () => setLanguage("en"));
  jsLangDE.addEventListener("click", () => setLanguage("de"));

  // connect functions to the buttons
  jsReload.addEventListener("click", reload);
  jsPrevEventButton.addEventListener("click", prevEvent);
  jsNextEventButton.addEventListener("click", nextEvent);
  jsResetView.addEventListener("click", resetView);
  jsZoomIn.addEventListener("click", zoomIn);
  jsZoomOut.addEventListener("click", zoomOut);
  jsAutorotate.addEventListener("click", autoRotate);
  js3D.addEventListener("click", () => showView("3D"));
  jsRPhi.addEventListener("click", () => showView("RPhi"));
  jsRhoZ.addEventListener("click", () => showView("RhoZ"));
  jsXY.addEventListener("click", setXY);
  jsYZ.addEventListener("click", setYZ);
  jsZX.addEventListener("click", setZX);
  jsPerspective.addEventListener("click", setPerspective);
  jsOrthographic.addEventListener("click", setOrthographic);
  jsToggleFullscreen.addEventListener("click", toggleFullscreen);
  jsRenderInfo.addEventListener("click", updateRendererInfo);
  prevSelEvent.addEventListener("click", prevSelectedEvent);
  nextSelEvent.addEventListener("click", nextSelectedEvent);
  jsPrintBtn.addEventListener("click", printImage);
  jsAnimate.addEventListener("click", toggleAnimation);
  jsShowWebFilesBtn.addEventListener("click", showWebFiles);
  jsLocalFilesBtn.addEventListener("change", loadLocalFiles);
  importFile.addEventListener("change", importModel);
  jsImportWeb.addEventListener("click", () => {
    showDialog("geometry-files");
    loadObjFiles();
    hideDialog("import-model");
  });
  jsInvertColors.addEventListener("click", invertColors);
  jsVhSlider.addEventListener("input", (event) => {
    const value = parseFloat((event.target as HTMLInputElement).value);
    setDisplayVerticalHeight(value);
  });
  jsFpsSlider.addEventListener("input", (event) => {
    const value = parseFloat((event.target as HTMLInputElement).value);
    setFramerate(value);
  });
  jsTransparencySlider.addEventListener("input", (event) => {
    const value = parseFloat((event.target as HTMLInputElement).value);
    setTransparency(value);
  });
  jsWebGLRenderer.addEventListener("click", () => updateRenderer("WebGLRenderer"));
  jsSVGRenderer.addEventListener("click", () => updateRenderer("SVGRenderer"));
  jsExportObj.addEventListener("click", exportOBJ);
  jsExportGltfText.addEventListener("click", exportGLTF_text);
  jsExportGltfBinary.addEventListener("click", exportGLTF_binary);
  jsLoadObj.addEventListener("click", () => {
    hideDialog("geometry-files");
    loadSelectedObj();
  });
  jsLoadEvent.addEventListener("click", () => {
    hideDialog("files");
    buildFileSummary();
    loadEvent();
  });
  jsCsvHiggs.addEventListener("click", () => createCSV("Higgs"));
  jsCsvZ.addEventListener("click", () => createCSV("Z"));
  jsCsvWp.addEventListener("click", () => createCSV("Wp"));
  jsCsvWm.addEventListener("click", () => createCSV("Wm"));

  for (const key of ["student", "teacher", "dev"]) {
    const guideBtn = getHTMLObject<HTMLButtonElement>(`js-${key}-guide-btn`);
    guideBtn.addEventListener("click", () => {
      document.querySelectorAll(".guide-container").forEach((el) => {
        (el as HTMLDivElement).removeAttribute("style");
      });
      const guideContainer = getHTMLObject<HTMLDivElement>(`js-${key}-guide-container`);
      updateGuidesLanguage(guideContainer, ispy.lang);
      guideContainer.style.setProperty("display", "block");
    });
  }
}

export function setupKeyboardListeners() {
  // Add keyboard listeners for shortcuts
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    // Instead of a button, make output of 3D to JSON a "secret" key binding
    if (e.key === "E") {
      exportScene();
    }
    if (e.key === "ArrowUp" && e.shiftKey) {
      zoomIn();
    }
    if (e.key === "ArrowDown" && e.shiftKey) {
      zoomOut();
    }
    if (e.key === "ArrowRight") {
      nextEvent();
    }
    if (e.key === "ArrowLeft") {
      prevEvent();
    }
    if (e.key === "A") {
      toggleAnimation();
    }
    if (e.key === "m") {
      showMass();
    }
  });
}
