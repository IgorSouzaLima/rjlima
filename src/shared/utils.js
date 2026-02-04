/**
 * Validate fiscal key (44 numeric digits)
 * @param {string} key
 * @returns {boolean}
 */
export function isValidFiscalKey(key) {
  const cleanKey = key.replace(/\s/g, '')
  return /^\d{44}$/.test(cleanKey)
}

/**
 * Format fiscal key for display (groups of 4 digits)
 * @param {string} key
 * @returns {string}
 */
export function formatFiscalKey(key) {
  const cleanKey = key.replace(/\s/g, '')
  return cleanKey.match(/.{1,4}/g)?.join(' ') ?? key
}

/**
 * Format date for display (DD/MM/YYYY)
 * @param {string | null | undefined} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return '-'

  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

/**
 * Format date for input field (YYYY-MM-DD)
 * @param {string | null | undefined} dateString
 * @returns {string}
 */
export function formatDateForInput(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

/**
 * Get status color class
 * @param {string} status
 * @returns {string}
 */
export function getStatusColor(status) {
  const colors = {
    'Entregue': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Em rota': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Aguardando coleta': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Aguardando coleta para entrega': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  }
  return colors[status] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

/**
 * Get status icon class
 * @param {string} status
 * @returns {string}
 */
export function getStatusIcon(status) {
  const icons = {
    'Entregue': 'fa-circle-check',
    'Em rota': 'fa-truck',
    'Aguardando coleta': 'fa-clock',
    'Aguardando coleta para entrega': 'fa-box'
  }
  return icons[status] ?? 'fa-question'
}

/**
 * Brazilian states list
 * @type {readonly string[]}
 */
export const BRAZILIAN_STATES = /** @type {const} */ ([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
])

/**
 * Debounce function
 * @template {(...args: unknown[]) => void} T
 * @param {T} fn
 * @param {number} delay
 * @returns {T}
 */
export function debounce(fn, delay) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeoutId

  return /** @type {T} */ ((...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  })
}
