import { supabase } from './supabase.js'

const ADMIN_EMAIL = 'igordesouzalima86@gmail.com'
const ADMIN_PASSWORD = 'Abacaxi123'
const ADMIN_SESSION_KEY = 'rjlima_admin_session'

function getLocalAdminSession() {
  if (typeof window === 'undefined') return null

  const rawSession = window.localStorage.getItem(ADMIN_SESSION_KEY)
  if (!rawSession) return null

  try {
    return JSON.parse(rawSession)
  } catch {
    window.localStorage.removeItem(ADMIN_SESSION_KEY)
    return null
  }
}

function setLocalAdminSession(email) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
    email,
    role: 'admin',
    created_at: new Date().toISOString()
  }))
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: {email: string} | null, error: Error | null}>}
 */
export async function signIn(email, password) {
  const normalizedEmail = email.trim().toLowerCase()

  if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    setLocalAdminSession(normalizedEmail)

    return {
      user: { email: normalizedEmail },
      error: null
    }
  }

  return {
    user: null,
    error: new Error('Invalid credentials')
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{error: Error | null}>}
 */
export async function signOut() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ADMIN_SESSION_KEY)
  }

  // Keep Supabase sign-out to clear any stale remote session.
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get the current session
 * @returns {Promise<{session: {email: string, role: string, created_at: string} | null, error: Error | null}>}
 */
export async function getSession() {
  const session = getLocalAdminSession()

  return {
    session,
    error: null
  }
}

/**
 * Get the current user
 * @returns {Promise<{user: {email: string} | null, error: Error | null}>}
 */
export async function getUser() {
  const session = getLocalAdminSession()

  return {
    user: session ? { email: session.email } : null,
    error: null
  }
}

/**
 * Check if user is authenticated, redirect to login if not
 * @param {string} [loginUrl='/admin/login/']
 * @returns {Promise<boolean>}
 */
export async function requireAuth(loginUrl = '/admin/login/') {
  const { session } = await getSession()

  if (!session) {
    window.location.href = loginUrl
    return false
  }

  return true
}

/**
 * Subscribe to auth state changes
 * @param {(event: string, session: {email: string, role: string, created_at: string} | null) => void} callback
 * @returns {{ unsubscribe: () => void }}
 */
export function onAuthStateChange(callback) {
  const session = getLocalAdminSession()
  callback('INITIAL_SESSION', session)

  return { unsubscribe: () => {} }
}
