# 📥📤 Import/Export - Data Import and Export

Import and export geospatial data in multiple formats.

## 📋 Contents

- **`index.js`** - Main entry point
- **`import-export-manager.js`** - Core manager with DI support
- **`geojson-handler.js`** - GeoJSON import/export
- **`kml-handler.js`** - KML/KMZ import/export
- **`csv-handler.js`** - CSV import/export
- **`excel-handler.js`** - XLSX import/export
- **`shapefile-handler.js`** - Shapefile support (via geojson.io)
- **`format-utils.js`** - Shared format utilities

## 🎯 Supported Formats

### Import Formats

| Format | Extension | Features | Max Size |
|--------|-----------|----------|----------|
| **GeoJSON** | `.geojson`, `.json` | Full geometry support | 50MB |
| **KML** | `.kml` | Google Earth | 20MB |
| **KMZ** | `.kmz` | Compressed KML | 20MB |
| **CSV** | `.csv` | Point data + attributes | 10MB |
| **Excel** | `.xlsx` | Point data + attributes | 10MB |
| **Shapefile** | `.shp`, `.zip` (recommended) | Full GIS support (geometry + attributes) | 30MB |

### Export Formats

| Format | Description | Compatible With |
|--------|-------------|-----------------|
| **GeoJSON** | Industry standard | QGIS, ArcGIS, Mapbox, web apps |
| **KML** | Google Earth format | Google Earth, Google Maps |
| **KMZ** | Compressed KML | Google Earth, Google Maps |
| **CSV** | Tabular data | Excel, Google Sheets, R, Python |
| **Excel** | Spreadsheet | Microsoft Excel, LibreOffice |
| **Project JSON** | Full project state | AtlasGL (re-import all data) |

## 📦 Usage

### Import

```javascript
import { ImportExportManager } from './import-export/index.js';

const importer = new ImportExportManager({
    map: mapInstance,
    markerManager: markerManager,
    stateManager: stateManager,
    eventBus: eventBus
});

// Import GeoJSON
await importer.import('geojson', file);

// Import CSV with coordinate detection
await importer.import('csv', file, {
    latField: 'Latitude',
    lonField: 'Longitude'
});

// Import Excel
await importer.import('xlsx', file);

// Import KML/KMZ
await importer.import('kml', file);

// Import Shapefile (ZIP archive recommended)
await importer.import('shapefile', zipFile);
```

### Shapefile Import (ZIP Archive)

**Recommended Method:**
```javascript
// Create ZIP archive containing:
// - parcels.shp (geometry - required)
// - parcels.shx (index - required)
// - parcels.dbf (attributes - required)
// - parcels.prj (projection - optional, WGS84 assumed if missing)

// Upload ZIP file
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', async (e) => {
    const zipFile = e.target.files[0];
    await importer.import('shapefile', zipFile);
});
```

**Features:**
- ✅ Automatic component detection (.shp, .shx, .dbf, .prj)
- ✅ ZIP content validation
- ✅ Detailed error messages
- ✅ Attribute data preservation
- ✅ Coordinate system detection

**Single SHP File (Legacy):**
```javascript
// Works but loses attribute data
await importer.import('shapefile', shpFile);
```

### Export

```javascript
// Export as GeoJSON
importer.export('geojson', {
    filename: 'my-data',
    data: userMarkers
});

// Export as CSV
importer.export('csv', {
    filename: 'my-data',
    data: userMarkers,
    fields: ['name', 'lat', 'lon', 'type']
});

// Export as Excel
importer.export('xlsx', {
    filename: 'my-data',
    data: userMarkers,
    includeStats: true
});

// Export entire project
importer.export('project', {
    filename: 'my-project',
    includeMap: true,
    includeSettings: true
});
```

## 🔄 Data Transformation

### Import Pipeline

```
File Upload
    │
    ├─ Parse File
    │   ├─ GeoJSON: Direct parse
    │   ├─ CSV: Parse + geocode
    │   ├─ Excel: Parse + geocode
    │   ├─ KML: XML parse + convert
    │   └─ Shapefile: Unzip + parse
    │
    ├─ Validate Data
    │   ├─ Check geometry validity
    │   ├─ Verify coordinate system
    │   └─ Validate attributes
    │
    ├─ Transform
    │   ├─ Reproject if needed
    │   ├─ Extract attributes
    │   └─ Generate IDs
    │
    └─ Import to Map
        ├─ Add to markers array
        ├─ Render on map
        └─ Update UI
```

### Export Pipeline

```
Select Data
    │
    ├─ Filter Features
    │   ├─ Visible only?
    │   └─ Selected only?
    │
    ├─ Format Data
    │   ├─ GeoJSON: Feature collection
    │   ├─ CSV: Flatten geometry
    │   ├─ Excel: Add statistics
    │   └─ KML: Convert to XML
    │
    ├─ Generate File
    │   └─ Create blob
    │
    └─ Download
        └─ Trigger browser download
```

## 🧩 Format Handlers

Each format has a dedicated handler:

```javascript
// geojson-handler.js
export class GeoJSONHandler {
    async import(file) { }
    export(data, options) { }
    validate(data) { }
}

// kml-handler.js
export class KMLHandler {
    async import(file) { }
    export(data, options) { }
    parseXML(xml) { }
    convertToGeoJSON(kml) { }
}

// ... similar for other formats
```

## 📊 Large File Handling

### Batch Processing

For files > 1000 features:
1. Show progress indicator
2. Process in batches (200 features/batch)
3. Use `requestIdleCallback` for non-blocking
4. Enable clustering automatically

### Memory Management

- Stream parsing for large files
- Lazy loading of features
- Garbage collection hints
- Virtual scrolling for lists

## 🔗 Integration with DI System

Uses Dependency Injection for:
- **Map Instance** - For rendering
- **MarkerManager** - For adding features
- **StateManager** - For state updates
- **EventBus** - For progress events

```javascript
// DI-enabled import
const importer = new ImportExportManager({
    map: container.get('map'),
    markerManager: container.get('markerManager'),
    stateManager: app.state,
    eventBus: app.events
});

// Listen to import events
app.events.on('import:progress', (progress) => {
    console.log(`Importing: ${progress}%`);
});

app.events.on('import:complete', ({ count, format }) => {
    console.log(`Imported ${count} features from ${format}`);
});
```

## 🛡️ Error Handling

- Invalid file format detection
- Corrupted file recovery
- Coordinate validation
- Attribute sanitization
- User-friendly error messages

---

**Original File:** `import-export.js` (75KB)
**Split Into:** 7 modular files
**Status:** 🟡 To Be Implemented
**Last Updated:** 2025-01-XX
