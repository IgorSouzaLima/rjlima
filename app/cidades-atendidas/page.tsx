import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight, Download } from 'lucide-react';
import { pageMetadata } from '../../lib/page-metadata';
import { SITE_URL } from '../../lib/seo.mjs';
import coverage from '../../lib/minas-coverage.json';

const title='Cidades atendidas em Minas Gerais | RJ Lima Transportes';
const description='Confira as 168 cidades atendidas pela RJ Lima em Minas Gerais, com prazos de referência. Base em Três Corações e transporte fracionado no Sul de Minas.';
export async function generateMetadata():Promise<Metadata>{return pageMetadata(title,description,'/cidades-atendidas');}
const cities=[...coverage.cities].sort((a,b)=>a.city.localeCompare(b.city,'pt-BR'));
const letters=[...new Set(cities.map(city=>city.city[0]))];
export default function CoverageDirectory(){
 const structured={
  '@context':'https://schema.org','@graph':[
   {'@type':'CollectionPage','@id':SITE_URL+'/cidades-atendidas#pagina',url:SITE_URL+'/cidades-atendidas',name:title,description,inLanguage:'pt-BR',isPartOf:{'@id':SITE_URL+'/#site'},about:{'@id':SITE_URL+'/#empresa'}},
   {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Início',item:SITE_URL+'/'},{'@type':'ListItem',position:2,name:'Cidades atendidas',item:SITE_URL+'/cidades-atendidas'}]}
  ]
 };
 return <div className="coverage-directory">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/>
  <a className="skip-link" href="#lista-cidades">Pular para a lista de cidades</a>
  <header className="header"><div className="wrap nav-wrap"><a className="brand brand-original" href="/" aria-label="RJ Lima Transportes, início"><img src="/assets/rjlima-logo-original.png" width={595} height={192} alt="RJ Lima Transportes — logo original"/></a><a className="text-link" href="/"><ArrowLeft size={17}/> Voltar ao site</a></div></header>
  <main className="wrap directory-main">
   <nav aria-label="Caminho da página" className="directory-breadcrumb"><a href="/">Início</a><span aria-hidden="true">/</span><span aria-current="page">Cidades atendidas</span></nav>
   <div className="directory-intro"><h1>Cidades atendidas<br/><span>em Minas Gerais.</span></h1><p>Consulte os {cities.length} destinos da tabela de atendimento da RJ Lima. Nossa base fica em Três Corações, com presença no Sul de Minas e atendimento às cidades listadas abaixo.</p><div className="directory-actions"><a href="/#cotacao" className="button primary">Solicitar cotação <ArrowUpRight size={18}/></a><a href="/#cobertura" className="text-link">Explorar o mapa <ArrowUpRight size={17}/></a></div></div>
   <div className="directory-notice"><strong>Como ler os prazos</strong><p>Os dias úteis abaixo são referências da tabela de abrangência, não uma confirmação de entrega. A equipe confirma o atendimento, o início da contagem e as condições conforme origem, coleta e características da carga.</p><a className="text-link" href="/cidades-atendidas-rjlima-transportes.pdf" target="_blank" rel="noreferrer"><Download size={17}/> Consultar PDF de abrangência</a></div>
   <nav className="directory-alphabet" aria-label="Ir para cidades pela letra inicial">{letters.map(letter=><a key={letter} href={`#cidades-${letter.toLowerCase()}`} aria-label={`Cidades com a letra ${letter}`}>{letter}</a>)}</nav>
   <section id="lista-cidades" aria-label="Lista de cidades e prazos de referência">{letters.map(letter=><section className="directory-group" id={`cidades-${letter.toLowerCase()}`} key={letter}><h2>{letter}</h2><ul>{cities.filter(city=>city.city[0]===letter).map(city=><li key={city.city}><strong>{city.city}</strong><span>{city.days} dias úteis</span></li>)}</ul></section>)}</section>
   <div className="directory-help"><h2>Não encontrou sua cidade?</h2><p>Fale com a equipe para consultar a viabilidade da sua rota.</p><a className="button primary" href="https://wa.me/5535999581894" target="_blank" rel="noreferrer">Fale com a RJ Lima <ArrowUpRight size={18}/></a></div>
  </main>
  <footer className="directory-footer"><div className="wrap"><strong>RJ Lima Transportes</strong><span>Três Corações · Minas Gerais</span><a href="tel:+5535999581894">(35) 99958-1894</a><a href="mailto:comercial@rjlimatransportes.com.br">comercial@rjlimatransportes.com.br</a></div></footer>
 </div>;
}
