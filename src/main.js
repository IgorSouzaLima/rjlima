import './style.css'

// Toggle Mobile Menu
function toggleMenu() {
  const nav = document.getElementById('mobile-nav')
  const icon = document.getElementById('menu-icon')
  nav.classList.toggle('active')
  icon.classList.toggle('fa-bars')
  icon.classList.toggle('fa-times')
}

// Handle Form to WhatsApp
function handleFormSubmit(e) {
  e.preventDefault()

  const nome = document.getElementById('nome').value
  const tel = document.getElementById('telefone').value
  const origem = document.getElementById('origem').value
  const destino = document.getElementById('destino').value
  const desc = document.getElementById('descricao').value

  const mensagem =
    `*Solicitação de Orçamento - RJ Lima*\n\n` +
    `*Empresa/Nome:* ${nome}\n` +
    `*Telefone:* ${tel}\n` +
    `*Origem:* ${origem}\n` +
    `*Destino:* ${destino}\n` +
    `*Carga:* ${desc}`

  const encodedMessage = encodeURIComponent(mensagem)
  const whatsappUrl = `https://wa.me/5535999581894?text=${encodedMessage}`

  window.open(whatsappUrl, '_blank')
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
