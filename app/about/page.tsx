import type { Metadata } from 'next';
import { TapeScene } from '@/components/tape/parts';
import Booklet from '@/components/tape/Booklet';
import CoverArt from '@/components/tape/CoverArt';
import { getAbout } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'about',
  description: 'About Marvin Ma: product manager at YouWare, Cursor Ambassador, former live coding performer in Beijing.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const about = getAbout();
  if (!about) return null;
  const links = [
    ...about.contact.map((c) => ({ label: c.label, value: c.value, href: c.href })),
    ...(about.resume ? [{ label: 'Resume', value: 'PDF', href: about.resume.href }] : []),
  ];
  const sideA = [about.hero.description, about.current].filter((p): p is string => !!p);
  return (
    <Booklet path="/about" className="about">
      <TapeScene seed="about" age={0.15} />
      {/* The cover of the booklet. */}
      <section className="cover">
        <CoverArt />
        <p className="cover-handle">marvin ma</p>
        <h1 className="cover-name">marv1nnnnn<span className="visually-hidden">, about</span></h1>
        <p className="cover-role">{about.hero.subtitle}</p>
        <p className="cover-spec" aria-hidden="true">side a · now&nbsp;&nbsp;/&nbsp;&nbsp;side b · before</p>
      </section>

      <section>
        <h2><span>side a · now</span></h2>
        <div className="verses">
          {sideA.map((p) => <p key={p}>{p}</p>)}
        </div>
      </section>

      <section>
        <h2><span>side b · before</span></h2>
        <ol className="tracklist">
          {about.facts.map((f, i) => <li key={f}><span>b{i + 1}</span>{f}</li>)}
        </ol>
      </section>

      <section className="credits">
        <h2><span>credits</span></h2>
        <dl>
          {links.map((c) => (
            <div key={c.label} className="credit">
              <dt>{c.label}</dt>
              <dd>
                {c.label === 'Email' ? (
                  <span className="selectable">{c.value}</span>
                ) : (
                  <a href={c.href} target="_blank" rel="noopener noreferrer">{c.value}</a>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </Booklet>
  );
}
