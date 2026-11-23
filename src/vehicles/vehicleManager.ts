import * as THREE from 'three';
import { VEHICLES, type VehicleDef } from '../core/config.ts';
import { RNG, globalRng } from '../core/rng.ts';
import { clamp } from '../core/math.ts';
import type { AABBCollider } from '../core/types.ts';
import { heightAt } from '../world/terrain.ts';
import type { RoadGraph } from '../world/roads.ts';
import type { World } from '../world/city.ts';
import type { EventBus } from '../core/events.ts';
import { Vehicle, type VehicleInput } from './vehicle.ts';
import type { OwnedVehicle } from '../core/types.ts';

interface TrafficCar {
  v: Vehicle;
  route: number[];
  segIdx: number;
  t: number;
  side: 1 | -1;
  speed: number;
  stopped: boolean;
  crashed: boolean;
}

const CIVILIAN_MODELS = ['volton_metro', 'alden_crest', 'northstar_trail', 'ironhorse_250', 'hauler_v6', 'vexler_gt', 'dockrunner'];
const CIVILIAN_COLORS = [0x8a8f98, 0xb8b2a8, 0x3d4b5c, 0x7a1f2b, 0x4a5d43, 0xd8c39b, 0x14213d, 0xc7cdd4, 0x6b4f2a];

export class VehicleManager {
  vehicles: Vehicle[] = [];
  traffic: TrafficCar[] = [];
  playerVehicle: Vehicle | null = null;
  graph: RoadGraph;
  world: World;
  events: EventBus;
  scene: THREE.Scene;
  rng = new RNG(31337);
  private nextTrafficTarget = 20;
  stolenUids = new Set<number>();

  constructor(scene: THREE.Scene, graph: RoadGraph, world: World, events: EventBus) {
    this.scene = scene;
    this.graph = graph;
    this.world = world;
    this.events = events;
  }

  spawnVehicle(modelId: string, x: number, z: number, yaw: number, color?: number): Vehicle {
    const def = VEHICLES[modelId];
    const v = new Vehicle(def, color ?? def.color, this.events, this.scene);
    v.setPosition(x, z, yaw);
    this.vehicles.push(v);
    return v;
  }

  spawnParked(): void {
    for (const spot of this.world.poiSet.parkedSpots) {
      this.spawnVehicle(spot.modelId, spot.x, spot.z, spot.yaw);
    }
  }

  spawnOwned(list: OwnedVehicle[]): void {
    for (const o of list) {
      if (o.inGarage || o.position === null) continue;
      const v = this.spawnVehicle(o.modelId, o.position.x, o.position.z, 0, o.color);
      v.uid = o.uid;
      v.damage = o.damage;
      v.fuel = o.fuel;
      v.owned = true;
      v.plate = o.plate;
      v.upgrades = [...o.upgrades];
    }
  }

  setTrafficTarget(n: number): void {
    this.nextTrafficTarget = n;
  }

  private randomRoute(fromNode: number, len: number): number[] {
    const route = [fromNode];
    let cur = fromNode;
    for (let i = 0; i < len; i++) {
      const adj = this.graph.nodes[cur].adj;
      const options = adj.filter((a) => a.to !== route[route.length - 2]);
      const next = options.length > 0 ? this.rng.pick(options) : adj[0];
      if (!next) break;
      route.push(next.to);
      cur = next.to;
    }
    return route;
  }

  private spawnTrafficCar(): void {
    const e = this.rng.pick(this.graph.edges);
    if (e.kind === 'bridge') return;
    const a = this.graph.nodes[e.a];
    const b = this.graph.nodes[e.b];
    const midX = (a.x + b.x) / 2;
    const midZ = (a.z + b.z) / 2;
    const playerPos = this.playerVehicle ? this.playerVehicle.pos : null;
    if (playerPos && Math.hypot(midX - playerPos.x, midZ - playerPos.z) < 120) return;
    const model = this.rng.pick(CIVILIAN_MODELS);
    const color = this.rng.pick(CIVILIAN_COLORS);
    const v = this.spawnVehicle(model, midX, midZ, Math.atan2(b.x - a.x, b.z - a.z), color);
    const fromNode = this.rng.chance(0.5) ? e.a : e.b;
    const route = this.randomRoute(fromNode, this.rng.int(6, 14));
    if (route.length < 2) {
      this.remove(v);
      return;
    }
    const p = this.graph.pointOnEdge(this.graph.nodes[route[0]].adj.find((x) => x.to === route[1])!.edge, 0.5, 1);
    v.setPosition(p.x, p.z, Math.atan2(this.graph.nodes[route[1]].x - this.graph.nodes[route[0]].x, this.graph.nodes[route[1]].z - this.graph.nodes[route[0]].z));
    this.traffic.push({ v, route, segIdx: 0, t: 0.5, side: 1, speed: 0, stopped: false, crashed: false });
  }

  remove(v: Vehicle): void {
    v.dispose(this.scene);
    const i = this.vehicles.indexOf(v);
    if (i >= 0) this.vehicles.splice(i, 1);
    const ti = this.traffic.findIndex((t) => t.v === v);
    if (ti >= 0) this.traffic.splice(ti, 1);
    if (this.playerVehicle === v) this.playerVehicle = null;
  }

  nearestEnterable(x: number, z: number, maxDist: number): Vehicle | null {
    let best: Vehicle | null = null;
    let bestD = maxDist;
    for (const v of this.vehicles) {
      if (v.destroyed || v.isPolice || v.inGarage) continue;
      const d = Math.hypot(v.pos.x - x, v.pos.z - z);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    return best;
  }

  enterVehicle(v: Vehicle, isPlayer: boolean): void {
    if (isPlayer) {
      this.playerVehicle = v;
      v.lastDriverPlayer = true;
      if (!v.owned && !this.stolenUids.has(v.uid)) {
        this.stolenUids.add(v.uid);
        this.events.emit('CRIME_COMMITTED', { type: 'vehicle_theft', severity: 12, position: { x: v.pos.x, y: v.pos.y, z: v.pos.z } });
      }
      this.events.emit('PLAYER_ENTERED_VEHICLE', { vehicleId: v.uid });
    }
  }

  exitVehicle(): Vehicle | null {
    const v = this.playerVehicle;
    if (!v) return null;
    this.playerVehicle = null;
    this.events.emit('PLAYER_EXITED_VEHICLE', { vehicleId: v.uid });
    return v;
  }

  update(dt: number, playerInput: VehicleInput | null, colliders: AABBCollider[], traction: number, night: boolean, playerPos: THREE.Vector3, timeSec: number): void {
    while (this.traffic.length < this.nextTrafficTarget) this.spawnTrafficCar();

    for (const v of this.vehicles) {
      if (v === this.playerVehicle) continue;
      if (v.destroyed) continue;
      const ti = this.traffic.findIndex((t) => t.v === v);
      if (ti >= 0) continue;
      v.update(dt, null, colliders, this.vehicles, traction, 0);
    }

    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const tc = this.traffic[i];
      const v = tc.v;
      if (v.destroyed) {
        this.traffic.splice(i, 1);
        continue;
      }
      if (tc.crashed) {
        tc.speed = 0;
        v.vel.set(0, 0, 0);
        v.syncMesh(dt);
        continue;
      }
      const dp = Math.hypot(v.pos.x - playerPos.x, v.pos.z - playerPos.z);
      if (dp > 750) {
        this.traffic.splice(i, 1);
        this.remove(v);
        continue;
      }
      this.updateTrafficCar(tc, dt, colliders, traction, timeSec);
    }

    for (let i = 0; i < this.traffic.length; i++) {
      for (let j = i + 1; j < this.traffic.length; j++) {
        const a = this.traffic[i];
        const b = this.traffic[j];
        if (a.crashed || b.crashed) continue;
        const dx = a.v.pos.x - b.v.pos.x;
        const dz = a.v.pos.z - b.v.pos.z;
        const d = Math.hypot(dx, dz);
        if (d > 3.4) continue;
        const rel = Math.abs(a.speed - b.speed);
        if (rel > 6 || d < 2.2) {
          a.crashed = true;
          b.crashed = true;
          a.speed = 0;
          b.speed = 0;
          a.v.applyDamage(180 + Math.random() * 260);
          b.v.applyDamage(180 + Math.random() * 260);
          this.events.emit('VEHICLE_DAMAGED', { vehicleId: a.v.uid, amount: 200, position: { x: a.v.pos.x, y: a.v.pos.y, z: a.v.pos.z } });
          this.events.emit('NOTIFICATION', { text: 'Verkehrsunfall!', kind: 'warning' });
        }
      }
    }

    if (this.playerVehicle && !this.playerVehicle.destroyed) {
      const res = this.playerVehicle.update(dt, playerInput, colliders, this.vehicles, traction, 0);
      if (res.impact > 6) this.events.emit('CRIME_COMMITTED', { type: 'heavy_crash', severity: 8, position: { x: this.playerVehicle.pos.x, y: this.playerVehicle.pos.y, z: this.playerVehicle.pos.z } });
      this.playerVehicle.setLights(true, night);
      if (this.playerVehicle.spot) this.playerVehicle.spot.intensity = night ? 160 : 0;
    }
    for (const v of this.vehicles) {
      if (v === this.playerVehicle || v.isPolice) continue;
      v.setLights(night, night);
    }
    for (const v of this.vehicles) {
      if (v.isPolice && !v.destroyed) v.updatePoliceLights(timeSec);
    }
  }

  private updateTrafficCar(tc: TrafficCar, dt: number, colliders: AABBCollider[], traction: number, timeSec: number): void {
    const v = tc.v;
    const graph = this.graph;
    if (tc.segIdx >= tc.route.length - 1) {
      const ext = this.randomRoute(tc.route[tc.route.length - 1], this.rng.int(6, 14));
      tc.route = tc.route.concat(ext.slice(1));
    }
    const n0 = graph.nodes[tc.route[tc.segIdx]];
    const n1 = graph.nodes[tc.route[tc.segIdx + 1]];
    const edge = n0.adj.find((a) => a.to === n1.id)!.edge;
    const e = graph.edges[edge];

    let targetSpeed = Math.min(e.speedLimit / 3.6, v.topSpeed * 0.9);

    const nodeAhead = graph.nodes[n1.id];
    const distToNode = (1 - tc.t) * e.len;
    const light = graph.lightState(n1.id, timeSec);
    if (light === 'red' && distToNode < 30 && tc.speed > 2) {
      targetSpeed = 0;
      if (distToNode < 9) tc.stopped = true;
    }

    for (const o of this.vehicles) {
      if (o === v || o.destroyed) continue;
      const dx = o.pos.x - v.pos.x;
      const dz = o.pos.z - v.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 16) continue;
      const fwd = v.heading();
      const dot = (dx * fwd.x + dz * fwd.z) / (d || 1);
      if (dot > 0.85 && d < 13) {
        targetSpeed = Math.min(targetSpeed, Math.max(0, (d - 6) * 0.8));
      }
    }

    if (tc.stopped) {
      if (light === 'green') tc.stopped = false;
      else targetSpeed = 0;
    }

    tc.speed = clamp(tc.speed + clamp(targetSpeed - tc.speed, -14 * dt, 6 * dt), 0, 40);
    tc.t += (tc.speed * dt) / e.len;
    if (tc.t >= 1) {
      tc.t = 0;
      tc.segIdx++;
      if (tc.segIdx >= tc.route.length - 1) tc.segIdx = tc.route.length - 2;
    }
    const p = graph.pointOnEdge(edge, tc.t, tc.side);
    const targetYaw = Math.atan2(p.dx, p.dz);
    let dy = targetYaw - v.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    v.yaw += clamp(dy, -2.4 * dt, 2.4 * dt);
    const speed = tc.speed * clamp(1 - Math.abs(dy) * 0.3, 0.4, 1);
    const fwd = v.heading();
    v.vel.set(fwd.x * speed, 0, fwd.z * speed);
    v.pos.x = p.x;
    v.pos.z = p.z;
    v.pos.y = heightAt(p.x, p.z) + v.def.groundClearance;
    v.syncMesh(dt);
    void colliders;
    void traction;
  }

  buyVehicle(modelId: string, color: number, uid: number): Vehicle {
    const v = this.spawnVehicle(modelId, -1320, 268, 0, color);
    v.uid = uid;
    v.owned = true;
    v.plate = `SL-${uid.toString().padStart(4, '0')}`;
    return v;
  }

  serializeOwned(): OwnedVehicle[] {
    const list: OwnedVehicle[] = [];
    for (const v of this.vehicles) {
      if (!v.owned) continue;
      list.push({
        uid: v.uid,
        modelId: v.def.id,
        color: v.color,
        damage: v.damage,
        fuel: v.fuel,
        position: v.inGarage ? null : { x: v.pos.x, y: v.pos.y, z: v.pos.z },
        inGarage: v.inGarage,
        upgrades: [...v.upgrades],
        plate: v.plate,
      });
    }
    return list;
  }
}

export function randomCivilianDef(): VehicleDef {
  return VEHICLES[globalRng.pick(CIVILIAN_MODELS)];
}
