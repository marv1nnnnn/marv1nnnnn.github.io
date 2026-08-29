import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllSignalCards, getSignalCard } from '@/lib/signals';
import SignalCardClientPage from './SignalCardClientPage';

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
      title: 'Page not found · MARV1NNNNN',
    };
  }

  const { signal, card } = payload;
  const title = `${card.title} · ${signal.title}`;
  const description = card.summary;
  const url = `/signals/${signalId}/${cardId}`;
  const cover = card.markdown.match(/!\[([^\]]*)\]\(([^)\s]+)/);
  const image = cover?.[2] ?? '/images/cursor_shenzhen.png';
  const imageAlt = cover?.[1] || title;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      publishedTime: card.date,
      authors: ['Marvin Ma'],
      tags: card.tags,
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@marv1nnnnn1',
      images: [image],
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
      <SignalCardClientPage 
        signal={signal} 
        card={card} 
        signalId={signalId} 
        cardId={cardId} 
      />
    </>
  );
}
