import * as THREE from 'three';
import { PALETTE } from '../core/config.ts';
import { clamp, lerp } from '../core/math.ts';

export interface SunInfo {
  dir: THREE.Vector3;
  elevation: number;
  nightFactor: number;
  sunsetFactor: number;
  color: THREE.Color;
}

export function sunFromHour(hour: number): SunInfo {
  const t = ((hour - 6) / 12 + 1) % 1;
  const elev = Math.sin(t * Math.PI) * 1.05;
  const azim = t * Math.PI * 2 + Math.PI * 0.5;
  const dir = new THREE.Vector3(Math.cos(azim) * Math.cos(elev), Math.sin(elev), Math.sin(azim) * Math.cos(elev)).normalize();
  const nightFactor = clamp(0.5 - elev * 2.2, 0, 1);
  const sunsetFactor = clamp(1 - Math.abs(elev) * 6, 0, 1) * (1 - nightFactor);
  const color = new THREE.Color();
  if (elev > 0.25) color.setHex(0xfff4e0);
  else if (elev > 0.02) color.setHex(PALETTE.sunsetGold);
  else color.setHex(PALETTE.coralOrange);
  return { dir, elevation: elev, nightFactor, sunsetFactor, color };
}

export class Lighting {
  sun: THREE.DirectionalLight;
  moon: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
  lampPool: THREE.PointLight[] = [];
  lampPoolParent: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.sun = new THREE.DirectionalLight(0xffffff, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 10;
    this.sun.shadow.camera.far = 700;
    const ext = 140;
    this.sun.shadow.camera.left = -ext;
    this.sun.shadow.camera.right = ext;
    this.sun.shadow.camera.top = ext;
    this.sun.shadow.camera.bottom = -ext;
    this.sun.shadow.bias = -0.0006;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.moon = new THREE.DirectionalLight(0x8fa8ff, 0);
    scene.add(this.moon);
    scene.add(this.moon.target);

    this.hemi = new THREE.HemisphereLight(0xbfd9e8, 0x4a4f45, 0.7);
    scene.add(this.hemi);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.12);
    scene.add(this.ambient);

    this.lampPoolParent = new THREE.Group();
    scene.add(this.lampPoolParent);
    for (let i = 0; i < 8; i++) {
      const l = new THREE.PointLight(0xffd9a0, 0, 34, 2);
      this.lampPool.push(l);
      this.lampPoolParent.add(l);
    }
  }

  update(sun: SunInfo, playerPos: THREE.Vector3, timeSec: number, lampPositions: THREE.Vector3[], qualityShadows: boolean, shadowSize: number): void {
    const dayI = clamp(sun.elevation * 3.2, 0, 1);
    this.sun.intensity = 0.15 + dayI * 2.6;
    this.sun.color.copy(sun.color);
    this.sun.position.copy(playerPos).addScaledVector(sun.dir, 320);
    this.sun.target.position.copy(playerPos);
    this.sun.castShadow = qualityShadows && sun.elevation > -0.05;
    if (this.sun.shadow.mapSize.x !== shadowSize) {
      this.sun.shadow.mapSize.set(shadowSize, shadowSize);
      if (this.sun.shadow.map) {
        this.sun.shadow.map.dispose();
        this.sun.shadow.map = null;
      }
    }
    this.moon.intensity = sun.nightFactor * 0.35;
    this.moon.position.copy(playerPos).addScaledVector(new THREE.Vector3(0.4, 1, 0.3).normalize(), 300);
    this.moon.target.position.copy(playerPos);
    this.hemi.intensity = lerp(0.75, 0.22, sun.nightFactor);
    this.hemi.color.setHex(0xbfd9e8).lerp(new THREE.Color(PALETTE.midnightNavy), sun.nightFactor);
    this.ambient.intensity = lerp(0.14, 0.05, sun.nightFactor);

    const active = Math.min(8, lampPositions.length);
    const sorted = lampPositions
      .map((p) => ({ p, d: p.distanceToSquared(playerPos) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, active);
    for (let i = 0; i < this.lampPool.length; i++) {
      const l = this.lampPool[i];
      if (i < sorted.length && sun.nightFactor > 0.15) {
        l.position.copy(sorted[i].p);
        l.intensity = sun.nightFactor * 26 * (1 - sorted[i].d / (40 * 40));
      } else {
        l.intensity = 0;
      }
    }
    void timeSec;
  }
}
