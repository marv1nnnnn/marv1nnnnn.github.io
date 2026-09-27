'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SignalListItem } from '@/types/scanner';
import { Worn } from './parts';

const ORDER = ['music', 'video', 'text', 'game', 'live'];
const LABEL: Record<string, string> = { music: 'heard', video: 'watched', text: 'read', game: 'played', live: 'live' };
const DAY = 864e5;
const SEG = 12; // height of one entry on the strip, gap included

// The log as a strip of tape: one mark per entry at its date, stacked when days share several.
// Drag, hover or use the arrow keys to move the read head; the entry under it plays back below.
export default function LogDeck({ items }: { items: SignalListItem[] }) {
  const [kind, setKind] = useState('all');
  const [sel, setSel] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const marks = useMemo(() => {
    const times = items.map((i) => Date.parse(i.date ?? ''));
    const t0 = Math.min(...times) - 6 * DAY;
    const t1 = Math.max(...times) + 6 * DAY;
    const perDay: Record<string, number> = {};
    for (const i of items) perDay[i.date ?? ''] = (perDay[i.date ?? ''] ?? 0) + 1;
    const seen: Record<string, number> = {};
    return {
      t0,
      t1,
      list: items.map((item, index) => {
        const d = item.date ?? '';
        const k = (seen[d] = (seen[d] ?? -1) + 1);
        const n = perDay[d];
        const x = (times[index] - t0) / (t1 - t0);
        return { item, index, x, y: (k - (n - 1) / 2) * SEG, age: 1 - x };
      }),
    };
  }, [items]);

  const months = useMemo(() => {
    const out: { label: string; x: number; year: boolean }[] = [];
    const d = new Date(marks.t0);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + 1);
    while (d.getTime() < marks.t1) {
      const m = d.getUTCMonth();
      const year = m === 0 || out.length === 0;
      out.push({ label: year ? `${d.getUTCFullYear()}.${String(m + 1).padStart(2, '0')}` : String(m + 1).padStart(2, '0'), x: (d.getTime() - marks.t0) / (marks.t1 - marks.t0), year });
      d.setUTCMonth(m + 1);
    }
    return out;
  }, [marks]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items) c[i.type] = (c[i.type] ?? 0) + 1;
    return c;
  }, [items]);
  const kinds = [...ORDER.filter((k) => counts[k]), ...Object.keys(counts).filter((k) => !ORDER.includes(k))];
  const shows = (i: SignalListItem) => kind === 'all' || i.type === kind;
  // Visible entries, newest first (the order the log is sorted in).
  const visible = marks.list.filter((m) => shows(m.item));

  useEffect(() => {
    if (!shows(items[sel])) setSel(visible[0]?.index ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const pick = (clientX: number, clientY: number) => {
    const el = strip.current;
    if (!el || !visible.length) return;
    const r = el.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - (r.top + r.height / 2);
    let best = visible[0], bestD = Infinity;
    for (const m of visible) {
      const d = Math.abs(m.x * r.width - px) + 0.3 * Math.abs(m.y - py);
      if (d < bestD) { bestD = d; best = m; }
    }
    setSel(best.index);
  };

  const step = (dir: number) => {
    const at = visible.findIndex((m) => m.index === sel);
    const next = visible[Math.min(visible.length - 1, Math.max(0, at + dir))];
    if (next) setSel(next.index);
  };

  const current = marks.list[sel];
  const pos = visible.findIndex((m) => m.index === sel);
  const now = current?.item;

  const groups = useMemo(() => {
    const out: { key: string; items: { item: SignalListItem; index: number }[] }[] = [];
    marks.list.forEach(({ item, index }) => {
      if (!shows(item)) return;
      const key = (item.date ?? '').slice(0, 7);
      const last = out[out.length - 1];
      if (last?.key === key) last.items.push({ item, index });
      else out.push({ key, items: [{ item, index }] });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks, kind]);

  return (
    <div className="deck">
      <div className="log-filter" role="group" aria-label="Filter by kind">
        {['all', ...kinds].map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>
            {k !== 'all' && <i className={`swatch k-${k}`} aria-hidden="true" />}
            {k === 'all' ? 'all' : LABEL[k] ?? k} <span>{k === 'all' ? items.length : counts[k]}</span>
          </button>
        ))}
      </div>

      <div
        className="strip"
        ref={strip}
        tabIndex={0}
        role="slider"
        aria-label="Read head"
        aria-valuemin={1}
        aria-valuemax={visible.length}
        aria-valuenow={visible.length - pos}
        aria-valuetext={now ? `${now.title}, ${now.creator}, ${now.date}` : undefined}
        onPointerDown={(e) => { dragging.current = true; strip.current?.setPointerCapture(e.pointerId); pick(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (dragging.current || e.pointerType === 'mouse') pick(e.clientX, e.clientY); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') { e.preventDefault(); step(1); }
          else if (e.key === 'ArrowRight') { e.preventDefault(); step(-1); }
          else if (e.key === 'Home') { e.preventDefault(); setSel(visible[visible.length - 1]?.index ?? sel); }
          else if (e.key === 'End') { e.preventDefault(); setSel(visible[0]?.index ?? sel); }
        }}
      >
        <span className="strip-line" aria-hidden="true" />
        {marks.list.map((m) => (
          <span
            key={m.index}
            className={`blip k-${m.item.type}${shows(m.item) ? '' : ' is-off'}${m.index === sel ? ' is-on' : ''}`}
            style={{ left: `${(m.x * 100).toFixed(3)}%`, transform: `translate(-50%, calc(-50% + ${m.y}px))`, opacity: shows(m.item) ? (m.index === sel ? 1 : 1 - m.age * 0.6) : undefined }}
            aria-hidden="true"
          />
        ))}
        {current && <span className="strip-head" style={{ left: `${(current.x * 100).toFixed(3)}%` }} aria-hidden="true" />}
        <div className="strip-months" aria-hidden="true">
          {months.map((m) => <span key={m.label + m.x} className={m.year ? 'is-year' : undefined} style={{ left: `${(m.x * 100).toFixed(3)}%` }}><b>{m.label}</b></span>)}
        </div>
      </div>

      {now && (
        <div className="deck-read" aria-live="polite">
          <span className="deck-meta">
            <i className={`swatch k-${now.type}`} aria-hidden="true" />
            {LABEL[now.type] ?? now.type} · {(now.date ?? '').replaceAll('-', '.')} · {String(visible.length - pos).padStart(3, '0')} / {visible.length}
          </span>
          <span className="deck-title">
            {now.url ? <a href={now.url} target="_blank" rel="noopener noreferrer">{now.title} ↗</a> : now.title}
          </span>
          <span className="deck-by">{now.creator}</span>
        </div>
      )}

      {groups.map((m) => (
        <div className="year month" id={`log-${m.key}`} key={m.key}>
          <p className="year-label" aria-hidden="true"><Worn text={m.key.replace('-', '.')} date={`${m.key}-15`} /></p>
          <ul className="rows compact">
            {m.items.map(({ item: l, index }) => {
              const title = <><Worn text={l.title} date={l.date ?? ''} /> <span className="by">{l.creator}</span></>;
              return (
                <li className={`row${index === sel ? ' is-on' : ''}`} key={`${l.date}-${l.title}`}>
                  <span className="date">{(l.date ?? '').slice(8, 10)}</span>
                  <span className="title">{l.url ? <a href={l.url} target="_blank" rel="noopener noreferrer">{title}</a> : title}</span>
                  <span className="kind">{LABEL[l.type] ?? l.type}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
