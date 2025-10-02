'use client'

import { useState, useEffect, useRef } from 'react'
import { CaseFile } from '@/types'
import { CODE_PROJECTS, MUSIC_PROJECTS, Project } from '@/data/projects'
import MarkdownRenderer from '../MarkdownRenderer'

interface CaseFileReaderProps {
  windowId: string
}

type ContentType = 'blog' | 'code' | 'music'

// Mock case files data - in real implementation, this would come from the blog metadata
const CASE_FILES: CaseFile[] = [
  {
    id: '1',
    slug: 'welcome-to-chaos',
    title: 'Welcome to marv1nnnnn\'s Digital Space',
    author: 'marv1nnnnn',
    date: '2025-06-15',
    tags: ['welcome', 'chaos', 'early-web', 'nostalgia'],
    filename: 'welcome-to-chaos.md',
    classification: 'PUBLIC',
    glitchWords: ['chaos', 'digital', 'consciousness'],
  },
  {
    id: '2',
    slug: 'art-of-digital-chaos',
    title: 'Engineering Meets Art: My Design Philosophy',
    author: 'marv1nnnnn',
    date: '2025-06-14',
    tags: ['design', 'aesthetics', 'philosophy', 'web-history'],
    filename: 'art-of-digital-chaos.md',
    classification: 'RESTRICTED',
    glitchWords: ['aesthetic', 'paradigm', 'reality'],
  },
  {
    id: '3',
    slug: 'ai-personalities-explained',
    title: 'My Digital Personas: Three Modes of Consciousness',
    author: 'marv1nnnnn',
    date: '2025-06-13',
    tags: ['ai', 'personalities', 'technology', 'interaction'],
    filename: 'ai-personalities-explained.md',
    classification: 'CLASSIFIED',
    glitchWords: ['artificial', 'intelligence', 'consciousness'],
  },
]

export default function CaseFileReader({ windowId }: CaseFileReaderProps) {
  const [activeTab, setActiveTab] = useState<ContentType>('blog')
  const [selectedFile, setSelectedFile] = useState<CaseFile | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const loadCaseFile = async (file: CaseFile) => {
    setIsLoading(true)
    setSelectedFile(file)
    setSelectedProject(null)

    try {
      try {
        const response = await fetch(`/blog/${file.filename}`)
        if (response.ok) {
          const text = await response.text()
          setContent(text)
        } else {
          throw new Error('File not found')
        }
      } catch (fetchError) {
        // Fallback content
        setContent(`# ${file.title}\n\nContent coming soon...`)
      }
      setIsLoading(false)
    } catch (error) {
      setContent('# ERROR: FILE CORRUPTED OR MISSING\n\nConnection to data archive lost.')
      setIsLoading(false)
    }
  }

  const selectProject = (project: Project) => {
    setSelectedProject(project)
    setSelectedFile(null)
  }

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'PUBLIC': return '#88ccff'
      case 'RESTRICTED': return '#ffaa00'
      case 'CLASSIFIED': return '#ff4444'
      default: return '#ffffff'
    }
  }

  return (
    <div className="case-file-reader">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div
          className={`tab ${activeTab === 'blog' ? 'active' : ''}`}
          onClick={() => setActiveTab('blog')}
        >
          📝 Blog Posts
        </div>
        <div
          className={`tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          💻 Code Projects
        </div>
        <div
          className={`tab ${activeTab === 'music' ? 'active' : ''}`}
          onClick={() => setActiveTab('music')}
        >
          🎵 Music Projects
        </div>
      </div>

      <div className="main-content">
        {/* Sidebar List */}
        <div className="item-list">
          <div className="list-header">
            {activeTab === 'blog' && 'BLOG ARCHIVE'}
            {activeTab === 'code' && 'CODE PROJECTS'}
            {activeTab === 'music' && 'MUSIC RELEASES'}
          </div>

          {activeTab === 'blog' && CASE_FILES.map(file => (
            <div
              key={file.id}
              className={`list-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
              onClick={() => loadCaseFile(file)}
            >
              <div className="item-classification">
                <span
                  className="classification-badge"
                  style={{ color: getClassificationColor(file.classification || 'PUBLIC') }}
                >
                  [{file.classification}]
                </span>
              </div>
              <div className="item-title">{file.title}</div>
              <div className="item-meta">
                <span>{file.author}</span>
                <span>{file.date}</span>
              </div>
            </div>
          ))}

          {activeTab === 'code' && CODE_PROJECTS.map(project => (
            <div
              key={project.id}
              className={`list-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
              onClick={() => selectProject(project)}
            >
              {project.featured && <div className="featured-badge">⭐ Featured</div>}
              <div className="item-title">{project.title}</div>
              <div className="item-meta">
                <span>{project.year}</span>
              </div>
              <div className="item-tags">
                {project.tech?.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>
          ))}

          {activeTab === 'music' && MUSIC_PROJECTS.map(project => (
            <div
              key={project.id}
              className={`list-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
              onClick={() => selectProject(project)}
            >
              <div className="item-title">{project.title}</div>
              <div className="item-meta">
                <span>{project.year}</span>
              </div>
              <div className="item-tags">
                {project.genre?.map(g => <span key={g} className="tag">{g}</span>)}
              </div>
            </div>
          ))}
        </div>

        {/* Content Display */}
        <div className="content-area">
          {!selectedFile && !selectedProject ? (
            <div className="welcome-screen">
              <div className="welcome-title">marv1nnnnn's Archive</div>
              <div className="welcome-subtitle">
                {activeTab === 'blog' && 'Personal thoughts and writing'}
                {activeTab === 'code' && 'Code projects and experiments'}
                {activeTab === 'music' && 'Musical explorations'}
              </div>
              <div className="welcome-instructions">
                Select an item from the left to view details
              </div>
            </div>
          ) : selectedFile ? (
            <div className="file-viewer">
              <div className="viewer-header">
                <div className="file-info">
                  <div className="file-name">{selectedFile.title}</div>
                  <div className="file-details">
                    <span style={{ color: getClassificationColor(selectedFile.classification || 'PUBLIC') }}>
                      {selectedFile.classification || 'PUBLIC'}
                    </span> | {selectedFile.author} | {selectedFile.date}
                  </div>
                </div>
              </div>
              <div className="content-display" ref={contentRef}>
                {isLoading ? (
                  <div className="loading-indicator">DECRYPTING FILE...</div>
                ) : (
                  <MarkdownRenderer content={content} />
                )}
              </div>
            </div>
          ) : selectedProject ? (
            <div className="project-viewer">
              <div className="project-header">
                <h2>{selectedProject.title}</h2>
                <div className="project-year">{selectedProject.year}</div>
              </div>
              <div className="project-description">
                {selectedProject.description}
              </div>
              <div className="project-tech">
                {selectedProject.tech?.map(t => (
                  <span key={t} className="tech-tag">{t}</span>
                ))}
                {selectedProject.genre?.map(g => (
                  <span key={g} className="tech-tag">{g}</span>
                ))}
              </div>
              <div className="project-links">
                {selectedProject.links.github && (
                  <a href={selectedProject.links.github} target="_blank" rel="noopener noreferrer" className="project-link">
                    GitHub ↗
                  </a>
                )}
                {selectedProject.links.demo && (
                  <a href={selectedProject.links.demo} target="_blank" rel="noopener noreferrer" className="project-link">
                    Live Demo ↗
                  </a>
                )}
                {selectedProject.links.spotify && (
                  <a href={selectedProject.links.spotify} target="_blank" rel="noopener noreferrer" className="project-link">
                    Spotify ↗
                  </a>
                )}
                {selectedProject.links.bandcamp && (
                  <a href={selectedProject.links.bandcamp} target="_blank" rel="noopener noreferrer" className="project-link">
                    Bandcamp ↗
                  </a>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        .case-file-reader {
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: 'Courier New', monospace;
          background: rgba(0, 0, 0, 0.95);
          color: #ffffff;
        }

        .tab-navigation {
          display: flex;
          border-bottom: 2px solid rgba(255, 69, 0, 0.3);
          background: rgba(0, 0, 0, 0.7);
        }

        .tab {
          flex: 1;
          padding: 12px 16px;
          text-align: center;
          cursor: pointer;
          border-right: 1px solid rgba(255, 69, 0, 0.2);
          transition: all 0.2s ease;
          font-size: 13px;
          color: rgba(255, 69, 0, 0.6);
        }

        .tab:last-child {
          border-right: none;
        }

        .tab:hover {
          background: rgba(255, 69, 0, 0.1);
          color: rgba(255, 69, 0, 0.9);
        }

        .tab.active {
          background: rgba(255, 69, 0, 0.2);
          color: #ff4500;
          border-bottom: 2px solid #ff4500;
        }

        .main-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .item-list {
          width: 320px;
          border-right: 2px solid rgba(255, 69, 0, 0.3);
          background: rgba(0, 0, 0, 0.5);
          overflow-y: auto;
        }

        .list-header {
          padding: 12px;
          background: rgba(0, 0, 0, 0.8);
          border-bottom: 1px solid rgba(255, 69, 0, 0.3);
          font-weight: bold;
          text-align: center;
          color: #ff4500;
          font-size: 12px;
          letter-spacing: 1px;
        }

        .list-item {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 69, 0, 0.1);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .list-item:hover {
          background: rgba(255, 69, 0, 0.1);
        }

        .list-item.selected {
          background: rgba(255, 69, 0, 0.25);
          border-left: 3px solid #ff4500;
        }

        .item-classification, .featured-badge {
          margin-bottom: 6px;
          font-size: 10px;
          color: #88ccff;
        }

        .classification-badge {
          font-weight: bold;
        }

        .item-title {
          font-weight: bold;
          margin-bottom: 6px;
          font-size: 13px;
          color: #ffffff;
        }

        .item-meta {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 6px;
        }

        .item-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 6px;
        }

        .tag {
          font-size: 9px;
          background: rgba(255, 69, 0, 0.2);
          color: #ff6b47;
          padding: 2px 6px;
          border-radius: 2px;
          border: 1px solid rgba(255, 69, 0, 0.3);
        }

        .content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .welcome-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 40px;
        }

        .welcome-title {
          font-size: 24px;
          font-weight: bold;
          color: #ff4500;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .welcome-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 20px;
        }

        .welcome-instructions {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .file-viewer {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .viewer-header {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 69, 0, 0.3);
          background: rgba(0, 0, 0, 0.5);
        }

        .file-name {
          font-weight: bold;
          color: #ffffff;
          margin-bottom: 6px;
        }

        .file-details {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .content-display {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          font-size: 13px;
          line-height: 1.6;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #ff4500;
        }

        .project-viewer {
          padding: 24px;
          overflow-y: auto;
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 16px;
        }

        .project-header h2 {
          color: #ff4500;
          font-size: 20px;
          margin: 0;
        }

        .project-year {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
        }

        .project-description {
          margin-bottom: 20px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
        }

        .project-tech {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }

        .tech-tag {
          background: rgba(255, 69, 0, 0.2);
          color: #ff6b47;
          padding: 6px 12px;
          border-radius: 3px;
          font-size: 11px;
          border: 1px solid rgba(255, 69, 0, 0.3);
        }

        .project-links {
          display: flex;
          gap: 12px;
        }

        .project-link {
          background: rgba(255, 69, 0, 0.15);
          color: #ff4500;
          padding: 8px 16px;
          border: 1px solid rgba(255, 69, 0, 0.4);
          text-decoration: none;
          border-radius: 3px;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .project-link:hover {
          background: rgba(255, 69, 0, 0.3);
          border-color: #ff4500;
          text-shadow: 0 0 8px rgba(255, 69, 0, 0.5);
        }
      `}</style>
    </div>
  )
}
