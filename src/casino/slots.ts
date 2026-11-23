export const SLOT_SYMBOLS = ['crown', 'star', 'cherry', 'bell', 'diamond', 'seven', 'palm', 'coin'] as const;
export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 1, 0, 1],
];

const PAYTABLE: Record<SlotSymbol, number[]> = {
  crown: [10, 40, 150],
  star: [8, 30, 100],
  cherry: [6, 20, 60],
  bell: [5, 15, 50],
  diamond: [12, 50, 200],
  seven: [15, 60, 250],
  palm: [4, 12, 40],
  coin: [4, 10, 35],
};

export function spinReels(rng: () => number): SlotSymbol[][] {
  const reels: SlotSymbol[][] = [];
  for (let r = 0; r < 5; r++) {
    const col: SlotSymbol[] = [];
    for (let row = 0; row < 3; row++) col.push(SLOT_SYMBOLS[Math.floor(rng() * SLOT_SYMBOLS.length)]);
    reels.push(col);
  }
  return reels;
}

export function evaluate(reels: SlotSymbol[][], betPerLine: number): { totalWin: number; winningLines: { line: number; count: number; symbol: SlotSymbol }[] } {
  let totalWin = 0;
  const winningLines: { line: number; count: number; symbol: SlotSymbol }[] = [];
  for (let li = 0; li < PAYLINES.length; li++) {
    const line = PAYLINES[li];
    const first = reels[0][line[0]];
    let count = 1;
    for (let r = 1; r < 5; r++) {
      if (reels[r][line[r]] === first) count++;
      else break;
    }
    if (count >= 3) {
      const mult = PAYTABLE[first][count - 3];
      totalWin += mult * betPerLine;
      winningLines.push({ line: li, count, symbol: first });
    }
  }
  return { totalWin, winningLines };
}

export const SLOT_BETS = [5, 10, 25, 50];
