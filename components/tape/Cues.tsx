'use client';

import { useEffect } from 'react';
import { counter, headOf } from './tracks';

// Margin counter marks: every `.cue` in the booklet is printed with the counter reading the tape
// will show when that line reaches the reading line near the top of the screen.
export default function Cues({ path }: { path: string }) {
  useEffect(() => {
    const mark = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.querySelectorAll<HTMLElement>('.sheet .cue').forEach((el) => {
        const box = el.getBoundingClientRect();
        const sheet = el.closest('.sheet')?.getBoundingClientRect();
        // The mark sits in the sheet's left margin, however deep the line is nested.
        if (sheet) el.style.setProperty('--cue-x', `${(sheet.left - box.left).toFixed(1)}px`);
        const top = box.top + window.scrollY - window.innerHeight * 0.3;
        const through = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0;
        el.dataset.cue = counter(headOf(path, through));
      });
    };
    mark();
    const late = window.setTimeout(mark, 800);
    window.addEventListener('resize', mark);
    // Filters (the log) change the page length.
    const observer = new ResizeObserver(mark);
    observer.observe(document.body);
    return () => {
      clearTimeout(late);
      window.removeEventListener('resize', mark);
      observer.disconnect();
    };
  }, [path]);
  return null;
}
