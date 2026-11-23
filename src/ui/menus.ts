import { el, fmtMoney, clear, show, hide } from './helpers.ts';
import { QUALITY, ECONOMY, WEAPONS, VEHICLES } from '../core/config.ts';
import { DEFAULT_SETTINGS, type SettingsData, type SaveData, type OwnedVehicle } from '../core/types.ts';

export interface MenuApi {
  newGame(): void;
  continueGame(slot: string): void;
  saveTo(slot: string): void;
  deleteSave(slot: string): void;
  listSaves(): SaveData[];
  quitToMenu(): void;
  resume(): void;
  getState(): string;
  settings: SettingsData;
  applySettings(): void;
  restartFromBusted(): void;
  restartFromHospital(): void;
  ownedVehicles(): OwnedVehicle[];
  garageOwned(): boolean;
  missionStage(): string;
  economySnapshot(): { cash: number; bank: number; chips: number; transactions: { amount: number; type: string; description: string; time: string; balance: number }[] };
  activityFlags(): Record<string, boolean>;
  startDelivery(id: string): boolean;
  startTaxi(): boolean;
  raceRouteIds(): string[];
  messages(): { from: string; text: string; time: string; unread: boolean }[];
  markMessagesRead(): void;
  teleportToGarageVehicle(uid: number): void;
}

export class Menus {
  api: MenuApi;
  parent: HTMLElement;
  root: HTMLElement;
  current: HTMLElement | null = null;
  phoneEl: HTMLElement | null = null;
  phoneOpen = false;
  private phoneApp = 'home';

  constructor(api: MenuApi, parent: HTMLElement) {
    this.api = api;
    this.parent = parent;
    this.root = el('div', '', parent);
    this.root.id = 'menus-root';
  }

  private openScreen(build: (scr: HTMLElement) => void): HTMLElement {
    this.closeScreen();
    const scr = el('div', 'screen', this.root);
    build(scr);
    this.current = scr;
    return scr;
  }

  closeScreen(): void {
    if (this.current) {
      this.current.remove();
      this.current = null;
    }
  }

  showMainMenu(): void {
    this.closePhone();
    this.openScreen((scr) => {
      const panel = el('div', 'panel', scr);
      panel.style.background = 'rgba(16,21,28,0.55)';
      panel.style.textAlign = 'center';
      el('h1', 'logo', panel, 'PROJECT SUNSET');
      el('div', 'subtitle', panel, 'SUNSET COUNTY - PORT SOLACE');
      const mk = (label: string, fn: () => void, disabled = false) => {
        const b = el('button', 'menu-btn', panel, label);
        b.style.margin = '10px auto';
        b.disabled = disabled;
        b.onclick = fn;
      };
      const saves = this.api.listSaves();
      mk('NEUES SPIEL', () => this.api.newGame());
      mk('SPIEL LADEN', () => this.showLoadMenu(), saves.filter((s) => s.slot !== 'autosave').length === 0);
      mk('AUTOSAVE LADEN', () => this.api.continueGame('autosave'), !saves.some((s) => s.slot === 'autosave'));
      mk('EINSTELLUNGEN', () => this.showSettings(() => this.showMainMenu()));
      mk('STEUERUNG', () => this.showControls(() => this.showMainMenu()));
      mk('CREDITS', () => this.showCredits(() => this.showMainMenu()));
    });
  }

  showLoading(progress: number, label: string): void {
    if (!this.current) {
      const scr = el('div', 'screen', this.root);
      this.current = scr;
    }
    const scr = this.current!;
    clear(scr);
    el('h1', 'logo', scr, 'PROJECT SUNSET');
    el('div', 'subtitle', scr, label);
    const bar = el('div', '', scr);
    bar.id = 'loading-bar';
    const fill = el('div', '', bar);
    fill.style.width = `${Math.round(progress * 100)}%`;
  }

  showPause(): void {
    this.openScreen((scr) => {
      const panel = el('div', 'panel', scr);
      el('h2', '', panel, 'PAUSE');
      const mk = (label: string, fn: () => void) => {
        const b = el('button', 'menu-btn', panel, label);
        b.onclick = fn;
      };
      mk('FORTSETZEN', () => this.api.resume());
      mk('SPIEL SPEICHERN', () => this.showSaveMenu());
      mk('EINSTELLUNGEN', () => this.showSettings(() => this.showPause()));
      mk('STEUERUNG', () => this.showControls(() => this.showPause()));
      mk('HAUPTMENÜ', () => this.api.quitToMenu());
    });
  }

  showSaveMenu(): void {
    this.openScreen((scr) => {
      const panel = el('div', 'panel', scr);
      el('h2', '', panel, 'SPIEL SPEICHERN');
      const saves = this.api.listSaves();
      for (const slot of ['slot1', 'slot2', 'slot3', 'autosave'] as const) {
        const existing = saves.find((s) => s.slot === slot);
        const b = el('button', 'menu-btn', panel);
        b.textContent = existing ? `${slot.toUpperCase()} - ${existing.name} (${new Date(existing.savedAt).toLocaleString()})` : `${slot.toUpperCase()} - leer`;
        b.onclick = () => {
          this.api.saveTo(slot);
          this.showPause();
        };
      }
      const back = el('button', 'menu-btn', panel, 'ZURÜCK');
      back.onclick = () => this.showPause();
    });
  }

  showLoadMenu(): void {
    this.openScreen((scr) => {
      const panel = el('div', 'panel', scr);
      el('h2', '', panel, 'SPIEL LADEN');
      const saves = this.api.listSaves().filter((s) => s.slot !== 'autosave');
      if (saves.length === 0) el('div', 'subtitle', panel, 'Keine Spielstände vorhanden.');
      for (const s of saves) {
        const b = el('button', 'menu-btn', panel, `${s.slot.toUpperCase()} - ${s.name}`);
        b.onclick = () => this.api.continueGame(s.slot);
        const del = el('button', 'btn small danger', panel, 'LÖSCHEN');
        del.style.marginLeft = '8px';
        del.onclick = (e) => {
          e.stopPropagation();
          this.api.deleteSave(s.slot);
          this.showLoadMenu();
        };
        const row = el('div', 'row', panel);
        row.appendChild(b);
        row.appendChild(del);
      }
      const back = el('button', 'menu-btn', panel, 'ZURÜCK');
      back.onclick = () => this.showMainMenu();
    });
  }

  showSettings(back: () => void): void {
    this.openScreen((scr) => {
      const panel = el('div', 'panel', scr);
      el('h2', '', panel, 'EINSTELLUNGEN');
      const s = this.api.settings;
      const slider = (label: string, key: keyof SettingsData, min: number, max: number, step = 0.05) => {
        const row = el('div', 'settings-row', panel);
        el('label', '', row, label);
        const inp = el('input', '', row) as HTMLInputElement;
        inp.type = 'range';
        inp.min = String(min);
        inp.max = String(max);
        inp.step = String(step);
        inp.value = String(s[key] as number);
        inp.oninput = () => {
          (s as unknown as Record<string, unknown>)[key] = parseFloat(inp.value);
          this.api.applySettings();
        };
      };
      slider('Master-Lautstärke', 'masterVolume', 0, 1);
      slider('Musik', 'musicVolume', 0, 1);
      slider('Effekte', 'sfxVolume', 0, 1);
      slider('Mausempfindlichkeit', 'mouseSensitivity', 0.3, 2.5);
      slider('Renderauflösung', 'resolutionScale', 0.5, 1.5, 0.05);
      const sel = (label: string, key: 'quality', options: string[]) => {
        const row = el('div', 'settings-row', panel);
        el('label', '', row, label);
        const se = el('select', '', row);
        for (const o of options) {
          const op = el('option', '', se, o);
          op.value = o;
          if (s[key] === o) op.selected = true;
        }
        se.onchange = () => {
          s.quality = se.value;
          this.api.applySettings();
        };
      };
      sel('Grafikqualität', 'quality', Object.keys(QUALITY));
      const toggle = (label: string, key: keyof SettingsData) => {
        const row = el('div', 'settings-row', panel);
        el('label', '', row, label);
        const cb = el('input', '', row) as HTMLInputElement;
        cb.type = 'checkbox';
        cb.checked = Boolean(s[key]);
        cb.onchange = () => {
          (s as unknown as Record<string, unknown>)[key] = cb.checked;
          this.api.applySettings();
        };
      };
      toggle('Y-Achse invertieren', 'invertY');
      toggle('Kamerawackeln', 'cameraShake');
      toggle('Minimap Norden oben', 'minimapNorthUp');
      toggle('Untertitel', 'subtitles');
      const back2 = el('button', 'menu-btn', panel, 'ZURÜCK');
      back2.style.marginTop = '16px';
      back2.onclick = back;
    });
  }

  showControls(back: () => void): void {
    this.openScreen((scr) => {
      const panel = el('div', 'panel', scr);
      el('h2', '', panel, 'STEUERUNG');
      const rows: [string, string][] = [
        ['W A S D', 'Bewegung'],
        ['Shift', 'Sprinten'],
        ['Strg', 'Ducken'],
        ['Leertaste', 'Springen / Handbremse (im Fahrzeug)'],
        ['E', 'Interagieren'],
        ['F', 'Fahrzeug betreten / verlassen'],
        ['LMB', 'Schießen / Werfen'],
        ['RMB', 'Zielen'],
        ['R', 'Nachladen'],
        ['Tab (halten)', 'Waffenrad'],
        ['1-5', 'Waffe wechseln'],
        ['I', 'Inventar'],
        ['M', 'Karte'],
        ['H', 'Smartphone'],
        ['ESC', 'Pause'],
        ['C', 'Kameraansicht'],
      ];
      const t = el('table', 'help-table', panel);
      for (const [k, v] of rows) {
        const tr = el('tr', '', t);
        el('td', '', tr, k);
        el('td', '', tr, v);
      }
      const back2 = el('button', 'menu-btn', panel, 'ZURÜCK');
      back2.style.marginTop = '16px';
      back2.onclick = back;
    });
  }

  showCredits(back: () => void): void {
    this.openScreen((scr) => {
      const panel = el('div', 'panel', scr);
      el('h2', '', panel, 'CREDITS');
      el('div', '', panel, 'PROJECT SUNSET ist ein fiktives, vollständig prozedural erzeugtes Browser-Spiel.');
      el('div', '', panel, 'Alle Namen, Orte, Fahrzeuge und Missionen sind fiktiv und eigenständig.');
      el('div', '', panel, 'Code, Modelle, Texturen und Audio werden zur Laufzeit prozedural generiert.');
      const back2 = el('button', 'menu-btn', panel, 'ZURÜCK');
      back2.style.marginTop = '16px';
      back2.onclick = back;
    });
  }

  showBusted(): void {
    this.openScreen((scr) => {
      const panel = el('div', 'panel', scr);
      panel.style.textAlign = 'center';
      el('h1', 'logo', panel, 'VERHAFTET');
      panel.querySelector('h1')!.style.color = '#EB3F47';
      const b = el('button', 'menu-btn', panel, 'WEITER');
      b.style.margin = '20px auto 0';
      b.onclick = () => this.api.restartFromBusted();
    });
  }

  showHospitalized(): void {
    this.openScreen((scr) => {
      const panel = el('div', 'panel', scr);
      panel.style.textAlign = 'center';
      el('h1', 'logo', panel, 'KRANKENHAUS');
      panel.querySelector('h1')!.style.color = '#F1F3F5';
      const b = el('button', 'menu-btn', panel, 'WEITER');
      b.style.margin = '20px auto 0';
      b.onclick = () => this.api.restartFromHospital();
    });
  }

  togglePhone(): void {
    if (this.phoneOpen) this.closePhone();
    else this.openPhone();
  }

  get phoneIsOpen(): boolean {
    return this.phoneOpen;
  }

  openPhone(): void {
    if (this.phoneEl) return;
    this.phoneOpen = true;
    const p = el('div', '', this.parent);
    p.id = 'phone';
    const screen = el('div', '', p);
    screen.id = 'phone-screen';
    this.phoneEl = p;
    this.renderPhone(screen);
  }

  closePhone(): void {
    if (this.phoneEl) {
      this.phoneEl.remove();
      this.phoneEl = null;
    }
    this.phoneOpen = false;
  }

  private renderPhone(screen: HTMLElement): void {
    clear(screen);
    if (this.phoneApp === 'home') {
      el('div', '', screen, 'SUNSET PHONE').id = 'phone-title';
      const grid = el('div', 'app-grid', screen);
      const apps: [string, string, () => void][] = [
        ['💬', 'Nachrichten', () => (this.phoneApp = 'messages')],
        ['🗺️', 'Karte', () => (this.phoneApp = 'map')],
        ['🚗', 'Garage', () => (this.phoneApp = 'garage')],
        ['🏦', 'Bank', () => (this.phoneApp = 'bank')],
        ['🎯', 'Aktivitäten', () => (this.phoneApp = 'activities')],
        ['👤', 'Kontakte', () => (this.phoneApp = 'contacts')],
        ['⚙️', 'Einstellungen', () => this.showSettings(() => this.closePhoneAndSettings())],
      ];
      for (const [ico, name, fn] of apps) {
        const a = el('div', 'app-icon', grid);
        a.innerHTML = `<span class="ico">${ico}</span>${name}`;
        a.onclick = () => {
          fn();
          if (this.phoneEl) this.renderPhone(this.phoneEl.querySelector('#phone-screen') as HTMLElement);
        };
      }
      const close = el('button', 'btn', screen, 'SCHLIESSEN (H)');
      close.style.marginTop = '10px';
      close.onclick = () => this.closePhone();
      return;
    }
    const back = () => {
      this.phoneApp = 'home';
      if (this.phoneEl) this.renderPhone(this.phoneEl.querySelector('#phone-screen') as HTMLElement);
    };
    if (this.phoneApp === 'messages') {
      el('div', '', screen, 'NACHRICHTEN').id = 'phone-title';
      const msgs = this.api.messages();
      for (const m of msgs) {
        const d = el('div', `msg${m.unread ? ' unread' : ''}`, screen);
        el('div', 'from', d, `${m.from} - ${m.time}`);
        el('div', '', d, m.text);
      }
      this.api.markMessagesRead();
    } else if (this.phoneApp === 'bank') {
      el('div', '', screen, 'SUNSET BANK').id = 'phone-title';
      const eco = this.api.economySnapshot();
      el('div', 'kv', screen).innerHTML = `<span>Bargeld</span><span>${fmtMoney(eco.cash)}</span>`;
      el('div', 'kv', screen).innerHTML = `<span>Bankkonto</span><span>${fmtMoney(eco.bank)}</span>`;
      el('div', 'kv', screen).innerHTML = `<span>Casino-Chips</span><span>${eco.chips}</span>`;
      el('div', 'kv', screen).innerHTML = `<span>Gesamt</span><span>${fmtMoney(eco.cash + eco.bank)}</span>`;
      el('div', '', screen, 'Letzte Buchungen:').style.marginTop = '12px';
      for (const t of eco.transactions.slice(0, 12)) {
        const d = el('div', 'kv', screen);
        d.innerHTML = `<span>${t.description} (${t.time})</span><span style="color:${t.amount >= 0 ? '#7ddb8a' : '#EB3F47'}">${t.amount >= 0 ? '+' : ''}${fmtMoney(t.amount)}</span>`;
      }
    } else if (this.phoneApp === 'garage') {
      el('div', '', screen, 'GARAGE').id = 'phone-title';
      const vs = this.api.ownedVehicles();
      if (!this.api.garageOwned()) el('div', '', screen, 'Garage Westhaven noch nicht gekauft (8.000 $). Fahrzeuge: ' + vs.length);
      for (const v of vs) {
        const d = el('div', 'msg', screen);
        el('div', 'from', d, `${VEHICLES[v.modelId]?.name ?? v.modelId} - ${v.plate}`);
        el('div', '', d, `${v.inGarage ? 'In Garage' : 'In der Welt'} | Schaden ${Math.round(v.damage)} | Tank ${Math.round(v.fuel)} L`);
      }
      if (vs.length === 0) el('div', '', screen, 'Keine eigenen Fahrzeuge.');
    } else if (this.phoneApp === 'activities') {
      el('div', '', screen, 'AKTIVITÄTEN').id = 'phone-title';
      for (const j of ECONOMY.deliveries) {
        const b = el('button', 'btn', screen, `Lieferung: ${j.from} → ${j.to} (${j.reward} $)`);
        b.style.display = 'block';
        b.style.width = '100%';
        b.style.margin = '6px 0';
        b.onclick = () => {
          if (this.api.startDelivery(j.id)) {
            this.closePhone();
          }
        };
      }
      const taxi = el('button', 'btn', screen, 'Taxi-Modus starten (im Fahrzeug)');
      taxi.style.display = 'block';
      taxi.style.width = '100%';
      taxi.onclick = () => {
        if (this.api.startTaxi()) this.closePhone();
      };
      for (const r of this.api.raceRouteIds()) {
        const b = el('button', 'btn', screen, `Rennen starten: ${r} (im Fahrzeug am Marker)`);
        b.style.display = 'block';
        b.style.width = '100%';
        b.style.margin = '6px 0';
      }
      el('div', '', screen, 'Darts & Basketball am Northgate-Platz / Rusty Anchor. Rennen am jeweiligen Flaggen-Marker starten.').style.fontSize = '11px';
    } else if (this.phoneApp === 'contacts') {
      el('div', '', screen, 'KONTAKTE').id = 'phone-title';
      for (const c of ['Marcus Reed (Mission - Pier 17)', 'Westhaven Motors (Autohändler)', 'AutoFix (Werkstatt)', 'The Crown Casino', 'Sunset Dispatch (Lieferung/Taxi)']) {
        el('div', 'msg', screen, c);
      }
    } else if (this.phoneApp === 'map') {
      el('div', '', screen, 'KARTE - siehe M für große Karte').id = 'phone-title';
      el('div', '', screen, `Position: ${Math.round(this.api.economySnapshot().cash) ? '' : ''}Weltkarte über Taste M.`);
    }
    const backBtn = el('button', 'btn', screen, 'ZURÜCK');
    backBtn.style.marginTop = '10px';
    backBtn.onclick = back;
  }

  private closePhoneAndSettings(): void {
    this.closePhone();
    this.showSettings(() => {});
  }
}

export { DEFAULT_SETTINGS, WEAPONS };
