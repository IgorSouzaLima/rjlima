'use client';
// Shared truth for the home page (and the prototypes): the real RJ Lima facts from the approved site, the coverage
// data, the generated media and the working quote flow.
import { useCallback, useMemo, useState, type FormEvent } from 'react';
import coverage from './minas-coverage.json';
import { filterCities, normalize, quoteMessage, validateQuote } from './transport.mjs';

export const WHATSAPP = 'https://wa.me/5535999581894';
export const PHONE = '(35) 99958-1894';
export const PHONE_HREF = 'tel:+5535999581894';
export const EMAIL = 'comercial@rjlimatransportes.com.br';
export const INSTAGRAM = 'https://www.instagram.com/rjlimatransportes/';
export const BASE_CITY = 'Três Corações';
export const TRACKING_URL = '/rastreio';
export const CITIES_URL = '/cidades-atendidas';
export const CITIES_PDF = '/cidades-atendidas-rjlima-transportes.pdf';
export const LOGO = '/assets/rjlima-logo-original.png';
export const LOGO_SIZE = { width: 595, height: 192 };
export const TRUCK_PHOTO = '/assets/rjlima-volvo-preto-v4.png';

export const SERVICES = [
  { id: 'fracionado', title: 'Transporte fracionado', short: 'Sua carga tem espaço na nossa rota.',
    detail: 'Para caixas, volumes e cargas menores que não precisam de um veículo exclusivo. Atendimento regional no Sul de Minas, com coleta e entrega alinhadas à sua operação.',
    tags: ['Distribuição regional', 'Cargas menores'] },
  { id: 'dedicado', title: 'Transporte dedicado', short: 'Um veículo. A sua operação.',
    detail: 'Uma solução para cargas que precisam de um veículo direcionado, com rota, janela de coleta e entrega definidas para a necessidade da sua empresa.',
    tags: ['Veículo exclusivo', 'Rota planejada'] },
  { id: 'coletas', title: 'Coletas programadas', short: 'Ritmo para quem não pode parar.',
    detail: 'Organize expedições recorrentes, reposições e demandas sazonais com uma programação de coletas alinhada ao seu negócio e à viabilidade de cada rota.',
    tags: ['Demandas recorrentes', 'Programação de coletas'] },
  { id: 'parceria', title: 'Parceria com transportadoras', short: 'Sua operação chega mais longe.',
    detail: 'Apoio regional para coletas, entregas, redespacho, transferências e reforço de capacidade. Fale com a equipe para avaliar a integração com a sua operação.',
    tags: ['Redespacho', 'Apoio regional'] },
] as const;

export const SEGMENTS = ['Indústria', 'Agronegócio', 'Distribuidores', 'Comércio e lojas'];

export const FAQS: [string, string][] = [
  ['Quais cidades a RJ Lima atende?', 'A consulta reúne 168 cidades de Minas Gerais, com destaque para o Sul de Minas. A equipe confirma a viabilidade e o prazo a partir da origem, do destino e das características da carga.'],
  ['O que preciso para solicitar uma cotação?', 'Informe origem, destino, tipo de carga e seus dados de contato. Peso, quantidade de volumes, dimensões e valor da nota fiscal ajudam a equipe a preparar uma cotação mais precisa. Se algum dado ainda não estiver disponível, você pode alinhá-lo no atendimento.'],
  ['Os prazos da consulta já são uma confirmação de entrega?', 'Não. São os prazos de referência publicados na tabela de atendimento. A contagem, a data de coleta e as condições de atendimento precisam ser confirmadas com a equipe para a sua rota.'],
  ['Como acompanho a minha entrega?', 'Acesse o rastreamento com a chave de acesso da nota fiscal, composta por 44 dígitos. Ela aparece no DANFE, próxima ao código de barras. Se não tiver a chave ou precisar de ajuda, fale com a equipe pelo WhatsApp.'],
  ['Minha transportadora pode ser parceira?', 'Sim. A RJ Lima atende transportadoras que precisam de apoio regional. Selecione “Parceria com transportadoras” na cotação e conte quais rotas e serviços você precisa atender.'],
];

/** Tracking statuses exactly as the operational system uses them. */
export const TRACKING_STATUSES = ['Aguardando coleta', 'Aguardando coleta para entrega', 'Em rota', 'Entregue'] as const;

export type City = (typeof coverage.cities)[number];
/** 168 destinations with reference deadlines (business days) and map coordinates in the MAP viewBox. */
export const CITIES: City[] = coverage.cities;
export const HUB = CITIES.find((c) => c.city === BASE_CITY)!;
export const POPULAR = ['Três Corações', 'Varginha', 'Pouso Alegre', 'Poços de Caldas', 'Lavras'].map((n) => CITIES.find((c) => c.city === n)!);
/** Minas Gerais outline (IBGE) in the same coordinate space as CITIES[].x/y. */
export const MAP = { path: coverage.path, bounds: coverage.bounds, source: 'Limites estaduais: IBGE. Cidades e prazos conforme a tabela de atendimento RJ Lima.' };
// Names that start with the query come first, then names with a word starting with it, then any other match
// ("pouso" lists Pouso Alegre before Bom Repouso).
export function searchCities(q: string) {
  const n = normalize(q);
  const rank = (c: City) => {
    const name = normalize(c.city);
    return name.startsWith(n) ? 0 : name.split(/[\s-]+/).some((w) => w.startsWith(n)) ? 1 : 2;
  };
  return filterCities(CITIES, q).map((c, i) => ({ c, r: rank(c), i })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.c);
}
/** The 168 cities as "City / UF", for the quote form suggestions. */
export const CITY_OPTIONS = CITIES.map((c) => `${c.city} / ${c.state}`);

/** Generated illustrative media (Gemini images, Veo clips). Alt text marks them as illustrative. */
const m = (n: string) => `/midia/${n}`;
export const MEDIA = {
  videoSerra: { mp4: m('serra.mp4'), webm: m('serra.webm'), poster: m('serra-poster.webp'), alt: 'Vídeo ilustrativo: caminhão da RJ Lima em estrada entre cafezais do Sul de Minas ao entardecer' },
  videoSerraVertical: { mp4: m('serra-vertical.mp4'), webm: m('serra-vertical.webm'), poster: m('serra-vertical-poster.webp'), alt: 'Vídeo ilustrativo: caminhão da RJ Lima subindo estrada sinuosa entre cafezais' },
  videoNoite: { mp4: m('noite.mp4'), webm: m('noite.webm'), poster: m('noite-poster.webp'), alt: 'Vídeo ilustrativo: caminhão da RJ Lima com faróis acesos na rodovia ao anoitecer' },
  serra: { src: m('serra.webp'), w: 2400, h: 1339, alt: 'Imagem ilustrativa: caminhão da RJ Lima em estrada sinuosa entre cafezais, com a serra ao fundo' },
  serraVertical: { src: m('serra-vertical.webp'), w: 1080, h: 1935, alt: 'Imagem ilustrativa: caminhão da RJ Lima em estrada entre cafezais, vista de cima' },
  doca: { src: m('doca.webp'), w: 2400, h: 1339, alt: 'Imagem ilustrativa: coleta na doca de um distribuidor, caixas sendo carregadas no baú da RJ Lima' },
  cidade: { src: m('cidade.webp'), w: 2400, h: 1339, alt: 'Imagem ilustrativa: entrega em rua de pedra de cidade histórica de Minas, com o caminhão da RJ Lima' },
  noite: { src: m('noite.webp'), w: 2400, h: 1339, alt: 'Imagem ilustrativa: caminhão da RJ Lima na rodovia à noite, com rastros de luz' },
  cafezal: { src: m('cafezal.webp'), w: 2400, h: 1339, alt: 'Imagem ilustrativa: vista aérea do caminhão da RJ Lima em estrada de terra no meio do cafezal' },
  carga: { src: m('carga.webp'), w: 928, h: 1152, alt: 'Imagem ilustrativa: carga fracionada amarrada dentro do baú' },
} as const;

export type Cover = { mp4: string; webm: string; poster: string; alt: string };
/** Cover films: the highway at blue hour on wide screens, the vertical serra cut on phones (it is framed for them). */
export const HERO_COVER: Cover = MEDIA.videoNoite;
export const HERO_COVER_VERTICAL: Cover = MEDIA.videoSerraVertical;
/** Phones get the vertical cover below this width; keep in sync with the 759px breakpoint in estilo.module.css. */
export const VERTICAL_QUERY = '(max-width: 759px)';

export type Quote = { origin: string; destination: string; cargo: string; weight: string; volumes: string; invoice: string; service: string; name: string; company: string; phone: string; notes: string };
const initialQuote: Quote = { origin: '', destination: '', cargo: '', weight: '', volumes: '', invoice: '', service: 'Transporte fracionado', name: '', company: '', phone: '', notes: '' };

/**
 * The real two-step quote flow (same validation and WhatsApp message as the approved site).
 * Step 1: route and cargo. Step 2: contact. When `ready`, `whatsappHref` opens the prefilled WhatsApp message.
 */
/** Accepts the ways people type a weight ("350kg", "1.200 kg") and keeps the plain number the message expects. */
export function cleanWeight(raw: string) {
  const v = raw.trim().replace(/\s*kg\.?$/i, '').trim();
  return /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(v) ? v.replace(/\./g, '') : v;
}
const tidy = (q: Quote): Quote => ({ ...q, weight: cleanWeight(q.weight) });

export function useQuote() {
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const update = useCallback((key: keyof Quote, value: string) => {
    setQuote((q) => ({ ...q, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
    setReady(false);
  }, []);
  /** Form submit handler: validates the current step, advances, or marks ready. Returns the first invalid field id. */
  const submit = useCallback((e?: FormEvent) => {
    e?.preventDefault();
    const found: Record<string, string> = validateQuote(tidy(quote), step);
    // The shared message uses the company's own number as the example; a neutral one reads as an example.
    if (found.phone) found.phone = 'Use um telefone com DDD, por exemplo (35) 91234-5678.';
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) return first as keyof Quote;
    if (step === 1) setStep(2); else setReady(true);
    return null;
  }, [quote, step]);
  const back = useCallback(() => { setStep(1); setReady(false); }, []);
  const reset = useCallback(() => { setQuote(initialQuote); setStep(1); setErrors({}); setReady(false); }, []);
  const message = useMemo(() => quoteMessage(tidy(quote)), [quote]);
  const whatsappHref = `${WHATSAPP}?text=${encodeURIComponent(message)}`;
  return { quote, step, errors, ready, update, submit, back, reset, message, whatsappHref };
}

export const whatsappText = (text: string) => `${WHATSAPP}?text=${encodeURIComponent(text)}`;
/** Fiscal key helpers for the tracking entry: 44 digits, shown in groups of four. */
export const onlyDigits = (s: string) => s.replace(/\D/g, '').slice(0, 44);
export const formatKey = (s: string) => onlyDigits(s).replace(/(\d{4})(?=\d)/g, '$1 ');
/** Opens the real tracking page with the key prefilled (the page reads ?chave=). */
export const trackingHref = (key: string) => (onlyDigits(key).length === 44 ? `${TRACKING_URL}?chave=${onlyDigits(key)}` : TRACKING_URL);
