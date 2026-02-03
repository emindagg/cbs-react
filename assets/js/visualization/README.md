# 📊 Visualization - Data Visualization System

Advanced data visualization and thematic mapping.

## 📋 Contents

### Core Modules
- **`index.js`** - Main entry point and exports
- **`visualization-manager.js`** - Core visualization manager

### Renderers
- **`choropleth-renderer.js`** - Choropleth (thematic) maps
- **`bubble-renderer.js`** - Bubble/proportional symbol maps
- **`dot-density-renderer.js`** - Dot density maps
- **`heatmap-renderer.js`** - Heatmap visualization

### Utilities
- **`legend-builder.js`** - Dynamic legend generation
- **`color-schemes.js`** - Color palettes and scales
- **`classification-methods.js`** - Data classification (Jenks, quantile, etc.)

### UI
- **`wizard.js`** - Visualization creation wizard
- **`handlers.js`** - UI event handlers

## 🎯 Visualization Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Choropleth** | Color-coded regions | Population density, GDP per capita |
| **Bubble** | Sized circles | City populations, earthquake magnitudes |
| **Dot Density** | One dot = N units | Agricultural production, demographics |
| **Heatmap** | Intensity-based | Crime hotspots, disease clusters |

## 📦 Usage

```javascript
import { VisualizationManager } from './visualization/index.js';

const viz = new VisualizationManager({
    map: mapInstance,
    data: geojsonData
});

// Create choropleth
viz.createChoropleth({
    field: 'population',
    method: 'jenks',
    classes: 5,
    colorScheme: 'YlOrRd'
});

// Create bubble map
viz.createBubble({
    field: 'gdp',
    minSize: 5,
    maxSize: 50,
    color: '#3b82f6'
});
```

## 🎨 Classification Methods

- **Equal Interval** - Equal-sized ranges
- **Quantile** - Equal number of features per class
- **Natural Breaks (Jenks)** - Minimizes variance within classes
- **Standard Deviation** - Based on mean and std dev
- **Custom Breaks** - User-defined breakpoints

## 📊 Color Schemes

Supports ColorBrewer schemes:
- **Sequential:** YlOrRd, Blues, Greens
- **Diverging:** RdYlGn, PuOr, BrBG
- **Qualitative:** Set1, Set2, Paired

## 🔗 Dependencies

- MapLibre GL JS (for rendering)
- Turf.js (for calculations)
- Simple Statistics (for classification)

---

**Original File:** `visualization.js` (124KB)
**Split Into:** 10 modular files
**Status:** 🟡 To Be Implemented
**Last Updated:** 2025-01-XX
