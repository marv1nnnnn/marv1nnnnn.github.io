'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // Custom styling for markdown elements to match OS theme
        h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
        h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
        h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
        p: ({ children }) => <p className="markdown-p">{children}</p>,
        ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
        ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
        li: ({ children }) => <li className="markdown-li">{children}</li>,
        code: ({ children, className }) => {
          const isInline = !className
          return isInline 
            ? <code className="markdown-code-inline">{children}</code>
            : <code className="markdown-code-block">{children}</code>
        },
        pre: ({ children }) => <pre className="markdown-pre">{children}</pre>,
        blockquote: ({ children }) => <blockquote className="markdown-blockquote">{children}</blockquote>,
        a: ({ children, href }) => (
          <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}