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
          width: 80px;
          padding: 8px;
          margin: 4px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
          user-select: none;
        }

        .desktop-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.05);
        }

        .desktop-icon.selected {
          background: rgba(0, 100, 200, 0.4);
          border: 1px dashed rgba(255, 255, 255, 0.6);
        }

        .icon-image {
          font-size: 32px;
          margin-bottom: 4px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
          animation: iconFloat 3s ease-in-out infinite;
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }

        .icon-label {
          font-size: 11px;
          color: white;
          text-align: center;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
          font-family: 'Comic Sans MS', cursive, sans-serif;
          line-height: 1.2;
          max-width: 100%;
          word-wrap: break-word;
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 4px;
          border-radius: 3px;
        }

        .desktop-icon:hover .icon-image {
          animation: iconBounce 0.6s ease-in-out infinite;
        }

        @keyframes iconBounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          25% { transform: translateY(-3px) scale(1.1); }
          50% { transform: translateY(-1px) scale(1.05); }
          75% { transform: translateY(-2px) scale(1.08); }
        }

        .desktop-icon:active .icon-image {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  )
}

export default DesktopIcon