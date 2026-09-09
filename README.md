# RJ Lima website

Approved commercial site with original branding, Minas Gerais coverage, SEO metadata, and WhatsApp quotations. Next.js serves the website; the existing Vite tracking and admin subsystem retains Supabase integration.

## Development

Use Node 22 or 24 and Yarn 1.22.22. Run `yarn install --frozen-lockfile`, `yarn build`, and `yarn start`. Copy `.env.example` to `.env.local` and supply the existing public Supabase configuration for tracking/admin. The Vite build reads the existing VITE_ names. Never add service-role or other private keys.

`yarn test` runs the unit tests. `node scripts/check-preview.mjs http://localhost:3000` checks preview routes without creating or changing records.

## Preview deployment

Vercel settings are provided in vercel.json. Push the preview branch and keep main unchanged. Preview indexing remains disabled. Before production, confirm the accepted preview, test tracking with a user-supplied fiscal key, verify the Supabase environment, and explicitly enable SEO_INDEXING_ENABLED=true only for the official domain.

See docs/vercel-preview.md for scope and checks.
