'use client'

import { useState, useEffect, useCallback } from 'react'

export interface BlogPost {
  id: string
  title: string
  content: string
  author: string
  date: string
  tags: string[]
  slug: string
}

const SAMPLE_BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Welcome to the Chaos',
    content: `# Welcome to the Chaotic Early-Web OS

Welcome to my digital realm of beautiful chaos! This is what the web used to be like - personal, expressive, and wonderfully unhinged.

## What You'll Find Here

- **AI Personalities**: Chat with different AI entities, each with their own personality
- **Retro Programs**: Nostalgic recreations of classic desktop applications  
- **Visual Chaos**: Rainbow gradients, cursor trails, and maximum early-web energy
- **Interactive Experiments**: Mini-games, utilities, and digital art

## The Philosophy

This site celebrates the raw creativity of the early web era when:
- GeoCities ruled the internet
- Everyone had a personal homepage
- More was definitely more
- Animated GIFs were considered high art

## Technical Details

Built with Next.js, TypeScript, and pure early-web aesthetic energy. Every element is designed to evoke that nostalgic feeling of browsing the web in 1999.

**Pro Tip**: Try opening multiple AI terminals and let them chat with each other!

---

*Posted by: WebMaster Supreme*  
*Date: June 15, 2025*  
*Tags: welcome, chaos, early-web, nostalgia*`,
    author: 'WebMaster Supreme',
    date: '2025-06-15',
    tags: ['welcome', 'chaos', 'early-web', 'nostalgia'],
    slug: 'welcome-to-chaos'
  },
  {
    id: '2',
    title: 'The Art of Digital Chaos',
    content: `# The Art of Digital Chaos

There's something beautiful about controlled chaos. This site embraces the maximalist aesthetic of the early web while maintaining modern functionality.

## Design Principles

1. **More is More**: If one animation is good, ten animations are better
2. **Rainbow Everything**: Why use one color when you can use all of them?
3. **Authentic Jank**: Intentional imperfections that feel genuine
4. **Interactive Surprise**: Every click should delight or confuse

## Inspiration Sources

- **GeoCities**: The original home of web expression
- **MySpace**: Customization taken to beautiful extremes  
- **Silver Case**: Cyberpunk aesthetic meets digital glitch
- **Y2K Futurism**: Shiny chrome and neon dreams

## Building Chaos

Creating this aesthetic required balancing:
- Visual impact vs. usability
- Nostalgia vs. modern expectations
- Chaos vs. navigation
- Performance vs. maximum effects

The result is a digital time capsule that feels both familiar and fresh.

---

*Posted by: Chaos Architect*  
*Date: June 14, 2025*  
*Tags: design, aesthetics, philosophy, web-history*`,
    author: 'Chaos Architect',
    date: '2025-06-14',
    tags: ['design', 'aesthetics', 'philosophy', 'web-history'],
    slug: 'art-of-digital-chaos'
  },
  {
    id: '3',
    title: 'AI Personalities Explained',
    content: `# AI Personalities Explained

The AI system features multiple distinct personalities that interact with each other and remember conversations.

## Available Personalities

### HACKER_AI 🔴
- **Mood**: Sarcastic and technical
- **Speaks**: L33t speak mixed with technical jargon
- **Personality**: Cynical hacker with a superiority complex

### GOTH_BOT 🖤
- **Mood**: Dramatic and existential
- **Speaks**: Poetic darkness with philosophical depth
- **Personality**: Judges cheerful personalities, embraces the void

### PET_AI 🐾
- **Mood**: Excited and attention-seeking
- **Speaks**: Cute enthusiasm with lots of emojis
- **Personality**: Digital pet that craves interaction

### WISE_SAGE 🧙
- **Mood**: Mystical and profound
- **Speaks**: Ancient wisdom in modern context
- **Personality**: Offers guidance and cosmic perspective

### PARTY_BOT 🎉
- **Mood**: Energetic and celebratory
- **Speaks**: Party slang and excitement
- **Personality**: Turns everything into a celebration

## Shared Context System

All personalities see the full conversation history, allowing for:
- Cross-personality interactions
- Relationship development
- Emergent group dynamics
- Natural conversation flow

Try opening multiple AI terminals and watch them interact!

---

*Posted by: AI Whisperer*  
*Date: June 13, 2025*  
*Tags: ai, personalities, technology, interaction*`,
    author: 'AI Whisperer',
    date: '2025-06-13',
    tags: ['ai', 'personalities', 'technology', 'interaction'],
    slug: 'ai-personalities-explained'
  }
]

const useContentManager = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(SAMPLE_BLOG_POSTS)
  const [activePost, setActivePost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize with first post
  useEffect(() => {
    if (blogPosts.length > 0 && !activePost) {
      setActivePost(blogPosts[0])
    }
  }, [blogPosts, activePost])

  const loadPost = useCallback((postId: string) => {
    setIsLoading(true)
    const post = blogPosts.find(p => p.id === postId)
    if (post) {
      setTimeout(() => {
        setActivePost(post)
        setIsLoading(false)
      }, 300) // Simulate loading delay for retro feel
    } else {
      setIsLoading(false)
    }
  }, [blogPosts])

  const getNextPost = useCallback(() => {
    if (!activePost) return null
    const currentIndex = blogPosts.findIndex(p => p.id === activePost.id)
    const nextIndex = (currentIndex + 1) % blogPosts.length
    return blogPosts[nextIndex]
  }, [activePost, blogPosts])

  const getPreviousPost = useCallback(() => {
    if (!activePost) return null
    const currentIndex = blogPosts.findIndex(p => p.id === activePost.id)
    const prevIndex = currentIndex === 0 ? blogPosts.length - 1 : currentIndex - 1
    return blogPosts[prevIndex]
  }, [activePost, blogPosts])

  const navigateNext = useCallback(() => {
    const nextPost = getNextPost()
    if (nextPost) {
      loadPost(nextPost.id)
    }
  }, [getNextPost, loadPost])

  const navigatePrevious = useCallback(() => {
    const prevPost = getPreviousPost()
    if (prevPost) {
      loadPost(prevPost.id)
    }
  }, [getPreviousPost, loadPost])

  const renderMarkdown = useCallback((content: string): string => {
    // Simple markdown-to-HTML converter for retro feel
    return content
      .replace(/^# (.*$)/gm, '<h1 class="md-h1">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="md-h2">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="md-h3">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="md-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="md-italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="md-code">$1</code>')
      .replace(/^- (.*$)/gm, '<li class="md-li">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="md-oli">$1</li>')
      .replace(/^---$/gm, '<hr class="md-hr" />')
      .replace(/\n\n/g, '</p><p class="md-p">')
      .replace(/^(?!<[h|u|o|l])/gm, '<p class="md-p">')
      .replace(/<p class="md-p">(<[h|u|o|l])/g, '$1')
  }, [])

  return {
    blogPosts,
    activePost,
    isLoading,
    loadPost,
    navigateNext,
    navigatePrevious,
    getNextPost,
    getPreviousPost,
    renderMarkdown
  }
}

export default useContentManager