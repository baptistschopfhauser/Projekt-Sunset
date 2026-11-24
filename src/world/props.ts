import * as THREE from 'three';
import { RNG } from '../core/rng.ts';
import { WORLD, districtAt } from '../core/config.ts';
import { heightAt, isLand, isWater, coastX } from './terrain.ts';
import type { RoadGraph } from './roads.ts';
import type { AABBCollider } from '../core/types.ts';

export interface PropSet {
  group: THREE.Group;
  lampHeads: THREE.InstancedMesh;
  lampHeadMat: THREE.MeshStandardMaterial;
  lampPositions: THREE.Vector3[];
  buildingMats: THREE.MeshStandardMaterial[];
  treeMat: THREE.MeshStandardMaterial;
  updateNight(night: number, timeSec?: number, wind?: number): void;
}

export const windUniforms = { uTime: { value: 0 }, uWind: { value: 1 } };

export function buildProps(graph: RoadGraph, colliders: AABBCollider[], rng: RNG): PropSet {
  const group = new THREE.Group();
  const lampPositions: THREE.Vector3[] = [];

  const poleGeo = new THREE.CylinderGeometry(0.09, 0.12, 6.2, 6);
  poleGeo.translate(0, 3.1, 0);
  const headGeo = new THREE.BoxGeometry(0.5, 0.18, 0.9);
  headGeo.translate(0, 6.2, 0.25);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c3138, roughness: 0.6, metalness: 0.6 });
  const lampHeadMat = new THREE.MeshStandardMaterial({ color: 0x888888, emissive: 0xffd9a0, emissiveIntensity: 0 });
  const poles: THREE.Matrix4[] = [];
  const heads: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();
  for (const e of graph.edges) {
    if (e.kind === 'bridge') continue;
    const a = graph.nodes[e.a];
    const b = graph.nodes[e.b];
    const len = e.len;
    const count = Math.floor(len / 48);
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      for (const side of [1, -1] as const) {
        const p = graph.pointOnEdge(e.id, t, side);
        const lx = p.x + -e.dz * side * 6.4;
        const lz = p.z + e.dx * side * 6.4;
        if (!isLand(lx, lz)) continue;
        const y = heightAt(lx, lz);
        dummy.position.set(lx, y, lz);
        dummy.rotation.set(0, Math.atan2(e.dx, e.dz), 0);
        dummy.updateMatrix();
        poles.push(dummy.matrix.clone());
        heads.push(dummy.matrix.clone());
        lampPositions.push(new THREE.Vector3(lx, y + 6.2, lz));
      }
    }
  }
  const poleMesh = new THREE.InstancedMesh(poleGeo, poleMat, Math.max(1, poles.length));
  const headMesh = new THREE.InstancedMesh(headGeo, lampHeadMat, Math.max(1, heads.length));
  poles.forEach((m, i) => poleMesh.setMatrixAt(i, m));
  heads.forEach((m, i) => headMesh.setMatrixAt(i, m));
  poleMesh.instanceMatrix.needsUpdate = true;
  headMesh.instanceMatrix.needsUpdate = true;
  group.add(poleMesh, headMesh);

  const coneGeo = new THREE.ConeGeometry(2.6, 6.4, 14, 1, true);
  coneGeo.translate(0, -3.2, 0);
  const lampConeMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const coneMesh = new THREE.InstancedMesh(coneGeo, lampConeMat, Math.max(1, heads.length));
  heads.forEach((m, i) => coneMesh.setMatrixAt(i, m));
  coneMesh.instanceMatrix.needsUpdate = true;
  group.add(coneMesh);

  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.2, 6);
  trunkGeo.translate(0, 1.1, 0);
  const folGeo = new THREE.IcosahedronGeometry(1.9, 1);
  folGeo.translate(0, 3.6, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.9 });
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x477b48, roughness: 0.85 });
  const trunkMats: THREE.Matrix4[] = [];
  const folMats: THREE.Matrix4[] = [];
  const folColors: THREE.Color[] = [];
  const treeSpots: { x: number; z: number }[] = [];
  const wantTrees = 900;
  let attempts = 0;
  while (treeSpots.length < wantTrees && attempts < wantTrees * 30) {
    attempts++;
    const x = rng.range(WORLD.minX + 40, Math.min(WORLD.maxX, 1750));
    const z = rng.range(WORLD.minZ + 40, WORLD.maxZ - 40);
    if (!isLand(x, z) || isWater(x, z)) continue;
    const d = districtAt(x, z);
    let density = 0.02;
    if (d === 'pine_ridge') density = 0.75;
    else if (d === 'cedar_plains') density = 0.4;
    else if (d === 'blackwater_marsh') density = 0.35;
    else if (d === 'solace_beach') density = 0.12;
    else if (d === 'westhaven' || d === 'northgate') density = 0.08;
    if (!rng.chance(density)) continue;
    const near = graph.nearestEdgePoint(x, z);
    if (near.dist < 14 * 14) continue;
    treeSpots.push({ x, z });
  }
  for (const t of treeSpots) {
    const y = heightAt(t.x, t.z);
    const s = rng.range(0.7, 1.6);
    dummy.position.set(t.x, y - 0.05, t.z);
    dummy.rotation.set(0, rng.range(0, Math.PI * 2), 0);
    dummy.scale.set(s, s * rng.range(0.9, 1.3), s);
    dummy.updateMatrix();
    trunkMats.push(dummy.matrix.clone());
    folMats.push(dummy.matrix.clone());
    folColors.push(new THREE.Color().setHSL(0.29 + rng.range(-0.05, 0.05), 0.45, 0.28 + rng.range(0, 0.1)));
  }
  treeMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uWind = windUniforms.uWind;
    shader.vertexShader = 'uniform float uTime;\nuniform float uWind;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float swayAmp = clamp((position.y - 1.5) / 4.0, 0.0, 1.0) * uWind * 0.14;
       transformed.x += sin(uTime * 1.6 + position.x * 0.35 + position.z * 0.3) * swayAmp;
       transformed.z += cos(uTime * 1.1 + position.z * 0.4) * swayAmp * 0.7;`
    );
  };
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, Math.max(1, trunkMats.length));
  const folMesh = new THREE.InstancedMesh(folGeo, treeMat, Math.max(1, folMats.length));
  trunkMats.forEach((m, i) => trunkMesh.setMatrixAt(i, m));
  folMats.forEach((m, i) => {
    folMesh.setMatrixAt(i, m);
    folMesh.setColorAt(i, folColors[i]);
  });
  trunkMesh.instanceMatrix.needsUpdate = true;
  folMesh.instanceMatrix.needsUpdate = true;
  if (folMesh.instanceColor) folMesh.instanceColor.needsUpdate = true;
  group.add(trunkMesh, folMesh);

  const containerGeo = new THREE.BoxGeometry(6, 2.6, 2.4);
  const containerColors = [0xb0483c, 0x3c6ea5, 0x4c8a4f, 0xc9a13b, 0x7a5aa0, 0x9aa3ad];
  const containerMats: THREE.Matrix4[] = [];
  const containerCols: THREE.Color[] = [];
  const cRng = new RNG(777);
  for (let i = 0; i < 90; i++) {
    const x = cRng.range(-1650, -550);
    const z = cRng.range(950, 1420);
    if (!isLand(x, z)) continue;
    const near = graph.nearestEdgePoint(x, z);
    if (near.dist < 10 * 10) continue;
    const y = heightAt(x, z);
    const stack = cRng.chance(0.3) ? 2 : 1;
    for (let s = 0; s < stack; s++) {
      dummy.position.set(x + cRng.range(-2, 2), y + 1.3 + s * 2.6, z + cRng.range(-2, 2));
      dummy.rotation.set(0, cRng.chance(0.5) ? 0 : Math.PI / 2, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      containerMats.push(dummy.matrix.clone());
      containerCols.push(new THREE.Color(containerColors[cRng.int(0, containerColors.length - 1)]));
    }
    colliders.push({ min: new THREE.Vector3(x - 3.2, y, z - 3.2), max: new THREE.Vector3(x + 3.2, y + 5.4, z + 3.2), kind: 'prop' });
  }
  const containerMat = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.3 });
  const containerMesh = new THREE.InstancedMesh(containerGeo, containerMat, Math.max(1, containerMats.length));
  containerMats.forEach((m, i) => {
    containerMesh.setMatrixAt(i, m);
    containerMesh.setColorAt(i, containerCols[i]);
  });
  containerMesh.instanceMatrix.needsUpdate = true;
  if (containerMesh.instanceColor) containerMesh.instanceColor.needsUpdate = true;
  group.add(containerMesh);

  const barrierGeo = new THREE.BoxGeometry(2.2, 1.0, 0.3);
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0xd8d3c8, roughness: 0.8 });
  const barrierMats: THREE.Matrix4[] = [];
  const bRng = new RNG(778);
  for (let i = 0; i < 60; i++) {
    const x = bRng.range(WORLD.minX + 60, 1400);
    const z = bRng.range(WORLD.minZ + 60, WORLD.maxZ - 60);
    if (!isLand(x, z)) continue;
    const near = graph.nearestEdgePoint(x, z);
    if (near.dist < 8 * 8 || near.dist > 12 * 12) continue;
    dummy.position.set(x, heightAt(x, z) + 0.5, z);
    dummy.rotation.set(0, bRng.range(0, Math.PI * 2), 0);
    dummy.updateMatrix();
    barrierMats.push(dummy.matrix.clone());
  }
  const barrierMesh = new THREE.InstancedMesh(barrierGeo, barrierMat, Math.max(1, barrierMats.length));
  barrierMats.forEach((m, i) => barrierMesh.setMatrixAt(i, m));
  barrierMesh.instanceMatrix.needsUpdate = true;
  group.add(barrierMesh);

  const beach = new THREE.Group();
  const umbrellaGeo = new THREE.ConeGeometry(1.6, 0.7, 8);
  const umbrellaMat = new THREE.MeshStandardMaterial({ color: 0xe97856, roughness: 0.7 });
  const uMats: THREE.Matrix4[] = [];
  const uCols: THREE.Color[] = [];
  const uRng = new RNG(779);
  const uColors = [0xe97856, 0x2478f2, 0xf4b96b, 0xf1f3f5, 0x147c86];
  for (let i = 0; i < 70; i++) {
    const z = uRng.range(-600, 600);
    const cx = coastX(z) - uRng.range(30, 180);
    if (!isLand(cx, z)) continue;
    dummy.position.set(cx, heightAt(cx, z) + 1.6, z);
    dummy.rotation.set(0, uRng.range(0, 6.28), 0);
    dummy.updateMatrix();
    uMats.push(dummy.matrix.clone());
    uCols.push(new THREE.Color(uColors[uRng.int(0, uColors.length - 1)]));
  }
  const umbrellaMesh = new THREE.InstancedMesh(umbrellaGeo, umbrellaMat, Math.max(1, uMats.length));
  uMats.forEach((m, i) => {
    umbrellaMesh.setMatrixAt(i, m);
    umbrellaMesh.setColorAt(i, uCols[i]);
  });
  umbrellaMesh.instanceMatrix.needsUpdate = true;
  if (umbrellaMesh.instanceColor) umbrellaMesh.instanceColor.needsUpdate = true;
  beach.add(umbrellaMesh);
  group.add(beach);

  const buildingMats: THREE.MeshStandardMaterial[] = [];

  return {
    group,
    lampHeads: headMesh,
    lampHeadMat,
    lampPositions,
    buildingMats,
    treeMat,
    updateNight(night: number, timeSec = 0, wind = 1) {
      lampHeadMat.emissiveIntensity = night * 2.4;
      lampConeMat.opacity = night * 0.09;
      windUniforms.uTime.value = timeSec;
      windUniforms.uWind.value = 0.4 + wind * 0.6;
    },
  };
}
