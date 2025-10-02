export interface Project {
  id: string
  title: string
  type: 'code' | 'music'
  description: string
  tech?: string[] // For code projects
  genre?: string[] // For music projects
  links: {
    github?: string
    demo?: string
    external?: string
    spotify?: string
    bandcamp?: string
  }
  year: string
  featured?: boolean
  image?: string // Optional thumbnail path
}

// Code Projects
export const CODE_PROJECTS: Project[] = [
  {
    id: 'marv1nnnnn-os',
    title: 'marv1nnnnn OS',
    type: 'code',
    description: 'Interactive digital consciousness experience. 3D portfolio with AI personas, retro-futuristic aesthetics.',
    tech: ['React', 'Three.js', 'TypeScript', 'Next.js', 'WebGL'],
    links: {
      github: 'https://github.com/marv1nnnnn/marv1nnnnn.github.io',
      demo: 'https://marv1nnnnn.github.io'
    },
    year: '2025',
    featured: true
  },
  // Add more projects here
  {
    id: 'example-project',
    title: 'Example Project',
    type: 'code',
    description: 'Replace this with your actual projects',
    tech: ['Technology', 'Stack'],
    links: {
      github: 'https://github.com/marv1nnnnn/project'
    },
    year: '2024'
  }
]

// Music Projects
export const MUSIC_PROJECTS: Project[] = [
  // Add your music projects/releases here
  {
    id: 'example-release',
    title: 'Example Release',
    type: 'music',
    description: 'Replace with your music projects',
    genre: ['Experimental', 'Electronic'],
    links: {
      spotify: 'https://spotify.com/...',
      bandcamp: 'https://bandcamp.com/...'
    },
    year: '2024'
  }
]

// Combined exports
export const ALL_PROJECTS = [...CODE_PROJECTS, ...MUSIC_PROJECTS]

// Get projects by type
export const getProjectsByType = (type: 'code' | 'music'): Project[] => {
  return type === 'code' ? CODE_PROJECTS : MUSIC_PROJECTS
}

// Get featured projects
export const getFeaturedProjects = (): Project[] => {
  return ALL_PROJECTS.filter(p => p.featured)
}
