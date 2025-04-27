import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

const blogDirectory = path.join(process.cwd(), 'src/pages/blog');

export const GET: APIRoute = async ({ request }) => {
  try {
    const files = await fs.readdir(blogDirectory);
    // Filter for markdown files and remove the extension for display
    const blogFiles = files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace(/\.md$/, ''));

    return new Response(JSON.stringify(blogFiles), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error reading blog directory:', error);
    return new Response(JSON.stringify({ error: 'Failed to read blog files' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};