'use client';
// Home page ("Baú e faixa"): the page wears the RJ Lima truck livery. Ribbed aluminium box as the surface,
// cab black for heavy blocks, the logo's yellow road as the signature line, a road strip with the yellow centerline as divider.
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowRight, MessageCircle, Pause, Phone, Play, Plus, Search } from 'lucide-react';
import {
  FAQS, MEDIA, PHONE, PHONE_HREF, SEGMENTS, SERVICES,
  WHATSAPP, HERO_COVER, HERO_COVER_VERTICAL, VERTICAL_QUERY, formatKey, onlyDigits, trackingHref, useQuote, whatsappText, type City, type Cover } from '../../lib/site-data';
import { Footer, Header, goTo, toQuote } from './Chrome';
import { Rota } from './Rota';
import { Cidades } from './Cidades';
import { Cotacao } from './Cotacao';
import { archivo } from './fonte';
import s from './estilo.module.css';

// The cover video is slow ambient footage with a pause button, so it plays even under reduced motion (same rule as the FeedTempo site); every other animation still honours the setting.
function Hero() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // The film is chosen and created on the client after mount (the poster below is server-rendered for both widths);
  // this is the path that autoplays reliably.
  const [src, setSrc] = useState<Cover | null>(null);
  useEffect(() => setSrc(window.matchMedia(VERTICAL_QUERY).matches ? HERO_COVER_VERTICAL : HERO_COVER), []);

  // Make sure the film is muted and running once it exists.
  useEffect(() => {
    const v = ref.current;
    if (!src || !v) return;
    v.muted = true;
    // Autoplay may have started before hydration, so the onPlay event was missed.
    setPlaying(!v.paused);
    if (!v.paused) return;
    // Some browsers block even muted autoplay (Edge or Firefox set to block, power saving); then the first
    // scroll, tap or key press starts the film.
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    const kick = () => { events.forEach((ev) => window.removeEventListener(ev, kick)); if (v.paused) void v.play().catch(() => {}); };
    v.play().catch(() => events.forEach((ev) => window.addEventListener(ev, kick, { once: true, passive: true })));
    return () => events.forEach((ev) => window.removeEventListener(ev, kick));
  }, [src]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play(); else v.pause();
  };

  return (
    <section className={s.hero} id="topo" aria-labelledby="bau-hero-title">
      <div className={s.heroMedia}>
        <picture>
          <source media={VERTICAL_QUERY} srcSet={HERO_COVER_VERTICAL.poster} />
          <img src={HERO_COVER.poster} alt="Imagem ilustrativa: caminhão da RJ Lima na estrada pelo Sul de Minas" className={s.heroPoster} fetchPriority="high" />
        </picture>
        {src && (
          <video ref={ref} className={s.heroVideo} data-loaded={loaded ? '' : undefined} autoPlay muted loop playsInline preload="metadata"
            poster={src.poster} aria-hidden="true" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            onLoadedData={() => setLoaded(true)}>
            <source src={src.webm} type="video/webm" />
            <source src={src.mp4} type="video/mp4" />
          </video>
        )}
        <div className={s.heroScrim} />
      </div>

      <div className={s.heroInner}>
        <h1 id="bau-hero-title" className={s.heroTitle}>
          <span className={s.heroLine}>Sua carga</span> <span className={`${s.heroLine} ${s.heroLine2}`}>segue.</span>
        </h1>
        <p className={s.heroLead}>
          Transporte rodoviário de cargas a partir de Três Corações, com 168 cidades de Minas Gerais na tabela de atendimento.
          Cotação pelo WhatsApp e rastreio pela nota fiscal.
        </p>
        <div className={s.heroActions}>
          <a href="#cotacao" className={`${s.btn} ${s.btnRed} ${s.btnLg}`} onClick={toQuote}>Solicitar cotação <ArrowRight aria-hidden="true" size={20} /></a>
          <a href="#rastreio" className={`${s.btn} ${s.btnOnMedia} ${s.btnLg}`}><Search aria-hidden="true" size={18} /> Rastrear entrega</a>
        </div>
      </div>

      <div className={s.heroFoot}>
        <button type="button" className={s.playBtn} onClick={toggle} aria-label={playing ? 'Pausar vídeo' : 'Reproduzir vídeo'}>
          {playing ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
        </button>
      </div>
      <div className={`${s.tape} ${s.heroTape}`} aria-hidden="true" />
    </section>
  );
}

const SERVICE_MEDIA = {
  fracionado: MEDIA.carga,
  dedicado: MEDIA.doca,
  coletas: null,
  parceria: MEDIA.cidade,
} as const;

function Servicos({ onPick }: { onPick: (title: string) => void }) {
  return (
    <div className={s.bays}>
      {SERVICES.map((sv) => {
        const img = SERVICE_MEDIA[sv.id];
        return (
          <article key={sv.id} className={`${s.bay} ${s[`bay_${sv.id}`]}`} aria-labelledby={`bau-sv-${sv.id}`}>
            {img && (
              <div className={s.bayMedia}>
                <img src={img.src} width={img.w} height={img.h} alt={img.alt} loading="lazy" decoding="async" />
              </div>
            )}
            <div className={s.bayBody}>
              <h3 id={`bau-sv-${sv.id}`} className={s.bayTitle}>{sv.title}</h3>
              <p className={s.bayShort}>{sv.short}</p>
              <p className={s.bayDetail}>{sv.detail}</p>
              <ul className={s.tags}>
                {sv.tags.map((t) => <li key={t}>{t}</li>)}
              </ul>
              <a href="#cotacao" className={s.bayLink} onClick={(e) => { e.preventDefault(); onPick(sv.title); }}>
                Cotar {sv.title.toLowerCase()} <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Rastreio() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const count = onlyDigits(key).length;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (count !== 44) {
      setError(count === 0 ? 'Digite a chave de acesso da nota fiscal.' : `Faltam ${44 - count} dígitos. A chave tem 44 números.`);
      document.getElementById('bau-key')?.focus();
      return;
    }
    setError('');
    window.open(trackingHref(key), '_blank', 'noopener');
  };
  return (
    <form className={s.track} onSubmit={submit} noValidate>
      <label htmlFor="bau-key" className={s.label}>Chave de acesso da nota fiscal</label>
      <div className={s.trackRow}>
        <input id="bau-key" className={`${s.input} ${s.keyInput}`} inputMode="numeric" autoComplete="off" spellCheck={false}
          placeholder="Somente números, 44 dígitos" value={formatKey(key)}
          onChange={(e) => { setKey(onlyDigits(e.target.value)); setError(''); }}
          aria-invalid={error ? true : undefined} aria-describedby={error ? 'bau-key-err bau-key-count' : 'bau-key-count'} />
        <button type="submit" className={`${s.btn} ${s.btnDark}`}>Rastrear <ArrowRight aria-hidden="true" size={18} /></button>
      </div>
      <div className={s.keyMeter} aria-hidden="true"><span style={{ '--fill': count / 44 } as CSSProperties} /></div>
      <p id="bau-key-count" className={s.keyCount}>{count} de 44 dígitos</p>
      {error && <p id="bau-key-err" className={s.errLight} role="alert">{error}</p>}
      <p className={s.trackHelp}>
        A chave aparece no DANFE, perto do código de barras. O rastreio abre em uma nova aba.{' '}
        <a className={s.inlineLink} href={whatsappText('Olá! Preciso de ajuda para rastrear uma entrega da RJ Lima.')} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden="true" size={16} /> Peça ajuda pelo WhatsApp
        </a>
      </p>
    </form>
  );
}

export default function HomePage() {
  const api = useQuote();
  const routeRef = useRef<HTMLDivElement>(null);

  const pickService = (title: string) => {
    api.update('service', title);
    if (api.step === 2) api.back();
    goTo('cotacao', 'bau-origin');
  };
  const quoteCity = (c: City) => {
    api.update('destination', `${c.city} / ${c.state}`);
    if (api.step === 2) api.back();
    goTo('cotacao', api.quote.origin ? 'bau-cargo' : 'bau-origin');
  };

  return (
    <div className={`${archivo.variable} ${s.root}`}>
      <a href="#cotacao" className={s.skip} onClick={toQuote}>Ir para a cotação</a>
      <Header />
      <main>
        <Hero />

        <div className={s.route} ref={routeRef}>
          <Rota hostRef={routeRef} stopIds={['servicos', 'cidades', 'cotacao']} />

          <section id="servicos" className={`${s.section} ${s.ribbed}`} aria-labelledby="bau-servicos-title">
            <div className={s.inner}>
              <div className={s.sectionHead}>
                <h2 id="bau-servicos-title" className={s.h2}>Cada carga no seu compartimento.</h2>
                <p className={s.lead}>Quatro formas de levar a sua carga pelas estradas de Minas. Escolha a que se parece com a sua operação e peça a cotação.</p>
              </div>
              <Servicos onPick={pickService} />
            </div>
          </section>

          <section id="cidades" className={s.section} aria-labelledby="bau-cidades-title">
            <div className={s.inner}>
              <div className={s.sectionHead}>
                <h2 id="bau-cidades-title" className={s.h2}>168 cidades na tabela de atendimento.</h2>
                <p className={s.lead}>
                  Busque o destino e veja o prazo de referência em dias úteis. A equipe confirma prazo e coleta para cada rota.
                </p>
              </div>
              <Cidades onQuote={quoteCity} />
            </div>
          </section>

          <section id="cotacao" className={`${s.section} ${s.cab}`} aria-labelledby="bau-quote-title">
            <div className={`${s.inner} ${s.quoteGrid}`}>
              <div className={s.quoteIntro}>
                <h2 id="bau-quote-title" className={s.h2}>Solicite sua cotação.</h2>
                <p className={s.leadOnCab}>
                  Rota e carga, depois o seu contato. O pedido sai pronto para o WhatsApp da equipe comercial; o que faltar, você alinha no atendimento.
                </p>
              </div>
              <Cotacao api={api} />
              {/* After the form on phones, under the intro on wide screens. */}
              <div className={s.quoteDirect}>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={s.linkOnCab}><MessageCircle aria-hidden="true" size={18} /> Prefere conversar? Fale direto no WhatsApp</a>
                <a href={PHONE_HREF} className={s.linkOnCab}><Phone aria-hidden="true" size={18} /> {PHONE}</a>
              </div>
            </div>
          </section>
        </div>

        <section id="rastreio" className={`${s.section} ${s.ribbed}`} aria-labelledby="bau-rastreio-title">
          <div className={`${s.inner} ${s.trackGrid}`}>
            <div>
              <h2 id="bau-rastreio-title" className={s.h2}>Acompanhe a sua entrega.</h2>
              <p className={s.lead}>Digite os 44 dígitos da chave de acesso da nota fiscal para ver o andamento da carga.</p>
              <Rastreio />
            </div>
            {/* The opposite scene of the cover at each width: serra on wide screens (night cover), night on phones (serra cover). */}
            <figure className={s.trackFigure}>
              <picture>
                <source media={VERTICAL_QUERY} srcSet={MEDIA.noite.src} />
                <img src={MEDIA.serra.src} width={MEDIA.serra.w} height={MEDIA.serra.h} alt="Imagem ilustrativa: caminhão da RJ Lima na rodovia de Minas" loading="lazy" decoding="async" />
              </picture>
            </figure>
          </div>
        </section>

        <section id="segmentos" className={s.segments} aria-labelledby="bau-seg-title">
          <div className={s.segMedia}>
            <img src={MEDIA.cafezal.src} width={MEDIA.cafezal.w} height={MEDIA.cafezal.h} alt={MEDIA.cafezal.alt} loading="lazy" decoding="async" />
          </div>
          <div className={s.segBody}>
            <h2 id="bau-seg-title" className={s.h2}>Para quem a RJ Lima trabalha.</h2>
            <ul className={s.segList}>
              {SEGMENTS.map((seg) => <li key={seg}>{seg}</li>)}
            </ul>
            <a href="#cotacao" className={`${s.btn} ${s.btnRed}`} onClick={toQuote}>Solicitar cotação <ArrowRight aria-hidden="true" size={18} /></a>
          </div>
        </section>

        <section id="duvidas" className={s.section} aria-labelledby="bau-faq-title">
          <div className={`${s.inner} ${s.faqGrid}`}>
            <h2 id="bau-faq-title" className={s.h2}>Dúvidas frequentes.</h2>
            <div className={s.faq}>
              {FAQS.map(([q, a]) => (
                <details key={q} className={s.faqItem}>
                  <summary className={s.faqQ}><span>{q}</span><Plus aria-hidden="true" size={22} className={s.faqIcon} /></summary>
                  <p className={s.faqA}>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
