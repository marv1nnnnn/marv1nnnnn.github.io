import { useState, useEffect } from 'react';
import DraggableWindow from './DraggableWindow';

interface SpotifyPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
}

export default function SpotifyPlayer({ isOpen, onClose, playlistId }: SpotifyPlayerProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title="Spotify Player"
      onClose={onClose}
      initialPosition={{ 
        x: Math.floor(window.innerWidth * 0.1), 
        y: Math.floor(window.innerHeight * 0.2) 
      }}
      className={`w-[90%] max-w-md transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[300px]'}`}
      initialSize={{ width: 800, height: 600 }}
    >
      <div className={`h-full transition-all duration-300 ${isMinimized ? 'hidden' : 'block'}`}>
        <iframe
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height="100%"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="border-0"
        />
      </div>
    </DraggableWindow>
  );
} 