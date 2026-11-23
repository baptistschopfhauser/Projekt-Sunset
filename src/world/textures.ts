import * as THREE from 'three';
import { RNG } from '../core/rng.ts';

function canvasTex(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function asphaltTexture(): THREE.CanvasTexture {
  const rng = new RNG(42);
  return canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#34393f';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const g = 48 + rng.int(0, 26);
      ctx.fillStyle = `rgb(${g},${g + 3},${g + 6})`;
      ctx.fillRect(rng.range(0, s), rng.range(0, s), 2, 2);
    }
    ctx.fillStyle = '#c9c2a0';
    ctx.fillRect(0, 0, 4, s);
    ctx.fillRect(s - 4, 0, 4, s);
    ctx.fillStyle = '#d8b13c';
    for (let y = 0; y < s; y += 32) ctx.fillRect(s / 2 - 2, y, 4, 18);
  });
}

export function sidewalkTexture(): THREE.CanvasTexture {
  const rng = new RNG(43);
  return canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#a9a49a';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(60,60,60,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo((i * s) / 2, 0);
      ctx.lineTo((i * s) / 2, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (i * s) / 2);
      ctx.lineTo(s, (i * s) / 2);
      ctx.stroke();
    }
    for (let i = 0; i < 500; i++) {
      const g = 150 + rng.int(0, 30);
      ctx.fillStyle = `rgb(${g},${g - 4},${g - 10})`;
      ctx.fillRect(rng.range(0, s), rng.range(0, s), 2, 2);
    }
  });
}

export function facadeTexture(base: string, windowColor: string, seed: number, cols = 4, rows = 10): { map: THREE.CanvasTexture; emissive: THREE.CanvasTexture } {
  const rng = new RNG(seed);
  const draw = (lit: boolean) => (ctx: CanvasRenderingContext2D, s: number) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    const g = 60 + rng.int(0, 20);
    ctx.fillStyle = `rgba(${g},${g},${g + 4},0.25)`;
    for (let i = 0; i < 40; i++) ctx.fillRect(rng.range(0, s), rng.range(0, s), rng.range(4, 20), rng.range(2, 8));
    const cw = s / cols;
    const ch = s / rows;
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 0; cy < rows; cy++) {
        const wx = cx * cw + cw * 0.22;
        const wy = cy * ch + ch * 0.2;
        const ww = cw * 0.56;
        const wh = ch * 0.6;
        if (lit && rng.chance(0.42)) {
          const warm = rng.chance(0.7);
          ctx.fillStyle = warm ? '#ffd98a' : '#bfe3ff';
        } else {
          ctx.fillStyle = windowColor;
        }
        ctx.fillRect(wx, wy, ww, wh);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(wx, wy, ww, wh * 0.25);
      }
    }
  };
  return { map: canvasTex(256, draw(false)), emissive: canvasTex(256, draw(true)) };
}

export function grassTexture(): THREE.CanvasTexture {
  const rng = new RNG(44);
  return canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#477b48';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1400; i++) {
      const g = rng.int(60, 110);
      ctx.fillStyle = `rgb(${g * 0.55},${g},${g * 0.5})`;
      ctx.fillRect(rng.range(0, s), rng.range(0, s), 2, 3);
    }
  });
}

export function sandTexture(): THREE.CanvasTexture {
  const rng = new RNG(45);
  return canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#d8c39b';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const g = 190 + rng.int(0, 40);
      ctx.fillStyle = `rgb(${g},${g - 15},${g - 45})`;
      ctx.fillRect(rng.range(0, s), rng.range(0, s), 2, 2);
    }
  });
}

export function labelSprite(text: string, color = '#F4B544'): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgba(16,21,28,0.78)';
  const w = 30 + text.length * 13;
  ctx.beginPath();
  ctx.roundRect((512 - w) / 2, 18, w, 60, 12);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(16, 3, 1);
  sprite.renderOrder = 999;
  return sprite;
}

export function signTexture(text: string, bg: string, fg = '#F1F3F5', w = 512, h = 128): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = fg;
  ctx.font = `bold ${Math.floor(h * 0.42)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
