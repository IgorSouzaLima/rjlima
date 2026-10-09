'use client';
// Tracking entry styled as a ticket: 44-digit NF key in groups of four, opens the real tracking page in a new tab.
import { useState } from 'react';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { formatKey, onlyDigits, trackingHref, whatsappText } from '../../dados';
import s from './estilo.module.css';

export function Tracking() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const digits = onlyDigits(key).length;
  const groups = Array.from({ length: 11 }, (_, i) => Math.max(0, Math.min(4, digits - i * 4)));

  return (
    <div className={s.ticket}>
      <div className={s.ticketStub} aria-hidden="true">
        <span className={s.ticketStubLabel}>Rastreio</span>
        <span className={s.ticketStubValue}>NF-e</span>
      </div>
      <div className={s.ticketBody}>
        <label htmlFor="pp-chave" className={s.label}>Chave de acesso da nota fiscal</label>
        <input
          id="pp-chave"
          className={`${s.input} ${s.keyInput}`}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Somente números, 44 dígitos"
          value={formatKey(key)}
          onChange={(e) => { setKey(onlyDigits(e.target.value)); setError(''); }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'pp-chave-erro pp-chave-contador' : 'pp-chave-contador'}
        />
        <div className={s.keyMeter} aria-hidden="true">
          {groups.map((g, i) => <span key={i} className={s.keyGroup} data-fill={g} />)}
        </div>
        <p id="pp-chave-contador" className={s.hint}>{digits} de 44 dígitos</p>
        {error && <p id="pp-chave-erro" className={s.error} role="alert">{error}</p>}
        <div className={s.ticketActions}>
          <a
            href={trackingHref(key)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${s.btn} ${s.btnInk}`}
            onClick={(e) => {
              if (digits !== 44) {
                e.preventDefault();
                setError(digits === 0
                  ? 'Digite a chave de acesso para rastrear a entrega.'
                  : `A chave tem 44 dígitos. Faltam ${44 - digits}.`);
                document.getElementById('pp-chave')?.focus();
              }
            }}
          >
            Rastrear entrega <ExternalLink size={18} aria-hidden="true" />
          </a>
          <a
            href={whatsappText('Olá! Preciso de ajuda para rastrear uma entrega da RJ Lima.')}
            target="_blank"
            rel="noopener noreferrer"
            className={s.inlineLink}
          >
            <MessageCircle size={18} aria-hidden="true" /> Não encontrou a chave? Fale pelo WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
