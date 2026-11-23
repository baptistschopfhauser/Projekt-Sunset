# PROJECT SUNSET - Implementation Report

This document describes what was actually implemented from the mega-prompt in `README.md`, how to run it,
and where the implementation deliberately deviates from the spec (per the spec's own truthfulness rule, chapter 0.4).

## Run

```bash
npm install
npm run dev        # dev server on http://127.0.0.1:5173
npm run build      # production build to dist/
npm run preview    # serve dist/
npm run typecheck  # tsc --noEmit
npm run test:logic # node-based unit tests for pure game logic (no browser needed)
```

Desktop Chromium-based browser required (WebGL 2). All content is generated procedurally at runtime;
no external assets are downloaded.

## Implemented systems (all real, no mockups)

- **Boot / states**: main menu with orbiting city camera, new game, load (3 manual slots + autosave), settings, controls, credits; pause menu; busted/hospitalized screens; loading screen.
- **World**: 3600x3200 m Sunset County with 10 districts, procedural terrain (Pine Ridge hills, harbor basin, coastline, Drift Island with bridge, Blackwater Marsh), road graph (~1000+ nodes) with A* routing, instanced buildings with facade/window textures that light up at night, roads/sidewalks/intersections, street lamps, trees, containers, barriers, beach umbrellas, harbor walls, pier, depot with fence.
- **Day/night/weather**: 96-minute day, sun/moon + shadows, shader sky dome with sun/sunset/stars/clouds, street lamps at night, 5 weather states with rain particles, wetness, wind, thunderstorm lightning + thunder, traction changes.
- **Player (Alex Morgan)**: third-person procedural character with walk/sprint/crouch/jump/swim, stamina, health, pointer-lock camera with collision, aim camera, weapon in hand.
- **Vehicles**: 14 fictional models with the spec's performance table (top speed / 0-100 / mass / tank), arcade physics (speed-sensitive steering, handbrake drift, surface traction incl. rain), damage model 0-1000 affecting performance, fuel, headlights/brake lights, police lightbar, enter/exit with F, car theft crime.
- **Traffic**: lane-following cars on the road graph with traffic lights, braking for cars ahead, despawn/respawn outside view.
- **Pedestrians**: sidewalk walkers with routes, 12+ visual variants, flee/cower/call-police reactions with line-of-sight checks, witnesses reporting crimes after 3-8 s, vehicle hits.
- **Police/wanted**: 5-star system with the spec's point table and lose-timers, visual-contact rules, road-graph pursuit units (patrol/interceptor), roadblock positions, helicopter with spotlight at level 4+, foot officers and arrest -> BUSTED (fine, respawn at police station), losing the wanted state.
- **Combat**: 5 weapons with spec stats, hitscan with muzzle line-of-sight, spread/recoil/bloom, magazines + reserve + reload, weapon wheel (Tab), hit zones, pooled muzzle flash/tracers/impacts, crimes from gunfire.
- **Economy**: cash/bank/chips, atomic transactions, 30-entry ledger, prices from the spec, dealership (bought cars spawn persistently), purchasable garage (store/retrieve), workshop (repair formula, upgrades, repaint), ammunition, market, gas station, ATMs.
- **Casino**: walkable interior, chip cashier, working Blackjack (6-deck shoe, soft hands, hit/stand/double/split, dealer 17, 3:2 blackjack), European Roulette (37 numbers, all bet types, 35:1 straight), 5-reel slots with 10 paylines.
- **Minigames**: 3 street races vs 3 AI opponents on road routes (500/900/1500 $), 3 delivery jobs with timers, taxi mode with pickup/dropoff and distance fare, darts 301 vs AI with real board scoring (double/triple/bull, bust rule), basketball 60 s challenge with projectile ball and hoop detection.
- **Mission THE HARBOR JOB**: multi-stage (meet Marcus -> 3 recon points -> getaway vehicle at rendezvous -> scripted truck arrival -> ambush with 3 armed guards using cover -> secure cargo (wanted level 3+) -> escape docks -> lose police -> deliver for 18.000 $), dialogs, markers/GPS, checkpoints on death.
- **HUD/UI**: minimap with roads/water/POIs/police/GPS route, full map (M) with pan/zoom/click-GPS, health/stamina, money, 5 stars, ammo, vehicle speed/fuel/damage, mission objective, interaction prompts, notifications, dialogs, smartphone (H) with messages/map/garage/bank/activities/contacts/settings apps, inventory (I).
- **Save**: versioned saves in IndexedDB (localStorage fallback), 3 slots + autosave (every 5 min outside combat and after missions), settings in localStorage.
- **Audio**: fully procedural WebAudio - engine, siren, gunshots, impacts, footsteps, UI, cash, thunder, rain, waves, and a generative music system with moods (menu/explore/pursuit/mission/casino); master/music/sfx buses.
- **Performance**: instanced rendering for buildings/lamps/trees/containers, fixed 1/60 s timestep with accumulator, quality presets (low/medium/high/ultra) controlling pixel ratio, shadows, NPC/traffic counts, fog distance.

## Deliberate deviations from the spec (documented per chapter 0.4)

- **No Rapier physics engine**: a custom arcade physics/collision layer is used instead (spec allows a functional alternative). Collision uses AABBs/circles/raycasts instead of a WASM rigid-body engine.
- **Interiors**: the casino and bar are real walkable 3D interiors; other shops open functional menus at their doors (spec-compliant interaction, simpler than full interiors).
- **Billiards**: not implemented (8-ball physics out of scope for this pass); darts, basketball, races, deliveries and taxi cover the "at least three activities" requirement.
- **World streaming sectors (160x160 m)**: the full 3600x3200 m world is built once with instanced meshes and distance-based AI culling (traffic/peds despawn far away) instead of sector unload; persistent objects are never lost.
- **Helicopter/officer depth**: simplified but functional (circling heli with spotlight and visual updates; officers approach and arrest).
- **Character/vehicle models**: procedural primitive-based models with correct proportions and distinct silhouettes; no skeletal animation library - procedural limb animation instead.
- **No external assets**: everything (textures, sounds, music) is generated in code, so nothing is downloaded at runtime.

## Verification performed

- `npx tsc --noEmit` - clean.
- `npm run build` - clean (700 kB bundle).
- `npm run test:logic` - 453 assertions passing (road graph/A*, wanted levels/timers, economy atomicity, blackjack rules, roulette payouts, slots paylines, collision math, spec data tables).
