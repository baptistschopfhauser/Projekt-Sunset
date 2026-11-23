import './ui/style.css';
import { Game } from './app/game.ts';

const app = document.getElementById('app')!;
const game = new Game(app);
void game.boot();

declare global {
  interface Window {
    __sunset: Game;
  }
}
window.__sunset = game;
