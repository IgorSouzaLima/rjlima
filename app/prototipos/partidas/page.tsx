import type { Metadata } from 'next';
import Variante from '../variantes/partidas/Variante';

export const metadata: Metadata = { title: 'Painel de partidas · Protótipo RJ Lima', robots: { index: false, follow: false } };

export default function Page() {
  return <Variante />;
}
