'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isClicking, setIsClicking] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
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
    <motion.div 
      className="project-specific-cursor"
      animate={{ 
        x: mousePos.x - 40, 
        y: mousePos.y - 40,
        scale: isClicking ? 0.8 : 1,
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 400, mass: 0.1 }}
    >
      <div className="cursor-dot" />
      <div className="absolute inset-0 border-2 border-white mix-blend-difference" />
    </motion.div>
  );
}
