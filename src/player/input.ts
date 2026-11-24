export type MouseButton = 'l' | 'r' | 'm';

export class Input {
  keys = new Set<string>();
  pressed = new Set<string>();
  mouseDX = 0;
  mouseDY = 0;
  buttons = new Set<MouseButton>();
  clicked = new Set<MouseButton>();
  wheelDelta = 0;
  enabled = true;
  pointerLocked = false;
  private canvas: HTMLElement | null = null;

  attach(canvas: HTMLElement): void {
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      const b = e.button === 0 ? 'l' : e.button === 2 ? 'r' : 'm';
      this.buttons.add(b);
      this.clicked.add(b);
    });
    window.addEventListener('mouseup', (e) => {
      const b = e.button === 0 ? 'l' : e.button === 2 ? 'r' : 'm';
      this.buttons.delete(b);
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (!this.enabled || !this.pointerLocked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    window.addEventListener('wheel', (e) => {
      this.wheelDelta += e.deltaY;
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
    });
  }

  lockPointer(): void {
    if (this.canvas && !this.pointerLocked) {
      this.canvas.requestPointerLock();
    }
  }

  unlockPointer(): void {
    if (this.pointerLocked) document.exitPointerLock();
  }

  down(code: string): boolean {
    return this.enabled && this.keys.has(code);
  }

  wasPressed(code: string): boolean {
    return this.enabled && this.pressed.has(code);
  }

  wasClicked(b: MouseButton): boolean {
    return this.enabled && this.clicked.has(b);
  }

  mouseDown(b: MouseButton): boolean {
    return this.enabled && this.buttons.has(b);
  }

  endFrame(): void {
    this.pressed.clear();
    this.clicked.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheelDelta = 0;
  }
}
