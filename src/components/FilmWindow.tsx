'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useAudio } from '@/contexts/AudioContext'
import { AIPersona, ChatMessage } from '@/types/personas'
import { DEFAULT_PERSONA } from '@/config/personas'
import { usePersistentMessages } from '@/hooks/usePersistentMessages'
import PersonaManager from './personas/PersonaManager'
import ChatInterface from './chat/ChatInterface'
import DigitalOceanBackground from './DigitalOceanBackground'
import { AtmosphericBreathingManager } from './AtmosphericBreathingManager'
import SceneLoader, { LoadingState, PerformancePreset } from './SceneLoader'
import { ConversationEmotionManager } from './BeaconConstellationManager'
import WindowManager from './WindowManager'
import Taskbar from './Taskbar'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { WindowState } from '@/types'

function CameraController({ 
  position = { x: 0, y: 100, z: 200 }, 
  rotation = { x: 0, y: 0, z: 0 } 
}: { 
  position?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
}) {
  const { camera } = useThree()
  
  useEffect(() => {
    // Update camera position
    camera.position.set(position.x, position.y, position.z)
    
    // Update camera rotation
    camera.rotation.set(rotation.x, rotation.y, rotation.z)
    
    // Point the camera toward the scene center with slight adjustment for atmosphere
    camera.lookAt(new THREE.Vector3(0, 0, 0))
    
    console.log('[DEBUG] Camera updated:', { position, rotation })
  }, [camera, position.x, position.y, position.z, rotation.x, rotation.y, rotation.z])
  
  return null
}

function ControllableLighting({
  ambientIntensity = 0.3,
  directionalIntensity = 0.5,
  color = '#ffffff',
  pointLightIntensity = 0.4,
  pointLightPosition = { x: 10, y: 10, z: 10 },
  fogDensity = 0.0,
  shadowEnabled = true
}: {
  ambientIntensity?: number
  directionalIntensity?: number
  color?: string
  pointLightIntensity?: number
  pointLightPosition?: { x: number; y: number; z: number }
  fogDensity?: number
  shadowEnabled?: boolean
}) {
  return (
    <>
      {/* Ambient light for general scene illumination */}
      <ambientLight intensity={ambientIntensity} />
      
      {/* Main directional light with shadow support */}
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={directionalIntensity} 
        color={color}
        castShadow={shadowEnabled}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Additional point light for atmospheric effects */}
      <pointLight
        position={[pointLightPosition.x, pointLightPosition.y, pointLightPosition.z]}
        intensity={pointLightIntensity}
        color={color}
        distance={100}
        decay={2}
      />
      
      {/* Fog for atmospheric depth (only if density > 0) */}
      {fogDensity > 0 && (
        <fog
          attach="fog"
          args={[color, 1, 1000]}
        />
      )}
    </>
  )
}

interface FilmWindowProps {
  isPreloading?: boolean
  onSceneReady?: () => void
  performancePreset?: PerformancePreset
  componentsPreloaded?: boolean
}

export default function FilmWindow({ 
  isPreloading = false, 
  onSceneReady,
  performancePreset = 'medium',
  componentsPreloaded = false
}: FilmWindowProps) {
  const { playSound } = useAudio()
  const currentPersona = DEFAULT_PERSONA // Always use default persona
  const { messages, addMessage, clearMessages, isLoaded: messagesLoaded } = usePersistentMessages()
  const [isTyping, setIsTyping] = useState(false)
  const [glitchLevel, setGlitchLevel] = useState(0)
  const [isChatMinimized, setIsChatMinimized] = useState(true)
  const [loadingState, setLoadingState] = useState<LoadingState>('initial')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [useOptimizedOcean, setUseOptimizedOcean] = useState(true)
  
  // 3D Scene control state
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 30, z: 120 })
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 })
  const [sceneLighting, setSceneLighting] = useState({ 
    intensity: 0.5, 
    color: '#ffffff',
    ambientIntensity: 0.3,
    directionalIntensity: 0.5,
    pointLightIntensity: 0.4,
    pointLightPosition: { x: 10, y: 10, z: 10 },
    fogDensity: 0.0,
    shadowEnabled: true
  })
  const [atmosphericIntensity, setAtmosphericIntensity] = useState(0.5)
  const [audioVolume, setAudioVolume] = useState(0.7)
  
  // Visual effect toggles state
  const [visualEffects, setVisualEffects] = useState({
    oceanWaves: true,
    aurora: true,
    particles: false,
    rain: false
  })
  
  // Aurora settings state
  const [auroraSettings, setAuroraSettings] = useState({
    density: 1.0,
    coverage: 1.0,
    layerCount: 12
  })
  
  // Persona 3D state
  const [personaPosition, setPersonaPosition] = useState({ x: 0, y: 30, z: -100 })
  const [personaScale, setPersonaScale] = useState(50)
  const [personaHoverEffects, setPersonaHoverEffects] = useState({
    enabled: true,
    glitchMultiplier: 1.0,
    particleIntensity: 1.0,
    geometricIntensity: 1.0,
    emissiveBoost: 0.5
  })
  
  const [windows, setWindows] = useState<WindowState[]>(() => {
    // Start with no windows open by default
    return []
  })
  const filmWindowRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Create unified atmospheric management instances
  const [breathingManager] = useState(() => new AtmosphericBreathingManager())
  const [emotionManager] = useState(() => new ConversationEmotionManager())

  // Handle scene loading state changes
  const handleLoadingStateChange = (state: LoadingState, progress: number) => {
    setLoadingState(state)
    setLoadingProgress(progress)
    
    // Notify parent when scene is ready
    if (state === 'complete' && onSceneReady) {
      onSceneReady()
    }
  }

  // Initialize with welcome message only if no messages exist and messages are loaded
  useEffect(() => {
    if (!messagesLoaded) return // Wait for messages to load from localStorage
    
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-1',
        personaId: currentPersona.id,
        content: `
          Hello     |     Bonjour    |    Hola
          こんにちは   |     你好      |    안녕하세요
          Здравствуйте |   مرحبا      |    नमस्ते
          Ciao      |    Olá       |    Hej
          Xin chào  |    สวัสดี     |    გამარჯობა
        `.trim().replace(/\n\s+/g, '\n'),
        timestamp: new Date(),
        isGlitched: true
      }
      
      addMessage(welcomeMessage)
      playSound('boot')
    }
    
    // Update control panel window props now that component state is available
    setWindows(prev => prev.map(window =>
      window.component === 'ControlPanel' ? {
        ...window,
        props: {
          currentPersona,
          glitchLevel,
          onGlitchLevelChange: setGlitchLevel,
          onCameraPositionChange: handleCameraPositionChange,
          onCameraRotationChange: handleCameraRotationChange,
          onSceneLightingChange: handleSceneLightingChange,
          onAtmosphericIntensityChange: handleAtmosphericIntensityChange,
          onAudioVolumeChange: handleAudioVolumeChange,
          onVisualEffectToggle: handleVisualEffectToggle,
          onPersonaPositionChange: handlePersonaPositionChange,
          onPersonaScaleChange: handlePersonaScaleChange,
          onPersonaHoverEffectsChange: handlePersonaHoverEffectsChange
        }
      } : window
    ))
  }, [messagesLoaded, messages.length, addMessage, playSound, glitchLevel, cameraPosition, cameraRotation, sceneLighting, atmosphericIntensity, audioVolume, visualEffects])

  // Film window entrance animation
  useEffect(() => {
    if (filmWindowRef.current) {
      gsap.fromTo(filmWindowRef.current,
        { 
          opacity: 0,
          scale: 0.9,
          y: 50 
        },
        { 
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.5,
          ease: "power2.out",
          onComplete: () => {
            // After animation, the container has its final size.
            // Dispatch a resize event to make sure R3F recalculates layout.
            window.dispatchEvent(new Event('resize'));
          }
        }
      )
    }
  }, [])

  // 3D Scene control handlers
  const handleCameraPositionChange = (position: { x: number; y: number; z: number }) => {
    setCameraPosition(position)
    console.log('[DEBUG] Camera position changed:', position)
  }

  const handleCameraRotationChange = (rotation: { x: number; y: number; z: number }) => {
    setCameraRotation(rotation)
    console.log('[DEBUG] Camera rotation changed:', rotation)
  }

  const handleSceneLightingChange = (lighting: any) => {
    setSceneLighting(lighting)
    console.log('[DEBUG] Scene lighting changed:', lighting)
  }

  const handleAtmosphericIntensityChange = (intensity: number) => {
    setAtmosphericIntensity(intensity)
    // Update breathing manager with new intensity while keeping current emotion
    const currentEmotionState = breathingManager.getCurrentEmotionState()
    const currentEmotionType = currentEmotionState.type
    const emotionTypeMap = { 0: 'contemplative', 1: 'excited', 2: 'melancholic', 3: 'mysterious', 4: 'urgent' }
    const emotionName = emotionTypeMap[currentEmotionType as keyof typeof emotionTypeMap] || 'contemplative'
    breathingManager.updateEmotionState(emotionName, intensity)
    console.log('[DEBUG] Atmospheric intensity changed:', intensity)
  }

  const handleAudioVolumeChange = (volume: number) => {
    setAudioVolume(volume)
    console.log('[DEBUG] Audio volume changed:', volume)
  }

  const handleVisualEffectToggle = (effectName: string, enabled: boolean | any) => {
    if (effectName === 'auroraSettings') {
      setAuroraSettings(enabled)
      console.log('[DEBUG] Aurora settings updated:', enabled)
    } else {
      setVisualEffects(prev => ({
        ...prev,
        [effectName]: enabled
      }))
      console.log(`[DEBUG] Visual effect ${effectName} toggled:`, enabled)
    }
  }

  // Persona 3D control handlers
  const handlePersonaPositionChange = (position: { x: number; y: number; z: number }) => {
    setPersonaPosition(position)
    console.log('[DEBUG] Persona position changed:', position)
  }

  const handlePersonaScaleChange = (scale: number) => {
    setPersonaScale(scale)
    console.log('[DEBUG] Persona scale changed:', scale)
  }

  const handlePersonaHoverEffectsChange = (effects: typeof personaHoverEffects) => {
    setPersonaHoverEffects(effects)
    console.log('[DEBUG] Persona hover effects changed:', effects)
  }

  const handleToggleChatMinimize = () => {
    console.log('[DEBUG] handleToggleChatMinimize called! Current state:', isChatMinimized)
    setIsChatMinimized(prev => !prev)
    playSound(isChatMinimized ? 'windowOpen' : 'windowClose')
    console.log('[DEBUG] Chat minimized state toggled:', !isChatMinimized)
  }

  const handleMessageAdd = (message: ChatMessage) => {
    addMessage(message)
    
    // Subtle ocean ripple effect when messages are added
    if (message.personaId !== 'user') {
      setGlitchLevel(0.2)
      setTimeout(() => setGlitchLevel(0), 800)
    }
  }

  // Handle emotion updates from chat interface
  const handleEmotionUpdate = (userMessage: string, aiMessage?: string) => {
    console.log('[DEBUG] FilmWindow received emotion update:', { userMessage, aiMessage })
    
    // Simple emotion detection based on keywords
    const analyzeEmotion = (message: string) => {
      const lowerMessage = message.toLowerCase()
      
      if (lowerMessage.includes('excited') || lowerMessage.includes('amazing') || lowerMessage.includes('wow')) {
        return { emotion: 'excited', intensity: 0.8 }
      } else if (lowerMessage.includes('sad') || lowerMessage.includes('lost') || lowerMessage.includes('alone')) {
        return { emotion: 'melancholic', intensity: 0.7 }
      } else if (lowerMessage.includes('help') || lowerMessage.includes('urgent') || lowerMessage.includes('quickly')) {
        return { emotion: 'urgent', intensity: 0.9 }
      } else if (lowerMessage.includes('mystery') || lowerMessage.includes('strange') || lowerMessage.includes('unknown')) {
        return { emotion: 'mysterious', intensity: 0.6 }
      } else {
        return { emotion: 'contemplative', intensity: 0.5 }
      }
    }
    
    const analysis = analyzeEmotion(userMessage)
    breathingManager.updateEmotionState(analysis.emotion, analysis.intensity)
  }

  // Debug logging to verify components are working
  useEffect(() => {
    console.log('[DEBUG] FilmWindow atmospheric systems initialized:', {
      breathingManager,
      hasAuroraSystem: true,
      hasParticleSystem: false
    })
    
    // Test emotion update
    setTimeout(() => {
      console.log('[DEBUG] Testing emotion update...')
      breathingManager.updateEmotionState('excited', 0.8)
    }, 2000)
  }, [])

  // Handle gamepad controller click to open control panel
  const handleGamepadClick = () => {
    console.log('[DEBUG] FilmWindow handleGamepadClick called!')
    const existingPanel = windows.find(w => w.component === 'ControlPanel')
    
    if (existingPanel) {
      // Close window if already open
      console.log('[DEBUG] Closing existing control panel')
      setWindows(prev => prev.filter(w => w.id !== existingPanel.id))
      playSound('windowClose')
    } else {
      // Open control panel window
      console.log('[DEBUG] Opening new control panel')
      const newWindow: WindowState = {
        id: 'control-panel-' + Date.now(),
        title: 'marv1nnnnn Personal Control Panel',
        isMinimized: false,
        isMaximized: false,
        isFocused: true,
        position: { x: 200, y: 100, width: 800, height: 600 },
        zIndex: 100,
        component: 'ControlPanel',
        props: {
          currentPersona,
          glitchLevel,
          onGlitchLevelChange: setGlitchLevel,
          onCameraPositionChange: handleCameraPositionChange,
          onCameraRotationChange: handleCameraRotationChange,
          onSceneLightingChange: handleSceneLightingChange,
          onAtmosphericIntensityChange: handleAtmosphericIntensityChange,
          onAudioVolumeChange: handleAudioVolumeChange,
          onVisualEffectToggle: handleVisualEffectToggle,
          onPersonaPositionChange: handlePersonaPositionChange,
          onPersonaScaleChange: handlePersonaScaleChange,
          onPersonaHoverEffectsChange: handlePersonaHoverEffectsChange
        }
      }
      setWindows(prev => [...prev, newWindow])
      playSound('windowOpen')
    }
  }

  // Handle case file display click to open case file reader
  const handleCaseFileClick = () => {
    console.log('[DEBUG] FilmWindow handleCaseFileClick called!')
    const existingReader = windows.find(w => w.component === 'CaseFileReader')
    
    if (existingReader) {
      // Close window if already open
      console.log('[DEBUG] Closing existing case file reader')
      setWindows(prev => prev.filter(w => w.id !== existingReader.id))
      playSound('windowClose')
    } else {
      // Open case file reader window
      console.log('[DEBUG] Opening new case file reader')
      const newWindow: WindowState = {
        id: 'case-file-reader-' + Date.now(),
        title: 'Case File Reader - CLASSIFIED ACCESS',
        isMinimized: false,
        isMaximized: false,
        isFocused: true,
        position: { x: 300, y: 50, width: 900, height: 700 },
        zIndex: 100,
        component: 'CaseFileReader',
        props: {}
      }
      setWindows(prev => [...prev, newWindow])
      playSound('windowOpen')
    }
  }

  // Handle suitcase display click to open Catherine's Suitcase
  const handleSuitcaseClick = () => {
    console.log('[DEBUG] FilmWindow handleSuitcaseClick called!')
    const existingSuitcase = windows.find(w => w.component === 'CatherinesSuitcase')
    
    if (existingSuitcase) {
      // Close window if already open
      console.log('[DEBUG] Closing existing suitcase')
      setWindows(prev => prev.filter(w => w.id !== existingSuitcase.id))
      playSound('windowClose')
    } else {
      // Open suitcase window
      console.log('[DEBUG] Opening new suitcase')
      const newWindow: WindowState = {
        id: 'catherines-suitcase-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        title: "Catherine's Suitcase - Retro Music Player",
        isMinimized: false,
        isMaximized: false,
        isFocused: true,
        position: { x: 150, y: 80, width: 1000, height: 750 },
        zIndex: 100,
        component: 'CatherinesSuitcase',
        props: {}
      }
      setWindows(prev => [...prev, newWindow])
      playSound('windowOpen')
    }
  }

  // Handle restoring minimized window
  const handleRestoreWindow = (windowId: string) => {
    setWindows(prev => prev.map(window => 
      window.id === windowId 
        ? { ...window, isMinimized: false, isFocused: true }
        : { ...window, isFocused: false }
    ))
    playSound('click')
  }
  
  return (
    <PersonaManager>
      <div ref={filmWindowRef} className="film-window">
        {/* Digital Ocean Background */}
        <DigitalOceanBackground glitchLevel={glitchLevel} breathingManager={breathingManager} />

        {/* Main Content Area - Sable-style Layout */}
        <div className="content-area">
          {/* Loading Indicator Overlay */}
          {!isPreloading && loadingState !== 'complete' && (
            <div className="loading-overlay">
              <div className="loading-indicator">
                <div className="loading-progress">
                  <div 
                    className="loading-bar" 
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <div className="loading-text">
                  {loadingState.replace(/_/g, ' ').toUpperCase()} ({Math.round(loadingProgress)}%)
                </div>
              </div>
            </div>
          )}

          {/* 3D Ocean Background Layer */}
          <div className="ocean-background-layer" ref={canvasRef}>
            <Canvas
              camera={{ position: [0, 30, 120], fov: 75 }}
              style={{
                background: 'transparent',
                pointerEvents: 'auto',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                minWidth: '100vw',
                minHeight: '100vh'
              }}
              gl={{ alpha: true, antialias: true }}
              dpr={[1, 2]}
              resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
            >
              <CameraController position={cameraPosition} rotation={cameraRotation} />
              {/* Progressive Scene Loading */}
              <SceneLoader
                onLoadingStateChange={handleLoadingStateChange}
                performancePreset={performancePreset}
                visualEffects={visualEffects}
                glitchLevel={glitchLevel}
                breathingManager={breathingManager}
                emotionManager={emotionManager}
                atmosphericIntensity={atmosphericIntensity}
                auroraSettings={auroraSettings}
                sceneLighting={sceneLighting}
                handleCaseFileClick={handleCaseFileClick}
                handleSuitcaseClick={handleSuitcaseClick}
                handleGamepadClick={handleGamepadClick}
                handlePersonaClick={handleToggleChatMinimize}
                position={{
                  caseFile: [-20, 15, 90],
                  suitcase: [20, 15, 90],
                  gamepad: [0, 15, 85]
                }}
                persona={currentPersona}
                isTyping={isTyping}
                personaPosition={personaPosition}
                personaScale={personaScale}
                personaHoverEffects={personaHoverEffects}
                componentsPreloaded={componentsPreloaded}
              >
                <ControllableLighting
                  ambientIntensity={sceneLighting.ambientIntensity}
                  directionalIntensity={sceneLighting.directionalIntensity}
                  color={sceneLighting.color}
                  pointLightIntensity={sceneLighting.pointLightIntensity}
                  pointLightPosition={sceneLighting.pointLightPosition}
                  fogDensity={sceneLighting.fogDensity}
                  shadowEnabled={sceneLighting.shadowEnabled}
                />
              </SceneLoader>
            </Canvas>
          </div>
          
          {/* Visual panel now empty - persona is integrated into main scene */}
          <div className="visual-panel" style={{ display: 'none' }} />

          {/* Floating Dialogue Interface - Disco Elysium Style */}
          <div className="dialogue-overlay">
            <ChatInterface
              persona={currentPersona}
              messages={messages}
              onMessageAdd={handleMessageAdd}
              onTypingChange={setIsTyping}
              onEmotionUpdate={handleEmotionUpdate}
              onClearMessages={clearMessages}
              isMinimized={isChatMinimized}
              onToggleMinimize={handleToggleChatMinimize}
            />
          </div>

        </div>

        {/* Window Manager for draggable/resizable windows */}
        <WindowManager windows={windows} setWindows={setWindows} />

        {/* Taskbar for minimized windows */}
        <Taskbar windows={windows} onRestoreWindow={handleRestoreWindow} />

      </div>

      <style jsx>{`
        .film-window {
          width: 100vw;
          height: 100vh;
          background: #000000;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }


        .content-area {
          flex: 1;
          height: 100vh;
          position: relative;
        }

        .loading-overlay {
          position: absolute;
          bottom: 20px;
          left: 20px;
          z-index: 15;
          pointer-events: none;
        }

        .loading-indicator {
          background: rgba(0, 0, 0, 0.9);
          color: #c084fc;
          padding: 15px;
          border: 1px solid #7c3aed;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          backdrop-filter: blur(5px);
        }

        .loading-progress {
          width: 200px;
          height: 4px;
          background: #1a0d2e;
          border: 1px solid #7c3aed;
          margin-bottom: 8px;
          border-radius: 2px;
          overflow: hidden;
        }

        .loading-bar {
          height: 100%;
          background: linear-gradient(90deg, #7c3aed, #c084fc);
          transition: width 0.3s ease;
          border-radius: 2px;
        }

        .loading-text {
          text-align: center;
          color: #a855f7;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ocean-background-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          min-width: 100vw;
          min-height: 100vh;
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
        }
        
        .ocean-background-layer canvas {
          pointer-events: auto !important;
        }

        .visual-panel {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          z-index: 5;
          overflow: hidden;
        }

        .dialogue-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10;
          pointer-events: none;
        }


        /* NGE-style atmospheric overlay */
        .film-window::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(ellipse at 50% 30%, rgba(181, 156, 217, 0.03) 0%, transparent 70%),
            linear-gradient(to bottom, rgba(26, 13, 46, 0.15) 0%, transparent 30%, transparent 70%, rgba(13, 10, 31, 0.2) 100%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 10;
        }

        /* Subtle atmospheric scanlines */
        .film-window::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(181, 156, 217, 0.02) 3px,
            rgba(181, 156, 217, 0.02) 4px
          );
          pointer-events: none;
          z-index: 9;
        }

      `}</style>
    </PersonaManager>
  )
}