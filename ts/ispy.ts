import {
  setupControls,
  setupKeyboardListeners,
} from "./controls.js";
import {
  loadWebFiles,
} from "./files-load.js";
import { event_description } from "./objects-config.js";
import { init, initLight, initControlPanel, run } from "./setup.js";
import { addGroups } from "./tree-view.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log(event_description);
  setupKeyboardListeners();
  setupControls();
  init();
  addGroups();
  initLight();
  initControlPanel();
  loadWebFiles();
  run();
});
