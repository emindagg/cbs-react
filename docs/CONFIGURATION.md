# Yapılandırma Rehberi

Bu dokümantasyon, AtlasCopy'nin yapılandırma seçeneklerini, sistem gereksinimlerini ve özelleştirme yöntemlerini açıklar.

## İçindekiler

- [Sistem Gereksinimleri](#sistem-gereksinimleri)
- [Uygulama Yapılandırması](#uygulama-yapılandırması)
- [Harita Yapılandırması](#harita-yapılandırması)
- [FAB Yapılandırması](#fab-yapılandırması)
- [Timeline Yapılandırması](#timeline-yapılandırması)
- [Görselleştirme Yapılandırması](#görselleştirme-yapılandırması)
- [Katman Yönetimi](#katman-yönetimi)
- [Performans Ayarları](#performans-ayarları)
- [Geliştirme Ortamı](#geliştirme-ortamı)

---

## Sistem Gereksinimleri

### Minimum Gereksinimler

```yaml
Tarayıcı:
  - Chrome: 90+
  - Firefox: 88+
  - Safari: 14+
  - Edge: 90+

Donanım:
  - RAM: 4 GB
  - İşlemci: Dual-core 2.0 GHz
  - Ekran: 1366x768

İnternet:
  - Minimum: 1 Mbps
```

### Önerilen Gereksinimler

```yaml
Tarayıcı: En son sürüm
Donanım:
  - RAM: 8 GB+
  - İşlemci: Quad-core 2.5 GHz+
  - GPU: Dedicated graphics
  - Ekran: 1920x1080+
İnternet: 10+ Mbps
```

### Tarayıcı Özellik Kontrolü

```javascript
function checkBrowserSupport() {
    const canvas = document.createElement('canvas');
    const webGL = !!(canvas.getContext('webgl') || 
                     canvas.getContext('experimental-webgl'));
    
    return {
        webGL,
        localStorage: typeof localStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        worker: typeof Worker !== 'undefined',
        supported: webGL && localStorage
    };
}
```

---

## Uygulama Yapılandırması

### ApplicationCore Yapılandırması

```javascript
const appConfig = {
    environment: 'production',
    
    initialState: {
        user: {
            markers: [],
            measurements: [],
            catalogGeometryLayers: []
        },
        drawing: {
            isDrawing: false,
            currentTool: null
        },
        analysis: {
            bufferActive: false,
            lastBufferRadius: 500,
            clusteringEnabled: false,
            heatmapEnabled: false
        },
        map: {
            center: [32.8597, 39.9334],
            zoom: 6
        },
        ui: {
            sidebarOpen: false,
            toolsPanelOpen: false,
            mapMode: 'normal',
            labels: {
                provinceLabels: false,
                valueLabels: false
            }
        }
    },
    
    maxHistorySize: 50,
    enableHistory: true,
    strict: true
};

const app = new ApplicationCore(appConfig);
await app.initialize();
await app.start();
```

---

## Harita Yapılandırması

### MapLibre GL Yapılandırması

```javascript
const mapConfig = {
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    center: [32.8597, 39.9334],
    zoom: 6,
    minZoom: 5,
    maxZoom: 18,
    pitch: 0,
    bearing: 0,
    
    // Etkileşim
    interactive: true,
    dragRotate: true,
    scrollZoom: true,
    doubleClickZoom: true,
    
    // Performans
    preserveDrawingBuffer: false,
    maxTileCacheSize: 50,
    fadeDuration: 300
};

const map = new maplibregl.Map(mapConfig);
```

### Altlık Harita Tipleri

```javascript
const basemapStyles = {
    OPENSTREET: {
        url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        name: 'OpenStreetMap'
    },
    TEMEL: {
        url: 'https://servis.hgm.gov.tr/mapfiles/styles/temel.json',
        name: 'HGM Temel Harita'
    },
    UYDU: {
        url: 'https://servis.hgm.gov.tr/mapfiles/styles/uydu.json',
        name: 'HGM Uydu'
    },
    GECE: {
        url: 'https://servis.hgm.gov.tr/mapfiles/styles/gece.json',
        name: 'HGM Gece Haritası'
    },
    GLOBE: {
        projection: 'globe',
        name: 'Küre Görünümü'
    }
};
```

---

## FAB Yapılandırması

### FAB Kontrol Ayarları

```javascript
const fabConfig = {
    // Harita Modu
    mapMode: {
        default: 'normal',
        options: ['normal', 'data-only']
    },
    
    // Etiketler
    labels: {
        provinceLabels: false,
        valueLabels: false,
        mapTitle: false,
        northArrow: false
    },
    
    // Lejant
    legend: {
        layout: 'vertical',      // 'vertical' | 'horizontal'
        labelMode: 'ranges',     // 'ranges' | 'labels'
        position: 'bottom-right'
    },
    
    // Sayı Formatı
    numberFormat: 'auto'  // 'auto' | 'full' | 'compact'
};
```

### Sayı Format Seçenekleri

```javascript
const numberFormats = {
    auto: {
        name: 'Otomatik',
        format: (value) => {
            if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value/1000).toFixed(1)}K`;
            return value.toString();
        }
    },
    full: {
        name: 'Tam Sayı',
        format: (value) => value.toLocaleString('tr-TR')
    },
    compact: {
        name: 'Kompakt',
        format: (value) => {
            if (value >= 1000000) return `${(value/1000000).toFixed(1)}Mn`;
            if (value >= 1000) return `${(value/1000).toFixed(1)}B`;
            return value.toString();
        }
    }
};
```

---

## Timeline Yapılandırması

### Timeline Ayarları

```javascript
const timelineConfig = {
    // Mod
    mode: 'cumulative',  // 'cumulative' | 'interval'
    
    // Aralık
    interval: 'day',     // 'hour' | 'day' | 'week' | 'month' | 'year'
    
    // Animasyon
    speed: 1000,         // ms
    speedOptions: [500, 1000, 1500, 2000, 3000],
    
    // Tarih formatı
    dateFormat: {
        day: 'DD.MM.YYYY',
        month: 'MM.YYYY',
        year: 'YYYY'
    },
    
    // Web Worker
    workerThreshold: 1000,  // Bu sayıdan fazla feature için Worker kullan
    
    // Property filter
    propertyFilter: {
        enabled: false,
        property: null,
        min: 0,
        max: 100
    }
};
```

### Web Worker Yapılandırması

```javascript
// Timeline Worker otomatik başlatılır
// Dosya: assets/js/features/timeline/timeline-worker.js

// Worker durumu kontrolü
if (timelineManager.workerEnabled) {
    console.log('Web Worker aktif');
}

// Worker cache temizleme
timelineManager.worker.postMessage({ type: 'CLEAR_CACHE' });
```

---

## Görselleştirme Yapılandırması

### Sınıflandırma Ayarları

```javascript
const visualizationConfig = {
    classification: {
        methods: ['quantile', 'equal', 'jenks', 'geometric'],
        defaultMethod: 'quantile',
        classCount: {
            min: 3,
            max: 7,
            default: 5
        }
    },
    
    colorSchemes: {
        viridis: ['#440154', '#472777', '#3b528b', '#2c728e', '#21918c', 
                  '#27ad81', '#5ec962', '#aadc32', '#fde725'],
        blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6',
                '#4292c6', '#2171b5', '#08519c', '#08306b'],
        reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a',
               '#ef3b2c', '#cb181d', '#a50f15', '#67000d']
    },
    defaultColorScheme: 'viridis'
};
```

### Bubble Map Ayarları

```javascript
const bubbleConfig = {
    method: 'proportional',  // 'proportional' | 'graduated'
    radiusMultiplier: 1,
    minRadius: 5,
    maxRadius: 40,
    defaultColor: '#3b82f6',
    
    // Graduated için
    classCount: 4,
    classification: 'quantile'
};
```

### Dot Density Ayarları

```javascript
const dotDensityConfig = {
    dotValue: 100,           // Her nokta kaç birimi temsil eder
    dotColor: '#f97316',
    dotRadius: 2,
    maxDotsPerFeature: 1000
};
```

---

## Katman Yönetimi

### LayerManager Yapılandırması

```javascript
class LayerManager {
    constructor() {
        // Veri Kaynağı Modu
        // 'local': ./katmanverisi/ klasöründen
        // 'remote': GitHub/CDN üzerinden (Varsayılan)
        this.dataSourceMode = 'remote';
        
        // Uzak Sunucu (jsDelivr CDN)
        this.remoteBaseUrl = 'https://cdn.jsdelivr.net/gh/emindagg/katman_verisi/';
        
        // Yerel Klasör
        this.localBasePath = './katmanverisi/';
    }
}
```

### Dosya Standartları

```yaml
Dosya İsimleri:
  - Tamamen küçük harf
  - Türkçe karakter yok (ı→i, ğ→g, ü→u, ş→s, ö→o, ç→c)
  - Format: .zip (Shapefile) veya .geojson

Örnekler:
  - ulke_siniri.zip ✓
  - Ülke_Sınırı.zip ✗
  - akarsular.geojson ✓
```

---

## Performans Ayarları

### Canvas Optimizasyonu

```javascript
const canvasOptimization = {
    maxPoints: 10000,
    simplification: {
        enabled: true,
        tolerance: 0.001,
        threshold: 1000
    },
    clusteringThreshold: 500,
    tileSize: 512
};
```

### Batch Processing

```javascript
const batchConfig = {
    chunkSize: 1000,
    processInterval: 16,  // ~60fps
    useWebWorker: true
};
```

### Cache Yapılandırması

```javascript
const cacheConfig = {
    localStorage: {
        enabled: true,
        maxSize: 5 * 1024 * 1024,  // 5 MB
        ttl: 7 * 24 * 60 * 60 * 1000  // 7 gün
    },
    memoryCache: {
        enabled: true,
        maxLayers: 10
    },
    dateCache: {
        maxSize: 10000  // Timeline için
    }
};
```

---

## Geliştirme Ortamı

### package.json

```json
{
  "name": "atlasglcopy",
  "version": "1.2.0",
  "scripts": {
    "test": "jest --verbose",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"]
  }
}
```

### Test Çalıştırma

```bash
# Tüm testler
npm test

# Coverage raporu
npm run test:coverage

# Watch mode
npm run test:watch
```

### Logger Yapılandırması

```javascript
const loggerConfig = {
    level: 'info',  // 'error' | 'warn' | 'info' | 'debug'
    timestamp: true,
    prefix: true,
    enabled: {
        development: true,
        production: false
    }
};

// Safe logger kullanımı
const safeLog = (...args) => 
    window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
```

---

## Güvenlik Yapılandırması

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy"
      content="
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval'
          https://unpkg.com
          https://cdn.jsdelivr.net
          https://cdn.tailwindcss.com;
        style-src 'self' 'unsafe-inline'
          https://unpkg.com;
        img-src 'self' data: https:;
        connect-src 'self'
          https://servis.hgm.gov.tr
          https://raw.githubusercontent.com
          https://cdn.jsdelivr.net
          https://basemaps.cartocdn.com;
      ">
```

### İzin Verilen Originler

```javascript
const allowedOrigins = [
    'https://servis.hgm.gov.tr',
    'https://raw.githubusercontent.com',
    'https://cdn.jsdelivr.net',
    'https://basemaps.cartocdn.com'
];
```

---

**Son Güncelleme:** 11 Ocak 2026
**Versiyon:** 1.2.0
