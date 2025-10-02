'use client'

import HeroSection from './y2k/HeroSection'
import MemoriesSection from './y2k/MemoriesSection'
import CreationsSection from './y2k/CreationsSection'
import SignalsSection from './y2k/SignalsSection'
import SideNav from './y2k/SideNav'
import Y2KOverlay from './effects/Y2KOverlay'
import MarqueeText from './effects/MarqueeText'

export default function FilmWindow() {
  return (
    <div className="y2k-os">
      {/* Marquee Text at Top */}
      <MarqueeText />

      {/* Side Navigation */}
      <SideNav />

      {/* Y2K Overlay (Visitor Counter, Timestamp) */}
      <Y2KOverlay />

      {/* Main Content Sections */}
      <main>
        <HeroSection />
        <MemoriesSection />
        <CreationsSection />
        <SignalsSection />
      </main>

      <style jsx>{`
        .y2k-os {
          width: 100vw;
          min-height: 100vh;
          background: #000000;
          overflow-x: hidden;
        }

        main {
          padding-top: 30px; /* Space for marquee */
        }
      `}</style>
    </div>
  )
}
