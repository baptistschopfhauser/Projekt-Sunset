import * as THREE from 'three';
import { WEATHER } from '../core/config.ts';
import { RNG, globalRng } from '../core/rng.ts';
import { EventBus } from '../core/events.ts';
import { clamp, lerp } from '../core/math.ts';

export type WeatherState = 'CLEAR' | 'PARTLY_CLOUDY' | 'OVERCAST' | 'RAIN' | 'THUNDERSTORM';

export class WeatherSystem {
  state: WeatherState = 'CLEAR';
  cloudiness = 0.15;
  rainIntensity = 0;
  wetness = 0;
  wind = 2;
  private timer = 0;
  private nextChange = 300;
  private rng: RNG;
  events: EventBus;
  rain: THREE.Points | null = null;
  private rainMat: THREE.PointsMaterial | null = null;
  private drops: Float32Array | null = null;
  private lightningTimer = 0;
  lightningFlash = 0;
  onThunder: (() => void) | null = null;

  constructor(events: EventBus, scene: THREE.Scene, seed = 1234) {
    this.events = events;
    this.rng = new RNG(seed);
    const geo = new THREE.BufferGeometry();
    this.drops = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      this.drops[i * 3] = globalRng.range(-40, 40);
      this.drops[i * 3 + 1] = globalRng.range(0, 30);
      this.drops[i * 3 + 2] = globalRng.range(-40, 40);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.drops, 3));
    this.rainMat = new THREE.PointsMaterial({ color: 0xaac4d8, size: 0.09, transparent: true, opacity: 0, depthWrite: false });
    this.rain = new THREE.Points(geo, this.rainMat);
    this.rain.frustumCulled = false;
    scene.add(this.rain);
  }

  private pickNext(): void {
    const w = WEATHER.weights;
    const entries = Object.entries(w) as [WeatherState, number][];
    let r = this.rng.float();
    let pick: WeatherState = 'CLEAR';
    for (const [k, p] of entries) {
      r -= p;
      if (r <= 0) {
        pick = k;
        break;
      }
    }
    this.setState(pick);
    this.nextChange = this.rng.range(WEATHER.minDurationSec, WEATHER.maxDurationSec);
  }

  setState(s: WeatherState): void {
    if (s === this.state) return;
    this.state = s;
    this.events.emit('WEATHER_CHANGED', { weather: s });
  }

  get tractionMultiplier(): number {
    return this.state === 'RAIN' || this.state === 'THUNDERSTORM' ? 0.78 : 1;
  }

  get fogDensityBoost(): number {
    return this.state === 'OVERCAST' ? 0.25 : this.state === 'RAIN' ? 0.55 : this.state === 'THUNDERSTORM' ? 0.8 : 0;
  }

  update(dt: number, camPos: THREE.Vector3): void {
    this.timer += dt;
    if (this.timer > this.nextChange) {
      this.timer = 0;
      this.pickNext();
    }
    const targetCloud = this.state === 'CLEAR' ? 0.12 : this.state === 'PARTLY_CLOUDY' ? 0.4 : this.state === 'OVERCAST' ? 0.85 : 1;
    const targetRain = this.state === 'RAIN' ? 0.7 : this.state === 'THUNDERSTORM' ? 1 : 0;
    const targetWind = this.state === 'THUNDERSTORM' ? 14 : this.state === 'RAIN' ? 7 : this.state === 'OVERCAST' ? 5 : 2.5;
    this.cloudiness = lerp(this.cloudiness, targetCloud, dt * 0.2);
    this.rainIntensity = lerp(this.rainIntensity, targetRain, dt * 0.5);
    this.wind = lerp(this.wind, targetWind, dt * 0.3);
    this.wetness = clamp(this.wetness + (this.rainIntensity > 0.3 ? dt * 0.25 : -dt * 0.02), 0, 1);

    if (this.rain && this.rainMat && this.drops) {
      this.rainMat.opacity = this.rainIntensity * 0.75;
      this.rain.position.copy(camPos);
      const pos = this.rain.geometry.attributes.position as THREE.BufferAttribute;
      const n = 1500;
      const fall = (18 + this.rainIntensity * 10) * dt;
      for (let i = 0; i < n; i++) {
        let y = this.drops[i * 3 + 1] - fall;
        if (y < 0) y = 30;
        this.drops[i * 3 + 1] = y;
        this.drops[i * 3] += this.wind * dt * 0.4;
        if (this.drops[i * 3] > 40) this.drops[i * 3] = -40;
      }
      pos.needsUpdate = true;
    }

    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 3);
    if (this.state === 'THUNDERSTORM') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = this.rng.range(3, 12);
        this.lightningFlash = 1;
        if (this.onThunder) setTimeout(() => this.onThunder?.(), this.rng.range(400, 2200));
      }
    }
  }
}
