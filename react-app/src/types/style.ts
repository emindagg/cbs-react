/**
 * Style Property Types
 * 
 * Type definitions for feature styling properties.
 */

export interface StyleProperties {
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  opacity?: number
  radius?: number
}

export function isStyleProperties(value: unknown): value is StyleProperties {
  if (typeof value !== 'object' || value === null) return false
  
  const style = value as Record<string, unknown>
  
  return (
    (style.fillColor === undefined || typeof style.fillColor === 'string') &&
    (style.strokeColor === undefined || typeof style.strokeColor === 'string') &&
    (style.strokeWidth === undefined || typeof style.strokeWidth === 'number') &&
    (style.opacity === undefined || typeof style.opacity === 'number') &&
    (style.radius === undefined || typeof style.radius === 'number')
  )
}
