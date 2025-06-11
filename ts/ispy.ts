import { addKeyboardListeners } from "./display.js";
import { loadWebFiles } from "./files-load.js";
import { event_description } from "./objects-config.js";
import { init, initLight, initControlPanel, run } from "./setup.js";
import { addGroups } from "./tree-view.js";

document.addEventListener("DOMContentLoaded", () => {
  init();
  addGroups();
  initLight();
  initControlPanel();
  addKeyboardListeners();
  loadWebFiles();
  run();

  console.log(event_description);
});
