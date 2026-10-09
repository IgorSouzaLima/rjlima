'use client';
// Tracking entry: 44-digit NF access key, opens the real tracking page in a new tab.
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { MEDIA, formatKey, onlyDigits, trackingHref, whatsappText } from '../../dados';
import s from './estilo.module.css';

export function Rastreio() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const digits = onlyDigits(key).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (digits !== 44) {
      setError(digits === 0
        ? 'Informe a chave de acesso da nota fiscal.'
        : `A chave tem 44 dígitos. Faltam ${44 - digits}.`);
      document.getElementById('pl-chave')?.focus();
      return;
    }
    setError('');
    window.open(trackingHref(key), '_blank', 'noopener');
  };

  return (
    <section id="rastreio" className={`${s.section} ${s.track}`} aria-labelledby="pl-track-title">
      <div className={`${s.wrap} ${s.trackGrid}`}>
        <img src={MEDIA.noite.src} width={MEDIA.noite.w} height={MEDIA.noite.h} alt={MEDIA.noite.alt} className={s.trackImg} loading="lazy" />
        <form className={s.trackPlate} onSubmit={submit} noValidate>
          <h2 id="pl-track-title" className={s.h2}>Rastrear entrega</h2>
          <p className={s.intro}>Use a chave de acesso da nota fiscal. Ela aparece no DANFE, próxima ao código de barras.</p>
          <label htmlFor="pl-chave" className={s.label}>Chave de acesso (44 dígitos)</label>
          <input
            id="pl-chave" className={`${s.input} ${s.keyInput}`} inputMode="numeric" autoComplete="off"
            placeholder="Digite os 44 números da chave"
            value={key} aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'pl-chave-err pl-chave-count' : 'pl-chave-count'}
            onChange={(e) => { setKey(formatKey(e.target.value)); setError(''); }}
          />
          <p id="pl-chave-count" className={s.count}>{digits} de 44 dígitos</p>
          {error && <p id="pl-chave-err" className={s.error}><span className={s.warnMark} aria-hidden />{error}</p>}
          <div className={s.trackActions}>
            <button type="submit" className={s.greenBtn}>
              Rastrear <ArrowUpRight size={18} strokeWidth={2.5} className={s.nudgeUp} aria-hidden />
              <span className={s.srOnly}>(abre em nova aba)</span>
            </button>
            <a className={s.textLink} target="_blank" rel="noopener noreferrer"
              href={whatsappText('Olá! Preciso de ajuda para rastrear uma entrega da RJ Lima.')}>
              <MessageCircle size={18} aria-hidden /> Sem a chave? Fale com a equipe
            </a>
          </div>
        </form>
      </div>
    </section>
  );
}
