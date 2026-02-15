# Implementation Plan: Test Infrastructure Setup

## Overview

This implementation plan establishes a comprehensive test infrastructure using Vitest. The work is organized into discrete steps: setup, configuration, test file creation for critical modules, and CI/CD integration.

## Tasks

- [x] 1. Install Vitest and dependencies
  - Install `vitest`, `@vitest/ui`, `@vitest/coverage-c8`
  - Install `@testing-library/react`, `@testing-library/jest-dom`
  - Install `jsdom` for DOM environment
  - Update `package.json` with test scripts
  - _Requirements: AC-1.1_

- [x] 2. Create Vitest configuration
  - Create `vitest.config.ts` in react-app root
  - Configure globals, environment (jsdom)
  - Set up path aliases (@/ imports)
  - Configure coverage provider (c8)
  - Set coverage thresholds (70% minimum)
  - Add coverage exclusions (node_modules, test files, etc.)
  - _Requirements: AC-2.2, AC-2.3_

- [x] 3. Create test setup file
  - Create `src/test/setup.ts`
  - Extend expect with jest-dom matchers
  - Add afterEach cleanup
  - _Requirements: AC-1.2_

- [x] 4. Create test utilities
  - Create `src/test/mockData.ts` with mock factories
  - Create `src/test/helpers.ts` with test helpers
  - Add `mockPolygonFeature`, `mockUserData`, `mockGeoJSON` functions
  - Add `expectArrayCloseTo`, `expectValidMapLibreExpression` helpers
  - _Requirements: AC-1.2_

- [x] 5. Write tests for classification utils
  - Create `src/utils/classification.test.ts`
  - Test `calculateBreaks` with all classification methods (equal, quantile, natural breaks)
  - Test edge cases: empty array, single value, negative numbers
  - Test `classifyValue` function
  - Target: 90%+ coverage
  - _Requirements: AC-1.1, AC-2.1_

- [x] 6. Write tests for geometry type guards
  - Create `src/utils/geometryTypeGuards.test.ts`
  - Test `isPolygon`, `isMultiPolygon`, `isPolygonOrMultiPolygon`
  - Test all geometry type guards (Point, LineString, etc.)
  - Test with valid and invalid geometry types
  - Test null/undefined handling
  - Target: 95%+ coverage
  - _Requirements: AC-1.1, AC-2.1_

- [x] 7. Write tests for PRNG utils
  - Create `src/utils/prng.test.ts`
  - Test `hashString` determinism (same input → same hash)
  - Test `mulberry32` PRNG (same seed → same sequence)
  - Test PRNG output range [0, 1)
  - Test distribution uniformity (basic check)
  - Target: 90%+ coverage
  - _Requirements: AC-1.1, AC-2.1_

- [x] 8. Write tests for dot density utils
  - Create `src/features/viz-wizard/utils/dot-density.test.ts`
  - Test `calculateSmartDotValue` with various value ranges
  - Test dot value is a "nice number" (1, 2, 5, 10, etc.)
  - Test `buildZoomRadius` expression structure
  - Test edge cases: very small/large values
  - Target: 80%+ coverage
  - _Requirements: AC-1.1, AC-2.1_

- [x] 9. Write tests for geometry utils
  - Create `src/utils/geometryUtils.test.ts`
  - Test `calculateBounds` for Polygon and MultiPolygon
  - Test `calculateCentroid` for various geometries
  - Test edge cases: degenerate geometries
  - Target: 85%+ coverage
  - _Requirements: AC-1.1, AC-2.1_

- [x] 10. Write tests for MapLibre expression builders
  - Create `src/utils/mapExpressions.test.ts`
  - Test `buildStepExpression` structure and output
  - Test `buildInterpolateExpression` structure and output
  - Test correct number of stops and colors
  - Test default color handling
  - Target: 80%+ coverage
  - _Requirements: AC-1.1, AC-2.1_

- [x] 11. Write tests for Turkish normalizer
  - Create `src/utils/turkishNormalizer.test.ts`
  - Test `normalizeTurkishText` with Turkish characters
  - Test `getPlateCodeByName` with province names
  - Test edge cases: empty string, special characters
  - Target: 80%+ coverage
  - _Requirements: AC-1.1, AC-2.1_

- [x] 12. Write tests for color scheme utils
  - Create `src/constants/colorSchemes.test.ts`
  - Test `getColorPalette` returns correct number of colors
  - Test `getContinuousColor` interpolation
  - Test all color schemes are defined
  - Target: 75%+ coverage
  - _Requirements: AC-1.1, AC-2.1_

- [x] 13. Write tests for interpolation utils
  - Create `src/utils/interpolation.test.ts`
  - Test `normalizeValue` with different interpolation methods
  - Test equidistant, quantile interpolation
  - Test edge cases: min === max
  - Target: 80%+ coverage
  - _Requirements: AC-1.1, AC-2.1_

- [x] 14. Write tests for symbol shapes utils
  - Create `src/utils/symbolShapes.test.ts`
  - Test `calculateSymbolSize` with different scaling methods (linear, sqrt, log)
  - Test min/max size constraints
  - Test edge cases: zero values, negative values
  - Target: 80%+ coverage
  - _Requirements: AC-1.1, AC-2.1_

- [x] 15. Verify coverage thresholds
  - Run `npm run test:coverage`
  - Verify overall coverage is ≥70%
  - Verify critical utils have ≥80% coverage
  - Check coverage report HTML output
  - _Requirements: AC-2.1, AC-2.2, AC-2.3_

- [x] 16. Update package.json scripts
  - Verify `test`, `test:run`, `test:coverage`, `test:ui`, `test:watch` scripts
  - Test each script works correctly
  - _Requirements: AC-1.1_

- [x] 17. Create CI/CD integration guide
  - Create `.github/workflows/test.yml` example (or document for other CI)
  - Document how to run tests in CI/CD
  - Document coverage upload (Codecov/Coveralls)
  - _Requirements: AC-3.2_

- [x] 18. Update README with test documentation
  - Add "Testing" section to README.md
  - Document how to run tests
  - Document how to view coverage report
  - Document how to write new tests
  - _Requirements: AC-3.3_

- [ ]* 19. Optional: Add pre-commit hook
  - Install husky (if not already installed)
  - Create pre-commit hook to run tests
  - Document how to skip hook if needed
  - _Requirements: AC-3.1_

- [x] 20. Final verification
  - Run `npm test` - all tests pass
  - Run `npm run test:coverage` - coverage ≥70%
  - Run `npm run build` - build succeeds
  - Verify no regressions in existing functionality
  - _Requirements: AC-1.1, AC-1.3, AC-2.1_

## Notes

- Tests should run in <5 seconds for fast feedback
- Use descriptive test names following pattern: `it('should <expected behavior> when <condition>')`
- Follow AAA pattern: Arrange, Act, Assert
- Each test should be independent (no shared state)
- Use mock data from `src/test/mockData.ts` for consistency
- Coverage thresholds will fail the build if not met
- Focus on high-value tests first (Priority 1 modules)

## Test File Naming Convention

- Unit tests: `<filename>.test.ts` (e.g., `classification.test.ts`)
- Alternative: `<filename>.spec.ts` (both are supported)
- Co-locate tests with source files (same directory)

## Coverage Targets by Module

| Module | Target | Priority |
|--------|--------|----------|
| `utils/classification.ts` | 90% | P1 |
| `utils/geometryTypeGuards.ts` | 95% | P1 |
| `utils/prng.ts` | 90% | P1 |
| `features/viz-wizard/utils/dot-density.ts` | 80% | P1 |
| `utils/geometryUtils.ts` | 85% | P1 |
| `utils/mapExpressions.ts` | 80% | P2 |
| `constants/colorSchemes.ts` | 75% | P2 |
| `utils/interpolation.ts` | 80% | P2 |
| `utils/symbolShapes.ts` | 80% | P2 |
| `utils/turkishNormalizer.ts` | 80% | P3 |
| **Overall Project** | **70%** | - |

## Success Criteria

- [x] All 20 tasks completed
- [x] At least 10 test files created
- [x] Overall coverage ≥70%
- [x] All tests pass
- [x] Build succeeds
- [x] Documentation updated
- [x] CI/CD integration documented

## Future Phases (Out of Scope)

### Phase 2: Integration Tests
- Renderer integration tests (PointRenderer, BubbleRenderer, ChoroplethRenderer)
- Store integration tests
- File parsing integration tests

### Phase 3: Component Tests
- React component tests with React Testing Library
- User interaction tests
- Visual state tests

### Phase 4: E2E Tests
- Playwright/Cypress setup
- Critical user flow tests
- Cross-browser testing
