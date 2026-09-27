import type { Metadata } from 'next';
import { PageFoot, TapeScene } from '@/components/tape/parts';
import { getAbout } from '@/lib/tape';

export const metadata: Metadata = {
  title: 'about',
  description: 'About Marvin Ma: product manager at YouWare, Cursor Ambassador, former live coding performer in Beijing.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const about = getAbout();
  if (!about) return null;
  return (
    <article className="page">
      <TapeScene seed="about" age={0.15} />
      <h1>about</h1>
      <div className="about-body">
        {about.hero.subtitle && <p className="lede">{about.hero.subtitle}</p>}
        {about.hero.description && <p>{about.hero.description}</p>}
        {about.current && <p>{about.current}</p>}

        <h2>fun facts</h2>
        <ul className="facts">
          {about.facts.map((f) => <li key={f}>{f}</li>)}
        </ul>

        <h2>contact</h2>
        <div className="contact">
          {about.contact.map((c) => (
            <div key={c.label} className="contact-row">
              <span>{c.label}</span>
              {c.label === 'Email' ? (
                <span className="selectable">{c.value}</span>
              ) : (
                <a href={c.href} target="_blank" rel="noopener noreferrer">{c.value}</a>
              )}
            </div>
          ))}
          {about.resume && (
            <div className="contact-row">
              <span>Resume</span>
              <a href={about.resume.href} target="_blank" rel="noopener noreferrer">{about.resume.label ?? 'PDF'}</a>
            </div>
          )}
        </div>
      </div>
      <PageFoot />
    </article>
  );
}
