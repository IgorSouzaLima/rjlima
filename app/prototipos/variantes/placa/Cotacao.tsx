'use client';
// Two-step quote form (route and cargo, then contact) that ends in a prefilled WhatsApp message.
import { useEffect, useRef, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Phone } from 'lucide-react';
import { MEDIA, PHONE, PHONE_HREF, SERVICES, useQuote, type Quote } from '../../dados';
import s from './estilo.module.css';

type Q = ReturnType<typeof useQuote>;

function Field({ q, id, label, optional, children }: { q: Q; id: keyof Quote; label: string; optional?: boolean; children?: ReactNode }) {
  const err = q.errors[id];
  return (
    <div className={s.field}>
      <label htmlFor={`pl-${id}`} className={s.label}>
        {label}{optional && <span className={s.optional}> (opcional)</span>}
      </label>
      {children ?? (
        <input
          id={`pl-${id}`} className={s.input} value={q.quote[id]}
          aria-invalid={err ? true : undefined} aria-describedby={err ? `pl-${id}-err` : undefined}
          onChange={(e) => q.update(id, e.target.value)}
          {...inputProps[id]}
        />
      )}
      {err && <p id={`pl-${id}-err`} className={s.error}><span className={s.warnMark} aria-hidden />{err}</p>}
    </div>
  );
}

const inputProps: Partial<Record<keyof Quote, InputHTMLAttributes<HTMLInputElement>>> = {
  origin: { placeholder: 'Ex.: Três Corações / MG', autoComplete: 'off' },
  destination: { placeholder: 'Ex.: Pouso Alegre / MG', autoComplete: 'off' },
  cargo: { placeholder: 'Ex.: caixas de peças automotivas' },
  weight: { inputMode: 'decimal', placeholder: 'Ex.: 350' },
  volumes: { inputMode: 'numeric', placeholder: 'Ex.: 12' },
  invoice: { inputMode: 'decimal', placeholder: 'Ex.: R$ 8.500,00' },
  name: { autoComplete: 'name' },
  company: { autoComplete: 'organization' },
  phone: { type: 'tel', autoComplete: 'tel', placeholder: '(35) 99999-9999' },
};

export function Cotacao({ q }: { q: Q }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const prev = useRef(`${q.step}-${q.ready}`);

  // Move focus to the step heading only when the step (or ready state) actually changes.
  useEffect(() => {
    const now = `${q.step}-${q.ready}`;
    if (prev.current === now) return;
    prev.current = now;
    heading.current?.focus();
  }, [q.step, q.ready]);

  const onSubmit = (e: FormEvent) => {
    const bad = q.submit(e);
    if (bad) document.getElementById(`pl-${bad}`)?.focus();
  };

  const summary: [string, string][] = [
    ['Origem', q.quote.origin], ['Destino', q.quote.destination], ['Serviço', q.quote.service], ['Carga', q.quote.cargo],
    ['Peso', q.quote.weight ? `${q.quote.weight} kg` : 'A confirmar'], ['Volumes', q.quote.volumes || 'A confirmar'],
    ['Valor da NF', q.quote.invoice || 'A confirmar'], ['Contato', `${q.quote.name}, ${q.quote.company}`], ['Telefone', q.quote.phone],
  ];

  return (
    <section id="cotacao" className={`${s.section} ${s.quote}`} aria-labelledby="pl-quote-title">
      <div className={`${s.wrap} ${s.quoteGrid}`}>
        <div className={s.quoteAside}>
          <div className={`${s.panel} ${s.quoteSign}`}>
            <h2 id="pl-quote-title" className={s.quoteTitle}>Cotação de frete</h2>
            <p>Dois passos: rota e carga, depois o seu contato. No final, a mensagem sai pronta para o WhatsApp da equipe.</p>
            <p>Peso, volumes e valor da nota ajudam a preparar uma cotação mais precisa. Se ainda não tiver esses dados, deixe em branco.</p>
            <a href={PHONE_HREF} className={s.plateBtn}><Phone size={18} aria-hidden /> Prefere ligar? {PHONE}</a>
          </div>
          <img src={MEDIA.doca.src} width={MEDIA.doca.w} height={MEDIA.doca.h} alt={MEDIA.doca.alt} className={s.quoteImg} loading="lazy" />
        </div>

        <div className={s.formPlate} id="pl-form">
          <ol className={s.steps} aria-label="Etapas da cotação">
            <li aria-current={q.step === 1 ? 'step' : undefined}><b>1</b> Rota e carga</li>
            <li aria-current={q.step === 2 ? 'step' : undefined}><b>2</b> Contato</li>
          </ol>

          {q.ready ? (
            <div className={s.ready}>
              <h3 ref={heading} tabIndex={-1} className={s.formHead}>Pedido pronto para envio</h3>
              <dl className={s.summary}>
                {summary.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
              <a href={q.whatsappHref} target="_blank" rel="noopener noreferrer" className={`${s.ctaRed} ${s.ctaBig} ${s.ctaFull}`}>
                Enviar pelo WhatsApp
              </a>
              <div className={s.formRow}>
                <button type="button" className={s.linkBtn} onClick={q.back}>Corrigir dados</button>
                <button type="button" className={s.linkBtn} onClick={q.reset}>Começar nova cotação</button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <h3 ref={heading} tabIndex={-1} className={s.formHead}>
                {q.step === 1 ? 'Para onde vai a carga?' : 'Como a equipe fala com você?'}
              </h3>
              {q.step === 1 ? (
                <div className={s.fields}>
                  <Field q={q} id="origin" label="Origem (cidade de coleta)" />
                  <Field q={q} id="destination" label="Destino (cidade de entrega)" />
                  <div className={s.fieldWide}><Field q={q} id="cargo" label="O que você vai transportar?" /></div>
                  <div className={s.fieldWide}>
                    <Field q={q} id="service" label="Serviço">
                      <select id="pl-service" className={s.input} value={q.quote.service} onChange={(e) => q.update('service', e.target.value)}>
                        {SERVICES.map((sv) => <option key={sv.id} value={sv.title}>{sv.title}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field q={q} id="weight" label="Peso aproximado (kg)" optional />
                  <Field q={q} id="volumes" label="Volumes" optional />
                  <div className={s.fieldWide}><Field q={q} id="invoice" label="Valor da nota fiscal" optional /></div>
                </div>
              ) : (
                <div className={s.fields}>
                  <Field q={q} id="name" label="Seu nome" />
                  <Field q={q} id="company" label="Empresa" />
                  <div className={s.fieldWide}><Field q={q} id="phone" label="Telefone com DDD" /></div>
                  <div className={s.fieldWide}>
                    <Field q={q} id="notes" label="Observações" optional>
                      <textarea id="pl-notes" className={`${s.input} ${s.textarea}`} rows={3} value={q.quote.notes}
                        placeholder="Janela de coleta, tipo de embalagem, frequência"
                        onChange={(e) => q.update('notes', e.target.value)} />
                    </Field>
                  </div>
                </div>
              )}
              <div className={s.formRow}>
                {q.step === 2 && (
                  <button type="button" className={s.linkBtn} onClick={q.back}>
                    <ArrowLeft size={18} aria-hidden /> Voltar
                  </button>
                )}
                <button type="submit" className={`${s.ctaRed} ${s.ctaBig} ${s.submit}`}>
                  {q.step === 1 ? 'Continuar para contato' : 'Revisar pedido'} <ArrowRight size={20} strokeWidth={2.5} className={s.nudge} aria-hidden />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
