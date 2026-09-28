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
    <Booklet path="/about" title="about" lede={about.hero.subtitle} className="about">
      <TapeScene seed="about" age={0.15} />
      {/* The booklet's cover art, a page of its own. */}
      <section className="own cover" key="cover">
        <CoverArt />
        <p className="cover-handle">marvin ma</p>
        <p className="cover-name">marv1nnnnn</p>
        <p className="cover-spec" aria-hidden="true">side a · now&nbsp;&nbsp;/&nbsp;&nbsp;side b · before</p>
      </section>

      <h2 className="keep brk" key="side-a"><span>side a · now</span></h2>
      {sideA.map((p) => <p className="verse" key={p}>{p}</p>)}

      <h2 className="keep" key="side-b"><span>side b · before</span></h2>
      {about.facts.map((f, i) => <p className="track-b" key={f}><span>b{i + 1}</span>{f}</p>)}

      <h2 className="keep brk" key="credits"><span>credits</span></h2>
      {links.map((c) => (
        <p key={c.label} className="credit">
          <span className="credit-k">{c.label}</span>
          <span className="credit-v">
            {c.label === 'Email' ? (
              <span className="selectable">{c.value}</span>
            ) : (
              <a href={c.href} target="_blank" rel="noopener noreferrer">{c.value}</a>
            )}
          </span>
        </p>
      ))}
    </Booklet>
  );
}
