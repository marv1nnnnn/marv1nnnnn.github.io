'use client'

import React, { useState } from 'react'

interface DesktopIconProps {
  icon: string
  label: string
  onDoubleClick: () => void
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, label, onDoubleClick }) => {
  const [isSelected, setIsSelected] = useState(false)
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleClick = () => {
    if (clickTimeout) {
      // Double click detected
      clearTimeout(clickTimeout)
      setClickTimeout(null)
      onDoubleClick()
    } else {
      // Single click - select icon
      setIsSelected(true)
      const timeout = setTimeout(() => {
        setIsSelected(false)
        setClickTimeout(null)
      }, 300)
      setClickTimeout(timeout)
    }
  }

  return (
    <div
      className={`desktop-icon ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <div className="icon-image">
        {icon}
      </div>
      <div className="icon-label">
        {label}
      </div>

      <style jsx>{`
        .desktop-icon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 80px;
          height: 90px;
          padding: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
          position: relative;
        }

        .desktop-icon:hover {
          transform: scale(1.05);
        }

        .desktop-icon.selected {
          background: rgba(0, 0, 139, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 2px;
        }

        .icon-image {
          font-size: 36px;
          margin-bottom: 2px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          box-shadow: 
            inset 1px 1px 0 rgba(255, 255, 255, 0.8),
            inset -1px -1px 0 rgba(0, 0, 0, 0.2),
            2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .desktop-icon:active .icon-image {
          box-shadow: 
            inset -1px -1px 0 rgba(255, 255, 255, 0.8),
            inset 1px 1px 0 rgba(0, 0, 0, 0.2),
            1px 1px 2px rgba(0, 0, 0, 0.3);
          transform: translate(1px, 1px);
        }

        .icon-label {
          font-size: 10px;
          color: black;
          text-align: center;
          font-family: 'Geneva', 'Helvetica', Arial, sans-serif;
          font-weight: normal;
          line-height: 1.1;
          max-width: 80px;
          word-wrap: break-word;
          background: rgba(255, 255, 255, 0.95);
          padding: 1px 3px;
          border-radius: 2px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          margin-top: 2px;
        }

        .desktop-icon.selected .icon-label {
          background: rgba(0, 0, 139, 0.9);
          color: white;
          border-color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  )
}

export default DesktopIcon