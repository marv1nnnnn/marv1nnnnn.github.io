import React from 'react';

interface BlogContentModalProps {
  title: string;
  content: string; // Content is now expected to be HTML
  onClose: () => void;
}

const BlogContentModal: React.FC<BlogContentModalProps> = ({ title, content, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-700 px-4 py-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-grow blog-content-modal-markdown">
          {/* Render pre-processed HTML directly */}
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </div>
  );
};
export default BlogContentModal;