export const PALETTE = {
  midnightNavy: 0x101a2b,
  warmConcrete: 0xb8b2a8,
  coastalSand: 0xd8c39b,
  deepTeal: 0x147c86,
  coastalGreen: 0x477b48,
  sunsetGold: 0xf4b96b,
  coralOrange: 0xe97856,
  charcoalRoad: 0x34393f,
  emergencyBlue: 0x2478f2,
  emergencyRed: 0xeb3f47,
  hudDark: '#10151C',
  uiAmber: '#F4B544',
  ivory: '#F1F3F5',
} as const;

export const WORLD = {
  minX: -1800,
  maxX: 1800,
  minZ: -1600,
  maxZ: 1600,
  waterLevel: 0.0,
  beachX: 1450,
} as const;

export const TIME = {
  dayMinutes: 96 * 60,
  startHour: 8.5,
  minutesPerRealSecond: 15 / 60,
} as const;

export const PLAYER: {
  name: string;
  walkSpeed: number;
  jogSpeed: number;
  sprintSpeed: number;
  crouchSpeed: number;
  backwardSpeed: number;
  aimSpeed: number;
  swimSpeed: number;
  maxHealth: number;
  maxStamina: number;
  staminaDrainPerSec: number;
  staminaRegenPerSec: number;
  staminaRegenDelay: number;
  jumpHeight: number;
  height: number;
  radius: number;
  startCash: number;
  startBank: number;
  startPosition: { x: number; y: number; z: number };
} = {
  name: 'Alex Morgan',
  walkSpeed: 1.8,
  jogSpeed: 3.8,
  sprintSpeed: 6.2,
  crouchSpeed: 1.3,
  backwardSpeed: 1.5,
  aimSpeed: 2.1,
  swimSpeed: 2.0,
  maxHealth: 100,
  maxStamina: 100,
  staminaDrainPerSec: 12,
  staminaRegenPerSec: 16,
  staminaRegenDelay: 0.7,
  jumpHeight: 0.85,
  height: 1.75,
  radius: 0.35,
  startCash: 750,
  startBank: 2500,
  startPosition: { x: -120, y: 0, z: 640 },
};

export type VehicleClass = 'compact' | 'sedan' | 'sport_sedan' | 'sport' | 'super' | 'suv' | 'offroad' | 'pickup' | 'van' | 'motorcycle' | 'police' | 'police_sport' | 'delivery' | 'truck';

export interface VehicleDef {
  id: string;
  name: string;
  cls: VehicleClass;
  price: number;
  topSpeedKmh: number;
  accel0to100: number;
  massKg: number;
  tankLiters: number;
  length: number;
  width: number;
  height: number;
  groundClearance: number;
  color: number;
  drivable: boolean;
}

export const VEHICLES: Record<string, VehicleDef> = {
  volton_metro: { id: 'volton_metro', name: 'Volton Metro', cls: 'compact', price: 4800, topSpeedKmh: 145, accel0to100: 13.5, massKg: 1050, tankLiters: 45, length: 4.1, width: 1.75, height: 1.45, groundClearance: 0.16, color: 0x8a8f98, drivable: true },
  alden_crest: { id: 'alden_crest', name: 'Alden Crest', cls: 'sedan', price: 11500, topSpeedKmh: 175, accel0to100: 10.0, massKg: 1450, tankLiters: 60, length: 4.7, width: 1.85, height: 1.45, groundClearance: 0.15, color: 0x3d4b5c, drivable: true },
  vexler_gt: { id: 'vexler_gt', name: 'Vexler GT', cls: 'sport_sedan', price: 32000, topSpeedKmh: 230, accel0to100: 6.3, massKg: 1650, tankLiters: 65, length: 4.8, width: 1.9, height: 1.35, groundClearance: 0.13, color: 0x7a1f2b, drivable: true },
  corsair_s9: { id: 'corsair_s9', name: 'Corsair S9', cls: 'sport', price: 78000, topSpeedKmh: 275, accel0to100: 4.0, massKg: 1380, tankLiters: 65, length: 4.6, width: 2.0, height: 1.2, groundClearance: 0.11, color: 0x14213d, drivable: true },
  tempest_xr: { id: 'tempest_xr', name: 'Tempest XR', cls: 'super', price: 210000, topSpeedKmh: 325, accel0to100: 2.9, massKg: 1480, tankLiters: 65, length: 4.7, width: 2.1, height: 1.1, groundClearance: 0.1, color: 0xd9a441, drivable: true },
  northstar_trail: { id: 'northstar_trail', name: 'Northstar Trail', cls: 'suv', price: 28000, topSpeedKmh: 185, accel0to100: 9.0, massKg: 2250, tankLiters: 75, length: 4.9, width: 1.95, height: 1.8, groundClearance: 0.24, color: 0x4a5d43, drivable: true },
  bravon_ridge: { id: 'bravon_ridge', name: 'Bravon Ridge', cls: 'offroad', price: 36000, topSpeedKmh: 170, accel0to100: 11.0, massKg: 2100, tankLiters: 80, length: 5.0, width: 2.0, height: 1.85, groundClearance: 0.32, color: 0x6b4f2a, drivable: true },
  ironhorse_250: { id: 'ironhorse_250', name: 'Ironhorse 250', cls: 'pickup', price: 24000, topSpeedKmh: 175, accel0to100: 10.5, massKg: 2050, tankLiters: 80, length: 5.2, width: 1.95, height: 1.8, groundClearance: 0.25, color: 0x37474f, drivable: true },
  hauler_v6: { id: 'hauler_v6', name: 'Hauler V6', cls: 'van', price: 18000, topSpeedKmh: 140, accel0to100: 17.0, massKg: 2700, tankLiters: 85, length: 5.6, width: 2.1, height: 2.2, groundClearance: 0.2, color: 0xb8b2a8, drivable: true },
  velocity_r: { id: 'velocity_r', name: 'Velocity R', cls: 'motorcycle', price: 45000, topSpeedKmh: 280, accel0to100: 3.3, massKg: 225, tankLiters: 18, length: 2.2, width: 0.8, height: 1.2, groundClearance: 0.18, color: 0x222222, drivable: true },
  solace_patrol: { id: 'solace_patrol', name: 'Solace Patrol', cls: 'police', price: 0, topSpeedKmh: 210, accel0to100: 7.2, massKg: 1750, tankLiters: 70, length: 4.8, width: 1.9, height: 1.5, groundClearance: 0.16, color: 0x14181f, drivable: false },
  solace_interceptor: { id: 'solace_interceptor', name: 'Solace Interceptor', cls: 'police_sport', price: 0, topSpeedKmh: 270, accel0to100: 4.6, massKg: 1600, tankLiters: 70, length: 4.7, width: 1.95, height: 1.4, groundClearance: 0.13, color: 0x1b2733, drivable: false },
  dockrunner: { id: 'dockrunner', name: 'Dockrunner', cls: 'delivery', price: 0, topSpeedKmh: 145, accel0to100: 16.0, massKg: 2600, tankLiters: 80, length: 5.4, width: 2.1, height: 2.3, groundClearance: 0.22, color: 0xc7cdd4, drivable: true },
  titan_cargo: { id: 'titan_cargo', name: 'Titan Cargo', cls: 'truck', price: 0, topSpeedKmh: 125, accel0to100: 24.0, massKg: 6800, tankLiters: 150, length: 9.5, width: 2.5, height: 3.2, groundClearance: 0.35, color: 0x546e7a, drivable: false },
};

export interface WeaponDef {
  id: string;
  name: string;
  magSize: number;
  baseDamage: number;
  shotsPerSec: number;
  reloadTime: number;
  pellets: number;
  price: number;
  auto: boolean;
  spreadBase: number;
  recoil: number;
  range: number;
}

export const WEAPONS: Record<string, WeaponDef> = {
  meridian_p9: { id: 'meridian_p9', name: 'Meridian P9', magSize: 15, baseDamage: 24, shotsPerSec: 4, reloadTime: 1.5, pellets: 1, price: 0, auto: false, spreadBase: 0.012, recoil: 0.028, range: 120 },
  blackline_smg: { id: 'blackline_smg', name: 'Blackline SMG', magSize: 30, baseDamage: 16, shotsPerSec: 12, reloadTime: 2.1, pellets: 1, price: 2500, auto: true, spreadBase: 0.03, recoil: 0.016, range: 90 },
  ar56_sentinel: { id: 'ar56_sentinel', name: 'AR-56 Sentinel', magSize: 30, baseDamage: 22, shotsPerSec: 10, reloadTime: 2.3, pellets: 1, price: 5200, auto: true, spreadBase: 0.024, recoil: 0.024, range: 160 },
  ironwood_12: { id: 'ironwood_12', name: 'Ironwood 12', magSize: 8, baseDamage: 12, shotsPerSec: 1 / 0.85, reloadTime: 0.65, pellets: 8, price: 3800, auto: false, spreadBase: 0.09, recoil: 0.09, range: 40 },
  ranger_m14: { id: 'ranger_m14', name: 'Ranger M14', magSize: 10, baseDamage: 55, shotsPerSec: 1 / 1.2, reloadTime: 2.8, pellets: 1, price: 7500, auto: false, spreadBase: 0.004, recoil: 0.11, range: 300 },
};

export const AMMO_PRICE_PER_BOX = 40;
export const AMMO_BOX_SIZE = 60;

export const WANTED = {
  thresholds: [0, 1, 20, 45, 80, 120],
  maxLevel: 5,
  decayPointsPerSec: 2.2,
  loseTimers: [0, 25, 40, 60, 85, 110],
  searchRadius: [0, 100, 150, 220, 300, 400],
  crimes: {
    vehicle_theft: 12,
    heavy_crash: 8,
    public_shot: 18,
    assault_civilian: 20,
    police_vehicle_hit: 25,
    assault_officer: 35,
    mission_robbery: 50,
    ped_killed: 45,
  },
} as const;

export const ECONOMY = {
  startCash: 750,
  startBank: 2500,
  garagePrice: 8000,
  garageSlots: 4,
  repairBase: 100,
  repairDamageFactor: 0.08,
  fuelPricePerLiter: 2,
  bustFineFactor: 0.1,
  hospitalCostFactor: 0.1,
  upgrades: {
    engine1: { price: 3000, accelBonus: 0.07 },
    engine2: { price: 6000, accelBonus: 0.08 },
    brakes: { price: 2200, brakeBonus: 0.12 },
    sport_tires: { price: 1800, gripBonus: 0.08 },
    offroad_tires: { price: 1600 },
    sport_suspension: { price: 2500 },
    paint: { price: 500 },
    rims: { price: 900 },
  },
  deliveries: [
    { id: 'downtown_express', from: 'Solace Cafe', to: 'Meridian Tower Office', reward: 180 },
    { id: 'beach_delivery', from: 'Pier Cafe', to: 'Solace Beach Hotel', reward: 220 },
    { id: 'westhaven_supplies', from: 'Westhaven Market', to: 'Westhaven Residence', reward: 160 },
  ],
  races: {
    coastal_sprint: { name: 'Coastal Sprint', reward: 500, lengthKm: 2.4 },
    downtown_circuit: { name: 'Downtown Circuit', reward: 900, lengthKm: 3.1 },
    ridge_run: { name: 'Ridge Run', reward: 1500, lengthKm: 4.0 },
  },
  taxiFares: { min: 80, max: 220 },
  missionReward: 18000,
} as const;

export const WEATHER = {
  weights: { CLEAR: 0.35, PARTLY_CLOUDY: 0.3, OVERCAST: 0.18, RAIN: 0.12, THUNDERSTORM: 0.05 },
  minDurationSec: 240,
  maxDurationSec: 900,
} as const;

export const QUALITY = {
  low: { pixelRatio: 0.75, shadowMap: 1024, shadows: true, pedestrians: 18, traffic: 12, vegetation: 0.4, fogFar: 700 },
  medium: { pixelRatio: 1.0, shadowMap: 2048, shadows: true, pedestrians: 30, traffic: 20, vegetation: 0.7, fogFar: 1100 },
  high: { pixelRatio: 1.25, shadowMap: 2048, shadows: true, pedestrians: 42, traffic: 28, vegetation: 1.0, fogFar: 1500 },
  ultra: { pixelRatio: 1.5, shadowMap: 4096, shadows: true, pedestrians: 55, traffic: 34, vegetation: 1.0, fogFar: 2000 },
} as const;

export type QualityLevel = keyof typeof QUALITY;

export const SAVE_VERSION = 1;
export const SAVE_SLOTS = ['slot1', 'slot2', 'slot3', 'autosave'] as const;
export type SaveSlot = (typeof SAVE_SLOTS)[number];

export const DISTRICTS = [
  { id: 'meridian_downtown', name: 'Meridian Downtown', minX: -500, maxX: 700, minZ: -900, maxZ: 500 },
  { id: 'solace_beach', name: 'Solace Beach', minX: 900, maxX: 1700, minZ: -700, maxZ: 700 },
  { id: 'crown_marina', name: 'Crown Marina', minX: 600, maxX: 1300, minZ: 600, maxZ: 1400 },
  { id: 'northgate', name: 'Northgate', minX: -1100, maxX: -400, minZ: -900, maxZ: -100 },
  { id: 'westhaven', name: 'Westhaven', minX: -1750, maxX: -800, minZ: -500, maxZ: 900 },
  { id: 'iron_docks', name: 'Iron Docks', minX: -1700, maxX: -500, minZ: 900, maxZ: 1550 },
  { id: 'pine_ridge', name: 'Pine Ridge', minX: -1750, maxX: -900, minZ: -1550, maxZ: -950 },
  { id: 'cedar_plains', name: 'Cedar Plains', minX: -700, maxX: 900, minZ: -1550, maxZ: -950 },
  { id: 'blackwater_marsh', name: 'Blackwater Marsh', minX: -300, maxX: 1700, minZ: 900, maxZ: 1550 },
  { id: 'drift_island', name: 'Drift Island', minX: 1500, maxX: 1750, minZ: -100, maxZ: 250 },
] as const;

export type DistrictId = (typeof DISTRICTS)[number]['id'];

export function districtAt(x: number, z: number): DistrictId {
  for (const d of DISTRICTS) {
    if (x >= d.minX && x <= d.maxX && z >= d.minZ && z <= d.maxZ) return d.id;
  }
  return 'cedar_plains';
}
