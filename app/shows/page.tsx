import Field from '@/components/Field';
import showsData from '@/data/shows.json';
import { yearsToPoints } from '@/lib/decay';

type Show = {
  date: string;
  title: string;
  venue: string;
  city: string;
  lineup: string[];
  note?: string;
  url?: string;
};

export default function ShowsPage() {
  const { intro, shows } = showsData as { intro: string; shows: Show[] };
  const sorted = [...shows].sort((a, b) => b.date.localeCompare(a.date));
  const dates = sorted.map((show) => show.date);

  return (
    <main className="page shows">
      <h1 className="page__title">Shows</h1>
      <p className="page__lede">{intro}</p>
      <Field
        points={yearsToPoints(dates)}
        from={dates[dates.length - 1]?.slice(0, 4) ?? ''}
        to={dates[0]?.slice(0, 4) ?? ''}
        count="closed"
      />

      <ol>
        {sorted.map((show) => {
          const body = (
            <>
              <time dateTime={show.date}>{show.date.replaceAll('-', '.')}</time>
              <div>
                <h2>{show.title}{show.url && ' ↗'}</h2>
                <p>{show.venue} / {show.city} · w/ {show.lineup.join(', ')}</p>
              </div>
            </>
          );
          return (
            <li key={`${show.date}-${show.title}`}>
              {show.url
                ? <a href={show.url} target="_blank" rel="noreferrer">{body}</a>
                : <div>{body}</div>}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
