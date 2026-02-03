# 📚 Catalog - Data Catalog Integration

Browse and import data from external data catalogs and APIs.

## 📋 Contents

- **`index.js`** - Main entry point
- **`catalog-browser.js`** - Browse available datasets
- **`catalog-search.js`** - Search catalog by keywords
- **`dataset-preview.js`** - Preview dataset before import
- **`catalog-api.js`** - API client for catalog services

## 🎯 Features

- **Browse Datasets:** Explore available data sources
- **Search:** Find datasets by keyword, category, location
- **Preview:** See dataset metadata and sample before import
- **Import:** Direct import to map
- **Filters:** Filter by type, date range, bounding box

## 📦 Supported Catalogs

- **OpenDataSoft:** Public open data portal
- **CKAN:** Open data catalog platform
- **Socrata:** City/government data
- **ArcGIS Hub:** Esri data portal
- **Custom APIs:** Configurable endpoints

## 📦 Usage

```javascript
import { CatalogBrowser } from './features/catalog/index.js';

const catalog = new CatalogBrowser({
    providers: ['opendatasoft', 'ckan'],
    autoImport: false
});

// Search for datasets
const results = await catalog.search({
    query: 'traffic accidents',
    location: { lat: 40.7128, lon: -74.0060, radius: 50 },
    dataType: 'point'
});

// Preview dataset
const preview = await catalog.preview(results[0].id);
console.log('Records:', preview.recordCount);
console.log('Fields:', preview.fields);

// Import dataset
await catalog.import(results[0].id, {
    map: mapInstance,
    limit: 1000 // Max records
});
```

## 🔄 Use Cases

- **Research:** Find relevant datasets for analysis
- **Urban Planning:** Import city infrastructure data
- **Environmental:** Access climate, pollution data
- **Demographics:** Population, census data
- **Transportation:** Roads, transit, traffic

## 🌐 Data Discovery

Helps users discover and use public data without manual download/upload.

---

**Status:** 🔴 Not Yet Implemented
**Priority:** Medium (High Value Feature)
**Last Updated:** 2025-01-XX
