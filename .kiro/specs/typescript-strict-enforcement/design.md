# TypeScript Strict Mode Enforcement - Design Document

## Overview

This design addresses the elimination of all `any` type usage in the codebase to achieve full type safety. The project already has TypeScript strict mode enabled, but 5 instances of `any` remain, primarily in MapLibre expression handling and geometry type assertions.

The solution involves:
- Creating proper type definitions for MapLibre expressions (zoom-based interpolation)
- Implementing type guards for GeoJSON geometry types
- Defining proper types for style properties
- Upgrading ESLint configuration to enforce `no-explicit-any` as an error

## Architecture

### Type System Layers

```
┌─────────────────────────────────────────┐
│   Application Code                      │
│   (Renderers, Hooks, Components)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│   Type Definitions Layer                │
│   - MapLibre Expression Types           │
│   - GeoJSON Type Guards                 │
│   - Style Property Types                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│   External Libraries                    │
│   (MapLibre GL, GeoJSON)                │
└─────────────────────────────────────────┘
```

### Design Principles

1. **Type Safety First**: Replace `any` with precise types or `unknown` where appropriate
2. **Minimal Runtime Impact**: Type definitions should have zero runtime overhead
3. **Backward Compatibility**: No changes to existing APIs or behavior
4. **Maintainability**: Types should be reusable and well-documented

## Components and Interfaces

### 1. MapLibre Expression Types

MapLibre expressions are JSON arrays evaluated at runtime on the GPU. They follow a specific structure but lack comprehensive TypeScript types in the library.

```typescript
// Type definition for MapLibre expressions
type MapLibreExpression = 
  | ['interpolate', InterpolationType, ['zoom'], ...Array<number>]
  | ['step', PropertyAccessor, unknown, ...Array<number | string>]
  | ['get', string]
  | ['literal', unknown]
  | number
  | string
  | boolean

type InterpolationType = ['linear'] | ['exponential', number] | ['cubic-bezier', number, number, number, number]
type PropertyAccessor = ['get', string] | ['zoom']

// Specific type for zoom-based radius interpolation
type ZoomRadiusExpression = ['interpolate', ['linear'], ['zoom'], number, number, number, number, number, number]

// Paint property type that accepts expressions
type PaintPropertyValue<T> = T | MapLibreExpression
```

**Usage locations:**
- `PointRenderer.ts` line 155, 406, 416: `zoomRadius` expressions
- `BubbleRenderer.ts` line 183: color expressions
- `useVizRender.ts` line 34: `buildZoomRadius` return value

### 2. GeoJSON Geometry Type Guards

Type guards provide runtime type checking with TypeScript type narrowing.

```typescript
// Type guard functions for GeoJSON geometries
function isPolygon(geometry: GeoJSON.Geometry): geometry is GeoJSON.Polygon {
  return geometry.type === 'Polygon'
}

function isMultiPolygon(geometry: GeoJSON.Geometry): geometry is GeoJSON.MultiPolygon {
  return geometry.type === 'MultiPolygon'
}

function isPolygonOrMultiPolygon(
  geometry: GeoJSON.Geometry
): geometry is GeoJSON.Polygon | GeoJSON.MultiPolygon {
  return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon'
}

function isPoint(geometry: GeoJSON.Geometry): geometry is GeoJSON.Point {
  return geometry.type === 'Point'
}
```

**Usage locations:**
- `PointRenderer.ts` line 155: `geometry as any` → use `isPolygonOrMultiPolygon` guard
- `BubbleRenderer.ts` line 183: `geometry as any` → use type guard before `calculateCentroid`

### 3. Style Property Types

Define proper types for style properties used in DataLayer.

```typescript
// Style property interface
interface StyleProperties {
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  opacity?: number
  radius?: number
}

// Type guard for style properties
function isStyleProperties(value: unknown): value is StyleProperties {
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
```

**Usage location:**
- `DataLayer.tsx` line 19: `style as any` → use `isStyleProperties` guard with fallback to empty object

### 4. Implementation Strategy by File

#### PointRenderer.ts (3 instances)

**Line 155 - Geometry type assertion:**
```typescript
// Before:
const geometry = feature.geometry as any

// After:
const geometry = feature.geometry
if (!isPolygonOrMultiPolygon(geometry)) {
  continue
}
// TypeScript now knows geometry is Polygon | MultiPolygon
```

**Lines 406, 416 - Zoom radius expression:**
```typescript
// Before:
'circle-radius': zoomRadius as any

// After:
'circle-radius': zoomRadius as PaintPropertyValue<number>
```

#### BubbleRenderer.ts (1 instance)

**Line 183 - Geometry for centroid calculation:**
```typescript
// Before:
const centroid = calculateCentroid(feature.geometry as any)

// After:
const geometry = feature.geometry
if (!isPolygonOrMultiPolygon(geometry)) {
  return // Skip non-polygon features
}
const centroid = calculateCentroid(geometry)
```

#### useVizRender.ts (1 instance)

**Line 34 - setPaintProperty with expression:**
```typescript
// Before:
map.setPaintProperty('dot-circles', 'circle-radius', buildZoomRadius(dotSize) as any)

// After:
map.setPaintProperty('dot-circles', 'circle-radius', buildZoomRadius(dotSize) as PaintPropertyValue<number>)
```

#### DataLayer.tsx (1 instance)

**Line 19 - Style property access:**
```typescript
// Before:
const style = (i.properties.style || {}) as any

// After:
const rawStyle = i.properties.style
const style: StyleProperties = isStyleProperties(rawStyle) ? rawStyle : {}
```

## Data Models

### Type Definition File Structure

Create a new file: `src/types/maplibre-expressions.ts`

```typescript
/**
 * MapLibre Expression Type Definitions
 * 
 * MapLibre uses JSON-based expressions for data-driven styling.
 * These types provide type safety for expression construction.
 */

// Base expression types
export type MapLibreExpression = 
  | InterpolateExpression
  | StepExpression
  | GetExpression
  | LiteralExpression
  | number
  | string
  | boolean

// Interpolate expression for continuous values
export type InterpolateExpression = [
  'interpolate',
  InterpolationType,
  PropertyAccessor,
  ...Array<number | string>
]

// Step expression for discrete classes
export type StepExpression = [
  'step',
  PropertyAccessor,
  unknown, // default value
  ...Array<number | string>
]

// Property accessor
export type GetExpression = ['get', string]
export type ZoomExpression = ['zoom']
export type PropertyAccessor = GetExpression | ZoomExpression

// Interpolation types
export type InterpolationType = 
  | ['linear']
  | ['exponential', number]
  | ['cubic-bezier', number, number, number, number]

// Literal value wrapper
export type LiteralExpression = ['literal', unknown]

// Paint property value (can be static or expression)
export type PaintPropertyValue<T> = T | MapLibreExpression

// Specific expression for zoom-based radius
export type ZoomRadiusExpression = [
  'interpolate',
  ['linear'],
  ['zoom'],
  number, number, // zoom level 1, radius 1
  number, number, // zoom level 2, radius 2
  number, number  // zoom level 3, radius 3
]
```

### Geometry Type Guards File

Create a new file: `src/utils/geometryTypeGuards.ts`

```typescript
/**
 * GeoJSON Geometry Type Guards
 * 
 * Runtime type checking with TypeScript type narrowing for GeoJSON geometries.
 */

export function isPolygon(geometry: GeoJSON.Geometry): geometry is GeoJSON.Polygon {
  return geometry.type === 'Polygon'
}

export function isMultiPolygon(geometry: GeoJSON.Geometry): geometry is GeoJSON.MultiPolygon {
  return geometry.type === 'MultiPolygon'
}

export function isPolygonOrMultiPolygon(
  geometry: GeoJSON.Geometry
): geometry is GeoJSON.Polygon | GeoJSON.MultiPolygon {
  return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon'
}

export function isPoint(geometry: GeoJSON.Geometry): geometry is GeoJSON.Point {
  return geometry.type === 'Point'
}

export function isMultiPoint(geometry: GeoJSON.Geometry): geometry is GeoJSON.MultiPoint {
  return geometry.type === 'MultiPoint'
}

export function isLineString(geometry: GeoJSON.Geometry): geometry is GeoJSON.LineString {
  return geometry.type === 'LineString'
}

export function isMultiLineString(geometry: GeoJSON.Geometry): geometry is GeoJSON.MultiLineString {
  return geometry.type === 'MultiLineString'
}
```

### Style Properties Type

Add to existing types file or create: `src/types/style.ts`

```typescript
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
```

### Updated Function Signatures

**buildZoomRadius** in `src/features/viz-wizard/utils/dot-density.ts`:
```typescript
// Before:
export function buildZoomRadius(dotSize: number): unknown[]

// After:
import type { ZoomRadiusExpression } from '@/types/maplibre-expressions'
export function buildZoomRadius(dotSize: number): ZoomRadiusExpression
```

**buildStepExpression** and **buildInterpolateExpression** in `src/utils/mapExpressions.ts`:
```typescript
// Before:
export function buildStepExpression(...): unknown[]
export function buildInterpolateExpression(...): unknown[]

// After:
import type { StepExpression, InterpolateExpression } from '@/types/maplibre-expressions'
export function buildStepExpression(...): StepExpression
export function buildInterpolateExpression(...): InterpolateExpression
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No explicit `any` types in codebase

*For any* TypeScript file in the codebase, running ESLint with the `@typescript-eslint/no-explicit-any` rule should produce zero violations.

**Validates: Requirements AC-1.2**

### Property 2: MapLibre expression builders return typed values

*For any* MapLibre expression builder function (`buildZoomRadius`, `buildStepExpression`, `buildInterpolateExpression`), the return type should be a specific MapLibre expression type (not `unknown[]` or `any[]`).

**Validates: Requirements AC-1.3**

### Property 3: Type guards correctly narrow geometry types

*For any* GeoJSON geometry value, when a type guard function returns `true`, TypeScript should narrow the type to the specific geometry type (e.g., `isPolygon` narrows to `GeoJSON.Polygon`).

**Validates: Requirements AC-1.3**

## Error Handling

### Type Safety Errors

**Scenario**: Code attempts to use `any` type
- **Detection**: ESLint rule `@typescript-eslint/no-explicit-any` set to `error` level
- **Response**: Build fails with clear error message indicating the file and line
- **Recovery**: Developer must replace `any` with proper type or `unknown`

**Scenario**: Geometry type mismatch
- **Detection**: Type guard returns `false` for unexpected geometry type
- **Response**: Skip processing the feature and continue with next feature
- **Recovery**: Log warning with feature identifier for debugging

**Scenario**: Style properties have unexpected types
- **Detection**: `isStyleProperties` type guard returns `false`
- **Response**: Use empty object as fallback with default styles
- **Recovery**: Feature renders with default styling

### Build-Time Validation

**TypeScript Compilation**:
- Run `tsc --noEmit` to check for type errors
- Exit code 0 indicates success, non-zero indicates type errors
- CI/CD pipeline should fail on type errors

**ESLint Validation**:
- Run `eslint` with `--max-warnings 0` to treat warnings as errors
- Ensure `@typescript-eslint/no-explicit-any` is set to `error`
- Pre-commit hooks should prevent commits with `any` usage

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive type safety coverage:

- **Unit tests**: Verify specific type guard behaviors, ESLint configuration, and build success
- **Property tests**: Verify type safety holds across all files and all expression builders

### Unit Testing

Unit tests focus on specific examples and edge cases:

1. **ESLint Configuration Test**
   - Verify `.eslintrc.js` contains `@typescript-eslint/no-explicit-any: 'error'`
   - Test: Read config file and assert rule is set to error level

2. **Build Success Test**
   - Run `tsc --noEmit` and verify exit code is 0
   - Run `npm run build` and verify successful completion
   - Test: Execute commands and check exit codes

3. **Type Guard Behavior Tests**
   - Test `isPolygon` with Polygon geometry returns `true`
   - Test `isPolygon` with Point geometry returns `false`
   - Test `isStyleProperties` with valid style object returns `true`
   - Test `isStyleProperties` with invalid object returns `false`

4. **Expression Builder Tests**
   - Test `buildZoomRadius` returns array with correct structure
   - Test `buildStepExpression` returns array with correct structure
   - Test `buildInterpolateExpression` returns array with correct structure

### Property-Based Testing

Property tests verify universal properties across all inputs:

**Property Test 1: No `any` usage in codebase**
- **Setup**: Get list of all TypeScript files in `src/` directory
- **Property**: *For any* TypeScript file, running ESLint should produce zero `@typescript-eslint/no-explicit-any` violations
- **Implementation**: Use fast-check to generate file paths, run ESLint programmatically
- **Iterations**: Minimum 100 (one per file in codebase)
- **Tag**: `Feature: typescript-strict-enforcement, Property 1: No explicit any types in codebase`

**Property Test 2: Expression builders return typed values**
- **Setup**: List of expression builder functions and their expected return types
- **Property**: *For any* expression builder function, the TypeScript compiler should infer a specific type (not `unknown[]`)
- **Implementation**: Use TypeScript Compiler API to check inferred return types
- **Iterations**: Minimum 100
- **Tag**: `Feature: typescript-strict-enforcement, Property 2: MapLibre expression builders return typed values`

**Property Test 3: Type guards provide type narrowing**
- **Setup**: Generate random GeoJSON geometries of different types
- **Property**: *For any* geometry and type guard pair, when guard returns `true`, TypeScript should narrow the type
- **Implementation**: Use TypeScript Compiler API to verify type narrowing occurs
- **Iterations**: Minimum 100
- **Tag**: `Feature: typescript-strict-enforcement, Property 3: Type guards correctly narrow geometry types`

### Testing Library Selection

**Property-Based Testing**: Use `fast-check` for TypeScript
- Mature library with good TypeScript support
- Can generate complex data structures
- Integrates well with Jest/Vitest

**Unit Testing**: Use existing test framework (Jest or Vitest)
- Already configured in the project
- Good TypeScript support
- Fast execution for simple assertions

### Test Configuration

All property-based tests must:
- Run minimum 100 iterations (configured via `fast-check`)
- Include descriptive test names with feature and property references
- Fail fast on first counterexample
- Log counterexamples for debugging

Example configuration:
```typescript
import fc from 'fast-check'

describe('Feature: typescript-strict-enforcement', () => {
  it('Property 1: No explicit any types in codebase', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllTypeScriptFiles()),
        (filePath) => {
          const result = runESLintOnFile(filePath)
          return result.violations.filter(v => 
            v.ruleId === '@typescript-eslint/no-explicit-any'
          ).length === 0
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Integration with CI/CD

1. **Pre-commit hooks**: Run ESLint with `no-explicit-any` rule
2. **CI pipeline**: 
   - Run `tsc --noEmit` to check type errors
   - Run full test suite including property tests
   - Run `npm run build` to verify build success
3. **Coverage**: Track type coverage using TypeScript's `--strict` mode

### Success Criteria

- All unit tests pass
- All property tests pass (100+ iterations each)
- `tsc --noEmit` exits with code 0
- `npm run build` completes successfully
- ESLint reports zero `@typescript-eslint/no-explicit-any` violations
- No `any` types remain in the codebase (verified by ESLint)
