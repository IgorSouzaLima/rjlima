import type { Metadata } from 'next';
import Variante from '../variantes/placa/Variante';

export const metadata: Metadata = { title: 'Placa de rodovia · Protótipo RJ Lima', robots: { index: false, follow: false } };

export default function Page() {
  return <Variante />;
}
