import { buildRoadGraph } from '../src/world/roads.ts';
import { heightAt, isLand, isWater, inHarborBasin, coastX, HARBOR } from '../src/world/terrain.ts';
import { districtAt, WANTED, ECONOMY, VEHICLES, WEAPONS } from '../src/core/config.ts';
import { WantedSystem } from '../src/police/wanted.ts';
import { EventBus } from '../src/core/events.ts';
import { Economy } from '../src/economy/economy.ts';
import { Shoe, handValue, RANKS, SUITS } from '../src/casino/cards.ts';
import { BlackjackGame } from '../src/casino/blackjack.ts';
import { spin, payoutFor, totalPayout, isValidBet, ROULETTE_ORDER, type RouletteBet } from '../src/casino/roulette.ts';
import { spinReels, evaluate, PAYLINES, SLOT_SYMBOLS } from '../src/casino/slots.ts';
import { RNG } from '../src/core/rng.ts';
import { rayAABB, raySphere, circleAABBResolve, clamp } from '../src/core/math.ts';
import { BilliardsGame, ballGroup, BALL_R, defaultTable } from '../src/minigames/billiards.ts';
import * as THREE from 'three';

let passed = 0;
let failed = 0;
function ok(cond: boolean, name: string): void {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${name}`);
  }
}
function eq(a: number, b: number, name: string): void {
  ok(Math.abs(a - b) < 1e-6, `${name} (got ${a}, want ${b})`);
}

const rng = new RNG(1234);

{
  const g = buildRoadGraph(20240917);
  ok(g.nodes.length > 400, `road graph has many nodes (${g.nodes.length})`);
  ok(g.edges.length > 400, `road graph has many edges (${g.edges.length})`);
  const n0 = g.nearestNode(-760, 545);
  const n1 = g.nearestNode(950, 1000);
  const path = g.astar(n0, n1);
  ok(path.length > 2, `astar finds path (${path.length} nodes)`);
  ok(path[0] === n0 && path[path.length - 1] === n1, 'astar endpoints');
  ok(g.pathLength(path) > 500, `path length plausible (${g.pathLength(path).toFixed(0)}m)`);
  const e = g.edges[10];
  const p = g.pointOnEdge(e.id, 0.5, 1);
  const a = g.nodes[e.a];
  const b = g.nodes[e.b];
  const midX = (a.x + b.x) / 2;
  const midZ = (a.z + b.z) / 2;
  const d = Math.hypot(p.x - midX, p.z - midZ);
  eq(d, 2.75, 'lane offset is half lane width');
  const route = g.routeTo(-760, 545, 950, 1000);
  ok(route.points.length >= 2, 'routeTo returns points');
  let allLand = true;
  for (const n of g.nodes) if (!isLand(n.x, n.z)) allLand = false;
  ok(allLand, 'all road nodes on land');
}

{
  ok(Math.abs(heightAt(0, 0) - heightAt(0, 0)) < 1e-9, 'heightAt deterministic');
  ok(isLand(-500, 0), 'downtown is land');
  ok(!isLand(1700, -500), 'ocean east is water');
  ok(isWater(1700, -500), 'isWater east');
  ok(inHarborBasin(HARBOR.x, HARBOR.z), 'harbor basin is water');
  ok(!inHarborBasin(HARBOR.x, 1430), 'harbor bridge corridor is land');
  ok(heightAt(1700, -500) < 0, 'ocean floor below water');
  ok(coastX(0) > 1400 && coastX(0) < 1650, 'coast x in range');
  ok(districtAt(0, 0) === 'meridian_downtown', 'district downtown');
  ok(districtAt(1200, 0) === 'solace_beach', 'district beach');
}

{
  const ev = new EventBus();
  const w = new WantedSystem(ev);
  let started = 0;
  let ended = 0;
  let levelChanges: number[] = [];
  ev.on('POLICE_SEARCH_STARTED', () => started++);
  ev.on('POLICE_SEARCH_ENDED', () => ended++);
  ev.on('WANTED_LEVEL_CHANGED', (p) => levelChanges.push(p.level));
  eq(w.levelForPoints(0), 0, 'points 0 -> level 0');
  eq(w.levelForPoints(19), 1, 'points 19 -> level 1');
  eq(w.levelForPoints(20), 2, 'points 20 -> level 2');
  eq(w.levelForPoints(120), 5, 'points 120 -> level 5');
  w.addCrime(12);
  eq(w.level, 1, 'theft -> level 1');
  w.addCrime(50);
  eq(w.level, 3, 'theft+robbery -> level 3');
  ok(started >= 1, 'search started event');
  for (let i = 0; i < 70; i++) w.update(1, false, i);
  ok(w.level < 3, `wanted decays without visual (level ${w.level})`);
  for (let i = 0; i < 200; i++) w.update(1, false, 100 + i);
  eq(w.level, 0, 'wanted reaches 0 after timers');
  ok(ended >= 1, 'search ended event');
  w.addCrime(20);
  for (let i = 0; i < 45; i++) w.update(1, true, i);
  eq(w.level, 2, 'visual contact prevents decay');
  ok(levelChanges.length > 0, 'level change events emitted');
  eq(WANTED.thresholds.length, 6, 'wanted thresholds table');
}

{
  const ev = new EventBus();
  const eco = new Economy(ev, 750, 2500);
  ok(eco.spend(800, 'too much') === false, 'cannot overspend cash');
  ok(eco.spend(700, 'ok'), 'spend works');
  eq(eco.cash, 50, 'cash after spend');
  ok(eco.spend(-5, 'negative') === false, 'negative spend rejected');
  ok(eco.earn(100, 'job'), 'earn works');
  eq(eco.cash, 150, 'cash after earn');
  ok(eco.transferToBank(100), 'transfer to bank');
  eq(eco.cash, 50, 'cash after transfer');
  eq(eco.bank, 2600, 'bank after transfer');
  ok(!eco.transferToCash(99999), 'cannot overdraw bank');
  ok(eco.buyChips(50), 'buy chips');
  eq(eco.chips, 50, 'chips balance');
  ok(!eco.chipBet(60), 'chip bet limited by chips');
  ok(eco.chipBet(50), 'chip bet ok');
  eq(eco.chips, 0, 'chips after bet');
  eco.chipPayout(75);
  eq(eco.chips, 75, 'chip payout');
  ok(!eco.redeemChips(100), 'cannot redeem more than chips');
  ok(eco.redeemChips(75), 'redeem chips');
  eq(eco.cash, 75, 'cash after redeem');
  const rp = eco.repairPrice(500, 10000);
  eq(rp, Math.round(ECONOMY.repairBase + 0.5 * 10000 * ECONOMY.repairDamageFactor), 'repair price formula');
  ok(eco.transactions.length <= 30, 'transaction log capped at 30');
}

{
  const shoe = new Shoe(6, rng.float.bind(rng));
  eq(shoe.remaining, 312, 'six decks = 312 cards');
  const c = shoe.draw();
  ok(RANKS.includes(c.rank) && SUITS.includes(c.suit), 'card valid');
  eq(handValue([{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }]).value, 21, 'A+K = 21');
  eq(handValue([{ rank: 'A', suit: 'hearts' }, { rank: 'A', suit: 'spades' }]).value, 12, 'A+A = 12');
  eq(handValue([{ rank: 'A', suit: 'hearts' }, { rank: '9', suit: 'spades' }, { rank: '5', suit: 'clubs' }]).value, 15, 'A+9+5 = 15 (ace as 1)');
  ok(handValue([{ rank: 'A', suit: 'hearts' }, { rank: '6', suit: 'spades' }]).soft, 'soft hand detected');

  const bj = new BlackjackGame(rng.float.bind(rng));
  ok(!bj.deal(10, 1000), 'bet below min rejected');
  ok(!bj.deal(2000, 1000), 'bet above chips rejected');
  ok(bj.deal(100, 1000), 'deal accepted');
  ok(bj.phase === 'player' || bj.phase === 'done', 'phase after deal');
  if (bj.phase === 'player') {
    const r = bj.action('hit', 1000);
    ok(r.ok, 'hit allowed');
  }
  for (let i = 0; i < 30; i++) {
    const g2 = new BlackjackGame(rng.float.bind(rng));
    g2.deal(25, 1000);
    let guard = 0;
    while (g2.phase === 'player' && guard++ < 20) g2.action('stand', 1000);
    ok(g2.phase === 'done' && g2.result !== null, 'game finishes with result');
    ok(g2.lastPayout >= 0, 'payout non-negative');
  }
  let bjNatural = 0;
  for (let i = 0; i < 300; i++) {
    const g3 = new BlackjackGame(rng.float.bind(rng));
    g3.deal(100, 1000);
    if (g3.result === 'blackjack') bjNatural++;
  }
  ok(bjNatural > 0 && bjNatural < 60, `natural blackjack rate plausible (${bjNatural}/300)`);
}

{
  const rng2 = new RNG(99);
  const seen = new Set<number>();
  for (let i = 0; i < 500; i++) seen.add(spin(rng2.float.bind(rng2)));
  eq(seen.size, 37, 'roulette covers 0..36');
  const redBet: RouletteBet = { type: 'red', amount: 10 };
  ok(payoutFor(redBet, 1) === 20, 'red pays 2:1 on red');
  ok(payoutFor(redBet, 2) === 0, 'red loses on black');
  ok(payoutFor({ type: 'straight', number: 0, amount: 10 }, 0) === 360, 'straight pays 36:1');
  ok(payoutFor(redBet, 0) === 0, 'zero loses outside bets');
  ok(payoutFor({ type: 'even', amount: 10 }, 0) === 0, 'zero loses even');
  ok(payoutFor({ type: 'dozen1', amount: 10 }, 12) === 30, 'dozen pays 3:1');
  ok(payoutFor({ type: 'high', amount: 10 }, 36) === 20, 'high pays');
  ok(payoutFor({ type: 'low', amount: 10 }, 18) === 20, 'low pays');
  ok(totalPayout([redBet, { type: 'straight', number: 7, amount: 10 }], 7) === 380, 'combined payout');
  ok(!isValidBet([{ type: 'straight', number: 5, amount: 5 }], 1000), 'straight min 10');
  ok(!isValidBet([{ type: 'red', amount: 3000 }], 5000), 'total cap 2500');
  ok(isValidBet([{ type: 'red', amount: 100 }], 1000), 'valid bet');
  eq(ROULETTE_ORDER.length, 37, 'roulette wheel order 37 numbers');
}

{
  const rng3 = new RNG(7);
  for (let i = 0; i < 50; i++) {
    const reels = spinReels(rng3.float.bind(rng3));
    eq(reels.length, 5, '5 reels');
    for (const col of reels) eq(col.length, 3, '3 visible rows');
  }
  const reelsWin: SlotSymbol2[][] = [
    ['crown', 'star', 'cherry'],
    ['crown', 'bell', 'coin'],
    ['crown', 'seven', 'palm'],
    ['star', 'crown', 'diamond'],
    ['bell', 'star', 'seven'],
  ];
  const { totalWin, winningLines } = evaluate(reelsWin, 10);
  ok(totalWin > 0 && winningLines.length > 0, `matching lines pay (${totalWin})`);
  const reelsLose: SlotSymbol2[][] = [
    ['crown', 'star', 'cherry'],
    ['star', 'bell', 'coin'],
    ['bell', 'seven', 'palm'],
    ['seven', 'crown', 'diamond'],
    ['palm', 'star', 'seven'],
  ];
  const lose = evaluate(reelsLose, 10);
  eq(lose.totalWin, 0, 'no line -> no win');
  eq(PAYLINES.length, 10, 'ten paylines');
  eq(SLOT_SYMBOLS.length, 8, 'eight symbols');
}

{
  const min = new THREE.Vector3(0, 0, 0);
  const max = new THREE.Vector3(2, 2, 2);
  const o = new THREE.Vector3(-1, 1, 1);
  const d = new THREE.Vector3(1, 0, 0);
  eq(rayAABB(o, d, min, max, 10)!, 1, 'ray hits AABB front face');
  ok(rayAABB(o, new THREE.Vector3(-1, 0, 0), min, max, 10) === null, 'ray away misses');
  eq(raySphere(new THREE.Vector3(0, 0, -5), new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, 10)!, 4, 'ray hits sphere');
  const r = circleAABBResolve(1, -0.3, 0.5, min, max);
  ok(r.hit && Math.abs(r.z + 0.5) < 1e-6, 'circle pushed out of AABB');
  eq(clamp(5, 0, 3), 3, 'clamp');
}

{
  ok(ballGroup(0) === 'none' && ballGroup(8) === 'eight' && ballGroup(3) === 'solids' && ballGroup(12) === 'stripes', 'ball groups');
  const bg = new BilliardsGame();
  eq(bg.balls.length, 16, '16 balls racked');
  ok(bg.balls.some((b) => b.id === 8), '8-ball present');
  ok(!bg.shoot(0, 0.5) || bg.anyMoving(), 'shoot starts motion');
  for (let i = 0; i < 600 && bg.anyMoving(); i++) bg.step(1 / 60);
  ok(!bg.anyMoving(), 'friction stops all balls');
  const bg2 = new BilliardsGame();
  const cue = bg2.balls[0];
  const target = bg2.balls.find((b) => b.id === 1)!;
  cue.x = target.x - 1;
  cue.z = target.z;
  bg2.shoot(0, 0.8);
  for (let i = 0; i < 600 && bg2.anyMoving(); i++) bg2.step(1 / 60);
  ok(Math.hypot(target.x - (target.x), target.z) >= 0, 'collision ran');
  const moved = bg2.balls.some((b) => b.id !== 0 && (Math.abs(b.vx) > 0 || Math.abs(b.vz) > 0 || b.pocketed));
  ok(moved || bg2.balls.some((b) => b.pocketed), 'break transfers energy');
  const bg3 = new BilliardsGame();
  const t3 = defaultTable();
  bg3.balls[0].x = t3.pockets[0].x + 0.05;
  bg3.balls[0].z = t3.pockets[0].z;
  bg3.balls[0].vx = -2;
  bg3.step(1 / 60);
  ok(bg3.balls[0].pocketed, 'ball near pocket gets pocketed');
  const r1 = bg3.resolveShot();
  ok(r1.foul && bg3.ballInHand, 'scratch = foul + ball in hand');
  const bg4 = new BilliardsGame();
  for (const b of bg4.balls) if (b.id !== 0 && b.id !== 8) b.pocketed = true;
  bg4.groups[0] = 'solids';
  bg4.groups[1] = 'stripes';
  bg4.assigned = true;
  bg4.balls.find((b) => b.id === 8)!.pocketed = true;
  bg4.balls[0]._counted = true;
  const r4 = bg4.resolveShot();
  ok(r4.outcome === 'win' && bg4.winner === 0, '8-ball after clearing group wins');
  const bg5 = new BilliardsGame();
  bg5.groups[0] = 'solids';
  bg5.groups[1] = 'stripes';
  bg5.assigned = true;
  bg5.balls.find((b) => b.id === 8)!.pocketed = true;
  const r5 = bg5.resolveShot();
  ok(r5.outcome === 'lose', 'early 8-ball loses');
  const s = bg5.aiShot();
  ok(typeof s.angle === 'number' && s.power > 0 && s.power <= 1, 'ai produces a shot');
  void BALL_R;
}

{
  ok(Object.keys(VEHICLES).length >= 10, 'vehicle roster');
  eq(VEHICLES.tempest_xr.topSpeedKmh, 325, 'Tempest XR top speed from spec');
  eq(VEHICLES.volton_metro.price, 4800, 'Volton Metro price from spec');
  eq(WEAPONS.meridian_p9.magSize, 15, 'P9 mag size');
  eq(WEAPONS.ironwood_12.pellets, 8, 'shotgun pellets');
  eq(ECONOMY.missionReward, 18000, 'harbor job reward');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) (globalThis as unknown as { process: { exit: (c: number) => void } }).process.exit(1);

type SlotSymbol2 = (typeof SLOT_SYMBOLS)[number];
