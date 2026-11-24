import * as THREE from 'three';
import { PALETTE, districtAt } from '../core/config.ts';
import { clamp } from '../core/math.ts';
import { coastX, HARBOR, ISLAND } from '../world/terrain.ts';
import { el, fmtMoney, clear, show, hide } from './helpers.ts';
import type { EventBus } from '../core/events.ts';
import type { Player } from '../player/player.ts';
import type { CameraRig } from '../player/camera.ts';
import type { CombatSystem } from '../combat/combat.ts';
import type { Economy } from '../economy/economy.ts';
import type { WantedSystem } from '../police/wanted.ts';
import type { TimeSystem } from '../weather/time.ts';
import type { WeatherSystem } from '../weather/weather.ts';
import type { VehicleManager } from '../vehicles/vehicleManager.ts';
import type { ActivityManager } from '../minigames/activityManager.ts';
import type { MissionManager } from '../missions/missionManager.ts';
import type { PoliceManager } from '../police/policeManager.ts';
import type { World } from '../world/city.ts';
import type { RoadGraph } from '../world/roads.ts';
import type { SettingsData } from '../core/types.ts';

export interface HudContext {
  events: EventBus;
  player: Player;
  cam: CameraRig;
  combat: CombatSystem;
  economy: Economy;
  wanted: WantedSystem;
  time: TimeSystem;
  weather: WeatherSystem;
  vehicles: VehicleManager;
  activities: ActivityManager;
  mission: MissionManager;
  police: PoliceManager;
  world: World;
  graph: RoadGraph;
  settings: SettingsData;
  getGpsTarget: () => THREE.Vector3 | null;
  getGpsRoute: () => { x: number; z: number }[] | null;
  onWheelSelect: (id: string) => void;
  onMapClickWorld: (x: number, z: number) => void;
}

export class HUD {
  ctx: HudContext;
  root: HTMLElement;
  minimap: HTMLCanvasElement;
  mapCanvas: HTMLCanvasElement | null = null;
  mapOverlay: HTMLElement | null = null;
  mapOpen = false;
  private elMoney: HTMLElement;
  private elBank: HTMLElement;
  private elStars: HTMLElement;
  private elSearch: HTMLElement;
  private elHealth: HTMLElement;
  private elStamina: HTMLElement;
  private elWeapon: HTMLElement;
  private elAmmo: HTMLElement;
  private elVehicle: HTMLElement;
  private elSpeed: HTMLElement;
  private elFuelFill: HTMLElement;
  private elDmgFill: HTMLElement;
  private elMissionTitle: HTMLElement;
  private elMissionLabel: HTMLElement;
  private elMissionBox: HTMLElement;
  private elPrompt: HTMLElement;
  private elCrosshair: HTMLElement;
  private elNotifs: HTMLElement;
  private elDialog: HTMLElement;
  private elDialogSpeaker: HTMLElement;
  private elDialogText: HTMLElement;
  private elCenterMsg: HTMLElement;
  private elWheel: HTMLElement | null = null;
  private elActivity: HTMLElement;
  private elClock: HTMLElement;
  private dialogLines: { speaker: string; text: string }[] = [];
  private dialogIdx = 0;
  private dialogOnDone: (() => void) | null = null;
  private roadSegs: { ax: number; az: number; bx: number; bz: number }[] = [];
  private coastPts: { x: number; z: number }[] = [];
  private mapScale = 0.28;
  private mapPanX = 0;
  private mapPanZ = 0;
  private mapDragging = false;
  private lastMinimap = 0;
  private centerMsgTimer = 0;
  private wheelOpen = false;
  private activityText = '';

  constructor(ctx: HudContext, parent: HTMLElement) {
    this.ctx = ctx;
    const root = el('div', 'hud', parent);
    this.root = root;

    const bl = el('div', 'hud-bottom-left', root);
    this.minimap = el('canvas', '', bl) as HTMLCanvasElement;
    this.minimap.id = 'minimap';
    this.minimap.width = 210;
    this.minimap.height = 210;
    el('div', 'bar-label', bl, 'GESUNDHEIT');
    const hb = el('div', 'bar', bl);
    this.elHealth = el('div', '', hb);
    el('div', 'bar-label', bl, 'AUSDAUER');
    const sb = el('div', 'bar stamina', bl);
    this.elStamina = el('div', '', sb);

    const tr = el('div', 'hud-top-right', root);
    this.elMoney = el('div', '', tr);
    this.elMoney.id = 'hud-money';
    this.elBank = el('div', '', tr);
    this.elBank.id = 'hud-bank';
    this.elStars = el('div', '', tr);
    this.elStars.id = 'hud-stars';
    this.elSearch = el('div', 'hidden', tr);
    this.elSearch.id = 'hud-search';
    this.elSearch.textContent = 'POLIZEI SUCHT NACH DIR';
    this.elClock = el('div', '', tr);
    this.elClock.style.cssText = 'font-size:13px;color:#9aa3ad;margin-top:4px';

    const tc = el('div', 'hud-top-center', root);
    this.elMissionBox = el('div', 'hidden', tc);
    this.elMissionBox.id = 'mission-box';
    this.elMissionTitle = el('div', '', this.elMissionBox);
    this.elMissionTitle.id = 'mission-title';
    this.elMissionLabel = el('div', '', this.elMissionBox);
    this.elMissionLabel.id = 'mission-label';

    const br = el('div', 'hud-bottom-right', root);
    this.elVehicle = el('div', 'hidden', br);
    this.elVehicle.id = 'hud-vehicle';
    this.elSpeed = el('div', '', this.elVehicle);
    this.elSpeed.id = 'hud-speed';
    const fb = el('div', '', this.elVehicle);
    fb.id = 'hud-fuelbar';
    this.elFuelFill = el('div', '', fb);
    const db = el('div', '', this.elVehicle);
    db.id = 'hud-dmgbar';
    this.elDmgFill = el('div', '', db);
    this.elWeapon = el('div', '', br);
    this.elWeapon.id = 'hud-weapon';
    this.elAmmo = el('div', '', br);
    this.elAmmo.id = 'hud-ammo';

    this.elPrompt = el('div', 'hidden', root);
    this.elPrompt.id = 'interact-prompt';
    this.elCrosshair = el('div', 'hidden', root);
    this.elCrosshair.id = 'crosshair';
    this.elNotifs = el('div', '', root);
    this.elNotifs.id = 'notifications';

    this.elDialog = el('div', 'hidden', root);
    this.elDialog.id = 'dialog-box';
    this.elDialogSpeaker = el('div', '', this.elDialog);
    this.elDialogSpeaker.id = 'dialog-speaker';
    this.elDialogText = el('div', '', this.elDialog);
    this.elDialogText.id = 'dialog-text';
    el('div', '', this.elDialog, 'E / Klick - weiter').id = 'dialog-hint';

    this.elCenterMsg = el('div', 'hidden', root);
    this.elCenterMsg.id = 'center-msg';
    this.elActivity = el('div', 'hidden', root);
    this.elActivity.id = 'activity-panel';

    for (const e of this.ctx.graph.edges) {
      const a = this.ctx.graph.nodes[e.a];
      const b = this.ctx.graph.nodes[e.b];
      this.roadSegs.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z });
    }
    for (let z = -1600; z <= 1600; z += 40) this.coastPts.push({ x: coastX(z), z });

    ctx.events.on('NOTIFICATION', (p) => this.notify(p.text, p.kind));
    ctx.events.on('DIALOG_STARTED', (p) => this.startDialog(p.lines, p.onDone));
    ctx.events.on('MISSION_STAGE_CHANGED', () => {
      const label = this.ctx.mission.markerLabel();
      if (label) {
        show(this.elMissionBox);
        this.elMissionTitle.textContent = 'THE HARBOR JOB';
        this.elMissionLabel.textContent = label;
      }
    });
    ctx.events.on('MISSION_COMPLETED', () => {
      hide(this.elMissionBox);
      this.notify('THE HARBOR JOB abgeschlossen!', 'mission');
    });
  }

  notify(text: string, kind: 'info' | 'money' | 'warning' | 'mission'): void {
    const n = el('div', `notif ${kind}`, this.elNotifs, text);
    setTimeout(() => n.remove(), 3600);
    while (this.elNotifs.children.length > 5) this.elNotifs.firstChild?.remove();
  }

  startDialog(lines: { speaker: string; text: string }[], onDone?: () => void): void {
    this.dialogLines = lines;
    this.dialogIdx = 0;
    this.dialogOnDone = onDone ?? null;
    show(this.elDialog);
    this.renderDialogLine();
  }

  advanceDialog(): void {
    if (this.dialogLines.length === 0) return;
    this.dialogIdx++;
    if (this.dialogIdx >= this.dialogLines.length) {
      hide(this.elDialog);
      const cb = this.dialogOnDone;
      this.dialogLines = [];
      this.dialogOnDone = null;
      cb?.();
    } else this.renderDialogLine();
  }

  get dialogOpen(): boolean {
    return !this.elDialog.classList.contains('hidden');
  }

  private renderDialogLine(): void {
    const l = this.dialogLines[this.dialogIdx];
    this.elDialogSpeaker.textContent = l.speaker.toUpperCase();
    this.elDialogText.textContent = l.text;
  }

  showCenterMsg(text: string, durSec = 2.5): void {
    this.elCenterMsg.textContent = text;
    show(this.elCenterMsg);
    this.centerMsgTimer = durSec;
  }

  setPrompt(label: string | null): void {
    if (label) {
      this.elPrompt.textContent = label;
      show(this.elPrompt);
    } else hide(this.elPrompt);
  }

  setActivityText(text: string | null): void {
    if (text) {
      this.elActivity.textContent = text;
      show(this.elActivity);
    } else hide(this.elActivity);
  }

  openWheel(): void {
    if (this.elWheel) return;
    const w = el('div', '', this.root);
    w.id = 'weapon-wheel';
    this.elWheel = w;
    this.wheelOpen = true;
  }

  updateWheel(mouseAngle: number): void {
    if (!this.elWheel) return;
    const ids = this.ctx.combat.order;
    clear(this.elWheel);
    ids.forEach((id, i) => {
      const ang = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
      const r = 110;
      const item = el('div', 'wheel-item', this.elWheel);
      const st = this.ctx.combat.weapons.get(id);
      item.innerHTML = `<div>${st?.def.name ?? id}</div><div>${st ? st.mag + ' / ' + st.reserve : ''}</div>`;
      item.style.left = `${50 + Math.cos(ang) * r / 3.4}%`;
      item.style.top = `${50 + Math.sin(ang) * r / 3.4}%`;
      let d = Math.atan2(Math.sin(mouseAngle - ang), Math.cos(mouseAngle - ang));
      d = Math.abs(d);
      if (d < Math.PI / ids.length) item.classList.add('sel');
    });
  }

  closeWheel(select: boolean): void {
    if (!this.elWheel) return;
    if (select) {
      const ids = this.ctx.combat.order;
      const ang = this.lastWheelAngle;
      let best = 0;
      let bestD = Infinity;
      ids.forEach((id, i) => {
        const a = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
        let d = Math.abs(Math.atan2(Math.sin(ang - a), Math.cos(ang - a)));
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      this.ctx.onWheelSelect(ids[best]);
    }
    this.elWheel.remove();
    this.elWheel = null;
    this.wheelOpen = false;
  }

  lastWheelAngle = -Math.PI / 2;
  get wheelIsOpen(): boolean {
    return this.wheelOpen;
  }

  toggleMap(): void {
    this.mapOpen = !this.mapOpen;
    if (this.mapOpen) this.openMap();
    else this.closeMap();
  }

  get mapIsOpen(): boolean {
    return this.mapOpen;
  }

  private openMap(): void {
    if (this.mapOverlay) {
      show(this.mapOverlay);
      return;
    }
    const ov = el('div', '', this.ctx.events ? document.getElementById('app')! : document.body);
    ov.id = 'map-overlay';
    this.mapCanvas = el('canvas', '', ov) as HTMLCanvasElement;
    this.mapCanvas.id = 'map-canvas';
    this.mapCanvas.width = 980;
    this.mapCanvas.height = 720;
    el('div', '', ov, 'Maus ziehen = verschieben, Rad = Zoom, Klick = GPS-Ziel, M = schließen').id = 'map-hint';
    this.mapOverlay = ov;
    let lastX = 0;
    let lastY = 0;
    this.mapCanvas.addEventListener('mousedown', (e) => {
      this.mapDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener('mouseup', () => (this.mapDragging = false));
    this.mapCanvas.addEventListener('mousemove', (e) => {
      if (!this.mapDragging || !this.mapCanvas) return;
      this.mapPanX += (e.clientX - lastX) / this.mapScale;
      this.mapPanZ += (e.clientY - lastY) / this.mapScale;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    this.mapCanvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.mapScale = clamp(this.mapScale * (e.deltaY < 0 ? 1.15 : 0.87), 0.08, 1.2);
    });
    this.mapCanvas.addEventListener('click', (e) => {
      if (!this.mapCanvas) return;
      const rect = this.mapCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const wx = (mx - this.mapCanvas.width / 2) / this.mapScale - this.mapPanX;
      const wz = (my - this.mapCanvas.height / 2) / this.mapScale - this.mapPanZ;
      this.ctx.onMapClickWorld(wx, wz);
    });
  }

  private closeMap(): void {
    if (this.mapOverlay) hide(this.mapOverlay);
  }

  private drawWaterPath(c: CanvasRenderingContext2D, toMap: (x: number, z: number) => [number, number]): void {
    c.beginPath();
    this.coastPts.forEach((p, i) => {
      const [x, y] = toMap(p.x, p.z);
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    });
    const [ex, ey] = toMap(2400, 1600);
    const [ex2, ey2] = toMap(2400, -1700);
    c.lineTo(ex, ey);
    c.lineTo(ex2, ey2);
    c.closePath();
  }

  private drawHarbor(c: CanvasRenderingContext2D, toMap: (x: number, z: number) => [number, number]): void {
    c.beginPath();
    for (let a = 0; a <= 32; a++) {
      const ang = (a / 32) * Math.PI * 2;
      const [x, y] = toMap(HARBOR.x + Math.cos(ang) * HARBOR.r, HARBOR.z + Math.sin(ang) * HARBOR.r);
      if (a === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
  }

  private renderMinimap(): void {
    const c = this.minimap.getContext('2d')!;
    const S = 210;
    const R = 105;
    const range = this.ctx.player.inVehicleId !== null && this.ctx.vehicles.playerVehicle && this.ctx.vehicles.playerVehicle.speedKmh > 60 ? 320 : 180;
    const px = this.ctx.player.pos.x;
    const pz = this.ctx.player.pos.z;
    const toMap = (x: number, z: number): [number, number] => [R + ((x - px) / range) * R, R + ((z - pz) / range) * R];
    c.clearRect(0, 0, S, S);
    c.save();
    c.beginPath();
    c.arc(R, R, R - 2, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = '#1a2027';
    c.fillRect(0, 0, S, S);
    c.fillStyle = 'rgba(20,124,134,0.55)';
    this.drawWaterPath(c, toMap);
    this.drawHarbor(c, toMap);
    c.fill();
    c.strokeStyle = 'rgba(241,243,245,0.35)';
    c.lineWidth = 1;
    c.beginPath();
    for (const s of this.roadSegs) {
      const [ax, ay] = toMap(s.ax, s.az);
      const [bx, by] = toMap(s.bx, s.bz);
      c.moveTo(ax, ay);
      c.lineTo(bx, by);
    }
    c.stroke();
    const route = this.ctx.getGpsRoute();
    if (route && route.length > 1) {
      c.strokeStyle = '#F4B544';
      c.lineWidth = 2.5;
      c.beginPath();
      route.forEach((p, i) => {
        const [x, y] = toMap(p.x, p.z);
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      });
      c.stroke();
    }
    for (const poi of this.ctx.world.pois) {
      const [x, y] = toMap(poi.position.x, poi.position.z);
      if (x < 4 || x > S - 4 || y < 4 || y > S - 4) continue;
      c.fillStyle = '#F4B544';
      c.font = 'bold 9px system-ui';
      c.textAlign = 'center';
      c.fillText(poi.name[0], x, y + 3);
    }
    for (const u of this.ctx.police.units) {
      const [x, y] = toMap(u.v.pos.x, u.v.pos.z);
      c.fillStyle = '#EB3F47';
      c.beginPath();
      c.arc(x, y, 3, 0, Math.PI * 2);
      c.fill();
    }
    const t = this.ctx.getGpsTarget();
    if (t) {
      const [x, y] = toMap(t.x, t.z);
      c.strokeStyle = '#F4B544';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, 6, 0, Math.PI * 2);
      c.stroke();
    }
    const [plx, ply] = [R, R];
    c.fillStyle = '#F1F3F5';
    c.save();
    c.translate(plx, ply);
    const northUp = this.ctx.settings.minimapNorthUp;
    const rot = northUp ? 0 : -this.ctx.cam.yaw;
    c.rotate(rot + Math.PI);
    c.beginPath();
    c.moveTo(0, -7);
    c.lineTo(5, 6);
    c.lineTo(-5, 6);
    c.closePath();
    c.fill();
    c.restore();
    c.restore();
  }

  private renderMap(): void {
    if (!this.mapCanvas || !this.mapOverlay || this.mapOverlay.classList.contains('hidden')) return;
    const c = this.mapCanvas.getContext('2d')!;
    const W = this.mapCanvas.width;
    const H = this.mapCanvas.height;
    const s = this.mapScale;
    const toMap = (x: number, z: number): [number, number] => [W / 2 + (x + this.mapPanX) * s, H / 2 + (z + this.mapPanZ) * s];
    c.fillStyle = '#0d1218';
    c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(20,124,134,0.6)';
    this.drawWaterPath(c, toMap);
    this.drawHarbor(c, toMap);
    const [ix, iy] = toMap(ISLAND.x, ISLAND.z);
    c.beginPath();
    c.arc(ix, iy, ISLAND.r * s, 0, Math.PI * 2);
    c.fillStyle = 'rgba(216,195,155,0.5)';
    c.fill();
    c.fillStyle = 'rgba(20,124,134,0.6)';
    c.fill();
    c.strokeStyle = 'rgba(241,243,245,0.3)';
    c.lineWidth = 1;
    c.beginPath();
    for (const seg of this.roadSegs) {
      const [ax, ay] = toMap(seg.ax, seg.az);
      const [bx, by] = toMap(seg.bx, seg.bz);
      c.moveTo(ax, ay);
      c.lineTo(bx, by);
    }
    c.stroke();
    c.font = '11px system-ui';
    c.textAlign = 'left';
    for (const poi of this.ctx.world.pois) {
      const [x, y] = toMap(poi.position.x, poi.position.z);
      if (x < 0 || x > W || y < 0 || y > H) continue;
      c.fillStyle = '#F4B544';
      c.fillText(poi.name, x + 4, y);
      c.fillRect(x - 2, y - 8, 4, 4);
    }
    for (const [dx, dz] of [[-500, -200], [1200, 0], [950, 1000], [-750, -500], [-1300, 200], [-1100, 1200], [-1300, -1250], [0, -1250], [700, 1200]] as const) {
      const name = districtAt(dx, dz);
      const [x, y] = toMap(dx, dz);
      c.fillStyle = 'rgba(154,163,173,0.5)';
      c.font = 'italic 13px system-ui';
      c.fillText(name.replace(/_/g, ' ').toUpperCase(), x, y);
      c.font = '11px system-ui';
    }
    const route = this.ctx.getGpsRoute();
    if (route && route.length > 1) {
      c.strokeStyle = '#F4B544';
      c.lineWidth = 3;
      c.beginPath();
      route.forEach((p, i) => {
        const [x, y] = toMap(p.x, p.z);
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      });
      c.stroke();
    }
    const p = this.ctx.player.pos;
    const [px, py] = toMap(p.x, p.z);
    c.fillStyle = '#F1F3F5';
    c.beginPath();
    c.arc(px, py, 5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#F4B544';
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px + Math.sin(this.ctx.cam.yaw) * 16, py + Math.cos(this.ctx.cam.yaw) * 16);
    c.stroke();
    const t = this.ctx.getGpsTarget();
    if (t) {
      const [x, y] = toMap(t.x, t.z);
      c.strokeStyle = '#F4B544';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, 9, 0, Math.PI * 2);
      c.stroke();
    }
    for (const u of this.ctx.police.units) {
      const [x, y] = toMap(u.v.pos.x, u.v.pos.z);
      c.fillStyle = '#EB3F47';
      c.beginPath();
      c.arc(x, y, 4, 0, Math.PI * 2);
      c.fill();
    }
  }

  update(dt: number): void {
    const ctx = this.ctx;
    this.elMoney.textContent = fmtMoney(ctx.economy.cash);
    this.elBank.textContent = `Bank: ${fmtMoney(ctx.economy.bank)}  |  Chips: ${ctx.economy.chips}`;
    let stars = '';
    for (let i = 1; i <= 5; i++) stars += `<span class="${ctx.wanted.level >= i ? 'on' : 'off'}">★</span>`;
    this.elStars.innerHTML = stars;
    if (ctx.wanted.searchActive && !ctx.wanted.hasVisual && ctx.wanted.level > 0) show(this.elSearch);
    else hide(this.elSearch);
    this.elClock.textContent = `${ctx.time.format()}  ${ctx.weather.state}`;

    const hp = clamp(ctx.player.health / 100, 0, 1);
    this.elHealth.style.width = `${hp * 100}%`;
    this.elHealth.parentElement!.classList.toggle('low', hp < 0.35);
    this.elStamina.style.width = `${clamp(ctx.player.stamina / 100, 0, 1) * 100}%`;

    const pv = ctx.vehicles.playerVehicle;
    if (pv) {
      show(this.elVehicle);
      hide(this.elWeapon);
      hide(this.elAmmo);
      this.elSpeed.innerHTML = `${Math.round(pv.speedKmh)} <small>km/h</small>`;
      this.elFuelFill.style.width = `${clamp((pv.fuel / pv.def.tankLiters) * 100, 0, 100)}%`;
      this.elDmgFill.style.width = `${clamp(pv.damage / 10, 0, 100)}%`;
      this.elDmgFill.style.background = pv.damage > 550 ? '#7ddb8a' : pv.damage > 300 ? '#F4B544' : '#EB3F47';
    } else {
      hide(this.elVehicle);
      const w = ctx.combat.currentState;
      if (w) {
        show(this.elWeapon);
        show(this.elAmmo);
        this.elWeapon.textContent = w.def.name;
        this.elAmmo.innerHTML = `${w.mag} <span class="reserve">/ ${w.reserve}</span>`;
        if (ctx.combat.reloadTimer > 0) this.elWeapon.textContent = w.def.name + ' (lädt...)';
      } else {
        hide(this.elWeapon);
        hide(this.elAmmo);
      }
    }

    const aiming = ctx.player.state === 'aim' && ctx.player.inVehicleId === null;
    if (aiming) show(this.elCrosshair);
    else hide(this.elCrosshair);

    if (this.centerMsgTimer > 0) {
      this.centerMsgTimer -= dt;
      if (this.centerMsgTimer <= 0) hide(this.elCenterMsg);
    }

    this.lastMinimap -= dt;
    if (this.lastMinimap <= 0) {
      this.lastMinimap = 0.08;
      this.renderMinimap();
      if (this.mapOpen) this.renderMap();
    }
  }
}

export { PALETTE };
