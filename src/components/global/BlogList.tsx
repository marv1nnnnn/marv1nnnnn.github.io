import React, { useState, useEffect } from 'react';
import { FaChevronRight } from 'react-icons/fa';

interface BlogPost {
    slug: string;
    title: string;
    description: string;
    publishDate: string;
}

interface BlogListProps {
    onSelectPost: (slug: string) => void;
}

const BlogList: React.FC<BlogListProps> = ({ onSelectPost }) => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch('/api/posts.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: BlogPost[] = await response.json();
                setPosts(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full text-gray-300">
                Loading blog posts...
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

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Blog Posts</h2>
            {posts.length === 0 ? (
                <p className="text-gray-400">No blog posts found.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {posts.map((post) => (
                        <div
                            key={post.slug}
                            className="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors flex justify-between items-center"
                            onClick={() => onSelectPost(post.slug)}
                        >
                            <div>
                                <h3 className="text-xl font-semibold text-gray-200">{post.title}</h3>
                                <p className="text-gray-400 text-sm">{post.description}</p>
                                <p className="text-gray-500 text-xs mt-1">Published: {new Date(post.publishDate).toLocaleDateString()}</p>
                            </div>
                            <FaChevronRight className="text-gray-400" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlogList;