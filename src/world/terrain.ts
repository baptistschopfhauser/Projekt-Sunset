import { WORLD, districtAt } from '../core/config.ts';
import type { DistrictId } from '../core/config.ts';

const hash2 = (x: number, y: number, seed: number): number => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const smooth = (t: number): number => t * t * (3 - 2 * t);

export function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const u = smooth(xf);
  const v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, seed: number, octaves: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + i * 101);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

export function coastX(z: number): number {
  return 1500 + 80 * Math.sin(z * 0.008) + 40 * Math.sin(z * 0.021 + 1.7);
}

export const ISLAND = { x: 1700, z: 100, r: 120 };
export const HARBOR = { x: -900, z: 1480, r: 250 };
export const HARBOR_BRIDGE = { z: 1430, halfWidth: 14, minX: -1260, maxX: -540 };
export const PIER_STRIP = { x: -900, halfWidth: 12, minZ: 1330, maxZ: 1480 };

export function inHarborBasin(x: number, z: number): boolean {
  const dx = x - HARBOR.x;
  const dz = z - HARBOR.z;
  if (dx * dx + dz * dz >= HARBOR.r * HARBOR.r) return false;
  if (Math.abs(z - HARBOR_BRIDGE.z) < HARBOR_BRIDGE.halfWidth && x > HARBOR_BRIDGE.minX && x < HARBOR_BRIDGE.maxX) return false;
  if (Math.abs(x - PIER_STRIP.x) < PIER_STRIP.halfWidth && z > PIER_STRIP.minZ && z < PIER_STRIP.maxZ) return false;
  return true;
}

export function isLand(x: number, z: number): boolean {
  if (x < WORLD.minX - 60 || x > WORLD.maxX + 260 || z < WORLD.minZ - 60 || z > WORLD.maxZ + 60) return false;
  if (inHarborBasin(x, z)) return false;
  const dx = x - ISLAND.x;
  const dz = z - ISLAND.z;
  if (dx * dx + dz * dz < ISLAND.r * ISLAND.r) return true;
  return x < coastX(z) - 10;
}

export function isWater(x: number, z: number): boolean {
  if (inHarborBasin(x, z)) return true;
  return !isLand(x, z) && x > WORLD.minX && x < WORLD.maxX + 300 && z > WORLD.minZ && z < WORLD.maxZ + 100;
}

export function heightAt(x: number, z: number): number {
  const d: DistrictId = districtAt(x, z);
  const n = fbm(x * 0.004, z * 0.004, 7, 4);
  const n2 = fbm(x * 0.02, z * 0.02, 13, 3);
  let h = 2.5;
  switch (d) {
    case 'pine_ridge':
      h = 30 + n * 95 + n2 * 8;
      break;
    case 'westhaven':
      h = 18 + n * 26;
      break;
    case 'northgate':
      h = 8 + n * 12;
      break;
    case 'meridian_downtown':
      h = 6 + n * 10;
      break;
    case 'solace_beach': {
      const c = coastX(z);
      const t = Math.min(1, Math.max(0, (c - x) / 260));
      h = 1.5 + t * 6 + n2 * 0.6;
      break;
    }
    case 'crown_marina':
      h = 3 + n * 3;
      break;
    case 'iron_docks':
      h = 2 + n2 * 1.5;
      break;
    case 'cedar_plains':
      h = 14 + n * 12;
      break;
    case 'blackwater_marsh': {
      h = 0.6 + n * 2.2;
      if (fbm(x * 0.008 + 40, z * 0.008, 31, 3) > 0.62) h = -0.6;
      break;
    }
    case 'drift_island': {
      const dx = x - ISLAND.x;
      const dz = z - ISLAND.z;
      const r = Math.sqrt(dx * dx + dz * dz);
      const t = Math.min(1, Math.max(0, (ISLAND.r - r) / 60));
      h = -2 + t * 5.5;
      break;
    }
  }
  if (!isLand(x, z)) {
    const c = coastX(z);
    const dx = x - ISLAND.x;
    const dz = z - ISLAND.z;
    const islandDist = Math.sqrt(dx * dx + dz * dz);
    if (islandDist < ISLAND.r) return h;
    const dcoast = x - c;
    if (dcoast > 0) return Math.min(h, -2.5 - dcoast * 0.02);
  }
  return h;
}

export function groundNormal(x: number, z: number): { nx: number; ny: number; nz: number } {
  const e = 1.5;
  const hx = heightAt(x + e, z) - heightAt(x - e, z);
  const hz = heightAt(x, z + e) - heightAt(x, z - e);
  const inv = 1 / Math.sqrt(hx * hx + 4 + hz * hz);
  return { nx: -hx * inv, ny: 2 * inv, nz: -hz * inv };
}

export function surfaceAt(x: number, z: number): 'asphalt' | 'concrete' | 'sand' | 'grass' | 'gravel' | 'mud' | 'water' | 'dirt' {
  if (isWater(x, z)) return 'water';
  const d = districtAt(x, z);
  if (d === 'solace_beach' || d === 'drift_island') {
    const c = coastX(z);
    if (x > c - 200) return 'sand';
  }
  if (d === 'blackwater_marsh') return heightAt(x, z) < 0.9 ? 'water' : 'mud';
  if (d === 'iron_docks') return 'gravel';
  if (d === 'pine_ridge' || d === 'cedar_plains') return 'grass';
  return 'asphalt';
}
