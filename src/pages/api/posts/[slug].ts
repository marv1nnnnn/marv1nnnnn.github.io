import type { APIRoute } from 'astro';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;
  const blogDirectory = path.join(process.cwd(), 'src', 'content', 'blog');
  const filePath = path.join(blogDirectory, `${slug}.md`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    return new Response(JSON.stringify({
      slug,
      ...data,
      content,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new Response(JSON.stringify({ message: 'Post not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    console.error(`Error fetching blog post ${slug}:`, error);
    return new Response(JSON.stringify({ message: 'Error fetching blog post' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const prerender = true;

export async function getStaticPaths() {
  const blogDirectory = path.join(process.cwd(), 'src', 'content', 'blog');
  const files = await fs.readdir(blogDirectory);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => ({ params: { slug: file.replace(/\.md$/, '') } }));
}