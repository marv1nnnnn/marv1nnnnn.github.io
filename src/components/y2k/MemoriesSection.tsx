'use client'

import { motion } from 'framer-motion'
import BlogCard from '../cards/BlogCard'

const blogPosts = [
  {
    title: 'The Intersection of Code and Consciousness',
    date: '2025.09.15',
    excerpt: 'Reflections on building AI systems that feel almost alive, and what that means for the future of human-computer interaction.',
    tags: ['AI', 'Philosophy', 'Dev']
  },
  {
    title: 'Physics, Acoustics, and Everything',
    date: '2025.08.22',
    excerpt: 'How my journey from acoustics to physics shaped my understanding of systems thinking and emergent behavior.',
    tags: ['Science', 'Thoughts']
  },
  {
    title: 'The Y2K Aesthetic Revival',
    date: '2025.07.10',
    excerpt: 'Why the raw, unpolished internet of the early 2000s was cooler than anything we have today, and how to bring it back.',
    tags: ['Design', 'Nostalgia', 'Web']
  },
  {
    title: 'Building at AfterShip',
    date: '2025.06.05',
    excerpt: 'Lessons learned from scaling global logistics infrastructure and dealing with millions of shipments.',
    tags: ['Dev', 'Career']
  },
  {
    title: 'Douban, Books, and Bolaño',
    date: '2025.05.12',
    excerpt: 'My obsession with Roberto Bolaño and how literature influences the way I write code.',
    tags: ['Books', 'Culture']
  },
  {
    title: 'Coil and the Sound of Data',
    date: '2025.04.18',
    excerpt: 'Experimental noise, algorithmic composition, and turning data into music.',
    tags: ['Music', 'Art']
  }
]

export default function MemoriesSection() {
  return (
    <section id="memories" className="memories">
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
            ━━━━━ MEMORIES ━━━━━━━━━━━━━━━━━
          </motion.h2>
          <p className="section-subtitle">
            Thoughts, reflections, and digital diary entries from the void
          </p>
        </div>

        <div className="blog-grid">
          {blogPosts.map((post, index) => (
            <BlogCard
              key={index}
              title={post.title}
              date={post.date}
              excerpt={post.excerpt}
              tags={post.tags}
              index={index}
            />
          ))}
        </div>

        <motion.div
          className="view-all-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button>[VIEW ALL MEMORIES]</button>
        </motion.div>
      </motion.div>

      <style jsx>{`
        .memories {
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
          margin-bottom: 60px;
          text-align: left;
        }

        .section-title {
          font-size: 36px;
          font-family: 'Courier New', monospace;
          color: #00FFFF;
          margin: 0 0 15px 0;
          letter-spacing: 2px;
          text-shadow: 2px 2px 0 rgba(0, 255, 255, 0.3);
        }

        .section-subtitle {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          letter-spacing: 0.5px;
        }

        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 30px;
          margin-bottom: 60px;
        }

        .view-all-button button {
          background: transparent;
          border: 3px solid #00FFFF;
          color: #00FFFF;
          padding: 15px 40px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 4px 4px 0 rgba(0, 255, 255, 0.2);
        }

        .view-all-button button:hover {
          background: #00FFFF;
          color: #000000;
          box-shadow:
            0 0 20px rgba(0, 255, 255, 0.6),
            4px 4px 0 rgba(0, 255, 255, 0.4);
        }

        @media (max-width: 768px) {
          .memories {
            padding: 60px 20px;
          }

          .section-header {
            margin-bottom: 40px;
          }

          .section-title {
            font-size: 24px;
          }

          .section-subtitle {
            font-size: 14px;
          }

          .blog-grid {
            grid-template-columns: 1fr;
            gap: 20px;
            margin-bottom: 40px;
          }

          .view-all-button button {
            padding: 12px 30px;
            font-size: 12px;
            border-width: 2px;
          }
        }
      `}</style>
    </section>
  )
}
