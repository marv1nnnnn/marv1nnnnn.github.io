import React, { useState } from 'react';
import { FaBookOpen } from 'react-icons/fa';
import DraggableWindow from './DraggableWindow';
import BlogList from './BlogList';
import BlogPostView from './BlogPostView';

interface NotesAppProps {
    isOpen: boolean;
    onClose: () => void;
}

type Section = 'menu' | 'blogList' | 'blogPost';

const NotesApp = ({ isOpen, onClose }: NotesAppProps) => {
    const [activeSection, setActiveSection] = useState<Section>('blogList');
    const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(null);

    const handleSectionClick = (section: Section) => {
        setActiveSection(section);
    };

    const handleBackToMenu = () => {
        setActiveSection('menu');
        setSelectedPostSlug(null);
    };

    const handleSelectPost = (slug: string) => {
        setSelectedPostSlug(slug);
        setActiveSection('blogPost');
    };

    const handleBackToBlogList = () => {
        setActiveSection('blogList');
        setSelectedPostSlug(null);
    };

    if (!isOpen) return null;

    const renderMenu = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-6">My Notes</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Blog Posts */}
                <div
                    className="bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleSectionClick('blogList')}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                            <FaBookOpen size={28} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-200">Blog Posts</h3>
                    </div>
                    <p className="text-gray-400">Read my latest thoughts and articles</p>
                </div>
            </div>
        </div>
    );

    const getWindowTitle = () => {
        switch (activeSection) {
            case 'menu': return 'Notes';
            case 'blogList': return 'Blog Posts';
            case 'blogPost': return selectedPostSlug ? `Blog: ${selectedPostSlug}` : 'Blog Post';
            default: return 'Notes';
        }
    };

    return (
        <DraggableWindow
            title={getWindowTitle()}
            onClose={onClose}
            initialPosition={{
                x: Math.floor(window.innerWidth * 0.3),
                y: Math.floor(window.innerHeight * 0.2)
            }}
            className="w-[93vw] md:max-w-4xl max-h-[90vh] flex flex-col"
            initialSize={{ width: 700, height: 600 }}
        >
            <div className="flex flex-col flex-grow min-h-0 h-full">
                <div className="overflow-y-auto flex-grow min-h-0 p-4 md:p-6">
                    {activeSection === 'menu' && renderMenu()}
                    {activeSection === 'blogList' && (
                        <BlogList onSelectPost={handleSelectPost} />
                    )}
                    {activeSection === 'blogPost' && selectedPostSlug && (
                        <BlogPostView slug={selectedPostSlug} onBack={handleBackToBlogList} />
                    )}
                </div>
            </div>
        </DraggableWindow>
    );
};

export default NotesApp;