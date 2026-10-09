'use client';
// The real two-step quote flow on cab black: route and cargo, then contact, then a prefilled WhatsApp message.
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { CITY_OPTIONS, SERVICES, cleanWeight, type Quote, type useQuote } from '../../lib/site-data';
import s from './estilo.module.css';

type QuoteApi = ReturnType<typeof useQuote>;
const fid = (k: keyof Quote) => `bau-${k}`;

// `wide` spans both columns of the two-column layout, so no field is left alone on its row.
function Field({ api, k, label, hint, wide, children }: { api: QuoteApi; k: keyof Quote; label: string; hint?: string; wide?: boolean; children?: ReactNode }) {
  const err = api.errors[k];
  return (
    <div className={wide ? `${s.field} ${s.fieldWide}` : s.field}>
      <label htmlFor={fid(k)} className={s.fieldLabel}>{label}</label>
      {children}
      {hint && !err && <p id={`${fid(k)}-hint`} className={s.fieldHint}>{hint}</p>}
      {err && (
        <p id={`${fid(k)}-err`} className={s.fieldError}>
          <AlertCircle aria-hidden="true" size={16} /> {err}
        </p>
      )}
    </div>
  );
}

// What the WhatsApp message will say, in the order the team reads it; empty optional fields say so instead of vanishing.
const review = (q: Quote): [string, string][] => {
  const weight = cleanWeight(q.weight);
  return [
    ['Rota', `${q.origin} → ${q.destination}`],
    ['Serviço', q.service],
    ['Carga', q.cargo],
    ['Peso', weight ? `${weight} kg` : 'A confirmar'],
    ['Volumes', q.volumes || 'A confirmar'],
    ['Valor da NF', q.invoice || 'A confirmar'],
    ['Contato', `${q.name}, ${q.company}, ${q.phone}`],
    ...(q.notes.trim() ? [['Observações', q.notes.trim()] as [string, string]] : []),
  ];
};

export function Cotacao({ api }: { api: QuoteApi }) {
  const { quote, step, errors, ready, update } = api;
  const input = (k: keyof Quote, extra: Record<string, unknown> = {}, hint = false) => ({
    id: fid(k),
    name: k,
    value: quote[k],
    onChange: (e: { target: { value: string } }) => update(k, e.target.value),
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `${fid(k)}-err` : hint ? `${fid(k)}-hint` : undefined,
    className: s.input,
    ...extra,
  });

  // Numeric fields step with the arrow buttons and with ArrowUp / ArrowDown. Stepping down to zero clears the field,
  // which the message reads as "A confirmar".
  const bump = (k: 'weight' | 'volumes', dir: 1 | -1, step: number) => {
    const n = Number.parseFloat(cleanWeight(quote[k]).replace(',', '.'));
    const next = Math.max(0, Math.round(((Number.isNaN(n) ? 0 : n) + dir * step) / step) * step);
    update(k, next ? String(next) : '');
  };
  const stepper = (k: 'weight' | 'volumes', label: string, step: number, extra: Record<string, unknown>) => {
    const n = Number.parseFloat(cleanWeight(quote[k]).replace(',', '.'));
    return (
      <div className={s.stepper}>
        <input {...input(k, {
          ...extra,
          role: 'spinbutton', 'aria-valuemin': 0, 'aria-valuenow': Number.isNaN(n) ? undefined : n,
          onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            e.preventDefault();
            bump(k, e.key === 'ArrowUp' ? 1 : -1, step);
          },
        })} />
        {/* Out of the tab order: the arrow keys do the same from the field itself. */}
        <span className={s.stepBtns}>
          <button type="button" tabIndex={-1} aria-label={`Aumentar ${label}`} onClick={() => bump(k, 1, step)}><ChevronUp aria-hidden="true" size={18} /></button>
          <button type="button" tabIndex={-1} aria-label={`Diminuir ${label}`} onClick={() => bump(k, -1, step)}><ChevronDown aria-hidden="true" size={18} /></button>
        </span>
      </div>
    );
  };

  const onSubmit = (e: FormEvent) => {
    const bad = api.submit(e);
    if (bad) document.getElementById(fid(bad))?.focus();
    else if (step === 1) requestAnimationFrame(() => document.getElementById(fid('name'))?.focus());
    else requestAnimationFrame(() => document.getElementById('bau-send')?.focus());
  };

  return (
    <form className={s.quoteForm} onSubmit={onSubmit} noValidate aria-labelledby="bau-quote-title">
      <ol className={s.steps}>
        <li className={s.stepItem} data-on="" aria-current={step === 1 ? 'step' : undefined}>
          <span className={s.stepTape} aria-hidden="true" />
          <span>1. Rota e carga</span>
        </li>
        <li className={s.stepItem} data-on={step === 2 ? '' : undefined} aria-current={step === 2 ? 'step' : undefined}>
          <span className={s.stepTape} aria-hidden="true" />
          <span>2. Contato</span>
        </li>
      </ol>

      {step === 1 && (
        <div className={s.formGrid} key="step1">
          <Field api={api} k="origin" label="Cidade de coleta">
            <input {...input('origin', { autoComplete: 'address-level2', list: 'bau-city-options', placeholder: 'Ex.: Três Corações / MG' })} />
          </Field>
          <Field api={api} k="destination" label="Cidade de entrega">
            <input {...input('destination', { autoComplete: 'off', list: 'bau-city-options', placeholder: 'Ex.: Varginha / MG' })} />
          </Field>
          <Field api={api} k="service" label="Serviço">
            <select {...input('service')}>
              {SERVICES.map((sv) => <option key={sv.id} value={sv.title}>{sv.title}</option>)}
            </select>
          </Field>
          <Field api={api} k="cargo" label="O que será transportado">
            <input {...input('cargo', { placeholder: 'Ex.: caixas de peças, sacaria, móveis' })} />
          </Field>
          <Field api={api} k="weight" label="Peso aproximado em kg (opcional)">
            {stepper('weight', 'peso em 10 kg', 10, { inputMode: 'decimal', placeholder: 'Ex.: 350' })}
          </Field>
          <Field api={api} k="volumes" label="Volumes (opcional)">
            {stepper('volumes', 'volumes', 1, { inputMode: 'numeric', placeholder: 'Ex.: 12' })}
          </Field>
          <Field api={api} k="invoice" wide label="Valor da nota fiscal (opcional)" hint="Ajuda a equipe a preparar uma cotação mais precisa.">
            <input {...input('invoice', { inputMode: 'decimal', placeholder: 'Ex.: R$ 8.000' }, true)} />
          </Field>
          {/* Suggests the 168 cities of the table while still accepting any other city. */}
          <datalist id="bau-city-options">
            {CITY_OPTIONS.map((c) => <option key={c} value={c} />)}
          </datalist>
          <div className={s.formActions}>
            <button type="submit" className={`${s.btn} ${s.btnRed} ${s.btnWide}`}>
              Continuar para contato <ArrowRight aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={s.formGrid} key="step2">
          <p className={s.routeSummary}>
            <span>{quote.origin}</span> <ArrowRight aria-hidden="true" size={16} /> <span>{quote.destination}</span>
            <span className={s.routeService}>{quote.service}</span>
          </p>
          <Field api={api} k="name" wide label="Seu nome">
            <input {...input('name', { autoComplete: 'name' })} />
          </Field>
          <Field api={api} k="company" label="Empresa">
            <input {...input('company', { autoComplete: 'organization' })} />
          </Field>
          <Field api={api} k="phone" label="Telefone com DDD">
            <input {...input('phone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '(35) 90000-0000' })} />
          </Field>
          <Field api={api} k="notes" wide label="Observações (opcional)">
            <textarea {...input('notes', { rows: 3, placeholder: 'Janela de coleta, dimensões, recorrência' })} />
          </Field>

          {!ready ? (
            <div className={s.formActions}>
              <button type="button" className={`${s.btn} ${s.btnGhostDark}`} onClick={api.back}>
                <ArrowLeft aria-hidden="true" size={18} /> Voltar
              </button>
              <button type="submit" className={`${s.btn} ${s.btnRed} ${s.btnGrow}`}>
                Revisar pedido <ArrowRight aria-hidden="true" size={18} />
              </button>
            </div>
          ) : (
            <div className={s.readyBox} role="status">
              <p className={s.readyTitle}>Confira o pedido.</p>
              <p className={s.readyText}>É esta a mensagem que abre no WhatsApp da equipe comercial. Ao enviar, a conversa sobre a cotação segue por lá.</p>
              <dl className={s.review}>
                {review(quote).map(([term, value]) => (
                  <div key={term} className={s.reviewRow}><dt>{term}</dt><dd>{value}</dd></div>
                ))}
              </dl>
              <div className={s.formActions}>
                <a id="bau-send" className={`${s.btn} ${s.btnRed} ${s.btnGrow}`} href={api.whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" size={18} /> Enviar pelo WhatsApp
                </a>
                <button type="button" className={`${s.btn} ${s.btnGhostDark}`} onClick={api.back}>Editar dados</button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
