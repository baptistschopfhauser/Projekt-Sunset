import * as THREE from 'three';
import { Renderer } from '../rendering/renderer.ts';
import { Sky } from '../rendering/sky.ts';
import { Lighting, sunFromHour } from '../rendering/lighting.ts';
import { buildWorld, type World } from '../world/city.ts';
import { heightAt, isWater, coastX } from '../world/terrain.ts';
import { EventBus } from '../core/events.ts';
import { Input } from '../player/input.ts';
import { CameraRig } from '../player/camera.ts';
import { Player } from '../player/player.ts';
import { VehicleManager } from '../vehicles/vehicleManager.ts';
import type { Vehicle, VehicleInput } from '../vehicles/vehicle.ts';
import { PedestrianManager } from '../pedestrians/pedestrianManager.ts';
import { PoliceManager } from '../police/policeManager.ts';
import { CombatSystem } from '../combat/combat.ts';
import { Economy } from '../economy/economy.ts';
import { ActivityManager } from '../minigames/activityManager.ts';
import { MissionManager } from '../missions/missionManager.ts';
import { TimeSystem } from '../weather/time.ts';
import { WeatherSystem } from '../weather/weather.ts';
import { HUD } from '../ui/hud.ts';
import { Menus } from '../ui/menus.ts';
import { Shops } from '../ui/shops.ts';
import { SaveManager } from '../save/saveManager.ts';
import { AudioManager } from '../audio/audio.ts';
import { el, fmtMoney, clear, show, hide } from '../ui/helpers.ts';
import { PALETTE, QUALITY, ECONOMY, VEHICLES, WEAPONS, districtAt, type QualityLevel, type SaveSlot } from '../core/config.ts';
import type { SaveData, SettingsData, OwnedVehicle, AABBCollider } from '../core/types.ts';
import { DEFAULT_SETTINGS } from '../core/types.ts';
import { clamp, lerp } from '../core/math.ts';

export type GameState = 'BOOTING' | 'MAIN_MENU' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'BUSTED' | 'HOSPITALIZED';

export class Game {
  renderer: Renderer;
  sky: Sky;
  lighting: Lighting;
  world: World;
  events = new EventBus();
  input: Input;
  cam = new CameraRig();
  player: Player;
  vehicles: VehicleManager;
  peds: PedestrianManager;
  police: PoliceManager;
  combat: CombatSystem;
  economy: Economy;
  activities: ActivityManager;
  mission: MissionManager;
  time: TimeSystem;
  weather: WeatherSystem;
  hud: HUD;
  menus: Menus;
  shops: Shops;
  saves = new SaveManager();
  audio: AudioManager;
  settings: SettingsData;
  state: GameState = 'BOOTING';
  uiLock = false;
  gpsTarget: THREE.Vector3 | null = null;
  gpsRoute: { x: number; z: number }[] | null = null;
  messages: { from: string; text: string; time: string; unread: boolean }[] = [];
  playTimeSec = 0;
  private autosaveTimer = 300;
  private fixedAcc = 0;
  private last = 0;
  private menuAngle = 0;
  private inventoryEl: HTMLElement | null = null;
  private cameraModeIdx = 0;
  private footstepTimer = 0;
  private casinoInside = false;
  private simTime = 0;
  private nullInput = new Input();
  private adHocScreen: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.settings = DEFAULT_SETTINGS;
    this.renderer = new Renderer(container);
    this.sky = new Sky(this.renderer.scene);
    this.lighting = new Lighting(this.renderer.scene);
    this.world = buildWorld(this.renderer.scene);
    this.input = new Input();
    this.input.attach(this.renderer.renderer.domElement);
    this.player = new Player(this.renderer.scene, this.events);
    this.vehicles = new VehicleManager(this.renderer.scene, this.world.graph, this.world, this.events);
    this.peds = new PedestrianManager(this.renderer.scene, this.world.graph, this.world, this.events);
    this.police = new PoliceManager(this.renderer.scene, this.world.graph, this.world, this.events, this.peds);
    this.combat = new CombatSystem(this.renderer.scene, this.events);
    this.combat.blockers = this.world.losColliders;
    this.combat.pedManager = this.peds;
    this.economy = new Economy(this.events, ECONOMY.startCash, ECONOMY.startBank, () => this.time.format());
    this.time = new TimeSystem(this.events);
    this.weather = new WeatherSystem(this.events, this.renderer.scene);
    this.weather.onThunder = () => this.audio.thunder();
    this.activities = new ActivityManager(this.renderer.scene, this.world.graph, this.world, this.events, this.economy);
    this.mission = new MissionManager(this.renderer.scene, this.world, this.events, this.economy, this.peds, this.vehicles, this.police);
    this.audio = new AudioManager(this.settings);
    this.saves.init();
    this.settings = this.saves.loadSettings();
    this.audio.settings = this.settings;

    this.hud = new HUD(
      {
        events: this.events,
        player: this.player,
        cam: this.cam,
        combat: this.combat,
        economy: this.economy,
        wanted: this.police.wanted,
        time: this.time,
        weather: this.weather,
        vehicles: this.vehicles,
        activities: this.activities,
        mission: this.mission,
        police: this.police,
        world: this.world,
        graph: this.world.graph,
        settings: this.settings,
        getGpsTarget: () => this.gpsTarget,
        getGpsRoute: () => this.gpsRoute,
        onWheelSelect: (id) => this.combat.select(id),
        onMapClickWorld: (x, z) => this.setGpsTarget(new THREE.Vector3(x, 0, z)),
      },
      container
    );
    this.menus = new Menus(this.menuApi(), container);
    this.shops = new Shops(this.shopApi(), container);

    this.vehicles.spawnParked();
    this.combat.addWeapon('meridian_p9', 15, 60);
    this.combat.equipGun(this.player);

    this.events.on('PLAYER_BUSTED', () => this.onBusted());
    this.events.on('PLAYER_DIED', () => this.onDied());
    this.events.on('MISSION_STAGE_CHANGED', () => {
      const label = this.mission.markerLabel();
      if (label) this.addMessage('Marcus', label);
      const marker = this.mission.markerPos();
      if (marker) this.setGpsTarget(new THREE.Vector3(marker.x, marker.y, marker.z));
      this.requestAutosaveSoon();
    });
    this.events.on('MISSION_COMPLETED', () => {
      this.saveTo('autosave');
    });
    this.events.on('SAVE_REQUESTED', (p) => this.saveTo(p.slot as SaveSlot));
  }

  private menuApi() {
    return {
      newGame: () => this.newGame(),
      continueGame: (slot: string) => void this.loadGame(slot),
      saveTo: (slot: string) => void this.saveTo(slot as SaveSlot),
      deleteSave: (slot: string) => void this.saves.delete(slot as SaveSlot),
      listSaves: () => this.cachedSaves,
      quitToMenu: () => this.quitToMenu(),
      resume: () => this.resume(),
      getState: () => this.state,
      settings: this.settings,
      applySettings: () => this.applySettings(),
      restartFromBusted: () => this.respawnAfterBusted(),
      restartFromHospital: () => this.respawnAfterHospital(),
      ownedVehicles: () => this.vehicles.serializeOwned(),
      garageOwned: () => this.garageOwned,
      missionStage: () => this.mission.stage,
      economySnapshot: () => ({ cash: this.economy.cash, bank: this.economy.bank, chips: this.economy.chips, transactions: this.economy.transactions }),
      activityFlags: () => this.activities.flags,
      startDelivery: (id: string) => this.tryStartDelivery(id),
      startTaxi: () => this.activities.startTaxi(),
      raceRouteIds: () => this.activities.raceRouteIds(),
      messages: () => this.messages,
      markMessagesRead: () => this.messages.forEach((m) => (m.unread = false)),
      teleportToGarageVehicle: () => {},
    };
  }

  private shopApi() {
    return {
      events: this.events,
      economy: this.economy,
      vehicles: this.vehicles,
      combat: this.combat,
      closeOverlays: () => this.setUiLock(false),
      buyVehicle: (modelId: string, color: number) => {
        const def = VEHICLES[modelId];
        if (!def || !this.economy.spend(def.price, `Kauf ${def.name}`, true)) return false;
        const uid = this.nextVehicleUid();
        this.vehicles.buyVehicle(modelId, color, uid);
        this.events.emit('BUSINESS_PURCHASE_COMPLETED', { kind: 'vehicle', label: def.name, price: def.price });
        return true;
      },
      storeVehicle: (uid: number) => {
        const v = this.vehicles.vehicles.find((x) => x.uid === uid);
        if (!v || v === this.vehicles.playerVehicle) return;
        const zone = this.world.poiSet.garageZone;
        if (v.pos.x < zone.minX || v.pos.x > zone.maxX || v.pos.z < zone.minZ || v.pos.z > zone.maxZ) {
          this.events.emit('NOTIFICATION', { text: 'Fahrzeug muss in der Garagen-Zone stehen.', kind: 'warning' });
          return;
        }
        v.inGarage = true;
        this.vehicles.remove(v);
        this.events.emit('NOTIFICATION', { text: 'Fahrzeug eingeparkt.', kind: 'info' });
      },
      retrieveVehicle: (uid: number) => {
        const saved = this.vehicles.serializeOwned().find((o) => o.uid === uid);
        if (!saved || !saved.inGarage) return false;
        const zone = this.world.poiSet.garageZone;
        const v = this.vehicles.spawnVehicle(saved.modelId, zone.center.x + (Math.random() - 0.5) * 8, zone.center.z + 8, 0, saved.color);
        v.uid = uid;
        v.damage = saved.damage;
        v.fuel = saved.fuel;
        v.owned = true;
        v.plate = saved.plate;
        v.upgrades = [...saved.upgrades];
        return true;
      },
      repairVehicle: (uid: number) => {
        const v = this.vehicles.vehicles.find((x) => x.uid === uid);
        if (!v) return false;
        const price = this.economy.repairPrice(v.damage, v.def.price || 10000);
        if (!this.economy.spend(price, `Reparatur ${v.def.name}`)) return false;
        v.damage = 1000;
        return true;
      },
      applyUpgrade: (uid: number, key: string) => {
        const v = this.vehicles.vehicles.find((x) => x.uid === uid);
        if (!v || v.upgrades.includes(key)) return false;
        const price = (ECONOMY.upgrades as Record<string, { price: number }>)[key]?.price ?? 0;
        if (!this.economy.spend(price, `Upgrade ${key} (${v.def.name})`)) return false;
        v.upgrades.push(key);
        return true;
      },
      repaint: (uid: number, color: number) => {
        const v = this.vehicles.vehicles.find((x) => x.uid === uid);
        if (!v) return false;
        if (!this.economy.spend(ECONOMY.upgrades.paint.price, `Lackierung ${v.def.name}`)) return false;
        v.color = color;
        const mat = (v.mesh.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.color.setHex(color);
        return true;
      },
      garageOwned: () => this.garageOwned,
      buyGarage: () => {
        if (this.garageOwned) return false;
        if (!this.economy.spend(ECONOMY.garagePrice, 'Garage Westhaven', true)) return false;
        this.garageOwned = true;
        return true;
      },
      refuelVehicle: () => {
        const v = this.vehicles.playerVehicle;
        if (!v) return false;
        const missing = v.def.tankLiters - v.fuel;
        const cost = Math.ceil(missing * ECONOMY.fuelPricePerLiter);
        if (!this.economy.spend(cost, 'Volltanken')) return false;
        v.fuel = v.def.tankLiters;
        return true;
      },
      buyWeapon: (id: string) => {
        const w = WEAPONS[id];
        if (!w || this.combat.weapons.has(id)) return false;
        if (!this.economy.spend(w.price, `Kauf ${w.name}`)) return false;
        this.combat.addWeapon(id, w.magSize, w.magSize * 4);
        this.combat.select(id);
        return true;
      },
      buyAmmo: () => {
        if (!this.economy.spend(40, 'Munitionskiste')) return false;
        for (const ws of this.combat.weapons.values()) ws.reserve += 60;
        return true;
      },
      buyFood: () => {
        if (!this.economy.spend(60, 'Essen (Sunset Market)')) return false;
        this.player.heal(100);
        return true;
      },
      atmTransfer: (toBank: boolean, amount: number) => (toBank ? this.economy.transferToBank(amount) : this.economy.transferToCash(amount)),
    };
  }

  private garageOwned = false;
  private cachedSaves: SaveData[] = [];
  private nextUidCounter = 1000;
  private nextVehicleUid(): number {
    return ++this.nextUidCounter;
  }
  private autosaveSoon = 0;
  private requestAutosaveSoon(): void {
    this.autosaveSoon = 5;
  }

  addMessage(from: string, text: string): void {
    this.messages.push({ from, text, time: this.time.format(), unread: true });
    this.events.emit('NOTIFICATION', { text: `Neue Nachricht von ${from}`, kind: 'mission' });
  }

  async boot(): Promise<void> {
    this.state = 'MAIN_MENU';
    this.time.minutes = 17.5 * 60;
    this.refreshSaveList();
    this.menus.showMainMenu();
    this.applySettings();
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  private async refreshSaveList(): Promise<void> {
    this.cachedSaves = await this.saves.list();
  }

  newGame(): void {
    this.state = 'LOADING';
    this.menus.showLoading(0.1, 'Welt wird geladen...');
    setTimeout(() => {
      this.resetWorldState();
      this.menus.showLoading(0.7, 'Spieler wird platziert...');
      setTimeout(() => {
        this.menus.closeScreen();
        this.state = 'PLAYING';
        this.input.enabled = true;
        this.input.lockPointer();
        this.cam.reset();
        this.addMessage('Marcus', 'Alex. Wenn du ein bisschen mehr als Kleingeld verdienen willst, komm heute Abend zu Pier 17. Ich habe einen Job für dich. - Marcus');
        this.mission.startMission();
        this.audio.init();
        this.audio.resume();
        this.audio.setMood('explore');
        this.events.emit('NOTIFICATION', { text: 'WASD bewegen, F Fahrzeug, E interagieren, H Smartphone', kind: 'info' });
      }, 30);
    }, 30);
  }

  private resetWorldState(): void {
    this.police.clear();
    for (const v of [...this.vehicles.vehicles]) this.vehicles.remove(v);
    this.vehicles.spawnParked();
    for (const p of [...this.peds.peds]) p.dispose(this.renderer.scene);
    this.peds.peds = [];
    this.player.teleport(this.world.spawnPoint.x, heightAt(this.world.spawnPoint.x, this.world.spawnPoint.z), this.world.spawnPoint.z, Math.PI);
    this.player.health = 100;
    this.player.stamina = 100;
    this.player.dead = false;
    this.player.inVehicleId = null;
    this.player.group.visible = true;
    this.vehicles.playerVehicle = null;
    this.economy.cash = ECONOMY.startCash;
    this.economy.bank = ECONOMY.startBank;
    this.economy.chips = 0;
    this.economy.transactions = [];
    this.combat.weapons.clear();
    this.combat.order = ['meridian_p9'];
    this.combat.addWeapon('meridian_p9', 15, 60);
    this.combat.current = 'meridian_p9';
    this.police.wanted.reset();
    this.activities.active = null;
    this.activities.flags = {};
    this.garageOwned = false;
    this.messages = [];
    this.playTimeSec = 0;
    this.autosaveTimer = 300;
    this.time.minutes = 8.5 * 60;
    this.weather.state = 'CLEAR';
    this.weather.rainIntensity = 0;
    const starter = this.vehicles.spawnVehicle('volton_metro', this.world.spawnPoint.x + 4, this.world.spawnPoint.z + 6, Math.PI / 2, 0x8a8f98);
    starter.uid = this.nextVehicleUid();
    starter.owned = true;
    starter.plate = 'SL-0001';
    this.gpsTarget = null;
    this.gpsRoute = null;
  }

  async loadGame(slot: string): Promise<void> {
    const data = await this.saves.load(slot as SaveSlot);
    if (!data) {
      this.events.emit('NOTIFICATION', { text: 'Spielstand nicht gefunden.', kind: 'warning' });
      return;
    }
    this.state = 'LOADING';
    this.menus.showLoading(0.3, `Lade ${data.name}...`);
    setTimeout(() => {
      this.resetWorldState();
      this.applySave(data);
      this.menus.closeScreen();
      this.state = 'PLAYING';
      this.input.enabled = true;
      this.input.lockPointer();
      this.cam.reset();
      this.audio.init();
      this.audio.resume();
      this.audio.setMood('explore');
    }, 30);
  }

  private applySave(data: SaveData): void {
    this.player.teleport(data.player.position.x, heightAt(data.player.position.x, data.player.position.z), data.player.position.z, data.player.yaw);
    this.player.health = data.player.health;
    this.player.stamina = data.player.stamina;
    this.economy.cash = data.player.cash;
    this.economy.bank = data.player.bank;
    this.economy.chips = data.player.chips;
    this.combat.weapons.clear();
    this.combat.order = [];
    for (const w of data.player.weapons) {
      this.combat.addWeapon(w.id, w.mag, w.reserve);
    }
    this.combat.current = data.player.currentWeapon;
    this.police.wanted.points = data.wantedPoints;
    this.police.wanted.level = this.police.wanted.levelForPoints(data.wantedPoints);
    this.time.minutes = data.worldTimeMinutes;
    this.weather.setState(data.weather as never);
    this.garageOwned = data.garageOwned;
    this.activities.flags = { ...data.activityFlags };
    this.playTimeSec = data.playTimeSec;
    this.vehicles.spawnOwned(data.ownedVehicles);
    for (const o of data.ownedVehicles) this.nextUidCounter = Math.max(this.nextUidCounter, o.uid);
    if (data.player.inVehicleId !== null) {
      const v = this.vehicles.vehicles.find((x) => x.uid === data.player.inVehicleId);
      if (v) {
        this.vehicles.enterVehicle(v, true);
        this.player.inVehicleId = v.uid;
        this.player.group.visible = false;
      }
    }
    this.mission.restore(data.mission);
    this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
    this.applySettings();
    this.messages = [];
  }

  private buildSave(slot: string, name: string): SaveData {
    const pv = this.vehicles.playerVehicle;
    if (pv && pv.owned) {
      const o = this.vehicles.serializeOwned().find((x) => x.uid === pv.uid);
      if (o) {
        o.damage = pv.damage;
        o.fuel = pv.fuel;
        o.position = { x: pv.pos.x, y: pv.pos.y, z: pv.pos.z };
      }
    }
    return {
      version: 1,
      slot,
      name,
      savedAt: Date.now(),
      playTimeSec: this.playTimeSec,
      worldTimeMinutes: this.time.minutes,
      weather: this.weather.state,
      player: {
        position: { x: this.player.pos.x, y: this.player.pos.y, z: this.player.pos.z },
        yaw: this.player.yaw,
        health: this.player.health,
        stamina: this.player.stamina,
        cash: this.economy.cash,
        bank: this.economy.bank,
        chips: this.economy.chips,
        weapons: this.combat.serialize(),
        currentWeapon: this.combat.current,
        inVehicleId: pv ? pv.uid : null,
      },
      wantedPoints: this.police.wanted.points,
      ownedVehicles: this.vehicles.serializeOwned(),
      garageOwned: this.garageOwned,
      mission: this.mission.serialize(),
      activityFlags: { ...this.activities.flags },
      stats: { kills: 0, racesWon: 0, deliveriesDone: 0, taxiRides: 0, earnedTotal: 0, spentTotal: 0 },
      settings: { ...this.settings },
    };
  }

  async saveTo(slot: SaveSlot): Promise<void> {
    const data = this.buildSave(slot, slot === 'autosave' ? 'Autosave' : `Spielstand ${slot}`);
    await this.saves.save(slot, data);
    await this.refreshSaveList();
    this.saves.saveSettings(this.settings);
    if (this.state === 'PLAYING') this.events.emit('NOTIFICATION', { text: `Spiel gespeichert (${slot})`, kind: 'info' });
  }

  quitToMenu(): void {
    this.state = 'MAIN_MENU';
    this.input.enabled = false;
    this.input.unlockPointer();
    this.uiLock = false;
    this.shops.close();
    this.menus.closeScreen();
    this.time.minutes = 17.5 * 60;
    this.refreshSaveList();
    this.menus.showMainMenu();
    this.audio.setMood('menu');
  }

  resume(): void {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.menus.closeScreen();
      this.input.enabled = !this.uiLock;
      this.input.lockPointer();
    }
  }

  private applySettings(): void {
    const q = this.settings.quality as QualityLevel;
    if (QUALITY[q]) {
      this.renderer.applyQuality(q, this.settings.resolutionScale);
      this.vehicles.setTrafficTarget(QUALITY[q].traffic);
      this.peds.maxPeds = QUALITY[q].pedestrians;
    }
    this.audio.applyVolumes();
    this.saves.saveSettings(this.settings);
  }

  setUiLock(lock: boolean): void {
    this.uiLock = lock;
    this.input.enabled = this.state === 'PLAYING';
    if (lock) this.input.unlockPointer();
    else if (this.state === 'PLAYING') this.input.lockPointer();
  }

  setGpsTarget(pos: THREE.Vector3): void {
    this.gpsTarget = pos;
    const route = this.world.graph.routeTo(this.player.pos.x, this.player.pos.z, pos.x, pos.z);
    this.gpsRoute = route.points;
  }

  private tryStartDelivery(id: string): boolean {
    const ok = this.activities.startDelivery(id);
    if (ok) {
      const target = (this.activities.active as { target?: THREE.Vector3 } | null)?.target;
      if (target) this.setGpsTarget(target);
    }
    return ok;
  }

  private onBusted(): void {
    if (this.state !== 'PLAYING') return;
    const fine = this.economy.bustFine();
    this.economy.spend(fine, 'Geldstrafe nach Verhaftung');
    this.police.clear();
    this.state = 'BUSTED';
    this.input.enabled = false;
    this.input.unlockPointer();
    this.hud.showCenterMsg('VERHAFTET', 2.5);
    this.menus.showBusted();
    this.audio.setMood('menu');
  }

  private respawnAfterBusted(): void {
    const pos = this.world.pois.find((p) => p.kind === 'police')?.position ?? new THREE.Vector3(80, 0, -300);
    this.player.teleport(pos.x + 3, heightAt(pos.x + 3, pos.z), pos.z + 6, Math.PI);
    this.player.health = 100;
    this.player.dead = false;
    if (this.vehicles.playerVehicle) {
      this.vehicles.exitVehicle();
      this.player.inVehicleId = null;
    }
    this.player.group.visible = true;
    this.police.wanted.reset();
    this.menus.closeScreen();
    this.state = 'PLAYING';
    this.input.enabled = true;
    this.input.lockPointer();
    this.audio.setMood('explore');
  }

  private onDied(): void {
    if (this.state !== 'PLAYING') return;
    const cost = this.economy.hospitalCost();
    this.economy.spend(Math.min(cost, this.economy.cash + this.economy.bank), 'Behandlungskosten', false);
    this.police.clear();
    this.state = 'HOSPITALIZED';
    this.input.enabled = false;
    this.input.unlockPointer();
    this.hud.showCenterMsg('KRANKENHAUS', 2.5);
    this.menus.showHospitalized();
    this.audio.setMood('menu');
  }

  private respawnAfterHospital(): void {
    const pos = this.world.pois.find((p) => p.kind === 'hospital')?.position ?? new THREE.Vector3(-680, 0, -410);
    this.player.teleport(pos.x, heightAt(pos.x, pos.z + 6), pos.z + 6, Math.PI);
    this.player.health = 100;
    this.player.stamina = 100;
    this.player.dead = false;
    if (this.vehicles.playerVehicle) {
      this.vehicles.exitVehicle();
      this.player.inVehicleId = null;
    }
    this.player.group.visible = true;
    this.police.wanted.reset();
    this.menus.closeScreen();
    this.state = 'PLAYING';
    this.input.enabled = true;
    this.input.lockPointer();
    this.audio.setMood('explore');
  }

  private simStep(dt: number): void {
    this.simTime += dt;
    this.playTimeSec += dt;
    this.time.update(dt);
    this.weather.update(dt, this.renderer.camera.position);

    const aiming = this.input.buttons.has('r') && this.player.inVehicleId === null && !this.uiLock;
    const crouching = this.input.down('ControlLeft') || this.input.down('ControlRight');

    if (this.player.inVehicleId === null && !this.uiLock && !this.hud.dialogOpen) {
      this.player.update(dt, this.input, this.cam.yaw, this.world.colliders, aiming, crouching);
      if (this.player.speed > 0.5 && this.player.onGround) {
        this.footstepTimer -= dt * this.player.speed;
        if (this.footstepTimer <= 0) {
          this.footstepTimer = 2.2;
          this.audio.footstep();
        }
      }
    }

    let vehInput: VehicleInput | null = null;
    const pv = this.vehicles.playerVehicle;
    if (pv && !this.uiLock) {
      vehInput = {
        throttle: this.input.down('KeyW') || this.input.down('ArrowUp') ? 1 : this.input.down('KeyS') || this.input.down('ArrowDown') ? -0.7 : 0,
        brake: this.input.down('KeyS') || this.input.down('ArrowDown') ? 1 : 0,
        steer: (this.input.down('KeyA') || this.input.down('ArrowLeft') ? -1 : 0) + (this.input.down('KeyD') || this.input.down('ArrowRight') ? 1 : 0),
        handbrake: this.input.down('Space'),
      };
      if (vehInput.throttle < 0) {
        vehInput.brake = Math.max(vehInput.brake, 0.4);
      }
    }

    this.vehicles.update(dt, this.uiLock ? null : vehInput, this.world.colliders, this.weather.tractionMultiplier, this.isNight(), this.player.pos, this.simTime);
    this.combat.vehicles = this.vehicles.vehicles;
    this.peds.update(dt, this.player.pos, this.world.colliders, this.vehicles.vehicles.map((v) => ({ pos: v.pos, vel: v.vel, uid: v.uid, speed: v.speed })), this.simTime);
    this.police.update(dt, this.player.pos, this.player.inVehicleId !== null, this.player.speed, this.world.colliders, this.vehicles.vehicles, this.simTime, this.isNight());
    this.combat.update(dt, this.uiLock || this.hud.dialogOpen ? this.nullInput : this.input, this.renderer.camera, this.player);
    this.activities.update(dt, this.player.pos, pv ?? null, this.input, this.camDir(), this.settings.quality as QualityLevel);
    this.mission.update(dt, this.player.pos, pv ?? null, this.player, this.simTime);

    if (pv && pv.destroyed && this.player.inVehicleId === pv.uid) {
      this.forceExitVehicle();
      this.events.emit('NOTIFICATION', { text: 'Fahrzeug zerstört!', kind: 'warning' });
    }
  }

  private camDir(): THREE.Vector3 {
    const d = new THREE.Vector3();
    this.renderer.camera.getWorldDirection(d);
    return d;
  }

  private isNight(): boolean {
    return sunFromHour(this.time.hour).nightFactor > 0.4;
  }

  private forceExitVehicle(): void {
    const v = this.vehicles.exitVehicle();
    if (v) {
      this.player.inVehicleId = null;
      this.player.teleport(v.pos.x - Math.cos(v.yaw) * 2.2, heightAt(v.pos.x - Math.cos(v.yaw) * 2.2, v.pos.z - Math.sin(v.yaw) * 2.2), v.pos.z - Math.sin(v.yaw) * 2.2, v.yaw + Math.PI / 2);
      this.player.group.visible = true;
    }
  }

  private currentInteractLabel(): string | null {
    const p = this.player.pos;
    if (this.player.inVehicleId !== null) {
      const zone = this.world.poiSet.gasZone;
      const pv = this.vehicles.playerVehicle;
      if (pv && pv.pos.x > zone.minX && pv.pos.x < zone.maxX && pv.pos.z > zone.minZ && pv.pos.z < zone.maxZ) return 'E - VOLLTANKEN';
      return 'F - AUSSTEIGEN';
    }
    for (const t of this.world.poiSet.casino.tables) {
      if (Math.hypot(t.pos.x - p.x, t.pos.z - p.z) < 3) {
        return t.kind === 'slots' ? 'E - SLOT-MACHINE' : t.kind === 'roulette' ? 'E - ROULETTE' : 'E - BLACKJACK';
      }
    }
    if (Math.hypot(this.world.poiSet.casino.cashier.x - p.x, this.world.poiSet.casino.cashier.z - p.z) < 3) return 'E - CHIPS KAUFEN/VERKAUFEN';
    const missionLabel = this.mission.interactLabel(p, this.vehicles.playerVehicle);
    if (missionLabel) return missionLabel;
    for (const poi of this.world.pois) {
      const d = Math.hypot(poi.position.x - p.x, poi.position.z - p.z);
      if (d > poi.radius + 2) continue;
      switch (poi.kind) {
        case 'dealership':
          return 'E - WESTHAVEN MOTORS';
        case 'garage':
          return 'E - GARAGE';
        case 'workshop':
          return 'E - AUTOFIX WERKSTATT';
        case 'ammunition':
          return 'E - AMMUNITION';
        case 'market':
          return 'E - SUNSET MARKET';
        case 'atm':
          return 'E - ATM';
        case 'gas':
          break;
        case 'apartment':
          return 'E - SCHLAFEN (Zeit überspringen)';
        case 'race': {
          const pv2 = this.vehicles.playerVehicle;
          return pv2 ? `E - RENNEN STARTEN (${poi.name})` : null;
        }
        case 'delivery':
          return `E - LIEFERAUFTRAG ANNEHMEN (${poi.name.split('(')[1]?.replace(')', '') ?? poi.name})`;
        case 'taxi':
          return this.vehicles.playerVehicle ? 'E - TAXI-MODUS' : null;
        case 'darts':
          return 'E - DARTS SPIELEN';
        case 'basketball':
          return 'E - BASKETBALL-CHALLENGE';
        case 'casino':
          break;
        default:
          break;
      }
    }
    const v = this.vehicles.nearestEnterable(p.x, p.z, 2.8);
    if (v) return 'F - FAHRZEUG BETRETEN';
    return null;
  }

  private doInteract(label: string | null): void {
    const p = this.player.pos;
    if (label?.startsWith('F - FAHRZEUG')) {
      const v = this.vehicles.nearestEnterable(p.x, p.z, 2.8);
      if (v) {
        this.vehicles.enterVehicle(v, true);
        this.player.inVehicleId = v.uid;
        this.player.group.visible = false;
        this.cam.mode = 'vehicle';
        this.audio.init();
      }
      return;
    }
    if (label === 'F - AUSSTEIGEN') {
      this.forceExitVehicle();
      this.cam.mode = 'third';
      return;
    }
    if (!label || !label.startsWith('E - ')) return;
    const text = label.slice(4);
    if (text === 'VOLLTANKEN') {
      this.shops.openGas();
      this.setUiLock(true);
      return;
    }
    if (text.startsWith('MIT MARCUS') || text.startsWith('BEOBACHTUNG') || text.startsWith('FRACHT') || text.startsWith('FAHRZEUG ABSTELLEN')) {
      this.mission.interact(p, this.vehicles.playerVehicle);
      return;
    }
    for (const poi of this.world.pois) {
      const d = Math.hypot(poi.position.x - p.x, poi.position.z - p.z);
      if (d > poi.radius + 2) continue;
      if (text.includes(poi.name.split(' ')[0]) || poi.name.includes(text.split('(')[0].trim().split(' ')[0])) {
        this.openPoi(poi);
        return;
      }
    }
    for (const t of this.world.poiSet.casino.tables) {
      if (Math.hypot(t.pos.x - p.x, t.pos.z - p.z) < 3) {
        this.openCasinoGame(t.kind);
        return;
      }
    }
    if (Math.hypot(this.world.poiSet.casino.cashier.x - p.x, this.world.poiSet.casino.cashier.z - p.z) < 3) {
      this.shops.openCashier();
      this.setUiLock(true);
      return;
    }
  }

  private openPoi(poi: (typeof this.world.pois)[number]): void {
    this.audio.init();
    switch (poi.kind) {
      case 'dealership':
        this.shops.openDealership();
        break;
      case 'garage':
        this.shops.openGarage();
        break;
      case 'workshop':
        this.shops.openWorkshop();
        break;
      case 'ammunition':
        this.shops.openAmmunition();
        break;
      case 'market':
        this.shops.openMarket();
        break;
      case 'atm':
        this.shops.openAtm();
        break;
      case 'apartment':
        this.sleepDialog();
        return;
      case 'race':
        if (this.vehicles.playerVehicle) {
          const routeId = poi.id;
          if (this.activities.startRace(routeId, this.vehicles.playerVehicle)) {
            const route = (this.activities as unknown as { raceRoutes: Record<string, { checkpoints: THREE.Vector3[] }> }).raceRoutes[routeId];
            if (route && route.checkpoints[0]) this.setGpsTarget(route.checkpoints[0]);
            this.hud.showCenterMsg('3...', 1);
          }
        }
        return;
      case 'delivery':
        this.tryStartDelivery(poi.id.replace('delivery_', '') === 'cafe' ? 'downtown_express' : poi.id.includes('pier') ? 'beach_delivery' : 'westhaven_supplies');
        return;
      case 'taxi':
        if (this.vehicles.playerVehicle) this.activities.startTaxi();
        return;
      case 'darts':
        this.openDartsDialog();
        return;
      case 'basketball':
        if (this.activities.startBasketball()) this.hud.setActivityText('Basketball: 60s, 2 Punkte pro Korb, Ziel 20 - LMB halten & loslassen');
        return;
      default:
        return;
    }
    this.setUiLock(true);
  }

  private openCasinoGame(kind: 'slots' | 'roulette' | 'blackjack'): void {
    this.audio.init();
    this.audio.setMood('casino');
    if (kind === 'slots') this.shops.openSlots();
    else if (kind === 'roulette') this.shops.openRoulette();
    else this.shops.openBlackjack();
    this.setUiLock(true);
  }

  private sleepDialog(): void {
    const scr = el('div', 'screen', document.getElementById('app')!);
    scr.style.background = 'rgba(10,13,18,0.85)';
    scr.style.zIndex = '47';
    this.adHocScreen = scr;
    const panel = el('div', 'panel', scr);
    el('h2', '', panel, 'APARTMENT 3B - SCHLAFEN');
    const mk = (label: string, hours: number) => {
      const b = el('button', 'menu-btn', panel, label);
      b.onclick = () => {
        this.time.addHours(hours);
        this.player.heal(100);
        this.player.stamina = 100;
        this.events.emit('NOTIFICATION', { text: ` ausgeschlafen (+${hours} h, ${this.time.format()})`, kind: 'info' });
        scr.remove();
        this.adHocScreen = null;
        this.setUiLock(false);
      };
    };
    mk('6 STUNDEN SCHLAFEN', 6);
    mk('8 STUNDEN SCHLAFEN', 8);
    const cancel = el('button', 'menu-btn', panel, 'ABBRECHEN');
    cancel.onclick = () => {
      scr.remove();
      this.adHocScreen = null;
      this.setUiLock(false);
    };
    this.setUiLock(true);
  }

  private openDartsDialog(): void {
    const scr = el('div', 'screen', document.getElementById('app')!);
    scr.style.background = 'rgba(10,13,18,0.85)';
    scr.style.zIndex = '47';
    this.adHocScreen = scr;
    const panel = el('div', 'panel', scr);
    el('h2', '', panel, 'DARTS 301 - THE RUSTY ANCHOR');
    const mk = (label: string, paid: boolean) => {
      const b = el('button', 'menu-btn', panel, label);
      b.onclick = () => {
        if (this.activities.startDarts(paid)) {
          scr.remove();
          this.adHocScreen = null;
          this.dartsActive = true;
          this.hud.setActivityText('Darts 301: Maus = Ziel, LMB halten = Kraft, loslassen = Wurf. 3 Pfeile pro Zug.');
        }
      };
    };
    mk('KOSTENLOS SPIELEN', false);
    mk('100 $ EINSATZ (Gewinn 200 $)', true);
    const cancel = el('button', 'menu-btn', panel, 'ABBRECHEN');
    cancel.onclick = () => {
      scr.remove();
      this.adHocScreen = null;
    };
  }

  private dartsActive = false;

  private frame(now: number): void {
    requestAnimationFrame((t) => this.frame(t));
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;
    if (dt < 0) dt = 0;

    if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'BUSTED' || this.state === 'HOSPITALIZED') {
      if (this.state === 'PLAYING') {
        this.fixedAcc += dt;
        let steps = 0;
        while (this.fixedAcc >= 1 / 60 && steps < 4) {
          this.simStep(1 / 60);
          this.fixedAcc -= 1 / 60;
          steps++;
        }
        if (steps === 4) this.fixedAcc = 0;
        this.autosaveTimer -= dt;
        if (this.autosaveSoon > 0) {
          this.autosaveSoon -= dt;
          if (this.autosaveSoon <= 0) void this.saveTo('autosave');
        }
        if (this.autosaveTimer <= 0) {
          this.autosaveTimer = 300;
          if (this.police.wanted.level === 0) void this.saveTo('autosave');
        }
        this.handlePlayingInput();
      }
      if (this.state === 'PAUSED' && this.input.wasPressed('Escape')) this.resume();
      this.updateCamera(dt);
      this.updateEnvironment(dt);
      this.hud.update(dt);
    } else if (this.state === 'MAIN_MENU' || this.state === 'LOADING') {
      this.menuAngle += dt * 0.05;
      const cx = Math.cos(this.menuAngle) * 500;
      const cz = Math.sin(this.menuAngle) * 500;
      this.renderer.camera.position.set(cx, 160, cz);
      this.renderer.camera.lookAt(0, 20, 0);
      this.updateEnvironment(dt);
    }

    this.audio.update(dt);
    const pv = this.vehicles.playerVehicle;
    this.audio.engineUpdate(pv !== null && !pv.destroyed, pv ? clamp(pv.speedKmh / pv.def.topSpeedKmh, 0, 1) : 0, pv ? pv.speedKmh : 0);
    const nearestPolice = this.police.units.reduce((m, u) => Math.min(m, u.v.pos.distanceTo(this.player.pos)), Infinity);
    this.audio.sirenUpdate(this.police.wanted.level > 0 && nearestPolice < 260, nearestPolice === Infinity ? 999 : nearestPolice);
    this.audio.rainUpdate(this.weather.rainIntensity);
    const beachDist = this.player.pos.x - coastX(this.player.pos.z);
    this.audio.wavesUpdate(beachDist < 250 && !isWater(this.player.pos.x, this.player.pos.z) ? clamp(1 - beachDist / 250, 0, 1) : 0);
    this.audio.setMood(this.police.wanted.level >= 3 ? 'pursuit' : this.shops.isOpen && this.casinoInside ? 'casino' : this.mission.stage !== 'NOT_STARTED' && this.mission.stage !== 'MISSION_COMPLETE' ? 'mission' : 'explore');

    this.renderer.render();
    this.input.endFrame();
  }

  private handlePlayingInput(): void {
    const input = this.input;
    if (this.uiLock) {
      if (input.wasPressed('Escape')) {
        if (this.shops.isOpen) this.shops.close();
        else if (this.hud.mapIsOpen) this.hud.toggleMap();
        else if (this.menus.phoneIsOpen) this.menus.togglePhone();
        else if (this.inventoryEl) this.toggleInventory(false);
        else if (this.adHocScreen) {
          this.adHocScreen.remove();
          this.adHocScreen = null;
          this.setUiLock(false);
        } else this.setUiLock(false);
      }
      return;
    }

    if (input.wasPressed('Escape')) {
      this.state = 'PAUSED';
      this.input.unlockPointer();
      this.menus.showPause();
      return;
    }
    if (this.hud.dialogOpen) {
      if (input.wasPressed('KeyE') || input.wasClicked('l')) this.hud.advanceDialog();
      return;
    }

    if (input.wasPressed('KeyM')) this.hud.toggleMap();
    if (this.hud.mapIsOpen) return;
    if (input.wasPressed('KeyH')) {
      this.menus.togglePhone();
      return;
    }
    if (this.menus.phoneIsOpen) return;
    if (input.wasPressed('KeyI')) {
      this.toggleInventory();
      return;
    }
    if (this.inventoryEl) return;
    if (input.wasPressed('KeyC')) {
      this.cameraModeIdx = (this.cameraModeIdx + 1) % 3;
      this.cam.mode = this.player.inVehicleId !== null ? (['vehicle', 'vehicle', 'hood'] as const)[this.cameraModeIdx] : 'third';
    }

    const wheelKey = input.down('Tab');
    if (wheelKey && !this.hud.wheelIsOpen && this.player.inVehicleId === null) {
      this.hud.openWheel();
      this.timeScaleWheel = true;
    }
    if (this.hud.wheelIsOpen) {
      const ang = Math.atan2(input.mouseDY, input.mouseDX);
      this.hud.lastWheelAngle = input.mouseDX === 0 && input.mouseDY === 0 ? this.hud.lastWheelAngle : ang;
      this.hud.updateWheel(this.hud.lastWheelAngle);
      if (!wheelKey) {
        this.hud.closeWheel(true);
        this.timeScaleWheel = false;
      }
    }

    const label = this.currentInteractLabel();
    this.hud.setPrompt(label);
    if (input.wasPressed('KeyF')) this.doInteract(label);
    else if (input.wasPressed('KeyE')) this.doInteract(label);

    if (this.dartsActive) {
      const a = this.activities.active;
      if (!a || a.kind !== 'darts' || a.done) {
        this.dartsActive = false;
        this.hud.setActivityText(null);
      } else {
        this.hud.setActivityText(`Darts 301 - Du: ${a.playerScore} | KI: ${a.aiScore} | Zug: ${a.turn} | Pfeile: ${a.dartsThrown}/3 ${a.charge > 0 ? `| Kraft ${(a.charge * 100).toFixed(0)}%` : ''}`);
      }
    } else {
      const a = this.activities.active;
      if (a) {
        if (a.kind === 'race') this.hud.setActivityText(`${a.started ? `Rennen ${a.time.toFixed(1)}s` : `Countdown ${Math.ceil(a.countdown)}`} - Checkpoint ${a.playerCp}/${a.checkpoints.length}`);
        else if (a.kind === 'delivery') this.hud.setActivityText(`Lieferung: ${Math.ceil(a.timeLeft)}s übrig - zum Ziel fahren/laufen`);
        else if (a.kind === 'taxi') this.hud.setActivityText(a.phase === 'toPickup' ? 'Zum Abholpunkt fahren (anhalten)' : 'Zum Ziel fahren (anhalten)');
        else if (a.kind === 'basketball') this.hud.setActivityText(`Basketball: ${a.score} Punkte | ${Math.ceil(a.timeLeft)}s ${a.charge > 0 ? `| Kraft ${(a.charge * 100).toFixed(0)}%` : '| LMB halten & loslassen'}`);
      } else this.hud.setActivityText(null);
    }

    if (this.casinoInside !== this.insideCasino()) this.casinoInside = !this.casinoInside;
  }

  private timeScaleWheel = false;

  private insideCasino(): boolean {
    const c = this.world.poiSet.casino.center;
    const p = this.player.pos;
    return Math.abs(p.x - c.x) < 24 && Math.abs(p.z - c.z) < 18;
  }

  private toggleInventory(force?: boolean): void {
    if (this.inventoryEl && force !== true) {
      this.inventoryEl.remove();
      this.inventoryEl = null;
      this.setUiLock(false);
      return;
    }
    const scr = el('div', 'screen', document.getElementById('app')!);
    scr.style.background = 'rgba(10,13,18,0.85)';
    scr.style.zIndex = '46';
    const panel = el('div', 'panel', scr);
    el('h2', '', panel, 'INVENTAR');
    el('div', '', panel, 'Waffen:').style.color = '#F4B544';
    for (const id of this.combat.order) {
      const w = this.combat.weapons.get(id);
      if (w) el('div', 'kv', panel).innerHTML = `<span>${w.def.name}</span><span>${w.mag} / ${w.reserve}</span>`;
    }
    el('div', '', panel, `Bargeld: ${fmtMoney(this.economy.cash)} | Bank: ${fmtMoney(this.economy.bank)} | Chips: ${this.economy.chips}`).style.marginTop = '10px';
    if (this.mission.serialize().cargoSecured) el('div', '', panel, 'Missionsgegenstand: Frachtbox (Harbor Job)').style.color = '#F4B544';
    const close = el('button', 'btn', panel, 'SCHLIESSEN (I)');
    close.style.marginTop = '12px';
    close.onclick = () => this.toggleInventory(true);
    this.inventoryEl = scr;
    this.setUiLock(true);
  }

  private updateCamera(dt: number): void {
    const pv = this.vehicles.playerVehicle;
    if (pv) {
      const target = pv.pos.clone();
      this.cam.update(dt, this.renderer.camera, target, { mode: this.cam.mode === 'hood' ? 'hood' : 'vehicle', speed: pv.speedKmh / 3.6, colliders: this.world.colliders, collide: this.cam.mode !== 'hood' });
      this.renderer.camera.rotateY(0);
    } else {
      this.cam.update(dt, this.renderer.camera, this.player.pos, { mode: this.input.buttons.has('r') ? 'aim' : 'third', speed: this.player.speed, colliders: this.world.colliders, collide: true });
    }
    this.renderer.camera.rotation.z = 0;
    if (this.combat.recoilPitch !== 0 || this.combat.recoilYaw !== 0) {
      this.cam.pitch += this.combat.recoilPitch * 0.5;
      this.cam.yaw += this.combat.recoilYaw * 0.5;
    }
  }

  private updateEnvironment(dt: number): void {
    const sun = sunFromHour(this.time.hour);
    const camPos = this.renderer.camera.position;
    this.sky.update(sun.dir, sun.nightFactor, sun.sunsetFactor, this.weather.cloudiness, this.weather.wind, dt, camPos);
    const q = QUALITY[this.settings.quality as QualityLevel] ?? QUALITY.medium;
    this.lighting.update(sun, this.player.pos, this.simTime, this.world.props.lampPositions, this.settings.quality !== 'low', q.shadowMap);
    const fog = this.renderer.scene.fog as THREE.Fog;
    const baseFar = q.fogFar;
    fog.far = baseFar * (1 - this.weather.fogDensityBoost * 0.55);
    fog.color.setHex(0xbfd9e8).lerp(new THREE.Color(PALETTE.midnightNavy), sun.nightFactor * 0.85).lerp(new THREE.Color(0x8a8f98), this.weather.cloudiness * 0.5);
    this.renderer.scene.background = new THREE.Color().copy(fog.color);
    this.world.updateEnvironment(sun.nightFactor, this.simTime);
    this.lighting.lampPool.forEach((l) => {
      l.intensity = l.intensity * (0.98 + Math.random() * 0.04);
    });
    void lerp;
  }
}
