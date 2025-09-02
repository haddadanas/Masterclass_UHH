import {
  Vector3,
  Object3D,
  Color,
  Line,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  DoubleSide,
  Mesh,
  SphereGeometry,
  BufferGeometry,
  BufferAttribute,
  EdgesGeometry,
  Vector3Tuple,
  Matrix4,
  ArrowHelper,
  CubicBezierCurve3,
  CylinderGeometry,
  LineDashedMaterial,
  RingGeometry,
} from "three";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";

import { ispy } from "./config.js";
import { getHTMLObject } from "./utils.js";
import { Selection, SelectionType, StyleType } from "./ispy.interfaces.js";

// helpful type definition
type DataArray = Array<any>; // skipcq: JS-0323
type DetectorCollectionEntry = [number, ...(number[] | number[][])];

/**
 * Creates a wireframe box geometry from the provided data.
 * @param data The data array containing vertex positions.
 * @param ci The index of the current box.
 * @returns The wireframe box geometry.
 */
function makeWireframeBox(data: DataArray, ci: number): EdgesGeometry {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  // front
  addFace3(data[ci], data[ci + 1], data[ci + 2]);
  addFace3(data[ci + 2], data[ci + 3], data[ci]);

  // back
  addFace3(data[ci + 4], data[ci + 5], data[ci + 6]);
  addFace3(data[ci + 6], data[ci + 7], data[ci + 4]);

  // top
  addFace3(data[ci + 4], data[ci + 5], data[ci + 1]);
  addFace3(data[ci + 1], data[ci], data[ci + 4]);

  // bottom
  addFace3(data[ci + 7], data[ci + 6], data[ci + 2]);
  addFace3(data[ci + 2], data[ci + 3], data[ci + 7]);

  // left
  addFace3(data[ci + 0], data[ci + 3], data[ci + 7]);
  addFace3(data[ci + 7], data[ci + 4], data[ci + 0]);

  // right
  addFace3(data[ci + 1], data[ci + 5], data[ci + 6]);
  addFace3(data[ci + 6], data[ci + 2], data[ci + 1]);

  const box_buffer = new BufferGeometry();
  box_buffer.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  const box = new EdgesGeometry(box_buffer);

  return box;
}

/**
 * Creates a wireframe face from the provided data.
 * @param data The data array containing vertex positions.
 * @param ci The index of the current face.
 * @returns The wireframe face geometry.
 */
function makeWireFace(data: DataArray, ci: number): EdgesGeometry {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  addFace3(data[ci], data[ci + 1], data[ci + 2]);
  addFace3(data[ci + 2], data[ci + 3], data[ci]);

  const box_buffer = new BufferGeometry();
  box_buffer.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  const box = new EdgesGeometry(box_buffer);

  return box;
}

/**
 * Creates a solid face geometry from the provided data.
 * @param data The data array containing vertex positions.
 * @param ci The index of the current face.
 * @returns The solid face buffer geometry.
 */
function makeSolidFace(data: DataArray, ci: number): BufferGeometry {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  addFace3(data[ci], data[ci + 1], data[ci + 2]);
  addFace3(data[ci + 2], data[ci + 3], data[ci]);

  const box_buffer = new BufferGeometry();
  box_buffer.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  return box_buffer;
}

/**
 * Creates a solid box geometry from the provided data.
 * @param data The data array containing vertex positions.
 * @param ci The index of the current box.
 * @returns The solid box geometry.
 */
function makeSolidBox(data: DataArray, ci: number): [BufferGeometry, EdgesGeometry] {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  // front
  addFace3(data[ci], data[ci + 1], data[ci + 2]);
  addFace3(data[ci + 2], data[ci + 3], data[ci]);

  // back
  addFace3(data[ci + 4], data[ci + 5], data[ci + 6]);
  addFace3(data[ci + 6], data[ci + 7], data[ci + 4]);

  // top
  addFace3(data[ci + 4], data[ci + 5], data[ci + 1]);
  addFace3(data[ci + 1], data[ci], data[ci + 4]);

  // bottom
  addFace3(data[ci + 7], data[ci + 6], data[ci + 2]);
  addFace3(data[ci + 2], data[ci + 3], data[ci + 7]);

  // left
  addFace3(data[ci + 0], data[ci + 3], data[ci + 7]);
  addFace3(data[ci + 7], data[ci + 4], data[ci + 0]);

  // right
  addFace3(data[ci + 1], data[ci + 5], data[ci + 6]);
  addFace3(data[ci + 6], data[ci + 2], data[ci + 1]);

  const box_buffer = new BufferGeometry();
  box_buffer.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  const box_edges = new EdgesGeometry(box_buffer);

  return [box_buffer, box_edges];
}

/**
 * Creates a solid box geometry with RZ coordinates from the provided data.
 * @param data The data array containing vertex positions.
 * @param ci The index of the current box.
 * @returns The solid box geometry.
 */
function makeSolidBoxRZ(data: DataArray, ci: number): [BufferGeometry, EdgesGeometry] {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  // Front vertices
  const f1 = data[ci];
  const f2 = data[ci + 1];
  const f3 = data[ci + 2];
  const f4 = data[ci + 3];

  // Back vertices
  const b1 = data[ci + 4];
  const b2 = data[ci + 5];
  const b3 = data[ci + 6];
  const b4 = data[ci + 7];

  const v0 = projectPoint(f1, f1);
  const v1 = projectPoint(f2, f1);
  const v2 = projectPoint(f3, f1);
  const v3 = projectPoint(f4, f1);

  const v4 = projectPoint(b1, f1);
  const v5 = projectPoint(b2, f1);
  const v6 = projectPoint(b3, f1);
  const v7 = projectPoint(b4, f1);

  // front
  addFace3(v0, v1, v2);
  addFace3(v2, v3, v0);

  // back
  addFace3(v4, v5, v6);
  addFace3(v6, v7, v4);

  // top
  addFace3(v4, v5, v1);
  addFace3(v1, v0, v4);

  // bottom
  addFace3(v7, v6, v2);
  addFace3(v2, v3, v7);

  // left
  addFace3(v0, v3, v7);
  addFace3(v7, v4, v0);

  // right
  addFace3(v1, v5, v6);
  addFace3(v6, v2, v1);

  const box_buffer = new BufferGeometry();
  box_buffer.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  const box_edges = new EdgesGeometry(box_buffer);

  return [box_buffer, box_edges];
}

/**
 * Creates a scaled solid box geometry based on the provided data and energy.
 * @param data The data array containing vertex positions.
 * @param boxes The array to store the created box geometries.
 * @param ci The index of the current box.
 * @param energy The energy value used for scaling.
 * @param scale The scale factor.
 */
function makeScaledSolidBox(data: DataArray, boxes: DataArray, ci: number, energy: number, scale: number) {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  const v0 = new Vector3(...data[ci]);
  const v1 = new Vector3(...data[ci + 1]);
  const v2 = new Vector3(...data[ci + 2]);
  const v3 = new Vector3(...data[ci + 3]);

  const v4 = new Vector3(...data[ci + 4]);
  const v5 = new Vector3(...data[ci + 5]);
  const v6 = new Vector3(...data[ci + 6]);
  const v7 = new Vector3(...data[ci + 7]);

  scale = energy / scale;

  const center = new Vector3();

  center.addVectors(v0, v1);
  center.add(v2).add(v3).add(v4).add(v5).add(v6).add(v7);

  center.divideScalar(8.0);

  v0.sub(center);
  v0.multiplyScalar(scale);
  v0.add(center);

  v1.sub(center);
  v1.multiplyScalar(scale);
  v1.add(center);

  v2.sub(center);
  v2.multiplyScalar(scale);
  v2.add(center);

  v3.sub(center);
  v3.multiplyScalar(scale);
  v3.add(center);

  v4.sub(center);
  v5.sub(center);
  v6.sub(center);
  v7.sub(center);

  v4.multiplyScalar(scale);
  v5.multiplyScalar(scale);
  v6.multiplyScalar(scale);
  v7.multiplyScalar(scale);

  v4.add(center);
  v5.add(center);
  v6.add(center);
  v7.add(center);

  // front
  addFace3(v0.toArray(), v1.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v0.toArray());
  //back
  addFace3(v4.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v7.toArray(), v4.toArray());
  //top
  addFace3(v4.toArray(), v5.toArray(), v1.toArray());
  addFace3(v1.toArray(), v0.toArray(), v4.toArray());
  //bottom
  addFace3(v7.toArray(), v6.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v7.toArray());
  //left
  addFace3(v0.toArray(), v3.toArray(), v7.toArray());
  addFace3(v7.toArray(), v4.toArray(), v0.toArray());
  //right
  addFace3(v1.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v2.toArray(), v1.toArray());

  const box = new BufferGeometry();
  box.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  boxes.push(box);
}

/**
 * Creates a solid box geometry with RZ coordinates and scaling based on energy.
 * @param data The data array containing vertex positions.
 * @param boxes The array to store the created box geometries.
 * @param ci The index of the current box.
 * @param energy The energy value used for scaling.
 * @param scale The scale factor.
 */
function makeScaledSolidBoxRZ(data: DataArray, boxes: DataArray, ci: number, energy: number, scale: number) {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  // Front vertices
  const f1 = new Vector3(...data[ci]);
  const f2 = new Vector3(...data[ci + 1]);
  const f3 = new Vector3(...data[ci + 2]);
  const f4 = new Vector3(...data[ci + 3]);

  // Back vertices
  const b1 = new Vector3(...data[ci + 4]);
  const b2 = new Vector3(...data[ci + 5]);
  const b3 = new Vector3(...data[ci + 6]);
  const b4 = new Vector3(...data[ci + 7]);

  let yf1 = Math.sqrt(f1.x * f1.x + f1.y * f1.y);
  let yf2 = Math.sqrt(f2.x * f2.x + f2.y * f2.y);
  let yf3 = Math.sqrt(f3.x * f3.x + f3.y * f3.y);
  let yf4 = Math.sqrt(f4.x * f4.x + f4.y * f4.y);

  let yb1 = Math.sqrt(b1.x * b1.x + b1.y * b1.y);
  let yb2 = Math.sqrt(b2.x * b2.x + b2.y * b2.y);
  let yb3 = Math.sqrt(b3.x * b3.x + b3.y * b3.y);
  let yb4 = Math.sqrt(b4.x * b4.x + b4.y * b4.y);

  let x = 0.001;

  if (f1.y < 0.0) {
    yf1 = -yf1;
    yf2 = -yf2;
    yf3 = -yf3;
    yf4 = -yf4;
    yb1 = -yb1;
    yb2 = -yb2;
    yb3 = -yb3;
    yb4 = -yb4;
    x = -x;
  }

  const v0 = new Vector3(x, yf1, f1.z);
  const v1 = new Vector3(2 * x, yf2, f2.z);
  const v2 = new Vector3(2 * x, yf3, f3.z);
  const v3 = new Vector3(x, yf4, f4.z);

  const v4 = new Vector3(x, yb1, b1.z);
  const v5 = new Vector3(2 * x, yb2, b2.z);
  const v6 = new Vector3(2 * x, yb3, b3.z);
  const v7 = new Vector3(x, yb4, b4.z);

  scale = energy / scale;

  const center = new Vector3();

  center.addVectors(v0, v1);
  center.add(v2).add(v3).add(v4).add(v5).add(v6).add(v7);

  center.divideScalar(8.0);

  v0.sub(center);
  v0.multiplyScalar(scale);
  v0.add(center);

  v1.sub(center);
  v1.multiplyScalar(scale);
  v1.add(center);

  v2.sub(center);
  v2.multiplyScalar(scale);
  v2.add(center);

  v3.sub(center);
  v3.multiplyScalar(scale);
  v3.add(center);

  v4.sub(center);
  v5.sub(center);
  v6.sub(center);
  v7.sub(center);

  v4.multiplyScalar(scale);
  v5.multiplyScalar(scale);
  v6.multiplyScalar(scale);
  v7.multiplyScalar(scale);

  v4.add(center);
  v5.add(center);
  v6.add(center);
  v7.add(center);

  // front
  addFace3(v0.toArray(), v1.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v0.toArray());
  //back
  addFace3(v4.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v7.toArray(), v4.toArray());
  //top
  addFace3(v4.toArray(), v5.toArray(), v1.toArray());
  addFace3(v1.toArray(), v0.toArray(), v4.toArray());
  //bottom
  addFace3(v7.toArray(), v6.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v7.toArray());
  //left
  addFace3(v0.toArray(), v3.toArray(), v7.toArray());
  addFace3(v7.toArray(), v4.toArray(), v0.toArray());
  //right
  addFace3(v1.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v2.toArray(), v1.toArray());

  const box = new BufferGeometry();
  box.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  boxes.push(box);
}

/**
 * Creates a solid box geometry with RZ coordinates and scaling based on energy.
 * @param data The data array containing vertex positions.
 * @param towers The array to store the created tower geometries.
 * @param ci The index of the current tower.
 * @param energy The energy value used for scaling.
 * @param scale The scale factor.
 */
function makeScaledSolidTower(data: DataArray, towers: DataArray, ci: number, energy: number, scale: number) {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  // Front vertices
  const v0 = new Vector3(...data[ci]);
  const v1 = new Vector3(...data[ci + 1]);
  const v2 = new Vector3(...data[ci + 2]);
  const v3 = new Vector3(...data[ci + 3]);

  // Back vertices
  const v4 = new Vector3(...data[ci + 4]);
  const v5 = new Vector3(...data[ci + 5]);
  const v6 = new Vector3(...data[ci + 6]);
  const v7 = new Vector3(...data[ci + 7]);

  scale = energy / scale;

  v4.sub(v0);
  v5.sub(v1);
  v6.sub(v2);
  v7.sub(v3);

  v4.normalize();
  v5.normalize();
  v6.normalize();
  v7.normalize();

  v4.multiplyScalar(scale);
  v5.multiplyScalar(scale);
  v6.multiplyScalar(scale);
  v7.multiplyScalar(scale);

  v4.addVectors(v0, v4);
  v5.addVectors(v1, v5);
  v6.addVectors(v2, v6);
  v7.addVectors(v3, v7);

  // front
  addFace3(v0.toArray(), v1.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v0.toArray());
  //back
  addFace3(v4.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v7.toArray(), v4.toArray());
  //top
  addFace3(v4.toArray(), v5.toArray(), v1.toArray());
  addFace3(v1.toArray(), v0.toArray(), v4.toArray());
  //bottom
  addFace3(v7.toArray(), v6.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v7.toArray());
  //left
  addFace3(v0.toArray(), v3.toArray(), v7.toArray());
  addFace3(v7.toArray(), v4.toArray(), v0.toArray());
  //right
  addFace3(v1.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v2.toArray(), v1.toArray());

  const tower = new BufferGeometry();
  tower.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  towers.push(tower);
}

/**
 * Creates a solid tower geometry with RZ coordinates and scaling based on energy.
 * @param data The data array containing vertex positions.
 * @param towers The array to store the created tower geometries.
 * @param ci The index of the current tower.
 * @param energy The energy value used for scaling.
 * @param scale The scale factor.
 */
function makePFCandidateTowersRZ(data: DataArray, towers: DataArray, ci: number, energy: number, scale: number) {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  // Front vertices
  const f1 = new Vector3(...data[ci]);
  const f2 = new Vector3(...data[ci + 1]);
  const f3 = new Vector3(...data[ci + 2]);
  const f4 = new Vector3(...data[ci + 3]);

  // Back vertices
  const b1 = new Vector3(...data[ci + 4]);
  const b2 = new Vector3(...data[ci + 5]);
  const b3 = new Vector3(...data[ci + 6]);
  const b4 = new Vector3(...data[ci + 7]);

  let yf1 = Math.sqrt(f1.x * f1.x + f1.y * f1.y);
  let yf2 = Math.sqrt(f2.x * f2.x + f2.y * f2.y);
  let yf3 = Math.sqrt(f3.x * f3.x + f3.y * f3.y);
  let yf4 = Math.sqrt(f4.x * f4.x + f4.y * f4.y);

  let yb1 = Math.sqrt(b1.x * b1.x + b1.y * b1.y);
  let yb2 = Math.sqrt(b2.x * b2.x + b2.y * b2.y);
  let yb3 = Math.sqrt(b3.x * b3.x + b3.y * b3.y);
  let yb4 = Math.sqrt(b4.x * b4.x + b4.y * b4.y);

  let x = 0.001;
  const layer = -0.5;

  if (f1.y < 0.0) {
    yf1 = -yf1;
    yf2 = -yf2;
    yf3 = -yf3;
    yf4 = -yf4;
    yb1 = -yb1;
    yb2 = -yb2;
    yb3 = -yb3;
    yb4 = -yb4;
    x = -x;
  }

  if (f2.z > 0.0) x = -x;

  const v0 = new Vector3(layer + x, yf1, f1.z);
  const v1 = new Vector3(layer + 2 * x, yf2, f2.z);
  const v2 = new Vector3(layer + 2 * x, yf3, f3.z);
  const v3 = new Vector3(layer + x, yf4, f4.z);

  const v4 = new Vector3(layer + x, yb1, b1.z);
  const v5 = new Vector3(layer + 2 * x, yb2, b2.z);
  const v6 = new Vector3(layer + 2 * x, yb3, b3.z);
  const v7 = new Vector3(layer + x, yb4, b4.z);

  scale = energy / scale;

  v4.sub(v0);
  v5.sub(v1);
  v6.sub(v2);
  v7.sub(v3);

  v4.normalize();
  v5.normalize();
  v6.normalize();
  v7.normalize();

  v4.multiplyScalar(scale);
  v5.multiplyScalar(scale);
  v6.multiplyScalar(scale);
  v7.multiplyScalar(scale);

  v4.addVectors(v0, v4);
  v5.addVectors(v1, v5);
  v6.addVectors(v2, v6);
  v7.addVectors(v3, v7);

  // front
  addFace3(v0.toArray(), v1.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v0.toArray());
  //back
  addFace3(v4.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v7.toArray(), v4.toArray());
  //top
  addFace3(v4.toArray(), v5.toArray(), v1.toArray());
  addFace3(v1.toArray(), v0.toArray(), v4.toArray());
  //bottom
  addFace3(v7.toArray(), v6.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v7.toArray());
  //left
  addFace3(v0.toArray(), v3.toArray(), v7.toArray());
  addFace3(v7.toArray(), v4.toArray(), v0.toArray());
  //right
  addFace3(v1.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v2.toArray(), v1.toArray());

  const tower = new BufferGeometry();
  tower.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  towers.push(tower);
}

/**
 * Creates PFCandidate towers based on the provided data and energy.
 * @param data The data array containing vertex positions.
 * @param towers The array to store the created tower geometries.
 * @param ci The index of the current tower.
 * @param energy The energy value used for scaling.
 * @param scale The scale factor.
 */
function makePFCandidateTowers(data: DataArray, towers: DataArray, ci: number, energy: number, scale: number) {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: Vector3Tuple[]) => {
    all_positions = all_positions.concat(...vectors);
  };

  // Front vertices
  const v0 = new Vector3(...data[ci]);
  const v1 = new Vector3(...data[ci + 1]);
  const v2 = new Vector3(...data[ci + 2]);
  const v3 = new Vector3(...data[ci + 3]);

  // Back vertices
  const v4 = new Vector3(...data[ci + 4]);
  const v5 = new Vector3(...data[ci + 5]);
  const v6 = new Vector3(...data[ci + 6]);
  const v7 = new Vector3(...data[ci + 7]);

  scale = energy / scale;

  v4.sub(v0);
  v5.sub(v1);
  v6.sub(v2);
  v7.sub(v3);

  v4.normalize();
  v5.normalize();
  v6.normalize();
  v7.normalize();

  v4.multiplyScalar(scale);
  v5.multiplyScalar(scale);
  v6.multiplyScalar(scale);
  v7.multiplyScalar(scale);

  v4.addVectors(v0, v4);
  v5.addVectors(v1, v5);
  v6.addVectors(v2, v6);
  v7.addVectors(v3, v7);

  // front
  addFace3(v0.toArray(), v1.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v0.toArray());
  //back
  addFace3(v4.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v7.toArray(), v4.toArray());
  //top
  addFace3(v4.toArray(), v5.toArray(), v1.toArray());
  addFace3(v1.toArray(), v0.toArray(), v4.toArray());
  //bottom
  addFace3(v7.toArray(), v6.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v7.toArray());
  //left
  addFace3(v0.toArray(), v3.toArray(), v7.toArray());
  addFace3(v7.toArray(), v4.toArray(), v0.toArray());
  //right
  addFace3(v1.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v2.toArray(), v1.toArray());

  const tower = new BufferGeometry();
  tower.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  towers.push(tower);
}

/**
 * Creates PFCandidate towers in RZ coordinates based on the provided data and energy.
 * @param data The data array containing vertex positions.
 * @param towers The array to store the created tower geometries.
 * @param scale The scale factor.
 * @param selection The selection criteria for the towers.
 */
function makeEcalPFCandidateTowers(
  data: DetectorCollectionEntry,
  towers: DataArray,
  scale: number,
  selection: Selection,
) {
  const energy = data[0];

  if (energy > (selection.min_energy ?? 0)) {
    makePFCandidateTowers(data, towers, 6, energy, scale);
  }
}

/**
 * Creates PFCandidate towers in RZ coordinates based on the provided data and energy.
 * @param data The data array containing vertex positions.
 * @param towers The array to store the created tower geometries.
 * @param scale The scale factor.
 * @param selection The selection criteria for the towers.
 */
function makeEcalPFCandidateTowersRZ(
  data: DetectorCollectionEntry,
  towers: DataArray,
  scale: number,
  selection: Selection,
) {
  const energy = data[0];

  if (energy > (selection.min_energy ?? 0)) {
    makePFCandidateTowersRZ(data, towers, 6, energy, scale);
  }
}

/**
 * Creates Hcal PFCandidate towers in RZ coordinates based on the provided data and energy.
 * @param data The data array containing vertex positions.
 * @param towers The array to store the created tower geometries.
 * @param scale The scale factor.
 * @param selection The selection criteria for the towers.
 */
function makeHcalPFCandidateTowersRZ(
  data: DetectorCollectionEntry,
  towers: DataArray,
  scale: number,
  selection: Selection,
) {
  const energy = data[0];

  if (energy > (selection.min_energy ?? 0)) {
    makeScaledSolidTowerRZ(data, towers, 6, energy, scale);
  }
}

/**
 * Creates Hcal PFCandidate towers based on the provided data and energy.
 * @param data The data array containing vertex positions.
 * @param towers The array to store the created tower geometries.
 * @param scale The scale factor.
 * @param selection The selection criteria for the towers.
 */
function makeHcalPFCandidateTowers(
  data: DetectorCollectionEntry,
  towers: DataArray,
  scale: number,
  selection: Selection,
) {
  const energy = data[0];

  if (energy > (selection.min_energy ?? 0)) {
    makePFCandidateTowers(data, towers, 6, energy, scale);
  }
}

// Transform energy towers in R-Z view:
// All hits above XZ plane go up, below - down.

/**
 * Creates a scaled solid tower geometry with RZ coordinates based on the provided data and energy.
 * @param data The data array containing vertex positions.
 * @param towers The array to store the created tower geometries.
 * @param ci The index of the current tower.
 * @param energy The energy of the current tower.
 * @param scale The scale factor.
 */
function makeScaledSolidTowerRZ(data: DataArray, towers: DataArray, ci: number, energy: number, scale: number) {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  // Front vertices
  const f1 = new Vector3(...data[ci]);
  const f2 = new Vector3(...data[ci + 1]);
  const f3 = new Vector3(...data[ci + 2]);
  const f4 = new Vector3(...data[ci + 3]);

  // Back vertices
  const b1 = new Vector3(...data[ci + 4]);
  const b2 = new Vector3(...data[ci + 5]);
  const b3 = new Vector3(...data[ci + 6]);
  const b4 = new Vector3(...data[ci + 7]);

  let yf1 = Math.sqrt(f1.x * f1.x + f1.y * f1.y);
  let yf2 = Math.sqrt(f2.x * f2.x + f2.y * f2.y);
  let yf3 = Math.sqrt(f3.x * f3.x + f3.y * f3.y);
  let yf4 = Math.sqrt(f4.x * f4.x + f4.y * f4.y);

  let yb1 = Math.sqrt(b1.x * b1.x + b1.y * b1.y);
  let yb2 = Math.sqrt(b2.x * b2.x + b2.y * b2.y);
  let yb3 = Math.sqrt(b3.x * b3.x + b3.y * b3.y);
  let yb4 = Math.sqrt(b4.x * b4.x + b4.y * b4.y);

  let x = 0.001;
  const layer = -0.5;

  if (f1.y < 0) {
    yf1 = -yf1;
    yf2 = -yf2;
    yf3 = -yf3;
    yf4 = -yf4;
    yb1 = -yb1;
    yb2 = -yb2;
    yb3 = -yb3;
    yb4 = -yb4;
    x = -x;
  }

  if (f2.z > 0) x = -x;

  const v0 = new Vector3(layer + x, yf1, f1.z);
  const v1 = new Vector3(layer + 2 * x, yf2, f2.z);
  const v2 = new Vector3(layer + 2 * x, yf3, f3.z);
  const v3 = new Vector3(layer + x, yf4, f4.z);

  const v4 = new Vector3(layer + x, yb1, b1.z);
  const v5 = new Vector3(layer + 2 * x, yb2, b2.z);
  const v6 = new Vector3(layer + 2 * x, yb3, b3.z);
  const v7 = new Vector3(layer + x, yb4, b4.z);

  scale = energy / scale;

  v4.sub(v0);
  v5.sub(v1);
  v6.sub(v2);
  v7.sub(v3);

  v4.normalize();
  v5.normalize();
  v6.normalize();
  v7.normalize();

  v4.multiplyScalar(scale);
  v5.multiplyScalar(scale);
  v6.multiplyScalar(scale);
  v7.multiplyScalar(scale);

  v4.addVectors(v0, v4);
  v5.addVectors(v1, v5);
  v6.addVectors(v2, v6);
  v7.addVectors(v3, v7);

  // front
  addFace3(v0.toArray(), v1.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v0.toArray());
  //back
  addFace3(v4.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v7.toArray(), v4.toArray());
  //top
  addFace3(v4.toArray(), v5.toArray(), v1.toArray());
  addFace3(v1.toArray(), v0.toArray(), v4.toArray());
  //bottom
  addFace3(v7.toArray(), v6.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v7.toArray());
  //left
  addFace3(v0.toArray(), v3.toArray(), v7.toArray());
  addFace3(v7.toArray(), v4.toArray(), v0.toArray());
  //right
  addFace3(v1.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v2.toArray(), v1.toArray());

  const tower = new BufferGeometry();
  tower.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  towers.push(tower);
}

/**
 * Creates a tracker piece geometry based on the provided data.
 * @param data The data array containing vertex positions.
 * @returns The tracker piece geometry.
 */
function makeTrackerPiece(data: DataArray): EdgesGeometry {
  return makeWireFace(data, 1);
}

/**
 * Projects a 3D vector onto a 2D plane defined by a second vector.
 * @param v The 3D vector to project.
 * @param s The 2D plane vector.
 * @returns The projected 2D vector.
 */
function projectVector(v: Vector3, s: Vector3): Vector3 {
  const size = Math.sqrt(v.x * v.x + v.y * v.y);

  if (s.y < 0.0) return new Vector3(0, -size, v.z);

  return new Vector3(0, size, v.z);
}

/**
 * Projects a 3D point onto a 2D plane defined by a second point.
 * @param v The 3D point to project.
 * @param s The 2D plane point.
 * @returns The projected 2D point.
 */
function projectPoint(v: number[], s: number[]): number[] {
  const size = Math.sqrt(v[0] * v[0] + v[1] * v[1]);

  if (s[1] < 0.0) return [0, -size, v[2]];

  return [0, size, v[2]];
}

/**
 * Creates track points in RZ coordinates based on the provided data and association.
 * @param data The data array containing vertex positions.
 * @param extra The array containing additional vertex information.
 * @param assoc The array containing associations between vertices.
 * @param style The style information for the track points.
 * @param selection The selection criteria for the track points.
 * @returns The created track points in RZ coordinates.
 * @throws Will throw an error if no association is provided.
 */
function makeTrackPointsRZ(
  data: DataArray,
  extra: number[][][],
  assoc: number[][][],
  style: StyleType,
  selection: SelectionType,
): Line[] {
  if (!assoc) {
    throw "No association!";
  }

  //   let cut = [];
  let mi = 0;
  let pi;
  const positions: Vector3[][] = [];
  const lps: Vector3[] = [];
  let ap: number[][], ai: number;

  for (let i = 0; i < data.length; i++) {
    positions[i] = [];

    ai = 20 + i * 21;

    if (ai >= assoc.length) {
      ai = assoc.length - 1;
    }

    ap = assoc[ai];

    // Find the last point for the trackpoints collection.
    // This is needed for projection to determine whether
    // or not it's above or below the axis.
    // if (ispy.use_line2) {
    //   lps.push(...extra[ap[1][1]][0]);
    // } else {
    lps.push(new Vector3(...extra[ap[1][1]][0]));
    // }
  }

  for (const entry of assoc) {
    mi = entry[0][1];
    pi = entry[1][1];

    // if (ispy.use_line2) {
    //   positions[mi].push(projectPoint(...extra[pi][0], lps[mi]));
    // } else {
    positions[mi].push(projectVector(new Vector3(...extra[pi][0]), lps[mi]));
    // }
  }

  const tcolor = new Color(style.color);
  const transp = true;

  const lines: Line[] = [];

  for (let k = 0; k < positions.length; k++) {
    // if (ispy.use_line2) {
    //   const line2 = new Line2(
    //     new LineGeometry().setPositions(positions[k]),
    //     new LineMaterial({
    //       color: tcolor,
    //       linewidth: style.linewidth * 0.001,
    //       transparent: transp,
    //       opacity: style.opacity,
    //     })
    //   );

    //   line2.userData.pt = data[k][selection.index];
    //   line2.visible =
    //     data[k][selection.index] < selection.min_pt ? false : true;
    //   line2.computeLineDistances();
    //   lines.push(line2);
    // } else {
    const line = new Line(
      new BufferGeometry().setFromPoints(positions[k]),
      new LineBasicMaterial({
        color: tcolor,
        transparent: transp,
        opacity: style.opacity,
      }),
    );

    line.userData.pt = data[k][selection.index];
    line.visible = data[k][selection.index] < selection.min_pt ? false : true;
    lines.push(line);
    // }
  }

  return lines;
}

/**
 * Creates track points in RZ coordinates based on the provided data and association.
 * @param data The data array containing vertex positions.
 * @param extra The array containing additional vertex information.
 * @param assoc The array containing associations between vertices.
 * @param style The style information for the track points.
 * @param selection The selection criteria for the track points.
 * @returns The created track points in RZ coordinates.
 * @throws Will throw an error if no association is provided.
 */
function makeTrackPoints(
  data: DataArray,
  extra: number[][][],
  assoc: number[][][],
  style: StyleType,
  selection: SelectionType,
): Line[] {
  if (!assoc) {
    throw "No association!";
  }

  //   let cut = [];
  let mi = 0;
  let pi;
  const positions: Vector3[][] = [];

  for (let i = 0; i < data.length; i++) {
    positions[i] = [];
  }

  for (const j of assoc) {
    mi = j[0][1];
    pi = j[1][1];

    // if (ispy.use_line2) {
    //   positions[mi].push(...extra[pi][0]);
    // } else {
    positions[mi].push(new Vector3(...extra[pi][0]));
    // }
  }

  const tcolor = new Color(style.color);
  const transp = true;

  const lines: Line[] = [];

  for (let k = 0; k < positions.length; k++) {
    // if (ispy.use_line2) {
    //   const line2 = new Line2(
    //     new LineGeometry().setPositions(positions[k]),
    //     new LineMaterial({
    //       color: tcolor,
    //       linewidth: style.linewidth * 0.001,
    //       transparent: transp,
    //       opacity: style.opacity,
    //     })
    //   );

    //   line2.userData.pt = data[k][selection.index];
    //   line2.visible =
    //     data[k][selection.index] < selection.min_pt ? false : true;
    //   line2.computeLineDistances();
    //   lines.push(line2);
    // } else {
    const line = new Line(
      new BufferGeometry().setFromPoints(positions[k]),
      new LineBasicMaterial({
        color: tcolor,
        transparent: transp,
        opacity: style.opacity,
      }),
    );

    line.userData.pt = data[k][selection.index];
    line.visible = data[k][selection.index] < selection.min_pt ? false : true;
    lines.push(line);
    // }
  }

  return lines;
}

/**
 * Creates track pieces based on the provided data and associations.
 * @param tracks The track data.
 * @param extras The extra data.
 * @param assocs The associations between tracks and extras.
 * @param style The style information for the tracks.
 * @param selection The selection criteria for the tracks.
 * @returns The created track pieces.
 * @throws Will throw an error if no association is provided.
 */
function makeTracks(
  tracks: DataArray,
  extras: DataArray,
  assocs: DataArray,
  style: StyleType,
  selection: SelectionType,
): Line[] {
  if (!assocs) {
    throw "No association!";
  }

  let ei;
  let p1, d1, p2, d2;
  let p3, p4;
  let distance, scale, curve;
  const curves: Line[] = [];

  const tcolor = new Color();
  tcolor.setStyle(style.color);

  const transp = true;

  for (let i = 0; i < assocs.length; i++) {
    const pt = tracks[i][selection.index];
    // let eta = tracks[i][4];
    // let phi = tracks[i][3];

    // ti = assocs[i][0][1];
    ei = assocs[i][1][1];

    p1 = new Vector3(...extras[ei][0]);
    d1 = new Vector3(...extras[ei][1]);
    d1.normalize();

    p2 = new Vector3(...extras[ei][2]);
    d2 = new Vector3(...extras[ei][3]);
    d2.normalize();

    // What's all this then?
    // Well, we know the beginning and end points of the track as well
    // as the directions at each of those points. This in-principle gives
    // us the 4 control points needed for a cubic bezier spline.
    // The control points from the directions are determined by moving along 0.25
    // of the distance between the beginning and end points of the track.
    // This 0.25 is nothing more than a fudge factor that reproduces closely-enough
    // the NURBS-based drawing of tracks done in iSpy. At some point it may be nice
    // to implement the NURBS-based drawing but I value my sanity.

    distance = p1.distanceTo(p2);
    scale = distance * 0.25;

    p3 = new Vector3(p1.x + scale * d1.x, p1.y + scale * d1.y, p1.z + scale * d1.z);
    p4 = new Vector3(p2.x - scale * d2.x, p2.y - scale * d2.y, p2.z - scale * d2.z);

    curve = new CubicBezierCurve3(p1, p3, p4, p2);
    const line = new Line(
      new BufferGeometry().setFromPoints(curve.getPoints(32)),
      new LineBasicMaterial({
        color: tcolor,
        opacity: style.opacity,
        transparent: transp,
      }),
    );

    line.userData.pt = pt;
    line.visible = pt > selection.min_pt ? true : false;
    curves.push(line);
  }

  return curves;
}

/**
 * Creates track pieces in RZ coordinates based on the provided data and associations.
 * @param tracks The track data.
 * @param extras The extra data.
 * @param assocs The associations between tracks and extras.
 * @param style The style information for the tracks.
 * @param selection The selection criteria for the tracks.
 * @returns The created track pieces in RZ coordinates.
 */
function makeTracksRZ(
  tracks: DataArray,
  extras: DataArray,
  assocs: DataArray,
  style: StyleType,
  selection: SelectionType,
): Line[] {
  if (!assocs) {
    throw "No association!";
  }

  let ei;
  let p1, d1, p2, d2;
  let p3, p4;
  let distance, scale, curve;
  const curves: Line[] = [];

  const tcolor = new Color();
  tcolor.setStyle(style.color);

  const transp = true;

  for (let i = 0; i < assocs.length; i++) {
    const pt = tracks[i][selection.index];
    // let eta = tracks[i][4];
    // let phi = tracks[i][3];

    // ti = assocs[i][0][1];
    ei = assocs[i][1][1];

    p2 = new Vector3(...extras[ei][2]);

    p1 = projectVector(new Vector3(...extras[ei][0]), p2);
    d1 = projectVector(new Vector3(...extras[ei][1]), p2);
    d1.normalize();

    p2 = projectVector(p2, p2);
    d2 = projectVector(new Vector3(...extras[ei][3]), p2);
    d2.normalize();

    // What's all this then?
    // Well, we know the beginning and end points of the track as well
    // as the directions at each of those points. This in-principle gives
    // us the 4 control points needed for a cubic bezier spline.
    // The control points from the directions are determined by moving along 0.25
    // of the distance between the beginning and end points of the track.
    // This 0.25 is nothing more than a fudge factor that reproduces closely-enough
    // the NURBS-based drawing of tracks done in iSpy. At some point it may be nice
    // to implement the NURBS-based drawing but I value my sanity.

    distance = p1.distanceTo(p2);
    scale = distance * 0.25;

    p3 = new Vector3(p1.x + scale * d1.x, p1.y + scale * d1.y, p1.z + scale * d1.z);
    p4 = new Vector3(p2.x - scale * d2.x, p2.y - scale * d2.y, p2.z - scale * d2.z);

    curve = new CubicBezierCurve3(p1, p3, p4, p2);
    const line = new Line(
      new BufferGeometry().setFromPoints(curve.getPoints(32)),
      new LineBasicMaterial({
        color: tcolor,
        opacity: style.opacity,
        transparent: transp,
      }),
    );

    line.userData.pt = pt;
    line.visible = pt > selection.min_pt ? true : false;
    curves.push(line);
  }

  return curves;
}

/**
 * Creates thick track geometries based on the provided data and associations.
 * @param tracks The track data.
 * @param extras The extra data.
 * @param assocs The associations between tracks and extras.
 * @param style The style information for the tracks.
 * @param selection The selection criteria for the tracks.
 * @returns The created thick track geometries.
 */
function makeThickTracks(
  tracks: DataArray,
  extras: DataArray,
  assocs: DataArray,
  style: StyleType,
  selection: SelectionType,
): Object3D[] {
  if (!assocs) {
    throw "No association!";
  }

  let ei;
  let p1, d1, p2, d2;
  let p3, p4;
  let distance, scale, curve;
  const curves: Object3D[] = [];

  const tcolor = new Color();
  tcolor.setStyle(style.color);

  const transp = true;

  for (let i = 0; i < assocs.length; i++) {
    const pt = tracks[i][selection.index];
    // let eta = tracks[i][4];
    // let phi = tracks[i][3];

    // ti = assocs[i][0][1];
    ei = assocs[i][1][1];

    p1 = new Vector3(...extras[ei][0]);
    d1 = new Vector3(...extras[ei][1]);
    d1.normalize();

    p2 = new Vector3(...extras[ei][2]);
    d2 = new Vector3(...extras[ei][3]);
    d2.normalize();

    // What's all this then?
    // Well, we know the beginning and end points of the track as well
    // as the directions at each of those points. This in-principle gives
    // us the 4 control points needed for a cubic bezier spline.
    // The control points from the directions are determined by moving along 0.25
    // of the distance between the beginning and end points of the track.
    // This 0.25 is nothing more than a fudge factor that reproduces closely-enough
    // the NURBS-based drawing of tracks done in iSpy. At some point it may be nice
    // to implement the NURBS-based drawing but I value my sanity.

    distance = p1.distanceTo(p2);
    scale = distance * 0.25;

    p3 = new Vector3(p1.x + scale * d1.x, p1.y + scale * d1.y, p1.z + scale * d1.z);
    p4 = new Vector3(p2.x - scale * d2.x, p2.y - scale * d2.y, p2.z - scale * d2.z);

    curve = new CubicBezierCurve3(p1, p3, p4, p2);

    if (ispy.use_line2) {
      const lg = new LineGeometry();
      const positions: number[] = [];
      curve.getPoints(32).forEach((p) => {
        positions.push(p.x, p.y, p.z);
      });
      lg.setPositions(positions);

      const line = new Line2(
        lg,
        new LineMaterial({
          color: tcolor.getHex(),
          opacity: style.opacity,
          transparent: transp,
          linewidth: style.linewidth * 0.001,
        }),
      );

      line.computeLineDistances();

      line.userData.pt = pt;
      line.visible = pt > selection.min_pt ? true : false;
      curves.push(line);
    } else {
      const line = new Line(
        new BufferGeometry().setFromPoints(curve.getPoints(32)),
        new LineBasicMaterial({
          color: tcolor,
          opacity: style.opacity,
          transparent: transp,
        }),
      );

      line.userData.pt = pt;
      line.visible = pt > selection.min_pt ? true : false;
      curves.push(line);
    }
  }

  return curves;
}

/**
 * Creates thick track geometries in RZ coordinates based on the provided data and associations.
 * @param tracks The track data.
 * @param extras The extra data.
 * @param assocs The associations between tracks and extras.
 * @param style The style information for the tracks.
 * @param selection The selection criteria for the tracks.
 * @returns The created thick track geometries.
 */
function makeThickTracksRZ(
  tracks: DataArray,
  extras: DataArray,
  assocs: DataArray,
  style: StyleType,
  selection: SelectionType,
): Object3D[] {
  if (!assocs) {
    throw "No association!";
  }

  let ei;
  let p1, d1, p2, d2;
  let p3, p4;
  let distance, scale, curve;
  const curves: Object3D[] = [];

  const tcolor = new Color();
  tcolor.setStyle(style.color);

  const transp = true;

  for (let i = 0; i < assocs.length; i++) {
    const pt = tracks[i][selection.index];
    // let eta = tracks[i][4];
    // let phi = tracks[i][3];

    // ti = assocs[i][0][1];
    ei = assocs[i][1][1];

    p2 = new Vector3(...extras[ei][2]);

    p1 = projectVector(new Vector3(...extras[ei][0]), p2);
    d1 = projectVector(new Vector3(...extras[ei][1]), p2);
    d1.normalize();

    p2 = projectVector(p2, p2);
    d2 = projectVector(new Vector3(...extras[ei][3]), p2);
    d2.normalize();

    // What's all this then?
    // Well, we know the beginning and end points of the track as well
    // as the directions at each of those points. This in-principle gives
    // us the 4 control points needed for a cubic bezier spline.
    // The control points from the directions are determined by moving along 0.25
    // of the distance between the beginning and end points of the track.
    // This 0.25 is nothing more than a fudge factor that reproduces closely-enough
    // the NURBS-based drawing of tracks done in iSpy. At some point it may be nice
    // to implement the NURBS-based drawing but I value my sanity.

    distance = p1.distanceTo(p2);
    scale = distance * 0.25;

    p3 = new Vector3(p1.x + scale * d1.x, p1.y + scale * d1.y, p1.z + scale * d1.z);
    p4 = new Vector3(p2.x - scale * d2.x, p2.y - scale * d2.y, p2.z - scale * d2.z);

    curve = new CubicBezierCurve3(p1, p3, p4, p2);

    if (ispy.use_line2) {
      const lg = new LineGeometry();
      const positions: number[] = [];
      curve.getPoints(32).forEach((p) => {
        positions.push(p.x, p.y, p.z);
      });
      lg.setPositions(positions);

      const line = new Line2(
        lg,
        new LineMaterial({
          color: tcolor.getHex(),
          opacity: style.opacity,
          transparent: transp,
          linewidth: style.linewidth * 0.001,
        }),
      );

      line.computeLineDistances();

      line.userData.pt = pt;
      line.visible = pt > selection.min_pt ? true : false;
      curves.push(line);
    } else {
      const line = new Line(
        new BufferGeometry().setFromPoints(curve.getPoints(32)),
        new LineBasicMaterial({
          color: tcolor,
          opacity: style.opacity,
          transparent: transp,
        }),
      );

      line.userData.pt = pt;
      line.visible = pt > selection.min_pt ? true : false;
      curves.push(line);
    }
  }

  return curves;
}

/**
 * Creates a vertex mesh based on the provided data and style.
 * @param data The data array containing vertex positions.
 * @param style The style information for the vertex.
 * @returns The created vertex mesh.
 */
function makeVertex(data: DataArray, style: StyleType): Mesh {
  const geometry = new SphereGeometry(style.radius, 32, 32);
  const hcolor = new Color(style.color);
  const transp = true;

  const material = new MeshBasicMaterial({
    color: hcolor,
    transparent: transp,
    opacity: style.opacity,
  });

  const vertex = new Mesh(geometry, material);
  vertex.position.x = data[2][0];
  vertex.position.y = data[2][1];
  vertex.position.z = data[2][2];

  return vertex;
}

/**
 * Creates a vertex composite candidate mesh based on the provided data and style.
 * @param data The data array containing vertex positions.
 * @param style The style information for the vertex.
 * @returns The created vertex composite candidate mesh.
 */
function makeVertexCompositeCandidate(data: DataArray, style: StyleType): Mesh {
  const geometry = new SphereGeometry(style.radius, 32, 32);
  const hcolor = new Color(style.color);
  const transp = true;

  const material = new MeshBasicMaterial({
    color: hcolor,
    transparent: transp,
    opacity: style.opacity,
  });

  const vertex = new Mesh(geometry, material);
  vertex.position.x = data[0][0];
  vertex.position.y = data[0][1];
  vertex.position.z = data[0][2];

  return vertex;
}

/**
 * Creates a simulation vertex mesh based on the provided data and style.
 * @param data The data array containing vertex positions.
 * @param style The style information for the vertex.
 * @returns The created simulation vertex mesh.
 */
function makeSimVertex(data: DataArray, style: StyleType): Mesh | null {
  if (data[1] !== -1) return null;

  const geometry = new SphereGeometry(0.005, 32, 32);
  const hcolor = new Color(style.color);

  const transp = true;

  const material = new MeshBasicMaterial({
    color: hcolor,
    transparent: transp,
    opacity: style.opacity,
  });

  const vertex = new Mesh(geometry, material);
  vertex.position.x = data[0][0];
  vertex.position.y = data[0][1];
  vertex.position.z = data[0][2];

  return vertex;
}

/**
 *
 * @param _data The data array containing vertex positions.
 * @param extra The extra data array.
 * @param assoc The association data array.
 * @param style The style information for the vertex.
 * @param _selection The selection information.
 * @returns The created vertex mesh.
 */
function makeCaloClusters(
  _data: DataArray,
  extra: DataArray,
  assoc: DataArray,
  style: StyleType,
  _selection: SelectionType,
): Mesh[] {
  if (!assoc) {
    throw "No association!";
  }

  let ri = 0;
  const boxes: BufferGeometry[] = [];

  for (let j = 0; j < assoc.length; j++) {
    ri = assoc[j][1][1];
    boxes[j] = makeSolidFace(extra[ri], 2);
  }

  const ccolor = new Color(style.color);

  let transp = false;

  if (style.opacity < 1.0) {
    transp = true;
  }

  const clusters: Mesh[] = [];

  for (const box of boxes) {
    clusters.push(
      new Mesh(
        box,
        new MeshBasicMaterial({
          color: ccolor,
          transparent: transp,
          opacity: style.opacity,
          side: DoubleSide,
        }),
      ),
    );
  }

  return clusters;
}

/**
 * Creates an ECAL Digi geometry based on the provided data.
 * @param data The data array containing vertex positions.
 * @param boxes The boxes array.
 * @param scale The scale factor.
 * @param selection The selection information.
 */
function makeEcalDigi(data: DataArray, boxes: DataArray, scale: number, selection: SelectionType) {
  const energy = data[0];

  if (energy > selection.min_energy) {
    makeScaledSolidTower(data, boxes, 15, energy, scale);
  }
}

/**
 * Creates an HCAL Digi geometry based on the provided data.
 * @param data The data array containing vertex positions.
 * @param boxes The boxes array.
 * @param scale The scale factor.
 * @param selection The selection information.
 */
function makeERecHit_V2(data: DataArray, boxes: DataArray, scale: number, selection: SelectionType) {
  const energy = data[0];

  if (energy > selection.min_energy) {
    makeScaledSolidTower(data, boxes, 5, energy, scale);
  }
}

/**
 * Creates an HCAL RecHit geometry based on the provided data.
 * @param data The data array containing vertex positions.
 * @param geometry The geometry array.
 * @param scale The scale factor.
 * @param selection The selection information.
 */
function makeHRecHit_V2(data: DataArray, geometry: DataArray, scale: number, selection: SelectionType) {
  const energy = data[0];

  if (energy > selection.min_energy) {
    makeScaledSolidBox(data, geometry, 5, energy, scale);
  }
}

/**
 * Creates an ECAL RecHit geometry in RZ coordinates based on the provided data.
 * @param data The data array containing vertex positions.
 * @param boxes The boxes array.
 * @param scale The scale factor.
 * @param selection The selection information.
 */
function makeERecHit_RZ(data: DataArray, boxes: DataArray, scale: number, selection: SelectionType) {
  const energy = data[0];

  if (energy > selection.min_energy) {
    makeScaledSolidTowerRZ(data, boxes, 5, energy, scale);
  }
}

/**
 * Creates an HCAL RecHit geometry in RZ coordinates based on the provided data.
 * @param data The data array containing vertex positions.
 * @param geometry The geometry array.
 * @param scale The scale factor.
 * @param selection The selection information.
 */
function makeHRecHit_RZ(data: DataArray, geometry: DataArray, scale: number, selection: SelectionType) {
  const energy = data[0];

  if (energy > selection.min_energy) {
    makeScaledSolidBoxRZ(data, geometry, 5, energy, scale);
  }
}

/**
 * Creates an HCAL RecHit geometry based on the provided data.
 * @param data The data array containing vertex positions.
 * @param geometry The geometry array.
 * @param scale The scale factor.
 * @param selection The selection information.
 */
function makeHGCRecHit(data: DataArray, geometry: DataArray, scale: number, selection: SelectionType) {
  const energy = data[0];

  if (energy > selection.min_energy) {
    makeScaledSolidBox(data, geometry, 5, energy, 0.05 * scale);
  }
}

/**
 * Creates a CaloTower geometry based on the provided data.
 * @param data The data array containing vertex positions.
 * @param egeometry The ECAL geometry array.
 * @param hgeometry The HCAL geometry array.
 * @param scale The scale factor.
 * @param selection The selection information.
 */
function makeCaloTower(
  data: DataArray,
  egeometry: DataArray,
  hgeometry: DataArray,
  scale: number,
  selection: SelectionType,
) {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  const et = data[0];

  const emEnergy = data[5];
  const hadEnergy = data[4];

  const eta = data[1];
  //   const phi = data[2];

  const theta = 2 * Math.atan(Math.exp(-eta));

  const ci = 11;

  if (et > selection.min_energy) {
    const f1 = new Vector3(...data[ci]);
    const f2 = new Vector3(...data[ci + 1]);
    const f3 = new Vector3(...data[ci + 2]);
    const f4 = new Vector3(...data[ci + 3]);

    const b1e = new Vector3(...data[ci + 4]);
    const b2e = new Vector3(...data[ci + 5]);
    const b3e = new Vector3(...data[ci + 6]);
    const b4e = new Vector3(...data[ci + 7]);

    const b1h = b1e;
    const b2h = b2e;
    const b3h = b3e;
    const b4h = b4e;

    const escale = scale * (emEnergy > 0 ? emEnergy * Math.sin(theta) : 0);
    const hscale = scale * (hadEnergy > 0 ? hadEnergy * Math.sin(theta) : 0);

    if (escale > 0) {
      b1e.normalize();
      b2e.normalize();
      b3e.normalize();
      b4e.normalize();

      b1e.multiplyScalar(escale);
      b2e.multiplyScalar(escale);
      b3e.multiplyScalar(escale);
      b4e.multiplyScalar(escale);

      b1e.addVectors(f1, b1e);
      b2e.addVectors(f2, b2e);
      b3e.addVectors(f3, b3e);
      b4e.addVectors(f4, b4e);

      // front
      addFace3(f1.toArray(), f2.toArray(), f3.toArray());
      addFace3(f3.toArray(), f4.toArray(), f1.toArray());
      //back
      addFace3(b1e.toArray(), b2e.toArray(), b3e.toArray());
      addFace3(b3e.toArray(), b4e.toArray(), b1e.toArray());
      //top
      addFace3(b1e.toArray(), b2e.toArray(), f2.toArray());
      addFace3(f2.toArray(), f1.toArray(), b1e.toArray());
      //bottom
      addFace3(b4e.toArray(), b3e.toArray(), f3.toArray());
      addFace3(f3.toArray(), f4.toArray(), b4e.toArray());
      //left
      addFace3(f1.toArray(), f4.toArray(), b4e.toArray());
      addFace3(b4e.toArray(), b1e.toArray(), f1.toArray());
      //right
      addFace3(f2.toArray(), b2e.toArray(), b3e.toArray());
      addFace3(b3e.toArray(), f3.toArray(), f2.toArray());

      const ebox = new BufferGeometry();
      ebox.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

      egeometry.push(ebox);
    }

    all_positions = [];

    if (hscale > 0) {
      const vectorList: Vector3[] = [];

      if (escale > 0) {
        vectorList.push(b1e);
        vectorList.push(b2e);
        vectorList.push(b3e);
        vectorList.push(b4e);
      } else {
        vectorList.push(f1);
        vectorList.push(f2);
        vectorList.push(f3);
        vectorList.push(f4);
      }

      b1h.normalize();
      b2h.normalize();
      b3h.normalize();
      b4h.normalize();

      b1h.multiplyScalar(hscale);
      b2h.multiplyScalar(hscale);
      b3h.multiplyScalar(hscale);
      b4h.multiplyScalar(hscale);

      if (escale > 0) {
        b1h.addVectors(b1e, b1h);
        b2h.addVectors(b2e, b2h);
        b3h.addVectors(b3e, b3h);
        b4h.addVectors(b4e, b4h);
      } else {
        b1h.addVectors(f1, b1h);
        b2h.addVectors(f2, b2h);
        b3h.addVectors(f3, b3h);
        b4h.addVectors(f4, b4h);
      }

      vectorList.push(b1h);
      vectorList.push(b2h);
      vectorList.push(b3h);
      vectorList.push(b4h);

      // front
      addFace3(vectorList[0].toArray(), vectorList[1].toArray(), vectorList[2].toArray());
      addFace3(vectorList[2].toArray(), vectorList[3].toArray(), vectorList[1].toArray());
      //back
      addFace3(vectorList[4].toArray(), vectorList[5].toArray(), vectorList[6].toArray());
      addFace3(vectorList[6].toArray(), vectorList[7].toArray(), vectorList[4].toArray());
      //top
      addFace3(vectorList[4].toArray(), vectorList[5].toArray(), vectorList[1].toArray());
      addFace3(vectorList[1].toArray(), vectorList[0].toArray(), vectorList[4].toArray());
      //bottom
      addFace3(vectorList[7].toArray(), vectorList[6].toArray(), vectorList[2].toArray());
      addFace3(vectorList[2].toArray(), vectorList[3].toArray(), vectorList[7].toArray());
      //left
      addFace3(vectorList[0].toArray(), vectorList[3].toArray(), vectorList[7].toArray());
      addFace3(vectorList[7].toArray(), vectorList[4].toArray(), vectorList[0].toArray());
      //right
      addFace3(vectorList[1].toArray(), vectorList[5].toArray(), vectorList[6].toArray());
      addFace3(vectorList[6].toArray(), vectorList[2].toArray(), vectorList[1].toArray());

      const hbox = new BufferGeometry();
      hbox.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

      hgeometry.push(hbox);
    }
  }
}

/**
 * Creates a DataArray for DT (Drift Tubes) based on the provided data.
 * @param dt The data array containing vertex positions.
 * @returns The created EdgesGeometry for DT.
 */
function makeDT(dt: DataArray): EdgesGeometry {
  return makeWireframeBox(dt, 1);
}

/**
 * Creates a DataArray for CSC (Cathode Strip Chambers) based on the provided data.
 * @param csc The data array containing vertex positions for CSC (Cathode Strip Chambers).
 * @returns The created EdgesGeometry for CSC.
 */
function makeCSC(csc: DataArray): EdgesGeometry {
  return makeWireframeBox(csc, 1);
}

/**
 * Creates a DataArray for GEM (Gas Electron Multiplier) based on the provided data.
 * @param gem The data array containing vertex positions for GEM (Gas Electron Multiplier).
 * @returns The created EdgesGeometry for GEM.
 */
function makeGEM(gem: DataArray): EdgesGeometry {
  //return makeSolidBox(gem, 1);
  return makeWireframeBox(gem, 1);
}

/**
 * Creates a DataArray for the muon chamber based on the provided data.
 * @param chamber The data array containing vertex positions for the muon chamber.
 * @returns A tuple containing the created BufferGeometry and EdgesGeometry for the muon chamber.
 */
function makeMuonChamber(chamber: DataArray): [BufferGeometry, EdgesGeometry] {
  return makeSolidBox(chamber, 1);
}

/**
 * Creates a DataArray for the muon chamber in RZ coordinates based on the provided data.
 * @param chamber The data array containing vertex positions for the muon chamber.
 * @returns A tuple containing the created BufferGeometry and EdgesGeometry for the muon chamber in RZ coordinates.
 */
function makeMuonChamberRZ(chamber: DataArray): [BufferGeometry, EdgesGeometry] {
  return makeSolidBoxRZ(chamber, 1);
}

/**
 * Creates a DataArray for HB (Hadron Barrel) based on the provided data.
 * @param hb The data array containing vertex positions for HB (Hadron Barrel).
 * @returns The created EdgesGeometry for HB.
 */
function makeHcal(hb: DataArray): EdgesGeometry {
  return makeWireframeBox(hb, 1);
}

/**
 * Creates a DataArray for ECAL (Electromagnetic Calorimeter) based on the provided data.
 * @param ecal The data array containing vertex positions for ECAL (Electromagnetic Calorimeter).
 * @returns The created EdgesGeometry for ECAL.
 */
function makeEcal(ecal: DataArray): EdgesGeometry {
  return makeWireframeBox(ecal, 1);
}

/**
 * Creates a DataArray for RPC (Resistive Plate Chamber) based on the provided data.
 * @param rpc The data array containing vertex positions for RPC (Resistive Plate Chamber).
 * @returns The created EdgesGeometry for RPC.
 */
function makeRPC(rpc: DataArray): EdgesGeometry {
  return makeWireFace(rpc, 1);
}

/**
 * Creates a point cloud geometry based on the provided data and index.
 * @param data The data array containing vertex positions.
 * @param index The index of the vertex positions to use.
 * @returns The created BufferGeometry for the point cloud.
 */
function makePointCloud(data: DataArray, index: number): BufferGeometry {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(data.length * 3);

  for (let i = 0; i < data.length; i++) {
    positions[i * 3 + 0] = data[i][index][0];
    positions[i * 3 + 1] = data[i][index][1];
    positions[i * 3 + 2] = data[i][index][2];
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 *
 * @param data The data array containing vertex positions.
 * @param index The index of the vertex positions to use.
 * @returns The created BufferGeometry for the point cloud.
 */
function makePointCloudRZ(data: DataArray, index: number): BufferGeometry {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(data.length * 3);

  for (let i = 0; i < data.length; i++) {
    const point = [data[i][index][0], data[i][index][1], data[i][index][2]];

    const proj = projectPoint(point, point);

    positions[i * 3 + 0] = proj[0];
    positions[i * 3 + 1] = proj[1];
    positions[i * 3 + 2] = proj[2];
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();

  return geometry;
}

/**
 * Creates a DataArray for the tracking rechits based on the provided data.
 * @param data The data array containing vertex positions.
 * @returns The created BufferGeometry for the tracking rechits.
 */
function makeTrackingRecHits(data: DataArray): BufferGeometry {
  return makePointCloud(data, 0);
}

/**
 * Creates a DataArray for the tracking clusters based on the provided data.
 * @param data The data array containing vertex positions.
 * @returns The created BufferGeometry for the tracking clusters.
 */
function makeTrackingClusters(data: DataArray): BufferGeometry {
  return makePointCloud(data, 1);
}

/**
 *
 * @param data The data array containing vertex positions.
 * @returns The created BufferGeometry for the tracking rechits.
 */
function makeTrackingRecHitsRZ(data: DataArray): BufferGeometry {
  return makePointCloudRZ(data, 0);
}

/**
 * Creates a DataArray for the tracking clusters in RZ coordinates based on the provided data.
 * @param data The data array containing vertex positions.
 * @returns The created BufferGeometry for the tracking clusters in RZ coordinates.
 */
function makeTrackingClustersRZ(data: DataArray): BufferGeometry {
  return makePointCloudRZ(data, 1);
}

/**
 * Creates an arrow helper based on the provided direction, origin, length, and color.
 * @param dir The direction vector of the arrow.
 * @param origin The origin point of the arrow.
 * @param length The length of the arrow.
 * @param color The color of the arrow.
 * @returns The created ArrowHelper.
 */
function makeArrow(dir: Vector3, origin: Vector3, length: number, color: Color): ArrowHelper {
  // dir, origin, length, hex, headLength, headWidth
  const arrow = new ArrowHelper(dir, origin, length, color.getHex(), 0.2, 0.2);

  // radiusTop, radiusBottom, height, radialSegments, heightSegments
  // We want more radialSegements beyond the 5 used in ArrowHelper
  // to make a nicer arrowhead
  arrow.cone.geometry = new CylinderGeometry(0, 0.5, 1, 24, 1);
  arrow.cone.geometry.translate(0, -1, 0);

  return arrow;
}

/**
 *
 * @param dir The direction vector of the arrow.
 * @param origin The origin point of the arrow.
 * @param length The length of the arrow.
 * @param color The color of the arrow.
 * @param displacement The displacement of the arrow.
 * @returns The created Object3D representing the thick arrow.
 */
function makeArrowThick(dir: Vector3, origin: Vector3, length: number, color: Color, displacement: number): Object3D {
  dir.setLength(length);

  const positions = [...origin.toArray(), ...dir.toArray()];

  const arrow = new Object3D();

  const al = new Line2(
    new LineGeometry().setPositions(positions),
    new LineMaterial({
      color: color.getHex(),
      linewidth: 2 * 0.001,
    }),
  );

  al.computeLineDistances();
  dir.normalize();
  al.translateOnAxis(dir, displacement);

  const cl = 0.2;

  const ac = new Mesh(
    new CylinderGeometry(0, 0.1, cl, 24, 1),
    new MeshBasicMaterial({
      color: color,
    }),
  );

  ac.geometry.applyMatrix4(new Matrix4().makeTranslation(0, cl * 0.5, 0));
  ac.geometry.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));

  ac.lookAt(dir);
  dir.setLength(length + displacement);

  ac.position.x = dir.x;
  ac.position.y = dir.y;
  ac.position.z = dir.z;

  arrow.add(al);
  arrow.add(ac);

  return arrow;
}

/**
 * Creates a MET (Missing Transverse Energy) arrow representation.
 * @param data The data array containing MET information.
 * @param style The style settings for the arrow.
 * @param selection The selection criteria for the arrow visibility.
 * @returns The created Object3D representing the MET arrow.
 */
function makeMET(data: DataArray, style: StyleType, selection: SelectionType): Object3D {
  /*
      "METs_V1": [["phi", "double"],["pt", "double"],["px", "double"],["py", "double"],["pz", "double"]]
    */

  /*
    "PATMETs_V1": [["phi", "double"],["pt", "double"],["px", "double"],["py", "double"],["pz", "double"]]
    */

  const pt = data[1];
  const px = data[2];
  const py = data[3];

  const rad = 1.45; // ECAL barrel radius
  let length = pt * style.scale;

  // Clamp length of MET
  length = length + rad > 5 ? 5 : length;

  const dir = new Vector3(px, py, 0);
  dir.normalize();

  const origin = new Vector3(0, 0, 0);
  const color = new Color(style.color);

  let met;

  if (ispy.use_line2) {
    met = makeArrowThick(
      dir,
      origin,
      length,
      color,
      rad, // displace out to ECAL barrel radius
    );
  } else {
    origin.add(dir);
    origin.multiplyScalar(rad); // see comment above

    met = makeArrow(dir, origin, length, color);
  }

  met.visible = pt < selection.min_pt ? false : true;

  return met;
}

/**
 * Projects spherical coordinates (theta, phi) onto Cartesian coordinates (x, y, z).
 * @param theta The polar angle (inclination) in radians.
 * @param phi The azimuthal angle (longitude) in radians.
 * @returns The Cartesian coordinates (x, y, z).
 */
function projectThetaPhi(theta: number, phi: number): [number, number] {
  const x = Math.cos(theta) * Math.sin(phi);
  const y = Math.sin(theta) * Math.sin(phi);
  const z = Math.cos(theta);

  const sign = y < 0.0 ? -1 : 1;
  const size = Math.sqrt(x * x + y * y);

  // Return new theta and phi
  return [Math.acos(z), Math.atan2(sign * size, 0)];
}

/**
 * Creates a jet representation.
 * @param data The data array containing jet information.
 * @param style The style settings for the jet.
 * @param selection The selection criteria for the jet visibility.
 * @returns The created Object3D representing the jet.
 */
function makeJet(data: DataArray, style: StyleType, selection: SelectionType): Object3D {
  const et = data[0];
  //   const eta = data[1];

  const theta = data[2];
  const phi = data[3];

  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);

  const maxZ = 2.25;
  const maxR = 1.1;

  const length1 = ct ? maxZ / Math.abs(ct) : maxZ;
  const length2 = st ? maxR / Math.abs(st) : maxR;
  const length = length1 < length2 ? length1 : length2;
  const radius = 0.3 * (1.0 / (1 + 0.001));

  // radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded
  const geometry = new CylinderGeometry(radius, 0.0, length, 16, 1, true);

  geometry.applyMatrix4(new Matrix4().makeTranslation(0, length * 0.5, 0));
  geometry.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));

  const jcolor = new Color(style.color);

  let transp = false;

  if (style.opacity < 1.0) {
    transp = true;
  }

  const material = new MeshBasicMaterial({
    color: jcolor,
    transparent: transp,
    opacity: style.opacity,
  });

  material.side = DoubleSide;
  material.depthWrite = false;

  const jet = new Mesh(geometry, material);
  jet.lookAt(new Vector3(length * 0.5 * st * cp, length * 0.5 * st * sp, length * 0.5 * ct));
  jet.visible = true;

  jet.userData.et = et;

  if (et < selection.min_et) {
    jet.visible = false;
  }

  return jet;
}

/**
 * Creates a jet representation in the R-Z plane.
 * @param data The data array containing jet information.
 * @param style The style settings for the jet.
 * @param selection The selection criteria for the jet visibility.
 * @returns The created Object3D representing the jet in the R-Z plane.
 */
function makeJetRZ(data: DataArray, style: StyleType, selection: SelectionType): Object3D {
  const et = data[0];
  //   const eta = data[1];

  const theta = data[2];
  const phi = data[3];

  let ct = Math.cos(theta);
  let st = Math.sin(theta);
  // let cp = Math.cos(phi);  TODO check if needed
  const sp = Math.sin(phi);

  const maxZ = 2.25;
  const maxR = 1.1;

  const length1 = ct ? maxZ / Math.abs(ct) : maxZ;
  const length2 = st ? maxR / Math.abs(st) : maxR;
  const length = length1 < length2 ? length1 : length2;
  const radius = 0.3 * (1.0 / (1 + 0.001));

  // radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded
  const geometry = new CylinderGeometry(radius, 0.0, length, 16, 1, true);

  geometry.applyMatrix4(new Matrix4().makeTranslation(0, length * 0.5, 0));
  geometry.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));

  const jcolor = new Color(style.color);

  let transp = false;

  if (style.opacity < 1.0) {
    transp = true;
  }

  const material = new MeshBasicMaterial({
    color: jcolor,
    transparent: transp,
    opacity: style.opacity,
  });

  material.side = DoubleSide;
  material.depthWrite = false;

  const jet = new Mesh(geometry, material);

  const angles = projectThetaPhi(theta, phi);
  st = Math.sin(angles[0]);
  const cp = Math.cos(angles[1]);
  ct = Math.cos(angles[0]);

  jet.lookAt(new Vector3(length * 0.5 * st * cp, length * 0.5 * st * sp, length * 0.5 * ct));
  jet.visible = true;

  jet.userData.et = et;

  if (et < selection.min_et) {
    jet.visible = false;
  }

  return jet;
}

/**
 * Creates a jet representation with a specified vertex position.
 * @param data The data array containing jet information.
 * @param style The style settings for the jet.
 * @param selection The selection criteria for the jet visibility.
 * @returns The created Object3D representing the jet.
 */
function makeJetWithVertex(data: DataArray, style: StyleType, selection: SelectionType): Object3D {
  const et = data[0];
  //   const eta = data[1];

  const theta = data[2];
  const phi = data[3];

  const vertex = new Vector3(...data[4]);

  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);

  const maxZ = 2.25;
  const maxR = 1.1;

  const length1 = ct ? maxZ / Math.abs(ct) : maxZ;
  const length2 = st ? maxR / Math.abs(st) : maxR;
  const length = length1 < length2 ? length1 : length2;
  const radius = 0.3 * (1.0 / (1 + 0.001));

  // radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded
  const geometry = new CylinderGeometry(radius, 0.0, length, 16, 1, true);

  geometry.applyMatrix4(new Matrix4().makeTranslation(0, length * 0.5, 0));
  geometry.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));

  const jcolor = new Color(style.color);
  let transp = false;

  if (style.opacity < 1.0) {
    transp = true;
  }

  const material = new MeshBasicMaterial({
    color: jcolor,
    transparent: transp,
    opacity: style.opacity,
  });

  material.side = DoubleSide;
  material.depthWrite = false;

  const jet = new Mesh(geometry, material);

  jet.position.x = vertex.x;
  jet.position.y = vertex.y;
  jet.position.z = vertex.z;

  jet.lookAt(new Vector3(length * 0.5 * st * cp, length * 0.5 * st * sp, length * 0.5 * ct));
  jet.visible = true;

  jet.userData.et = et;

  if (et < selection.min_et) {
    jet.visible = false;
  }

  return jet;
}

/**
 * Creates a jet representation in the R-Z plane.
 * @param data The data array containing jet information.
 * @param style The style settings for the jet.
 * @param selection The selection criteria for the jet visibility.
 * @returns The created Object3D representing the jet in the R-Z plane.
 */
function makeJetWithVertexRZ(data: DataArray, style: StyleType, selection: SelectionType): Object3D {
  const et = data[0];
  //   const eta = data[1];

  const theta = data[2];
  const phi = data[3];

  const vertex = new Vector3(...data[4]);

  let ct = Math.cos(theta);
  let st = Math.sin(theta);
  // let cp = Math.cos(phi);
  const sp = Math.sin(phi);

  const maxZ = 2.25;
  const maxR = 1.1;

  const length1 = ct ? maxZ / Math.abs(ct) : maxZ;
  const length2 = st ? maxR / Math.abs(st) : maxR;
  const length = length1 < length2 ? length1 : length2;
  const radius = 0.3 * (1.0 / (1 + 0.001));

  // radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded
  const geometry = new CylinderGeometry(radius, 0.0, length, 16, 1, true);

  geometry.applyMatrix4(new Matrix4().makeTranslation(0, length * 0.5, 0));
  geometry.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));

  const jcolor = new Color(style.color);
  let transp = false;

  if (style.opacity < 1.0) {
    transp = true;
  }

  const material = new MeshBasicMaterial({
    color: jcolor,
    transparent: transp,
    opacity: style.opacity,
  });

  material.side = DoubleSide;
  material.depthWrite = false;

  const jet = new Mesh(geometry, material);

  jet.position.x = vertex.x;
  jet.position.y = vertex.y;
  jet.position.z = vertex.z;

  const angles = projectThetaPhi(theta, phi);
  st = Math.sin(angles[0]);
  const cp = Math.cos(angles[1]);
  ct = Math.cos(angles[0]);

  jet.lookAt(new Vector3(length * 0.5 * st * cp, length * 0.5 * st * sp, length * 0.5 * ct));
  jet.visible = true;

  jet.userData.et = et;

  if (et < selection.min_et) {
    jet.visible = false;
  }

  return jet;
}

/**
 * Creates a photon representation.
 * @param data The data array containing photon information.
 * @param style The style settings for the photon.
 * @param selection The selection criteria for the photon visibility.
 * @returns The created Object3D representing the photon.
 */
function makePhoton(data: DataArray, style: StyleType, selection: SelectionType): Object3D {
  /*
      Draw a line representing the inferred photon trajectory from the vertex (IP?) to the extent of the ECAL
      "Photons_V1": [["energy", "double"],["et", "double"],["eta", "double"],["phi", "double"],["pos", "v3d"]
    */
  const lEB = 3.0; // half-length of the EB (m)
  const rEB = 1.24; // inner radius of the EB (m)

  const eta = data[2];
  const phi = data[3];

  const energy = data[0];

  const px = Math.cos(phi);
  const py = Math.sin(phi);
  const pz = (Math.pow(Math.E, eta) - Math.pow(Math.E, -eta)) / 2;

  let t = 0.0;

  const x0 = data[4][0];
  const y0 = data[4][1];
  const z0 = data[4][2];

  if (Math.abs(eta) > 1.48) {
    // i.e. not in the EB, so propagate to ES

    t = Math.abs((lEB - z0) / pz);
  } else {
    // propagate to EB

    const a = px * px + py * py;
    const b = 2 * x0 * px + 2 * y0 * py;
    const c = x0 * x0 + y0 * y0 - rEB * rEB;
    t = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  }

  const pt1 = new Vector3(x0, y0, z0);
  const pt2 = new Vector3(x0 + px * t, y0 + py * t, z0 + pz * t);

  const color = new Color(style.color);

  let photon;

  if (ispy.use_line2) {
    // For some reason LineDashedMaterial doesn't
    // work for Line2 so use this material
    const ldm = new LineMaterial({
      color: color.getHex(),
      dashed: true,
      linewidth: style.linewidth * 0.001,
      dashSize: 0.1,
      gapSize: 0.1,
    });

    ldm.defines.USE_DASH = "";
    ldm.needsUpdate = true;

    photon = new Line2(new LineGeometry().setPositions([...pt1.toArray(), ...pt2.toArray()]), ldm);
  } else {
    photon = new LineSegments(
      new BufferGeometry().setFromPoints([pt1, pt2]),
      new LineDashedMaterial({
        color: color,
        scale: 1,
        dashSize: 0.1,
        gapSize: 0.1,
      }),
    );
  }

  photon.computeLineDistances();
  photon.userData.energy = energy;

  if (energy < selection.min_energy) {
    photon.visible = false;
  }

  return photon;
}

/**
 * Creates a photon representation in the R-Z plane.
 * @param data The data array containing photon information.
 * @param style The style settings for the photon.
 * @param selection The selection criteria for the photon visibility.
 * @returns The created Object3D representing the photon in the R-Z plane.
 */
function makePhotonRZ(data: DataArray, style: StyleType, selection: SelectionType): Object3D {
  /*
      Draw a line representing the inferred photon trajectory from the vertex (IP?) to the extent of the ECAL
      "Photons_V1": [["energy", "double"],["et", "double"],["eta", "double"],["phi", "double"],["pos", "v3d"]
    */
  const lEB = 3.0; // half-length of the EB (m)
  const rEB = 1.24; // inner radius of the EB (m)

  const eta = data[2];
  const phi = data[3];

  const energy = data[0];

  const px = Math.cos(phi);
  const py = Math.sin(phi);
  const pz = (Math.pow(Math.E, eta) - Math.pow(Math.E, -eta)) / 2;

  let t = 0.0;

  const x0 = data[4][0];
  const y0 = data[4][1];
  const z0 = data[4][2];

  if (Math.abs(eta) > 1.48) {
    // i.e. not in the EB, so propagate to ES

    t = Math.abs((lEB - z0) / pz);
  } else {
    // propagate to EB

    const a = px * px + py * py;
    const b = 2 * x0 * px + 2 * y0 * py;
    const c = x0 * x0 + y0 * y0 - rEB * rEB;
    t = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  }

  let pt2 = new Vector3(x0 + px * t, y0 + py * t, z0 + pz * t);
  const pt1 = projectVector(new Vector3(x0, y0, z0), pt2);
  pt2 = projectVector(pt2, pt2);

  const color = new Color(style.color);

  let photon;

  if (ispy.use_line2) {
    // For some reason LineDashedMaterial doesn't
    // work for Line2 so use this material
    const ldm = new LineMaterial({
      color: color.getHex(),
      dashed: true,
      linewidth: style.linewidth * 0.001,
      dashSize: 0.1,
      gapSize: 0.1,
    });

    ldm.defines.USE_DASH = "";
    ldm.needsUpdate = true;

    photon = new Line2(new LineGeometry().setPositions([...pt1.toArray(), ...pt2.toArray()]), ldm);
  } else {
    photon = new LineSegments(
      new BufferGeometry().setFromPoints([pt1, pt2]),
      new LineDashedMaterial({
        color: color,
        scale: 1,
        dashSize: 0.1,
        gapSize: 0.1,
      }),
    );
  }

  photon.computeLineDistances();
  photon.userData.energy = energy;

  if (energy < selection.min_energy) {
    photon.visible = false;
  }

  return photon;
}

/**
 * Creates a proton representation.
 * @param data The data array containing proton information.
 * @param style The style settings for the proton.
 * @param _selection The selection criteria for the proton visibility.
 * @returns The created Object3D representing the proton.
 */
function makeProtons(data: DataArray, style: StyleType, _selection: SelectionType): Object3D {
  /*
      Draw a line representing the inferred photon trajectory from the vertex 
      "ForwardProtons_V1": [["xi", "double"],["thetax", "double"],["thetay", "double"],["vertex", "v3d"],
                            ["pt", "double"],["px", "double"],["py", "double"],["pz", "double"]]
    */
  const xi = data[0];

  const x0 = data[3][0];
  const y0 = data[3][1];
  const z0 = data[3][2];

  const px = data[5];
  const py = data[6];
  const pz = data[7];

  const dir = new Vector3(px, py, pz);
  dir.normalize();

  const origin = new Vector3(x0, y0, z0);

  let length = Math.abs(pz) * 0.01;
  length -= 0.75 * 65;

  const color = new Color(style.color);

  let proton;

  if (ispy.use_line2) {
    proton = makeArrowThick(dir, origin, length, color, 0);
  } else {
    proton = makeArrow(dir, origin, length, color);
  }

  proton.userData.xi = xi;

  const radius = xi * 10;
  const thickness = 0.05;

  const rg = new RingGeometry(
    radius, // inner radius
    radius + thickness, // outer radius
    32, // theta segments
  );

  rg.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));

  const rm = new MeshBasicMaterial({
    color: color,
    side: DoubleSide,
  });

  const ring = new Mesh(rg, rm);
  ring.name = "ring";

  // Note that coordinates are
  // w.r.t. the arrow
  ring.position.x = 0;
  ring.position.y = length;
  ring.position.z = 0;

  //proton.add(ring);

  return proton;
}

/**
 * Creates a representation of the DT (Drift Tube) rechits.
 * @param data The data array containing DT (Drift Tube) rechit information.
 * @returns The created Object3D representing the DT rechits.
 */
function makeDTRecHits(data: DataArray): [BufferGeometry] {
  /*
      ["wireId", "int"],["layerId", "int"],["superLayerId", "int"],["sectorId", "int"],["stationId", "int"],["wheelId", "int"],
      ["digitime", "double"],["wirePos", "v3d"],
      ["lPlusGlobalPos", "v3d"],["lMinusGlobalPos", "v3d"],["rPlusGlobalPos", "v3d"],["rMinusGlobalPos", "v3d"],
      ["lGlobalPos", "v3d"],["rGlobalPos", "v3d"],
      ["axis", "v3d"],["angle", "double"],["cellWidth", "double"],["cellLength", "double"],["cellHeight", "double"]]
    */

  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  const pos = new Vector3(...data[7]);
  const axis = new Vector3(...data[14]);
  const angle = data[15];

  const w = data[16] * 0.5;
  const h = data[17] * 0.5;
  const d = data[18] * 0.5;

  const v0 = new Vector3(-w, h, -d);
  const v1 = new Vector3(w, h, -d);
  const v2 = new Vector3(w, h, d);
  const v3 = new Vector3(-w, h, d);
  const v4 = new Vector3(-w, -h, d);
  const v5 = new Vector3(w, -h, d);
  const v6 = new Vector3(w, -h, -d);
  const v7 = new Vector3(-w, -h, -d);

  //front
  addFace3(v0.toArray(), v1.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v0.toArray());
  //back
  addFace3(v4.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v7.toArray(), v4.toArray());
  //top
  addFace3(v4.toArray(), v5.toArray(), v1.toArray());
  addFace3(v1.toArray(), v0.toArray(), v4.toArray());
  //bottom
  addFace3(v7.toArray(), v6.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v7.toArray());
  //left
  addFace3(v0.toArray(), v3.toArray(), v7.toArray());
  addFace3(v7.toArray(), v4.toArray(), v0.toArray());
  //right
  addFace3(v1.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v2.toArray(), v1.toArray());

  const box = new BufferGeometry();
  box.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  box.applyMatrix4(new Matrix4().makeRotationAxis(axis, angle));
  box.applyMatrix4(new Matrix4().makeTranslation(pos.x, pos.y, pos.z));

  return [box];
}

/**
 * Creates a representation of the DT (Drift Tube) rechits in RZ coordinates.
 * @param data The data array containing DT (Drift Tube) rechit information in RZ coordinates.
 * @returns The created Object3D representing the DT rechits in RZ coordinates.
 */
function makeDTRecHitsRZ(data: DataArray): [BufferGeometry] {
  /*
      ["wireId", "int"],["layerId", "int"],["superLayerId", "int"],["sectorId", "int"],["stationId", "int"],["wheelId", "int"],
      ["digitime", "double"],["wirePos", "v3d"],
      ["lPlusGlobalPos", "v3d"],["lMinusGlobalPos", "v3d"],["rPlusGlobalPos", "v3d"],["rMinusGlobalPos", "v3d"],
      ["lGlobalPos", "v3d"],["rGlobalPos", "v3d"],
      ["axis", "v3d"],["angle", "double"],["cellWidth", "double"],["cellLength", "double"],["cellHeight", "double"]]
    */

  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  const pos = new Vector3(...data[7]);
  const axis = new Vector3(...data[14]);
  const angle = data[15];

  const w = data[16] * 0.5;
  const h = data[17] * 0.5;
  const d = data[18] * 0.5;

  const lglobalpos = new Vector3(...data[12]);

  const v0 = projectVector(new Vector3(-w, h, -d), lglobalpos);
  const v1 = projectVector(new Vector3(w, h, -d), lglobalpos);
  const v2 = projectVector(new Vector3(w, h, d), lglobalpos);
  const v3 = projectVector(new Vector3(-w, h, d), lglobalpos);
  const v4 = projectVector(new Vector3(-w, -h, d), lglobalpos);
  const v5 = projectVector(new Vector3(w, -h, d), lglobalpos);
  const v6 = projectVector(new Vector3(w, -h, -d), lglobalpos);
  const v7 = projectVector(new Vector3(-w, -h, -d), lglobalpos);

  //front
  addFace3(v0.toArray(), v1.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v0.toArray());
  //back
  addFace3(v4.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v7.toArray(), v4.toArray());
  //top
  addFace3(v4.toArray(), v5.toArray(), v1.toArray());
  addFace3(v1.toArray(), v0.toArray(), v4.toArray());
  //bottom
  addFace3(v7.toArray(), v6.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v7.toArray());
  //left
  addFace3(v0.toArray(), v3.toArray(), v7.toArray());
  addFace3(v7.toArray(), v4.toArray(), v0.toArray());
  //right
  addFace3(v1.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v2.toArray(), v1.toArray());

  const box = new BufferGeometry();
  box.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  box.applyMatrix4(new Matrix4().makeRotationAxis(axis, angle));
  box.applyMatrix4(new Matrix4().makeTranslation(pos.x, pos.y, pos.z));

  return [box];
}

/**
 * Creates a representation of the RPC rechits.
 * @param data The data array containing RPC rechit information.
 * @returns The created Object3D representing the RPC rechits.
 */
function makeRPCRecHits(data: DataArray): BufferGeometry[] {
  let u, v, w;

  if (ispy.use_line2) {
    u = new LineGeometry();
    u.setPositions([...data[0], ...data[1]]);

    v = new LineGeometry();
    v.setPositions([...data[2], ...data[3]]);

    w = new LineGeometry();
    w.setPositions([...data[4], ...data[5]]);
  } else {
    const u1 = new Vector3(...data[0]);
    const u2 = new Vector3(...data[1]);
    const v1 = new Vector3(...data[2]);
    const v2 = new Vector3(...data[3]);
    const w1 = new Vector3(...data[4]);
    const w2 = new Vector3(...data[5]);

    u = new BufferGeometry().setFromPoints([u1, u2]);
    v = new BufferGeometry().setFromPoints([v1, v2]);
    w = new BufferGeometry().setFromPoints([w1, w2]);
  }

  return [u, v, w];
}

/**
 * Creates a representation of the RPC rechits in RZ coordinates.
 * @param data The data array containing RPC rechit information in RZ coordinates.
 * @returns The created Object3D representing the RPC rechits in RZ coordinates.
 */
function makeRPCRecHitsRZ(data: DataArray): BufferGeometry[] {
  let u, v, w;

  if (ispy.use_line2) {
    u = new LineGeometry();
    u.setPositions([...projectPoint(data[0], data[0]), ...projectPoint(data[1], data[0])]);

    v = new LineGeometry();
    v.setPositions([...projectPoint(data[2], data[0]), ...projectPoint(data[3], data[0])]);

    w = new LineGeometry();
    w.setPositions([...projectPoint(data[4], data[0]), ...projectPoint(data[5], data[0])]);
  } else {
    const u1 = new Vector3(...data[0]);
    const u2 = new Vector3(...data[1]);
    const v1 = new Vector3(...data[2]);
    const v2 = new Vector3(...data[3]);
    const w1 = new Vector3(...data[4]);
    const w2 = new Vector3(...data[5]);

    u = new BufferGeometry().setFromPoints([projectVector(u1, u1), projectVector(u2, u1)]);

    v = new BufferGeometry().setFromPoints([projectVector(v1, u1), projectVector(v2, u1)]);

    w = new BufferGeometry().setFromPoints([projectVector(w1, u1), projectVector(w2, u1)]);
  }

  return [u, v, w];
}

/**
 * Creates a representation of the CSC (Cathode Strip Chamber) rechits.
 * @param data The data array containing CSC rechit information.
 * @param _descr The description of the data (not used in this function).
 * @returns The created Object3D representing the CSC rechits.
 */
function makeCSCRecHit2Ds_V2(data: DataArray, _descr: unknown): BufferGeometry[] {
  return makeRPCRecHits(data);
}

/**
 * Creates a representation of the GEM (Gas Electron Multiplier) rechits.
 * @param data The data array containing GEM (Gas Electron Multiplier) rechit information.
 * @param _descr The description of the data (not used in this function).
 * @returns The created Object3D representing the GEM rechits.
 */
function makeGEMRecHits_V2(data: DataArray, _descr: unknown): BufferGeometry[] {
  return makeRPCRecHits(data);
}

/**
 * Creates a representation of the CSC (Cathode Strip Chamber) rechits in RZ coordinates.
 * @param data The data array containing CSC rechit information in RZ coordinates.
 * @param _descr The description of the data (not used in this function).
 * @returns The created Object3D representing the CSC rechits in RZ coordinates.
 */
function makeCSCRecHit2DsRZ(data: DataArray, _descr: unknown): BufferGeometry[] {
  return makeRPCRecHitsRZ(data);
}

/**
 * Creates a representation of the GEM (Gas Electron Multiplier) rechits in RZ coordinates.
 * @param data The data array containing GEM rechit information in RZ coordinates.
 * @param _descr The description of the data (not used in this function).
 * @returns The created Object3D representing the GEM rechits in RZ coordinates.
 */
function makeGEMRecHitsRZ(data: DataArray, _descr: unknown): BufferGeometry[] {
  return makeRPCRecHitsRZ(data);
}

/**
 * Creates segments for DT (Drift Tube) rechits.
 * @param data The data array containing DT rechit information.
 * @returns The created Object3D representing the DT rechits.
 */
function makeDTRecSegments(data: DataArray): BufferGeometry[] {
  let geometry;

  if (ispy.use_line2) {
    geometry = new LineGeometry();
    geometry.setPositions([...data[1], ...data[2]]);
  } else {
    geometry = new BufferGeometry().setFromPoints([new Vector3(...data[1]), new Vector3(...data[2])]);
  }

  return [geometry];
}

/**
 * Creates segments for DT (Drift Tube) rechits in RZ coordinates.
 * @param data The data array containing DT rechit information in RZ coordinates.
 * @returns The created Object3D representing the DT rechits in RZ coordinates.
 */
function makeDTRecSegmentsRZ(data: DataArray): BufferGeometry[] {
  let geometry;

  if (ispy.use_line2) {
    geometry = new LineGeometry();
    geometry.setPositions([...projectPoint(data[1], data[1]), ...projectPoint(data[2], data[1])]);
  } else {
    const p1 = new Vector3(...data[1]);
    const p2 = new Vector3(...data[2]);

    geometry = new BufferGeometry().setFromPoints([projectVector(p1, p2), projectVector(p2, p2)]);
  }

  return [geometry];
}

/**
 * Creates segments for CSC (Cathode Strip Chamber) rechits.
 * @param data The data array containing CSC rechit information.
 * @param _geometry The geometry to use for the segments (not used in this function).
 * @returns The created Object3D representing the CSC rechits.
 */
function makeCSCSegments(data: DataArray, _geometry: unknown): BufferGeometry[] {
  return makeDTRecSegments(data);
}

/**
 * Creates segments for CSC (Cathode Strip Chamber) rechits in RZ coordinates.
 * @param data The data array containing CSC rechit information in RZ coordinates.
 * @param _geometry The geometry to use for the segments (not used in this function).
 * @returns The created Object3D representing the CSC rechits in RZ coordinates.
 */
function makeCSCSegmentsRZ(data: DataArray, _geometry: unknown): BufferGeometry[] {
  return makeDTRecSegmentsRZ(data);
}

/**
 * Creates segments for GEM (Gas Electron Multiplier) rechits.
 * @param data The data array containing GEM (Gas Electron Multiplier) segments information.
 * @param _geometry The geometry to use for the segments (not used in this function).
 * @returns The created Object3D representing the GEM rechits.
 */
function makeGEMSegments_V2(data: DataArray, _geometry: unknown): BufferGeometry[] {
  return makeDTRecSegments(data);
}

/**
 * Creates digis for CSC (Cathode Strip Chamber) rechits.
 * @param data The data array containing CSC rechit information.
 * @param w The width of the digis.
 * @param d The depth of the digis.
 * @param rotate The rotation angle of the digis.
 * @returns The created Object3D representing the CSC digis.
 */
function makeCSCDigis(data: DataArray, w: number, d: number, rotate: number): BufferGeometry[] {
  let all_positions: number[] = [];

  const addFace3 = (...vectors: number[][]) => {
    all_positions = all_positions.concat(...vectors);
  };

  const pos = new Vector3(...data[0]);
  const h = data[1] * 0.5;

  w *= 0.5;
  d *= 0.5;

  const axis = new Vector3(0.0, 0.0, 1.0);
  const angle = -Math.atan2(pos.x, pos.y) - rotate;

  const v0 = new Vector3(-w, h, -d);
  const v1 = new Vector3(w, h, -d);
  const v2 = new Vector3(w, h, d);
  const v3 = new Vector3(-w, h, d);
  const v4 = new Vector3(-w, -h, d);
  const v5 = new Vector3(w, -h, d);
  const v6 = new Vector3(w, -h, -d);
  const v7 = new Vector3(-w, -h, -d);

  // front
  addFace3(v0.toArray(), v1.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v0.toArray());
  //back
  addFace3(v4.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v7.toArray(), v4.toArray());
  //top
  addFace3(v4.toArray(), v5.toArray(), v1.toArray());
  addFace3(v1.toArray(), v0.toArray(), v4.toArray());
  //bottom
  addFace3(v7.toArray(), v6.toArray(), v2.toArray());
  addFace3(v2.toArray(), v3.toArray(), v7.toArray());
  //left
  addFace3(v0.toArray(), v3.toArray(), v7.toArray());
  addFace3(v7.toArray(), v4.toArray(), v0.toArray());
  //right
  addFace3(v1.toArray(), v5.toArray(), v6.toArray());
  addFace3(v6.toArray(), v2.toArray(), v1.toArray());

  const box = new BufferGeometry();
  box.attributes.position = new BufferAttribute(new Float32Array(all_positions), 3);

  box.applyMatrix4(new Matrix4().makeRotationAxis(axis, angle));
  box.applyMatrix4(new Matrix4().makeTranslation(pos.x, pos.y, pos.z));

  return [box];
}

/**
 * Creates digis for CSC (Cathode Strip Chamber) rechits.
 * @param data The data array containing CSC digis information.
 * @returns The created Object3D representing the CSC digis.
 */
function makeCSCDigis_V2(data: DataArray): (BufferGeometry | LineGeometry)[] {
  let geometry;

  if (ispy.use_line2) {
    geometry = new LineGeometry();
    geometry.setPositions([...data[0], ...data[1]]);
  } else {
    geometry = new BufferGeometry().setFromPoints([new Vector3(...data[0]), new Vector3(...data[1])]);
  }

  return [geometry];
}

/**
 * Creates digis for GEM (Gas Electron Multiplier) rechits.
 * @param data The data array containing GEM digis information.
 * @returns The created Object3D representing the GEM digis.
 */
function makeGEMDigis_V2(data: DataArray): (BufferGeometry | LineGeometry)[] {
  let geometry;

  if (ispy.use_line2) {
    geometry = new LineGeometry();
    geometry.setPositions([...data[0], ...data[1]]);
  } else {
    geometry = new BufferGeometry().setFromPoints([new Vector3(...data[0]), new Vector3(...data[1])]);
  }

  return [geometry];
}

/*
  "CSCStripDigis_V1": [["pos", "v3d"],["length", "double"],["endcap", "int"],["station", "int"],["ring", "int"],["chamber", "int"]]
  "CSCWireDigis_V1": [["pos", "v3d"],["length", "double"],["endcap", "int"],["station", "int"],["ring", "int"],["chamber", "int"]]
*/

/**
 * Creates digis for CSC (Cathode Strip Chamber) wire rechits.
 * @param data The data array containing CSC wire digis information.
 * @returns The created Object3D representing the CSC wire digis.
 */
function makeCSCWireDigis(data: DataArray): BufferGeometry[] {
  return makeCSCDigis(data, 0.02, 0.01, Math.PI * 0.5);
}

/**
 * Creates digis for CSC (Cathode Strip Chamber) strip rechits.
 * @param data The data array containing CSC strip digis information.
 * @returns The created Object3D representing the CSC strip digis.
 */
function makeCSCStripDigis(data: DataArray): BufferGeometry[] {
  return makeCSCDigis(data, 0.01, 0.01, 0.0);
}

/**
 * Creates digis for CSC (Cathode Strip Chamber) LCT digis.
 * @param data The data array containing CSC LCT digis information.
 * @returns The created Object3D representing the CSC LCT digis.
 */
function makeCSCLCTDigis(data: DataArray): BufferGeometry {
  return makePointCloud(data, 0);
}

/**
 * Creates digis for CSC (Cathode Strip Chamber) correlated LCT digis.
 * @param data The data array containing CSC correlated LCT digis information.
 * @returns The created Object3D representing the CSC correlated LCT digis.
 */
function makeCSCLCTCorrelatedLCTDigis(data: DataArray): (BufferGeometry | LineGeometry)[] {
  let l1, l2;

  if (ispy.use_line2) {
    l1 = new LineGeometry();
    l1.setPositions([...data[0], ...data[1]]);

    l2 = new LineGeometry();
    l2.setPositions([...data[2], ...data[3]]);
  } else {
    l1 = new BufferGeometry().setFromPoints([new Vector3(...data[0]), new Vector3(...data[1])]);

    l2 = new BufferGeometry().setFromPoints([new Vector3(...data[2]), new Vector3(...data[3])]);
  }

  return [l1, l2];
}

/**
 * Displays an CMS Logo and Event Information
 * @param data The data array containing event information.
 */
function makeEvent(data: DataArray) {
  /*
      "Event_V2": [["run", "int"],["event", "int"],["ls", "int"],["orbit", "int"],["bx", "int"],["time", "string"],["localtime", "string"]]
      for what we do here, Event_V1 is the same, i.e. we don't show localtime
    */
  const ei = data[0];
  const run = ei[0],
    event = ei[1],
    ls = ei[2],
    time = ei[5];

  let et = "CMS Experiment at the LHC, CERN<br>";
  et += `Data recorded: ${time}</br>`;
  et += `Run / Event / LS: ${run} / ${event} / ${ls}</br>`;

  const eventText = getHTMLObject("js-event-text");
  eventText.innerHTML = et;
  getHTMLObject("display").appendChild(getHTMLObject("event-info"));
}

// export all functions
export {
  makeWireframeBox,
  makeWireFace,
  makeSolidFace,
  makeSolidBox,
  makeSolidBoxRZ,
  makeScaledSolidBox,
  makeScaledSolidBoxRZ,
  makeScaledSolidTower,
  makeScaledSolidTowerRZ,
  makePFCandidateTowers,
  makePFCandidateTowersRZ,
  makeEcalPFCandidateTowers,
  makeEcalPFCandidateTowersRZ,
  makeHcalPFCandidateTowers,
  makeHcalPFCandidateTowersRZ,
  makeTrackerPiece,
  makeTrackPoints,
  makeTrackPointsRZ,
  makeTracks,
  makeTracksRZ,
  makeThickTracks,
  makeThickTracksRZ,
  makeVertex,
  makeVertexCompositeCandidate,
  makeSimVertex,
  makeCaloClusters,
  makeEcalDigi,
  makeERecHit_V2,
  makeHRecHit_V2,
  makeERecHit_RZ,
  makeHRecHit_RZ,
  makeHGCRecHit,
  makeCaloTower,
  makeDT,
  makeCSC,
  makeGEM,
  makeMuonChamber,
  makeMuonChamberRZ,
  makeHcal,
  makeEcal,
  makeRPC,
  makePointCloud,
  makePointCloudRZ,
  makeTrackingRecHits,
  makeTrackingClusters,
  makeTrackingRecHitsRZ,
  makeTrackingClustersRZ,
  makeArrow,
  makeArrowThick,
  makeMET,
  makeJet,
  makeJetRZ,
  makeJetWithVertex,
  makeJetWithVertexRZ,
  makePhoton,
  makePhotonRZ,
  makeProtons,
  makeDTRecHits,
  makeDTRecHitsRZ,
  makeRPCRecHits,
  makeRPCRecHitsRZ,
  makeCSCRecHit2Ds_V2,
  makeGEMRecHits_V2,
  makeCSCRecHit2DsRZ,
  makeGEMRecHitsRZ,
  makeDTRecSegments,
  makeDTRecSegmentsRZ,
  makeCSCSegments,
  makeCSCSegmentsRZ,
  makeGEMSegments_V2,
  makeCSCDigis,
  makeCSCDigis_V2,
  makeGEMDigis_V2,
  makeCSCWireDigis,
  makeCSCStripDigis,
  makeCSCLCTDigis,
  makeCSCLCTCorrelatedLCTDigis,
  makeEvent,
  projectVector,
  projectPoint,
  projectThetaPhi,
};
