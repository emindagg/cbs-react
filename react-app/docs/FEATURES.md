# Features Documentation

**Project:** React Map Visualization Application  
**Last Updated:** 15 Şubat 2026

---

## 📋 Table of Contents

1. [Feature Overview](#feature-overview)
2. [Feature Details](#feature-details)
3. [Feature Dependencies](#feature-dependencies)
4. [Feature Status](#feature-status)

---

## Feature Overview

Bu proje 10 ana feature'dan oluşmaktadır. Her feature kendi domain'inden sorumludur ve bağımsız olarak geliştirilebilir.

### Feature List

| Feature | Description | Status | Lines of Code |
|---------|-------------|--------|---------------|
| [Astronomy](#astronomy) | Sun/moon position calculations | ✅ Active | ~500 |
| [Basemap](#basemap) | Basemap switching | ✅ Active | ~200 |
| [Clustering](#clustering) | Point clustering | ✅ Active | ~300 |
| [Data Import](#data-import) | File import & parsing | ✅ Active | ~1200 |
| [Data Mapper](#data-mapper) | Column mapping & editing | ✅ Active | ~800 |
| [Geocoder](#geocoder) | Address search | ✅ Active | ~400 |
| [Globe View](#globe-view) | 3D globe visualization | ✅ Active | ~300 |
| [Legend](#legend) | Legend components | ✅ Active | ~1500 |
| [Map](#map) | Core map functionality | ✅ Active | ~1000 |
| [Viz Wizard](#viz-wizard) | Visualization wizard | ✅ Active | ~2000 |

**Total:** ~8,200 lines of feature code

---

## Feature Details

### Astronomy

**Path:** `src/features/astronomy/`  
**Purpose:** Calculate and display sun/moon positions on map

**Components:**
- `AstroPanel` - UI panel for astronomy controls

**Hooks:**
- `useAstroMap` - Astronomy calculations and map integration

**Stores:**
- `useAstronomyStore` - Astronomy state management

**Dependencies:**
- `astronomy-engine` - Astronomical calculations
- `suncalc` - Sun/moon position calculations

**Public API:**
```typescript
import { AstroPanel, useAstroMap } from '@/features/astronomy'
```

**Usage Example:**
```tsx
const { isAstroMode, toggleAstroMode } = useAstroMap()

<AstroPanel />
```

---

### Basemap

**Path:** `src/features/basemap/`  
**Purpose:** Switch between different basemap providers

**Components:**
- `BasemapPanel` - Basemap selection UI

**Basemap Options:**
- HGM Atlas (Temel, Uydu, Gece, Siyasi, Yükseklik)
- CartoDB (Light, Dark, Voyager)
- None (blank background)

**Public API:**
```typescript
import { BasemapPanel } from '@/features/basemap'
```

**Usage Example:**
```tsx
<BasemapPanel />
```

---

### Clustering

**Path:** `src/features/clustering/`  
**Purpose:** Cluster point features on map

**Components:**
- `ClusteringPanel` - Clustering controls UI

**Hooks:**
- `useClustering` - Clustering logic

**Stores:**
- `useClusteringStore` - Clustering state

**Public API:**
```typescript
import { ClusteringPanel, useClustering } from '@/features/clustering'
```

**Usage Example:**
```tsx
const { isEnabled, setEnabled } = useClustering()

<ClusteringPanel />
```

---

### Data Import

**Path:** `src/features/data-import/`  
**Purpose:** Import data from various file formats

**Components:**
- `DataImportSection` - Main import UI
- `ExportControls` - Export functionality
- `UrlImporter` - URL-based import
- `ColumnMapperModal` - Column mapping UI

**Hooks:**
- `useFileImport` - File import logic
- `useUrlImport` - URL import logic
- `useDataExport` - Export logic

**Services:**
- `fileParser` - Parse uploaded files
- `geoJsonProcessor` - Process GeoJSON
- `excelProcessor` - Process Excel files
- `kmlProcessor` - Process KML files
- `shapefileProcessor` - Process Shapefiles

**Utilities:**
- `columnDetector` - Auto-detect column types
- `dataMapper` - Map data to GeoJSON

**Supported Formats:**
- Excel (.xlsx, .xls)
- CSV (.csv)
- GeoJSON (.geojson, .json)
- KML (.kml)
- Shapefile (.zip)

**Public API:**
```typescript
import { 
  DataImportSection,
  ColumnMapperModal,
  useFileImport,
  useUrlImport,
  useDataExport 
} from '@/features/data-import'
```

**Usage Example:**
```tsx
const { importFile, isLoading, error } = useFileImport()

<DataImportSection />
```

---

### Data Mapper

**Path:** `src/features/data-mapper/`  
**Purpose:** Map columns and edit data in spreadsheet

**Components:**
- `DataMapper` - Main mapper component
- `DataEditor` - Spreadsheet editor
- `DataMapperModal` - Modal wrapper

**Hooks:**
- `useDataMapper` - Mapper logic

**Features:**
- Column mapping
- Data editing (AG Grid)
- Real-time validation
- Turkish text normalization

**Public API:**
```typescript
import { DataMapper, DataMapperModal } from '@/features/data-mapper'
```

**Usage Example:**
```tsx
<DataMapperModal
  isOpen={isOpen}
  onClose={onClose}
  geoJsonKeys={keys}
/>
```

---

### Geocoder

**Path:** `src/features/geocoder/`  
**Purpose:** Search and geocode addresses

**Components:**
- `SearchContainer` - Search UI

**Hooks:**
- `useGeocoder` - Geocoding logic

**Services:**
- `geocoderApi` - Geocoding API integration

**Types:**
- `GeocoderResult` - Search result type

**Public API:**
```typescript
import { SearchContainer } from '@/features/geocoder'
```

**Usage Example:**
```tsx
<SearchContainer />
```

---

### Globe View

**Path:** `src/features/globe-view/`  
**Purpose:** 3D globe visualization

**Components:**
- `GlobePanel` - Globe controls UI

**Hooks:**
- `useGlobeView` - Globe view logic

**Public API:**
```typescript
import { GlobePanel, useGlobeView } from '@/features/globe-view'
```

**Usage Example:**
```tsx
const { isGlobeMode, toggleGlobeMode } = useGlobeView()

<GlobePanel />
```

---

### Legend

**Path:** `src/features/legend/`  
**Purpose:** Display map legends

**Components:**
- `DynamicLegend` - Generic legend
- `DotDensityLegend` - Dot density specific
- `DatawrapperLegend` - Datawrapper style
- `LegendBar` - Legend bar component
- `LegendLabels` - Legend labels
- `SmartLabel` - Smart label positioning
- `LegendContainer` - Store connector
- `LegendConfig` - Configuration UI

**Hooks:**
- `useLabelCollision` - Label collision detection

**Utilities:**
- `itemGenerators` - Legend item generators

**Types:**
- `LegendConfiguration` - Legend config type
- `DynamicLegendProps` - Dynamic legend props
- `LegendBarProps` - Bar props
- `LegendLabelsProps` - Labels props

**Legend Types:**
- Choropleth (color scale)
- Bubble (size scale)
- Dot Density (1 dot = X value)

**Public API:**
```typescript
import { 
  DynamicLegend,
  DotDensityLegend,
  DatawrapperLegend,
  LegendContainer,
  LegendConfig 
} from '@/features/legend'
```

**Usage Example:**
```tsx
<LegendContainer />

<LegendConfig
  config={config}
  onChange={handleChange}
/>
```

---

### Map

**Path:** `src/features/map/`  
**Purpose:** Core map functionality

**Components:**
- `MapContainer` - Main map container

**Controls:**
- `MapControlStack` - Control stack
- `ZoomControls` - Zoom in/out
- `BasemapSwitcher` - Basemap switcher
- `GISToolsControl` - GIS tools

**Layers:**
- `DataLayer` - Data visualization layer

**Tools:**
- `DistanceTool` - Distance measurement
- `DrawTool` - Drawing tool

**Features:**
- MapLibre GL integration
- Multiple basemaps
- GIS tools (buffer, measurement)
- Drawing tools
- Data visualization

**Public API:**
```typescript
import { 
  MapContainer,
  MapControlStack,
  ZoomControls,
  BasemapSwitcher,
  GISToolsControl,
  DataLayer,
  DistanceTool,
  DrawTool 
} from '@/features/map'
```

**Usage Example:**
```tsx
<MapContainer>
  <MapControlStack />
  <DataLayer />
  <DistanceTool />
</MapContainer>
```

---

### Viz Wizard

**Path:** `src/features/viz-wizard/`  
**Purpose:** Step-by-step visualization wizard

**Components:**
- `VizWizardStep1` - Data selection
- `VizWizardStep2` - Column mapping
- `VizWizardStep3` - Style configuration
- `WizardProgress` - Progress indicator
- `MapTitle` - Map title component
- `VizWizardSidebar` - Sidebar section

**Steps:**
1. **Step 1:** Select visualization type (choropleth, bubble, dot)
2. **Step 2:** Map columns to GeoJSON properties
3. **Step 3:** Configure colors, legend, symbols

**Hooks:**
- `useMatching` - Column matching logic
- `useVizRender` - Visualization rendering

**Constants:**
- `dot-density` - Dot density constants

**Utilities:**
- `dot-density` - Dot density calculations

**Visualization Types:**
- **Choropleth:** Color-coded regions
- **Bubble:** Proportional symbols
- **Dot Density:** One dot = X value

**Public API:**
```typescript
import { 
  VizWizardStep1,
  VizWizardStep2,
  VizWizardStep3,
  WizardProgress,
  MapTitle,
  VizWizardSidebar 
} from '@/features/viz-wizard'
```

**Usage Example:**
```tsx
<VizWizardSidebar />

{currentStep === 1 && <VizWizardStep1 />}
{currentStep === 2 && <VizWizardStep2 />}
{currentStep === 3 && <VizWizardStep3 />}
```

---

## Feature Dependencies

### Dependency Graph

```
┌─────────────────┐
│   AppLayout     │ (Orchestrator)
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┬────────┐
    │         │        │        │        │
┌───▼───┐ ┌──▼──┐ ┌───▼───┐ ┌──▼──┐ ┌──▼──┐
│  Map  │ │Legend│ │VizWiz │ │Data │ │Geo  │
└───┬───┘ └──┬──┘ └───┬───┘ └──┬──┘ └─────┘
    │        │        │        │
    │        │        │        │
┌───▼────────▼────────▼────────▼───┐
│      Shared (stores, utils)      │
└───────────────────────────────────┘
```

### Cross-Feature Dependencies

| Feature | Depends On | Used By |
|---------|------------|---------|
| Map | - | All features |
| Legend | Viz Wizard | Map |
| Viz Wizard | Data Import, Data Mapper | Sidebar |
| Data Import | - | Viz Wizard |
| Data Mapper | Data Import | Viz Wizard |
| Geocoder | Map | Sidebar |
| Astronomy | Map | Sidebar |
| Clustering | Map | Sidebar |
| Basemap | Map | Sidebar |
| Globe View | Map | Sidebar |

### Shared Dependencies

**All features depend on:**
- `stores/` - Global state
- `utils/` - Shared utilities
- `types/` - Shared types
- `constants/` - Global constants

---

## Feature Status

### Active Features (10/10)

All features are currently active and maintained.

### Feature Maturity

| Feature | Maturity | Test Coverage | Documentation |
|---------|----------|---------------|---------------|
| Astronomy | Stable | 0% | ⚠️ Needs docs |
| Basemap | Stable | 0% | ⚠️ Needs docs |
| Clustering | Stable | 0% | ⚠️ Needs docs |
| Data Import | Stable | 0% | ⚠️ Needs docs |
| Data Mapper | Stable | 0% | ⚠️ Needs docs |
| Geocoder | Stable | 0% | ⚠️ Needs docs |
| Globe View | Beta | 0% | ⚠️ Needs docs |
| Legend | Stable | 0% | ⚠️ Needs docs |
| Map | Stable | 0% | ⚠️ Needs docs |
| Viz Wizard | Stable | 85%+ | ✅ Good |

**Overall:**
- **Stable:** 9 features
- **Beta:** 1 feature
- **Test Coverage:** 86.52% (utils only)
- **Documentation:** Needs improvement

### Roadmap

**Q1 2026:**
- [ ] Add component tests for all features
- [ ] Improve feature documentation
- [ ] Add integration tests

**Q2 2026:**
- [ ] Performance optimization
- [ ] Code splitting
- [ ] Bundle size reduction

**Q3 2026:**
- [ ] New features (TBD)
- [ ] UI/UX improvements

---

## Feature Guidelines

### Adding a New Feature

See [CONTRIBUTING.md](./CONTRIBUTING.md#feature-development) for detailed guide.

**Quick Checklist:**
1. Create feature folder structure
2. Implement components, hooks, services
3. Create barrel export
4. Add tests
5. Update this document
6. Update dependency graph

### Deprecating a Feature

1. Mark as deprecated in this document
2. Add deprecation notice in code
3. Provide migration guide
4. Remove after 2 major versions

### Feature Ownership

Each feature should have a designated owner responsible for:
- Maintenance
- Bug fixes
- Feature requests
- Documentation
- Code reviews

---

## References

- [Architecture Guide](./ARCHITECTURE.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [ESLint Config](./eslint.config.js)

---

**Maintainers:** Development Team  
**Last Review:** 15 Şubat 2026  
**Next Review:** Monthly
