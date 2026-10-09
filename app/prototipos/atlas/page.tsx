import type { Metadata } from 'next';
import Variante from '../variantes/atlas/Variante';

export const metadata: Metadata = { title: 'Atlas rodoviário · Protótipo RJ Lima', robots: { index: false, follow: false } };

export default function Page() {
  return <Variante />;
}
