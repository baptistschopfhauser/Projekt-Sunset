import * as THREE from 'three';
import { el, fmtMoney, clear, show, hide } from './helpers.ts';
import { VEHICLES, WEAPONS, ECONOMY, AMMO_PRICE_PER_BOX, AMMO_BOX_SIZE } from '../core/config.ts';
import type { EventBus } from '../core/events.ts';
import type { Economy } from '../economy/economy.ts';
import type { VehicleManager } from '../vehicles/vehicleManager.ts';
import type { CombatSystem } from '../combat/combat.ts';
import { BlackjackGame } from '../casino/blackjack.ts';
import { spin as rouletteSpin, totalPayout, isValidBet, ROULETTE_ORDER, RED_NUMBERS, type RouletteBet } from '../casino/roulette.ts';
import { spinReels, evaluate, SLOT_BETS, SLOT_SYMBOLS, type SlotSymbol } from '../casino/slots.ts';
import { globalRng } from '../core/rng.ts';
import { cardValue, type Card } from '../casino/cards.ts';

export interface ShopApi {
  events: EventBus;
  economy: Economy;
  vehicles: VehicleManager;
  combat: CombatSystem;
  closeOverlays(): void;
  buyVehicle(modelId: string, color: number): boolean;
  storeVehicle(uid: number): void;
  retrieveVehicle(uid: number): boolean;
  repairVehicle(uid: number): boolean;
  applyUpgrade(uid: number, key: string): boolean;
  repaint(uid: number, color: number): boolean;
  garageOwned(): boolean;
  buyGarage(): boolean;
  refuelVehicle(): boolean;
  buyWeapon(id: string): boolean;
  buyAmmo(): boolean;
  buyFood(): boolean;
  atmTransfer(toBank: boolean, amount: number): boolean;
}

const CAR_COLORS = [0x8a8f98, 0x14213d, 0x7a1f2b, 0xd8c39b, 0x4a5d43, 0x2478f2, 0xF4B544, 0x111111];

export class Shops {
  api: ShopApi;
  parent: HTMLElement;
  overlay: HTMLElement | null = null;

  constructor(api: ShopApi, parent: HTMLElement) {
    this.api = api;
    this.parent = parent;
  }

  get isOpen(): boolean {
    return this.overlay !== null;
  }

  close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.api.closeOverlays();
    }
  }

  private open(title: string, build: (panel: HTMLElement) => void): HTMLElement {
    this.close();
    const ov = el('div', 'screen', this.parent);
    ov.style.background = 'rgba(10,13,18,0.88)';
    ov.style.zIndex = '46';
    ov.style.pointerEvents = 'auto';
    const panel = el('div', 'panel', ov);
    el('h2', '', panel, title);
    const content = el('div', '', panel);
    build(content);
    const closeBtn = el('button', 'btn', panel, 'SCHLIESSEN (ESC)');
    closeBtn.style.marginTop = '14px';
    closeBtn.onclick = () => this.close();
    this.overlay = ov;
    ov.addEventListener('mousedown', (e) => {
      if (e.target === ov) this.close();
    });
    return content;
  }

  private toast(panel: HTMLElement, text: string): void {
    let t = panel.querySelector('.toast-error') as HTMLElement | null;
    if (!t) {
      t = el('div', 'toast-error', panel);
    }
    t.textContent = text;
  }

  openDealership(): void {
    const panel = this.open('WESTHAVEN MOTORS', () => {});
    const list = el('div', '', panel);
    for (const def of Object.values(VEHICLES)) {
      if (!def.drivable || def.price <= 0) continue;
      const row = el('div', 'shop-item', list);
      const info = el('div', '', row);
      el('div', 'name', info, def.name);
      el('div', 'sub', info, `${def.topSpeedKmh} km/h | 0-100 ${def.accel0to100}s | ${def.massKg} kg | ${def.tankLiters} L`);
      const right = el('div', '', row);
      el('div', 'price', right, fmtMoney(def.price));
      let color = def.color;
      const cs = el('select', '', right);
      for (const c of CAR_COLORS) {
        const op = el('option', '', cs, `#${c.toString(16).padStart(6, '0')}`);
        op.value = String(c);
        if (c === def.color) op.selected = true;
      }
      cs.onchange = () => (color = parseInt(cs.value, 10));
      const b = el('button', 'btn small', right, 'KAUFEN');
      b.onclick = () => {
        if (this.api.buyVehicle(def.id, color)) {
          this.api.events.emit('NOTIFICATION', { text: `${def.name} gekauft! Übergabe auf dem Hof.`, kind: 'money' });
          this.openDealership();
        } else this.toast(panel, 'Nicht genug Geld.');
      };
    }
  }

  openGarage(): void {
    const panel = this.open('GARAGE WESTHAVEN', () => {});
    if (!this.api.garageOwned()) {
      el('div', '', panel, `Diese Garage ist käuflich: ${fmtMoney(ECONOMY.garagePrice)} (vom Bankkonto).`);
      const b = el('button', 'btn', panel, `GARAGE KAUFEN (${fmtMoney(ECONOMY.garagePrice)})`);
      b.onclick = () => {
        if (this.api.buyGarage()) {
          this.api.events.emit('NOTIFICATION', { text: 'Garage gekauft!', kind: 'money' });
          this.openGarage();
        } else this.toast(panel, 'Nicht genug Geld auf dem Bankkonto.');
      };
      return;
    }
    el('div', '', panel, 'Eigene Fahrzeuge (parken = im Zone stehen und Menü öffnen):');
    const list = el('div', '', panel);
    for (const v of this.api.vehicles.vehicles.filter((v) => v.owned)) {
      const row = el('div', 'shop-item', list);
      const info = el('div', '', row);
      el('div', 'name', info, `${v.def.name} - ${v.plate}`);
      el('div', 'sub', info, `${v.inGarage ? 'In Garage' : `Pos ${Math.round(v.pos.x)}/${Math.round(v.pos.z)}`} | Schaden ${Math.round(v.damage)}/1000 | Tank ${Math.round(v.fuel)} L | ${v.upgrades.join(', ') || 'Serie'}`);
      const right = el('div', '', row);
      if (v.inGarage) {
        const b = el('button', 'btn small', right, 'AUSPARKEN');
        b.onclick = () => {
          if (this.api.retrieveVehicle(v.uid)) this.openGarage();
        };
      } else if (v !== this.api.vehicles.playerVehicle) {
        const b = el('button', 'btn small', right, 'EINPARKEN');
        b.onclick = () => {
          this.api.storeVehicle(v.uid);
          this.openGarage();
        };
      } else {
        el('span', 'sub', right, '(aktuell gefahren)');
      }
    }
  }

  openWorkshop(): void {
    const panel = this.open('AUTOFIX WERKSTATT', () => {});
    const pv = this.api.vehicles.playerVehicle;
    if (!pv) {
      el('div', '', panel, 'Bitte zuerst ein Fahrzeug betreten (F), das repariert werden soll.');
      return;
    }
    const price = this.api.economy.repairPrice(pv.damage, pv.def.price || 10000);
    el('div', '', panel, `${pv.def.name} - Schaden ${Math.round(pv.damage)}/1000 - Reparatur: ${fmtMoney(price)}`);
    const rb = el('button', 'btn', panel, `REPARATUR (${fmtMoney(price)})`);
    rb.onclick = () => {
      if (this.api.repairVehicle(pv.uid)) {
        this.api.events.emit('NOTIFICATION', { text: 'Fahrzeug repariert.', kind: 'money' });
        this.openWorkshop();
      } else this.toast(panel, 'Nicht genug Bargeld.');
    };
    el('div', '', panel, 'Upgrades:').style.marginTop = '12px';
    const ups: [string, string, number][] = [
      ['engine1', 'Motor Stage 1 (+7% Beschl.)', ECONOMY.upgrades.engine1.price],
      ['engine2', 'Motor Stage 2 (+8% Beschl.)', ECONOMY.upgrades.engine2.price],
      ['brakes', 'Sportbremsen (+12%)', ECONOMY.upgrades.brakes.price],
      ['sport_tires', 'Sportreifen (+8% Asphalt)', ECONOMY.upgrades.sport_tires.price],
      ['offroad_tires', 'Offroad-Reifen', ECONOMY.upgrades.offroad_tires.price],
      ['sport_suspension', 'Sportfahrwerk', ECONOMY.upgrades.sport_suspension.price],
      ['rims', 'Felgenwechsel', ECONOMY.upgrades.rims.price],
    ];
    for (const [key, label, price] of ups) {
      const b = el('button', 'btn small', panel, `${label} - ${fmtMoney(price)}`);
      b.disabled = pv.upgrades.includes(key);
      b.onclick = () => {
        if (this.api.applyUpgrade(pv.uid, key)) this.openWorkshop();
      };
    }
    el('div', '', panel, 'Lackierung:').style.marginTop = '12px';
    const row = el('div', 'row', panel);
    for (const c of CAR_COLORS) {
      const b = el('button', 'btn small', row, `#${c.toString(16).padStart(6, '0')}`);
      b.style.background = `#${c.toString(16).padStart(6, '0')}`;
      b.style.color = '#000';
      b.onclick = () => {
        if (this.api.repaint(pv.uid, c)) this.openWorkshop();
      };
    }
  }

  openAmmunition(): void {
    const panel = this.open('NORTHGATE AMMUNITION', () => {});
    const list = el('div', '', panel);
    for (const w of Object.values(WEAPONS)) {
      const owned = this.api.combat.weapons.has(w.id);
      const row = el('div', 'shop-item', list);
      const info = el('div', '', row);
      el('div', 'name', info, w.name);
      el('div', 'sub', info, `Schaden ${w.baseDamage}${w.pellets > 1 ? ' x' + w.pellets : ''} | Magazin ${w.magSize} | ${w.shotsPerSec.toFixed(1)}/s`);
      const right = el('div', '', row);
      el('div', 'price', right, owned ? 'BESITZ' : fmtMoney(w.price));
      const b = el('button', 'btn small', right, owned ? '—' : 'KAUFEN');
      b.disabled = owned;
      b.onclick = () => {
        if (this.api.buyWeapon(w.id)) {
          this.api.events.emit('NOTIFICATION', { text: `${w.name} gekauft.`, kind: 'money' });
          this.openAmmunition();
        } else this.toast(panel, 'Nicht genug Geld.');
      };
    }
    const ammoRow = el('div', 'shop-item', list);
    el('div', 'name', ammoRow, `Munitionskiste (${AMMO_BOX_SIZE} Schuss je Waffe)`);
    el('div', 'price', ammoRow, fmtMoney(AMMO_PRICE_PER_BOX));
    const ab = el('button', 'btn small', ammoRow, 'KAUFEN');
    ab.onclick = () => {
      if (this.api.buyAmmo()) this.api.events.emit('NOTIFICATION', { text: 'Munition gekauft.', kind: 'money' });
      else this.toast(panel, 'Nicht genug Geld.');
    };
  }

  openMarket(): void {
    const panel = this.open('SUNSET MARKET', () => {});
    const items: [string, string, number, () => boolean][] = [
      ['Snack', 'Kleine Stärkung (+15 Leben)', 25, () => this.api.buyFood()],
      ['Sandwich', 'Gute Stärkung (+40 Leben)', 60, () => this.api.buyFood()],
      ['Menü', 'Große Mahlzeit (+100 Leben)', 120, () => this.api.buyFood()],
    ];
    for (const [name, sub, price, fn] of items) {
      const row = el('div', 'shop-item', panel);
      const info = el('div', '', row);
      el('div', 'name', info, name);
      el('div', 'sub', info, sub);
      el('div', 'price', row, fmtMoney(price));
      const b = el('button', 'btn small', row, 'KAUFEN');
      b.onclick = () => {
        if (fn()) this.api.events.emit('NOTIFICATION', { text: `${name} gekauft.`, kind: 'money' });
        else this.toast(panel, 'Nicht genug Geld.');
      };
    }
  }

  openAtm(): void {
    this.open('SUNSET BANK - ATM', (panel) => {
      const eco = this.api.economy;
      el('div', 'kv', panel).innerHTML = `<span>Bargeld</span><span>${fmtMoney(eco.cash)}</span>`;
      el('div', 'kv', panel).innerHTML = `<span>Bankkonto</span><span>${fmtMoney(eco.bank)}</span>`;
      const amt = el('input', '', panel) as HTMLInputElement;
      amt.type = 'number';
      amt.value = '500';
      amt.style.marginTop = '12px';
      const row = el('div', 'row', panel);
      row.style.marginTop = '8px';
      const b1 = el('button', 'btn', row, 'AUF KONTO EINZAHLEN');
      b1.onclick = () => {
        if (!this.api.atmTransfer(true, parseInt(amt.value, 10))) this.toast(panel, 'Ungültiger Betrag.');
        else this.openAtm();
      };
      const b2 = el('button', 'btn', row, 'ABHEBEN');
      b2.onclick = () => {
        if (!this.api.atmTransfer(false, parseInt(amt.value, 10))) this.toast(panel, 'Ungültiger Betrag.');
        else this.openAtm();
      };
    });
  }

  openGas(): void {
    this.open('SUNSET FUEL', (panel) => {
      const pv = this.api.vehicles.playerVehicle;
      if (!pv) {
        el('div', '', panel, 'Bitte im Fahrzeug sitzen (F).');
        return;
      }
      const missing = pv.def.tankLiters - pv.fuel;
      const cost = Math.ceil(missing * ECONOMY.fuelPricePerLiter);
      el('div', '', panel, `Tank: ${Math.round(pv.fuel)} / ${pv.def.tankLiters} L - Volltanken: ${fmtMoney(cost)} (${ECONOMY.fuelPricePerLiter} $/L)`);
      const b = el('button', 'btn', panel, `VOLLTANKEN (${fmtMoney(cost)})`);
      b.style.marginTop = '10px';
      b.onclick = () => {
        if (this.api.refuelVehicle()) {
          this.api.events.emit('NOTIFICATION', { text: 'Vollgetankt.', kind: 'money' });
          this.close();
        } else this.toast(panel, 'Nicht genug Geld.');
      };
    });
  }

  openCashier(): void {
    this.open('CROWN CASINO - CHIPKASSE', (panel) => {
      const eco = this.api.economy;
      el('div', 'kv', panel).innerHTML = `<span>Bargeld</span><span>${fmtMoney(eco.cash)}</span>`;
      el('div', 'kv', panel).innerHTML = `<span>Chips</span><span>${eco.chips}</span>`;
      el('div', '', panel, 'Bargeld → Chips (1:1):').style.marginTop = '10px';
      const row = el('div', 'row', panel);
      for (const amt of [100, 500, 1000, 5000]) {
        const b = el('button', 'btn small', row, fmtMoney(amt));
        b.onclick = () => {
          if (eco.buyChips(amt)) this.openCashier();
          else this.toast(panel, 'Nicht genug Bargeld.');
        };
      }
      const row2 = el('div', 'row', panel);
      row2.style.marginTop = '8px';
      const rb = el('button', 'btn', row2, 'ALLE CHIPS EINLÖSEN');
      rb.onclick = () => {
        if (eco.chips > 0) {
          eco.redeemChips(eco.chips);
          this.openCashier();
        }
      };
    });
  }

  openBlackjack(): void {
    const game = new BlackjackGame(() => globalRng.float());
    let bet = 25;
    this.open('BLACKJACK (6 Decks)', (panel) => {
      panel.classList.add('bj-table');
      const chipsEl = el('div', 'kv', panel);
      const msgEl = el('div', '', panel);
      msgEl.style.cssText = 'color:#F4B544;min-height:20px';
      const dealerEl = el('div', '', panel);
      const playerEl = el('div', '', panel);
      const render = () => {
        chipsEl.innerHTML = `<span>Chips</span><span>${this.api.economy.chips}</span>`;
        dealerEl.innerHTML = 'Dealer: ' + game.dealer.map(cardEl).join('') + ` <b>(${game.phase === 'done' || game.phase === 'dealer' ? game.dealer.reduce((s, c) => s + cardValue(c.rank), 0) : '?'})</b>`;
        playerEl.innerHTML = game.hands
          .map((h, i) => `Hand ${i + 1} (${h.bet}): ` + h.cards.map(cardEl).join('') + ` <b>${h.cards.reduce((s, c) => s + cardValue(c.rank), 0)}</b>${i === game.activeHand && game.phase === 'player' ? ' ▶' : ''}`)
          .join('<br>');
        msgEl.textContent = game.result ? `Ergebnis: ${game.result} - Auszahlung ${game.lastPayout} Chips` : game.phase === 'bet' ? `Einsatz wählen und DEAL (min ${game.minBet}, max ${game.maxBet})` : '';
      };
      const betRow = el('div', 'row', panel);
      for (const b of [25, 100, 500]) {
        const btn = el('button', 'btn small', betRow, `+${b}`);
        btn.onclick = () => {
          bet = Math.min(game.maxBet, bet + b);
          render();
        };
      }
      const clearBtn = el('button', 'btn small danger', betRow, 'CLEAR');
      clearBtn.onclick = () => {
        bet = 25;
        render();
      };
      const betLabel = el('div', '', panel);
      const dealBtn = el('button', 'btn', panel, 'DEAL');
      dealBtn.onclick = () => {
        if (!this.api.economy.chipBet(bet)) {
          msgEl.textContent = 'Nicht genug Chips.';
          return;
        }
        game.deal(bet, this.api.economy.chips + bet);
        if (game.phase === 'done') this.api.economy.chipPayout(game.lastPayout);
        render();
      };
      const actRow = el('div', 'row', panel);
      const mkAct = (label: string, act: 'hit' | 'stand' | 'double' | 'split') => {
        const b = el('button', 'btn', actRow, label);
        b.onclick = () => {
          const h = game.currentHand;
          if (act === 'double' || act === 'split') {
            if (h && !this.api.economy.chipBet(h.bet)) {
              msgEl.textContent = 'Nicht genug Chips für Verdopplung/Split.';
              return;
            }
          }
          game.action(act, this.api.economy.chips + game.committed);
          if (game.phase === 'done') this.api.economy.chipPayout(game.lastPayout);
          render();
        };
        return b;
      };
      const hitB = mkAct('HIT', 'hit');
      const standB = mkAct('STAND', 'stand');
      const dblB = mkAct('DOUBLE', 'double');
      const splitB = mkAct('SPLIT', 'split');
      const nextB = el('button', 'btn', panel, 'NEUE RUNDE');
      nextB.onclick = () => {
        game.nextRound();
        bet = 25;
        render();
      };
      const upd = () => {
        const betting = game.phase === 'bet';
        const playing = game.phase === 'player';
        dealBtn.disabled = !betting;
        hitB.disabled = !playing;
        standB.disabled = !playing;
        dblB.disabled = !playing;
        splitB.disabled = !playing;
        betLabel.textContent = `Einsatz: ${bet} Chips`;
        render();
      };
      upd();
      betRow.addEventListener('click', () => setTimeout(upd, 0));
      actRow.addEventListener('click', () => setTimeout(upd, 0));
      dealBtn.addEventListener('click', () => setTimeout(upd, 0));
      nextB.addEventListener('click', () => setTimeout(upd, 0));
    });
  }

  openRoulette(): void {
    const bets: RouletteBet[] = [];
    const lastResults: number[] = [];
    let spinning = false;
    this.open('ROULETTE (europäisch, single 0)', (panel) => {
      const chipsEl = el('div', 'kv', panel);
      const msgEl = el('div', '', panel);
      msgEl.style.cssText = 'color:#F4B544;min-height:20px';
      const resultEl = el('div', '', panel);
      resultEl.style.cssText = 'font-size:26px;font-weight:700;text-align:center;margin:6px';
      let chipVal = 10;
      const chipRow = el('div', 'row', panel);
      for (const v of [10, 50, 100, 500]) {
        const b = el('button', 'chip-btn', chipRow, String(v));
        if (v === 10) b.classList.add('sel');
        b.onclick = () => {
          chipVal = v;
          chipRow.querySelectorAll('.chip-btn').forEach((x) => x.classList.remove('sel'));
          b.classList.add('sel');
        };
      }
      const grid = el('div', 'roulette-grid', panel);
      const cellBet = new Map<string, number>();
      const mkCell = (label: string, css: string, place: () => void) => {
        const c = el('div', `roulette-cell ${css}`, grid, label);
        c.onclick = () => {
          if (spinning) return;
          place();
        };
        return c;
      };
      mkCell('0', 'green', () => {
        cellBet.set('straight:0', (cellBet.get('straight:0') ?? 0) + chipVal);
        refreshBets();
      });
      for (let col = 0; col < 12; col++) {
        for (let row = 0; row < 3; row++) {
          const n = 3 * (11 - col) + (row + 1);
          const isRed = RED_NUMBERS.has(n);
          mkCell(String(n), isRed ? 'red' : '', () => {
            cellBet.set(`straight:${n}`, (cellBet.get(`straight:${n}`) ?? 0) + chipVal);
            refreshBets();
          });
        }
      }
      const outside = el('div', 'row', panel);
      const outsideDefs: [string, BetType2][] = [
        ['Rot', 'red'], ['Schwarz', 'black'], ['Gerade', 'even'], ['Ungerade', 'odd'], ['1-18', 'low'], ['19-36', 'high'],
        ['1. Dutzend', 'dozen1'], ['2. Dutzend', 'dozen2'], ['3. Dutzend', 'dozen3'],
        ['Kol 1', 'col1'], ['Kol 2', 'col2'], ['Kol 3', 'col3'],
      ];
      for (const [label, type] of outsideDefs) {
        const b = el('button', 'btn small', outside, label);
        b.onclick = () => {
          if (spinning) return;
          cellBet.set(type, (cellBet.get(type) ?? 0) + chipVal);
          refreshBets();
        };
      }
      const betInfo = el('div', '', panel);
      const refreshBets = () => {
        bets.length = 0;
        for (const [k, amt] of cellBet) {
          if (k.startsWith('straight:')) bets.push({ type: 'straight', number: parseInt(k.split(':')[1], 10), amount: amt });
          else bets.push({ type: k as BetType2, amount: amt });
        }
        const total = bets.reduce((s, b) => s + b.amount, 0);
        betInfo.textContent = `Gesamteinsatz: ${total} Chips (max 2.500)`;
        chipsEl.innerHTML = `<span>Chips</span><span>${this.api.economy.chips}</span>`;
      };
      refreshBets();
      const row = el('div', 'row', panel);
      const clearB = el('button', 'btn danger', row, 'CLEAR BETS');
      clearB.onclick = () => {
        cellBet.clear();
        refreshBets();
      };
      const spinB = el('button', 'btn', row, 'SPIN');
      spinB.onclick = () => {
        if (spinning) return;
        const total = bets.reduce((s, b) => s + b.amount, 0);
        if (!isValidBet(bets, this.api.economy.chips)) {
          msgEl.textContent = 'Ungültiger Einsatz (zu wenig Chips oder über 2.500 gesamt).';
          return;
        }
        if (bets.length === 0) {
          msgEl.textContent = 'Bitte zuerst Einsätze platzieren.';
          return;
        }
        spinning = true;
        this.api.economy.chipBet(total);
        const result = rouletteSpin(() => globalRng.float());
        let ticks = 0;
        const iv = setInterval(() => {
          ticks++;
          resultEl.textContent = String(ROULETTE_ORDER[Math.floor(globalRng.float() * 37)]);
          resultEl.style.color = '#F1F3F5';
          if (ticks > 18) {
            clearInterval(iv);
            resultEl.textContent = `Ergebnis: ${result} ${RED_NUMBERS.has(result) ? '(Rot)' : result === 0 ? '(Grün)' : '(Schwarz)'}`;
            resultEl.style.color = result === 0 ? '#7ddb8a' : RED_NUMBERS.has(result) ? '#EB3F47' : '#F1F3F5';
            const win = totalPayout(bets, result);
            if (win > 0) this.api.economy.chipPayout(win);
            lastResults.unshift(result);
            if (lastResults.length > 10) lastResults.pop();
            msgEl.textContent = win > 0 ? `Gewinn: ${win} Chips!` : `Verloren (-${total} Chips). Letzte Zahlen: ${lastResults.join(', ')}`;
            cellBet.clear();
            refreshBets();
            spinning = false;
          }
        }, 70);
      };
      el('div', '', panel, `Letzte Zahlen: ${lastResults.join(', ') || '-'}`).id = 'roulette-last';
    });
  }

  openSlots(): void {
    let betIdx = 0;
    let spinning = false;
    let lastWin = 0;
    this.open('SLOTS - LUCKY CROWN', (panel) => {
      const chipsEl = el('div', 'kv', panel);
      const display = el('div', '', panel);
      display.id = 'slots-display';
      display.textContent = '★ ★ ★ ★ ★';
      const msgEl = el('div', '', panel);
      msgEl.style.cssText = 'color:#F4B544;min-height:20px;text-align:center';
      const betRow = el('div', 'row', panel);
      betRow.style.justifyContent = 'center';
      SLOT_BETS.forEach((b, i) => {
        const btn = el('button', 'btn small', betRow, `${b}`);
        if (i === betIdx) btn.style.borderColor = '#F4B544';
        btn.onclick = () => {
          betIdx = i;
          betRow.querySelectorAll('.btn').forEach((x) => (x as HTMLElement).style.borderColor = '');
          btn.style.borderColor = '#F4B544';
        };
      });
      const spinB = el('button', 'btn', panel, 'SPIN');
      spinB.style.display = 'block';
      spinB.style.margin = '10px auto';
      const payEl = el('div', '', panel);
      payEl.style.cssText = 'font-size:11px;color:#9aa3ad';
      payEl.textContent = '3 gleiche: 2x | 4 gleiche: 5x | 5 gleiche: 15x (mal Linienwette). Symbole: Krone/Diamant/Sieben am wertvollsten.';
      const symEmoji: Record<SlotSymbol, string> = { crown: '👑', star: '⭐', cherry: '🍒', bell: '🔔', diamond: '💎', seven: '7️⃣', palm: '🌴', coin: '🪙' };
      spinB.onclick = () => {
        if (spinning) return;
        const bet = SLOT_BETS[betIdx];
        if (!this.api.economy.chipBet(bet * 10)) {
          msgEl.textContent = 'Nicht genug Chips.';
          return;
        }
        spinning = true;
        spinB.disabled = true;
        const reels = spinReels(() => globalRng.float());
        const shown: SlotSymbol[][] = [[], [], [], [], []].map(() => ['star', 'star', 'star'] as SlotSymbol[]);
        let stopped = [false, false, false, false, false];
        const render = () => {
          display.textContent = shown.map((col) => col.map((s) => symEmoji[s]).join('\n')).join('   ');
          display.style.whiteSpace = 'pre-line';
          display.style.lineHeight = '1.1';
        };
        render();
        const iv = setInterval(() => {
          let allStopped = true;
          for (let r = 0; r < 5; r++) {
            if (stopped[r]) continue;
            allStopped = false;
            shown[r] = [reels[r][0], reels[r][1], reels[r][2]];
            if (Math.random() < 0.3) {
              shown[r] = [SLOT_SYMBOLS[Math.floor(globalRng.float() * 8)], SLOT_SYMBOLS[Math.floor(globalRng.float() * 8)], SLOT_SYMBOLS[Math.floor(globalRng.float() * 8)]];
            }
            if (Math.random() < 0.22 + r * 0.16) stopped[r] = true;
          }
          render();
          if (allStopped) {
            clearInterval(iv);
            const finalReels: SlotSymbol[][] = [];
            for (let r = 0; r < 5; r++) finalReels.push([...reels[r]]);
            shown.forEach((col, r) => (shown[r] = [...finalReels[r]]));
            render();
            const { totalWin, winningLines } = evaluate(finalReels, bet);
            lastWin = totalWin;
            if (totalWin > 0) {
              this.api.economy.chipPayout(totalWin);
              msgEl.textContent = `GEWINN: ${totalWin} Chips! (${winningLines.length} Linien)`;
            } else {
              msgEl.textContent = `Kein Gewinn (-${bet * 10} Chips). Letzter Gewinn: ${lastWin}`;
            }
            chipsEl.innerHTML = `<span>Chips</span><span>${this.api.economy.chips}</span>`;
            spinning = false;
            spinB.disabled = false;
          }
        }, 90);
      };
      chipsEl.innerHTML = `<span>Chips</span><span>${this.api.economy.chips}</span>`;
    });
  }
}

type BetType2 = import('../casino/roulette.ts').BetType;

function cardEl(c: Card): string {
  const red = c.suit === 'hearts' || c.suit === 'diamonds';
  const suitChar = { hearts: '♥', diamonds: '♦', spades: '♠', clubs: '♣' }[c.suit];
  return `<span class="card-el ${red ? 'red' : ''}">${c.rank}${suitChar}</span>`;
}

export { THREE };
