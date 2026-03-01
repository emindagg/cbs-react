# StoryMap - Mimari Dokümantasyonu

## 📋 İçindekiler

1. [Genel Mimari](#genel-mimari)
2. [Bileşen Mimarisi](#bileşen-mimarisi)
3. [Veri Akışı](#veri-akışı)
4. [State Yönetimi](#state-yönetimi)
5. [Modül Yapısı](#modül-yapısı)
6. [Tasarım Desenleri](#tasarım-desenleri)
7. [Performans Optimizasyonları](#performans-optimizasyonları)

---

## Genel Mimari

### Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Landing   │  │    App      │  │    View     │              │
│  │  (index)    │  │  (app.html) │  │ (view.html) │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────┐              │
│  │              Component Layer                   │              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │              │
│  │  │  Modal  │ │   Map   │ │ Sidebar │         │              │
│  │  └────┬────┘ └────┬────┘ └────┬────┘         │              │
│  │       │           │           │               │              │
│  │  ┌────┴───────────┴───────────┴────┐         │              │
│  │  │         Toolbar Component        │         │              │
│  │  └──────────────────────────────────┘         │              │
│  └───────────────────────────────────────────────┘              │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────┐              │
│  │              Service Layer                     │              │
│  │  ┌─────────────┐  ┌─────────────────────┐     │              │
│  │  │ authManager │  │    apiService       │     │              │
│  │  └──────┬──────┘  └──────────┬──────────┘     │              │
│  │         │                    │                 │              │
│  │  ┌──────┴────────────────────┴──────┐         │              │
│  │  │         storageManager           │         │              │
│  │  └──────────────────────────────────┘         │              │
│  └───────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (ASP.NET Core)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  /api/Login │  │/api/Storymap│  │  /api/Dosya │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────┐              │
│  │              SQL Server Database               │              │
│  └───────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CDN (Azure/CloudFlare)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles/        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Katman Yapısı

| Katman | Sorumluluk | Dosyalar |
|--------|------------|----------|
| **Presentation** | UI render, kullanıcı etkileşimi | `*.html`, `renderers/` |
| **Component** | Business logic, state yönetimi | `components/` |
| **Service** | API iletişimi, auth | `services/` |
| **Storage** | Veri persistance | `utils/storageManager.js` |
| **Utility** | Yardımcı fonksiyonlar | `utils/` |

---

## Bileşen Mimarisi

### Ana Bileşenler

```
┌─────────────────────────────────────────────────────────────┐
│                      ModalComponent                          │
│  - Şablon seçimi                                            │
│  - Proje oluşturma/düzenleme                                │
│  - Tüm bileşenleri koordine eder                            │
└─────────────────────────────────────────────────────────────┘
         │
         │ creates & coordinates
         ▼
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Map      │  │   Sidebar   │  │   Toolbar   │         │
│  │  Component  │◄─┤  Component  │◄─┤  Component  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         │   callbacks    │   callbacks    │                 │
│         └────────────────┴────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### MapComponent Modül Yapısı

```
MapComponent
├── MapHelpers          # Hesaplama fonksiyonları
│   ├── calculateDistance()
│   ├── calculateArea()
│   ├── calculateBounds()
│   └── formatDistance()
│
├── MapMarkers          # Marker yönetimi
│   ├── addMarker()
│   ├── updateMarker()
│   ├── removeMarker()
│   └── enableMarkerMode()
│
├── MapDrawing          # Çizim araçları
│   ├── enableLineMode()
│   ├── enablePolygonMode()
│   ├── enableCircleMode()
│   ├── enableRectangleMode()
│   └── enableTextMode()
│
├── MapLayers           # Katman yönetimi
│   ├── changeBasemap()
│   └── addCustomLayer()
│
├── RouteManager        # Rota şablonu
│   ├── addRoutePoint()
│   ├── connectAllPoints()
│   ├── fetchRealRoute()      # OSRM API
│   └── getTotalDistance()
│
├── TimelineManager     # Timeline şablonu
│   ├── addEvent()
│   ├── sortEventsByDate()
│   ├── startPlayback()
│   └── getStatistics()
│
├── DistanceMeasurement # Mesafe ölçümü
│   ├── activate()
│   ├── deactivate()
│   └── clearAll()
│
├── AreaMeasurement     # Alan ölçümü
│   ├── activate()
│   ├── deactivate()
│   └── clearAll()
│
└── Toggle3DControl     # 3D görünüm
    └── toggle3D()
```

### SidebarComponent Modül Yapısı

```
SidebarComponent
├── constants/
│   ├── markerStyles.js     # Marker stil sabitleri
│   ├── basemaps.js         # Harita katmanları
│   └── index.js            # Barrel export
│
├── renderers/
│   ├── listViewRenderer.js      # Liste görünümü HTML
│   ├── detailViewRenderer.js    # Detay görünümü HTML
│   ├── settingsViewRenderer.js  # Ayarlar görünümü HTML
│   ├── timelineRenderer.js      # Timeline görünümü HTML
│   ├── pointsRenderer.js        # Noktalar görünümü HTML
│   ├── mediaRenderer.js         # Medya render
│   └── index.js
│
├── handlers/
│   ├── listViewHandlers.js      # Liste event'leri
│   ├── detailHandlers.js        # Detay event'leri
│   ├── settingsHandlers.js      # Ayar event'leri
│   └── index.js
│
└── modules/
    ├── DetailPanel.js      # Nokta düzenleme paneli
    ├── PointManager.js     # Nokta CRUD işlemleri
    ├── MediaManager.js     # Medya yönetimi
    ├── Lightbox.js         # Medya görüntüleyici
    └── index.js
```

### ToolbarComponent Modül Yapısı

```
ToolbarComponent
├── modules/
│   ├── ToolManager.js      # Çizim araçları yönetimi
│   ├── HistoryManager.js   # Undo/Redo stack
│   ├── SearchManager.js    # Konum arama
│   └── ActionManager.js    # Aksiyon yönetimi
│
└── panels/
    ├── SharePanel.js       # Paylaşım paneli
    └── ReportPanel.js      # Geri bildirim formu
```

---

## Veri Akışı

### Unidirectional Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      User Action                             │
│                    (click, input, etc.)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Event Handler                           │
│                  (handlers/*.js)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Callback Function                       │
│              (onPointAdd, onSave, onDelete, etc.)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      State Update                            │
│                  (points[], settings, etc.)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Re-render                               │
│                  (renderers/*.js)                            │
└─────────────────────────────────────────────────────────────┘
```

### Callback İletişim Örneği

```javascript
// ModalComponent.js - Callback'leri tanımla
this.sidebarComponent.onPointAdd = (point) => {
    // 1. Haritaya marker ekle
    const marker = this.mapComponent.addMarker(point.coords, {
        color: point.color,
        icon: point.icon
    });
    
    // 2. Point'e marker referansı ekle
    point.marker = marker;
    
    // 3. Undo stack'e ekle
    this.toolbarComponent.addAction({
        type: 'add_point',
        data: point
    });
};

this.sidebarComponent.onSave = async () => {
    // 1. Veriyi topla
    const data = this.collectData();
    
    // 2. Backend'e kaydet
    const saved = await storageManager.saveMap(data);
    
    // 3. UI güncelle
    this.sidebarComponent.updateSaveButtonText();
    toast.success('Haritanız kaydedildi');
};
```

---

## State Yönetimi

### Component State

Her bileşen kendi state'ini yönetir:

```javascript
// SidebarComponent state
class SidebarComponent {
    constructor() {
        this.isOpen = true;
        this.currentView = 'list';      // 'list', 'detail', 'settings'
        this.currentTab = 'layers';     // 'layers', 'settings'
        this.editingPoint = null;
        this.hasSaved = false;
        this.points = [];               // PointManager'dan
        this.routeData = {};
        this.timelineData = {};
    }
}
```

### hasSaved Flag Pattern

İlk kayıt vs güncelleme durumunu takip eder:

```javascript
// İlk kayıtta
this.hasSaved = false;
// Buton: "Kaydet" + fa-save icon

// Kayıt sonrası
this.hasSaved = true;
// Buton: "Güncelle" + fa-sync-alt icon

// updateSaveButtonText() metodu
updateSaveButtonText() {
    if (!this.hasSaved) {
        this.hasSaved = true;
        const saveButtons = this.container.querySelectorAll('#btn-save');
        saveButtons.forEach(btn => {
            btn.querySelector('span').textContent = 'Güncelle';
            btn.querySelector('i').className = 'fas fa-sync-alt';
        });
    }
}
```

### Storage State

```javascript
// storageManager dual-mode state
class StorageManager {
    constructor() {
        this.db = null;              // IndexedDB instance
        this.isReady = false;
        this.useFallback = false;    // localStorage fallback
    }
    
    // Mode detection
    isBackendMode() {
        return authManager.isAuthenticated();
    }
}
```

---

## Modül Yapısı

### ES6 Module Pattern

```javascript
// Barrel export pattern
// components/sidebar/renderers/index.js
export { renderListView } from './listViewRenderer.js';
export { renderDetailView } from './detailViewRenderer.js';
export { renderSettingsView } from './settingsViewRenderer.js';
export { renderPoints } from './pointsRenderer.js';

// Kullanım
import { 
    renderListView, 
    renderDetailView 
} from './renderers/index.js';
```

### Singleton Pattern

```javascript
// services/authManager.js
class AuthManager {
    constructor() {
        this.storageKey = 'storymap_auth_token';
    }
    // ...
}

// Singleton instance
export const authManager = new AuthManager();

// Kullanım
import { authManager } from './services/authManager.js';
authManager.isAuthenticated();
```

### Factory Pattern

```javascript
// MapMarkers.js - Marker oluşturma
addMarker(coords, options = {}) {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    
    // Options'a göre marker oluştur
    if (options.isNumber) {
        el.innerHTML = `<span class="marker-number">${options.number}</span>`;
    } else {
        el.innerHTML = `<i class="fas ${options.icon}"></i>`;
    }
    
    el.style.backgroundColor = options.color;
    
    const marker = new maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(this.map);
    
    return marker;
}
```

---

## Tasarım Desenleri

### 1. Module Pattern

Namespace kirliliğini önler:

```javascript
// MapHelpers.js
export const MapHelpers = {
    calculateDistance(coord1, coord2) { /* ... */ },
    calculateArea(coordinates) { /* ... */ },
    formatDistance(meters) { /* ... */ }
};
```

### 2. Observer Pattern

Event callback sistemi:

```javascript
// SidebarComponent callbacks
this.onPointAdd = null;
this.onPointFocus = null;
this.onSave = null;
this.onDelete = null;

// Callback çağırma
if (this.onPointAdd) {
    this.onPointAdd(newPoint);
}
```

### 3. Strategy Pattern

Şablona özgü davranışlar:

```javascript
// Template-based behavior
const isRouteTemplate = template.type === 'route';
const isTimelineTemplate = template.type === 'timeline';

if (isRouteTemplate) {
    this.routeManager = new RouteManager(map, template);
    this.sidebarComponent.onRoutePointAdd = async (point) => {
        await this.mapComponent.addRoutePoint(point);
    };
}

if (isTimelineTemplate) {
    this.timelineManager = new TimelineManager(map, template);
    this.sidebarComponent.onTimelineEventAdd = (event) => {
        this.mapComponent.addTimelineEvent(event);
    };
}
```

### 4. Adapter Pattern

TimelineJS ve storage adaptörleri:

```javascript
// TimelineJSWrapper.js - TimelineJS adapter
class TimelineJSWrapper {
    constructor(containerId, options) {
        this.timeline = null;
        this.containerId = containerId;
    }
    
    // App format → TimelineJS format
    transformToTimelineFormat(events) {
        return {
            events: events.map(e => ({
                unique_id: `event_${e.id}`,
                start_date: this.parseDate(e.date),
                text: {
                    headline: e.title,
                    text: e.description
                }
            }))
        };
    }
    
    updateEvents(events) {
        const data = this.transformToTimelineFormat(events);
        // TimelineJS'i güncelle
    }
}
```

### 5. Facade Pattern

StorageManager karmaşıklığı gizler:

```javascript
// storageManager.js - Unified API
class StorageManager {
    // Tek bir API, arkada backend veya IndexedDB
    async saveMap(data) {
        if (this.isBackendMode()) {
            return await this.saveMapToBackend(data);
        } else {
            return await this.saveMapToIndexedDB(data);
        }
    }
    
    async getMap(id, source = null) {
        if (source === 'backend') {
            return await this.getMapFromBackend(id);
        } else if (source === 'indexeddb') {
            return await this.getMapFromIndexedDB(id);
        }
        
        // Auto-detect
        if (this.isBackendMode()) {
            try {
                return await this.getMapFromBackend(id);
            } catch {
                return await this.getMapFromIndexedDB(id);
            }
        }
        return await this.getMapFromIndexedDB(id);
    }
}
```

---

## Performans Optimizasyonları

### 1. Lazy Loading

Bileşenler ihtiyaç halinde yüklenir:

```javascript
// TimelineJS sadece timeline şablonunda yüklenir
if (isTimelineTemplate) {
    this.timelineJS = new TimelineJSWrapper('timeline-embed', options);
}

// StoryMap sadece storymap şablonunda yüklenir
if (isStoryMapTemplate) {
    this.storyMapComponent = new StoryMapComponent(containerId, data, template);
}
```

### 2. Selective Redraw

Sadece değişen katmanlar yeniden çizilir:

```javascript
// MapDrawing.js - Sadece değişen layer güncellenir
updateDrawingColor(layerId, color, drawingType) {
    if (drawingType === 'line') {
        this.map.setPaintProperty(`${layerId}-layer`, 'line-color', color);
    } else if (drawingType === 'polygon') {
        this.map.setPaintProperty(`${layerId}-fill`, 'fill-color', color);
        this.map.setPaintProperty(`${layerId}-outline`, 'line-color', color);
    }
}
```

### 3. Debounced Events

Scroll ve resize olayları throttle edilir:

```javascript
// StoryMapScroller.js
constructor(map, scenes) {
    this.scrollTimeout = null;
    
    window.addEventListener('scroll', () => {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = setTimeout(() => {
            this.handleScroll();
        }, 50);
    });
}
```

### 4. Route Cache

OSRM rotaları bellekte cache'lenir:

```javascript
// RouteManager.js
constructor() {
    this.routingCache = new Map();
}

async fetchRealRoute(point1, point2) {
    const cacheKey = `${point1[0]},${point1[1]}_${point2[0]},${point2[1]}`;
    
    // Cache hit
    if (this.routingCache.has(cacheKey)) {
        return this.routingCache.get(cacheKey);
    }
    
    // Fetch from OSRM
    const route = await this.fetchFromOSRM(point1, point2);
    
    // Cache store
    this.routingCache.set(cacheKey, route);
    
    return route;
}
```

### 5. RequestAnimationFrame

Sürükleme sırasında akıllı güncelleme:

```javascript
// DistanceMeasurement.js
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

### 6. Manual Timeline Refresh

TimelineJS auto-update performans nedeniyle kapatıldı:

```javascript
// TimelineJS güncellemeleri manuel
this.sidebarComponent.onRefreshTimelineJS = () => {
    // Kullanıcı "Yenile" butonuna tıkladığında
    this.timelineJS.updateEvents(this.sidebarComponent.points);
};
```

---

## Tarayıcı Uyumluluğu

### Gereksinimler

- ES6 modules desteği
- MapLibre GL JS desteği (WebGL)
- IndexedDB API
- CSS custom properties
- Fetch API
- sessionStorage

### Test Edilen Tarayıcılar

| Tarayıcı | Minimum Versiyon |
|----------|------------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

**Son Güncelleme:** 27 Şubat 2026  
**Versiyon:** 2.1.0
