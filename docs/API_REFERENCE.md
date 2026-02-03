# API Reference - AtlasCopy

Bu dokümantasyon, AtlasCopy'nin tüm API'lerini, sınıflarını, metodlarını ve parametrelerini içerir.

## İçindekiler

- [Çekirdek API'ler](#çekirdek-apiler)
- [Görselleştirme](#görselleştirme)
- [FAB Kontrolleri (LabelManager)](#fab-kontrolleri-labelmanager)
- [Timeline](#timeline)
- [Mekansal Analiz](#mekansal-analiz)
- [Geocoder](#geocoder)
- [Import/Export](#importexport)
- [Astronomi](#astronomi)
- [Event Listesi](#event-listesi)

---

## Çekirdek API'ler

### ApplicationCore

Merkezi uygulama orkestrasyon sınıfı.

**Dosya:** `assets/js/core/ApplicationCore.js`

#### Constructor

```javascript
new ApplicationCore(options)
```

**Parametreler:**
- `options.environment` (String) - `'development'` | `'production'`
- `options.config` (Object) - Uygulama yapılandırması
- `options.initialState` (Object) - Başlangıç state'i
- `options.maxHistorySize` (Number) - State history boyutu (varsayılan: 50)

#### Metodlar

```javascript
await app.initialize()  // Tüm sistemleri başlat
await app.start()       // Uygulamayı başlat
await app.stop()        // Uygulamayı durdur
app.get('serviceName')  // Container'dan servis al
```

#### Özellikler

- `app.state` - StateManager instance
- `app.events` - EventBus instance
- `app.container` - DependencyContainer instance

---

### StateManager

Reaktif state yönetim sistemi.

**Dosya:** `assets/js/core/StateManager.js`

#### Metodlar

```javascript
// Okuma
state.get('user.markers', [])     // Path ile değer al
state.has('user.markers')         // Varlık kontrolü

// Yazma
state.set('user.markers', data)   // Değer set et
state.set('ui.active', true, true) // Silent mode (observer tetikleme)
state.delete('temp.data')         // Sil
state.reset()                     // Başlangıç değerine dön

// Subscription
const id = state.subscribe('user.markers', (newVal, oldVal) => {})
state.subscribe('user.*', (value, path) => {})  // Wildcard
state.unsubscribe(id)

// History
state.getHistory()
```

---

### EventBus

Pub/sub event sistemi.

**Dosya:** `assets/js/core/EventBus.js`

#### Metodlar

```javascript
// Listener
events.on('marker:added', handler)
events.on('marker:added', handler, { priority: 1 })
events.once('app:ready', handler)
events.off('marker:added', handler)

// Emission
await events.emit('marker:added', { marker })  // Async
events.emitSync('marker:added', { marker })    // Sync

// Utility
events.clear('marker:added')
events.clearAll()
events.hasListeners('marker:added')
```

---

## Görselleştirme

### VisualizationManager

Choropleth, bubble ve dot density görselleştirmeleri.

**Dosya:** `assets/js/visualization/visualization-manager.js`

#### Constructor

```javascript
new VisualizationManager(map, dataManager)
```

#### Metodlar

##### createChoroplethMap

```javascript
await visualizationManager.createChoroplethMap(userData, column, level)
```

**Parametreler:**
- `userData` (Array) - Veri array'i `[{ location, value, ... }]`
- `column` (String) - Görselleştirilecek sütun adı
- `level` (String) - `'province'` | `'district'`

##### createBubbleMap

```javascript
await visualizationManager.createBubbleMap(userData, sizeColumn, colorColumn, bubbleColor, radiusMultiplier, options)
```

**Parametreler:**
- `userData` (Array) - Veri array'i
- `sizeColumn` (String) - Boyut sütunu
- `colorColumn` (String|null) - Renk sütunu (opsiyonel)
- `bubbleColor` (String) - Varsayılan renk (varsayılan: `'#3b82f6'`)
- `radiusMultiplier` (Number) - Yarıçap çarpanı (varsayılan: 1)
- `options` (Object):
  - `method`: `'proportional'` | `'graduated'`
  - `classCount`: Sınıf sayısı (graduated için)
  - `classification`: `'quantile'` | `'equal'` | `'jenks'`
  - `level`: `'province'` | `'district'`

##### createDotDensityMap

```javascript
await visualizationManager.createDotDensityMap(userData, column, level, dotValue, dotColor)
```

**Parametreler:**
- `userData` (Array) - Veri array'i
- `column` (String) - Değer sütunu
- `level` (String) - `'province'` | `'district'`
- `dotValue` (Number) - Her nokta kaç birimi temsil eder (varsayılan: 100)
- `dotColor` (String) - Nokta rengi (varsayılan: `'#f97316'`)

##### Diğer Metodlar

```javascript
visualizationManager.clearVisualization()
visualizationManager.setClassCount(5)           // 3-7 arası
visualizationManager.setClassificationMethod('quantile')  // quantile, equal, jenks, geometric
```

#### currentVisualization State

```javascript
window.visualizationManager.currentVisualization = {
    type: 'choropleth' | 'bubble' | 'dot-density',
    data: Array,
    column: String,
    breaks: Array,
    userData: Array,  // Bubble için orijinal veri
    level: 'province' | 'district',
    dotValue: Number,  // Dot density için
    dotColor: String   // Dot density için
}
```

---

## FAB Kontrolleri (LabelManager)

Harita etiketleri ve görselleştirme kontrolü.

**Dosya:** `assets/js/components/labels-manager.js`

#### Constructor

```javascript
new LabelManager(map)
```

#### Metodlar

##### changeMapMode

Harita görünüm modunu değiştirir.

```javascript
labelManager.changeMapMode('normal')     // Tüm harita görünür
labelManager.changeMapMode('data-only')  // Sadece verisi olanlar görünür
```

**Desteklenen Görselleştirmeler:**
- Choropleth: `fill-opacity` ve `line-opacity` data-driven styling
- Bubble: Source filtreleme (bubble-source ve bubble-boundary)
- Dot Density: Feature-level filtreleme

##### toggleProvinceLabels

İl/İlçe isimlerini gösterir/gizler.

```javascript
labelManager.toggleProvinceLabels(true)   // Göster
labelManager.toggleProvinceLabels(false)  // Gizle
```

**Özellikler:**
- Turf.js centroid hesaplama
- Symbol layer ile text rendering
- Set kullanarak tekrar önleme
- Tüm görselleştirme türlerini destekler

##### toggleValueLabels

Değer etiketlerini gösterir/gizler.

```javascript
labelManager.toggleValueLabels(true)   // Göster
labelManager.toggleValueLabels(false)  // Gizle
```

**Özellikler:**
- Formatlanmış değer gösterimi (1K, 1M, 1B)
- Choropleth ve Bubble için desteklenir
- Dot density için desteklenmez

##### clearAllLabels

Tüm etiketleri kaldırır.

```javascript
labelManager.clearAllLabels()
```

#### Global Access

```javascript
// Lazy initialization
if (!window.labelManager && window.map && window.Labels) {
    window.labelManager = new window.Labels(window.map);
}

// Kullanım
window.labelManager.changeMapMode('data-only');
window.labelManager.toggleProvinceLabels(true);
```

---

## Timeline

### TimelineManager

Zamansal veri görselleştirme ve filtreleme.

**Dosya:** `assets/js/features/timeline/timeline.js`

#### Constructor

```javascript
new TimelineManager(map)
```

#### Lifecycle Metodları

```javascript
timelineManager.show()     // Timeline'ı göster ve veri yükle
timelineManager.hide()     // Timeline'ı gizle ve filtreyi temizle
timelineManager.destroy()  // Kaynakları temizle (Worker dahil)
```

#### Playback Metodları

```javascript
timelineManager.play()        // Animasyonu başlat
timelineManager.pause()       // Animasyonu duraklat
timelineManager.togglePlay()  // Play/Pause toggle
timelineManager.next()        // Sonraki frame
timelineManager.previous()    // Önceki frame
```

#### Configuration Metodları

```javascript
timelineManager.setSpeed(1000)  // Animasyon hızı (ms)

timelineManager.setMode('cumulative')  // Kümülatif: tüm geçmiş veri
timelineManager.setMode('interval')    // Aralık: sadece dönemsel veri

timelineManager.setInterval('day')     // hour, day, week, month, year
```

#### Property Filter

```javascript
// Property seçimi
timelineManager.selectedProperty = 'value';

// Aralık ayarı
timelineManager.propertyCurrentMin = 0;
timelineManager.propertyCurrentMax = 100;
```

#### Web Worker

```javascript
// Worker otomatik başlatılır
// >1000 feature için arka plan filtreleme

// Worker durumu
timelineManager.workerEnabled  // true/false
```

#### Desteklenen Tarih Formatları

```javascript
// ISO format
"2025-01-11T10:30:00Z"

// Türkçe format
"11/01/2025 10:30:00"
"11/01/2025"

// Timestamp
1736589000000
```

---

## Mekansal Analiz

### SpatialAnalysisManager

**Dosya:** `assets/js/spatial-analysis/spatial-analysis-manager.js`

#### Metodlar

```javascript
// Buffer analizi
spatialAnalysisManager.performBufferAnalysis(500)  // 500 metre

// Isı haritası
spatialAnalysisManager.toggleHeatmap()
spatialAnalysisManager.setHeatmapRadius(40)      // 10-80 pixel
spatialAnalysisManager.setHeatmapIntensity(3)    // 1-10

// Kümeleme
spatialAnalysisManager.toggleClustering()

// Geometrik analizler
spatialAnalysisManager.buildConvexHull()
spatialAnalysisManager.buildVoronoi()
spatialAnalysisManager.findNearestFacility()
```

---

## Geocoder

### GeocoderManager

HGM Atlas API entegrasyonu ile yer arama.

**Dosya:** `assets/js/geocoder/geocoder-manager.js`

#### Constructor

```javascript
new GeocoderManager(map)
```

#### Metodlar

```javascript
// Arama
geocoderManager.search(
    'Ankara',
    (results) => console.log(results),
    (error) => console.error(error)
);

// Sonuçları göster
geocoderManager.displayResults(results);

// Sonuçları temizle
geocoderManager.clearResults();

// Sonuca uç
geocoderManager.flyToResult(result);
```

**Özellikler:**
- 3+ karakter otomatik arama
- 500ms debounce
- Dropdown sonuç listesi
- Marker ile görsel geri bildirim

---

## Import/Export

### ImportExport

**Dosya:** `assets/js/import-export/import-export-manager.js`

#### Import Metodları

```javascript
await importExport.importExcel(file)      // .xlsx, .xls
await importExport.importGeoJSON(file)    // .geojson, .json
await importExport.importKMZ(file)        // .kmz
await importExport.importShapefile(file)  // .shp (ZIP önerilir)
```

#### Export Metodları

```javascript
await importExport.exportToExcel()
await importExport.exportToGeoJSON()
await importExport.exportToCSV()
```

---

## Astronomi

### AstroGlobe

**Dosya:** `assets/js/features/astronomy/astro-globe.js`

#### Metodlar

```javascript
AstroGlobe.initialize(map)

// Toggle features
AstroGlobe.toggleSunPosition()
AstroGlobe.toggleTerminator()
AstroGlobe.toggleMoonPhase()

// Zaman kontrolü
AstroGlobe.setDateTime(new Date('2025-01-11'))
AstroGlobe.play()
AstroGlobe.pause()
AstroGlobe.setSpeed(2.5)  // 2.5x hız
```

---

## Event Listesi

### Visualization Events
- `visualization:rendered` - Görselleştirme oluşturuldu
- `visualization:cleared` - Görselleştirme temizlendi

### Marker Events
- `marker:added` - Marker eklendi
- `marker:removed` - Marker silindi
- `marker:updated` - Marker güncellendi

### Timeline Events
- `timeline:shown` - Timeline gösterildi
- `timeline:hidden` - Timeline gizlendi
- `timeline:filtered` - Filtreleme yapıldı

### Analysis Events
- `analysis:buffer:created` - Buffer oluşturuldu
- `analysis:heatmap:enabled` - Heatmap aktif
- `analysis:clustering:enabled` - Clustering aktif

### Data Events
- `data:loaded` - Veri yüklendi
- `data:imported` - Veri içe aktarıldı
- `data:exported` - Veri dışa aktarıldı

### Core Events
- `core:initialized` - Core başlatıldı
- `app:started` - Uygulama başladı
- `app:stopped` - Uygulama durduruldu

---

## Global Yardımcı Fonksiyonlar

### Formatters

```javascript
// Sayı formatı
formatNumber(1234567, 'auto')     // "1.2M"
formatNumber(1234567, 'full')     // "1.234.567"
formatNumber(1234567, 'compact')  // "1,2Mn"

// Alan formatı
formatArea(1000000, 'm2')  // "1.00 km²"

// Mesafe formatı
formatDistance(1500, 'm')  // "1.50 km"
```

### showFeedback

```javascript
window.showFeedback('Mesaj', 'success', 3000)  // success, error, warning, info
```

---

**Son Güncelleme:** 11 Ocak 2026
**Versiyon:** 1.2.0
