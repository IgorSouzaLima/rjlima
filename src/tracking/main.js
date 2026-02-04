import '../style.css'
import { createHeader, createFooter, showToast, showLoading } from '../shared/components.js'
import { isValidFiscalKey, formatFiscalKey, formatDate, getStatusColor, getStatusIcon } from '../shared/utils.js'
import { getInvoiceByFiscalKey } from '../lib/invoices.js'

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
    const { data, error } = await getInvoiceByFiscalKey(fiscalKey)

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
        <i class="fas fa-file-circle-xmark text-4xl text-red-500"></i>
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
 * @param {import('../types/supabase.js').Invoice} invoice
 */
function renderResult(invoice) {
  const statusColor = getStatusColor(invoice.status)
  const statusIcon = getStatusIcon(invoice.status)
  const isDelivered = invoice.status === 'Entregue'

  return `
    <div class="glass p-8 rounded-3xl">
      <!-- Status Badge -->
      <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p class="text-sm text-gray-500 mb-1">Nota Fiscal</p>
          <h2 class="text-2xl font-bold">${invoice.invoice_number}</h2>
        </div>
        <div class="px-4 py-2 rounded-full border ${statusColor} flex items-center gap-2">
          <i class="fas ${statusIcon}"></i>
          <span class="font-semibold">${invoice.status}</span>
        </div>
      </div>

      <!-- Timeline -->
      <div class="space-y-6 mb-8">
        <!-- Collection -->
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
            <i class="fas fa-box-open text-green-400"></i>
          </div>
          <div>
            <p class="font-semibold">Coleta Realizada</p>
            <p class="text-gray-400 text-sm">${formatDate(invoice.collection_date)}</p>
          </div>
        </div>

        <!-- In Transit -->
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full ${invoice.status === 'Aguardando coleta' ? 'bg-gray-500/20' : 'bg-blue-500/20'} flex items-center justify-center flex-shrink-0 mt-1">
            <i class="fas fa-truck ${invoice.status === 'Aguardando coleta' ? 'text-gray-500' : 'text-blue-400'}"></i>
          </div>
          <div>
            <p class="font-semibold ${invoice.status === 'Aguardando coleta' ? 'text-gray-500' : ''}">Em Transito</p>
            <p class="text-gray-500 text-sm">${invoice.status === 'Aguardando coleta' ? 'Aguardando...' : 'Carga em deslocamento'}</p>
          </div>
        </div>

        <!-- Delivery -->
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full ${isDelivered ? 'bg-green-500/20' : 'bg-gray-500/20'} flex items-center justify-center flex-shrink-0 mt-1">
            <i class="fas fa-circle-check ${isDelivered ? 'text-green-400' : 'text-gray-500'}"></i>
          </div>
          <div>
            <p class="font-semibold ${isDelivered ? '' : 'text-gray-500'}">Entregue</p>
            <p class="text-gray-500 text-sm">${isDelivered ? formatDate(invoice.delivery_date) : 'Aguardando entrega'}</p>
          </div>
        </div>
      </div>

      <!-- Details -->
      <div class="border-t border-white/10 pt-6">
        <h3 class="text-lg font-bold mb-4">Detalhes da Entrega</h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="bg-white/5 p-4 rounded-xl">
            <p class="text-sm text-gray-500 mb-1">Destinatario</p>
            <p class="font-medium">${invoice.recipient}</p>
          </div>
          <div class="bg-white/5 p-4 rounded-xl">
            <p class="text-sm text-gray-500 mb-1">Destino</p>
            <p class="font-medium">${invoice.city} - ${invoice.state}</p>
          </div>
          <div class="md:col-span-2 bg-white/5 p-4 rounded-xl">
            <p class="text-sm text-gray-500 mb-1">Chave da Nota Fiscal</p>
            <p class="font-mono text-sm break-all">${formatFiscalKey(invoice.fiscal_key)}</p>
          </div>
        </div>
      </div>

      ${isDelivered && invoice.proof_photo_url ? `
        <!-- Proof Photo -->
        <div class="border-t border-white/10 pt-6 mt-6">
          <h3 class="text-lg font-bold mb-4">Comprovante de Entrega</h3>
          <div class="relative group">
            <img
              src="${invoice.proof_photo_url}"
              alt="Comprovante de entrega"
              class="rounded-xl max-h-96 w-full object-cover cursor-pointer"
              onclick="window.open('${invoice.proof_photo_url}', '_blank')"
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
