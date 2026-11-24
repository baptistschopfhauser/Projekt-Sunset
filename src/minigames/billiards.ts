export interface Ball {
  id: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  active: boolean;
  pocketed: boolean;
  _counted?: boolean;
}

export type BallGroup = 'none' | 'solids' | 'stripes' | 'eight';

export function ballGroup(id: number): BallGroup {
  if (id === 0) return 'none';
  if (id === 8) return 'eight';
  return id <= 7 ? 'solids' : 'stripes';
}

export const BALL_R = 0.057;
export const POCKET_R = 0.13;

export interface Pocket {
  x: number;
  z: number;
}

export interface TableSpec {
  halfX: number;
  halfZ: number;
  pockets: Pocket[];
}

export function defaultTable(): TableSpec {
  const hx = 1.7;
  const hz = 0.85;
  return {
    halfX: hx,
    halfZ: hz,
    pockets: [
      { x: -hx, z: -hz },
      { x: hx, z: -hz },
      { x: -hx, z: hz },
      { x: hx, z: hz },
      { x: 0, z: -hz },
      { x: 0, z: hz },
    ],
  };
}

export type ShotOutcome = 'continue' | 'turn' | 'foul' | 'win' | 'lose';

export interface ShotResult {
  outcome: ShotOutcome;
  pocketed: number[];
  foul: boolean;
  message: string;
}

export class BilliardsGame {
  table: TableSpec;
  balls: Ball[] = [];
  turn: 0 | 1 = 0;
  groups: [BallGroup, BallGroup] = ['none', 'none'];
  assigned = false;
  over = false;
  winner: 0 | 1 | null = null;
  ballInHand = false;
  breakShot = true;
  lastResult: ShotResult | null = null;
  shotsTaken = 0;

  constructor(table = defaultTable()) {
    this.table = table;
    this.reset();
  }

  reset(): void {
    this.balls = [];
    this.balls.push({ id: 0, x: -this.table.halfX * 0.7, z: 0, vx: 0, vz: 0, active: true, pocketed: false });
    let id = 1;
    const rows = 5;
    const dx = BALL_R * 2.02;
    const startX = this.table.halfX * 0.55;
    for (let row = 0; row < rows; row++) {
      for (let i = 0; i <= row; i++) {
        const x = startX + row * dx;
        const z = (i - row / 2) * dx;
        if (id === 8) {
          this.balls.push({ id: 8, x, z, vx: 0, vz: 0, active: true, pocketed: false });
          id++;
          continue;
        }
        const ballId = id <= 15 ? id : id;
        this.balls.push({ id: ballId, x, z, vx: 0, vz: 0, active: true, pocketed: false });
        id++;
      }
    }
    while (this.balls.length < 16) {
      this.balls.push({ id: id++, x: startX + Math.random(), z: Math.random() - 0.5, vx: 0, vz: 0, active: true, pocketed: false });
    }
    this.turn = 0;
    this.groups = ['none', 'none'];
    this.assigned = false;
    this.over = false;
    this.winner = null;
    this.ballInHand = false;
    this.breakShot = true;
    this.lastResult = null;
    this.shotsTaken = 0;
  }

  anyMoving(): boolean {
    return this.balls.some((b) => b.active && (Math.abs(b.vx) > 0.01 || Math.abs(b.vz) > 0.01));
  }

  step(dt: number): void {
    const fr = Math.exp(-0.55 * dt);
    for (const b of this.balls) {
      if (!b.active || b.pocketed) continue;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.vx *= fr;
      b.vz *= fr;
      if (Math.abs(b.vx) < 0.01) b.vx = 0;
      if (Math.abs(b.vz) < 0.01) b.vz = 0;
      const hx = this.table.halfX - BALL_R;
      const hz = this.table.halfZ - BALL_R;
      if (b.x < -hx) {
        b.x = -hx;
        b.vx = Math.abs(b.vx) * 0.72;
      }
      if (b.x > hx) {
        b.x = hx;
        b.vx = -Math.abs(b.vx) * 0.72;
      }
      if (b.z < -hz) {
        b.z = -hz;
        b.vz = Math.abs(b.vz) * 0.72;
      }
      if (b.z > hz) {
        b.z = hz;
        b.vz = -Math.abs(b.vz) * 0.72;
      }
      for (const p of this.table.pockets) {
        const dx = b.x - p.x;
        const dz = b.z - p.z;
        if (dx * dx + dz * dz < POCKET_R * POCKET_R) {
          b.active = false;
          b.pocketed = true;
          b.vx = 0;
          b.vz = 0;
        }
      }
    }
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const a = this.balls[i];
        const b = this.balls[j];
        if (!a.active || !b.active) continue;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const d2 = dx * dx + dz * dz;
        const minD = BALL_R * 2;
        if (d2 >= minD * minD || d2 < 1e-12) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const nz = dz / d;
        const overlap = minD - d;
        a.x -= nx * overlap / 2;
        a.z -= nz * overlap / 2;
        b.x += nx * overlap / 2;
        b.z += nz * overlap / 2;
        const p = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
        if (p > 0) {
          a.vx -= p * nx;
          a.vz -= p * nz;
          b.vx += p * nx;
          b.vz += p * nz;
        }
      }
    }
  }

  placeCueBall(x: number, z: number): void {
    const cue = this.balls[0];
    cue.active = true;
    cue.pocketed = false;
    cue.x = Math.max(-this.table.halfX + BALL_R, Math.min(this.table.halfX - BALL_R, x));
    cue.z = Math.max(-this.table.halfZ + BALL_R, Math.min(this.table.halfZ - BALL_R, z));
    cue.vx = 0;
    cue.vz = 0;
    this.ballInHand = false;
  }

  shoot(angle: number, power: number): boolean {
    if (this.over || this.anyMoving()) return false;
    const cue = this.balls[0];
    if (!cue.active || cue.pocketed) return false;
    const speed = 2 + power * 13;
    cue.vx = Math.cos(angle) * speed;
    cue.vz = Math.sin(angle) * speed;
    this.shotsTaken++;
    return true;
  }

  resolveShot(): ShotResult {
    const pocketed: number[] = [];
    for (const b of this.balls) {
      if (b.pocketed && !b._counted) {
        pocketed.push(b.id);
        b._counted = true;
      }
    }
    for (const b of this.balls) b._counted = false;

    const cuePocketed = pocketed.includes(0);
    const eightPocketed = pocketed.includes(8);
    const me = this.turn;
    const myGroup = this.groups[me];

    let foul = false;
    let message = '';

    if (!this.assigned && pocketed.length > 0 && !cuePocketed) {
      const first = pocketed.find((id) => id !== 0 && id !== 8);
      if (first !== undefined) {
        const g = ballGroup(first);
        if (g === 'solids' || g === 'stripes') {
          this.groups[me] = g;
          this.groups[1 - me] = g === 'solids' ? 'stripes' : 'solids';
          this.assigned = true;
        }
      }
    }

    if (cuePocketed) {
      foul = true;
      this.ballInHand = true;
      message = 'Foul: Weiße versenkt - Ball in Hand';
    }

    if (eightPocketed) {
      const cleared = this.groupCleared(me);
      if (cleared && !foul) {
        this.over = true;
        this.winner = me;
        message = 'Acht versenkt - GEWONNEN!';
        return { outcome: 'win', pocketed, foul, message };
      }
      this.over = true;
      this.winner = (1 - me) as 0 | 1;
      message = 'Acht zu früh versenkt - VERLOREN';
      return { outcome: 'lose', pocketed, foul, message };
    }

    if (foul) {
      this.turn = 1 - me as 0 | 1;
      if (cuePocketed) this.balls[0].active = false;
      return { outcome: 'foul', pocketed, foul, message };
    }

    const myBallsPocketed = pocketed.filter((id) => ballGroup(id) === myGroup && myGroup !== 'none').length;
    if (myBallsPocketed === 0) {
      this.turn = (1 - me) as 0 | 1;
      message = 'Nichts versenkt - Wechsel';
      return { outcome: 'turn', pocketed, foul, message };
    }
    message = `${myBallsPocketed} versenkt - du bist dran`;
    return { outcome: 'continue', pocketed, foul, message };
  }

  groupCleared(player: 0 | 1): boolean {
    const g = this.groups[player];
    if (g === 'none') return false;
    return !this.balls.some((b) => ballGroup(b.id) === g && !b.pocketed);
  }

  ballsLeft(player: 0 | 1): number {
    const g = this.groups[player];
    if (g === 'none') return 7;
    return this.balls.filter((b) => ballGroup(b.id) === g && !b.pocketed).length;
  }

  aiShot(): { angle: number; power: number } {
    const me = this.turn;
    const cue = this.balls[0];
    const g = this.groups[me];
    let targets: Ball[];
    if (g !== 'none' && this.groupCleared(me)) targets = this.balls.filter((b) => b.id === 8 && !b.pocketed);
    else if (g === 'none') targets = this.balls.filter((b) => b.id !== 0 && b.id !== 8 && !b.pocketed);
    else targets = this.balls.filter((b) => ballGroup(b.id) === g && !b.pocketed);
    if (targets.length === 0) targets = this.balls.filter((b) => b.id !== 0 && !b.pocketed);
    let best: Ball | null = null;
    let bestD = Infinity;
    for (const t of targets) {
      const d = Math.hypot(t.x - cue.x, t.z - cue.z);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    if (!best) return { angle: 0, power: 0.5 };
    const pocket = this.table.pockets.reduce((a, p) => {
      const da = Math.hypot(best!.x - p.x, best!.z - p.z);
      const db = Math.hypot(a.x - best!.x, a.z - best!.z);
      return da < db ? p : a;
    });
    const tx = pocket.x - best.x;
    const tz = pocket.z - best.z;
    const tl = Math.hypot(tx, tz) || 1;
    const aimX = best.x - (tx / tl) * BALL_R * 2;
    const aimZ = best.z - (tz / tl) * BALL_R * 2;
    const angle = Math.atan2(aimZ - cue.z, aimX - cue.x) + (Math.random() - 0.5) * 0.06;
    const power = Math.min(1, 0.35 + bestD * 0.25);
    return { angle, power };
  }
}
