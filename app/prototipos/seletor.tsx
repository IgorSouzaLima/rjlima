'use client';
// Lab bar (same pattern as the FeedTempo hero lab): current variant name, one numbered link per variant and a
// replay button. Keys 1-4 and the arrows switch variants too. Development only; never part of a design.
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { VARIANTES } from './variantes';
import './seletor.css';

export function Seletor() {
  const pathname = usePathname();
  const router = useRouter();
  const found = VARIANTES.findIndex((v) => pathname.endsWith(`/${v.slug}`));
  const atual = Math.max(0, found);

  useEffect(() => {
    // Lab pages that are not variants (e.g. /prototipos/mapa) keep their own controls.
    if (found < 0) return;
    const go = (i: number) => router.push(`/prototipos/${VARIANTES[(i + VARIANTES.length) % VARIANTES.length].slug}`);
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VARIANTES.length) go(n - 1);
      else if (e.key === 'ArrowRight') go(atual + 1);
      else if (e.key === 'ArrowLeft') go(atual - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [atual, found, router]);

  if (found < 0) return null;
  return (
    <nav className="lab-seletor" aria-label="Variantes da landing page">
      <span className="lab-seletor__nome">{VARIANTES[atual].nome}</span>
      {VARIANTES.map((v, i) => (
        <Link key={v.slug} href={`/prototipos/${v.slug}`} title={v.nome} aria-current={i === atual ? 'page' : undefined}>{i + 1}</Link>
      ))}
      <button type="button" title="Rever do começo" aria-label="Rever do começo" onClick={() => { window.scrollTo(0, 0); window.location.reload(); }}>↻</button>
    </nav>
  );
}
