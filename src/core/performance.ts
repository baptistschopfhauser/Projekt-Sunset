import type { QualityLevel } from './config.ts';
import { QUALITY } from './config.ts';

export const QUALITY_ORDER: QualityLevel[] = ['low', 'medium', 'high', 'ultra'];

export class PerformanceManager {
  configuredMax: QualityLevel;
  current: QualityLevel;
  private acc = 0;
  private frames = 0;
  private windowTimer = 0;
  private lowStreak = 0;
  private highStreak = 0;
  private lastChange = 0;
  onChange: ((q: QualityLevel) => void) | null = null;

  constructor(initial: QualityLevel) {
    this.configuredMax = initial;
    this.current = initial;
  }

  setConfiguredMax(q: QualityLevel): void {
    this.configuredMax = q;
    if (QUALITY_ORDER.indexOf(this.current) > QUALITY_ORDER.indexOf(q)) this.current = q;
  }

  update(frameDt: number, nowSec: number): void {
    this.acc += frameDt;
    this.frames++;
    this.windowTimer += frameDt;
    if (this.windowTimer >= 2) {
      const fps = this.frames / this.windowTimer;
      this.acc = 0;
      this.frames = 0;
      this.windowTimer = 0;
      if (nowSec - this.lastChange < 6) return;
      const idx = QUALITY_ORDER.indexOf(this.current);
      if (fps < 45) {
        this.lowStreak++;
        this.highStreak = 0;
        if (this.lowStreak >= 2 && idx > 0) {
          this.current = QUALITY_ORDER[idx - 1];
          this.lowStreak = 0;
          this.lastChange = nowSec;
          this.onChange?.(this.current);
        }
      } else if (fps > 57) {
        this.highStreak++;
        this.lowStreak = 0;
        const maxIdx = QUALITY_ORDER.indexOf(this.configuredMax);
        if (this.highStreak >= 3 && idx < maxIdx) {
          this.current = QUALITY_ORDER[idx + 1];
          this.highStreak = 0;
          this.lastChange = nowSec;
          this.onChange?.(this.current);
        }
      } else {
        this.lowStreak = 0;
        this.highStreak = 0;
      }
    }
  }
}

export { QUALITY };
