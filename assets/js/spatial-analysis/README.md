# 🗺️ Spatial Analysis - Geospatial Analysis Tools

Advanced spatial analysis and geoprocessing operations.

## 📋 Contents

- **`index.js`** - Main entry point and exports
- **`buffer-analysis.js`** - Buffer analysis and overlap detection
- **`clustering.js`** - Point clustering (MapLibre clusters)
- **`heatmap.js`** - Heatmap analysis and visualization
- **`convex-hull.js`** - Convex hull generation
- **`voronoi.js`** - Voronoi diagram (Thiessen polygons)
- **`nearest-facility.js`** - Nearest facility analysis
- **`analysis-utils.js`** - Shared utility functions

## 🎯 Analysis Types

### Buffer Analysis
Create buffers around features and detect overlaps.

```javascript
import { BufferAnalysis } from './spatial-analysis/buffer-analysis.js';

const analysis = new BufferAnalysis({ map });

// Single buffer
analysis.createBuffer({
    features: markers,
    radius: 500,
    unit: 'meters'
});

// Multiple buffers with overlap detection
analysis.createMultipleBuffers({
    features: markers,
    radii: { marker1: 500, marker2: 1000 },
    detectOverlaps: true
});
```

### Clustering
Cluster nearby points for better visualization.

```javascript
import { Clustering } from './spatial-analysis/clustering.js';

const clustering = new Clustering({ map });

clustering.enable({
    radius: 50,
    maxZoom: 14
});
```

### Heatmap
Visualize point density and intensity.

```javascript
import { Heatmap } from './spatial-analysis/heatmap.js';

const heatmap = new Heatmap({ map });

heatmap.create({
    data: markers,
    radius: 20,
    intensity: 1,
    colorScheme: 'viridis'
});
```

### Convex Hull
Find the smallest convex polygon containing all points.

```javascript
import { ConvexHull } from './spatial-analysis/convex-hull.js';

const hull = new ConvexHull({ map });

hull.create({
    points: markers,
    fill: '#3b82f680',
    stroke: '#3b82f6'
});
```

### Voronoi Diagrams
Create Thiessen polygons (nearest-neighbor regions).

```javascript
import { Voronoi } from './spatial-analysis/voronoi.js';

const voronoi = new Voronoi({ map });

voronoi.create({
    points: markers,
    bbox: [minLng, minLat, maxLng, maxLat]
});
```

### Nearest Facility
Find the closest facility to each demand point.

```javascript
import { NearestFacility } from './spatial-analysis/nearest-facility.js';

const nearest = new NearestFacility({ map });

nearest.analyze({
    facilities: hospitals,
    demandPoints: patients,
    showRoutes: true
});
```

## 📐 Spatial Operations

| Operation | Input | Output | Use Case |
|-----------|-------|--------|----------|
| Buffer | Point/Line/Polygon | Polygon | Proximity analysis |
| Clustering | Points | Clusters | Visualization optimization |
| Heatmap | Points | Raster | Density visualization |
| Convex Hull | Points | Polygon | Boundary detection |
| Voronoi | Points | Polygons | Service area delineation |
| Nearest | Points → Points | Pairs + Routes | Accessibility analysis |

## 🔗 Dependencies

- **MapLibre GL JS** - Map rendering
- **Turf.js** - Geospatial calculations
  - `@turf/buffer`
  - `@turf/convex`
  - `@turf/voronoi`
  - `@turf/nearest-point`
  - `@turf/boolean-intersects`

## 📊 Performance Considerations

- **Large Datasets:** Use clustering for 1000+ points
- **Buffer Precision:** Adjust steps based on accuracy needs
- **Heatmap Radius:** Larger radius = better performance
- **Voronoi:** Computationally expensive for 10000+ points

## 🎨 Visualization Options

All analysis results can be styled:
- Fill color/opacity
- Stroke color/width
- Label placement
- Interactive popups
- Dynamic updates

---

**Original File:** `spatial-analysis.js` (93KB)
**Split Into:** 7 modular files
**Status:** 🟡 To Be Implemented
**Last Updated:** 2025-01-XX
