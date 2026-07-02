import '../style.css'
import { createFooter, createHeader } from '../shared/components.js'
import {
  CENTRAL_CITY,
  COVERAGE_HIGHLIGHTS,
  PUBLIC_DESTINATIONS,
  buildCentralRoutes,
  filterServiceCities,
  formatServiceCityEstimate,
  getCityStats,
  getMapDestinations
} from './data.js'

/** @type {import('./data.js').ServiceCity[]} */
let visibleCities = [...PUBLIC_DESTINATIONS]
let selectedState = ''
let map
let markerLayer
let routeLayer

document.addEventListener('DOMContentLoaded', () => {
  const headerContainer = document.getElementById('header-container')
  const footerContainer = document.getElementById('footer-container')

  if (headerContainer) {
    headerContainer.innerHTML = createHeader({ showTrackingLink: true })
  }
  if (footerContainer) {
    footerContainer.innerHTML = createFooter()
  }

  initializeStats()
  renderCoverageHighlights()
  initializeFilters()
  initializeMap()
  renderCities()
})

function initializeStats() {
  const stats = getCityStats(PUBLIC_DESTINATIONS)
  const totalCities = document.getElementById('total-cities')
  const totalStates = document.getElementById('total-states')

  if (totalCities) totalCities.textContent = String(stats.totalCities)
  if (totalStates) totalStates.textContent = String(stats.states.length)
}

function renderCoverageHighlights() {
  const container = document.getElementById('coverage-highlights')
  if (!container) return

  container.innerHTML = COVERAGE_HIGHLIGHTS.map((item) => `
    <article class="coverage-highlight">
      <div class="coverage-highlight-icon">
        <i class="fas fa-truck-ramp-box"></i>
      </div>
      <div class="coverage-highlight-copy">
        <h2>${item.title}</h2>
        <p>${item.description}</p>
      </div>
      <a class="coverage-download" href="/cidades-atendidas-rjlima-transportes.pdf" target="_blank" rel="noopener noreferrer" download>
        <i class="fas fa-file-arrow-down"></i>
        <span>Baixar PDF</span>
      </a>
    </article>
  `).join('')
}

function initializeFilters() {
  const searchInput = /** @type {HTMLInputElement | null} */ (document.getElementById('city-search'))
  const filters = document.getElementById('state-filters')
  if (!searchInput || !filters) return

  const states = getCityStats(PUBLIC_DESTINATIONS).states
  filters.innerHTML = [
    `<button class="coverage-filter is-active" data-state="">Todas</button>`,
    ...states.map((state) => `<button class="coverage-filter" data-state="${state}">${state}</button>`)
  ].join('')

  searchInput.addEventListener('input', () => {
    applyFilters()
  })

  filters.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      selectedState = button.getAttribute('data-state') ?? ''
      filters.querySelectorAll('button').forEach((item) => item.classList.remove('is-active'))
      button.classList.add('is-active')
      applyFilters()
    })
  })
}

function initializeMap() {
  const mapEl = document.getElementById('coverage-map')
  if (!mapEl || !window.L) return

  map = window.L.map(mapEl, {
    scrollWheelZoom: false
  }).setView([-22.7, -46.2], 6)

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map)

  routeLayer = window.L.layerGroup().addTo(map)
  markerLayer = window.L.layerGroup().addTo(map)
  window.L.circle([-21.9, -45.75], {
    radius: 165000,
    color: '#dc2626',
    fillColor: '#dc2626',
    fillOpacity: 0.08,
    weight: 2
  })
    .bindPopup('<strong>Sul de Minas Gerais</strong><br>Atendimento fracionado em toda a regiao conforme abrangencia oficial.')
    .addTo(map)

  window.addEventListener('resize', refreshMapSize)
  requestAnimationFrame(refreshMapSize)
  window.setTimeout(refreshMapSize, 350)
}

function applyFilters() {
  const searchInput = /** @type {HTMLInputElement | null} */ (document.getElementById('city-search'))
  visibleCities = filterServiceCities({
    search: searchInput?.value ?? '',
    state: selectedState
  })
  renderCities()
}

function renderCities() {
  const list = document.getElementById('cities-list')
  const count = document.getElementById('city-count')
  if (!list || !count) return

  count.textContent = `${visibleCities.length} resultado${visibleCities.length === 1 ? '' : 's'}`

  if (visibleCities.length === 0) {
    list.innerHTML = `
      <div class="coverage-empty">
        <i class="fas fa-magnifying-glass-location"></i>
        <h3>Nenhuma cidade encontrada</h3>
        <p>Revise a busca ou fale com a RJ Lima para consultar uma rota sob demanda.</p>
      </div>
    `
  } else {
    list.innerHTML = visibleCities.map((item) => `
      <article class="coverage-city">
        <div>
          <h3>${item.city} - ${item.state}</h3>
          <p>${item.region}</p>
        </div>
          <span>${formatServiceCityEstimate(item)}</span>
      </article>
    `).join('')
  }

  renderMarkers()
}

function renderMarkers() {
  if (!map || !markerLayer || !routeLayer || !window.L) return

  markerLayer.clearLayers()
  routeLayer.clearLayers()

  const mapDestinations = getMapDestinations(visibleCities)
  const routes = buildCentralRoutes(mapDestinations)

  routes.forEach((route) => {
    window.L.polyline(route.path, {
      color: route.to.coverageType === 'capital' ? '#2563eb' : '#dc2626',
      opacity: route.to.coverageType === 'capital' ? 0.42 : 0.18,
      weight: route.to.coverageType === 'capital' ? 2.2 : 1.1
    }).addTo(routeLayer)
  })

  mapDestinations.forEach((item) => {
    const isCentral = item.city === CENTRAL_CITY.city && item.state === CENTRAL_CITY.state
    const isCapital = item.coverageType === 'capital'

    window.L.circleMarker([item.lat, item.lng], {
      radius: isCentral ? 9 : isCapital ? 7 : 4.5,
      color: '#ffffff',
      weight: isCentral ? 3 : 2,
      fillColor: isCentral ? '#f59e0b' : isCapital ? '#2563eb' : '#dc2626',
      fillOpacity: isCentral ? 1 : 0.88
    })
      .bindPopup(createMapPopup(item, isCentral))
      .addTo(markerLayer)
  })

  if (mapDestinations.length > 1) {
    const bounds = window.L.latLngBounds(mapDestinations.map((item) => [item.lat, item.lng]))
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 7 })
  } else if (mapDestinations.length === 1) {
    map.setView([mapDestinations[0].lat, mapDestinations[0].lng], 9)
  }

  refreshMapSize()
}

function createMapPopup(item, isCentral) {
  if (isCentral) {
    return `<strong>${item.city} - ${item.state}</strong><br>Central operacional RJ Lima. Rotas saindo daqui.`
  }

  const label = item.coverageType === 'capital' ? 'Capital destacada no mapa' : item.region
  return `<strong>${item.city} - ${item.state}</strong><br>${label}<br>Saindo de ${CENTRAL_CITY.city} - ${CENTRAL_CITY.state}`
}

function refreshMapSize() {
  if (!map) return
  map.invalidateSize()
}
