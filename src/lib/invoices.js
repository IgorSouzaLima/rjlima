import { supabase } from './supabase.js'
import { normalizeTrackingRecord, trackingRecordFromInvoice } from '../tracking/normalize.js'

/**
 * @typedef {import('../types/supabase.js').Invoice} Invoice
 * @typedef {import('../types/supabase.js').InvoiceInsert} InvoiceInsert
 * @typedef {import('../types/supabase.js').InvoiceUpdate} InvoiceUpdate
 */

/**
 * Search invoice by fiscal key (public)
 * @param {string} fiscalKey
 * @returns {Promise<{data: Invoice | null, error: Error | null}>}
 */
export async function getInvoiceByFiscalKey(fiscalKey) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase nao configurado') }
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('fiscal_key', fiscalKey)
    .single()

  return { data, error }
}

/**
 * Search invoice/tracking data using an external API when configured.
 * Falls back to Supabase so the current admin workflow keeps working.
 * @param {string} fiscalKey
 * @returns {Promise<{data: import('../tracking/normalize.js').TrackingRecord | null, error: Error | null, source: 'api' | 'supabase' | 'none'}>}
 */
export async function getTrackingByFiscalKey(fiscalKey) {
  const trackingApiUrl = import.meta.env.VITE_TRACKING_API_URL

  if (trackingApiUrl) {
    try {
      const url = new URL(trackingApiUrl)
      url.searchParams.set('fiscalKey', fiscalKey)

      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' }
      })

      if (response.ok) {
        const payload = await response.json()
        const data = normalizeTrackingRecord(payload)
        if (data.fiscalKey || data.invoiceNumber) {
          return { data, error: null, source: 'api' }
        }
      }
    } catch (error) {
      console.warn('Falha ao consultar API de rastreio, usando fallback Supabase.', error)
    }
  }

  const { data, error } = await getInvoiceByFiscalKey(fiscalKey)
  if (data) {
    return { data: trackingRecordFromInvoice(data), error: null, source: 'supabase' }
  }

  return { data: null, error, source: 'none' }
}

/**
 * Get all invoices with pagination and filtering
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.pageSize=10]
 * @param {string} [options.status]
 * @param {string} [options.search]
 * @returns {Promise<{data: Invoice[], count: number, error: Error | null}>}
 */
export async function getInvoices({ page = 1, pageSize = 10, status, search } = {}) {
  if (!supabase) {
    return { data: [], count: 0, error: new Error('Supabase nao configurado') }
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('invoices')
    .select('*', { count: 'exact' })
    .order('collection_date', { ascending: false })
    .range(from, to)

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`invoice_number.ilike.%${search}%,recipient.ilike.%${search}%,fiscal_key.ilike.%${search}%`)
  }

  const { data, count, error } = await query

  return {
    data: data ?? [],
    count: count ?? 0,
    error
  }
}

/**
 * Get a single invoice by ID
 * @param {string} id
 * @returns {Promise<{data: Invoice | null, error: Error | null}>}
 */
export async function getInvoiceById(id) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase nao configurado') }
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error }
}

/**
 * Create a new invoice
 * @param {InvoiceInsert} invoice
 * @returns {Promise<{data: Invoice | null, error: Error | null}>}
 */
export async function createInvoice(invoice) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase nao configurado') }
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single()

  return { data, error }
}

/**
 * Update an existing invoice
 * @param {string} id
 * @param {InvoiceUpdate} updates
 * @returns {Promise<{data: Invoice | null, error: Error | null}>}
 */
export async function updateInvoice(id, updates) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase nao configurado') }
  }

  const { data, error } = await supabase
    .from('invoices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

/**
 * Delete an invoice
 * @param {string} id
 * @returns {Promise<{error: Error | null}>}
 */
export async function deleteInvoice(id) {
  if (!supabase) {
    return { error: new Error('Supabase nao configurado') }
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)

  return { error }
}

/**
 * Upload proof photo to storage
 * @param {File} file
 * @param {string} invoiceId
 * @returns {Promise<{url: string | null, error: Error | null}>}
 */
export async function uploadProofPhoto(file, invoiceId) {
  if (!supabase) {
    return { url: null, error: new Error('Supabase nao configurado') }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${invoiceId}-${Date.now()}.${fileExt}`
  const filePath = `proofs/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('proof-photos')
    .upload(filePath, file)

  if (uploadError) {
    return { url: null, error: uploadError }
  }

  const { data } = supabase.storage
    .from('proof-photos')
    .getPublicUrl(filePath)

  return { url: data.publicUrl, error: null }
}

/**
 * Delete proof photo from storage
 * @param {string} url
 * @returns {Promise<{error: Error | null}>}
 */
export async function deleteProofPhoto(url) {
  if (!supabase) {
    return { error: new Error('Supabase nao configurado') }
  }

  // Extract path from URL
  const urlParts = url.split('/proof-photos/')
  if (urlParts.length < 2) {
    return { error: new Error('Invalid photo URL') }
  }

  const filePath = urlParts[1]
  const { error } = await supabase.storage
    .from('proof-photos')
    .remove([filePath])

  return { error }
}
