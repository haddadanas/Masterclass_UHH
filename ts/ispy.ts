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

document.addEventListener("DOMContentLoaded", () => {
  console.log(event_description);

  // connect functions to the buttons
  document.getElementById("js-reload")?.addEventListener("click", reload);
  document.getElementById("js-prev-event-button")?.addEventListener("click", prevEvent);
  document.getElementById("js-next-event-button")?.addEventListener("click", nextEvent);
  document.getElementById("js-reset-view")?.addEventListener("click", resetView);
  document.getElementById("js-zoom-in")?.addEventListener("click", zoomIn);
  document.getElementById("js-zoom-out")?.addEventListener("click", zoomOut);
  document.getElementById("js-autorotate")?.addEventListener("click", autoRotate);
  document.getElementById("3d")?.addEventListener("click", () => showView("3D"));
  document.getElementById("rphi")?.addEventListener("click", () => showView("RPhi"));
  document.getElementById("rhoz")?.addEventListener("click", () => showView("RhoZ"));
  document.getElementById("xy")?.addEventListener("click", setXY);
  document.getElementById("yz")?.addEventListener("click", setYZ);
  document.getElementById("xz")?.addEventListener("click", setZX);
  document.getElementById("perspective")?.addEventListener("click", setPerspective);
  document.getElementById("orthographic")?.addEventListener("click", setOrthographic);
  document.getElementById("enterFullscreen")?.addEventListener("click", enterFullscreen);
  document.getElementById("exitFullscreen")?.addEventListener("click", exitFullscreen);
  document.getElementById("js-render-info")?.addEventListener("click", updateRendererInfo);
  document.getElementById("js-analysis-btn")?.addEventListener("click", getSelectionResults);
  document.getElementById("prev-sel-event")?.addEventListener("click", prevSelectedEvent);
  document.getElementById("next-sel-event")?.addEventListener("click", nextSelectedEvent);
  document.getElementById("js-print-btn")?.addEventListener("click", printImage);
  document.getElementById("animate")?.addEventListener("click", toggleAnimation);
  document.getElementById("js-show-webfiles-btn")?.addEventListener("click", showWebFiles);
  document.getElementById("js-local-files-btn")?.addEventListener("change", loadLocalFiles);
  document.getElementById("import-file")?.addEventListener("change", importModel);
  document.getElementById("js-import-web")?.addEventListener("click", () => {
    openDialog("#geometry-files");
    loadObjFiles();
    $("#import-model").modal("hide");
  });
  document.getElementById("invert-colors")?.addEventListener("change", invertColors);
  document.getElementById("vh-slider")?.addEventListener("input", (event) => {
    const value = parseFloat((event.target as HTMLInputElement).value);
    setDisplayVerticalHeight(value);
  });
  document.getElementById("fps-slider")?.addEventListener("input", (event) => {
    const value = parseFloat((event.target as HTMLInputElement).value);
    setFramerate(value);
  });
  document.getElementById("transparency-slider")?.addEventListener("input", (event) => {
    const value = parseFloat((event.target as HTMLInputElement).value);
    setTransparency(value);
  });
  document.getElementById("js-webgl-renderer")?.addEventListener("click", () => updateRenderer("WebGLRenderer"));
  document.getElementById("js-svg-renderer")?.addEventListener("click", () => updateRenderer("SVGRenderer"));
  document.getElementById("js-export-obj")?.addEventListener("click", exportOBJ);
  document.getElementById("js-export-gltf-text")?.addEventListener("click", exportGLTF_text);
  document.getElementById("js-export-gltf-binary")?.addEventListener("click", exportGLTF_binary);
  document.getElementById("load-obj")?.addEventListener("click", () => {
    $("#geometry-files").modal("hide");
    loadSelectedObj();
  });
  document.getElementById("load-event")?.addEventListener("click", () => {
    $("#files").modal("hide");
    buildFileSummary();
    loadEvent();
  });
  document.getElementById("js-csv-higgs")?.addEventListener("click", () => createCSV("Higgs"));
  document.getElementById("js-csv-z")?.addEventListener("click", () => createCSV("Z"));
  document.getElementById("js-csv-wp")?.addEventListener("click", () => createCSV("Wp"));
  document.getElementById("js-csv-wm")?.addEventListener("click", () => createCSV("Wm"));

  init();
  addGroups();
  initLight();
  initControlPanel();

  // Add keyboard listeners for shortcuts
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
  });

  loadWebFiles();
  run();
});
