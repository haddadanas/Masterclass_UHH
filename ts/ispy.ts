import { ispy } from "./config.js";
import { setupControls, setupKeyboardListeners } from "./controls.js";
import { loadWebFiles } from "./files-load.js";
import { event_description } from "./objects-config.js";
import { init, initLight, initControlPanel, run } from "./setup.js";
import { addGroups } from "./tree-view.js";
import { setLanguage, setupTooltips } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log(event_description);
  ispy.lang = localStorage.getItem("language") || navigator.language || "en";
  setupTooltips();
  setupKeyboardListeners();
  setupControls();
  init();
  addGroups();
  initLight();
  initControlPanel();
  loadWebFiles();
  setLanguage(ispy.lang);
  run();
});
