'use client'

import { type WindowState } from '@/types'

interface TaskbarProps {
  windows: WindowState[]
  onRestoreWindow: (windowId: string) => void
}

export default function Taskbar({ windows, onRestoreWindow }: TaskbarProps) {
  const minimizedWindows = windows.filter(w => w.isMinimized)

  if (minimizedWindows.length === 0) return null

  return (
    <div className="taskbar">
      <div className="taskbar-items">
        {minimizedWindows.map(window => (
          <button
            key={window.id}
            className="taskbar-item"
            onClick={() => onRestoreWindow(window.id)}
            title={`Restore ${window.title}`}
          >
            <span className="taskbar-icon">
              {window.component === 'ChatInterface' && '💬'}
              {window.component === 'ControlPanel' && '⚙️'}
              {window.component === 'CatherinesSuitcase' && '🎵'}
              {window.component === 'CaseFileReader' && '📄'}
              {!['ChatInterface', 'ControlPanel', 'CatherinesSuitcase', 'CaseFileReader'].includes(window.component) && '📁'}
            </span>
            <span className="taskbar-title">{window.title}</span>
          </button>
        ))}
      </div>
      
      <style jsx>{`
        .taskbar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: linear-gradient(to bottom, 
            rgba(0, 0, 0, 0.85), 
            rgba(0, 0, 0, 0.95)
          );
          border-top: 2px solid var(--color-light);
          display: flex;
          align-items: center;
          padding: 0 var(--space-sm);
          z-index: 9999;
          backdrop-filter: blur(8px);
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.6);
        }

        .taskbar-items {
          display: flex;
          gap: var(--space-xs);
          align-items: center;
          flex: 1;
        }

        .taskbar-item {
          background: var(--color-void);
          border: 1px solid var(--color-light);
          color: var(--color-light);
          padding: var(--space-xs) var(--space-base);
          cursor: crosshair;
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-family: var(--font-system);
          font-size: var(--font-size-xs);
          transition: all 0.1s ease;
          height: 30px;
          max-width: 200px;
          overflow: hidden;
        }

        .taskbar-item:hover {
          background: var(--color-grey-dark);
          transform: translateY(-1px);
          border-color: var(--color-info);
        }

        .taskbar-item:active {
          transform: translateY(0);
        }

        .taskbar-icon {
          font-size: var(--font-size-base);
          flex-shrink: 0;
        }

        .taskbar-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}