'use client';
// Variant "Placa de rodovia": the page as Brazilian highway wayfinding (DNIT/DER guide signs).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Overpass } from 'next/font/google';
import { ArrowDown, ArrowRight, ArrowUpRight, Pause, Phone, Play } from 'lucide-react';
import {
  CITIES, EMAIL, INSTAGRAM, LOGO, LOGO_SIZE, MEDIA, PHONE, PHONE_HREF, SEGMENTS, SERVICES, FAQS,
  WHATSAPP, CITIES_URL, CITIES_PDF, useQuote, whatsappText,
} from '../../dados';
import { Cobertura } from './Cobertura';
import { Cotacao } from './Cotacao';
import { Rastreio } from './Rastreio';
import s from './estilo.module.css';

const overpass = Overpass({ subsets: ['latin', 'latin-ext'], variable: '--pl-font', display: 'swap' });

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Smooth scroll to an anchor and move focus there, respecting reduced motion. */
export function goTo(id: string, focusId?: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  const target = focusId ? document.getElementById(focusId) : null;
  if (target) window.setTimeout(() => target.focus({ preventScroll: true }), reducedMotion() ? 0 : 450);
}

// The cover video is slow ambient footage with a pause button, so it plays even under reduced motion (same rule as the FeedTempo site); every other animation still honours the setting.
function HeroVideo() {
  const wide = useRef<HTMLVideoElement>(null);
  const tall = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const visible = useCallback(() => {
    const narrow = window.matchMedia('(max-width: 767px)').matches;
    return { on: narrow ? tall.current : wide.current, off: narrow ? wide.current : tall.current };
  }, []);

  useEffect(() => {
    const { on } = visible();
    on?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [visible]);

  const toggle = () => {
    const { on, off } = visible();
    off?.pause();
    if (!on) return;
    if (on.paused) on.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    else { on.pause(); setPlaying(false); }
  };

  return (
    <>
      <video ref={wide} className={`${s.video} ${s.videoWide}`} muted loop playsInline preload="metadata"
        poster={MEDIA.videoSerra.poster} aria-label={MEDIA.videoSerra.alt}>
        <source src={MEDIA.videoSerra.webm} type="video/webm" />
        <source src={MEDIA.videoSerra.mp4} type="video/mp4" />
      </video>
      <video ref={tall} className={`${s.video} ${s.videoTall}`} muted loop playsInline preload="metadata"
        poster={MEDIA.videoSerraVertical.poster} aria-label={MEDIA.videoSerraVertical.alt}>
        <source src={MEDIA.videoSerraVertical.webm} type="video/webm" />
        <source src={MEDIA.videoSerraVertical.mp4} type="video/mp4" />
      </video>
      <button type="button" className={s.videoToggle} onClick={toggle}
        aria-label={playing ? 'Pausar vídeo de fundo' : 'Reproduzir vídeo de fundo'}>
        {playing ? <Pause size={20} aria-hidden /> : <Play size={20} aria-hidden />}
      </button>
    </>
  );
}

export default function Variante() {
  const q = useQuote();

  const quoteService = (title: string) => {
    q.update('service', title);
    if (q.step !== 1) q.back();
    goTo('pl-form', 'pl-origin');
  };
  const quoteCity = (label: string) => {
    q.update('destination', label);
    if (q.step !== 1) q.back();
    goTo('pl-form', 'pl-origin');
  };

  const [big1, big2, small1, small2] = SERVICES;

  return (
    <div className={`${overpass.variable} ${s.root}`}>
      <a className={s.skip} href="#cotacao">Ir para a cotação</a>

      <header className={s.header}>
        <div className={s.headerRow}>
          <a href="#topo" className={s.logoLink} aria-label="RJ Lima Transportes, início">
            <img src={LOGO} width={LOGO_SIZE.width} height={LOGO_SIZE.height} alt="RJ Lima Transportes" className={s.logo} />
          </a>
          <nav className={s.navDesktop} aria-label="Seções da página">
            <a href="#servicos">Serviços</a>
            <a href="#cidades">Cidades</a>
            <a href="#rastreio">Rastreio</a>
            <a href="#duvidas">Dúvidas</a>
          </nav>
          <div className={s.headerActions}>
            <a href={PHONE_HREF} className={s.phoneLink} aria-label={`Ligar para ${PHONE}`}>
              <Phone size={18} aria-hidden />
              <span className={s.phoneText} aria-hidden>{PHONE}</span>
            </a>
            <a href="#cotacao" className={s.ctaRed}>Solicitar cotação</a>
          </div>
        </div>
      </header>
      <nav className={s.navMobile} aria-label="Seções da página">
        <a href="#servicos">Serviços</a>
        <a href="#cidades">Cidades</a>
        <a href="#rastreio">Rastreio</a>
        <a href="#duvidas">Dúvidas</a>
      </nav>

      <main id="topo">
        {/* Hero: an overhead sign gantry over the cover video. */}
        <section className={s.hero} aria-labelledby="pl-hero-title">
          <div className={s.heroMedia}>
            <HeroVideo />
            <div className={s.gantry}>
              <span className={`${s.post} ${s.postLeft}`} aria-hidden />
              <span className={`${s.post} ${s.postRight}`} aria-hidden />
              <span className={s.beam} aria-hidden />
              <nav className={s.gantrySigns} aria-label="Atalhos">
                <a href="#cotacao" className={`${s.gSign} ${s.gSignDown}`}>
                  <span className={s.gText}>Cotação de frete</span>
                  <ArrowDown className={s.gArrow} size={30} strokeWidth={3} aria-hidden />
                </a>
                <a href="#cidades" className={`${s.gSign} ${s.gSignRight}`}>
                  <span className={s.gText}><strong>{CITIES.length}</strong> cidades atendidas</span>
                  <ArrowRight className={s.gArrow} size={30} strokeWidth={3} aria-hidden />
                </a>
                <a href="#rastreio" className={`${s.gSign} ${s.gSignUp}`}>
                  <span className={s.gText}>Rastrear entrega</span>
                  <ArrowUpRight className={s.gArrow} size={30} strokeWidth={3} aria-hidden />
                </a>
              </nav>
            </div>
          </div>
          <div className={s.heroSignWrap}>
            <div className={`${s.panel} ${s.heroSign}`}>
              <h1 id="pl-hero-title" className={s.heroTitle}>Transporte de cargas no Sul de Minas</h1>
              <p className={s.heroLead}>
                Carga fracionada e dedicada, coletas programadas e apoio a transportadoras, com base em Três Corações.
                Informe origem, destino e carga, e a equipe prepara a sua cotação.
              </p>
              <div className={s.heroActions}>
                <a href="#cotacao" className={`${s.ctaRed} ${s.ctaBig}`}>Solicitar cotação</a>
                <a href={whatsappText('Olá! Gostaria de falar com a equipe da RJ Lima.')} className={s.plateBtn} target="_blank" rel="noopener noreferrer">
                  Falar pelo WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Services as guide signs of different sizes. */}
        <section id="servicos" className={s.section} aria-labelledby="pl-serv-title">
          <div className={s.wrap}>
            <h2 id="pl-serv-title" className={s.h2}>Serviços</h2>
            <p className={s.intro}>Quatro formas de levar a sua carga. Escolha a que se parece com a sua operação e peça a cotação já com o serviço marcado.</p>
            <div className={s.services}>
              {[big1, big2].map((sv, i) => (
                <article key={sv.id} className={`${s.panel} ${s.svBig} ${i === 0 ? s.svFirst : ''}`}>
                  {i === 0 && (
                    <img src={MEDIA.carga.src} width={MEDIA.carga.w} height={MEDIA.carga.h} alt={MEDIA.carga.alt} className={s.svImg} loading="lazy" />
                  )}
                  <div className={s.svBody}>
                    <h3 className={s.svTitle}>{sv.title}</h3>
                    <p className={s.svShort}>{sv.short}</p>
                    <p className={s.svDetail}>{sv.detail}</p>
                    <ul className={s.tags}>
                      {sv.tags.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                    <button type="button" className={s.plateBtn} onClick={() => quoteService(sv.title)}>
                      Cotar {sv.title.toLowerCase()} <ArrowRight size={18} strokeWidth={2.5} className={s.nudge} aria-hidden />
                    </button>
                  </div>
                </article>
              ))}
              {[small1, small2].map((sv) => (
                <article key={sv.id} className={s.svSmall}>
                  <h3 className={s.svSmallTitle}>{sv.title}</h3>
                  <p className={s.svShort}>{sv.short}</p>
                  <p className={s.svDetail}>{sv.detail}</p>
                  <button type="button" className={s.greenBtn} onClick={() => quoteService(sv.title)}>
                    {sv.id === 'parceria' ? 'Propor parceria' : 'Programar coletas'} <ArrowRight size={18} strokeWidth={2.5} className={s.nudge} aria-hidden />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Cobertura onQuote={quoteCity} />

        {/* Band: where the trucks actually run. */}
        <section className={s.band} aria-labelledby="pl-band-title">
          <div className={s.wrap}>
            <h2 id="pl-band-title" className={s.h2}>Da doca da sua empresa às cidades do interior</h2>
            <div className={s.bandGrid}>
              <figure className={s.bandBig}>
                <img src={MEDIA.cafezal.src} width={MEDIA.cafezal.w} height={MEDIA.cafezal.h} alt={MEDIA.cafezal.alt} loading="lazy" />
                <figcaption>Estradas de terra entre cafezais</figcaption>
              </figure>
              <figure>
                <img src={MEDIA.doca.src} width={MEDIA.doca.w} height={MEDIA.doca.h} alt={MEDIA.doca.alt} loading="lazy" />
                <figcaption>Coleta na doca</figcaption>
              </figure>
              <figure>
                <img src={MEDIA.cidade.src} width={MEDIA.cidade.w} height={MEDIA.cidade.h} alt={MEDIA.cidade.alt} loading="lazy" />
                <figcaption>Entrega em ruas de pedra</figcaption>
              </figure>
            </div>
            <p className={s.note}>Imagens ilustrativas.</p>
          </div>
        </section>

        <Rastreio />

        <Cotacao q={q} />

        {/* Segments as a multi-destination guide sign, FAQ beside it. */}
        <section id="duvidas" className={s.section} aria-labelledby="pl-faq-title">
          <div className={`${s.wrap} ${s.segFaq}`}>
            <div className={s.segCol}>
              <div className={`${s.panel} ${s.segSign}`}>
                <h2 className={s.segTitle}>Quem a RJ Lima atende</h2>
                <ul className={s.segList}>
                  {SEGMENTS.map((seg) => <li key={seg}>{seg}</li>)}
                </ul>
              </div>
              <span className={s.signPosts} aria-hidden><i /><i /></span>
            </div>
            <div>
              <h2 id="pl-faq-title" className={s.h2}>Perguntas frequentes</h2>
              <div className={s.faq}>
                {FAQS.map(([question, answer]) => (
                  <details key={question} className={s.faqItem}>
                    <summary>
                      <span>{question}</span>
                      <ArrowDown size={20} strokeWidth={2.5} className={s.faqIcon} aria-hidden />
                    </summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.footerGrid}`}>
          <div className={s.footerBrand}>
            <span className={s.logoPlate}>
              <img src={LOGO} width={LOGO_SIZE.width} height={LOGO_SIZE.height} alt="RJ Lima Transportes" className={s.footerLogo} loading="lazy" />
            </span>
            <p>Transporte de cargas com base em Três Corações, Sul de Minas.</p>
            <a href="#cotacao" className={`${s.ctaRed} ${s.ctaBig}`}>Solicitar cotação</a>
          </div>
          <div>
            <h2 className={s.footerHead}>Contato</h2>
            <ul className={s.footerList}>
              <li><a href={PHONE_HREF}>Telefone {PHONE}</a></li>
              <li><a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp {PHONE}</a></li>
              <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
              <li><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Instagram @rjlimatransportes</a></li>
            </ul>
          </div>
          <div>
            <h2 className={s.footerHead}>Consultas</h2>
            <ul className={s.footerList}>
              <li><a href={CITIES_URL}>Cidades atendidas</a></li>
              <li><a href={CITIES_PDF} target="_blank" rel="noopener noreferrer">Tabela de cidades em PDF</a></li>
              <li><a href="#rastreio">Rastrear entrega</a></li>
              <li><a href="#duvidas">Perguntas frequentes</a></li>
            </ul>
          </div>
        </div>
        <div className={s.wrap}>
          <p className={s.footerSmall}>
            Imagens e vídeos desta página são ilustrativos. Prazos de referência conforme a tabela de atendimento; a equipe confirma prazo e coleta para cada rota.
          </p>
        </div>
      </footer>
    </div>
  );
}
