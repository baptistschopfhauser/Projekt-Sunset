import * as THREE from 'three';
import { ECONOMY, districtAt } from '../core/config.ts';
import { losBlocked, clamp } from '../core/math.ts';
import { heightAt } from '../world/terrain.ts';
import type { World } from '../world/city.ts';
import type { EventBus } from '../core/events.ts';
import type { Economy } from '../economy/economy.ts';
import type { Player } from '../player/player.ts';
import { Pedestrian, type PedestrianManager } from '../pedestrians/pedestrianManager.ts';
import { Vehicle } from '../vehicles/vehicle.ts';
import { VEHICLES } from '../core/config.ts';
import type { VehicleManager } from '../vehicles/vehicleManager.ts';
import type { PoliceManager } from '../police/policeManager.ts';
import type { MissionSaveState } from '../core/types.ts';

export type MissionStage =
  | 'NOT_STARTED'
  | 'MEET_MARCUS'
  | 'RECONNAISSANCE'
  | 'GETAWAY_VEHICLE'
  | 'RENDEZVOUS'
  | 'WAIT_FOR_TRANSPORT'
  | 'AMBUSH'
  | 'SECURE_CARGO'
  | 'ESCAPE_DOCKS'
  | 'LOSE_POLICE'
  | 'DELIVER_CARGO'
  | 'MISSION_COMPLETE'
  | 'MISSION_FAILED';

const STAGE_LABELS: Record<MissionStage, string> = {
  NOT_STARTED: '',
  MEET_MARCUS: 'Triff Marcus an Pier 17',
  RECONNAISSANCE: 'Erkunde das Freight Depot (3 Beobachtungspunkte)',
  GETAWAY_VEHICLE: 'Besorg ein schnelles Fluchtfahrzeug und park es am Treffpunkt in Iron Docks',
  RENDEZVOUS: 'Begib dich zur markierten Position',
  WAIT_FOR_TRANSPORT: 'Warte auf den Transport',
  AMBUSH: 'Sichere den Transport (Neutralisiere die Wachen)',
  SECURE_CARGO: 'Nimm die Fracht am Transporter auf (E halten)',
  ESCAPE_DOCKS: 'Entkomme aus dem Hafengebiet',
  LOSE_POLICE: 'Schüttle die Polizei ab',
  DELIVER_CARGO: 'Bring Fahrzeug und Fracht zur Garage in Westhaven',
  MISSION_COMPLETE: 'Mission abgeschlossen',
  MISSION_FAILED: 'Mission fehlgeschlagen',
};

const DIALOG_MEET: { speaker: string; text: string }[] = [
  { speaker: 'Marcus', text: 'Du bist Alex, richtig? Ich hab gehört, du kannst fahren.' },
  { speaker: 'Alex', text: 'Kommt drauf an, wer fragt.' },
  { speaker: 'Marcus', text: 'Jemand, der gerade eine ziemlich gute Gelegenheit gefunden hat.' },
  { speaker: 'Alex', text: 'Was für eine Gelegenheit?' },
  { speaker: 'Marcus', text: 'Ein Transport. Viel Geld. Wenig Zeit.' },
  { speaker: 'Alex', text: 'Das klingt nach dem Teil, den du mir verschweigst.' },
  { speaker: 'Marcus', text: 'Der Teil kommt, sobald wir vorbereitet sind.' },
];

const DIALOG_RENDEZVOUS: { speaker: string; text: string }[] = [
  { speaker: 'Marcus', text: 'Gut. Jetzt haben wir wenigstens eine Chance, hier lebend rauszukommen.' },
  { speaker: 'Alex', text: 'Du hast ein unglaubliches Talent, Leute zu beruhigen.' },
  { speaker: 'Marcus', text: 'Gewöhn dich dran.' },
];

const DIALOG_DELIVER: { speaker: string; text: string }[] = [
  { speaker: 'Marcus', text: 'Du hast es tatsächlich geschafft.' },
  { speaker: 'Alex', text: 'Dein Optimismus ist wirklich inspirierend.' },
  { speaker: 'Marcus', text: 'Ich hab dir doch gesagt, das lohnt sich.' },
  { speaker: 'Alex', text: 'Beim nächsten Mal sagst du mir vorher, wie viele Polizeiautos dazugehören.' },
  { speaker: 'Marcus', text: 'Beim nächsten Mal? Gefällt mir.' },
];

export class MissionManager {
  stage: MissionStage = 'NOT_STARTED';
  world: World;
  events: EventBus;
  economy: Economy;
  scene: THREE.Scene;
  pedManager: PedestrianManager;
  vehicleManager: VehicleManager;
  police: PoliceManager;
  private marcus: Pedestrian | null = null;
  private truck: Vehicle | null = null;
  private guards: Pedestrian[] = [];
  private reconCount = 0;
  private reconDone = new Set<number>();
  private cargoTimer = 0;
  private cargoSecured = false;
  private completed = false;
  private truckRoute: THREE.Vector3[] = [];
  private truckProgress = 0;
  private truckStopped = false;
  private guardFireTimers: number[] = [];
  private checkpointStage: MissionStage = 'MEET_MARCUS';
  private unsubs: (() => void)[] = [];

  constructor(scene: THREE.Scene, world: World, events: EventBus, economy: Economy, pedManager: PedestrianManager, vehicleManager: VehicleManager, police: PoliceManager) {
    this.scene = scene;
    this.world = world;
    this.events = events;
    this.economy = economy;
    this.pedManager = pedManager;
    this.vehicleManager = vehicleManager;
    this.police = police;
    this.unsubs.push(events.on('POLICE_SEARCH_ENDED', () => {
      if (this.stage === 'LOSE_POLICE') this.setStage('DELIVER_CARGO');
    }));
    this.unsubs.push(events.on('PLAYER_DIED', () => {
      if (this.stage !== 'NOT_STARTED' && this.stage !== 'MISSION_COMPLETE' && this.stage !== 'MISSION_FAILED') {
        this.failToCheckpoint();
      }
    }));
  }

  startMission(): void {
    if (this.stage !== 'NOT_STARTED') return;
    this.setStage('MEET_MARCUS');
    this.events.emit('MISSION_STARTED', { id: 'harbor_job' });
    this.events.emit('NOTIFICATION', { text: 'Neue Nachricht von Marcus (H öffnen)', kind: 'mission' });
    this.spawnMarcus(this.world.poiSet.missionPoints.pier17);
  }

  private spawnMarcus(at: THREE.Vector3): void {
    this.removeMarcus();
    const style = { skin: 0x8d5a3b, hair: 0x111111, shirt: 0x37474f, jacket: 0x2a2018, pants: 0x1c1c1c, shoes: 0x222222, hat: 0 };
    this.marcus = new Pedestrian(this.scene, style);
    this.marcus.pos.set(at.x + 2, heightAt(at.x + 2, at.z), at.z + 2);
    this.marcus.state = 'idle';
    this.pedManager.peds.push(this.marcus);
  }

  private removeMarcus(): void {
    if (this.marcus) {
      const i = this.pedManager.peds.indexOf(this.marcus);
      if (i >= 0) this.pedManager.peds.splice(i, 1);
      this.marcus.dispose(this.scene);
      this.marcus = null;
    }
  }

  private setStage(s: MissionStage): void {
    this.stage = s;
    this.checkpointStage = ['RECONNAISSANCE', 'GETAWAY_VEHICLE', 'AMBUSH', 'SECURE_CARGO', 'ESCAPE_DOCKS', 'LOSE_POLICE'].includes(s) ? s : this.checkpointStage;
    this.events.emit('MISSION_STAGE_CHANGED', { id: 'harbor_job', stage: s });
    this.events.emit('MISSION_MARKER', { position: this.markerPos(), label: STAGE_LABELS[s] });
    this.events.emit('NOTIFICATION', { text: `THE HARBOR JOB: ${STAGE_LABELS[s]}`, kind: 'mission' });
  }

  markerLabel(): string {
    return STAGE_LABELS[this.stage] ?? '';
  }

  markerPos(): { x: number; y: number; z: number } | null {
    const mp = this.world.poiSet.missionPoints;
    switch (this.stage) {
      case 'MEET_MARCUS':
        return mp.pier17;
      case 'RECONNAISSANCE':
        return this.reconTarget();
      case 'GETAWAY_VEHICLE':
        return mp.rendezvous;
      case 'RENDEZVOUS':
        return mp.rendezvous;
      case 'WAIT_FOR_TRANSPORT':
        return mp.ambush;
      case 'AMBUSH':
        return mp.ambush;
      case 'SECURE_CARGO':
        return this.truck ? { x: this.truck.pos.x, y: this.truck.pos.y, z: this.truck.pos.z } : mp.ambush;
      case 'ESCAPE_DOCKS':
        return null;
      case 'LOSE_POLICE':
        return null;
      case 'DELIVER_CARGO':
        return mp.deliveryGarage;
      default:
        return null;
    }
  }

  private reconTarget(): { x: number; y: number; z: number } {
    const mp = this.world.poiSet.missionPoints;
    const pts = [mp.recon1, mp.recon2, mp.recon3];
    for (let i = 0; i < 3; i++) if (!this.reconDone.has(i)) return { x: pts[i].x, y: pts[i].y, z: pts[i].z };
    return { x: mp.depot.x, y: mp.depot.y, z: mp.depot.z };
  }

  interactLabel(playerPos: THREE.Vector3, playerVehicle: Vehicle | null): string | null {
    const mp = this.world.poiSet.missionPoints;
    switch (this.stage) {
      case 'MEET_MARCUS':
        if (mp.pier17.distanceTo(playerPos) < 4) return 'E - MIT MARCUS SPRECHEN';
        return null;
      case 'RECONNAISSANCE': {
        const t = this.reconTargetVec();
        if (t && t.distanceTo(playerPos) < 4) return 'E - BEOBACHTUNGSPUNKT SICHTEN';
        return null;
      }
      case 'GETAWAY_VEHICLE':
      case 'RENDEZVOUS':
        if (playerVehicle && mp.rendezvous.distanceTo(playerVehicle.pos) < 10 && playerVehicle.speed < 1) return 'E - FAHRZEUG ABSTELLEN';
        return null;
      case 'SECURE_CARGO':
        if (this.truck && !this.cargoSecured && this.truck.pos.distanceTo(playerPos) < 4) return 'E - FRACHT AUFNEHMEN (halten)';
        return null;
      case 'DELIVER_CARGO':
        if (this.cargoSecured && mp.deliveryGarage.distanceTo(playerPos) < 8) return 'E - FRACHT ABGEBEN';
        return null;
      default:
        return null;
    }
  }

  private reconTargetVec(): THREE.Vector3 | null {
    const mp = this.world.poiSet.missionPoints;
    const pts = [mp.recon1, mp.recon2, mp.recon3];
    for (let i = 0; i < 3; i++) if (!this.reconDone.has(i)) return pts[i];
    return null;
  }

  interact(playerPos: THREE.Vector3, playerVehicle: Vehicle | null): void {
    const mp = this.world.poiSet.missionPoints;
    switch (this.stage) {
      case 'MEET_MARCUS':
        if (mp.pier17.distanceTo(playerPos) < 4) {
          this.events.emit('DIALOG_STARTED', { lines: DIALOG_MEET, onDone: () => this.setStage('RECONNAISSANCE') });
        }
        break;
      case 'RECONNAISSANCE': {
        const t = this.reconTargetVec();
        if (t && t.distanceTo(playerPos) < 4) {
          for (let i = 0; i < 3; i++) {
            const pts = [mp.recon1, mp.recon2, mp.recon3];
            if (!this.reconDone.has(i) && pts[i].distanceTo(playerPos) < 4) this.reconDone.add(i);
          }
          this.reconCount = this.reconDone.size;
          if (this.reconCount >= 3) {
            this.events.emit('NOTIFICATION', { text: 'Erkundung abgeschlossen. Marcus meldet sich.', kind: 'mission' });
            this.setStage('GETAWAY_VEHICLE');
          } else {
            this.events.emit('NOTIFICATION', { text: `Beobachtung ${this.reconCount}/3 abgeschlossen`, kind: 'mission' });
            this.events.emit('MISSION_MARKER', { position: this.markerPos(), label: STAGE_LABELS.RECONNAISSANCE });
          }
        }
        break;
      }
      case 'GETAWAY_VEHICLE':
      case 'RENDEZVOUS':
        if (playerVehicle && mp.rendezvous.distanceTo(playerVehicle.pos) < 10 && playerVehicle.speed < 1) {
          if (this.stage === 'GETAWAY_VEHICLE') {
            this.events.emit('NOTIFICATION', { text: 'Fluchtfahrzeug bereit.', kind: 'mission' });
            this.spawnMarcus(mp.rendezvous);
            this.events.emit('DIALOG_STARTED', { lines: DIALOG_RENDEZVOUS, onDone: () => this.setStage('WAIT_FOR_TRANSPORT') });
          } else {
            this.setStage('WAIT_FOR_TRANSPORT');
          }
        }
        break;
      case 'SECURE_CARGO':
        break;
      case 'DELIVER_CARGO':
        if (this.cargoSecured && mp.deliveryGarage.distanceTo(playerPos) < 8) {
          this.events.emit('DIALOG_STARTED', {
            lines: DIALOG_DELIVER,
            onDone: () => {
              this.completed = true;
              this.economy.earn(ECONOMY.missionReward, 'THE HARBOR JOB abgeschlossen');
              this.events.emit('MISSION_COMPLETED', { id: 'harbor_job', reward: ECONOMY.missionReward });
              this.events.emit('NOTIFICATION', { text: `THE HARBOR JOB COMPLETED +${ECONOMY.missionReward} $`, kind: 'money' });
              this.setStage('MISSION_COMPLETE');
              this.removeMarcus();
            },
          });
          this.spawnMarcus(mp.deliveryGarage);
        }
        break;
      default:
        break;
    }
  }

  update(dt: number, playerPos: THREE.Vector3, playerVehicle: Vehicle | null, player: Player, timeSec: number): void {
    if (this.stage === 'NOT_STARTED' || this.stage === 'MISSION_COMPLETE' || this.stage === 'MISSION_FAILED') return;
    const mp = this.world.poiSet.missionPoints;

    if (this.stage === 'WAIT_FOR_TRANSPORT') {
      this.updateTruck(dt);
      if (this.truckStopped) {
        this.spawnGuards();
        this.setStage('AMBUSH');
      }
    }
    if (this.stage === 'AMBUSH') {
      this.updateGuards(dt, playerPos, player, timeSec);
      if (this.guards.every((g) => g.dead)) {
        this.events.emit('NOTIFICATION', { text: 'Bereich gesichert.', kind: 'mission' });
        this.setStage('SECURE_CARGO');
      }
    }
    if (this.stage === 'SECURE_CARGO' && this.truck && !this.cargoSecured) {
      if (this.truck.pos.distanceTo(playerPos) < 4) {
        this.cargoTimer += dt;
        if (this.cargoTimer >= 3) {
          this.cargoSecured = true;
          this.events.emit('CRIME_COMMITTED', { type: 'mission_robbery', severity: 50, position: { x: this.truck.pos.x, y: this.truck.pos.y, z: this.truck.pos.z } });
          this.events.emit('NOTIFICATION', { text: 'Ladung gesichert! Polizei alarmiert.', kind: 'warning' });
          this.setStage('ESCAPE_DOCKS');
        }
      } else {
        this.cargoTimer = 0;
      }
    }
    if (this.stage === 'ESCAPE_DOCKS') {
      if (districtAt(playerPos.x, playerPos.z) !== 'iron_docks') this.setStage('LOSE_POLICE');
    }
  }

  private updateTruck(dt: number): void {
    if (!this.truck) {
      const route = this.world.graph.routeTo(-1500, 1000, -760, 1306);
      this.truckRoute = route.points.map((p) => new THREE.Vector3(p.x, heightAt(p.x, p.z), p.z));
      this.truck = new Vehicle(VEHICLES.titan_cargo, 0x8a8f98, this.events, this.scene);
      this.truck.setPosition(-1500, 1000, 0);
      this.vehicleManager.vehicles.push(this.truck);
      this.truckProgress = 0;
    }
    if (this.truckStopped || !this.truck) return;
    const target = this.truckRoute[Math.min(this.truckProgress + 1, this.truckRoute.length - 1)];
    const dx = target.x - this.truck.pos.x;
    const dz = target.z - this.truck.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 10) {
      this.truckProgress++;
      if (this.truckProgress >= this.truckRoute.length - 1) {
        this.truckStopped = true;
        this.truck.vel.set(0, 0, 0);
        return;
      }
    } else {
      const yaw = Math.atan2(dx, dz);
      this.truck.yaw = yaw;
      const speed = 12;
      this.truck.pos.x += Math.sin(yaw) * speed * dt;
      this.truck.pos.z += Math.cos(yaw) * speed * dt;
      this.truck.pos.y = heightAt(this.truck.pos.x, this.truck.pos.z) + this.truck.def.groundClearance;
      this.truck.syncMesh(dt);
    }
  }

  private spawnGuards(): void {
    const mp = this.world.poiSet.missionPoints;
    const coverPts = [mp.recon1, mp.recon2, new THREE.Vector3(mp.ambush.x + 15, 0, mp.ambush.z + 10)];
    for (let i = 0; i < 3; i++) {
      const style = { skin: 0xc9a184, hair: 0x2a2018, shirt: 0x14181f, jacket: 0x14181f, pants: 0x14181f, shoes: 0x111111, hat: 0 };
      const g = new Pedestrian(this.scene, style);
      const c = coverPts[i % coverPts.length];
      g.pos.set(c.x, heightAt(c.x, c.z), c.z);
      g.health = 80;
      g.isGuard = true;
      this.guards.push(g);
      this.guardFireTimers.push(1 + Math.random() * 2);
      this.pedManager.peds.push(g);
    }
  }

  private updateGuards(dt: number, playerPos: THREE.Vector3, player: Player, timeSec: number): void {
    const mp = this.world.poiSet.missionPoints;
    for (let i = 0; i < this.guards.length; i++) {
      const g = this.guards[i];
      if (g.dead) continue;
      this.guardFireTimers[i] -= dt;
      const d = g.pos.distanceTo(playerPos);
      const cover = [mp.recon1, mp.recon2, mp.ambush];
      const c = cover[i % cover.length];
      if (d > 30 && g.pos.distanceTo(c) > 4) {
        const dx = c.x - g.pos.x;
        const dz = c.z - g.pos.z;
        const dd = Math.hypot(dx, dz) || 1;
        g.pos.x += (dx / dd) * 2.6 * dt;
        g.pos.z += (dz / dd) * 2.6 * dt;
        g.pos.y = heightAt(g.pos.x, g.pos.z);
        g.yaw = Math.atan2(dx, dz);
        g.animT += dt;
        g.group.position.copy(g.pos);
        g.group.rotation.y = g.yaw;
      }
      if (this.guardFireTimers[i] <= 0) {
        this.guardFireTimers[i] = 1.6 + Math.random() * 1.2;
        if (d < 70 && !losBlocked(g.pos.x, g.pos.y + 1.4, g.pos.z, playerPos.x, playerPos.y + 1.3, playerPos.z, this.world.losColliders)) {
          this.events.emit('WEAPON_FIRED', { weapon: 'ar56_sentinel', position: { x: g.pos.x, y: g.pos.y + 1.4, z: g.pos.z } });
          const acc = clamp(0.55 - d / 160, 0.08, 0.55);
          if (Math.random() < acc) player.damage(9 + Math.random() * 8, 'guard_shot');
        }
      }
    }
    void timeSec;
  }

  private failToCheckpoint(): void {
    const stage = this.checkpointStage;
    this.cargoSecured = stage !== 'SECURE_CARGO' && stage !== 'ESCAPE_DOCKS' && stage !== 'LOSE_POLICE' ? false : this.cargoSecured;
    this.cargoTimer = 0;
    for (const g of this.guards) {
      const i = this.pedManager.peds.indexOf(g);
      if (i >= 0) this.pedManager.peds.splice(i, 1);
      g.dispose(this.scene);
    }
    this.guards = [];
    if (this.truck) {
      const vi = this.vehicleManager.vehicles.indexOf(this.truck);
      if (vi >= 0) this.vehicleManager.vehicles.splice(vi, 1);
      this.truck.dispose(this.scene);
      this.truck = null;
      this.truckStopped = false;
      this.truckProgress = 0;
    }
    this.police.wanted.reset();
    this.events.emit('MISSION_FAILED', { id: 'harbor_job', reason: 'checkpoint' });
    this.setStage(stage);
  }

  serialize(): MissionSaveState {
    return { id: this.stage === 'NOT_STARTED' ? null : 'harbor_job', stage: this.stage, checkpoints: [this.checkpointStage], cargoSecured: this.cargoSecured, completed: this.completed };
  }

  restore(s: MissionSaveState): void {
    if (!s.id) {
      this.stage = 'NOT_STARTED';
      return;
    }
    this.stage = s.stage as MissionStage;
    this.cargoSecured = s.cargoSecured;
    this.completed = s.completed;
    if (this.stage === 'MEET_MARCUS') this.spawnMarcus(this.world.poiSet.missionPoints.pier17);
    if (this.stage === 'LOSE_POLICE' || this.stage === 'DELIVER_CARGO') this.cargoSecured = true;
  }
}
