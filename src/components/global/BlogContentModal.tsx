import React, { useEffect, useState, useRef, useCallback } from 'react';
import { renderMarkdown } from '../../utils/markdownRenderer';

interface BlogContentModalProps {
  title: string;
  content: string; // Content is now expected to be raw Markdown
  onClose: () => void;
}

const BlogContentModal: React.FC<BlogContentModalProps> = ({ title, content, onClose }) => {
  const [renderedContent, setRenderedContent] = useState('');
  const [headings, setHeadings] = useState<{ level: number; text: string; id: string }[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const fetchAndRenderMarkdown = async () => {
      const { html, headings: extractedHeadings } = await renderMarkdown(content);
      setRenderedContent(html);
      setHeadings(extractedHeadings);
    };
    fetchAndRenderMarkdown();
  }, [content]);

  // Initialize position and size on mount
  useEffect(() => {
    if (modalRef.current) {
      const { innerWidth, innerHeight } = window;
      const initialWidth = Math.max(450, Math.min(innerWidth * 0.7, 800)); // Min 450px, Max 800px or 70% of viewport
      const initialHeight = Math.min(innerHeight * 0.8, 600); // Max 600px or 80% of viewport

      setPosition({
        x: (innerWidth - initialWidth) / 2,
        y: (innerHeight - initialHeight) / 2,
      });
      setSize({ width: initialWidth, height: initialHeight });
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  }, []);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dragging when resizing
    setResizeStart({ x: e.clientX, y: e.clientY });
    setOriginalSize({ width: size.width, height: size.height });
    setIsResizing(true);
  }, [size]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      setSize({
        width: Math.max(450, originalSize.width + deltaX), // Min width 450px (300px for content + 150px for TOC)
        height: Math.max(200, originalSize.height + deltaY), // Min height 200px
      });
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, originalSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    const handleWindowResize = () => {
      if (modalRef.current) {
        const { innerWidth, innerHeight } = window;
        const newWidth = Math.min(Math.max(450, size.width), innerWidth * 0.9); // Keep current width, but respect min/max and viewport
        const newHeight = Math.min(Math.max(200, size.height), innerHeight * 0.9); // Keep current height, but respect min/max and viewport

        setSize({ width: newWidth, height: newHeight });
        setPosition({
          x: (innerWidth - newWidth) / 2,
          y: (innerHeight - newHeight) / 2,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleWindowResize); // Add resize listener

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleWindowResize); // Clean up resize listener
    };
  }, [handleMouseMove, handleMouseUp, size]); // Add size to dependencies

  return (
    <div className="fixed inset-0 bg-opacity-75 flex items-center justify-center z-[100] blog-content-modal-overlay">
      <div
        ref={modalRef}
        className="blog-content-modal-container text-white overflow-hidden flex flex-col absolute"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        }}
      >
        <div
          className="flex justify-between items-center border-b border-gray-700 px-4 py-2 cursor-grab"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            className="text-gray-400 hover:text-white transition-colors duration-200"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-grow overflow-hidden">
          <div className="overflow-y-auto flex-grow blog-content-modal-markdown p-4">
            {/* Render pre-processed HTML directly */}
            <div className="w-full font-mono text-xs overflow-auto" dangerouslySetInnerHTML={{ __html: renderedContent }} />
          </div>
          <div className="min-w-[150px] p-4 border-l border-gray-700 overflow-y-auto flex-none">
            <h3 className="text-sm font-bold mb-2 text-gray-300">Table of Contents</h3>
            {headings.length > 0 ? (
              <ul className="space-y-1">
                {headings.map((heading) => (
                  <li key={heading.id} className={`text-sm ${heading.level === 2 ? 'ml-0' : 'ml-4'}`}>
                    <a
                      href={`#${heading.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById(heading.id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="text-blue-400 hover:text-blue-200 transition-colors duration-200"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No headings found.</p>
            )}
          </div>
        </div>
        <div className="resize-handle" onMouseDown={handleResizeMouseDown}></div>
      </div>
    </div>
  );
};
export default BlogContentModal;