import * as THREE from 'three';

export function explosionDamage(dist: number, maxDamage = 70): number {
  if (dist >= 12) return 0;
  if (dist < 2.5) return maxDamage;
  return maxDamage * (1 - dist / 12) * (1 - dist / 12);
}

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

export class DamageFX {
  scene: THREE.Scene;
  private particles: Particle[] = [];
  private points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private posAttr: THREE.BufferAttribute;
  private sizeAttr: THREE.BufferAttribute;
  private flashLights: THREE.PointLight[] = [];
  private flashIdx = 0;
  private smokeTimer = 0;

  constructor(scene: THREE.Scene, capacity = 600) {
    this.scene = scene;
    this.geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3);
    this.sizeAttr = new THREE.BufferAttribute(new Float32Array(capacity), 1);
    this.geo.setAttribute('position', this.posAttr);
    this.geo.setAttribute('size', this.sizeAttr);
    const mat = new THREE.PointsMaterial({ color: 0xbbbbbb, size: 0.5, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    for (let i = 0; i < 3; i++) {
      const l = new THREE.PointLight(0xffa040, 0, 60, 2);
      scene.add(l);
      this.flashLights.push(l);
    }
  }

  private emit(pos: THREE.Vector3, vel: THREE.Vector3, life: number, size: number): void {
    if (this.particles.length >= 590) this.particles.shift();
    this.particles.push({ pos: pos.clone(), vel: vel.clone(), life, maxLife: life, size });
  }

  smoke(pos: THREE.Vector3, big = false): void {
    const n = big ? 3 : 1;
    for (let i = 0; i < n; i++) {
      this.emit(
        pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.4, (Math.random() - 0.5) * 0.6)),
        new THREE.Vector3((Math.random() - 0.5) * 0.5, 1.2 + Math.random() * 0.8, (Math.random() - 0.5) * 0.5),
        1.6 + Math.random(),
        big ? 1.6 : 0.9
      );
    }
  }

  explosion(pos: THREE.Vector3): void {
    const l = this.flashLights[this.flashIdx++ % this.flashLights.length];
    l.position.copy(pos).add(new THREE.Vector3(0, 2, 0));
    l.intensity = 900;
    for (let i = 0; i < 46; i++) {
      const dir = new THREE.Vector3().randomDirection();
      dir.y = Math.abs(dir.y) * 0.8;
      this.emit(
        pos.clone().add(new THREE.Vector3(0, 0.8, 0)),
        dir.multiplyScalar(4 + Math.random() * 11),
        0.7 + Math.random() * 0.9,
        1.2 + Math.random() * 1.8
      );
    }
  }

  clear(): void {
    this.particles = [];
    for (const l of this.flashLights) l.intensity = 0;
  }

  update(dt: number): void {
    this.smokeTimer -= dt;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 2.2 * dt;
      p.vel.multiplyScalar(Math.max(0, 1 - 1.4 * dt));
      p.pos.addScaledVector(p.vel, dt);
    }
    const n = this.particles.length;
    for (let i = 0; i < 600; i++) {
      if (i < n) {
        const p = this.particles[i];
        this.posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
        this.sizeAttr.setX(i, p.size * (p.life / p.maxLife + 0.3));
      } else {
        this.posAttr.setXYZ(i, 0, -100, 0);
        this.sizeAttr.setX(i, 0.001);
      }
    }
    this.posAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
    this.geo.setDrawRange(0, 600);
    for (const l of this.flashLights) l.intensity = Math.max(0, l.intensity - dt * 2600);
    void this.smokeTimer;
  }
}
