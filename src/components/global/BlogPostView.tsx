import React, { useState, useEffect } from 'react';
import { FaChevronLeft } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

interface BlogPostViewProps {
    slug: string;
    onBack: () => void;
}

interface BlogPostContent {
    title: string;
    description: string;
    publishDate: string;
    content: string;
}

const BlogPostView: React.FC<BlogPostViewProps> = ({ slug, onBack }) => {
    const [post, setPost] = useState<BlogPostContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await fetch(`/api/posts/${slug}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: BlogPostContent = await response.json();
                setPost(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full text-gray-300">
                Loading blog post...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-full text-red-400">
                Error: {error}
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex justify-center items-center h-full text-gray-400">
                Blog post not found.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-300 hover:text-gray-100 mb-4"
            >
                <FaChevronLeft />
                <span>Back to Blog List</span>
            </button>
            <h2 className="text-3xl font-bold text-gray-200 mb-2">{post.title}</h2>
            {(() => {
                const publishDate = new Date(post.publishDate);
                const formattedPublishDate = !isNaN(publishDate.getTime())
                    ? publishDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Invalid Date';
                return <p className="text-gray-400 text-sm mb-4">Published: {formattedPublishDate}</p>;
            })()}
            <ReactMarkdown
                components={{
                    // Apply Tailwind prose classes to the root div rendered by ReactMarkdown
                    // This ensures the markdown content is styled correctly
                    div: ({ node, ...props }) => (
                        <div className="prose prose-invert max-w-none" {...props} />
                    ),
                }}
            >
                {post.content}
            </ReactMarkdown>
            <style>{`
                .prose {
                    color: #e5e7eb; /* Tailwind gray-200 - Base text color for all prose content */
                }
                .prose img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }
                .prose a {
                    color: #60a5fa; /* Tailwind blue-400 */
                    text-decoration: underline;
                }
                .prose pre {
                    background-color: #1f2937; /* Tailwind gray-800 */
                    color: #e5e7eb; /* Tailwind gray-200 */
                    padding: 1rem;
                    border-radius: 0.375rem; /* Tailwind rounded-md */
                    overflow-x: auto;
                }
                .prose code {
                    background-color: #374151; /* Tailwind gray-700 */
                    color: #f9fafb; /* Tailwind gray-50 */
                    padding: 0.2em 0.4em;
                    border-radius: 0.25rem;
                    font-size: 0.875em;
                }
                .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
                    color: #e5e7eb; /* Tailwind gray-200 */
                }
                .prose p {
                    color: #e5e7eb; /* Tailwind gray-200 */
                }
                .prose ul, .prose ol {
                    color: #e5e7eb; /* Tailwind gray-200 */
                }
                .prose li {
                    color: #e5e7eb; /* Tailwind gray-200 */
                }
                .prose blockquote {
                    border-left: 4px solid #6b7280; /* Tailwind gray-500 */
                    padding-left: 1rem;
                    color: #9ca3af; /* Tailwind gray-400 */
                    font-style: italic;
                }
            `}</style>
        </div>
    );
};

export default BlogPostView;