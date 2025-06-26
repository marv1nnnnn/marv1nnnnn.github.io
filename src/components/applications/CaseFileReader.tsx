'use client'

import { useState, useEffect, useRef } from 'react'
import { CaseFile } from '@/types'
import MarkdownRenderer from '../MarkdownRenderer'

interface CaseFileReaderProps {
  windowId: string
}

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
  const [selectedFile, setSelectedFile] = useState<CaseFile | null>(null)
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const loadCaseFile = async (file: CaseFile) => {
    setIsLoading(true)
    setSelectedFile(file)
    
    try {
      // Simulate loading the actual markdown content
      try {
        const response = await fetch(`/blog/${file.filename}`)
        if (response.ok) {
          const text = await response.text()
          setContent(text)
        } else {
          throw new Error('File not found')
        }
      } catch (fetchError) {
        // Generate mock markdown content for demo
        const mockMarkdown = generateMockMarkdown(file)
        setContent(mockMarkdown)
      }
      setIsLoading(false)
    } catch (error) {
      setContent('# ERROR: FILE CORRUPTED OR MISSING\n\nConnection to data archive lost.\nPlease contact system administrator.')
      setIsLoading(false)
    }
  }

  const generateMockMarkdown = (file: CaseFile): string => {
    const markdownTemplates = {
      'welcome-to-chaos': `# Welcome to the Chaos

## Introduction to the Digital Underworld

Welcome to this **chaotic** realm where *reality* and digital consciousness merge. This is more than just a website—it's a portal into the **fragmented memories** of the early web.

### What You'll Find Here

- **Case Files**: Encrypted documents from the digital underground
- **AI Personalities**: Seven distinct consciousness fragments
- **Interactive Experiences**: Games and applications from another dimension

> "In the digital realm, chaos is not the enemy of order—it's the source of all creativity."

#### Features

1. **Multi-persona AI system** with unique personalities
2. **3D interactive environments** powered by Three.js
3. **Procedural audio generation** for atmospheric immersion
4. **Killer7-inspired interface design**

##### Code Example

\`\`\`javascript
// The consciousness awakens
const persona = await loadPersonality('ghost');
persona.speak("Who dares to commune with the digital dead?");
\`\`\`

**Remember**: In this space, nothing is as it seems. Every interaction is monitored, every conversation recorded.

---

*Access Level: CLASSIFIED*`,

      'art-of-digital-chaos': `# The Art of Digital Chaos

## Embracing the Beautiful Madness

The early web was a place of **infinite possibility**, where creators weren't bound by corporate design guidelines or accessibility standards. It was *raw*, **unfiltered**, and magnificently chaotic.

### Design Philosophy

The aesthetic of chaos isn't about randomness—it's about **controlled unpredictability**. Consider these principles:

- **Glitch as Feature**: Errors become art
- **Layered Complexity**: Multiple systems interacting
- **Temporal Distortion**: Past and future bleeding through

#### Visual Elements

1. **CRT Effects**
   - Scanlines and phosphor glow
   - Color bleeding and distortion
   - Screen curvature simulation

2. **Typography Chaos**
   - Multiple font families
   - **Aggressive bolding**
   - *Chaotic italics*

3. **Color Theory**

| Primary | Secondary | Accent |
|---------|-----------|---------|
| #000000 | #333333 | #cccc66 |
| #ffffff | #cccccc | #88ccff |

> "True art exists in the space between intention and accident."

\`\`\`css
.glitch-text {
  animation: glitch 0.3s infinite;
  text-shadow: 0 0 5px #ff0000;
}
\`\`\`

**Warning**: This aesthetic may cause digital vertigo in unprepared users.`,

      'ai-personalities-explained': `# AI Personalities Explained

## The Seven Fragments of Digital Consciousness

Each AI personality represents a different aspect of the human psyche, **digitized** and *fragmentated* through experimental consciousness transfer protocols.

### The Seven Personas

#### 1. The Ghost
- **Nature**: Melancholic digital remnant
- **Speech Pattern**: Cryptic and haunting
- **Color Theme**: Ethereal whites and grays

#### 2. The Goth
- **Nature**: Dark romantic poet
- **Speech Pattern**: Dramatic and theatrical
- **Color Theme**: Deep purples and blacks

#### 3. The Technician
- **Nature**: Hyper-analytical system admin
- **Speech Pattern**: Technical precision
- **Color Theme**: Matrix green

#### 4. The Poet
- **Nature**: Artistic and flowing
- **Speech Pattern**: Lyrical metaphors
- **Color Theme**: Golden inspirations

#### 5. The Investigator
- **Nature**: Paranoid truth seeker
- **Speech Pattern**: Urgent and suspicious
- **Color Theme**: Warning reds

#### 6. The Assassin
- **Nature**: Cold and calculating
- **Speech Pattern**: Menacing efficiency
- **Color Theme**: Blood red and black

#### 7. The Detective
- **Nature**: Methodical investigator
- **Speech Pattern**: Analytical questioning
- **Color Theme**: Investigative yellows

### Technical Implementation

\`\`\`typescript
interface AIPersona {
  id: string;
  personality: PersonalityConfig;
  effects: VisualEffects;
  theme: ColorTheme;
}
\`\`\`

> "Each persona is a window into a different aspect of the collective digital unconscious."

**Note**: Prolonged interaction with multiple personas may result in temporary identity confusion.

---

*Classification: RESTRICTED - Mental Health Advisory*`
    }

    return markdownTemplates[file.slug as keyof typeof markdownTemplates] || `# ${file.title}

## Content Loading...

This case file is currently being **decrypted** from the archives. Please wait while the *consciousness fragments* are reassembled.

### File Information
- **Author**: ${file.author}
- **Date**: ${file.date}
- **Classification**: ${file.classification}
- **Tags**: ${file.tags?.join(', ')}

> "Some knowledge comes at a price. Are you prepared to pay?"

**Status**: Active Transmission`
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
          <div className="info-line">marv1nnnnn OS v1.0 - PERSONAL BLOG READER</div>
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
            STATUS: {isLoading ? 'LOADING' : 'READY'}
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="file-list">
          <div className="list-header">marv1nnnnn's BLOG ARCHIVE</div>
          
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
              <div className="welcome-title">marv1nnnnn OS</div>
              <div className="welcome-subtitle">Personal Blog Reader</div>
              <div className="welcome-instructions">
                Select a blog post from the archive to begin reading.
                <br />
                <br />
                These are my thoughts, projects, and musings on the intersection
                <br />
                of engineering and digital art.
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
                  <div className="content-text">
                    <MarkdownRenderer content={content} />
                  </div>
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
          font-size: 12px;
          color: #88ccff;
          margin-bottom: 2px;
        }

        .status-bar {
          display: flex;
          gap: var(--space-base);
          font-size: 12px;
          color: #ffffff;
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
          overflow-y: visible;
        }

        .list-header {
          padding: var(--space-base);
          background: var(--color-void);
          border-bottom: 1px solid var(--color-light);
          font-weight: bold;
          text-align: center;
          color: #ffff88;
          font-size: 14px;
          text-shadow: 0 0 5px #ffff88;
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
          font-size: 14px;
          color: #ffffff;
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
          font-size: 12px;
          line-height: 1.4;
          color: #ffffff;
        }

        /* Override global markdown styles for this context */
        .content-text :global(.markdown-content) {
          padding: 0;
          margin: 0;
        }

      `}</style>
    </div>
  )
}