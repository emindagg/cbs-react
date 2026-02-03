# Veri Yapıları ve Şemaları

Bu dokümantasyon, AtlasCopy'de kullanılan veri yapılarını, veri akışlarını ve depolama şemalarını açıklar.

## İçindekiler

- [Veri Kaynakları](#veri-kaynakları)
- [Veri Yapıları](#veri-yapıları)
- [State Yapısı](#state-yapısı)
- [Veri Akışları](#veri-akışları)
- [Veri Formatları](#veri-formatları)
- [Veri Dönüşümleri](#veri-dönüşümleri)

---

## Veri Kaynakları

### Uzak Sunucu (Varsayılan)

```yaml
Repo: https://github.com/emindagg/katman_verisi
CDN: https://cdn.jsdelivr.net/gh/emindagg/katman_verisi/

Dosya Standartları:
  - Küçük harf dosya isimleri
  - Türkçe karakter yok
  - Format: .zip veya .geojson
```

### Yerel Klasör

```javascript
// LayerManager'da mod değiştirme
this.dataSourceMode = 'local';
this.localBasePath = './katmanverisi/';
```

---

## Veri Yapıları

### Marker Veri Yapısı

```javascript
// Point (Nokta)
{
    id: 1699456789123,
    type: 'point',
    coordinates: [32.8597, 39.9334],  // [lng, lat]
    name: 'Ankara',
    description: 'Başkent',
    color: '#FF5733',
    properties: {
        population: 5747325,
        region: 'İç Anadolu'
    },
    timestamp: 1699456789123
}

// Area (Alan)
{
    id: 1699456789124,
    type: 'area',
    coordinates: [[lng, lat], ...],  // Kapalı poligon
    name: 'Park Alanı',
    area: 245000,  // m²
    color: '#00AA00'
}

// Route (Rota)
{
    id: 1699456789125,
    type: 'route',
    coordinates: [[lng, lat], ...],
    name: 'Bisiklet Yolu',
    distance: 1250,  // metre
    color: '#0000FF'
}

// Circle (Daire)
{
    id: 1699456789126,
    type: 'circle',
    coordinates: [32.8597, 39.9334],  // Merkez
    radius: 500,  // metre
    name: 'Etki Alanı',
    color: '#FF00FF'
}
```

### GeoJSON Feature Collection

```javascript
{
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [32.8597, 39.9334]
            },
            properties: {
                name: 'Ankara',
                value: 5747325,
                hasData: true,
                color: '#3b528b'
            }
        }
    ]
}
```

### Visualization Data

```javascript
{
    provinceData: [
        {
            il_adi: 'Ankara',
            il_kodu: '06',
            nufus: 5747325,
            alan: 25632
        }
    ],
    
    visualization: {
        type: 'choropleth',
        column: 'nufus',
        classificationMethod: 'quantile',
        classCount: 5,
        breaks: [0, 500000, 1000000, 2000000, 5000000, 16000000],
        colors: ['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#2c7fb8']
    }
}
```

### Timeline Data

```javascript
{
    timelineData: [
        {
            id: 1,
            coordinates: [32.8597, 39.9334],
            timestamp: 1609459200000,  // 2021-01-01
            properties: {
                value: 100,
                category: 'A'
            }
        }
    ],
    config: {
        mode: 'cumulative',
        interval: 'day',
        speed: 1000
    }
}
```

---

## State Yapısı

### ApplicationCore State

```javascript
{
    // Kullanıcı verisi
    user: {
        markers: [],
        measurements: [],
        catalogGeometryLayers: [],
        settings: {
            theme: 'light',
            language: 'tr'
        }
    },

    // Çizim durumu
    drawing: {
        isDrawing: false,
        currentTool: null,
        geometry: [],
        mode: null
    },

    // Analiz durumu
    analysis: {
        bufferActive: false,
        lastBufferRadius: 500,
        clusteringEnabled: false,
        heatmapEnabled: false,
        heatmapConfig: {
            radius: 40,
            blur: 22,
            intensity: 3
        },
        states: {
            convex: false,
            voronoi: false,
            nearest: false
        }
    },

    // Harita durumu
    map: {
        center: [32.8597, 39.9334],
        zoom: 6,
        bearing: 0,
        pitch: 0,
        style: 'OPENSTREET'
    },

    // UI durumu
    ui: {
        sidebarOpen: false,
        toolsPanelOpen: false,
        basemapPanelOpen: false,
        timelineVisible: false,
        mapMode: 'normal',
        labels: {
            provinceLabels: false,
            valueLabels: false,
            mapTitle: false,
            northArrow: false
        },
        legend: {
            layout: 'vertical',
            labelMode: 'ranges'
        }
    },

    // Görselleştirme durumu
    visualization: {
        active: false,
        type: null,
        data: null,
        config: {}
    },

    // Timeline durumu
    timeline: {
        active: false,
        data: [],
        currentDate: null,
        playing: false,
        mode: 'cumulative',
        interval: 'day',
        speed: 1000
    },

    // Astronomi durumu
    astronomy: {
        active: false,
        features: {
            sunPosition: false,
            terminator: false,
            moonPhase: false
        },
        currentDate: new Date(),
        playing: false,
        speed: 1
    }
}
```

### Global Mode Flags

```javascript
// FAB kontrolleri için
window.dataMapOnlyMode = false;
window.currentMapMode = 'normal';
```

---

## Veri Akışları

### Marker Ekleme Akışı

```
User Action (Harita tıklama)
    ↓
Event Handler
    ↓
MarkerManager.addMarkerToMap()
    ↓
├─→ State Update: state.set('user.markers', [...])
│       ↓
│   State Observers → UI Update
│
├─→ Event Emission: events.emit('marker:added', {...})
│       ↓
│   Event Handlers → Analytics, Logging
│
└─→ Map Rendering
        ↓
    MapLibre GL marker
```

### Görselleştirme Akışı

```
Veri Seçimi (Excel/CSV)
    ↓
Visualization Wizard
    ↓
├─→ Column seçimi
├─→ Classification method
├─→ Class count
└─→ Color scheme
    ↓
GeoJSON Loading (il/ilçe)
    ↓
Data Matching (normalizeName)
    ↓
├─→ hasData: true (eşleşen)
└─→ hasData: false (eşleşmeyen)
    ↓
Classification Algorithm
    ↓
Color Assignment
    ↓
MapLibre GL Layers
    ↓
├─→ choropleth-fill
├─→ choropleth-outline
└─→ Labels (opsiyonel)
    ↓
Legend Generation
    ↓
currentVisualization Update
    ↓
FAB Controls Enabled
```

### Timeline Filtreleme Akışı

```
Slider Input
    ↓
filterMapByTime()
    ↓
requestAnimationFrame
    ↓
_performFilter()
    ↓
├─→ _filterCatalogSources()
│     - catalog-points
│     - catalog-polygons
│     - catalog-lines
│
├─→ _filterClusterSource()
│     - markers source
│     - Web Worker (>1000)
│
└─→ _filterLabelSource()
      - Label senkronizasyonu
    ↓
Map Sources Updated
```

---

## Veri Formatları

### Excel Format

```
| id | name   | lat    | lng    | value | date       |
|----|--------|--------|--------|-------|------------|
| 1  | Ankara | 39.9334| 32.8597| 100   | 11/01/2025 |
```

**Minimum Gereksinimler:**
- Koordinat: `lat`, `lng` veya `latitude`, `longitude`
- Opsiyonel: `name`, `description`, `timestamp`

### CSV Format

```csv
id,name,lat,lng,value
1,Ankara,39.9334,32.8597,5747325
```

**Encoding:** UTF-8
**Delimiter:** Virgül (,) veya noktalı virgül (;)

### GeoJSON Format

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [32.8597, 39.9334]
      },
      "properties": {
        "name": "Ankara"
      }
    }
  ]
}
```

### Shapefile Format

```
ZIP arşivi içeriği:
├── parcels.shp (geometri)
├── parcels.shx (indeks)
├── parcels.dbf (attribute)
└── parcels.prj (koordinat sistemi)
```

**Not:** Koordinat sistemi WGS84 (EPSG:4326) olmalı.

---

## Veri Dönüşümleri

### İl Adı Normalizasyonu

```javascript
function normalizeName(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');
}

// "ANKARA" → "ankara"
// "İSTANBUL" → "istanbul"
// "ŞANLIURFA" → "sanliurfa"
```

### Koordinat Validasyonu

```javascript
function isValidCoordinate(lng, lat) {
    return (
        typeof lng === 'number' &&
        typeof lat === 'number' &&
        lng >= -180 && lng <= 180 &&
        lat >= -90 && lat <= 90 &&
        !isNaN(lng) && !isNaN(lat)
    );
}
```

### Tarih Parse

```javascript
function parseDate(dateString) {
    // ISO format
    if (dateString.includes('T')) {
        return new Date(dateString);
    }
    
    // Türkçe format: DD/MM/YYYY HH:mm:ss
    if (dateString.includes('/')) {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hours, minutes, seconds] = (timePart || '00:00:00').split(':');
        
        return new Date(year, month - 1, day, hours, minutes, seconds);
    }
    
    return new Date(dateString);
}
```

---

## Veri Sınırları

```javascript
const DATA_LIMITS = {
    maxMarkers: 50000,
    maxFileSize: 50 * 1024 * 1024,  // 50 MB
    maxGeometryPoints: 10000,
    maxProperties: 100,
    
    // Performance thresholds
    clusterThreshold: 500,
    workerThreshold: 1000,
    simplificationThreshold: 1000,
    batchSize: 1000,
    
    // Cache limits
    maxCachedLayers: 10,
    maxHistorySize: 50,
    maxDateCacheSize: 10000
};
```

---

**Son Güncelleme:** 11 Ocak 2026
**Versiyon:** 1.2.0
