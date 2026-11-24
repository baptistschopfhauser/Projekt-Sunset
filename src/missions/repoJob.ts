import * as THREE from 'three';
import { heightAt } from '../world/terrain.ts';
import type { World } from '../world/city.ts';
import type { EventBus } from '../core/events.ts';
import type { Economy } from '../economy/economy.ts';
import type { VehicleManager } from '../vehicles/vehicleManager.ts';
import type { Vehicle } from '../vehicles/vehicle.ts';
import type { Player } from '../player/player.ts';

export type RepoStage = 'idle' | 'pickup' | 'deliver' | 'done';

const START = new THREE.Vector3(-1330, 0, 285);
const CAR_SPAWN = { x: -1310, z: 290 };
const DELIVER_ZONE = { x: -1140, z: 132, r: 12 };

export class RepoJob {
  stage: RepoStage = 'idle';
  car: Vehicle | null = null;
  scene: THREE.Scene;
  world: World;
  events: EventBus;
  economy: Economy;
  vehicles: VehicleManager;

  constructor(scene: THREE.Scene, world: World, events: EventBus, economy: Economy, vehicles: VehicleManager) {
    this.scene = scene;
    this.world = world;
    this.events = events;
    this.economy = economy;
    this.vehicles = vehicles;
  }

  markerPos(): THREE.Vector3 | null {
    if (this.stage === 'idle') return new THREE.Vector3(START.x, heightAt(START.x, START.z), START.z);
    if (this.stage === 'pickup' && this.car) return this.car.pos.clone();
    if (this.stage === 'deliver') return new THREE.Vector3(DELIVER_ZONE.x, heightAt(DELIVER_ZONE.x, DELIVER_ZONE.z), DELIVER_ZONE.z);
    return null;
  }

  interactLabel(pos: THREE.Vector3, playerVehicle: Vehicle | null): string | null {
    if (this.stage === 'idle') {
      const p = new THREE.Vector3(START.x, heightAt(START.x, START.z), START.z);
      if (p.distanceTo(pos) < 5) return 'E - REPO-AUFTRAG ANNEHMEN (Westhaven Motors)';
      return null;
    }
    if (this.stage === 'pickup' && this.car && this.car.pos.distanceTo(pos) < 4 && !playerVehicle) return 'E - FAHRZEUG ANHÄNGEN';
    return null;
  }

  interact(pos: THREE.Vector3, playerVehicle: Vehicle | null): void {
    if (this.stage === 'idle') {
      const p = new THREE.Vector3(START.x, heightAt(START.x, START.z), START.z);
      if (p.distanceTo(pos) < 5) {
        this.stage = 'pickup';
        this.car = this.vehicles.spawnVehicle('alden_crest', CAR_SPAWN.x, CAR_SPAWN.z, Math.PI / 2, 0x3d4b5c);
        this.events.emit('NOTIFICATION', { text: 'Repo: Hänge das markierte Fahrzeug an und bring es zur AutoFix-Werkstatt.', kind: 'mission' });
        this.events.emit('MISSION_STAGE_CHANGED', { id: 'repo_job', stage: 'pickup' });
      }
      return;
    }
    if (this.stage === 'pickup' && this.car && this.car.pos.distanceTo(pos) < 4 && !playerVehicle) {
      this.stage = 'deliver';
      this.events.emit('NOTIFICATION', { text: 'Fahrzeug angehängt. Ziel: AutoFix-Zone in Westhaven.', kind: 'mission' });
      this.events.emit('MISSION_STAGE_CHANGED', { id: 'repo_job', stage: 'deliver' });
    }
  }

  update(dt: number, playerPos: THREE.Vector3, playerVehicle: Vehicle | null, player: Player): void {
    void dt;
    void player;
    if (this.stage === 'pickup' || this.stage === 'deliver') {
      if (!this.car || this.car.destroyed) {
        if (this.car && this.car.destroyed) {
          this.events.emit('NOTIFICATION', { text: 'Repo-Auto zerstört - Auftrag fehlgeschlagen.', kind: 'warning' });
          if (this.car) this.vehicles.remove(this.car);
          this.car = null;
          this.stage = 'idle';
        }
        return;
      }
    }
    if (this.stage === 'deliver' && this.car) {
      const d = Math.hypot(this.car.pos.x - DELIVER_ZONE.x, this.car.pos.z - DELIVER_ZONE.z);
      if (d < DELIVER_ZONE.r && this.car.speed < 1 && playerVehicle === this.car) {
        this.stage = 'done';
        this.economy.earn(600, 'Repo-Auftrag abgeschlossen');
        this.events.emit('NOTIFICATION', { text: '+600 $ Repo-Auftrag erledigt!', kind: 'money' });
        this.events.emit('ACTIVITY_COMPLETED', { id: 'repo_job', kind: 'delivery', reward: 600 });
        this.events.emit('MISSION_STAGE_CHANGED', { id: 'repo_job', stage: 'done' });
        setTimeout(() => {
          if (this.car) {
            this.vehicles.remove(this.car);
            this.car = null;
          }
          this.stage = 'idle';
        }, 4000);
      }
    }
    void playerPos;
  }

  serialize(): RepoStage {
    return this.stage === 'deliver' ? 'idle' : this.stage;
  }

  restore(stage: string): void {
    if (stage === 'pickup' || stage === 'deliver') {
      this.stage = 'pickup';
      if (!this.car) this.car = this.vehicles.spawnVehicle('alden_crest', CAR_SPAWN.x, CAR_SPAWN.z, Math.PI / 2, 0x3d4b5c);
    } else {
      this.stage = 'idle';
      if (this.car) {
        this.vehicles.remove(this.car);
        this.car = null;
      }
    }
  }
}
