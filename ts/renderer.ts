import { Camera, Color, WebGLRenderer } from "three";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { getHTMLObject } from "./utils";
import { ispy } from "./config";

function updateControls(redererClass: string, camera: Camera, rendererDom: HTMLCanvasElement) {
  let controls: OrbitControls | TrackballControls;
  if (redererClass === "WebGLRenderer") {
    controls = new OrbitControls(camera, rendererDom);
    controls.enableRotate = true;
  } else if (redererClass === "SVGRenderer") {
    controls = new TrackballControls(camera, rendererDom);
    controls.rotateSpeed = 3.0;
    controls.zoomSpeed = 0.5;
  } else {
    throw new Error(`Unknown controls class: ${redererClass}`);
  }
  ispy.controls = controls;
}

export function updateRendererInfo() {
  if (!ispy.renderer) {
    console.error("Renderer is not defined");
    return;
  }
  const info = ispy.renderer.info;

  let html = `<strong>${ispy.renderer_name} info: </strong>`;

  html += "<dl>";
  html += "<dt><strong> render </strong></dt>";

  for (const prop of Object.keys(info.render)) {
    html += `<dd>${prop}: ${(info.render as Record<string, number>)[prop]}</dd>`;
  }

  if ("memory" in info && info.memory) {
    html += "<dt><strong> memory </strong></dt>";

    for (const prop of Object.keys(info.memory)) {
      html += `<dd>${prop}: ${(info.memory as Record<string, number>)[prop]}</dd>`;
    }
  }

  getHTMLObject("renderer-info").innerHTML = html;
}
export function updateClipping() {
  if (!ispy.renderer || !(ispy.renderer instanceof WebGLRenderer)) {
    return;
  }
  ispy.renderer.clippingPlanes = ispy.global_planes;
  ispy.renderer.localClippingEnabled = true;
}

export function useRenderer(type: string) {
  const display = document.getElementById("display");
  if (!display) {
    console.error("Display element not found");
    return;
  }
  const width = display.clientWidth;
  const height = display.clientHeight;

  const rendererTypes: Record<string, typeof WebGLRenderer | typeof SVGRenderer> = {
    WebGLRenderer: WebGLRenderer,
    SVGRenderer: SVGRenderer,
  };

  const renderer = new rendererTypes[type]({ antialias: true, alpha: true });
  const inset_renderer = new rendererTypes[type]({ antialias: true, alpha: true });

  renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
  inset_renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);

  renderer.setClearColor(new Color(0x232323), 1);
  inset_renderer.setClearColor(new Color(0x232323), 0);

  renderer.setSize(width, height);
  inset_renderer.setSize(height / 5, height / 5);

  ispy.renderer = renderer;
  ispy.renderer_name = type;
  ispy.inset_renderer = inset_renderer;

  display.appendChild(ispy.renderer.domElement);
  const axes_html = getHTMLObject("axes");
  axes_html.appendChild(ispy.inset_renderer.domElement);

  const settings = getHTMLObject("settings");
  settings.style.display = "none";
}

export function updateRenderer(type: string) {
  if (type === ispy.renderer_name) {
    alert(`${type} is already in use`);
    return;
  }
  if (!ispy.camera) {
    console.error("Camera is not defined");
    return;
  }
  if (!ispy.renderer || !ispy.inset_renderer) {
    console.error("Renderer is not defined");
    return;
  }

  getHTMLObject("display").removeChild(ispy.renderer.domElement);
  getHTMLObject("axes").removeChild(ispy.inset_renderer.domElement);

  useRenderer(type);
  updateControls(type, ispy.camera, ispy.renderer.domElement as HTMLCanvasElement);
  updateRendererInfo();
  updateClipping();
}

export function render() {
  ispy.renderer!.render(ispy.scene!, ispy.camera!);

  if (ispy.get_image_data) {
    ispy.image_data = (ispy.renderer!.domElement as HTMLCanvasElement).toDataURL();
    ispy.get_image_data = false;
  }

  if (ispy.inset_renderer !== null) {
    ispy.inset_renderer!.render(ispy.inset_scene, ispy.inset_camera!);
  }
}