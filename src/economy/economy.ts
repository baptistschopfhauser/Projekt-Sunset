import { ECONOMY } from '../core/config.ts';
import type { EventBus } from '../core/events.ts';

export interface Transaction {
  amount: number;
  type: 'earn' | 'spend' | 'transfer' | 'chips' | 'fine' | 'casino';
  description: string;
  time: string;
  balance: number;
}

export class Economy {
  cash: number;
  bank: number;
  chips = 0;
  transactions: Transaction[] = [];
  events: EventBus;
  private timeLabel: () => string;

  constructor(events: EventBus, cash = ECONOMY.startCash, bank = ECONOMY.startBank, timeLabel: () => string = () => '') {
    this.events = events;
    this.cash = cash;
    this.bank = bank;
    this.timeLabel = timeLabel;
  }

  private log(amount: number, type: Transaction['type'], description: string): void {
    this.transactions.unshift({ amount, type, description, time: this.timeLabel(), balance: this.cash });
    if (this.transactions.length > 30) this.transactions.length = 30;
  }

  private emit(): void {
    this.events.emit('PLAYER_MONEY_CHANGED', { cash: this.cash, bank: this.bank, delta: 0, reason: '' });
  }

  earn(amount: number, description: string, toBank = false): boolean {
    if (amount <= 0 || !Number.isFinite(amount)) return false;
    const rounded = Math.round(amount);
    if (toBank) this.bank += rounded;
    else this.cash += rounded;
    this.log(rounded, 'earn', description);
    this.emit();
    return true;
  }

  spend(amount: number, description: string, fromBank = false): boolean {
    const rounded = Math.round(amount);
    if (rounded <= 0 || !Number.isFinite(rounded)) return false;
    const src = fromBank ? this.bank : this.cash;
    if (src < rounded) return false;
    if (fromBank) this.bank -= rounded;
    else this.cash -= rounded;
    this.log(-rounded, 'spend', description);
    this.emit();
    return true;
  }

  canAfford(amount: number, fromBank = false): boolean {
    return (fromBank ? this.bank : this.cash) >= Math.round(amount);
  }

  transferToBank(amount: number): boolean {
    const r = Math.round(amount);
    if (r <= 0 || this.cash < r) return false;
    this.cash -= r;
    this.bank += r;
    this.log(r, 'transfer', 'To bank account');
    this.emit();
    return true;
  }

  transferToCash(amount: number): boolean {
    const r = Math.round(amount);
    if (r <= 0 || this.bank < r) return false;
    this.bank -= r;
    this.cash += r;
    this.log(-r, 'transfer', 'From bank account');
    this.emit();
    return true;
  }

  buyChips(amount: number): boolean {
    const r = Math.round(amount);
    if (r <= 0 || this.cash < r) return false;
    this.cash -= r;
    this.chips += r;
    this.log(-r, 'chips', `Bought ${r} casino chips`);
    this.emit();
    return true;
  }

  redeemChips(amount: number): boolean {
    const r = Math.round(amount);
    if (r <= 0 || this.chips < r) return false;
    this.chips -= r;
    this.cash += r;
    this.log(r, 'chips', `Redeemed ${r} casino chips`);
    this.emit();
    return true;
  }

  chipBet(amount: number): boolean {
    const r = Math.round(amount);
    if (r <= 0 || this.chips < r) return false;
    this.chips -= r;
    this.emit();
    return true;
  }

  chipPayout(amount: number): void {
    const r = Math.round(amount);
    if (r <= 0) return;
    this.chips += r;
    this.emit();
  }

  repairPrice(damage: number, vehicleValue: number): number {
    const damage01 = 1 - damage / 1000;
    return Math.round(ECONOMY.repairBase + damage01 * vehicleValue * ECONOMY.repairDamageFactor);
  }

  bustFine(): number {
    return Math.min(this.cash, Math.round(this.cash * ECONOMY.bustFineFactor));
  }

  hospitalCost(): number {
    return Math.round(500 + this.bank * 0.02);
  }
}
