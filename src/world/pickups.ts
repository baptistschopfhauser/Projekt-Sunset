import * as THREE from 'three';
import { heightAt } from './terrain.ts';

export interface Pickup {
  id: number;
  kind: 'weapon' | 'cash';
  weaponId?: string;
  amount: number;
  pos: THREE.Vector3;
  mesh: THREE.Group;
}

let nextPickupId = 1;

export class PickupManager {
  scene: THREE.Scene;
  pickups: Pickup[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnCash(x: number, z: number, amount: number): void {
    const g = new THREE.Group();
    const bill = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.14), new THREE.MeshStandardMaterial({ color: 0x4c8a4f, roughness: 0.6 }));
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.16), new THREE.MeshStandardMaterial({ color: 0xd8c39b }));
    g.add(bill, band);
    const y = heightAt(x, z);
    g.position.set(x, y + 0.15, z);
    this.scene.add(g);
    this.pickups.push({ id: nextPickupId++, kind: 'cash', amount, pos: new THREE.Vector3(x, y, z), mesh: g });
  }

  spawnWeapon(x: number, z: number, weaponId: string): void {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.36), new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.4, metalness: 0.7 }));
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.07), new THREE.MeshStandardMaterial({ color: 0x2a2d33 }));
    grip.position.set(0, -0.09, 0.12);
    g.add(body, grip);
    const y = heightAt(x, z);
    g.position.set(x, y + 0.2, z);
    this.scene.add(g);
    this.pickups.push({ id: nextPickupId++, kind: 'weapon', weaponId, amount: 0, pos: new THREE.Vector3(x, y, z), mesh: g });
  }

  nearest(pos: THREE.Vector3, maxDist: number): Pickup | null {
    let best: Pickup | null = null;
    let bd = maxDist;
    for (const p of this.pickups) {
      const d = Math.hypot(p.pos.x - pos.x, p.pos.z - pos.z);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  remove(p: Pickup): void {
    this.scene.remove(p.mesh);
    const i = this.pickups.indexOf(p);
    if (i >= 0) this.pickups.splice(i, 1);
  }

  update(dt: number, timeSec: number): void {
    for (const p of this.pickups) {
      p.mesh.position.y = p.pos.y + 0.15 + Math.sin(timeSec * 2.4 + p.id) * 0.05;
      p.mesh.rotation.y = timeSec * 1.4 + p.id;
    }
    void dt;
  }

  clear(): void {
    for (const p of this.pickups) this.scene.remove(p.mesh);
    this.pickups = [];
  }
}
