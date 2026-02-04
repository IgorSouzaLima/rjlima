import '../style.css'
import { createHeader, createFooter, showToast, showLoading } from '../shared/components.js'
import { requireAuth, signOut } from '../lib/auth.js'
import { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, uploadProofPhoto, deleteProofPhoto } from '../lib/invoices.js'
import { formatDate, formatDateForInput, getStatusColor, isValidFiscalKey, debounce } from '../shared/utils.js'

/** @type {number} */
let currentPage = 1
const pageSize = 10

/** @type {string} */
let currentSearch = ''

/** @type {string} */
let currentStatus = ''

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  const isAuth = await requireAuth()
  if (!isAuth) return

  // Render header and footer
  const headerContainer = document.getElementById('header-container')
  const footerContainer = document.getElementById('footer-container')

  if (headerContainer) {
    headerContainer.innerHTML = createHeader({ isAdmin: true })
  }
  if (footerContainer) {
    footerContainer.innerHTML = createFooter()
  }

  // Expose logout function globally
  // @ts-ignore
  window.handleLogout = handleLogout

  // Initialize components
  initializeFilters()
  initializeModal()
  initializeDeleteModal()

  // Load initial data
  await loadInvoices()
})

async function handleLogout() {
  showLoading(true)
  await signOut()
  window.location.href = '/admin/login/'
}

// ============================================
// Filters & Search
// ============================================

function initializeFilters() {
  const searchInput = /** @type {HTMLInputElement} */ (document.getElementById('search-input'))
  const statusFilter = /** @type {HTMLSelectElement} */ (document.getElementById('status-filter'))
  const prevBtn = document.getElementById('prev-page')
  const nextBtn = document.getElementById('next-page')

  if (!searchInput || !statusFilter || !prevBtn || !nextBtn) return

  // Debounced search
  const debouncedSearch = debounce(async () => {
    currentSearch = searchInput.value
    currentPage = 1
    await loadInvoices()
  }, 300)

  searchInput.addEventListener('input', debouncedSearch)

  // Status filter
  statusFilter.addEventListener('change', async () => {
    currentStatus = statusFilter.value
    currentPage = 1
    await loadInvoices()
  })

  // Pagination
  prevBtn.addEventListener('click', async () => {
    if (currentPage > 1) {
      currentPage--
      await loadInvoices()
    }
  })

  nextBtn.addEventListener('click', async () => {
    currentPage++
    await loadInvoices()
  })
}

// ============================================
// Load & Render Invoices
// ============================================

async function loadInvoices() {
  const tableBody = document.getElementById('invoices-table-body')
  const emptyState = document.getElementById('empty-state')
  const loadingState = document.getElementById('loading-state')
  const pagination = document.getElementById('pagination')

  if (!tableBody || !emptyState || !loadingState || !pagination) return

  // Show loading
  loadingState.classList.remove('hidden')
  tableBody.innerHTML = ''
  emptyState.classList.add('hidden')
  pagination.classList.add('hidden')

  try {
    const { data, count, error } = await getInvoices({
      page: currentPage,
      pageSize,
      status: currentStatus,
      search: currentSearch
    })

    loadingState.classList.add('hidden')

    if (error) {
      showToast('Erro ao carregar notas fiscais', 'error')
      return
    }

    if (data.length === 0) {
      emptyState.classList.remove('hidden')
      return
    }

    // Render rows
    tableBody.innerHTML = data.map(invoice => renderInvoiceRow(invoice)).join('')

    // Attach row event listeners
    attachRowListeners()

    // Update pagination
    updatePagination(count)

  } catch {
    loadingState.classList.add('hidden')
    showToast('Erro ao carregar notas fiscais', 'error')
  }
}

/**
 * @param {import('../types/supabase.js').Invoice} invoice
 */
function renderInvoiceRow(invoice) {
  const statusColor = getStatusColor(invoice.status)

  return `
    <tr class="border-b border-white/5 hover:bg-white/5 transition" data-id="${invoice.id}">
      <td class="p-4">
        <p class="font-semibold">${invoice.invoice_number}</p>
        <p class="text-xs text-gray-500 font-mono truncate max-w-[150px]" title="${invoice.fiscal_key}">${invoice.fiscal_key}</p>
      </td>
      <td class="p-4">
        <p class="truncate max-w-[200px]">${invoice.recipient}</p>
      </td>
      <td class="p-4 hidden md:table-cell">
        <p>${invoice.city} - ${invoice.state}</p>
      </td>
      <td class="p-4 hidden lg:table-cell">
        <p>${formatDate(invoice.collection_date)}</p>
      </td>
      <td class="p-4">
        <span class="px-3 py-1 rounded-full text-xs font-semibold border ${statusColor} whitespace-nowrap">
          ${invoice.status}
        </span>
      </td>
      <td class="p-4 text-right">
        <div class="flex gap-2 justify-end">
          <button
            class="edit-btn p-2 bg-white/5 rounded-lg hover:bg-blue-600/20 hover:text-blue-400 transition"
            title="Editar"
          >
            <i class="fas fa-edit"></i>
          </button>
          <button
            class="delete-btn p-2 bg-white/5 rounded-lg hover:bg-red-600/20 hover:text-red-400 transition"
            title="Excluir"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `
}

function attachRowListeners() {
  const rows = document.querySelectorAll('#invoices-table-body tr')

  rows.forEach(row => {
    const id = row.getAttribute('data-id')
    if (!id) return

    const editBtn = row.querySelector('.edit-btn')
    const deleteBtn = row.querySelector('.delete-btn')

    editBtn?.addEventListener('click', () => openEditModal(id))
    deleteBtn?.addEventListener('click', () => openDeleteModal(id))
  })
}

/**
 * @param {number} totalCount
 */
function updatePagination(totalCount) {
  const pagination = document.getElementById('pagination')
  const showingFrom = document.getElementById('showing-from')
  const showingTo = document.getElementById('showing-to')
  const totalCountEl = document.getElementById('total-count')
  const prevBtn = /** @type {HTMLButtonElement} */ (document.getElementById('prev-page'))
  const nextBtn = /** @type {HTMLButtonElement} */ (document.getElementById('next-page'))

  if (!pagination || !showingFrom || !showingTo || !totalCountEl || !prevBtn || !nextBtn) return

  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalCount)
  const totalPages = Math.ceil(totalCount / pageSize)

  showingFrom.textContent = String(from)
  showingTo.textContent = String(to)
  totalCountEl.textContent = String(totalCount)

  prevBtn.disabled = currentPage <= 1
  nextBtn.disabled = currentPage >= totalPages

  pagination.classList.remove('hidden')
}

// ============================================
// Invoice Modal
// ============================================

function initializeModal() {
  const modal = document.getElementById('invoice-modal')
  const form = document.getElementById('invoice-form')
  const newBtn = document.getElementById('new-invoice-btn')
  const closeBtn = document.getElementById('close-modal')
  const cancelBtn = document.getElementById('cancel-btn')
  const fiscalKeyInput = /** @type {HTMLInputElement} */ (document.getElementById('fiscal-key'))
  const photoUploadArea = document.getElementById('photo-upload-area')
  const photoInput = /** @type {HTMLInputElement} */ (document.getElementById('proof-photo'))
  const removePhotoBtn = document.getElementById('remove-photo')

  if (!modal || !form || !newBtn || !closeBtn || !cancelBtn || !fiscalKeyInput || !photoUploadArea || !photoInput || !removePhotoBtn) return

  // Open new invoice modal
  newBtn.addEventListener('click', () => openNewModal())

  // Close modal
  closeBtn.addEventListener('click', () => closeModal())
  cancelBtn.addEventListener('click', () => closeModal())
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  // Fiscal key input - numbers only
  fiscalKeyInput.addEventListener('input', () => {
    fiscalKeyInput.value = fiscalKeyInput.value.replace(/\D/g, '')
  })

  // Photo upload
  photoUploadArea.addEventListener('click', () => photoInput.click())
  photoUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault()
    photoUploadArea.classList.add('border-red-600/50')
  })
  photoUploadArea.addEventListener('dragleave', () => {
    photoUploadArea.classList.remove('border-red-600/50')
  })
  photoUploadArea.addEventListener('drop', (e) => {
    e.preventDefault()
    photoUploadArea.classList.remove('border-red-600/50')
    const file = e.dataTransfer?.files[0]
    if (file && file.type.startsWith('image/')) {
      handlePhotoSelect(file)
    }
  })

  photoInput.addEventListener('change', () => {
    const file = photoInput.files?.[0]
    if (file) {
      handlePhotoSelect(file)
    }
  })

  removePhotoBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    clearPhotoPreview()
  })

  // Form submit
  form.addEventListener('submit', handleFormSubmit)
}

function openNewModal() {
  const modal = document.getElementById('invoice-modal')
  const form = /** @type {HTMLFormElement} */ (document.getElementById('invoice-form'))
  const modalTitle = document.getElementById('modal-title')
  const invoiceIdInput = /** @type {HTMLInputElement} */ (document.getElementById('invoice-id'))
  const existingPhotoUrl = /** @type {HTMLInputElement} */ (document.getElementById('existing-photo-url'))

  if (!modal || !form || !modalTitle || !invoiceIdInput || !existingPhotoUrl) return

  // Reset form
  form.reset()
  invoiceIdInput.value = ''
  existingPhotoUrl.value = ''
  clearPhotoPreview()
  clearFormError()

  // Set title
  modalTitle.textContent = 'Nova Nota Fiscal'

  // Show modal
  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

/**
 * @param {string} id
 */
async function openEditModal(id) {
  const modal = document.getElementById('invoice-modal')
  const modalTitle = document.getElementById('modal-title')
  const invoiceIdInput = /** @type {HTMLInputElement} */ (document.getElementById('invoice-id'))
  const existingPhotoUrl = /** @type {HTMLInputElement} */ (document.getElementById('existing-photo-url'))

  if (!modal || !modalTitle || !invoiceIdInput || !existingPhotoUrl) return

  showLoading(true)

  try {
    const { data, error } = await getInvoiceById(id)

    showLoading(false)

    if (error || !data) {
      showToast('Erro ao carregar nota fiscal', 'error')
      return
    }

    // Fill form
    invoiceIdInput.value = data.id
    fillForm(data)

    // Set title
    modalTitle.textContent = 'Editar Nota Fiscal'

    // Show modal
    modal.classList.remove('hidden')
    modal.classList.add('flex')

  } catch {
    showLoading(false)
    showToast('Erro ao carregar nota fiscal', 'error')
  }
}

/**
 * @param {import('../types/supabase.js').Invoice} invoice
 */
function fillForm(invoice) {
  const invoiceNumber = /** @type {HTMLInputElement} */ (document.getElementById('invoice-number'))
  const collectionDate = /** @type {HTMLInputElement} */ (document.getElementById('collection-date'))
  const recipient = /** @type {HTMLInputElement} */ (document.getElementById('recipient'))
  const city = /** @type {HTMLInputElement} */ (document.getElementById('city'))
  const state = /** @type {HTMLSelectElement} */ (document.getElementById('state'))
  const fiscalKey = /** @type {HTMLInputElement} */ (document.getElementById('fiscal-key'))
  const status = /** @type {HTMLSelectElement} */ (document.getElementById('status'))
  const deliveryDate = /** @type {HTMLInputElement} */ (document.getElementById('delivery-date'))
  const existingPhotoUrl = /** @type {HTMLInputElement} */ (document.getElementById('existing-photo-url'))

  if (!invoiceNumber || !collectionDate || !recipient || !city || !state || !fiscalKey || !status || !deliveryDate || !existingPhotoUrl) return

  invoiceNumber.value = invoice.invoice_number
  collectionDate.value = formatDateForInput(invoice.collection_date)
  recipient.value = invoice.recipient
  city.value = invoice.city
  state.value = invoice.state
  fiscalKey.value = invoice.fiscal_key
  status.value = invoice.status
  deliveryDate.value = formatDateForInput(invoice.delivery_date)
  existingPhotoUrl.value = invoice.proof_photo_url ?? ''

  // Show existing photo
  if (invoice.proof_photo_url) {
    showPhotoPreview(invoice.proof_photo_url)
  } else {
    clearPhotoPreview()
  }
}

function closeModal() {
  const modal = document.getElementById('invoice-modal')
  if (modal) {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
  }
}

/**
 * @param {File} file
 */
function handlePhotoSelect(file) {
  const placeholder = document.getElementById('photo-placeholder')
  const preview = document.getElementById('photo-preview')
  const previewImage = /** @type {HTMLImageElement} */ (document.getElementById('preview-image'))
  const photoInput = /** @type {HTMLInputElement} */ (document.getElementById('proof-photo'))

  if (!placeholder || !preview || !previewImage || !photoInput) return

  // Create preview URL
  const url = URL.createObjectURL(file)
  previewImage.src = url

  // Show preview
  placeholder.classList.add('hidden')
  preview.classList.remove('hidden')

  // Update input
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)
  photoInput.files = dataTransfer.files
}

/**
 * @param {string} url
 */
function showPhotoPreview(url) {
  const placeholder = document.getElementById('photo-placeholder')
  const preview = document.getElementById('photo-preview')
  const previewImage = /** @type {HTMLImageElement} */ (document.getElementById('preview-image'))

  if (!placeholder || !preview || !previewImage) return

  previewImage.src = url
  placeholder.classList.add('hidden')
  preview.classList.remove('hidden')
}

function clearPhotoPreview() {
  const placeholder = document.getElementById('photo-placeholder')
  const preview = document.getElementById('photo-preview')
  const previewImage = /** @type {HTMLImageElement} */ (document.getElementById('preview-image'))
  const photoInput = /** @type {HTMLInputElement} */ (document.getElementById('proof-photo'))
  const existingPhotoUrl = /** @type {HTMLInputElement} */ (document.getElementById('existing-photo-url'))

  if (!placeholder || !preview || !previewImage || !photoInput || !existingPhotoUrl) return

  previewImage.src = ''
  placeholder.classList.remove('hidden')
  preview.classList.add('hidden')
  photoInput.value = ''
  existingPhotoUrl.value = ''
}

/**
 * @param {string} message
 */
function showFormError(message) {
  const errorEl = document.getElementById('form-error')
  if (errorEl) {
    const span = errorEl.querySelector('span')
    if (span) {
      span.textContent = message
    }
    errorEl.classList.remove('hidden')
  }
}

function clearFormError() {
  const errorEl = document.getElementById('form-error')
  if (errorEl) {
    errorEl.classList.add('hidden')
  }
}

/**
 * @param {Event} e
 */
async function handleFormSubmit(e) {
  e.preventDefault()

  const invoiceIdInput = /** @type {HTMLInputElement} */ (document.getElementById('invoice-id'))
  const invoiceNumber = /** @type {HTMLInputElement} */ (document.getElementById('invoice-number'))
  const collectionDate = /** @type {HTMLInputElement} */ (document.getElementById('collection-date'))
  const recipient = /** @type {HTMLInputElement} */ (document.getElementById('recipient'))
  const city = /** @type {HTMLInputElement} */ (document.getElementById('city'))
  const state = /** @type {HTMLSelectElement} */ (document.getElementById('state'))
  const fiscalKey = /** @type {HTMLInputElement} */ (document.getElementById('fiscal-key'))
  const status = /** @type {HTMLSelectElement} */ (document.getElementById('status'))
  const deliveryDate = /** @type {HTMLInputElement} */ (document.getElementById('delivery-date'))
  const photoInput = /** @type {HTMLInputElement} */ (document.getElementById('proof-photo'))
  const existingPhotoUrl = /** @type {HTMLInputElement} */ (document.getElementById('existing-photo-url'))
  const saveBtn = document.getElementById('save-btn')

  if (!invoiceIdInput || !invoiceNumber || !collectionDate || !recipient || !city || !state || !fiscalKey || !status || !deliveryDate || !photoInput || !existingPhotoUrl || !saveBtn) return

  clearFormError()

  // Validate fiscal key
  if (!isValidFiscalKey(fiscalKey.value)) {
    showFormError('A chave da nota fiscal deve conter exatamente 44 digitos numericos')
    return
  }

  // Show loading
  saveBtn.setAttribute('disabled', 'true')
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...'

  try {
    const invoiceId = invoiceIdInput.value
    const isEditing = Boolean(invoiceId)

    // Prepare invoice data
    /** @type {import('../types/supabase.js').InvoiceInsert | import('../types/supabase.js').InvoiceUpdate} */
    const invoiceData = {
      invoice_number: invoiceNumber.value.trim(),
      collection_date: collectionDate.value,
      recipient: recipient.value.trim(),
      city: city.value.trim(),
      state: state.value,
      fiscal_key: fiscalKey.value,
      status: status.value,
      delivery_date: deliveryDate.value || null,
      proof_photo_url: existingPhotoUrl.value || null
    }

    // Handle photo upload
    const photoFile = photoInput.files?.[0]
    if (photoFile) {
      // Need to create/update invoice first to get ID
      let targetId = invoiceId

      if (!isEditing) {
        // Create invoice first
        const { data: newInvoice, error: createError } = await createInvoice(invoiceData)
        if (createError || !newInvoice) {
          showFormError(createError?.message ?? 'Erro ao criar nota fiscal')
          return
        }
        targetId = newInvoice.id
      }

      // Upload photo
      const { url: photoUrl, error: uploadError } = await uploadProofPhoto(photoFile, targetId)
      if (uploadError) {
        showFormError('Erro ao fazer upload da foto')
        return
      }

      invoiceData.proof_photo_url = photoUrl

      // Update with photo URL
      const { error: updateError } = await updateInvoice(targetId, { proof_photo_url: photoUrl })
      if (updateError) {
        showFormError('Erro ao atualizar foto do comprovante')
        return
      }

      showToast(isEditing ? 'Nota fiscal atualizada!' : 'Nota fiscal cadastrada!', 'success')
      closeModal()
      await loadInvoices()
      return
    }

    // Create or update without new photo
    if (isEditing) {
      const { error } = await updateInvoice(invoiceId, invoiceData)
      if (error) {
        showFormError(error.message ?? 'Erro ao atualizar nota fiscal')
        return
      }
      showToast('Nota fiscal atualizada!', 'success')
    } else {
      const { error } = await createInvoice(invoiceData)
      if (error) {
        // Check for duplicate fiscal key
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          showFormError('Ja existe uma nota fiscal com essa chave')
          return
        }
        showFormError(error.message ?? 'Erro ao criar nota fiscal')
        return
      }
      showToast('Nota fiscal cadastrada!', 'success')
    }

    closeModal()
    await loadInvoices()

  } catch (err) {
    showFormError('Erro ao salvar nota fiscal. Tente novamente.')
  } finally {
    saveBtn.removeAttribute('disabled')
    saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Salvar'
  }
}

// ============================================
// Delete Modal
// ============================================

function initializeDeleteModal() {
  const modal = document.getElementById('delete-modal')
  const cancelBtn = document.getElementById('cancel-delete')
  const confirmBtn = document.getElementById('confirm-delete')

  if (!modal || !cancelBtn || !confirmBtn) return

  cancelBtn.addEventListener('click', () => closeDeleteModal())
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeDeleteModal()
  })

  confirmBtn.addEventListener('click', handleDelete)
}

/**
 * @param {string} id
 */
function openDeleteModal(id) {
  const modal = document.getElementById('delete-modal')
  const invoiceIdInput = /** @type {HTMLInputElement} */ (document.getElementById('delete-invoice-id'))

  if (!modal || !invoiceIdInput) return

  invoiceIdInput.value = id
  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

function closeDeleteModal() {
  const modal = document.getElementById('delete-modal')
  if (modal) {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
  }
}

async function handleDelete() {
  const invoiceIdInput = /** @type {HTMLInputElement} */ (document.getElementById('delete-invoice-id'))
  const confirmBtn = document.getElementById('confirm-delete')

  if (!invoiceIdInput || !confirmBtn) return

  const invoiceId = invoiceIdInput.value

  // Show loading
  confirmBtn.setAttribute('disabled', 'true')
  confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Excluindo...'

  try {
    // Get invoice to check for photo
    const { data: invoice } = await getInvoiceById(invoiceId)

    // Delete photo if exists
    if (invoice?.proof_photo_url) {
      await deleteProofPhoto(invoice.proof_photo_url)
    }

    // Delete invoice
    const { error } = await deleteInvoice(invoiceId)

    if (error) {
      showToast('Erro ao excluir nota fiscal', 'error')
      return
    }

    showToast('Nota fiscal excluida!', 'success')
    closeDeleteModal()
    await loadInvoices()

  } catch {
    showToast('Erro ao excluir nota fiscal', 'error')
  } finally {
    confirmBtn.removeAttribute('disabled')
    confirmBtn.innerHTML = '<i class="fas fa-trash mr-2"></i> Excluir'
  }
}
