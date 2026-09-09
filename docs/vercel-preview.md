# Approved site preview

Original scope: a separate Vercel preview from `codex/previa-site-aprovado`. The user subsequently approved production publication.

The accepted React interface uses Next.js for Vercel. Existing tracking and admin pages keep their Vite/Supabase implementation, compiled to `public/legacy` and served through the original public paths. The current website remains on main.

Validation: run the existing tracking normalization tests and new website tests; build both entrypoints; verify HTTP routes, assets, noindex and WhatsApp. Do not create or modify invoice records during verification. Actual tracking lookup needs a user-provided fiscal key.

Keep VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY and optional VITE_TRACKING_API_URL available for Preview builds. No private keys are bundled. SEO_INDEXING_ENABLED remains false during preview.

## Verification completed

- 20 existing and new unit tests passed.
- Next.js production build and TypeScript passed using webpack.
- HTTP checks passed for home, city directory, tracking, admin/login, robots, sitemap, logo, fonts, truck image and original PDF.
- Tracking and admin backend code is unchanged from main; production Supabase variables still need to be present in Vercel Preview. No invoice data was read or changed during local checks.
- Main baseline: b49e55e6fde94fbbb2ed690d0b8b6664fa1f9d79.

## Approved production release

The user authorized replacing the official site after reviewing the deployed Vercel preview. Indexing is explicitly enabled in next.config.ts, with the exact official hostname guard and comparison noindex retained. SEO_INDEXING_ENABLED=false can disable indexing.

The preview HTTP checks passed on the deployed Vercel URL. Public Supabase project and anon configuration matched the previous production assets. No invoice records were read or modified. A real fiscal-key lookup remains unverified.

Rollback reference: b49e55e6fde94fbbb2ed690d0b8b6664fa1f9d79.
