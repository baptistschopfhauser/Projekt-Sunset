import * as THREE from 'three';
import { WEAPONS, type WeaponDef, WANTED } from '../core/config.ts';
import { clamp, rayAABB, raySphere, lerp } from '../core/math.ts';
import type { EventBus } from '../core/events.ts';
import type { AABBCollider } from '../core/types.ts';
import type { Player } from '../player/player.ts';
import type { PedestrianManager, Pedestrian } from '../pedestrians/pedestrianManager.ts';
import type { Vehicle } from '../vehicles/vehicle.ts';
import type { CameraRig } from '../player/camera.ts';
import type { Input } from '../player/input.ts';

export interface WeaponState {
  def: WeaponDef;
  mag: number;
  reserve: number;
}

export class CombatSystem {
  weapons = new Map<string, WeaponState>();
  order: string[] = ['meridian_p9'];
  current: string = 'meridian_p9';
  cooldown = 0;
  reloadTimer = 0;
  bloom = 0;
  recoilPitch = 0;
  recoilYaw = 0;
  events: EventBus;
  private lastPublicShot = -10;
  private flashLights: THREE.PointLight[] = [];
  private flashSprites: THREE.Sprite[] = [];
  private tracers: { line: THREE.Line; life: number }[] = [];
  private impacts: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];
  private flashIdx = 0;
  gunMesh: THREE.Group | null = null;
  private time = 0;

  constructor(scene: THREE.Scene, events: EventBus) {
    this.events = events;
    for (let i = 0; i < 4; i++) {
      const l = new THREE.PointLight(0xffd9a0, 0, 18, 2);
      scene.add(l);
      this.flashLights.push(l);
      const cnv = document.createElement('canvas');
      cnv.width = 64;
      cnv.height = 64;
      const ctx = cnv.getContext('2d')!;
      const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,240,200,1)');
      g.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cnv), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      spr.scale.set(0.7, 0.7, 1);
      scene.add(spr);
      this.flashSprites.push(spr);
    }
    const tracerMat = new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 16; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(geo, tracerMat.clone());
      line.visible = false;
      line.frustumCulled = false;
      scene.add(line);
      this.tracers.push({ line, life: 0 });
    }
    const impactGeo = new THREE.TetrahedronGeometry(0.06);
    for (let i = 0; i < 40; i++) {
      const m = new THREE.Mesh(impactGeo, new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true }));
      m.visible = false;
      scene.add(m);
      this.impacts.push({ mesh: m, vel: new THREE.Vector3(), life: 0 });
    }
  }

  addWeapon(id: string, mag: number, reserve: number): void {
    const def = WEAPONS[id];
    this.weapons.set(id, { def, mag, reserve });
    if (!this.order.includes(id)) this.order.push(id);
    if (!this.current) this.current = id;
  }

  get currentState(): WeaponState | null {
    return this.weapons.get(this.current) ?? null;
  }

  select(id: string): void {
    if (this.weapons.has(id)) this.current = id;
  }

  switchSlot(i: number): void {
    if (this.order[i]) this.current = this.order[i];
  }

  equipGun(player: Player): void {
    if (this.gunMesh) {
      player.parts.handR.add(this.gunMesh);
      return;
    }
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.34), new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.4, metalness: 0.7 }));
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.06), new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.8 }));
    grip.position.set(0, -0.09, 0.1);
    g.add(body, grip);
    this.gunMesh = g;
    player.parts.handR.add(g);
  }

  startReload(): void {
    const s = this.currentState;
    if (!s || this.reloadTimer > 0) return;
    if (s.mag >= s.def.magSize || s.reserve <= 0) return;
    this.reloadTimer = s.def.reloadTime;
  }

  tryFire(camera: THREE.Camera, player: Player): void {
    const s = this.currentState;
    if (!s || this.reloadTimer > 0 || this.cooldown > 0) return;
    if (s.mag <= 0) {
      this.cooldown = 0.25;
      return;
    }
    this.cooldown = 1 / s.def.shotsPerSec;
    s.mag--;
    const aiming = player.state === 'aim';
    const spread = s.def.spreadBase * (aiming ? 0.45 : 1) * (1 + this.bloom) * (player.speed > 4 ? 2.2 : 1);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.x += (Math.random() - 0.5) * spread * 2;
    dir.y += (Math.random() - 0.5) * spread * 2;
    dir.z += (Math.random() - 0.5) * spread * 2;
    dir.normalize();
    const origin = camera.position.clone();

    const muzzle = new THREE.Vector3();
    if (this.gunMesh) this.gunMesh.getWorldPosition(muzzle);
    else muzzle.copy(player.headPos());
    muzzle.addScaledVector(dir, 0.5);

    let maxDist = s.def.range;
    let blockT = Infinity;
    for (const c of this.blockers) {
      const t = rayAABB(origin, dir, c.min, c.max, maxDist);
      if (t !== null && t < blockT) blockT = t;
    }
    if (blockT !== Infinity) maxDist = blockT;

    let segBlocked = false;
    let segT = Infinity;
    for (const c of this.blockers) {
      const t = rayAABB(muzzle, dir, c.min, c.max, maxDist);
      if (t !== null && t < segT) {
        segT = t;
        segBlocked = true;
      }
    }

    let hitPoint = origin.clone().addScaledVector(dir, maxDist);
    let hitKind = 'world';
    let hitRef: unknown = null;
    let hitDist = maxDist;

    if (segBlocked) {
      hitPoint = muzzle.clone().addScaledVector(dir, segT);
      hitKind = 'building';
      hitDist = segT;
    } else {
      const ped = this.pedManager?.nearestPedAlongRay?.(origin, dir, maxDist);
      if (ped) {
        hitPoint = origin.clone().addScaledVector(dir, ped.t);
        hitKind = 'ped';
        hitRef = ped.ped;
        hitDist = ped.t;
      }
      for (const v of this.vehicles ?? []) {
        if (v.destroyed) continue;
        const t = raySphere(origin, dir, v.pos.clone().setY(v.pos.y + v.def.height * 0.5), v.radius, maxDist);
        if (t !== null && t < hitDist) {
          hitDist = t;
          hitPoint = origin.clone().addScaledVector(dir, t);
          hitKind = 'vehicle';
          hitRef = v;
        }
      }
    }

    for (let p = 0; p < s.def.pellets; p++) {
      const pdir = dir.clone();
      pdir.x += (Math.random() - 0.5) * spread * 1.6;
      pdir.y += (Math.random() - 0.5) * spread * 1.6;
      pdir.z += (Math.random() - 0.5) * spread * 1.6;
      pdir.normalize();
      this.spawnTracer(muzzle, pdir, hitDist * (0.9 + Math.random() * 0.1));
    }

    this.spawnFlash(muzzle, dir);
    this.spawnImpact(hitPoint, hitKind);

    this.events.emit('WEAPON_FIRED', { weapon: s.def.id, position: { x: muzzle.x, y: muzzle.y, z: muzzle.z } });

    if (hitKind === 'ped' && hitRef) {
      const ped = hitRef as Pedestrian;
      const headshot = hitPoint.y > ped.pos.y + 1.45;
      const dmg = s.def.baseDamage * (headshot ? 1.75 : hitPoint.y > ped.pos.y + 0.9 ? 1.0 : 0.85) * s.def.pellets;
      this.pedManager?.damagePed(ped, dmg, 'shot');
      if (ped.isOfficer) this.events.emit('CRIME_COMMITTED', { type: 'assault_officer', severity: WANTED.crimes.assault_officer, position: { x: ped.pos.x, y: ped.pos.y, z: ped.pos.z } });
      else this.events.emit('CRIME_COMMITTED', { type: 'assault_civilian', severity: WANTED.crimes.assault_civilian, position: { x: ped.pos.x, y: ped.pos.y, z: ped.pos.z } });
    } else if (hitKind === 'vehicle' && hitRef) {
      const v = hitRef as Vehicle;
      v.applyDamage(s.def.baseDamage * 0.6 * s.def.pellets);
      if (v.isPolice) this.events.emit('CRIME_COMMITTED', { type: 'police_vehicle_hit', severity: WANTED.crimes.police_vehicle_hit, position: { x: v.pos.x, y: v.pos.y, z: v.pos.z } });
    }

    this.bloom = clamp(this.bloom + 0.25, 0, 1.6);
    this.recoilPitch += s.def.recoil * (aiming ? 0.6 : 1);
    this.recoilYaw += (Math.random() - 0.5) * s.def.recoil * 0.4;

    if (this.time - this.lastPublicShot > 2) {
      this.lastPublicShot = this.time;
      this.events.emit('CRIME_COMMITTED', { type: 'public_shot', severity: WANTED.crimes.public_shot, position: { x: player.pos.x, y: player.pos.y, z: player.pos.z } });
    }
  }

  blockers: AABBCollider[] = [];
  pedManager: PedestrianManager | null = null;
  vehicles: Vehicle[] | null = null;

  update(dt: number, input: Input, camera: THREE.Camera, player: Player): void {
    this.time += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.bloom = Math.max(0, this.bloom - dt * 1.8);
    this.recoilPitch = lerp(this.recoilPitch, 0, clamp(dt * 9, 0, 1));
    this.recoilYaw = lerp(this.recoilYaw, 0, clamp(dt * 9, 0, 1));
    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const s = this.currentState;
        if (s) {
          const need = s.def.magSize - s.mag;
          const take = Math.min(need, s.reserve);
          s.mag += take;
          s.reserve -= take;
        }
      }
    }
    const s = this.currentState;
    if (s && input) {
      const wantFire = s.def.auto ? input.mouseDown('l') : input.wasClicked('l');
      if (wantFire && player.inVehicleId === null && !player.dead) {
        this.tryFire(camera, player);
      }
      if (input.wasPressed('KeyR')) this.startReload();
      for (let i = 1; i <= 5; i++) if (input.wasPressed(`Digit${i}`)) this.switchSlot(i - 1);
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      if (t.life > 0) {
        t.life -= dt;
        (t.line.material as THREE.LineBasicMaterial).opacity = Math.max(0, t.life * 12);
        if (t.life <= 0) t.line.visible = false;
      }
    }
    for (const im of this.impacts) {
      if (im.life > 0) {
        im.life -= dt;
        im.vel.y -= 9 * dt;
        im.mesh.position.addScaledVector(im.vel, dt);
        (im.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, im.life * 2);
        if (im.life <= 0) im.mesh.visible = false;
      }
    }
    for (const l of this.flashLights) l.intensity = Math.max(0, l.intensity - dt * 400);
    for (const s of this.flashSprites) {
      if (s.visible) {
        s.material.opacity = Math.max(0, s.material.opacity - dt * 14);
        if (s.material.opacity <= 0) s.visible = false;
      }
    }
  }

  private spawnFlash(pos: THREE.Vector3, dir: THREE.Vector3): void {
    const l = this.flashLights[this.flashIdx % this.flashLights.length];
    l.position.copy(pos).addScaledVector(dir, 0.4);
    l.intensity = 60;
    const s = this.flashSprites[this.flashIdx % this.flashSprites.length];
    s.position.copy(l.position);
    s.material.opacity = 1;
    s.visible = true;
    this.flashIdx++;
  }

  private spawnTracer(from: THREE.Vector3, dir: THREE.Vector3, dist: number): void {
    const t = this.tracers.find((x) => x.life <= 0) ?? this.tracers[0];
    const pos = t.line.geometry.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(0, from.x, from.y, from.z);
    pos.setXYZ(1, from.x + dir.x * dist, from.y + dir.y * dist, from.z + dir.z * dist);
    pos.needsUpdate = true;
    t.line.visible = true;
    t.life = 0.08;
  }

  private spawnImpact(point: THREE.Vector3, kind: string): void {
    const colors: Record<string, number> = { world: 0xb8b2a8, building: 0x9a958c, vehicle: 0xffd080, ped: 0x8a2020 };
    for (let i = 0; i < 4; i++) {
      const im = this.impacts.find((x) => x.life <= 0);
      if (!im) return;
      im.mesh.visible = true;
      im.mesh.position.copy(point);
      im.vel.set((Math.random() - 0.5) * 3, Math.random() * 2.5, (Math.random() - 0.5) * 3);
      im.life = 0.5;
      (im.mesh.material as THREE.MeshBasicMaterial).color.setHex(colors[kind] ?? 0xcccccc);
      (im.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
    }
  }

  serialize(): { id: string; mag: number; reserve: number }[] {
    return this.order.map((id) => {
      const w = this.weapons.get(id)!;
      return { id, mag: w.mag, reserve: w.reserve };
    });
  }
}
