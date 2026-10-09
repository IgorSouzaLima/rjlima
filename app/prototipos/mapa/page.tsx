import type { Metadata } from 'next';
import MapaLab from './MapaLab';

export const metadata: Metadata = { title: 'Opções do mapa · Protótipo RJ Lima', robots: { index: false, follow: false } };

export default function Page() {
  return <MapaLab />;
}
