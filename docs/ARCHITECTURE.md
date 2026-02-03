# AtlasCopy - Sistem Mimarisi

Bu dokümantasyon, AtlasCopy'nin teknik mimarisini, sistem tasarımını, bileşenler arası ilişkileri ve tasarım kararlarını detaylı olarak açıklar.

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Mimari Katmanlar](#mimari-katmanlar)
- [Çekirdek Sistemler](#çekirdek-sistemler)
- [FAB Kontrol Sistemi](#fab-kontrol-sistemi)
- [Timeline Mimarisi](#timeline-mimarisi)
- [Harita Mimarisi](#harita-mimarisi)
- [Tasarım Desenleri](#tasarım-desenleri)

---

## Genel Bakış

### Mimari Prensipler

1. **Modülerlik**: Bağımsız, yeniden kullanılabilir modüller
2. **Separation of Concerns**: Her modül tek bir sorumluluğa sahip
3. **Dependency Injection**: Gevşek bağlı, test edilebilir kod
4. **Event-Driven Architecture**: Reaktif, ölçeklenebilir iletişim
5. **State Management**: Merkezi, öngörülebilir state yönetimi
6. **Performance First**: Optimize edilmiş, hızlı kullanıcı deneyimi
7. **Intentional Minimalism**: Gereksiz karmaşıklıktan kaçınma

### Teknoloji Stack

```yaml
Frontend Framework: Vanilla JavaScript (ES6+)
Harita Engine: MapLibre GL JS 5.10.0
UI Framework: Tailwind CSS (JIT)
Spatial Analysis: Turf.js 6.x
Astronomy: SunCalc 1.9.0
Data Processing: SheetJS, JSZip, Shapefile.js
Testing: Jest 29.7.0
Background Processing: Web Workers
```

---

## Mimari Katmanlar

### Sistem Bileşenleri Diyagramı

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│  Sidebar │ FAB Menu │ Modals │ Timeline │ Panels        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               Application Layer                          │
│  VisualizationManager │ LabelManager │ TimelineManager  │
│  SpatialAnalysis │ GeocoderManager │ ImportExport       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                Core Layer                                │
│  ApplicationCore │ StateManager │ EventBus              │
│  DependencyContainer │ ModuleRegistry │ LegacyAdapter   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│             Infrastructure Layer                         │
│  MapLibre GL │ Turf.js │ SunCalc │ Web Workers          │
└─────────────────────────────────────────────────────────┘
```

### Application Layer Modülleri

#### VisualizationManager
```javascript
class VisualizationManager {
    // Görselleştirme türleri
    async createChoroplethMap(userData, column, level)
    async createBubbleMap(userData, sizeColumn, colorColumn, options)
    async createDotDensityMap(userData, column, level, dotValue, dotColor)
    
    // State
    currentVisualization: {
        type: 'choropleth' | 'bubble' | 'dot-density',
        data, column, breaks, userData, level
    }
}
```

#### LabelManager (FAB Kontrolleri)
```javascript
class LabelManager {
    changeMapMode(mode)        // 'normal' | 'data-only'
    toggleProvinceLabels(show) // İl/İlçe isimleri
    toggleValueLabels(show)    // Değer etiketleri
}
```

#### TimelineManager
```javascript
class TimelineManager {
    // Web Worker destekli filtreleme
    show() / hide() / destroy()
    play() / pause() / next() / previous()
    setMode('cumulative' | 'interval')
    filterMapByTime()
}
```

---

## Çekirdek Sistemler

### ApplicationCore
```javascript
class ApplicationCore {
    state: StateManager      // Reaktif state yönetimi
    events: EventBus         // Pub/sub event sistemi
    container: DependencyContainer  // DI container
    modules: ModuleRegistry  // Modül yaşam döngüsü
}
```

### StateManager
```javascript
// State operations
state.get('user.markers', [])
state.set('visualization.active', true)
state.subscribe('user.*', callback)
```

### EventBus
```javascript
// Event naming: <module>:<action>
events.emit('visualization:rendered', { type: 'choropleth' })
events.on('marker:added', handler)
```

---

## FAB Kontrol Sistemi

### FAB Menu Yapısı

```
┌─────────────────────────────────────┐
│           FAB Menu                   │
├─────────────────────────────────────┤
│ Harita Modu                         │
│ ○ Tüm Harita  ● Sadece Veri        │
├─────────────────────────────────────┤
│ ☑ İl/İlçe İsimleri                 │
│ ☑ Değerler                         │
├─────────────────────────────────────┤
│ Lejant: Dikey ▼                    │
│ Etiket: Aralıklar ▼                │
│ Format: Otomatik ▼                 │
├─────────────────────────────────────┤
│ ☐ Yön Oku                          │
│ ☐ Harita Başlığı                   │
└─────────────────────────────────────┘
```

### Harita Modu Implementasyonu

**Normal Mod:**
```javascript
window.dataMapOnlyMode = false;
// Tüm il/ilçe sınırları görünür
```

**Sadece Veri Modu:**
```javascript
window.dataMapOnlyMode = true;
// Sadece verisi olan sınırlar görünür

// Choropleth: data-driven opacity
map.setPaintProperty('choropleth-fill', 'fill-opacity', [
    'case', ['get', 'hasData'], 1, 0
]);

// Bubble: source filtreleme
bubbleSource.setData({ features: filteredFeatures });
bubbleBoundarySource.setData(filteredBoundary);
```

---

## Timeline Mimarisi

### Web Worker Akışı

```
┌─────────────────┐     ┌─────────────────┐
│   Main Thread   │────▶│   Web Worker    │
│  TimelineManager│     │ timeline-worker │
│  - UI Updates   │◀────│ - Filtering     │
│  - Map Render   │     │ - Date Parse    │
└─────────────────┘     └─────────────────┘
```

### Filtreleme Akışı

```
1. Slider input → filterMapByTime()
2. requestAnimationFrame → _performFilter()
3. _filterCatalogSources() (catalog-points, polygons, lines)
4. _filterClusterSource() (markers, Web Worker >1000)
5. _filterLabelSource() (label senkronizasyonu)
6. Map sources updated
```

### Performance Optimizations

- **Date Cache**: `this._dateCache = new Map()`
- **RAF**: Smooth UI updates
- **Throttle**: Slider input 100ms
- **Web Worker**: >1000 feature için arka plan işleme
- **Skip Redundant**: Aynı index için tekrar filtreleme yok

---

## Harita Mimarisi

### Layer Hiyerarşisi

```
1. Basemap Style (land, water, roads)
2. Visualization Layers
   - choropleth-fill, choropleth-outline
   - bubble-boundary-fill, bubble-circles
   - dot-density-boundary, dot-density-dots
3. Analysis Layers (buffer, heatmap, clusters)
4. Label Layers (province-labels, value-labels)
5. Markers (DOM elements)
```

### Source-Layer İlişkisi

```javascript
// Choropleth
choropleth-source → choropleth-fill, choropleth-outline

// Bubble
bubble-source → bubble-circles
bubble-boundary → bubble-boundary-fill, bubble-boundary-line

// Labels
province-labels-source → province-labels
value-labels-source → value-labels
```

---

## Tasarım Desenleri

### Observer Pattern
```javascript
state.subscribe('user.markers', (newValue) => updateUI(newValue));
```

### Pub/Sub Pattern
```javascript
events.emit('visualization:rendered', { type: 'choropleth' });
events.on('visualization:rendered', enableFABControls);
```

### Lazy Initialization
```javascript
if (!window.labelManager && window.map) {
    window.labelManager = new LabelManager(window.map);
}
```

### Mutex Pattern (Panel Management)
```javascript
// CBS Araçları ve Veri Stili paneli aynı anda açık olamaz
function openToolsPanel() {
    if (layerStylePanel.isVisible) layerStylePanel.hide();
    toolsPanel.show();
}
```

---

**Son Güncelleme:** 11 Ocak 2026
**Versiyon:** 1.2.0
