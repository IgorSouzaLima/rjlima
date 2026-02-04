import { supabase } from './supabase.js'

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: import('@supabase/supabase-js').User | null, error: Error | null}>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  return {
    user: data?.user ?? null,
    error
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{error: Error | null}>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get the current session
 * @returns {Promise<{session: import('@supabase/supabase-js').Session | null, error: Error | null}>}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return {
    session: data?.session ?? null,
    error
  }
}

/**
 * Get the current user
 * @returns {Promise<{user: import('@supabase/supabase-js').User | null, error: Error | null}>}
 */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  return {
    user: data?.user ?? null,
    error
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
 * @param {(event: string, session: import('@supabase/supabase-js').Session | null) => void} callback
 * @returns {{ unsubscribe: () => void }}
 */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })

  return { unsubscribe: () => data.subscription.unsubscribe() }
}
