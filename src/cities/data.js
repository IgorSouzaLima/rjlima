import { COVERAGE_CITIES } from './coverage-data.js'
import { MUNICIPALITY_COORDINATES } from './municipality-coordinates.js'

/**
 * @typedef {Object} ServiceCity
 * @property {string} city
 * @property {string} state
 * @property {number | null} lat
 * @property {number | null} lng
 * @property {string} estimate
 * @property {string} region
 * @property {number} prazo
 * @property {number} tda
 * @property {'service' | 'capital'} coverageType
 */

export const COVERAGE_HIGHLIGHTS = [
  {
    state: 'MG',
    title: 'Referencia em fracionado no Sul de Minas',
    description: 'Atendimento fracionado para todo o Sul de Minas Gerais, com 168 cidades mapeadas na tabela oficial de abrangencia.'
  }
]

/** @type {ServiceCity[]} */
export const SERVICE_CITIES = COVERAGE_CITIES.map((item) => {
  const coordinates = MUNICIPALITY_COORDINATES[getCoordinateKey(item.state, item.city)] ?? [null, null]

  return {
    city: item.city,
    state: item.state,
    lat: coordinates[0],
    lng: coordinates[1],
    estimate: item.prazo > 0 ? `${item.prazo} dia${item.prazo === 1 ? '' : 's'} uteis` : 'Sob consulta operacional',
    region: 'Sul de Minas',
    prazo: item.prazo,
    tda: item.tda,
    coverageType: 'service'
  }
})

export const CENTRAL_CITY = SERVICE_CITIES.find((item) => getCoordinateKey(item.state, item.city) === 'MG|tres coracoes') ?? {
  city: 'Tres Coracoes',
  state: 'MG',
  lat: -21.696,
  lng: -45.2536,
  estimate: 'Central operacional',
  region: 'Central RJ Lima',
  prazo: 0,
  tda: 0,
  coverageType: 'service'
}

export const CAPITAL_DESTINATIONS = [
  createCapitalDestination('Belo Horizonte', 'MG', 'Capital de Minas Gerais'),
  createCapitalDestination('Sao Paulo', 'SP', 'Capital de Sao Paulo'),
  createCapitalDestination('Vitoria', 'ES', 'Capital do Espirito Santo'),
  createCapitalDestination('Curitiba', 'PR', 'Capital do Parana')
]

export const PUBLIC_DESTINATIONS = [...SERVICE_CITIES, ...CAPITAL_DESTINATIONS]

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * @param {string} state
 * @param {string} city
 * @returns {string}
 */
function getCoordinateKey(state, city) {
  return `${state.trim().toUpperCase()}|${normalizeText(city)}`
}

/**
 * @param {string} city
 * @param {string} state
 * @param {string} region
 * @returns {ServiceCity}
 */
function createCapitalDestination(city, state, region) {
  const coordinates = MUNICIPALITY_COORDINATES[getCoordinateKey(state, city)] ?? [null, null]

  return {
    city,
    state,
    lat: coordinates[0],
    lng: coordinates[1],
    estimate: 'Rota interestadual sob consulta',
    region,
    prazo: 0,
    tda: 0,
    coverageType: 'capital'
  }
}

/**
 * @param {ServiceCity[]} cities
 * @returns {ServiceCity[]}
 */
export function getMapDestinations(cities = SERVICE_CITIES) {
  const destinationsByKey = new Map()

  ;[...cities, ...CAPITAL_DESTINATIONS].forEach((city) => {
    if (typeof city.lat !== 'number' || typeof city.lng !== 'number') return
    destinationsByKey.set(getCoordinateKey(city.state, city.city), city)
  })

  return [...destinationsByKey.values()]
}

/**
 * @param {ServiceCity[]} destinations
 * @returns {{to: ServiceCity, path: [[number, number], [number, number]]}[]}
 */
export function buildCentralRoutes(destinations = getMapDestinations()) {
  return destinations
    .filter((city) => getCoordinateKey(city.state, city.city) !== getCoordinateKey(CENTRAL_CITY.state, CENTRAL_CITY.city))
    .map((city) => ({
      to: city,
      path: [
        [CENTRAL_CITY.lat, CENTRAL_CITY.lng],
        [city.lat, city.lng]
      ]
    }))
}

/**
 * @param {{search?: string, state?: string}} filters
 * @returns {ServiceCity[]}
 */
export function filterServiceCities({ search = '', state = '' } = {}) {
  const normalizedSearch = normalizeText(search)
  const normalizedState = state.trim().toUpperCase()

  return PUBLIC_DESTINATIONS.filter((item) => {
    const matchesSearch = !normalizedSearch ||
      normalizeText(`${item.city} ${item.state} ${item.region}`).includes(normalizedSearch)
    const matchesState = !normalizedState || item.state === normalizedState
    return matchesSearch && matchesState
  })
}

/**
 * @param {ServiceCity[]} cities
 * @returns {{totalCities: number, states: string[]}}
 */
export function getCityStats(cities = SERVICE_CITIES) {
  return {
    totalCities: cities.length,
    states: [...new Set(cities.map((city) => city.state))].sort()
  }
}

/**
 * @param {ServiceCity} city
 * @returns {string}
 */
export function formatServiceCityEstimate(city) {
  return city.estimate
}
