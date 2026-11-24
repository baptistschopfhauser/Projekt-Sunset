import { WANTED } from '../core/config.ts';
import type { EventBus } from '../core/events.ts';

export class WantedSystem {
  points = 0;
  level = 0;
  lastSeenPos = { x: 0, y: 0, z: 0 };
  lastSeenTime = -1;
  hasVisual = false;
  searchActive = false;
  private loseTimer = 0;
  events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
  }

  addCrime(severity: number): void {
    const before = this.level;
    this.points += severity;
    this.level = this.levelForPoints(this.points);
    if (this.level > 0) {
      this.searchActive = true;
      if (this.level > before) this.events.emit('POLICE_SEARCH_STARTED', { level: this.level });
      this.events.emit('WANTED_LEVEL_CHANGED', { level: this.level, points: this.points });
    }
  }

  levelForPoints(p: number): number {
    let lvl = 0;
    for (let i = 1; i < WANTED.thresholds.length; i++) {
      if (p >= WANTED.thresholds[i]) lvl = i;
    }
    return Math.min(lvl, WANTED.maxLevel);
  }

  markVisual(x: number, y: number, z: number, time: number): void {
    this.hasVisual = true;
    this.lastSeenPos = { x, y, z };
    this.lastSeenTime = time;
  }

  update(dt: number, hasVisual: boolean, time: number): void {
    this.hasVisual = hasVisual;
    if (this.level <= 0) {
      if (this.searchActive) {
        this.searchActive = false;
        this.events.emit('POLICE_SEARCH_ENDED', {});
      }
      this.points = Math.max(0, this.points - WANTED.decayPointsPerSec * dt);
      return;
    }
    if (hasVisual) {
      this.loseTimer = 0;
      this.lastSeenTime = time;
      return;
    }
    this.loseTimer += dt;
    const need = WANTED.loseTimers[Math.min(this.level, WANTED.loseTimers.length - 1)];
    if (this.loseTimer >= need) {
      this.loseTimer = 0;
      this.level = Math.max(0, this.level - 1);
      this.points = WANTED.thresholds[this.level] ?? 0;
      this.events.emit('WANTED_LEVEL_CHANGED', { level: this.level, points: this.points });
      if (this.level === 0) {
        this.searchActive = false;
        this.events.emit('POLICE_SEARCH_ENDED', {});
      }
    }
  }

  reset(): void {
    this.points = 0;
    this.level = 0;
    this.searchActive = false;
    this.hasVisual = false;
    this.loseTimer = 0;
  }
}
