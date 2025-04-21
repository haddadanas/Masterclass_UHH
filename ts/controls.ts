import { Vector3 } from "three";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

function resetView() {
  setPerspective();
  ispy.initCamera();

  ispy.controls.reset();

  document.getElementById("3d").classList.add("active");
  document.getElementById("rphi").classList.remove("active");
  document.getElementById("rhoz").classList.remove("active");

  ispy.current_view = "3D";
  ispy.scene = ispy.scenes["3D"];
}

function setXY() {
  const length = ispy.camera.position.length();

  ispy.camera.position.x = 0;
  ispy.camera.position.y = 0;
  ispy.camera.position.z = length;
  ispy.camera.up = new Vector3(0, 1, 0);

  ispy.lookAtOrigin();
}

function setZX() {
  const length = ispy.camera.position.length();

  ispy.camera.position.x = 0;
  ispy.camera.position.y = length;
  ispy.camera.position.z = 0;
  ispy.camera.up = new Vector3(1, 0, 0);

  ispy.lookAtOrigin();
}

function setYZ() {
  const length = ispy.camera.position.length();

  ispy.camera.position.x = -length;
  ispy.camera.position.y = 0;
  ispy.camera.position.z = 0;
  ispy.camera.up = new Vector3(0, 1, 0);

  ispy.lookAtOrigin();
}

function autoRotate() {
  ispy.autoRotating = !ispy.autoRotating;

  document.getElementById("autorotate").classList.toggle("active");
}

function setOrthographic() {
  document.getElementById("perspective").classList.remove("active");
  document.getElementById("orthographic").classList.add("active");

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
  document.getElementById("perspective").classList.add("active");
  document.getElementById("orthographic").classList.remove("active");

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
      document.getElementById("3d").classList.add("active");
      document.getElementById("rphi").classList.remove("active");
      document.getElementById("rhoz").classList.remove("active");

      document.getElementById("perspective").removeAttribute("disabled");
      document.getElementById("orthographic").removeAttribute("disabled");

      document.getElementById("xy").removeAttribute("disabled");
      document.getElementById("yz").removeAttribute("disabled");
      document.getElementById("xz").removeAttribute("disabled");

      ispy.controls.enableRotate = true;

      if (ispy.current_view !== "3D") setPerspective();

      ispy.current_view = "3D";
      ispy.scene = ispy.scenes["3D"];
      break;

    case "RPhi":
      document.getElementById("3d").classList.remove("active");
      document.getElementById("rphi").classList.add("active");
      document.getElementById("rhoz").classList.remove("active");

      document.getElementById("perspective").setAttribute("disabled", "");
      document.getElementById("orthographic").setAttribute("disabled", "");

      document.getElementById("xy").setAttribute("disabled", "");
      document.getElementById("yz").setAttribute("disabled", "");
      document.getElementById("xz").setAttribute("disabled", "");

      ispy.controls.enableRotate = false;
      ispy.controls.reset();

      setOrthographic();
      setXY();

      ispy.current_view = "RPhi";
      ispy.scene = ispy.scenes["RPhi"];
      break;

    case "RhoZ":
      document.getElementById("3d").classList.remove("active");
      document.getElementById("rphi").classList.remove("active");
      document.getElementById("rhoz").classList.add("active");

      document.getElementById("perspective").setAttribute("disabled", "");
      document.getElementById("orthographic").setAttribute("disabled", "");

      document.getElementById("xy").setAttribute("disabled", "");
      document.getElementById("yz").setAttribute("disabled", "");
      document.getElementById("xz").setAttribute("disabled", "");

      ispy.controls.enableRotate = false;
      ispy.controls.reset();

      setOrthographic();
      setYZ();

      ispy.current_view = "RhoZ";
      ispy.scene = ispy.scenes["RhoZ"];
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
  } else if (container.msRequestFullscreen) {
    container.msRequestFullscreen();
  } else if (container.mozRequestFullScreen) {
    container.mozRequestFullScreen();
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
  } else {
    alert("Cannot go to full screen!");
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else {
    alert("Cannot exit full screen. Try Esc?");
  }
}

function toggleFullscreen() {
  document.getElementById("enterFullscreen").classList.toggle("active");
  document.getElementById("exitFullscreen").classList.toggle("active");
}

document.addEventListener("webkitfullscreenchange", toggleFullscreen, false);
document.addEventListener("mozfullscreenchange", toggleFullscreen, false);
document.addEventListener("fullscreenchange", toggleFullscreen, false);
document.addEventListener("MSFullscreenChange", toggleFullscreen, false);

function reload() {
  location.reload();
}

function zoomIn() {
  ispy.camera.zoom += 0.5;
  ispy.camera.updateProjectionMatrix();
}

function zoomOut() {
  ispy.camera.zoom -= 0.5;
  ispy.camera.updateProjectionMatrix();
}

function printImage() {
  ispy.get_image_data = true;
  ispy.render();
  window.open(ispy.image_data, "toDataURL() image", "width=1600, height=900");
}

function exportScene() {
  const exporter = new GLTFExporter();

  const options = {
    onlyVisible: true,
    binary: true,
  };

  exporter.parse(
    ispy.scene,
    function (result) {
      exportArrayBuffer(result, "scene.glb");
    },
    options
  );

  alert("scene.glb created");
}

function exportString(output, filename) {
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

function exportArrayBuffer(output, filename) {
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

function exportGLTF(binary) {
  document.getElementById("export-model").style.display = "none";
  //$('#export-model').hide();

  const exporter = new GLTFExporter();

  const options = {
    binary: binary,
  };

  ispy.scene.children.forEach(function (c) {
    if (c.children.length > 0 && c.name !== "Lights") {
      c.children.forEach(function (o) {
        if (o.visible) {
          exporter.parse(
            o,
            function (result) {
              if (result instanceof ArrayBuffer) {
                exportArrayBuffer(result, o.name + ".glb");
              } else {
                const output = JSON.stringify(result, null, 2);
                exportString(output, o.name + ".gltf");
              }
            },
            options
          );
        }
      });
    }
  });
}

function exportOBJ() {
  document.getElementById("export-model").style.display = "none";
  //$('#export-model').hide();

  const exporter = new OBJExporter();

  ispy.scene.children.forEach(function (c) {
    if (c.children.length > 0 && c.name !== "Lights") {
      c.children.forEach(function (o) {
        if (o.visible) {
          exportString(exporter.parse(o), o.name + ".obj");
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
  exportOBJ
};