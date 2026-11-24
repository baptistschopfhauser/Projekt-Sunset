import * as THREE from 'three';
import { RNG } from '../core/rng.ts';
import { clamp, losBlocked, rayCapsule } from '../core/math.ts';
import { heightAt, isWater } from '../world/terrain.ts';
import type { RoadGraph } from '../world/roads.ts';
import type { World } from '../world/city.ts';
import type { EventBus } from '../core/events.ts';
import type { AABBCollider } from '../core/types.ts';
import { buildCharacter, animateCharacter, type CharacterParts, type CharacterStyle } from '../player/character.ts';

export type PedState = 'walk' | 'idle' | 'flee' | 'call' | 'dead' | 'cower';

let nextPedId = 1;

const SKINS = [0xc9a184, 0x8d5a3b, 0x6b4226, 0xe8b88a, 0xf0c8a0, 0x5a3a22];
const SHIRTS = [0xf1f3f5, 0x2e3440, 0xb0483c, 0x3c6ea5, 0x4c8a4f, 0xc9a13b, 0xd8c39b, 0x7a5aa0, 0x147c86, 0xe97856];
const PANTS = [0x2b3a55, 0x37474f, 0x1c1c1c, 0x6b4f2a, 0x4a5d43, 0x8a8f98];
const HAIRS = [0x2a2018, 0x4a3220, 0x111111, 0x8a6a3a, 0x777777, 0x3a2a1a];

export class Pedestrian {
  id = nextPedId++;
  pos = new THREE.Vector3();
  yaw = 0;
  speed = 0;
  state: PedState = 'walk';
  health = 100;
  parts: CharacterParts;
  group: THREE.Group;
  route: number[] = [];
  segIdx = 0;
  t = Math.random();
  side: 1 | -1 = 1;
  fleeFrom = new THREE.Vector3();
  fleeTime = 0;
  callTimer = -1;
  reportCrime: string | null = null;
  reportPos = new THREE.Vector3();
  witnessCooldown = 0;
  dead = false;
  animT = Math.random() * 10;
  targetSpeed = 1.4;
  isOfficer = false;
  isGuard = false;

  constructor(scene: THREE.Scene, style: CharacterStyle) {
    this.parts = buildCharacter(style);
    this.group = this.parts.group;
    scene.add(this.group);
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.group);
  }
}

export class PedestrianManager {
  peds: Pedestrian[] = [];
  graph: RoadGraph;
  world: World;
  events: EventBus;
  scene: THREE.Scene;
  rng = new RNG(4242);
  maxPeds = 30;
  spawnFactor = 1;
  private unsub: (() => void)[] = [];

  constructor(scene: THREE.Scene, graph: RoadGraph, world: World, events: EventBus) {
    this.scene = scene;
    this.graph = graph;
    this.world = world;
    this.events = events;
    this.unsub.push(
      events.on('WEAPON_FIRED', (p) => this.onNoise(p.position.x, p.position.y, p.position.z, 60)),
      events.on('VEHICLE_DAMAGED', (p) => this.onNoise(p.position.x, p.position.y, p.position.z, 45)),
      events.on('CRIME_COMMITTED', (p) => this.onCrimeSeen(p.type, p.position.x, p.position.y, p.position.z, p.severity)),
      events.on('PED_KILLED', () => {})
    );
  }

  private onNoise(x: number, y: number, z: number, radius: number): void {
    for (const p of this.peds) {
      if (p.dead) continue;
      const d = Math.hypot(p.pos.x - x, p.pos.z - z);
      if (d > radius) continue;
      if (d < radius * 0.7 && !losBlocked(p.pos.x, p.pos.y + 1.2, p.pos.z, x, y, z, this.world.losColliders)) {
        if (p.state !== 'flee') {
          p.state = 'flee';
          p.fleeFrom.set(x, 0, z);
          p.fleeTime = this.rng.range(4, 9);
        }
      }
    }
  }

  private onCrimeSeen(type: string, x: number, y: number, z: number, severity: number): void {
    for (const p of this.peds) {
      if (p.dead || p.witnessCooldown > 0) continue;
      const d = Math.hypot(p.pos.x - x, p.pos.z - z);
      if (d > 55) continue;
      if (losBlocked(p.pos.x, p.pos.y + 1.3, p.pos.z, x, y + 1, z, this.world.losColliders)) continue;
      if (severity >= 18 && p.state !== 'flee') {
        p.state = 'flee';
        p.fleeFrom.set(x, 0, z);
        p.fleeTime = this.rng.range(5, 10);
      }
      if (this.rng.chance(0.55)) {
        p.reportCrime = type;
        p.reportPos.set(x, y, z);
        p.callTimer = this.rng.range(3, 8);
        p.state = p.state === 'flee' ? 'flee' : 'call';
      }
    }
  }

  spawnNear(playerPos: THREE.Vector3): void {
    if (this.peds.length >= this.maxPeds) return;
    const e = this.rng.pick(this.graph.edges);
    if (e.kind === 'bridge') return;
    const side = this.rng.chance(0.5) ? 1 : -1;
    const t = this.rng.float();
    const a = this.graph.nodes[e.a];
    const b = this.graph.nodes[e.b];
    const bx = a.x + (b.x - a.x) * t;
    const bz = a.z + (b.z - a.z) * t;
    const lx = bx + -e.dz * side * 7.6;
    const lz = bz + e.dx * side * 7.6;
    if (Math.hypot(lx - playerPos.x, lz - playerPos.z) > 260) return;
    if (isWater(lx, lz)) return;
    const style: CharacterStyle = {
      skin: this.rng.pick(SKINS),
      hair: this.rng.pick(HAIRS),
      shirt: this.rng.pick(SHIRTS),
      jacket: this.rng.pick(SHIRTS),
      pants: this.rng.pick(PANTS),
      shoes: this.rng.pick([0xd8d3c8, 0x222222, 0x6b4f2a]),
      hat: 0,
    };
    const ped = new Pedestrian(this.scene, style);
    ped.pos.set(lx, heightAt(lx, lz), lz);
    const n = this.graph.nearestNode(lx, lz);
    ped.route = [n, ...this.randomWalk(n, this.rng.int(3, 8))];
    ped.segIdx = 0;
    ped.t = this.rng.float();
    ped.side = side;
    ped.yaw = Math.atan2(e.dx, e.dz);
    this.peds.push(ped);
  }

  private randomWalk(from: number, len: number): number[] {
    const route = [from];
    let cur = from;
    for (let i = 0; i < len; i++) {
      const adj = this.graph.nodes[cur].adj;
      if (adj.length === 0) break;
      const options = adj.filter((a) => a.to !== route[route.length - 2]);
      const next = options.length > 0 ? this.rng.pick(options) : adj[0];
      route.push(next.to);
      cur = next.to;
    }
    return route.slice(1);
  }

  hitByVehicle(ped: Pedestrian, vSpeed: number, vehicleUid: number): void {
    if (ped.dead) return;
    ped.health -= vSpeed * 9;
    ped.state = 'flee';
    ped.fleeFrom.copy(ped.pos);
    ped.fleeTime = 6;
    this.events.emit('PED_HIT_BY_VEHICLE', { pedId: ped.id, vehicleId: vehicleUid });
    if (ped.health <= 0) {
      ped.dead = true;
      ped.state = 'dead';
      this.events.emit('PED_KILLED', { pedId: ped.id, cause: 'vehicle', position: { x: ped.pos.x, y: ped.pos.y, z: ped.pos.z }, isOfficer: ped.isOfficer });
      this.events.emit('CRIME_COMMITTED', { type: 'ped_killed', severity: 45, position: { x: ped.pos.x, y: ped.pos.y, z: ped.pos.z } });
    } else {
      this.events.emit('CRIME_COMMITTED', { type: 'assault_civilian', severity: 20, position: { x: ped.pos.x, y: ped.pos.y, z: ped.pos.z } });
    }
  }

  damagePed(ped: Pedestrian, dmg: number, cause: string): void {
    if (ped.dead) return;
    ped.health -= dmg;
    if (ped.health <= 0) {
      ped.dead = true;
      ped.state = 'dead';
      this.events.emit('PED_KILLED', { pedId: ped.id, cause, position: { x: ped.pos.x, y: ped.pos.y, z: ped.pos.z }, isOfficer: ped.isOfficer });
      this.events.emit('CRIME_COMMITTED', { type: 'ped_killed', severity: 45, position: { x: ped.pos.x, y: ped.pos.y, z: ped.pos.z } });
    } else {
      ped.state = 'flee';
      ped.fleeFrom.copy(ped.pos);
      ped.fleeTime = this.rng.range(5, 10);
    }
  }

  update(dt: number, playerPos: THREE.Vector3, colliders: AABBCollider[], vehicles: { pos: THREE.Vector3; vel: THREE.Vector3; uid: number; speed: number }[], timeSec: number): void {
    if (this.peds.length < this.maxPeds && Math.random() < dt * 2 * this.spawnFactor) this.spawnNear(playerPos);

    for (let i = this.peds.length - 1; i >= 0; i--) {
      const p = this.peds[i];
      if (p.isOfficer || p.isGuard) {
        if (p.dead) {
          animateCharacter(p.parts, 'dead', 0, p.animT, 0, dt);
          p.group.position.copy(p.pos);
          p.group.rotation.y = p.yaw;
        }
        continue;
      }
      const dp = Math.hypot(p.pos.x - playerPos.x, p.pos.z - playerPos.z);
      if (dp > 420) {
        p.dispose(this.scene);
        this.peds.splice(i, 1);
        continue;
      }
      p.witnessCooldown = Math.max(0, p.witnessCooldown - dt);
      if (p.callTimer > 0) {
        p.callTimer -= dt;
        if (p.callTimer <= 0 && p.reportCrime) {
          this.events.emit('CRIME_REPORTED', { type: p.reportCrime, position: { x: p.reportPos.x, y: p.reportPos.y, z: p.reportPos.z }, reporterId: p.id });
          p.reportCrime = null;
          p.witnessCooldown = 12;
        }
      }

      if (p.dead) {
        animateCharacter(p.parts, 'dead', 0, p.animT, 0, dt);
        p.group.position.copy(p.pos);
        p.group.rotation.y = p.yaw;
        continue;
      }

      let moveX = 0;
      let moveZ = 0;
      let speed = p.targetSpeed;

      if (p.state === 'flee') {
        p.fleeTime -= dt;
        const dx = p.pos.x - p.fleeFrom.x;
        const dz = p.pos.z - p.fleeFrom.z;
        const d = Math.hypot(dx, dz) || 1;
        moveX = (dx / d) * 5.2;
        moveZ = (dz / d) * 5.2;
        if (p.fleeTime <= 0) {
          p.state = 'walk';
          const n = this.graph.nearestNode(p.pos.x, p.pos.z);
          p.route = [n, ...this.randomWalk(n, this.rng.int(3, 8))];
          p.segIdx = 0;
        }
      } else if (p.state === 'call') {
        speed = 0;
      } else {
        if (p.segIdx >= p.route.length - 1) {
          const n = this.graph.nearestNode(p.pos.x, p.pos.z);
          p.route = [n, ...this.randomWalk(n, this.rng.int(4, 10))];
          p.segIdx = 0;
          p.t = 0;
        }
        const n0 = this.graph.nodes[p.route[p.segIdx]];
        const n1 = this.graph.nodes[p.route[p.segIdx + 1]];
        const edge = n0.adj.find((a) => a.to === n1.id)!.edge;
        const e = this.graph.edges[edge];
        p.t += (speed * dt) / e.len;
        if (p.t >= 1) {
          p.t = 0;
          p.segIdx++;
        }
        const pt = this.graph.pointOnEdge(edge, p.t, p.side);
        const wx = pt.x + -e.dz * p.side * 7.6;
        const wz = pt.z + e.dx * p.side * 7.6;
        moveX = (wx - p.pos.x) / Math.max(dt, 1e-4) * 0.4;
        moveZ = (wz - p.pos.z) / Math.max(dt, 1e-4) * 0.4;
        if (Math.hypot(wx - p.pos.x, wz - p.pos.z) > 2) {
          const d = Math.hypot(wx - p.pos.x, wz - p.pos.z);
          moveX = ((wx - p.pos.x) / d) * speed;
          moveZ = ((wz - p.pos.z) / d) * speed;
        } else {
          moveX = 0;
          moveZ = 0;
        }
      }

      for (const v of vehicles) {
        const dx = p.pos.x - v.pos.x;
        const dz = p.pos.z - v.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 2.0 && v.speed > 2.5) {
          this.hitByVehicle(p, v.speed, v.uid);
          break;
        }
        if (d < 6 && v.speed > 12) {
          const dd = d || 1;
          moveX += (dx / dd) * 3;
          moveZ += (dz / dd) * 3;
        }
      }

      let nx = p.pos.x + moveX * dt;
      let nz = p.pos.z + moveZ * dt;
      for (const c of colliders) {
        if (nx + 0.3 < c.min.x || nx - 0.3 > c.max.x || nz + 0.3 < c.min.z || nz - 0.3 > c.max.z) continue;
        if (c.min.y > p.pos.y + 0.5 || c.max.y < p.pos.y + 0.1) continue;
        const cx = clamp(nx, c.min.x, c.max.x);
        const cz = clamp(nz, c.min.z, c.max.z);
        let dx = nx - cx;
        let dz = nz - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 > 0.09) continue;
        if (d2 > 1e-9) {
          const d = Math.sqrt(d2);
          nx = cx + (dx / d) * 0.3;
          nz = cz + (dz / d) * 0.3;
        } else {
          nx = p.pos.x;
          nz = p.pos.z;
        }
      }
      if (!isWater(nx, nz) || heightAt(nx, nz) > -1.5) {
        p.pos.x = nx;
        p.pos.z = nz;
      }
      p.pos.y = heightAt(p.pos.x, p.pos.z);
      const sp = Math.hypot(moveX, moveZ);
      p.speed = sp;
      if (sp > 0.2) p.yaw = Math.atan2(moveX, moveZ);
      p.animT += dt * (p.state === 'flee' ? 2 : 1);
      const animState = p.state === 'flee' ? 'sprint' : sp > 0.2 ? 'walk' : 'idle';
      animateCharacter(p.parts, animState, sp, p.animT, 0, dt);
      p.group.position.copy(p.pos);
      p.group.rotation.y = p.yaw;
    }
    void timeSec;
  }

  nearestPedAlongRay(origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number): { ped: Pedestrian; t: number } | null {
    let best: { ped: Pedestrian; t: number } | null = null;
    for (const p of this.peds) {
      if (p.dead) continue;
      const t = rayCapsule(origin, dir, p.pos, 1.75, 0.38, maxDist);
      if (t !== null && (best === null || t < best.t)) best = { ped: p, t };
    }
    return best;
  }

  nearestPed(x: number, z: number, maxDist: number): Pedestrian | null {
    let best: Pedestrian | null = null;
    let bd = maxDist;
    for (const p of this.peds) {
      if (p.dead) continue;
      const d = Math.hypot(p.pos.x - x, p.pos.z - z);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }
}
