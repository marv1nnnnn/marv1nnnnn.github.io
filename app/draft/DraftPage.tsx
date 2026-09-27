'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './draft.module.css';

type Entry = { title: string; date: string; href: string };

export interface DraftData {
  talks: Entry[];
  works: Entry[];
  essays: Array<Entry & { summary: string }>;
  shows: Array<{ title: string; date: string; venue: string }>;
  canon: Array<{ artist: string; title: string; note: string }>;
  log: Array<{ title: string; creator: string; date: string }>;
  funFacts: string[];
  contact: Array<{ label: string; href: string }>;
  resume: string | null;
}

// Each draft rewrites the same clause; the previous version stays visible, crossed out.
const REWRITES = ['build AI', 'poke at AI', 'get poked by AI', 'argue with AI', 'debug AI', 'get debugged by AI', 'work on AI'];
const FIRST_DRAFT = 14;
const LOG_DEPTH = 24;

function roman(value: number) {
  const numerals: Array<[number, string]> = [[10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
  let rest = value;
  let out = '';
  for (const [size, glyph] of numerals) {
    while (rest >= size) {
      out += glyph;
      rest -= size;
    }
  }
  return out;
}

function Ref({ n }: { n: number }) {
  return <a href={`#n${n}`} className={styles.ref} aria-label={`footnote ${n}`}>{n}</a>;
}

// Keeps a footnote number on the same line as the word it annotates.
function Noted({ word, n }: { word: string; n: number }) {
  return <span className={styles.keep}>{word}<Ref n={n} /></span>;
}

export default function DraftPage({ data }: { data: DraftData }) {
  const [draft, setDraft] = useState(FIRST_DRAFT);

  useEffect(() => {
    try {
      const visits = Number(localStorage.getItem('draft-visits') ?? '0') + 1;
      localStorage.setItem('draft-visits', String(visits));
      setDraft(FIRST_DRAFT + visits - 1);
    } catch {}
  }, []);

  const step = draft - FIRST_DRAFT;
  const crossed = REWRITES[step % REWRITES.length];
  const current = REWRITES[(step + 1) % REWRITES.length];
  const htrk = data.canon.find((record) => record.artist === 'HTRK');

  const seen = new Set<string>();
  const log = data.log.filter((item) => {
    const key = `${item.title}|${item.creator}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const deep = [
    ...data.funFacts.map((text, i) => ({ label: `1a-${roman(i + 1)}`, text, source: '' })),
    ...data.canon.map((record, i) => ({ label: `6a-${roman(i + 1)}`, text: record.note, source: `on ${record.artist}, ${record.title}` })),
    ...log.slice(0, LOG_DEPTH).map((item, i) => ({ label: `6b-${roman(i + 1)}`, text: item.title, source: item.creator })),
  ];

  const loop = () => {
    setDraft((value) => value + 1);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <header className={styles.top}>
          <nav className={styles.nav} aria-label="Sections">
            <a href="#n2">make</a>
            <a href="#n5">think</a>
            <a href="#n6">input</a>
            <a href="#n1">about</a>
          </nav>
          <span className={styles.draftNo}>draft {draft}</span>
        </header>

        <section className={styles.hero}>
          <h1 className={styles.sentence}>
            Hi, I’m <Noted word="Marvin." n={1} /> I <del className={styles.crossed}>{crossed}</del>{' '}
            <ins className={styles.hand}>{current}</ins><Ref n={2} />, used to make noise in <Noted word="Beijing," n={3} />{' '}
            build small things mostly for <Noted word="myself," n={4} /> write now and <Noted word="then," n={5} /> and
            spend too much time <Noted word="listening" n={6} /> at <Noted word="3am." n={7} />
          </h1>
          <p className={styles.hint}>↓ the footnotes are where everything is</p>
        </section>

        <ol className={styles.notes}>
          <li id="n1" className={styles.note}>
            <span className={styles.num}>1</span>
            马进, sometimes Majin. Studied physics, then acoustics, and learned to code on the job. INFP. Two cats.{' '}
            <Link href="/signals/about">More about me →</Link>
          </li>

          <li id="n2" className={styles.note}>
            <span className={styles.num}>2</span>
            At YouWare. I also help out with Cursor community meetups. Some talks and workshops:
            <ul className={styles.plain}>
              {data.talks.map((talk) => (
                <li key={talk.href}><Link href={talk.href}>{talk.title}</Link> <span className={styles.meta}>’{talk.date.slice(2, 4)}</span></li>
              ))}
            </ul>
          </li>

          <li id="n3" className={styles.note}>
            <span className={styles.num}>3</span>
            Live coding, circuit bending and improvised electronics, 2016–2021, mostly at fRUITYSPACE 水果, alongside people
            much better at it than me:
            <ul className={styles.plain}>
              {data.shows.slice(0, 4).map((show) => (
                <li key={show.date + show.title}><span className={styles.meta}>{show.date.slice(0, 7).replace('-', '.')}</span> {show.title} — {show.venue}</li>
              ))}
            </ul>
            <Link href="/shows">All {data.shows.length} shows →</Link>
          </li>

          <li id="n4" className={styles.note}>
            <span className={styles.num}>4</span>
            Small tools, made to scratch my own itch:
            <ul className={styles.plain}>
              {data.works.map((work) => (
                <li key={work.href}><Link href={work.href} className={styles.big} title={work.title}>{work.title.split(':')[0]}</Link></li>
              ))}
            </ul>
            <p className={styles.sub}><span className={styles.subNum}>4a.</span> Indie games attempted: several. Finished: <em>not yet</em>.</p>
          </li>

          <li id="n5" className={styles.note}>
            <span className={styles.num}>5</span>
            Notes from thinking out loud, probably wrong in places:
            <ul className={styles.plain}>
              {data.essays.map((essay) => (
                <li key={essay.href} className={styles.essay}>
                  <Link href={essay.href} className={styles.big}>{essay.title}</Link>
                  <span className={styles.meta}>{essay.date.replaceAll('-', '.')} — {essay.summary.split(/(?<=\.)\s/)[0]}</span>
                </li>
              ))}
            </ul>
            <p className={styles.margin} aria-hidden="true">still figuring this out</p>
          </li>

          <li id="n6" className={styles.note}>
            <span className={styles.num}>6</span>
            A few things that stayed with me (partial, unfair, always changing):
            <p className={styles.canon}>
              {data.canon.map((record, i) => (
                <span key={record.artist + record.title}>
                  {record.artist}, <em>{record.title}</em>{i < data.canon.length - 1 ? '; ' : '.'}
                </span>
              ))}{' '}
              <Link href="/signals/influences">Why each one →</Link>
            </p>
            <p className={styles.sub}>
              <span className={styles.subNum}>6b.</span> And a running log of what I watch, read and play, {data.log.length} entries
              so far. Lately: {data.log.slice(0, 3).map((item) => item.title).join(' · ')}.{' '}
              <Link href="/signals/listening">The whole log →</Link>
            </p>
          </li>

          <li id="n7" className={styles.note}>
            <span className={styles.num}>7</span>
            {htrk ? <>“{htrk.note}” — on HTRK.</> : 'The hour HTRK was made for.'}
          </li>
        </ol>

        <footer className={styles.footer}>
          <span className={styles.num}>8</span> Say hi:{' '}
          {data.contact.map((item, i) => (
            <span key={item.label}>
              <a href={item.href}>{item.label === 'Email' ? item.href.replace('mailto:', '') : item.label}</a>
              {i < data.contact.length - 1 ? ' · ' : ''}
            </span>
          ))}
          {data.resume && <> · <a href={data.resume}>Resume</a></>}
        </footer>
      </div>

      <section id="fall" className={styles.fall} aria-label="Optional: more footnotes">
        <p className={styles.gate}>Everything above is the website. Below this line it’s just footnotes, and they don’t end.</p>
        <ol className={styles.deep}>
          {deep.map((item, i) => {
            const t = i / Math.max(deep.length - 1, 1);
            return (
              <li
                key={item.label}
                className={styles.deepNote}
                style={{
                  paddingLeft: `${t * 58}%`,
                  fontSize: `${16 - t * 7}px`,
                  opacity: 1 - t * 0.5,
                  color: t > 0.62 ? '#EFE9DC' : '#1A1814',
                }}
              >
                <span className={styles.subNum}>{item.label}.</span> {item.text}
                {item.source && <span className={styles.source}> — {item.source}</span>}
              </li>
            );
          })}
        </ol>
        <div className={styles.void} role="img" aria-label="there is nothing down here">
          {'there is nothing down here'.split('').map((char, i) => (
            <span key={i} style={{ transform: `translateY(${((i * 53) % 17) - 8 + i * 0.6}px) rotate(${((i * 31) % 11) - 5}deg)`, opacity: 1 - i / 34 }}>
              {char}
            </span>
          ))}
        </div>
        <p className={styles.cats}>(except the cats)</p>
        <button type="button" className={styles.loop} onClick={loop}>
          back to the top · draft {draft + 1} ↺
        </button>
      </section>
    </main>
  );
}
