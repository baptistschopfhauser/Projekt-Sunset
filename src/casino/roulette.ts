export const ROULETTE_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

export const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type BetType = 'straight' | 'red' | 'black' | 'even' | 'odd' | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3' | 'col1' | 'col2' | 'col3';

export interface RouletteBet {
  type: BetType;
  number?: number;
  amount: number;
}

export function spin(rng: () => number): number {
  return ROULETTE_ORDER[Math.floor(rng() * ROULETTE_ORDER.length)];
}

export function payoutFor(bet: RouletteBet, result: number): number {
  const n = result;
  switch (bet.type) {
    case 'straight':
      return bet.number === n ? bet.amount * 36 : 0;
    case 'red':
      return RED_NUMBERS.has(n) ? bet.amount * 2 : 0;
    case 'black':
      return n !== 0 && !RED_NUMBERS.has(n) ? bet.amount * 2 : 0;
    case 'even':
      return n !== 0 && n % 2 === 0 ? bet.amount * 2 : 0;
    case 'odd':
      return n % 2 === 1 ? bet.amount * 2 : 0;
    case 'low':
      return n >= 1 && n <= 18 ? bet.amount * 2 : 0;
    case 'high':
      return n >= 19 && n <= 36 ? bet.amount * 2 : 0;
    case 'dozen1':
      return n >= 1 && n <= 12 ? bet.amount * 3 : 0;
    case 'dozen2':
      return n >= 13 && n <= 24 ? bet.amount * 3 : 0;
    case 'dozen3':
      return n >= 25 && n <= 36 ? bet.amount * 3 : 0;
    case 'col1':
      return n !== 0 && ROULETTE_ORDER.indexOf(n) % 3 === 0 ? bet.amount * 3 : 0;
    case 'col2':
      return n !== 0 && ROULETTE_ORDER.indexOf(n) % 3 === 1 ? bet.amount * 3 : 0;
    case 'col3':
      return n !== 0 && ROULETTE_ORDER.indexOf(n) % 3 === 2 ? bet.amount * 3 : 0;
  }
}

export function totalPayout(bets: RouletteBet[], result: number): number {
  let sum = 0;
  for (const b of bets) sum += payoutFor(b, result);
  return sum;
}

export function isValidBet(bets: RouletteBet[], chips: number, maxTotal = 2500, minStraight = 10): boolean {
  const total = bets.reduce((s, b) => s + b.amount, 0);
  if (total > chips || total > maxTotal) return false;
  for (const b of bets) {
    if (b.type === 'straight') {
      if (b.amount < minStraight || b.number === undefined || b.number < 0 || b.number > 36) return false;
    }
  }
  return true;
}
