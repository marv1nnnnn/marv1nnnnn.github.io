'use client'

import { motion } from 'framer-motion'

interface BlogCardProps {
  title: string
  date: string
  excerpt: string
  tags: string[]
  index: number
}

export default function BlogCard({ title, date, excerpt, tags, index }: BlogCardProps) {
  return (
    <motion.div
      className="blog-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="card-header">
        <div className="card-number">[{(index + 1).toString().padStart(3, '0')}]</div>
        <div className="card-date">{date}</div>
      </div>

      <h3 className="card-title">{title}</h3>

      <p className="card-excerpt">{excerpt}</p>

      <div className="card-tags">
        {tags.map((tag, i) => (
          <span key={i} className="tag">#{tag}</span>
        ))}
      </div>

      <button className="card-button">
        <span>[READ MORE]</span>
        <span className="arrow">→</span>
      </button>

      <style jsx>{`
        .blog-card {
          background: rgba(0, 255, 255, 0.05);
          border: 3px solid #00FFFF;
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .blog-card:hover {
          background: rgba(0, 255, 255, 0.1);
          box-shadow:
            0 0 20px rgba(0, 255, 255, 0.4),
            inset 0 0 20px rgba(0, 255, 255, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 1px;
        }

        .card-number {
          color: #00FFFF;
          font-weight: bold;
        }

        .card-title {
          font-size: 20px;
          font-family: 'Courier New', monospace;
          color: #00FFFF;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
          line-height: 1.3;
        }

        .card-excerpt {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin: 0;
        }

        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #00FFFF;
          padding: 4px 8px;
          border: 1px solid rgba(0, 255, 255, 0.3);
          background: rgba(0, 255, 255, 0.05);
        }

        .card-button {
          align-self: flex-start;
          background: transparent;
          border: 2px solid #00FFFF;
          color: #00FFFF;
          padding: 10px 20px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 1px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s ease;
        }

        .card-button:hover {
          background: #00FFFF;
          color: #000000;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
        }

        .arrow {
          transition: transform 0.2s ease;
        }

        .card-button:hover .arrow {
          transform: translateX(5px);
        }

        @media (max-width: 768px) {
          .blog-card {
            padding: 20px;
            border-width: 2px;
          }

          .card-title {
            font-size: 16px;
          }

          .card-excerpt {
            font-size: 13px;
          }
        }
      `}</style>
    </motion.div>
  )
}
