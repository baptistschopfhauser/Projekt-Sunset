import * as THREE from 'three';
import { RNG } from '../core/rng.ts';
import { WORLD, PALETTE, districtAt } from '../core/config.ts';
import { heightAt, isLand, coastX, fbm, surfaceAt, HARBOR } from './terrain.ts';
import { buildRoadGraph, RoadGraph, ROAD_HALF_WIDTH, SIDEWALK_WIDTH } from './roads.ts';
import { buildBuildings } from './buildings.ts';
import { buildProps } from './props.ts';
import { buildPOIs } from './pois.ts';
import { asphaltTexture, sidewalkTexture } from './textures.ts';
import type { AABBCollider, POI } from '../core/types.ts';

export interface World {
  scene: THREE.Scene;
  graph: RoadGraph;
  colliders: AABBCollider[];
  losColliders: AABBCollider[];
  pois: POI[];
  spawnPoint: THREE.Vector3;
  updateEnvironment(nightFactor: number, timeSec: number): void;
  waterMesh: THREE.Mesh;
  buildingCount: number;
  props: ReturnType<typeof buildProps>;
  buildings: ReturnType<typeof buildBuildings>;
  poiSet: ReturnType<typeof buildPOIs>;
  roadMat: THREE.Material;
  walkMat: THREE.Material;
  groundMat: THREE.Material;
}

function buildGround(scene: THREE.Scene): THREE.Mesh {
  const w = 3900;
  const h = 3500;
  const segX = 130;
  const segZ = 116;
  const geo = new THREE.PlaneGeometry(w, h, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);
    const surf = surfaceAt(x, z);
    const n = fbm(x * 0.03, z * 0.03, 99, 3);
    switch (surf) {
      case 'sand':
        c.setHex(PALETTE.coastalSand).offsetHSL(0, 0, (n - 0.5) * 0.08);
        break;
      case 'grass':
        c.setHex(PALETTE.coastalGreen).offsetHSL((n - 0.5) * 0.04, 0.05, (n - 0.5) * 0.09);
        break;
      case 'mud':
        c.setHex(0x4a4636).offsetHSL(0, 0, (n - 0.5) * 0.06);
        break;
      case 'gravel':
        c.setHex(0x6a6f75).offsetHSL(0, 0, (n - 0.5) * 0.08);
        break;
      case 'water':
        c.setHex(0x1d3a3a);
        break;
      default: {
        const d = districtAt(x, z);
        if (d === 'meridian_downtown') c.setHex(0x565b63);
        else if (d === 'iron_docks') c.setHex(0x5c5f63);
        else c.setHex(0x8d9484);
        c.offsetHSL(0, 0, (n - 0.5) * 0.07);
      }
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0.0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'ground';
  scene.add(mesh);
  return mesh;
}

function buildWater(scene: THREE.Scene): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(3900, 3500, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: PALETTE.deepTeal,
    transparent: true,
    opacity: 0.86,
    roughness: 0.15,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = WORLD.waterLevel + 0.06;
  mesh.name = 'water';
  scene.add(mesh);
  return mesh;
}

function buildRoadMeshes(scene: THREE.Scene, graph: RoadGraph): { roadMat: THREE.Material; walkMat: THREE.Material } {
  const asphalt = asphaltTexture();
  const sidewalk = sidewalkTexture();

  const roadVerts: number[] = [];
  const roadUVs: number[] = [];
  const roadIdx: number[] = [];
  const walkVerts: number[] = [];
  const walkUVs: number[] = [];
  const walkIdx: number[] = [];

  const pushQuad = (verts: number[], uvs: number[], idx: number[], ax: number, ay: number, az: number, bx: number, by: number, bz: number, hw: number, dx: number, dz: number, v0: number, v1: number) => {
    const rx = -dz * hw;
    const rz = dx * hw;
    const base = verts.length / 3;
    verts.push(ax + rx, ay, az + rz, bx + rx, by, bz + rz, bx - rx, by, bz - rz, ax - rx, ay, az - rz);
    uvs.push(0, v0, 1, v0, 1, v1, 0, v1);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  for (const e of graph.edges) {
    const a = graph.nodes[e.a];
    const b = graph.nodes[e.b];
    const segs = Math.max(1, Math.ceil(e.len / 24));
    let vAcc = 0;
    for (let s = 0; s < segs; s++) {
      const t0 = s / segs;
      const t1 = (s + 1) / segs;
      const ax = a.x + (b.x - a.x) * t0;
      const az = a.z + (b.z - a.z) * t0;
      const bx = a.x + (b.x - a.x) * t1;
      const bz = a.z + (b.z - a.z) * t1;
      const ay = heightAt(ax, az) + 0.09;
      const by = heightAt(bx, bz) + 0.09;
      const segLen = e.len / segs;
      const hw = e.kind === 'ring' || e.kind === 'bridge' ? ROAD_HALF_WIDTH + 1.5 : ROAD_HALF_WIDTH;
      pushQuad(roadVerts, roadUVs, roadIdx, ax, ay, az, bx, by, bz, hw, e.dx, e.dz, vAcc / 6, (vAcc + segLen) / 6);
      const sw = SIDEWALK_WIDTH;
      const so = ROAD_HALF_WIDTH;
      pushQuad(walkVerts, walkUVs, walkIdx, ax + -e.dz * so, ay + 0.1, az + e.dx * so, bx + -e.dz * so, by + 0.1, bz + e.dx * so, sw, e.dx, e.dz, vAcc / 8, (vAcc + segLen) / 8);
      pushQuad(walkVerts, walkUVs, walkIdx, ax + e.dz * so, ay + 0.1, az + -e.dx * so, bx + e.dz * so, by + 0.1, bz + -e.dx * so, sw, -e.dx, -e.dz, vAcc / 8, (vAcc + segLen) / 8);
      vAcc += segLen;
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
  roadGeo.setIndex(roadIdx);
  roadGeo.computeVertexNormals();
  const roadMat = new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.92, metalness: 0.02 });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  roadMesh.name = 'roads';
  scene.add(roadMesh);

  const walkGeo = new THREE.BufferGeometry();
  walkGeo.setAttribute('position', new THREE.Float32BufferAttribute(walkVerts, 3));
  walkGeo.setAttribute('uv', new THREE.Float32BufferAttribute(walkUVs, 2));
  walkGeo.setIndex(walkIdx);
  walkGeo.computeVertexNormals();
  const walkMat = new THREE.MeshStandardMaterial({ map: sidewalk, roughness: 0.95 });
  const walkMesh = new THREE.Mesh(walkGeo, walkMat);
  walkMesh.receiveShadow = true;
  walkMesh.name = 'sidewalks';
  scene.add(walkMesh);

  const discGeo = new THREE.CircleGeometry(ROAD_HALF_WIDTH + 2.5, 20);
  discGeo.rotateX(-Math.PI / 2);
  const discMat = new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.92 });
  const discs = new THREE.InstancedMesh(discGeo, discMat, graph.nodes.length);
  const dummy = new THREE.Object3D();
  let dc = 0;
  for (const n of graph.nodes) {
    if (n.degree < 2) continue;
    dummy.position.set(n.x, heightAt(n.x, n.z) + 0.1, n.z);
    dummy.updateMatrix();
    discs.setMatrixAt(dc++, dummy.matrix);
  }
  discs.count = dc;
  discs.instanceMatrix.needsUpdate = true;
  scene.add(discs);
  return { roadMat, walkMat };
}

function buildHarborWalls(scene: THREE.Scene, colliders: AABBCollider[]): void {
  const mat = new THREE.MeshStandardMaterial({ color: 0x4a4f55, roughness: 0.9 });
  const ring: { x: number; z: number }[] = [];
  for (let a = 0; a < 40; a++) {
    const ang = (a / 40) * Math.PI * 2;
    ring.push({ x: HARBOR.x + Math.cos(ang) * (HARBOR.r + 2), z: HARBOR.z + Math.sin(ang) * (HARBOR.r + 2) });
  }
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    if (!isLand(p.x, p.z) && !isLand(q.x, q.z)) continue;
    const mx = (p.x + q.x) / 2;
    const mz = (p.z + q.z) / 2;
    if (!isLand(mx, mz)) continue;
    const len = Math.hypot(q.x - p.x, q.z - p.z);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(len, 2.5, 0.6), mat);
    wall.position.set(mx, heightAt(mx, mz) + 1.0, mz);
    wall.rotation.y = -Math.atan2(q.z - p.z, q.x - p.x);
    scene.add(wall);
    colliders.push({ min: new THREE.Vector3(mx - len / 2 - 0.4, heightAt(mx, mz) - 1, mz - 1), max: new THREE.Vector3(mx + len / 2 + 0.4, heightAt(mx, mz) + 2.5, mz + 1), kind: 'wall' });
  }
}

export function buildWorld(scene: THREE.Scene, seed = 20240917): World {
  const graph = buildRoadGraph(seed);
  const rng = new RNG(seed ^ 0x5f3a);
  const colliders: AABBCollider[] = [];

  const groundMesh = buildGround(scene);
  const waterMesh = buildWater(scene);
  const { roadMat, walkMat } = buildRoadMeshes(scene, graph);

  const poiSet = buildPOIs(scene, colliders);
  const buildings = buildBuildings(graph, colliders, poiSet.reserved, seed ^ 0x1111);
  const props = buildProps(graph, colliders, rng);
  buildHarborWalls(scene, colliders);

  scene.add(buildings.group);
  scene.add(props.group);
  scene.add(poiSet.group);

  const losColliders = colliders.filter((c) => c.kind === 'building' || c.kind === 'wall');

  const spawnPoint = new THREE.Vector3(-760, heightAt(-760, 545), 545);

  const world: World = {
    scene,
    graph,
    colliders,
    losColliders,
    pois: poiSet.pois,
    spawnPoint,
    waterMesh,
    buildingCount: buildings.group.children.length,
    props,
    buildings,
    poiSet,
    roadMat,
    walkMat,
    groundMat: groundMesh.material as THREE.Material,
    updateEnvironment(nightFactor: number, timeSec: number) {
      buildings.updateNight(nightFactor);
      props.updateNight(nightFactor);
      const wm = waterMesh.material as THREE.MeshStandardMaterial;
      wm.roughness = 0.15 + (1 - nightFactor) * 0.0;
      const pos = waterMesh.geometry.attributes.position as THREE.BufferAttribute;
      void pos;
      waterMesh.position.y = WORLD.waterLevel + 0.06 + Math.sin(timeSec * 0.8) * 0.03;
    },
  };
  return world;
}

export { coastX };
