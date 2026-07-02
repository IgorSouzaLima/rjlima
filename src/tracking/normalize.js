export const TRACKING_STEPS = /** @type {const} */ ([
  'Coleta',
  'Em rota',
  'Saiu para entrega',
  'Entregue'
])

const STATUS_TO_STEP = {
  'Aguardando coleta': 'Coleta',
  'Coleta': 'Coleta',
  'Em rota': 'Em rota',
  'Aguardando coleta para entrega': 'Saiu para entrega',
  'Saiu para entrega': 'Saiu para entrega',
  'Entregue': 'Entregue'
}

/**
 * @typedef {Object} TrackingEvent
 * @property {string} status
 * @property {string | null} date
 * @property {string | null} city
 * @property {string | null} state
 * @property {string} description
 */

/**
 * @typedef {Object} TrackingRecord
 * @property {string} invoiceNumber
 * @property {string} fiscalKey
 * @property {string} recipient
 * @property {{city: string, state: string}} destination
 * @property {string} status
 * @property {TrackingEvent[]} events
 * @property {{url: string, label: string} | null} proof
 */

/**
 * @param {unknown} value
 * @param {string} fallback
 * @returns {string}
 */
function stringOr(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

/**
 * @param {unknown} payload
 * @returns {TrackingRecord}
 */
export function normalizeTrackingRecord(payload) {
  const raw = /** @type {Record<string, any>} */ (payload ?? {})
  const data = /** @type {Record<string, any>} */ (raw.data && typeof raw.data === 'object' ? raw.data : raw)
  const destination = data.destination ?? {}
  const proof = data.proof?.url
    ? {
        url: stringOr(data.proof.url),
        label: stringOr(data.proof.label, 'Comprovante de entrega')
      }
    : null

  return {
    invoiceNumber: stringOr(data.invoiceNumber ?? data.invoice_number),
    fiscalKey: stringOr(data.fiscalKey ?? data.fiscal_key),
    recipient: stringOr(data.recipient),
    destination: {
      city: stringOr(destination.city ?? data.city),
      state: stringOr(destination.state ?? data.state)
    },
    status: stringOr(data.status, 'Coleta'),
    events: Array.isArray(data.events)
      ? data.events.map((event) => normalizeTrackingEvent(event))
      : [],
    proof
  }
}

/**
 * @param {unknown} payload
 * @returns {TrackingEvent}
 */
export function normalizeTrackingEvent(payload) {
  const data = /** @type {Record<string, any>} */ (payload ?? {})

  return {
    status: stringOr(data.status, 'Atualizacao'),
    date: stringOr(data.date ?? data.created_at, '') || null,
    city: stringOr(data.city, '') || null,
    state: stringOr(data.state, '') || null,
    description: stringOr(data.description, 'Atualizacao da entrega')
  }
}

/**
 * @param {Partial<import('../types/supabase.js').Invoice>} invoice
 * @returns {TrackingEvent[]}
 */
export function buildFallbackTrackingEvents(invoice) {
  const city = invoice.city ?? null
  const state = invoice.state ?? null
  const collectionDate = invoice.collection_date ?? null
  const deliveryDate = invoice.delivery_date ?? null
  const currentStep = STATUS_TO_STEP[invoice.status ?? ''] ?? 'Coleta'
  const hasLeftForDelivery = ['Saiu para entrega', 'Entregue'].includes(currentStep)

  return [
    {
      status: 'Coleta',
      date: collectionDate,
      city,
      state,
      description: collectionDate ? 'Carga registrada para coleta' : 'Aguardando registro da coleta'
    },
    {
      status: 'Em rota',
      date: currentStep === 'Em rota' || hasLeftForDelivery ? collectionDate : null,
      city,
      state,
      description: currentStep === 'Coleta' ? 'Aguardando inicio da rota' : 'Carga em deslocamento'
    },
    {
      status: 'Saiu para entrega',
      date: hasLeftForDelivery ? deliveryDate ?? collectionDate : null,
      city,
      state,
      description: hasLeftForDelivery ? 'Carga em etapa final de entrega' : 'Aguardando saida para entrega'
    },
    {
      status: 'Entregue',
      date: currentStep === 'Entregue' ? deliveryDate : null,
      city,
      state,
      description: currentStep === 'Entregue' ? 'Entrega concluida' : 'Aguardando comprovacao da entrega'
    }
  ]
}

/**
 * @param {string} step
 * @param {string} currentStatus
 * @returns {'completed' | 'current' | 'pending'}
 */
export function getTrackingStepState(step, currentStatus) {
  const currentStep = STATUS_TO_STEP[currentStatus] ?? currentStatus
  const stepIndex = TRACKING_STEPS.indexOf(/** @type {typeof TRACKING_STEPS[number]} */ (step))
  const currentIndex = TRACKING_STEPS.indexOf(/** @type {typeof TRACKING_STEPS[number]} */ (currentStep))

  if (stepIndex < 0 || currentIndex < 0) return 'pending'
  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'pending'
}

/**
 * @param {import('../types/supabase.js').Invoice} invoice
 * @returns {TrackingRecord}
 */
export function trackingRecordFromInvoice(invoice) {
  return {
    invoiceNumber: invoice.invoice_number,
    fiscalKey: invoice.fiscal_key,
    recipient: invoice.recipient,
    destination: {
      city: invoice.city,
      state: invoice.state
    },
    status: STATUS_TO_STEP[invoice.status] ?? invoice.status,
    events: buildFallbackTrackingEvents(invoice),
    proof: invoice.proof_photo_url
      ? {
          url: invoice.proof_photo_url,
          label: 'Comprovante de entrega'
        }
      : null
  }
}
