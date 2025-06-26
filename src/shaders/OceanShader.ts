// Digital Ocean Shader for marv1nnnnn's Personal Interface
// Simple, clean digital ocean with stable movement

export const oceanVertexShader = `
  uniform float uTime;
  uniform float uBigWavesElevation;
  uniform float uBigWavesFrequency;
  uniform float uSmallWavesElevation;
  uniform float uSmallWavesFrequency;
  uniform float uSmallWavesSpeed;
  uniform float uBigWavesSpeed;
  uniform float uSwellElevation;
  uniform float uSwellFrequency;
  uniform float uSwellSpeed;
  uniform float u_glitchLevel;
  uniform float uChaosLevel;
  uniform float uWaveComplexity;

  varying float vElevation;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  varying vec3 vWorldPosition;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec2 pos = modelPosition.xz;
    
    // Wave displacement with atmospheric intensity effects
    float bigWaves = sin(pos.x * uBigWavesFrequency + uTime * uBigWavesSpeed) * 
                    cos(pos.y * uBigWavesFrequency * 0.7 + uTime * uBigWavesSpeed * 0.8) * 
                    uBigWavesElevation;
    
    float smallWaves = sin(pos.x * uSmallWavesFrequency + uTime * uSmallWavesSpeed) * 
                      sin(pos.y * uSmallWavesFrequency * 0.9 + uTime * uSmallWavesSpeed * 0.7) * 
                      uSmallWavesElevation;
    
    float swell = sin(pos.x * uSwellFrequency + uTime * uSwellSpeed) * 
                 cos(pos.y * uSwellFrequency * 0.6 + uTime * uSwellSpeed * 0.9) * 
                 uSwellElevation;
    
    // Add complexity and chaos effects
    float complexity = uWaveComplexity;
    float chaos = uChaosLevel;
    
    // Additional wave complexity based on atmospheric intensity
    float complexWaves = sin(pos.x * uBigWavesFrequency * complexity + uTime * uBigWavesSpeed * 1.5) * 
                        cos(pos.y * uSmallWavesFrequency * complexity + uTime * uSmallWavesSpeed * 1.2) * 
                        uBigWavesElevation * 0.3 * complexity;
    
    // Chaos displacement for storm effects
    float chaosDisplacement = sin(pos.x * 0.1 + uTime * 2.0) * 
                             cos(pos.y * 0.08 + uTime * 1.8) * 
                             chaos * 0.5;
    
    // Combine all wave components
    float totalDisplacement = bigWaves + smallWaves + swell + complexWaves + chaosDisplacement;
    
    // Apply displacement
    modelPosition.y += totalDisplacement;
    
    // Calculate simple normal using finite differences
    float offset = 0.1;
    
    // Calculate displacement at offset positions for normal calculation
    vec2 posX = vec2(pos.x + offset, pos.y);
    vec2 posZ = vec2(pos.x, pos.y + offset);
    
    float displX = sin(posX.x * uBigWavesFrequency + uTime * uBigWavesSpeed) * 
                   cos(posX.y * uBigWavesFrequency * 0.7 + uTime * uBigWavesSpeed * 0.8) * 
                   uBigWavesElevation +
                   sin(posX.x * uSmallWavesFrequency + uTime * uSmallWavesSpeed) * 
                   sin(posX.y * uSmallWavesFrequency * 0.9 + uTime * uSmallWavesSpeed * 0.7) * 
                   uSmallWavesElevation +
                   sin(posX.x * uSwellFrequency + uTime * uSwellSpeed) * 
                   cos(posX.y * uSwellFrequency * 0.6 + uTime * uSwellSpeed * 0.9) * 
                   uSwellElevation +
                   sin(posX.x * uBigWavesFrequency * complexity + uTime * uBigWavesSpeed * 1.5) * 
                   cos(posX.y * uSmallWavesFrequency * complexity + uTime * uSmallWavesSpeed * 1.2) * 
                   uBigWavesElevation * 0.3 * complexity +
                   sin(posX.x * 0.1 + uTime * 2.0) * cos(posX.y * 0.08 + uTime * 1.8) * chaos * 0.5;
    
    float displZ = sin(posZ.x * uBigWavesFrequency + uTime * uBigWavesSpeed) * 
                   cos(posZ.y * uBigWavesFrequency * 0.7 + uTime * uBigWavesSpeed * 0.8) * 
                   uBigWavesElevation +
                   sin(posZ.x * uSmallWavesFrequency + uTime * uSmallWavesSpeed) * 
                   sin(posZ.y * uSmallWavesFrequency * 0.9 + uTime * uSmallWavesSpeed * 0.7) * 
                   uSmallWavesElevation +
                   sin(posZ.x * uSwellFrequency + uTime * uSwellSpeed) * 
                   cos(posZ.y * uSwellFrequency * 0.6 + uTime * uSwellSpeed * 0.9) * 
                   uSwellElevation +
                   sin(posZ.x * uBigWavesFrequency * complexity + uTime * uBigWavesSpeed * 1.5) * 
                   cos(posZ.y * uSmallWavesFrequency * complexity + uTime * uSmallWavesSpeed * 1.2) * 
                   uBigWavesElevation * 0.3 * complexity +
                   sin(posZ.x * 0.1 + uTime * 2.0) * cos(posZ.y * 0.08 + uTime * 1.8) * chaos * 0.5;
    
    // Calculate tangent vectors
    vec3 tangentX = normalize(vec3(offset, displX - totalDisplacement, 0.0));
    vec3 tangentZ = normalize(vec3(0.0, displZ - totalDisplacement, offset));
    
    // Calculate normal
    vec3 surfaceNormal = normalize(cross(tangentZ, tangentX));
    
    vElevation = totalDisplacement;
    vUv = uv;
    vNormal = normalize((normalMatrix * surfaceNormal));
    vWorldPosition = modelPosition.xyz;
    
    vec4 viewPosition = viewMatrix * modelPosition;
    vViewDirection = normalize(-viewPosition.xyz);
    
    gl_Position = projectionMatrix * viewPosition;
  }
`;

export const oceanFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorDeep;
  uniform vec3 uColorSurface;
  uniform vec3 uColorFoam;
  uniform float uScatterIntensity;
  uniform float u_glitchLevel;
  uniform float uFoamCoverage;
  uniform float uStormIntensity;

  varying float vElevation;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  varying vec3 vWorldPosition;

  void main() {
    // Clean, stable color palette
    vec3 deepColor = vec3(0.05, 0.02, 0.15); // Deep purple-blue
    vec3 midColor = vec3(0.1, 0.05, 0.25); // Mid purple
    vec3 surfaceColor = vec3(0.15, 0.1, 0.35); // Lighter purple
    vec3 highlightColor = vec3(0.25, 0.2, 0.5); // Purple highlights
    
    // Calculate normal and view direction
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDirection);
    
    // Simple Fresnel effect
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    
    // Simple elevation-based color mixing - stable boundaries
    float elevationFactor = clamp(vElevation * 0.5 + 0.5, 0.0, 1.0);
    
    // Smooth color transitions
    vec3 waterColor = mix(deepColor, midColor, elevationFactor);
    waterColor = mix(waterColor, surfaceColor, elevationFactor * elevationFactor);
    
    // Apply Fresnel reflection
    waterColor = mix(waterColor, highlightColor, fresnel * 0.3);
    
    // Dynamic foam based on atmospheric intensity
    float baseFoamThreshold = 0.7 - (uFoamCoverage * 0.3); // Lower threshold = more foam
    float foamStrength = smoothstep(baseFoamThreshold, 1.0, elevationFactor);
    foamStrength *= (1.0 + uFoamCoverage * 0.8); // Intensity multiplier
    
    vec3 foamColor = vec3(0.4, 0.3, 0.6);
    vec3 finalColor = mix(waterColor, foamColor, foamStrength * 0.5);
    
    // Simple subsurface scattering
    float backlight = max(0.0, dot(normal, -viewDir));
    finalColor += vec3(0.05, 0.03, 0.1) * backlight * uScatterIntensity;
    
    // Enhanced glitch effects - smooth and gentle
    if (u_glitchLevel > 0.0) {
      float glitchNoise = sin(vWorldPosition.x * 1.0 + uTime * 0.3) * 
                         sin(vWorldPosition.z * 1.0 + uTime * 0.2);
      glitchNoise = glitchNoise * 0.5 + 0.5; // Normalize to 0-1
      glitchNoise = smoothstep(0.6, 0.9, glitchNoise); // Smooth transition instead of hard step
      vec3 glitchColor = vec3(0.15, 0.05, 0.2); // Reduced intensity
      finalColor = mix(finalColor, glitchColor, glitchNoise * u_glitchLevel * 0.15);
    }
    
    // Storm intensity effects - smooth and gentle
    if (uStormIntensity > 0.0) {
      // Add storm coloring - darker, more turbulent
      vec3 stormColor = vec3(0.02, 0.01, 0.08);
      finalColor = mix(finalColor, stormColor, uStormIntensity * 0.2);
      
      // Add gentle storm ambience instead of harsh flashes
      float stormAmbience = sin(uTime * 0.3) * sin(uTime * 0.7) * 0.5 + 0.5;
      stormAmbience = smoothstep(0.3, 0.7, stormAmbience) * uStormIntensity;
      finalColor += vec3(0.02, 0.01, 0.03) * stormAmbience * 0.3;
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;