import * as THREE from 'three';
import { RNG } from '../core/rng.ts';
import { districtAt } from '../core/config.ts';
import type { DistrictId } from '../core/config.ts';
import { heightAt, isLand } from './terrain.ts';
import type { RoadGraph } from './roads.ts';
import type { AABBCollider } from '../core/types.ts';
import { facadeTexture } from './textures.ts';

export interface ReservedPlot {
  x: number;
  z: number;
  r: number;
}

export interface BuildingSet {
  group: THREE.Group;
  facadeMats: THREE.MeshStandardMaterial[];
  parkCells: { x: number; z: number; w: number; d: number }[];
  parkingSpots: { x: number; z: number; yaw: number }[];
  updateNight(night: number): void;
}

const FACADE_DEFS = [
  { base: '#8f9296', win: '#20262e', seed: 101 },
  { base: '#b8b2a8', win: '#2a3138', seed: 102 },
  { base: '#7c8894', win: '#1d242c', seed: 103 },
  { base: '#9c8f7d', win: '#262b33', seed: 104 },
  { base: '#6e7b6a', win: '#20262e', seed: 105 },
  { base: '#8a7f8f', win: '#232a33', seed: 106 },
];

const DISTRICT_COLORS: Record<DistrictId, number[]> = {
  meridian_downtown: [0x9aa3ad, 0xb8b2a8, 0x7c8894, 0x8a7f8f, 0x5f6b7a, 0xa8927c],
  solace_beach: [0xd8c39b, 0xf1f3f5, 0x9fc6c9, 0xe8b98a],
  crown_marina: [0xc9b891, 0x8fa8b8, 0xb8b2a8, 0xd8c39b],
  northgate: [0xb08968, 0xa9b7a0, 0xc4a988, 0x93a58f, 0xb8b2a8],
  westhaven: [0xa98f7a, 0xb8b2a8, 0x9aa78f, 0xc0a284],
  iron_docks: [0x6f7a82, 0x7d6a5a, 0x5f6b74, 0x8a8f96],
  pine_ridge: [0x7a6248, 0x6b5a40, 0x84705a],
  cedar_plains: [0xb0483c, 0xd8d3c8, 0x9a8f6a, 0x8a7f5f],
  blackwater_marsh: [0x5f6b4f, 0x6e6a52],
  drift_island: [0xd8c39b, 0xf1f3f5],
};

const DISTRICT_HEIGHT: Record<DistrictId, [number, number]> = {
  meridian_downtown: [22, 70],
  solace_beach: [18, 50],
  crown_marina: [25, 65],
  northgate: [6, 14],
  westhaven: [6, 12],
  iron_docks: [8, 15],
  pine_ridge: [5, 9],
  cedar_plains: [5, 8],
  blackwater_marsh: [4, 7],
  drift_island: [5, 9],
};

export function buildBuildings(graph: RoadGraph, colliders: AABBCollider[], reserved: ReservedPlot[], seed: number): BuildingSet {
  const rng = new RNG(seed);
  const group = new THREE.Group();
  const facadeMats: THREE.MeshStandardMaterial[] = [];
  const perVariant: { mesh: THREE.InstancedMesh; mats: THREE.Matrix4[]; cols: THREE.Color[] }[] = [];

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  boxGeo.translate(0, 0.5, 0);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.95 });

  for (let v = 0; v < FACADE_DEFS.length; v++) {
    const def = FACADE_DEFS[v];
    const { map, emissive } = facadeTexture(def.base, def.win, def.seed);
    const mat = new THREE.MeshStandardMaterial({
      map,
      emissiveMap: emissive,
      emissive: 0xffffff,
      emissiveIntensity: 0,
      roughness: 0.85,
      metalness: 0.05,
    });
    facadeMats.push(mat);
    const mesh = new THREE.InstancedMesh(boxGeo, [mat, mat, roofMat, roofMat, mat, mat], 4000);
    mesh.count = 0;
    perVariant.push({ mesh, mats: [], cols: [] });
    group.add(mesh);
  }

  const dummy = new THREE.Object3D();
  const parkCells: { x: number; z: number; w: number; d: number }[] = [];
  const parkingSpots: { x: number; z: number; yaw: number }[] = [];

  const inReserved = (x: number, z: number, pad: number): boolean => {
    for (const p of reserved) {
      const dx = x - p.x;
      const dz = z - p.z;
      if (dx * dx + dz * dz < (p.r + pad) * (p.r + pad)) return true;
    }
    return false;
  };

  const xs = graph.streetXs;
  const zs = graph.streetZs;
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < zs.length - 1; j++) {
      const x0 = xs[i] + 9;
      const x1 = xs[i + 1] - 9;
      const z0 = zs[j] + 9;
      const z1 = zs[j + 1] - 9;
      const w = x1 - x0;
      const d = z1 - z0;
      if (w < 14 || d < 14) continue;
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      if (!isLand(cx, cz)) continue;
      const dist = districtAt(cx, cz);
      if (dist === 'blackwater_marsh' && rng.chance(0.85)) continue;
      if (inReserved(cx, cz, Math.max(w, d) * 0.6)) continue;

      const isPark = (dist === 'northgate' || dist === 'westhaven' || dist === 'solace_beach' || dist === 'meridian_downtown') && rng.chance(0.07);
      if (isPark) {
        parkCells.push({ x: cx, z: cz, w, d });
        continue;
      }
      const isParking = (dist === 'iron_docks' || dist === 'crown_marina' || dist === 'solace_beach') && rng.chance(0.18);
      if (isParking) {
        const spots = Math.floor((w * d) / 55);
        for (let s = 0; s < spots; s++) {
          const px = x0 + rng.range(4, w - 4);
          const pz = z0 + rng.range(4, d - 4);
          parkingSpots.push({ x: px, z: pz, yaw: rng.chance(0.5) ? 0 : Math.PI / 2 });
        }
        continue;
      }

      let count = 1;
      if (dist === 'meridian_downtown' || dist === 'crown_marina') count = rng.int(2, 4);
      else if (dist === 'solace_beach') count = rng.int(1, 2);
      else if (dist === 'northgate' || dist === 'westhaven') count = rng.int(2, 4);
      else if (dist === 'iron_docks') count = rng.int(1, 2);
      else count = rng.int(1, 2);

      for (let b = 0; b < count; b++) {
        let bw = rng.range(Math.min(12, w * 0.4), Math.min(w - 3, 34));
        let bd = rng.range(Math.min(12, d * 0.4), Math.min(d - 3, 30));
        if (dist === 'iron_docks') {
          bw = rng.range(w * 0.5, w - 4);
          bd = rng.range(d * 0.5, d - 4);
        }
        const bx = rng.range(x0 + bw / 2 + 1, x1 - bw / 2 - 1);
        const bz = rng.range(z0 + bd / 2 + 1, z1 - bd / 2 - 1);
        if (inReserved(bx, bz, Math.max(bw, bd) * 0.55 + 4)) continue;
        const [hMin, hMax] = DISTRICT_HEIGHT[dist];
        let h = rng.range(hMin, hMax);
        if (dist === 'meridian_downtown' && rng.chance(0.1)) h = rng.range(80, 118);
        if (dist === 'crown_marina' && rng.chance(0.12)) h = rng.range(70, 95);
        const y = heightAt(bx, bz);
        const rot = rng.chance(0.5) ? 0 : Math.PI / 2;
        const variant = rng.int(0, FACADE_DEFS.length - 1);
        const colors = DISTRICT_COLORS[dist];
        const col = new THREE.Color(colors[rng.int(0, colors.length - 1)]);
        col.offsetHSL(0, 0, rng.range(-0.06, 0.06));
        dummy.position.set(bx, y - 0.1, bz);
        dummy.rotation.set(0, rot, 0);
        const sw = rot === 0 ? bw : bd;
        const sd = rot === 0 ? bd : bw;
        dummy.scale.set(sw, h, sd);
        dummy.updateMatrix();
        const pv = perVariant[variant];
        pv.mats.push(dummy.matrix.clone());
        pv.cols.push(col);
        const min = new THREE.Vector3(bx - sw / 2, y - 0.1, bz - sd / 2);
        const max = new THREE.Vector3(bx + sw / 2, y - 0.1 + h, bz + sd / 2);
        colliders.push({ min, max, kind: 'building' });
      }
    }
  }

  perVariant.forEach((pv) => {
    pv.mesh.count = pv.mats.length;
    pv.mats.forEach((m, i) => {
      pv.mesh.setMatrixAt(i, m);
      pv.mesh.setColorAt(i, pv.cols[i]);
    });
    pv.mesh.instanceMatrix.needsUpdate = true;
    if (pv.mesh.instanceColor) pv.mesh.instanceColor.needsUpdate = true;
  });

  const acGeo = new THREE.BoxGeometry(1.6, 1.0, 1.6);
  const acMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.6, metalness: 0.4 });
  const acMats: THREE.Matrix4[] = [];
  perVariant.forEach((pv, vi) => {
    pv.mats.forEach((m, i) => {
      const e = new THREE.Matrix4().fromArray(m.elements);
      const pos = new THREE.Vector3().setFromMatrixPosition(e);
      const scale = new THREE.Vector3().setFromMatrixScale(e);
      if (scale.y > 14 && rng.chance(0.55)) {
        dummy.position.set(pos.x + rng.range(-2, 2), pos.y + scale.y + 0.4, pos.z + rng.range(-2, 2));
        dummy.rotation.set(0, rng.range(0, 6.28), 0);
        dummy.scale.set(rng.range(0.8, 1.4), 1, rng.range(0.8, 1.4));
        dummy.updateMatrix();
        acMats.push(dummy.matrix.clone());
      }
      void vi;
      void i;
    });
  });
  if (acMats.length > 0) {
    const acMesh = new THREE.InstancedMesh(acGeo, acMat, acMats.length);
    acMats.forEach((m, i) => acMesh.setMatrixAt(i, m));
    acMesh.instanceMatrix.needsUpdate = true;
    group.add(acMesh);
  }

  const benchGeo = new THREE.BoxGeometry(2, 0.5, 0.6);
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x6b4f2a, roughness: 0.8 });
  const benchMats: THREE.Matrix4[] = [];
  for (const p of parkCells) {
    const n = Math.floor((p.w * p.d) / 220);
    for (let i = 0; i < n; i++) {
      const bx = p.x + rng.range(-p.w / 2 + 2, p.w / 2 - 2);
      const bz = p.z + rng.range(-p.d / 2 + 2, p.d / 2 - 2);
      dummy.position.set(bx, heightAt(bx, bz) + 0.25, bz);
      dummy.rotation.set(0, rng.range(0, Math.PI * 2), 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      benchMats.push(dummy.matrix.clone());
    }
  }
  if (benchMats.length > 0) {
    const benchMesh = new THREE.InstancedMesh(benchGeo, benchMat, benchMats.length);
    benchMats.forEach((m, i) => benchMesh.setMatrixAt(i, m));
    benchMesh.instanceMatrix.needsUpdate = true;
    group.add(benchMesh);
  }

  return {
    group,
    facadeMats,
    parkCells,
    parkingSpots,
    updateNight(night: number) {
      for (const m of facadeMats) m.emissiveIntensity = night * 1.6;
    },
  };
}
