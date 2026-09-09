'use client';
import { useMemo, useState, type RefObject } from 'react';
import { ArrowUpRight, Search, X, MapPin, Plus, Minus, Maximize2, Download, ArrowRight, Navigation } from 'lucide-react';
import coverage from '../lib/minas-coverage.json';
import { filterCities } from '../lib/transport.mjs';

const cities = coverage.cities;
const hub = cities.find(c=>c.city==='Três Corações')!;
const popularNames=['Três Corações','Varginha','Pouso Alegre','Poços de Caldas','Lavras'];
const popular=popularNames.map(name=>cities.find(c=>c.city===name)!);
const fullView=`${coverage.bounds.x-12} ${coverage.bounds.y-12} ${coverage.bounds.width+24} ${coverage.bounds.height+24}`;
const southView='316 278 90 66';

export default function MinasCoverage({searchRef,onQuote}:{searchRef:RefObject<HTMLInputElement|null>;onQuote:(city?:string)=>void}) {
 const [query,setQuery]=useState('');
 const [all,setAll]=useState(false);
 const [limit,setLimit]=useState(5);
 const [zoom,setZoom]=useState(false);
 const [selected,setSelected]=useState(hub);
 const matches=useMemo(()=>filterCities(cities,query,'MG'),[query]);
 const shown=query||all?matches:popular;
 const matchedNames=new Set(matches.map(c=>c.city));
 const hasQuery=Boolean(query.trim());
 const selectCity=(c:typeof hub)=>{setSelected(c);};
 const search=(value:string)=>{setQuery(value);setLimit(5);const found=filterCities(cities,value,'MG');if(found.length===1){setSelected(found[0]);setZoom(false);}};
 return <section id="cobertura" className="coverage minas-section section-space"><div className="wrap">
  <div className="coverage-heading"><h2>Minas é o nosso caminho.<br/><span>Sua cidade, nosso destino.</span></h2><p>Presença no Sul de Minas, com 168 cidades na tabela de atendimento. Explore o mapa e encontre a sua próxima entrega.</p></div>
  <div className="minas-grid">
   <div className="minas-map-panel">
    <div className="minas-map-top"><div><span className="minas-location"><MapPin size={16}/> Minas Gerais</span><small>Uma operação próxima de você.</small></div><span className="coverage-count">168 <span>cidades atendidas</span></span></div>
    <div className="minas-map-stage">
     <div className="minas-view-switch" aria-label="Área do mapa"><button aria-pressed={!zoom} onClick={()=>setZoom(false)}>Todo o estado</button><button aria-pressed={zoom} onClick={()=>setZoom(true)}>Sul de Minas</button></div>
     <svg className={`minas-svg ${zoom?'is-zoomed':''}`} viewBox={zoom?southView:fullView} aria-label="Mapa de Minas Gerais com as 168 cidades atendidas pela RJ Lima">
      <defs><radialGradient id="minas-terrain" cx="35%" cy="80%" r="90%"><stop offset="0%" stopColor="#dce8d1"/><stop offset="100%" stopColor="#eef2e8"/></radialGradient></defs>
      <path className="minas-outline" d={coverage.path}/>
      {!zoom&&<g className="minas-interior-label" aria-hidden="true"><text x="388" y="215" textAnchor="middle">MINAS</text><text x="388" y="229" textAnchor="middle">GERAIS</text></g>}
      {cities.filter(c=>c.city!==hub.city&&c.city!==selected.city).map(c=><g key={c.city} role="button" tabIndex={0} aria-label={`Selecionar ${c.city}, ${c.days} dias úteis`} className={`minas-marker ${hasQuery&&!matchedNames.has(c.city)?'dimmed':''} ${hasQuery&&matchedNames.has(c.city)?'matched':''}`} onClick={()=>selectCity(c)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectCity(c);}}}><title>{`${c.city} · ${c.days} dias úteis`}</title><circle className="marker-hit" cx={c.x} cy={c.y} r={zoom?1.8:2.8}/><circle className="marker-dot" cx={c.x} cy={c.y} r={zoom?.65:1.05}/></g>)}
      <g className="minas-hub" role="button" tabIndex={0} aria-label="Selecionar Três Corações, nossa base" onClick={()=>selectCity(hub)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectCity(hub);}}}><title>Três Corações · Nossa base</title><circle cx={hub.x} cy={hub.y} r={zoom?2.6:5.5} className="hub-halo"/><circle cx={hub.x} cy={hub.y} r={zoom?1.2:2.4} className="hub-core"/></g>
      {selected.city!==hub.city&&<g className="minas-selected"><circle cx={selected.x} cy={selected.y} r={zoom?2.7:5} className="selected-halo"/><circle cx={selected.x} cy={selected.y} r={zoom?1.15:2.3} className="selected-core"/></g>}
      {!zoom&&<g className="minas-base-label" aria-hidden="true"><path d={`M${hub.x} ${hub.y+6}v18h25`}/><text x={hub.x+28} y={hub.y+25}>Três Corações</text><text className="base-subtitle" x={hub.x+28} y={hub.y+31}>NOSSA BASE</text></g>}
     </svg>
     <div className="minas-map-controls"><button aria-label={zoom?'Mostrar todo o estado':'Ampliar Sul de Minas'} onClick={()=>setZoom(!zoom)}>{zoom?<Minus size={18}/>:<Plus size={18}/>}</button><button aria-label="Restaurar mapa de Minas Gerais" onClick={()=>{setZoom(false);setSelected(hub);}}><Maximize2 size={16}/></button></div>
     {!zoom&&<div className="map-north" aria-hidden="true"><Navigation size={16}/><span>N</span></div>}
    </div>
    <div className="minas-selected-card" aria-live="polite"><span className="selected-pin"><MapPin size={21}/></span><div><strong>{selected.city}</strong><span>{selected.city===hub.city?'Nossa base em Minas Gerais':`${selected.days} dias úteis · prazo de referência`}</span></div><button onClick={()=>onQuote(`${selected.city} / MG`)} aria-label={`Cotar entrega para ${selected.city}`}><ArrowUpRight size={22}/></button></div>
    <div className="minas-legend"><span><i/>Cidades atendidas</span><span><i/>Base RJ Lima</span><small>Toque nos pontos para explorar</small></div>
   </div>
   <div className="coverage-search minas-search"><label htmlFor="city-search">Para onde vai a sua carga?</label><p className="search-explainer">Consulte os destinos atendidos em Minas Gerais.</p><div className="search-box"><Search size={21}/><input ref={searchRef} id="city-search" placeholder="Busque sua cidade em Minas..." value={query} onChange={e=>search(e.target.value)}/>{query&&<button aria-label="Limpar busca" onClick={()=>{search('');searchRef.current?.focus();}}><X size={17}/></button>}</div>
    <div className="results-label" aria-live="polite"><span>{query||all?`${matches.length} ${matches.length===1?'cidade encontrada':'cidades encontradas'}`:'Destinos em destaque'}</span><span>Prazo de referência</span></div>
    <div className="city-results">{shown.slice(0,limit).map(c=><button key={c.city} className={`city-row ${selected.city===c.city?'city-selected':''}`} onClick={()=>{selectCity(c);setZoom(false);}} aria-label={`Ver ${c.city} no mapa`} aria-pressed={selected.city===c.city}><span><MapPin size={15}/><strong>{c.city}</strong></span><span className="deadline">{c.days} dias úteis<ArrowUpRight size={15}/></span></button>)}{shown.length===0&&<div className="empty-state"><MapPin size={28}/><strong>Cidade não encontrada</strong><p>Revise o nome ou fale com a equipe para consultar o atendimento.</p><button className="text-link" onClick={()=>onQuote(query)}>Consultar uma rota <ArrowUpRight size={17}/></button></div>}</div>
    {!query&&!all?<button className="all-cities" onClick={()=>{setAll(true);setLimit(8);}}>Ver as 168 cidades <ArrowRight size={16}/></button>:shown.length>limit&&<button className="all-cities" onClick={()=>setLimit(limit+8)}>Mostrar mais cidades <Plus size={16}/></button>}
    <a className="all-cities" href="/cidades-atendidas">Lista completa de cidades <ArrowUpRight size={16}/></a><p className="coverage-note">Prazos sujeitos à origem, coleta e confirmação operacional.</p><a className="download-link" href="/cidades-atendidas-rjlima-transportes.pdf" target="_blank" rel="noreferrer"><Download size={16}/>Tabela completa de abrangência<ArrowUpRight size={15}/></a>
   </div>
  </div><p className="minas-map-source">Limites estaduais: IBGE. Cidades e prazos conforme a tabela de atendimento RJ Lima.</p>
 </div></section>;
}
