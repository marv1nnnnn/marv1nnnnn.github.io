'use client';

import { useState, useEffect, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

interface DecodedTextProps {
  text: string;
  className?: string;
  animateOnHover?: boolean;
  revealSpeed?: number;
}

export default function DecodedText({ 
  text, 
  className = '', 
  animateOnHover = false,
  revealSpeed = 50 
}: DecodedTextProps) {
  const [display, setDisplay] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const animate = () => {
    let iterations = 0;
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split('')
          .map((char, index) => {
            if (index < iterations) {
              return text[index];
            }
            if (char === ' ') return ' ';
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );
      
      if (iterations >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      
      iterations += 1 / 2; // Slower iteration for smoother effect
    }, revealSpeed);
  };

  useEffect(() => {
    if (!animateOnHover) {
      animate();
    }
  }, [text, animateOnHover]);

  useEffect(() => {
    if (animateOnHover && isHovering) {
      animate();
    } else if (animateOnHover && !isHovering) {
      // Reset to original text immediately when not hovering
      setDisplay(text);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isHovering, animateOnHover, text]);

  const handleMouseEnter = () => {
    if (animateOnHover) setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (animateOnHover) setIsHovering(false);
  };

  return (
    <span 
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {display}
    </span>
  );
}

