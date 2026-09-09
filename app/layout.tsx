import type { Metadata } from 'next';
import { SITE_URL, HOME_TITLE, HOME_DESCRIPTION, organizationGraph } from '../lib/seo.mjs';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  robots: { index: false, follow: true },
  icons: { icon: { url: '/favicon-rjlima.svg', type: 'image/svg+xml' } },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  const data=JSON.stringify(organizationGraph()).replace(/</g,'\\u003c');
  return <html lang="pt-BR" data-palette="marca"><head><link rel="stylesheet" href="/assets/fonts.css"/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:data}}/></head><body>{children}</body></html>;
}
