import './style.css'
import emailjs from '@emailjs/browser'
import { showToast } from './shared/components.js'

// Toggle Mobile Menu
function toggleMenu() {
  const nav = document.getElementById('mobile-nav')
  const icon = document.getElementById('menu-icon')
  nav.classList.toggle('active')
  icon.classList.toggle('fa-bars')
  icon.classList.toggle('fa-times')
}

// Handle Form submission via EmailJS
async function handleFormSubmit(e) {
  e.preventDefault()

  const nome = document.getElementById('nome').value
  const tel = document.getElementById('telefone').value
  const origem = document.getElementById('origem').value
  const destino = document.getElementById('destino').value
  const desc = document.getElementById('descricao').value

  const templateParams = {
    nome,
    telefone: tel,
    origem,
    destino,
    descricao: desc
  }

  const submitBtn = e.target.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent

  try {
    submitBtn.disabled = true
    submitBtn.textContent = 'Enviando...'

    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    )

    showToast('Orçamento enviado com sucesso! Entraremos em contato em breve.', 'success')
    e.target.reset()
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    showToast('Erro ao enviar orçamento. Por favor, tente novamente ou entre em contato pelo WhatsApp.', 'error')
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = originalText
  }
}

// Header scroll effect
function handleScroll() {
  const header = document.querySelector('header')
  if (window.scrollY > 50) {
    header.classList.add('bg-black/95')
    header.classList.add('py-2')
    header.classList.remove('glass')
    header.classList.remove('py-4')
  } else {
    header.classList.remove('bg-black/95')
    header.classList.remove('py-2')
    header.classList.add('glass')
    header.classList.add('py-4')
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Expose toggleMenu globally for onclick handlers
  window.toggleMenu = toggleMenu

  // Add form submit listener
  const quoteForm = document.getElementById('quoteForm')
  if (quoteForm) {
    quoteForm.addEventListener('submit', handleFormSubmit)
  }

  // Add scroll listener
  window.addEventListener('scroll', handleScroll)
})
