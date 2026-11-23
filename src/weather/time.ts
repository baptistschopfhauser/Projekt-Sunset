import { TIME } from '../core/config.ts';
import { EventBus } from '../core/events.ts';

export type DayPhase = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night';

export class TimeSystem {
  minutes: number;
  events: EventBus;
  private lastPhase: DayPhase | null = null;

  constructor(events: EventBus, startMinutes?: number) {
    this.events = events;
    this.minutes = startMinutes ?? TIME.startHour * 60;
  }

  get hour(): number {
    return this.minutes / 60;
  }

  get phase(): DayPhase {
    const h = this.hour % 24;
    if (h >= 5 && h < 7) return 'dawn';
    if (h >= 7 && h < 11) return 'morning';
    if (h >= 11 && h < 16) return 'midday';
    if (h >= 16 && h < 19) return 'afternoon';
    if (h >= 19 && h < 21) return 'dusk';
    return 'night';
  }

  update(dtSec: number): void {
    this.minutes = (this.minutes + dtSec * TIME.minutesPerRealSecond * 60) % TIME.dayMinutes;
    const p = this.phase;
    if (p !== this.lastPhase) {
      this.lastPhase = p;
      this.events.emit('TIME_OF_DAY_CHANGED', { hour: this.hour, phase: p });
    }
  }

  addHours(h: number): void {
    this.minutes = (this.minutes + h * 60) % TIME.dayMinutes;
  }

  format(): string {
    const h = Math.floor(this.hour) % 24;
    const m = Math.floor(this.minutes % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
