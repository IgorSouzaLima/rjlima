import type { Metadata } from 'next';
import { ArrowRight, Download, MapPin, MessageCircle, Phone } from 'lucide-react';
import { pageMetadata } from '../../lib/page-metadata';
import { SITE_URL } from '../../lib/seo.mjs';
import coverage from '../../lib/minas-coverage.json';
import { Footer, Header } from '../../components/home/Chrome';
import { archivo } from '../../components/home/fonte';
import s from '../../components/home/estilo.module.css';

const title='Cidades atendidas em Minas Gerais | RJ Lima Transportes';
const description='Confira as 168 cidades atendidas pela RJ Lima em Minas Gerais, com prazos de referência. Base em Três Corações e transporte fracionado no Sul de Minas.';
export async function generateMetadata():Promise<Metadata>{return pageMetadata(title,description,'/cidades-atendidas');}
const cities=[...coverage.cities].sort((a,b)=>a.city.localeCompare(b.city,'pt-BR'));
const letters=[...new Set(cities.map(city=>city.city[0]))];
const days=(n:number)=>`${n} ${n===1?'dia útil':'dias úteis'}`;
const WHATSAPP_HELP='https://wa.me/5535999581894?text='+encodeURIComponent('Olá! Gostaria de saber se a RJ Lima atende a minha cidade.');

// Server-rendered directory of the 168 cities, in the same Baú livery as the home page.
export default function CoverageDirectory(){
 const structured={
  '@context':'https://schema.org','@graph':[
   {'@type':'CollectionPage','@id':SITE_URL+'/cidades-atendidas#pagina',url:SITE_URL+'/cidades-atendidas',name:title,description,inLanguage:'pt-BR',isPartOf:{'@id':SITE_URL+'/#site'},about:{'@id':SITE_URL+'/#empresa'}},
   {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Início',item:SITE_URL+'/'},{'@type':'ListItem',position:2,name:'Cidades atendidas',item:SITE_URL+'/cidades-atendidas'}]}
  ]
 };
 return <div className={`${archivo.variable} ${s.root}`}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/>
  <a className={s.skip} href="#lista-cidades">Pular para a lista de cidades</a>
  <Header base="/"/>
  <main>
   <section className={`${s.ribbed} ${s.dirTop}`} aria-labelledby="dir-title">
    <div className={s.inner}>
     <nav aria-label="Caminho da página" className={s.crumbs}><a href="/">Início</a><span aria-hidden="true">/</span><span aria-current="page">Cidades atendidas</span></nav>
     <h1 id="dir-title" className={s.dirTitle}>Cidades atendidas <span>em Minas Gerais.</span></h1>
     <p className={s.lead}>Consulte os {cities.length} destinos da tabela de atendimento da RJ Lima. Nossa base fica em Três Corações, com presença no Sul de Minas e atendimento às cidades listadas abaixo.</p>
     <div className={s.dirActions}>
      <a href="/#cotacao" className={`${s.btn} ${s.btnRed} ${s.btnLg}`}>Solicitar cotação <ArrowRight aria-hidden="true" size={20}/></a>
      <a href="/#cidades" className={s.inlineLink}><MapPin aria-hidden="true" size={16}/> Ver no mapa</a>
     </div>
     <div className={s.dirNotice}>
      <h2 className={s.dirNoticeTitle}>Como ler os prazos</h2>
      <p>Os dias úteis abaixo são referências da tabela de atendimento, não uma confirmação de entrega. A equipe confirma o atendimento, o início da contagem e as condições conforme origem, coleta e características da carga.</p>
      <a className={s.inlineLink} href="/cidades-atendidas-rjlima-transportes.pdf" download><Download aria-hidden="true" size={16}/> Baixar a tabela em PDF</a>
     </div>
    </div>
   </section>

   <div className={s.alphaBar}>
    <nav className={`${s.inner} ${s.alpha}`} aria-label="Ir para cidades pela letra inicial">{letters.map(letter=><a key={letter} href={`#cidades-${letter.toLowerCase()}`} aria-label={`Cidades com a letra ${letter}`}>{letter}</a>)}</nav>
   </div>

   <section id="lista-cidades" className={`${s.inner} ${s.dirList}`} aria-label="Lista de cidades e prazos de referência">
    {letters.map(letter=><section className={s.dirGroup} id={`cidades-${letter.toLowerCase()}`} key={letter} aria-labelledby={`letra-${letter.toLowerCase()}`}>
     <h2 id={`letra-${letter.toLowerCase()}`} className={s.dirLetter}>{letter}</h2>
     <ul className={s.dirCities}>{cities.filter(city=>city.city[0]===letter).map(city=><li key={city.city}><span className={s.dirCity}>{city.city}</span><span className={s.dirDays}>{days(city.days)}</span></li>)}</ul>
    </section>)}
   </section>

   <section className={`${s.section} ${s.cab}`} aria-labelledby="dir-help-title">
    <div className={`${s.inner} ${s.dirHelp}`}>
     <h2 id="dir-help-title" className={s.h2}>Não encontrou sua cidade?</h2>
     <p className={s.leadOnCab}>A tabela publicada não inclui todas as rotas possíveis. Fale com a equipe para consultar a viabilidade da sua.</p>
     <div className={s.dirHelpActions}>
      <a className={`${s.btn} ${s.btnRed} ${s.btnLg}`} href={WHATSAPP_HELP} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" size={20}/> Consultar pelo WhatsApp</a>
      <a className={s.linkOnCab} href="tel:+5535999581894"><Phone aria-hidden="true" size={18}/> (35) 99958-1894</a>
     </div>
    </div>
   </section>
  </main>
  <Footer base="/"/>
 </div>;
}
