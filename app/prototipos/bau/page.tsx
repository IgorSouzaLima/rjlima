import type { Metadata } from 'next';
import Variante from '../../../components/home/HomePage';

export const metadata: Metadata = { title: 'Baú e faixa · Protótipo RJ Lima', robots: { index: false, follow: false } };

export default function Page() {
  return <Variante />;
}
