'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import ProjectCard from '../cards/ProjectCard'

const codeProjects = [
  {
    title: 'marv1nnnnn.OS',
    description: 'Personal website with Y2K brutalist aesthetic - you\'re experiencing it right now',
    tech: ['Next.js', 'React', 'GSAP', 'Framer Motion'],
    github: 'https://github.com/marv1nnnnn',
    demo: '#',
    type: 'code' as const
  },
  {
    title: 'Neural Symphony',
    description: 'AI-powered music generation with emotional awareness and real-time composition',
    tech: ['Python', 'TensorFlow', 'Web Audio API'],
    github: 'https://github.com/marv1nnnnn',
    type: 'code' as const
  },
  {
    title: 'Quantum Diary',
    description: 'Encrypted personal journal with ML-powered insights and mood tracking',
    tech: ['TypeScript', 'Next.js', 'Supabase'],
    github: 'https://github.com/marv1nnnnn',
    demo: '#',
    type: 'code' as const
  }
]

const musicProjects = [
  {
    title: 'Digital Dawn',
    description: 'Ambient electronic exploration of early internet aesthetics',
    tech: ['Ableton', 'Modular Synth', 'Field Recording'],
    demo: '#',
    type: 'music' as const
  },
  {
    title: 'Code & Coffee',
    description: 'Lo-fi beats for late night coding sessions',
    tech: ['Logic Pro', 'Sample-based', 'Chill'],
    demo: '#',
    type: 'music' as const
  },
  {
    title: 'Void Signals',
    description: 'Experimental noise and algorithmic composition',
    tech: ['Pure Data', 'Max/MSP', 'Generative'],
    demo: '#',
    type: 'music' as const
  }
]

export default function CreationsSection() {
  const [filter, setFilter] = useState<'all' | 'code' | 'music'>('all')

  const filteredProjects = filter === 'all'
    ? [...codeProjects, ...musicProjects]
    : filter === 'code'
    ? codeProjects
    : musicProjects

  return (
    <section id="creations" className="creations">
      <motion.div
        className="section-container"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="section-header">
          <motion.h2
            className="section-title"
            initial={{ x: -20 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true }}
          >
            ━━━━━ CREATIONS ━━━━━━━━━━━━━━━
          </motion.h2>
          <p className="section-subtitle">
            Projects and music at the intersection of code and art
          </p>
        </div>

        <div className="filter-bar">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            [ALL]
          </button>
          <button
            className={`filter-button ${filter === 'code' ? 'active' : ''}`}
            onClick={() => setFilter('code')}
          >
            [CODE ▓]
          </button>
          <button
            className={`filter-button ${filter === 'music' ? 'active' : ''}`}
            onClick={() => setFilter('music')}
          >
            [MUSIC ♫]
          </button>
        </div>

        <div className="projects-grid">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={index}
              title={project.title}
              description={project.description}
              tech={project.tech}
              github={'github' in project ? project.github : undefined}
              demo={'demo' in project ? project.demo : undefined}
              type={project.type}
              index={index}
            />
          ))}
        </div>
      </motion.div>

      <style jsx>{`
        .creations {
          min-height: 100vh;
          background: #000000;
          padding: 100px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .section-container {
          width: 100%;
          max-width: 1400px;
        }

        .section-header {
          margin-bottom: 40px;
          text-align: left;
        }

        .section-title {
          font-size: 36px;
          font-family: 'Courier New', monospace;
          color: #FF6B00;
          margin: 0 0 15px 0;
          letter-spacing: 2px;
          text-shadow: 2px 2px 0 rgba(255, 107, 0, 0.3);
        }

        .section-subtitle {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          letter-spacing: 0.5px;
        }

        .filter-bar {
          display: flex;
          gap: 15px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .filter-button {
          background: transparent;
          border: 2px solid #FF6B00;
          color: #FF6B00;
          padding: 10px 20px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          font-weight: bold;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-button:hover {
          background: rgba(255, 107, 0, 0.1);
          box-shadow: 0 0 15px rgba(255, 107, 0, 0.4);
        }

        .filter-button.active {
          background: #FF6B00;
          color: #000000;
          box-shadow:
            0 0 20px rgba(255, 107, 0, 0.6),
            inset 0 0 10px rgba(255, 107, 0, 0.3);
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 30px;
        }

        @media (max-width: 768px) {
          .creations {
            padding: 60px 20px;
          }

          .section-header {
            margin-bottom: 30px;
          }

          .section-title {
            font-size: 24px;
          }

          .section-subtitle {
            font-size: 14px;
          }

          .filter-bar {
            gap: 10px;
            margin-bottom: 30px;
          }

          .filter-button {
            padding: 8px 16px;
            font-size: 11px;
          }

          .projects-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>
    </section>
  )
}
