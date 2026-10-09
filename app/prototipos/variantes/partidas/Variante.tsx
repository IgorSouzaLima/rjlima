'use client';
// Variant "Painel de partidas": the RJ Lima network shown as a rodoviária split-flap departures board.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import { ArrowRight, ExternalLink, Mail, MapPin, Menu, MessageCircle, Pause, Phone, Play, Plus, X } from 'lucide-react';
import {
  EMAIL, FAQS, INSTAGRAM, LOGO, LOGO_SIZE, MEDIA, PHONE, PHONE_HREF, SEGMENTS, SERVICES, WHATSAPP,
  CITIES_URL, TRACKING_URL, useQuote, whatsappText, type City, pickCover, type Cover } from '../../dados';
import { Board, useReducedMotion } from './Board';
import { QuoteForm } from './QuoteForm';
import { Tracking } from './Tracking';
import s from './estilo.module.css';

const barlow = Barlow({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--pp-body', display: 'swap' });
const condensed = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--pp-cond', display: 'swap' });

const NAV = [
  ['#servicos', 'Serviços'],
  ['#cidades', 'Cidades'],
  ['#rastreio', 'Rastreio'],
  ['#cotacao', 'Cotação'],
  ['#duvidas', 'Dúvidas'],
] as const;

const SERVICE_CODES: Record<string, string> = { fracionado: 'FR', dedicado: 'DD', coletas: 'CP', parceria: 'PT' };

// The cover video is slow ambient footage with a pause button, so it plays even under reduced motion (same rule as the FeedTempo site); every other animation still honours the setting.
function CoverVideo() {
  const [cover, setCover] = useState<Cover | null>(null);
  useEffect(() => { setCover(pickCover(window.matchMedia('(max-width: 760px)').matches)); }, []);
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => setPlaying(false));
  }, [cover]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  if (!cover) return null;
  return (
    <>
      <video
        key={cover.mp4}
        ref={ref}
        className={s.coverMedia}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        poster={cover.poster}
        aria-label={cover.alt}
      >
        <source src={cover.webm} type="video/webm" />
        <source src={cover.mp4} type="video/mp4" />
      </video>
      <button type="button" className={s.videoToggle} onClick={toggle} aria-label={playing ? 'Pausar vídeo' : 'Reproduzir vídeo'}>
        {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
      </button>
    </>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <a href="#topo" className={s.logoLink} aria-label="RJ Lima Transportes, início">
          <img src={LOGO} alt="RJ Lima Transportes" width={LOGO_SIZE.width} height={LOGO_SIZE.height} className={s.logo} />
        </a>
        <nav className={s.nav} aria-label="Seções">
          {NAV.map(([href, label]) => <a key={href} href={href} className={s.navLink}>{label}</a>)}
        </nav>
        <div className={s.headerActions}>
          <a href={PHONE_HREF} className={s.headerPhone} aria-label={`Ligar para ${PHONE}`}>
            <Phone size={18} aria-hidden="true" /><span className={s.headerPhoneText}>{PHONE}</span>
          </a>
          <a href="#cotacao" className={`${s.btn} ${s.btnRed} ${s.headerCta}`}>Solicitar cotação</a>
          <button
            type="button"
            className={s.menuBtn}
            aria-expanded={open}
            aria-controls="pp-menu"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <nav id="pp-menu" className={s.mobileMenu} data-open={open} aria-label="Seções" hidden={!open}>
        {NAV.map(([href, label]) => (
          <a key={href} href={href} className={s.mobileLink} onClick={() => setOpen(false)}>{label}</a>
        ))}
        <a href={PHONE_HREF} className={s.mobileLink} onClick={() => setOpen(false)}>
          <Phone size={18} aria-hidden="true" /> {PHONE}
        </a>
      </nav>
    </header>
  );
}

export default function Variante() {
  const q = useQuote();
  const reduced = useReducedMotion();
  const [flash, setFlash] = useState(0);

  const scrollToQuote = useCallback((focusId: string) => {
    const el = document.getElementById('cotacao');
    el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => document.getElementById(focusId)?.focus({ preventScroll: true }), reduced ? 0 : 450);
  }, [reduced]);

  const pickCity = useCallback((c: City) => {
    if (q.step === 2) q.back();
    q.update('destination', `${c.city} / ${c.state}`);
    setFlash((f) => f + 1);
    scrollToQuote(q.quote.origin.trim() ? 'q-cargo' : 'q-origin');
  }, [q, scrollToQuote]);

  const pickService = useCallback((title: string) => {
    if (q.step === 2) q.back();
    q.update('service', title);
    scrollToQuote('q-service');
  }, [q, scrollToQuote]);

  return (
    <div className={`${s.root} ${barlow.variable} ${condensed.variable}`} id="topo">
      <a href="#cotacao" className={s.skip}>Ir para a cotação</a>
      <Header />

      <main>
        {/* Hero: cover video band with the departures board resting on its lower edge */}
        <section className={s.hero} aria-labelledby="pp-h1">
          <div className={s.cover}>
            <div className={s.coverFrame}>
              <CoverVideo />
              <div className={s.coverScrim} aria-hidden="true" />
            </div>
            <div className={s.heroText}>
              <h1 id="pp-h1" className={s.h1}>Do Sul de Minas para 168 cidades de Minas Gerais.</h1>
              <p className={s.lede}>
                Transporte fracionado e dedicado, coletas programadas e apoio a transportadoras, a partir de Três Corações.
                Consulte o prazo de referência do seu destino e peça a cotação pelo WhatsApp.
              </p>
              <div className={s.heroCtas}>
                <a href="#cotacao" className={`${s.btn} ${s.btnRed} ${s.btnLg}`}>Solicitar cotação <ArrowRight size={20} aria-hidden="true" /></a>
                <a href="#rastreio" className={`${s.btn} ${s.btnGhostDark} ${s.btnLg}`}>Rastrear nota fiscal</a>
              </div>
            </div>
          </div>
          <div className={s.boardWrap}>
            <Board onPick={pickCity} />
          </div>
        </section>

        {/* Services as route lines */}
        <section id="servicos" className={s.section} aria-labelledby="pp-servicos">
          <div className={`${s.container} ${s.servicesGrid}`}>
            <div className={s.servicesIntro}>
              <h2 id="pp-servicos" className={s.h2}>Quatro linhas de serviço para a sua carga.</h2>
              <p className={s.sectionLede}>
                Escolha a linha mais próxima da sua necessidade. Na cotação, a equipe ajusta coleta, rota e prazo à sua operação.
              </p>
              <figure className={s.servicesFigure}>
                <img src={MEDIA.doca.src} alt={MEDIA.doca.alt} width={MEDIA.doca.w} height={MEDIA.doca.h} loading="lazy" className={s.servicesImg} />
                <figcaption className={s.caption}>Imagem ilustrativa.</figcaption>
              </figure>
            </div>
            <ol className={s.lines}>
              {SERVICES.map((svc) => (
                <li key={svc.id} className={s.line}>
                  <span className={s.lineCode} aria-hidden="true">
                    {SERVICE_CODES[svc.id].split('').map((c, i) => <span key={i} className={s.lineCodeFlap}>{c}</span>)}
                  </span>
                  <div className={s.lineBody}>
                    <h3 className={s.h3}>{svc.title}</h3>
                    <p className={s.lineShort}>{svc.short}</p>
                    <p className={s.lineDetail}>{svc.detail}</p>
                    <div className={s.lineFoot}>
                      <ul className={s.tags} aria-label="Características">
                        {svc.tags.map((t) => <li key={t} className={s.tag}>{t}</li>)}
                      </ul>
                      <button type="button" className={s.lineCta} onClick={() => pickService(svc.title)}>
                        Cotar {svc.title.toLocaleLowerCase('pt-BR')} <ArrowRight size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Tracking, styled as a ticket */}
        <section id="rastreio" className={`${s.section} ${s.sectionConcrete}`} aria-labelledby="pp-rastreio">
          <div className={`${s.container} ${s.trackGrid}`}>
            <div>
              <h2 id="pp-rastreio" className={s.h2}>Acompanhe sua entrega pela nota fiscal.</h2>
              <p className={s.sectionLede}>
                Digite a chave de acesso de 44 dígitos. Ela aparece no DANFE, próxima ao código de barras.
                O rastreamento abre em uma nova aba.
              </p>
            </div>
            <Tracking />
          </div>
        </section>

        {/* Quote form */}
        <section id="cotacao" className={s.section} aria-labelledby="pp-cotacao">
          <div className={`${s.container} ${s.quoteGrid}`}>
            <div className={s.quoteIntro}>
              <h2 id="pp-cotacao" className={s.h2}>Solicite sua cotação em dois passos.</h2>
              <p className={s.sectionLede}>
                Primeiro a rota e a carga, depois o contato. Ao final, a mensagem abre pronta no WhatsApp da equipe comercial.
                Peso, volumes e valor da nota ajudam, mas podem ser alinhados no atendimento.
              </p>
              <ul className={s.contactList}>
                <li><a href={WHATSAPP} className={s.contactLink} target="_blank" rel="noopener noreferrer"><MessageCircle size={20} aria-hidden="true" /> WhatsApp {PHONE}</a></li>
                <li><a href={PHONE_HREF} className={s.contactLink}><Phone size={20} aria-hidden="true" /> Ligar para {PHONE}</a></li>
                <li><a href={`mailto:${EMAIL}`} className={s.contactLink}><Mail size={20} aria-hidden="true" /> {EMAIL}</a></li>
              </ul>
            </div>
            <QuoteForm q={q} flash={flash} />
          </div>
        </section>

        {/* Segments */}
        <section className={`${s.section} ${s.segmentsSection}`} aria-labelledby="pp-segmentos">
          <div className={`${s.container} ${s.segmentsGrid}`}>
            <figure className={s.segmentsFigure}>
              <img src={MEDIA.cidade.src} alt={MEDIA.cidade.alt} width={MEDIA.cidade.w} height={MEDIA.cidade.h} loading="lazy" className={s.segmentsImg} />
              <figcaption className={s.caption}>Imagem ilustrativa.</figcaption>
            </figure>
            <div>
              <h2 id="pp-segmentos" className={s.h2}>Quem embarca carga com a RJ Lima.</h2>
              <ul className={s.segments}>
                {SEGMENTS.map((seg) => <li key={seg} className={s.segment}>{seg}</li>)}
              </ul>
              <a href="#cotacao" className={`${s.btn} ${s.btnRed}`}>Solicitar cotação <ArrowRight size={18} aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="duvidas" className={s.section} aria-labelledby="pp-duvidas">
          <div className={`${s.container} ${s.faqGrid}`}>
            <div>
              <h2 id="pp-duvidas" className={s.h2}>Perguntas frequentes</h2>
              <p className={s.sectionLede}>
                Não encontrou sua resposta?{' '}
                <a className={s.inlineLink} href={whatsappText('Olá! Tenho uma dúvida sobre o transporte com a RJ Lima.')} target="_blank" rel="noopener noreferrer">Fale com a equipe pelo WhatsApp</a>.
              </p>
            </div>
            <div className={s.faqList}>
              {FAQS.map(([question, answer]) => (
                <details key={question} className={s.faq}>
                  <summary className={s.faqSummary}>
                    <span>{question}</span>
                    <Plus size={22} aria-hidden="true" className={s.faqIcon} />
                  </summary>
                  <p className={s.faqAnswer}>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={`${s.container} ${s.footerGrid}`}>
          <div className={s.footerBrand}>
            <span className={s.logoPlate}>
              <img src={LOGO} alt="RJ Lima Transportes" width={LOGO_SIZE.width} height={LOGO_SIZE.height} className={s.footerLogo} loading="lazy" />
            </span>
            <p className={s.footerText}><MapPin size={18} aria-hidden="true" /> Três Corações, Sul de Minas, MG</p>
            <a href="#cotacao" className={`${s.btn} ${s.btnRed}`}>Solicitar cotação</a>
          </div>
          <div>
            <h2 className={s.footerH}>Contato</h2>
            <ul className={s.footerList}>
              <li><a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={s.footerLink}><MessageCircle size={18} aria-hidden="true" /> WhatsApp {PHONE}</a></li>
              <li><a href={PHONE_HREF} className={s.footerLink}><Phone size={18} aria-hidden="true" /> {PHONE}</a></li>
              <li><a href={`mailto:${EMAIL}`} className={s.footerLink}><Mail size={18} aria-hidden="true" /> {EMAIL}</a></li>
              <li><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className={s.footerLink}><ExternalLink size={18} aria-hidden="true" /> Instagram @rjlimatransportes</a></li>
            </ul>
          </div>
          <div>
            <h2 className={s.footerH}>Consultas</h2>
            <ul className={s.footerList}>
              <li><a href={TRACKING_URL} className={s.footerLink}>Rastrear entrega</a></li>
              <li><a href={CITIES_URL} className={s.footerLink}>Cidades atendidas e prazos</a></li>
              <li><a href="#servicos" className={s.footerLink}>Serviços</a></li>
              <li><a href="#duvidas" className={s.footerLink}>Perguntas frequentes</a></li>
            </ul>
          </div>
        </div>
        <p className={`${s.container} ${s.footerSmall}`}>
          Imagens e vídeo desta página são ilustrativos. Prazos são de referência e confirmados pela equipe para cada rota.
        </p>
      </footer>
    </div>
  );
}
