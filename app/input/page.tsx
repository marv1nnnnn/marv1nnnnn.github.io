import type { Metadata } from 'next';
import Link from 'next/link';
import { TapeScene } from '@/components/tape/parts';
import Reel from '@/components/tape/Reel';
import { getCanon } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'input',
  description: 'Fourteen works that stayed with Marvin Ma.',
  alternates: { canonical: '/input' },
};

export default function InputPage() {
  const canon = getCanon();
  return (
    <>
      <TapeScene seed="input" age={0.1} />
      <div id="canon">
        <Reel records={canon} />
      </div>
      <article className="page input-end">
        <h1 className="visually-hidden">input</h1>

        {/* The same fourteen as a plain list, for screen readers and reduced motion. */}
        <div className="canon-fallback">
          <h2><span>stayed with me</span></h2>
          <ol className="canon">
            {canon.map((c) => (
              <li key={c.id}>
                <span className="canon-title">{c.title}</span>
                <span className="canon-by">{c.artist} · {c.medium} · {c.year}</span>
                <q>{c.personalNote}</q>
              </li>
            ))}
          </ol>
        </div>

        <Link href="/log" className="to-log">everything else, as it comes in → log</Link>
      </article>
    </>
  );
}
