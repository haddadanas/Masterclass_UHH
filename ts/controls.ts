import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

import { ispy } from "./config.js";
import { assertDefined, downloadData, getHTMLObject } from "./utils.js";
import { render } from "./renderer.js";

/**
 * Toggles the auto-rotation state.
 * @returns void
 */
function autoRotate() {
  const autorotateBtn = getHTMLObject<HTMLButtonElement>("js-autorotate");
  ispy.autoRotating = !ispy.autoRotating;
  autorotateBtn.classList.toggle("pressed");
}

/**
 * Enters full screen mode.
 * @returns void
 */
function enterFullscreen() {
  const container = document.body;
  if (!container) {
    alert("Cannot find container element!");
    return;
  }
  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if ((container as any).msRequestFullscreen) { // skipcq: JS-0323
    (container as any).msRequestFullscreen(); // skipcq: JS-0323
  } else if ((container as any).mozRequestFullScreen) { // skipcq: JS-0323
    (container as any).mozRequestFullScreen(); // skipcq: JS-0323
  } else if ((container as any).webkitRequestFullscreen) { // skipcq: JS-0323
    (container as any).webkitRequestFullscreen(); // skipcq: JS-0323
  } else {
    alert("Cannot go to full screen!");
  }
}

/**
 * Exits full screen mode.
 * @returns void
 */
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if ((document as any).msExitFullscreen) { // skipcq: JS-0323
    (document as any).msExitFullscreen(); // skipcq: JS-0323
  } else if ((document as any).mozCancelFullScreen) { // skipcq: JS-0323
    (document as any).mozCancelFullScreen(); // skipcq: JS-0323
  } else if ((document as any).webkitExitFullscreen) { // skipcq: JS-0323
    (document as any).webkitExitFullscreen(); // skipcq: JS-0323
  } else {
    alert("Cannot exit full screen. Try Esc?");
  }
}

/**
 * Toggles full screen mode.
 * @returns void
 */
function toggleFullscreen() { // TODO check if works properly
  const fullscreenBtn = getHTMLObject<HTMLButtonElement>("js-toggle-fullscreen");
  if (fullscreenBtn.classList.contains("pressed")) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
  fullscreenBtn.classList.toggle("pressed");
}

// document.addEventListener("webkitfullscreenchange", toggleFullscreen, false);
// document.addEventListener("mozfullscreenchange", toggleFullscreen, false);
// document.addEventListener("fullscreenchange", toggleFullscreen, false);
// document.addEventListener("MSFullscreenChange", toggleFullscreen, false);

/**
 * Reloads the page.
 * @returns void
 */
function reload() {
  location.reload();
}

/**
 * Prints the current display as Image.
 * @returns void
 */
function printImage() {
  // get the current image data
  ispy.get_image_data = true;
  render();

  assertDefined(ispy.image_data);
  downloadData(ispy.image_data, "ispy_image.png");

  // remove image data to free memory
  ispy.image_data = null;
}

/**
 * Exports the current scene as a GLTF file.
 * @returns void
 */
function exportScene() {
  assertDefined(ispy.scene);
  const exporter = new GLTFExporter();

  const options = {
    onlyVisible: true,
    binary: true,
  };

  exporter.parse(
    ispy.scene,
    (result) => {
      exportArrayBuffer(result as ArrayBuffer, "scene.glb");
    },
    options,
  );

  alert("scene.glb created");
}

/**
 * Exports a string as a file.
 * @param output The string content to export.
 * @param filename The name of the file to create.
 */
function exportString(output: BlobPart, filename: string) {
  const blob = new Blob([output], { type: "text/plain" });
  const objectURL = URL.createObjectURL(blob);

  console.log(filename);
  downloadData(objectURL, filename);

  // Use this to output to tab:
  //window.open(objectURL, '_blank');
  //window.focus();
}

/**
 * Exports a binary array buffer as a file.
 * @param output The binary content to export.
 * @param filename The name of the file to create.
 */
function exportArrayBuffer(output: BlobPart, filename: string) {
  const blob = new Blob([output], { type: "application/octect-stream" });
  const objectURL = URL.createObjectURL(blob);

  console.log(filename);
  downloadData(objectURL, filename);
}

/**
 * Exports the scene as a GLTF file in binary format.
 */
function exportGLTF_binary() {
  exportGLTF(true);
}

/**
 * Exports the scene as a GLTF file in text format.
 */
function exportGLTF_text() {
  exportGLTF(false);
}

/**
 * Exports the scene as a GLTF file.
 * @param binary If true, exports in binary format; otherwise, exports in text format.
 */
function exportGLTF(binary: boolean) {
  assertDefined(ispy.scene);

  const exporter = new GLTFExporter();

  const options = {
    binary: binary,
  };

  ispy.scene.children.forEach((c) => {
    if (c.children.length > 0 && c.name !== "Lights") {
      c.children.forEach((o) => {
        if (o.visible) {
          exporter.parse(
            o,
            (result) => {
              if (result instanceof ArrayBuffer) {
                exportArrayBuffer(result, `${o.name}.glb`);
              } else {
                const output = JSON.stringify(result, null, 2);
                exportString(output, `${o.name}.gltf`);
              }
            },
            options,
          );
        }
      });
    }
  });
}

/**
 * Exports the scene as a GLTF file.
 * @returns void
 */
function exportOBJ() {
  assertDefined(ispy.scene);

  const exporter = new OBJExporter();

  ispy.scene.children.forEach((c) => {
    if (c.children.length > 0 && c.name !== "Lights") {
      c.children.forEach((o) => {
        if (o.visible) {
          exportString(exporter.parse(o), `${o.name}.obj`);
        }
      });
    }
  });
}

export {
  autoRotate,
  enterFullscreen,
  exitFullscreen,
  toggleFullscreen,
  reload,
  printImage,
  exportScene,
  exportString,
  exportArrayBuffer,
  exportGLTF_binary,
  exportGLTF_text,
  exportGLTF,
  exportOBJ,
};
