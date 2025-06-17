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

// Enhanced category color themes with modern gradients
const CATEGORY_THEMES = {
  ui: {
    primary: '#0099ff',
    secondary: '#00ccff',
    accent: '#66d9ff',
    gradient: 'from-blue-600/30 via-cyan-500/20 to-sky-400/30',
    border: 'border-blue-400/40',
    glow: 'shadow-xl shadow-blue-500/30',
    hoverGlow: 'hover:shadow-2xl hover:shadow-blue-400/50',
    textGradient: 'from-blue-300 to-cyan-200'
  },
  media: {
    primary: '#9966ff', 
    secondary: '#bb88ff',
    accent: '#dd99ff',
    gradient: 'from-purple-600/30 via-violet-500/20 to-fuchsia-400/30',
    border: 'border-purple-400/40',
    glow: 'shadow-xl shadow-purple-500/30',
    hoverGlow: 'hover:shadow-2xl hover:shadow-purple-400/50',
    textGradient: 'from-purple-300 to-fuchsia-200'
  },
  system: {
    primary: '#00cc66',
    secondary: '#00ff88',
    accent: '#44ff99',
    gradient: 'from-green-600/30 via-emerald-500/20 to-teal-400/30',
    border: 'border-green-400/40',
    glow: 'shadow-xl shadow-green-500/30',
    hoverGlow: 'hover:shadow-2xl hover:shadow-green-400/50',
    textGradient: 'from-green-300 to-emerald-200'
  },
  ai: {
    primary: '#ff6600',
    secondary: '#ff8844',
    accent: '#ffaa66',
    gradient: 'from-orange-600/30 via-amber-500/20 to-yellow-400/30',
    border: 'border-orange-400/40',
    glow: 'shadow-xl shadow-orange-500/30',
    hoverGlow: 'hover:shadow-2xl hover:shadow-orange-400/50',
    textGradient: 'from-orange-300 to-amber-200'
  },
  core: {
    primary: '#ff3366',
    secondary: '#ff5588',
    accent: '#ff77aa',
    gradient: 'from-red-600/30 via-pink-500/20 to-rose-400/30',
    border: 'border-red-400/40',
    glow: 'shadow-xl shadow-red-500/30',
    hoverGlow: 'hover:shadow-2xl hover:shadow-red-400/50',
    textGradient: 'from-red-300 to-pink-200'
  }
}

export default function ModuleCard({ module, index, onLaunch }: ModuleCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const theme = CATEGORY_THEMES[module.category]
  const icon = MODULE_ICONS[module.id] || '📱'
  const description = MODULE_DESCRIPTIONS[module.id] || 'Application module'

  const handleClick = () => {
    console.log('🎯 ModuleCard clicked:', module.id, module.title)
    setIsLaunching(true)
    
    // Reset launching state after animation
    setTimeout(() => setIsLaunching(false), 1000)
    
    if (onLaunch) {
      console.log('🚀 Calling onLaunch for:', module.id)
      onLaunch(module.id)
    } else {
      console.warn('⚠️ No onLaunch callback provided')
    }
    
    if (module.onClick) {
      module.onClick()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.08,
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
      whileHover={{ 
        scale: 1.03,
        y: -4,
        transition: { duration: 0.25, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      className={`
        relative group cursor-pointer
        bg-gradient-to-br ${theme.gradient}
        backdrop-blur-xl
        border ${theme.border}
        rounded-2xl p-6
        ${theme.glow} ${theme.hoverGlow}
        transition-all duration-300 ease-out
        ${module.isActive ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-black/20' : ''}
        hover:border-opacity-60
        overflow-hidden
        min-h-[160px]
      `}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            background: isLaunching
              ? `radial-gradient(circle at 50% 50%, ${theme.primary}25 0%, transparent 70%)`
              : isHovered 
              ? `radial-gradient(circle at 50% 50%, ${theme.primary}15 0%, transparent 60%)`
              : `radial-gradient(circle at 50% 50%, ${theme.primary}08 0%, transparent 50%)`
          }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        />
        <div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[size:20px_20px] opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${theme.accent}20 1px, transparent 1px)`
          }}
        />
      </div>

      {/* Card content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with icon and status */}
        <div className="flex items-start justify-between mb-3">
          <motion.div
            animate={{ 
              rotate: isLaunching ? [0, 360] : isHovered ? [0, -3, 3, 0] : 0,
              scale: isLaunching ? [1, 1.3, 1] : isHovered ? 1.15 : 1
            }}
            transition={{ 
              duration: isLaunching ? 0.8 : 0.6, 
              ease: isLaunching ? "easeInOut" : "easeInOut"
            }}
            className="text-3xl"
            style={{ 
              filter: `drop-shadow(0 0 ${isLaunching ? '20px' : '12px'} ${theme.primary}${isLaunching ? '80' : '50'})`,
              textShadow: `0 0 ${isLaunching ? '30px' : '20px'} ${theme.primary}${isLaunching ? '60' : '40'}`
            }}
          >
            {icon}
          </motion.div>

          {/* Active indicator */}
          {module.isActive && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/50"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-white"
              />
            </motion.div>
          )}
        </div>

        {/* Module title with gradient */}
        <motion.h3 
          className="text-lg font-bold text-white mb-3 leading-tight"
          animate={{
            backgroundImage: isHovered 
              ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary}, ${theme.accent})`
              : 'none'
          }}
          style={{
            backgroundClip: isHovered ? 'text' : 'unset',
            WebkitBackgroundClip: isHovered ? 'text' : 'unset',
            color: isHovered ? 'transparent' : 'white'
          }}
        >
          {module.title || module.id.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </motion.h3>

        {/* Module description */}
        <p className="text-sm text-gray-300 leading-relaxed flex-1 mb-4 min-h-[3rem]">
          {description}
        </p>

        {/* Launch indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: (isHovered || isLaunching || module.isActive) ? 1 : 0,
            scale: (isHovered || isLaunching || module.isActive) ? 1 : 0.8
          }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-center py-2 px-3 rounded-xl bg-gradient-to-r"
          style={{
            backgroundImage: module.isActive 
              ? `linear-gradient(90deg, ${theme.primary}40, ${theme.secondary}40)`
              : `linear-gradient(90deg, ${theme.primary}20, ${theme.secondary}20)`
          }}
        >
          <motion.span 
            className="text-xs font-semibold bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`
            }}
          >
            {isLaunching ? 'Launching...' : module.isActive ? 'Running' : 'Launch Module'}
          </motion.span>
          <motion.div
            animate={{ 
              x: isLaunching ? [0, 5, 0] : isHovered ? [0, 3, 0] : 0,
              rotate: isLaunching ? 360 : 0
            }}
            transition={{ 
              duration: isLaunching ? 0.5 : 1, 
              repeat: isLaunching ? Infinity : Infinity 
            }}
            className="ml-2 text-xs"
            style={{ color: theme.primary }}
          >
            {module.isActive ? '●' : '→'}
          </motion.div>
        </motion.div>
      </div>

      {/* Hover border effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 rounded-2xl border-2 pointer-events-none"
        style={{ 
          borderColor: theme.primary + '60',
          boxShadow: `inset 0 0 20px ${theme.primary}20`
        }}
      />
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