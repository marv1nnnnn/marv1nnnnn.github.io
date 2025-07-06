'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Box } from '@react-three/drei'
import { Group } from 'three'
import { AIPersona } from '@/types/personas'
import ParticleEffects from './ParticleEffects'
import GeometricEffects from './GeometricEffects'
import * as THREE from 'three'
import gsap from 'gsap'

// Preload the GLB model
useGLTF.preload('/models/coil.glb')

interface Persona3DProps {
  persona: AIPersona
  position?: [number, number, number]
  scale?: number
  onClick?: () => void
  isHovered?: boolean
  hoverIntensity?: number
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}

export default function Persona3D({
  persona,
  position = [0, 0, 0],
  scale = 2.5,
  onClick,
  isHovered,
  hoverIntensity,
  onPointerEnter,
  onPointerLeave,
}: Persona3DProps) {
  const groupRef = useRef<Group>(null)
  const { gl } = useThree()
  const [internalIsHovered, setInternalIsHovered] = useState(false)
  const [internalHoverIntensity, setInternalHoverIntensity] = useState(0)
  
  // Use prop values if provided, otherwise use internal state
  const effectiveIsHovered = isHovered !== undefined ? isHovered : internalIsHovered
  const effectiveHoverIntensity = hoverIntensity !== undefined ? hoverIntensity : internalHoverIntensity
  

  // Change cursor on hover
  useEffect(() => {
    gl.domElement.style.cursor = effectiveIsHovered ? 'pointer' : 'auto'
    return () => {
      gl.domElement.style.cursor = 'auto'
    }
  }, [effectiveIsHovered, gl])

  // Animate hover intensity for smooth transition
  useEffect(() => {
    const targetValue = effectiveIsHovered ? 1 : 0;
    gsap.to({ value: internalHoverIntensity }, {
      value: targetValue,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: function() {
        setInternalHoverIntensity(this.targets()[0].value)
      }
    });
  }, [effectiveIsHovered]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (groupRef.current) {
      // Smooth, hypnotic rotation with variable speed
      groupRef.current.rotation.y = time * 0.02 + Math.sin(time * 0.1) * 0.005;

      // More pronounced breathing effect for otherworldly presence
      const breathe = 1.0 + Math.sin(time * 0.3) * 0.03;
      groupRef.current.scale.setScalar(scale * breathe);

      // Floating motion with multiple sine waves for complexity
      const floatY = Math.sin(time * 0.12) * 0.8 + Math.sin(time * 0.07) * 0.4;
      const floatX = Math.cos(time * 0.09) * 0.3;
      const floatZ = Math.sin(time * 0.06) * 0.2;

      groupRef.current.position.set(
        position[0] + floatX,
        position[1] + floatY,
        position[2] + floatZ
      );

      // Multiple axis rotation for more dynamic presence
      groupRef.current.rotation.x = Math.sin(time * 0.08) * 0.02;
      groupRef.current.rotation.z = Math.cos(time * 0.05) * 0.01;

      // Update material emissive intensity for pulsing effect with hover enhancement
      if (clonedScene) {
        const basePulseIntensity = 0.15 + Math.sin(time * 0.4) * 0.1;
        const hoverBoost = effectiveHoverIntensity * 0.5; // Additional intensity on hover
        const finalIntensity = basePulseIntensity + hoverBoost;

        const accentColor = new THREE.Color(persona.avatar.accentColor || '#00ffff');
        const baseEmissive = new THREE.Color(persona.avatar.accentColor || persona.avatar.primaryColor || '#00ffff').multiplyScalar(0.1);

        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
            child.material.emissiveIntensity = finalIntensity;

            // Update custom shader uniforms for film grain and scanline effects
            if ((child.material as any).userData.shader) {
              (child.material as any).userData.shader.uniforms.uTime.value = time;
              (child.material as any).userData.shader.uniforms.uHoverIntensity.value = effectiveHoverIntensity;
            }

            // Enhanced color effects on hover
            if (effectiveHoverIntensity > 0) {
              child.material.emissive.copy(accentColor).multiplyScalar(0.1 + effectiveHoverIntensity * 0.3);
              child.material.opacity = 0.9 + effectiveHoverIntensity * 0.1;
            } else {
              // Reset to base state when not hovered
              if (!child.material.emissive.equals(baseEmissive)) {
                child.material.emissive.copy(baseEmissive);
              }
              if (child.material.opacity !== 0.9) {
                child.material.opacity = 0.9;
              }
            }
          }
        });
      }
    }
  });
  
  // Load the GLB model
  const { scene } = useGLTF('/models/coil.glb')
  
  // Clone the scene to avoid issues with multiple instances
  const clonedScene = useMemo(() => scene.clone(), [scene])

  const boundingBox = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    // Add a little padding to the box to make it easier to hover
    size.multiplyScalar(1.2);
    return { size, center };
  }, [clonedScene]);
  
  // Monolithic color processing - enhanced for architectural presence
  const getMonolithicColor = (persona: AIPersona) => {
    const baseColor = persona.avatar.primaryColor
    
    if (baseColor) {
      const color = new THREE.Color(baseColor)
      // Darken significantly for more imposing, monumental presence
      color.multiplyScalar(0.4)
      // Desaturate slightly for more architectural feel
      color.lerp(new THREE.Color('#888888'), 0.2)
      return color
    }
    
    return new THREE.Color('#4A4A4A') // Default neutral gray
  }
  
  // Apply persona-specific material with atmospheric effects and hover enhancements
  useEffect(() => {
    if (clonedScene) {
      const personaColor = getMonolithicColor(persona)
      const accentColor = new THREE.Color(persona.avatar.accentColor || persona.avatar.primaryColor || '#00ffff')
      
      const customUniforms = {
        uTime: { value: 0 },
        uHoverIntensity: { value: 0 },
        uScanlineColor: { value: new THREE.Color('#b59cd9').multiplyScalar(0.2) },
      }

      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = new THREE.MeshLambertMaterial({
            color: personaColor,
            emissive: accentColor.clone().multiplyScalar(0.1),
            emissiveIntensity: 0.2,
            flatShading: true,
            transparent: true,
            opacity: 0.9,
            fog: true,
          })

          material.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = customUniforms.uTime
            shader.uniforms.uHoverIntensity = customUniforms.uHoverIntensity
            shader.uniforms.uScanlineColor = customUniforms.uScanlineColor

            // Vertex shader for glitch effect
            shader.vertexShader = `
              uniform float uTime;
              uniform float uHoverIntensity;
              
              float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
              }

              ${shader.vertexShader}
            `.replace(
              `#include <begin_vertex>`,
              `#include <begin_vertex>
              
              float glitchAmount = random(vec2(position.y, uTime)) * 0.2;
              transformed.x += sin(position.y * 10.0 + uTime * 5.0) * glitchAmount * uHoverIntensity * 2.0;
              transformed.z += cos(position.x * 10.0 + uTime * 5.0) * glitchAmount * uHoverIntensity * 2.0;
              `
            )

            // Fragment shader for scanlines and noise
            shader.fragmentShader = `
              uniform float uTime;
              uniform float uHoverIntensity;
              uniform vec3 uScanlineColor;

              float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
              }

              ${shader.fragmentShader}
            `.replace(
              `#include <dithering_fragment>`,
              `#include <dithering_fragment>

              // Film grain/noise
              float noise = (random(gl_FragCoord.xy / 1000.0 * uTime) - 0.5) * 0.15;
              gl_FragColor.rgb += noise * uHoverIntensity;

              // Scanlines
              float scanlineIntensity = 0.1 + 0.2 * sin(uTime * 10.0);
              float scanline = sin(gl_FragCoord.y * 0.5) * scanlineIntensity * uHoverIntensity;
              gl_FragColor.rgb -= uScanlineColor * scanline;

              // Clamp colors to avoid artifacts
              gl_FragColor.rgb = clamp(gl_FragColor.rgb, 0.0, 1.0);
              `
            )
            
            ;(child.material as any).userData.shader = shader
          }
          
          child.material = material
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  }, [clonedScene, persona.avatar.primaryColor, persona.avatar.accentColor])
  
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clonedScene) {
        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose())
            } else {
              child.material?.dispose()
            }
          }
        })
      }
    }
  }, [clonedScene])
  
  // Only render for figure persona types
  if (persona.avatar.model !== 'figure') {
    return null
  }
  
  
  return (
    <group
      ref={groupRef}
      position={position}
      scale={[scale, scale, scale]}
    >
      {/* Invisible bounding box for reliable hover detection and clicking */}
      <Box
        args={[boundingBox.size.x, boundingBox.size.y, boundingBox.size.z]}
        position={boundingBox.center}
        onPointerEnter={() => {
          setInternalIsHovered(true)
          onPointerEnter?.()
        }}
        onPointerLeave={() => {
          setInternalIsHovered(false)
          onPointerLeave?.()
        }}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
      >
        <meshBasicMaterial 
          transparent 
          opacity={0} 
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Box>

      {/* Atmospheric fog for depth and mystery */}
      <fog 
        attach="fog" 
        args={[persona.avatar.primaryColor || '#000030', 50, 300]} 
      />
      
      {/* GLB Model - Coil */}
      {clonedScene && <primitive object={clonedScene} />}
      
      {/* Magical particle effects on hover */}
      <ParticleEffects 
        persona={persona} 
        hoverIntensity={effectiveHoverIntensity} 
        position={[0, 0, 0]} 
      />
      
      {/* Geometric effects on hover */}
      <GeometricEffects 
        persona={persona} 
        hoverIntensity={effectiveHoverIntensity} 
        position={[0, 0, 0]} 
      />
      
      {/* Dynamic directional light with persona colors and hover enhancement */}
      <directionalLight
        position={[-40, 80, 40]}
        intensity={2.0 + effectiveHoverIntensity * 1.0}
        color={persona.avatar.primaryColor || "#FFFFFF"}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0001}
      />
      
      {/* Secondary accent light for rim lighting with hover boost */}
      <directionalLight
        position={[30, -40, -30]}
        intensity={0.8 + effectiveHoverIntensity * 0.6}
        color={persona.avatar.accentColor || "#00ffff"}
      />
      
      {/* Point light following the model for ethereal glow - enhanced on hover */}
      <pointLight
        position={[0, 0, -20]}
        intensity={1.2 + effectiveHoverIntensity * 0.8}
        color={persona.avatar.accentColor || "#00ffff"}
        distance={100 + effectiveHoverIntensity * 50}
        decay={2}
      />
      
      {/* Enhanced ambient light with persona atmosphere */}
      <ambientLight 
        intensity={0.15 + effectiveHoverIntensity * 0.1} 
        color={persona.theme.backgroundColor || "#1a1a2e"} 
      />
      
      {/* Atmospheric spot light for dramatic effect with hover intensity */}
      <spotLight
        position={[0, 50, -30]}
        angle={Math.PI / 6}
        penumbra={0.8}
        intensity={0.6 + effectiveHoverIntensity * 0.4}
        color={persona.avatar.primaryColor || "#ffffff"}
        castShadow
      />
      
      {/* Additional magical hover lighting */}
      {effectiveHoverIntensity > 0 && (
        <pointLight
          position={[0, 20, 0]}
          intensity={effectiveHoverIntensity * 2.0}
          color={persona.avatar.accentColor || "#ffffff"}
          distance={80}
          decay={1}
        />
      )}
    </group>
  )
}
