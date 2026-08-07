import Link from 'next/link';
import type { SignalProfilePage } from '@/types/scanner';

export default function AboutArchive({ page }: { page: SignalProfilePage }) {
  return (
    <main className="page">
      <header className="about__hero">
        <h1>{page.hero.title}</h1>
        {page.hero.description && <p>{page.hero.description}</p>}
        {page.hero.subtitle && <p className="micro">{page.hero.subtitle}</p>}
      </header>

      <section className="about__blocks" aria-label="Profile">
        {page.sections.map((section) => {
          const lines = section.body.split('\n').map((line) => line.trim()).filter(Boolean);
          const isList = lines.every((line) => line.startsWith('-'));
          return (
            <article key={section.title}>
              <h2>{section.title}</h2>
              {isList ? (
                <ul>{lines.map((line) => <li key={line}>{line.replace(/^-\s*/, '')}</li>)}</ul>
              ) : (
                lines.map((line) => <p key={line}>{line}</p>)
              )}
            </article>
          );
        })}
      </section>

      <nav className="about__links" aria-label="Elsewhere">
        {page.shows?.href && (
          <Link href={page.shows.href}>
            <span>{page.shows.label ?? 'Shows'}</span><span>{page.shows.subtitle} ↗</span>
          </Link>
        )}
        {page.resume?.href && (
          <a href={page.resume.href} target="_blank" rel="noreferrer">
            <span>Resume</span><span>{page.resume.subtitle ?? 'PDF'} ↗</span>
          </a>
        )}
        {page.contact.map((contact) => (
          <a key={contact.label} href={contact.href} target="_blank" rel="noreferrer">
            <span>{contact.label}</span><span>{contact.value} ↗</span>
          </a>
        ))}
      </nav>
    </main>
  );
}
