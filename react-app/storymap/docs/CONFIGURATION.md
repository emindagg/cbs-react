# StoryMap - Konfigürasyon Rehberi

## 📋 İçindekiler

1. [Ortam Değişkenleri](#ortam-değişkenleri)
2. [API Konfigürasyonu](#api-konfigürasyonu)
3. [Harita Ayarları](#harita-ayarları)
4. [Şablon Konfigürasyonu](#şablon-konfigürasyonu)
5. [Stil Özelleştirme](#stil-özelleştirme)
6. [Storage Ayarları](#storage-ayarları)
7. [Performans Ayarları](#performans-ayarları)

---

## Ortam Değişkenleri

### API Endpoint'leri

Tüm API endpoint'leri `src/services/apiService.js` dosyasında tanımlıdır:

```javascript
// Backend API Base URL
const API_BASE_URL = 'https://ogmmateryal.eba.gov.tr/cbs-backend/api';

// CDN Base URL (Medya dosyaları için)
const CDN_BASE_URL = 'https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles';
```

### MEBBİS OAuth URL'leri

`src/services/authManager.js` dosyasında:

```javascript
// MEBBİS Login URL Template
const MEBBIS_LOGIN_URL = 'https://mebi.eba.gov.tr/login/cbs/{userType}?redirectUrl={redirectUrl}';

// userType: 1 = Öğretmen, 0 = Öğrenci
```

### Geliştirme Ortamı

Local development için URL'leri değiştirmek:

```javascript
// apiService.js - Development override
const isDevelopment = window.location.hostname === 'localhost';
const API_BASE_URL = isDevelopment 
    ? 'http://localhost:5000/api'
    : 'https://ogmmateryal.eba.gov.tr/cbs-backend/api';
```

---

## API Konfigürasyonu

### Request Timeout

```javascript
// apiService.js
const REQUEST_TIMEOUT = 30000; // 30 saniye

// Fetch with timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
```

### Retry Mekanizması

```javascript
// Otomatik retry (opsiyonel implementasyon)
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 saniye

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
    try {
        return await fetch(url, options);
    } catch (error) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, RETRY_DELAY));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
}
```

### CORS Ayarları

Backend'de gerekli CORS konfigürasyonu (ASP.NET Core):

```csharp
// Program.cs veya Startup.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowStoryMap", policy =>
    {
        policy.WithOrigins(
            "http://localhost:8000",
            "http://localhost:3000",
            "https://mebi.eba.gov.tr"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});
```

---

## Harita Ayarları

### Varsayılan Harita Konfigürasyonu

`src/components/map/MapComponent.js`:

```javascript
const MAP_DEFAULTS = {
    // Türkiye merkezi
    center: [35.0, 39.0],
    
    // Başlangıç zoom seviyesi
    zoom: 6,
    
    // Zoom limitleri
    minZoom: 3,
    maxZoom: 18,
    
    // Varsayılan basemap
    defaultBasemap: 'openstreetmap',
    
    // Harita kontrolleri
    controls: {
        navigation: true,
        scale: true,
        fullscreen: false,
        geolocate: false
    }
};
```

### Basemap Tanımları

`src/components/sidebar/constants/basemaps.js`:

```javascript
export const BASEMAPS = [
    {
        id: 'openstreetmap',
        name: 'OpenStreetMap',
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        preview: '#4a90d9'
    },
    {
        id: 'hgm-temel',
        name: 'HGM Temel Harita',
        url: 'https://atlas.harita.gov.tr/webservis/...',
        attribution: '© HGM',
        preview: '#f5f5f0'
    },
    {
        id: 'hgm-uydu',
        name: 'HGM Uydu',
        url: 'https://atlas.harita.gov.tr/webservis/...',
        attribution: '© HGM',
        preview: '#2d5016'
    }
    // ... diğer basemap'ler
];
```

### OSRM Routing Konfigürasyonu

`src/components/map/modules/RouteManager.js`:

```javascript
const OSRM_CONFIG = {
    // OSRM API endpoint
    baseUrl: 'https://router.project-osrm.org/route/v1/driving',
    
    // Response formatı
    geometries: 'geojson',
    overview: 'full',
    
    // Cache ayarları
    enableCache: true,
    maxCacheSize: 100  // Maksimum cache'lenecek rota sayısı
};
```

---

## Şablon Konfigürasyonu

### Şablon Tanımları

`src/data/templates.js`:

```javascript
export const TEMPLATES = [
    {
        id: 'point',
        name: 'Nokta Eklenen',
        description: 'Bağımsız noktalar ekleyerek hikâye oluşturun',
        icon: 'fa-map-marker-alt',
        features: {
            markers: true,
            routes: false,
            timeline: false,
            scrollytelling: false,
            playback: true
        },
        defaults: {
            markerStyle: 'default',
            markerColor: '#ef4444'
        }
    },
    {
        id: 'route',
        name: 'Rota Bazlı',
        description: 'Noktalar arası rota çizerek yolculuk hikâyesi',
        icon: 'fa-route',
        features: {
            markers: true,
            routes: true,
            timeline: false,
            scrollytelling: false,
            playback: true,
            osrmRouting: true
        },
        defaults: {
            markerStyle: 'number',
            showDistance: true
        }
    },
    {
        id: 'timeline',
        name: 'Timeline Bazlı',
        description: 'Kronolojik olayları zaman çizelgesinde görselleştirin',
        icon: 'fa-clock',
        features: {
            markers: true,
            routes: false,
            timeline: true,
            scrollytelling: false,
            playback: true,
            timelineJS: true
        },
        defaults: {
            sortByDate: true,
            showEras: true
        }
    },
    {
        id: 'storymap',
        name: 'Hikâye Haritası',
        description: 'Scroll bazlı zengin içerikli anlatım',
        icon: 'fa-book-open',
        features: {
            markers: true,
            routes: false,
            timeline: false,
            scrollytelling: true,
            playback: true,
            richMedia: true
        },
        defaults: {
            panelPosition: 'left',
            autoAdvance: false
        }
    }
];
```

### Şablon Özellikleri

| Özellik | Point | Route | Timeline | StoryMap |
|---------|-------|-------|----------|----------|
| Marker Ekleme | ✅ | ✅ | ✅ | ✅ |
| Rota Çizimi | ❌ | ✅ | ❌ | ❌ |
| OSRM Routing | ❌ | ✅ | ❌ | ❌ |
| TimelineJS | ❌ | ❌ | ✅ | ❌ |
| Scrollytelling | ❌ | ❌ | ❌ | ✅ |
| Playback | ✅ | ✅ | ✅ | ✅ |
| 3D Görünüm | ✅ | ✅ | ✅ | ✅ |

---

## Stil Özelleştirme

### CSS Değişkenleri

`src/styles/variables/colors.css`:

```css
:root {
    /* Ana Renkler */
    --color-primary: #10b981;        /* Zümrüt */
    --color-primary-dark: #059669;   /* Zümrüt Koyu */
    --color-primary-light: #34d399;  /* Zümrüt Açık */
    
    /* Arka Plan */
    --color-bg-primary: #f5f5f0;     /* Kemik Beyazı */
    --color-bg-secondary: #ffffff;
    --color-bg-tertiary: #f3f4f6;
    
    /* Metin */
    --color-text-primary: #374151;   /* Koyu Gri */
    --color-text-secondary: #6b7280;
    --color-text-muted: #9ca3af;
    
    /* Kenarlık */
    --color-border: #e5e7eb;
    --color-border-dark: #d1d5db;
    
    /* Durum Renkleri */
    --color-success: #10b981;
    --color-error: #ef4444;
    --color-warning: #f59e0b;
    --color-info: #3b82f6;
    
    /* Gölge */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
    
    /* Border Radius */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 9999px;
    
    /* Spacing */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Transition */
    --transition-fast: 150ms ease;
    --transition-normal: 300ms ease;
    --transition-slow: 500ms ease;
}
```

### Marker Stilleri

`src/components/sidebar/constants/markerStyles.js`:

```javascript
export const MARKER_STYLES = [
    {
        id: 'default',
        name: 'Varsayılan',
        icon: 'fa-map-marker-alt',
        bgColor: null,  // Kullanıcı seçimine göre
        shape: 'circle'
    },
    {
        id: 'number',
        name: 'Numaralı',
        icon: null,     // Numara gösterilir
        bgColor: null,
        shape: 'circle',
        showNumber: true
    },
    {
        id: 'pin',
        name: 'Pin',
        icon: 'fa-thumbtack',
        bgColor: null,
        shape: 'pin'
    },
    {
        id: 'star',
        name: 'Yıldız',
        icon: 'fa-star',
        bgColor: '#f59e0b',
        shape: 'circle'
    },
    {
        id: 'heart',
        name: 'Kalp',
        icon: 'fa-heart',
        bgColor: '#ef4444',
        shape: 'circle'
    },
    {
        id: 'flag',
        name: 'Bayrak',
        icon: 'fa-flag',
        bgColor: '#3b82f6',
        shape: 'circle'
    }
];
```

### Renk Paleti

```javascript
export const COLOR_PALETTE = [
    '#ef4444',  // Kırmızı
    '#f59e0b',  // Turuncu
    '#eab308',  // Sarı
    '#22c55e',  // Yeşil
    '#10b981',  // Zümrüt
    '#14b8a6',  // Teal
    '#06b6d4',  // Cyan
    '#3b82f6',  // Mavi
    '#6366f1',  // Indigo
    '#8b5cf6',  // Mor
    '#a855f7',  // Purple
    '#ec4899',  // Pembe
    '#f43f5e',  // Rose
    '#78716c',  // Stone
    '#374151',  // Gri
    '#111827'   // Siyah
];
```

---

## Storage Ayarları

### IndexedDB Konfigürasyonu

`src/utils/storageManager.js`:

```javascript
const STORAGE_CONFIG = {
    // Database adı
    dbName: 'StoryMapDB',
    
    // Database versiyonu
    dbVersion: 1,
    
    // Object store'lar
    stores: {
        maps: 'storymaps',
        settings: 'settings',
        cache: 'publicCache'
    },
    
    // Maksimum storage boyutu (tahmini)
    maxStorageSize: 50 * 1024 * 1024,  // 50MB
    
    // Cache süresi (public haritalar için)
    cacheExpiry: 24 * 60 * 60 * 1000   // 24 saat
};
```

### Session Storage Keys

```javascript
const SESSION_KEYS = {
    authToken: 'storymap_auth_token',
    userId: 'storymap_user_id',
    currentMapId: 'storymap_current_id'
};
```

### Local Storage Keys

```javascript
const LOCAL_KEYS = {
    settings: 'storymap_settings',
    recentMaps: 'storymap_recent',
    reports: 'storymap_reports'
};
```

---

## Performans Ayarları

### Debounce/Throttle Değerleri

```javascript
const PERFORMANCE_CONFIG = {
    // Scroll event throttle
    scrollThrottle: 50,  // ms
    
    // Resize event debounce
    resizeDebounce: 200,  // ms
    
    // Search input debounce
    searchDebounce: 300,  // ms
    
    // Auto-save debounce
    autoSaveDebounce: 2000,  // ms
    
    // Map move event throttle
    mapMoveThrottle: 100  // ms
};
```

### Lazy Loading

```javascript
const LAZY_LOAD_CONFIG = {
    // Medya lazy loading
    mediaLazyLoad: true,
    
    // Intersection observer threshold
    intersectionThreshold: 0.1,
    
    // Root margin
    rootMargin: '100px'
};
```

### Cache Ayarları

```javascript
const CACHE_CONFIG = {
    // OSRM route cache
    routeCache: {
        enabled: true,
        maxSize: 100,
        ttl: 3600000  // 1 saat
    },
    
    // Basemap tile cache
    tileCache: {
        enabled: true,
        maxSize: 500
    },
    
    // Public story cache
    publicCache: {
        enabled: true,
        ttl: 86400000  // 24 saat
    }
};
```

---

## Playback Ayarları

### Playback Hızları

```javascript
const PLAYBACK_CONFIG = {
    // Point/Route playback hızları
    speeds: [1, 2, 3, 5],
    defaultSpeed: 1,
    
    // Her nokta arası bekleme (ms)
    baseInterval: 3000,
    
    // StoryMap playback hızları
    storyMapSpeeds: [0.5, 1, 3],
    storyMapDefaultSpeed: 1,
    
    // Timeline playback
    timelineAutoAdvance: false
};
```

### Animasyon Ayarları

```javascript
const ANIMATION_CONFIG = {
    // Harita flyTo süresi
    flyToDuration: 2000,  // ms
    
    // Marker animasyon süresi
    markerAnimationDuration: 300,  // ms
    
    // Panel geçiş süresi
    panelTransitionDuration: 300,  // ms
    
    // Easing fonksiyonu
    easing: 'ease-in-out'
};
```

---

## Medya Ayarları

### Dosya Limitleri

```javascript
const MEDIA_CONFIG = {
    // Maksimum dosya boyutu
    maxFileSize: 30 * 1024 * 1024,  // 30MB
    
    // Desteklenen formatlar
    supportedImages: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    supportedVideos: ['mp4', 'webm'],
    
    // Thumbnail boyutu
    thumbnailSize: {
        width: 200,
        height: 150
    },
    
    // Sıkıştırma kalitesi
    compressionQuality: 0.8
};
```

### CDN Konfigürasyonu

```javascript
const CDN_CONFIG = {
    baseUrl: 'https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles',
    
    // Dosya yolu formatı
    pathFormat: '{year}{month}/{filename}',
    
    // Timeout
    uploadTimeout: 60000  // 60 saniye
};
```

---

## Güvenlik Ayarları

### Token Yönetimi

```javascript
const AUTH_CONFIG = {
    // Token storage
    tokenStorage: 'sessionStorage',
    
    // Token key
    tokenKey: 'storymap_auth_token',
    
    // Token expiry check interval
    expiryCheckInterval: 60000,  // 1 dakika
    
    // Auto logout on 401
    autoLogoutOn401: true
};
```

### Input Sanitization

```javascript
const SECURITY_CONFIG = {
    // HTML escape
    escapeHtml: true,
    
    // Max input length
    maxTitleLength: 200,
    maxDescriptionLength: 5000,
    
    // Allowed HTML tags (rich text için)
    allowedTags: ['b', 'i', 'u', 'a', 'br', 'p']
};
```

---

## Konfigürasyon Dosyası Örneği

Tüm ayarları tek bir dosyada toplamak için:

```javascript
// src/config/app.config.js
export const APP_CONFIG = {
    api: {
        baseUrl: 'https://ogmmateryal.eba.gov.tr/cbs-backend/api',
        cdnUrl: 'https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles',
        timeout: 30000
    },
    map: {
        center: [35.0, 39.0],
        zoom: 6,
        minZoom: 3,
        maxZoom: 18
    },
    storage: {
        dbName: 'StoryMapDB',
        dbVersion: 1
    },
    performance: {
        scrollThrottle: 50,
        autoSaveDebounce: 2000
    },
    media: {
        maxFileSize: 30 * 1024 * 1024,
        supportedFormats: ['jpg', 'png', 'webp', 'mp4', 'webm']
    },
    playback: {
        speeds: [1, 2, 3, 5],
        baseInterval: 3000
    }
};
```

---

**Son Güncelleme:** 27 Şubat 2026  
**Versiyon:** 2.1.0
