import { addKeyboardListeners } from "./display";
import { loadWebFiles } from "./files-load";
import { event_description } from "./objects-config";
import { init, initLight, initControlPanel, run } from "./setup";
import { addGroups } from "./tree-view";

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
