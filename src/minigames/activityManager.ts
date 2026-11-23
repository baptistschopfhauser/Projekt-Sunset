import * as THREE from 'three';
import { ECONOMY, type QualityLevel } from '../core/config.ts';
import { clamp } from '../core/math.ts';
import { heightAt } from '../world/terrain.ts';
import type { RoadGraph } from '../world/roads.ts';
import type { World } from '../world/city.ts';
import type { EventBus } from '../core/events.ts';
import type { Economy } from '../economy/economy.ts';
import { Vehicle, type VehicleInput } from '../vehicles/vehicle.ts';
import { VEHICLES } from '../core/config.ts';
import { globalRng } from '../core/rng.ts';
import { BilliardsSession } from './billiards3d.ts';

type ActivityKind = 'race' | 'delivery' | 'taxi' | 'darts' | 'basketball' | 'billiards';

interface RaceState {
  kind: 'race';
  routeId: string;
  checkpoints: THREE.Vector3[];
  playerCp: number;
  opponents: { v: Vehicle; cp: number; finished: boolean; finishTime: number }[];
  countdown: number;
  started: boolean;
  time: number;
  finished: boolean;
}

interface DeliveryState {
  kind: 'delivery';
  jobId: string;
  target: THREE.Vector3;
  timeLeft: number;
  reward: number;
}

interface TaxiState {
  kind: 'taxi';
  phase: 'toPickup' | 'toDropoff';
  pickup: THREE.Vector3;
  dropoff: THREE.Vector3;
  passengerVisible: boolean;
}

interface DartsState {
  kind: 'darts';
  playerScore: number;
  aiScore: number;
  turn: 'player' | 'ai';
  dartsThrown: number;
  entryPaid: boolean;
  aiming: boolean;
  charge: number;
  crossX: number;
  crossY: number;
  lastThrows: { x: number; y: number; value: number }[];
  aiPending: number;
  done: boolean;
  wasDown: boolean;
  turnStartScore: number;
}

interface BasketballState {
  kind: 'basketball';
  timeLeft: number;
  score: number;
  aiming: boolean;
  charge: number;
  ball: THREE.Mesh | null;
  ballVel: THREE.Vector3;
  ballActive: boolean;
  done: boolean;
}

interface BilliardsState {
  kind: 'billiards';
  session: BilliardsSession;
  entryPaid: boolean;
}

export type ActivityState = RaceState | DeliveryState | TaxiState | DartsState | BasketballState | BilliardsState;

const TAXI_SPOTS = [
  { x: 200, z: -60 },
  { x: 1150, z: 380 },
  { x: -700, z: -200 },
  { x: -1320, z: 240 },
  { x: 420, z: 130 },
  { x: 950, z: 990 },
  { x: -1150, z: 1310 },
  { x: -900, z: 1375 },
];

export class ActivityManager {
  graph: RoadGraph;
  world: World;
  events: EventBus;
  economy: Economy;
  scene: THREE.Scene;
  active: ActivityState | null = null;
  flags: Record<string, boolean | number> = {};
  private raceRoutes: Record<string, { checkpoints: THREE.Vector3[]; start: THREE.Vector3; name: string; reward: number }> = {};
  private dartAimDir = new THREE.Vector3();

  constructor(scene: THREE.Scene, graph: RoadGraph, world: World, events: EventBus, economy: Economy) {
    this.scene = scene;
    this.graph = graph;
    this.world = world;
    this.events = events;
    this.economy = economy;
    this.buildRaceRoutes();
  }

  private buildRaceRoutes(): void {
    const defs: Record<string, { start: [number, number]; via: [number, number][]; reward: number; name: string }> = {
      coastal_sprint: { start: [1200, -200], via: [[1400, -500], [1350, 300], [1250, 900], [1300, 1200]], reward: 500, name: 'Coastal Sprint' },
      downtown_circuit: { start: [200, 60], via: [[-200, 60], [-200, -400], [300, -400], [500, 100], [200, 60]], reward: 900, name: 'Downtown Circuit' },
      ridge_run: { start: [-1400, -1200], via: [[-1500, -700], [-1100, -400], [-1500, 100], [-1200, -600], [-1400, -1200]], reward: 1500, name: 'Ridge Run' },
    };
    for (const [id, d] of Object.entries(defs)) {
      const pts: { x: number; z: number }[] = [{ x: d.start[0], z: d.start[1] }];
      for (const v of d.via) {
        const r = this.graph.routeTo(pts[pts.length - 1].x, pts[pts.length - 1].z, v[0], v[1]);
        pts.push(...r.points.slice(1));
      }
      const checkpoints: THREE.Vector3[] = [];
      let acc = 0;
      let last = pts[0];
      for (const p of pts) {
        acc += Math.hypot(p.x - last.x, p.z - last.z);
        if (acc > 260) {
          acc = 0;
          checkpoints.push(new THREE.Vector3(p.x, heightAt(p.x, p.z), p.z));
        }
        last = p;
      }
      if (checkpoints.length < 3) checkpoints.push(new THREE.Vector3(d.via[d.via.length - 1][0], 0, d.via[d.via.length - 1][1]));
      this.raceRoutes[id] = { checkpoints, start: new THREE.Vector3(d.start[0], heightAt(d.start[0], d.start[1]), d.start[1]), name: d.name, reward: d.reward };
    }
  }

  raceRouteIds(): string[] {
    return Object.keys(this.raceRoutes);
  }

  startRace(routeId: string, playerVehicle: Vehicle): boolean {
    if (this.active) return false;
    const route = this.raceRoutes[routeId];
    if (!route) return false;
    const opponents: RaceState['opponents'] = [];
    const models = ['alden_crest', 'vexler_gt', 'northstar_trail'];
    for (let i = 0; i < 3; i++) {
      const v = new Vehicle(VEHICLES[models[i]], [0x7a1f2b, 0x14213d, 0x4a5d43][i], this.events, this.scene);
      const off = route.start.clone().add(new THREE.Vector3(-6 + i * 4, 0, 6));
      v.setPosition(off.x, off.z, Math.PI);
      opponents.push({ v, cp: 0, finished: false, finishTime: 0 });
    }
    this.active = { kind: 'race', routeId, checkpoints: route.checkpoints, playerCp: 0, opponents, countdown: 3.2, started: false, time: 0, finished: false };
    this.events.emit('ACTIVITY_STARTED', { id: routeId, kind: 'race' });
    this.events.emit('RACE_STARTED', { route: routeId });
    return true;
  }

  startDelivery(jobId: string): boolean {
    if (this.active) return false;
    const job = ECONOMY.deliveries.find((d) => d.id === jobId);
    if (!job) return false;
    let target: THREE.Vector3 | null = null;
    if (jobId === 'downtown_express') target = this.world.poiSet.missionPoints.office;
    else if (jobId === 'beach_delivery') target = this.world.poiSet.missionPoints.hotel;
    else target = this.world.poiSet.missionPoints.residence;
    if (!target) return false;
    this.active = { kind: 'delivery', jobId, target, timeLeft: 240, reward: job.reward };
    this.events.emit('ACTIVITY_STARTED', { id: jobId, kind: 'delivery' });
    return true;
  }

  startTaxi(): boolean {
    if (this.active) return false;
    const spots = [...TAXI_SPOTS];
    const pickup = globalRng.pick(spots);
    let dropoff = globalRng.pick(spots);
    let guard = 0;
    while (Math.hypot(dropoff.x - pickup.x, dropoff.z - pickup.z) < 300 && guard++ < 10) dropoff = globalRng.pick(spots);
    this.active = {
      kind: 'taxi',
      phase: 'toPickup',
      pickup: new THREE.Vector3(pickup.x, heightAt(pickup.x, pickup.z), pickup.z),
      dropoff: new THREE.Vector3(dropoff.x, heightAt(dropoff.x, dropoff.z), dropoff.z),
      passengerVisible: false,
    };
    this.events.emit('ACTIVITY_STARTED', { id: 'taxi', kind: 'taxi' });
    return true;
  }

  startDarts(entryPaid: boolean): boolean {
    if (this.active) return false;
    if (entryPaid && !this.economy.spend(100, 'Darts entry fee')) return false;
    this.active = { kind: 'darts', playerScore: 301, aiScore: 301, turn: 'player', dartsThrown: 0, entryPaid, aiming: false, charge: 0, crossX: 0, crossY: 0, lastThrows: [], aiPending: 0, done: false, wasDown: false, turnStartScore: 301 };
    this.events.emit('ACTIVITY_STARTED', { id: 'darts', kind: 'darts' });
    return true;
  }

  startBilliards(entryPaid: boolean, tableCenter: THREE.Vector3, tableTopY: number): boolean {
    if (this.active) return false;
    if (entryPaid && !this.economy.spend(150, 'Billard-Einsatz')) return false;
    const session = new BilliardsSession(this.scene, tableCenter, tableTopY, this.events, this.economy, entryPaid);
    this.active = { kind: 'billiards', session, entryPaid };
    this.events.emit('ACTIVITY_STARTED', { id: 'billiards', kind: 'billiards' });
    return true;
  }

  startBasketball(): boolean {
    if (this.active) return false;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), new THREE.MeshStandardMaterial({ color: 0xc96f3b, roughness: 0.7 }));
    ball.visible = false;
    this.scene.add(ball);
    this.active = { kind: 'basketball', timeLeft: 60, score: 0, aiming: false, charge: 0, ball, ballVel: new THREE.Vector3(), ballActive: false, done: false };
    this.events.emit('ACTIVITY_STARTED', { id: 'basketball', kind: 'basketball' });
    return true;
  }

  stopActivity(reason: 'done' | 'abort' = 'done'): void {
    if (!this.active) return;
    if (this.active.kind === 'race') {
      for (const o of this.active.opponents) o.v.dispose(this.scene);
    }
    if (this.active.kind === 'basketball' && this.active.ball) {
      this.scene.remove(this.active.ball);
    }
    if (this.active.kind === 'billiards') this.active.session.dispose();
    this.active = null;
    if (reason === 'done') this.events.emit('ACTIVITY_COMPLETED', { id: '', kind: '', reward: 0 });
  }

  dartScoreAt(x: number, y: number): number {
    const r = Math.hypot(x, y);
    const boardR = 0.55;
    if (r <= 0.0325 * (boardR / 0.225)) return 50;
    if (r <= boardR * 0.145) return 25;
    if (r > boardR) return 0;
    const angle = (Math.atan2(y, x) + Math.PI / 2 + Math.PI) % (Math.PI * 2);
    const seg = Math.floor(angle / (Math.PI / 10)) % 20;
    const SEGMENT_SCORES = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    const base = SEGMENT_SCORES[seg];
    if (r > boardR * 0.92 && r <= boardR) return base * 2;
    if (r > boardR * 0.62 && r <= boardR * 0.72) return base * 3;
    return base;
  }

  throwDart(x: number, y: number, power: number): number {
    const st = this.active;
    if (!st || st.kind !== 'darts' || st.turn !== 'player' || st.done) return 0;
    const spread = (1 - power) * 0.12 + 0.01;
    const px = x + (Math.random() - 0.5) * spread * 2;
    const py = y + (Math.random() - 0.5) * spread * 2;
    const value = this.dartScoreAt(px, py);
    st.playerScore -= value;
    st.lastThrows.push({ x: px, y: py, value });
    st.dartsThrown++;
    if (st.playerScore < 0) {
      st.playerScore = st.turnStartScore;
      st.dartsThrown = 3;
    }
    if (st.playerScore === 0) {
      st.done = true;
      this.finishDarts(true);
    } else if (st.dartsThrown >= 3) {
      st.turn = 'ai';
      st.dartsThrown = 0;
      st.turnStartScore = st.playerScore;
      st.aiPending = 3;
    }
    return value;
  }

  private finishDarts(playerWon: boolean): void {
    const st = this.active;
    if (!st || st.kind !== 'darts') return;
    if (playerWon) {
      if (st.entryPaid) this.economy.earn(200, 'Darts won (entry variant)');
      this.events.emit('NOTIFICATION', { text: st.entryPaid ? 'Darts gewonnen! +200 $' : 'Darts gewonnen!', kind: 'money' });
    } else {
      this.events.emit('NOTIFICATION', { text: 'Darts verloren.', kind: 'warning' });
    }
    this.events.emit('ACTIVITY_COMPLETED', { id: 'darts', kind: 'darts', reward: playerWon && st.entryPaid ? 200 : 0 });
  }

  shootBasketball(dir: THREE.Vector3, power: number): void {
    const st = this.active;
    if (!st || st.kind !== 'basketball' || !st.ball || st.done) return;
    st.ball.visible = true;
    const hoop = this.world.poiSet.courtHoop.pos;
    const start = hoop.clone().add(new THREE.Vector3(6, -2.4, 0));
    st.ball.position.copy(start);
    const g = -22;
    const target = hoop;
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const dz = target.z - start.z;
    const dist = Math.hypot(dx, dy, dz);
    const speed = 4 + power * 9;
    const t = clamp(dist / speed, 0.4, 1.6);
    st.ballVel.set((dx / t), (dy / t) - 0.5 * g * t, dz / t);
    void dir;
    st.ballActive = true;
  }

  update(dt: number, playerPos: THREE.Vector3, playerVehicle: Vehicle | null, input: { mouseDown: (b: 'l') => boolean; wasClicked: (b: 'l') => boolean; mouseDX: number; mouseDY: number } | null, camDir: THREE.Vector3, quality: QualityLevel, getRay?: () => { origin: THREE.Vector3; dir: THREE.Vector3 }): void {
    const a = this.active;
    if (!a) return;
    if (a.kind === 'race') this.updateRace(dt, a, playerPos, playerVehicle);
    else if (a.kind === 'billiards') {
      a.session.update(dt, input, getRay ?? null);
      if (playerPos.distanceTo(a.session.tableCenter) > 14) this.stopActivity('abort');
    }
    else if (a.kind === 'delivery') {
      a.timeLeft -= dt;
      if (playerPos.distanceTo(a.target) < 6) {
        this.economy.earn(a.reward, `Lieferung ${a.jobId}`);
        this.events.emit('NOTIFICATION', { text: `+${a.reward} $ Lieferung abgeschlossen`, kind: 'money' });
        this.events.emit('ACTIVITY_COMPLETED', { id: a.jobId, kind: 'delivery', reward: a.reward });
        this.stopActivity();
      } else if (a.timeLeft <= 0) {
        this.events.emit('NOTIFICATION', { text: 'Lieferung fehlgeschlagen (Zeit abgelaufen)', kind: 'warning' });
        this.stopActivity('abort');
      }
    } else if (a.kind === 'taxi') this.updateTaxi(dt, a, playerPos, playerVehicle);
    else if (a.kind === 'darts') this.updateDarts(dt, a, input);
    else if (a.kind === 'basketball') this.updateBasketball(dt, a, input, camDir, playerPos);
    void quality;
  }

  private updateRace(dt: number, a: RaceState, playerPos: THREE.Vector3, playerVehicle: Vehicle | null): void {
    if (!a.started) {
      a.countdown -= dt;
      if (a.countdown <= 0) {
        a.started = true;
        this.events.emit('NOTIFICATION', { text: 'GO!', kind: 'mission' });
      }
      return;
    }
    a.time += dt;
    const target = a.checkpoints[a.playerCp];
    if (target && playerPos.distanceTo(target) < 14) {
      a.playerCp++;
      if (a.playerCp >= a.checkpoints.length) {
        a.finished = true;
        this.finishRace(a, playerVehicle ? 0 : 0, playerPos);
        return;
      }
    }
    for (const o of a.opponents) {
      if (o.finished) continue;
      const t = a.checkpoints[o.cp];
      if (!t) continue;
      const dx = t.x - o.v.pos.x;
      const dz = t.z - o.v.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 14) {
        o.cp++;
        if (o.cp >= a.checkpoints.length) {
          o.finished = true;
          o.finishTime = a.time;
        }
        continue;
      }
      const yaw = Math.atan2(dx, dz);
      let dy = yaw - o.v.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      o.v.yaw += clamp(dy, -2 * dt, 2 * dt);
      const speed = clamp(18 + 14 * (1 - Math.abs(dy)), 6, 42);
      const fwd = o.v.heading();
      o.v.vel.set(fwd.x * speed, 0, fwd.z * speed);
      o.v.pos.x += o.v.vel.x * dt;
      o.v.pos.z += o.v.vel.z * dt;
      o.v.pos.y = heightAt(o.v.pos.x, o.v.pos.z) + o.v.def.groundClearance;
      o.v.syncMesh(dt);
    }
    if (a.opponents.every((o) => o.finished) && !a.finished) {
      this.finishRace(a, 0, playerPos);
    }
  }

  private finishRace(a: RaceState, _unused: number, playerPos: THREE.Vector3): void {
    const route = this.raceRoutes[a.routeId];
    let rank = 1;
    for (const o of a.opponents) if (o.finished) rank++;
    const won = rank === 1;
    if (won) {
      this.economy.earn(route.reward, `Rennen gewonnen: ${route.name}`);
      this.events.emit('NOTIFICATION', { text: `+${route.reward} $ Rennen gewonnen (Platz 1)`, kind: 'money' });
    } else {
      this.events.emit('NOTIFICATION', { text: `Rennen beendet: Platz ${rank}/4`, kind: 'info' });
    }
    this.events.emit('RACE_FINISHED', { position: rank, reward: won ? route.reward : 0, route: a.routeId });
    this.events.emit('ACTIVITY_COMPLETED', { id: a.routeId, kind: 'race', reward: won ? route.reward : 0 });
    for (const o of a.opponents) o.v.dispose(this.scene);
    this.active = null;
    void playerPos;
  }

  private updateTaxi(dt: number, a: TaxiState, playerPos: THREE.Vector3, playerVehicle: Vehicle | null): void {
    void dt;
    if (!playerVehicle) return;
    const target = a.phase === 'toPickup' ? a.pickup : a.dropoff;
    if (playerVehicle.pos.distanceTo(target) < 10 && playerVehicle.speed < 1) {
      if (a.phase === 'toPickup') {
        a.phase = 'toDropoff';
        a.passengerVisible = true;
        this.events.emit('NOTIFICATION', { text: 'Passagier eingestiegen. Ziel markiert.', kind: 'info' });
      } else {
        const dist = a.pickup.distanceTo(a.dropoff);
        const fare = Math.round(clamp(80 + dist * 0.12, ECONOMY.taxiFares.min, ECONOMY.taxiFares.max));
        this.economy.earn(fare, 'Taxifahrt');
        this.events.emit('NOTIFICATION', { text: `+${fare} $ Taxifahrt`, kind: 'money' });
        this.events.emit('ACTIVITY_COMPLETED', { id: 'taxi', kind: 'taxi', reward: fare });
        this.active = null;
      }
    }
  }

  private updateDarts(dt: number, a: DartsState, input: { mouseDown: (b: 'l') => boolean; wasClicked: (b: 'l') => boolean; mouseDX: number; mouseDY: number } | null): void {
    if (a.done) return;
    if (a.turn === 'player' && input) {
      a.crossX = clamp(a.crossX + input.mouseDX * 0.0012, -0.55, 0.55);
      a.crossY = clamp(a.crossY - input.mouseDY * 0.0012, -0.55, 0.55);
      const down = input.mouseDown('l');
      if (down) {
        a.charge = clamp(a.charge + dt * 1.4, 0, 1);
      } else if (a.wasDown && a.charge > 0.05 && a.dartsThrown < 3) {
        this.throwDart(a.crossX, a.crossY, a.charge);
        a.charge = 0;
      } else if (!down) {
        a.charge = 0;
      }
      a.wasDown = down;
      if (a.turn === 'player' && a.dartsThrown === 0) a.turnStartScore = a.playerScore;
    }
    if (a.turn === 'ai' && a.aiPending > 0) {
      a.aiPending -= dt;
      if (a.aiPending <= 0) {
        a.aiPending = 0;
        const skill = 0.45 + Math.random() * 0.4;
        const prev = a.aiScore;
        const val = Math.round((Math.random() * 60) * skill) + (Math.random() < skill * 0.3 ? 20 : 0);
        a.aiScore -= Math.min(val, a.aiScore);
        if (a.aiScore < 0) a.aiScore = prev;
        if (a.aiScore === 0) {
          a.done = true;
          this.finishDarts(false);
        } else {
          a.turn = 'player';
          a.dartsThrown = 0;
        }
      }
    }
  }

  private updateBasketball(dt: number, a: BasketballState, input: { mouseDown: (b: 'l') => boolean; wasClicked: (b: 'l') => boolean } | null, camDir: THREE.Vector3, playerPos: THREE.Vector3): void {
    void playerPos;
    if (a.done) return;
    a.timeLeft -= dt;
    if (input) {
      if (input.mouseDown('l')) a.charge = clamp(a.charge + dt * 1.2, 0, 1);
      else if (a.charge > 0.05 && !a.ballActive) {
        this.shootBasketball(camDir, a.charge);
        a.charge = 0;
      } else a.charge = 0;
    }
    if (a.ballActive && a.ball) {
      const b = a.ball;
      a.ballVel.y += -22 * dt;
      b.position.addScaledVector(a.ballVel, dt);
      const hoop = this.world.poiSet.courtHoop.pos;
      const prevY = b.position.y - a.ballVel.y * dt;
      if (prevY >= hoop.y && b.position.y < hoop.y) {
        const dx = b.position.x - hoop.x;
        const dz = b.position.z - hoop.z;
        if (Math.hypot(dx, dz) < this.world.poiSet.courtHoop.ringRadius && a.ballVel.y < 0) {
          a.score += 2;
          this.events.emit('NOTIFICATION', { text: `Korb! ${a.score} Punkte`, kind: 'mission' });
        }
      }
      if (b.position.y < heightAt(b.position.x, b.position.z) + 0.24) {
        b.position.y = heightAt(b.position.x, b.position.z) + 0.24;
        a.ballVel.y *= -0.45;
        a.ballVel.x *= 0.7;
        a.ballVel.z *= 0.7;
        if (Math.abs(a.ballVel.y) < 1.2) {
          a.ballActive = false;
          b.visible = false;
        }
      }
    }
    if (a.timeLeft <= 0 && !a.done) {
      a.done = true;
      const passed = a.score >= 20;
      if (passed) {
        if (!this.flags.basketball_first) {
          this.flags.basketball_first = true;
          this.economy.earn(250, 'Basketball Challenge (erster Erfolg)');
          this.events.emit('NOTIFICATION', { text: '+250 $ Basketball-Challenge bestanden!', kind: 'money' });
        } else {
          this.economy.earn(50, 'Basketball Challenge Wiederholung');
          this.events.emit('NOTIFICATION', { text: '+50 $ Basketball-Challenge', kind: 'money' });
        }
      } else {
        this.events.emit('NOTIFICATION', { text: `Basketball: ${a.score}/20 Punkte - nicht bestanden`, kind: 'warning' });
      }
      this.events.emit('ACTIVITY_COMPLETED', { id: 'basketball', kind: 'basketball', reward: passed ? (this.flags.basketball_first ? 250 : 50) : 0 });
      if (a.ball) this.scene.remove(a.ball);
      this.active = null;
    }
  }
}
