import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { remark } from 'remark';
import html from 'remark-html';
import remarkPrism from 'remark-prism';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function getStaticPaths() {
  const blogDirectory = path.join(__dirname, '../../blog'); // Adjust path relative to the API route file
  const files = await fs.readdir(blogDirectory);

  const paths = files
    .filter(file => file.endsWith('.md'))
    .map(file => ({
      params: { fileName: file.replace('.md', '') },
    }));

  return paths;
}
const blogDirectory = path.join(process.cwd(), 'src/pages/blog');

export const GET: APIRoute = async ({ params }) => {
  const fileName = params.fileName;
  console.log('Incoming request fileName from params:', fileName);

  if (!fileName) {
    return new Response(JSON.stringify({ error: 'Missing fileName parameter' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  const filePath = path.join(blogDirectory, `${fileName}.md`);

  try {
    // Basic security check: prevent directory traversal
    const resolvedFilePath = path.resolve(filePath);
    const normalizedResolvedFilePath = resolvedFilePath.replace(/\\/g, '/');
    const normalizedBlogDirectory = blogDirectory.replace(/\\/g, '/');
    console.log('blogDirectory:', blogDirectory);
    console.log('resolvedFilePath:', resolvedFilePath);
    console.log('normalizedBlogDirectory:', normalizedBlogDirectory);
    console.log('normalizedResolvedFilePath:', normalizedResolvedFilePath);
    // Compare paths case-insensitively for Windows compatibility
    if (!normalizedResolvedFilePath.toLowerCase().startsWith(normalizedBlogDirectory.toLowerCase())) {
        console.error('Directory traversal attempt detected!');
        return new Response(JSON.stringify({ error: 'Invalid file path' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    const markdownContent = await fs.readFile(filePath, 'utf-8');

    // Process markdown to HTML with remark-prism
    const processedContent = await remark()
      .use(html, { sanitize: false }) // Use remark-html to convert to HTML
      .use(remarkPrism) // Use remark-prism for syntax highlighting
      .process(markdownContent);

    const content = processedContent.toString();

    console.log('Generated HTML content:', content);

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error(`Error reading or processing blog file ${fileName}:`, error);
    return new Response(JSON.stringify({ error: 'Failed to read or process blog file' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};