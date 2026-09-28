import Pages from './Pages';

// Every page past the home page is the booklet that came with the tape (see Pages): the page
// hands over its content as a list of blocks and the booklet lays them out on its pages.
// `own` pages (the log) render their own Pages, because their blocks change as they are used.
export default function Booklet({ path, title, lede, kicker, label, className, own = false, children }: {
  path: string;
  title?: React.ReactNode;
  lede?: React.ReactNode;
  kicker?: React.ReactNode;
  label?: string;
  className?: string;
  own?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className={`page booklet${className ? ` ${className}` : ''}`}>
      {own ? children : <Pages path={path} title={title} lede={lede} kicker={kicker} label={label}>{children}</Pages>}
    </article>
  );
}
