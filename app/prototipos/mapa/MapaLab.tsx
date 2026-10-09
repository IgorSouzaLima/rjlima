'use client';
// Lab page for the coverage map of the "Baú e faixa" variant: several treatments of the same data, driven by one shared
// search and selection so they can be compared side by side. Development only; never part of a design.
import { useMemo, useState } from 'react';
import { Archivo } from 'next/font/google';
import { Search } from 'lucide-react';
import { CITIES, HUB, MAP, POPULAR, searchCities, type City } from '../dados';
import s from './mapa.module.css';

const archivo = Archivo({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--bau-font', display: 'swap' });

const FULL = { x: MAP.bounds.x - 6, y: MAP.bounds.y - 6, w: MAP.bounds.width + 12, h: MAP.bounds.height + 12 };
const CROP = { x: 318, y: 243, w: 110, h: 96 };
type Box = typeof CROP;
type View = { vb: Box; k: number; query: string; matching: Set<string>; selected: City | null };

const others = (sel: City | null): sel is City => !!sel && sel.city !== HUB.city;
const flip = (vb: Box, c: City) => c.x > vb.x + vb.w * 0.7;
const NAMED = new Set(POPULAR.map((c) => c.city));

// The coverage file is an equirectangular projection; recover it from the cities so the atlas can draw
// meridians, parallels and a true scale bar.
function fit(get: (c: City) => [number, number]) {
  const pts = CITIES.map(get);
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p[0], 0) / n;
  const my = pts.reduce((a, p) => a + p[1], 0) / n;
  const a = pts.reduce((t, p) => t + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((t, p) => t + (p[0] - mx) ** 2, 0);
  return { a, b: my - a * mx };
}
const LON = fit((c) => [(c as City & { lon: number }).lon, c.x]);
const LAT = fit((c) => [(c as City & { lat: number }).lat, c.y]);
const lonX = (lon: number) => LON.a * lon + LON.b;
const latY = (lat: number) => LAT.a * lat + LAT.b;
const KM_PER_UNIT = 110.57 / Math.abs(LAT.a);

function Label({ v, c, text = c.city, size = 7, cls = s.label, dy = -5 }: { v: View; c: City; text?: string; size?: number; cls?: string; dy?: number }) {
  const f = flip(v.vb, c);
  return (
    <text x={c.x + (f ? -6 : 6) * v.k} y={c.y + dy * v.k} textAnchor={f ? 'end' : 'start'} fontSize={size * v.k} strokeWidth={2.6 * v.k}
      className={cls}>{text}</text>
  );
}

// ---------- 1. Current treatment, for reference ----------
function Atual({ v }: { v: View }) {
  return (
    <>
      <path d={MAP.path} className={s.stateLight} />
      {CITIES.map((c) => (
        <circle key={c.city} cx={c.x} cy={c.y} r={1.35 * v.k} className={v.query ? (v.matching.has(c.city) ? s.dotMatch : s.dotDim) : s.dot} />
      ))}
      {others(v.selected) && (
        <>
          <line x1={HUB.x} y1={HUB.y} x2={v.selected.x} y2={v.selected.y} className={s.routeCase} />
          <line x1={HUB.x} y1={HUB.y} x2={v.selected.x} y2={v.selected.y} className={s.routeYellow} />
          <circle cx={v.selected.x} cy={v.selected.y} r={3.4 * v.k} className={s.dotSelected} />
          <Label v={v} c={v.selected} />
        </>
      )}
      <circle cx={HUB.x} cy={HUB.y} r={3.8 * v.k} className={s.hub} />
      <text x={HUB.x + 6 * v.k} y={HUB.y + 12 * v.k} fontSize={7 * v.k} strokeWidth={2.4 * v.k} className={s.label}>Três Corações</text>
    </>
  );
}

// ---------- 2. Dot matrix ----------
// A staggered grid of dots clipped to Minas. Dots close to a city of the table are the served area (or carry its deadline).
type Cell = { x: number; y: number; served: boolean; days: number };
function useGrid(vb: Box, k: number) {
  return useMemo(() => {
    const step = 3.4 * k;
    const reach = (2.3 * step) ** 2;
    const cells: Cell[] = [];
    let row = 0;
    for (let y = vb.y + step / 2; y < vb.y + vb.h; y += step * 0.866, row++) {
      for (let x = vb.x + (row % 2 ? step : step / 2); x < vb.x + vb.w; x += step) {
        let best = Infinity;
        let days = 0;
        for (const c of CITIES) {
          const d = (c.x - x) ** 2 + (c.y - y) ** 2;
          if (d < best) { best = d; days = c.days; }
        }
        cells.push({ x, y, served: best < reach, days });
      }
    }
    return { cells, r: step * 0.34 };
  }, [vb, k]);
}
const DAY_FILL: Record<number, string> = { 2: '#cc3528', 3: '#121417', 4: '#8a6a1f', 5: '#c99a17', 6: '#c99a17' };

function Matriz({ v, byDays }: { v: View; byDays: boolean }) {
  const { cells, r } = useGrid(v.vb, v.k);
  return (
    <>
      <defs><clipPath id="mapa-matriz-clip"><path d={MAP.path} /></clipPath></defs>
      <g clipPath="url(#mapa-matriz-clip)">
        {cells.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={r} fill={c.served ? (byDays ? DAY_FILL[c.days] : '#121417') : '#d9dde2'} />
        ))}
      </g>
      <path d={MAP.path} className={s.matrixEdge} />
      {v.query && CITIES.filter((c) => v.matching.has(c.city)).map((c) => (
        <circle key={c.city} cx={c.x} cy={c.y} r={2.6 * v.k} className={s.matrixMatch} />
      ))}
      {others(v.selected) && (
        <>
          <line x1={HUB.x} y1={HUB.y} x2={v.selected.x} y2={v.selected.y} className={s.matrixRouteCase} />
          <line x1={HUB.x} y1={HUB.y} x2={v.selected.x} y2={v.selected.y} className={s.matrixRoute} />
          <circle cx={v.selected.x} cy={v.selected.y} r={3.6 * v.k} className={s.matrixSelected} />
          <Label v={v} c={v.selected} size={7.5} cls={s.labelPlate} dy={-7} />
        </>
      )}
      <circle cx={HUB.x} cy={HUB.y} r={4.2 * v.k} className={s.matrixHub} />
      <text x={HUB.x + 7 * v.k} y={HUB.y + 12 * v.k} fontSize={7 * v.k} strokeWidth={2.6 * v.k} className={s.labelPlate}>Três Corações</text>
    </>
  );
}

// ---------- 3. Road atlas plate ----------
function Atlas({ v }: { v: View }) {
  const lons = [-51, -50, -49, -48, -47, -46, -45, -44, -43, -42, -41, -40];
  const lats = [-14, -15, -16, -17, -18, -19, -20, -21, -22, -23];
  const neighbours: [string, number, number][] = [
    ['SÃO PAULO', -22.75, -46.9], ['RIO DE JANEIRO', -22.75, -43.9], ['GOIÁS', -16.5, -49.6], ['BAHIA', -14.6, -43.0], ['ESPÍRITO SANTO', -19.5, -40.6],
  ];
  // Scale bar: 50 km in the crop, 200 km for the whole state.
  const km = v.k < 0.6 ? 50 : 200;
  const bar = km / KM_PER_UNIT;
  const bx = v.vb.x + v.vb.w - bar - 8 * v.k;
  const by = v.vb.y + v.vb.h - 8 * v.k;
  return (
    <>
      <rect x={v.vb.x - 20} y={v.vb.y - 20} width={v.vb.w + 40} height={v.vb.h + 40} className={s.atlasSea} />
      <g className={s.atlasGrid}>
        {lons.map((l) => <line key={l} x1={lonX(l)} x2={lonX(l)} y1={FULL.y - 40} y2={FULL.y + FULL.h + 40} />)}
        {lats.map((l) => <line key={l} y1={latY(l)} y2={latY(l)} x1={FULL.x - 40} x2={FULL.x + FULL.w + 40} />)}
      </g>
      {neighbours.map(([n, lat, lon]) => (
        <text key={n} x={lonX(lon)} y={latY(lat)} fontSize={5.2 * v.k} letterSpacing={1.6 * v.k} textAnchor="middle" className={s.atlasNeighbour}>{n}</text>
      ))}
      <path d={MAP.path} className={s.atlasLand} />
      <path d={MAP.path} className={s.atlasBorder} />
      {CITIES.map((c) => (
        <circle key={c.city} cx={c.x} cy={c.y} r={(NAMED.has(c.city) ? 1.9 : 1.15) * v.k}
          className={v.query ? (v.matching.has(c.city) ? s.atlasTownOn : s.atlasTownOff) : NAMED.has(c.city) ? s.atlasTownBig : s.atlasTown} />
      ))}
      {others(v.selected) && (
        <>
          <line x1={HUB.x} y1={HUB.y} x2={v.selected.x} y2={v.selected.y} className={s.atlasRoadCase} />
          <line x1={HUB.x} y1={HUB.y} x2={v.selected.x} y2={v.selected.y} className={s.atlasRoad} />
          <circle cx={v.selected.x} cy={v.selected.y} r={2.6 * v.k} className={s.atlasTownSel} />
        </>
      )}
      {POPULAR.filter((c) => c.city !== HUB.city && c.city !== v.selected?.city).map((c) => (
        <Label key={c.city} v={v} c={c} text={c.city.toUpperCase()} size={4.8} cls={s.atlasName} dy={-3} />
      ))}
      {others(v.selected) && <Label v={v} c={v.selected} text={v.selected.city.toUpperCase()} size={6} cls={s.atlasNameSel} dy={-4} />}
      <circle cx={HUB.x} cy={HUB.y} r={4.4 * v.k} className={s.atlasHubRing} />
      <circle cx={HUB.x} cy={HUB.y} r={2.2 * v.k} className={s.atlasHub} />
      <text x={HUB.x + 7 * v.k} y={HUB.y + 10 * v.k} fontSize={6 * v.k} letterSpacing={0.6 * v.k} strokeWidth={2.4 * v.k} className={s.atlasNameSel}>TRÊS CORAÇÕES</text>
      <g className={s.atlasScale}>
        <rect x={bx} y={by - 1.4 * v.k} width={bar / 2} height={1.4 * v.k} className={s.atlasScaleDark} />
        <rect x={bx + bar / 2} y={by - 1.4 * v.k} width={bar / 2} height={1.4 * v.k} className={s.atlasScaleLight} />
        <text x={bx} y={by - 3 * v.k} fontSize={4.2 * v.k}>0</text>
        <text x={bx + bar} y={by - 3 * v.k} fontSize={4.2 * v.k} textAnchor="end">{km} km</text>
      </g>
      <g transform={`translate(${v.vb.x + 9 * v.k} ${v.vb.y + 12 * v.k}) scale(${v.k})`} className={s.atlasNorth}>
        <path d="M0 -7 L3 4 L0 2 L-3 4 Z" />
        <text y={-9} fontSize={5} textAnchor="middle">N</text>
      </g>
    </>
  );
}

// ---------- 4. Night routes ----------
// Arcs out of Três Corações on the cab black; the chosen one lights up.
const arc = (c: City) => {
  const mx = (HUB.x + c.x) / 2;
  const my = (HUB.y + c.y) / 2;
  const dx = c.x - HUB.x;
  const dy = c.y - HUB.y;
  return `M${HUB.x} ${HUB.y} Q${mx - dy * 0.22} ${my + dx * 0.22} ${c.x} ${c.y}`;
};
function Noturno({ v }: { v: View }) {
  return (
    <>
      <defs>
        <filter id="mapa-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={1.4 * v.k} />
        </filter>
        <radialGradient id="mapa-halo">
          <stop offset="0" stopColor="#f4c300" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f4c300" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={v.vb.x - 30} y={v.vb.y - 30} width={v.vb.w + 60} height={v.vb.h + 60} className={s.night} />
      <path d={MAP.path} className={s.stateNight} />
      <circle cx={HUB.x} cy={HUB.y} r={30 * v.k} fill="url(#mapa-halo)" />
      {CITIES.filter((c) => c.city !== HUB.city).map((c) => (
        <path key={c.city} d={arc(c)} className={v.query ? (v.matching.has(c.city) ? s.arcOn : s.arcOff) : s.arc} />
      ))}
      {CITIES.map((c) => <circle key={c.city} cx={c.x} cy={c.y} r={0.9 * v.k} className={s.dotNight} />)}
      {others(v.selected) && (
        <>
          <path d={arc(v.selected)} className={s.arcGlow} filter="url(#mapa-glow)" />
          <path d={arc(v.selected)} className={s.arcSel} />
          <circle cx={v.selected.x} cy={v.selected.y} r={2.4 * v.k} className={s.dotSelectedNight} />
          <Label v={v} c={v.selected} cls={s.labelNight} />
        </>
      )}
      <circle cx={HUB.x} cy={HUB.y} r={3.2 * v.k} className={s.hubNight} />
      <text x={HUB.x + 6 * v.k} y={HUB.y + 11 * v.k} fontSize={7 * v.k} strokeWidth={2.4 * v.k} className={s.labelNight}>Três Corações</text>
    </>
  );
}

const OPTIONS = [
  { id: 'atual', name: 'Atual', note: 'Como está hoje, só para referência.', frame: s.frame },
  { id: 'matriz', name: 'Matriz de pontos', note: 'Minas desenhada como uma grade de pontos; a mancha preta é a área atendida. Dá para colorir pelo prazo.', frame: s.frame },
  { id: 'atlas', name: 'Carta rodoviária', note: 'Prancha de atlas de estrada: meridianos, estados vizinhos, escala real e norte. As cidades de referência sempre com nome.', frame: `${s.frame} ${s.frameAtlas}` },
  { id: 'noturno', name: 'Rotas noturnas', note: 'Arcos acesos saindo de Três Corações sobre o preto da cabine; a rota escolhida brilha.', frame: `${s.frame} ${s.frameDark}` },
] as const;

export default function MapaLab() {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<City | null>(POPULAR.find((c) => c.city === 'Pouso Alegre') ?? null);
  const [whole, setWhole] = useState(false);
  const [byDays, setByDays] = useState(false);
  const q = query.trim();
  const results = useMemo(() => (q ? searchCities(q) : []), [q]);
  const matching = useMemo(() => new Set(results.map((c) => c.city)), [results]);
  const selected = picked && (!q || matching.has(picked.city)) ? picked : null;
  const vb = whole ? FULL : CROP;
  const v: View = { vb, k: vb.w / FULL.w, query: q, matching, selected };
  const chips = q ? results.slice(0, 6) : POPULAR;


  return (
    <div className={`${archivo.variable} ${s.root}`}>
      <header className={s.head}>
        <h1 className={s.title}>Opções do mapa de cidades</h1>
        <p className={s.lead}>
          Os mesmos dados em todas (168 cidades, prazos de referência, limites do IBGE). A busca e a cidade escolhida valem para
          todas as opções, para comparar lado a lado.
        </p>
        <div className={s.controls}>
          <label className={s.search}>
            <Search aria-hidden="true" size={18} />
            <span className={s.srOnly}>Buscar cidade</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cidade (ex.: pouso)" />
          </label>
          <div className={s.chips}>
            {chips.map((c) => (
              <button key={c.city} type="button" aria-pressed={selected?.city === c.city} onClick={() => setPicked(selected?.city === c.city ? null : c)}>
                {c.city}
              </button>
            ))}
            {q && results.length === 0 && <span className={s.none}>Nenhuma cidade encontrada.</span>}
          </div>
          <button type="button" className={s.toggle} aria-pressed={whole} onClick={() => setWhole(!whole)}>
            {whole ? 'Aproximar o sul de Minas' : 'Ver o estado inteiro'}
          </button>
        </div>
      </header>

      <div className={s.grid}>
        {OPTIONS.map((o, i) => (
          <figure key={o.id} className={`${s.card} ${o.id === 'atual' ? s.cardRef : ''}`}>
            <div className={o.frame}>
              <svg className={s.map} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} role="img" aria-label={`Opção ${i + 1}: ${o.name}`}>
                {o.id === 'atual' && <Atual v={v} />}
                {o.id === 'matriz' && <Matriz v={v} byDays={byDays} />}
                {o.id === 'atlas' && <Atlas v={v} />}
                {o.id === 'noturno' && <Noturno v={v} />}
              </svg>
            </div>
            <figcaption className={s.caption}>
              <span className={s.num}>{i + 1}</span>
              <span>
                <strong>{o.name}</strong> {o.note}
                {o.id === 'matriz' && (
                  <span className={s.legend}>
                    <button type="button" className={s.miniToggle} aria-pressed={byDays} onClick={() => setByDays(!byDays)}>
                      {byDays ? 'Mostrar só a área atendida' : 'Colorir pelo prazo'}
                    </button>
                    {byDays && [[2, '2 dias'], [3, '3 dias'], [4, '4 dias'], [5, '5 ou mais']].map(([d, t]) => (
                      <span key={d}><i className={s.key} style={{ background: DAY_FILL[d as number] }} /> {t}</span>
                    ))}
                  </span>
                )}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
