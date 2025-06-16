'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Howl, Howler } from 'howler'
import * as Tone from 'tone'

export interface Track {
  id: string
  title: string
  artist: string
  url: string
  duration?: number
}

export interface AudioManagerState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  position: number
  duration: number
  playlist: Track[]
  visualizerData: number[]
  isLoaded: boolean
}

export const useAudioManager = () => {
  const [state, setState] = useState<AudioManagerState>({
    currentTrack: null,
    isPlaying: false,
    volume: 0.7,
    position: 0,
    duration: 0,
    playlist: [],
    visualizerData: [],
    isLoaded: false
  })

  const howlRef = useRef<Howl | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Empty playlist - will be loaded from file
  const [defaultPlaylist, setDefaultPlaylist] = useState<Track[]>([])

  // Load playlist from file
  const loadPlaylist = useCallback(async () => {
    try {
      const response = await fetch('/music/playlist.json')
      const playlistData = await response.json()
      
      // Convert to Track objects with proper URLs
      const tracks: Track[] = playlistData.map((item: any) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        url: `/music/${item.filename}`, // Assuming music files are in public/music/
        duration: item.duration
      }))
      
      setDefaultPlaylist(tracks)
      setState(prev => ({ ...prev, playlist: tracks }))
    } catch (error) {
      console.error('Failed to load playlist:', error)
      // Keep empty playlist on error
    }
  }, [])

  // Initialize Web Audio API for visualization
  const initializeAudioContext = useCallback(async () => {
    try {
      await Tone.start()
      
      // Create analyzer for visualization
      const analyser = Tone.getContext().createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      setState(prev => ({ ...prev, isLoaded: true }))
      
      // Load playlist after audio context is ready
      await loadPlaylist()
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }, [loadPlaylist])

  // Update visualizer data
  const updateVisualizerData = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    // Convert to normalized array for visualization
    const normalizedData = Array.from(dataArray).map(value => value / 255)
    
    setState(prev => ({ ...prev, visualizerData: normalizedData }))
    
    if (state.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateVisualizerData)
    }
  }, [state.isPlaying])

  // Load and play track
  const loadTrack = useCallback((track: Track) => {
    // Stop current track
    if (howlRef.current) {
      howlRef.current.stop()
      howlRef.current.unload()
    }

    const howl = new Howl({
      src: [track.url],
      html5: true,
      volume: state.volume,
      onload: () => {
        setState(prev => ({ 
          ...prev, 
          currentTrack: track,
          duration: howl.duration(),
          position: 0
        }))
      },
      onplay: () => {
        setState(prev => ({ ...prev, isPlaying: true }))
        updateVisualizerData()
        
        // Update position every second
        positionIntervalRef.current = setInterval(() => {
          if (howlRef.current) {
            setState(prev => ({ ...prev, position: howlRef.current?.seek() || 0 }))
          }
        }, 1000)
      },
      onpause: () => {
        setState(prev => ({ ...prev, isPlaying: false }))
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (positionIntervalRef.current) {
          clearInterval(positionIntervalRef.current)
        }
      },
      onstop: () => {
        setState(prev => ({ ...prev, isPlaying: false, position: 0 }))
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (positionIntervalRef.current) {
          clearInterval(positionIntervalRef.current)
        }
      },
      onend: () => {
        setState(prev => ({ ...prev, isPlaying: false, position: 0 }))
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (positionIntervalRef.current) {
          clearInterval(positionIntervalRef.current)
        }
        // Auto-play next track
        playNext()
      }
    })

    howlRef.current = howl
  }, [state.volume])

  // Play current track
  const play = useCallback(() => {
    if (!howlRef.current && state.playlist.length > 0) {
      loadTrack(state.playlist[0])
      return
    }
    
    if (howlRef.current) {
      howlRef.current.play()
    }
  }, [loadTrack, state.playlist])

  // Pause current track
  const pause = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.pause()
    }
  }, [])

  // Stop current track
  const stop = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.stop()
    }
  }, [])

  // Set volume
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    setState(prev => ({ ...prev, volume: clampedVolume }))
    
    if (howlRef.current) {
      howlRef.current.volume(clampedVolume)
    }
    
    Howler.volume(clampedVolume)
  }, [])

  // Seek to position
  const seek = useCallback((position: number) => {
    if (howlRef.current) {
      howlRef.current.seek(position)
      setState(prev => ({ ...prev, position }))
    }
  }, [])

  // Play next track
  const playNext = useCallback(() => {
    if (!state.currentTrack || state.playlist.length === 0) return
    
    const currentIndex = state.playlist.findIndex(t => t.id === state.currentTrack!.id)
    const nextIndex = (currentIndex + 1) % state.playlist.length
    loadTrack(state.playlist[nextIndex])
    
    setTimeout(() => play(), 100)
  }, [state.currentTrack, state.playlist, loadTrack, play])

  // Play previous track
  const playPrevious = useCallback(() => {
    if (!state.currentTrack || state.playlist.length === 0) return
    
    const currentIndex = state.playlist.findIndex(t => t.id === state.currentTrack!.id)
    const prevIndex = currentIndex === 0 ? state.playlist.length - 1 : currentIndex - 1
    loadTrack(state.playlist[prevIndex])
    
    setTimeout(() => play(), 100)
  }, [state.currentTrack, state.playlist, loadTrack, play])

  // Sound effects using Tone.js
  const soundEffects = {
    click: () => {
      const synth = new Tone.Synth().toDestination()
      synth.triggerAttackRelease('C5', '8n')
    },
    hover: () => {
      const synth = new Tone.Synth().toDestination()
      synth.triggerAttackRelease('E5', '16n')
    },
    error: () => {
      const synth = new Tone.Synth().toDestination()
      synth.triggerAttackRelease('F2', '4n')
    },
    success: () => {
      const synth = new Tone.PolySynth().toDestination()
      synth.triggerAttackRelease(['C4', 'E4', 'G4'], '4n')
    },
    notification: () => {
      const synth = new Tone.PolySynth().toDestination()
      synth.triggerAttackRelease(['C5', 'E5'], '8n')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.stop()
        howlRef.current.unload()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current)
      }
    }
  }, [])

  // Initialize AudioContext after first user gesture to satisfy browser policies
  useEffect(() => {
    if (state.isLoaded) return

    const resume = () => {
      initializeAudioContext()
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
    }

    window.addEventListener('pointerdown', resume, { once: true })
    window.addEventListener('keydown', resume, { once: true })

    return () => {
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
    }
  }, [initializeAudioContext, state.isLoaded])

  return {
    ...state,
    play,
    pause,
    stop,
    setVolume,
    seek,
    playNext,
    playPrevious,
    loadTrack,
    soundEffects,
    initializeAudioContext
  }
}