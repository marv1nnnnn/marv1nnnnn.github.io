import { BRAIN_REGION_MAPPING } from '../config/brainMapping'

export interface RGBColor {
  r: number
  g: number
  b: number
}

/**
 * Convert hex color to RGB values (0-1 range)
 */
export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  }
}

/**
 * Convert RGB values (0-1 range) to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Calculate Euclidean distance between two RGB colors
 */
export function calculateColorDistance(color1: RGBColor, color2: RGBColor): number {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  )
}

/**
 * Find the closest brain region based on color similarity
 * Uses the actual colors from brainMapping.ts
 */
export function findClosestBrainRegion(clickedColor: RGBColor, tolerance: number = 0.2): string | null {
  let closestRegion: string | null = null
  let minDistance = Infinity

  // Create mapping from brainMapping colors
  const regionColors = Object.entries(BRAIN_REGION_MAPPING).map(([regionId, config]) => ({
    regionId,
    color: hexToRgb(config.color)
  }))

  console.log('Finding closest region for color:', clickedColor)
  console.log('Available region colors:', regionColors.map(rc => ({ 
    regionId: rc.regionId, 
    hex: BRAIN_REGION_MAPPING[rc.regionId].color,
    rgb: rc.color 
  })))

  // Find the closest match
  for (const { regionId, color } of regionColors) {
    const distance = calculateColorDistance(clickedColor, color)
    console.log(`Distance to ${regionId} (${BRAIN_REGION_MAPPING[regionId].color}):`, distance)
    
    if (distance < minDistance && distance <= tolerance) {
      minDistance = distance
      closestRegion = regionId
    }
  }

  console.log(`Closest region: ${closestRegion} (distance: ${minDistance})`)
  return closestRegion
}

/**
 * Get the RGB color for a brain region from brainMapping.ts
 */
export function getBrainRegionColor(regionId: string): RGBColor {
  const config = BRAIN_REGION_MAPPING[regionId]
  if (!config) {
    throw new Error(`Unknown brain region: ${regionId}`)
  }
  return hexToRgb(config.color)
}

/**
 * Get all brain region colors as RGB
 */
export function getAllBrainRegionColors(): Record<string, RGBColor> {
  const colors: Record<string, RGBColor> = {}
  
  Object.entries(BRAIN_REGION_MAPPING).forEach(([regionId, config]) => {
    colors[regionId] = hexToRgb(config.color)
  })
  
  return colors
}