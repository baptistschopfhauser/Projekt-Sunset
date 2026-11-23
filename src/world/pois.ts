import * as THREE from 'three';
import { districtAt } from '../core/config.ts';
import type { POI, AABBCollider } from '../core/types.ts';
import { heightAt, HARBOR, PIER_STRIP } from './terrain.ts';
import { signTexture, labelSprite } from './textures.ts';

export interface CasinoInterior {
  door: THREE.Vector3;
  center: THREE.Vector3;
  cashier: THREE.Vector3;
  tables: { kind: 'slots' | 'roulette' | 'blackjack'; pos: THREE.Vector3; id: string }[];
  group: THREE.Object3D;
  lights: THREE.PointLight[];
}

export interface BarInterior {
  door: THREE.Vector3;
  dartboard: THREE.Vector3;
  poolTable: THREE.Vector3;
  group: THREE.Object3D;
}

export interface POISet {
  group: THREE.Object3D;
  pois: POI[];
  reserved: { x: number; z: number; r: number }[];
  casino: CasinoInterior;
  bar: BarInterior;
  labels: THREE.Sprite[];
  parkedSpots: { modelId: string; x: number; z: number; yaw: number }[];
  missionPoints: Record<string, THREE.Vector3>;
  garageZone: { minX: number; maxX: number; minZ: number; maxZ: number; center: THREE.Vector3 };
  courtHoop: { pos: THREE.Vector3; ringRadius: number };
  gasZone: { minX: number; maxX: number; minZ: number; maxZ: number; center: THREE.Vector3; price: number };
  apartmentDoor: THREE.Vector3;
}

function addColliderBox(colliders: AABBCollider[], cx: number, cy: number, cz: number, w: number, h: number, d: number): void {
  colliders.push({
    min: new THREE.Vector3(cx - w / 2, cy, cz - d / 2),
    max: new THREE.Vector3(cx + w / 2, cy + h, cz + d / 2),
    kind: 'building',
  });
}

function shopBuilding(group: THREE.Object3D, colliders: AABBCollider[], opts: { x: number; z: number; w: number; h: number; d: number; color: number; sign: string; signBg: string; doorSide?: 'south' | 'north' | 'east' | 'west'; label?: string }): THREE.Vector3 {
  const { x, z, w, h, d, color, sign, signBg } = opts;
  const y = heightAt(x, z);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  );
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  addColliderBox(colliders, x, y, z, w, h, d);
  const signTex = signTexture(sign, signBg);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(w * 0.8, 14), 3),
    new THREE.MeshBasicMaterial({ map: signTex, transparent: false })
  );
  const side = opts.doorSide ?? 'south';
  const off = side === 'south' ? d / 2 + 0.05 : side === 'north' ? -d / 2 - 0.05 : 0;
  const offX = side === 'east' ? w / 2 + 0.05 : side === 'west' ? -w / 2 - 0.05 : 0;
  signMesh.position.set(x + offX, y + h - 1.8, z + off);
  if (side === 'south') signMesh.rotation.y = 0;
  else if (side === 'north') signMesh.rotation.y = Math.PI;
  else if (side === 'east') signMesh.rotation.y = Math.PI / 2;
  else signMesh.rotation.y = -Math.PI / 2;
  group.add(signMesh);
  let door: THREE.Vector3;
  if (side === 'south') door = new THREE.Vector3(x, y, z + d / 2 + 1.5);
  else if (side === 'north') door = new THREE.Vector3(x, y, z - d / 2 - 1.5);
  else if (side === 'east') door = new THREE.Vector3(x + w / 2 + 1.5, y, z);
  else door = new THREE.Vector3(x - w / 2 - 1.5, y, z);
  if (opts.label) {
    const spr = labelSprite(opts.label);
    spr.position.set(x, y + h + 4, z);
    group.add(spr);
  }
  return door;
}

function buildCasino(group: THREE.Object3D, colliders: AABBCollider[]): CasinoInterior {
  const cx = 950;
  const cz = 1000;
  const W = 46;
  const D = 34;
  const H = 7;
  const y = heightAt(cx, cz);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x274060, roughness: 0.6 });
  const wallThick = 0.7;
  const doorW = 4;
  const southZ = cz + D / 2;
  const mkWall = (w: number, x: number, z: number, d: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), wallMat);
    m.position.set(x, y + H / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    addColliderBox(colliders, x, y, z, w, H, d);
  };
  mkWall(W, cx, cz - D / 2, wallThick);
  mkWall(wallThick, cx - W / 2, cz, D);
  mkWall(wallThick, cx + W / 2, cz, D);
  mkWall((W - doorW) / 2, cx - (doorW / 2 + (W - doorW) / 4), southZ, wallThick);
  mkWall((W - doorW) / 2, cx + (doorW / 2 + (W - doorW) / 4), southZ, wallThick);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 2, 0.8, D + 2), new THREE.MeshStandardMaterial({ color: 0x1b2c4a, roughness: 0.7 }));
  roof.position.set(cx, y + H + 0.4, cz);
  group.add(roof);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W - 1, D - 1), new THREE.MeshStandardMaterial({ color: 0x14213d, roughness: 0.4, metalness: 0.1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, y + 0.06, cz);
  floor.receiveShadow = true;
  group.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W - 1, D - 1), new THREE.MeshStandardMaterial({ color: 0x0d1526, emissive: 0xf4b544, emissiveIntensity: 0.25 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(cx, y + H - 0.05, cz);
  group.add(ceil);

  const columnMat = new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 0.4, metalness: 0.4 });
  for (const [ox, oz] of [[-15, -8], [-15, 8], [0, -8], [0, 8], [15, -8], [15, 8]] as const) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, H - 0.2, 10), columnMat);
    col.position.set(cx + ox, y + (H - 0.2) / 2, cz + oz);
    col.castShadow = true;
    group.add(col);
    addColliderBox(colliders, cx + ox, y, cz + oz, 1.1, H - 0.2, 1.1);
  }

  const lights: THREE.PointLight[] = [];
  for (const [ox, oz] of [[-12, -6], [12, -6], [-12, 8], [12, 8]] as const) {
    const l = new THREE.PointLight(0xffd9a0, 60, 30, 2);
    l.position.set(cx + ox, y + H - 1, cz + oz);
    group.add(l);
    lights.push(l);
  }

  const interior = new THREE.Group();
  group.add(interior);
  const tables: CasinoInterior['tables'] = [];

  const cashier = new THREE.Vector3(cx - 6, y, southZ - 3);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x6b4f2a, roughness: 0.5 }));
  desk.position.set(cashier.x, y + 0.6, cashier.z);
  interior.add(desk);
  addColliderBox(colliders, cashier.x, y, cashier.z, 6, 1.2, 1.2);
  const cashierSign = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: signTexture('CHIPS', '#14213d', '#F4B544') }));
  cashierSign.position.set(cashier.x, y + 2.2, cashier.z - 0.7);
  cashierSign.rotation.y = Math.PI;
  interior.add(cashierSign);

  const slotColors = [0xff4fa3, 0xf4b544, 0x7a4fd0];
  for (let i = 0; i < 3; i++) {
    const sx = cx - W / 2 + 3 + i * 3.4;
    const sz = cz - 6;
    const machine = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.9), new THREE.MeshStandardMaterial({ color: slotColors[i], roughness: 0.4, metalness: 0.3, emissive: slotColors[i], emissiveIntensity: 0.25 }));
    machine.position.set(sx, y + 1.1, sz);
    interior.add(machine);
    addColliderBox(colliders, sx, y, sz, 1.6, 2.2, 0.9);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ color: 0xf1f3f5 }));
    screen.position.set(sx, y + 1.6, sz + 0.46);
    interior.add(screen);
    tables.push({ kind: 'slots', pos: new THREE.Vector3(sx, y, sz + 1.6), id: `slots_${i}` });
  }

  const roulettePos = new THREE.Vector3(cx, y, cz + 2);
  const rTable = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 1, 24), new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.5 }));
  rTable.position.set(roulettePos.x, y + 0.5, roulettePos.z);
  interior.add(rTable);
  addColliderBox(colliders, roulettePos.x, y, roulettePos.z, 4.4, 1, 4.4);
  const rTop = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.1, 24), new THREE.MeshStandardMaterial({ color: 0x0d3b22, roughness: 0.4 }));
  rTop.position.set(roulettePos.x, y + 1.05, roulettePos.z);
  interior.add(rTop);
  tables.push({ kind: 'roulette', pos: new THREE.Vector3(roulettePos.x, y, roulettePos.z + 3), id: 'roulette_0' });

  for (let i = 0; i < 3; i++) {
    const bx = cx + W / 2 - 4;
    const bz = cz - 8 + i * 8;
    const t = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, 3), new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.6 }));
    t.position.set(bx, y + 0.5, bz);
    interior.add(t);
    addColliderBox(colliders, bx, y, bz, 1.4, 1, 3);
    tables.push({ kind: 'blackjack', pos: new THREE.Vector3(bx - 2, y, bz), id: `blackjack_${i}` });
  }

  const barCounter = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 1.4), new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 0.5 }));
  barCounter.position.set(cx, y + 0.6, cz - D / 2 + 2);
  interior.add(barCounter);
  addColliderBox(colliders, cx, y, cz - D / 2 + 2, 10, 1.2, 1.4);

  const potMat = new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8 });
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x3f7a44, roughness: 0.9 });
  for (const [px, pz] of [[cx - W / 2 + 2, cz + D / 2 - 2], [cx + W / 2 - 2, cz + D / 2 - 2], [cx - W / 2 + 2, cz], [cx + W / 2 - 2, cz]] as const) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.6, 8), potMat);
    pot.position.set(px, y + 0.3, pz);
    const plant = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 7), plantMat);
    plant.position.set(px, y + 1.5, pz);
    interior.add(pot, plant);
  }

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), new THREE.MeshBasicMaterial({ map: signTexture('THE CROWN CASINO', '#3d1f5d', '#F4B544', 1024, 256) }));
  sign.position.set(cx, y + H + 3.5, southZ + 0.1);
  group.add(sign);
  const label = labelSprite('THE CROWN CASINO', '#F4B544');
  label.position.set(cx, y + H + 9, cz);
  group.add(label);

  return {
    door: new THREE.Vector3(cx, y, southZ + 2),
    center: new THREE.Vector3(cx, y, cz),
    cashier,
    tables,
    group: interior,
    lights,
  };
}

function buildBar(group: THREE.Object3D, colliders: AABBCollider[]): BarInterior {
  const cx = -700;
  const cz = -180;
  const W = 16;
  const D = 12;
  const H = 4.5;
  const y = heightAt(cx, cz);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a2f28, roughness: 0.8 });
  const t = 0.5;
  const southZ = cz + D / 2;
  const doorW = 3;
  const walls: [number, number, number, number][] = [
    [W, cx, cz - D / 2, t],
    [t, cx - W / 2, cz, D],
    [t, cx + W / 2, cz, D],
    [(W - doorW) / 2, cx - (doorW / 2 + (W - doorW) / 4), southZ, t],
    [(W - doorW) / 2, cx + (doorW / 2 + (W - doorW) / 4), southZ, t],
  ];
  for (const [w, x, z, d] of walls) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), wallMat);
    m.position.set(x, y + H / 2, z);
    group.add(m);
    addColliderBox(colliders, x, y, z, w, H, d);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.5, D - 0.5), new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.6 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, y + 0.05, cz);
  group.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.5, D - 0.5), new THREE.MeshStandardMaterial({ color: 0x1a1512, emissive: 0xffb46b, emissiveIntensity: 0.15 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(cx, y + H - 0.05, cz);
  group.add(ceil);
  const l = new THREE.PointLight(0xffc890, 40, 20, 2);
  l.position.set(cx, y + H - 0.6, cz);
  group.add(l);

  const dartboardPos = new THREE.Vector3(cx, y + 1.7, cz - D / 2 + 0.3);
  const board = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0xd8c39b, roughness: 0.7 }));
  board.rotation.x = Math.PI / 2;
  board.position.copy(dartboardPos);
  group.add(board);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 24), new THREE.MeshStandardMaterial({ color: 0xb0483c }));
  ring.position.copy(dartboardPos);
  ring.position.z -= 0.05;
  group.add(ring);

  const poolPos = new THREE.Vector3(cx + 3, y, cz + 1);
  const pool = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 1.9), new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.7 }));
  pool.position.set(poolPos.x, y + 0.45, poolPos.z);
  group.add(pool);
  addColliderBox(colliders, poolPos.x, y, poolPos.z, 3.6, 0.9, 1.9);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: signTexture('THE RUSTY ANCHOR', '#2a2018', '#E97856') }));
  sign.position.set(cx, y + H + 2, southZ + 0.1);
  group.add(sign);

  return {
    door: new THREE.Vector3(cx, y, southZ + 1.5),
    dartboard: dartboardPos,
    poolTable: poolPos,
    group,
  };
}

export function buildPOIs(group: THREE.Object3D, colliders: AABBCollider[]): POISet {
  const pois: POI[] = [];
  const reserved: { x: number; z: number; r: number }[] = [];
  const parkedSpots: POISet['parkedSpots'] = [];
  const labels: THREE.Sprite[] = [];
  const missionPoints: Record<string, THREE.Vector3> = {};

  const addPOI = (p: POI, reserveR: number) => {
    pois.push(p);
    reserved.push({ x: p.position.x, z: p.position.z, r: reserveR });
    const spr = labelSprite(p.name, p.kind === 'casino' ? '#F4B544' : '#F1F3F5');
    spr.position.set(p.position.x, p.position.y + 14, p.position.z);
    labels.push(spr);
    group.add(spr);
  };

  const reg = (id: string, name: string, kind: POI['kind'], x: number, z: number, radius = 6): POI => {
    const p: POI = { id, name, kind, position: new THREE.Vector3(x, heightAt(x, z), z), radius, district: districtAt(x, z) };
    addPOI(p, radius + 14);
    return p;
  };

  const casino = buildCasino(group, colliders);
  const casinoPOI = reg('casino', 'The Crown Casino', 'casino', casino.door.x, casino.door.z, 8);
  pois[pois.length - 1] = { ...casinoPOI, position: casino.center, radius: 10 };

  const bar = buildBar(group, colliders);
  reg('bar', 'The Rusty Anchor', 'bar', bar.door.x, bar.door.z, 7);
  const dartPOI = reg('darts', 'Darts - The Rusty Anchor', 'darts', bar.dartboard.x, bar.dartboard.z, 4);
  pois[pois.length - 1] = { ...dartPOI, position: new THREE.Vector3(bar.dartboard.x, bar.dartboard.y, bar.dartboard.z + 2), radius: 3 };
  const billiardPOI = reg('billiards', 'Pool - The Rusty Anchor', 'billiards', bar.poolTable.x, bar.poolTable.z + 2.5, 3);
  void billiardPOI;

  const policeDoor = shopBuilding(group, colliders, { x: 80, z: -320, w: 30, h: 11, d: 20, color: 0x4a5568, sign: 'SOLACE POLICE', signBg: '#1d2733', label: 'Police Station' });
  const policePOI = reg('police', 'Solace Police Station', 'police', policeDoor.x, policeDoor.z, 7);
  void policePOI;
  parkedSpots.push({ modelId: 'solace_patrol', x: 66, z: -304, yaw: Math.PI }, { modelId: 'solace_patrol', x: 94, z: -304, yaw: Math.PI });

  const hospDoor = shopBuilding(group, colliders, { x: -680, z: -420, w: 28, h: 13, d: 18, color: 0xd8d3c8, sign: 'SOLACE HOSPITAL', signBg: '#7a1f2b', label: 'Hospital' });
  reg('hospital', 'Solace Hospital', 'hospital', hospDoor.x, hospDoor.z, 7);

  const dealerDoor = shopBuilding(group, colliders, { x: -1320, z: 220, w: 24, h: 8, d: 14, color: 0x2c3e50, sign: 'WESTHAVEN MOTORS', signBg: '#10151C', label: 'Westhaven Motors' });
  reg('dealership', 'Westhaven Motors', 'dealership', dealerDoor.x, dealerDoor.z, 8);
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(70, 40), new THREE.MeshStandardMaterial({ color: 0x2f3439, roughness: 0.95 }));
  lot.rotation.x = -Math.PI / 2;
  lot.position.set(-1320, heightAt(-1320, 250) + 0.08, 250);
  lot.receiveShadow = true;
  group.add(lot);
  parkedSpots.push(
    { modelId: 'volton_metro', x: -1345, z: 245, yaw: 0.3 },
    { modelId: 'alden_crest', x: -1330, z: 252, yaw: 0.1 },
    { modelId: 'vexler_gt', x: -1310, z: 256, yaw: -0.2 },
    { modelId: 'corsair_s9', x: -1292, z: 250, yaw: 0.4 },
    { modelId: 'tempest_xr', x: -1303, z: 240, yaw: -0.5 },
  );

  const garageDoor = shopBuilding(group, colliders, { x: -1240, z: 360, w: 26, h: 9, d: 16, color: 0x5f6b74, sign: 'GARAGE', signBg: '#10151C', label: 'Garage (for sale $8,000)' });
  reg('garage', 'Westhaven Garage', 'garage', garageDoor.x, garageDoor.z, 8);
  const garageZone = { minX: -1268, maxX: -1212, minZ: 372, maxZ: 396, center: new THREE.Vector3(-1240, heightAt(-1240, 384), 384) };

  const workshopDoor = shopBuilding(group, colliders, { x: -1140, z: 120, w: 22, h: 7, d: 14, color: 0x6b5a40, sign: 'AUTOFIX WORKSHOP', signBg: '#2a2018', label: 'AutoFix Workshop' });
  reg('workshop', 'AutoFix Workshop', 'workshop', workshopDoor.x, workshopDoor.z, 8);

  const ammoDoor = shopBuilding(group, colliders, { x: -620, z: -260, w: 14, h: 5, d: 10, color: 0x37474f, sign: 'AMMUNITION', signBg: '#10151C', label: 'Ammunition' });
  reg('ammunition', 'Northgate Ammunition', 'ammunition', ammoDoor.x, ammoDoor.z, 6);

  const marketDoor = shopBuilding(group, colliders, { x: -1420, z: 520, w: 30, h: 8, d: 18, color: 0x9aa78f, sign: 'SUNSET MARKET', signBg: '#1d3a2a', label: 'Sunset Market' });
  reg('market', 'Sunset Market', 'market', marketDoor.x, marketDoor.z, 8);

  const bankDoor = shopBuilding(group, colliders, { x: -40, z: 180, w: 18, h: 9, d: 12, color: 0x8fa8b8, sign: 'SUNSET BANK', signBg: '#14213d', label: 'Sunset Bank' });
  reg('atm', 'Sunset Bank ATM', 'atm', bankDoor.x, bankDoor.z, 5);

  const atm1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.8), new THREE.MeshStandardMaterial({ color: 0x2478f2, emissive: 0x2478f2, emissiveIntensity: 0.4 }));
  atm1.position.set(-1408, heightAt(-1408, 512) + 1, 512);
  group.add(atm1);
  addColliderBox(colliders, -1408, heightAt(-1408, 512), 512, 1.2, 2, 0.8);
  pois.push({ id: 'atm_market', name: 'ATM - Sunset Market', kind: 'atm', position: new THREE.Vector3(-1408, heightAt(-1408, 512), 512), radius: 3, district: districtAt(-1408, 512) });

  const gasY = heightAt(420, 120);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0xe97856, roughness: 0.6 }));
  canopy.position.set(420, gasY + 5, 120);
  group.add(canopy);
  const pumpMat = new THREE.MeshStandardMaterial({ color: 0xd8d3c8, roughness: 0.5 });
  for (const [px, pz] of [[416, 116], [424, 116], [416, 124], [424, 124]] as const) {
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.6), pumpMat);
    pump.position.set(px, gasY + 0.8, pz);
    group.add(pump);
    addColliderBox(colliders, px, gasY, pz, 0.8, 1.6, 0.6);
  }
  for (const [px, pz] of [[413, 114], [427, 114], [413, 126], [427, 126]] as const) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 8), pumpMat);
    pillar.position.set(px, gasY + 2.5, pz);
    group.add(pillar);
  }
  const gasSign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.4), new THREE.MeshBasicMaterial({ map: signTexture('SUNSET FUEL - $2/L', '#7a1f2b') }));
  gasSign.position.set(420, gasY + 6.2, 126);
  gasSign.rotation.y = Math.PI;
  group.add(gasSign);
  const gasZone = { minX: 410, maxX: 430, minZ: 110, maxZ: 130, center: new THREE.Vector3(420, gasY, 120), price: 2 };
  reg('gas', 'Sunset Fuel', 'gas', 420, 132, 7);

  const aptDoor = shopBuilding(group, colliders, { x: -760, z: 560, w: 20, h: 9, d: 14, color: 0xb08968, sign: 'APARTMENT 3B', signBg: '#2a2018', label: 'Alex Apartment' });
  reg('apartment', 'Apartment 3B', 'apartment', aptDoor.x, aptDoor.z, 6);
  const apartmentDoor = aptDoor;

  const cafeDoor = shopBuilding(group, colliders, { x: 150, z: -80, w: 12, h: 5, d: 10, color: 0x9a8f6a, sign: 'SOLACE CAFE', signBg: '#3d2a1a' });
  reg('cafe', 'Solace Cafe', 'cafe', cafeDoor.x, cafeDoor.z, 5);
  const pierCafeDoor = shopBuilding(group, colliders, { x: -1150, z: 1300, w: 12, h: 5, d: 10, color: 0x9fc6c9, sign: 'PIER CAFE', signBg: '#14454d' });
  reg('pier_cafe', 'Pier Cafe', 'cafe', pierCafeDoor.x, pierCafeDoor.z, 5);
  const hotelDoor = shopBuilding(group, colliders, { x: 1150, z: 400, w: 26, h: 30, d: 18, color: 0xd8c39b, sign: 'SOLACE BEACH HOTEL', signBg: '#14454d', doorSide: 'west' });
  reg('hotel', 'Solace Beach Hotel', 'hotel', hotelDoor.x, hotelDoor.z, 8);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(24, 120, 24), new THREE.MeshStandardMaterial({ color: 0x5f6b7a, roughness: 0.35, metalness: 0.5 }));
  tower.position.set(300, heightAt(300, -400) + 60, -400);
  tower.castShadow = true;
  group.add(tower);
  addColliderBox(colliders, 300, heightAt(300, -400), -400, 24, 120, 24);
  const towerSign = new THREE.Mesh(new THREE.PlaneGeometry(18, 4), new THREE.MeshBasicMaterial({ map: signTexture('MERIDIAN TOWER', '#10151C', '#F4B544') }));
  towerSign.position.set(300, heightAt(300, -400) + 100, -388);
  group.add(towerSign);
  reg('office', 'Meridian Tower', 'office', 300, -376, 8);

  const pierGroup = new THREE.Group();
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x6b4f2a, roughness: 0.9 });
  const deckLen = PIER_STRIP.maxZ - PIER_STRIP.minZ;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, deckLen), deckMat);
  deck.position.set(PIER_STRIP.x, 2.4, (PIER_STRIP.minZ + PIER_STRIP.maxZ) / 2);
  pierGroup.add(deck);
  for (let pz = PIER_STRIP.minZ + 4; pz < PIER_STRIP.maxZ; pz += 12) {
    for (const side of [-3.4, 3.4]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 5.2, 6), deckMat);
      pillar.position.set(PIER_STRIP.x + side, -0.2, pz);
      pierGroup.add(pillar);
    }
  }
  const pierSign = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: signTexture('PIER 17', '#14454d') }));
  pierSign.position.set(PIER_STRIP.x + 4.2, 5, PIER_STRIP.minZ + 2);
  pierSign.rotation.y = -Math.PI / 2;
  pierGroup.add(pierSign);
  group.add(pierGroup);
  reg('pier', 'Pier 17', 'pier', PIER_STRIP.x, PIER_STRIP.minZ + 4, 6);
  missionPoints.pier17 = new THREE.Vector3(PIER_STRIP.x, 2.4, PIER_STRIP.minZ + 8);

  const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(730, 0.5, 12), deckMat);
  bridgeDeck.position.set(-900, 3.0, 1430);
  group.add(bridgeDeck);
  for (let bx = -1255; bx <= -545; bx += 30) {
    for (const side of [-5.6, 5.6]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4.5, 6), deckMat);
      p.position.set(bx, 0.6, 1430 + side);
      group.add(p);
    }
  }

  const depotX = -700;
  const depotZ = 1150;
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x7d8894, roughness: 0.6, metalness: 0.5, transparent: true, opacity: 0.85 });
  const fenceH = 3;
  const fx0 = depotX - 40;
  const fx1 = depotX + 40;
  const fz0 = depotZ - 30;
  const fz1 = depotZ + 30;
  const gateZ = fz1;
  const fenceSegs: [number, number, number, number][] = [
    [fx1 - fx0, (fx0 + fx1) / 2, fz0, 0.4],
    [0.4, fx0, (fz0 + fz1) / 2, fz1 - fz0],
    [0.4, fx1, (fz0 + fz1) / 2, fz1 - fz0],
    [(fx1 - fx0 - 10) / 2, fx0 + (fx1 - fx0 - 10) / 4 + 0, gateZ, 0.4],
    [(fx1 - fx0 - 10) / 2, fx1 - (fx1 - fx0 - 10) / 4, gateZ, 0.4],
  ];
  for (const [w, x, z, d] of fenceSegs) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, fenceH, d), fenceMat);
    m.position.set(x, heightAt(x, z) + fenceH / 2, z);
    group.add(m);
    addColliderBox(colliders, x, heightAt(x, z), z, w, fenceH, d);
  }
  const wh = new THREE.Mesh(new THREE.BoxGeometry(22, 9, 14), new THREE.MeshStandardMaterial({ color: 0x5f6b74, roughness: 0.85 }));
  wh.position.set(depotX, heightAt(depotX, depotZ - 12) + 4.5, depotZ - 12);
  wh.castShadow = true;
  group.add(wh);
  addColliderBox(colliders, depotX, heightAt(depotX, depotZ - 12), depotZ - 12, 22, 9, 14);
  const depotSign = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.4), new THREE.MeshBasicMaterial({ map: signTexture('FREIGHT DEPOT', '#10151C') }));
  depotSign.position.set(depotX, heightAt(depotX, depotZ - 12) + 7, depotZ - 4.9);
  group.add(depotSign);
  reg('depot', 'Freight Depot', 'depot', depotX, gateZ + 4, 8);
  missionPoints.depot = new THREE.Vector3(depotX, heightAt(depotX, depotZ), depotZ);
  missionPoints.recon1 = new THREE.Vector3(depotX - 45, heightAt(depotX - 45, depotZ + 20), depotZ + 20);
  missionPoints.recon2 = new THREE.Vector3(depotX + 42, heightAt(depotX + 42, depotZ - 5), depotZ - 5);
  missionPoints.recon3 = new THREE.Vector3(depotX, heightAt(depotX, depotZ - 34), depotZ - 34);
  missionPoints.ambush = new THREE.Vector3(depotX, heightAt(depotX, gateZ + 6), gateZ + 6);
  missionPoints.rendezvous = new THREE.Vector3(-1000, heightAt(-1000, 1250), 1250);
  missionPoints.getawayCar = new THREE.Vector3(-1280, heightAt(-1280, 300), 300);

  parkedSpots.push({ modelId: 'vexler_gt', x: -1280, z: 300, yaw: Math.PI / 2 });

  const courtX = -560;
  const courtZ = 640;
  const court = new THREE.Mesh(new THREE.PlaneGeometry(15, 9), new THREE.MeshStandardMaterial({ color: 0xc96f3b, roughness: 0.8 }));
  court.rotation.x = -Math.PI / 2;
  court.position.set(courtX, heightAt(courtX, courtZ) + 0.07, courtZ);
  group.add(court);
  const hoopPos = new THREE.Vector3(courtX - 6.5, heightAt(courtX, courtZ), courtZ);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.9, 8), new THREE.MeshStandardMaterial({ color: 0x8a8f98 }));
  pole.position.set(hoopPos.x - 0.4, hoopPos.y + 1.95, hoopPos.z);
  group.add(pole);
  const backboard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.05, 1.8), new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.5 }));
  backboard.position.set(hoopPos.x, hoopPos.y + 3.45, hoopPos.z);
  group.add(backboard);
  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.035, 8, 20), new THREE.MeshStandardMaterial({ color: 0xe97856, metalness: 0.6 }));
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.set(hoopPos.x + 0.45, hoopPos.y + 3.05, hoopPos.z);
  group.add(ringMesh);
  reg('basketball', 'Northgate Court', 'basketball', courtX + 4, courtZ, 8);
  const courtHoop = { pos: new THREE.Vector3(hoopPos.x + 0.45, hoopPos.y + 3.05, hoopPos.z), ringRadius: 0.23 };

  const raceSpots: Record<string, { x: number; z: number; name: string }> = {
    coastal_sprint: { x: 1200, z: -200, name: 'Coastal Sprint' },
    downtown_circuit: { x: 200, z: 60, name: 'Downtown Circuit' },
    ridge_run: { x: -1400, z: -1200, name: 'Ridge Run' },
  };
  for (const [id, s] of Object.entries(raceSpots)) {
    const flag = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 6), new THREE.MeshStandardMaterial({ color: 0xf1f3f5 }));
    flag.position.set(s.x, heightAt(s.x, s.z) + 2.5, s.z);
    group.add(flag);
    const flagCloth = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshBasicMaterial({ color: 0xf4b544, side: THREE.DoubleSide }));
    flagCloth.position.set(s.x + 0.85, heightAt(s.x, s.z) + 4.6, s.z);
    group.add(flagCloth);
    reg(id, `Race: ${s.name}`, 'race', s.x, s.z + 3, 7);
  }

  reg('delivery_cafe', 'Downtown Express (Solace Cafe)', 'delivery', 150, -66, 6);
  reg('delivery_pier', 'Beach Delivery (Pier Cafe)', 'delivery', -1150, 1314, 6);
  reg('delivery_market', 'Westhaven Supplies (Market)', 'delivery', -1420, 534, 6);
  reg('taxi', 'Taxi Stand', 'taxi', 0, -86, 6);
  reg('residence', 'Westhaven Residence', 'delivery', -1500, 714, 6);
  reg('bar_poi', 'The Rusty Anchor Bar', 'bar', bar.door.x, bar.door.z, 6);

  missionPoints.office = new THREE.Vector3(300, heightAt(300, -400), -372);
  missionPoints.hotel = new THREE.Vector3(1150, heightAt(1150, 400), 409);
  missionPoints.residence = new THREE.Vector3(-1500, heightAt(-1500, 700), 714);
  missionPoints.deliveryGarage = new THREE.Vector3(-1240, heightAt(-1240, 360), 384);

  return {
    group,
    pois,
    reserved,
    casino,
    bar,
    labels,
    parkedSpots,
    missionPoints,
    garageZone,
    courtHoop,
    gasZone,
    apartmentDoor,
  };
}
