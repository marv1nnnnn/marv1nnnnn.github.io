'use client'

import { useState } from 'react'
import { useAudio } from '@/contexts/AudioContext'

type ContentType = 'blogs' | 'music' | 'games'

interface MenuTabsProps {
  onMenuClick: (contentType: ContentType) => void
}

interface TabItem {
  id: ContentType
  label: string
  description: string
  icon: string
}

const MENU_TABS: TabItem[] = [
  {
    id: 'blogs',
    label: 'Case Files',
    description: 'Digital fragments and corrupted memories',
    icon: '📁'
  },
  {
    id: 'music',
    label: "Catherine's Suitcase",
    description: 'Echoes from another dimension',
    icon: '🎵'
  },
  {
    id: 'games',
    label: 'Lost Protocols',
    description: 'Interactive consciousness fragments',
    icon: '🎮'
  }
]

export default function MenuTabs({ onMenuClick }: MenuTabsProps) {
  const [hoveredTab, setHoveredTab] = useState<ContentType | null>(null)
  const { playSound } = useAudio()

  const handleTabClick = (tabId: ContentType) => {
    onMenuClick(tabId)
    playSound('click')
  }

  const handleTabHover = (tabId: ContentType | null) => {
    setHoveredTab(tabId)
    if (tabId) {
      playSound('hover')
    }
  }

  return (
    <div className="menu-tabs">
      <div className="tabs-container">
        {MENU_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`menu-tab ${hoveredTab === tab.id ? 'hovered' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            onMouseEnter={() => handleTabHover(tab.id)}
            onMouseLeave={() => handleTabHover(null)}
          >
            <div className="tab-icon">{tab.icon}</div>
            <div className="tab-content">
              <div className="tab-label">{tab.label}</div>
              <div className="tab-description">{tab.description}</div>
            </div>
            <div className="tab-arrow">▶</div>
          </button>
        ))}
      </div>
      
      <div className="system-status">
        <div className="status-item">
          <span className="status-label">ARCHIVE:</span>
          <span className="status-value">ACCESSIBLE</span>
        </div>
        <div className="status-item">
          <span className="status-label">ENCRYPTION:</span>
          <span className="status-value">PARTIAL</span>
        </div>
        <div className="status-item">
          <span className="status-label">INTEGRITY:</span>
          <span className="status-value">CORRUPTED</span>
        </div>
      </div>

      <style jsx>{`
        .menu-tabs {
          position: fixed;
          top: 60px;
          right: 16px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tabs-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .menu-tab {
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid var(--persona-accent, #cccc66);
          color: var(--persona-text, #cccccc);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: var(--persona-font, 'Courier New, monospace');
          font-size: 12px;
          min-width: 250px;
          position: relative;
          overflow: hidden;
        }

        .menu-tab::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, var(--persona-accent, #cccc66)20, transparent);
          transition: left 0.5s ease;
        }

        .menu-tab.hovered::before {
          left: 100%;
        }

        .menu-tab:hover {
          background: rgba(0, 0, 0, 0.95);
          border-color: var(--persona-accent, #cccc66);
          transform: translateX(-4px);
          box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.5);
        }

        .tab-icon {
          font-size: 16px;
          opacity: 0.8;
          min-width: 20px;
          text-align: center;
        }

        .tab-content {
          flex: 1;
          text-align: left;
        }

        .tab-label {
          color: var(--persona-accent, #cccc66);
          font-weight: bold;
          margin-bottom: 2px;
          font-size: 13px;
        }

        .tab-description {
          color: var(--persona-text, #cccccc);
          opacity: 0.7;
          font-size: 10px;
          font-style: italic;
        }

        .tab-arrow {
          color: var(--persona-accent, #cccc66);
          font-size: 12px;
          transition: transform 0.3s ease;
        }

        .menu-tab.hovered .tab-arrow {
          transform: translateX(4px);
        }

        .system-status {
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 12px;
          font-family: 'Courier New, monospace';
          font-size: 10px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .status-item:last-child {
          margin-bottom: 0;
        }

        .status-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .status-value {
          color: var(--persona-accent, #cccc66);
          font-weight: bold;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .menu-tabs {
            position: static;
            margin: 16px;
            order: -1;
          }
          
          .tabs-container {
            flex-direction: row;
            overflow-x: auto;
          }
          
          .menu-tab {
            min-width: 200px;
            flex-shrink: 0;
          }
          
          .system-status {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}