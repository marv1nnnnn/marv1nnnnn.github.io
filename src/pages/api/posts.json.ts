import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = async () => {
  const blogDirectory = path.join(process.cwd(), 'src', 'content', 'blog');
  const files = await fs.readdir(blogDirectory);
  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith('.md'))
      .map(async (filename) => {
        const slug = filename.replace(/\.md$/, '');
        const { data } = matter(await fs.readFile(path.join(blogDirectory, filename), 'utf-8'));
        return { slug, ...data };
      })
  );
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  });
}; 