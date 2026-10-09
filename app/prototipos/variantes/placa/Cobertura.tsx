'use client';
// City lookup rendered as a destination sign that updates as the visitor types.
import { useId, useMemo, useState } from 'react';
import { ArrowRight, Download, List } from 'lucide-react';
import { CITIES, CITIES_PDF, CITIES_URL, HUB, MAP, POPULAR, searchCities, whatsappText, type City } from '../../dados';
import s from './estilo.module.css';

const dayLabel = (d: number) => (d === 1 ? '1 dia útil' : `${d} dias úteis`);
const PAD = 8;
const VIEW = `${MAP.bounds.x - PAD} ${MAP.bounds.y - PAD} ${MAP.bounds.width + PAD * 2} ${MAP.bounds.height + PAD * 2}`;

export function Cobertura({ onQuote }: { onQuote: (label: string) => void }) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<City | null>(POPULAR[1] ?? null);
  const countId = useId();

  const results = useMemo(() => (query.trim() ? searchCities(query) : POPULAR), [query]);
  const shown: City | null = picked ?? results[0] ?? null;
  const list = results.slice(0, 6);

  return (
    <section id="cidades" className={`${s.section} ${s.coverage}`} aria-labelledby="pl-cov-title">
      <div className={`${s.wrap} ${s.covGrid}`}>
        <div className={s.covSearch}>
          <h2 id="pl-cov-title" className={s.h2}>{CITIES.length} cidades atendidas em Minas Gerais</h2>
          <p className={s.intro}>Digite a cidade de entrega e veja o prazo de referência da tabela de abrangência.</p>
          <label htmlFor="pl-busca" className={s.label}>Para onde vai a carga?</label>
          <input
            id="pl-busca" className={s.input} type="search" autoComplete="off" placeholder="Ex.: Varginha"
            value={query} aria-describedby={countId}
            onChange={(e) => { setQuery(e.target.value); setPicked(null); }}
          />
          <p id={countId} className={s.count} aria-live="polite">
            {query.trim()
              ? results.length === 0 ? 'Nenhuma cidade encontrada.' : results.length === 1 ? '1 cidade encontrada.' : `${results.length} cidades encontradas.`
              : `Consulta nas ${CITIES.length} cidades da tabela.`}
          </p>
        </div>

        <div className={s.covSignCol}>
          {shown ? (
            <div className={s.destAssembly}>
              <div className={`${s.panel} ${s.destSign}`} aria-live="polite">
                <div className={s.destRow} key={shown.city}>
                  <p className={s.destCity}>{shown.city} <span className={s.destState}>/ {shown.state}</span></p>
                  <ArrowRight className={s.destArrow} size={44} strokeWidth={3} aria-hidden />
                  <p className={s.destDays}>
                    <strong>{shown.days}</strong>
                    <span>{shown.days === 1 ? 'dia útil' : 'dias úteis'}</span>
                  </p>
                </div>
              </div>
              <p className={s.warnPlate}>
                Prazo de referência. A equipe confirma prazo e coleta para cada rota.
              </p>
              <button type="button" className={`${s.ctaRed} ${s.ctaBig} ${s.destCta}`} onClick={() => onQuote(`${shown.city} / ${shown.state}`)}>
                Cotar frete para {shown.city}
              </button>
            </div>
          ) : (
            <div className={s.destAssembly}>
              <div className={`${s.panel} ${s.destSign}`} aria-live="polite">
                <p className={s.destCity}>Cidade não encontrada</p>
                <p className={s.destEmpty}>
                  Confira a grafia ou consulte a lista completa. Se o destino não estiver na tabela, a equipe avalia a rota com você.
                </p>
              </div>
              <a className={`${s.ctaRed} ${s.ctaBig} ${s.destCta}`} target="_blank" rel="noopener noreferrer"
                href={whatsappText(`Olá! Gostaria de saber se a RJ Lima atende a cidade de ${query.trim()}.`)}>
                Perguntar à equipe pelo WhatsApp
              </a>
            </div>
          )}
        </div>

        <div className={s.covList}>
          {!query.trim() && <p className={s.listHead}>Destinos mais consultados</p>}
          {list.length > 0 && (
            <ul className={s.cityList}>
              {list.map((c) => (
                <li key={`${c.city}-${c.state}`}>
                  <button type="button" className={s.cityBtn} aria-pressed={shown?.city === c.city} onClick={() => setPicked(c)}>
                    <span>{c.city} <small>/ {c.state}</small></span>
                    <span className={s.cityDays}>{dayLabel(c.days)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {results.length > list.length && (
            <p className={s.note}>Mais {results.length - list.length} resultados. Continue digitando para refinar.</p>
          )}
          <div className={s.covLinks}>
            <a href={CITIES_URL} className={s.textLink}><List size={18} aria-hidden /> Ver as {CITIES.length} cidades</a>
            <a href={CITIES_PDF} className={s.textLink} target="_blank" rel="noopener noreferrer"><Download size={18} aria-hidden /> Baixar tabela em PDF</a>
          </div>
        </div>

        <div className={s.covMap}>
          <figure className={s.mapPlate}>
            <svg viewBox={VIEW} className={s.map} role="img"
              aria-label={`Mapa de Minas Gerais com as ${CITIES.length} cidades atendidas${shown ? `, destacando ${shown.city}` : ''}.`}>
              <path d={MAP.path} className={s.mapState} />
              {CITIES.map((c) => <circle key={`${c.city}-${c.state}`} cx={c.x} cy={c.y} r={1.6} className={s.mapDot} />)}
              <rect x={HUB.x - 3.2} y={HUB.y - 3.2} width={6.4} height={6.4} className={s.mapHub} />
              {shown && <circle cx={shown.x} cy={shown.y} r={4.6} className={s.mapPick} />}
            </svg>
            <figcaption>
              <span className={s.legend}><i className={s.legHub} /> Base em {HUB.city}</span>
              <span className={s.legend}><i className={s.legDot} /> Cidade atendida</span>
              {shown && <span className={s.legend}><i className={s.legPick} /> {shown.city}</span>}
              <span className={s.mapSource}>{MAP.source}</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
