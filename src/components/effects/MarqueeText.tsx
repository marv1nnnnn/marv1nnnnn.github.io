'use client'

import { motion } from 'framer-motion'

export default function MarqueeText() {
  const text = "WELCOME TO MARV1NNNNN OS v1.0 • BEST VIEWED IN ANY BROWSER • UNDER CONSTRUCTION • ";
  const repeatedText = text.repeat(3);

  return (
    <div className="marquee-container">
      <motion.div
        className="marquee-content"
        animate={{ x: [0, -1000] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {repeatedText}
      </motion.div>

      <style jsx>{`
        .marquee-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          background: #000000;
          border-bottom: 2px solid #00FF00;
          padding: 8px 0;
          z-index: 10000;
          overflow: hidden;
        }

        .marquee-content {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #00FF00;
          letter-spacing: 2px;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .marquee-container {
            padding: 6px 0;
          }

          .marquee-content {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  )
}
