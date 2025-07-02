import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

import { ispy } from "./config.js";
import { getHTMLObject } from "./utils.js";
import { render } from "./renderer.js";

function autoRotate() {
  ispy.autoRotating = !ispy.autoRotating;

  getHTMLObject("js-autorotate").classList.toggle("active");
}

function enterFullscreen() {
  const container = document.getElementById("ispy");
  if (!container) {
    alert("Cannot find container element!");
    return;
  }
  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if ((container as any).msRequestFullscreen) {
    (container as any).msRequestFullscreen();
  } else if ((container as any).mozRequestFullScreen) {
    (container as any).mozRequestFullScreen();
  } else if ((container as any).webkitRequestFullscreen) {
    (container as any).webkitRequestFullscreen();
  } else {
    alert("Cannot go to full screen!");
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if ((document as any).msExitFullscreen) {
    (document as any).msExitFullscreen();
  } else if ((document as any).mozCancelFullScreen) {
    (document as any).mozCancelFullScreen();
  } else if ((document as any).webkitExitFullscreen) {
    (document as any).webkitExitFullscreen();
  } else {
    alert("Cannot exit full screen. Try Esc?");
  }
}

function toggleFullscreen() {
  getHTMLObject("enterFullscreen").classList.toggle("active");
  getHTMLObject("exitFullscreen").classList.toggle("active");
}

document.addEventListener("webkitfullscreenchange", toggleFullscreen, false);
document.addEventListener("mozfullscreenchange", toggleFullscreen, false);
document.addEventListener("fullscreenchange", toggleFullscreen, false);
document.addEventListener("MSFullscreenChange", toggleFullscreen, false);

function reload() {
  location.reload();
}



function printImage() {
  if (!ispy.image_data) {
    alert("Image data is not defined");
    return;
  }
  ispy.get_image_data = true;
  render();
  window.open(ispy.image_data, "toDataURL() image", "width=1600, height=900");
}

function exportScene() {
  if (!ispy.scene) {
    alert("Scene is not defined");
    return;
  }
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

function exportString(output: BlobPart, filename: string) {
  const blob = new Blob([output], { type: "text/plain" });
  const objectURL = URL.createObjectURL(blob);

  console.log(filename);

  // Use this to output to file:
  const link = document.createElement("a");
  link.style.display = "none";
  document.body.appendChild(link);
  link.href = objectURL;
  link.download = filename;
  link.target = "_blank";
  link.click();

  // Use this to output to tab:
  //window.open(objectURL, '_blank');
  //window.focus();
}

function exportArrayBuffer(output: BlobPart, filename: string) {
  const blob = new Blob([output], { type: "application/octect-stream" });
  const objectURL = URL.createObjectURL(blob);

  console.log(filename);

  const link = document.createElement("a");
  link.style.display = "none";
  document.body.appendChild(link);
  link.href = objectURL;
  link.download = filename;
  link.target = "_blank";
  link.click();
}

function exportGLTF_binary() {
  exportGLTF(true);
}

function exportGLTF_text() {
  exportGLTF(false);
}

function exportGLTF(binary: boolean) {
  if (!ispy.scene) {
    alert("Scene is not defined");
    return;
  }
  getHTMLObject("export-model").style.display = "none";
  //$('#export-model').hide();

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

function exportOBJ() {
  if (!ispy.scene) {
    alert("Scene is not defined");
    return;
  }
  getHTMLObject("export-model").style.display = "none";
  //$('#export-model').hide();

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
