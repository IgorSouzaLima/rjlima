import '../style.css'
import { createHeader, createFooter, showToast, showLoading } from '../shared/components.js'
import { isValidFiscalKey, formatFiscalKey, formatDate, getStatusColor, getStatusIcon } from '../shared/utils.js'
import { getTrackingByFiscalKey } from '../lib/invoices.js'
import { TRACKING_STEPS, getTrackingStepState } from './normalize.js'

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  // Render header and footer
  const headerContainer = document.getElementById('header-container')
  const footerContainer = document.getElementById('footer-container')

  if (headerContainer) {
    headerContainer.innerHTML = createHeader({ showTrackingLink: false })
  }
  if (footerContainer) {
    footerContainer.innerHTML = createFooter()
  }

  // Initialize form
  initializeForm()

  // Check for fiscal key in URL params
  const urlParams = new URLSearchParams(window.location.search)
  const fiscalKey = urlParams.get('chave')
  if (fiscalKey) {
    const input = /** @type {HTMLInputElement} */ (document.getElementById('fiscal-key'))
    if (input) {
      input.value = fiscalKey
      performSearch(fiscalKey)
    }
  }
})

function initializeForm() {
  const form = document.getElementById('tracking-form')
  const input = /** @type {HTMLInputElement} */ (document.getElementById('fiscal-key'))
  const pasteBtn = document.getElementById('paste-btn')
  const errorEl = document.getElementById('key-error')

  if (!form || !input || !pasteBtn || !errorEl) return

  // Input validation on change
  input.addEventListener('input', () => {
    // Remove non-numeric characters
    input.value = input.value.replace(/\D/g, '')
    errorEl.classList.add('hidden')
  })

  // Paste button
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText()
      const cleanText = text.replace(/\D/g, '')
      input.value = cleanText.slice(0, 44)
      input.dispatchEvent(new Event('input'))
      input.focus()
    } catch {
      showToast('Nao foi possivel acessar a area de transferencia', 'error')
    }
  })

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const fiscalKey = input.value.trim()

    if (!isValidFiscalKey(fiscalKey)) {
      errorEl.classList.remove('hidden')
      input.focus()
      return
    }

    await performSearch(fiscalKey)
  })
}

/**
 * @param {string} fiscalKey
 */
async function performSearch(fiscalKey) {
  const resultContainer = document.getElementById('result-container')
  const submitBtn = document.getElementById('submit-btn')

  if (!resultContainer || !submitBtn) return

  // Show loading state
  submitBtn.setAttribute('disabled', 'true')
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...'

  showLoading(true)

  try {
    const { data, error } = await getTrackingByFiscalKey(fiscalKey)

    showLoading(false)

    if (error || !data) {
      resultContainer.innerHTML = renderNotFound()
      resultContainer.classList.remove('hidden')
      return
    }

    resultContainer.innerHTML = renderResult(data)
    resultContainer.classList.remove('hidden')

    // Update URL without reload
    const newUrl = `${window.location.pathname}?chave=${fiscalKey}`
    window.history.pushState({}, '', newUrl)

  } catch {
    showLoading(false)
    showToast('Erro ao buscar nota fiscal. Tente novamente.', 'error')
  } finally {
    submitBtn.removeAttribute('disabled')
    submitBtn.innerHTML = '<i class="fas fa-search"></i> Rastrear'
  }
}

function renderNotFound() {
  return `
    <div class="glass p-8 rounded-3xl text-center">
      <div class="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <i class="fas fa-circle-xmark text-4xl text-red-500"></i>
      </div>
      <h2 class="text-2xl font-bold mb-2">Nota Nao Encontrada</h2>
      <p class="text-gray-400 mb-6">
        Nao encontramos nenhuma nota fiscal com essa chave. Verifique se a chave foi digitada corretamente.
      </p>
      <button
        onclick="document.getElementById('fiscal-key').focus()"
        class="text-red-500 hover:text-red-400 transition font-medium"
      >
        <i class="fas fa-arrow-left mr-2"></i>
        Tentar novamente
      </button>
    </div>
  `
}

/**
 * @param {import('./normalize.js').TrackingRecord} tracking
 */
function renderResult(tracking) {
  const statusColor = getStatusColor(tracking.status)
  const statusIcon = getStatusIcon(tracking.status)
  const isDelivered = tracking.status === 'Entregue'
  const eventsByStatus = new Map(tracking.events.map((event) => [event.status, event]))

  return `
    <div class="glass p-8 rounded-3xl">
      <!-- Status Badge -->
      <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p class="text-sm text-gray-500 mb-1">Nota Fiscal</p>
          <h2 class="text-2xl font-bold">${tracking.invoiceNumber || 'Nota consultada'}</h2>
        </div>
        <div class="px-4 py-2 rounded-full border ${statusColor} flex items-center gap-2">
          <i class="fas ${statusIcon}"></i>
          <span class="font-semibold">${tracking.status}</span>
        </div>
      </div>

      <!-- Timeline -->
      <div class="tracking-timeline mb-8">
        ${TRACKING_STEPS.map((step) => renderTimelineStep({
          event: eventsByStatus.get(step),
          state: getTrackingStepState(step, tracking.status),
          status: step
        })).join('')}
      </div>

      <!-- Details -->
      <div class="border-t border-white/10 pt-6">
        <h3 class="text-lg font-bold mb-4">Detalhes da Entrega</h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="bg-white/5 p-4 rounded-xl">
            <p class="text-sm text-gray-500 mb-1">Destinatario</p>
            <p class="font-medium">${tracking.recipient || '-'}</p>
          </div>
          <div class="bg-white/5 p-4 rounded-xl">
            <p class="text-sm text-gray-500 mb-1">Destino</p>
            <p class="font-medium">${tracking.destination.city || '-'} - ${tracking.destination.state || '-'}</p>
          </div>
          <div class="md:col-span-2 bg-white/5 p-4 rounded-xl">
            <p class="text-sm text-gray-500 mb-1">Chave da Nota Fiscal</p>
            <p class="font-mono text-sm break-all">${formatFiscalKey(tracking.fiscalKey)}</p>
          </div>
        </div>
      </div>

      ${isDelivered && tracking.proof?.url ? `
        <!-- Proof Photo -->
        <div class="border-t border-white/10 pt-6 mt-6">
          <h3 class="text-lg font-bold mb-4">${tracking.proof.label}</h3>
          <div class="relative group">
            <img
              src="${tracking.proof.url}"
              alt="Comprovante de entrega"
              class="rounded-xl max-h-96 w-full object-cover cursor-pointer"
              onclick="window.open('${tracking.proof.url}', '_blank')"
            >
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
              <span class="text-white flex items-center gap-2">
                <i class="fas fa-expand"></i>
                Clique para ampliar
              </span>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `
}

/**
 * @param {{event: import('./normalize.js').TrackingEvent | undefined, state: 'completed' | 'current' | 'pending', status: string}} options
 * @returns {string}
 */
function renderTimelineStep({ event, state, status }) {
  const icon = getTimelineIcon(status)
  const stateClass = {
    completed: 'is-completed',
    current: 'is-current',
    pending: 'is-pending'
  }[state]
  const place = event?.city && event?.state ? `${event.city} - ${event.state}` : 'Local em atualizacao'
  const date = event?.date ? formatDate(event.date) : 'Aguardando atualizacao'
  const description = event?.description ?? 'Aguardando atualizacao da operacao'

  return `
    <article class="tracking-step ${stateClass}">
      <div class="tracking-step-marker">
        <i class="fas ${icon}"></i>
      </div>
      <div class="tracking-step-content">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <h3>${status}</h3>
          <span>${date}</span>
        </div>
        <p>${description}</p>
        <small><i class="fas fa-location-dot"></i> ${place}</small>
      </div>
    </article>
  `
}

/**
 * @param {string} status
 * @returns {string}
 */
function getTimelineIcon(status) {
  const icons = {
    'Coleta': 'fa-box-open',
    'Em rota': 'fa-truck-fast',
    'Saiu para entrega': 'fa-route',
    'Entregue': 'fa-circle-check'
  }
  return icons[status] ?? 'fa-circle'
}
