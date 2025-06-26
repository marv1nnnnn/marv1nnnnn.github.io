'use client'

import { useState, useEffect } from 'react'
import { AIPersona } from '@/types/personas'
import { DEFAULT_PERSONA } from '@/config/personas'
import { useAudio } from '@/contexts/AudioContext'

interface ControlPanelProps {
  windowId?: string
  // Control parameters from FilmWindow
  currentPersona?: AIPersona
  glitchLevel?: number
  onGlitchLevelChange?: (level: number) => void
  // Additional atmospheric controls
  onAtmosphericIntensityChange?: (intensity: number) => void
  onAudioVolumeChange?: (volume: number) => void
  // 3D Scene controls
  onCameraPositionChange?: (position: { x: number; y: number; z: number }) => void
  onCameraRotationChange?: (rotation: { x: number; y: number; z: number }) => void
  onSceneLightingChange?: (lighting: { intensity: number; color: string }) => void
  // Visual effect toggles
  onVisualEffectToggle?: (effectName: string, enabled: boolean) => void
  // Persona 3D controls
  onPersonaPositionChange?: (position: { x: number; y: number; z: number }) => void
  onPersonaScaleChange?: (scale: number) => void
  onPersonaHoverEffectsChange?: (effects: {
    enabled: boolean
    glitchMultiplier: number
    particleIntensity: number
    geometricIntensity: number
    emissiveBoost: number
  }) => void
}

export default function ControlPanel({
  windowId,
  currentPersona = DEFAULT_PERSONA,
  glitchLevel = 0,
  onGlitchLevelChange,
  onAtmosphericIntensityChange,
  onAudioVolumeChange,
  onCameraPositionChange,
  onCameraRotationChange,
  onSceneLightingChange,
  onVisualEffectToggle,
  onPersonaPositionChange,
  onPersonaScaleChange,
  onPersonaHoverEffectsChange
}: ControlPanelProps) {
  const { playSound } = useAudio()
  const [atmosphericIntensity, setAtmosphericIntensity] = useState(0.3) // Reduced for better performance
  const [audioVolume, setAudioVolume] = useState(0.7)
  const [selectedTab, setSelectedTab] = useState('effects')
  
  // Visual effect toggle states - optimized for performance
  const [visualEffects, setVisualEffects] = useState({
    oceanWaves: true,
    aurora: true,
    particles: false, // Disabled by default for better performance
    rain: false
  })
  
  // 3D Scene controls state
  const [cameraPosition, setCameraPosition] = useState({ x:0, y:50, z:200 })
  const [cameraRotation, setCameraRotation] = useState({ x:0, y:0, z:0 })
  const [sceneLighting, setSceneLighting] = useState({ 
    intensity: 1.0, 
    color: '#ffffff',
    ambientIntensity: 0.3,
    directionalIntensity: 0.3, // Reduced for better performance
    pointLightIntensity: 0.4,
    pointLightPosition: { x: 10, y: 10, z: 10 },
    fogDensity: 0.0,
    shadowEnabled: false // Disabled by default for better performance
  })

  const handleGlitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const level = parseFloat(event.target.value)
    onGlitchLevelChange?.(level)
    playSound('hover')
  }

  const handleAtmosphericChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const intensity = parseFloat(event.target.value)
    setAtmosphericIntensity(intensity)
    onAtmosphericIntensityChange?.(intensity)
    playSound('hover')
  }

  const handleAudioVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(event.target.value)
    setAudioVolume(volume)
    onAudioVolumeChange?.(volume)
    playSound('hover')
  }

  // Aurora controls state - optimized for performance
  const [auroraSettings, setAuroraSettings] = useState({
    density: 0.6, // Reduced for better performance
    coverage: 0.7, // Reduced for better performance
    layerCount: 6 // Reduced from 12 for much better performance
  })

  // Persona 3D controls state
  const [personaPosition, setPersonaPosition] = useState({ x: 0, y: 30, z: -100 })
  const [personaScale, setPersonaScale] = useState(50)
  const [personaHoverEffects, setPersonaHoverEffects] = useState({
    enabled: true,
    glitchMultiplier: 1.0,
    particleIntensity: 1.0,
    geometricIntensity: 1.0,
    emissiveBoost: 0.5
  })

  // Visual effect toggle handlers
  const handleVisualEffectToggle = (effectName: keyof typeof visualEffects) => {
    const newEffects = {
      ...visualEffects,
      [effectName]: !visualEffects[effectName]
    }
    setVisualEffects(newEffects)
    
    // Call callback to update parent component
    onVisualEffectToggle?.(effectName, newEffects[effectName])
    playSound('click')
    
    console.log(`[DEBUG] Visual effect ${effectName} toggled:`, newEffects[effectName])
  }

  // Aurora settings handlers
  const handleAuroraSettingChange = (setting: string, value: number) => {
    const newSettings = { ...auroraSettings, [setting]: value }
    setAuroraSettings(newSettings)
    onVisualEffectToggle?.('auroraSettings', newSettings as any)
    playSound('hover')
  }

  // 3D Scene control handlers
  const handleCameraPositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPosition = { ...cameraPosition, [axis]: value }
    setCameraPosition(newPosition)
    onCameraPositionChange?.(newPosition)
    playSound('hover')
  }

  const handleCameraRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newRotation = { ...cameraRotation, [axis]: value }
    setCameraRotation(newRotation)
    onCameraRotationChange?.(newRotation)
    playSound('hover')
  }

  const handleSceneLightingChange = (property: string, value: number | string | object | boolean) => {
    const newLighting = { ...sceneLighting, [property]: value }
    setSceneLighting(newLighting)
    onSceneLightingChange?.(newLighting)
    playSound('hover')
  }

  // Persona 3D control handlers
  const handlePersonaPositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPosition = { ...personaPosition, [axis]: value }
    setPersonaPosition(newPosition)
    onPersonaPositionChange?.(newPosition)
    playSound('hover')
  }

  const handlePersonaScaleChange = (scale: number) => {
    setPersonaScale(scale)
    onPersonaScaleChange?.(scale)
    playSound('hover')
  }

  const handlePersonaHoverEffectChange = (property: string, value: number | boolean) => {
    const newEffects = { ...personaHoverEffects, [property]: value }
    setPersonaHoverEffects(newEffects)
    onPersonaHoverEffectsChange?.(newEffects)
    playSound('hover')
  }

  const tabs = [
    { id: 'effects', label: 'VISUAL FX', icon: '✨' },
    { id: '3d', label: '3D SCENE', icon: '🎮' },
    { id: 'persona', label: 'PERSONA 3D', icon: '👤' },
    { id: 'audio', label: 'AUDIO SYS', icon: '🔊' },
    { id: 'system', label: 'SYSTEM', icon: '⚙️' }
  ]

  return (
    <div className="control-panel">
      <div className="film-window-header">
        <div className="system-info">
          <div className="info-line">marv1nnnnn OS v1.0 - PERSONAL SYSTEM CONTROL</div>
          <div className="info-line">ACCESS LEVEL: [ADMINISTRATOR]</div>
          <div className="info-line">SESSION: {new Date().toISOString().substr(0, 19)}</div>
        </div>
        
        <div className="status-bar">
          <div className="status-item">
            PERSONA: {currentPersona.displayName}
          </div>
          <div className="status-item">
            GLITCH: {Math.round(glitchLevel * 100)}%
          </div>
          <div className="status-item">
            STATUS: ACTIVE
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${selectedTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedTab(tab.id)
                playSound('click')
              }}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {selectedTab === 'effects' && (
            <div className="effects-panel">
              <div className="panel-title">VISUAL EFFECTS CONTROL</div>
              
              <div className="control-group">
                <label className="control-label">
                  GLITCH INTENSITY: {Math.round(glitchLevel * 100)}%
                </label>
                <input
                  type="range"
                  className="slider"
                  min="0"
                  max="1"
                  step="0.01"
                  value={glitchLevel}
                  onChange={handleGlitchChange}
                />
                <div className="slider-markers">
                  <span>OFF</span>
                  <span>MAX</span>
                </div>
              </div>

              <div className="control-group">
                <label className="control-label">
                  ATMOSPHERIC INTENSITY: {Math.round(atmosphericIntensity * 100)}%
                </label>
                <input
                  type="range"
                  className="slider"
                  min="0"
                  max="1"
                  step="0.01"
                  value={atmosphericIntensity}
                  onChange={handleAtmosphericChange}
                />
                <div className="slider-markers">
                  <span>CALM</span>
                  <span>INTENSE</span>
                </div>
              </div>

              <div className="effect-toggles">
                <button 
                  className={`effect-toggle ${visualEffects.oceanWaves ? 'active' : ''}`}
                  onClick={() => handleVisualEffectToggle('oceanWaves')}
                >
                  OCEAN WAVES
                </button>
                <button 
                  className={`effect-toggle ${visualEffects.aurora ? 'active' : ''}`}
                  onClick={() => handleVisualEffectToggle('aurora')}
                >
                  AURORA
                </button>
                <button 
                  className={`effect-toggle ${visualEffects.particles ? 'active' : ''}`}
                  onClick={() => handleVisualEffectToggle('particles')}
                >
                  PARTICLES
                </button>
                <button 
                  className={`effect-toggle ${visualEffects.rain ? 'active' : ''}`}
                  onClick={() => handleVisualEffectToggle('rain')}
                >
                  RAIN
                </button>
              </div>

              <div className="control-section">
                <div className="section-title">AURORA CONFIGURATION</div>
                <div className="control-group">
                  <label className="control-label">
                    AURORA DENSITY: {Math.round(auroraSettings.density * 100)}%
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={auroraSettings.density}
                    onChange={(e) => handleAuroraSettingChange('density', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>SPARSE</span>
                    <span>DENSE</span>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    AURORA COVERAGE: {Math.round(auroraSettings.coverage * 100)}%
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="0.7"
                    max="1.5"
                    step="0.1"
                    value={auroraSettings.coverage}
                    onChange={(e) => handleAuroraSettingChange('coverage', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>NARROW</span>
                    <span>WIDE</span>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    LAYER COUNT: {auroraSettings.layerCount}
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="8"
                    max="20"
                    step="2"
                    value={auroraSettings.layerCount}
                    onChange={(e) => handleAuroraSettingChange('layerCount', parseInt(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>FEW</span>
                    <span>MANY</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === '3d' && (
            <div className="scene3d-panel">
              <div className="panel-title">3D SCENE CONTROL</div>
              
              <div className="control-section">
                <div className="section-title">CAMERA POSITION</div>
                <div className="control-group">
                  <label className="control-label">
                    X-AXIS: {cameraPosition.x.toFixed(0)}
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="-500"
                    max="500"
                    step="10"
                    value={cameraPosition.x}
                    onChange={(e) => handleCameraPositionChange('x', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>LEFT (-500)</span>
                    <span>RIGHT (500)</span>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    Y-AXIS: {cameraPosition.y.toFixed(0)}
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="-100"
                    max="300"
                    step="5"
                    value={cameraPosition.y}
                    onChange={(e) => handleCameraPositionChange('y', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>DOWN (-100)</span>
                    <span>UP (300)</span>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    Z-AXIS: {cameraPosition.z.toFixed(0)}
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="50"
                    max="600"
                    step="10"
                    value={cameraPosition.z}
                    onChange={(e) => handleCameraPositionChange('z', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>NEAR (50)</span>
                    <span>FAR (600)</span>
                  </div>
                </div>
              </div>


              <div className="control-section">
                <div className="section-title">AMBIENT LIGHTING</div>
                <div className="control-group">
                  <label className="control-label">
                    AMBIENT INTENSITY: {Math.round(sceneLighting.ambientIntensity * 100)}%
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="0"
                    max="3"
                    step="0.01"
                    value={sceneLighting.ambientIntensity}
                    onChange={(e) => handleSceneLightingChange('ambientIntensity', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>PITCH BLACK</span>
                    <span>BLAZING</span>
                  </div>
                </div>
              </div>

              <div className="control-section">
                <div className="section-title">DIRECTIONAL LIGHTING</div>
                <div className="control-group">
                  <label className="control-label">
                    DIRECTIONAL INTENSITY: {Math.round(sceneLighting.directionalIntensity * 100)}%
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="0"
                    max="8"
                    step="0.05"
                    value={sceneLighting.directionalIntensity}
                    onChange={(e) => handleSceneLightingChange('directionalIntensity', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>OFF</span>
                    <span>BLINDING</span>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    LIGHT COLOR
                  </label>
                  <input
                    type="color"
                    className="color-picker"
                    value={sceneLighting.color}
                    onChange={(e) => handleSceneLightingChange('color', e.target.value)}
                  />
                </div>
              </div>

              <div className="control-section">
                <div className="section-title">POINT LIGHTING</div>
                <div className="control-group">
                  <label className="control-label">
                    POINT LIGHT INTENSITY: {Math.round(sceneLighting.pointLightIntensity * 100)}%
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="0"
                    max="5"
                    step="0.05"
                    value={sceneLighting.pointLightIntensity}
                    onChange={(e) => handleSceneLightingChange('pointLightIntensity', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>OFF</span>
                    <span>INTENSE</span>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    POINT LIGHT X: {sceneLighting.pointLightPosition.x}
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="-50"
                    max="50"
                    step="1"
                    value={sceneLighting.pointLightPosition.x}
                    onChange={(e) => handleSceneLightingChange('pointLightPosition', {
                      ...sceneLighting.pointLightPosition,
                      x: parseFloat(e.target.value)
                    })}
                  />
                </div>

                <div className="control-group">
                  <label className="control-label">
                    POINT LIGHT Y: {sceneLighting.pointLightPosition.y}
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="-50"
                    max="50"
                    step="1"
                    value={sceneLighting.pointLightPosition.y}
                    onChange={(e) => handleSceneLightingChange('pointLightPosition', {
                      ...sceneLighting.pointLightPosition,
                      y: parseFloat(e.target.value)
                    })}
                  />
                </div>

                <div className="control-group">
                  <label className="control-label">
                    POINT LIGHT Z: {sceneLighting.pointLightPosition.z}
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="-50"
                    max="50"
                    step="1"
                    value={sceneLighting.pointLightPosition.z}
                    onChange={(e) => handleSceneLightingChange('pointLightPosition', {
                      ...sceneLighting.pointLightPosition,
                      z: parseFloat(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="control-section">
                <div className="section-title">ATMOSPHERIC EFFECTS</div>
                <div className="control-group">
                  <label className="control-label">
                    FOG DENSITY: {Math.round(sceneLighting.fogDensity * 100)}%
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="0"
                    max="0.1"
                    step="0.001"
                    value={sceneLighting.fogDensity}
                    onChange={(e) => handleSceneLightingChange('fogDensity', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>CLEAR</span>
                    <span>THICK</span>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    SHADOWS: {sceneLighting.shadowEnabled ? 'ENABLED' : 'DISABLED'}
                  </label>
                  <button 
                    className={`effect-toggle ${sceneLighting.shadowEnabled ? 'active' : ''}`}
                    onClick={() => handleSceneLightingChange('shadowEnabled', !sceneLighting.shadowEnabled)}
                  >
                    {sceneLighting.shadowEnabled ? 'DISABLE' : 'ENABLE'} SHADOWS
                  </button>
                </div>
              </div>

              <div className="scene-presets">
                <div className="section-title">LIGHTING PRESETS</div>
                <div className="preset-buttons">
                  <button className="preset-button" onClick={() => {
                    const defaultLighting = {
                      intensity: 1.0,
                      color: '#ffffff',
                      ambientIntensity: 0.3,
                      directionalIntensity: 0.5,
                      pointLightIntensity: 0.4,
                      pointLightPosition: { x: 10, y: 10, z: 10 },
                      fogDensity: 0.0,
                      shadowEnabled: true
                    }
                    setSceneLighting(defaultLighting)
                    onSceneLightingChange?.(defaultLighting)
                    playSound('click')
                  }}>DEFAULT</button>
                  <button className="preset-button" onClick={() => {
                    const dramaticLighting = {
                      intensity: 3.0,
                      color: '#ff4400',
                      ambientIntensity: 0.05,
                      directionalIntensity: 6.0,
                      pointLightIntensity: 3.0,
                      pointLightPosition: { x: -30, y: 40, z: -20 },
                      fogDensity: 0.03,
                      shadowEnabled: true
                    }
                    setSceneLighting(dramaticLighting)
                    onSceneLightingChange?.(dramaticLighting)
                    playSound('click')
                  }}>DRAMATIC</button>
                  <button className="preset-button" onClick={() => {
                    const mysticLighting = {
                      intensity: 1.5,
                      color: '#7c3aed',
                      ambientIntensity: 0.8,
                      directionalIntensity: 0.2,
                      pointLightIntensity: 2.5,
                      pointLightPosition: { x: 0, y: 50, z: 30 },
                      fogDensity: 0.08,
                      shadowEnabled: false
                    }
                    setSceneLighting(mysticLighting)
                    onSceneLightingChange?.(mysticLighting)
                    playSound('click')
                  }}>MYSTIC</button>
                  <button className="preset-button" onClick={() => {
                    const moonlightLighting = {
                      intensity: 0.8,
                      color: '#4488ff',
                      ambientIntensity: 0.02,
                      directionalIntensity: 4.0,
                      pointLightIntensity: 0.1,
                      pointLightPosition: { x: 20, y: 60, z: 40 },
                      fogDensity: 0.01,
                      shadowEnabled: true
                    }
                    setSceneLighting(moonlightLighting)
                    onSceneLightingChange?.(moonlightLighting)
                    playSound('click')
                  }}>MOONLIGHT</button>
                </div>
              </div>

              <div className="scene-presets">
                <div className="section-title">CAMERA PRESETS</div>
                <div className="preset-buttons">
                  <button className="preset-button" onClick={() => {
                    const defaultPos = {x:0, y:50, z:200}
                    const defaultRot = {x:0, y:0, z:0}
                    setCameraPosition(defaultPos)
                    setCameraRotation(defaultRot)
                    onCameraPositionChange?.(defaultPos)
                    onCameraRotationChange?.(defaultRot)
                    playSound('click')
                  }}>DEFAULT VIEW</button>
                  <button className="preset-button" onClick={() => {
                    const overviewPos = {x:0, y:150, z:400}
                    const overviewRot = {x:-0.2, y:0, z:0}
                    setCameraPosition(overviewPos)
                    setCameraRotation(overviewRot)
                    onCameraPositionChange?.(overviewPos)
                    onCameraRotationChange?.(overviewRot)
                    playSound('click')
                  }}>OVERVIEW</button>
                  <button className="preset-button" onClick={() => {
                    const closePos = {x:0, y:20, z:100}
                    const closeRot = {x:0.1, y:0, z:0}
                    setCameraPosition(closePos)
                    setCameraRotation(closeRot)
                    onCameraPositionChange?.(closePos)
                    onCameraRotationChange?.(closeRot)
                    playSound('click')
                  }}>CLOSE UP</button>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'audio' && (
            <div className="audio-panel">
              <div className="panel-title">AUDIO SYSTEM CONTROL</div>
              
              <div className="control-group">
                <label className="control-label">
                  MASTER VOLUME: {Math.round(audioVolume * 100)}%
                </label>
                <input
                  type="range"
                  className="slider"
                  min="0"
                  max="1"
                  step="0.01"
                  value={audioVolume}
                  onChange={handleAudioVolumeChange}
                />
                <div className="slider-markers">
                  <span>MUTE</span>
                  <span>MAX</span>
                </div>
              </div>

              <div className="audio-channels">
                <div className="channel-control">
                  <span className="channel-name">SYSTEM SOUNDS</span>
                  <span className="channel-level">85%</span>
                </div>
                <div className="channel-control">
                  <span className="channel-name">AMBIENT</span>
                  <span className="channel-level">70%</span>
                </div>
                <div className="channel-control">
                  <span className="channel-name">GLITCH FX</span>
                  <span className="channel-level">60%</span>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'persona' && (
            <div className="persona3d-panel">
              <div className="panel-title">PERSONA 3D CONTROL</div>
              
              <div className="control-section">
                <div className="section-title">POSITION</div>
                <div className="control-group">
                  <label className="control-label">
                    X-AXIS: {personaPosition.x.toFixed(0)}
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="-200"
                    max="200"
                    step="5"
                    value={personaPosition.x}
                    onChange={(e) => handlePersonaPositionChange('x', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>LEFT (-200)</span>
                    <span>RIGHT (200)</span>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    Y-AXIS: {personaPosition.y.toFixed(0)}
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="-50"
                    max="100"
                    step="2"
                    value={personaPosition.y}
                    onChange={(e) => handlePersonaPositionChange('y', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>DOWN (-50)</span>
                    <span>UP (100)</span>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label">
                    Z-AXIS: {personaPosition.z.toFixed(0)}
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="-300"
                    max="50"
                    step="5"
                    value={personaPosition.z}
                    onChange={(e) => handlePersonaPositionChange('z', parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>FAR (-300)</span>
                    <span>NEAR (50)</span>
                  </div>
                </div>
              </div>

              <div className="control-section">
                <div className="section-title">SCALE & SIZE</div>
                <div className="control-group">
                  <label className="control-label">
                    PERSONA SCALE: {personaScale.toFixed(0)}
                  </label>
                  <input
                    type="range"
                    className="slider"
                    min="10"
                    max="100"
                    step="1"
                    value={personaScale}
                    onChange={(e) => handlePersonaScaleChange(parseFloat(e.target.value))}
                  />
                  <div className="slider-markers">
                    <span>TINY (10)</span>
                    <span>MASSIVE (100)</span>
                  </div>
                </div>
              </div>

              <div className="control-section">
                <div className="section-title">HOVER EFFECTS</div>
                
                <div className="control-group">
                  <label className="control-label">
                    HOVER EFFECTS: {personaHoverEffects.enabled ? 'ENABLED' : 'DISABLED'}
                  </label>
                  <button 
                    className={`effect-toggle ${personaHoverEffects.enabled ? 'active' : ''}`}
                    onClick={() => handlePersonaHoverEffectChange('enabled', !personaHoverEffects.enabled)}
                  >
                    {personaHoverEffects.enabled ? 'DISABLE' : 'ENABLE'} HOVER
                  </button>
                </div>

                {personaHoverEffects.enabled && (
                  <>
                    <div className="control-group">
                      <label className="control-label">
                        GLITCH INTENSITY: {Math.round(personaHoverEffects.glitchMultiplier * 100)}%
                      </label>
                      <input
                        type="range"
                        className="slider"
                        min="0"
                        max="3"
                        step="0.1"
                        value={personaHoverEffects.glitchMultiplier}
                        onChange={(e) => handlePersonaHoverEffectChange('glitchMultiplier', parseFloat(e.target.value))}
                      />
                      <div className="slider-markers">
                        <span>NONE</span>
                        <span>EXTREME</span>
                      </div>
                    </div>

                    <div className="control-group">
                      <label className="control-label">
                        PARTICLE INTENSITY: {Math.round(personaHoverEffects.particleIntensity * 100)}%
                      </label>
                      <input
                        type="range"
                        className="slider"
                        min="0"
                        max="2"
                        step="0.1"
                        value={personaHoverEffects.particleIntensity}
                        onChange={(e) => handlePersonaHoverEffectChange('particleIntensity', parseFloat(e.target.value))}
                      />
                      <div className="slider-markers">
                        <span>NONE</span>
                        <span>INTENSE</span>
                      </div>
                    </div>

                    <div className="control-group">
                      <label className="control-label">
                        GEOMETRIC EFFECTS: {Math.round(personaHoverEffects.geometricIntensity * 100)}%
                      </label>
                      <input
                        type="range"
                        className="slider"
                        min="0"
                        max="2"
                        step="0.1"
                        value={personaHoverEffects.geometricIntensity}
                        onChange={(e) => handlePersonaHoverEffectChange('geometricIntensity', parseFloat(e.target.value))}
                      />
                      <div className="slider-markers">
                        <span>NONE</span>
                        <span>INTENSE</span>
                      </div>
                    </div>

                    <div className="control-group">
                      <label className="control-label">
                        EMISSIVE BOOST: {Math.round(personaHoverEffects.emissiveBoost * 100)}%
                      </label>
                      <input
                        type="range"
                        className="slider"
                        min="0"
                        max="1"
                        step="0.05"
                        value={personaHoverEffects.emissiveBoost}
                        onChange={(e) => handlePersonaHoverEffectChange('emissiveBoost', parseFloat(e.target.value))}
                      />
                      <div className="slider-markers">
                        <span>SUBTLE</span>
                        <span>BRIGHT</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="scene-presets">
                <div className="section-title">POSITION PRESETS</div>
                <div className="preset-buttons">
                  <button className="preset-button" onClick={() => {
                    const defaultPos = {x: 0, y: 30, z: -100}
                    setPersonaPosition(defaultPos)
                    onPersonaPositionChange?.(defaultPos)
                    playSound('click')
                  }}>DEFAULT</button>
                  <button className="preset-button" onClick={() => {
                    const centerPos = {x: 0, y: 20, z: -50}
                    setPersonaPosition(centerPos)
                    onPersonaPositionChange?.(centerPos)
                    playSound('click')
                  }}>CENTER STAGE</button>
                  <button className="preset-button" onClick={() => {
                    const backgroundPos = {x: 0, y: 40, z: -200}
                    setPersonaPosition(backgroundPos)
                    onPersonaPositionChange?.(backgroundPos)
                    playSound('click')
                  }}>BACKGROUND</button>
                  <button className="preset-button" onClick={() => {
                    const sidePos = {x: -80, y: 30, z: -80}
                    setPersonaPosition(sidePos)
                    onPersonaPositionChange?.(sidePos)
                    playSound('click')
                  }}>SIDE VIEW</button>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'system' && (
            <div className="system-panel">
              <div className="panel-title">SYSTEM DIAGNOSTICS</div>
              
              <div className="system-stats">
                <div className="stat-item">
                  <span className="stat-label">CPU USAGE:</span>
                  <span className="stat-value">42%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">MEMORY:</span>
                  <span className="stat-value">1.2GB</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">GPU:</span>
                  <span className="stat-value">78%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">NETWORK:</span>
                  <span className="stat-value">ONLINE</span>
                </div>
              </div>

              <div className="system-actions">
                <button className="action-button">SAVE CONFIG</button>
                <button className="action-button">RESET DEFAULTS</button>
                <button className="action-button danger">EMERGENCY STOP</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .control-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          font-family: var(--font-system);
          background: var(--color-void);
          color: var(--color-light);
        }

        .film-window-header {
          border-bottom: 2px solid var(--color-light);
          padding: var(--space-base);
          background: var(--color-shadow);
        }

        .system-info {
          margin-bottom: var(--space-sm);
        }

        .info-line {
          font-size: 14px;
          color: #88ccff;
          margin-bottom: 2px;
        }

        .status-bar {
          display: flex;
          gap: var(--space-base);
          font-size: 14px;
          color: #ffffff;
        }

        .status-item {
          padding: 2px var(--space-xs);
          border: 1px solid var(--color-grey-dark);
          background: var(--color-void);
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tab-navigation {
          display: flex;
          border-bottom: 2px solid var(--color-light);
          background: var(--color-shadow);
        }

        .tab-button {
          flex: 1;
          padding: var(--space-base);
          background: transparent;
          border: none;
          color: var(--color-grey-light);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          border-right: 1px solid var(--color-grey-dark);
        }

        .tab-button:last-child {
          border-right: none;
        }

        .tab-button.active {
          background: var(--color-info);
          color: var(--color-void);
        }

        .tab-button:hover:not(.active) {
          background: var(--color-grey-dark);
          color: var(--color-light);
        }

        .tab-icon {
          font-size: 18px;
        }

        .tab-label {
          font-size: 12px;
          font-weight: bold;
        }

        .tab-content {
          flex: 1;
          padding: var(--space-base);
          overflow-y: auto;
        }

        .panel-title {
          font-size: 18px;
          font-weight: bold;
          color: #ffff88;
          margin-bottom: var(--space-base);
          text-align: center;
          text-shadow: 0 0 5px #ffff88;
        }

        .current-persona-display {
          background: var(--color-shadow);
          border: 2px solid ${currentPersona.avatar.primaryColor};
          padding: var(--space-base);
          margin-bottom: var(--space-base);
        }

        .persona-info {
          display: flex;
          align-items: center;
          gap: var(--space-base);
        }

        .persona-name {
          font-size: 16px;
          font-weight: bold;
          color: ${currentPersona.avatar.primaryColor};
        }

        .persona-desc {
          font-size: 12px;
          color: var(--color-grey-light);
          flex: 1;
        }

        .persona-color {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .persona-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-sm);
          margin-bottom: var(--space-base);
        }

        .persona-card {
          background: var(--color-shadow);
          border: 2px solid var(--color-grey-dark);
          padding: var(--space-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          transition: all 0.2s ease;
        }

        .persona-card.selected {
          background: var(--color-info);
          color: var(--color-void);
        }

        .persona-card:hover:not(.selected) {
          background: var(--color-grey-dark);
        }

        .persona-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
        }

        .persona-details {
          flex: 1;
        }

        .persona-card-name {
          font-weight: bold;
          font-size: 14px;
        }

        .persona-traits {
          font-size: 12px;
          opacity: 0.7;
        }

        .persona-controls {
          text-align: center;
        }

        .toggle-button {
          background: var(--color-shadow);
          border: 2px solid var(--color-light);
          color: var(--color-light);
          padding: var(--space-sm) var(--space-base);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-button.active {
          background: var(--color-info);
          color: var(--color-void);
        }

        .toggle-button:hover {
          background: var(--color-grey-dark);
        }

        .control-group {
          margin-bottom: var(--space-lg);
        }

        .control-label {
          display: block;
          margin-bottom: var(--space-xs);
          color: #88ccff;
          font-weight: bold;
        }

        .slider {
          width: 100%;
          height: 6px;
          background: var(--color-grey-dark);
          outline: none;
          margin-bottom: var(--space-xs);
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: var(--color-info);
          cursor: pointer;
          border-radius: 50%;
        }

        .slider-markers {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--color-grey-light);
        }

        .effect-toggles {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-sm);
        }

        .effect-toggle {
          background: var(--color-shadow);
          border: 2px solid var(--color-grey-dark);
          color: var(--color-grey-light);
          padding: var(--space-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .effect-toggle.active {
          background: var(--color-info);
          color: var(--color-void);
          border-color: var(--color-info);
        }

        .effect-toggle:hover:not(.active) {
          background: var(--color-grey-dark);
          color: var(--color-light);
        }

        .audio-channels {
          margin-top: var(--space-base);
        }

        .channel-control {
          display: flex;
          justify-content: space-between;
          padding: var(--space-xs);
          border-bottom: 1px solid var(--color-grey-dark);
          margin-bottom: var(--space-xs);
        }

        .channel-name {
          color: var(--color-light);
        }

        .channel-level {
          color: var(--color-info);
          font-weight: bold;
        }

        .system-stats {
          margin-bottom: var(--space-lg);
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: var(--space-xs);
          border-bottom: 1px solid var(--color-grey-dark);
          margin-bottom: var(--space-xs);
        }

        .stat-label {
          color: var(--color-light);
        }

        .stat-value {
          color: var(--color-info);
          font-weight: bold;
        }

        .system-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .action-button {
          background: var(--color-shadow);
          border: 2px solid var(--color-light);
          color: var(--color-light);
          padding: var(--space-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          background: var(--color-grey-dark);
        }

        .action-button.danger {
          border-color: var(--color-blood);
          color: var(--color-blood);
        }

        .action-button.danger:hover {
          background: var(--color-blood);
          color: var(--color-light);
        }

        .scene3d-panel {
          padding: var(--space-base);
        }

        .persona3d-panel {
          padding: var(--space-base);
        }

        .control-section {
          margin-bottom: var(--space-lg);
          padding: var(--space-base);
          border: 1px solid var(--color-grey-dark);
          background: var(--color-shadow);
        }

        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #88ccff;
          margin-bottom: var(--space-base);
          text-align: center;
          border-bottom: 1px solid var(--color-grey-dark);
          padding-bottom: var(--space-xs);
        }

        .color-picker {
          width: 100%;
          height: 40px;
          border: 2px solid var(--color-light);
          background: transparent;
          cursor: pointer;
        }

        .scene-presets {
          margin-top: var(--space-lg);
        }

        .preset-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--space-sm);
        }

        .preset-button {
          background: var(--color-shadow);
          border: 2px solid var(--color-info);
          color: var(--color-info);
          padding: var(--space-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
          font-weight: bold;
        }

        .preset-button:hover {
          background: var(--color-info);
          color: var(--color-void);
        }
      `}</style>
    </div>
  )
}