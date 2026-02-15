/**
 * MapLibre Expression Type Definitions
 * 
 * MapLibre uses JSON-based expressions for data-driven styling.
 * These types provide type safety for expression construction.
 */

// Property accessor types
export type GetExpression = ['get', string]
export type ZoomExpression = ['zoom']
export type PropertyAccessor = GetExpression | ZoomExpression

// Interpolation types
export type InterpolationType = 
  | ['linear']
  | ['exponential', number]
  | ['cubic-bezier', number, number, number, number]

// Interpolate expression for continuous values
export type InterpolateExpression = [
  'interpolate',
  InterpolationType,
  PropertyAccessor,
  ...Array<number | string>,
]

// Step expression for discrete classes
export type StepExpression = [
  'step',
  PropertyAccessor,
  unknown, // default value
  ...Array<number | string>,
]

// Literal value wrapper
export type LiteralExpression = ['literal', unknown]

// Base expression types
export type MapLibreExpression = 
  | InterpolateExpression
  | StepExpression
  | GetExpression
  | LiteralExpression
  | number
  | string
  | boolean

// Paint property value (can be static or expression)
export type PaintPropertyValue<T> = T | MapLibreExpression

// Specific expression for zoom-based radius
export type ZoomRadiusExpression = [
  'interpolate',
  ['linear'],
  ['zoom'],
  number, number, // zoom level 1, radius 1
  number, number, // zoom level 2, radius 2
  number, number,  // zoom level 3, radius 3
]
