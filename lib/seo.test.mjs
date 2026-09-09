import test from 'node:test';
import assert from 'node:assert/strict';
import { SITE_URL, indexableRequest, robotsText, sitemapXml, organizationGraph } from './seo.mjs';

test('indexing requires explicit activation and the exact official hostname',()=>{
 assert.equal(indexableRequest('www.rjlimatransportes.com.br',false),false);
 assert.equal(indexableRequest('www.rjlimatransportes.com.br',true),true);
 for(const host of ['localhost:3000','127.0.0.1:3000','preview.example.com','www.rjlimatransportes.com.br.example.com','','rjlimatransportes.com.br']) assert.equal(indexableRequest(host,true),false,host);
 assert.equal(indexableRequest('www.rjlimatransportes.com.br',true,true),false);
});
test('sitemap contains only canonical public pages, never demos, query strings or anchors',()=>{
 const xml=sitemapXml();
 assert.ok(xml.includes(`${SITE_URL}/</loc>`));
 assert.ok(xml.includes(`${SITE_URL}/cidades-atendidas</loc>`));
 assert.equal((xml.match(/<url>/g)||[]).length,2);
 for(const [,url] of xml.matchAll(/<loc>(.*?)<\/loc>/g)) assert.doesNotMatch(url,/conceito|comparar|localhost|\?|#/);
});
test('robots permits crawling of noindex pages and advertises sitemap only when public',()=>{
 assert.match(robotsText(true),/Sitemap: https:\/\/www.rjlimatransportes.com.br\/sitemap.xml/);
 assert.doesNotMatch(robotsText(false),/Sitemap:|Disallow: \/\n/);
});
test('structured business identity uses confirmed details without fabricated credibility',()=>{
 const graph=organizationGraph();
 assert.equal(graph['@context'],'https://schema.org');
 const org=graph['@graph'].find(item=>item['@type']==='Organization');
 assert.equal(org.telephone,'+5535999581894');
 assert.equal(org.url,SITE_URL+'/');
 assert.equal(org.address.addressLocality,'Três Corações');
 assert.doesNotMatch(JSON.stringify(graph),/aggregateRating|reviewCount|streetAddress|taxID|openingHours/);
});
