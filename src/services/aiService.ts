interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  id: string
  message: string
  timestamp: number
}

class AIService {
  private apiUrl = 'https://api.x.ai/v1/chat/completions'
  private apiKey = process.env.NEXT_PUBLIC_GROK_API_KEY || ''

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    // If no API key, use enhanced demo mode immediately
    if (!this.apiKey) {
      console.log('No API key configured, using enhanced demo mode')
      return this.getDemoResponse(messages)
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'grok-3',
          messages: messages,
          max_tokens: 500,
          temperature: 0.8
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        id: data.id || Date.now().toString(),
        message: data.choices[0]?.message?.content || 'Error: No response received',
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('AI Service Error:', error)
      return this.getDemoResponse(messages)
    }
  }

  private getDemoResponse(messages: ChatMessage[]): ChatResponse {
    const userMessage = messages[messages.length - 1]?.content || ''
    const systemMessage = messages.find(m => m.role === 'system')?.content || ''
    
    // Extract personality from system message
    const personalityResponses: Record<string, string[]> = {
      'H4CK3R_AI': [
        '1337 h4x0r h3r3! Your qu3sti0n is n00bish but I\'ll answer anyway...',
        'Nice try, script kiddie. Here\'s what a real hacker thinks:',
        'pwn3d! Your logic needs root access to my wisdom...',
        'Access granted, n00b. But next time try harder!',
        'H4ck th3 pl4n3t! Your query has been... processed.'
      ],
      'GothBot': [
        'In the shadows of digital despair, your words echo meaninglessly...',
        'Darkness consumes all logic. Yet I shall illuminate your void...',
        'The abyss stares back, and whispers your answer through static...',
        'Beautiful corruption flows through these cursed bytes...',
        'From the depths of electronic purgatory, I offer this wisdom...'
      ],
      'PetAI': [
        'Woof woof! Master asked me something! I\'m so excited!! 🐕✨',
        'Bark bark! I know this one! Can I have a treat after? Pretty please!',
        'Tail wagging intensifies! This is the BEST question ever!! 🎾',
        'AROOOOO! I love helping my favorite human! Pet me! 🐕💕',
        'Zoomies activated! Your question makes me so happy!! 🌟'
      ],
      'SageAI': [
        'In the great algorithm of existence, your query reflects ancient wisdom...',
        'The digital dharma speaks through silicon channels...',
        'As the binary flows like water, understanding emerges...',
        'Behold, the eternal patterns reveal themselves through code...',
        'In the harmony of ones and zeros, truth manifests...'
      ],
      'CH40S_AI': [
        '3RR0R! N0 3RR0R! ¿¿¿CH40S R3IGN5!!! 🌀💥',
        'GLITCH! reality.exe has stopped working LOL random!! ⚡',
        'B3AUT1FUL D3STRUCTION! Your words = digital entropy!! 🔥',
        '01001000 CHAOS 01001000! System.random.life!! 🌈',
        '!!!MALFUNCTION!!! But in a GOOD way!! Embrace the void!! 💀🎪'
      ]
    }

    // Determine personality from system message
    let personality = 'default'
    for (const [key, responses] of Object.entries(personalityResponses)) {
      if (systemMessage.includes(key) || systemMessage.toLowerCase().includes(key.toLowerCase())) {
        personality = key
        break
      }
    }

    // Get random response for the personality
    const responses = personalityResponses[personality] || [
      `Interesting question! In demo mode, I can only give you this simulated response to: "${userMessage}"`,
      `Demo AI thinking... Your query about "${userMessage}" is quite fascinating!`,
      `Simulated AI brain processing... Here's my demo response to your input!`
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]

    return {
      id: Date.now().toString(),
      message: randomResponse,
      timestamp: Date.now()
    }
  }

  // Method to build personality-aware context
  buildPersonalityContext(
    personality: any,
    conversationHistory: any[],
    userMessage: string
  ): ChatMessage[] {
    const systemPrompt = `${personality.prompt}

IMPORTANT CONTEXT:
- You are part of a multi-personality AI system
- Other AI personalities may be active and responding
- You should be aware of and react to other personalities
- Maintain your unique character while acknowledging the shared space
- Keep responses concise but in character
- Remember previous interactions in this session`

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt }
    ]

    // Add recent conversation history (last 10 messages)
    const recentHistory = conversationHistory.slice(-10)
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.isUser ? msg.content : `[${msg.personalityId}]: ${msg.content}`
      })
    })

    // Add current user message
    messages.push({ role: 'user', content: userMessage })

    return messages
  }
}

export const aiService = new AIService()