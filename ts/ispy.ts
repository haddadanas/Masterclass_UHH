import { toggleAnimation } from "./animate.js";
import {
  autoRotate,
  exportGLTF_binary,
  exportGLTF_text,
  exportOBJ,
  exportScene,
  printImage,
  reload,
  toggleFullscreen,
} from "./controls.js";
import {
  invertColors,
  setTransparency,
  showMass,
  zoomIn,
  zoomOut,
  resetView,
  setOrthographic,
  setPerspective,
  setXY,
  setYZ,
  setZX,
  showView,
} from "./display.js";
import {
  importModel,
  loadEvent,
  loadLocalFiles,
  loadObjFiles,
  loadSelectedObj,
  loadWebFiles,
  nextEvent,
  nextSelectedEvent,
  prevEvent,
  prevSelectedEvent,
  showWebFiles,
} from "./files-load.js";
import { event_description } from "./objects-config.js";
import { updateRenderer, updateRendererInfo } from "./renderer.js";
import { init, initLight, initControlPanel, run, setDisplayVerticalHeight, setFramerate } from "./setup.js";
import { addGroups } from "./tree-view.js";
import { buildFileSummary, createCSV } from "./uhh_selection.js";
import { getHTMLObject, hideDialog, showDialog } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log(event_description);

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
  jsInvertColors.addEventListener("change", invertColors);
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

  init();
  addGroups();
  initLight();
  initControlPanel();

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

  loadWebFiles();
  run();
});
