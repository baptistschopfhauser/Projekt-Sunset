import * as THREE from 'three';
import { WANTED, VEHICLES } from '../core/config.ts';
import { clamp, losBlocked, angleDelta } from '../core/math.ts';
import { heightAt } from '../world/terrain.ts';
import type { RoadGraph } from '../world/roads.ts';
import type { World } from '../world/city.ts';
import type { EventBus } from '../core/events.ts';
import type { AABBCollider } from '../core/types.ts';
import { Vehicle } from '../vehicles/vehicle.ts';
import { WantedSystem } from './wanted.ts';
import { Pedestrian } from '../pedestrians/pedestrianManager.ts';
import type { PedestrianManager } from '../pedestrians/pedestrianManager.ts';
import { animateCharacter } from '../player/character.ts';
import type { Player } from '../player/player.ts';

type UnitRole = 'pursuit' | 'support' | 'roadblock' | 'interceptor';

interface PoliceUnit {
  v: Vehicle;
  role: UnitRole;
  route: number[];
  segIdx: number;
  t: number;
  repathTimer: number;
  sirenPhase: number;
}

class Helicopter {
  mesh: THREE.Group;
  pos = new THREE.Vector3();
  yaw = 0;
  rotorSpin = 0;
  spot: THREE.SpotLight;
  active = false;
  constructor(scene: THREE.Scene) {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1b2733, roughness: 0.4, metalness: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 5), bodyMat);
    body.castShadow = true;
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 3.4), bodyMat);
    tail.position.set(0, 0.3, -4);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(9, 0.08, 0.4), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    rotor.position.y = 1.0;
    const rotor2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 9), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    rotor2.position.y = 1.0;
    const barMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x2478f2, emissiveIntensity: 3 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.5), barMat);
    bar.position.y = 0.95;
    g.add(body, tail, rotor, rotor2, bar);
    g.userData.rotor = rotor;
    g.userData.rotor2 = rotor2;
    g.userData.bar = bar;
    this.mesh = g;
    scene.add(g);
    this.spot = new THREE.SpotLight(0xfff6d8, 0, 260, 0.32, 0.5, 1.4);
    scene.add(this.spot);
    scene.add(this.spot.target);
  }
  update(dt: number, target: THREE.Vector3, time: number, night: boolean): void {
    this.rotorSpin += dt * 30;
    const rotor = this.mesh.userData.rotor as THREE.Mesh;
    const rotor2 = this.mesh.userData.rotor2 as THREE.Mesh;
    rotor.rotation.y = this.rotorSpin;
    rotor2.rotation.y = this.rotorSpin;
    const desired = target.clone();
    desired.y = heightAt(target.x, target.z) + 90;
    const d = desired.distanceTo(this.pos);
    const speed = clamp(d * 1.2, 8, 55);
    const dir = desired.clone().sub(this.pos).normalize();
    if (d > 4) {
      this.pos.addScaledVector(dir, speed * dt);
      this.yaw = Math.atan2(dir.x, dir.z);
    } else {
      this.yaw += dt * 0.5;
      this.pos.x = target.x + Math.cos(this.yaw) * 30;
      this.pos.z = target.z + Math.sin(this.yaw) * 30;
      this.pos.y = heightAt(target.x, target.z) + 90;
    }
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw;
    const bar = this.mesh.userData.bar as THREE.Mesh;
    (bar.material as THREE.MeshStandardMaterial).emissive.setHex(Math.floor(time * 5) % 2 === 0 ? 0x2478f2 : 0xeb3f47);
    this.spot.position.copy(this.pos);
    this.spot.target.position.set(target.x, heightAt(target.x, target.z), target.z);
    this.spot.intensity = night ? 900 : 0;
  }
  dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    scene.remove(this.spot);
    scene.remove(this.spot.target);
  }
}

export class PoliceManager {
  wanted: WantedSystem;
  units: PoliceUnit[] = [];
  heli: Helicopter;
  officers: Pedestrian[] = [];
  roadblock: { units: PoliceUnit[]; barriers: THREE.Mesh[] } | null = null;
  private roadblockTimer = 0;
  graph: RoadGraph;
  world: World;
  events: EventBus;
  scene: THREE.Scene;
  private pedManager: PedestrianManager;
  private arrestTimer = 0;
  private spawnCooldown = 0;

  constructor(scene: THREE.Scene, graph: RoadGraph, world: World, events: EventBus, pedManager: PedestrianManager) {
    this.scene = scene;
    this.graph = graph;
    this.world = world;
    this.events = events;
    this.pedManager = pedManager;
    this.wanted = new WantedSystem(events);
    this.heli = new Helicopter(scene);
    this.heli.mesh.visible = false;
    events.on('CRIME_REPORTED', (p) => {
      this.wanted.addCrime(this.crimeSeverity(p.type));
      this.wanted.markVisual(p.position.x, p.position.y, p.position.z, 0);
    });
    events.on('CRIME_COMMITTED', (p) => {
      this.wanted.addCrime(p.severity);
    });
  }

  crimeSeverity(type: string): number {
    return (WANTED.crimes as Record<string, number>)[type] ?? 10;
  }

  desiredUnitCount(): number {
    return [0, 1, 3, 5, 6, 8][this.wanted.level] ?? 0;
  }

  update(dt: number, playerPos: THREE.Vector3, playerInVehicle: boolean, playerSpeed: number, colliders: AABBCollider[], allVehicles: Vehicle[], timeSec: number, night: boolean, player?: Player): void {
    const level = this.wanted.level;
    this.spawnCooldown -= dt;

    this.roadblockTimer -= dt;
    if (level >= 3 && !this.roadblock && this.roadblockTimer <= 0 && !playerInVehicle) {
      const positions = this.roadblockPositions(playerPos);
      if (positions.length > 0) {
        this.spawnRoadblock(positions[0], playerPos);
        this.roadblockTimer = 25;
      } else this.roadblockTimer = 8;
    }
    if ((level < 3 || this.wanted.level === 0) && this.roadblock) this.clearRoadblock();

    if (level > 0 && this.units.length < this.desiredUnitCount() && this.spawnCooldown <= 0) {
      this.spawnCooldown = 2.5;
      const role: UnitRole = level >= 4 && this.units.length === 0 ? 'interceptor' : level >= 3 ? 'support' : 'pursuit';
      const unit = this.trySpawn(role, playerPos);
      if (unit) this.units.push(unit);
    }

    let anyVisual = false;
    for (const u of this.units) {
      const v = u.v;
      if (v.destroyed) continue;
      const d = Math.hypot(v.pos.x - playerPos.x, v.pos.z - playerPos.z);
      if (d < 110) {
        const ang = Math.abs(angleDelta(Math.atan2(playerPos.x - v.pos.x, playerPos.z - v.pos.z), v.yaw));
        if (ang < 1.9 || d < 25) {
          if (!losBlocked(v.pos.x, v.pos.y + 1.6, v.pos.z, playerPos.x, playerPos.y + 1.4, playerPos.z, this.world.losColliders)) {
            anyVisual = true;
            this.wanted.markVisual(playerPos.x, playerPos.y, playerPos.z, timeSec);
          }
        }
      }
    }

    if (level >= 4) {
      if (!this.heli.active) {
        this.heli.active = true;
        this.heli.mesh.visible = true;
        this.heli.pos.set(playerPos.x + 300, 150, playerPos.z + 300);
      }
      this.heli.update(dt, this.wanted.lastSeenPos.x !== 0 ? new THREE.Vector3(this.wanted.lastSeenPos.x, 0, this.wanted.lastSeenPos.z) : playerPos, timeSec, night);
      const hd = Math.hypot(this.heli.pos.x - playerPos.x, this.heli.pos.z - playerPos.z);
      if (hd < 220 && !losBlocked(this.heli.pos.x, this.heli.pos.y, this.heli.pos.z, playerPos.x, playerPos.y + 1.5, playerPos.z, this.world.losColliders)) {
        anyVisual = true;
        this.wanted.markVisual(playerPos.x, playerPos.y, playerPos.z, timeSec);
      }
    } else if (this.heli.active) {
      this.heli.active = false;
      this.heli.mesh.visible = false;
      this.heli.spot.intensity = 0;
    }

    this.wanted.update(dt, anyVisual, timeSec);

    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      if (u.v.destroyed) {
        this.units.splice(i, 1);
        continue;
      }
      this.updateUnit(u, dt, playerPos, timeSec);
      if (this.wanted.level === 0 && Math.hypot(u.v.pos.x - playerPos.x, u.v.pos.z - playerPos.z) > 260) {
        u.v.dispose(this.scene);
        this.units.splice(i, 1);
      }
    }

    this.updateOfficers(dt, playerPos, playerInVehicle, playerSpeed, player);

    const arrestPossible = this.wanted.level >= 1 && !playerInVehicle && playerSpeed < 0.6;
    let nearOfficer = false;
    for (const o of this.officers) {
      if (o.dead) continue;
      if (Math.hypot(o.pos.x - playerPos.x, o.pos.z - playerPos.z) < 2.6) nearOfficer = true;
    }
    if (arrestPossible && nearOfficer) {
      this.arrestTimer += dt;
      if (this.arrestTimer > 1.2) {
        this.arrestTimer = 0;
        this.events.emit('PLAYER_BUSTED', {});
      }
    } else {
      this.arrestTimer = Math.max(0, this.arrestTimer - dt * 2);
    }
    void colliders;
    void allVehicles;
  }

  private trySpawn(role: UnitRole, playerPos: THREE.Vector3): PoliceUnit | null {
    for (let tries = 0; tries < 20; tries++) {
      const node = this.graph.nodes[Math.floor(Math.random() * this.graph.nodes.length)];
      const d = Math.hypot(node.x - playerPos.x, node.z - playerPos.z);
      if (d < 170 || d > 540) continue;
      if (losBlocked(node.x, heightAt(node.x, node.z) + 2, node.z, playerPos.x, playerPos.y + 1.5, playerPos.z, this.world.losColliders)) continue;
      const modelId = role === 'interceptor' ? 'solace_interceptor' : 'solace_patrol';
      const v = new Vehicle(VEHICLES[modelId], 0x14181f, this.events, this.scene);
      const e = this.graph.nearestEdgePoint(node.x, node.z);
      const p = this.graph.pointOnEdge(this.graph.nodes[e.nodeA].adj.find((a) => a.to === e.nodeB)!.edge, e.t, 1);
      v.setPosition(p.x, p.z, Math.atan2(p.dx, p.dz));
      return { v, role, route: [], segIdx: 0, t: 0, repathTimer: 0, sirenPhase: Math.random() * 10 };
    }
    return null;
  }

  private spawnRoadblock(at: THREE.Vector3, playerPos: THREE.Vector3): void {
    const near = this.graph.nearestEdgePoint(at.x, at.z);
    const edge = this.graph.nodes[near.nodeA].adj.find((a) => a.to === near.nodeB)?.edge;
    const roadYaw = edge !== undefined ? Math.atan2(this.graph.edges[edge].dx, this.graph.edges[edge].dz) : 0;
    const perp = roadYaw + Math.PI / 2;
    const units: PoliceUnit[] = [];
    for (const off of [-3.5, 3.5]) {
      const v = new Vehicle(VEHICLES.solace_patrol, 0x14181f, this.events, this.scene);
      v.setPosition(at.x + Math.sin(roadYaw) * off, at.z + Math.cos(roadYaw) * off, perp);
      units.push({ v, role: 'roadblock', route: [], segIdx: 0, t: 0, repathTimer: 0, sirenPhase: 0 });
    }
    const barriers: THREE.Mesh[] = [];
    const bMat = new THREE.MeshStandardMaterial({ color: 0xd8d3c8, roughness: 0.7 });
    for (let i = -1; i <= 1; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 0.3), bMat);
      b.position.set(at.x + Math.cos(roadYaw) * i * 2.6, at.y + 0.5, at.z - Math.sin(roadYaw) * i * 2.6);
      b.rotation.y = roadYaw;
      this.scene.add(b);
      barriers.push(b);
    }
    this.roadblock = { units, barriers };
    this.units.push(...units);
    this.events.emit('NOTIFICATION', { text: 'Polizei richtet Straßensperre ein!', kind: 'warning' });
    void playerPos;
  }

  private clearRoadblock(): void {
    if (!this.roadblock) return;
    for (const u of this.roadblock.units) {
      const i = this.units.indexOf(u);
      if (i >= 0) this.units.splice(i, 1);
      u.v.dispose(this.scene);
    }
    for (const b of this.roadblock.barriers) this.scene.remove(b);
    this.roadblock = null;
  }

  private updateUnit(u: PoliceUnit, dt: number, playerPos: THREE.Vector3, timeSec: number): void {
    const v = u.v;
    if (u.role === 'roadblock') {
      v.vel.set(0, 0, 0);
      v.updatePoliceLights(timeSec);
      return;
    }
    u.repathTimer -= dt;
    const target = this.wanted.hasVisual || this.wanted.level >= 2 ? playerPos : new THREE.Vector3(this.wanted.lastSeenPos.x, 0, this.wanted.lastSeenPos.z);
    const d = Math.hypot(v.pos.x - target.x, v.pos.z - target.z);

    if (u.repathTimer <= 0 || u.route.length < 2) {
      u.repathTimer = d < 60 ? 0.7 : 2.2;
      const from = this.graph.nearestNode(v.pos.x, v.pos.z);
      const to = this.graph.nearestNode(target.x, target.z);
      u.route = this.graph.astar(from, to);
      u.segIdx = 0;
      u.t = 0;
    }

    const speedCap = u.role === 'interceptor' ? 62 : 46;
    let targetSpeed = Math.min(speedCap, v.topSpeed * 0.96);
    if (d < 45) targetSpeed = Math.min(targetSpeed, 30 + d);

    if (u.segIdx >= u.route.length - 1 || d < 26) {
      const fwd = new THREE.Vector3(target.x - v.pos.x, 0, target.z - v.pos.z).normalize();
      v.yaw = Math.atan2(fwd.x, fwd.z);
      const sp = Math.min(targetSpeed, v.vel.length() + 22 * dt);
      v.vel.set(fwd.x * sp, 0, fwd.z * sp);
    } else {
      const n0 = this.graph.nodes[u.route[u.segIdx]];
      const n1 = this.graph.nodes[u.route[u.segIdx + 1]];
      const edge = n0.adj.find((a) => a.to === n1.id)?.edge;
      if (edge === undefined) {
        u.repathTimer = 0;
      } else {
        const e = this.graph.edges[edge];
        const p = this.graph.pointOnEdge(edge, u.t, 1);
        const desiredYaw = Math.atan2(p.dx, p.dz);
        let dy = desiredYaw - v.yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        const steer = clamp(dy * 2.2, -1, 1);
        const sp = Math.min(targetSpeed, v.vel.length() + 20 * dt);
        const fwd = v.heading();
        v.yaw += steer * clamp(sp / 10, 0, 1) * 2.4 * dt;
        const fwd2 = v.heading();
        v.vel.set(fwd2.x * sp * (1 - Math.abs(dy) * 0.25), 0, fwd2.z * sp * (1 - Math.abs(dy) * 0.25));
        u.t += (sp * dt) / e.len;
        if (u.t >= 1) {
          u.t = 0;
          u.segIdx++;
        }
        void fwd;
      }
    }

    v.pos.x += v.vel.x * dt;
    v.pos.z += v.vel.z * dt;
    v.pos.y = heightAt(v.pos.x, v.pos.z) + v.def.groundClearance;
    for (const c of this.world.colliders) {
      if (v.pos.x + 2 < c.min.x || v.pos.x - 2 > c.max.x || v.pos.z + 2 < c.min.z || v.pos.z - 2 > c.max.z) continue;
      if (c.min.y > v.pos.y + 1 || c.max.y < v.pos.y) continue;
      v.pos.x += v.vel.x * -dt * 2;
      v.pos.z += v.vel.z * -dt * 2;
      v.vel.multiplyScalar(0.3);
    }
    v.syncMesh(dt);
    v.updatePoliceLights(timeSec);
  }

  private officerFireTimers: number[] = [];

  private updateOfficers(dt: number, playerPos: THREE.Vector3, playerInVehicle: boolean, playerSpeed: number, player?: Player): void {
    if (this.wanted.level >= 1 && !playerInVehicle && this.units.length > 0) {
      const nearUnit = this.units.find((u) => !u.v.destroyed && Math.hypot(u.v.pos.x - playerPos.x, u.v.pos.z - playerPos.z) < 30);
      if (nearUnit && this.officers.filter((o) => !o.dead).length < Math.min(2, this.wanted.level)) {
        if (Math.random() < dt * 0.7) {
          const style = { skin: 0xc9a184, hair: 0x2a2018, shirt: 0x1d2733, jacket: 0x1d2733, pants: 0x14181f, shoes: 0x111111, hat: 0 };
          const o = new Pedestrian(this.scene, style);
          o.isOfficer = true;
          o.pos.copy(nearUnit.v.pos);
          o.pos.y = heightAt(o.pos.x, o.pos.z);
          this.officers.push(o);
          this.pedManager.peds.push(o);
        }
      }
    }
    for (let i = this.officers.length - 1; i >= 0; i--) {
      const o = this.officers[i];
      if (o.dead || this.wanted.level === 0) {
        const pi = this.pedManager.peds.indexOf(o);
        if (pi >= 0) this.pedManager.peds.splice(pi, 1);
        o.dispose(this.scene);
        this.officers.splice(i, 1);
        continue;
      }
      const dx = playerPos.x - o.pos.x;
      const dz = playerPos.z - o.pos.z;
      const d = Math.hypot(dx, dz);
      const fi = this.officers.indexOf(o);
      this.officerFireTimers[fi] = (this.officerFireTimers[fi] ?? 1.5) - dt;
      if (player && d < 55 && this.officerFireTimers[fi] <= 0 && !playerInVehicle) {
        this.officerFireTimers[fi] = 1.4 + Math.random() * 1.1;
        if (!losBlocked(o.pos.x, o.pos.y + 1.4, o.pos.z, playerPos.x, playerPos.y + 1.3, playerPos.z, this.world.losColliders)) {
          this.events.emit('WEAPON_FIRED', { weapon: 'meridian_p9', position: { x: o.pos.x, y: o.pos.y + 1.4, z: o.pos.z } });
          const acc = clamp(0.5 - d / 140, 0.06, 0.5);
          if (Math.random() < acc) player.damage(7 + Math.random() * 7, 'officer_shot');
        }
      }
      if (d > 2.2 && !playerInVehicle) {
        o.pos.x += (dx / d) * 3.4 * dt;
        o.pos.z += (dz / d) * 3.4 * dt;
        o.pos.y = heightAt(o.pos.x, o.pos.z);
        o.yaw = Math.atan2(dx, dz);
        o.state = 'walk';
        o.animT += dt * 1.4;
        animateCharacter(o.parts, 'walk', 3.4, o.animT, 0, dt);
        o.group.position.copy(o.pos);
        o.group.rotation.y = o.yaw;
      }
    }
    void playerSpeed;
  }

  roadblockPositions(playerPos: THREE.Vector3): THREE.Vector3[] {
    const node = this.graph.nearestNode(playerPos.x, playerPos.z);
    const route = this.graph.astar(node, this.graph.nearestNode(this.wanted.lastSeenPos.x || playerPos.x, this.wanted.lastSeenPos.z || playerPos.z));
    const out: THREE.Vector3[] = [];
    for (let i = 2; i < Math.min(route.length, 6); i++) {
      const n = this.graph.nodes[route[i]];
      const d = Math.hypot(n.x - playerPos.x, n.z - playerPos.z);
      if (d > 90 && d < 260) out.push(new THREE.Vector3(n.x, heightAt(n.x, n.z), n.z));
    }
    return out.slice(0, 2);
  }

  clear(): void {
    this.clearRoadblock();
    for (const u of this.units) u.v.dispose(this.scene);
    this.units = [];
    for (const o of this.officers) {
      const pi = this.pedManager.peds.indexOf(o);
      if (pi >= 0) this.pedManager.peds.splice(pi, 1);
      o.dispose(this.scene);
    }
    this.officers = [];
    this.heli.active = false;
    this.heli.mesh.visible = false;
    this.wanted.reset();
  }
}


