import Link from 'next/link';
import { HomeControls, TapeScene } from '@/components/tape/parts';
import { getEssays } from '@/lib/tape';

export default function Home() {
  const latest = getEssays()[0];
  return (
    <section className="home" aria-label="Home">
      <TapeScene seed="home" home />
      <h1 className="visually-hidden">Marvin Ma, marv1nnnnn</h1>
      <div className="home-bottom">
        <div className="intro">
          <p>AI engineer at YouWare. Used to make noise in Beijing. Building agents, mostly for myself.</p>
          {latest && <Link className="latest" href={`/think/${latest.id}`}>latest: {latest.title} →</Link>}
        </div>
        <HomeControls />
      </div>
    </section>
  );
}
