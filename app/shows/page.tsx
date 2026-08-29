import showsData from '@/data/shows.json';

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

  return (
    <main className="shows-archive">
      <header>
        <h1>Shows</h1>
        <blockquote>{intro}</blockquote>
      </header>
      <ol>
        {shows.map((show) => {
          const content = (
            <>
              <div className="shows-archive__date">{show.date}</div>
              <div>
                <h2>{show.title}</h2>
                <p className="shows-archive__venue">{show.venue} / {show.city}</p>
                <p>w/ {show.lineup.join(', ')}</p>
                {show.note && <blockquote>{show.note}</blockquote>}
              </div>
              {show.url && <span className="shows-archive__open">VIEW ↗</span>}
            </>
          );
          return (
            <li key={`${show.date}-${show.title}`}>
              {show.url
                ? <a href={show.url} target="_blank" rel="noreferrer">{content}</a>
                : <div>{content}</div>}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
