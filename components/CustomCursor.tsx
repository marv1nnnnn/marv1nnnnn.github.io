'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Check if hovering over a clickable element
      const target = e.target as HTMLElement;
      const isClickable = 
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') ||
        target.closest('button');
        
      setIsHovering(!!isClickable);
    };
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <svg className="fixed pointer-events-none hidden">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="
              1 0 0 0 0  
              0 1 0 0 0  
              0 0 1 0 0  
              0 0 0 20 -10" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>
      
      <div 
        className="fixed inset-0 pointer-events-none z-[9999]" 
        style={{ filter: 'url(#gooey)' }}
      >
        <motion.div 
          className="absolute bg-white rounded-full mix-blend-difference"
          animate={{ 
            x: mousePos.x - (isHovering ? 30 : 15), 
            y: mousePos.y - (isHovering ? 30 : 15),
            width: isHovering ? 60 : 30,
            height: isHovering ? 60 : 30,
            scale: isClicking ? 0.8 : 1,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300, mass: 0.5 }}
        />
        <motion.div 
          className="absolute bg-white rounded-full mix-blend-difference"
          animate={{ 
            x: mousePos.x - 8, 
            y: mousePos.y - 8,
            width: 16,
            height: 16,
            scale: isHovering ? 0 : 1,
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.1 }}
        />
      </div>
    </>
  );
}
