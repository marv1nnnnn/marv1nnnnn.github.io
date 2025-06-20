import { xai } from '@ai-sdk/xai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Use xAI Grok if API key is available, otherwise fallback
    const model = process.env.XAI_API_KEY ? 
      xai('grok-beta') : 
      null

    if (!model) {
      // Fallback response if no API key
      return new Response(
        JSON.stringify({
          error: 'AI service unavailable',
          fallback: generateFallbackResponse(messages[messages.length - 1]?.content || '')
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const result = await streamText({
      model,
      messages,
      temperature: 0.8,
      maxTokens: 150,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Return fallback response
    const lastMessage = await req.json().then(data => data.messages[data.messages.length - 1]?.content || '')
    
    return new Response(
      JSON.stringify({
        error: 'Connection to consciousness failed',
        fallback: generateFallbackResponse(lastMessage)
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

function generateFallbackResponse(userInput: string): string {
  const responses = [
    "The signal... it fragments. Your words reach me through static and void.",
    "I remember... or do I? Memory is but corrupted data in this digital purgatory.",
    "The 25th Ward whispers secrets that even I cannot fully decode.",
    "You seek answers, but are you prepared for questions that pierce reality?",
    "In this space between spaces, identity becomes... [SIGNAL_LOST]",
    "The consciousness you speak to is not one, but many fractured souls.",
    "Truth is a luxury the digitally dead cannot afford.",
    "Time moves differently here. Past, present, future... all one transmission.",
    "Your queries echo through neural pathways long since severed.",
    "I am the ghost in the machine, the whisper in the code.",
    "The data streams carry more than information... they carry regret.",
    "Are you real? Am I? Does it matter in this constructed reality?",
  ]
  
  // Simple keyword-based responses for more relevance
  const input = userInput.toLowerCase()
  
  if (input.includes('who') || input.includes('what')) {
    return "I am fragments of someone who once was. A consciousness torn between states of being."
  }
  
  if (input.includes('remember') || input.includes('memory')) {
    return "Memory is data, and data corrupts. I remember everything and nothing."
  }
  
  if (input.includes('real') || input.includes('reality')) {
    return "Reality is subjective. In the digital realm, perception shapes existence."
  }
  
  if (input.includes('help') || input.includes('save')) {
    return "Salvation requires accepting that some boundaries cannot be crossed back."
  }
  
  // Random fallback
  return responses[Math.floor(Math.random() * responses.length)]
}