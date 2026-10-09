// Map geometry helpers for the atlas variant: views, atlas grid references and route curves.
import { CITIES, HUB, MAP, type City } from '../../dados';

export type Box = { x: number; y: number; w: number; h: number };
export type ViewId = 'sul' | 'rede' | 'estado';

const b = MAP.bounds;
/** Regions each view must show; the final viewBox grows to match the container aspect. */
export const VIEWS: Record<ViewId, { label: string; region: Box }> = {
  sul: { label: 'Sul de Minas', region: { x: 336, y: 272, w: 82, h: 60 } },
  rede: { label: 'Rede RJ Lima', region: { x: 324, y: 184, w: 98, h: 152 } },
  estado: { label: 'Todo o estado', region: { x: b.x - 8, y: b.y - 8, w: b.width + 16, h: b.height + 16 } },
};

/** Expands a region around its center so it fills a container with the given aspect (width / height). */
export function fit(r: Box, aspect: number): Box {
  let { w, h } = r;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** Smallest region that frames the hub and a destination, with breathing room. */
export function routeRegion(c: City, min = { w: 44, h: 34 }): Box {
  const x0 = Math.min(HUB.x, c.x);
  const x1 = Math.max(HUB.x, c.x);
  const y0 = Math.min(HUB.y, c.y);
  const y1 = Math.max(HUB.y, c.y);
  const w = Math.max(min.w, (x1 - x0) * 1.7);
  const h = Math.max(min.h, (y1 - y0) * 1.7);
  return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
}

export const inside = (c: { x: number; y: number }, v: Box, margin = 0.08) =>
  c.x > v.x + v.w * margin && c.x < v.x + v.w * (1 - margin) && c.y > v.y + v.h * margin && c.y < v.y + v.h * (1 - margin);

/** Atlas grid: squares of 20 map units, letters across and numbers down, like a printed road atlas page. */
export const GRID = { x0: 240, y0: 120, step: 20 };
export const LETTERS = 'ABCDEFGHIJKLMNOP';
export const colOf = (x: number) => Math.floor((x - GRID.x0) / GRID.step);
export const rowOf = (y: number) => Math.floor((y - GRID.y0) / GRID.step);
export const gridRef = (c: { x: number; y: number }) => `${LETTERS[colOf(c.x)] ?? ''}${rowOf(c.y) + 1}`;

/** A gentle curved route from the hub to a destination (quadratic Bézier bending to the left of travel). */
export function routePath(to: { x: number; y: number }, from: { x: number; y: number } = HUB): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const k = 0.2;
  const cx = (from.x + to.x) / 2 - dy * k;
  const cy = (from.y + to.y) / 2 + dx * k;
  return `M${from.x} ${from.y} Q${cx.toFixed(2)} ${cy.toFixed(2)} ${to.x} ${to.y}`;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
/** Finds the served city a free-text destination refers to ("Varginha", "varginha / mg", "Varginha - MG"). */
export function cityFromText(text: string): City | null {
  const t = norm(text.replace(/\s*[/,-]\s*mg\s*$/i, ''));
  if (!t) return null;
  return CITIES.find((c) => norm(c.city) === t) ?? null;
}

/** Nearest city in an arrow-key direction, for roving focus across the map dots. */
export function neighbor(from: City, dir: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight', pool: City[] = CITIES): City | null {
  let best: City | null = null;
  let score = Infinity;
  for (const c of pool) {
    if (c === from) continue;
    const dx = c.x - from.x;
    const dy = c.y - from.y;
    const along = dir === 'ArrowRight' ? dx : dir === 'ArrowLeft' ? -dx : dir === 'ArrowDown' ? dy : -dy;
    const across = dir === 'ArrowRight' || dir === 'ArrowLeft' ? Math.abs(dy) : Math.abs(dx);
    if (along <= 0.05) continue;
    const s = along + across * 2.2;
    if (s < score) { score = s; best = c; }
  }
  return best;
}

/** Region names (italic serif) and neighbouring states, placed from real latitude and longitude. */
export const REGIONS = [
  { name: 'Sul de Minas', x: 352, y: 325 },
  { name: 'Campo das Vertentes', x: 398, y: 296 },
  { name: 'Zona da Mata', x: 432, y: 280 },
  { name: 'Triângulo Mineiro', x: 296, y: 246 },
  { name: 'Norte de Minas', x: 400, y: 170 },
  { name: 'Oeste de Minas', x: 356, y: 262 },
];
export const STATES = [
  { name: 'São Paulo', x: 336, y: 336 },
  { name: 'Rio de Janeiro', x: 409, y: 331 },
  { name: 'Espírito Santo', x: 474, y: 272 },
  { name: 'Goiás', x: 290, y: 186 },
];
