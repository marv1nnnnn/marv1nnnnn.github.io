'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useAudioManager } from '@/hooks/useAudioManager'

interface MusicPlayerProps {
  windowId?: string
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ windowId }) => {
  const {
    currentTrack,
    isPlaying,
    volume,
    position,
    duration,
    playlist,
    visualizerData,
    play,
    pause,
    stop,
    setVolume,
    seek,
    playNext,
    playPrevious,
    loadTrack,
    soundEffects
  } = useAudioManager()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [displayMode, setDisplayMode] = useState<'spectrum' | 'oscilloscope'>('spectrum')

  // Visualizer canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !visualizerData.length) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    if (displayMode === 'spectrum') {
      // Spectrum analyzer bars
      const barWidth = width / visualizerData.length
      visualizerData.forEach((value, index) => {
        const barHeight = value * height * 0.8
        const hue = (index / visualizerData.length) * 360
        
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
        ctx.fillRect(
          index * barWidth,
          height - barHeight,
          barWidth - 1,
          barHeight
        )
      })
    } else {
      // Oscilloscope waveform
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      visualizerData.forEach((value, index) => {
        const x = (index / visualizerData.length) * width
        const y = height / 2 + (value - 0.5) * height * 0.8
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.stroke()
    }
  }, [visualizerData, displayMode])

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle play/pause
  const handlePlayPause = () => {
    soundEffects.click()
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    soundEffects.hover()
  }

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseFloat(e.target.value)
    seek(newPosition)
  }

  // Handle track selection
  const handleTrackSelect = (track: any) => {
    soundEffects.click()
    loadTrack(track)
    setTimeout(() => play(), 100)
  }

  return (
    <div className="music-player">
      {/* Main Display */}
      <div className="player-display">
        <div className="track-info">
          <div className="track-title">
            {currentTrack ? (
              <span className="rainbow-text">{currentTrack.title}</span>
            ) : (
              <span className="blink">No Track Loaded</span>
            )}
          </div>
          <div className="track-artist">
            {currentTrack?.artist || 'Unknown Artist'}
          </div>
        </div>
        
        <div className="time-display">
          <span className="current-time">{formatTime(position)}</span>
          <span className="separator">/</span>
          <span className="total-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Visualizer */}
      <div className="visualizer-container">
        <canvas
          ref={canvasRef}
          width={280}
          height={60}
          className="visualizer-canvas"
        />
        <div className="visualizer-controls">
          <button
            className={`viz-mode-btn ${displayMode === 'spectrum' ? 'active' : ''}`}
            onClick={() => {
              setDisplayMode('spectrum')
              soundEffects.hover()
            }}
          >
            SPEC
          </button>
          <button
            className={`viz-mode-btn ${displayMode === 'oscilloscope' ? 'active' : ''}`}
            onClick={() => {
              setDisplayMode('oscilloscope')
              soundEffects.hover()
            }}
          >
            OSC
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={position}
          onChange={handleSeek}
          className="progress-bar"
        />
      </div>

      {/* Control Buttons */}
      <div className="player-controls">
        <button
          className="control-btn"
          onClick={() => {
            soundEffects.click()
            playPrevious()
          }}
          disabled={!currentTrack}
          title="Previous"
        >
          ⏮
        </button>
        
        <button
          className="control-btn play-btn"
          onClick={handlePlayPause}
          disabled={!currentTrack}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <button
          className="control-btn"
          onClick={() => {
            soundEffects.click()
            stop()
          }}
          disabled={!currentTrack}
          title="Stop"
        >
          ⏹
        </button>
        
        <button
          className="control-btn"
          onClick={() => {
            soundEffects.click()
            playNext()
          }}
          disabled={!currentTrack}
          title="Next"
        >
          ⏭
        </button>
      </div>

      {/* Volume Control */}
      <div className="volume-container">
        <span className="volume-label">Vol:</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
        <span className="volume-value">{Math.round(volume * 100)}%</span>
      </div>

      {/* Playlist */}
      <div className="playlist-container">
        <div className="playlist-header">
          <span className="blink">♪ PLAYLIST ♪</span>
        </div>
        <div className="playlist">
          {playlist.map((track, index) => (
            <div
              key={track.id}
              className={`playlist-item ${currentTrack?.id === track.id ? 'active' : ''}`}
              onClick={() => handleTrackSelect(track)}
              onMouseEnter={() => soundEffects.hover()}
            >
              <span className="track-number">{(index + 1).toString().padStart(2, '0')}</span>
              <span className="track-title">{track.title}</span>
              <span className="track-artist">{track.artist}</span>
            </div>
          ))}
          {playlist.length === 0 && (
            <div className="playlist-empty">
              <span className="glitch">No tracks loaded</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .music-player {
          background: linear-gradient(135deg, #1a1a1a, #333);
          border: 2px outset #666;
          padding: 8px;
          font-family: 'Courier New', monospace;
          color: #00ff00;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .player-display {
          background: #000;
          border: 1px inset #333;
          padding: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 40px;
        }

        .track-info {
          flex: 1;
        }

        .track-title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 2px;
        }

        .track-artist {
          font-size: 10px;
          color: #888;
        }

        .time-display {
          font-size: 11px;
          color: #00ff00;
          font-family: 'Courier New', monospace;
        }

        .separator {
          margin: 0 4px;
          color: #666;
        }

        .visualizer-container {
          background: #000;
          border: 1px inset #333;
          padding: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .visualizer-canvas {
          background: #000;
          border: 1px solid #333;
        }

        .visualizer-controls {
          display: flex;
          gap: 4px;
          margin-top: 4px;
        }

        .viz-mode-btn {
          background: linear-gradient(135deg, #666, #333);
          border: 1px outset #666;
          color: #ccc;
          padding: 2px 6px;
          font-size: 8px;
          cursor: pointer;
          font-family: inherit;
        }

        .viz-mode-btn.active {
          background: linear-gradient(135deg, #00ff00, #008800);
          color: #000;
          border: 1px inset #666;
        }

        .viz-mode-btn:hover {
          filter: brightness(1.2);
        }

        .progress-container {
          padding: 0 4px;
        }

        .progress-bar {
          width: 100%;
          height: 20px;
          background: #333;
          border: 1px inset #666;
          appearance: none;
          cursor: pointer;
        }

        .progress-bar::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 18px;
          background: linear-gradient(135deg, #00ff00, #008800);
          border: 1px outset #00ff00;
          cursor: pointer;
        }

        .player-controls {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 4px;
        }

        .control-btn {
          background: linear-gradient(135deg, #666, #333);
          border: 2px outset #666;
          color: #00ff00;
          width: 40px;
          height: 30px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #777, #444);
        }

        .control-btn:active:not(:disabled) {
          border: 2px inset #666;
        }

        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          color: #555;
        }

        .play-btn {
          background: linear-gradient(135deg, #00aa00, #006600);
          border-color: #00ff00;
        }

        .play-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #00cc00, #008800);
        }

        .volume-container {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 4px;
        }

        .volume-label {
          font-size: 10px;
          color: #888;
          min-width: 25px;
        }

        .volume-slider {
          flex: 1;
          height: 16px;
          background: #333;
          border: 1px inset #666;
          appearance: none;
          cursor: pointer;
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 10px;
          height: 14px;
          background: linear-gradient(135deg, #00ff00, #008800);
          border: 1px outset #00ff00;
          cursor: pointer;
        }

        .volume-value {
          font-size: 10px;
          color: #00ff00;
          min-width: 30px;
          text-align: right;
        }

        .playlist-container {
          flex: 1;
          background: #000;
          border: 1px inset #333;
          overflow: hidden;
        }

        .playlist-header {
          background: linear-gradient(90deg, #000080, #0000aa);
          color: white;
          text-align: center;
          padding: 4px;
          font-size: 10px;
          border-bottom: 1px solid #333;
        }

        .playlist {
          height: calc(100% - 24px);
          overflow-y: auto;
        }

        .playlist-item {
          display: flex;
          padding: 2px 4px;
          cursor: pointer;
          font-size: 10px;
          border-bottom: 1px solid #111;
          transition: background-color 0.1s;
        }

        .playlist-item:hover {
          background: #222;
        }

        .playlist-item.active {
          background: #003300;
          color: #00ff00;
        }

        .track-number {
          min-width: 20px;
          color: #666;
        }

        .playlist-item .track-title {
          flex: 1;
          margin: 0 8px;
        }

        .playlist-item .track-artist {
          color: #888;
          font-size: 9px;
        }

        .playlist-empty {
          text-align: center;
          padding: 20px;
          color: #666;
          font-style: italic;
        }

        /* Additional glitch effects */
        @keyframes windowShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }

        .glitch-active {
          animation: windowShake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default MusicPlayer