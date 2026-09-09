import { indexableRequest, robotsText } from '../../lib/seo.mjs';
export function GET(request:Request){
 const enabled=process.env.SEO_INDEXING_ENABLED==='true';
 const publicSite=indexableRequest(new URL(request.url).host,enabled);
 return new Response(robotsText(publicSite),{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
}
