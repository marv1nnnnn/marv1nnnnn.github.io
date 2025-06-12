import { useState } from 'react';
import { FaGithub, FaExternalLinkAlt, FaFolder, FaFile, FaChevronLeft, FaLink } from 'react-icons/fa';
import { userConfig } from '../../config/userConfig';
import DraggableWindow from './DraggableWindow';

type FileNode = {
  name: string;
  type: 'file' | 'directory';
  children?: readonly FileNode[];
};

type ProjectStructure = {
  root: string;
  children: readonly FileNode[];
};

type Project = typeof userConfig.projects[0];

interface GitHubViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const GitHubViewer = ({ isOpen, onClose }: GitHubViewerProps) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showStructure, setShowStructure] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const toggleNode = (path: string) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(path)) {
      newExpandedNodes.delete(path);
    } else {
      newExpandedNodes.add(path);
    }
    setExpandedNodes(newExpandedNodes);
  };

  const renderFileTree = (node: FileNode, path: string = '') => {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedNodes.has(currentPath);

    return (
      <div key={currentPath} className="ml-4">
        <div
          className="flex items-center cursor-pointer hover:bg-gray-700/50 p-1 rounded"
          onClick={() => node.type === 'directory' && toggleNode(currentPath)}
        >
          {node.type === 'directory' ? (
            <FaFolder className="text-yellow-500 mr-2" />
          ) : (
            <FaFile className="text-blue-400 mr-2" />
          )}
          <span className="text-gray-200">{node.name}</span>
        </div>
        {node.type === 'directory' && isExpanded && node.children && (
          <div className="ml-4">
            {node.children.map((child) => renderFileTree(child, currentPath))}
          </div>
        )}
      </div>
    );
  };

  const renderProjectStructure = (projectStructure: ProjectStructure) => {
    // Create the root node first
    return (
      <div>
        <div className="flex items-center p-1 rounded">
          <FaFolder className="text-yellow-500 mr-2" />
          <span className="text-gray-200 font-bold">{projectStructure.root}</span>
        </div>
        <div className="ml-4">
          {projectStructure.children.map((child) => renderFileTree(child, projectStructure.root))}
        </div>
      </div>
    );
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowStructure(true);
    setActiveImageIndex(0);
  };

  const handleBackClick = () => {
    setShowStructure(false);
    setSelectedProject(null);
  };

  const handleNextImage = () => {
    if (selectedProject) {
      setActiveImageIndex((prevIndex) => 
        prevIndex + 1 >= selectedProject.images.length ? 0 : prevIndex + 1
      );
    }
  };

  const handlePrevImage = () => {
    if (selectedProject) {
      setActiveImageIndex((prevIndex) => 
        prevIndex - 1 < 0 ? selectedProject.images.length - 1 : prevIndex - 1
      );
    }
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title={showStructure ? selectedProject?.title || 'GitHub Projects' : 'GitHub Projects'}
      onClose={onClose}
      initialPosition={{ 
        x: Math.floor(window.innerWidth * 0.2), 
        y: Math.floor(window.innerHeight * 0.2) 
      }}
      className="w-[93vw] md:max-w-4xl max-h-[90vh] flex flex-col"
      initialSize={{ width: 800, height: 600 }}
    >
      <div className="flex flex-col flex-grow min-h-0 h-full">
        <div className="overflow-y-auto flex-grow min-h-0 p-4 md:p-6">
          {!showStructure ? (
            <>
              <h2 className="text-2xl font-bold mb-4 text-gray-200">My Projects</h2>
              {userConfig.social.github && (
                <a
                  href={userConfig.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-blue-400 text-gray-300 mb-4"
                >
                  <FaGithub />
                  <span>Visit my GitHub Profile</span>
                </a>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userConfig.projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-gray-800/50 p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-700/50"
                    onClick={() => handleProjectClick(project)}
                  >
                    {project.images && project.images.length > 0 && (
                      <div className="w-full h-48 mb-3 overflow-hidden rounded-lg">
                        <img
                          src={project.images[0].url}
                          alt={project.images[0].alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-2 text-gray-200">{project.title}</h3>
                    <p className="text-gray-400 mb-2">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-blue-400 text-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaGithub />
                        <span>Repository</span>
                      </a>
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm hover:text-blue-400 text-gray-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaExternalLinkAlt />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 text-gray-300 hover:text-gray-100 mb-4"
              >
                <FaChevronLeft />
                <span>Back to Projects</span>
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-4 text-gray-200">Project Structure</h3>
                  <div className="font-mono text-sm">
                    {selectedProject && renderProjectStructure(selectedProject.structure as unknown as ProjectStructure)}
                  </div>
                </div>
                
                {selectedProject && selectedProject.images && selectedProject.images.length > 0 && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-4 text-gray-200">Screenshots</h3>
                    <div className="relative">
                      <div className="rounded-lg overflow-hidden mb-2">
                        <img 
                          src={selectedProject.images[activeImageIndex].url} 
                          alt={selectedProject.images[activeImageIndex].alt}
                          className="w-full object-cover" 
                        />
                      </div>
                      
                      <div className="text-sm text-gray-300 mb-3">
                        {selectedProject.images[activeImageIndex].description}
                      </div>
                      
                      {selectedProject.images.length > 1 && (
                        <div className="flex justify-between mt-2">
                          <button 
                            onClick={handlePrevImage}
                            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                          >
                            ←
                          </button>
                          <span className="text-gray-400">
                            {activeImageIndex + 1} / {selectedProject.images.length}
                          </span>
                          <button 
                            onClick={handleNextImage}
                            className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                          >
                            →
                          </button>
                        </div>
                      )}
                    </div>
                    {selectedProject.repoUrl && (
                      <div className="mt-4">
                        <a
                          href={selectedProject.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm hover:text-blue-400 text-gray-300 bg-gray-700/50 p-2 rounded-lg"
                        >
                          <FaGithub />
                          <span>Visit GitHub Repository</span>
                        </a>
                      </div>
                    )}
                    {selectedProject.liveUrl && (
                      <div className="mt-4">
                        <a
                          href={selectedProject.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm hover:text-blue-400 text-gray-300 bg-gray-700/50 p-2 rounded-lg"
                        >
                          <FaLink />
                          <span>Visit Live Site</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DraggableWindow>
  );
};

export default GitHubViewer; 