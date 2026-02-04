# RJ Lima Transportes - Project Guidelines

## Language Requirements

- **Code**: All code (variables, functions, comments, commits) must be in **English**
- **Website Content**: All user-facing text on the website must be in **Brazilian Portuguese (pt-BR)**

## Tech Stack

- **Build Tool**: Vite (multi-page configuration)
- **CSS Framework**: Tailwind CSS
- **Package Manager**: Yarn
- **Backend**: Supabase (Auth, Database, Storage)
- **Language**: Vanilla JavaScript with JSDoc types

## Project Structure

```
├── public/                    # Static assets (favicon, images)
├── rastreio/
│   └── index.html             # Public tracking page
├── admin/
│   ├── index.html             # Admin dashboard
│   └── login/
│       └── index.html         # Admin login page
├── src/
│   ├── lib/
│   │   ├── supabase.js        # Supabase client initialization
│   │   ├── auth.js            # Authentication functions
│   │   └── invoices.js        # Invoice CRUD operations
│   ├── shared/
│   │   ├── components.js      # Reusable UI components (toast, header, footer)
│   │   └── utils.js           # Utility functions (validation, formatting)
│   ├── types/
│   │   └── supabase.js        # JSDoc type definitions
│   ├── tracking/
│   │   └── main.js            # Public tracking page logic
│   ├── admin/
│   │   ├── main.js            # Admin dashboard logic
│   │   └── login.js           # Admin login logic
│   ├── main.js                # Landing page entry point
│   └── style.css              # Tailwind imports and custom styles
├── index.html                 # Landing page
├── .env                       # Environment variables (git ignored)
├── .env.example               # Environment template
├── vite.config.js             # Vite multi-page configuration
└── tailwind.config.js         # Tailwind configuration
```

## Development

```bash
yarn dev      # Start development server
yarn build    # Build for production
yarn preview  # Preview production build
```

## Environment Variables

Use `VITE_` prefix for client-side variables (Vite requirement):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase Configuration

- **Project URL**: https://reehybzmyuwxlqasqrcw.supabase.co
- **Tables**: `invoices` (with RLS enabled)
- **Storage Bucket**: `proof-photos` (public read, authenticated write)

## CSS Patterns

Custom classes defined in `/src/style.css`:

| Class | Usage |
|-------|-------|
| `.glass` | Frosted glass effect with blur backdrop |
| `.red-gradient` | Red gradient background for buttons/badges |
| `.card-hover` | Hover effect with lift and border color change |
| `.hero-gradient` | Dark gradient for hero sections |
| `.mobile-menu` | Mobile navigation menu (hidden by default) |

### Common Tailwind Patterns

```html
<!-- Input fields -->
<input class="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-red-600 outline-none transition">

<!-- Primary button -->
<button class="red-gradient py-4 rounded-xl font-bold hover:scale-[1.01] active:scale-95 transition shadow-xl shadow-red-900/30">

<!-- Card container -->
<div class="glass p-8 rounded-3xl card-hover border border-white/5">

<!-- Status badge -->
<span class="px-3 py-1 rounded-full text-xs font-semibold border bg-green-500/20 text-green-400 border-green-500/30">
```

## Component Patterns

### Toast Notifications

```javascript
import { showToast } from '../shared/components.js'

showToast('Success message', 'success')  // Green
showToast('Error message', 'error')      // Red
showToast('Info message', 'info')        // Blue
```

### Loading Overlay

```javascript
import { showLoading } from '../shared/components.js'

showLoading(true)   // Show spinner overlay
showLoading(false)  // Hide overlay
```

### Header/Footer

```javascript
import { createHeader, createFooter } from '../shared/components.js'

// Public pages
headerContainer.innerHTML = createHeader({ showTrackingLink: true })

// Admin pages
headerContainer.innerHTML = createHeader({ isAdmin: true })

footerContainer.innerHTML = createFooter()
```

## Authentication Pattern

```javascript
import { requireAuth, signIn, signOut, getSession } from '../lib/auth.js'

// Protect admin pages (redirects to login if not authenticated)
const isAuth = await requireAuth()
if (!isAuth) return

// Login
const { user, error } = await signIn(email, password)

// Logout
await signOut()
window.location.href = '/admin/login/'
```

## Data Fetching Pattern

```javascript
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '../lib/invoices.js'

// List with pagination and filters
const { data, count, error } = await getInvoices({
  page: 1,
  pageSize: 10,
  status: 'Entregue',
  search: 'query'
})

// Create
const { data, error } = await createInvoice(invoiceData)

// Update
const { data, error } = await updateInvoice(id, updates)

// Delete
const { error } = await deleteInvoice(id)
```

## Validation Patterns

```javascript
import { isValidFiscalKey, formatFiscalKey, formatDate } from '../shared/utils.js'

// Fiscal key validation (44 numeric digits)
if (!isValidFiscalKey(key)) {
  showError('Invalid fiscal key')
}

// Format for display
const formatted = formatFiscalKey('12345678901234567890123456789012345678901234')
// Output: "1234 5678 9012 3456 7890 1234 5678 9012 3456 7890 1234"

// Date formatting (pt-BR)
const dateStr = formatDate('2026-02-04')  // "04/02/2026"
```

## Invoice Status Values

Valid status values for invoices:

- `'Aguardando coleta'`
- `'Aguardando coleta para entrega'`
- `'Em rota'`
- `'Entregue'`

## Multi-Page Vite Configuration

New pages must be added to `vite.config.js`:

```javascript
build: {
  rollupOptions: {
    input: {
      main: resolve(__dirname, 'index.html'),
      rastreio: resolve(__dirname, 'rastreio/index.html'),
      admin: resolve(__dirname, 'admin/index.html'),
      adminLogin: resolve(__dirname, 'admin/login/index.html')
    }
  }
}
```

And to `tailwind.config.js` content paths:

```javascript
content: [
  "./index.html",
  "./rastreio/**/*.html",
  "./admin/**/*.html",
  "./src/**/*.{js,ts,jsx,tsx}"
]
```
