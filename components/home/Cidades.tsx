'use client';
// Coverage lookup: search the 168 cities, read the reference deadline, see it on the Minas map,
// and hand the city to the quote form as the destination.
import { useMemo, useState } from 'react';
import { ArrowRight, Download, MapPin, MessageCircle, Search } from 'lucide-react';
import { CITIES, CITIES_PDF, CITIES_URL, HUB, MAP, POPULAR, searchCities, whatsappText, type City } from '../../lib/site-data';
import s from './estilo.module.css';

// The table concentrates in the south of the state, so the map opens on that crop (one city lies north of it).
const FULL = { x: MAP.bounds.x - 6, y: MAP.bounds.y - 6, w: MAP.bounds.width + 12, h: MAP.bounds.height + 12 };
const CROP = { x: 318, y: 243, w: 110, h: 96 };
const inCrop = (c: City) => c.x >= CROP.x && c.x <= CROP.x + CROP.w && c.y >= CROP.y && c.y <= CROP.y + CROP.h;

const days = (n: number) => `${n} ${n === 1 ? 'dia útil' : 'dias úteis'}`;

export function Cidades({ onQuote }: { onQuote: (city: City) => void }) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<City | null>(null);
  const [whole, setWhole] = useState<boolean | null>(null);
  const results = useMemo(() => (query.trim() ? searchCities(query) : []), [query]);
  const matching = useMemo(() => new Set(results.map((c) => c.city)), [results]);
  const list = query.trim() ? results.slice(0, 6) : POPULAR;
  // A pick stays remembered, but only shows while the current search still includes it.
  const selected = picked && (!query.trim() || matching.has(picked.city)) ? picked : null;
  const showWhole = whole ?? (!!selected && !inCrop(selected));
  const vb = showWhole ? FULL : CROP;
  const k = vb.w / FULL.w;
  const flip = (c: City) => c.x > vb.x + vb.w * 0.7;

  return (
    <div className={s.cityGrid}>
      <div className={s.cityPanel}>
        <label htmlFor="bau-city" className={s.label}>Consulte sua cidade</label>
        <div className={s.searchBox}>
          <Search aria-hidden="true" size={20} className={s.searchIcon} />
          <input id="bau-city" type="search" className={s.input} placeholder="Digite o nome da cidade" autoComplete="off"
            value={query} onChange={(e) => setQuery(e.target.value)} aria-describedby="bau-city-status" />
        </div>
        <p id="bau-city-status" className={s.cityStatus} aria-live="polite">
          {!query.trim() && 'Exemplos no Sul de Minas. Digite para buscar entre as 168 cidades.'}
          {query.trim() && results.length > 0 && `${results.length} ${results.length === 1 ? 'cidade encontrada' : 'cidades encontradas'}${results.length > 6 ? ', mostrando as 6 primeiras' : ''}.`}
          {query.trim() && results.length === 0 && 'Nenhuma cidade encontrada com esse nome.'}
        </p>

        {list.length > 0 && (
          <ul className={s.cityList}>
            {list.map((c) => (
              <li key={c.city}>
                <button type="button" className={s.cityItem} aria-pressed={selected?.city === c.city} onClick={() => { setPicked(c); setWhole(null); }}>
                  <span className={s.cityName}>{c.city} <span className={s.cityUf}>/ {c.state}</span></span>
                  <span className={s.cityDays}>{days(c.days)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim() && results.length === 0 && (
          <p className={s.cityEmpty}>
            A tabela publicada não inclui essa cidade, mas a rota pode ser avaliada.{' '}
            <a className={s.inlineLink} href={whatsappText(`Olá! Gostaria de saber se a RJ Lima atende a cidade de ${query.trim()}.`)} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden="true" size={16} /> Consulte a equipe pelo WhatsApp
            </a>
          </p>
        )}

        {selected && (
          <div className={s.cityDetail} aria-live="polite">
            <p className={s.cityDetailName}>{selected.city} / {selected.state}</p>
            <p className={s.cityDetailDays}>
              Prazo de referência: <strong>{days(selected.days)}</strong>
            </p>
            <p className={s.note}>A equipe confirma prazo e coleta para cada rota.</p>
            <button type="button" className={`${s.btn} ${s.btnRed}`} onClick={() => onQuote(selected)}>
              Cotar para {selected.city} <ArrowRight aria-hidden="true" size={18} />
            </button>
          </div>
        )}

        <div className={s.cityLinks}>
          <a className={s.inlineLink} href={CITIES_URL}><MapPin aria-hidden="true" size={16} /> Ver todas as cidades atendidas</a>
          <a className={s.inlineLink} href={CITIES_PDF} download><Download aria-hidden="true" size={16} /> Baixar a tabela em PDF</a>
        </div>
      </div>

      <figure className={s.mapFigure}>
        <div className={s.mapFrame}>
        <svg className={s.map} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} role="img"
          aria-label={`Mapa de Minas Gerais com as ${CITIES.length} cidades atendidas e a base em Três Corações${selected ? `, destacando ${selected.city}` : ''}`}>
          <path d={MAP.path} className={s.mapState} />
          {CITIES.map((c) => (
            <circle key={c.city} cx={c.x} cy={c.y} r={1.35 * k}
              className={query.trim() ? (matching.has(c.city) ? s.dotMatch : s.dotDim) : s.dot} />
          ))}
          {selected && selected.city !== HUB.city && (
            <g key={selected.city}>
              <line x1={HUB.x} y1={HUB.y} x2={selected.x} y2={selected.y} className={s.mapRouteCase} />
              <line x1={HUB.x} y1={HUB.y} x2={selected.x} y2={selected.y} className={s.mapRoute} pathLength={1} />
              <circle cx={selected.x} cy={selected.y} r={3.4 * k} className={s.dotSelected} />
            </g>
          )}
          <circle cx={HUB.x} cy={HUB.y} r={3.8 * k} className={s.dotHub} />
          <text x={HUB.x + 6 * k} y={HUB.y + 12 * k} fontSize={7 * k} strokeWidth={2.4 * k} className={s.mapLabel}>Três Corações</text>
          {selected && selected.city !== HUB.city && (
            <text x={selected.x + (flip(selected) ? -6 : 6) * k} y={selected.y - 6 * k} textAnchor={flip(selected) ? 'end' : 'start'}
              fontSize={7 * k} strokeWidth={2.4 * k} className={s.mapLabel}>
              {selected.city}
            </text>
          )}
        </svg>
          <button type="button" className={s.mapToggle} onClick={() => setWhole(!showWhole)} aria-pressed={showWhole}>
            {showWhole ? 'Aproximar o sul de Minas' : 'Ver o estado inteiro'}
          </button>
        </div>
        <figcaption className={s.mapCaption}>
          <span className={s.legendHub} aria-hidden="true" /> Base em Três Corações
          <span className={s.legendDot} aria-hidden="true" /> Cidade da tabela
          {query.trim() && results.length > 0 && <><span className={s.legendMatch} aria-hidden="true" /> Resultado da busca</>}
          <span className={s.mapSource}>{showWhole ? 'Minas Gerais inteira.' : 'Recorte do sul de Minas, onde está a maior parte das cidades da tabela.'} {MAP.source}</span>
        </figcaption>
      </figure>
    </div>
  );
}
