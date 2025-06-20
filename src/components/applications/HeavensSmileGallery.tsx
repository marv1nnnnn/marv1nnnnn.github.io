'use client'

import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { OrbitControls, Text, Box, Sphere, Cone } from '@react-three/drei'
import * as THREE from 'three'
import { type ProjectTarget } from '@/types'
import { gsap } from 'gsap'

// Extend Three.js objects for JSX usage
extend({ 
  Mesh: THREE.Mesh,
  BoxGeometry: THREE.BoxGeometry,
  SphereGeometry: THREE.SphereGeometry,
  ConeGeometry: THREE.ConeGeometry,
  TorusGeometry: THREE.TorusGeometry,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  MeshBasicMaterial: THREE.MeshBasicMaterial,
  Group: THREE.Group,
  AmbientLight: THREE.AmbientLight,
  PointLight: THREE.PointLight,
  SpotLight: THREE.SpotLight,
})

interface HeavensSmileGalleryProps {
  windowId: string
}

// Portfolio projects as 3D targets
const PROJECT_TARGETS: ProjectTarget[] = [
  {
    id: 'web-portfolio',
    title: 'Personal Portfolio Website',
    description: 'A modern portfolio built with Next.js and TypeScript',
    technologies: ['Next.js', 'TypeScript', 'React', 'CSS'],
    links: {
      demo: 'https://example.com',
      github: 'https://github.com/user/portfolio',
    },
    position: { x: -3, y: 2, z: -1 },
    rotation: { x: 0, y: 0.5, z: 0 },
    color: '#0066cc',
    shape: 'cube',
  },
  {
    id: 'ecommerce-app',
    title: 'E-commerce Platform',
    description: 'Full-stack e-commerce solution with payment integration',
    technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    links: {
      demo: 'https://example.com/shop',
      github: 'https://github.com/user/ecommerce',
    },
    position: { x: 3, y: -1, z: 2 },
    rotation: { x: 0.2, y: -0.3, z: 0 },
    color: '#cc0000',
    shape: 'sphere',
  },
  {
    id: 'ai-chatbot',
    title: 'AI Chatbot Interface',
    description: 'Intelligent chatbot with natural language processing',
    technologies: ['Python', 'OpenAI', 'FastAPI', 'React'],
    links: {
      demo: 'https://example.com/chat',
      github: 'https://github.com/user/chatbot',
    },
    position: { x: 0, y: 3, z: -2 },
    rotation: { x: 0.1, y: 0, z: 0.1 },
    color: '#cccc66',
    shape: 'pyramid',
  },
  {
    id: 'data-viz',
    title: 'Data Visualization Dashboard',
    description: 'Interactive dashboard for complex data analysis',
    technologies: ['D3.js', 'Vue.js', 'Python', 'PostgreSQL'],
    links: {
      demo: 'https://example.com/dashboard',
      github: 'https://github.com/user/dataviz',
    },
    position: { x: -2, y: -2, z: 1 },
    rotation: { x: 0, y: 0.8, z: 0 },
    color: '#999999',
    shape: 'torus',
  },
]

function ProjectTarget({ target, isSelected, onClick }: { 
  target: ProjectTarget
  isSelected: boolean
  onClick: () => void 
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = target.position.y + Math.sin(state.clock.elapsedTime + target.position.x) * 0.1
      
      // Rotation animation
      if (!isSelected) {
        meshRef.current.rotation.y += 0.005
      } else {
        meshRef.current.rotation.y += 0.02
        meshRef.current.rotation.x += 0.01
      }
    }
  })

  const renderShape = () => {
    const color = isSelected ? '#ffffff' : hovered ? target.color : target.color
    const scale = isSelected ? 1.2 : hovered ? 1.1 : 1
    const emissive = isSelected ? 0.2 : hovered ? 0.1 : 0

    switch (target.shape) {
      case 'cube':
        return (
          <Box args={[1, 1, 1]} scale={scale}>
            <meshStandardMaterial 
              color={color} 
              emissive={color}
              emissiveIntensity={emissive}
              wireframe={isSelected}
            />
          </Box>
        )
      case 'sphere':
        return (
          <Sphere args={[0.6]} scale={scale}>
            <meshStandardMaterial 
              color={color} 
              emissive={color}
              emissiveIntensity={emissive}
              wireframe={isSelected}
            />
          </Sphere>
        )
      case 'pyramid':
        return (
          <Cone args={[0.6, 1.2, 4]} scale={scale}>
            <meshStandardMaterial 
              color={color} 
              emissive={color}
              emissiveIntensity={emissive}
              wireframe={isSelected}
            />
          </Cone>
        )
      case 'torus':
        return (
          <mesh scale={scale}>
            <torusGeometry args={[0.6, 0.25, 8, 16]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color}
              emissiveIntensity={emissive}
              wireframe={isSelected}
            />
          </mesh>
        )
      default:
        return (
          <Box args={[1, 1, 1]} scale={scale}>
            <meshStandardMaterial color={color} />
          </Box>
        )
    }
  }

  return (
    <group
      ref={meshRef}
      position={[target.position.x, target.position.y, target.position.z]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {renderShape()}
      
      {(isSelected || hovered) && (
        <Text
          position={[0, -1.5, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {target.title}
        </Text>
      )}
    </group>
  )
}

function TargetingReticle() {
  const reticleRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (reticleRef.current) {
      reticleRef.current.rotation.z += 0.01
    }
  })

  return (
    <group ref={reticleRef}>
      {/* Crosshair lines */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 0.02, 0.02]} />
        <meshBasicMaterial color="#cc0000" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.02, 2, 0.02]} />
        <meshBasicMaterial color="#cc0000" transparent opacity={0.8} />
      </mesh>
      
      {/* Corner brackets */}
      {[-0.8, 0.8].map((x, i) =>
        [-0.8, 0.8].map((y, j) => (
          <group key={`${i}-${j}`} position={[x, y, 0]}>
            <mesh position={[x > 0 ? -0.1 : 0.1, 0, 0]}>
              <boxGeometry args={[0.2, 0.02, 0.02]} />
              <meshBasicMaterial color="#cc0000" transparent opacity={0.6} />
            </mesh>
            <mesh position={[0, y > 0 ? -0.1 : 0.1, 0]}>
              <boxGeometry args={[0.02, 0.2, 0.02]} />
              <meshBasicMaterial color="#cc0000" transparent opacity={0.6} />
            </mesh>
          </group>
        ))
      )}
    </group>
  )
}

export default function HeavensSmileGallery({ }: HeavensSmileGalleryProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [soulShells, setSoulShells] = useState(0)
  const [targetingMode, setTargetingMode] = useState(true)
  const galleryRef = useRef<HTMLDivElement>(null)

  const selectedProject = selectedTarget ? PROJECT_TARGETS.find(t => t.id === selectedTarget) : null

  useEffect(() => {
    // Gallery entrance animation
    if (galleryRef.current) {
      const elements = galleryRef.current.querySelectorAll('.gallery-header, .gallery-content')
      gsap.fromTo(elements,
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out"
        }
      )
    }
  }, [])

  const handleTargetClick = (targetId: string) => {
    if (selectedTarget === targetId) {
      // "Destroy" target - award soul shell
      setSoulShells(prev => prev + 1)
      setSelectedTarget(null)
      
      // Target respawns after 3 seconds
      setTimeout(() => {
        // Target respawns
      }, 3000)
    } else {
      setSelectedTarget(targetId)
    }
  }

  return (
    <div ref={galleryRef} className="heavens-smile-gallery">
      <div className="gallery-header">
        <div className="target-info">
          <div className="info-line">HEAVEN'S SMILE TARGETING SYSTEM v1.0</div>
          <div className="info-line">STATUS: {targetingMode ? 'HUNTING' : 'OBSERVING'}</div>
          <div className="info-line">SOUL SHELLS: {soulShells.toString().padStart(3, '0')}</div>
          <div className="info-line">TARGETS: {PROJECT_TARGETS.length} DETECTED</div>
        </div>
        
        <div className="mode-controls">
          <button 
            className={`mode-btn ${targetingMode ? 'active' : ''}`}
            onClick={() => setTargetingMode(true)}
          >
            TARGETING MODE
          </button>
          <button 
            className={`mode-btn ${!targetingMode ? 'active' : ''}`}
            onClick={() => setTargetingMode(false)}
          >
            INSPECT MODE
          </button>
        </div>
      </div>

      <div className="gallery-main">
        <div className="gallery-viewport">
          <Canvas 
            camera={{ position: [0, 0, 8], fov: 60 }}
            style={{ background: 'linear-gradient(180deg, #000000 0%, #111111 100%)' }}
          >
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={0.8} color="#0066cc" />
            <pointLight position={[-10, -10, 5]} intensity={0.6} color="#cc0000" />
            <spotLight 
              position={[0, 0, 10]} 
              angle={0.3} 
              penumbra={0.5} 
              intensity={1}
              color="#ffffff"
            />

            {PROJECT_TARGETS.map(target => (
              <ProjectTarget
                key={target.id}
                target={target}
                isSelected={selectedTarget === target.id}
                onClick={() => handleTargetClick(target.id)}
              />
            ))}

            {targetingMode && <TargetingReticle />}
            
            <OrbitControls 
              enablePan={!targetingMode}
              enableZoom={true}
              enableRotate={true}
              autoRotate={!selectedTarget}
              autoRotateSpeed={0.5}
            />
          </Canvas>
        </div>

        {selectedProject && (
          <div className="project-details">
            <div className="details-header">
              <div className="project-title">{selectedProject.title}</div>
              <div className="project-status">
                [TARGET ACQUIRED]
              </div>
            </div>
            
            <div className="project-description">
              {selectedProject.description}
            </div>
            
            <div className="technologies">
              <div className="tech-label">TECH STACK:</div>
              <div className="tech-list">
                {selectedProject.technologies.map(tech => (
                  <span key={tech} className="tech-tag">{tech}</span>
                ))}
              </div>
            </div>
            
            <div className="project-links">
              {selectedProject.links.demo && (
                <a href={selectedProject.links.demo} className="project-link" target="_blank" rel="noopener noreferrer">
                  LIVE DEMO
                </a>
              )}
              {selectedProject.links.github && (
                <a href={selectedProject.links.github} className="project-link" target="_blank" rel="noopener noreferrer">
                  SOURCE CODE
                </a>
              )}
            </div>
            
            <div className="targeting-action">
              <button 
                className="destroy-btn"
                onClick={() => handleTargetClick(selectedProject.id)}
              >
                ELIMINATE TARGET
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .heavens-smile-gallery {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--color-void);
          color: var(--color-light);
          font-family: var(--font-system);
        }

        .gallery-header {
          padding: var(--space-base);
          border-bottom: 1px solid var(--color-light);
          background: var(--color-shadow);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-line {
          font-size: var(--font-size-xs);
          color: var(--color-info);
          margin-bottom: 2px;
        }

        .mode-controls {
          display: flex;
          gap: var(--space-xs);
        }

        .mode-btn {
          padding: var(--space-xs) var(--space-sm);
          background: var(--color-void);
          border: 1px solid var(--color-light);
          color: var(--color-light);
          font-family: var(--font-system);
          font-size: var(--font-size-xs);
          cursor: crosshair;
          transition: all 0.1s ease;
        }

        .mode-btn:hover {
          background: var(--color-light);
          color: var(--color-void);
        }

        .mode-btn.active {
          background: var(--color-blood);
          border-color: var(--color-blood);
        }

        .gallery-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .gallery-viewport {
          flex: 1;
          position: relative;
          cursor: crosshair;
        }

        .project-details {
          width: 300px;
          border-left: 1px solid var(--color-light);
          background: var(--color-shadow);
          padding: var(--space-base);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-base);
        }

        .details-header {
          border-bottom: 1px solid var(--color-grey-dark);
          padding-bottom: var(--space-sm);
        }

        .project-title {
          font-weight: bold;
          color: var(--color-light);
          margin-bottom: var(--space-xs);
        }

        .project-status {
          font-size: var(--font-size-xs);
          color: var(--color-blood);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .project-description {
          font-size: var(--font-size-sm);
          line-height: 1.4;
          color: var(--color-grey-light);
        }

        .tech-label {
          font-size: var(--font-size-xs);
          color: var(--color-info);
          font-weight: bold;
          margin-bottom: var(--space-xs);
        }

        .tech-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        .tech-tag {
          background: var(--color-void);
          color: var(--color-unease);
          padding: 2px var(--space-xs);
          font-size: var(--font-size-xs);
          border: 1px solid var(--color-grey-dark);
        }

        .project-links {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .project-link {
          display: block;
          padding: var(--space-sm);
          background: var(--color-info);
          color: var(--color-void);
          text-decoration: none;
          text-align: center;
          font-size: var(--font-size-xs);
          font-weight: bold;
          transition: all 0.1s ease;
        }

        .project-link:hover {
          background: var(--color-light);
          transform: translate(-1px, -1px);
          box-shadow: 2px 2px 0 var(--color-shadow);
        }

        .targeting-action {
          margin-top: auto;
        }

        .destroy-btn {
          width: 100%;
          padding: var(--space-base);
          background: var(--color-blood);
          border: 2px solid var(--color-light);
          color: var(--color-light);
          font-family: var(--font-system);
          font-size: var(--font-size-sm);
          font-weight: bold;
          cursor: crosshair;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.1s ease;
        }

        .destroy-btn:hover {
          background: var(--color-light);
          color: var(--color-blood);
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 var(--color-blood);
        }
      `}</style>
    </div>
  )
}