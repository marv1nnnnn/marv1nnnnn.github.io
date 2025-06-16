import React, { useState } from 'react'
import { motion } from 'framer-motion'

export interface ModuleCardData {
  id: string
  title: string
  description: string
  icon: string
  category: 'ui' | 'media' | 'system' | 'ai' | 'core'
  color: string
  isActive?: boolean
  onClick?: () => void
}

interface ModuleCardProps {
  module: ModuleCardData
  index: number
  onLaunch?: (moduleId: string) => void
}

// Icon mapping for different module types
const MODULE_ICONS: Record<string, string> = {
  'broken-calculator': '🔢',
  'terminal': '💻',
  'chaos-monitor': '📊',
  'notepad': '📝',
  'ai-terminal': '🤖',
  'music-player': '🎵',
  'blog-reader': '📖',
  'hit-counter': '👁️',
  'visitor-greeter': '👋',
  'digital-lava-lamp': '🌋',
  'cursor-trail': '✨',
  'weather-widget': '🌤️',
  'browser': '🌐',
  'snake-game': '🐍',
  'tetris-game': '🎮',
  'fake-bsod': '💀',
  'chaos-control': '⚡'
}

// Module descriptions
const MODULE_DESCRIPTIONS: Record<string, string> = {
  'broken-calculator': 'A calculator that works in mysterious ways',
  'terminal': 'Classic command line interface',
  'chaos-monitor': 'Real-time system monitoring dashboard',
  'notepad': 'Simple text editor for quick notes',
  'ai-terminal': 'AI-powered interactive terminal',
  'music-player': 'Audio playback and playlist management',
  'blog-reader': 'Browse and read blog posts',
  'hit-counter': 'Track website visitor statistics',
  'visitor-greeter': 'Welcome and greet website visitors',
  'digital-lava-lamp': 'Mesmerizing digital lava lamp effects',
  'cursor-trail': 'Beautiful cursor trailing effects',
  'weather-widget': 'Live weather information display',
  'browser': 'Web browsing interface',
  'snake-game': 'Classic snake arcade game',
  'tetris-game': 'Block-stacking puzzle game',
  'fake-bsod': 'Blue screen of death simulator',
  'chaos-control': 'Central chaos system controller'
}

// Category color themes
const CATEGORY_THEMES = {
  ui: {
    primary: '#0099ff',
    secondary: '#00ccff',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    glow: 'shadow-blue-500/50',
    hover: 'hover:shadow-blue-400/60'
  },
  media: {
    primary: '#9966ff', 
    secondary: '#bb88ff',
    gradient: 'from-purple-500/20 to-pink-500/20',
    glow: 'shadow-purple-500/50',
    hover: 'hover:shadow-purple-400/60'
  },
  system: {
    primary: '#00cc66',
    secondary: '#00ff88',
    gradient: 'from-green-500/20 to-emerald-500/20',
    glow: 'shadow-green-500/50',
    hover: 'hover:shadow-green-400/60'
  },
  ai: {
    primary: '#ff6600',
    secondary: '#ff8844',
    gradient: 'from-orange-500/20 to-red-500/20',
    glow: 'shadow-orange-500/50',
    hover: 'hover:shadow-orange-400/60'
  },
  core: {
    primary: '#ff3366',
    secondary: '#ff5588',
    gradient: 'from-red-500/20 to-pink-500/20',
    glow: 'shadow-red-500/50',
    hover: 'hover:shadow-red-400/60'
  }
}

export default function ModuleCard({ module, index, onLaunch }: ModuleCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const theme = CATEGORY_THEMES[module.category]
  const icon = MODULE_ICONS[module.id] || '📱'
  const description = MODULE_DESCRIPTIONS[module.id] || 'Application module'

  const handleClick = () => {
    if (onLaunch) {
      onLaunch(module.id)
    }
    if (module.onClick) {
      module.onClick()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={`
        relative group cursor-pointer
        bg-gradient-to-br ${theme.gradient}
        backdrop-blur-md
        border border-white/10
        rounded-xl p-6
        shadow-lg ${theme.glow} ${theme.hover}
        transition-all duration-300 ease-out
        ${module.isActive ? 'ring-2 ring-white/50' : ''}
        hover:border-white/20
        overflow-hidden
      `}
    >
      {/* Background glow effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at center, ${theme.primary}20 0%, transparent 70%)`
        }}
      />
      
      {/* Card content */}
      <div className="relative z-10">
        {/* Module icon */}
        <div className="flex items-center justify-center w-16 h-16 mb-4 mx-auto">
          <motion.div
            animate={{ 
              rotate: isHovered ? [0, -5, 5, 0] : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: 0.5 }}
            className="text-4xl"
            style={{ filter: `drop-shadow(0 0 8px ${theme.primary}40)` }}
          >
            {icon}
          </motion.div>
        </div>

        {/* Module title */}
        <h3 className="text-lg font-bold text-white text-center mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r"
            style={{ 
              backgroundImage: isHovered ? `linear-gradient(45deg, ${theme.primary}, ${theme.secondary})` : undefined
            }}>
          {module.title || module.id.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </h3>

        {/* Module description */}
        <p className="text-sm text-gray-300 text-center leading-relaxed">
          {description}
        </p>

        {/* Active indicator */}
        {module.isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-3 h-3 rounded-full"
            style={{ backgroundColor: theme.primary }}
          >
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-full h-full rounded-full"
              style={{ backgroundColor: theme.primary, filter: `blur(2px)` }}
            />
          </motion.div>
        )}

        {/* Hover effect overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 rounded-xl border-2 border-white/30 pointer-events-none"
          style={{ 
            boxShadow: isHovered ? `0 0 20px ${theme.primary}60` : 'none'
          }}
        />
      </div>

      {/* Launch button on hover */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 10
        }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-4 left-4 right-4"
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
          <span className="text-xs font-medium text-white">Click to Launch</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Helper function to create module data from brain mapping
export function createModuleData(
  moduleId: string, 
  category: ModuleCardData['category'],
  overrides?: Partial<ModuleCardData>
): ModuleCardData {
  return {
    id: moduleId,
    title: moduleId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    description: MODULE_DESCRIPTIONS[moduleId] || 'Application module',
    icon: MODULE_ICONS[moduleId] || '📱',
    category,
    color: CATEGORY_THEMES[category].primary,
    ...overrides
  }
}