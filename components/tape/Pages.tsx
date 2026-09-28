'use client';

import { Children, isValidElement, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TRACKS, counter, headOf, spanOf, trackIndex } from './tracks';

// The booklet that came with the tape, as a booklet: fixed pages, a spread of two on a wide
// screen and one at a time on a phone, turned like paper. Turning a page is winding the tape:
// scrolling, the pencil and the arrow keys all move the same position, and when it comes to
// rest the nearest page settles flat.
//
// Pages takes its content as a list of blocks (its children) and fills pages with them in order.
// A block's class steers it: `keep` stays with the block after it, `own` gets a page to itself,
// `brk` starts a new page. Without script, or with reduced motion, the blocks simply run on in
// one column (the server renders that too).

interface Layout { pages: number[][]; spread: boolean; w: number; h: number; top: number }

const classOf = (node: React.ReactNode) =>
  isValidElement(node) ? String((node.props as { className?: string }).className ?? '') : '';
const has = (cls: string, name: string) => cls.split(/\s+/).includes(name);

// The page size for this screen, and whether it shows two pages side by side.
function measureScreen() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const top = document.querySelector('.top')?.getBoundingClientRect().bottom ?? 80;
  const spread = vw >= 920;
  const h = Math.max(420, Math.min(spread ? 720 : 860, vh - top - (spread ? 52 : 22)));
  const w = spread ? Math.min(480, Math.floor((vw - 110) / 2), Math.round(h * 0.74)) : Math.min(vw - 16, 560);
  return { spread, w, h, top };
}

export default function Pages({ path, title, lede, kicker, label, children }: {
  path: string;
  title?: React.ReactNode;
  lede?: React.ReactNode;
  kicker?: React.ReactNode; // a line above the title (detail pages)
  label?: string; // replaces the track name (detail pages)
  children: React.ReactNode;
}) {
  const i = trackIndex(path);
  const n = String(i + 1).padStart(2, '0');
  const name = label ?? TRACKS[i].label;
  const [lo, hi] = spanOf(path);

  // The title page opens the booklet; the small print closes it.
  const blocks = useMemo(() => {
    const list = Children.toArray(children).filter((c) => isValidElement(c) || typeof c === 'string');
    return [
      <header key="title" className="own title-page">
        <p className="title-top"><span>side a · marv1nnnnn</span><span>{counter(lo)}–{counter(hi)}</span></p>
        <div className="title-mid">
          <p className="title-no">{n}</p>
          {kicker && <p className="title-kicker">{kicker}</p>}
          {title && <h1 className="leaf-title" data-anchor>{title}</h1>}
          {lede && <p className="leaf-lede">{lede}</p>}
        </div>
        <p className="title-credit">words &amp; music: marv1nnnnn</p>
      </header>,
      ...list,
      <footer key="colophon" className="colophon">
        <p>℗ &amp; © marv1nnnnn · track {n} of {String(TRACKS.length).padStart(2, '0')}</p>
        <p>home taping is killing music. tape it anyway.</p>
      </footer>,
    ];
  }, [children, n, title, lede, kicker, lo, hi]);
  const signature = blocks.map((b) => (isValidElement(b) ? String(b.key) : '')).join('|');

  const flow = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const leaves = useRef<(HTMLDivElement | null)[]>([]);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [remeasure, setRemeasure] = useState(0);

  // Fill pages from the blocks' heights, measured in the one-column flow at the page's width.
  useLayoutEffect(() => {
    if (layout) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = flow.current;
    if (!el) return;
    const screen = measureScreen();
    el.style.setProperty('--pw', `${screen.w}px`);
    el.style.setProperty('--ph', `${screen.h}px`);
    const room = el.querySelector<HTMLElement>('.flow-room')?.offsetHeight ?? screen.h - 120;
    const cells = [...el.querySelectorAll<HTMLElement>(':scope > .blk')];
    const pages: number[][] = [[]];
    let used = 0;
    const heights = cells.map((c) => c.offsetHeight);
    cells.forEach((cell, k) => {
      const cls = cell.dataset.kind ?? '';
      const own = has(cls, 'own');
      const hk = heights[k];
      const page = pages[pages.length - 1];
      let fresh = own || has(cls, 'brk') || used + hk > room;
      // A heading (or a year) never ends a page on its own.
      if (!fresh && has(cls, 'keep') && k + 1 < cells.length && used + hk + Math.min(heights[k + 1], room * 0.25) > room) fresh = true;
      if (fresh && page.length) {
        pages.push([]);
        used = 0;
      }
      pages[pages.length - 1].push(k);
      used += own ? room : hk;
    });
    setLayout({ pages: pages.filter((p) => p.length), ...screen });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, signature, remeasure]);

  // New content (the log's filter) or a new screen size: lay the pages out again.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setLayout(null);
  }, [signature]);
  useEffect(() => {
    let t = 0;
    let last = `${window.innerWidth}x${window.innerHeight}`;
    const onResize = () => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        const now = `${window.innerWidth}x${window.innerHeight}`;
        // Phones change height as the address bar comes and goes; only width or a big change counts.
        const [w0, h0] = last.split('x').map(Number);
        if (Math.abs(window.innerWidth - w0) < 2 && Math.abs(window.innerHeight - h0) < 140) return;
        last = now;
        setLayout(null);
        setRemeasure((r) => r + 1);
      }, 180);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, []);

  const count = layout?.pages.length ?? 0;
  const spread = layout?.spread ?? false;
  // Leaves: on a spread each leaf carries a right page on its front and the next left page on its
  // back; on a phone each leaf is one page.
  const leafCount = spread ? Math.ceil(count / 2) : count;
  const steps = spread ? Math.ceil((count - 1) / 2) : Math.max(0, count - 1);

  // Turning: the scroll position is the page position.
  useEffect(() => {
    if (!layout) return;
    const vh = () => window.innerHeight;
    const stepPx = () => vh() * 0.8;
    let raf = 0;
    const draw = () => {
      raf = 0;
      const q = Math.min(steps, Math.max(0, window.scrollY / stepPx()));
      leaves.current.forEach((leaf, j) => {
        if (!leaf) return;
        const a = Math.min(1, Math.max(0, q - j));
        leaf.style.transform = `rotateY(${(-180 * a).toFixed(2)}deg)`;
        leaf.style.zIndex = String(a <= 0 ? leafCount - j : a >= 1 ? j + 1 : leafCount + 2);
        leaf.style.setProperty('--lift', Math.sin(a * Math.PI).toFixed(3));
        leaf.classList.toggle('is-turned', a >= 1);
        // Browsers still hit-test the side facing away; only the side showing takes clicks.
        leaf.classList.toggle('is-over', a > 0.5);
      });
      stage.current?.style.setProperty('--turned', (q / Math.max(1, steps)).toFixed(3));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };
    // At rest, the nearest page lies flat.
    let settle = 0;
    let aim: number | null = null;
    const onScroll = () => {
      schedule();
      clearTimeout(settle);
      settle = window.setTimeout(() => {
        aim = null;
        if (document.body.classList.contains('is-winding-by-hand') || document.body.dataset.wind) return;
        const q = window.scrollY / stepPx();
        const target = Math.round(Math.min(steps, Math.max(0, q)));
        if (Math.abs(q - target) > 0.004) window.scrollTo({ top: target * stepPx(), behavior: 'smooth' });
      }, 170);
    };
    // The arrow keys (sent on by the deck) turn one page, and only past the last one wind on.
    // Quick presses add up: each counts from the page the last one was heading for.
    const onArrow = (e: Event) => {
      const dir = (e as CustomEvent<number>).detail;
      const at = aim ?? Math.round(window.scrollY / stepPx());
      const next = at + dir;
      if (next < 0 || next > steps) {
        aim = null;
        return;
      }
      e.preventDefault();
      aim = next;
      window.scrollTo({ top: next * stepPx(), behavior: 'smooth' });
    };
    const onTurn = (e: Event) => onArrow(e);
    // A link to something inside the booklet (#writing) opens it at that page.
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) {
      const target = document.getElementById(id);
      const page = target?.closest<HTMLElement>('[data-page]');
      if (page) {
        const k = Number(page.dataset.page);
        const step = spread ? Math.ceil(k / 2) : k;
        window.scrollTo({ top: step * stepPx(), behavior: 'instant' as ScrollBehavior });
      }
    }
    draw();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('tape:arrow', onArrow);
    window.addEventListener('booklet:turn', onTurn);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('tape:arrow', onArrow);
      window.removeEventListener('booklet:turn', onTurn);
    };
  }, [layout, steps, leafCount, spread]);

  if (!layout) {
    return (
      <div className="booklet-flow" ref={flow}>
        {/* The height a page leaves for its content, measured with the page's own padding. */}
        <div className="flow-page" aria-hidden="true"><div className="flow-room" /></div>
        {blocks.map((b, k) => (
          <div className="blk" data-kind={classOf(b)} key={isValidElement(b) ? b.key ?? k : k}>{b}</div>
        ))}
      </div>
    );
  }

  const { w, h, top, pages } = layout;
  const through = (k: number) => (steps ? (spread ? Math.ceil(k / 2) : k) / steps : 0);
  const page = (k: number, side: 'left' | 'right') => {
    const ids = pages[k];
    if (!ids) return <div className={`pg pg-${side} pg-blank`} />;
    const own = ids.length === 1 && has(classOf(blocks[ids[0]]), 'own');
    return (
      <div className={`pg pg-${side}${k === 0 ? ' pg-title' : ''}${own ? ' pg-own' : ''}`} data-page={k}>
        {k > 0 && <p className="pg-head" aria-hidden="true"><span>{n} · {name}</span><span>side a</span></p>}
        <div className="pg-body">{ids.map((id) => <div className="blk" key={id}>{blocks[id]}</div>)}</div>
        <p className="pg-foot" aria-hidden="true">
          <span className="pg-count">{counter(headOf(path, through(k)))}</span>
          <span className="pg-no">— {k + 1} —</span>
          <span className="pg-of">{k + 1}/{count}</span>
        </p>
        <button
          type="button"
          className={`pg-corner pg-corner-${side}`}
          aria-label={side === 'right' ? 'Next page' : 'Previous page'}
          onClick={() => window.dispatchEvent(new CustomEvent('booklet:turn', { detail: side === 'right' ? 1 : -1, cancelable: true }))}
        />
      </div>
    );
  };

  return (
    <div
      className={`booklet-book${spread ? ' is-spread' : ' is-single'}`}
      style={{ '--pw': `${w}px`, '--ph': `${h}px`, '--stage-top': `${top + (spread ? 26 : 10)}px`, height: `calc(${steps * 80}vh + 100vh)` } as React.CSSProperties}
    >
      <div className="booklet-stage" ref={stage}>
        <div className="booklet-pages">
          {/* Inside the front cover, under everything on the left. */}
          {spread && (
            <div className="pg pg-left pg-inside" aria-hidden="true">
              <p className="inside-mark">marv1nnnnn</p>
              <p className="inside-small">side a · {TRACKS.map((t, k) => `${String(k + 1).padStart(2, '0')} ${t.label}`).join(' · ')}</p>
            </div>
          )}
          {/* The back cover, under everything on the right: what shows once every page is turned. */}
          {spread && (
            <div className="pg pg-right pg-inside pg-back" aria-hidden="true">
              <p className="inside-small">marv1nnnnn · side a</p>
              <p className="inside-small">℗ &amp; © marv1nnnnn. all rights of the producer and of the owner of the work reproduced reserved.</p>
            </div>
          )}
          {Array.from({ length: leafCount }, (_, j) => (
            <div className="leaf" key={j} ref={(el) => { leaves.current[j] = el; }}>
              <div className="face front">{page(spread ? 2 * j : j, 'right')}</div>
              <div className="face back">{spread ? page(2 * j + 1, 'left') : <div className="pg pg-left pg-blank" />}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
