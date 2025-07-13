import { toggleAnimation } from "./animate.js";
import {
  autoRotate,
  enterFullscreen,
  exitFullscreen,
  exportGLTF_binary,
  exportGLTF_text,
  exportOBJ,
  exportScene,
  printImage,
  reload,
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
  openDialog,
  prevEvent,
  prevSelectedEvent,
  showWebFiles,
} from "./files-load.js";
import { event_description } from "./objects-config.js";
import { updateRenderer, updateRendererInfo } from "./renderer.js";
import { init, initLight, initControlPanel, run, setDisplayVerticalHeight, setFramerate } from "./setup.js";
import { addGroups } from "./tree-view.js";
import { buildFileSummary, createCSV, getSelectionResults } from "./uhh_selection.js";
import { getHTMLObject } from "./utils.js";

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
  const js3D = getHTMLObject("3d");
  const jsRPhi = getHTMLObject("rphi");
  const jsRhoZ = getHTMLObject("rhoz");
  const jsXY = getHTMLObject("xy");
  const jsYZ = getHTMLObject("yz");
  const jsZX = getHTMLObject("xz");
  const jsPerspective = getHTMLObject("perspective");
  const jsOrthographic = getHTMLObject("orthographic");
  const jsEnterFullscreen = getHTMLObject("enterFullscreen");
  const jsExitFullscreen = getHTMLObject("exitFullscreen");
  const jsRenderInfo = getHTMLObject("js-render-info");
  const jsAnalysisBtn = getHTMLObject("js-analysis-btn");
  const prevSelEvent = getHTMLObject("prev-sel-event");
  const nextSelEvent = getHTMLObject("next-sel-event");
  const jsPrintBtn = getHTMLObject("js-print-btn");
  const jsAnimate = getHTMLObject("animate");
  const jsShowWebFilesBtn = getHTMLObject("js-show-webfiles-btn");
  const jsLocalFilesBtn = getHTMLObject("js-local-files-btn");
  const importFile = getHTMLObject("import-file");
  const jsImportWeb = getHTMLObject("js-import-web");
  const jsInvertColors = getHTMLObject("invert-colors") as HTMLInputElement;
  const jsVhSlider = getHTMLObject("vh-slider") as HTMLInputElement;
  const jsFpsSlider = getHTMLObject("fps-slider") as HTMLInputElement;
  const jsTransparencySlider = getHTMLObject("transparency-slider") as HTMLInputElement;
  const jsWebGLRenderer = getHTMLObject("js-webgl-renderer");
  const jsSVGRenderer = getHTMLObject("js-svg-renderer");
  const jsExportObj = getHTMLObject("js-export-obj");
  const jsExportGltfText = getHTMLObject("js-export-gltf-text");
  const jsExportGltfBinary = getHTMLObject("js-export-gltf-binary");
  const jsLoadObj = getHTMLObject("load-obj");
  const jsLoadEvent = getHTMLObject("load-event");
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
  jsEnterFullscreen.addEventListener("click", enterFullscreen);
  jsExitFullscreen.addEventListener("click", exitFullscreen);
  jsRenderInfo.addEventListener("click", updateRendererInfo);
  jsAnalysisBtn.addEventListener("click", getSelectionResults);
  prevSelEvent.addEventListener("click", prevSelectedEvent);
  nextSelEvent.addEventListener("click", nextSelectedEvent);
  jsPrintBtn.addEventListener("click", printImage);
  jsAnimate.addEventListener("click", toggleAnimation);
  jsShowWebFilesBtn.addEventListener("click", showWebFiles);
  jsLocalFilesBtn.addEventListener("change", loadLocalFiles);
  importFile.addEventListener("change", importModel);
  jsImportWeb.addEventListener("click", () => {
    openDialog("#geometry-files");
    loadObjFiles();
    $("#import-model").modal("hide");
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
    $("#geometry-files").modal("hide");
    loadSelectedObj();
  });
  jsLoadEvent.addEventListener("click", () => {
    $("#files").modal("hide");
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
