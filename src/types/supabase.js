/**
 * @typedef {Object} Invoice
 * @property {string} id
 * @property {string} invoice_number
 * @property {string} collection_date
 * @property {string} recipient
 * @property {string} city
 * @property {string} state
 * @property {string} fiscal_key
 * @property {string} status
 * @property {string | null} delivery_date
 * @property {string | null} proof_photo_url
 * @property {string | null} created_at
 * @property {string | null} updated_at
 */

/**
 * @typedef {Object} InvoiceInsert
 * @property {string} invoice_number
 * @property {string} collection_date
 * @property {string} recipient
 * @property {string} city
 * @property {string} state
 * @property {string} fiscal_key
 * @property {string} [status]
 * @property {string | null} [delivery_date]
 * @property {string | null} [proof_photo_url]
 */

/**
 * @typedef {Object} InvoiceUpdate
 * @property {string} [invoice_number]
 * @property {string} [collection_date]
 * @property {string} [recipient]
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [fiscal_key]
 * @property {string} [status]
 * @property {string | null} [delivery_date]
 * @property {string | null} [proof_photo_url]
 */

/** @type {readonly ['Aguardando coleta', 'Aguardando coleta para entrega', 'Em rota', 'Entregue']} */
export const INVOICE_STATUSES = /** @type {const} */ ([
  'Aguardando coleta',
  'Aguardando coleta para entrega',
  'Em rota',
  'Entregue'
])

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

export {}
