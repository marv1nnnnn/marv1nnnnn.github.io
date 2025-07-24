'use client'

import { useAudio } from '@/contexts/AudioContext'

export function SoundToggle() {
  const { isMuted, toggleMute, masterVolume, isLoadingMusicPlaying } = useAudio()

  const handleToggle = () => {
    toggleMute()
    
    // Debug information
    console.log('[Sound Toggle] Mute state changed:', {
      isMuted: !isMuted,
      masterVolume: masterVolume,
      isLoadingMusicPlaying: isLoadingMusicPlaying,
      htmlAudioElements: Array.from(document.querySelectorAll('audio')).map(audio => ({
        src: audio.src,
        volume: audio.volume,
        muted: audio.muted,
        paused: audio.paused
      }))
    })
  }

  return (
    <button 
      onClick={handleToggle}
      className="sound-toggle"
      title={`Sound: ${isMuted ? 'MUTED' : 'ON'} (${Math.round(masterVolume * 100)}%)`}
    >
      {isMuted ? '🔇' : '🔊'} {isMuted ? 'MUTED' : 'ON'}
      
      <style jsx>{`
        .sound-toggle {
          position: fixed;
          bottom: 20px;
          left: 200px;
          background: rgba(0, 0, 0, 0.8);
          color: ${isMuted ? '#ff6b6b' : '#4ecdc4'};
          border: 1px solid ${isMuted ? '#ff6b6b' : '#4ecdc4'};
          padding: 8px 12px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          cursor: pointer;
          z-index: 1001;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .sound-toggle:hover {
          background: ${isMuted ? 'rgba(255, 107, 107, 0.2)' : 'rgba(78, 205, 196, 0.2)'};
        }
      `}</style>
    </button>
  )
} 