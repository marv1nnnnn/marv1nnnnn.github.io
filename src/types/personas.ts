export interface AIPersona {
  id: string
  name: string
  displayName: string
  description: string
  avatar: {
    model: 'ghost' | 'figure' | 'abstract' | 'geometric'
    primaryColor: string
    secondaryColor: string
    accentColor: string
    materialType: 'ethereal' | 'metallic' | 'organic' | 'digital'
  }
  theme: {
    backgroundColor: string
    textColor: string
    accentColor: string
    fontFamily?: string
    fontWeight?: string
  }
  personality: {
    systemPrompt: string
    speakingStyle: string
    responseLength: 'short' | 'medium' | 'long'
    emotionalTone: string
  }
  effects: {
    glitchChance: number
    typewriterSpeed: number
    audioTone: string
  }
}

export interface ChatMessage {
  id: string
  personaId: string
  content: string
  timestamp: Date
  isGlitched?: boolean
  isTyping?: boolean
}

export interface PersonaTheme {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  border: string
}