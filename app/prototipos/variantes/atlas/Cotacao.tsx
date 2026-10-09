'use client';
// Quote section: the real two-step flow from dados.ts beside a small atlas inset that traces the route being quoted.
import { useEffect, useRef, type ReactNode } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, MessageCircle, Phone, RotateCcw } from 'lucide-react';
import { CITIES, HUB, PHONE, PHONE_HREF, SERVICES, WHATSAPP, type Quote, type useQuote } from '../../dados';
import AtlasMap from './AtlasMap';
import { cityFromText } from './geo';
import s from './estilo.module.css';

type Q = ReturnType<typeof useQuote>;

function Field({ id, label, hint, error, children, wide }: { id: keyof Quote; label: string; hint?: string; error?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`${s.field} ${wide ? s.fieldWide : ''}`}>
      <label htmlFor={`q-${id}`}>{label}{hint && <small>{hint}</small>}</label>
      {children}
      {error && <span id={`q-${id}-err`} className={s.fieldError}><AlertCircle size={15} aria-hidden="true" />{error}</span>}
    </div>
  );
}

export default function Cotacao({ q }: { q: Q }) {
  const { quote, step, errors, ready, update, submit, back, reset, whatsappHref } = q;
  const dest = cityFromText(quote.destination);
  const firstStep2 = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (ready) reviewRef.current?.focus();
    else if (step === 2) firstStep2.current?.focus();
  }, [step, ready]);

  const input = (id: keyof Quote, extra: Record<string, unknown> = {}) => ({
    id: `q-${id}`,
    name: id,
    value: quote[id],
    onChange: (e: { target: { value: string } }) => update(id, e.target.value),
    'aria-invalid': errors[id] ? true : undefined,
    'aria-describedby': errors[id] ? `q-${id}-err` : undefined,
    ...extra,
  });

  const onSubmit = (e: React.FormEvent) => {
    const bad = submit(e);
    if (bad) document.getElementById(`q-${bad}`)?.focus();
  };

  return (
    <section id="cotacao" className={s.quote} aria-labelledby="cotacao-t">
      <div className={s.quoteAside}>
        <h2 id="cotacao-t" className={s.h2}>Solicite uma cotação</h2>
        <p className={s.lede}>Duas etapas: primeiro a rota e a carga, depois o seu contato. Ao final, o pedido abre pronto para envio no WhatsApp da equipe comercial.</p>
        <figure className={s.miniPlate}>
          <AtlasMap mode="mini" selected={dest} onSelect={(c) => update('destination', `${c.city} / MG`)} label="Mapa da rota da cotação, a partir de Três Corações" />
          <figcaption>
            {dest && dest !== HUB
              ? <>De {HUB.city} para <strong>{dest.city}</strong>: {dest.days} dias úteis de prazo de referência. A equipe confirma prazo e coleta para cada rota.</>
              : <>Digite um destino atendido em Minas Gerais e a rota aparece no mapa. Outros destinos também podem ser consultados com a equipe.</>}
          </figcaption>
        </figure>
        <div className={s.direct}>
          <a href={WHATSAPP} target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden="true" />Prefere conversar? Fale pelo WhatsApp</a>
          <a href={PHONE_HREF}><Phone size={18} aria-hidden="true" />{PHONE}</a>
        </div>
      </div>

      <div className={s.formSheet}>
        <div className={s.formHead}>
          <p className={s.stepLabel} aria-live="polite">{ready ? 'Pedido pronto para envio' : `Etapa ${step} de 2: ${step === 1 ? 'rota e carga' : 'seus dados de contato'}`}</p>
          <ol className={s.steps} aria-hidden="true"><li data-on={true} /><li data-on={step === 2 || undefined} /></ol>
        </div>

        {ready ? (
          <div className={s.review}>
            <h3 ref={reviewRef} tabIndex={-1} className={s.h3}>Confira e envie o pedido</h3>
            <p className={s.routeLine}><span>{quote.origin}</span><ArrowRight size={18} aria-hidden="true" /><span>{quote.destination}</span></p>
            <dl>
              <div><dt>Serviço</dt><dd>{quote.service}</dd></div>
              <div><dt>Carga</dt><dd>{quote.cargo}</dd></div>
              <div><dt>Peso</dt><dd>{quote.weight ? `${quote.weight} kg` : 'A confirmar'}</dd></div>
              <div><dt>Volumes</dt><dd>{quote.volumes || 'A confirmar'}</dd></div>
              <div><dt>Valor da NF</dt><dd>{quote.invoice || 'A confirmar'}</dd></div>
              <div><dt>Contato</dt><dd>{quote.name}, {quote.company}, {quote.phone}</dd></div>
            </dl>
            <a className={`${s.btn} ${s.btnRed} ${s.btnFull}`} href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle size={19} aria-hidden="true" />Enviar pelo WhatsApp</a>
            <div className={s.reviewActions}>
              <button type="button" className={s.textBtn} onClick={back}><ArrowLeft size={16} aria-hidden="true" />Editar pedido</button>
              <button type="button" className={s.textBtn} onClick={reset}><RotateCcw size={16} aria-hidden="true" />Começar outro pedido</button>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={onSubmit} className={s.form}>
            {step === 1 ? (
              <div className={s.formGrid}>
                <Field id="origin" label="Cidade de coleta" error={errors.origin}>
                  <input {...input('origin', { autoComplete: 'address-level2', placeholder: 'Ex.: Três Corações / MG', list: 'atlas-cidades' })} />
                </Field>
                <Field id="destination" label="Cidade de entrega" error={errors.destination}>
                  <input {...input('destination', { placeholder: 'Ex.: Varginha / MG', list: 'atlas-cidades' })} />
                </Field>
                <Field id="service" label="Serviço" wide>
                  <select {...input('service')}>
                    {SERVICES.map((sv) => <option key={sv.id} value={sv.title}>{sv.title}</option>)}
                  </select>
                </Field>
                <Field id="cargo" label="O que vai ser transportado" error={errors.cargo} wide>
                  <input {...input('cargo', { placeholder: 'Ex.: caixas de peças, sacaria, móveis' })} />
                </Field>
                <div className={s.formTrio}>
                  <Field id="weight" label="Peso (kg)" hint="opcional" error={errors.weight}>
                    <input {...input('weight', { inputMode: 'decimal', placeholder: 'Ex.: 350' })} />
                  </Field>
                  <Field id="volumes" label="Volumes" hint="opcional">
                    <input {...input('volumes', { inputMode: 'numeric', placeholder: 'Ex.: 12' })} />
                  </Field>
                  <Field id="invoice" label="Valor da NF" hint="opcional">
                    <input {...input('invoice', { inputMode: 'decimal', placeholder: 'Ex.: R$ 8.000' })} />
                  </Field>
                </div>
              </div>
            ) : (
              <div className={s.formGrid}>
                <Field id="name" label="Seu nome" error={errors.name}>
                  <input ref={firstStep2} {...input('name', { autoComplete: 'name' })} />
                </Field>
                <Field id="company" label="Empresa" error={errors.company}>
                  <input {...input('company', { autoComplete: 'organization' })} />
                </Field>
                <Field id="phone" label="Telefone com DDD" error={errors.phone} wide>
                  <input {...input('phone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '(35) 99999-9999' })} />
                </Field>
                <Field id="notes" label="Observações" hint="opcional" wide>
                  <textarea {...input('notes', { rows: 3, placeholder: 'Janela de coleta, recorrência, cuidados com a carga' })} />
                </Field>
              </div>
            )}
            <div className={s.formFoot}>
              {step === 2 && <button type="button" className={s.textBtn} onClick={back}><ArrowLeft size={16} aria-hidden="true" />Voltar à rota</button>}
              <button type="submit" className={`${s.btn} ${s.btnRed}`}>{step === 1 ? 'Continuar' : 'Revisar pedido'}<ArrowRight size={18} aria-hidden="true" /></button>
            </div>
          </form>
        )}
        <datalist id="atlas-cidades">{CITIES.map((c) => <option key={c.city} value={`${c.city} / MG`} />)}</datalist>
      </div>
    </section>
  );
}
