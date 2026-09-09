import test from 'node:test';
import assert from 'node:assert/strict';
import { filterCities, validateQuote, quoteMessage } from './transport.mjs';

const cities = [{city:'Três Corações',state:'MG'}, {city:'São Paulo',state:'SP'}, {city:'Varginha',state:'MG'}];
test('coverage search ignores accents and respects selected state', () => {
  assert.equal(filterCities(cities, 'tres coracoes', 'MG').length, 1);
  assert.equal(filterCities(cities, 'São Paulo', 'MG').length, 0);
  assert.equal(filterCities(cities, '', 'SP')[0].city, 'São Paulo');
  assert.equal(filterCities(cities, 'inexistente', '').length, 0);
});
test('quote prevents incomplete route and invalid contact from proceeding', () => {
  assert.ok(validateQuote({origin:'',destination:'Varginha',cargo:''},1).origin);
  assert.ok(validateQuote({name:'Ana',company:'Empresa',phone:'123'},2).phone);
  assert.deepEqual(validateQuote({name:'Ana',company:'Empresa',phone:'(35) 99958-1894'},2),{});
});
test('WhatsApp message preserves accented input and optional fields without inventing values', () => {
  const msg=quoteMessage({origin:'Três Corações',destination:'Varginha',cargo:'Caixas',name:'Ana',company:'Empresa',phone:'35999581894',service:'Fracionado'});
  assert.ok(msg.includes('Três Corações'));
  assert.ok(msg.includes('Peso: A confirmar'));
  assert.ok(!msg.includes('undefined'));
});
