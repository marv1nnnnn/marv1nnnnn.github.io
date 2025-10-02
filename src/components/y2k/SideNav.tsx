'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface NavItem {
  id: string
  label: string
  color: string
}

const navItems: NavItem[] = [
  { id: 'hero', label: '00', color: '#FF00FF' },
  { id: 'memories', label: '01', color: '#00FFFF' },
  { id: 'creations', label: '02', color: '#FF6B00' },
  { id: 'signals', label: '03', color: '#00FF00' }
]

export default function SideNav() {
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => document.getElementById(item.id))
      const scrollPosition = window.scrollY + window.innerHeight / 2

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="side-nav">
      <div className="nav-container">
        <div className="nav-arrow">↑</div>

        {navItems.map((item) => (
          <motion.button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => scrollToSection(item.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              borderColor: activeSection === item.id ? item.color : 'rgba(255, 255, 255, 0.3)',
              color: activeSection === item.id ? item.color : 'rgba(255, 255, 255, 0.6)'
            }}
          >
            {item.label}
          </motion.button>
        ))}

        <div className="nav-divider">─</div>

        <div className="nav-arrow">↓</div>
      </div>

      <style jsx>{`
        .side-nav {
          position: fixed;
          right: 30px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1000;
        }

        .nav-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .nav-item {
          width: 50px;
          height: 50px;
          border: 2px solid;
          background: rgba(0, 0, 0, 0.8);
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
        }

        .nav-item:hover {
          box-shadow: 0 0 15px currentColor;
        }

        .nav-item.active {
          box-shadow:
            0 0 20px currentColor,
            inset 0 0 10px currentColor;
        }

        .nav-arrow {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.4);
          font-family: 'Courier New', monospace;
        }

        .nav-divider {
          color: rgba(255, 255, 255, 0.3);
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .side-nav {
            right: 15px;
          }

          .nav-item {
            width: 40px;
            height: 40px;
            font-size: 14px;
            border-width: 1px;
          }

          .nav-arrow {
            font-size: 16px;
          }
        }
      `}</style>
    </nav>
  )
}
