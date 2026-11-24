export interface ScoreEntry {
  name: string;
  kind: string;
  value: number;
  detail: string;
  at: number;
}

export class Leaderboard {
  base: string;
  online = false;
  private lastCheck = 0;

  constructor() {
    if (typeof location !== 'undefined' && location.protocol !== 'file:') this.base = location.origin;
    else this.base = 'http://127.0.0.1:8080';
  }

  async check(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastCheck < 15000 && this.lastCheck !== 0) return this.online;
    this.lastCheck = now;
    try {
      const r = await fetch(`${this.base}/api/health`, { signal: AbortSignal.timeout(2500) });
      this.online = r.ok;
    } catch {
      this.online = false;
    }
    return this.online;
  }

  async submit(kind: string, value: number, detail = '', name = 'Alex Morgan'): Promise<boolean> {
    try {
      const r = await fetch(`${this.base}/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, kind, value, detail }),
        signal: AbortSignal.timeout(3000),
      });
      return r.ok;
    } catch {
      return false;
    }
  }

  async top(kind = 'all', limit = 20): Promise<ScoreEntry[]> {
    try {
      const r = await fetch(`${this.base}/api/leaderboard?kind=${encodeURIComponent(kind)}&limit=${limit}`, { signal: AbortSignal.timeout(3000) });
      if (!r.ok) return [];
      const data = (await r.json()) as { scores: ScoreEntry[] };
      return data.scores ?? [];
    } catch {
      return [];
    }
  }
}
