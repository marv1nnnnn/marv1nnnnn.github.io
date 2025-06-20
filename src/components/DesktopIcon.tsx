'use client'

import { useState } from 'react'
import { DesktopIcon as DesktopIconType } from '@/types'
import { useAudio } from '@/contexts/AudioContext'

interface DesktopIconProps {
  icon: DesktopIconType
  onDoubleClick: () => void
}

export default function DesktopIcon({ icon, onDoubleClick }: DesktopIconProps) {
  const { playSound } = useAudio()
  const [isSelected, setIsSelected] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)

  const handleClick = () => {
    const now = Date.now()
    const timeDiff = now - lastClickTime

    if (timeDiff < 300) {
      // Double click detected
      setClickCount(0)
      onDoubleClick()
    } else {
      // Single click
      playSound('click')
      setClickCount(1)
      setIsSelected(true)
      setLastClickTime(now)

      // Reset selection after delay if no double click
      setTimeout(() => {
        if (clickCount === 1) {
          setIsSelected(false)
          setClickCount(0)
        }
      }, 300)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <div
      className={`desktop-icon ${isSelected ? 'selected' : ''}`}
      style={{
        left: icon.position.x,
        top: icon.position.y,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => playSound('hover')}
    >
      <div className="icon-image">
        {icon.icon}
      </div>
      <div className="icon-label">
        {icon.name}
      </div>

      <style jsx>{`
        .desktop-icon {
          position: absolute;
          width: 80px;
          height: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: crosshair;
          user-select: none;
          padding: var(--space-xs);
          border-radius: 2px;
          transition: all 0.1s ease;
        }

        .desktop-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.05);
        }

        .desktop-icon.selected {
          background: var(--color-info);
          color: var(--color-void);
        }

        .desktop-icon.selected:hover {
          background: var(--color-info);
        }

        .icon-image {
          font-size: 32px;
          margin-bottom: var(--space-xs);
          filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8));
          transition: filter 0.1s ease;
        }

        .desktop-icon:hover .icon-image {
          filter: drop-shadow(1px 1px 4px rgba(0, 0, 0, 1));
        }

        .icon-label {
          font-family: var(--font-system);
          font-size: var(--font-size-xs);
          text-align: center;
          line-height: 1.2;
          text-shadow: 
            1px 1px 0px var(--color-void),
            -1px -1px 0px var(--color-void),
            1px -1px 0px var(--color-void),
            -1px 1px 0px var(--color-void);
          word-wrap: break-word;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .desktop-icon.selected .icon-label {
          color: var(--color-void);
          text-shadow: none;
        }
      `}</style>
    </div>
  )
}