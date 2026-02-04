import { supabase } from './supabase.js'

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
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('fiscal_key', fiscalKey)
    .single()

  return { data, error }
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
