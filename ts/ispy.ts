import { loadWebFiles } from "./files-load";
import { event_description } from "./objects-config";
import { init, initLight, initControlPanel, run } from "./setup";
import { addGroups } from "./tree-view";

document.addEventListener("DOMContentLoaded", function() {

  init();
  addGroups();
  initLight();
  initControlPanel();
  loadWebFiles();
  run();

  console.log(event_description);

});
