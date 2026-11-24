import * as THREE from 'three';
import { BilliardsGame, BALL_R, ballGroup, type Ball } from './billiards.ts';
import type { EventBus } from '../core/events.ts';
import type { Economy } from '../economy/economy.ts';

const BALL_COLORS: Record<number, number> = {
  0: 0xf1f3f5,
  1: 0xf4b544,
  2: 0x2478f2,
  3: 0xeb3f47,
  4: 0x7a4fd0,
  5: 0xe97856,
  6: 0x2e8b57,
  7: 0x6b4f2a,
  8: 0x14171a,
  9: 0xf4b544,
  10: 0x2478f2,
  11: 0xeb3f47,
  12: 0x7a4fd0,
  13: 0xe97856,
  14: 0x2e8b57,
  15: 0x6b4f2a,
};

function ballTexture(id: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const base = BALL_COLORS[id] ?? 0xffffff;
  const hex = '#' + base.toString(16).padStart(6, '0');
  ctx.fillStyle = id >= 9 && id <= 15 ? '#f1f3f5' : hex;
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();
  if (id >= 9 && id <= 15) {
    ctx.fillStyle = hex;
    ctx.fillRect(0, 44, 128, 40);
  }
  ctx.fillStyle = id === 0 ? '#14171a' : '#f1f3f5';
  ctx.beginPath();
  ctx.arc(64, 64, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = id === 0 ? '#f1f3f5' : '#14171a';
  ctx.font = 'bold 30px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(id), 64, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class BilliardsSession {
  game = new BilliardsGame();
  scene: THREE.Scene;
  events: EventBus;
  economy: Economy;
  entryPaid: boolean;
  tableCenter: THREE.Vector3;
  tableTopY: number;
  ballMeshes: THREE.Mesh[] = [];
  cueStick: THREE.Mesh;
  aimLine: THREE.Line;
  ghost: THREE.Mesh;
  aimAngle = 0;
  power = 0;
  charging = false;
  wasDown = false;
  mode: 'aim' | 'place' | 'moving' | 'over' = 'aim';
  aiTimer = 0;
  onEnd: ((won: boolean) => void) | null = null;
  private group = new THREE.Group();

  constructor(scene: THREE.Scene, tableCenter: THREE.Vector3, tableTopY: number, events: EventBus, economy: Economy, entryPaid: boolean) {
    this.scene = scene;
    this.events = events;
    this.economy = economy;
    this.entryPaid = entryPaid;
    this.tableCenter = tableCenter.clone();
    this.tableTopY = tableTopY;
    const geo = new THREE.SphereGeometry(BALL_R, 16, 12);
    for (const b of this.game.balls) {
      const mat = new THREE.MeshStandardMaterial({ map: ballTexture(b.id), roughness: 0.25, metalness: 0.05 });
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      this.group.add(m);
      this.ballMeshes.push(m);
    }
    const cueGeo = new THREE.CylinderGeometry(0.02, 0.035, 1.4, 8);
    cueGeo.rotateX(Math.PI / 2);
    this.cueStick = new THREE.Mesh(cueGeo, new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.6 }));
    this.group.add(this.cueStick);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.aimLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xf4b544, transparent: true, opacity: 0.7 }));
    this.group.add(this.aimLine);
    this.ghost = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
    this.ghost.visible = false;
    this.group.add(this.ghost);
    scene.add(this.group);
    this.syncMeshes();
  }

  private syncMeshes(): void {
    this.game.balls.forEach((b: Ball, i: number) => {
      const m = this.ballMeshes[i];
      if (!m) return;
      if (b.pocketed) {
        m.visible = false;
        return;
      }
      m.visible = true;
      m.position.set(this.tableCenter.x + b.x, this.tableTopY + BALL_R, this.tableCenter.z + b.z);
    });
  }

  update(dt: number, input: { mouseDown: (b: 'l') => boolean; mouseDX: number; mouseDY: number } | null, getRay: (() => { origin: THREE.Vector3; dir: THREE.Vector3 }) | null): void {
    if (this.mode === 'over') return;
    if (this.game.anyMoving()) {
      const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
      for (let s = 0; s < steps; s++) this.game.step(dt / steps);
      this.syncMeshes();
      if (!this.game.anyMoving()) {
        const res = this.game.resolveShot();
        this.game.breakShot = false;
        this.events.emit('NOTIFICATION', { text: `Billard: ${res.message}`, kind: res.outcome === 'win' || res.outcome === 'lose' ? 'money' : 'info' });
        if (res.outcome === 'win' || res.outcome === 'lose') {
          this.mode = 'over';
          const won = res.outcome === 'win';
          if (won && this.entryPaid) this.economy.earn(300, 'Billard 8-Ball gewonnen (Einsatz)');
          this.onEnd?.(won);
          return;
        }
        if (this.game.ballInHand && this.game.turn === 0) this.mode = 'place';
        else this.mode = 'aim';
        if (this.game.turn === 1) this.aiTimer = 0.9;
      } else {
        this.mode = 'moving';
      }
    } else if (this.game.turn === 1) {
      this.aiTimer -= dt;
      if (this.aiTimer <= 0) {
        const s = this.game.aiShot();
        this.game.shoot(s.angle, s.power);
        this.mode = 'moving';
      }
    }

    if (this.mode === 'place' && getRay && input) {
      const { origin, dir } = getRay();
      const t = (this.tableTopY - origin.y) / (dir.y || -1e-6);
      if (t > 0) {
        const hx = origin.x + dir.x * t;
        const hz = origin.z + dir.z * t;
        const lx = Math.max(-1.65, Math.min(1.65, hx - this.tableCenter.x));
        const lz = Math.max(-0.8, Math.min(0.8, hz - this.tableCenter.z));
        this.ghost.visible = true;
        this.ghost.position.set(this.tableCenter.x + lx, this.tableTopY + BALL_R, this.tableCenter.z + lz);
        if (input.mouseDown('l') && !this.wasDown) {
          this.game.placeCueBall(lx, lz);
          this.ghost.visible = false;
          this.mode = 'aim';
          this.syncMeshes();
        }
      }
    } else {
      this.ghost.visible = false;
    }

    if (this.mode === 'aim' && this.game.turn === 0 && input) {
      this.aimAngle -= input.mouseDX * 0.006;
      const down = input.mouseDown('l');
      if (down) {
        this.charging = true;
        this.power = Math.min(1, this.power + dt * 1.3);
      } else if (this.wasDown && this.charging && this.power > 0.05) {
        this.game.shoot(this.aimAngle, this.power);
        this.power = 0;
        this.charging = false;
      } else {
        this.power = 0;
        this.charging = false;
      }
      this.wasDown = down;
    }

    const cue = this.game.balls[0];
    const cx = this.tableCenter.x + cue.x;
    const cz = this.tableCenter.z + cue.z;
    const cy = this.tableTopY + BALL_R;
    const back = 0.25 + this.power * 0.35;
    this.cueStick.position.set(cx - Math.cos(this.aimAngle) * back, cy, cz - Math.sin(this.aimAngle) * back);
    this.cueStick.rotation.y = -this.aimAngle + Math.PI / 2;
    const pos = this.aimLine.geometry.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(0, cx, cy, cz);
    pos.setXYZ(1, cx + Math.cos(this.aimAngle) * 1.4, cy, cz + Math.sin(this.aimAngle) * 1.4);
    pos.needsUpdate = true;
    this.aimLine.visible = this.mode === 'aim' && this.game.turn === 0 && !this.game.anyMoving();
  }

  statusText(): string {
    const g = this.game;
    if (this.mode === 'over') return `Billard beendet - ${g.winner === 0 ? 'Du hast gewonnen!' : 'KI hat gewonnen.'}`;
    const turnTxt = g.turn === 0 ? 'DU' : 'KI';
    const grpTxt = g.assigned ? ` | Deine Gruppe: ${g.groups[0] === 'solids' ? 'Voll' : 'Halb'} (${g.ballsLeft(0)} übrig) | KI: ${g.groups[1] === 'solids' ? 'Voll' : 'Halb'} (${g.ballsLeft(1)} übrig)` : ' | Gruppen noch offen';
    const modeTxt = this.mode === 'place' ? ' | Ball in Hand: klicken zum Platzieren' : this.mode === 'aim' ? ` | Maus = Winkel, LMB halten = Kraft ${(this.power * 100).toFixed(0)}%, loslassen = Stoß` : ' | Kugeln rollen...';
    return `8-BALL - Zug: ${turnTxt}${grpTxt}${modeTxt}`;
  }

  dispose(): void {
    this.scene.remove(this.group);
  }
}

export { ballGroup };
