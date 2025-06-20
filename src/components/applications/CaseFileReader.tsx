'use client'

import { useState, useEffect, useRef } from 'react'
import { CaseFile } from '@/types'

interface CaseFileReaderProps {
  windowId: string
}

// Mock case files data - in real implementation, this would come from the blog metadata
const CASE_FILES: CaseFile[] = [
  {
    id: '1',
    slug: 'welcome-to-chaos',
    title: 'Welcome to the Chaos',
    author: 'WebMaster Supreme',
    date: '2025-06-15',
    tags: ['welcome', 'chaos', 'early-web', 'nostalgia'],
    filename: 'welcome-to-chaos.md',
    classification: 'PUBLIC',
    glitchWords: ['chaos', 'digital', 'consciousness'],
  },
  {
    id: '2',
    slug: 'art-of-digital-chaos',
    title: 'The Art of Digital Chaos',
    author: 'Chaos Architect',
    date: '2025-06-14',
    tags: ['design', 'aesthetics', 'philosophy', 'web-history'],
    filename: 'art-of-digital-chaos.md',
    classification: 'RESTRICTED',
    glitchWords: ['aesthetic', 'paradigm', 'reality'],
  },
  {
    id: '3',
    slug: 'ai-personalities-explained',
    title: 'AI Personalities Explained',
    author: 'AI Whisperer',
    date: '2025-06-13',
    tags: ['ai', 'personalities', 'technology', 'interaction'],
    filename: 'ai-personalities-explained.md',
    classification: 'CLASSIFIED',
    glitchWords: ['artificial', 'intelligence', 'consciousness'],
  },
]

export default function CaseFileReader({ windowId }: CaseFileReaderProps) {
  const [selectedFile, setSelectedFile] = useState<CaseFile | null>(null)
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [displayedContent, setDisplayedContent] = useState<string>('')
  const [isTyping, setIsTyping] = useState(false)
  const [glitchWords, setGlitchWords] = useState<Set<string>>(new Set())
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Random glitch effects for words
    const glitchInterval = setInterval(() => {
      if (selectedFile?.glitchWords && Math.random() < 0.1) {
        const word = selectedFile.glitchWords[Math.floor(Math.random() * selectedFile.glitchWords.length)]
        setGlitchWords(prev => new Set(Array.from(prev).concat(word)))
        
        setTimeout(() => {
          setGlitchWords(prev => {
            const newSet = new Set(prev)
            newSet.delete(word)
            return newSet
          })
        }, 1000)
      }
    }, 3000)

    return () => clearInterval(glitchInterval)
  }, [selectedFile])

  const typewriterEffect = (text: string) => {
    setIsTyping(true)
    setDisplayedContent('')
    
    let index = 0
    const typeChar = () => {
      if (index < text.length) {
        setDisplayedContent(prev => prev + text[index])
        index++
        setTimeout(typeChar, Math.random() * 30 + 10) // Variable typing speed
      } else {
        setIsTyping(false)
      }
    }
    
    typeChar()
  }

  const loadCaseFile = async (file: CaseFile) => {
    setIsLoading(true)
    setSelectedFile(file)
    
    try {
      // Simulate loading the actual markdown content
      const response = await fetch(`/blog/${file.filename}`)
      const text = await response.text()
      setContent(text)
      
      // Apply typewriter effect
      setTimeout(() => {
        setIsLoading(false)
        typewriterEffect(text)
      }, 500)
    } catch (error) {
      setContent('ERROR: FILE CORRUPTED OR MISSING\n\nConnection to data archive lost.\nPlease contact system administrator.')
      setIsLoading(false)
      typewriterEffect('ERROR: FILE CORRUPTED OR MISSING\n\nConnection to data archive lost.\nPlease contact system administrator.')
    }
  }

  const renderContent = (text: string) => {
    if (!selectedFile) return text

    let processedText = text
    
    // Apply glitch effects to specific words
    selectedFile.glitchWords?.forEach(word => {
      if (glitchWords.has(word)) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi')
        processedText = processedText.replace(regex, `<span class="text-glitch">${word}</span>`)
      }
    })

    return processedText
  }

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'PUBLIC': return 'var(--color-info)'
      case 'RESTRICTED': return 'var(--color-unease)'
      case 'CLASSIFIED': return 'var(--color-blood)'
      case 'REDACTED': return 'var(--color-void)'
      default: return 'var(--color-light)'
    }
  }

  return (
    <div className="case-file-reader">
      <div className="film-window-header">
        <div className="system-info">
          <div className="info-line">KAMINO OS v2.5.1 - CASE FILE READER</div>
          <div className="info-line">ACCESS LEVEL: [USER_CLEARANCE_BETA]</div>
          <div className="info-line">SESSION: {new Date().toISOString().substr(0, 19)}</div>
        </div>
        
        <div className="status-bar">
          <div className="status-item">
            FILES: {CASE_FILES.length}
          </div>
          <div className="status-item">
            SELECTED: {selectedFile ? selectedFile.title : 'NONE'}
          </div>
          <div className="status-item">
            STATUS: {isLoading ? 'LOADING' : isTyping ? 'DECRYPTING' : 'READY'}
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="file-list">
          <div className="list-header">CASE FILES ARCHIVE</div>
          
          {CASE_FILES.map(file => (
            <div
              key={file.id}
              className={`file-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
              onClick={() => loadCaseFile(file)}
            >
              <div className="file-classification">
                <span 
                  className="classification-badge"
                  style={{ color: getClassificationColor(file.classification || 'PUBLIC') }}
                >
                  [{file.classification}]
                </span>
              </div>
              
              <div className="file-title">{file.title}</div>
              
              <div className="file-meta">
                <div className="file-author">{file.author}</div>
                <div className="file-date">{file.date}</div>
              </div>
              
              <div className="file-tags">
                {file.tags.map(tag => (
                  <span key={tag} className="tag">#{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="content-area">
          {!selectedFile ? (
            <div className="welcome-screen">
              <div className="welcome-title">THE FILM WINDOW</div>
              <div className="welcome-subtitle">Case File Reading System</div>
              <div className="welcome-instructions">
                Select a case file from the archive to begin decryption.
                <br />
                <br />
                WARNING: Some files may contain classified information
                <br />
                that could trigger automatic redaction protocols.
              </div>
            </div>
          ) : (
            <div className="file-viewer">
              <div className="viewer-header">
                <div className="file-info">
                  <div className="file-name">{selectedFile.title}</div>
                  <div className="file-details">
                    Classification: <span style={{ color: getClassificationColor(selectedFile.classification || 'PUBLIC') }}>
                      {selectedFile.classification || 'PUBLIC'}
                    </span> | 
                    Author: {selectedFile.author} | 
                    Date: {selectedFile.date}
                  </div>
                </div>
              </div>

              <div className="content-display" ref={contentRef}>
                {isLoading ? (
                  <div className="loading-indicator">
                    <div className="loading-text">DECRYPTING FILE</div>
                    <div className="loading-dots"></div>
                  </div>
                ) : (
                  <div 
                    className="content-text"
                    dangerouslySetInnerHTML={{ __html: renderContent(displayedContent) }}
                  />
                )}
                
                {isTyping && (
                  <span className="typing-cursor">█</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .case-file-reader {
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: var(--font-system);
          background: var(--color-void);
          color: var(--color-light);
        }

        .film-window-header {
          border-bottom: 2px solid var(--color-light);
          padding: var(--space-base);
          background: var(--color-shadow);
        }

        .system-info {
          margin-bottom: var(--space-sm);
        }

        .info-line {
          font-size: var(--font-size-xs);
          color: var(--color-info);
          margin-bottom: 2px;
        }

        .status-bar {
          display: flex;
          gap: var(--space-base);
          font-size: var(--font-size-xs);
          color: var(--color-light);
        }

        .status-item {
          padding: 2px var(--space-xs);
          border: 1px solid var(--color-grey-dark);
          background: var(--color-void);
        }

        .main-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .file-list {
          width: 300px;
          border-right: 2px solid var(--color-light);
          background: var(--color-shadow);
          overflow-y: auto;
        }

        .list-header {
          padding: var(--space-base);
          background: var(--color-void);
          border-bottom: 1px solid var(--color-light);
          font-weight: bold;
          text-align: center;
          color: var(--color-info);
          font-size: var(--font-size-sm);
        }

        .file-item {
          padding: var(--space-base);
          border-bottom: 1px solid var(--color-grey-dark);
          cursor: crosshair;
          transition: all 0.1s ease;
        }

        .file-item:hover {
          background: var(--color-grey-dark);
        }

        .file-item.selected {
          background: var(--color-info);
          color: var(--color-void);
        }

        .file-classification {
          margin-bottom: var(--space-xs);
        }

        .classification-badge {
          font-size: var(--font-size-xs);
          font-weight: bold;
          text-transform: uppercase;
        }

        .file-title {
          font-weight: bold;
          margin-bottom: var(--space-xs);
          font-size: var(--font-size-sm);
        }

        .file-meta {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-xs);
          color: var(--color-grey-light);
          margin-bottom: var(--space-xs);
        }

        .file-item.selected .file-meta {
          color: var(--color-shadow);
        }

        .file-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        .tag {
          font-size: var(--font-size-xs);
          background: var(--color-void);
          color: var(--color-unease);
          padding: 1px var(--space-xs);
          border-radius: 2px;
        }

        .file-item.selected .tag {
          background: var(--color-shadow);
          color: var(--color-unease);
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
          padding: var(--space-xl);
        }

        .welcome-title {
          font-size: var(--font-size-xxl);
          font-weight: bold;
          color: var(--color-info);
          margin-bottom: var(--space-sm);
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .welcome-subtitle {
          font-size: var(--font-size-base);
          color: var(--color-light);
          margin-bottom: var(--space-lg);
        }

        .welcome-instructions {
          font-size: var(--font-size-sm);
          color: var(--color-grey-light);
          line-height: 1.5;
        }

        .file-viewer {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .viewer-header {
          padding: var(--space-base);
          border-bottom: 1px solid var(--color-light);
          background: var(--color-shadow);
        }

        .file-name {
          font-weight: bold;
          color: var(--color-light);
          margin-bottom: var(--space-xs);
        }

        .file-details {
          font-size: var(--font-size-xs);
          color: var(--color-grey-light);
        }

        .content-display {
          flex: 1;
          padding: var(--space-base);
          overflow-y: auto;
          position: relative;
        }

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .loading-text {
          color: var(--color-info);
          font-size: var(--font-size-base);
          margin-bottom: var(--space-base);
        }

        .content-text {
          font-size: var(--font-size-sm);
          line-height: 1.6;
          color: var(--color-light);
          white-space: pre-wrap;
        }

        .typing-cursor {
          color: var(--color-info);
          animation: cursor-blink 1s infinite;
        }

        @keyframes cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .content-text :global(.text-glitch) {
          color: var(--color-blood);
          animation: text-glitch 0.3s infinite;
        }
      `}</style>
    </div>
  )
}