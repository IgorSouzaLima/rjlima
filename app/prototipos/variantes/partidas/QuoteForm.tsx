'use client';
// Two-step quote form on top of the shared useQuote flow. Plain labels, inline errors, focus on the first invalid field.
import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Check, ChevronLeft, MessageCircle } from 'lucide-react';
import { SERVICES, type Quote, type useQuote } from '../../dados';
import s from './estilo.module.css';

type Q = ReturnType<typeof useQuote>;

function Field({ q, id, label, hint, children }: { q: Q; id: keyof Quote; label: string; hint?: string; children?: ReactNode }) {
  const err = q.errors[id];
  return (
    <div className={s.field}>
      <label htmlFor={`q-${id}`} className={s.label}>{label}</label>
      {children ?? (
        <input
          id={`q-${id}`}
          className={s.input}
          value={q.quote[id]}
          onChange={(e) => q.update(id, e.target.value)}
          aria-invalid={err ? true : undefined}
          aria-describedby={[err ? `q-${id}-erro` : '', hint ? `q-${id}-dica` : ''].filter(Boolean).join(' ') || undefined}
        />
      )}
      {hint && <p id={`q-${id}-dica`} className={s.hint}>{hint}</p>}
      {err && <p id={`q-${id}-erro`} className={s.error}>{err}</p>}
    </div>
  );
}

export function QuoteForm({ q, flash }: { q: Q; flash: number }) {
  const destRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Flash the destination field when a city arrives from the board.
  useEffect(() => {
    if (!flash || !destRef.current) return;
    const el = destRef.current;
    el.classList.remove(s.flash);
    void el.offsetWidth;
    el.classList.add(s.flash);
  }, [flash]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (q.ready) summaryRef.current?.focus();
  }, [q.ready]);

  const onSubmit = (e: FormEvent) => {
    const wasStep = q.step;
    const invalid = q.submit(e);
    if (invalid) document.getElementById(`q-${invalid}`)?.focus();
    else if (wasStep === 1) window.setTimeout(() => document.getElementById('q-name')?.focus(), 0);
  };

  return (
    <form className={s.pass} onSubmit={onSubmit} noValidate aria-labelledby="pp-form-titulo">
      <div className={s.passHead}>
        <h3 id="pp-form-titulo" className={s.passTitle}>
          {q.step === 1 ? 'Rota e carga' : 'Seus dados de contato'}
        </h3>
        <ol className={s.steps} aria-label="Etapas">
          <li className={s.stepItem} data-state={q.step === 1 ? 'current' : 'done'} aria-current={q.step === 1 ? 'step' : undefined}>
            <span className={s.stepDot}>{q.step === 2 ? <Check size={14} aria-hidden="true" /> : '1'}</span> Rota
          </li>
          <li className={s.stepItem} data-state={q.step === 2 ? 'current' : 'todo'} aria-current={q.step === 2 ? 'step' : undefined}>
            <span className={s.stepDot}>2</span> Contato
          </li>
        </ol>
      </div>

      {q.step === 1 ? (
        <div className={s.passBody} key="s1">
          <div className={s.route}>
            <Field q={q} id="origin" label="Cidade de coleta (origem)" />
            <div ref={destRef} className={s.flashWrap}>
              <Field q={q} id="destination" label="Cidade de entrega (destino)" />
            </div>
          </div>
          <Field q={q} id="service" label="Serviço">
            <select id="q-service" className={s.input} value={q.quote.service} onChange={(e) => q.update('service', e.target.value)}>
              {SERVICES.map((svc) => <option key={svc.id} value={svc.title}>{svc.title}</option>)}
            </select>
          </Field>
          <Field q={q} id="cargo" label="O que você precisa transportar" hint="Exemplo: 12 caixas de peças automotivas." />
          <div className={s.triple}>
            <Field q={q} id="weight" label="Peso (kg, opcional)">
              <input
                id="q-weight"
                className={s.input}
                inputMode="decimal"
                value={q.quote.weight}
                onChange={(e) => q.update('weight', e.target.value)}
                aria-invalid={q.errors.weight ? true : undefined}
                aria-describedby={q.errors.weight ? 'q-weight-erro' : undefined}
              />
            </Field>
            <Field q={q} id="volumes" label="Volumes (opcional)">
              <input id="q-volumes" className={s.input} inputMode="numeric" value={q.quote.volumes} onChange={(e) => q.update('volumes', e.target.value)} />
            </Field>
            <Field q={q} id="invoice" label="Valor da NF (opcional)">
              <input id="q-invoice" className={s.input} inputMode="decimal" value={q.quote.invoice} onChange={(e) => q.update('invoice', e.target.value)} />
            </Field>
          </div>
          <div className={s.passActions}>
            <button type="submit" className={`${s.btn} ${s.btnRed} ${s.btnLg}`}>Continuar <ArrowRight size={20} aria-hidden="true" /></button>
          </div>
        </div>
      ) : (
        <div className={s.passBody} key="s2">
          <p className={s.passRoute}>
            <span>{q.quote.origin}</span> <ArrowRight size={18} aria-hidden="true" /> <span>{q.quote.destination}</span>
            <span className={s.passRouteSvc}>{q.quote.service}</span>
          </p>
          <div className={s.pair}>
            <Field q={q} id="name" label="Seu nome" />
            <Field q={q} id="company" label="Empresa" />
          </div>
          <Field q={q} id="phone" label="Telefone com DDD">
            <input
              id="q-phone"
              className={s.input}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={q.quote.phone}
              onChange={(e) => q.update('phone', e.target.value)}
              aria-invalid={q.errors.phone ? true : undefined}
              aria-describedby={q.errors.phone ? 'q-phone-erro' : undefined}
            />
          </Field>
          <Field q={q} id="notes" label="Observações (opcional)">
            <textarea id="q-notes" className={`${s.input} ${s.textarea}`} rows={3} value={q.quote.notes} onChange={(e) => q.update('notes', e.target.value)} />
          </Field>

          {q.ready ? (
            <div className={s.ready} ref={summaryRef} tabIndex={-1}>
              <p className={s.readyText}>Pedido pronto. Confira os dados e envie a mensagem para a equipe comercial.</p>
              <a href={q.whatsappHref} target="_blank" rel="noopener noreferrer" className={`${s.btn} ${s.btnRed} ${s.btnLg} ${s.btnBlock}`}>
                <MessageCircle size={20} aria-hidden="true" /> Enviar pelo WhatsApp
              </a>
            </div>
          ) : null}

          <div className={s.passActions}>
            <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={q.back}>
              <ChevronLeft size={20} aria-hidden="true" /> Voltar
            </button>
            {!q.ready && <button type="submit" className={`${s.btn} ${s.btnRed} ${s.btnLg}`}>Revisar pedido <ArrowRight size={20} aria-hidden="true" /></button>}
          </div>
        </div>
      )}
      <p className={s.passNote}>A equipe confirma prazo, coleta e valores para cada rota antes de fechar o transporte.</p>
    </form>
  );
}
