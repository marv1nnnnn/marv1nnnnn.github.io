'use client'

import React, { useState, useEffect } from 'react'
import useContentManager from '@/hooks/useContentManager'

const BlogReader: React.FC = () => {
  const {
    blogPosts,
    activePost,
    isLoading,
    loadPost,
    navigateNext,
    navigatePrevious,
    renderMarkdown
  } = useContentManager()

  // No streaming effect - display full content immediately

  if (!activePost) {
    return (
      <div className="blog-reader">
        <div className="blog-header">
          <div className="blog-title">📖 BLOG READER v2.0</div>
          <div className="blog-status">● NO POSTS LOADED</div>
        </div>
        <div className="blog-content">
          <div className="error-message">
            <div className="ascii-error">
{`
 ███████ ██████  ██████   ██████  ██████  
 ██      ██   ██ ██   ██ ██    ██ ██   ██ 
 █████   ██████  ██████  ██    ██ ██████  
 ██      ██   ██ ██   ██ ██    ██ ██   ██ 
 ███████ ██   ██ ██   ██  ██████  ██   ██ 
`}
            </div>
            <div className="error-text">No blog posts available</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="blog-reader">
      {/* Header */}
      <div className="blog-header">
        <div className="blog-title">📖 BLOG READER v2.0 - Terminal Mode</div>
        <div className="blog-status">
          {isLoading ? '● LOADING...' : '● READY'}
        </div>
      </div>

      {/* Navigation */}
      <div className="blog-nav">
        <button 
          className="nav-btn" 
          onClick={navigatePrevious}
          disabled={isLoading}
        >
          ◀ PREV
        </button>
        <div className="post-info">
          <span className="post-counter">
            POST {blogPosts.findIndex(p => p.id === activePost.id) + 1}/{blogPosts.length}
          </span>
        </div>
        <button 
          className="nav-btn" 
          onClick={navigateNext}
          disabled={isLoading}
        >
          NEXT ▶
        </button>
      </div>

      {/* Content Area */}
      <div className="blog-content">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-text">LOADING POST...</div>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        ) : (
          <div className="post-container">
            {/* Post Metadata */}
            <div className="post-meta">
              <div className="meta-line">
                <span className="meta-label">AUTHOR:</span>
                <span className="meta-value">{activePost.author}</span>
              </div>
              <div className="meta-line">
                <span className="meta-label">DATE:</span>
                <span className="meta-value">{activePost.date}</span>
              </div>
              <div className="meta-line">
                <span className="meta-label">TAGS:</span>
                <span className="meta-value">{activePost.tags.join(', ')}</span>
              </div>
            </div>

            {/* Post Content */}
            <div className="post-content">
              <div 
                className="markdown-content"
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(activePost.content) 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="blog-footer">
        <div className="post-list">
          <span className="footer-label">AVAILABLE POSTS:</span>
          {blogPosts.map((post, index) => (
            <button
              key={post.id}
              className={`post-link ${activePost.id === post.id ? 'active' : ''}`}
              onClick={() => loadPost(post.id)}
              disabled={isLoading}
            >
              [{index + 1}] {post.title}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .blog-reader {
          background: #000;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 2px solid #333;
          overflow: hidden;
        }

        .blog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(0, 255, 0, 0.1);
          border-bottom: 1px solid #00ff00;
          font-weight: bold;
          font-size: 12px;
        }

        .blog-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 12px;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid #333;
        }

        .nav-btn {
          background: linear-gradient(135deg, #003300, #001100);
          border: 1px outset #00ff00;
          color: #00ff00;
          padding: 4px 12px;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .nav-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #004400, #002200);
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .post-info {
          font-size: 10px;
          color: #888;
        }

        .blog-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          line-height: 1.6;
        }

        .loading-container {
          text-align: center;
          padding: 40px;
        }

        .loading-text {
          margin-bottom: 20px;
          font-size: 14px;
          animation: blink 1s infinite;
        }

        .loading-bar {
          width: 200px;
          height: 20px;
          border: 1px solid #00ff00;
          margin: 0 auto;
          position: relative;
          background: #000;
        }

        .loading-progress {
          height: 100%;
          background: linear-gradient(90deg, #00ff00, #008800);
          animation: loading 2s infinite;
        }

        @keyframes loading {
          0% { width: 0%; }
          50% { width: 100%; }
          100% { width: 0%; }
        }

        .post-container {
          max-width: 100%;
        }

        .post-meta {
          background: rgba(0, 255, 0, 0.05);
          border: 1px solid #333;
          padding: 8px;
          margin-bottom: 16px;
          font-size: 11px;
        }

        .meta-line {
          margin-bottom: 4px;
        }

        .meta-label {
          color: #888;
          margin-right: 8px;
        }

        .meta-value {
          color: #00ff00;
        }

        .post-content {
          position: relative;
        }

        .markdown-content {
          font-size: 13px;
          line-height: 1.6;
        }

        .typing-cursor {
          animation: blink 1s infinite;
          font-weight: bold;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        /* Markdown Styles */
        .markdown-content :global(.md-h1) {
          color: #00ff00;
          font-size: 18px;
          font-weight: bold;
          margin: 16px 0 12px 0;
          text-decoration: underline;
        }

        .markdown-content :global(.md-h2) {
          color: #00dd00;
          font-size: 16px;
          font-weight: bold;
          margin: 14px 0 10px 0;
        }

        .markdown-content :global(.md-h3) {
          color: #00bb00;
          font-size: 14px;
          font-weight: bold;
          margin: 12px 0 8px 0;
        }

        .markdown-content :global(.md-bold) {
          color: #66ff66;
          font-weight: bold;
        }

        .markdown-content :global(.md-italic) {
          color: #88ff88;
          font-style: italic;
        }

        .markdown-content :global(.md-code) {
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid #333;
          padding: 2px 4px;
          color: #ffff00;
          font-family: 'Courier New', monospace;
        }

        .markdown-content :global(.md-li) {
          margin-left: 20px;
          margin-bottom: 4px;
        }

        .markdown-content :global(.md-li):before {
          content: "▶ ";
          color: #00ff00;
          margin-right: 4px;
        }

        .markdown-content :global(.md-hr) {
          border: none;
          border-top: 1px solid #333;
          margin: 16px 0;
        }

        .markdown-content :global(.md-p) {
          margin-bottom: 12px;
        }

        .blog-footer {
          border-top: 1px solid #333;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.5);
        }

        .footer-label {
          font-size: 10px;
          color: #888;
          margin-right: 8px;
        }

        .post-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          align-items: center;
        }

        .post-link {
          background: transparent;
          border: 1px solid #333;
          color: #00ff00;
          padding: 2px 6px;
          font-family: inherit;
          font-size: 9px;
          cursor: pointer;
          margin: 2px;
        }

        .post-link:hover:not(:disabled) {
          background: rgba(0, 255, 0, 0.1);
          border-color: #00ff00;
        }

        .post-link.active {
          background: rgba(0, 255, 0, 0.2);
          border-color: #00ff00;
          color: #ffffff;
        }

        .post-link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          text-align: center;
          padding: 40px;
        }

        .ascii-error {
          font-size: 8px;
          color: #ff0000;
          margin-bottom: 20px;
          line-height: 1;
        }

        .error-text {
          color: #ff0000;
          font-size: 14px;
          animation: blink 2s infinite;
        }

        /* Scrollbar */
        .blog-content::-webkit-scrollbar {
          width: 8px;
        }

        .blog-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }

        .blog-content::-webkit-scrollbar-thumb {
          background: #00ff00;
          opacity: 0.3;
        }

        .blog-content::-webkit-scrollbar-thumb:hover {
          opacity: 0.6;
        }
      `}</style>
    </div>
  )
}

export default BlogReader