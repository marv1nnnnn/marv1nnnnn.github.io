'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import gsap from 'gsap'

interface CameraControllerProps {
  targetPosition: [number, number, number]
  targetFov: number
  duration?: number
}

export default function CameraController({ 
  targetPosition, 
  targetFov, 
  duration = 1.5 
}: CameraControllerProps) {
  const { camera } = useThree()
  const isAnimating = useRef(false)

  useEffect(() => {
    if (isAnimating.current) return

    const currentPos = camera.position.clone()
    const targetPos = new Vector3(...targetPosition)
    const currentFov = camera.fov

    // Only animate if there's a significant change
    const positionDifference = currentPos.distanceTo(targetPos)
    const fovDifference = Math.abs(currentFov - targetFov)

    if (positionDifference > 0.1 || fovDifference > 0.1) {
      isAnimating.current = true

      // Animate camera position
      gsap.to(camera.position, {
        x: targetPosition[0],
        y: targetPosition[1], 
        z: targetPosition[2],
        duration,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.lookAt(0, 0, 0)
        },
        onComplete: () => {
          isAnimating.current = false
        }
      })

      // Animate field of view
      gsap.to(camera, {
        fov: targetFov,
        duration,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.updateProjectionMatrix()
        }
      })
    }
  }, [targetPosition, targetFov, duration, camera])

  return null
}