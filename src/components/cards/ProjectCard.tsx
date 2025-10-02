'use client'

import { motion } from 'framer-motion'

interface ProjectCardProps {
  title: string
  description: string
  tech: string[]
  github?: string
  demo?: string
  type: 'code' | 'music'
  index: number
}

export default function ProjectCard({ title, description, tech, github, demo, type, index }: ProjectCardProps) {
  const icon = type === 'code' ? '▓▓▓' : '♫♫♫'

  return (
    <motion.div
      className="project-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="card-icon">{icon}</div>

      <h3 className="card-title">{title}</h3>

      <p className="card-description">{description}</p>

      <div className="tech-stack">
        {tech.map((item, i) => (
          <span key={i} className="tech-tag">{item}</span>
        ))}
      </div>

      <div className="card-links">
        {github && (
          <a href={github} target="_blank" rel="noopener noreferrer" className="link">
            <span>⚡</span>
            <span>GITHUB</span>
          </a>
        )}
        {demo && (
          <a href={demo} target="_blank" rel="noopener noreferrer" className="link">
            <span>🚀</span>
            <span>DEMO</span>
          </a>
        )}
      </div>

      <style jsx>{`
        .project-card {
          background: rgba(255, 107, 0, 0.05);
          border: 3px solid #FF6B00;
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          transition: all 0.3s ease;
        }

        .project-card:hover {
          background: rgba(255, 107, 0, 0.1);
          box-shadow:
            0 0 20px rgba(255, 107, 0, 0.4),
            inset 0 0 20px rgba(255, 107, 0, 0.1);
        }

        .card-icon {
          font-family: 'Courier New', monospace;
          font-size: 20px;
          color: #FF6B00;
          letter-spacing: 2px;
        }

        .card-title {
          font-size: 22px;
          font-family: 'Courier New', monospace;
          color: #FF6B00;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
          line-height: 1.3;
        }

        .card-description {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin: 0;
        }

        .tech-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tech-tag {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          padding: 4px 10px;
          border: 1px solid rgba(255, 107, 0, 0.3);
          background: rgba(0, 0, 0, 0.3);
        }

        .card-links {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .link {
          background: transparent;
          border: 2px solid #00FFFF;
          color: #00FFFF;
          padding: 8px 14px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 1px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .link:hover {
          background: #00FFFF;
          color: #000000;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
        }

        @media (max-width: 768px) {
          .project-card {
            padding: 20px;
            border-width: 2px;
          }

          .card-title {
            font-size: 18px;
          }

          .card-description {
            font-size: 13px;
          }
        }
      `}</style>
    </motion.div>
  )
}
