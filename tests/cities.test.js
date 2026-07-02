import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  buildCentralRoutes,
  CAPITAL_DESTINATIONS,
  CENTRAL_CITY,
  COVERAGE_HIGHLIGHTS,
  PUBLIC_DESTINATIONS,
  getMapDestinations,
  SERVICE_CITIES,
  filterServiceCities,
  formatServiceCityEstimate,
  getCityStats
} from '../src/cities/data.js'

test('filters service cities by city name without accents sensitivity', () => {
  const results = filterServiceCities({ search: 'pouso alegre' })

  assert.equal(results.length, 1)
  assert.equal(results[0].city, 'Pouso Alegre')
  assert.equal(results[0].state, 'MG')
})

test('filters service cities by state', () => {
  const results = filterServiceCities({ state: 'MG' })

  assert.ok(results.length > 0)
  assert.ok(results.every((city) => city.state === 'MG'))
})

test('includes highlighted capitals in the searchable list with UF', () => {
  const saoPaulo = filterServiceCities({ search: 'sao paulo' })
  const stats = getCityStats(PUBLIC_DESTINATIONS)

  assert.ok(saoPaulo.some((city) => city.city === 'Sao Paulo' && city.state === 'SP'))
  assert.ok(filterServiceCities({ state: 'ES' }).some((city) => city.city === 'Vitoria'))
  assert.ok(filterServiceCities({ state: 'PR' }).some((city) => city.city === 'Curitiba'))
  assert.ok(filterServiceCities({ state: 'MG' }).some((city) => city.city === 'Belo Horizonte'))
  assert.deepEqual(stats.states, ['ES', 'MG', 'PR', 'SP'])
  assert.equal(stats.totalCities, 172)
})

test('reports total cities and covered states', () => {
  const stats = getCityStats(SERVICE_CITIES)

  assert.equal(stats.totalCities, 168)
  assert.deepEqual(stats.states, ['MG'])
})

test('makes Sul de Minas fractional coverage explicit', () => {
  const sulDeMinas = COVERAGE_HIGHLIGHTS.find((item) => item.state === 'MG')

  assert.match(sulDeMinas.description, /todo o Sul de Minas Gerais/i)
  assert.match(sulDeMinas.description, /fracionado/i)
  assert.equal(SERVICE_CITIES.length, 168)
})

test('does not expose internal plaza codes in public city estimates', () => {
  const city = SERVICE_CITIES[0]

  assert.ok(city)
  assert.doesNotMatch(formatServiceCityEstimate(city), /TCOR|TCOI|ITHP/)
  assert.equal('praca' in city, false)
})

test('keeps required Leaflet layout CSS locally available', () => {
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(css, /\.leaflet-pane/)
  assert.match(css, /\.leaflet-tile/)
  assert.match(css, /\.leaflet-top/)
  assert.match(css, /\.leaflet-control-zoom/)
})

test('maps every service city from the Tres Coracoes central', () => {
  const destinations = getMapDestinations(SERVICE_CITIES)
  const routes = buildCentralRoutes(destinations)

  assert.equal(CENTRAL_CITY.city, 'Tres Coracoes')
  assert.equal(destinations.filter((city) => city.coverageType === 'service').length, 168)
  assert.ok(destinations.every((city) => typeof city.lat === 'number' && typeof city.lng === 'number'))
  assert.ok(routes.length >= SERVICE_CITIES.length - 1)
  assert.ok(routes.every((route) => route.path[0][0] === CENTRAL_CITY.lat))
  assert.ok(routes.every((route) => route.path[0][1] === CENTRAL_CITY.lng))
})

test('adds nearby state capitals as highlighted map destinations', () => {
  const destinations = getMapDestinations(SERVICE_CITIES)
  const expectedCapitals = [
    ['Belo Horizonte', 'MG'],
    ['Sao Paulo', 'SP'],
    ['Vitoria', 'ES'],
    ['Curitiba', 'PR']
  ]

  assert.deepEqual(
    CAPITAL_DESTINATIONS.map((city) => [city.city, city.state]),
    expectedCapitals
  )
  assert.ok(expectedCapitals.every(([city, state]) =>
    destinations.some((item) => item.city === city && item.state === state && item.coverageType === 'capital')
  ))
})
