import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = async () => {
  const entries = await (getCollection as any)('blog');
  const posts = entries.map((e: any) => ({ slug: e.slug, ...e.data }));
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  });
}; 