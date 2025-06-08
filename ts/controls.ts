import { Vector3 } from "three";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

import { ispy } from "./config";
import { initCamera, lookAtOrigin, render } from "./setup";
import { getHTMLObject } from "./utils";

function resetView() {
  setPerspective();
  initCamera();

  ispy.controls.reset();

  getHTMLObject("3d").classList.add("active");
  getHTMLObject("rphi").classList.remove("active");
  getHTMLObject("rhoz").classList.remove("active");

  ispy.current_view = "3D";
  ispy.scene = ispy.scenes["3D"];
}

function setXY() {
  if (!ispy.camera) {
    console.error("Camera is not defined");
    return;
  }
  const length = ispy.camera.position.length();

  ispy.camera.position.x = 0;
  ispy.camera.position.y = 0;
  ispy.camera.position.z = length;
  ispy.camera.up = new Vector3(0, 1, 0);

  lookAtOrigin();
}

function setZX() {
  if (!ispy.camera) {
    console.error("Camera is not defined");
    return;
  }
  const length = ispy.camera.position.length();

  ispy.camera.position.x = 0;
  ispy.camera.position.y = length;
  ispy.camera.position.z = 0;
  ispy.camera.up = new Vector3(1, 0, 0);

  lookAtOrigin();
}

function setYZ() {
  if (!ispy.camera) {
    console.error("Camera is not defined");
    return;
  }
  const length = ispy.camera.position.length();

  ispy.camera.position.x = -length;
  ispy.camera.position.y = 0;
  ispy.camera.position.z = 0;
  ispy.camera.up = new Vector3(0, 1, 0);

  lookAtOrigin();
}

function autoRotate() {
  ispy.autoRotating = !ispy.autoRotating;

  getHTMLObject("autorotate").classList.toggle("active");
}

function setOrthographic() {
  if (!ispy.o_camera || !ispy.p_camera) {
    console.error("Orthographic or Perspective camera is not defined");
    return;
  }
  getHTMLObject("perspective").classList.remove("active");
  getHTMLObject("orthographic").classList.add("active");

  ispy.is_perspective = false;
  ispy.camera = ispy.o_camera;

  ispy.camera.position.x = ispy.p_camera.position.x;
  ispy.camera.position.y = ispy.p_camera.position.y;
  ispy.camera.position.z = ispy.p_camera.position.z;

  ispy.camera.zoom = ispy.p_camera.zoom;
  ispy.camera.up = ispy.p_camera.up;

  const fov = ispy.p_camera.fov;
  const aspect = ispy.p_camera.aspect;
  const near = ispy.p_camera.near;
  const far = ispy.p_camera.far;

  const focus = (near + far) / 2;

  let half_height = Math.tan((fov * Math.PI) / 180 / 2) * focus;
  let half_width = half_height * aspect;

  half_height /= ispy.p_camera.zoom;
  half_width /= ispy.p_camera.zoom;

  ispy.camera.left = -half_width;
  ispy.camera.right = half_width;
  ispy.camera.top = half_height;
  ispy.camera.bottom = -half_height;

  ispy.camera.updateProjectionMatrix();

  ispy.controls.object = ispy.camera;
  ispy.controls.update();
}

function setPerspective() {
  if (!ispy.o_camera || !ispy.p_camera) {
    console.error("Orthographic or Perspective camera is not defined");
    return;
  }
  getHTMLObject("perspective").classList.add("active");
  getHTMLObject("orthographic").classList.remove("active");

  ispy.is_perspective = true;
  ispy.camera = ispy.p_camera;

  ispy.camera.position.x = ispy.o_camera.position.x;
  ispy.camera.position.y = ispy.o_camera.position.y;
  ispy.camera.position.z = ispy.o_camera.position.z;

  ispy.camera.zoom = ispy.o_camera.zoom;
  ispy.camera.up = ispy.o_camera.up;

  ispy.camera.aspect = ispy.o_camera.right / ispy.o_camera.top;

  ispy.camera.updateProjectionMatrix();

  ispy.controls.object = ispy.camera;
  ispy.controls.update();
}

function showView(view: string) {
  switch (view) {
    case "3D":
      getHTMLObject("3d").classList.add("active");
      getHTMLObject("rphi").classList.remove("active");
      getHTMLObject("rhoz").classList.remove("active");

      getHTMLObject("perspective").removeAttribute("disabled");
      getHTMLObject("orthographic").removeAttribute("disabled");

      getHTMLObject("xy").removeAttribute("disabled");
      getHTMLObject("yz").removeAttribute("disabled");
      getHTMLObject("xz").removeAttribute("disabled");

      ispy.controls.enableRotate = true;

      if (ispy.current_view !== "3D") setPerspective();

      ispy.current_view = "3D";
      ispy.scene = ispy.scenes["3D"];
      break;

    case "RPhi":
      getHTMLObject("3d").classList.remove("active");
      getHTMLObject("rphi").classList.add("active");
      getHTMLObject("rhoz").classList.remove("active");

      getHTMLObject("perspective").setAttribute("disabled", "");
      getHTMLObject("orthographic").setAttribute("disabled", "");

      getHTMLObject("xy").setAttribute("disabled", "");
      getHTMLObject("yz").setAttribute("disabled", "");
      getHTMLObject("xz").setAttribute("disabled", "");

      ispy.controls.enableRotate = false;
      ispy.controls.reset();

      setOrthographic();
      setXY();

      ispy.current_view = "RPhi";
      ispy.scene = ispy.scenes["RPhi"];
      break;

    case "RhoZ":
      getHTMLObject("3d").classList.remove("active");
      getHTMLObject("rphi").classList.remove("active");
      getHTMLObject("rhoz").classList.add("active");

      getHTMLObject("perspective").setAttribute("disabled", "");
      getHTMLObject("orthographic").setAttribute("disabled", "");

      getHTMLObject("xy").setAttribute("disabled", "");
      getHTMLObject("yz").setAttribute("disabled", "");
      getHTMLObject("xz").setAttribute("disabled", "");

      ispy.controls.enableRotate = false;
      ispy.controls.reset();

      setOrthographic();
      setYZ();

      ispy.current_view = "RhoZ";
      ispy.scene = ispy.scenes["RhoZ"];
      break;
    default:
      console.error(`Invalid view: ${view}`);
      break;
  }
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

function zoomIn() {
  if (!ispy.camera) {
    console.error("Camera is not defined");
    return;
  }
  ispy.camera.zoom += 0.5;
  ispy.camera.updateProjectionMatrix();
}

function zoomOut() {
  if (!ispy.camera) {
    console.error("Camera is not defined");
    return;
  }
  ispy.camera.zoom -= 0.5;
  ispy.camera.updateProjectionMatrix();
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
  resetView,
  setXY,
  setZX,
  setYZ,
  autoRotate,
  setOrthographic,
  setPerspective,
  showView,
  enterFullscreen,
  exitFullscreen,
  toggleFullscreen,
  reload,
  zoomIn,
  zoomOut,
  printImage,
  exportScene,
  exportString,
  exportArrayBuffer,
  exportGLTF_binary,
  exportGLTF_text,
  exportGLTF,
  exportOBJ,
};
