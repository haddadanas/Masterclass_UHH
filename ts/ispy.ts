import { ispy } from "./config.js";
import { setupControls, setupKeyboardListeners } from "./controls.js";
import { loadWebFiles } from "./files-load.js";
import { init, initLight, initControlPanel, run } from "./setup.js";
import { addGroups } from "./tree-view.js";
import { setLanguage, setupTooltips } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
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
  console.log("Initialization complete.");
  run();
});
