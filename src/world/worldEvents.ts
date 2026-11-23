import * as THREE from 'three';
import { RNG } from '../core/rng.ts';
import { heightAt, isLand } from './terrain.ts';
import type { RoadGraph } from './roads.ts';
import type { World } from './city.ts';
import type { EventBus } from '../core/events.ts';
import type { Economy } from '../economy/economy.ts';
import type { VehicleManager } from '../vehicles/vehicleManager.ts';
import type { PedestrianManager } from '../pedestrians/pedestrianManager.ts';
import { Pedestrian } from '../pedestrians/pedestrianManager.ts';
import { VEHICLES } from '../core/config.ts';
import { clamp } from '../core/math.ts';

type EventType = 'accident' | 'breakdown' | 'checkpoint' | 'musician' | 'carmeet';

interface WorldEvent {
  type: EventType;
  pos: THREE.Vector3;
  ttl: number;
  objs: THREE.Object3D[];
  peds: Pedestrian[];
  vehicles: { v: import('../vehicles/vehicle.ts').Vehicle; drive?: { route: number[]; seg: number; t: number; speed: number } }[];
  update(dt: number, playerPos: THREE.Vector3, timeSec: number): void;
  dispose(scene: THREE.Scene): void;
  interactLabel?(playerPos: THREE.Vector3): string | null;
  interact?(): void;
}

export class WorldEvents {
  private active: WorldEvent[] = [];
  private timer = 240;
  private rng = new RNG(555111);
  graph: RoadGraph;
  world: World;
  events: EventBus;
  economy: Economy;
  vehicles: VehicleManager;
  peds: PedestrianManager;
  scene: THREE.Scene;
  maxConcurrent = 2;

  constructor(scene: THREE.Scene, graph: RoadGraph, world: World, events: EventBus, economy: Economy, vehicles: VehicleManager, peds: PedestrianManager) {
    this.scene = scene;
    this.graph = graph;
    this.world = world;
    this.events = events;
    this.economy = economy;
    this.vehicles = vehicles;
    this.peds = peds;
  }

  private randLandPosNear(playerPos: THREE.Vector3, minD: number, maxD: number): THREE.Vector3 | null {
    for (let i = 0; i < 30; i++) {
      const ang = this.rng.float() * Math.PI * 2;
      const d = this.rng.range(minD, maxD);
      const x = playerPos.x + Math.cos(ang) * d;
      const z = playerPos.z + Math.sin(ang) * d;
      if (!isLand(x, z)) continue;
      const near = this.graph.nearestEdgePoint(x, z);
      if (near.dist > 30 * 30) continue;
      return new THREE.Vector3(x, heightAt(x, z), z);
    }
    return null;
  }

  private mkPed(x: number, z: number, style: Partial<import('../player/character.ts').CharacterStyle> = {}): Pedestrian {
    const s = { skin: 0xc9a184, hair: 0x2a2018, shirt: 0x37474f, jacket: 0x2a2018, pants: 0x1c1c1c, shoes: 0x222222, hat: 0, ...style };
    const p = new Pedestrian(this.scene, s);
    p.pos.set(x, heightAt(x, z), z);
    p.state = 'idle';
    this.peds.peds.push(p);
    return p;
  }

  private spawn(type: EventType, pos: THREE.Vector3): WorldEvent | null {
    const ttl = this.rng.range(90, 180);
    if (type === 'accident') return this.spawnAccident(pos, ttl);
    if (type === 'breakdown') return this.spawnBreakdown(pos, ttl);
    if (type === 'checkpoint') return this.spawnCheckpoint(pos, ttl);
    if (type === 'musician') return this.spawnMusician(pos, ttl);
    return this.spawnCarMeet(pos, ttl);
  }

  private spawnAccident(pos: THREE.Vector3, ttl: number): WorldEvent {
    const e = this.graph.nearestEdgePoint(pos.x, pos.z);
    const yaw = Math.atan2(this.graph.nodes[e.nodeB].x - this.graph.nodes[e.nodeA].x, this.graph.nodes[e.nodeB].z - this.graph.nodes[e.nodeA].z);
    const v1 = this.vehicles.spawnVehicle(this.rng.pick(['volton_metro', 'alden_crest', 'hauler_v6']), pos.x - 3, pos.z, yaw + 0.5, 0x7a1f2b);
    const v2 = this.vehicles.spawnVehicle(this.rng.pick(['volton_metro', 'northstar_trail']), pos.x + 3.5, pos.z + 2, yaw - 2.6, 0x3d4b5c);
    v1.applyDamage(320);
    v2.applyDamage(410);
    const peds = [this.mkPed(pos.x + 5, pos.z + 3), this.mkPed(pos.x - 5, pos.z + 4), this.mkPed(pos.x + 1, pos.z - 4)];
    const ev: WorldEvent = {
      type: 'accident',
      pos,
      ttl,
      objs: [],
      peds,
      vehicles: [{ v: v1 }, { v: v2 }],
      update: () => {},
      dispose: (scene) => {
        for (const p of peds) {
          const i = this.peds.peds.indexOf(p);
          if (i >= 0) this.peds.peds.splice(i, 1);
          p.dispose(scene);
        }
        this.vehicles.remove(v1);
        this.vehicles.remove(v2);
      },
    };
    this.events.emit('NOTIFICATION', { text: 'Verkehrsunfall in der Nähe - Polizei unterwegs.', kind: 'info' });
    this.events.emit('CRIME_REPORTED', { type: 'heavy_crash', position: { x: pos.x, y: pos.y, z: pos.z }, reporterId: -1 });
    return ev;
  }

  private spawnBreakdown(pos: THREE.Vector3, ttl: number): WorldEvent {
    const e = this.graph.nearestEdgePoint(pos.x, pos.z);
    const yaw = Math.atan2(this.graph.nodes[e.nodeB].x - this.graph.nodes[e.nodeA].x, this.graph.nodes[e.nodeB].z - this.graph.nodes[e.nodeA].z);
    const p = this.graph.pointOnEdge(this.graph.nodes[e.nodeA].adj.find((a) => a.to === e.nodeB)!.edge, e.t, -1);
    const v = this.vehicles.spawnVehicle('volton_metro', p.x, p.z, yaw, 0xb8b2a8);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.5), new THREE.MeshStandardMaterial({ color: 0x8a8f98, roughness: 0.5 }));
    hood.position.set(v.pos.x - Math.sin(yaw) * 1.2, v.pos.y + v.def.height + 0.25, v.pos.z - Math.cos(yaw) * 1.2);
    hood.rotation.y = yaw;
    this.scene.add(hood);
    const driver = this.mkPed(v.pos.x + 2, v.pos.z + 1.5);
    let helped = false;
    const ev: WorldEvent = {
      type: 'breakdown',
      pos: v.pos,
      ttl,
      objs: [hood],
      peds: [driver],
      vehicles: [{ v }],
      update: () => {},
      dispose: (scene) => {
        scene.remove(hood);
        const i = this.peds.peds.indexOf(driver);
        if (i >= 0) this.peds.peds.splice(i, 1);
        driver.dispose(scene);
        if (!this.vehicles.vehicles.includes(v)) return;
        this.vehicles.remove(v);
      },
      interactLabel: (pp) => (!helped && pp.distanceTo(v.pos) < 3.5 ? 'E - PANNE HELFEN (+75 $)' : null),
      interact: () => {
        if (helped) return;
        helped = true;
        this.economy.earn(75, 'Pannenhilfe');
        this.events.emit('NOTIFICATION', { text: '+75 $ Pannenhilfe', kind: 'money' });
        ev.ttl = Math.min(ev.ttl, 5);
      },
    };
    return ev;
  }

  private spawnCheckpoint(pos: THREE.Vector3, ttl: number): WorldEvent {
    const e = this.graph.nearestEdgePoint(pos.x, pos.z);
    const edge = this.graph.nodes[e.nodeA].adj.find((a) => a.to === e.nodeB)!.edge;
    const p = this.graph.pointOnEdge(edge, e.t, 1);
    const yaw = Math.atan2(p.dx, p.dz);
    const patrol = this.vehicles.spawnVehicle('solace_patrol', p.x, p.z, yaw, 0x14181f);
    const civ = this.vehicles.spawnVehicle(this.rng.pick(['volton_metro', 'alden_crest']), p.x - Math.sin(yaw) * 8, p.z - Math.cos(yaw) * 8, yaw, 0xc7cdd4);
    const peds = [this.mkPed(p.x + 2.5, p.z + 2), this.mkPed(p.x - 2, p.z + 2.5)];
    const ev: WorldEvent = {
      type: 'checkpoint',
      pos,
      ttl,
      objs: [],
      peds,
      vehicles: [{ v: patrol }, { v: civ }],
      update: () => {},
      dispose: (scene) => {
        for (const pd of peds) {
          const i = this.peds.peds.indexOf(pd);
          if (i >= 0) this.peds.peds.splice(i, 1);
          pd.dispose(scene);
        }
        this.vehicles.remove(patrol);
        this.vehicles.remove(civ);
      },
    };
    return ev;
  }

  private spawnMusician(pos: THREE.Vector3, ttl: number): WorldEvent {
    const musician = this.mkPed(pos.x, pos.z, { shirt: 0xe97856, jacket: 0x14213d });
    const guitar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.6), new THREE.MeshStandardMaterial({ color: 0x6b4f2a, roughness: 0.7 }));
    guitar.position.set(pos.x + 0.3, pos.y + 1.1, pos.z);
    this.scene.add(guitar);
    const audience = [this.mkPed(pos.x + 2, pos.z + 1.5), this.mkPed(pos.x - 2, pos.z + 1), this.mkPed(pos.x + 1, pos.z - 2), this.mkPed(pos.x - 1.5, pos.z - 1.5)];
    let tipped = false;
    const ev: WorldEvent = {
      type: 'musician',
      pos,
      ttl,
      objs: [guitar],
      peds: [musician, ...audience],
      vehicles: [],
      update: (dt) => {
        guitar.rotation.z = Math.sin(performance.now() / 300) * 0.15;
        void dt;
      },
      dispose: (scene) => {
        scene.remove(guitar);
        for (const pd of [musician, ...audience]) {
          const i = this.peds.peds.indexOf(pd);
          if (i >= 0) this.peds.peds.splice(i, 1);
          pd.dispose(scene);
        }
      },
      interactLabel: (pp) => (!tipped && pp.distanceTo(pos) < 3 ? 'E - TRINKGELD GEBEN (10 $)' : null),
      interact: () => {
        if (tipped) return;
        if (this.economy.spend(10, 'Trinkgeld Straßenmusiker')) {
          tipped = true;
          this.events.emit('NOTIFICATION', { text: 'Der Musiker nickt dir zu.', kind: 'info' });
        }
      },
    };
    return ev;
  }

  private spawnCarMeet(pos: THREE.Vector3, ttl: number): WorldEvent {
    const models = ['vexler_gt', 'corsair_s9', 'tempest_xr'];
    const vs: WorldEvent['vehicles'] = [];
    const peds: Pedestrian[] = [];
    for (let i = 0; i < 3; i++) {
      const x = pos.x + (i - 1) * 5;
      const z = pos.z + (i % 2) * 3;
      const v = this.vehicles.spawnVehicle(models[i], x, z, this.rng.range(0, 6.28), [0x7a1f2b, 0x14213d, 0xd9a441][i]);
      vs.push({ v });
      peds.push(this.mkPed(x + 2.5, z + 2));
    }
    let driverIdx = -1;
    const ev: WorldEvent = {
      type: 'carmeet',
      pos,
      ttl,
      objs: [],
      peds,
      vehicles: vs,
      update: (dt, playerPos, timeSec) => {
        if (driverIdx < 0 && ev.ttl < 25) {
          driverIdx = this.rng.int(0, vs.length - 1);
          const v = vs[driverIdx].v;
          const from = this.graph.nearestNode(v.pos.x, v.pos.z);
          const route = [from, ...this.routeAway(from)];
          vs[driverIdx].drive = { route, seg: 0, t: 0, speed: 0 };
        }
        if (driverIdx >= 0) {
          const d = vs[driverIdx].drive!;
          const v = vs[driverIdx].v;
          if (d.seg >= d.route.length - 1) {
            ev.ttl = Math.min(ev.ttl, 0.1);
            return;
          }
          const n0 = this.graph.nodes[d.route[d.seg]];
          const n1 = this.graph.nodes[d.route[d.seg + 1]];
          const edge = n0.adj.find((a) => a.to === n1.id)?.edge;
          if (edge === undefined) {
            d.seg++;
            return;
          }
          const e = this.graph.edges[edge];
          d.speed = Math.min(20, d.speed + 12 * dt);
          d.t += (d.speed * dt) / e.len;
          if (d.t >= 1) {
            d.t = 0;
            d.seg++;
          }
          const p = this.graph.pointOnEdge(edge, d.t, 1);
          v.yaw = Math.atan2(p.dx, p.dz);
          const fwd = v.heading();
          v.pos.set(p.x, heightAt(p.x, p.z) + v.def.groundClearance, p.z);
          v.vel.set(fwd.x * d.speed, 0, fwd.z * d.speed);
          v.syncMesh(dt);
          void playerPos;
          void timeSec;
        }
      },
      dispose: (scene) => {
        for (const pd of peds) {
          const i = this.peds.peds.indexOf(pd);
          if (i >= 0) this.peds.peds.splice(i, 1);
          pd.dispose(scene);
        }
        for (const { v } of vs) this.vehicles.remove(v);
      },
    };
    return ev;
  }

  private routeAway(from: number): number[] {
    const route = [from];
    let cur = from;
    for (let i = 0; i < 10; i++) {
      const adj = this.graph.nodes[cur].adj;
      if (!adj.length) break;
      const next = this.rng.pick(adj.filter((a) => a.to !== route[route.length - 2]));
      route.push(next.to);
      cur = next.to;
    }
    return route.slice(1);
  }

  update(dt: number, playerPos: THREE.Vector3, timeSec: number): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.rng.range(360, 600);
      if (this.active.length < this.maxConcurrent) {
        const pos = this.randLandPosNear(playerPos, 120, 420);
        if (pos) {
          const type = this.rng.pick(['accident', 'breakdown', 'checkpoint', 'musician', 'carmeet'] as EventType[]);
          const ev = this.spawn(type, pos);
          if (ev) this.active.push(ev);
        }
      }
    }
    for (let i = this.active.length - 1; i >= 0; i--) {
      const ev = this.active[i];
      ev.ttl -= dt;
      ev.update(dt, playerPos, timeSec);
      const d = ev.pos.distanceTo(playerPos);
      if (ev.ttl <= 0 || d > 900) {
        ev.dispose(this.scene);
        this.active.splice(i, 1);
      }
    }
  }

  interactLabel(playerPos: THREE.Vector3): string | null {
    for (const ev of this.active) {
      const l = ev.interactLabel?.(playerPos);
      if (l) return l;
    }
    return null;
  }

  interact(playerPos: THREE.Vector3): void {
    for (const ev of this.active) {
      if (ev.interactLabel?.(playerPos)) {
        ev.interact?.();
        return;
      }
    }
  }

  clear(): void {
    for (const ev of this.active) ev.dispose(this.scene);
    this.active.length = 0;
  }
}
