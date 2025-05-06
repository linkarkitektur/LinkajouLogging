/* eslint-disable prefer-const */
import chroma from 'chroma-js'

export const baseColors = {
  primaryGreen: 'hsl(140, 37%, 75%)',
  primaryYellow: 'hsl(44, 84%, 83%)',
  primaryRed: 'hsl(0, 35%, 74%)',
  primaryGrey: 'hsl(0, 0%, 87%)',
  modelRed: 'hsl(0, 40%, 60%)',
  modelGreen: 'hsl(100, 40%, 60%)',
  modelYellow: 'hsl(60, 40%, 60%)'
}

const fontColors = {
  white: 'text-gray-200',
  black: 'text-gray-700',
}

export class ColorManager {
  private colorSets: { [key: string]: string[] } = {
    base: [
      'hsl(14, 23%, 53%)',
      'hsl(22, 33%, 64%)',
      'hsl(25, 24%, 63%)',
      'hsl(37, 26%, 75%)',
      'hsl(50, 35%, 83%)',
      'hsl(42, 21%, 73%)',
      'hsl(84, 11%, 69%)',
      'hsl(70, 4%, 63%)',
      'hsl(204, 3%, 56%)',
      'hsl(209, 23%, 32%)',
      'hsl(211, 21%, 47%)',
      'hsl(232, 12%, 63%)',
      'hsl(340, 14%, 38%)',
      'hsl(330, 17%, 46%)'
    ],  
    pastels: [
      'hsl(140, 37%, 75%)', 
      'hsl(165, 31%, 80%)', 
      'hsl(44, 84%, 83%)',  
      'hsl(26, 56%, 77%)',  
      'hsl(0, 35%, 74%)',   
      'hsl(221, 24%, 76%)', 
      'hsl(156, 21%, 79%)', 
      'hsl(30, 36%, 83%)',  
      'hsl(27, 60%, 89%)',  
      'hsl(187, 25%, 89%)'  
    ]
  }
  
  private activeSet: string = 'pastels'
  private colorIndex: number = 0

  public switchColorSet(setName: string): void {
    if (this.colorSets[setName]) {
      this.activeSet = setName
      this.colorIndex = 0
    } else {
      console.warn(`Color set "${setName}" does not exist.`)
    }
  }

  private getCurrentColors(): string[] {
    return this.colorSets[this.activeSet]
  }

  public getNextColor(): string {
    const colors = this.getCurrentColors()
    const color = colors[this.colorIndex % colors.length]
    this.colorIndex++
    return color
  }

  public getMostDistinctColors(count: number): string[] {
    const colors = this.getCurrentColors()
    if (count > colors.length)
      return interpolateColors(colors, count)
    
    const distinctColors: string[] = [colors[0]]
    for (let i = 1; i < count; i++) {
      let maxDistance = -1
      let nextColor = ''

      for (const color of colors) {
        if (!distinctColors.includes(color)) {
          const minDistToSet = Math.min(
            ...distinctColors.map(selected =>
              this.calculateColorDistanceHSL(selected, color)
            )
          )
          if (minDistToSet > maxDistance) {
            maxDistance = minDistToSet
            nextColor = color
          }
        }
      }
      distinctColors.push(nextColor)
    }

    return distinctColors
  }

  private rgbStringToArray(rgb: string): number[] {
    const result = rgb.match(/\d+/g)
    return result ? result.map(Number) : [0, 0, 0]
  }

  private rgbToHsl(rgb: string): number[] {
    const [r, g, b] = this.rgbStringToArray(rgb).map(v => v / 255)
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s, l = (max + min) / 2

    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: 
          h = (g - b) / d + (g < b ? 6 : 0) 
          break
        case g: 
          h = (b - r) / d + 2 
          break
        case b: 
          h = (r - g) / d + 4 
          break      
      }
      h /= 6
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
  }

  private calculateColorDistanceHSL(color1: string, color2: string): number {
    const [h1, s1, l1] = this.rgbToHsl(color1)
    const [h2, s2, l2] = this.rgbToHsl(color2)

    return Math.sqrt(
      Math.pow(h1 - h2, 2) + Math.pow(s1 - s2, 2) + Math.pow(l1 - l2, 2)
    )
  }

  public resetColorIndex(index: number = 0): void {
    this.colorIndex = index
  }
}

export function interpolateColors(colors: string[], targetCount: number): string[] {
  if (colors.length >= targetCount) return colors
  if (colors.length === 0) return []
  if (colors.length === 1) return Array(targetCount).fill(colors[0])

  const result: string[] = []
  const segmentsNeeded = Math.ceil(targetCount / (colors.length - 1))

  for (let i = 0; i < colors.length - 1; i++) {
    const color1 = colors[i]
    const color2 = colors[i + 1]

    result.push(color1)

    for (let j = 1; j < segmentsNeeded && result.length < targetCount; j++) {
      const ratio = j / segmentsNeeded
      const interpolated = chroma.mix(color1, color2, ratio, 'hsl').hsl()
      result.push(`hsl(${Math.round(interpolated[0] || 0)}, ${Math.round(interpolated[1] * 100)}%, ${Math.round(interpolated[2] * 100)}%)`)
    }
  }

  if (result.length < targetCount) {
    result.push(colors[colors.length - 1])
  }

  return result.slice(0, targetCount)
}

export function getFontColorForHSL(hsl: string): string {
  const hslValues = hsl.match(/\d+/g)?.map(Number)
  
  if (!hslValues || hslValues.length !== 3) {
    throw new Error('Invalid HSL format')
  }

  const lightness = hslValues[2]
  return lightness < 50 ? fontColors.white : fontColors.black
}

export function lightenHSLColor(hsl: string, amount: number): string {
  try {
    const matches = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
    if (!matches) {
      throw new Error('Invalid HSL format')
    }

    const brightened = chroma(hsl).brighten(amount).hsl()
    
    return `hsl(${Math.round(brightened[0] || 0)}, ${Math.round(brightened[1] * 100)}%, ${Math.round(brightened[2] * 100)}%)`
  } catch (error) {
    console.error('Error in lightenHSLColor:', error)
    return hsl 
  }
}

export function darkenHSLColor(hsl: string, amount: number): string {
  try {
    const matches = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
    if (!matches) {
      throw new Error('Invalid HSL format')
    }

    const darkened = chroma(hsl).darken(amount).hsl()
    
    return `hsl(${Math.round(darkened[0] || 0)}, ${Math.round(darkened[1] * 100)}%, ${Math.round(darkened[2] * 100)}%)`
  } catch (error) {
    console.error('Error in darkenHSLColor:', error)
    return hsl
  }
}

// Create and export a singleton instance
export const colorManager = new ColorManager()