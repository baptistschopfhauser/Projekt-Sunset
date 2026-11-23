import * as THREE from 'three';
import { PLAYER } from '../core/config.ts';
import { clamp } from '../core/math.ts';
import { heightAt, isWater } from '../world/terrain.ts';
import type { AABBCollider } from '../core/types.ts';
import type { Input } from './input.ts';
import { buildCharacter, animateCharacter, applyStyle, ALEX_STYLE, type CharacterParts, type CharacterStyle, type AnimState } from './character.ts';
import { EventBus } from '../core/events.ts';

export type PlayerState = 'idle' | 'walk' | 'sprint' | 'crouch' | 'jump' | 'fall' | 'swim' | 'aim' | 'dead' | 'sit' | 'in_vehicle';

export class Player {
  pos = new THREE.Vector3(PLAYER.startPosition.x, 0, PLAYER.startPosition.z);
  vel = new THREE.Vector3();
  yaw = Math.PI;
  health = PLAYER.maxHealth;
  stamina = PLAYER.maxStamina;
  state: PlayerState = 'idle';
  parts: CharacterParts;
  group: THREE.Group;
  onGround = true;
  private staminaDelay = 0;
  private animT = 0;
  dead = false;
  events: EventBus;
  inVehicleId: number | null = null;
  swimBlocked = false;
  style: CharacterStyle = { ...ALEX_STYLE };

  setStyle(s: CharacterStyle): void {
    this.style = { ...s };
    applyStyle(this.parts, this.style);
  }

  constructor(scene: THREE.Scene, events: EventBus) {
    this.events = events;
    this.parts = buildCharacter(ALEX_STYLE);
    this.group = this.parts.group;
    scene.add(this.group);
    this.pos.y = heightAt(this.pos.x, this.pos.z);
  }

  get speed(): number {
    return Math.hypot(this.vel.x, this.vel.z);
  }

  headPos(): THREE.Vector3 {
    return new THREE.Vector3(this.pos.x, this.pos.y + 1.55, this.pos.z);
  }

  damage(amount: number, cause: string): void {
    if (this.dead) return;
    this.health = clamp(this.health - amount, 0, this.health);
    this.events.emit('PLAYER_HEALTH_CHANGED', { health: this.health });
    if (this.health <= 0) {
      this.dead = true;
      this.state = 'dead';
      this.events.emit('PLAYER_DIED', { cause });
    }
  }

  heal(amount: number): void {
    this.health = clamp(this.health + amount, 0, PLAYER.maxHealth);
    this.events.emit('PLAYER_HEALTH_CHANGED', { health: this.health });
  }

  update(dt: number, input: Input, camYaw: number, colliders: AABBCollider[], aiming: boolean, crouching: boolean): void {
    if (this.dead) {
      animateCharacter(this.parts, 'dead', 0, this.animT, 0, dt);
      this.group.position.copy(this.pos);
      this.group.rotation.y = this.yaw;
      return;
    }
    if (this.inVehicleId !== null) return;

    const f = new THREE.Vector3(Math.sin(camYaw), 0, Math.cos(camYaw));
    const r = new THREE.Vector3(-f.z, 0, f.x);
    let mx = 0;
    let mz = 0;
    if (input.down('KeyW')) mz += 1;
    if (input.down('KeyS')) mz -= 1;
    if (input.down('KeyD')) mx += 1;
    if (input.down('KeyA')) mx -= 1;
    const moving = mx !== 0 || mz !== 0;
    if (moving) {
      const inv = 1 / Math.hypot(mx, mz);
      mx *= inv;
      mz *= inv;
    }

    let speed = PLAYER.jogSpeed;
    const wantSprint = input.down('ShiftLeft') || input.down('ShiftRight');
    let sprinting = false;
    if (wantSprint && moving && mz > -0.2 && this.stamina > 0 && !aiming && !crouching) {
      speed = PLAYER.sprintSpeed;
      sprinting = true;
      this.stamina = clamp(this.stamina - PLAYER.staminaDrainPerSec * dt, 0, PLAYER.maxStamina);
      this.staminaDelay = PLAYER.staminaRegenDelay;
    } else {
      this.staminaDelay -= dt;
      if (this.staminaDelay <= 0) this.stamina = clamp(this.stamina + PLAYER.staminaRegenPerSec * dt, 0, PLAYER.maxStamina);
    }
    if (crouching) speed = PLAYER.crouchSpeed;
    else if (aiming) speed = PLAYER.aimSpeed;
    else if (!sprinting && moving && mz < 0) speed = PLAYER.backwardSpeed;
    if (!moving) speed = 0;

    const dir = new THREE.Vector3();
    if (moving) dir.copy(f).multiplyScalar(mz).addScaledVector(r, mx).normalize();

    const waterHere = isWater(this.pos.x, this.pos.z) && heightAt(this.pos.x, this.pos.z) < 0.4;
    const deepWater = isWater(this.pos.x, this.pos.z) && heightAt(this.pos.x, this.pos.z) < -2.0;
    const swimming = waterHere && !deepWater;

    const accel = this.onGround ? 22 : 8;
    this.vel.x = clamp(this.vel.x + dir.x * speed * accel * dt, -speed * 1.2, speed * 1.2);
    this.vel.z = clamp(this.vel.z + dir.z * speed * accel * dt, -speed * 1.2, speed * 1.2);
    if (!moving && this.onGround) {
      const fr = Math.exp(-12 * dt);
      this.vel.x *= fr;
      this.vel.z *= fr;
    }

    let nx = this.pos.x + this.vel.x * dt;
    let nz = this.pos.z + this.vel.z * dt;

    if (deepWater) {
      nx = this.pos.x;
      nz = this.pos.z;
      this.vel.x = 0;
      this.vel.z = 0;
    }

    let groundY = heightAt(nx, nz);
    for (const c of colliders) {
      if (nx + PLAYER.radius < c.min.x || nx - PLAYER.radius > c.max.x || nz + PLAYER.radius < c.min.z || nz - PLAYER.radius > c.max.z) continue;
      if (c.min.y >= this.pos.y + 0.45) continue;
      if (c.max.y <= this.pos.y + 0.06) continue;
      if (c.max.y - groundY <= 0.45 && c.min.y <= groundY + 0.01) {
        groundY = Math.max(groundY, c.max.y);
        continue;
      }
      const px = nx;
      const pz = nz;
      if (px + PLAYER.radius < c.min.x || px - PLAYER.radius > c.max.x || pz + PLAYER.radius < c.min.z || pz - PLAYER.radius > c.max.z) continue;
      const cx = clamp(px, c.min.x, c.max.x);
      const cz = clamp(pz, c.min.z, c.max.z);
      let dx = px - cx;
      let dz = pz - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 > PLAYER.radius * PLAYER.radius) continue;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2);
        nx = cx + (dx / d) * PLAYER.radius;
        nz = cz + (dz / d) * PLAYER.radius;
      } else {
        const left = px - c.min.x + PLAYER.radius;
        const right = c.max.x - px + PLAYER.radius;
        const top = pz - c.min.z + PLAYER.radius;
        const bottom = c.max.z - pz + PLAYER.radius;
        const m = Math.min(left, right, top, bottom);
        if (m === left) nx = c.min.x - PLAYER.radius;
        else if (m === right) nx = c.max.x + PLAYER.radius;
        else if (m === top) nz = c.min.z - PLAYER.radius;
        else nz = c.max.z + PLAYER.radius;
      }
      this.vel.x *= 0.4;
      this.vel.z *= 0.4;
    }

    this.pos.x = nx;
    this.pos.z = nz;

    if (swimming) {
      const swimSpeed = PLAYER.swimSpeed;
      this.pos.y = 0.06 - 0.45;
      this.vel.y = 0;
      this.onGround = false;
      this.state = 'swim';
      if (moving) this.yaw = Math.atan2(dir.x, dir.z);
      void swimSpeed;
    } else {
      const g = 22;
      this.vel.y -= g * dt;
      this.pos.y += this.vel.y * dt;
      if (this.pos.y <= groundY) {
        if (!this.onGround && this.vel.y < -9) {
          this.damage(Math.min(40, (-this.vel.y - 9) * 4), 'fall');
        }
        this.pos.y = groundY;
        this.vel.y = 0;
        this.onGround = true;
        if (input.wasPressed('Space') && this.onGround) {
          this.vel.y = Math.sqrt(2 * g * PLAYER.jumpHeight);
          this.onGround = false;
        }
      } else if (this.pos.y > groundY + 0.05) {
        this.onGround = false;
      }

      if (!this.onGround) {
        this.state = this.vel.y < -2 ? 'fall' : 'jump';
      } else if (aiming) this.state = 'aim';
      else if (crouching) this.state = 'crouch';
      else if (sprinting) this.state = 'sprint';
      else if (moving) this.state = 'walk';
      else this.state = 'idle';

      if (moving && this.onGround) {
        this.yaw = Math.atan2(this.vel.x, this.vel.z);
      }
    }

    this.animT += dt * (this.state === 'sprint' ? 1.35 : 1);
    const animState: AnimState = this.dead ? 'dead' : this.state === 'aim' ? 'aim' : this.state === 'crouch' ? 'crouch' : this.state === 'jump' ? 'jump' : this.state === 'fall' ? 'fall' : this.state === 'sprint' ? 'sprint' : this.state === 'walk' || this.state === 'swim' ? 'walk' : 'idle';
    animateCharacter(this.parts, animState, this.speed, this.animT, 0, dt);
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.yaw;
  }

  teleport(x: number, y: number, z: number, yaw: number): void {
    this.pos.set(x, y, z);
    this.vel.set(0, 0, 0);
    this.yaw = yaw;
    this.onGround = true;
  }
}
