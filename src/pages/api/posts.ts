import type { APIRoute } from 'astro';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const GET: APIRoute = async ({ request }) => {
  const blogDirectory = path.join(process.cwd(), 'src', 'content', 'blog');
  let posts: any[] = [];

  try {
    const files = await fs.readdir(blogDirectory);

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(blogDirectory, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(fileContent);

        posts.push({
          slug: file.replace('.md', ''),
          ...data,
        });
      }
    }

    // Sort posts by date in descending order
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return new Response(JSON.stringify({ message: 'Error fetching blog posts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};