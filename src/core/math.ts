import * as THREE from 'three';

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const damp = (a: number, b: number, lambda: number, dt: number): number => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const smoothstep = (t: number): number => t * t * (3 - 2 * t);

export const TAU = Math.PI * 2;

export function angleLerp(a: number, b: number, t: number): number {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return a + d * t;
}

export function angleDelta(a: number, b: number): number {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

export function dist2D(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dz * dz);
}

export interface RayHit {
  dist: number;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  kind: 'terrain' | 'building' | 'vehicle' | 'ped' | 'prop';
  ref?: unknown;
}

export function rayAABB(origin: THREE.Vector3, dir: THREE.Vector3, min: THREE.Vector3, max: THREE.Vector3, maxDist: number): number | null {
  let tmin = 0;
  let tmax = maxDist;
  const o = [origin.x, origin.y, origin.z];
  const d = [dir.x, dir.y, dir.z];
  const mn = [min.x, min.y, min.z];
  const mx = [max.x, max.y, max.z];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < mn[i] || o[i] > mx[i]) return null;
    } else {
      const inv = 1 / d[i];
      let t1 = (mn[i] - o[i]) * inv;
      let t2 = (mx[i] - o[i]) * inv;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}

export function raySphere(origin: THREE.Vector3, dir: THREE.Vector3, center: THREE.Vector3, radius: number, maxDist: number): number | null {
  const ox = origin.x - center.x;
  const oy = origin.y - center.y;
  const oz = origin.z - center.z;
  const b = ox * dir.x + oy * dir.y + oz * dir.z;
  const c = ox * ox + oy * oy + oz * oz - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  if (t < 0 || t > maxDist) return null;
  return t;
}

export function rayCapsule(origin: THREE.Vector3, dir: THREE.Vector3, base: THREE.Vector3, height: number, radius: number, maxDist: number): number | null {
  const top = base.clone();
  top.y += height;
  const rBottom = raySphere(origin, dir, base.clone().setY(base.y + radius), radius, maxDist);
  const rTop = raySphere(origin, dir, top.clone().setY(top.y - radius), radius, maxDist);
  let best: number | null = null;
  if (rBottom !== null && (best === null || rBottom < best)) best = rBottom;
  if (rTop !== null && (best === null || rTop < best)) best = rTop;
  const p0 = base.clone().setY(base.y + radius);
  const p1 = top.clone().setY(top.y - radius);
  const d = p1.clone().sub(p0);
  const len = d.length();
  if (len > 1e-6) {
    d.divideScalar(len);
    const oc = origin.clone().sub(p0);
    const a = dir.dot(dir);
    const b = 2 * oc.dot(dir);
    const c = oc.dot(oc) - radius * radius;
    const bb = oc.dot(d);
    const cc = oc.lengthSq();
    const disc = bb * bb - (cc - radius * radius);
    if (disc >= 0) {
      const t = (-bb - Math.sqrt(disc)) / a;
      if (t >= 0 && t <= maxDist) {
        const hit = origin.clone().addScaledVector(dir, t);
        const proj = hit.clone().sub(p0).dot(d);
        if (proj >= 0 && proj <= len) {
          if (best === null || t < best) best = t;
        }
      }
    }
  }
  return best;
}

export function circleAABBResolve(px: number, pz: number, radius: number, min: THREE.Vector3, max: THREE.Vector3): { x: number; z: number; hit: boolean } {
  if (px + radius < min.x || px - radius > max.x || pz + radius < min.z || pz - radius > max.z) {
    return { x: px, z: pz, hit: false };
  }
  const cx = clamp(px, min.x, max.x);
  const cz = clamp(pz, min.z, max.z);
  let dx = px - cx;
  let dz = pz - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 > radius * radius) return { x: px, z: pz, hit: false };
  if (d2 > 1e-9) {
    const d = Math.sqrt(d2);
    dx /= d;
    dz /= d;
    return { x: cx + dx * radius, z: cz + dz * radius, hit: true };
  }
  const left = px - min.x + radius;
  const right = max.x - px + radius;
  const top = pz - min.z + radius;
  const bottom = max.z - pz + radius;
  const m = Math.min(left, right, top, bottom);
  if (m === left) return { x: min.x - radius, z: pz, hit: true };
  if (m === right) return { x: max.x + radius, z: pz, hit: true };
  if (m === top) return { x: px, z: min.z - radius, hit: true };
  return { x: px, z: max.z + radius, hit: true };
}

export function pointInAABB2D(x: number, z: number, min: THREE.Vector3, max: THREE.Vector3): boolean {
  return x >= min.x && x <= max.x && z >= min.z && z <= max.z;
}

export function segmentXZ(ax: number, az: number, bx: number, bz: number, cx: number, cz: number, hw: number): boolean {
  const abx = bx - ax;
  const abz = bz - az;
  const len2 = abx * abx + abz * abz;
  if (len2 < 1e-9) return dist2D(ax, az, cx, cz) <= hw;
  let t = ((cx - ax) * abx + (cz - az) * abz) / len2;
  t = clamp(t, 0, 1);
  return dist2D(ax + abx * t, az + abz * t, cx, cz) <= hw;
}

export function losBlocked(ax: number, ay: number, az: number, bx: number, by: number, bz: number, colliders: { min: THREE.Vector3; max: THREE.Vector3 }[]): boolean {
  const o = new THREE.Vector3(ax, ay, az);
  const t = new THREE.Vector3(bx, by, bz);
  const dir = t.clone().sub(o);
  const dist = dir.length();
  if (dist < 1e-6) return false;
  dir.divideScalar(dist);
  for (const c of colliders) {
    if (rayAABB(o, dir, c.min, c.max, dist) !== null) return true;
  }
  return false;
}
