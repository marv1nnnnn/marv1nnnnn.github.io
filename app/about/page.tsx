import type { Metadata } from 'next';
import { TapeScene } from '@/components/tape/parts';
import JCard from '@/components/tape/JCard';
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
  return (
    <article className="page about">
      <TapeScene seed="about" age={0.15} />
      <h1 className="visually-hidden">about</h1>
      <JCard
        name="马进"
        handle="marv1nnnnn"
        role={about.hero.subtitle ?? ''}
        sideA={[about.hero.description, about.current].filter((p): p is string => !!p)}
        sideB={about.facts}
      />

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
    </article>
  );
}
