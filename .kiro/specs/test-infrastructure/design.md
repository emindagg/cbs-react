# Test Infrastructure Setup - Design Document

## Overview

This design establishes a comprehensive test infrastructure for the React project using Vitest. The solution focuses on unit testing critical business logic with a pragmatic approach: start with high-value, low-complexity tests and expand coverage incrementally.

## Architecture

### Test Infrastructure Layers

```
┌─────────────────────────────────────────┐
│   CI/CD Pipeline                        │
│   (GitHub Actions / GitLab CI)          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│   Test Runner (Vitest)                  │
│   - Test execution                      │
│   - Coverage collection (c8)            │
│   - Watch mode                          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│   Test Files (*.test.ts)                │
│   - Unit tests                          │
│   - Test utilities                      │
│   - Mock data                           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│   Source Code                           │
│   (Utils, Services, Features)           │
└─────────────────────────────────────────┘
```

### Design Principles

1. **Co-location**: Test files next to source files (`utils.ts` → `utils.test.ts`)
2. **Fast Feedback**: Tests run in <5 seconds for quick iteration
3. **Isolation**: Each test is independent, no shared state
4. **Readability**: Descriptive test names, clear assertions
5. **Pragmatic Coverage**: Focus on high-value tests first

## Components and Interfaces

### 1. Vitest Configuration

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Key Features:**
- `globals: true` - No need to import `describe`, `it`, `expect`
- `environment: 'jsdom'` - DOM API support for React components
- Coverage thresholds - Build fails if coverage drops below 70%
- Path aliases - `@/` imports work in tests

### 2. Test Setup File

**File:** `src/test/setup.ts`

```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})
```

### 3. Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

**Script Purposes:**
- `test` - Watch mode (development)
- `test:ui` - Visual UI for test results
- `test:run` - Single run (CI/CD)
- `test:coverage` - Generate coverage report
- `test:watch` - Explicit watch mode

### 4. Test File Structure

**Pattern:** `<filename>.test.ts` or `<filename>.spec.ts`

```typescript
// Example: src/utils/classification.test.ts
import { describe, it, expect } from 'vitest'
import { calculateBreaks, classifyValue } from './classification'

describe('classification', () => {
  describe('calculateBreaks', () => {
    it('should calculate equal interval breaks', () => {
      const values = [10, 20, 30, 40, 50]
      const breaks = calculateBreaks(values, 'equal', 5)
      
      expect(breaks).toHaveLength(6) // n+1 breaks
      expect(breaks[0]).toBe(10)
      expect(breaks[5]).toBe(50)
    })

    it('should handle single value', () => {
      const values = [42]
      const breaks = calculateBreaks(values, 'equal', 3)
      
      expect(breaks).toHaveLength(4)
      expect(breaks.every(b => b === 42)).toBe(true)
    })

    it('should handle quantile classification', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const breaks = calculateBreaks(values, 'quantile', 4)
      
      expect(breaks).toHaveLength(5)
      // Quartiles: 1, 3, 5, 7, 10
    })
  })

  describe('classifyValue', () => {
    it('should classify value into correct class', () => {
      const breaks = [0, 10, 20, 30, 40, 50]
      
      expect(classifyValue(5, breaks)).toBe(0)
      expect(classifyValue(15, breaks)).toBe(1)
      expect(classifyValue(25, breaks)).toBe(2)
      expect(classifyValue(50, breaks)).toBe(4)
    })

    it('should handle edge cases', () => {
      const breaks = [0, 10, 20]
      
      expect(classifyValue(-5, breaks)).toBe(0) // Below min
      expect(classifyValue(25, breaks)).toBe(1) // Above max
    })
  })
})
```

## Test Implementation Strategy

### Priority 1: Pure Functions (High Value, Low Complexity)

#### 1. `src/utils/classification.ts`
**Functions to test:**
- `calculateBreaks(values, method, classCount)` - All classification methods
- `classifyValue(value, breaks)` - Value classification

**Test cases:**
- Equal interval with various class counts
- Quantile with different distributions
- Natural breaks (Jenks) algorithm
- Edge cases: empty array, single value, negative numbers
- Custom breaks validation

#### 2. `src/utils/geometryTypeGuards.ts`
**Functions to test:**
- `isPolygon(geometry)` - Type guard correctness
- `isMultiPolygon(geometry)` - Type guard correctness
- `isPolygonOrMultiPolygon(geometry)` - Combined guard
- All other geometry type guards

**Test cases:**
- Valid geometry types return true
- Invalid geometry types return false
- Type narrowing works (TypeScript compile-time check)
- Null/undefined handling

#### 3. `src/utils/prng.ts`
**Functions to test:**
- `hashString(str)` - Deterministic hashing
- `mulberry32(seed)` - PRNG output

**Test cases:**
- Same input produces same hash
- Different inputs produce different hashes
- PRNG with same seed produces same sequence
- PRNG output is in [0, 1) range
- Distribution is roughly uniform

#### 4. `src/features/viz-wizard/utils/dot-density.ts`
**Functions to test:**
- `calculateSmartDotValue(values)` - Smart dot value calculation
- `buildZoomRadius(dotSize)` - Zoom expression builder

**Test cases:**
- Various value ranges produce sensible dot values
- Dot value is a "nice number" (1, 2, 5, 10, etc.)
- Zoom radius expression structure is correct
- Edge cases: very small/large values

#### 5. `src/utils/geometryUtils.ts`
**Functions to test:**
- `calculateBounds(geometry)` - Bounding box calculation
- `calculateCentroid(geometry)` - Centroid calculation

**Test cases:**
- Polygon bounds are correct
- MultiPolygon bounds encompass all polygons
- Centroid is inside polygon (for convex shapes)
- Edge cases: degenerate geometries

### Priority 2: Expression Builders (Medium Complexity)

#### 6. `src/utils/mapExpressions.ts`
**Functions to test:**
- `buildStepExpression(property, breaks, colors, defaultColor)`
- `buildInterpolateExpression(property, colorStops)`

**Test cases:**
- Expression structure matches MapLibre spec
- Correct number of stops
- Colors are properly formatted
- Default color is used

### Priority 3: Renderers (Higher Complexity, MapLibre Dependency)

#### 7-9. Renderer Tests (Integration-style)
**Approach:** Test data transformation logic, not MapLibre interaction

**Example for PointRenderer:**
```typescript
describe('PointRenderer', () => {
  describe('createDataMap', () => {
    it('should create normalized data map', () => {
      const userData = [
        { location: 'İstanbul', value: 100 },
        { location: 'Ankara', value: 50 },
      ]
      
      const dataMap = renderer['createDataMap'](userData, 'value', 'province')
      
      expect(dataMap['istanbul']).toBe(100)
      expect(dataMap['ankara']).toBe(50)
    })
  })

  describe('generateDots', () => {
    it('should generate correct number of dots', () => {
      // Test dot count calculation
      // Test deterministic placement (same seed → same positions)
    })
  })
})
```

## Test Utilities and Helpers

### Mock Data Factory

**File:** `src/test/mockData.ts`

```typescript
import type { GeoJSONFeature } from '@/types/geojson'

export const mockPolygonFeature = (name: string, value: number): GeoJSONFeature => ({
  type: 'Feature',
  properties: {
    ADI: name,
    value,
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [28.0, 41.0],
        [29.0, 41.0],
        [29.0, 42.0],
        [28.0, 42.0],
        [28.0, 41.0],
      ],
    ],
  },
})

export const mockUserData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    location: `City${i}`,
    value: Math.random() * 100,
  }))
}

export const mockGeoJSON = (featureCount: number) => ({
  type: 'FeatureCollection' as const,
  features: Array.from({ length: featureCount }, (_, i) =>
    mockPolygonFeature(`Feature${i}`, i * 10)
  ),
})
```

### Test Helpers

**File:** `src/test/helpers.ts`

```typescript
export const expectArrayCloseTo = (actual: number[], expected: number[], precision = 2) => {
  expect(actual).toHaveLength(expected.length)
  actual.forEach((val, i) => {
    expect(val).toBeCloseTo(expected[i], precision)
  })
}

export const expectValidMapLibreExpression = (expr: unknown[]) => {
  expect(Array.isArray(expr)).toBe(true)
  expect(typeof expr[0]).toBe('string') // Expression type
}
```

## Coverage Configuration

### Coverage Thresholds

```typescript
coverage: {
  thresholds: {
    lines: 70,        // 70% of lines executed
    functions: 70,    // 70% of functions called
    branches: 70,     // 70% of if/else branches taken
    statements: 70,   // 70% of statements executed
  },
  // Per-file thresholds (optional, Phase 2)
  perFile: true,
  lines: {
    'src/utils/**': 90,           // Utils should have high coverage
    'src/services/renderers/**': 70,  // Renderers are harder to test
  },
}
```

### Coverage Exclusions

```typescript
exclude: [
  'node_modules/',
  'src/test/',           // Test utilities
  '**/*.d.ts',           // Type definitions
  '**/*.config.*',       // Config files
  '**/mockData',         // Mock data
  'dist/',               // Build output
  'src/main.tsx',        // App entry point
  'src/vite-env.d.ts',   // Vite types
]
```

## CI/CD Integration

### GitHub Actions Example

**File:** `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./react-app
      
      - name: Run tests
        run: npm run test:coverage
        working-directory: ./react-app
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./react-app/coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

### Pre-commit Hook (Optional)

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

cd react-app
npm run test:run
```

## Error Handling

### Test Failures

**Scenario**: Test fails during development
- **Detection**: Vitest watch mode shows failure immediately
- **Response**: Developer sees clear error message with stack trace
- **Recovery**: Fix code or test, Vitest re-runs automatically

**Scenario**: Coverage drops below threshold
- **Detection**: `npm run test:coverage` exits with non-zero code
- **Response**: Build fails with coverage report showing uncovered lines
- **Recovery**: Add tests to increase coverage or adjust thresholds

### Flaky Tests

**Prevention strategies:**
- No shared state between tests
- Use deterministic data (seeded PRNG)
- Avoid time-dependent tests
- Mock external dependencies

## Testing Strategy Summary

### Test Pyramid

```
        /\
       /  \      E2E Tests (Phase 3)
      /    \     - User flows
     /------\    
    /        \   Integration Tests (Phase 2)
   /          \  - Renderer + MapLibre
  /            \ - Store + Components
 /--------------\
/                \ Unit Tests (Phase 1 - This Spec)
\                / - Utils, calculations
 \--------------/  - Type guards, algorithms
                   - Pure functions
```

### Coverage Goals by Module

| Module | Target | Priority | Rationale |
|--------|--------|----------|-----------|
| `utils/classification.ts` | 90% | P1 | Critical business logic |
| `utils/geometryTypeGuards.ts` | 95% | P1 | Type safety foundation |
| `utils/prng.ts` | 90% | P1 | Algorithm correctness |
| `features/*/utils/` | 80% | P1 | Feature business logic |
| `utils/geometryUtils.ts` | 85% | P1 | Geometry calculations |
| `utils/mapExpressions.ts` | 80% | P2 | Expression builders |
| `services/renderers/` | 70% | P2 | MapLibre dependency |
| `constants/colorSchemes.ts` | 75% | P2 | Color functions |
| `utils/turkishNormalizer.ts` | 80% | P3 | Text processing |
| **Overall Project** | **70%** | - | Pragmatic start |

## Dependencies

### New Packages Required

```json
{
  "devDependencies": {
    "vitest": "^1.2.0",
    "@vitest/ui": "^1.2.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "jsdom": "^23.2.0",
    "@vitest/coverage-c8": "^0.33.0"
  }
}
```

**Package purposes:**
- `vitest` - Test runner
- `@vitest/ui` - Visual test UI
- `@testing-library/react` - React component testing (Phase 3)
- `@testing-library/jest-dom` - DOM matchers
- `jsdom` - DOM environment for tests
- `@vitest/coverage-c8` - Coverage reporting

## Success Criteria

- [ ] Vitest runs successfully with `npm test`
- [ ] At least 10 test files created
- [ ] Coverage report generates with `npm run test:coverage`
- [ ] Coverage thresholds enforced (70% minimum)
- [ ] All Priority 1 modules have tests
- [ ] Tests run in <5 seconds
- [ ] CI/CD integration documented
- [ ] README updated with test instructions

## Documentation Updates

### README.md Addition

```markdown
## Testing

### Run Tests
```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
npm run test:ui       # Visual UI
```

### Coverage Report
After running `npm run test:coverage`, open `coverage/index.html` in your browser.

### Writing Tests
- Place test files next to source files: `utils.ts` → `utils.test.ts`
- Use descriptive test names: `it('should calculate breaks for equal interval')`
- Follow AAA pattern: Arrange, Act, Assert
```

## Future Enhancements (Out of Scope)

### Phase 2: Integration Tests
- Renderer + MapLibre interaction tests
- Store + Component integration
- File upload + parsing flows

### Phase 3: Component Tests
- React Testing Library setup
- User interaction tests
- Visual state tests
- Accessibility tests

### Phase 4: E2E Tests
- Playwright/Cypress setup
- Critical user flows
- Cross-browser testing
