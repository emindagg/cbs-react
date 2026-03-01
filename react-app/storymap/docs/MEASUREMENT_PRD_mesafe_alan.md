# 📏 Measurement Tools - Product Requirements Document (PRD)

## 📋 Durum: ✅ TAMAMLANDI

Bu PRD'de tanımlanan tüm özellikler başarıyla implemente edilmiştir.

---

## 📋 Genel Bakış

**Ürün Adı:** MapLibre Measurement Tools  
**Versiyon:** 1.0.0  
**Durum:** Production Ready  
**Son Güncelleme:** 27 Şubat 2026

### Özet

MapLibre GL JS tabanlı, modern ve kullanıcı dostu mesafe ve alan ölçüm araçları. Sürüklenebilir noktalar, canlı önizleme ve dinamik hesaplama özellikleri ile profesyonel harita uygulamaları için hazır çözüm.

## 🎯 Hedef Kullanıcılar

- Web CBS geliştiricileri
- Harita uygulaması geliştiricileri
- GIS uzmanları
- Emlak ve arazi yönetimi uygulamaları
- Lojistik ve rota planlama sistemleri
- Eğitim platformları

## ✨ Temel Özellikler

### 1. Distance Measurement (Mesafe Ölçümü)

#### Fonksiyonel Özellikler
- ✅ Çoklu nokta mesafe ölçümü (polyline)
- ✅ Sürüklenebilir noktalar (draggable markers)
- ✅ Canlı önizleme (ghost line)
- ✅ Dinamik mesafe hesaplama
- ✅ Segment bazlı ölçüm
- ✅ Otomatik birim dönüşümü (m/km)
- ✅ Çift tıklama ile sonlandırma
- ✅ ESC tuşu ile iptal
- ✅ Popup ile sonuç gösterimi

#### Teknik Özellikler
- **Kütüphane:** MapLibre GL JS
- **Hesaplama:** Turf.js (geodesic distance)
- **Performans:** RequestAnimationFrame ile optimize edilmiş
- **Throttling:** Sürükleme sırasında akıllı güncelleme
- **Layer Yönetimi:** Otomatik z-index kontrolü

#### Kullanıcı Deneyimi
- 🎨 Crosshair cursor
- 📍 Beyaz marker + siyah border
- 📏 Kesikli çizgi önizleme
- 💬 Geçici popup (drawing sırasında)
- ✅ Kalıcı popup (finalize sonrası)
- 🎯 Marker sürükleme ile canlı güncelleme

### 2. Area Measurement (Alan Ölçümü)

#### Fonksiyonel Özellikler
- ✅ Çokgen alan ölçümü (polygon)
- ✅ Sürüklenebilir köşe noktaları
- ✅ Canlı önizleme (ghost polygon)
- ✅ Dinamik alan hesaplama
- ✅ Otomatik birim dönüşümü (m²/ha/km²)
- ✅ Centroid hesaplama
- ✅ Çift tıklama ile sonlandırma
- ✅ ESC tuşu ile iptal
- ✅ Popup ile sonuç gösterimi

#### Teknik Özellikler
- **Kütüphane:** MapLibre GL JS
- **Hesaplama:** Turf.js (area, centroid)
- **Performans:** RequestAnimationFrame ile optimize edilmiş
- **Throttling:** Sürükleme sırasında akıllı güncelleme
- **Layer Yönetimi:** Fill + Outline layer kombinasyonu

#### Kullanıcı Deneyimi
- 🎨 Crosshair cursor
- 📍 Beyaz marker + siyah border
- 🔷 Gri fill + kesikli çizgi önizleme
- 💬 Geçici popup (drawing sırasında)
- ✅ Kalıcı popup (centroid'de)
- 🎯 Marker sürükleme ile canlı güncelleme

## 🏗️ Teknik Mimari

### Bağımlılıklar

```json
{
  "maplibre-gl": "^5.10.0",
  "@turf/turf": "^6.x",
  "Logger": "optional (fallback to console)"
}
```

### Dosya Yapısı

```
measurement/
├── distance-measurement.js    # Mesafe ölçüm sınıfı
├── area-measurement.js        # Alan ölçüm sınıfı
├── index.js                   # Barrel export
└── README.md                  # Modül dokümantasyonu
```

### Sınıf Yapısı

#### DistanceMeasurement

```javascript
class DistanceMeasurement {
    constructor(map, onStateChange)
    
    // Lifecycle
    activate()                  // Aracı aktifleştir
    deactivate()               // Aracı deaktive et
    resetState()               // State'i sıfırla
    
    // Event Handlers
    handleMapClick(e)          // Harita tıklama
    onMouseMove(e)             // Mouse hareket
    onDoubleClick(e)           // Çift tıklama
    onKeyDown(e)               // Klavye (ESC)
    
    // Core Logic
    updateLines()              // Çizgileri güncelle
    updateGhostLine()          // Önizleme çizgisi
    calculateTotalDistance()   // Toplam mesafe
    finalizeMeasurement()      // Ölçümü tamamla
    
    // UI Updates
    updateDistanceDisplay()    // Popup güncelle
    updateTempDistanceDisplay() // Geçici popup
    bringLayersToTop()         // Layer sıralaması
    
    // State Check
    canHandleClick()           // Tıklama kontrolü
}
```

#### AreaMeasurement

```javascript
class AreaMeasurement {
    constructor(map, onStateChange)
    
    // Lifecycle
    activate()                  // Aracı aktifleştir
    deactivate()               // Aracı deaktive et
    resetState()               // State'i sıfırla
    
    // Event Handlers
    handleMapClick(e)          // Harita tıklama
    onMouseMove(e)             // Mouse hareket
    onDoubleClick(e)           // Çift tıklama
    onKeyDown(e)               // Klavye (ESC)
    
    // Core Logic
    updatePolygon()            // Poligonu güncelle
    updateGhostPolygon()       // Önizleme poligonu
    calculateArea()            // Alan hesapla
    formatArea(area)           // Birim formatla
    finalizeMeasurement()      // Ölçümü tamamla
    
    // UI Updates
    updateAreaDisplay()        // Popup güncelle
    updateTempAreaDisplay()    // Geçici popup
    bringLayersToTop()         // Layer sıralaması
    
    // State Check
    canHandleClick()           // Tıklama kontrolü
}
```

### MapLibre Layer Yapısı

#### Distance Layers

```javascript
// Main line layer
{
    id: 'distance-lines',
    type: 'line',
    source: 'distance-measurements',
    paint: {
        'line-color': '#111827',
        'line-width': 2,
        'line-opacity': 1
    }
}

// Ghost preview layer
{
    id: 'distance-ghost-line',
    type: 'line',
    source: 'distance-ghost',
    paint: {
        'line-color': '#111827',
        'line-width': 2,
        'line-dasharray': [4, 4],
        'line-opacity': 0.8
    }
}
```

#### Area Layers

```javascript
// Polygon fill layer
{
    id: 'area-polygons',
    type: 'fill',
    source: 'area-measurements',
    paint: {
        'fill-color': '#9ca3af',
        'fill-opacity': 0.4
    }
}

// Polygon outline layer
{
    id: 'area-outlines',
    type: 'line',
    source: 'area-measurements',
    paint: {
        'line-color': '#111827',
        'line-width': 2,
        'line-opacity': 1
    }
}

// Ghost fill layer
{
    id: 'area-ghost-fill',
    type: 'fill',
    source: 'area-ghost',
    paint: {
        'fill-color': '#9ca3af',
        'fill-opacity': 0.2
    }
}

// Ghost outline layer
{
    id: 'area-ghost-line',
    type: 'line',
    source: 'area-ghost',
    paint: {
        'line-color': '#111827',
        'line-width': 2,
        'line-dasharray': [4, 4],
        'line-opacity': 0.8
    }
}
```

## 📦 Entegrasyon Rehberi

### 1. Temel Kurulum

```bash
# NPM ile
npm install maplibre-gl @turf/turf

# CDN ile
<script src="https://unpkg.com/maplibre-gl@5.10.0/dist/maplibre-gl.js"></script>
<script src="https://unpkg.com/@turf/turf@6/turf.min.js"></script>
```

### 2. Dosyaları Projeye Ekle

```javascript
// Dosyaları kopyala
measurement/
├── distance-measurement.js
├── area-measurement.js
└── index.js
```

### 3. HTML'e Dahil Et

```html
<!-- MapLibre CSS -->
<link href="https://unpkg.com/maplibre-gl@5.10.0/dist/maplibre-gl.css" rel="stylesheet" />

<!-- Measurement Tools -->
<script src="assets/js/measurement/distance-measurement.js"></script>
<script src="assets/js/measurement/area-measurement.js"></script>
```

### 4. Harita Oluştur

```javascript
// MapLibre haritası oluştur
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/style.json',
    center: [35.2433, 38.9637],
    zoom: 6
});
```

### 5. Measurement Tools'u Başlat

```javascript
// Harita yüklendikten sonra
map.on('load', () => {
    // Distance tool
    window.distanceMeasurementTool = new DistanceMeasurement(map);
    
    // Area tool
    window.areaMeasurementTool = new AreaMeasurement(map);
    
    // Global measurements array
    window.measurements = [];
});
```

### 6. UI Butonları Ekle

```html
<!-- Measurement Buttons -->
<div class="measurement-controls">
    <button id="distance-btn" onclick="window.distanceMeasurementTool.activate()">
        📏 Mesafe Ölç
    </button>
    <button id="area-btn" onclick="window.areaMeasurementTool.activate()">
        🔷 Alan Ölç
    </button>
</div>
```

### 7. Click Orchestrator Entegrasyonu (Opsiyonel)

```javascript
// MapClickOrchestrator ile entegrasyon
if (window.mapClickOrchestrator) {
    window.mapClickOrchestrator.registerTool(
        'distance',
        window.distanceMeasurementTool
    );
    
    window.mapClickOrchestrator.registerTool(
        'area',
        window.areaMeasurementTool
    );
}
```

## 🎨 Stil Özelleştirme

### CSS Özelleştirme

```css
/* Popup stilleri */
.meas-popup .maplibregl-popup-content {
    background: white;
    padding: 8px 12px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    font-family: Arial, sans-serif;
    font-size: 14px;
}

/* Marker stilleri */
.measurement-marker {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ffffff;
    border: 3px solid #111827;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    cursor: move;
}
```

### Layer Renk Özelleştirme

```javascript
// Distance line rengi
map.setPaintProperty('distance-lines', 'line-color', '#3b82f6');

// Area fill rengi
map.setPaintProperty('area-polygons', 'fill-color', '#10b981');
map.setPaintProperty('area-polygons', 'fill-opacity', 0.3);
```

## 📊 API Referansı

### DistanceMeasurement

#### Constructor

```javascript
new DistanceMeasurement(map, onStateChange)
```

**Parametreler:**
- `map` (MapLibre Map) - MapLibre harita instance
- `onStateChange` (Function, optional) - State değişikliği callback

#### Methods

##### activate()
Mesafe ölçüm aracını aktifleştir.

```javascript
distanceTool.activate();
```

##### deactivate()
Mesafe ölçüm aracını deaktive et.

```javascript
distanceTool.deactivate();
```

##### resetState()
Tüm noktaları ve ölçümleri temizle.

```javascript
distanceTool.resetState();
```

##### calculateTotalDistance()
Toplam mesafeyi hesapla (km).

```javascript
const distance = distanceTool.calculateTotalDistance();
console.log(`Toplam: ${distance.toFixed(2)} km`);
```

#### Properties

- `isActive` (Boolean) - Araç aktif mi?
- `isDrawing` (Boolean) - Çizim devam ediyor mu?
- `points` (Array) - Ölçüm noktaları
- `markers` (Array) - MapLibre marker'lar
- `resultPopup` (Popup) - Sonuç popup'ı

### AreaMeasurement

#### Constructor

```javascript
new AreaMeasurement(map, onStateChange)
```

**Parametreler:**
- `map` (MapLibre Map) - MapLibre harita instance
- `onStateChange` (Function, optional) - State değişikliği callback

#### Methods

##### activate()
Alan ölçüm aracını aktifleştir.

```javascript
areaTool.activate();
```

##### deactivate()
Alan ölçüm aracını deaktive et.

```javascript
areaTool.deactivate();
```

##### resetState()
Tüm noktaları ve ölçümleri temizle.

```javascript
areaTool.resetState();
```

##### calculateArea()
Alanı hesapla (m²).

```javascript
const area = areaTool.calculateArea();
console.log(`Alan: ${area.toFixed(2)} m²`);
```

##### formatArea(area)
Alanı uygun birimle formatla.

```javascript
const formatted = areaTool.formatArea(15000);
// "1.5 ha"
```

#### Properties

- `isActive` (Boolean) - Araç aktif mi?
- `isDrawing` (Boolean) - Çizim devam ediyor mu?
- `points` (Array) - Ölçüm noktaları
- `markers` (Array) - MapLibre marker'lar
- `resultPopup` (Popup) - Sonuç popup'ı

## 🔧 Gelişmiş Kullanım

### Programatik Ölçüm

```javascript
// Mesafe ölçümü oluştur
const points = [
    { lng: 35.2433, lat: 38.9637 },
    { lng: 35.3433, lat: 38.9737 },
    { lng: 35.4433, lat: 38.9837 }
];

distanceTool.points = points;
distanceTool.updateLines();
const distance = distanceTool.calculateTotalDistance();
```

### Event Listening

```javascript
// State değişikliği callback
const distanceTool = new DistanceMeasurement(map, (state) => {
    console.log('Tool state:', state);
    if (state.isActive) {
        console.log('Measurement started');
    }
});
```

### Ölçüm Verilerini Kaydetme

```javascript
// Global measurements array'den al
const allMeasurements = window.measurements;

// JSON olarak kaydet
const json = JSON.stringify(allMeasurements, null, 2);
localStorage.setItem('measurements', json);

// Export et
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'measurements.json';
a.click();
```

### Ölçümleri Yükleme

```javascript
// JSON'dan yükle
const json = localStorage.getItem('measurements');
const measurements = JSON.parse(json);

// Haritaya çiz
measurements.forEach(m => {
    if (m.type === 'distance') {
        // Distance çiz
        distanceTool.points = m.points.map(p => ({ lng: p.lon, lat: p.lat }));
        distanceTool.updateLines();
    } else if (m.type === 'area') {
        // Area çiz
        areaTool.points = m.points.map(p => ({ lng: p.lon, lat: p.lat }));
        areaTool.updatePolygon();
    }
});
```

## 🎯 Kullanım Senaryoları

### 1. Emlak Uygulaması

```javascript
// Arsa alanı ölçümü
areaTool.activate();
// Kullanıcı arsa sınırlarını çizer
// Sonuç: "2.5 ha" popup'ta gösterilir
```

### 2. Lojistik Planlama

```javascript
// Rota mesafesi ölçümü
distanceTool.activate();
// Kullanıcı rota noktalarını işaretler
// Sonuç: "45.3 km" popup'ta gösterilir
```

### 3. Tarım Uygulaması

```javascript
// Tarla alanı hesaplama
areaTool.activate();
// Çiftçi tarla sınırlarını çizer
// Sonuç: "15.7 ha" popup'ta gösterilir
```

### 4. Şehir Planlama

```javascript
// Park alanı ölçümü
areaTool.activate();
// Planlanan park alanı çizilir
// Sonuç: "125,000 m²" popup'ta gösterilir
```

## ⚡ Performans Optimizasyonu

### 1. RequestAnimationFrame Kullanımı

```javascript
// Sürükleme sırasında throttling
marker.on('drag', () => {
    if (!marker._pendingUpdate) {
        marker._pendingUpdate = true;
        requestAnimationFrame(() => {
            this.updateLines();
            marker._pendingUpdate = false;
        });
    }
});
```

### 2. Layer Z-Index Yönetimi

```javascript
// Layer'ları en üste taşı
bringLayersToTop() {
    const layers = this.map.getStyle().layers;
    let topLayerId = null;
    
    // Symbol layer'ların altına ekle
    for (let i = layers.length - 1; i >= 0; i--) {
        if (layers[i].type !== 'symbol') {
            topLayerId = layers[i].id;
            break;
        }
    }
    
    // Layer'ı yeniden ekle
    this.map.removeLayer('distance-lines');
    this.map.addLayer(layerDef, topLayerId);
}
```

### 3. Null Check ve Validation

```javascript
// Geçersiz noktaları filtrele
const validPoints = this.points.filter(p => 
    p && p.lng != null && p.lat != null
);
```

## 🐛 Hata Yönetimi

### Try-Catch Blokları

```javascript
try {
    const polygon = turf.polygon(coordinates);
    const area = turf.area(polygon);
    return area;
} catch (error) {
    Logger.error('Error calculating area:', error);
    return 0;
}
```

### Fallback Logger

```javascript
const Logger = window.Logger || {
    log: console.log,
    warn: console.warn,
    error: console.error
};
```

## 📱 Responsive Tasarım

### Mobil Uyumluluk

```javascript
// Touch event desteği
marker.on('touchstart', () => {
    marker._isDragging = true;
});

marker.on('touchmove', () => {
    // Sürükleme mantığı
});

marker.on('touchend', () => {
    marker._isDragging = false;
});
```

### Popup Pozisyonlama

```javascript
// Cursor yakınında göster (tıklamayı engellemez)
const screenPoint = this.map.project([mousePos.lng, mousePos.lat]);
const offsetPoint = { x: screenPoint.x + 16, y: screenPoint.y - 16 };
const offsetLngLat = this.map.unproject(offsetPoint);
```

## 🧪 Test Senaryoları

### Unit Tests

```javascript
describe('DistanceMeasurement', () => {
    it('should calculate distance correctly', () => {
        const tool = new DistanceMeasurement(map);
        tool.points = [
            { lng: 0, lat: 0 },
            { lng: 1, lat: 0 }
        ];
        const distance = tool.calculateTotalDistance();
        expect(distance).toBeCloseTo(111.19, 2);
    });
});
```

### Integration Tests

```javascript
describe('AreaMeasurement Integration', () => {
    it('should create polygon on map', async () => {
        const tool = new AreaMeasurement(map);
        tool.activate();
        
        // Simulate clicks
        tool.handleMapClick({ lngLat: { lng: 0, lat: 0 } });
        tool.handleMapClick({ lngLat: { lng: 1, lat: 0 } });
        tool.handleMapClick({ lngLat: { lng: 1, lat: 1 } });
        
        tool.finalizeMeasurement();
        
        const source = map.getSource('area-measurements');
        expect(source._data.features.length).toBe(1);
    });
});
```

## 📄 Lisans

ISC License

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun
3. Commit edin
4. Pull request açın

## 📞 Destek

- GitHub Issues: [atlascopy/issues](https://github.com/emindagg/atlascopy/issues)
- Email: support@atlascopy.com
- Dokümantasyon: [docs/README.md](./README.md)

---

**Hazırlayan:** AtlasCopy Team  
**Tarih:** 5 Aralık 2024  
**Versiyon:** 1.0.0  
**Son Güncelleme:** 27 Şubat 2026  
**Durum:** ✅ Tamamlandı

---

## 📚 İlgili Dokümantasyon

- [API Referansı](./API_REFERENCE.md) - MapComponent ölçüm metodları
- [Mimari](./ARCHITECTURE.md) - Modül yapısı
- [Konfigürasyon](./CONFIGURATION.md) - Ölçüm ayarları
- [Sorun Giderme](./TROUBLESHOOTING.md) - Ölçüm sorunları
