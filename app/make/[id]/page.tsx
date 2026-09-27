import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Article from '@/components/tape/Article';
import { getMake, getMakes } from '@/lib/tape';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getMakes().map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = getMake(id);
  if (!card) return { title: 'Not found' };
  const cover = card.markdown.match(/!\[([^\]]*)\]\(([^)\s]+)/);
  const image = cover?.[2] ?? '/images/cursor_shenzhen.png';
  return {
    title: card.title,
    description: card.summary,
    alternates: { canonical: `/make/${id}` },
    openGraph: { type: 'article', url: `/make/${id}`, title: card.title, description: card.summary, publishedTime: card.date, images: [{ url: image }] },
    twitter: { card: 'summary_large_image', title: card.title, description: card.summary, creator: '@marv1nnnnn1', images: [image] },
  };
}

export default async function MakeDetail({ params }: Props) {
  const { id } = await params;
  const card = getMake(id);
  if (!card) notFound();
  return <Article card={card} back="/make" backLabel="everything made" section="make" kind={card.kind} />;
}
