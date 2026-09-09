export const SITE_URL = 'https://www.rjlimatransportes.com.br';
export const SITE_NAME = 'RJ Lima Transportes';
export const HOME_TITLE = 'Transportadora no Sul de Minas | RJ Lima Transportes';
export const HOME_DESCRIPTION = 'Transporte fracionado e dedicado para empresas no Sul de Minas. Consulte 168 cidades atendidas em MG e solicite sua cotação com a RJ Lima.';
export const PUBLIC_PATHS = ['/', '/cidades-atendidas'];

export function indexableRequest(host, enabled = false, preview = false) {
 return enabled === true && !preview && String(host).toLowerCase() === 'www.rjlimatransportes.com.br';
}
export function robotsText(indexable) {
 // Crawlers must be able to read the noindex directive on preview pages.
 return `User-agent: *\nAllow: /\n${indexable ? `\nSitemap: ${SITE_URL}/sitemap.xml\n` : ''}`;
}
export function sitemapXml() {
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_PATHS.map(path=>`  <url><loc>${SITE_URL}${path}</loc></url>`).join('\n')}\n</urlset>`;
}
export function organizationGraph() {
 return {
  '@context':'https://schema.org',
  '@graph':[
   {'@type':'Organization','@id':`${SITE_URL}/#empresa`,name:SITE_NAME,url:`${SITE_URL}/`,description:HOME_DESCRIPTION,
    logo:{'@type':'ImageObject',url:`${SITE_URL}/assets/rjlima-logo-original.png`,width:595,height:192},
    telephone:'+5535999581894',email:'comercial@rjlimatransportes.com.br',
    address:{'@type':'PostalAddress',addressLocality:'Três Corações',addressRegion:'MG',addressCountry:'BR'},
    sameAs:['https://www.instagram.com/rjlimatransportes/'],
    contactPoint:{'@type':'ContactPoint',telephone:'+5535999581894',contactType:'Atendimento comercial',availableLanguage:['pt-BR']}
   },
   {'@type':'WebSite','@id':`${SITE_URL}/#site`,url:`${SITE_URL}/`,name:SITE_NAME,inLanguage:'pt-BR',publisher:{'@id':`${SITE_URL}/#empresa`}}
  ]
 };
}
