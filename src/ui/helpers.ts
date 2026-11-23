export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', parent?: HTMLElement | null, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

export function fmtMoney(n: number): string {
  return `${Math.round(n).toLocaleString('en-US')} $`;
}

export function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function show(node: HTMLElement): void {
  node.classList.remove('hidden');
}

export function hide(node: HTMLElement): void {
  node.classList.add('hidden');
}
