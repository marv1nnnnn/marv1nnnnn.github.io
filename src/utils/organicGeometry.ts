import * as THREE from 'three'

// Simplex noise for organic deformation
class SimplexNoise {
  private perm: number[] = []
  
  constructor(seed: number = Math.random()) {
    for (let i = 0; i < 256; i++) {
      this.perm[i] = Math.floor(seed * 256)
      seed = (seed * 16807) % 2147483647
    }
  }
  
  noise3D(x: number, y: number, z: number): number {
    // Simplified 3D noise implementation
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    const Z = Math.floor(z) & 255
    
    x -= Math.floor(x)
    y -= Math.floor(y)
    z -= Math.floor(z)
    
    const u = this.fade(x)
    const v = this.fade(y)
    const w = this.fade(z)
    
    const A = this.perm[X] + Y
    const AA = this.perm[A] + Z
    const AB = this.perm[A + 1] + Z
    const B = this.perm[X + 1] + Y
    const BA = this.perm[B] + Z
    const BB = this.perm[B + 1] + Z
    
    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.perm[AA], x, y, z), this.grad(this.perm[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.perm[AB], x, y - 1, z), this.grad(this.perm[BB], x - 1, y - 1, z))
      ),
      this.lerp(v,
        this.lerp(u, this.grad(this.perm[AA + 1], x, y, z - 1), this.grad(this.perm[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.perm[AB + 1], x, y - 1, z - 1), this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1))
      )
    )
  }
  
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }
  
  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a)
  }
  
  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15
    const u = h < 8 ? x : y
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }
}

// Create organic blob geometry
export function createBlobGeometry(
  radius: number = 1,
  detail: number = 4,
  blobiness: number = 0.3,
  seed: number = Math.random()
): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, detail)
  const positions = geometry.attributes.position
  const noise = new SimplexNoise(seed)
  
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    
    // Get noise value
    const noiseScale = 2.0
    const noiseValue = noise.noise3D(x * noiseScale, y * noiseScale, z * noiseScale)
    
    // Calculate displacement
    const length = Math.sqrt(x * x + y * y + z * z)
    const displacement = 1 + noiseValue * blobiness
    
    // Apply displacement
    positions.setXYZ(
      i,
      (x / length) * radius * displacement,
      (y / length) * radius * displacement,
      (z / length) * radius * displacement
    )
  }
  
  geometry.computeVertexNormals()
  return geometry
}

// Create flowing tentacle geometry
export function createTentacleGeometry(
  length: number = 3,
  radius: number = 0.2,
  segments: number = 32,
  radialSegments: number = 8,
  twist: number = 2,
  taper: number = 0.7
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.5, length * 0.3, 0.2),
    new THREE.Vector3(-0.3, length * 0.6, -0.3),
    new THREE.Vector3(0.2, length * 0.9, 0.4),
    new THREE.Vector3(0, length, 0)
  ])
  
  const geometry = new THREE.TubeGeometry(curve, segments, radius, radialSegments, false)
  const positions = geometry.attributes.position
  
  // Apply tapering and twisting
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i)
    const progress = y / length
    
    // Taper
    const currentRadius = radius * (1 - progress * (1 - taper))
    const x = positions.getX(i)
    const z = positions.getZ(i)
    const angle = Math.atan2(z, x)
    const distance = Math.sqrt(x * x + z * z)
    const scaledDistance = (distance / radius) * currentRadius
    
    // Twist
    const twistAngle = progress * twist * Math.PI * 2
    const newAngle = angle + twistAngle
    
    positions.setXYZ(
      i,
      Math.cos(newAngle) * scaledDistance,
      y,
      Math.sin(newAngle) * scaledDistance
    )
  }
  
  geometry.computeVertexNormals()
  return geometry
}

// Create morphing plasma geometry
export function createPlasmaGeometry(
  radius: number = 1.5,
  detail: number = 5,
  time: number = 0
): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(radius, detail)
  const positions = geometry.attributes.position
  const noise = new SimplexNoise()
  
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    
    // Multiple octaves of noise for complex deformation
    let displacement = 0
    let amplitude = 1
    let frequency = 1
    
    for (let octave = 0; octave < 4; octave++) {
      displacement += noise.noise3D(
        x * frequency + time * 0.2,
        y * frequency + time * 0.15,
        z * frequency + time * 0.1
      ) * amplitude
      
      amplitude *= 0.5
      frequency *= 2
    }
    
    // Apply displacement
    const length = Math.sqrt(x * x + y * y + z * z)
    const newRadius = radius + displacement * 0.3
    
    positions.setXYZ(
      i,
      (x / length) * newRadius,
      (y / length) * newRadius,
      (z / length) * newRadius
    )
  }
  
  geometry.computeVertexNormals()
  return geometry
}

// Create strange attractor geometry (Lorenz attractor)
export function createStrangeAttractorGeometry(
  scale: number = 0.1,
  points: number = 10000,
  sigma: number = 10,
  rho: number = 28,
  beta: number = 8/3
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(points * 3)
  
  let x = 0.1
  let y = 0
  let z = 0
  const dt = 0.01
  
  for (let i = 0; i < points; i++) {
    // Lorenz equations
    const dx = sigma * (y - x) * dt
    const dy = (x * (rho - z) - y) * dt
    const dz = (x * y - beta * z) * dt
    
    x += dx
    y += dy
    z += dz
    
    positions[i * 3] = x * scale
    positions[i * 3 + 1] = y * scale
    positions[i * 3 + 2] = z * scale
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geometry
}

// Create flowing organic mesh with animated vertices
export class OrganicMesh extends THREE.Mesh {
  private basePositions: Float32Array
  private time: number = 0
  private noise: SimplexNoise
  public deformationIntensity: number = 0.2
  public flowSpeed: number = 1.0
  
  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material | THREE.Material[]
  ) {
    super(geometry, material)
    
    // Store original positions
    const positions = this.geometry.attributes.position
    this.basePositions = new Float32Array(positions.array)
    this.noise = new SimplexNoise()
  }
  
  update(deltaTime: number) {
    this.time += deltaTime * this.flowSpeed
    
    const positions = this.geometry.attributes.position
    
    for (let i = 0; i < positions.count; i++) {
      const x = this.basePositions[i * 3]
      const y = this.basePositions[i * 3 + 1]
      const z = this.basePositions[i * 3 + 2]
      
      // Generate flowing noise
      const noiseX = this.noise.noise3D(x * 2 + this.time, y * 2, z * 2) * this.deformationIntensity
      const noiseY = this.noise.noise3D(x * 2, y * 2 + this.time, z * 2) * this.deformationIntensity
      const noiseZ = this.noise.noise3D(x * 2, y * 2, z * 2 + this.time) * this.deformationIntensity
      
      positions.setXYZ(
        i,
        x + noiseX,
        y + noiseY,
        z + noiseZ
      )
    }
    
    positions.needsUpdate = true
    this.geometry.computeVertexNormals()
  }
}

// Create iridescent material for organic shapes
export function createIridescentMaterial(
  baseColor: string,
  emissiveColor: string,
  opacity: number = 0.8
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: baseColor,
    emissive: emissiveColor,
    emissiveIntensity: 0.2,
    metalness: 0.3,
    roughness: 0.2,
    transmission: 0.5,
    thickness: 0.5,
    transparent: true,
    opacity: opacity,
    ior: 1.5,
    iridescence: 1.0,
    iridescenceIOR: 2.0,
    iridescenceThicknessRange: [100, 400],
    sheen: 1.0,
    sheenRoughness: 0.3,
    sheenColor: new THREE.Color(emissiveColor),
    clearcoat: 0.5,
    clearcoatRoughness: 0.1
  })
}