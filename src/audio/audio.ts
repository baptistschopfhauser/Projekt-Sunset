import { clamp, lerp } from '../core/math.ts';
import type { SettingsData } from '../core/types.ts';

export type MusicMood = 'explore' | 'pursuit' | 'mission' | 'casino' | 'menu';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private rainSrc: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private waveSrc: AudioBufferSourceNode | null = null;
  private waveGain: GainNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;
  private mood: MusicMood = 'menu';
  settings: SettingsData;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(settings: SettingsData) {
    this.settings = settings;
  }

  init(): void {
    if (this.ctx) return;
    try {
      this.ctx = new AudioContext();
    } catch {
      return;
    }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.applyVolumes();

    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 600;
    this.engineOsc = ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc2 = ctx.createOscillator();
    this.engineOsc2.type = 'square';
    const g2 = ctx.createGain();
    g2.gain.value = 0.4;
    this.engineOsc.connect(this.engineFilter);
    this.engineOsc2.connect(g2);
    g2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxBus);
    this.engineOsc.start();
    this.engineOsc2.start();

    this.sirenGain = ctx.createGain();
    this.sirenGain.gain.value = 0;
    this.sirenOsc = ctx.createOscillator();
    this.sirenOsc.type = 'sine';
    this.sirenOsc.frequency.value = 700;
    this.sirenOsc2 = ctx.createOscillator();
    this.sirenOsc2.type = 'sine';
    this.sirenOsc2.frequency.value = 950;
    this.sirenLfo = ctx.createOscillator();
    this.sirenLfo.frequency.value = 1.4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 120;
    this.sirenLfo.connect(lfoGain);
    lfoGain.connect(this.sirenOsc.frequency);
    this.sirenOsc.connect(this.sirenGain);
    this.sirenOsc2.connect(this.sirenGain);
    this.sirenGain.connect(this.sfxBus);
    this.sirenOsc.start();
    this.sirenOsc2.start();
    this.sirenLfo.start();

    const len = ctx.sampleRate * 2;
    this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1800;
    this.rainSrc = ctx.createBufferSource();
    this.rainSrc.buffer = this.noiseBuffer;
    this.rainSrc.loop = true;
    this.rainSrc.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.sfxBus);
    this.rainSrc.start();

    this.waveGain = ctx.createGain();
    this.waveGain.gain.value = 0;
    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.value = 400;
    this.waveSrc = ctx.createBufferSource();
    this.waveSrc.buffer = this.noiseBuffer;
    this.waveSrc.loop = true;
    this.waveSrc.playbackRate.value = 0.3;
    this.waveSrc.connect(waveFilter);
    waveFilter.connect(this.waveGain);
    this.waveGain.connect(this.sfxBus);
    this.waveSrc.start();
  }

  resume(): void {
    this.ctx?.resume();
  }

  applyVolumes(): void {
    if (!this.master || !this.musicBus || !this.sfxBus) return;
    this.master.gain.value = this.settings.masterVolume;
    this.musicBus.gain.value = this.settings.musicVolume;
    this.sfxBus.gain.value = this.settings.sfxVolume;
  }

  setMood(mood: MusicMood): void {
    if (this.mood === mood) return;
    this.mood = mood;
    this.musicStep = 0;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (!this.ctx || !this.musicBus) return;
    const patterns: Record<MusicMood, { bass: number[]; pad: number[]; stepMs: number }> = {
      menu: { bass: [110, 0, 130.8, 0], pad: [220, 261.6, 329.6], stepMs: 420 },
      explore: { bass: [98, 0, 87.3, 0, 98, 0, 116.5, 0], pad: [196, 246.9, 293.7, 246.9], stepMs: 480 },
      pursuit: { bass: [110, 110, 116.5, 110, 98, 98, 103.8, 98], pad: [220, 233.1, 220, 246.9], stepMs: 190 },
      mission: { bass: [87.3, 0, 110, 0, 98, 0, 130.8, 0], pad: [174.6, 220, 261.6, 220], stepMs: 300 },
      casino: { bass: [130.8, 0, 155.6, 0, 130.8, 0, 196, 0], pad: [261.6, 311.1, 392, 311.1], stepMs: 380 },
    };
    const pat = patterns[mood];
    this.musicTimer = setInterval(() => {
      if (!this.ctx || !this.musicBus) return;
      const t = this.ctx.currentTime;
      const bassF = pat.bass[this.musicStep % pat.bass.length];
      if (bassF > 0) this.note(bassF, t, pat.stepMs / 1000 * 0.9, 'triangle', 0.16);
      const padF = pat.pad[this.musicStep % pat.pad.length];
      this.note(padF, t, pat.stepMs / 1000 * 1.8, 'sine', 0.07);
      this.musicStep++;
    }, pat.stepMs);
  }

  private note(freq: number, t: number, dur: number, type: OscillatorType, vol: number): void {
    if (!this.ctx || !this.musicBus) return;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.musicBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private burst(freq: number, dur: number, type: OscillatorType, vol: number, filterFreq: number, dist = 0): void {
    if (!this.ctx || !this.sfxBus) return;
    const t = this.ctx.currentTime;
    const att = clamp(1 - dist / 120, 0, 1);
    if (att <= 0) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol * att, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + dur + 0.02);
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(vol * 0.6 * att, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6);
    o.connect(g2);
    g2.connect(this.sfxBus);
    o.start(t);
    o.stop(t + dur);
  }

  shot(weaponId: string, dist = 0): void {
    const big = weaponId === 'ironwood_12' || weaponId === 'ranger_m14';
    this.burst(big ? 300 : 500, big ? 0.35 : 0.18, 'square', big ? 0.5 : 0.32, big ? 900 : 1600, dist);
  }

  impact(dist = 0): void {
    this.burst(1200, 0.08, 'square', 0.12, 2400, dist);
  }

  footstep(): void {
    this.burst(180, 0.06, 'sine', 0.08, 500, 0);
  }

  uiClick(): void {
    this.burst(800, 0.05, 'sine', 0.1, 1200, 0);
  }

  cash(): void {
    this.burst(1400, 0.12, 'sine', 0.14, 2000, 0);
    setTimeout(() => this.burst(1800, 0.1, 'sine', 0.1, 2400, 0), 70);
  }

  error(): void {
    this.burst(160, 0.18, 'square', 0.12, 400, 0);
  }

  thunder(): void {
    this.burst(60, 1.4, 'sawtooth', 0.3, 120, 0);
  }

  crash(strength: number, dist = 0): void {
    this.burst(120, 0.4, 'sawtooth', clamp(strength / 30, 0.1, 0.5), 300, dist);
  }

  horn(dist = 0): void {
    if (!this.ctx || !this.sfxBus) return;
    const t = this.ctx.currentTime;
    const att = clamp(1 - dist / 90, 0, 1);
    for (const f of [370, 466]) {
      const o = this.ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.06 * att, t);
      g.gain.setValueAtTime(0.06 * att, t + 0.25);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g);
      g.connect(this.sfxBus);
      o.start(t);
      o.stop(t + 0.32);
    }
  }

  engineUpdate(running: boolean, rpm01: number, speedKmh: number): void {
    if (!this.ctx || !this.engineOsc || !this.engineGain || !this.engineFilter) return;
    if (!running) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      return;
    }
    const f = 45 + rpm01 * 160 + speedKmh * 0.15;
    this.engineOsc.frequency.setTargetAtTime(f, this.ctx.currentTime, 0.05);
    this.engineOsc2!.frequency.setTargetAtTime(f * 0.5, this.ctx.currentTime, 0.05);
    this.engineFilter.frequency.setTargetAtTime(300 + rpm01 * 1400, this.ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(0.05 + rpm01 * 0.06, this.ctx.currentTime, 0.08);
  }

  sirenUpdate(active: boolean, dist: number): void {
    if (!this.ctx || !this.sirenGain) return;
    if (!active) {
      this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      return;
    }
    const att = clamp(1 - dist / 260, 0, 1);
    this.sirenGain.gain.setTargetAtTime(0.05 * att, this.ctx.currentTime, 0.2);
  }

  rainUpdate(intensity: number): void {
    if (!this.ctx || !this.rainGain) return;
    this.rainGain.gain.setTargetAtTime(intensity * 0.12, this.ctx.currentTime, 0.4);
  }

  wavesUpdate(level: number): void {
    if (!this.ctx || !this.waveGain) return;
    this.waveGain.gain.setTargetAtTime(level * 0.1, this.ctx.currentTime, 0.6);
  }

  update(dt: number): void {
    void dt;
    this.applyVolumes();
  }
}
