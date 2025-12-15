'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = '' }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Motion values for smooth interpolation
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Spring physics for smooth return to center
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), {
    stiffness: 150,
    damping: 20
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), {
    stiffness: 150,
    damping: 20
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate normalized mouse position from center (-0.5 to 0.5)
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={`relative will-change-transform ${className}`}
    >
      <div 
        className="transform-style-3d h-full w-full relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
        
        {/* Holographic/Glare Overlay */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-50 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
          style={{ 
            opacity: useTransform(x, [-0.5, 0, 0.5], [0, 0.3, 0]),
            mixBlendMode: 'overlay',
            transform: 'translateZ(1px)' // Ensure it sits on top
          }}
        />
      </div>
    </motion.div>
  );
}

