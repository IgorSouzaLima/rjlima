'use client';
// Split-flap departures board: shows real destinations from Três Corações with their reference deadline.
// Each character is a flap cell that flips letter by letter towards its target; reduced motion swaps instantly.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowRight, FileDown, List, Search } from 'lucide-react';
import { CITIES, CITIES_PDF, CITIES_URL, POPULAR, searchCities, type City } from '../../dados';
import s from './estilo.module.css';

const ALPHA = ' ABCDEFGHIJKLMNOPQRSTUVWXYZÁÂÃÇÉÊÍÓÔÕÚ0123456789';
const FLIP_MS = 85;

function subscribeMedia(query: string) {
  return (cb: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  };
}
export function useMedia(query: string, serverValue: boolean) {
  const sub = useMemo(() => subscribeMedia(query), [query]);
  return useSyncExternalStore(sub, () => window.matchMedia(query).matches, () => serverValue);
}
export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)', false);

/** One flap cell. Flips through the two characters before the target, like a Solari drum. */
function Cell({ ch, delay, reduced }: { ch: string; delay: number; reduced: boolean }) {
  const [st, setSt] = useState({ prev: ch, cur: ch, id: 0 });
  const curRef = useRef(ch);

  useEffect(() => {
    if (reduced || curRef.current === ch) return;
    const i = ALPHA.indexOf(ch);
    const steps: string[] = [];
    if (i > 1) steps.push(ALPHA[i - 2], ALPHA[i - 1]);
    else if (i === 1) steps.push(ALPHA[0]);
    steps.push(ch);
    const seq = steps.filter((c, k) => k === steps.length - 1 || c !== curRef.current);
    const timers = seq.map((c, k) =>
      window.setTimeout(() => {
        curRef.current = c;
        setSt((p) => ({ prev: p.cur, cur: c, id: p.id + 1 }));
      }, delay + k * FLIP_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [ch, delay, reduced]);

  if (reduced) {
    if (curRef.current !== ch) curRef.current = ch;
    return (
      <span className={`${s.cell} ${ch.trim() ? '' : s.blank}`}>
        <span className={`${s.half} ${s.top}`}><span className={s.glyph}>{ch}</span></span>
        <span className={`${s.half} ${s.bottom}`}><span className={s.glyph}>{ch}</span></span>
      </span>
    );
  }
  return (
    <span className={`${s.cell} ${ch.trim() ? '' : s.blank}`}>
      <span className={`${s.half} ${s.top}`}><span className={s.glyph}>{st.cur}</span></span>
      <span className={`${s.half} ${s.bottom}`}><span className={s.glyph}>{st.id ? st.prev : st.cur}</span></span>
      {st.id > 0 && (
        <>
          <span key={`t${st.id}`} className={`${s.half} ${s.top} ${s.flapTop}`}><span className={s.glyph}>{st.prev}</span></span>
          <span key={`b${st.id}`} className={`${s.half} ${s.bottom} ${s.flapBottom}`}><span className={s.glyph}>{st.cur}</span></span>
        </>
      )}
    </span>
  );
}

/** A fixed-width run of flap cells. */
function Flaps({ text, width, delay, reduced }: { text: string; width: number; delay: number; reduced: boolean }) {
  const chars = text.toLocaleUpperCase('pt-BR').padEnd(width, ' ').slice(0, width).split('');
  return (
    <span className={s.flaps} aria-hidden="true">
      {chars.map((c, i) => <Cell key={i} ch={c} delay={delay + i * 16} reduced={reduced} />)}
    </span>
  );
}

function wrapWords(text: string, width: number, lines: number) {
  const out: string[] = [];
  let cur = '';
  for (const word of text.split(' ')) {
    if (!cur) cur = word;
    else if ((cur + ' ' + word).length <= width) cur += ' ' + word;
    else { out.push(cur); cur = word; }
  }
  out.push(cur);
  while (out.length < lines) out.push('');
  return out.slice(0, lines);
}

const pick = (names: string[]) => names.map((n) => CITIES.find((c) => c.city === n)).filter(Boolean) as City[];
const INTRO_PAGES = [
  pick(['Itajubá', 'Alfenas', 'São Lourenço', 'Campanha', 'Cambuí']),
  pick(['Santa Rita do Sapucaí', 'Boa Esperança', 'Caxambu', 'Extrema', 'Três Pontas']),
  POPULAR,
];

type Row = { city: string; uf: string; days: string; data?: City };
const toRow = (c: City): Row => ({ city: c.city, uf: c.state, days: String(c.days), data: c });
const BLANK: Row = { city: '', uf: '', days: '' };

export function Board({ onPick }: { onPick: (c: City) => void }) {
  const reduced = useReducedMotion();
  const wide = useMedia('(min-width: 760px)', true);
  const rowsCount = wide ? 5 : 4;
  const [query, setQuery] = useState('');
  const [boardQuery, setBoardQuery] = useState('');
  const [page, setPage] = useState<City[]>(POPULAR);

  // Authored moment: on load the board runs once through two sets of real destinations and settles on the popular ones.
  useEffect(() => {
    if (reduced) return;
    const timers = INTRO_PAGES.map((p, i) => window.setTimeout(() => setPage(p), 700 + i * 1900));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  // Debounce what the board shows so fast typing does not thrash every flap.
  useEffect(() => {
    const t = window.setTimeout(() => setBoardQuery(query), reduced ? 0 : 140);
    return () => clearTimeout(t);
  }, [query, reduced]);

  const matches = useMemo(() => (query.trim() ? searchCities(query) : []), [query]);
  const boardMatches = useMemo(() => (boardQuery.trim() ? searchCities(boardQuery) : null), [boardQuery]);

  let rows: Row[];
  if (boardMatches === null) rows = page.map(toRow);
  else if (boardMatches.length === 0) rows = [{ city: 'Nenhuma cidade', uf: '', days: '' }];
  else rows = boardMatches.slice(0, rowsCount).map(toRow);
  rows = [...rows, ...Array(Math.max(0, rowsCount - rows.length)).fill(BLANK)].slice(0, rowsCount);

  const searching = query.trim().length > 0;
  const status = !searching
    ? 'Destinos mais consultados. Digite para buscar entre as 168 cidades atendidas.'
    : matches.length === 0
      ? `Nenhuma cidade encontrada para “${query.trim()}”. Para rotas fora da tabela, solicite uma cotação: a equipe avalia o atendimento.`
      : matches.length > rowsCount
        ? `${matches.length} cidades encontradas. O painel mostra as ${rowsCount} primeiras; refine a busca ou veja a lista completa.`
        : `${matches.length} ${matches.length === 1 ? 'cidade encontrada' : 'cidades encontradas'}.`;

  return (
    <div className={s.board} id="cidades">
      <div className={s.boardHead}>
        <div className={s.boardTitle}>
          <h2 className={s.boardH2}>Destinos a partir de Três Corações</h2>
          <p className={s.boardSub}>Toque em uma cidade para levá-la à cotação.</p>
        </div>
        <div className={s.searchWrap}>
          <label htmlFor="pp-busca" className={s.searchLabel}>Consulte sua cidade</label>
          <div className={s.searchBox}>
            <Search size={18} aria-hidden="true" className={s.searchIcon} />
            <input
              id="pp-busca"
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Digite o nome da cidade"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-describedby="pp-busca-status"
              className={s.searchInput}
            />
          </div>
        </div>
      </div>

      <div className={s.colHeads} aria-hidden="true">
        <span className={s.colDest}>Destino</span>
        {wide && <span className={s.colUf}>UF</span>}
        <span className={s.colDays}>Prazo de referência</span>
        {wide && <span className={s.colAct} />}
      </div>

      <ul className={s.rows} aria-label="Painel de destinos">
        {rows.map((r, i) => {
          const delay = i * 70;
          const days = (
            <span className={s.daysCells}>
              <Flaps text={r.days} width={1} delay={delay + (wide ? 480 : 300)} reduced={reduced} />
              <span className={s.daysUnit} aria-hidden="true">{r.days ? 'dias úteis' : ''}</span>
            </span>
          );
          const lines = wrapWords(r.city.toLocaleUpperCase('pt-BR'), 16, 2);
          const cells = wide ? (
            <>
              <span className={s.destCells}><Flaps text={r.city} width={27} delay={delay} reduced={reduced} /></span>
              <span className={s.ufCells}><Flaps text={r.uf} width={2} delay={delay + 440} reduced={reduced} /></span>
              {days}
              {(
                <span className={s.rowAction} aria-hidden="true">
                  {r.data ? <>Cotar <ArrowRight size={16} /></> : ''}
                </span>
              )}
            </>
          ) : (
            <span className={s.destCells}>
              <Flaps text={lines[0]} width={16} delay={delay} reduced={reduced} />
              <span className={s.line2}>
                <Flaps text={lines[1]} width={11} delay={delay + 120} reduced={reduced} />
                {days}
              </span>
            </span>
          );
          return (
            <li key={i} className={s.rowItem}>
              {r.data ? (
                <button
                  type="button"
                  className={s.row}
                  onClick={() => onPick(r.data!)}
                  aria-label={`${r.city}, ${r.uf}. Prazo de referência: ${r.days} dias úteis. Usar como destino na cotação.`}
                >
                  {cells}
                </button>
              ) : (
                <div className={`${s.row} ${s.rowStatic}`} aria-hidden={r.city ? undefined : true}>
                  {r.city && <span className={s.srOnly}>{r.city}</span>}
                  {cells}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={s.boardFoot}>
        <p id="pp-busca-status" className={s.boardStatus} role="status" aria-live="polite">{status}</p>
        <p className={s.boardNote}>
          Prazos em dias úteis, conforme a tabela de abrangência. A equipe confirma prazo e coleta para cada rota.
        </p>
        <div className={s.boardLinks}>
          {searching && matches.length === 0 && <a href="#cotacao" className={s.boardLink}><ArrowRight size={18} aria-hidden="true" /> Solicitar cotação para outra cidade</a>}
          <a href={CITIES_URL} className={s.boardLink}><List size={18} aria-hidden="true" /> Ver as 168 cidades</a>
          <a href={CITIES_PDF} className={s.boardLink} download><FileDown size={18} aria-hidden="true" /> Baixar tabela em PDF</a>
        </div>
      </div>
    </div>
  );
}
