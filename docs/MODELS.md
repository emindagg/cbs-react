# Veri Modelleri ve Hesaplama Sistemleri

Bu dokümantasyon, AtlasCopy'de kullanılan veri modelleri, hesaplama yöntemleri ve coğrafi işlem algoritmalarını açıklar.

## İçindekiler

- [Veri Modelleri](#veri-modelleri)
- [Görselleştirme Modelleri](#görselleştirme-modelleri)
- [FAB State Modelleri](#fab-state-modelleri)
- [Timeline Modelleri](#timeline-modelleri)
- [Mekansal Analiz Modelleri](#mekansal-analiz-modelleri)
- [Astronomi Modelleri](#astronomi-modelleri)

---

## Veri Modelleri

### Marker Veri Modeli

```javascript
{
    id: Number | String,
    type: 'point' | 'area' | 'route' | 'circle',
    coordinates: [lng, lat] | [[lng, lat], ...],
    name: String,
    description?: String,
    color?: String,
    properties?: Object,
    timestamp?: Number | Date,
    
    // Geometri tipi özel alanlar
    radius?: Number,    // Circle için (metre)
    area?: Number,      // Alan için (m²)
    distance?: Number   // Route için (metre)
}
```

### GeoJSON Feature Model

```javascript
{
    type: 'Feature',
    geometry: {
        type: 'Point' | 'Polygon' | 'LineString' | ...,
        coordinates: Array
    },
    properties: {
        name: String,
        value: Number,
        hasData: Boolean,  // Görselleştirme için
        color: String,     // Hesaplanmış renk
        displayName: String
    }
}
```

### Ölçüm Veri Modeli

```javascript
{
    id: String,
    type: 'distance' | 'area',
    coordinates: Array,
    result: Number,
    unit: 'm' | 'km' | 'm²' | 'km²',
    segments?: Array,
    timestamp: Number
}
```

---

## Görselleştirme Modelleri

### currentVisualization State

```javascript
window.visualizationManager.currentVisualization = {
    // Ortak alanlar
    type: 'choropleth' | 'bubble' | 'dot-density',
    data: Array,
    column: String,
    level: 'province' | 'district',
    
    // Choropleth için
    breaks: [0, 1000, 5000, 10000, 50000, 100000],
    
    // Bubble için
    userData: Array,  // Orijinal veri (filtreleme için)
    
    // Dot Density için
    dotValue: Number,
    dotColor: String
}
```

### Sınıflandırma Metodları

#### Quantile (Çeyreklik)
```
Her sınıf eşit sayıda eleman içerir.
Veri: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
5 Sınıf: [1,2] [3,4] [5,6] [7,8] [9,10]
```

#### Equal Interval (Eşit Aralık)
```
Değer aralıkları eşit genişliktedir.
Min: 0, Max: 100, 5 Sınıf
Breaks: [0, 20, 40, 60, 80, 100]
```

#### Natural Breaks (Jenks)
```
Doğal grupları tespit eder.
- Sınıf içi varyansı minimize et
- Sınıflar arası farklılığı maksimize et
```

#### Geometric Interval
```
Geometrik dizi kullanır.
break[i] = min * (max/min)^(i/n)
```

### Renk Şemaları

```javascript
const colorSchemes = {
    viridis: ['#440154', '#472777', '#3b528b', '#2c728e', '#21918c', 
              '#27ad81', '#5ec962', '#aadc32', '#fde725'],
    blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6',
            '#4292c6', '#2171b5', '#08519c', '#08306b'],
    reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a',
           '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
    greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476',
             '#41ab5d', '#238b45', '#006d2c', '#00441b']
}
```

---

## FAB State Modelleri

### Global Mode Flags

```javascript
// Harita modu
window.dataMapOnlyMode = false | true;
window.currentMapMode = 'normal' | 'data-only';
```

### UI State

```javascript
{
    ui: {
        mapMode: 'normal' | 'data-only',
        labels: {
            provinceLabels: Boolean,
            valueLabels: Boolean,
            mapTitle: Boolean,
            northArrow: Boolean
        },
        legend: {
            layout: 'vertical' | 'horizontal',
            labelMode: 'ranges' | 'labels'
        },
        numberFormat: 'auto' | 'full' | 'compact'
    }
}
```

### Sayı Format Modelleri

```javascript
// Auto (Otomatik)
1234567 → "1.2M"
1234 → "1.2K"

// Full (Tam Sayı)
1234567 → "1.234.567"

// Compact (Kompakt)
1234567 → "1,2Mn"
```

---

## Timeline Modelleri

### Timeline State

```javascript
{
    timeline: {
        active: Boolean,
        data: Array,
        currentDate: Date,
        playing: Boolean,
        mode: 'cumulative' | 'interval',
        interval: 'hour' | 'day' | 'week' | 'month' | 'year',
        speed: Number  // ms
    }
}
```

### Timeline Data Model

```javascript
{
    id: Number | String,
    coordinates: [lng, lat],
    timestamp: Number | Date,
    properties: {
        value: Number,
        category: String,
        ...
    }
}
```

### Web Worker Message Models

**Main → Worker:**
```javascript
{
    type: 'FILTER',
    requestId: Number,
    features: Array,
    currentDate: Number,      // timestamp
    previousDate: Number,     // timestamp (null olabilir)
    filterMode: 'cumulative' | 'interval',
    selectedProperty: String | null,
    propertyMin: Number,
    propertyMax: Number
}
```

**Worker → Main:**
```javascript
{
    type: 'FILTER_RESULT' | 'ERROR' | 'READY',
    requestId: Number,
    data: {
        filteredFeatures: Array,
        stats: {
            total: Number,
            filtered: Number,
            filterTime: Number
        }
    },
    error?: String
}
```

### Property Filter Model

```javascript
{
    selectedProperty: String | null,
    propertyDataMin: Number,
    propertyDataMax: Number,
    propertyCurrentMin: Number,
    propertyCurrentMax: Number,
    numericProperties: Map  // property name → {min, max, unit}
}
```

---

## Mekansal Analiz Modelleri

### Buffer Model

```javascript
{
    type: 'buffer',
    sourcePoint: [lng, lat],
    radius: Number,  // metre
    units: 'meters',
    geometry: GeoJSON.Polygon,
    area: Number  // m²
}
```

### Heatmap Model

```javascript
{
    type: 'heatmap',
    points: Array<[lng, lat]>,
    radius: Number,     // pixel (10-80)
    blur: Number,       // pixel
    intensity: Number,  // 1-10
    colorScheme: String
}
```

### Clustering Model

```javascript
{
    type: 'clustering',
    clusterRadius: Number,   // pixel
    clusterMaxZoom: Number,
    minPoints: Number
}
```

### Convex Hull Model

```javascript
{
    type: 'convexHull',
    points: Array<[lng, lat]>,
    hull: GeoJSON.Polygon,
    area: Number,      // m²
    perimeter: Number  // m
}
```

### Voronoi Model

```javascript
{
    type: 'voronoi',
    points: Array<[lng, lat]>,
    bbox: [minX, minY, maxX, maxY],
    polygons: Array<GeoJSON.Polygon>
}
```

---

## Astronomi Modelleri

### Güneş Pozisyon Modeli

```javascript
{
    date: Date,
    latitude: Number,
    longitude: Number,
    position: {
        azimuth: Number,   // radyan
        altitude: Number   // radyan
    },
    times: {
        sunrise: Date,
        sunset: Date,
        solarNoon: Date,
        goldenHour: Date,
        dusk: Date,
        night: Date
    }
}
```

### Ay Evre Modeli

```javascript
{
    date: Date,
    phase: Number,        // 0-1 (0=yeni ay, 0.5=dolunay)
    illumination: Number, // 0-1
    name: 'Yeni Ay' | 'Hilal' | 'İlk Dördün' | 'Şişkin Ay' | 
          'Dolunay' | 'Son Dördün'
}
```

### Terminator Modeli

```javascript
{
    date: Date,
    line: GeoJSON.LineString,
    sunPosition: [lng, lat]
}
```

---

## Hesaplama Formülleri

### Haversine Mesafe

```javascript
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // metre
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}
```

### Poligon Alan (Turf.js)

```javascript
const polygon = turf.polygon([coordinates]);
const area = turf.area(polygon); // m²
```

### Centroid Hesaplama

```javascript
const centroid = turf.centroid(feature);
// { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] } }
```

---

## Performans Optimizasyonları

### Date Cache

```javascript
this._dateCache = new Map();

function parseDate(dateString) {
    if (this._dateCache.has(dateString)) {
        return this._dateCache.get(dateString);
    }
    const parsed = new Date(dateString);
    if (this._dateCache.size < 10000) {
        this._dateCache.set(dateString, parsed);
    }
    return parsed;
}
```

### Batch Processing

```javascript
const batchConfig = {
    chunkSize: 1000,
    processInterval: 16,  // ~60fps
    useWebWorker: true
}
```

---

**Son Güncelleme:** 11 Ocak 2026
**Versiyon:** 1.2.0
