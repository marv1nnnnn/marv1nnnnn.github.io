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

interface BlogMetadata {
  id: string
  slug: string
  title: string
  author: string
  date: string
  tags: string[]
  filename: string
}

const useContentManager = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [activePost, setActivePost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load blog posts from files
  useEffect(() => {
    const loadBlogPosts = async () => {
      try {
        setIsLoading(true)
        
        // Load metadata
        const metadataResponse = await fetch('/blog/blog-metadata.json')
        const metadata: BlogMetadata[] = await metadataResponse.json()
        
        // Load content for each post
        const posts: (BlogPost | null)[] = await Promise.all(
          metadata.map(async (meta) => {
            try {
              const contentResponse = await fetch(`/blog/${meta.filename}`)
              const content = await contentResponse.text()
              
              return {
                id: meta.id,
                title: meta.title,
                content: content,
                author: meta.author,
                date: meta.date,
                tags: meta.tags,
                slug: meta.slug
              }
            } catch (error) {
              console.error(`Failed to load blog post ${meta.filename}:`, error)
              return null
            }
          })
        )
        
        // Filter out failed loads
        const validPosts = posts.filter((post): post is BlogPost => post !== null)
        setBlogPosts(validPosts)
        
        // Set first post as active if none selected
        if (validPosts.length > 0) {
          setActivePost(validPosts[0])
        }
      } catch (error) {
        console.error('Failed to load blog posts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBlogPosts()
  }, [])

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