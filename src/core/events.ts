export type EventMap = {
  PLAYER_ENTERED_VEHICLE: { vehicleId: number };
  PLAYER_EXITED_VEHICLE: { vehicleId: number };
  VEHICLE_DAMAGED: { vehicleId: number; amount: number; position: { x: number; y: number; z: number } };
  VEHICLE_DESTROYED: { vehicleId: number; position: { x: number; y: number; z: number } };
  PLAYER_MONEY_CHANGED: { cash: number; bank: number; delta: number; reason: string };
  CRIME_COMMITTED: { type: string; severity: number; position: { x: number; y: number; z: number } };
  CRIME_REPORTED: { type: string; position: { x: number; y: number; z: number }; reporterId: number };
  WANTED_LEVEL_CHANGED: { level: number; points: number };
  POLICE_SEARCH_STARTED: { level: number };
  POLICE_SEARCH_ENDED: {};
  MISSION_STARTED: { id: string };
  MISSION_STAGE_CHANGED: { id: string; stage: string };
  MISSION_COMPLETED: { id: string; reward: number };
  MISSION_FAILED: { id: string; reason: string };
  ACTIVITY_STARTED: { id: string; kind: string };
  ACTIVITY_COMPLETED: { id: string; kind: string; reward: number };
  BUSINESS_PURCHASE_COMPLETED: { kind: string; label: string; price: number };
  TIME_OF_DAY_CHANGED: { hour: number; phase: string };
  WEATHER_CHANGED: { weather: string };
  SAVE_REQUESTED: { slot: string };
  SAVE_COMPLETED: { slot: string };
  PLAYER_BUSTED: {};
  PLAYER_HOSPITALIZED: {};
  PLAYER_HEALTH_CHANGED: { health: number };
  PLAYER_DIED: { cause: string };
  WEAPON_FIRED: { weapon: string; position: { x: number; y: number; z: number } };
  PED_KILLED: { pedId: number; cause: string; position: { x: number; y: number; z: number }; isOfficer: boolean };
  PED_HIT_BY_VEHICLE: { pedId: number; vehicleId: number };
  NOTIFICATION: { text: string; kind: 'info' | 'money' | 'warning' | 'mission' };
  GAME_STATE_CHANGED: { state: string };
  INTERACTION_AVAILABLE: { label: string; action: () => void } | null;
  SHOP_OPENED: { kind: string };
  SHOP_CLOSED: {};
  GARAGE_OPENED: {};
  CASINO_TABLE_OPENED: { game: string };
  CASINO_TABLE_CLOSED: {};
  DIALOG_STARTED: { lines: { speaker: string; text: string }[]; onDone?: () => void };
  MISSION_MARKER: { position: { x: number; y: number; z: number } | null; label: string };
  RACE_STARTED: { route: string };
  RACE_FINISHED: { position: number; reward: number; route: string };
};

export type EventName = keyof EventMap;

export class EventBus {
  private handlers = new Map<EventName, Set<(payload: never) => void>>();

  on<K extends EventName>(name: K, fn: (payload: EventMap[K]) => void): () => void {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set();
      this.handlers.set(name, set);
    }
    set.add(fn as (payload: never) => void);
    return () => set.delete(fn as (payload: never) => void);
  }

  emit<K extends EventName>(name: K, payload: EventMap[K]): void {
    const set = this.handlers.get(name);
    if (!set) return;
    for (const fn of [...set]) {
      (fn as (p: EventMap[K]) => void)(payload);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
