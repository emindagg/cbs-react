# Architecture Documentation

**Project:** React Map Visualization Application  
**Architecture:** Feature-First (Domain-Driven)  
**Last Updated:** 15 Şubat 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Project Structure](#project-structure)
4. [Feature-First Architecture](#feature-first-architecture)
5. [Code Organization Rules](#code-organization-rules)
6. [Import Patterns](#import-patterns)
7. [State Management](#state-management)
8. [Styling](#styling)
9. [Testing Strategy](#testing-strategy)
10. [Performance Considerations](#performance-considerations)

---

## Overview

Bu proje, harita tabanlı veri görselleştirme uygulamasıdır. **Feature-First (Domain-Driven) Architecture** prensiplerine göre organize edilmiştir.

### Tech Stack

- **Framework:** React 19.2.0 + TypeScript 5.9.3
- **Build Tool:** Vite 7.3.1
- **Map Library:** MapLibre GL 5.17.0 + React Map GL 8.1.0
- **State Management:** Zustand 5.0.11
- **Styling:** Tailwind CSS 4.1.18
- **Testing:** Vitest 4.0.18
- **Linting:** ESLint 9.39.1 + TypeScript ESLint 8.46.4

### Key Features

- 🗺️ Interactive map visualization
- 📊 Multiple visualization types (choropleth, bubble, dot density)
- 📁 Data import (Excel, CSV, GeoJSON, KML, Shapefile)
- 🎨 Customizable color schemes and legends
- 📐 GIS tools (buffer, measurement, drawing)
- 🌍 Multiple basemap options
- ⭐ Astronomy features (sun/moon position)

---

## Architecture Principles

### 1. Feature-First Organization

**Prensip:** Domain kodu feature klasörlerinde organize edilir, global components sadece generic orchestrator bileşenler içerir.

**Avantajlar:**
- ✅ Yüksek cohesion (ilgili kod bir arada)
- ✅ Düşük coupling (feature'lar bağımsız)
- ✅ Kolay bakım ve geliştirme
- ✅ Paralel çalışma imkanı
- ✅ Kolay test edilebilirlik

### 2. Barrel Export Pattern

**Prensip:** Her feature public API'sini `index.ts` üzerinden export eder.

**Avantajlar:**
- ✅ Temiz import'lar
- ✅ Encapsulation (internal detaylar gizli)
- ✅ Refactoring kolaylığı
- ✅ API versiyonlama imkanı

### 3. Single Responsibility

**Prensip:** Her bileşen, fonksiyon ve modül tek bir sorumluluğa sahip olmalı.

**Kurallar:**
- Bileşenler: Tek bir UI concern
- Hooks: Tek bir logic concern
- Utils: Tek bir utility concern

### 4. Dependency Direction

**Prensip:** Bağımlılıklar tek yönlü olmalı.

```
Features → Shared (utils, types, stores)
Features ↔ Features (sadece barrel üzerinden)
Shared → ❌ Features (yasak)
```

---

## Project Structure

```
react-app/
├── src/
│   ├── features/              # Feature modules (domain code)
│   │   ├── astronomy/         # Sun/moon position features
│   │   ├── basemap/           # Basemap switching
│   │   ├── clustering/        # Point clustering
│   │   ├── data-import/       # File import & parsing
│   │   ├── data-mapper/       # Column mapping & editing
│   │   ├── geocoder/          # Address search
│   │   ├── globe-view/        # 3D globe view
│   │   ├── legend/            # Legend components
│   │   ├── map/               # Map core functionality
│   │   └── viz-wizard/        # Visualization wizard
│   │
│   ├── components/            # Global components (orchestrators only)
│   │   ├── layout/            # AppLayout (root orchestrator)
│   │   └── sidebar/           # Sidebar (feature orchestrator)
│   │
│   ├── stores/                # Global state (Zustand)
│   │   ├── useDataStore.ts
│   │   ├── useMapStore.ts
│   │   ├── useToolStore.ts
│   │   └── useVisualizationStore.ts
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── classification.ts
│   │   ├── colorInterpolation.ts
│   │   ├── geometryUtils.ts
│   │   └── ...
│   │
│   ├── types/                 # Shared types
│   │   ├── geojson.ts
│   │   ├── visualization.ts
│   │   └── ...
│   │
│   ├── constants/             # Global constants
│   │   ├── colorSchemes.ts
│   │   └── layout.ts
│   │
│   ├── hooks/                 # Shared hooks
│   │   └── useMediaQuery.ts
│   │
│   ├── test/                  # Test utilities
│   │   ├── mockData.ts
│   │   └── helpers.ts
│   │
│   ├── App.tsx                # Root component
│   └── main.tsx               # Entry point
│
├── public/                    # Static assets
├── dist/                      # Build output
├── coverage/                  # Test coverage reports
│
├── eslint.config.js           # ESLint configuration
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind configuration
└── package.json               # Dependencies
```

---

## Feature-First Architecture

### Feature Anatomy

Her feature aşağıdaki yapıya sahip olabilir:

```
features/feature-name/
├── components/          # Feature-specific UI components
│   ├── ComponentA.tsx
│   ├── ComponentB.tsx
│   └── index.ts        # Barrel export (optional)
│
├── hooks/              # Feature-specific hooks
│   ├── useFeatureHook.ts
│   └── index.ts        # Barrel export (optional)
│
├── services/           # Feature-specific services
│   ├── api.ts
│   └── index.ts        # Barrel export (optional)
│
├── utils/              # Feature-specific utilities
│   ├── helper.ts
│   └── index.ts        # Barrel export (optional)
│
├── stores/             # Feature-specific state (optional)
│   └── useFeatureStore.ts
│
├── constants/          # Feature-specific constants
│   └── config.ts
│
├── types.ts            # Feature-specific types
└── index.ts            # Public API (barrel export)
```

### Feature Examples

#### 1. Simple Feature (Basemap)

```
features/basemap/
├── components/
│   └── BasemapPanel.tsx
└── index.ts
```

#### 2. Medium Feature (Data Import)

```
features/data-import/
├── components/
│   ├── DataImportSection.tsx
│   ├── ExportControls.tsx
│   ├── UrlImporter.tsx
│   └── ColumnMapperModal.tsx
├── hooks/
│   ├── useFileImport.ts
│   ├── useUrlImport.ts
│   └── useDataExport.ts
├── services/
│   ├── fileParser.ts
│   ├── geoJsonProcessor.ts
│   └── excelProcessor.ts
├── utils/
│   ├── columnDetector.ts
│   └── dataMapper.ts
├── constants/
│   └── formats.ts
├── types.ts
└── index.ts
```

#### 3. Complex Feature (Viz Wizard)

```
features/viz-wizard/
├── components/
│   ├── Progress.tsx
│   ├── MapTitle.tsx
│   ├── StyleConfig.tsx
│   └── SidebarSection.tsx
├── steps/
│   ├── Step1/
│   ├── Step2/
│   └── Step3/
├── hooks/
│   ├── useMatching.ts
│   └── useVizRender.ts
├── constants/
│   └── dot-density.ts
├── utils/
│   └── dot-density.ts
└── index.ts
```

---

## Code Organization Rules

### Rule 1: Domain Code in Features

**✅ Doğru:**
```typescript
// Feature-specific component
src/features/legend/components/DynamicLegend.tsx

// Feature-specific hook
src/features/data-import/hooks/useFileImport.ts

// Feature-specific utility
src/features/viz-wizard/utils/dot-density.ts
```

**❌ Yanlış:**
```typescript
// Domain code in global components
src/components/Legend/DynamicLegend.tsx

// Domain code in global utils
src/utils/fileImport.ts
```

### Rule 2: Barrel Export Only

**✅ Doğru:**
```typescript
// Import from barrel
import { DynamicLegend, LegendConfig } from '@/features/legend'
import { useFileImport } from '@/features/data-import'
```

**❌ Yanlış:**
```typescript
// Deep import (bypasses barrel)
import DynamicLegend from '@/features/legend/components/DynamicLegend'
import { useFileImport } from '@/features/data-import/hooks/useFileImport'
```

**İstisna:** Feature içinde relative import kullanılabilir:
```typescript
// Inside features/legend/components/Container.tsx
import DynamicLegend from './DynamicLegend'  // ✅ OK
import { useLabelCollision } from '../hooks/useLabelCollision'  // ✅ OK
```

### Rule 3: Global Components = Orchestrators Only

**✅ Doğru:**
```typescript
// src/components/layout/AppLayout.tsx
// Root orchestrator - coordinates features
import { MapContainer } from '@/features/map'
import { LegendContainer } from '@/features/legend'
import { VizWizardSidebar } from '@/features/viz-wizard'
```

**❌ Yanlış:**
```typescript
// src/components/DataVisualization.tsx
// Domain-specific component in global
```

### Rule 4: File Size Limits

**Pragmatik Limitler:**
- **Dosya:** 600 satır (boş satırlar ve yorumlar hariç)
- **Fonksiyon:** 300 satır (boş satırlar ve yorumlar hariç)

**Aşıldığında:**
1. Bileşeni alt bileşenlere böl
2. Logic'i hook'lara taşı
3. Utility fonksiyonları ayır

### Rule 5: Test Co-location

**✅ Doğru:**
```
src/utils/
├── classification.ts
└── classification.test.ts
```

**❌ Yanlış:**
```
src/utils/classification.ts
tests/utils/classification.test.ts
```

---

## Import Patterns

### Import Order (ESLint Enforced)

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'

// 2. Internal dependencies (@/ alias)
import { useMapStore } from '@/stores/useMapStore'
import { MapContainer } from '@/features/map'
import { calculateBreaks } from '@/utils/classification'

// 3. Relative imports
import { SubComponent } from './SubComponent'
import { helper } from '../utils/helper'
```

### Path Aliases

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Kullanım:**
```typescript
import { useMapStore } from '@/stores/useMapStore'  // ✅
import { useMapStore } from '../../stores/useMapStore'  // ❌
```

### Type Imports

```typescript
// ✅ Doğru: Type import ayrımı
import type { ColorScheme } from '@/types/visualization'
import { getColorPalette } from '@/constants/colorSchemes'

// ❌ Yanlış: Type ve value karışık
import { ColorScheme, getColorPalette } from '@/constants/colorSchemes'
```

---

## State Management

### Zustand Stores

**Global State (src/stores/):**

```typescript
// useMapStore.ts
import { create } from 'zustand'

interface MapState {
  mapInstance: maplibregl.Map | null
  setMapInstance: (map: maplibregl.Map) => void
  activeBasemap: string
  setActiveBasemap: (basemap: string) => void
}

export const useMapStore = create<MapState>((set) => ({
  mapInstance: null,
  setMapInstance: (map) => set({ mapInstance: map }),
  activeBasemap: 'TEMEL',
  setActiveBasemap: (basemap) => set({ activeBasemap: basemap }),
}))
```

**Feature-Specific State:**

```typescript
// features/clustering/stores/useClusteringStore.ts
import { create } from 'zustand'

interface ClusteringState {
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void
}

export const useClusteringStore = create<ClusteringState>((set) => ({
  isEnabled: false,
  setEnabled: (enabled) => set({ isEnabled: enabled }),
}))
```

### State Organization

**Global Stores:**
- `useMapStore` - Map instance, basemap
- `useDataStore` - Imported data, GeoJSON
- `useVisualizationStore` - Visualization config, colors
- `useToolStore` - Active tools, drawing state

**Feature Stores:**
- `useClusteringStore` - Clustering state
- `useAstronomyStore` - Astronomy calculations

**Kural:** Feature-specific state feature içinde, cross-feature state global store'da.

---

## Styling

### Tailwind CSS

**Utility-First Approach:**

```tsx
// ✅ Doğru: Tailwind utilities
<div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
  <Icon />
  <span>Button</span>
</div>

// ❌ Yanlış: Inline styles
<div style={{ display: 'flex', padding: '8px 16px', background: '#3b82f6' }}>
  <Icon />
  <span>Button</span>
</div>
```

### Component-Specific CSS

**Sadece gerektiğinde:**

```tsx
// DynamicLegend.tsx
import './DynamicLegend.css'

// DynamicLegend.css
.legend-gradient {
  background: linear-gradient(to right, var(--color-start), var(--color-end));
}
```

### CSS Modules (Kullanılmıyor)

Bu projede CSS Modules kullanılmıyor. Tailwind + component-specific CSS tercih ediliyor.

---

## Testing Strategy

### Test Coverage

**Hedef:** 90%+  
**Mevcut:** 86.52%

### Test Types

**1. Unit Tests (Mevcut)**
```typescript
// src/utils/classification.test.ts
describe('calculateBreaks', () => {
  it('should calculate equal interval breaks', () => {
    const values = [0, 10, 20, 30, 40, 50]
    const breaks = calculateBreaks(values, 5, 'equal')
    expect(breaks).toEqual([0, 10, 20, 30, 40, 50])
  })
})
```

**2. Component Tests (Eksik)**
```typescript
// features/legend/components/DynamicLegend.test.tsx
describe('DynamicLegend', () => {
  it('should render legend with correct colors', () => {
    // Test implementation
  })
})
```

**3. Integration Tests (Eksik)**
```typescript
// features/data-import/integration.test.tsx
describe('Data Import Flow', () => {
  it('should import Excel file and map columns', async () => {
    // Test implementation
  })
})
```

### Test Utilities

```typescript
// src/test/mockData.ts
export const mockGeoJSON = (): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    // Mock features
  ],
})

// src/test/helpers.ts
export const expectToBeCloseTo = (actual: number, expected: number) => {
  expect(actual).toBeCloseTo(expected, 2)
}
```

---

## Performance Considerations

### Current State

- **Bundle Size:** 3.17 MB (925 KB gzipped)
- **Modules:** 2813
- **Build Time:** ~15s

### Optimization Opportunities

**1. Code Splitting (Öncelikli)**
```typescript
// Lazy load wizard steps
const VizWizardStep1 = lazy(() => import('@/features/viz-wizard/steps/Step1'))
const VizWizardStep2 = lazy(() => import('@/features/viz-wizard/steps/Step2'))
const VizWizardStep3 = lazy(() => import('@/features/viz-wizard/steps/Step3'))
```

**2. Manual Chunks**
```javascript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': ['react', 'react-dom'],
        'map': ['maplibre-gl', 'react-map-gl'],
        'data': ['xlsx', 'shpjs', '@turf/turf'],
      }
    }
  }
}
```

**3. Tree Shaking**
- Kullanılmayan kod temizliği
- Import optimizasyonu
- Dead code elimination

---

## Best Practices

### 1. Component Design

```tsx
// ✅ Doğru: Single responsibility
const UserProfile = ({ user }: { user: User }) => (
  <div>
    <UserAvatar user={user} />
    <UserInfo user={user} />
  </div>
)

// ❌ Yanlış: Too many responsibilities
const Dashboard = () => {
  // 500 lines of mixed concerns
}
```

### 2. Hook Design

```typescript
// ✅ Doğru: Focused hook
const useFileImport = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const importFile = async (file: File) => {
    // Import logic
  }
  
  return { importFile, isLoading, error }
}

// ❌ Yanlış: God hook
const useEverything = () => {
  // 50 different concerns
}
```

### 3. Type Safety

```typescript
// ✅ Doğru: Strict types
interface LegendConfig {
  visible: boolean
  position: 'above' | 'below' | 'inside-left-top'
  orientation: 'horizontal' | 'vertical'
}

// ❌ Yanlış: Loose types
interface LegendConfig {
  visible: boolean
  position: string
  orientation: string
}
```

### 4. Error Handling

```typescript
// ✅ Doğru: Proper error handling
try {
  const data = await parseFile(file)
  return { success: true, data }
} catch (error) {
  console.error('File parse error:', error)
  return { success: false, error: error.message }
}

// ❌ Yanlış: Silent failures
const data = await parseFile(file).catch(() => null)
```

---

## Migration Guide

### Adding a New Feature

1. **Create feature folder:**
   ```bash
   mkdir -p src/features/my-feature/{components,hooks,utils}
   ```

2. **Create barrel export:**
   ```typescript
   // src/features/my-feature/index.ts
   export { MyComponent } from './components/MyComponent'
   export { useMyHook } from './hooks/useMyHook'
   export type * from './types'
   ```

3. **Update ESLint (if needed):**
   ```javascript
   // eslint.config.js - usually not needed
   ```

4. **Add tests:**
   ```typescript
   // src/features/my-feature/components/MyComponent.test.tsx
   ```

### Moving Code to Features

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed migration guide.

---

## References

- [Feature-First Architecture](https://feature-sliced.design/)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest](https://vitest.dev/)

---

**Maintainers:** Development Team  
**Last Review:** 15 Şubat 2026  
**Next Review:** Quarterly
