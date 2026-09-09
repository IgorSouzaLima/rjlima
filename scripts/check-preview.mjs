import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:3001';
const production = process.argv.includes('--production');
const checks = [
  ['/', 'Sua carga segue.'],
  ['/cidades-atendidas', 'Cidades atendidas em Minas Gerais.'],
  ['/rastreio', 'tracking-form'],
  ['/rastreio/', 'tracking-form'],
  ['/admin', 'RJ Lima'],
  ['/admin/login/', 'login-form'],
  ['/robots.txt', 'User-agent: *'],
  ['/sitemap.xml', '<urlset'],
];
for (const [path, content] of checks) {
  const response = await fetch(base + path, {headers:{'User-Agent':'Googlebot'}});
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.ok(html.includes(content) || html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').includes(content), `Missing content: ${path}`);
  if (path === '/' || path === '/cidades-atendidas') {
    assert.match(html, production ? /name="robots" content="index, follow"/ : /name="robots" content="noindex, follow"/);
    if (production) assert.doesNotMatch(response.headers.get('x-robots-tag') || '', /noindex/);
    assert.ok(html.includes('https://www.rjlimatransportes.com.br'));
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  }
  if (path === '/') {
    assert.ok(!html.includes('Enviar cotação por e-mail'));
    assert.ok(!html.includes('Compare as cores'));
    assert.ok(html.includes('data-palette="marca"'));
  }
  if (path.startsWith('/admin') || path.startsWith('/rastreio')) {
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
    for (const match of html.matchAll(/(?:src|href)="(\/legacy\/assets\/[^\"]+)"/g)) {
      const asset = await fetch(base + match[1]);
      assert.equal(asset.status,200,match[1]);
    }
  }
  console.log('OK', path);
}
for (const path of ['/favicon-rjlima.svg','/assets/fonts.css','/assets/rjlima-logo-original.png','/assets/rjlima-volvo-preto-v4.png','/cidades-atendidas-rjlima-transportes.pdf']) {
  assert.equal((await fetch(base + path)).status,200,path);
  console.log('OK',path);
}
assert.equal((await fetch(base + '/conceito')).status,404);
if (production) {
  const robots = await (await fetch(base + '/robots.txt')).text();
  assert.ok(robots.includes('Sitemap: https://www.rjlimatransportes.com.br/sitemap.xml'));
  const comparison = await (await fetch(base + '/?comparar=1', {headers:{'User-Agent':'Googlebot'}})).text();
  assert.match(comparison, /name="robots" content="noindex, follow"/);
}
console.log('Website routes, assets, metadata and legacy entrypoints passed.');
