import { Shoe, handValue, type Card } from './cards.ts';

export type BJAction = 'hit' | 'stand' | 'double' | 'split';
export type BJPhase = 'bet' | 'player' | 'dealer' | 'done';
export type BJResult = 'win' | 'lose' | 'push' | 'blackjack' | null;

export interface BJHand {
  cards: Card[];
  bet: number;
  doubled: boolean;
  fromSplitAces: boolean;
}

export class BlackjackGame {
  shoe: Shoe;
  dealer: Card[] = [];
  hands: BJHand[] = [];
  activeHand = 0;
  phase: BJPhase = 'bet';
  result: BJResult = null;
  lastPayout = 0;
  minBet = 25;
  maxBet = 1000;

  constructor(rng: () => number) {
    this.shoe = new Shoe(6, rng);
  }

  get committed(): number {
    return this.hands.reduce((s, h) => s + h.bet, 0);
  }

  deal(bet: number, chips: number): boolean {
    if (this.phase !== 'bet') return false;
    if (bet < this.minBet || bet > this.maxBet || bet > chips) return false;
    this.hands = [{ cards: [this.shoe.draw(), this.shoe.draw()], bet, doubled: false, fromSplitAces: false }];
    this.dealer = [this.shoe.draw(), this.shoe.draw()];
    this.activeHand = 0;
    this.result = null;
    this.lastPayout = 0;
    const hv = handValue(this.hands[0].cards).value;
    const dv = handValue(this.dealer).value;
    if (hv === 21 && dv === 21) {
      this.finish();
      return true;
    }
    if (hv === 21) {
      this.phase = 'done';
      this.result = 'blackjack';
      this.lastPayout = Math.floor(bet * 2.5);
      return true;
    }
    if (dv === 21) {
      this.phase = 'done';
      this.result = 'lose';
      return true;
    }
    this.phase = 'player';
    return true;
  }

  get currentHand(): BJHand | null {
    return this.hands[this.activeHand] ?? null;
  }

  action(a: BJAction, chips: number): { ok: boolean } {
    const h = this.currentHand;
    if (!h || this.phase !== 'player') return { ok: false };
    if (a === 'hit') {
      h.cards.push(this.shoe.draw());
      if (handValue(h.cards).value > 21) return this.advance();
      return { ok: true };
    }
    if (a === 'stand') return this.advance();
    if (a === 'double') {
      if (h.cards.length !== 2 || this.committed + h.bet > chips) return { ok: false };
      h.doubled = true;
      h.bet *= 2;
      h.cards.push(this.shoe.draw());
      return this.advance();
    }
    if (a === 'split') {
      if (h.cards.length !== 2 || h.cards[0].rank !== h.cards[1].rank || this.hands.length >= 4) return { ok: false };
      if (this.committed + h.bet > chips) return { ok: false };
      const [c1, c2] = h.cards;
      const aces = c1.rank === 'A';
      this.hands[this.activeHand] = { cards: [c1, this.shoe.draw()], bet: h.bet, doubled: false, fromSplitAces: aces };
      this.hands.splice(this.activeHand + 1, 0, { cards: [c2, this.shoe.draw()], bet: h.bet, doubled: false, fromSplitAces: aces });
      if (aces) return this.advance();
      return { ok: true };
    }
    return { ok: false };
  }

  private advance(): { ok: boolean } {
    const h = this.currentHand;
    if (h && handValue(h.cards).value <= 21 && this.activeHand + 1 < this.hands.length) {
      this.activeHand++;
      return { ok: true };
    }
    return this.finish();
  }

  private finish(): { ok: boolean } {
    this.phase = 'dealer';
    while (handValue(this.dealer).value < 17) this.dealer.push(this.shoe.draw());
    const dv = handValue(this.dealer).value;
    let total = 0;
    let anyWin = false;
    let anyPush = false;
    let naturalBJ = false;
    for (const h of this.hands) {
      const hv = handValue(h.cards).value;
      const natural = h.cards.length === 2 && hv === 21 && !h.fromSplitAces;
      if (hv > 21) continue;
      if (dv > 21 || hv > dv) {
        total += natural ? Math.floor(h.bet * 2.5) : h.bet * 2;
        anyWin = true;
        if (natural) naturalBJ = true;
      } else if (hv === dv) {
        total += h.bet;
        anyPush = true;
      }
    }
    this.lastPayout = total;
    if (naturalBJ) this.result = 'blackjack';
    else if (anyWin) this.result = 'win';
    else this.result = anyPush ? 'push' : 'lose';
    this.phase = 'done';
    return { ok: true };
  }

  nextRound(): void {
    this.phase = 'bet';
    this.hands = [];
    this.dealer = [];
    this.result = null;
    this.lastPayout = 0;
    this.activeHand = 0;
  }
}
