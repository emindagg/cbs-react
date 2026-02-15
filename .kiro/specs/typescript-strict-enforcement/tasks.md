# Implementation Plan: TypeScript Strict Mode Enforcement

## Overview

This implementation plan eliminates all `any` type usage from the codebase by introducing proper type definitions for MapLibre expressions, GeoJSON geometry type guards, and style properties. The work is organized into discrete steps that build incrementally, with testing integrated throughout.

## Tasks

- [x] 1. Create MapLibre expression type definitions
  - Create `src/types/maplibre-expressions.ts` file
  - Define base `MapLibreExpression` type union
  - Define `InterpolateExpression`, `StepExpression`, `GetExpression` types
  - Define `PaintPropertyValue<T>` generic type
  - Define `ZoomRadiusExpression` specific type
  - Export all types for use across the codebase
  - _Requirements: AC-1.3_

- [-] 1.1 Write unit tests for MapLibre expression types
  - Test that expression types accept valid MapLibre expression arrays
  - Test that `PaintPropertyValue<number>` accepts both numbers and expressions
  - _Requirements: AC-1.3_

- [x] 2. Create GeoJSON geometry type guards
  - Create `src/utils/geometryTypeGuards.ts` file
  - Implement `isPolygon` type guard function
  - Implement `isMultiPolygon` type guard function
  - Implement `isPolygonOrMultiPolygon` type guard function
  - Implement `isPoint`, `isMultiPoint`, `isLineString`, `isMultiLineString` guards
  - Export all type guard functions
  - _Requirements: AC-1.3_

- [~] 2.1 Write unit tests for geometry type guards
  - Test `isPolygon` returns `true` for Polygon geometry
  - Test `isPolygon` returns `false` for Point geometry
  - Test `isPolygonOrMultiPolygon` handles both Polygon and MultiPolygon
  - Test all type guards with various geometry types
  - _Requirements: AC-1.3_

- [~] 2.2 Write property test for type guard correctness
  - **Property 3: Type guards correctly narrow geometry types**
  - **Validates: Requirements AC-1.3**
  - Generate random GeoJSON geometries
  - Verify type guards return correct boolean values
  - Verify TypeScript narrows types correctly after guard checks

- [x] 3. Create style property types and guards
  - Create `src/types/style.ts` file
  - Define `StyleProperties` interface
  - Implement `isStyleProperties` type guard function
  - Export interface and type guard
  - _Requirements: AC-1.2_

- [~] 3.1 Write unit tests for style property type guards
  - Test `isStyleProperties` with valid style object
  - Test `isStyleProperties` with invalid object (wrong types)
  - Test `isStyleProperties` with null/undefined
  - _Requirements: AC-1.2_

- [ ] 4. Update expression builder function signatures
  - [x] 4.1 Update `buildZoomRadius` in `src/features/viz-wizard/utils/dot-density.ts`
    - Import `ZoomRadiusExpression` type
    - Change return type from `unknown[]` to `ZoomRadiusExpression`
    - _Requirements: AC-1.3_

  - [x] 4.2 Update `buildStepExpression` in `src/utils/mapExpressions.ts`
    - Import `StepExpression` type
    - Change return type from `unknown[]` to `StepExpression`
    - _Requirements: AC-1.3_

  - [x] 4.3 Update `buildInterpolateExpression` in `src/utils/mapExpressions.ts`
    - Import `InterpolateExpression` type
    - Change return type from `unknown[]` to `InterpolateExpression`
    - _Requirements: AC-1.3_

- [~] 4.4 Write property test for expression builder types
  - **Property 2: MapLibre expression builders return typed values**
  - **Validates: Requirements AC-1.3**
  - Verify `buildZoomRadius` returns `ZoomRadiusExpression` type
  - Verify `buildStepExpression` returns `StepExpression` type
  - Verify `buildInterpolateExpression` returns `InterpolateExpression` type

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Replace `any` usage in PointRenderer.ts
  - [x] 6.1 Fix geometry type assertion at line 155
    - Import `isPolygonOrMultiPolygon` type guard
    - Replace `geometry as any` with type guard check
    - Add early continue if geometry is not Polygon/MultiPolygon
    - _Requirements: AC-1.2_

  - [x] 6.2 Fix zoom radius expression at lines 406, 416
    - Import `PaintPropertyValue` type
    - Replace `zoomRadius as any` with `zoomRadius as PaintPropertyValue<number>`
    - _Requirements: AC-1.2_

- [x] 7. Replace `any` usage in BubbleRenderer.ts
  - Import `isPolygonOrMultiPolygon` type guard
  - Replace `geometry as any` at line 183 with type guard check
  - Add early return if geometry is not Polygon/MultiPolygon
  - _Requirements: AC-1.2_

- [x] 8. Replace `any` usage in useVizRender.ts
  - Import `PaintPropertyValue` type
  - Replace `buildZoomRadius(dotSize) as any` with `buildZoomRadius(dotSize) as PaintPropertyValue<number>` at line 34
  - _Requirements: AC-1.2_

- [x] 9. Replace `any` usage in DataLayer.tsx
  - Import `StyleProperties` and `isStyleProperties` from types
  - Replace `style as any` at line 19 with type guard check
  - Use empty object fallback if type guard returns false
  - _Requirements: AC-1.2_

- [~] 10. Write property test for no `any` usage
  - **Property 1: No explicit `any` types in codebase**
  - **Validates: Requirements AC-1.2**
  - Get list of all TypeScript files in `src/` directory
  - Run ESLint programmatically on each file
  - Verify zero `@typescript-eslint/no-explicit-any` violations

- [x] 11. Update ESLint configuration
  - Open `.eslintrc.js` or `.eslintrc.json` file
  - Change `@typescript-eslint/no-explicit-any` from `warn` to `error`
  - Save configuration file
  - _Requirements: AC-1.1_

- [~] 11.1 Write unit test for ESLint configuration
  - Read ESLint config file
  - Assert `@typescript-eslint/no-explicit-any` is set to `error`
  - _Requirements: AC-1.1_

- [~] 12. Verify build and type checking
  - Run `tsc --noEmit` to verify no type errors
  - Run `npm run build` to verify successful build
  - Run full test suite to ensure no regressions
  - _Requirements: AC-2.2, AC-2.3_

- [~] 12.1 Write unit test for build success
  - Execute `tsc --noEmit` command
  - Assert exit code is 0
  - _Requirements: AC-2.2_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify zero ESLint violations for `no-explicit-any`
  - Verify TypeScript compilation succeeds
  - Verify build completes successfully

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Type definitions have zero runtime overhead
- All changes maintain backward compatibility
- Property tests run minimum 100 iterations each
- Integration with CI/CD ensures ongoing type safety
