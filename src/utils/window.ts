interface IconConfig {
  base: string
  corrupted?: string
  glitched?: string
  classified?: string
}

interface WindowIconOptions {
  isGlitched?: boolean
  isCorrupted?: boolean
  classificationLevel?: 'PUBLIC' | 'RESTRICTED' | 'CLASSIFIED' | 'REDACTED'
  personaId?: string
}

export function getWindowIcon(component: string, options: WindowIconOptions = {}): string {
  const { isGlitched = false, isCorrupted = false, classificationLevel, personaId } = options
  
  const iconConfigs: Record<string, IconConfig> = {
    CaseFileReader: {
      base: '▣',
      corrupted: '▤',
      glitched: '◈',
      classified: '■'
    },
    CatherinesSuitcase: {
      base: '◐',
      corrupted: '◑',
      glitched: '◒',
      classified: '●'
    },
    ControlPanel: {
      base: '▦',
      corrupted: '▧',
      glitched: '▨',
      classified: '█'
    }
  }
  
  const config = iconConfigs[component]
  if (!config) {
    return isGlitched ? '◊' : isCorrupted ? '◇' : '□'
  }
  
  // Classification level override
  if (classificationLevel === 'CLASSIFIED' || classificationLevel === 'REDACTED') {
    return config.classified || config.base
  }
  
  // Corruption/glitch states
  if (isGlitched && config.glitched) {
    return config.glitched
  }
  
  if (isCorrupted && config.corrupted) {
    return config.corrupted
  }
  
  return config.base
}

export function getPersonaIcon(personaId: string): string {
  const personaIcons: Record<string, string> = {
    acid_angel: '◇',
    ghost: '◈',
    floating_head: '○'
  }
  
  return personaIcons[personaId] || '□'
}

export function getWindowStatusIcon(isFocused: boolean, isMinimized: boolean, hasError: boolean): string {
  if (hasError) return '⚠'
  if (isMinimized) return '▫'
  if (isFocused) return '▪'
  return '□'
}

export function getClassificationIcon(level: string): string {
  const classificationIcons: Record<string, string> = {
    PUBLIC: '○',
    RESTRICTED: '◐',
    CLASSIFIED: '●',
    REDACTED: '█'
  }
  
  return classificationIcons[level] || '□'
}