# Design Document: Feature-First Architecture Migration

## Overview

This design document outlines the technical approach for completing the Feature-First Architecture migration in the React application. The migration will move all remaining legacy components from `src/components/` to their appropriate features under `src/features/`, ensuring clean architecture boundaries and eliminating cross-feature deep imports.

The migration follows these principles:
- Domain-specific code belongs in features
- Features are self-contained with their own components, hooks, utils, types, and stores
- Features export through barrel files (index.ts)
- No deep imports between features
- Shared, domain-agnostic code remains in `src/components/`

## Architecture

### Current State Analysis

**Already Migrated Features:**
- `src/features/astronomy/` - Astronomy calculations and visualization
- `src/features/basemap/` - Basemap selection and management
- `src/features/clustering/` - Data clustering functionality
- `src/features/data-import/` - Data import and parsing
- `src/features/data-mapper/` - Data mapping and grid editing
- `src/features/geocoder/` - Geocoding services
- `src/features/globe-view/` - 3D globe visualization
- `src/features/legend-dw/` - Datawrapper legend integration
- `src/features/map/` - Core map functionality (partial)
- `src/features/viz-wizard/` - Visualization wizard

**Legacy Components Requiring Migration:**

1. **Map Components** (`src/components/map/`)
   - `MapContainer.tsx` - Main map container component
   - `controls/BasemapSwitcher.tsx` - Basemap switching control
   - `controls/GISToolsControl.tsx` - GIS tools control panel
   - `controls/GISToolsControl.buffer.tsx` - Buffer tool logic
   - `layers/DataLayer.tsx` - Data visualization layer
   - `tools/DistanceTool.tsx` - Distance measurement tool
   - `tools/DistanceTool.display.tsx` - Distance tool display logic
   - `tools/DistanceTool.handlers.ts` - Distance tool event handlers
   - `tools/DistanceTool.utils.ts` - Distance tool utilities
   - `tools/DrawTool.tsx` - Drawing tool for shapes

2. **Sidebar Components** (`src/components/sidebar/`)
   - `Sidebar.tsx` - Main sidebar container
   - `SidebarHeader.tsx` - Sidebar header component
   - `SidebarFooter.tsx` - Sidebar footer component
   - `sections/SidebarDataCatalog.tsx` - Data catalog section
   - `sections/SidebarDataCreation.tsx` - Data creation section
   - `sections/SidebarProjectManagement.tsx` - Project management section
   - `sections/SidebarProjectPurpose.tsx` - Project purpose section
   - `sections/SidebarTools.tsx` - Tools section
   - `sections/SidebarVizWizard.tsx` - Viz wizard section

3. **Modal Components** (`src/components/modals/`)
   - `ColumnMapperModal.tsx` - Column mapping modal wrapper
   - `DataMapperModal.tsx` - Data mapper modal wrapper

4. **Legend Components** (`src/components/Legend/`)
   - `DynamicLegend.tsx` - Dynamic legend component
   - `DynamicLegend.css` - Legend styles
   - `DotDensityLegend.tsx` - Dot density legend
   - `LegendBar.tsx` - Legend bar component
   - `LegendLabels.tsx` - Legend labels component
   - `SmartLabel.tsx` - Smart label positioning
   - `useLabelCollision.ts` - Label collision detection hook
   - `legend.types.ts` - Legend type definitions
   - `index.ts` - Barrel export

### Target Architecture

**Feature Structure:**
```
src/features/[feature-name]/
├── components/       # Feature-specific UI components
├── hooks/           # Feature-specific React hooks
├── utils/           # Feature-specific utilities
├── services/        # Feature-specific services
├── stores/          # Feature-specific Zustand stores
├── constants/       # Feature-specific constants
├── types.ts         # Feature-specific TypeScript types
└── index.ts         # Barrel export (public API)
```

**Migration Targets:**

1. **Map Feature** (`src/features/map/`)
   - Move all map components, controls, layers, and tools
   - Consolidate map-related functionality
   - Export MapContainer as the main component

2. **Sidebar Feature** (`src/features/sidebar/`) - NEW
   - Create new feature for sidebar orchestration
   - Move sidebar container and sections
   - Export Sidebar as the main component

3. **Data Mapper Feature** (`src/features/data-mapper/`)
   - Move modal wrappers to this existing feature
   - Add modals/ subdirectory

4. **Legend DW Feature** (`src/features/legend-dw/`)
   - Merge legacy Legend components with existing legend-dw
   - Consolidate all legend functionality

## Components and Interfaces

### Map Feature Components

**MapContainer** - Main map container
```typescript
// src/features/map/components/MapContainer.tsx
export default function MapContainer(): JSX.Element
```

**Controls:**
```typescript
// src/features/map/components/controls/BasemapSwitcher.tsx
export default function BasemapSwitcher(): JSX.Element

// src/features/map/components/controls/GISToolsControl.tsx
export default function GISToolsControl(): JSX.Element
```

**Layers:**
```typescript
// src/features/map/components/layers/DataLayer.tsx
export default function DataLayer(): JSX.Element
```

**Tools:**
```typescript
// src/features/map/components/tools/DistanceTool.tsx
export default function DistanceTool(): JSX.Element

// src/features/map/components/tools/DrawTool.tsx
export default function DrawTool(): JSX.Element
```

**Map Feature Barrel Export:**
```typescript
// src/features/map/index.ts
export { default as MapContainer } from './components/MapContainer'
export { default as BasemapSwitcher } from './components/controls/BasemapSwitcher'
export { default as GISToolsControl } from './components/controls/GISToolsControl'
export { default as DataLayer } from './components/layers/DataLayer'
export { default as DistanceTool } from './components/tools/DistanceTool'
export { default as DrawTool } from './components/tools/DrawTool'
```

### Sidebar Feature Components

**Sidebar** - Main sidebar orchestrator
```typescript
// src/features/sidebar/components/Sidebar.tsx
export default function Sidebar(): JSX.Element
```

**Sidebar Sections:**
```typescript
// src/features/sidebar/components/sections/DataCatalog.tsx
export default function DataCatalog(): JSX.Element

// src/features/sidebar/components/sections/DataCreation.tsx
export default function DataCreation(): JSX.Element

// src/features/sidebar/components/sections/ProjectManagement.tsx
export default function ProjectManagement(): JSX.Element

// src/features/sidebar/components/sections/ProjectPurpose.tsx
export default function ProjectPurpose(): JSX.Element

// src/features/sidebar/components/sections/Tools.tsx
export default function Tools(): JSX.Element

// src/features/sidebar/components/sections/VizWizard.tsx
export default function VizWizard(): JSX.Element
```

**Sidebar Feature Barrel Export:**
```typescript
// src/features/sidebar/index.ts
export { default as Sidebar } from './components/Sidebar'
```

### Data Mapper Feature Modals

**Modal Components:**
```typescript
// src/features/data-mapper/components/modals/DataMapperModal.tsx
export default function DataMapperModal(props: DataMapperModalProps): JSX.Element

// src/features/data-mapper/components/modals/ColumnMapperModal.tsx
export default function ColumnMapperModal(props: ColumnMapperModalProps): JSX.Element
```

**Updated Data Mapper Barrel Export:**
```typescript
// src/features/data-mapper/index.ts
export { default as DataMapper } from './DataMapper'
export { default as DataMapperModal } from './components/modals/DataMapperModal'
export { default as ColumnMapperModal } from './components/modals/ColumnMapperModal'
```

### Legend DW Feature Components

**Merged Legend Components:**
```typescript
// src/features/legend-dw/components/DynamicLegend.tsx
export default function DynamicLegend(props: DynamicLegendProps): JSX.Element

// src/features/legend-dw/components/DotDensityLegend.tsx
export default function DotDensityLegend(props: DotDensityLegendProps): JSX.Element

// src/features/legend-dw/components/LegendBar.tsx
export function LegendBar(props: LegendBarProps): JSX.Element

// src/features/legend-dw/components/LegendLabels.tsx
export function LegendLabels(props: LegendLabelsProps): JSX.Element

// src/features/legend-dw/components/SmartLabel.tsx
export function SmartLabel(props: SmartLabelProps): JSX.Element
```

**Legend Hooks:**
```typescript
// src/features/legend-dw/hooks/useLabelCollision.ts
export function useLabelCollision(/* params */): LabelCollisionResult
```

**Updated Legend DW Barrel Export:**
```typescript
// src/features/legend-dw/index.ts
export { default as Legend } from './Legend'
export { default as DynamicLegend } from './components/DynamicLegend'
export { default as DotDensityLegend } from './components/DotDensityLegend'
export { LegendBar, LegendLabels, SmartLabel } from './components'
export { useLabelCollision } from './hooks/useLabelCollision'
export type * from './types'
```

## Data Models

### Component Location Mapping

| Legacy Path | Target Path | Feature |
|------------|-------------|---------|
| `src/components/map/MapContainer.tsx` | `src/features/map/components/MapContainer.tsx` | map |
| `src/components/map/controls/BasemapSwitcher.tsx` | `src/features/map/components/controls/BasemapSwitcher.tsx` | map |
| `src/components/map/controls/GISToolsControl.tsx` | `src/features/map/components/controls/GISToolsControl.tsx` | map |
| `src/components/map/controls/GISToolsControl.buffer.tsx` | `src/features/map/components/controls/GISToolsControl.buffer.tsx` | map |
| `src/components/map/layers/DataLayer.tsx` | `src/features/map/components/layers/DataLayer.tsx` | map |
| `src/components/map/tools/DistanceTool.tsx` | `src/features/map/components/tools/DistanceTool.tsx` | map |
| `src/components/map/tools/DistanceTool.display.tsx` | `src/features/map/components/tools/DistanceTool.display.tsx` | map |
| `src/components/map/tools/DistanceTool.handlers.ts` | `src/features/map/components/tools/DistanceTool.handlers.ts` | map |
| `src/components/map/tools/DistanceTool.utils.ts` | `src/features/map/components/tools/DistanceTool.utils.ts` | map |
| `src/components/map/tools/DrawTool.tsx` | `src/features/map/components/tools/DrawTool.tsx` | map |
| `src/components/sidebar/Sidebar.tsx` | `src/features/sidebar/components/Sidebar.tsx` | sidebar |
| `src/components/sidebar/SidebarHeader.tsx` | `src/features/sidebar/components/SidebarHeader.tsx` | sidebar |
| `src/components/sidebar/SidebarFooter.tsx` | `src/features/sidebar/components/SidebarFooter.tsx` | sidebar |
| `src/components/sidebar/sections/SidebarDataCatalog.tsx` | `src/features/sidebar/components/sections/DataCatalog.tsx` | sidebar |
| `src/components/sidebar/sections/SidebarDataCreation.tsx` | `src/features/sidebar/components/sections/DataCreation.tsx` | sidebar |
| `src/components/sidebar/sections/SidebarProjectManagement.tsx` | `src/features/sidebar/components/sections/ProjectManagement.tsx` | sidebar |
| `src/components/sidebar/sections/SidebarProjectPurpose.tsx` | `src/features/sidebar/components/sections/ProjectPurpose.tsx` | sidebar |
| `src/components/sidebar/sections/SidebarTools.tsx` | `src/features/sidebar/components/sections/Tools.tsx` | sidebar |
| `src/components/sidebar/sections/SidebarVizWizard.tsx` | `src/features/sidebar/components/sections/VizWizard.tsx` | sidebar |
| `src/components/modals/DataMapperModal.tsx` | `src/features/data-mapper/components/modals/DataMapperModal.tsx` | data-mapper |
| `src/components/modals/ColumnMapperModal.tsx` | `src/features/data-mapper/components/modals/ColumnMapperModal.tsx` | data-mapper |
| `src/components/Legend/DynamicLegend.tsx` | `src/features/legend-dw/components/DynamicLegend.tsx` | legend-dw |
| `src/components/Legend/DynamicLegend.css` | `src/features/legend-dw/components/DynamicLegend.css` | legend-dw |
| `src/components/Legend/DotDensityLegend.tsx` | `src/features/legend-dw/components/DotDensityLegend.tsx` | legend-dw |
| `src/components/Legend/LegendBar.tsx` | `src/features/legend-dw/components/LegendBar.tsx` | legend-dw |
| `src/components/Legend/LegendLabels.tsx` | `src/features/legend-dw/components/LegendLabels.tsx` | legend-dw |
| `src/components/Legend/SmartLabel.tsx` | `src/features/legend-dw/components/SmartLabel.tsx` | legend-dw |
| `src/components/Legend/useLabelCollision.ts` | `src/features/legend-dw/hooks/useLabelCollision.ts` | legend-dw |
| `src/components/Legend/legend.types.ts` | `src/features/legend-dw/types.ts` | legend-dw |

### Import Update Strategy

**Before Migration:**
```typescript
// AppLayout.tsx
import Sidebar from '@/components/sidebar/Sidebar'
import MapContainer from '@/components/map/MapContainer'
```

**After Migration:**
```typescript
// AppLayout.tsx
import { Sidebar } from '@/features/sidebar'
import { MapContainer } from '@/features/map'
```

**Sidebar Section Imports (Before):**
```typescript
// SidebarVizWizard.tsx
import { DataMapperModal } from '@/components/modals/DataMapperModal'
```

**Sidebar Section Imports (After):**
```typescript
// SidebarVizWizard.tsx
import { DataMapperModal } from '@/features/data-mapper'
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

