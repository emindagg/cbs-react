# 🧩 Components - UI Components

Reusable UI components and widgets.

## 📂 Structure

```
components/
├── sidebar/              - Sidebar panel and sections
├── modals/               - Modal dialogs and overlays
├── controls/             - Map controls (FAB, legend, etc.)
└── layer-style-panel.js  - Veri Stili Paneli (import sonrası stil ayarları)
```

## 🎯 Purpose

Build modular, reusable UI components:
- ✅ Encapsulated functionality
- ✅ Consistent UI/UX
- ✅ Easy to test and maintain
- ✅ Reusable across features

## 📦 Component Pattern

Each component should:
1. **Encapsulate** its own HTML, CSS, and JS logic
2. **Expose API** for initialization and interaction
3. **Emit events** for external communication
4. **Accept props** for configuration

## 💡 Example

```javascript
// components/sidebar/sidebar-manager.js
export class SidebarManager {
    constructor(options = {}) {
        this.container = options.container;
        this.onToggle = options.onToggle;
        this.init();
    }

    init() {
        this.render();
        this.attachEvents();
    }

    render() {
        // Render UI
    }

    attachEvents() {
        // Attach event listeners
    }

    toggle() {
        // Toggle sidebar
        this.onToggle?.(this.isOpen);
    }
}
```

## 📝 Guidelines

1. **Single Responsibility:** Each component has one clear purpose
2. **Props-Driven:** Configuration via constructor options
3. **Event-Driven:** Communicate via events
4. **No Global State:** Use passed-in state or props
5. **Documented:** Clear API documentation

## 🔒 Panel Mutex Mekanizması

Bazı paneller aynı anda açık olamaz (karşılıklı hariç tutma). Bu sayede UI daha temiz ve kullanıcı deneyimi daha iyi olur.

### Mutex Çiftleri

**Veri Stili Paneli ⇄ CBS Araçları Paneli**

- Veri Stili Paneli açılırsa → CBS Araçları otomatik kapanır
- CBS Araçları açılırsa → Veri Stili Paneli otomatik kapanır

### Implementasyon

**1. CBS Araçları → Veri Stili Panelini Kapat**
```javascript
// ui-panels-initialization.js
function openToolsPanel(){
    // MUTEX: Close Layer Style Panel if open
    if (window.layerStylePanel && window.layerStylePanel.isVisible) {
        window.layerStylePanel.hidePanel();
    }
    // ... panel aç
}

// Global export
window.openToolsPanel = openToolsPanel;
window.closeToolsPanel = closeToolsPanel;
```

**2. Veri Stili → CBS Araçları Panelini Kapat**
```javascript
// layer-style-panel.js
showPanel() {
    // MUTEX: Close CBS Tools Panel if open
    if (typeof window.closeToolsPanel === 'function') {
        const toolsPanel = document.getElementById('tools-panel');
        if (toolsPanel && !toolsPanel.classList.contains('hidden')) {
            window.closeToolsPanel();
        }
    }
    // ... panel aç
}
```

### Yeni Mutex Ekleme

Yeni bir panel çifti eklemek için:

1. Her iki panelin `show/open` fonksiyonuna diğer paneli kapatan kod ekle
2. Gerekirse global fonksiyonları export et (`window.openXXXPanel`)
3. Panel görünürlük kontrolü yap (örn: `isVisible`, `classList.contains('hidden')`)

## 🎨 Layer Style Panel

Veri import edildikten sonra stil ayarları yapmak için kullanılan panel.

### Özellikler

**Tema Özellikleri:**
- ✅ Cluster açma/kapama
- ✅ Opacity (Şeffaflık)
- ✅ Marker boyutu
- ✅ Dolgu rengi
- ✅ Çerçeve kalınlığı/rengi

**Yazı Özellikleri:**
- ✅ Label field seçimi (properties'den otomatik tespit)
- ✅ Font boyutu
- ✅ Font rengi
- ✅ **Timeline Senkronizasyonu:** Timeline aktifken label'lar otomatik filtrelenir

### API

```javascript
// Global instance
window.layerStylePanel = new LayerStylePanel();

// FAB göster (import sonrası otomatik)
window.layerStylePanel.showFAB(dataCount, availableFields);

// Panel aç/kapat
window.layerStylePanel.showPanel();
window.layerStylePanel.hidePanel();
window.layerStylePanel.togglePanel();

// Label güncelle
window.layerStylePanel.updateBasicLabels();

// Durum kontrolü
if (window.layerStylePanel.isVisible) {
    // Panel açık
}
```

### Timeline Entegrasyonu

Layer Style Panel, Timeline ile entegre çalışır:

```javascript
// Timeline filtreleme sırasında
// timeline.js → _filterLabelSource()
const layerStylePanel = window.layerStylePanel;
if (layerStylePanel && layerStylePanel.currentSettings.labelField) {
    // Label'ları filtrele (timeline'a göre)
    const labelGeoJSON = {
        type: 'FeatureCollection',
        features: filteredMarkers.map(...)
    };
    map.getSource('user-data-labels').setData(labelGeoJSON);
}
```

Timeline kapatıldığında label'lar restore edilir:
```javascript
// timeline.js → clearTimeFilter()
layerStylePanel.updateBasicLabels(); // Tüm label'ları göster
```

---

**Status:** ✅ Fully Implemented
**Last Updated:** 2025-01-15
**Version:** 2.0.0 (with Panel Mutex & Timeline Sync)
