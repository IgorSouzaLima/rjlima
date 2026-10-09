'use client';
// Signature interaction: a small highway runs down the page from a start marker to the quote (the finish).
// The road is drawn in full as a pale "planned" road; the travelled stretch is revealed in colour through a mask
// driven by scroll, and a top-view RJ Lima truck rides along it. Geometry comes from the real section offsets;
// scroll only touches the mask offset, the stop states and the truck transform (no re-render).
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import s from './estilo.module.css';

type Geo = { w: number; h: number; d: string; stops: number[]; end: number };

// A smooth, continuous road: a gentle sine wave sampled every few pixels (no joints, so no kinks).
// It starts and ends straight on the lane centre so the start marker and the finish pin sit on the road.
function roadX(w: number, y: number, end: number) {
  const amp = w * 0.2;
  const ease = Math.min(1, y / 180, Math.max(0, (end - y) / 180));
  return w / 2 + amp * ease * Math.sin((y / 820) * Math.PI * 2);
}
function buildPath(w: number, end: number, h: number) {
  let d = `M${roadX(w, 0, end).toFixed(2)} 0`;
  for (let y = 6; y <= Math.min(h, end); y += 6) d += ` L${roadX(w, y, end).toFixed(2)} ${y}`;
  return d;
}

export function Rota({ hostRef, stopIds }: { hostRef: RefObject<HTMLDivElement | null>; stopIds: string[] }) {
  const laneRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<SVGPathElement>(null);
  const revealRef = useRef<SVGPathElement>(null);
  const truckRef = useRef<SVGGElement>(null);
  const markRefs = useRef<(SVGGElement | null)[]>([]);
  const [geo, setGeo] = useState<Geo | null>(null);
  const idsKey = stopIds.join(',');
  const maskId = `rota-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    const host = hostRef.current;
    const lane = laneRef.current;
    if (!host || !lane) return;
    const measure = () => {
      const top = host.getBoundingClientRect().top;
      const w = lane.clientWidth;
      const h = host.offsetHeight;
      const ids = idsKey.split(',');
      // Stops sit just inside each section; the finish sits just BEFORE the last section (the dark quote block),
      // so the pin lands on the light surface above it.
      const stops = ids.map((id, i) => {
        const el = document.getElementById(id);
        if (!el) return 0;
        const y = el.getBoundingClientRect().top - top;
        return Math.round(i === ids.length - 1 ? y - 48 : y + 36);
      });
      const end = stops[stops.length - 1];
      setGeo({ w, h, d: buildPath(w, end, h), stops, end });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [hostRef, idsKey]);

  useEffect(() => {
    const host = hostRef.current;
    const guide = guideRef.current;
    const reveal = revealRef.current;
    const truck = truckRef.current;
    if (!geo || !host || !guide || !reveal || !truck) return;
    const len = guide.getTotalLength();
    const park = geo.w > 40 ? 64 : 34;
    reveal.style.strokeDasharray = `${len} ${len}`;
    const paint = (p: number) => {
      reveal.style.strokeDashoffset = `${len * (1 - p)}`;
      // The truck parks just below the start marker and never rides up into the hero.
      const at = Math.min(len - park * 0.75, Math.max(park, len * p));
      const a = guide.getPointAtLength(at);
      const b = guide.getPointAtLength(Math.min(len, at + 2));
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI - 90;
      truck.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${angle})`);
      const reached = p * geo.end;
      markRefs.current.forEach((m, i) => { if (m) m.toggleAttribute('data-on', reached >= geo.stops[i] - 2); });
    };
    // Scroll-linked, not autonomous: the truck only moves as far as the visitor scrolls, so it stays on under reduced motion.
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = host.getBoundingClientRect().top;
      const travelled = window.innerHeight * 0.62 - top;
      paint(Math.min(1, Math.max(0, travelled / geo.end)));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [geo, hostRef]);

  if (!geo) return <div className={s.lane} ref={laneRef} aria-hidden="true" />;
  const wide = geo.w > 40;
  const road = wide ? 40 : 15; // asphalt width
  const edge = wide ? 2.5 : 1.2; // white edge line
  const truckScale = wide ? 1 : 0.5;
  const last = geo.stops.length - 1;

  return (
    <div className={s.lane} ref={laneRef} aria-hidden="true">
      <svg className={s.laneSvg} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} fill="none">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={-geo.w} y={-40} width={geo.w * 3} height={geo.h + 80}>
            <path d={geo.d} ref={revealRef} stroke="#fff" strokeWidth={road + 12} strokeLinecap="butt" />
          </mask>
        </defs>

        {/* The planned road, pale: the visitor sees the whole route before travelling it. */}
        <path d={geo.d} ref={guideRef} className={s.roadPlan} strokeWidth={road} />
        <path d={geo.d} className={s.roadPlanDash} strokeWidth={wide ? 2 : 1} strokeDasharray={wide ? '12 12' : '5 6'} />

        {/* The travelled stretch in full colour: shoulder, white edge lines, asphalt, yellow centre dashes. */}
        <g mask={`url(#${maskId})`}>
          <path d={geo.d} className={s.roadEdge} strokeWidth={road + edge * 2} />
          <path d={geo.d} className={s.roadAsphalt} strokeWidth={road - edge * 2} />
          <path d={geo.d} className={s.roadDash} strokeWidth={wide ? 2.5 : 1.2} strokeDasharray={wide ? '14 12' : '6 6'} />
        </g>

        {/* Start marker. */}
        <g className={s.roadStart} transform={`translate(${geo.w / 2} ${wide ? 20 : 10})`}>
          <circle r={wide ? 15 : 7} />
          <circle r={wide ? 6 : 3} className={s.roadStartCore} />
        </g>

        {/* Stops at each section; the last one is the finish (the quote). */}
        {geo.stops.map((y, i) => (
          <g key={i} ref={(el) => { markRefs.current[i] = el; }} className={i === last ? s.roadFinish : s.stop} transform={`translate(${roadX(geo.w, y, geo.end)} ${y})`}>
            {i === last ? (
              <g transform={`scale(${wide ? 1 : 0.5})`}>
                <path d="M0 6 C-12 -8 -14 -14 -14 -20 A14 14 0 1 1 14 -20 C14 -14 12 -8 0 6 Z" />
                <circle cx="0" cy="-20" r="5.5" className={s.roadFinishCore} />
              </g>
            ) : (
              <circle r={wide ? 10 : 6} />
            )}
          </g>
        ))}

        {/* The house truck seen from above: white box, black cab, riding the road. */}
        <g ref={truckRef} className={s.roadTruck}>
          <g transform={`scale(${truckScale})`}>
            <rect x="-8" y="-20" width="16" height="27" rx="2" className={s.truckBox} />
            <rect x="-8" y="8" width="16" height="11" rx="3" className={s.truckCab} />
            <rect x="-5.5" y="15" width="11" height="3" rx="1" className={s.truckGlass} />
            <rect x="-8" y="-9" width="16" height="3" className={s.truckStripe} />
          </g>
        </g>
      </svg>
    </div>
  );
}
