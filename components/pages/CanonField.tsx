import Field from '@/components/Field';
import { spread } from '@/lib/decay';
import type { SignalInfluencesPage } from '@/types/scanner';

export default function CanonField({ page, title }: { page: SignalInfluencesPage; title: string }) {
  const records = [...page.records].sort((a, b) => a.year - b.year);
  const years = records.map((record) => record.year);

  return (
    <main className="page">
      <h1 className="page__title">{title}</h1>
      <p className="page__lede">Fourteen things that never faded. Everything else on this site decays with age; this page does not.</p>
      <Field
        points={spread(years)}
        from={String(years[0])}
        to={String(years[years.length - 1])}
        count={`${records.length} kept`}
      />

      <ul className="canon">
        {records.map((record) => (
          <li key={record.id}>
            {record.image_url
              ? <img src={record.image_url} alt={`${record.artist} — ${record.title}`} loading="lazy" />
              : <div className="canon__fallback">{record.artist} — {record.title}</div>}
            <figcaption>
              <span>{record.year} · {record.medium}</span>
              <p>{record.artist} — {record.title}</p>
              <p>{record.personalNote}</p>
            </figcaption>
          </li>
        ))}
      </ul>
    </main>
  );
}
