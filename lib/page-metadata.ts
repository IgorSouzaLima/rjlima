import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { SITE_URL, SITE_NAME, indexableRequest } from './seo.mjs';

export async function pageMetadata(title: string, description: string, path='/', preview=false): Promise<Metadata> {
 const requestHeaders=await headers();
 const enabled=process.env.SEO_INDEXING_ENABLED==='true';
 const index=indexableRequest(requestHeaders.get('host'),enabled,preview);
 const url=SITE_URL+path;
 return {
  title,description,
  alternates:{canonical:url},
  robots:{index,follow:true},
  openGraph:{type:'website',locale:'pt_BR',siteName:SITE_NAME,title,description,url,
   images:[{url:SITE_URL+'/assets/rjlima-logo-original.png',width:595,height:192,alt:'Logo original RJ Lima Transportes'}]},
  twitter:{card:'summary',title,description,images:[SITE_URL+'/assets/rjlima-logo-original.png']}
 };
}
