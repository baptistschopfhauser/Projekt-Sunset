import type * as THREE from 'three';

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

export interface AABBCollider {
  min: THREE.Vector3;
  max: THREE.Vector3;
  kind: 'building' | 'prop' | 'wall';
  ref?: unknown;
}

export interface POI {
  id: string;
  name: string;
  kind: 'casino' | 'police' | 'hospital' | 'dealership' | 'garage' | 'workshop' | 'ammunition' | 'market' | 'gas' | 'atm' | 'apartment' | 'race' | 'darts' | 'billiards' | 'basketball' | 'delivery' | 'taxi' | 'mission' | 'pier' | 'bar' | 'cafe' | 'restaurant' | 'hotel' | 'office' | 'depot';
  position: THREE.Vector3;
  radius: number;
  district: string;
}

export interface SaveData {
  version: number;
  slot: string;
  name: string;
  savedAt: number;
  playTimeSec: number;
  worldTimeMinutes: number;
  weather: string;
  player: {
    position: Vec3Like;
    yaw: number;
    health: number;
    stamina: number;
    cash: number;
    bank: number;
    chips: number;
    weapons: { id: string; mag: number; reserve: number }[];
    currentWeapon: string;
    inVehicleId: number | null;
  };
  wantedPoints: number;
  ownedVehicles: OwnedVehicle[];
  garageOwned: boolean;
  mission: MissionSaveState;
  activityFlags: Record<string, boolean>;
  stats: { kills: number; racesWon: number; deliveriesDone: number; taxiRides: number; earnedTotal: number; spentTotal: number };
  settings: SettingsData;
}

export interface OwnedVehicle {
  uid: number;
  modelId: string;
  color: number;
  damage: number;
  fuel: number;
  position: Vec3Like | null;
  inGarage: boolean;
  upgrades: string[];
  plate: string;
}

export interface MissionSaveState {
  id: string | null;
  stage: string;
  checkpoints: string[];
  cargoSecured: boolean;
  completed: boolean;
}

export interface SettingsData {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  invertY: boolean;
  quality: string;
  resolutionScale: number;
  motionBlur: boolean;
  cameraShake: boolean;
  minimapNorthUp: boolean;
  subtitles: boolean;
}

export const DEFAULT_SETTINGS: SettingsData = {
  masterVolume: 0.8,
  musicVolume: 0.55,
  sfxVolume: 0.9,
  mouseSensitivity: 1.0,
  invertY: false,
  quality: 'medium',
  resolutionScale: 1.0,
  motionBlur: true,
  cameraShake: true,
  minimapNorthUp: true,
  subtitles: true,
};
