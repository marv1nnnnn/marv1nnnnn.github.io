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

// A page holds pieces of blocks: most whole, but a long run of text is cut between two lines and
// goes on at the top of the next page, as in a book (from and to are pixels into the block).
interface Piece { k: number; from: number; to: number | null }
interface Layout { pages: Piece[][]; spread: boolean; w: number; h: number; top: number; vh: number; scale: number }

// On a phone the pages lie in a column, this far apart, and the browser snaps the scroll to each.
const GAP = 14;

// Where each line of text in a block ends, in pixels from the block's top. Only plain text is cut:
// a block with a picture, code or a table in it moves on whole. A line ends below everything on
// it, the text and any inline box with a background of its own (code), so no sliver of it is
// left at the top of the next page.
function lineEnds(cell: HTMLElement) {
  if (cell.querySelector('img, svg, pre, table, figure, iframe, video')) return null;
  const top = cell.getBoundingClientRect().top;
  const boxes: [number, number][] = [];
  const add = (rects: DOMRectList) => {
    for (const r of rects) if (r.height > 0) boxes.push([r.top - top, r.bottom - top]);
  };
  const walk = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let t = walk.nextNode(); t; t = walk.nextNode()) {
    range.selectNodeContents(t);
    add(range.getClientRects());
  }
  cell.querySelectorAll('code, kbd, mark').forEach((el) => add(el.getClientRects()));
  boxes.sort((a, b) => a[0] - b[0]);
  const ends: number[] = [];
  let bottom = -Infinity;
  for (const [t, b] of boxes) {
    if (t < bottom - 2) bottom = Math.max(bottom, b); // on the same line
    else {
      if (bottom > -Infinity) ends.push(Math.ceil(bottom));
      bottom = b;
    }
  }
  if (bottom > -Infinity) ends.push(Math.ceil(bottom));
  return ends;
}

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
  // A big screen gets the same pages drawn larger (never smaller), so nothing is laid out again
  // and the type keeps its proportions.
  const scale = spread ? Math.max(1, Math.min(1.6, (vw - 64) / (2 * w), (vh - top - 54) / h)) : 1;
  return { spread, w, h, top, vh, scale };
}

// Easing for a turn: slow off the stack, quick through the middle, slow onto the other side.
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

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
  const inside = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [remeasure, setRemeasure] = useState(0);

  // Fill pages from the blocks' heights, measured in the one-column flow at the page's width.
  useLayoutEffect(() => {
    if (layout) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Measure once the type is in; until then the one column stands in.
    if (document.fonts && document.fonts.status !== 'loaded') {
      let alive = true;
      document.fonts.ready.then(() => { if (alive) setRemeasure((r) => r + 1); });
      return () => { alive = false; };
    }
    const el = flow.current;
    if (!el) return;
    const screen = measureScreen();
    el.style.setProperty('--pw', `${screen.w}px`);
    el.style.setProperty('--ph', `${screen.h}px`);
    const room = el.querySelector<HTMLElement>('.flow-room')?.offsetHeight ?? screen.h - 120;
    const cells = [...el.querySelectorAll<HTMLElement>(':scope > .blk')];
    const pages: Piece[][] = [[]];
    let used = 0;
    const heights = cells.map((c) => c.offsetHeight);
    const turn = () => { pages.push([]); used = 0; };
    cells.forEach((cell, k) => {
      const cls = cell.dataset.kind ?? '';
      const own = has(cls, 'own');
      const hk = heights[k];
      const page = pages[pages.length - 1];
      // Text that does not fit is cut after the last line that does, and goes on over the page.
      if ((has(cls, 'prose') || has(cls, 'verse')) && !own && !has(cls, 'brk') && !has(cls, 'keep') && used + hk > room) {
        const ends = lineEnds(cell);
        if (ends && ends.length > 1) {
          let from = 0;
          while (hk - from > room - used) {
            const cut = ends.filter((e) => e > from && e - from <= room - used).pop();
            // Leave a page at least two lines, or turn over and try on a fresh one.
            if (cut === undefined || (from === 0 && ends.indexOf(cut) < 1)) {
              if (!pages[pages.length - 1].length) break; // a line taller than a page: give up
              turn();
              continue;
            }
            pages[pages.length - 1].push({ k, from, to: cut });
            from = cut;
            turn();
          }
          if (from > 0 || pages[pages.length - 1].length === 0 || used + hk <= room) {
            pages[pages.length - 1].push({ k, from, to: null });
            used += hk - from;
            return;
          }
        }
      }
      let fresh = own || has(cls, 'brk') || used + hk > room;
      // A heading (or a year) never ends a page on its own.
      if (!fresh && has(cls, 'keep') && k + 1 < cells.length && used + hk + Math.min(heights[k + 1], room * 0.25) > room) fresh = true;
      if (fresh && page.length) turn();
      pages[pages.length - 1].push({ k, from: 0, to: null });
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
    // Each tape prints in its own type (html[data-tape]), and fonts arrive late: either changes
    // how much fits on a page.
    const relayout = () => { setLayout(null); setRemeasure((r) => r + 1); };
    const tape = new MutationObserver(relayout);
    tape.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tape'] });
    let alive = true;
    if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => { if (alive) setRemeasure((r) => r + 1); });
    // A tape chosen later brings its title face with it, which arrives after the switch.
    document.fonts?.addEventListener('loadingdone', relayout);
    return () => { alive = false; window.removeEventListener('resize', onResize); clearTimeout(t); tape.disconnect(); document.fonts?.removeEventListener('loadingdone', relayout); };
  }, []);

  const count = layout?.pages.length ?? 0;
  const spread = layout?.spread ?? false;
  // Leaves: on a spread each leaf carries a right page on its front and the next left page on its
  // back; on a phone each leaf is one page.
  const leafCount = spread ? Math.ceil(count / 2) : count;
  const steps = spread ? Math.ceil((count - 1) / 2) : Math.max(0, count - 1);

  // Turning: the scroll position is the page position. On a spread, a gesture (a flick on the
  // trackpad, a notch of the wheel, a swipe, a key) turns one page, straight there.
  useEffect(() => {
    if (!layout) return;
    const vh = () => window.innerHeight;
    // A spread turns a leaf every 0.8 of a screen; a phone's column moves a page and a gap.
    const stepPx = () => (spread ? vh() * 0.8 : layout.h + GAP);
    const nearest = () => Math.round(Math.min(steps, Math.max(0, window.scrollY / stepPx())));
    const book = stage.current?.parentElement;
    let raf = 0;
    const draw = () => {
      raf = 0;
      const raw = Math.min(steps, Math.max(0, window.scrollY / stepPx()));
      // A page at rest lies exactly flat, whatever the scroll rounds to.
      const q = Math.abs(raw - Math.round(raw)) < 0.003 ? Math.round(raw) : raw;
      // The page being read (tests read it too).
      const at = String(Math.round(q));
      if (book && book.dataset.at !== at) book.dataset.at = at;
      // A phone's pages are a plain column the browser scrolls and snaps: nothing to draw.
      if (!spread) return;
      // Only what can be seen is drawn: the page on the left, the one on the right and the leaf
      // between them. Leaves lying flat on one another (and on the covers) would fight over the
      // same plane and show through each other. The others are only made clear, so they can
      // still be read (by a screen reader, or a search for a word).
      const lastTurned = Math.floor(q) - 1;
      const firstFlat = Math.ceil(q);
      leaves.current.forEach((leaf, j) => {
        if (!leaf) return;
        const a = Math.min(1, Math.max(0, q - j));
        leaf.style.transform = `rotateY(${(-180 * a).toFixed(2)}deg)`;
        leaf.style.zIndex = String(a <= 0 ? leafCount - j : a >= 1 ? j + 1 : leafCount + 2);
        leaf.style.setProperty('--lift', Math.sin(a * Math.PI).toFixed(3));
        leaf.classList.toggle('is-away', !((a > 0 && a < 1) || j === lastTurned || j === firstFlat));
        leaf.classList.toggle('is-turned', a >= 1);
        // Browsers still hit-test the side facing away; only the side showing takes clicks.
        leaf.classList.toggle('is-over', a > 0.5);
      });
      inside.current?.classList.toggle('is-away', lastTurned >= 0);
      back.current?.classList.toggle('is-away', firstFlat < leafCount);
      stage.current?.style.setProperty('--turned', (q / Math.max(1, steps)).toFixed(3));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };

    // A turn on its way: where it is going, and the frame carrying it there.
    let aim: number | null = null;
    let tween = 0;
    // The page the book last came to rest on.
    let rest = nearest();
    const turnTo = (target: number) => {
      cancelAnimationFrame(tween);
      aim = target;
      const from = window.scrollY;
      const to = target * stepPx();
      const pages = Math.abs(to - from) / stepPx();
      if (pages < 0.002) {
        tween = 0;
        aim = null;
        rest = target;
        return;
      }
      const duration = Math.min(900, 380 + 220 * pages);
      const t0 = performance.now();
      const frame = (now: number) => {
        const k = Math.min(1, (now - t0) / duration);
        window.scrollTo({ top: from + (to - from) * ease(k), behavior: 'instant' as ScrollBehavior });
        if (k < 1) tween = requestAnimationFrame(frame);
        else {
          tween = 0;
          aim = null;
          rest = target;
        }
      };
      tween = requestAnimationFrame(frame);
    };
    // One page on from the page the last turn was heading for (so quick presses add up);
    // false when there is no page that way.
    const step = (dir: number) => {
      const next = (aim ?? nearest()) + dir;
      if (next < 0 || next > steps) return false;
      turnTo(next);
      return true;
    };

    // Anything else that moved the scroll (the scrollbar, a finger on a phone-sized tablet, the
    // pencil) comes to rest on a page: the next one if it went a little way, else the nearest.
    let settle = 0;
    const onScroll = () => {
      schedule();
      if (!spread || tween) return; // the browser snaps a phone's column itself
      clearTimeout(settle);
      const check = () => {
        if (tween || document.body.dataset.wind) return;
        // The pencil is still turning: wait for it to be let go.
        if (document.body.classList.contains('is-winding-by-hand')) {
          settle = window.setTimeout(check, 170);
          return;
        }
        const q = window.scrollY / stepPx();
        const d = q - rest;
        const target = Math.abs(d) > 0.12 && Math.abs(d) < 1 ? rest + Math.sign(d) : nearest();
        turnTo(Math.min(steps, Math.max(0, target)));
      };
      settle = window.setTimeout(check, 170);
    };

    // The wheel and the trackpad: one gesture, one page. A trackpad keeps sending a flick's
    // momentum for a second or more; it counts as the same gesture until it dies away, unless a
    // fresh push comes through it.
    let acc = 0;
    let spent = false;
    let last = 0;
    let lastMag = 0;
    let spentAt = 0;
    let lastDir = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // a pinch, or sideways
      if (document.body.classList.contains('is-winding-by-hand')) return;
      // Code that scrolls on its own scrolls first.
      const pre = (e.target as Element | null)?.closest?.('pre');
      if (pre && pre.scrollHeight > pre.clientHeight + 1) {
        const room = e.deltaY > 0 ? pre.scrollHeight - pre.clientHeight - pre.scrollTop : pre.scrollTop;
        if (room > 1) return;
      }
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vh() : 1);
      const mag = Math.abs(dy);
      const dir = Math.sign(dy);
      const now = performance.now();
      const fresh = now - last > 200 || (dir !== 0 && dir !== lastDir) || (spent && now - spentAt > 320 && mag > lastMag * 1.6 + 10);
      last = now;
      lastMag = mag;
      if (dir) lastDir = dir;
      if (fresh) {
        acc = 0;
        spent = false;
      }
      if (spent) return;
      acc += dy;
      if (Math.abs(acc) >= 24) {
        spent = true;
        spentAt = now;
        step(Math.sign(acc));
      }
    };

    // A swipe on a spread (a tablet held wide): the page follows the finger, then goes over or
    // falls back.
    let touch: { x: number; y: number; t: number; from: number; on: boolean } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !(e.target as Element | null)?.closest?.('.booklet-book')) {
        touch = null;
        return;
      }
      cancelAnimationFrame(tween);
      tween = 0;
      const t = e.touches[0];
      touch = { x: t.clientX, y: t.clientY, t: performance.now(), from: aim ?? nearest(), on: false };
      aim = null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - touch.x, dy = t.clientY - touch.y;
      if (!touch.on && Math.hypot(dx, dy) < 8) return;
      if (!touch.on && Math.abs(dx) > Math.abs(dy) && (e.target as Element | null)?.closest?.('pre')) {
        touch = null; // a code block scrolled sideways
        return;
      }
      touch.on = true;
      e.preventDefault();
      // Up or to the left is on through the book.
      const along = Math.abs(dx) > Math.abs(dy) ? -dx : -dy;
      const q = Math.min(steps, Math.max(0, touch.from + Math.max(-1, Math.min(1, along / (window.innerWidth * 0.45)))));
      window.scrollTo({ top: q * stepPx(), behavior: 'instant' as ScrollBehavior });
    };
    const onTouchEnd = () => {
      if (!touch?.on) {
        touch = null;
        return;
      }
      const moved = window.scrollY / stepPx() - touch.from;
      const quick = performance.now() - touch.t < 300 && Math.abs(moved) > 0.04;
      const target = Math.abs(moved) > 0.25 || quick ? touch.from + Math.sign(moved) : touch.from;
      touch = null;
      turnTo(Math.min(steps, Math.max(0, target)));
    };

    // The keys that page through a document page through the booklet.
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
      const el = document.activeElement;
      if (el && el !== document.body) return;
      const dir = e.key === 'PageDown' || e.key === 'ArrowDown' || (e.key === ' ' && !e.shiftKey) ? 1
        : e.key === 'PageUp' || e.key === 'ArrowUp' || (e.key === ' ' && e.shiftKey) ? -1 : 0;
      if (dir) {
        e.preventDefault();
        step(dir);
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        turnTo(e.key === 'Home' ? 0 : steps);
      }
    };

    // The arrow keys (sent on by the deck) and the page corners turn one page, and only past the
    // last one wind on.
    const onArrow = (e: Event) => {
      if (!step((e as CustomEvent<number>).detail)) {
        aim = null;
        return;
      }
      e.preventDefault();
    };
    // A link to something inside the booklet (#writing) opens it at that page.
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) {
      const target = document.getElementById(id);
      const page = target?.closest<HTMLElement>('[data-page]');
      if (page) {
        const k = Number(page.dataset.page);
        const at = spread ? Math.ceil(k / 2) : k;
        window.scrollTo({ top: at * stepPx(), behavior: 'instant' as ScrollBehavior });
        rest = at;
      }
    }
    draw();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('tape:arrow', onArrow);
    window.addEventListener('booklet:turn', onArrow);
    if (spread) {
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);
      window.addEventListener('keydown', onKey);
    }
    // A phone's column snaps page by page, natively (globals.css), with each page coming to rest
    // where the first one starts, under the deck.
    if (!spread) {
      // The book's own top (the pages inside are still easing in) and the space above the first page.
      const top = (book ? book.getBoundingClientRect().top + window.scrollY : 0) + layout.top + 10;
      document.documentElement.style.setProperty('--snap-top', `${Math.round(top)}px`);
      document.documentElement.classList.add('snap-pages');
    }
    // Turning from here on (tests wait for this too).
    book?.setAttribute('data-ready', '');
    return () => {
      book?.removeAttribute('data-ready');
      document.documentElement.classList.remove('snap-pages');
      cancelAnimationFrame(raf);
      cancelAnimationFrame(tween);
      clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('tape:arrow', onArrow);
      window.removeEventListener('booklet:turn', onArrow);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('keydown', onKey);
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

  const { w, h, top, vh, pages, scale } = layout;
  // A spread is as tall as its turns; a phone's column is its pages, with room below the last so
  // it too can come to the top.
  const stageTop = top + (spread ? 26 : 10);
  const height = spread ? `calc(${steps * 80}vh + 100vh)` : `${stageTop + count * h + (count - 1) * GAP + Math.max(0, vh - stageTop - h)}px`;
  const through = (k: number) => (steps ? (spread ? Math.ceil(k / 2) : k) / steps : 0);
  const page = (k: number, side: 'left' | 'right') => {
    const ids = pages[k];
    if (!ids) return <div className={`pg pg-${side} pg-blank`} />;
    const own = ids.length === 1 && has(classOf(blocks[ids[0].k]), 'own');
    return (
      <div className={`pg pg-${side}${k === 0 ? ' pg-title' : ''}${own ? ' pg-own' : ''}`} data-page={k}>
        {k > 0 && <p className="pg-head" aria-hidden="true"><span>{n} · {name}</span><span>side a</span></p>}
        <div className="pg-body">
          {ids.map(({ k: id, from, to }) => (
            <div className="blk" key={`${id}:${from}`}>
              {from === 0 && to === null ? blocks[id] : (
                <div className="blk-cut" style={{ height: to === null ? undefined : to - from }}>
                  <div className="blk-cut-in" style={{ marginTop: -from }}>{blocks[id]}</div>
                </div>
              )}
            </div>
          ))}
        </div>
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
      style={{ '--pw': `${w}px`, '--ph': `${h}px`, '--gap': `${GAP}px`, '--stage-top': `${stageTop}px`, height } as React.CSSProperties}
    >
      <div className="booklet-stage" ref={stage}>
        <div className="booklet-scale" style={scale > 1 ? { transform: `scale(${scale.toFixed(3)})` } : undefined}>
          <div className="booklet-pages">
            {/* Inside the front cover, under everything on the left. */}
            {spread && (
              <div className="pg pg-left pg-inside" aria-hidden="true" ref={inside}>
                <p className="inside-mark">marv1nnnnn</p>
                <p className="inside-small">side a · {TRACKS.map((t, k) => `${String(k + 1).padStart(2, '0')} ${t.label}`).join(' · ')}</p>
              </div>
            )}
            {/* The back cover, under everything on the right: what shows once every page is turned. */}
            {spread && (
              <div className="pg pg-right pg-inside pg-back" aria-hidden="true" ref={back}>
                <p className="inside-small">marv1nnnnn · side a</p>
                <p className="inside-small">℗ &amp; © marv1nnnnn. all rights of the producer and of the owner of the work reproduced reserved.</p>
              </div>
            )}
            {Array.from({ length: leafCount }, (_, j) => (
              <div className="leaf" key={j} ref={(el) => { leaves.current[j] = el; }}>
                <div className="face front">{page(spread ? 2 * j : j, 'right')}</div>
                {spread && <div className="face back">{page(2 * j + 1, 'left')}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
