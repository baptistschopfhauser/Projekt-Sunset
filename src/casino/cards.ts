export type Suit = 'hearts' | 'diamonds' | 'spades' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'spades', 'clubs'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function cardValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return parseInt(rank, 10);
}

export function handValue(cards: Card[]): { value: number; soft: boolean } {
  let sum = 0;
  let aces = 0;
  for (const c of cards) {
    sum += cardValue(c.rank);
    if (c.rank === 'A') aces++;
  }
  let soft = aces > 0;
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
    soft = aces > 0;
  }
  return { value: sum, soft };
}

export class Shoe {
  cards: Card[] = [];
  private rng: () => number;
  constructor(decks: number, rng: () => number) {
    this.rng = rng;
    for (let d = 0; d < decks; d++) {
      for (const s of SUITS) for (const r of RANKS) this.cards.push({ rank: r, suit: s });
    }
    this.shuffle();
  }
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const t = this.cards[i];
      this.cards[i] = this.cards[j];
      this.cards[j] = t;
    }
  }
  draw(): Card {
    if (this.cards.length < 78) this.shuffle();
    return this.cards.pop()!;
  }
  get remaining(): number {
    return this.cards.length;
  }
}
