import { ispy } from "./config.js";
import { setupControls } from "./controls.js";
import { setLanguage, setupTooltips } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  ispy.lang = localStorage.getItem("language") || navigator.language || "en";
  setupTooltips();
  setupControls();
  setLanguage(ispy.lang);
});
