import { TRACKS, counter, spanOf, trackIndex } from './tracks';
import Cues from './Cues';

// Every page past the home page is a leaf of the booklet that came with the tape: a long strip of
// paper folded into panels, printed in the tape's own paper and ink. The header is the track
// (number, name, where it sits on the counter); the footer is the small print.
export default function Booklet({ path, title, lede, label, className, children }: {
  path: string;
  title?: React.ReactNode;
  lede?: React.ReactNode;
  label?: React.ReactNode; // replaces the track name in the header (detail pages)
  className?: string;
  children: React.ReactNode;
}) {
  const i = trackIndex(path);
  const [lo, hi] = spanOf(path);
  const n = String(i + 1).padStart(2, '0');
  return (
    <article className={`page booklet${className ? ` ${className}` : ''}`}>
      <div className="sheet">
        <header className="leaf-head">
          <span className="leaf-no">{n}</span>
          <span className="leaf-name">{label ?? TRACKS[i].label}</span>
          <span className="leaf-side">side a · marv1nnnnn</span>
          <span className="leaf-span">{counter(lo)}–{counter(hi)}</span>
        </header>
        {title && <h1 className="leaf-title">{title}</h1>}
        {lede && <p className="leaf-lede">{lede}</p>}
        {children}
        <footer className="leaf-foot">
          <span>℗ &amp; © marv1nnnnn · track {n} of {String(TRACKS.length).padStart(2, '0')}</span>
          <span>home taping is killing music. tape it anyway.</span>
        </footer>
        <Cues path={path} />
      </div>
    </article>
  );
}
