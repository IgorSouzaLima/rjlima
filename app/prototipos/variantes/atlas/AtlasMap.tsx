'use client';
// Interactive SVG atlas page of Minas Gerais: IBGE outline, atlas grid with edge references, the 168 served cities,
// the Três Corações base and a red route that draws itself to the chosen destination.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CITIES, HUB, MAP, POPULAR, type City } from '../../dados';
import { fit, GRID, inside, LETTERS, neighbor, REGIONS, routePath, routeRegion, STATES, VIEWS, type Box, type ViewId } from './geo';
import s from './estilo.module.css';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

const LABEL_SIDE: Record<string, 'l' | 'r'> = { Varginha: 'l', 'Pouso Alegre': 'l', 'Poços de Caldas': 'l', Lavras: 'r' };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Props = {
  selected: City | null;
  onSelect: (c: City) => void;
  mode: 'hero' | 'mini';
  label: string;
  view?: ViewId;
  onView?: (v: ViewId) => void;
};

/** Map area buttons, rendered by the page next to the hero map. */
export function ViewSwitch({ view, onView }: { view: ViewId; onView: (v: ViewId) => void }) {
  return (
    <div className={s.viewSwitch} role="group" aria-label="Área do mapa">
      {(Object.keys(VIEWS) as ViewId[]).map((id) => (
        <button key={id} type="button" aria-pressed={view === id} onClick={() => onView(id)}>{VIEWS[id].label}</button>
      ))}
    </div>
  );
}

export default function AtlasMap({ selected, onSelect, mode, label, view: viewProp, onView }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dotRefs = useRef<Map<string, SVGGElement>>(new Map());
  const reduced = useReducedMotion();
  const [size, setSize] = useState({ w: 800, h: 680 });
  const [ownView, setOwnView] = useState<ViewId>('rede');
  const view = viewProp ?? ownView;
  const setView = onView ?? setOwnView;
  const [hovered, setHovered] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string>(selected?.city ?? HUB.city);

  // Measure the sheet so the viewBox always fills it and pixel sizes stay constant at every zoom.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 60 && height > 60) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Phones open on the Sul de Minas, where the base and most destinations are.
  useEffect(() => {
    if (mode === 'hero' && window.matchMedia('(max-width: 760px)').matches) setView('sul');
  }, [mode]);

  const aspect = size.w / size.h;
  const target = useMemo<Box>(() => {
    if (mode === 'mini') return fit(selected && selected !== HUB ? routeRegion(selected) : VIEWS.sul.region, aspect);
    return fit(VIEWS[view].region, aspect);
  }, [mode, selected, view, aspect]);

  // Keep the chosen destination on the page: widen the view when it falls outside.
  useEffect(() => {
    if (mode !== 'hero' || !selected) return;
    // Smallest view that frames both the base and the destination, so the route reads large.
    const order: ViewId[] = ['sul', 'rede', 'estado'];
    const best = order.find((id) => { const v = fit(VIEWS[id].region, aspect); return inside(selected, v, 0.1) && inside(HUB, v, 0.1); }) ?? 'estado';
    setView(best);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => { if (selected) setFocusId(selected.city); }, [selected]);

  // Tween the viewBox (spatial move, ease-in-out); reduced motion jumps straight to the target.
  const [vb, setVb] = useState<Box>(target);
  const vbRef = useRef(vb);
  const first = useRef(true);
  const key = `${target.x.toFixed(2)},${target.y.toFixed(2)},${target.w.toFixed(2)},${target.h.toFixed(2)}`;
  useEffect(() => {
    const from = vbRef.current;
    if (first.current || reduced) {
      first.current = false;
      vbRef.current = target;
      setVb(target);
      return;
    }
    const start = performance.now();
    const dur = 440;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const k = ease(t);
      const next = { x: from.x + (target.x - from.x) * k, y: from.y + (target.y - from.y) * k, w: from.w + (target.w - from.w) * k, h: from.h + (target.h - from.h) * k };
      vbRef.current = next;
      setVb(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduced]);

  /** Screen pixels to map units at the current zoom. */
  const u = (px: number) => (px * vb.w) / size.w;
  const mis = reduced ? 0 : u(1.2);
  const band = u(22);
  const showNames = vb.w < 200;

  const fitsText = (r: { name: string; x: number; y: number }, px: number) => {
    const half = u(r.name.length * px * 0.26);
    return r.x - half > vb.x + band && r.x + half < vb.x + vb.w - band && r.y - u(px) > vb.y + band && r.y < vb.y + vb.h - band;
  };
  const visible = CITIES.filter((c) => inside(c, vb, 0.03));
  const onKey = (c: City) => (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(c); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      const n = neighbor(c, e.key, visible.length ? visible : CITIES);
      if (n) { setFocusId(n.city); dotRefs.current.get(n.city)?.focus(); }
    }
  };

  const cols: number[] = [];
  for (let i = Math.floor((vb.x - GRID.x0) / GRID.step); GRID.x0 + i * GRID.step < vb.x + vb.w; i++) cols.push(i);
  const rows: number[] = [];
  for (let j = Math.floor((vb.y - GRID.y0) / GRID.step); GRID.y0 + j * GRID.step < vb.y + vb.h; j++) rows.push(j);

  const route = selected && selected !== HUB ? selected : null;
  const tagSide = (c: City, size = 12): 'l' | 'r' => {
    const side = LABEL_SIDE[c.city] ?? (c.x > vb.x + vb.w * 0.68 ? 'l' : 'r');
    const w = u(8 + c.city.length * size * 0.56);
    if (side === 'l' && c.x - w < vb.x + band) return 'r';
    if (side === 'r' && c.x + w > vb.x + vb.w - band) return 'l';
    return side;
  };
  const nameLabel = (c: City, cls: string, size: number, weight?: number) => {
    const side = tagSide(c, size);
    return (
      <text key={`${cls}-${c.city}`} className={cls} x={c.x + (side === 'r' ? u(8) : -u(8))} y={c.y + u(4)} textAnchor={side === 'r' ? 'start' : 'end'}
        fontSize={u(size)} fontWeight={weight} strokeWidth={u(3.4)} style={{ transformOrigin: side === 'r' ? 'left center' : 'right center' }}>{c.city}</text>
    );
  };

  return (
    <div className={`${s.mapWrap} ${mode === 'hero' ? s.mapHero : s.mapMini}`}>
      <svg ref={svgRef} className={s.mapSvg} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} role="group" aria-label={label} preserveAspectRatio="xMidYMid slice">
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#fff" />
        <g className={s.passGreen}>
          <path d={MAP.path} className={s.mgFill} />
          {vb.w < 330 && REGIONS.map((r) => fitsText(r, 15) && (
            <text key={r.name} x={r.x} y={r.y} className={s.region} fontSize={u(15)} textAnchor="middle" strokeWidth={u(3)}>{r.name}</text>
          ))}
          {STATES.map((st) => fitsText(st, 13) && (
            <text key={st.name} x={st.x} y={st.y} className={s.stateName} fontSize={u(13)} textAnchor="middle">{st.name}</text>
          ))}
        </g>
        <g className={s.gridLines} aria-hidden="true">
          {cols.map((i) => <line key={`c${i}`} x1={GRID.x0 + i * GRID.step} x2={GRID.x0 + i * GRID.step} y1={vb.y} y2={vb.y + vb.h} strokeWidth={u(1)} />)}
          {rows.map((j) => <line key={`r${j}`} y1={GRID.y0 + j * GRID.step} y2={GRID.y0 + j * GRID.step} x1={vb.x} x2={vb.x + vb.w} strokeWidth={u(1)} />)}
        </g>
        <g className={s.passBlack}>
          <path d={MAP.path} className={s.mgLine} strokeWidth={u(1.4)} />
        </g>

        {route && (
          <g key={route.city} className={s.route} aria-hidden="true">
            <path d={routePath(route)} className={s.routeCasing} strokeWidth={u(9)} pathLength={1} />
            <path d={routePath(route)} className={s.routeInk} strokeWidth={u(3)} pathLength={1} transform={`translate(${mis * 0.6} ${-mis * 0.6})`} />
          </g>
        )}

        <g className={s.passBlack}>
          {CITIES.map((c) => {
            const isHub = c === HUB;
            const isSel = selected?.city === c.city;
            if (isHub) return null;
            return (
              <g key={c.city} ref={(el) => { if (el) dotRefs.current.set(c.city, el); else dotRefs.current.delete(c.city); }}
                role="button" tabIndex={focusId === c.city ? 0 : -1} className={s.dot} data-sel={isSel || undefined}
                aria-label={`${c.city}, ${c.days} dias úteis, prazo de referência`} aria-pressed={isSel}
                onClick={() => onSelect(c)} onKeyDown={onKey(c)} onFocus={() => { setFocusId(c.city); setHovered(c.city); }} onBlur={() => setHovered(null)}
                onMouseEnter={() => setHovered(c.city)} onMouseLeave={() => setHovered(null)}>
                <circle cx={c.x} cy={c.y} r={u(9)} className={s.dotHit} />
                <circle cx={c.x + mis} cy={c.y - mis} r={u(isSel ? 5 : 3.3)} className={s.dotGhost} />
                <circle cx={c.x} cy={c.y} r={u(isSel ? 5 : 3.3)} className={s.dotCore} strokeWidth={u(1.1)} />
                <circle cx={c.x} cy={c.y} r={u(9)} className={s.dotRing} strokeWidth={u(2)} />
              </g>
            );
          })}
        </g>

        <g ref={(el) => { if (el) dotRefs.current.set(HUB.city, el); }} role="button" tabIndex={focusId === HUB.city ? 0 : -1}
          className={`${s.dot} ${s.hub}`} aria-label={`${HUB.city}, base da RJ Lima`} onClick={() => onSelect(HUB)} onKeyDown={onKey(HUB)}
          onFocus={() => setFocusId(HUB.city)} onMouseEnter={() => setHovered(HUB.city)} onMouseLeave={() => setHovered(null)}>
          <circle cx={HUB.x} cy={HUB.y} r={u(12)} className={s.dotHit} />
          <circle cx={HUB.x + mis} cy={HUB.y - mis} r={u(8)} className={s.hubGhost} strokeWidth={u(2.6)} />
          <circle cx={HUB.x} cy={HUB.y} r={u(8)} className={s.hubRing} strokeWidth={u(2.6)} />
          <circle cx={HUB.x} cy={HUB.y} r={u(3.6)} className={s.hubCore} />
          <circle cx={HUB.x} cy={HUB.y} r={u(13)} className={s.dotRing} strokeWidth={u(2)} />
        </g>

        <g className={s.labels} aria-hidden="true">
          {showNames && POPULAR.filter((c) => c !== HUB && c.city !== selected?.city && c.city !== hovered).map((c) => nameLabel(c, s.cityName, 12, 500))}
          <text x={HUB.x + u(13)} y={HUB.y + u(15)} className={s.hubName} fontSize={u(14)} strokeWidth={u(3.6)}>{HUB.city}</text>
          <text x={HUB.x + u(13)} y={HUB.y + u(30)} className={s.hubSub} fontSize={u(13)} strokeWidth={u(3.4)}>base RJ Lima</text>
          {hovered && hovered !== HUB.city && hovered !== selected?.city && (() => { const c = CITIES.find((x) => x.city === hovered)!; return nameLabel(c, s.cityHover, 12.5, 600); })()}
          {route && nameLabel(route, `${s.cityName} ${s.cityPicked}`, 15, 700)}
        </g>

        <g className={s.frame} aria-hidden="true">
          <rect x={vb.x} y={vb.y} width={vb.w} height={band} />
          <rect x={vb.x} y={vb.y + vb.h - band} width={vb.w} height={band} />
          <rect x={vb.x} y={vb.y} width={band} height={vb.h} />
          <rect x={vb.x + vb.w - band} y={vb.y} width={band} height={vb.h} />
          <rect x={vb.x + band} y={vb.y + band} width={Math.max(0, vb.w - band * 2)} height={Math.max(0, vb.h - band * 2)} className={s.neatline} strokeWidth={u(1.2)} />
          {cols.map((i) => {
            const cx = GRID.x0 + i * GRID.step + GRID.step / 2;
            if (cx < vb.x + band * 1.5 || cx > vb.x + vb.w - band * 1.5 || !LETTERS[i]) return null;
            return <g key={`L${i}`}><text x={cx} y={vb.y + band * 0.7} fontSize={u(11)} textAnchor="middle">{LETTERS[i]}</text><text x={cx} y={vb.y + vb.h - band * 0.3} fontSize={u(11)} textAnchor="middle">{LETTERS[i]}</text></g>;
          })}
          {rows.map((j) => {
            const cy = GRID.y0 + j * GRID.step + GRID.step / 2;
            if (cy < vb.y + band * 1.5 || cy > vb.y + vb.h - band * 1.5 || j < 0) return null;
            return <g key={`N${j}`}><text x={vb.x + band / 2} y={cy + u(4)} fontSize={u(11)} textAnchor="middle">{j + 1}</text><text x={vb.x + vb.w - band / 2} y={cy + u(4)} fontSize={u(11)} textAnchor="middle">{j + 1}</text></g>;
          })}
          {cols.map((i) => { const x = GRID.x0 + i * GRID.step; return x > vb.x + band && x < vb.x + vb.w - band ? <g key={`t${i}`} className={s.tick}><line x1={x} x2={x} y1={vb.y + band * 0.55} y2={vb.y + band} strokeWidth={u(1)} /><line x1={x} x2={x} y1={vb.y + vb.h - band} y2={vb.y + vb.h - band * 0.55} strokeWidth={u(1)} /></g> : null; })}
          {rows.map((j) => { const y = GRID.y0 + j * GRID.step; return y > vb.y + band && y < vb.y + vb.h - band ? <g key={`u${j}`} className={s.tick}><line y1={y} y2={y} x1={vb.x + band * 0.55} x2={vb.x + band} strokeWidth={u(1)} /><line y1={y} y2={y} x1={vb.x + vb.w - band} x2={vb.x + vb.w - band * 0.55} strokeWidth={u(1)} /></g> : null; })}
        </g>
      </svg>

    </div>
  );
}
