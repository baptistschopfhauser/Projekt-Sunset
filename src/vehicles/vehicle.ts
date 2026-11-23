import * as THREE from 'three';
import type { VehicleDef } from '../core/config.ts';
import { clamp, lerp } from '../core/math.ts';
import { heightAt, isWater, surfaceAt } from '../world/terrain.ts';
import type { AABBCollider } from '../core/types.ts';
import { EventBus } from '../core/events.ts';

let nextUid = 1;

export interface VehicleInput {
  throttle: number;
  brake: number;
  steer: number;
  handbrake: boolean;
}

export class Vehicle {
  uid = nextUid++;
  def: VehicleDef;
  color: number;
  pos = new THREE.Vector3();
  yaw = 0;
  vel = new THREE.Vector3();
  steerAngle = 0;
  damage = 1000;
  fuel: number;
  destroyed = false;
  mesh: THREE.Group;
  wheels: THREE.Mesh[] = [];
  brakeMat: THREE.MeshStandardMaterial;
  headMat: THREE.MeshStandardMaterial;
  reverseMat: THREE.MeshStandardMaterial;
  lightBar: THREE.Mesh | null = null;
  lightBarMat: THREE.MeshStandardMaterial | null = null;
  spot: THREE.SpotLight | null = null;
  isPolice = false;
  owned = false;
  plate = '';
  upgrades: string[] = [];
  private wheelSpin = 0;
  private smokeTime = 0;
  events: EventBus;
  radius: number;
  inGarage = false;
  lastDriverPlayer = false;

  constructor(def: VehicleDef, color: number, events: EventBus, scene: THREE.Scene) {
    this.def = def;
    this.color = color;
    this.fuel = def.tankLiters;
    this.events = events;
    this.isPolice = def.cls === 'police' || def.cls === 'police_sport';
    this.radius = Math.max(def.length, def.width) * 0.5;
    this.mesh = buildVehicleMesh(def, color, this.isPolice);
    this.brakeMat = (this.mesh.userData.brakeMat as THREE.MeshStandardMaterial) ?? new THREE.MeshStandardMaterial();
    this.headMat = (this.mesh.userData.headMat as THREE.MeshStandardMaterial) ?? new THREE.MeshStandardMaterial();
    this.reverseMat = (this.mesh.userData.reverseMat as THREE.MeshStandardMaterial) ?? new THREE.MeshStandardMaterial();
    this.lightBar = (this.mesh.userData.lightBar as THREE.Mesh) ?? null;
    this.lightBarMat = (this.mesh.userData.lightBarMat as THREE.MeshStandardMaterial) ?? null;
    this.wheels = this.mesh.userData.wheels as THREE.Mesh[];
    scene.add(this.mesh);
  }

  get speedKmh(): number {
    return Math.hypot(this.vel.x, this.vel.z) * 3.6;
  }

  get speed(): number {
    return Math.hypot(this.vel.x, this.vel.z);
  }

  get enginePower(): number {
    const dmgFactor = clamp(this.damage / 550, 0.25, 1);
    let accelBonus = 0;
    if (this.upgrades.includes('engine1')) accelBonus += 0.07;
    if (this.upgrades.includes('engine2')) accelBonus += 0.08;
    return (1 / this.def.accel0to100) * 100 * dmgFactor * (1 + accelBonus);
  }

  get topSpeed(): number {
    return (this.def.topSpeedKmh / 3.6) * clamp(this.damage / 700, 0.55, 1);
  }

  heading(): THREE.Vector3 {
    return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  setPosition(x: number, z: number, yaw: number): void {
    this.pos.set(x, heightAt(x, z) + this.def.groundClearance, z);
    this.yaw = yaw;
    this.vel.set(0, 0, 0);
    this.syncMesh(0);
  }

  applyDamage(amount: number): void {
    if (this.destroyed) return;
    this.damage = clamp(this.damage - amount, 0, 1000);
    this.events.emit('VEHICLE_DAMAGED', { vehicleId: this.uid, amount, position: { x: this.pos.x, y: this.pos.y, z: this.pos.z } });
    if (this.damage <= 0) {
      this.destroyed = true;
      this.events.emit('VEHICLE_DESTROYED', { vehicleId: this.uid, position: { x: this.pos.x, y: this.pos.y, z: this.pos.z } });
    }
  }

  update(dt: number, input: VehicleInput | null, colliders: AABBCollider[], others: Vehicle[], tractionMul: number, weatherWet: number): { collided: boolean; impact: number } {
    if (this.destroyed) {
      this.syncMesh(dt);
      return { collided: false, impact: 0 };
    }
    const surf = surfaceAt(this.pos.x, this.pos.z);
    let grip = 1.0;
    if (surf === 'gravel') grip = 0.62;
    else if (surf === 'mud') grip = 0.42;
    else if (surf === 'sand') grip = 0.7;
    if (this.upgrades.includes('sport_tires')) grip += 0.08;
    if (this.upgrades.includes('offroad_tires') && (surf === 'gravel' || surf === 'mud' || surf === 'sand')) grip += 0.25;
    grip *= tractionMul * (1 - weatherWet * 0.25);

    let throttle = 0;
    let brake = 0;
    let steer = 0;
    let handbrake = false;
    if (input) {
      throttle = input.throttle;
      brake = input.brake;
      steer = input.steer;
      handbrake = input.handbrake;
    }

    const fwd = this.heading();
    const fwdSpeed = this.vel.dot(fwd);
    const canDrive = this.fuel > 0 && this.damage > 100;

    if (canDrive && throttle > 0 && fwdSpeed < this.topSpeed) {
      const power = this.enginePower * (1 - clamp(fwdSpeed / this.topSpeed, 0, 1) * 0.85) * throttle;
      this.vel.addScaledVector(fwd, power * dt * 3.2);
      this.fuel = Math.max(0, this.fuel - dt * 0.012 * this.def.tankLiters * throttle * (0.5 + clamp(fwdSpeed / this.topSpeed, 0, 1)));
    }
    if (canDrive && throttle < 0 && fwdSpeed > -8) {
      this.vel.addScaledVector(fwd, throttle * 14 * dt);
      this.fuel = Math.max(0, this.fuel - dt * 0.006 * this.def.tankLiters);
    }
    if (brake > 0) {
      let brakeForce = 22;
      if (this.upgrades.includes('brakes')) brakeForce *= 1.12;
      const decel = Math.min(Math.abs(fwdSpeed), brakeForce * brake * dt);
      if (fwdSpeed > 0) this.vel.addScaledVector(fwd, -decel);
      else this.vel.addScaledVector(fwd, decel);
    }
    const drag = 0.35 + (fwdSpeed * fwdSpeed) / (this.topSpeed * this.topSpeed * 30);
    this.vel.multiplyScalar(Math.max(0, 1 - drag * dt));

    const maxSteer = lerp(0.62, 0.12, clamp(Math.abs(fwdSpeed) / 45, 0, 1));
    const steerSpeed = handbrake ? 6 : 4.2;
    this.steerAngle = lerp(this.steerAngle, steer * maxSteer, clamp(steerSpeed * dt, 0, 1));

    const turn = this.steerAngle * clamp(Math.abs(fwdSpeed) / 6, 0, 1) * Math.sign(fwdSpeed || 1) * dt * (handbrake ? 1.9 : 1.15) * clamp(fwdSpeed / 4 + 0.3, 0, 1.4);
    this.yaw += turn;

    const newFwd = this.heading();
    const newFwdSpeed = this.vel.dot(newFwd);
    const lateral = this.vel.clone().addScaledVector(newFwd, -newFwdSpeed);
    const gripFactor = handbrake ? 0.25 : clamp(grip, 0.2, 1.15);
    this.vel.addScaledVector(newFwd, newFwdSpeed).addScaledVector(lateral, -clamp(gripFactor * 6 * dt, 0, 1));
    const sp = this.vel.length();
    if (sp > this.topSpeed) this.vel.multiplyScalar(this.topSpeed / sp);

    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;

    let collided = false;
    let impact = 0;
    for (const c of colliders) {
      const hw = this.def.width / 2 + 0.2;
      const hl = this.def.length / 2;
      const cos = Math.cos(this.yaw);
      const sin = Math.sin(this.yaw);
      const lx = this.pos.x - c.min.x;
      const lz = this.pos.z - c.min.z;
      const rx = cos * lx + sin * lz;
      const rz = -sin * lx + cos * lz;
      const cx = clamp(rx, -hw, hw);
      const cz = clamp(rz, -hl, hl);
      let dx = rx - cx;
      let dz = rz - cz;
      const d2 = dx * dx + dz * dz;
      const inY = this.pos.y < c.max.y - 0.3 && this.pos.y + this.def.height > c.min.y + 0.2;
      if (d2 > 0.01 && inY) {
        const d = Math.sqrt(d2);
        if (d < 0.6) {
          const wx = this.pos.x + (cos * cx - sin * cz);
          const wz = this.pos.z + (sin * cx + cos * cz);
          const push = 0.6 - d;
          const nx = dx / d;
          const nz = dz / d;
          const worldPushX = cos * nx - sin * nz;
          const worldPushZ = sin * nx + cos * nz;
          this.pos.x += worldPushX * push;
          this.pos.z += worldPushZ * push;
          const vn = this.vel.x * worldPushX + this.vel.z * worldPushZ;
          if (vn < 0) {
            impact = Math.max(impact, -vn);
            this.vel.x -= worldPushX * vn * 1.6;
            this.vel.z -= worldPushZ * vn * 1.6;
            if (-vn > 4) {
              this.applyDamage((-vn - 3) * 9 * (this.def.massKg / 1500));
              collided = true;
            }
          }
        }
      }
    }

    for (const o of others) {
      if (o === this || o.destroyed || o.inGarage) continue;
      const dx = this.pos.x - o.pos.x;
      const dz = this.pos.z - o.pos.z;
      const rr = this.radius + o.radius - 0.5;
      const d2 = dx * dx + dz * dz;
      if (d2 > rr * rr || d2 < 1e-6) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const nz = dz / d;
      const overlap = rr - d;
      this.pos.x += nx * overlap * 0.5;
      this.pos.z += nz * overlap * 0.5;
      const relVn = (this.vel.x - o.vel.x) * nx + (this.vel.z - o.vel.z) * nz;
      if (relVn < 0) {
        impact = Math.max(impact, -relVn);
        const massRatio = o.def.massKg / (this.def.massKg + o.def.massKg);
        this.vel.x -= nx * relVn * 1.4 * (1 - massRatio);
        this.vel.z -= nz * relVn * 1.4 * (1 - massRatio);
        if (-relVn > 5) {
          this.applyDamage((-relVn - 4) * 7 * (o.def.massKg / 1600));
          o.applyDamage((-relVn - 4) * 7 * (this.def.massKg / 1600));
          collided = true;
        }
      }
    }

    if (isWater(this.pos.x, this.pos.z) && heightAt(this.pos.x, this.pos.z) < -1.2) {
      this.pos.x -= this.vel.x * dt;
      this.pos.z -= this.vel.z * dt;
      this.vel.multiplyScalar(0.2);
    }

    const gy = heightAt(this.pos.x, this.pos.z);
    this.pos.y = lerp(this.pos.y, gy + this.def.groundClearance, clamp(dt * 10, 0, 1));
    if (Math.abs(this.vel.y) > 0) this.vel.y = 0;

    this.wheelSpin += (this.vel.length() / 1.2) * dt * 3;
    this.syncMesh(dt);
    this.smokeTime += dt;
    return { collided, impact };
  }

  syncMesh(dt: number): void {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(0, this.yaw, 0);
    const fwdSpeed = this.vel.dot(this.heading());
    const body = this.mesh.children[0] as THREE.Mesh;
    if (body) {
      body.rotation.x = clamp(-fwdSpeed * 0.004, -0.05, 0.06);
      body.rotation.z = clamp(-this.steerAngle * clamp(Math.abs(fwdSpeed) / 20, 0, 1) * 0.5, -0.06, 0.06);
    }
    for (const w of this.wheels) w.rotation.x += this.wheelSpin * dt * 10;
    const braking = this.brakeMat;
    if (braking) braking.emissiveIntensity = this.vel.length() > 0.5 && this.def ? 1.6 : 0;
    void dt;
  }

  setLights(on: boolean, night: boolean): void {
    this.headMat.emissiveIntensity = on ? 3 : 0;
    this.reverseMat.emissiveIntensity = on ? 0.8 : 0;
    if (this.spot) this.spot.visible = on && night;
  }

  updatePoliceLights(time: number): void {
    if (!this.lightBarMat) return;
    const phase = Math.floor(time * 6) % 2;
    this.lightBarMat.emissive.setHex(phase === 0 ? 0x2478f2 : 0xeb3f47);
    this.lightBarMat.emissiveIntensity = 3;
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }
}

export function buildVehicleMesh(def: VehicleDef, color: number, police: boolean): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.55 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x18222e, roughness: 0.15, metalness: 0.8 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x14171a, roughness: 0.9 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2c0, emissiveIntensity: 0 });
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0x881111, emissive: 0xeb3f47, emissiveIntensity: 0 });
  const reverseMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0xffffff, emissiveIntensity: 0 });

  const L = def.length;
  const W = def.width;
  const H = def.height;
  const gc = def.groundClearance;

  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H * 0.55, L), bodyMat);
  body.position.y = gc + H * 0.32;
  body.castShadow = true;
  g.add(body);

  const isBike = def.cls === 'motorcycle';
  const isTruck = def.cls === 'truck';
  const isPickup = def.cls === 'pickup';
  const isVan = def.cls === 'van' || def.cls === 'delivery';

  let cabinH = H * 0.45;
  let cabinY = gc + H * 0.55 + cabinH / 2 - 0.04;
  let cabinL = L * 0.45;
  let cabinZ = -L * 0.05;
  if (isBike) {
    cabinH = 0.3;
    cabinY = gc + 0.55;
    cabinL = 0.5;
    cabinZ = -0.2;
  } else if (isTruck) {
    cabinL = L * 0.16;
    cabinZ = L * 0.36;
    cabinH = H * 0.5;
    cabinY = gc + H * 0.5;
  } else if (isVan || isPickup) {
    cabinL = L * 0.3;
    cabinZ = L * 0.28;
  } else if (def.cls === 'sport' || def.cls === 'super') {
    cabinH = H * 0.32;
    cabinL = L * 0.4;
    cabinY = gc + H * 0.5 + cabinH / 2 - 0.02;
  }
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(isBike ? W * 0.5 : W * 0.86, cabinH, cabinL), glassMat);
  cabin.position.set(0, cabinY, cabinZ);
  cabin.castShadow = true;
  g.add(cabin);
  if (!isBike && !isTruck) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(W * 0.84, 0.06, cabinL * 0.9), bodyMat);
    roof.position.set(0, cabinY + cabinH / 2 + 0.02, cabinZ);
    g.add(roof);
  }
  if (isTruck) {
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(W, H * 0.78, L * 0.72), bodyMat);
    trailer.position.set(0, gc + H * 0.45, -L * 0.28);
    trailer.castShadow = true;
    g.add(trailer);
  }
  if (isPickup) {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, 0.25, L * 0.32), darkMat);
    bed.position.set(0, gc + H * 0.28, -L * 0.32);
    g.add(bed);
  }
  if (isVan) {
    const boxTop = new THREE.Mesh(new THREE.BoxGeometry(W, H * 0.85, L * 0.6), bodyMat);
    boxTop.position.set(0, gc + H * 0.5, -L * 0.18);
    boxTop.castShadow = true;
    g.add(boxTop);
  }

  const wheelGeo = new THREE.CylinderGeometry(isBike ? 0.32 : 0.34, isBike ? 0.32 : 0.34, isBike ? 0.2 : W * 0.16, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.8, roughness: 0.3 });
  const wheels: THREE.Mesh[] = [];
  const wheelPos: [number, number][] = isBike
    ? [[0, L * 0.32], [0, -L * 0.32]]
    : [
        [-W / 2 + 0.05, L * 0.32],
        [W / 2 - 0.05, L * 0.32],
        [-W / 2 + 0.05, -L * 0.32],
        [W / 2 - 0.05, -L * 0.32],
      ];
  for (const [wx, wz] of wheelPos) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(wx, gc + 0.34, wz);
    w.castShadow = true;
    g.add(w);
    wheels.push(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, W * 0.17, 8), hubMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.copy(w.position);
    g.add(hub);
  }

  const headL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.06), headMat);
  headL.position.set(-W * 0.3, gc + H * 0.32, L / 2 + 0.01);
  const headR = headL.clone();
  headR.position.x = W * 0.3;
  const brakeL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), brakeMat);
  brakeL.position.set(-W * 0.3, gc + H * 0.34, -L / 2 - 0.01);
  const brakeR = brakeL.clone();
  brakeR.position.x = W * 0.3;
  const revL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.05), reverseMat);
  revL.position.set(-W * 0.12, gc + H * 0.3, -L / 2 - 0.01);
  const revR = revL.clone();
  revR.position.x = W * 0.12;
  g.add(headL, headR, brakeL, brakeR, revL, revR);

  const grill = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, 0.1, 0.05), darkMat);
  grill.position.set(0, gc + H * 0.22, L / 2 + 0.01);
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.12, 0.12), darkMat);
  bumperF.position.set(0, gc + 0.12, L / 2 + 0.05);
  const bumperB = bumperF.clone();
  bumperB.position.z = -L / 2 - 0.05;
  g.add(grill, bumperF, bumperB);

  if (police) {
    const barMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x2478f2, emissiveIntensity: 3 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, 0.14, 0.3), barMat);
    bar.position.set(0, gc + H * 0.55 + cabinH + 0.1, cabinZ);
    g.add(bar);
    g.userData.lightBar = bar;
    g.userData.lightBarMat = barMat;
    const signTex = policeSign();
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(0, gc + H * 0.55 + cabinH + 0.22, cabinZ);
    g.add(sign);
  }

  g.userData.wheels = wheels;
  g.userData.brakeMat = brakeMat;
  g.userData.headMat = headMat;
  g.userData.reverseMat = reverseMat;
  return g;
}

function policeSign(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#14181f';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#f1f3f5';
  ctx.font = 'bold 34px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SOLACE PD', 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function attachPlayerSpot(v: Vehicle): void {
  const spot = new THREE.SpotLight(0xfff2c8, 0, 90, 0.5, 0.5, 1.6);
  spot.position.set(0, v.def.height * 0.7, v.def.length / 2);
  spot.target.position.set(0, 0, v.def.length * 4);
  v.mesh.add(spot);
  v.mesh.add(spot.target);
  v.spot = spot;
}
