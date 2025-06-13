import { getCollection, getEntryBySlug, type CollectionEntry } from 'astro:content';

// Generate all slugs at build time
export async function getStaticPaths() {
  const entries = await (getCollection as any)('blog');
  return entries.map((e: any) => ({ params: { slug: e.slug } }));
}

export const prerender = true;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;
  const entry: any = await (getEntryBySlug as any)('blog', slug!);

  if (!entry) {
    return new Response(JSON.stringify({ message: 'Post not found' }), { status: 404 });
  }

  return new Response(
    JSON.stringify({
      slug,
      ...entry.data,
      content: entry.body,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
};