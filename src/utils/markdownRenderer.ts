import MarkdownIt from 'markdown-it';
import { createHighlighter } from 'shiki';
import type { Highlighter } from 'shiki'; // Corrected to type-only import

let shikiHighlighter: Highlighter;
let markdownRendererInstance: MarkdownIt;

async function getMarkdownRenderer(): Promise<MarkdownIt> {
  if (!shikiHighlighter) {
    shikiHighlighter = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['javascript', 'typescript', 'html', 'css', 'json', 'bash', 'markdown'],
    });
  }

  if (!markdownRendererInstance) {
    markdownRendererInstance = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (code, lang) => {
        if (shikiHighlighter) {
          return shikiHighlighter.codeToHtml(code, { lang, theme: 'github-dark' });
        }
        return `<pre><code class="language-${lang || ''}">${markdownRendererInstance.utils.escapeHtml(code)}</code></pre>`;
      },
    });

    // Custom rule to add IDs to headings and extract them
    markdownRendererInstance.core.ruler.after('inline', 'extract_headings', (state: any) => {
      const headings: { level: number; text: string; id: string }[] = [];
      const slugify = (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''));

      for (let i = 0; i < state.tokens.length; i++) {
        const token = state.tokens[i];
        if (token.type === 'heading_open') {
          const level = parseInt(token.tag.substring(1));
          const nextToken = state.tokens[i + 1];
          if (nextToken && nextToken.type === 'inline' && nextToken.children) {
            const text = nextToken.children
              .map((child: any) => child.content || '')
              .join('');
            
            if (text) {
              const id = slugify(text);
              headings.push({ level, text, id });
              token.attrJoin('id', id);
            }
          }
        }
      }
      state.env.extractedHeadings = headings;
      return true;
    });
  }

  return markdownRendererInstance;
}

export async function renderMarkdown(markdown: string): Promise<{ html: string; headings: { level: number; text: string; id: string }[] }> {
  const md = await getMarkdownRenderer();
  const env: { extractedHeadings?: { level: number; text: string; id: string }[] } = {};
  const html = md.render(markdown, env);
  const headings = env.extractedHeadings || [];
  return { html, headings };
}