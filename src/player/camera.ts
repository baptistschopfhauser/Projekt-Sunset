import * as THREE from 'three';
import { clamp, damp, lerp } from '../core/math.ts';
import type { AABBCollider } from '../core/types.ts';
import { rayAABB } from '../core/math.ts';

export type CameraMode = 'third' | 'aim' | 'vehicle' | 'hood' | 'interior';

export class CameraRig {
  yaw = Math.PI;
  pitch = -0.18;
  mode: CameraMode = 'third';
  dist = 3.2;
  aimDist = 2.1;
  vehicleDist = 6.5;
  fov = 68;
  shake = 0;
  private smoothedPos = new THREE.Vector3();
  private hasPos = false;

  updateFromMouse(dx: number, dy: number, sens: number, invertY: boolean): void {
    this.yaw -= dx * 0.0022 * sens;
    const inv = invertY ? -1 : 1;
    this.pitch -= dy * 0.0022 * sens * inv;
    this.pitch = clamp(this.pitch, -1.25, 0.85);
  }

  addShake(amount: number): void {
    this.shake = Math.min(1, this.shake + amount);
  }

  update(dt: number, camera: THREE.PerspectiveCamera, target: THREE.Vector3, opts: { mode: CameraMode; speed: number; colliders: AABBCollider[]; collide: boolean }): void {
    const mode = opts.mode;
    let wantDist = this.dist;
    if (mode === 'aim') wantDist = this.aimDist;
    else if (mode === 'vehicle') wantDist = this.vehicleDist + clamp(opts.speed / 40, 0, 2.5);
    else if (mode === 'hood') wantDist = 0.1;
    this.dist = damp(this.dist, wantDist, 8, dt);

    const eyeHeight = mode === 'vehicle' ? 1.1 : 1.55;
    const head = target.clone();
    head.y += eyeHeight;

    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    const back = dir.clone().multiplyScalar(-1);
    let d = this.dist;
    if (opts.collide && d > 0.4) {
      for (const c of opts.colliders) {
        const t = rayAABB(head, back, c.min, c.max, d + 0.5);
        if (t !== null && t < d) d = Math.max(0.4, t - 0.3);
      }
    }
    const desired = head.clone().addScaledVector(back, d);
    if (desired.y < 0.4) desired.y = 0.4;
    if (!this.hasPos) {
      this.smoothedPos.copy(desired);
      this.hasPos = true;
    }
    this.smoothedPos = this.smoothedPos.clone().lerp(desired, 1 - Math.exp(-14 * dt));

    let shakeX = 0;
    let shakeY = 0;
    if (this.shake > 0.001) {
      shakeX = (Math.random() - 0.5) * this.shake * 0.12;
      shakeY = (Math.random() - 0.5) * this.shake * 0.12;
      this.shake = Math.max(0, this.shake - dt * 2.2);
    }
    camera.position.copy(this.smoothedPos).add(new THREE.Vector3(shakeX, shakeY, 0));
    camera.lookAt(head.clone().addScaledVector(dir, 6));

    const targetFov = mode === 'vehicle' ? lerp(68, 82, clamp(opts.speed / 55, 0, 1)) : this.fov;
    camera.fov = damp(camera.fov, targetFov, 6, dt);
    camera.updateProjectionMatrix();
  }

  forwardVector(): THREE.Vector3 {
    return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
  }

  reset(): void {
    this.hasPos = false;
    this.shake = 0;
  }
}
