# RJ Lima website

Approved commercial site with original branding, Minas Gerais coverage, SEO metadata, and WhatsApp quotations. Next.js serves the website; the existing Vite tracking and admin subsystem retains Supabase integration.

## Development

Use Node 22 or 24 and Yarn 1.22.22. Run `yarn install --frozen-lockfile`, `yarn build`, and `yarn start`. Copy `.env.example` to `.env.local` and supply the existing public Supabase configuration for tracking/admin. The Vite build reads the existing VITE_ names. Never add service-role or other private keys.

`yarn test` runs the unit tests. `node scripts/check-preview.mjs http://localhost:3000` checks preview routes without creating or changing records.

## Preview deployment

Vercel settings are provided in vercel.json. The user approved the preview and authorized publication on main. Indexing is explicitly enabled for the exact official hostname; preview URLs remain noindex. SEO_INDEXING_ENABLED=false can temporarily disable production indexing. Tracking and admin retain the verified public Supabase configuration; a real fiscal-key lookup still needs a user-provided key.

See docs/vercel-preview.md for scope and checks.
