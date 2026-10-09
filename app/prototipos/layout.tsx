import type { Metadata } from 'next';
import { Seletor } from './seletor';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PrototypesLayout({ children }: { children: React.ReactNode }) {
  return <><link rel="stylesheet" href="/assets/fonts.css" precedence="default" />{children}<Seletor /></>;
}
