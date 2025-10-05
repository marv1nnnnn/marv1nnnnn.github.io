import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { generateCardGradient, getContrastColor } from '@/lib/cardGradients';
import { getAllSignalCards, getSignalCard } from '@/lib/signals';

interface CardPageProps {
  params: Promise<{
    signalId: string;
    cardId: string;
  }>;
}

export function generateStaticParams() {
  return getAllSignalCards();
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { signalId, cardId } = await params;
  const payload = getSignalCard(signalId, cardId);

  if (!payload) {
    return {
      title: 'Transmission Not Found · MARV1NNNNN',
    };
  }

  const { signal, card } = payload;
  const title = `${card.title} · ${signal.title}`;
  const description = card.summary;
  const url = `/signals/${signalId}/${cardId}`;

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      publishedTime: card.date,
      tags: card.tags,
      images: [
        {
          url: '/images/og-image.png',
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/og-image.png'],
    },
  };
}

export default async function SignalCardPage({ params }: CardPageProps) {
  const { signalId, cardId } = await params;
  const payload = getSignalCard(signalId, cardId);

  if (!payload) {
    notFound();
  }

  const { signal, card } = payload;
  const cardColor = generateCardGradient(card.id);
  const textColor = getContrastColor(cardColor);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: card.title,
    description: card.summary,
    datePublished: card.date,
    author: {
      '@type': 'Person',
      name: 'Marvin',
    },
    keywords: card.tags?.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="relative min-h-screen overflow-y-auto bg-[#0f0f12]">
      {/* Checkered pattern overlay like scanner */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%) 50% / 20px 20px`
      }} />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-12 pt-8 sm:px-10 lg:px-14">
        <header className="flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.32em] text-white">
          <Link
            href="/"
            className="border-4 border-white bg-[#0a0a0a] px-4 py-2 font-bold text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]"
          >
            ← Return To Scanner
          </Link>
          <span className="flex items-center gap-3 font-bold text-white/80">
            <span>Signal {signal.freq.toFixed(1)} MHz</span>
            <span className="text-2xl">•</span>
            <span>{signal.title}</span>
          </span>
        </header>

        <section
          className="border-5 px-8 py-6"
          style={{
            backgroundColor: cardColor,
            color: textColor,
            borderColor: textColor === '#FFFFFF' ? '#000' : '#fff',
            boxShadow: textColor === '#FFFFFF' ? '8px 8px 0px 0px #000' : '8px 8px 0px 0px rgba(255,255,255,0.9)'
          }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.32em] font-bold" style={{ opacity: 0.8 }}>
              <span>{card.date ?? 'Unrecorded'}</span>
              <span>{card.subtitle ?? 'Field Transmission'}</span>
            </div>

            <h1 className="text-3xl font-bold tracking-[0.14em] sm:text-4xl">
              {card.title}
            </h1>

            <p className="max-w-3xl text-sm uppercase tracking-[0.28em] font-semibold" style={{ opacity: 0.9 }}>
              {card.summary}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.28em] font-bold">
              {card.tags?.map((tag) => (
                <span
                  key={tag}
                  className="border-3 px-3 py-1"
                  style={{
                    borderColor: textColor === '#FFFFFF' ? '#000' : '#FFF',
                    backgroundColor: textColor === '#FFFFFF' ? '#000' : '#FFF',
                    color: textColor === '#FFFFFF' ? '#FFF' : '#000'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <dl className="grid gap-4 text-xs uppercase tracking-[0.24em] font-bold sm:grid-cols-2">
              <div
                className="flex items-center justify-between gap-4 border-3 px-4 py-3"
                style={{
                  borderColor: textColor === '#FFFFFF' ? '#000' : '#FFF',
                  backgroundColor: textColor === '#FFFFFF' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'
                }}
              >
                <dt>Broadcast</dt>
                <dd className="font-extrabold">{signal.broadcastDate ?? 'Live'}</dd>
              </div>
              <div
                className="flex items-center justify-between gap-4 border-3 px-4 py-3"
                style={{
                  borderColor: textColor === '#FFFFFF' ? '#000' : '#FFF',
                  backgroundColor: textColor === '#FFFFFF' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'
                }}
              >
                <dt>Location</dt>
                <dd className="font-extrabold">{signal.location ?? 'Unlisted'}</dd>
              </div>
            </dl>
          </div>
        </section>

        <article className="border-5 border-white/80 bg-[#1a1a1d] px-6 py-10 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.6)] sm:px-12">
          <div className="markdown-body">
            <ReactMarkdown>{card.markdown}</ReactMarkdown>
          </div>
        </article>
      </div>
    </main>
    </>
  );
}
