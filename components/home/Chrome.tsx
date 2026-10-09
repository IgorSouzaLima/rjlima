'use client';
// Header and footer of the Baú livery, shared by the home page and the inner pages.
// `base` is '' on the home page (in-page anchors) and '/' elsewhere (anchors on the home page).
import { useEffect, useState, type MouseEvent } from 'react';
import { Menu, MessageCircle, Phone, X } from 'lucide-react';
import { CITIES_PDF, CITIES_URL, EMAIL, INSTAGRAM, LOGO, LOGO_SIZE, PHONE, PHONE_HREF, WHATSAPP } from '../../lib/site-data';
import s from './estilo.module.css';

const NAV = [
  ['Serviços', '#servicos'],
  ['Cidades', '#cidades'],
  ['Cotação', '#cotacao'],
  ['Rastreio', '#rastreio'],
  ['Dúvidas', '#duvidas'],
] as const;

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function goTo(id: string, focusId?: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const instant = reduced();
  el.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' });
  if (!focusId) return;
  // Step 2 of the quote has no origin field, so fall back to the first field the section shows.
  const focus = () => (document.getElementById(focusId) ?? el.querySelector<HTMLElement>('input, select, textarea'))?.focus({ preventScroll: true });
  if (instant) { focus(); return; }
  // Focus once the smooth scroll settles; the timeout covers browsers without `scrollend` and scrolls that never start.
  let done = false;
  const finish = () => { if (done) return; done = true; window.removeEventListener('scrollend', finish); focus(); };
  window.addEventListener('scrollend', finish);
  window.setTimeout(finish, 1200);
}

/** Every "Solicitar cotação" lands on the first field of the form, not on the section heading. Elsewhere it is a plain link. */
export const toQuote = (e: MouseEvent<HTMLAnchorElement>) => {
  if (!document.getElementById('cotacao')) return;
  e.preventDefault();
  goTo('cotacao', 'bau-origin');
};

export function Header({ base = '' }: { base?: '' | '/' }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <a href={base ? '/' : '#topo'} className={s.logoLink} aria-label="RJ Lima Transportes, início">
          <img src={LOGO} width={LOGO_SIZE.width} height={LOGO_SIZE.height} alt="RJ Lima Transportes" className={s.logo} />
        </a>
        <nav className={s.nav} aria-label={base ? 'Seções do site' : 'Seções da página'}>
          {NAV.map(([label, href]) => <a key={href} href={base + href} className={s.navLink}>{label}</a>)}
        </nav>
        <a href={PHONE_HREF} className={s.headerPhone}><Phone aria-hidden="true" size={16} /> {PHONE}</a>
        <a href={`${base}#cotacao`} className={`${s.btn} ${s.btnRed} ${s.headerCta}`} onClick={toQuote}>Solicitar cotação</a>
        <button type="button" className={s.menuBtn} aria-expanded={open} aria-controls="bau-menu" onClick={() => setOpen((o) => !o)}>
          {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          <span className={s.srOnly}>{open ? 'Fechar menu' : 'Abrir menu'}</span>
        </button>
      </div>
      <div id="bau-menu" className={s.menu} hidden={!open}>
        <nav aria-label="Menu">
          {NAV.map(([label, href]) => <a key={href} href={base + href} className={s.menuLink} onClick={() => setOpen(false)}>{label}</a>)}
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={s.menuLink}><MessageCircle aria-hidden="true" size={18} /> WhatsApp</a>
          <a href={PHONE_HREF} className={s.menuLink}><Phone aria-hidden="true" size={18} /> {PHONE}</a>
        </nav>
      </div>
      <div className={s.tape} aria-hidden="true" />
    </header>
  );
}

export function Footer({ base = '' }: { base?: '' | '/' }) {
  return (
    <footer className={s.footer}>
      <div className={s.tape} aria-hidden="true" />
      <div className={`${s.inner} ${s.footGrid}`}>
        <div className={s.footBrand}>
          <span className={s.logoPlate}>
            <img src={LOGO} width={LOGO_SIZE.width} height={LOGO_SIZE.height} alt="RJ Lima Transportes" />
          </span>
          <p>Transporte rodoviário de cargas com base em Três Corações, Sul de Minas.</p>
          <a href={`${base}#cotacao`} className={`${s.btn} ${s.btnRed}`} onClick={toQuote}>Solicitar cotação</a>
        </div>
        <div>
          <h2 className={s.footHead}>Contato</h2>
          <ul className={s.footList}>
            <li><a href={WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp {PHONE}</a></li>
            <li><a href={PHONE_HREF}>Telefone {PHONE}</a></li>
            <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
            <li><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Instagram @rjlimatransportes</a></li>
          </ul>
        </div>
        <div>
          <h2 className={s.footHead}>Consultas</h2>
          <ul className={s.footList}>
            <li><a href={CITIES_URL}>Cidades atendidas</a></li>
            <li><a href={CITIES_PDF} download>Tabela de cidades em PDF</a></li>
            <li><a href={`${base}#rastreio`}>Rastrear entrega</a></li>
            <li><a href={`${base}#duvidas`}>Dúvidas frequentes</a></li>
          </ul>
        </div>
      </div>
      <div className={s.inner}>
        <p className={s.footNote}>Prazos são de referência e confirmados pela equipe para cada rota. © RJ Lima Transportes.</p>
      </div>
    </footer>
  );
}
