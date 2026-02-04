import '../style.css'
import { signIn, getSession } from '../lib/auth.js'
import { showLoading } from '../shared/components.js'

// Check if already logged in
document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true)

  const { session } = await getSession()
  if (session) {
    window.location.href = '/admin/'
    return
  }

  showLoading(false)
  initializeForm()
})

function initializeForm() {
  const form = document.getElementById('login-form')
  const emailInput = /** @type {HTMLInputElement} */ (document.getElementById('email'))
  const passwordInput = /** @type {HTMLInputElement} */ (document.getElementById('password'))
  const togglePassword = document.getElementById('toggle-password')
  const errorEl = document.getElementById('login-error')
  const submitBtn = document.getElementById('submit-btn')

  if (!form || !emailInput || !passwordInput || !togglePassword || !errorEl || !submitBtn) return

  // Toggle password visibility
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password'
    passwordInput.type = type
    const icon = togglePassword.querySelector('i')
    if (icon) {
      icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'
    }
  })

  // Clear error on input
  const clearError = () => {
    errorEl.classList.add('hidden')
  }
  emailInput.addEventListener('input', clearError)
  passwordInput.addEventListener('input', clearError)

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = emailInput.value.trim()
    const password = passwordInput.value

    if (!email || !password) {
      showError('Preencha todos os campos')
      return
    }

    // Show loading state
    submitBtn.setAttribute('disabled', 'true')
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...'

    try {
      const { user, error } = await signIn(email, password)

      if (error || !user) {
        showError('Email ou senha incorretos')
        return
      }

      // Success - redirect to admin
      window.location.href = '/admin/'
    } catch {
      showError('Erro ao fazer login. Tente novamente.')
    } finally {
      submitBtn.removeAttribute('disabled')
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar'
    }
  })

  /**
   * @param {string} message
   */
  function showError(message) {
    const span = errorEl.querySelector('span')
    if (span) {
      span.textContent = message
    }
    errorEl.classList.remove('hidden')
  }
}
