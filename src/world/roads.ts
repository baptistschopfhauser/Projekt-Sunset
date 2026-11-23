import { RNG } from '../core/rng.ts';
import { WORLD, districtAt } from '../core/config.ts';
import { isLand, coastX, ISLAND } from './terrain.ts';

export type RoadKind = 'street' | 'avenue' | 'ring' | 'bridge' | 'promenade';

export interface RoadNode {
  id: number;
  x: number;
  z: number;
  adj: { to: number; edge: number }[];
  degree: number;
  light: number;
  ring: boolean;
}

export interface RoadEdge {
  id: number;
  a: number;
  b: number;
  len: number;
  dx: number;
  dz: number;
  kind: RoadKind;
  speedLimit: number;
}

export const LANE_OFFSET = 2.75;
export const ROAD_HALF_WIDTH = 5.5;
export const SIDEWALK_WIDTH = 3.0;

export class RoadGraph {
  nodes: RoadNode[] = [];
  edges: RoadEdge[] = [];
  streetXs: number[] = [];
  streetZs: number[] = [];
  private nodeGrid = new Map<string, number>();

  addNode(x: number, z: number, ring = false): number {
    const key = `${Math.round(x)}_${Math.round(z)}`;
    const existing = this.nodeGrid.get(key);
    if (existing !== undefined) return existing;
    const id = this.nodes.length;
    this.nodes.push({ id, x, z, adj: [], degree: 0, light: -1, ring });
    this.nodeGrid.set(key, id);
    return id;
  }

  addEdge(a: number, b: number, kind: RoadKind): number {
    const na = this.nodes[a];
    const nb = this.nodes[b];
    const dx = nb.x - na.x;
    const dz = nb.z - na.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 1) return -1;
    const speedLimit = kind === 'ring' || kind === 'bridge' ? 90 : kind === 'avenue' || kind === 'promenade' ? 60 : 50;
    const id = this.edges.length;
    this.edges.push({ id, a, b, len, dx: dx / len, dz: dz / len, kind, speedLimit });
    na.adj.push({ to: b, edge: id });
    nb.adj.push({ to: a, edge: id });
    na.degree++;
    nb.degree++;
    return id;
  }

  finalizeLights(): void {
    for (const n of this.nodes) {
      if (n.degree >= 4 && !n.ring) {
        n.light = (Math.abs(Math.round(n.x * 7 + n.z * 13)) % 2);
      }
    }
  }

  lightState(nodeId: number, timeSec: number): 'green' | 'red' | 'none' {
    const n = this.nodes[nodeId];
    if (n.light < 0) return 'none';
    const cycle = 16;
    const t = timeSec % cycle;
    const greenNS = t < cycle / 2;
    return (n.light === 0) === greenNS ? 'green' : 'red';
  }

  nearestNode(x: number, z: number): number {
    let best = -1;
    let bestD = Infinity;
    for (const n of this.nodes) {
      const dx = n.x - x;
      const dz = n.z - z;
      const d = dx * dx + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = n.id;
      }
    }
    return best;
  }

  nearestEdgePoint(x: number, z: number): { nodeA: number; nodeB: number; t: number; dist: number } {
    let best = { nodeA: -1, nodeB: -1, t: 0.5, dist: Infinity };
    for (const e of this.edges) {
      const a = this.nodes[e.a];
      const b = this.nodes[e.b];
      const abx = b.x - a.x;
      const abz = b.z - a.z;
      const len2 = abx * abx + abz * abz;
      if (len2 < 1e-6) continue;
      let t = ((x - a.x) * abx + (z - a.z) * abz) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = a.x + abx * t;
      const pz = a.z + abz * t;
      const dx = x - px;
      const dz = z - pz;
      const d = dx * dx + dz * dz;
      if (d < best.dist) best = { nodeA: e.a, nodeB: e.b, t, dist: d };
    }
    return best;
  }

  pointOnEdge(edgeId: number, t: number, side: 1 | -1): { x: number; z: number; dx: number; dz: number } {
    const e = this.edges[edgeId];
    const a = this.nodes[e.a];
    const b = this.nodes[e.b];
    const x = a.x + (b.x - a.x) * t;
    const z = a.z + (b.z - a.z) * t;
    const rx = -e.dz * side * LANE_OFFSET;
    const rz = e.dx * side * LANE_OFFSET;
    return { x: x + rx, z: z + rz, dx: e.dx, dz: e.dz };
  }

  astar(from: number, to: number): number[] {
    if (from === to) return [from];
    const n = this.nodes.length;
    const g = new Float64Array(n).fill(Infinity);
    const parent = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    g[from] = 0;
    const open: { id: number; f: number }[] = [{ id: from, f: 0 }];
    const target = this.nodes[to];
    while (open.length > 0) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (cur.id === to) break;
      if (closed[cur.id]) continue;
      closed[cur.id] = 1;
      const node = this.nodes[cur.id];
      for (const a of node.adj) {
        if (closed[a.to]) continue;
        const ng = g[cur.id] + this.edges[a.edge].len;
        if (ng < g[a.to]) {
          g[a.to] = ng;
          parent[a.to] = cur.id;
          const dx = target.x - this.nodes[a.to].x;
          const dz = target.z - this.nodes[a.to].z;
          const f = ng + Math.sqrt(dx * dx + dz * dz);
          open.push({ id: a.to, f });
        }
      }
    }
    if (parent[to] === -1 && to !== from) return [from];
    const path: number[] = [];
    let cur = to;
    while (cur !== -1) {
      path.push(cur);
      if (cur === from) break;
      cur = parent[cur];
    }
    path.reverse();
    return path;
  }

  pathLength(path: number[]): number {
    let len = 0;
    for (let i = 0; i < path.length - 1; i++) {
      for (const a of this.nodes[path[i]].adj) {
        if (a.to === path[i + 1]) {
          len += this.edges[a.edge].len;
          break;
        }
      }
    }
    return len;
  }

  routeTo(fromX: number, fromZ: number, toX: number, toZ: number): { nodes: number[]; points: { x: number; z: number }[] } {
    const a = this.nearestNode(fromX, fromZ);
    const b = this.nearestNode(toX, toZ);
    const nodes = this.astar(a, b);
    const points: { x: number; z: number }[] = [{ x: fromX, z: fromZ }];
    for (const id of nodes) points.push({ x: this.nodes[id].x, z: this.nodes[id].z });
    points.push({ x: toX, z: toZ });
    return { nodes, points };
  }
}

export function buildRoadGraph(seed: number): RoadGraph {
  const rng = new RNG(seed);
  const g = new RoadGraph();
  const xs: number[] = [];
  let x = WORLD.minX + 72;
  while (x < WORLD.maxX - 40) {
    xs.push(x);
    x += rng.range(76, 118);
  }
  xs.push(WORLD.maxX - 40);
  const zs: number[] = [];
  let z = WORLD.minZ + 72;
  while (z < WORLD.maxZ - 40) {
    zs.push(z);
    z += rng.range(76, 118);
  }
  zs.push(WORLD.maxZ - 40);

  const nodeAt = new Map<string, number>();
  for (const sx of xs) {
    for (const sz of zs) {
      if (!isLand(sx, sz)) continue;
      if (sx > coastX(sz) - 60) continue;
      const d = districtAt(sx, sz);
      if (d === 'blackwater_marsh' && rng.chance(0.55)) continue;
      if (d === 'solace_beach' && sx > coastX(sz) - 220 && rng.chance(0.7)) continue;
      if (d !== 'meridian_downtown' && d !== 'iron_docks' && rng.chance(0.08)) continue;
      const id = g.addNode(sx, sz);
      nodeAt.set(`${xs.indexOf(sx)}_${zs.indexOf(sz)}`, id);
    }
  }

  const idx = (i: number, j: number): number | undefined => nodeAt.get(`${i}_${j}`);
  for (let i = 0; i < xs.length; i++) {
    for (let j = 0; j < zs.length; j++) {
      const here = idx(i, j);
      if (here === undefined) continue;
      const right = idx(i + 1, j);
      const down = idx(i, j + 1);
      const kind: RoadKind = i % 4 === 0 || j % 4 === 0 ? 'avenue' : 'street';
      if (right !== undefined) g.addEdge(here, right, kind);
      if (down !== undefined) g.addEdge(here, down, kind);
    }
  }

  const ringPts: { x: number; z: number }[] = [];
  const corners = [
    { x: WORLD.minX + 60, z: WORLD.minZ + 60 },
    { x: 1330, z: WORLD.minZ + 60 },
    { x: 1330, z: WORLD.maxZ - 60 },
    { x: WORLD.minX + 60, z: WORLD.maxZ - 60 },
  ];
  for (let c = 0; c < 4; c++) {
    const a = corners[c];
    const b = corners[(c + 1) % 4];
    const steps = Math.max(2, Math.round(Math.max(Math.abs(b.x - a.x), Math.abs(b.z - a.z)) / 96));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const px = a.x + (b.x - a.x) * t;
      const pz = a.z + (b.z - a.z) * t;
      if (isLand(px, pz) && px < coastX(pz) - 60) ringPts.push({ x: px, z: pz });
    }
  }
  let prevRing = -1;
  for (const p of ringPts) {
    const id = g.addNode(p.x, p.z, true);
    if (prevRing >= 0) g.addEdge(prevRing, id, 'ring');
    prevRing = id;
    const near = g.nearestNode(p.x, p.z);
    if (near >= 0 && near !== id) {
      const d = Math.hypot(g.nodes[near].x - p.x, g.nodes[near].z - p.z);
      if (d < 160) g.addEdge(near, id, 'ring');
    }
  }
  if (ringPts.length > 2) {
    g.addEdge(prevRing, g.nodes.findIndex((n) => n.ring), 'ring');
  }

  const bridgeStartX = coastX(ISLAND.z) - 30;
  const b0 = g.addNode(bridgeStartX, ISLAND.z);
  const b1 = g.addNode(ISLAND.x - ISLAND.r + 20, ISLAND.z);
  g.addEdge(b0, b1, 'bridge');
  const nearCoast = g.nearestNode(bridgeStartX, ISLAND.z);
  if (nearCoast !== b0) g.addEdge(nearCoast, b0, 'bridge');
  const islandNodes: number[] = [];
  const ic = g.addNode(ISLAND.x, ISLAND.z);
  islandNodes.push(ic);
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * Math.PI * 2;
    const id = g.addNode(ISLAND.x + Math.cos(ang) * (ISLAND.r - 25), ISLAND.z + Math.sin(ang) * (ISLAND.r - 25));
    g.addEdge(ic, id, 'promenade');
    islandNodes.push(id);
    if (k > 0) g.addEdge(islandNodes[k], islandNodes[k - 1], 'promenade');
  }
  g.addEdge(b1, ic, 'bridge');
  g.addEdge(islandNodes[8] !== undefined ? islandNodes[8] : ic, islandNodes[0], 'promenade');

  let prevBridge = -1;
  for (let bx = -1320; bx <= -480; bx += 96) {
    const id = g.addNode(bx, 1430);
    if (prevBridge >= 0) g.addEdge(prevBridge, id, 'bridge');
    prevBridge = id;
    const near = g.nearestNode(bx, 1430);
    if (near >= 0 && near !== id) {
      const d = Math.hypot(g.nodes[near].x - bx, g.nodes[near].z - 1430);
      if (d < 170) g.addEdge(near, id, 'bridge');
    }
  }

  g.streetXs = xs;
  g.streetZs = zs;
  g.finalizeLights();
  return g;
}
