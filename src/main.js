import './style.css'
import emailjs from '@emailjs/browser'
import { showToast } from './shared/components.js'

// Toggle Mobile Menu
function toggleMenu() {
  const nav = document.getElementById('mobile-nav')
  const icon = document.getElementById('menu-icon')
  const button = document.querySelector('button[aria-label="Menu"]')
  if (!nav || !icon) return
  nav.classList.toggle('active')
  if (button) {
    button.setAttribute('aria-expanded', String(nav.classList.contains('active')))
  }
  icon.classList.toggle('fa-bars')
  icon.classList.toggle('fa-times')
}

function closeMenu() {
  const nav = document.getElementById('mobile-nav')
  const icon = document.getElementById('menu-icon')
  const button = document.querySelector('button[aria-label="Menu"]')
  if (!nav || !icon || !nav.classList.contains('active')) return
  nav.classList.remove('active')
  if (button) {
    button.setAttribute('aria-expanded', 'false')
  }
  icon.classList.add('fa-bars')
  icon.classList.remove('fa-times')
}

function getInputValue(id, fallback = 'Nao informado') {
  return document.getElementById(id)?.value?.trim() || fallback
}

function buildQuoteWhatsappUrl() {
  const message = [
    'Ola, quero cotar um frete com a RJ Lima.',
    '',
    `Empresa/Nome: ${getInputValue('nome')}`,
    `Telefone: ${getInputValue('telefone')}`,
    `Perfil: ${getInputValue('perfil')}`,
    `Segmento: ${getInputValue('segmento')}`,
    `Tipo de carga: ${getInputValue('tipo_carga')}`,
    `Origem: ${getInputValue('origem')}`,
    `Destino: ${getInputValue('destino')}`,
    `Peso aproximado: ${getInputValue('peso')}`,
    `Volumes: ${getInputValue('volumes')}`,
    `Valor da NF: ${getInputValue('valor_nf')}`,
    `Observacoes: ${getInputValue('descricao', 'Sem observacoes adicionais')}`
  ].join('\n')

  return `https://wa.me/5535999581894?text=${encodeURIComponent(message)}`
}

function updateQuoteWhatsappLink() {
  const link = document.getElementById('quoteWhatsapp')
  if (!link) return
  link.href = buildQuoteWhatsappUrl()
}

// Handle Form submission via EmailJS
async function handleFormSubmit(e) {
  e.preventDefault()

  const honeypot = e.target.querySelector('input[name="empresa_site"]')
  if (honeypot?.value) return

  const nome = getInputValue('nome')
  const tel = getInputValue('telefone')
  const perfil = getInputValue('perfil')
  const segmento = getInputValue('segmento')
  const tipoCarga = getInputValue('tipo_carga')
  const origem = getInputValue('origem')
  const destino = getInputValue('destino')
  const peso = getInputValue('peso')
  const volumes = getInputValue('volumes')
  const valorNf = getInputValue('valor_nf')
  const desc = getInputValue('descricao', 'Sem observacoes adicionais')
  const detailedDescription = [
    `Perfil da demanda: ${perfil}`,
    `Carga ou segmento: ${segmento}`,
    `Tipo de carga: ${tipoCarga}`,
    `Origem: ${origem}`,
    `Destino: ${destino}`,
    `Peso aproximado: ${peso}`,
    `Volumes: ${volumes}`,
    `Valor da NF: ${valorNf}`,
    '',
    desc
  ].join('\n')

  const templateParams = {
    nome,
    telefone: tel,
    perfil,
    segmento,
    tipo_carga: tipoCarga,
    origem,
    destino,
    peso,
    volumes,
    valor_nf: valorNf,
    descricao: detailedDescription
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Expose toggleMenu globally for onclick handlers
  window.toggleMenu = toggleMenu

  // Add form submit listener
  const quoteForm = document.getElementById('quoteForm')
  if (quoteForm) {
    quoteForm.addEventListener('submit', handleFormSubmit)
    quoteForm.addEventListener('input', updateQuoteWhatsappLink)
    quoteForm.addEventListener('change', updateQuoteWhatsappLink)
  }
  updateQuoteWhatsappLink()

  const currentYear = document.getElementById('currentYear')
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear()
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu()
    }
  })

  document.addEventListener('click', (event) => {
    const nav = document.getElementById('mobile-nav')
    const button = document.querySelector('button[aria-label="Menu"]')
    if (!nav || !button || !nav.classList.contains('active')) return
    if (!nav.contains(event.target) && !button.contains(event.target)) {
      closeMenu()
    }
  })
})
