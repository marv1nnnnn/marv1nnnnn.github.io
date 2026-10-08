import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Article from '@/components/tape/Article';
import { getEssay, getEssays } from '@/lib/tape';
import { shareImage } from '@/lib/share';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getEssays().map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = getEssay(id);
  if (!card) return { title: 'Not found' };
  const cover = card.markdown.match(/!\[([^\]]*)\]\(([^)\s]+)/);
  const image = cover?.[2] ?? shareImage.url;
  return {
    title: card.title,
    description: card.summary,
    alternates: { canonical: `/think/${id}` },
    openGraph: { type: 'article', url: `/think/${id}`, title: card.title, description: card.summary, publishedTime: card.date, authors: ['Marvin Ma'], tags: card.tags, images: [{ url: image }] },
    twitter: { card: 'summary_large_image', title: card.title, description: card.summary, creator: '@marv1nnnnn1', images: [image] },
  };
}

export default async function Essay({ params }: Props) {
  const { id } = await params;
  const card = getEssay(id);
  if (!card) notFound();
  return <Article card={card} back="/make#writing" backLabel="all writing" section="think" kind="essay" />;
}
