'use client';
// Variant 4, "Atlas rodoviário": the RJ Lima network printed as a road atlas page in spot inks on white paper.
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Alegreya, Public_Sans } from 'next/font/google';
import { ArrowRight, Download, AtSign, ExternalLink, Mail, MapPin, Menu, MessageCircle, Pause, Phone, Play, Plus, Search, X } from 'lucide-react';
import {
  CITIES, CITIES_PDF, CITIES_URL, EMAIL, FAQS, HUB, INSTAGRAM, LOGO, LOGO_SIZE, MAP, MEDIA, PHONE, PHONE_HREF, POPULAR, SEGMENTS, SERVICES,
  WHATSAPP, formatKey, onlyDigits, searchCities, trackingHref, useQuote, whatsappText, type City,
} from '../../dados';
import AtlasMap, { useReducedMotion, ViewSwitch } from './AtlasMap';
import Cotacao from './Cotacao';
import { gridRef, type ViewId } from './geo';
import s from './estilo.module.css';

const sans = Public_Sans({ subsets: ['latin'], variable: '--atlas-sans', display: 'swap' });
const serif = Alegreya({ subsets: ['latin'], style: ['italic'], weight: ['400', '500'], variable: '--atlas-serif', display: 'swap' });

const NAV = [
  { href: '#servicos', label: 'Serviços' },
  { href: '#cidades', label: 'Cidades' },
  { href: '#rastreio', label: 'Rastreio' },
  { href: '#notas', label: 'Dúvidas' },
];

function scrollToId(id: string, reduced: boolean) {
  document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

/* ---------- Header ---------- */
function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className={s.header}>
      <div className={s.headerRow}>
        <a href="#mapa" className={s.brand} aria-label="RJ Lima Transportes, início">
          <img src={LOGO} width={LOGO_SIZE.width} height={LOGO_SIZE.height} alt="RJ Lima Transportes" />
        </a>
        <nav className={s.nav} aria-label="Seções">
          {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
        </nav>
        <a className={s.headerPhone} href={PHONE_HREF}><Phone size={16} aria-hidden="true" />{PHONE}</a>
        <a className={`${s.btn} ${s.btnRed} ${s.headerCta}`} href="#cotacao">Solicitar cotação</a>
        <button type="button" className={s.menuBtn} aria-expanded={open} aria-controls="atlas-menu" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <div id="atlas-menu" className={s.menuPanel} hidden={!open}>
        {NAV.map((n) => <a key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</a>)}
        <a href={PHONE_HREF} onClick={() => setOpen(false)}><Phone size={18} aria-hidden="true" />{PHONE}</a>
      </div>
    </header>
  );
}

/* ---------- Hero: route picker ---------- */
const fold = (v: string) => v.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
/** Names that start with the query come first, then the rest alphabetically. */
const rank = (list: City[], q: string) => { const f = fold(q); return [...list].sort((a, b) => Number(!fold(a.city).startsWith(f)) - Number(!fold(b.city).startsWith(f)) || a.city.localeCompare(b.city, 'pt-BR')); };
function RoutePicker({ query, setQuery, onPick }: { query: string; setQuery: (v: string) => void; onPick: (c: City) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const options = useMemo(() => (query.trim() ? rank(searchCities(query), query).slice(0, 7) : POPULAR.filter((c) => c !== HUB)), [query]);
  const choose = (c: City) => { setQuery(c.city); setOpen(false); setActive(-1); onPick(c); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const c = options[active] ?? (options.length === 1 || options[0]?.city.toLowerCase() === query.trim().toLowerCase() ? options[0] : undefined);
      if (c) choose(c);
    } else if (e.key === 'Escape') { setOpen(false); setActive(-1); }
  };
  const empty = query.trim() && options.length === 0;
  return (
    <div className={s.picker}>
      <div className={s.pickerFrom}><span className={s.hubMark} aria-hidden="true" />De <strong>{HUB.city}</strong> para</div>
      <div className={s.pickerField}>
        <label htmlFor="rota-destino" className={s.srOnly}>Cidade de destino</label>
        <Search size={20} aria-hidden="true" />
        <input id="rota-destino" role="combobox" aria-autocomplete="list" aria-expanded={open && options.length > 0} aria-controls={listId}
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined} autoComplete="off" placeholder="digite a cidade de destino"
          value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)} onKeyDown={onKey} />
        {query && <button type="button" className={s.clearBtn} aria-label="Limpar destino" onClick={() => { setQuery(''); document.getElementById('rota-destino')?.focus(); }}><X size={18} /></button>}
        <ul id={listId} role="listbox" aria-label={query.trim() ? 'Cidades encontradas' : 'Destinos frequentes'} className={s.options} hidden={!open || options.length === 0}>
          {options.map((c, i) => (
            <li key={c.city} id={`${listId}-${i}`} role="option" aria-selected={i === active} data-active={i === active || undefined}
              onMouseDown={(e) => { e.preventDefault(); choose(c); }}>
              <span>{c.city}</span><small>{c.days} dias úteis</small>
            </li>
          ))}
        </ul>
      </div>
      {empty && <p className={s.pickerEmpty} role="status">Nenhuma cidade da tabela com esse nome. <a href={whatsappText(`Olá! A RJ Lima atende ${query.trim()}?`)} target="_blank" rel="noreferrer">Consulte a equipe pelo WhatsApp</a>.</p>}
    </div>
  );
}

/* ---------- Hero: photo plate with the cover video ---------- */
// The cover video is slow ambient footage with a pause button, so it plays even under reduced motion (same rule as the FeedTempo site); every other animation still honours the setting.
function VideoPlate() {
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const on = () => setMobile(mq.matches);
    on();
    setMounted(true);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const media = mobile ? MEDIA.videoSerraVertical : MEDIA.videoSerra;
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { void v.play(); setPaused(false); } else { v.pause(); setPaused(true); }
  };
  return (
    <figure className={s.plate}>
      <div className={s.plateMedia}>
        {!mounted ? (
          <img src={media.poster} alt={media.alt} />
        ) : (
          <video key={media.mp4} ref={(el) => { ref.current = el; if (el) { el.muted = true; if (!paused) void el.play().catch(() => setPaused(true)); } }}
            autoPlay muted loop playsInline preload="metadata" poster={media.poster} aria-label={media.alt}>
            <source src={media.webm} type="video/webm" />
            <source src={media.mp4} type="video/mp4" />
          </video>
        )}
        {mounted && (
          <button type="button" className={s.playBtn} onClick={toggle} aria-label={paused ? 'Reproduzir vídeo' : 'Pausar vídeo'}>
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        )}
      </div>
      <figcaption>Estrada entre cafezais do Sul de Minas. Vídeo ilustrativo.</figcaption>
    </figure>
  );
}

/* ---------- Services as a map legend ---------- */
function ServiceSymbol({ id }: { id: string }) {
  const common = { width: 72, height: 28, viewBox: '0 0 72 28', 'aria-hidden': true as const, className: s.symbol };
  if (id === 'fracionado') return (
    <svg {...common}><path d="M4 14h64" className={s.symRed} /><rect x="14" y="9.5" width="9" height="9" className={s.symBox} /><rect x="32" y="9.5" width="9" height="9" className={s.symBox} /><rect x="50" y="9.5" width="9" height="9" className={s.symBox} /></svg>
  );
  if (id === 'dedicado') return (
    <svg {...common}><path d="M8 14h56" className={s.symCasing} /><path d="M8 14h56" className={s.symRedThick} /><circle cx="8" cy="14" r="5" className={s.symHub} /><circle cx="64" cy="14" r="4" className={s.symDot} /></svg>
  );
  if (id === 'coletas') return (
    <svg {...common}><path d="M4 14h64" className={s.symDash} />{[10, 26, 42, 58].map((x) => <circle key={x} cx={x} cy="14" r="4" className={s.symRing} />)}</svg>
  );
  return (
    <svg {...common}><path d="M4 6c18 0 22 8 34 8" className={s.symInk} /><path d="M4 22c18 0 22-8 34-8h30" className={s.symRed} /><circle cx="38" cy="14" r="4.5" className={s.symHub} /></svg>
  );
}

function Servicos({ onQuote }: { onQuote: (service: string) => void }) {
  const main = SERVICES.slice(0, 2);
  const minor = SERVICES.slice(2);
  return (
    <section id="servicos" className={s.services} aria-labelledby="servicos-t">
      <div className={s.sectionHead}>
        <h2 id="servicos-t" className={s.h2}>Como a sua carga viaja</h2>
        <p className={s.lede}>Quatro serviços, lidos como a legenda de um mapa. Cada linha diz para que carga o serviço serve e como ele funciona na estrada.</p>
      </div>
      <div className={s.legendKey}>
        <p className={s.legendTitle}>Legenda</p>
        {main.map((sv) => (
          <article key={sv.id} className={s.keyRow}>
            <ServiceSymbol id={sv.id} />
            <div className={s.keyName}>
              <h3 className={s.h3}>{sv.title}</h3>
              <p className={s.keyShort}>{sv.short}</p>
            </div>
            <div className={s.keyBody}>
              <p>{sv.detail}</p>
              <ul className={s.tags}>{sv.tags.map((t) => <li key={t}>{t}</li>)}</ul>
              <button type="button" className={s.keyLink} onClick={() => onQuote(sv.title)}>Cotar {sv.title.toLowerCase()}<ArrowRight size={16} aria-hidden="true" /></button>
            </div>
          </article>
        ))}
        <div className={s.keyMinor}>
          {minor.map((sv) => (
            <article key={sv.id} className={s.keyCell}>
              <ServiceSymbol id={sv.id} />
              <h3 className={s.h4}>{sv.title}</h3>
              <p className={s.keyShort}>{sv.short}</p>
              <p>{sv.detail}</p>
              <button type="button" className={s.keyLink} onClick={() => onQuote(sv.title)}>{sv.id === 'parceria' ? 'Propor uma parceria' : 'Programar coletas'}<ArrowRight size={16} aria-hidden="true" /></button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Captioned plates ---------- */
function Pranchas() {
  const plates = [
    { m: MEDIA.cafezal, cap: 'Estrada de terra no meio do cafezal.' },
    { m: MEDIA.cidade, cap: 'Entrega em rua de pedra de cidade histórica de Minas.' },
    { m: MEDIA.doca, cap: 'Coleta na doca de um distribuidor.' },
  ];
  return (
    <section className={s.plates} aria-label="Pranchas ilustrativas">
      {plates.map((p, i) => (
        <figure key={p.m.src} className={`${s.platePrint} ${i === 0 ? s.plateBig : ''}`}>
          <img src={p.m.src} width={p.m.w} height={p.m.h} alt={p.m.alt} loading="lazy" decoding="async" />
          <figcaption><span>Prancha {i + 2}.</span> {p.cap} Imagem ilustrativa.</figcaption>
        </figure>
      ))}
    </section>
  );
}

/* ---------- Gazetteer (city index) ---------- */
const DAYS = [...new Set(CITIES.map((c) => c.days))].sort((a, b) => a - b);
function Indice({ onShow }: { onShow: (c: City) => void }) {
  const [q, setQ] = useState('');
  const [days, setDays] = useState(0);
  const [all, setAll] = useState(false);
  const list = useMemo(() => searchCities(q).filter((c) => !days || c.days === days).sort((a, b) => a.city.localeCompare(b.city, 'pt-BR')), [q, days]);
  const shown = all ? list : list.slice(0, 24);
  const groups = useMemo(() => {
    const g = new Map<string, City[]>();
    for (const c of shown) {
      const k = c.city.normalize('NFD')[0].toUpperCase();
      g.set(k, [...(g.get(k) ?? []), c]);
    }
    return [...g.entries()];
  }, [shown]);
  return (
    <section id="cidades" className={s.index} aria-labelledby="cidades-t">
      <div className={s.indexHead}>
        <h2 id="cidades-t" className={s.h2}>Índice das 168 cidades atendidas</h2>
        <p className={s.lede}>Busque pelo nome ou filtre pelo prazo de referência em dias úteis. Escolha uma cidade para ver a rota no mapa.</p>
        <div className={s.indexTools}>
          <div className={s.searchBox}>
            <Search size={19} aria-hidden="true" />
            <label htmlFor="indice-busca" className={s.srOnly}>Buscar cidade no índice</label>
            <input id="indice-busca" type="search" placeholder="Buscar cidade" value={q} onChange={(e) => { setQ(e.target.value); setAll(false); }} autoComplete="off" />
          </div>
          <div className={s.chips} role="group" aria-label="Filtrar por prazo de referência">
            <button type="button" aria-pressed={days === 0} onClick={() => setDays(0)}>Todos os prazos</button>
            {DAYS.map((d) => <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{d} dias úteis</button>)}
          </div>
        </div>
        <p className={s.count} aria-live="polite">{list.length === 1 ? '1 cidade' : `${list.length} cidades`}{days ? ` com ${days} dias úteis` : ''}{q.trim() ? ` para “${q.trim()}”` : ''}</p>
      </div>

      {list.length === 0 ? (
        <div className={s.indexEmpty}>
          <p><strong>Nenhuma cidade da tabela corresponde à busca.</strong> A equipe pode avaliar outros destinos.</p>
          <a className={s.keyLink} href={whatsappText(`Olá! A RJ Lima atende ${q.trim() || 'a minha cidade'}?`)} target="_blank" rel="noreferrer">Consultar pelo WhatsApp<ArrowRight size={16} aria-hidden="true" /></a>
        </div>
      ) : (
        <div className={s.indexCols}>
          {groups.map(([letter, cs]) => (
            <div key={letter} className={s.indexGroup}>
              <p className={s.indexLetter} aria-hidden="true">{letter}</p>
              <ul>
                {cs.map((c) => (
                  <li key={c.city}>
                    <button type="button" onClick={() => onShow(c)} aria-label={`Ver ${c.city} no mapa, ${c.days} dias úteis de prazo de referência`}>
                      <span className={s.idxName}>{c.city}</span><span className={s.leader} aria-hidden="true" />
                      <span className={s.idxRef}>{gridRef(c)}</span><span className={s.idxDays}>{c.days} d.u.</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className={s.indexFoot}>
        {list.length > 24 && <button type="button" className={`${s.btn} ${s.btnLine}`} onClick={() => setAll(!all)}>{all ? 'Mostrar menos cidades' : `Mostrar todas as ${list.length} cidades`}{!all && <Plus size={17} aria-hidden="true" />}</button>}
        <p className={s.indexNote}>d.u. = dias úteis de prazo de referência, conforme a tabela de abrangência. As letras e números indicam o quadro da cidade no mapa. A equipe confirma prazo e coleta para cada rota.</p>
        <div className={s.indexLinks}>
          <a href={CITIES_URL}>Página das cidades atendidas<ArrowRight size={16} aria-hidden="true" /></a>
          <a href={CITIES_PDF} target="_blank" rel="noreferrer"><Download size={16} aria-hidden="true" />Tabela de abrangência em PDF</a>
        </div>
      </div>
    </section>
  );
}

/* ---------- Tracking panel ---------- */
function Rastreio() {
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');
  const digits = onlyDigits(key).length;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (digits !== 44) {
      setErr(digits === 0 ? 'Digite a chave de acesso da nota fiscal.' : `A chave tem 44 dígitos. Faltam ${44 - digits}.`);
      document.getElementById('chave-nf')?.focus();
      return;
    }
    window.open(trackingHref(key), '_blank', 'noopener,noreferrer');
  };
  return (
    <section id="rastreio" className={s.track} aria-labelledby="rastreio-t">
      <div className={s.trackBox}>
        <p className={s.trackTab}>Consulta</p>
        <div className={s.trackIntro}>
          <h2 id="rastreio-t" className={s.h2}>Rastreie pela chave da nota fiscal</h2>
          <p>A chave de acesso tem 44 dígitos e aparece no DANFE, próxima ao código de barras. O rastreamento abre em uma nova aba.</p>
        </div>
        <form className={s.trackForm} onSubmit={submit} noValidate>
          <label htmlFor="chave-nf">Chave de acesso da NF-e</label>
          <input id="chave-nf" inputMode="numeric" autoComplete="off" placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
            value={formatKey(key)} onChange={(e) => { setKey(onlyDigits(e.target.value)); setErr(''); }}
            aria-invalid={err ? true : undefined} aria-describedby={err ? 'chave-err chave-count' : 'chave-count'} />
          <div className={s.trackMeta}>
            <span id="chave-count" className={digits === 44 ? s.countOk : ''}>{digits} de 44 dígitos</span>
            {err && <span id="chave-err" className={s.fieldError}>{err}</span>}
          </div>
          <button type="submit" className={`${s.btn} ${s.btnInk}`}>Rastrear entrega<ExternalLink size={17} aria-hidden="true" /></button>
          <a className={s.trackHelp} href={whatsappText('Olá! Preciso de ajuda para rastrear uma entrega.')} target="_blank" rel="noreferrer">
            <MessageCircle size={17} aria-hidden="true" />Não encontrou a chave? Peça ajuda pelo WhatsApp
          </a>
        </form>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
export default function Variante() {
  const q = useQuote();
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<City | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewId>('rede');

  const pick = useCallback((c: City) => { setSelected(c); setQuery(c.city); }, []);
  const toQuote = useCallback((focusId = 'q-origin') => {
    scrollToId('cotacao', reduced);
    setTimeout(() => (document.getElementById(focusId) as HTMLElement | null)?.focus({ preventScroll: true }), reduced ? 0 : 500);
  }, [reduced]);
  const quoteThis = () => {
    if (!selected) return;
    q.back();
    q.update('destination', `${selected.city} / MG`);
    toQuote(q.quote.origin ? 'q-cargo' : 'q-origin');
  };
  const quoteService = (service: string) => { q.back(); q.update('service', service); toQuote(); };
  const showOnMap = (c: City) => { pick(c); scrollToId('mapa', reduced); };

  return (
    <div className={`${s.root} ${sans.variable} ${serif.variable}`}>
      <a className={s.skip} href="#cotacao">Ir para a cotação</a>
      <Header />
      <main>
        <section id="mapa" className={s.hero} aria-labelledby="hero-t">
          <div className={s.heroText}>
            <h1 id="hero-t" className={s.h1}>De Três Corações para 168 cidades de Minas Gerais</h1>
            <p className={s.heroLede}>Transporte fracionado, dedicado, coletas programadas e apoio a transportadoras, a partir da nossa base no Sul de Minas. Escolha um destino e veja o prazo de referência.</p>
            <RoutePicker query={query} setQuery={(v) => { setQuery(v); if (!v) setSelected(null); }} onPick={pick} />
            <div className={s.callout} aria-live="polite">
              {selected ? (
                <div key={selected.city} className={s.calloutIn}>
                  <p className={s.calloutLine}><strong>{selected.city}</strong><span aria-hidden="true"> · </span><span>{selected === HUB ? 'base RJ Lima · ' : ''}{selected.days} dias úteis</span><span aria-hidden="true"> · </span><em>prazo de referência</em></p>
                  <p className={s.calloutNote}>Quadro {gridRef(selected)} no mapa. A equipe confirma prazo e coleta para cada rota.</p>
                  <div className={s.calloutActions}>
                    <button type="button" className={`${s.btn} ${s.btnRed}`} onClick={quoteThis}>Cotar este frete<ArrowRight size={18} aria-hidden="true" /></button>
                    <a className={s.textBtn} href={PHONE_HREF}><Phone size={16} aria-hidden="true" />{PHONE}</a>
                  </div>
                </div>
              ) : (
                <div className={s.calloutIn}>
                  <p className={s.quickLabel}>Destinos frequentes</p>
                  <div className={s.quick}>
                    {POPULAR.filter((c) => c !== HUB).map((c) => <button key={c.city} type="button" onClick={() => pick(c)}><MapPin size={15} aria-hidden="true" />{c.city}</button>)}
                  </div>
                  <div className={s.calloutActions}>
                    <a className={`${s.btn} ${s.btnRed}`} href="#cotacao">Solicitar cotação<ArrowRight size={18} aria-hidden="true" /></a>
                    <a className={s.textBtn} href={PHONE_HREF}><Phone size={16} aria-hidden="true" />{PHONE}</a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={s.sheet}>
            <div className={s.cartouche}><p>Minas Gerais</p><span>Rede de entregas RJ Lima</span></div>
            <div className={s.sheetMap}><AtlasMap mode="hero" view={view} onView={setView} selected={selected} onSelect={pick} label="Mapa de Minas Gerais com as 168 cidades atendidas. Use Tab para entrar no mapa, as setas para passar entre cidades e Enter para escolher." /></div>
            <ViewSwitch view={view} onView={setView} />
            <div className={s.legend}>
              <ul>
                <li><span className={s.lgHub} aria-hidden="true" />Base: {HUB.city}</li>
                <li><span className={s.lgDot} aria-hidden="true" />Cidade atendida</li>
                <li><span className={s.lgRoute} aria-hidden="true" />Rota consultada</li>
                <li><span className={s.lgTint} aria-hidden="true" />Minas Gerais</li>
              </ul>
              <p>Mapa sem escala. {MAP.source}</p>
            </div>
            <VideoPlate />
          </div>
        </section>

        <Servicos onQuote={quoteService} />
        <Pranchas />
        <Indice onShow={showOnMap} />
        <Rastreio />
        <Cotacao q={q} />

        <section className={s.refs} aria-label="Segmentos e notas">
          <div className={s.segments}>
            <h2 className={s.h2}>Segmentos atendidos</h2>
            <ul>
              {SEGMENTS.map((sg) => <li key={sg}>{sg}</li>)}
            </ul>
            <a className={`${s.btn} ${s.btnRed}`} href="#cotacao">Solicitar cotação<ArrowRight size={18} aria-hidden="true" /></a>
          </div>
          <div id="notas" className={s.notes}>
            <h2 className={s.h2}>Notas do mapa</h2>
            {FAQS.map(([question, answer], i) => (
              <details key={question} name="atlas-notas" className={s.note}>
                <summary><sup>{i + 1}</sup><span>{question}</span><Plus size={20} aria-hidden="true" /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.footTop}>
          <div className={s.footBrand}>
            <span className={s.logoPlate}><img src={LOGO} width={LOGO_SIZE.width} height={LOGO_SIZE.height} alt="RJ Lima Transportes" /></span>
            <p>Transportadora regional com base em {HUB.city}, no Sul de Minas.</p>
          </div>
          <div className={s.footCol}>
            <h2>Contato</h2>
            <a href={WHATSAPP} target="_blank" rel="noreferrer"><MessageCircle size={17} aria-hidden="true" />WhatsApp {PHONE}</a>
            <a href={PHONE_HREF}><Phone size={17} aria-hidden="true" />{PHONE}</a>
            <a href={`mailto:${EMAIL}`}><Mail size={17} aria-hidden="true" />{EMAIL}</a>
            <a href={INSTAGRAM} target="_blank" rel="noreferrer"><AtSign size={17} aria-hidden="true" />@rjlimatransportes</a>
          </div>
          <div className={s.footCol}>
            <h2>Consultas</h2>
            <a href="#cotacao">Solicitar cotação</a>
            <a href={CITIES_URL}>Cidades atendidas</a>
            <a href={CITIES_PDF} target="_blank" rel="noreferrer">Tabela de abrangência em PDF</a>
            <a href="#rastreio">Rastrear entrega</a>
          </div>
        </div>
        <p className={s.footBase}>RJ Lima Transportes. Imagens e vídeos desta página são ilustrativos. {MAP.source}</p>
      </footer>
    </div>
  );
}
