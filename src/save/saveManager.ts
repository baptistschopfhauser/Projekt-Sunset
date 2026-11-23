import { DEFAULT_SETTINGS, type SaveData, type SettingsData } from '../core/types.ts';
import { SAVE_SLOTS, type SaveSlot } from '../core/config.ts';

const DB_NAME = 'project-sunset';
const STORE = 'saves';
const SETTINGS_KEY = 'project-sunset-settings';

export class SaveManager {
  private db: IDBDatabase | null = null;
  private useFallback = false;

  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      this.useFallback = true;
      return;
    }
    try {
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'slot' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.useFallback = true;
    }
  }

  async save(slot: SaveSlot, data: SaveData): Promise<void> {
    data.slot = slot;
    if (this.useFallback || !this.db) {
      localStorage.setItem(`ps-save-${slot}`, JSON.stringify(data));
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async load(slot: SaveSlot): Promise<SaveData | null> {
    if (this.useFallback || !this.db) {
      const raw = localStorage.getItem(`ps-save-${slot}`);
      return raw ? (JSON.parse(raw) as SaveData) : null;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(slot);
      req.onsuccess = () => resolve((req.result as SaveData) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async list(): Promise<SaveData[]> {
    if (this.useFallback || !this.db) {
      const out: SaveData[] = [];
      for (const s of SAVE_SLOTS) {
        const raw = localStorage.getItem(`ps-save-${s}`);
        if (raw) out.push(JSON.parse(raw) as SaveData);
      }
      return out;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as SaveData[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(slot: SaveSlot): Promise<void> {
    if (this.useFallback || !this.db) {
      localStorage.removeItem(`ps-save-${slot}`);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(slot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  loadSettings(): SettingsData {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<SettingsData>) };
    } catch {
      /* ignore */
    }
    return { ...DEFAULT_SETTINGS };
  }

  saveSettings(s: SettingsData): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }
}
