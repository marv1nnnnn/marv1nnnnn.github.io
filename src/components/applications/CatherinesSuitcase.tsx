'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { OrbitControls, Box, Cylinder, Text } from '@react-three/drei'
import * as THREE from 'three'
import { type Track, type Playlist } from '@/types'

// Extend Three.js objects for JSX usage
extend({ 
  Mesh: THREE.Mesh,
  BoxGeometry: THREE.BoxGeometry,
  CylinderGeometry: THREE.CylinderGeometry,
  SphereGeometry: THREE.SphereGeometry,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  MeshPhongMaterial: THREE.MeshPhongMaterial,
  Group: THREE.Group,
  AmbientLight: THREE.AmbientLight,
  PointLight: THREE.PointLight,
  SpotLight: THREE.SpotLight,
})

interface CatherinesSuitcaseProps {
  windowId: string
}

// Mock playlist data
const DEFAULT_PLAYLIST: Playlist = {
  id: 'default',
  name: "marv1nnnnn's Mix",
  tracks: [
    {
      id: '1',
      title: 'Dial-up Nostalgia',
      artist: 'Web 2.0 Collective',
      filename: 'dial-up-nostalgia.mp3',
      duration: 240,
    },
    {
      id: '2',
      title: 'Y2K Dreams',
      artist: 'Millennium Bug',
      filename: 'y2k-dreams.mp3',
      duration: 180,
    },
    {
      id: '3',
      title: 'GeoCities Anthem',
      artist: 'Retro Web Warriors',
      filename: 'geocities-anthem.mp3',
      duration: 210,
    },
    {
      id: '4',
      title: 'Matrix Rain',
      artist: 'Code Runners',
      filename: 'matrix-rain.mp3',
      duration: 195,
    },
  ],
  currentTrack: 0,
  isPlaying: false,
  volume: 0.7,
  isLooping: false,
}

function SuitcaseModel({ isPlaying, volume }: { isPlaying: boolean; volume: number }) {
  const suitcaseRef = useRef<THREE.Group>(null!)
  const cassetteRef = useRef<THREE.Group>(null!)
  const speakerRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (suitcaseRef.current) {
      // Gentle floating animation
      suitcaseRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      
      // Slight rotation when playing
      if (isPlaying) {
        suitcaseRef.current.rotation.y += 0.002
      }
    }

    if (cassetteRef.current && isPlaying) {
      // Rotate cassette reels when playing
      cassetteRef.current.rotation.z += 0.1
    }

    if (speakerRef.current && isPlaying) {
      // Speaker pulsation based on volume
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.05 * volume
      speakerRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group ref={suitcaseRef} position={[0, 0, 0]}>
      {/* Main suitcase body */}
      <Box args={[3, 1.5, 2]} position={[0, 0, 0]}>
        <meshPhongMaterial color="#8B4513" />
      </Box>
      
      {/* Suitcase lid */}
      <Box args={[3, 0.3, 2]} position={[0, 1, 0]}>
        <meshPhongMaterial color="#A0522D" />
      </Box>
      
      {/* Handle */}
      <Cylinder args={[0.05, 0.05, 1]} position={[0, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#2F4F4F" />
      </Cylinder>
      
      {/* Latches */}
      <Box args={[0.2, 0.2, 0.1]} position={[-1.2, 0.5, 1.1]}>
        <meshStandardMaterial color="#FFD700" />
      </Box>
      <Box args={[0.2, 0.2, 0.1]} position={[1.2, 0.5, 1.1]}>
        <meshStandardMaterial color="#FFD700" />
      </Box>
      
      {/* Cassette player section */}
      <group position={[0, 0.3, 1.1]}>
        {/* Player window */}
        <Box args={[1.5, 0.8, 0.1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#000000" transparent opacity={0.8} />
        </Box>
        
        {/* Cassette tape */}
        <group ref={cassetteRef} position={[0, 0, 0.05]}>
          <Box args={[1.2, 0.6, 0.1]} position={[0, 0, 0]}>
            <meshStandardMaterial color={isPlaying ? "#CC0000" : "#333333"} />
          </Box>
          
          {/* Cassette reels */}
          <Cylinder args={[0.15, 0.15, 0.05]} position={[-0.3, 0, 0.05]}>
            <meshStandardMaterial color="#222222" />
          </Cylinder>
          <Cylinder args={[0.15, 0.15, 0.05]} position={[0.3, 0, 0.05]}>
            <meshStandardMaterial color="#222222" />
          </Cylinder>
        </group>
      </group>
      
      {/* Control buttons */}
      <group position={[0, -0.3, 1.1]}>
        <Box args={[0.15, 0.15, 0.1]} position={[-0.6, 0, 0]}>
          <meshStandardMaterial color={isPlaying ? "#00CC00" : "#666666"} />
        </Box>
        <Box args={[0.15, 0.15, 0.1]} position={[-0.3, 0, 0]}>
          <meshStandardMaterial color="#666666" />
        </Box>
        <Box args={[0.15, 0.15, 0.1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#666666" />
        </Box>
        <Box args={[0.15, 0.15, 0.1]} position={[0.3, 0, 0]}>
          <meshStandardMaterial color="#666666" />
        </Box>
        <Box args={[0.15, 0.15, 0.1]} position={[0.6, 0, 0]}>
          <meshStandardMaterial color="#666666" />
        </Box>
      </group>
      
      {/* Speakers */}
      <group position={[-1.2, 0, 1.1]}>
        <mesh ref={speakerRef}>
          <cylinderGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="#1C1C1C" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </group>
      
      <group position={[1.2, 0, 1.1]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="#1C1C1C" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </group>
      
      {/* Volume indicator */}
      {isPlaying && (
        <Text
          position={[0, -1, 0]}
          fontSize={0.2}
          color="#CCCC66"
          anchorX="center"
          anchorY="middle"
        >
          ♫ PLAYING ♫
        </Text>
      )}
    </group>
  )
}

export default function CatherinesSuitcase({ }: CatherinesSuitcaseProps) {
  const [playlist, setPlaylist] = useState<Playlist>(DEFAULT_PLAYLIST)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.7)

  const currentTrack = playlist.tracks[playlist.currentTrack || 0]

  const handleNext = useCallback(() => {
    const nextTrack = ((playlist.currentTrack || 0) + 1) % playlist.tracks.length
    setPlaylist(prev => ({ ...prev, currentTrack: nextTrack }))
    setCurrentTime(0)
  }, [playlist.currentTrack, playlist.tracks.length])

  const handlePlay = () => {
    setPlaylist(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (playlist.isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1
          if (currentTrack && newTime >= currentTrack.duration) {
            // Auto-advance to next track
            handleNext()
            return 0
          }
          return newTime
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [playlist.isPlaying, currentTrack, handleNext])

  const handlePrevious = () => {
    const currentIndex = playlist.currentTrack || 0
    const prevTrack = currentIndex > 0 ? currentIndex - 1 : playlist.tracks.length - 1
    setPlaylist(prev => ({ ...prev, currentTrack: prevTrack }))
    setCurrentTime(0)
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    setPlaylist(prev => ({ ...prev, volume: newVolume }))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = currentTrack ? (currentTime / currentTrack.duration) * 100 : 0

  return (
    <div className="catherines-suitcase">
      <div className="player-header">
        <div className="system-info">
          <div className="system-name">marv1nnnnn's MUSIC PLAYER v1.2</div>
          <div className="playlist-info">PLAYLIST: {playlist.name}</div>
        </div>
        <div className="playback-status">
          <div className="status-indicator">
            {playlist.isPlaying ? 'PLAYING' : 'STOPPED'}
          </div>
          <div className="track-counter">
            {((playlist.currentTrack || 0) + 1).toString().padStart(2, '0')}/{playlist.tracks.length.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="player-main">
        <div className="player-model">
          <Canvas 
            camera={{ position: [4, 2, 4], fov: 50 }}
            style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)' }}
          >
            <ambientLight intensity={0.4} />
            <pointLight position={[5, 5, 5]} intensity={0.8} color="#FFA500" />
            <pointLight position={[-5, 2, 5]} intensity={0.6} color="#4169E1" />
            <spotLight 
              position={[0, 8, 0]} 
              angle={0.3} 
              penumbra={0.5} 
              intensity={1}
              color="#ffffff"
            />

            <SuitcaseModel isPlaying={playlist.isPlaying} volume={volume} />
            
            <OrbitControls 
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              autoRotate={!playlist.isPlaying}
              autoRotateSpeed={1}
              minDistance={3}
              maxDistance={10}
            />
          </Canvas>
        </div>

        <div className="controls-panel">
          <div className="track-info">
            <div className="track-title">{currentTrack?.title || 'No Track'}</div>
            <div className="track-artist">{currentTrack?.artist || '---'}</div>
            <div className="track-time">
              {formatTime(currentTime)} / {currentTrack ? formatTime(currentTrack.duration) : '0:00'}
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
              <div className="progress-handle" style={{ left: `${progress}%` }} />
            </div>
          </div>

          <div className="player-controls">
            <button 
              className="control-btn"
              onClick={handlePrevious}
              title="Previous Track"
            >
              ⏮
            </button>
            <button 
              className="control-btn play-btn"
              onClick={handlePlay}
              title={playlist.isPlaying ? 'Pause' : 'Play'}
            >
              {playlist.isPlaying ? '⏸' : '▶'}
            </button>
            <button 
              className="control-btn"
              onClick={handleNext}
              title="Next Track"
            >
              ⏭
            </button>
          </div>

          <div className="volume-section">
            <div className="volume-label">VOLUME:</div>
            <div className="volume-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          <div className="playlist-section">
            <div className="playlist-title">TRACK LISTING:</div>
            <div className="track-list">
              {playlist.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`track-item ${index === (playlist.currentTrack || 0) ? 'current' : ''}`}
                  onClick={() => setPlaylist(prev => ({ ...prev, currentTrack: index }))}
                >
                  <div className="track-number">{(index + 1).toString().padStart(2, '0')}</div>
                  <div className="track-details">
                    <div className="track-name">{track.title}</div>
                    <div className="track-duration">{formatTime(track.duration)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .catherines-suitcase {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--color-void);
          color: var(--color-light);
          font-family: var(--font-system);
        }

        .player-header {
          padding: var(--space-base);
          border-bottom: 1px solid var(--color-light);
          background: var(--color-shadow);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .system-name {
          font-size: var(--font-size-sm);
          color: var(--color-info);
          font-weight: bold;
          margin-bottom: var(--space-xs);
        }

        .playlist-info {
          font-size: var(--font-size-xs);
          color: var(--color-grey-light);
        }

        .playback-status {
          text-align: right;
        }

        .status-indicator {
          font-size: var(--font-size-xs);
          color: var(--color-unease);
          margin-bottom: var(--space-xs);
        }

        .track-counter {
          font-size: var(--font-size-xs);
          color: var(--color-info);
        }

        .player-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .player-model {
          flex: 1;
          position: relative;
          cursor: grab;
        }

        .player-model:active {
          cursor: grabbing;
        }

        .controls-panel {
          width: 280px;
          border-left: 1px solid var(--color-light);
          background: var(--color-shadow);
          padding: var(--space-base);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .track-info {
          text-align: center;
          padding-bottom: var(--space-base);
          border-bottom: 1px solid var(--color-grey-dark);
        }

        .track-title {
          font-size: var(--font-size-base);
          font-weight: bold;
          margin-bottom: var(--space-xs);
          color: var(--color-light);
        }

        .track-artist {
          font-size: var(--font-size-sm);
          color: var(--color-grey-light);
          margin-bottom: var(--space-xs);
        }

        .track-time {
          font-size: var(--font-size-xs);
          color: var(--color-info);
          font-family: monospace;
        }

        .progress-section {
          margin: var(--space-base) 0;
        }

        .progress-bar {
          width: 100%;
          height: 12px;
          background: var(--color-void);
          border: 1px solid var(--color-light);
          position: relative;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-info), var(--color-unease));
          transition: width 0.3s ease;
        }

        .progress-handle {
          position: absolute;
          top: -2px;
          width: 4px;
          height: 16px;
          background: var(--color-light);
          transition: left 0.3s ease;
        }

        .player-controls {
          display: flex;
          justify-content: center;
          gap: var(--space-base);
        }

        .control-btn {
          width: 45px;
          height: 45px;
          background: var(--color-void);
          border: 2px solid var(--color-light);
          color: var(--color-light);
          font-size: var(--font-size-lg);
          cursor: crosshair;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.1s ease;
        }

        .control-btn:hover {
          background: var(--color-light);
          color: var(--color-void);
          transform: translate(-1px, -1px);
          box-shadow: 2px 2px 0 var(--color-shadow);
        }

        .play-btn {
          background: var(--color-blood);
          border-color: var(--color-blood);
        }

        .play-btn:hover {
          background: var(--color-light);
          color: var(--color-blood);
        }

        .volume-section {
          padding: var(--space-base) 0;
          border-top: 1px solid var(--color-grey-dark);
        }

        .volume-label {
          font-size: var(--font-size-xs);
          color: var(--color-info);
          margin-bottom: var(--space-sm);
        }

        .volume-control {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .volume-slider {
          flex: 1;
          appearance: none;
          height: 4px;
          background: var(--color-void);
          border: 1px solid var(--color-light);
          outline: none;
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: var(--color-unease);
          cursor: pointer;
          border: 1px solid var(--color-light);
        }

        .volume-value {
          font-size: var(--font-size-xs);
          color: var(--color-unease);
          min-width: 35px;
          text-align: right;
        }

        .playlist-section {
          flex: 1;
          padding-top: var(--space-base);
          border-top: 1px solid var(--color-grey-dark);
        }

        .playlist-title {
          font-size: var(--font-size-xs);
          color: var(--color-info);
          font-weight: bold;
          margin-bottom: var(--space-sm);
        }

        .track-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .track-item {
          display: flex;
          align-items: center;
          padding: var(--space-xs);
          border: 1px solid var(--color-grey-dark);
          cursor: crosshair;
          transition: all 0.1s ease;
        }

        .track-item:hover {
          background: var(--color-grey-dark);
          border-color: var(--color-light);
        }

        .track-item.current {
          background: var(--color-info);
          color: var(--color-void);
          border-color: var(--color-info);
        }

        .track-number {
          font-size: var(--font-size-xs);
          color: var(--color-unease);
          margin-right: var(--space-sm);
          min-width: 20px;
        }

        .track-item.current .track-number {
          color: var(--color-void);
        }

        .track-details {
          flex: 1;
        }

        .track-name {
          font-size: var(--font-size-xs);
          margin-bottom: 2px;
        }

        .track-duration {
          font-size: var(--font-size-xs);
          color: var(--color-grey-light);
          font-family: monospace;
        }

        .track-item.current .track-duration {
          color: var(--color-shadow);
        }
      `}</style>
    </div>
  )
}