/**
 * Create and show a toast notification
 * @param {string} message
 * @param {'success' | 'error' | 'info'} [type='info']
 * @param {number} [duration=3000]
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Remove existing toasts
  const existingToast = document.getElementById('toast')
  if (existingToast) {
    existingToast.remove()
  }

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  }

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info'
  }

  const toast = document.createElement('div')
  toast.id = 'toast'
  toast.className = `fixed top-4 right-4 z-[100] ${colors[type]} px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transform translate-x-full transition-transform duration-300`
  toast.innerHTML = `
    <i class="fas ${icons[type]} text-lg"></i>
    <span>${message}</span>
  `

  document.body.appendChild(toast)

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full')
  })

  // Animate out and remove
  setTimeout(() => {
    toast.classList.add('translate-x-full')
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

/**
 * Show loading overlay
 * @param {boolean} show
 */
export function showLoading(show) {
  let loader = document.getElementById('loading-overlay')

  if (show) {
    if (!loader) {
      loader = document.createElement('div')
      loader.id = 'loading-overlay'
      loader.className = 'fixed inset-0 z-[90] bg-black/80 flex items-center justify-center'
      loader.innerHTML = `
        <div class="text-center">
          <i class="fas fa-spinner fa-spin text-4xl text-red-500 mb-4"></i>
          <p class="text-gray-400">Carregando...</p>
        </div>
      `
      document.body.appendChild(loader)
    }
    loader.classList.remove('hidden')
  } else if (loader) {
    loader.classList.add('hidden')
  }
}

/**
 * Create header HTML
 * @param {Object} options
 * @param {boolean} [options.showTrackingLink=true]
 * @param {boolean} [options.isAdmin=false]
 * @returns {string}
 */
export function createHeader({ showTrackingLink = true, isAdmin = false } = {}) {
  const navLinks = isAdmin
    ? `<a href="/admin/" class="hover:text-red-500 transition">Dashboard</a>
       <button onclick="handleLogout()" class="bg-red-600 px-6 py-2 rounded-full hover:bg-red-700 transition shadow-lg shadow-red-600/20">Sair</button>`
    : `<a href="/" class="hover:text-red-500 transition">Inicio</a>
       ${showTrackingLink ? '<a href="/rastreio/" class="hover:text-red-500 transition">Rastrear</a>' : ''}
       <a href="/#orcamento" class="bg-red-600 px-6 py-2 rounded-full hover:bg-red-700 transition shadow-lg shadow-red-600/20">Orcamento</a>`

  return `
    <header class="fixed w-full z-50 glass top-0">
      <nav class="container mx-auto px-6 py-4 flex justify-between items-center">
        <a href="${isAdmin ? '/admin/' : '/'}" class="flex items-center space-x-3">
          <div class="red-gradient p-2 rounded-lg">
            <i class="fas fa-truck-fast text-white"></i>
          </div>
          <span class="text-xl font-extrabold tracking-tighter uppercase">RJ <span class="text-red-600">Lima</span></span>
        </a>

        <div class="hidden md:flex space-x-8 text-sm font-medium uppercase tracking-wider items-center">
          ${navLinks}
        </div>

        <button class="md:hidden text-2xl p-2 rounded-lg hover:bg-white/5 transition" aria-label="Menu" onclick="toggleMobileMenu()">
          <i class="fas fa-bars" id="mobile-menu-icon"></i>
        </button>
      </nav>

      <div id="mobile-nav" class="mobile-menu fixed top-[73px] left-4 right-4 bg-zinc-950/95 backdrop-blur-md flex-col p-5 space-y-3 border border-white/10 rounded-2xl md:hidden shadow-2xl z-[60] max-h-[calc(100vh-90px)] overflow-y-auto">
        ${isAdmin
          ? `<a href="/admin/" onclick="toggleMobileMenu()" class="text-base py-2.5 px-2 rounded-lg border-b border-white/5 hover:bg-white/5 transition">Dashboard</a>
             <button onclick="handleLogout()" class="text-base py-2.5 px-2 rounded-lg text-red-500 font-bold text-left hover:bg-red-600/10 transition">Sair</button>`
          : `<a href="/" onclick="toggleMobileMenu()" class="text-base py-2.5 px-2 rounded-lg border-b border-white/5 hover:bg-white/5 transition">Inicio</a>
             ${showTrackingLink ? '<a href="/rastreio/" onclick="toggleMobileMenu()" class="text-base py-2.5 px-2 rounded-lg border-b border-white/5 hover:bg-white/5 transition">Rastrear</a>' : ''}
             <a href="/#orcamento" onclick="toggleMobileMenu()" class="text-base py-2.5 px-2 rounded-lg text-red-500 font-bold hover:bg-red-600/10 transition">Solicitar Orcamento</a>`
        }
      </div>
    </header>
  `
}

/**
 * Create footer HTML
 * @returns {string}
 */
export function createFooter() {
  return `
    <footer class="bg-black border-t border-white/10 py-8">
      <div class="container mx-auto px-6 text-center text-gray-600 text-sm">
        &copy; ${new Date().getFullYear()} RJ Lima Transportes e Logistica. Todos os direitos reservados.
      </div>
    </footer>
  `
}

/**
 * Toggle mobile menu
 */
export function toggleMobileMenu() {
  const nav = document.getElementById('mobile-nav')
  const icon = document.getElementById('mobile-menu-icon')
  if (!nav || !icon) return

  const isOpen = nav.classList.toggle('active')
  document.body.classList.toggle('menu-open', isOpen)
  icon.classList.toggle('fa-bars', !isOpen)
  icon.classList.toggle('fa-times', isOpen)
}

// Expose toggle function globally
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.toggleMobileMenu = toggleMobileMenu

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      const nav = document.getElementById('mobile-nav')
      const icon = document.getElementById('mobile-menu-icon')
      nav?.classList.remove('active')
      document.body.classList.remove('menu-open')
      icon?.classList.add('fa-bars')
      icon?.classList.remove('fa-times')
    }
  })
}
