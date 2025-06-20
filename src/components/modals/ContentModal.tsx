'use client'

import { useEffect, useRef } from 'react'
import { AIPersona } from '@/types/personas'
import { useAudio } from '@/contexts/AudioContext'
import CaseFileReader from '../applications/CaseFileReader'
import CatherinesSuitcase from '../applications/CatherinesSuitcase'
import LostFoundGames from '../applications/LostFoundGames'
import gsap from 'gsap'

type ContentType = 'blogs' | 'music' | 'games'

interface ContentModalProps {
  contentType: ContentType
  onClose: () => void
  persona: AIPersona
}

export default function ContentModal({ contentType, onClose, persona }: ContentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { playSound } = useAudio()

  useEffect(() => {
    // Entrance animation
    if (modalRef.current && contentRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      )
      
      gsap.fromTo(contentRef.current,
        { 
          scale: 0.8,
          y: 50,
          opacity: 0 
        },
        { 
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.7)"
        }
      )
    }
    
    // Lock body scroll
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleClose = () => {
    if (modalRef.current && contentRef.current) {
      gsap.to(contentRef.current, {
        scale: 0.8,
        y: 50,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in"
      })
      
      gsap.to(modalRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: onClose
      })
    } else {
      onClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const getModalTitle = () => {
    switch (contentType) {
      case 'blogs':
        return 'Case Files Archive'
      case 'music':
        return "Catherine's Suitcase"
      case 'games':
        return 'Lost Protocols Database'
      default:
        return 'Unknown Archive'
    }
  }

  const renderContent = () => {
    const commonProps = {
      windowId: `modal-${contentType}`
    }

    switch (contentType) {
      case 'blogs':
        return <CaseFileReader {...commonProps} />
      case 'music':
        return <CatherinesSuitcase {...commonProps} />
      case 'games':
        return <LostFoundGames {...commonProps} />
      default:
        return <div>Content not found</div>
    }
  }

  return (
    <div 
      ref={modalRef}
      className="content-modal"
      onClick={handleBackdropClick}
    >
      <div 
        ref={contentRef}
        className="modal-window"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-left">
            <div className="modal-title">{getModalTitle()}</div>
            <div className="modal-subtitle">
              Accessed via {persona.displayName} • Security Level: CLASSIFIED
            </div>
          </div>
          
          <div className="header-controls">
            <button className="control-button minimize">_</button>
            <button className="control-button maximize">□</button>
            <button className="control-button close" onClick={handleClose}>×</button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {renderContent()}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-info">
            <span>Access Terminal: {contentType.toUpperCase()}</span>
            <span>•</span>
            <span>Persona: {persona.name}</span>
            <span>•</span>
            <span>Status: CONNECTED</span>
          </div>
          
          <div className="footer-controls">
            <button className="footer-button" onClick={handleClose}>
              DISCONNECT
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .content-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-window {
          width: 90vw;
          height: 85vh;
          max-width: 1200px;
          background: var(--persona-bg, #0a0a0a);
          border: 2px solid var(--persona-accent, #cccc66);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
          position: relative;
        }

        .modal-window::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, var(--persona-accent, #cccc66), transparent, var(--persona-accent, #cccc66));
          border-radius: 8px;
          z-index: -1;
          opacity: 0.3;
        }

        .modal-header {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
          border-bottom: 1px solid var(--persona-accent, #cccc66);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--persona-font, 'Courier New, monospace');
        }

        .header-left {
          flex: 1;
        }

        .modal-title {
          color: var(--persona-accent, #cccc66);
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 2px;
        }

        .modal-subtitle {
          color: var(--persona-text, #cccccc);
          font-size: 11px;
          opacity: 0.8;
        }

        .header-controls {
          display: flex;
          gap: 8px;
        }

        .control-button {
          width: 24px;
          height: 24px;
          background: transparent;
          border: 1px solid var(--persona-accent, #cccc66);
          color: var(--persona-accent, #cccc66);
          cursor: pointer;
          font-size: 12px;
          font-weight: bold;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-button:hover {
          background: var(--persona-accent, #cccc66);
          color: var(--persona-bg, #0a0a0a);
        }

        .control-button.close:hover {
          background: #ff4444;
          border-color: #ff4444;
          color: white;
        }

        .modal-content {
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .modal-footer {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
          border-top: 1px solid var(--persona-accent, #cccc66);
          padding: 8px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Courier New, monospace';
          font-size: 11px;
        }

        .footer-info {
          display: flex;
          gap: 8px;
          align-items: center;
          color: var(--persona-text, #cccccc);
          opacity: 0.8;
        }

        .footer-controls {
          display: flex;
          gap: 8px;
        }

        .footer-button {
          background: transparent;
          border: 1px solid var(--persona-accent, #cccc66);
          color: var(--persona-accent, #cccc66);
          padding: 4px 12px;
          font-size: 10px;
          font-family: 'Courier New, monospace';
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 1px;
        }

        .footer-button:hover {
          background: var(--persona-accent, #cccc66);
          color: var(--persona-bg, #0a0a0a);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .modal-window {
            width: 95vw;
            height: 90vh;
          }
          
          .modal-header {
            padding: 8px 12px;
          }
          
          .modal-title {
            font-size: 12px;
          }
          
          .modal-subtitle {
            font-size: 10px;
          }
          
          .footer-info {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  )
}