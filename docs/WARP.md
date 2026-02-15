# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AtlasCopy is a modern, web-based Geographic Information System (GIS) platform built with MapLibre GL JS. It's an education-focused application developed for OGM (General Directorate of Forestry) featuring map visualization, spatial analysis, astronomy modules, and data management capabilities.

**Tech Stack:**
- Pure Vanilla JavaScript (ES6+)
- MapLibre GL JS 5.10.0 (map rendering)
- Turf.js 6.x (spatial analysis)
- Tailwind CSS (UI framework)
- Jest 29.7.0 (testing)

## Development Commands

### Running the Application

This is a static web application with no build step. Run using any HTTP server:

```powershell
# Using Python (if installed)
python -m http.server 8000

# Using npx serve (Node.js required)
npx serve

# Using http-server (Node.js required)
npx http-server -p 8000
```

Then open `http://localhost:8000` in a browser.

### Testing

**Note:** The project references npm test commands in documentation, but there is NO `package.json` file currently. Tests would need to be set up if required.

According to docs, the intended test setup would be:
```bash
npm test                  # Run all tests
npm run test:coverage     # Generate coverage report
npm run test:watch        # Watch mode
```

Current test coverage (per docs): 171 passing tests, ~1.44% overall coverage.

### Viewing Documentation

Comprehensive documentation is available in the `docs/` directory:
- `README.md` - Project overview
- `ARCHITECTURE.md` - System architecture and design patterns
- `API_REFERENCE.md` - Complete API documentation
- `CONFIGURATION.md` - Configuration options
- `TROUBLESHOOTING.md` - Common issues and solutions
- `MODELS.md`, `DATA.md`, `ALGORITHMS.md` - Domain-specific docs

## Architecture Overview

### Core Philosophy

AtlasCopy follows a **modular, event-driven architecture** with:
- **Dependency Injection** for loose coupling
- **Centralized State Management** (Observer pattern)
- **Pub/Sub Event System** for inter-module communication
- **Module Registry** for lifecycle management
- **Legacy Adapter** for backward compatibility with global variables

### Module Structure

```
assets/js/
├── core/                       # Core systems (DI, State, Events, Application)
│   ├── ApplicationCore.js      # Central orchestrator
│   ├── StateManager.js         # Reactive state management
│   ├── EventBus.js             # Pub/sub event system
│   ├── DependencyContainer.js  # DI container
│   ├── ModuleRegistry.js       # Module lifecycle
│   └── LegacyAdapter.js        # Global variable proxy
├── data/                       # Data management
│   ├── marker-manager.js       # Marker CRUD operations
│   ├── data-manager.js         # Data coordination
│   └── drawing-manager.js      # Drawing tools
├── visualization/              # Choropleth, bubble, density maps
├── spatial-analysis/           # Buffer, convex hull, voronoi, heatmap, clustering
├── features/                   # Special features
│   ├── astronomy/              # Sun/moon position, eclipses, seasons
│   ├── globe-view/             # 3D globe projection
│   └── timeline/               # Temporal data visualization
├── import-export/              # Excel, CSV, GeoJSON, KMZ, SHP support
├── measurement/                # Distance and area measurement tools
├── components/                 # UI components (sidebar, panels, modals)
└── utils/                      # Helper functions and utilities
```

### State Management

**Centralized Reactive State** - All application state flows through `StateManager`:

```javascript
// Reading state (dot notation)
const markers = app.state.get('user.markers', [])

// Updating state (observers notified automatically)
app.state.set('user.markers', [...markers, newMarker])

// Subscribe to changes (wildcard supported)
const id = app.state.subscribe('user.markers', (newValue, oldValue) => {
    // UI updates automatically
})
```

**Important State Paths:**
- `user.markers` - User-created markers
- `user.measurements` - Distance/area measurements
- `drawing.isDrawing` - Drawing mode state
- `analysis.bufferActive` - Buffer analysis state
- `analysis.clusteringEnabled` - Clustering toggle
- `map.clusteringEnabled` - Duplicate clustering state (legacy)
- `visualization.active` - Choropleth/visualization state
- `timeline.active` - Timeline feature state
- `astronomy.active` - Astronomy module state

### Event System

**Pub/Sub Pattern** for decoupled module communication:

```javascript
// Emit events
app.events.emit('marker:added', { marker: data })

// Listen to events
app.events.on('marker:added', (data) => {
    // Handle event
})

// Wildcard listeners
app.events.on('marker:*', (data, eventName) => {
    // Catch all marker events
})
```

**Event Naming Convention:** `<module>:<action>:<status?>`
- Examples: `marker:added`, `drawing:completed`, `analysis:buffer:created`

### Module Lifecycle

Modules have a defined lifecycle managed by `ModuleRegistry`:

1. **Register** - Module definition registered
2. **Initialize** - Dependencies resolved, instance created
3. **Start** - Module begins operation
4. **Stop** - Cleanup and shutdown

Dependencies are resolved via **topological sort** to ensure correct initialization order.

### Legacy Compatibility

The `LegacyAdapter` provides bidirectional sync between:
- Global variables (`window.userMarkers`)
- Modern state system (`app.state.get('user.markers')`)

This allows gradual migration from global state to the new architecture.

## Working with This Codebase

### MapLibre GL Layers

Understand the rendering order (bottom to top):
1. Basemap style
2. Choropleth fills/outlines
3. User geometries (areas, routes, circles)
4. Heatmap
5. Clusters
6. Analysis results (buffer, convex hull, voronoi)
7. Measurements
8. Astronomy layers (terminator, sun/moon)
9. Labels
10. DOM markers (maplibregl.Marker)

### Adding a New Feature

1. Create module in appropriate directory
2. Define dependencies in module definition
3. Register with `ModuleRegistry`
4. Use `StateManager` for state, `EventBus` for events
5. Follow existing patterns (see `marker-manager.js` as example)

### State vs Events

- **State**: Use for data that needs to persist and be queryable
- **Events**: Use for notifications and side effects that don't need persistence

### Coordinate Format

**Critical:** MapLibre uses `[longitude, latitude]` order, NOT `[latitude, longitude]`.
- Correct: `[32.8597, 39.9334]` (Ankara)
- Wrong: `[39.9334, 32.8597]`

### Data Import Flow

1. File selection → FileReader API
2. Format detection (Excel/CSV/GeoJSON/KMZ/SHP)
3. Parsing with appropriate library (XLSX/JSZip/shp.js)
4. Column mapping UI (for coordinate identification)
5. Data validation (coordinate bounds, types)
6. Batch processing (1000 items per batch)
7. Progress updates via modal
8. State update and UI refresh

### Performance Considerations

- **Clustering:** Auto-enable when markers > 500
- **Batch processing:** Load data in chunks of 1000
- **Geometry simplification:** Use Turf.js simplify for complex polygons
- **Event throttling:** Throttle map move events to 16ms (60fps)

### Turkish Language Support

The application is primarily in Turkish:
- UI labels in Turkish
- Province/district names use Turkish characters (İ, Ğ, Ü, Ş, Ö, Ç)
- Use proper Turkish locale for string operations: `toLocaleLowerCase('tr')`

## Important Files

- `index.html` - Main entry point, loads all dependencies in order
- `assets/js/core/ApplicationCore.js` - Application bootstrapping
- `assets/js/data/marker-manager.js` - Primary marker operations
- `assets/js/visualization/visualization-manager.js` - Choropleth maps
- `assets/js/spatial-analysis/spatial-analysis-manager.js` - Spatial analysis
- `assets/js/features/timeline/timeline.js` - Timeline functionality
- `assets/js/utils/logger.js` - Logging utility (MUST be loaded first)

## Script Loading Order

**Critical:** Scripts must load in dependency order. Logger MUST be first:

1. Logger utility
2. Constants (Turkey provinces, map config)
3. Column mapping
4. Data manager
5. Label manager
6. Timeline manager
7. Measurement tools
8. Core initialization modules

Check `index.html` for the complete loading sequence.

## Common Patterns

### Adding Markers

```javascript
const marker = {
    id: Date.now(),
    type: 'point',  // 'point' | 'area' | 'route' | 'circle'
    coordinates: [lng, lat],
    name: 'Marker Name',
    description: 'Optional description',
    color: '#3B82F6'
};
window.markerManager.addMarkerToMap(marker);
```

### Spatial Analysis

```javascript
// Buffer analysis (radius in meters)
window.spatialAnalysisManager.performBufferAnalysis(500);

// Toggle heatmap
window.spatialAnalysisManager.toggleHeatmap();

// Toggle clustering
window.spatialAnalysisManager.toggleClustering();

// Convex hull
window.spatialAnalysisManager.buildConvexHull();

// Voronoi
window.spatialAnalysisManager.buildVoronoi();
```

### Choropleth Visualization

```javascript
const visualizationManager = new VisualizationManager(map, dataManager);
await visualizationManager.visualizeChoropleth(data, {
    column: 'population',
    classificationMethod: 'quantile',  // 'quantile' | 'jenks' | 'equal' | 'geometric'
    classCount: 5,
    colorScheme: 'viridis'
});
```

## Troubleshooting

### "Logger.log is not a function"
Ensure `assets/js/utils/logger.js` is loaded first in `index.html`.

### "map is not defined"
Wait for map load: `map.on('load', () => { /* your code */ })`

### CORS Errors
Use a proper HTTP server (not `file://` protocol). Python's http.server or npx serve work well.

### Markers Not Visible
Check coordinate order (longitude first!), zoom level, and source/layer existence.

### Performance Issues
- Enable clustering for >500 markers
- Simplify complex geometries with Turf.js
- Use batch processing for large datasets

## Browser Requirements

**Minimum:**
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- WebGL support required (for MapLibre GL)
- 4GB RAM, dual-core 2.0 GHz

**Recommended:**
- Latest Chrome/Firefox/Safari/Edge
- 8GB+ RAM, dedicated GPU
- 1920x1080+ screen resolution

## External Dependencies (CDN)

All loaded from CDN, no npm install needed:
- MapLibre GL JS 5.10.0
- Turf.js 6.x
- SunCalc 1.9.0
- SheetJS 0.20.1
- JSZip 3.10.1
- Shapefile.js 4.0.4
- Tailwind CSS (JIT)
- Font Awesome 6.5.1
- Interact.js (for draggable elements)

## Testing Notes

**Current Status:** Test infrastructure referenced in docs but `package.json` doesn't exist. If implementing tests:

1. Install Jest 29.7.0 and dependencies
2. Use jsdom test environment
3. Mock MapLibre GL, fetch, localStorage
4. Target coverage: Statements 1.44%, Functions 1.88%

## Repository Information

- **No package.json** - Static HTML/JS/CSS application
- **No build process** - Direct browser execution
- **Git repository** - Version controlled with .git directory
- **Test data** - Available in `test-verisi/` directory
- **Documentation** - Extensive docs in `docs/` folder

## Key Design Principles

1. **Modularity** - Independent, reusable modules
2. **Separation of Concerns** - Single responsibility per module
3. **Reactive State** - Observer pattern for state management
4. **Event-Driven** - Pub/sub for loose coupling
5. **Progressive Enhancement** - Core functionality works everywhere
6. **Performance First** - Optimized for large datasets
7. **Backward Compatible** - Legacy adapter for existing code

---

**Version:** 1.0.0  
**Last Updated:** November 8, 2025  
**Status:** ✅ Active Development
