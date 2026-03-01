# StoryMap - Geliştirici Referans Dokümantasyonu

> **⚠️ ARŞİV:** Bu dosya eski referans dokümantasyonudur. Aşağıdaki güncel dosya yolları v2.1.0'a göre güncellenmiştir.
> Kapsamlı dokümantasyon için:
> - [README.md](./README.md) - Genel bakış ve proje özeti
> - [ARCHITECTURE.md](./ARCHITECTURE.md) - Mimari detaylar
> - [API_REFERENCE.md](./API_REFERENCE.md) - API referansı
> - [CONFIGURATION.md](./CONFIGURATION.md) - Konfigürasyon rehberi
> - [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Sorun giderme

---

Bu belge, projede hangi işlem için hangi dosyaya bakılması gerektiğini açıklar.

---

## 📍 Hızlı Referans Tablosu

| İşlem | Dosya | Fonksiyon/Sınıf |
|-------|-------|-----------------|
| Renk değiştirme | `src/styles/variables/colors.css` | CSS Custom Properties |
| Marker stili ekleme | `src/components/sidebar/constants/markerStyles.js` | `MARKER_STYLES` |
| Harita başlangıç ayarları | `src/components/map/MapComponent.js` | `MAP_DEFAULTS` |
| Yeni basemap ekleme | `src/components/sidebar/constants/basemaps.js` | `BASEMAPS` |
| HGM harita katmanları | `src/components/map/modules/MapLayers.js` | `basemapStyles` |
| Mesafe/alan hesaplama | `src/components/map/modules/MapHelpers.js` | `calculateDistance()` |
| Mesafe ölçüm aracı | `src/components/map/modules/DistanceMeasurement.js` | `activate()`, `clearAll()` |
| Alan ölçüm aracı | `src/components/map/modules/AreaMeasurement.js` | `activate()`, `clearAll()` |
| Ölçüm temizleme butonu | `src/components/toolbar/modules/ToolManager.js` | `clearAllMeasurements()` |
| Marker ekleme/silme | `src/components/map/modules/MapMarkers.js` | `addMarker()` |
| Çizim modu başlatma | `src/components/map/modules/MapDrawing.js` | `enableLineMode()` |
| Sidebar sabitleri | `src/components/sidebar/constants/index.js` | Barrel export |
| Liste görünümü düzenleme | `src/components/sidebar/renderers/listViewRenderer.js` | `renderListView()` |
| Event handler ekleme | `src/components/sidebar/handlers/listViewHandlers.js` | Event handlers |
| Detay paneli | `src/components/sidebar/modules/DetailPanel.js` | `DetailPanel` |
| Nokta yönetimi | `src/components/sidebar/modules/PointManager.js` | `PointManager` |
| Medya yönetimi | `src/components/sidebar/modules/MediaManager.js` | `MediaManager` |
| Veri kaydetme/yükleme | `src/utils/storageManager.js` | `StorageManager` |
| Auth yönetimi | `src/services/authManager.js` | `authManager` |
| API servisi | `src/services/apiService.js` | `apiService` |
| Migration araçları | `src/utils/migrationHelper.js` | `migrationHelper` |
| Bildirim sistemi | `src/utils/toast.js` | `toast` |
| Dialog kutuları | `src/utils/customPrompt.js` | `customConfirm`, `customPrompt` |
| Paylaş modalı | `src/components/toolbar/panels/SharePanel.js` | `open()`, `close()` |
| Geri bildirim formu | `src/components/toolbar/panels/ReportPanel.js` | `open()`, `close()` |
| Toolbar aksiyonları | `src/components/toolbar/modules/ActionManager.js` | `handleAction()` |
| Harita listesi | `src/components/StorymapManager.js` | `StorymapManager` |
| Şablon tanımları | `src/data/templates.js` | `templates` |
| Admin paneli | `admin/index.html` + `src/admin/AdminAppPro.js` | `AdminAppPro` |
| Admin erişimi | URL'e `?admin` veya `#admin` ekle | Otomatik yönlendirme |

---

## 🗂️ Dosya Referansları

### 📁 `src/config/constants.js`

**Ne zaman kullanılır:** Uygulama genelinde kullanılan sabit değerleri değiştirmek istediğinizde.

```javascript
// Renkler
COLORS.PRIMARY        // Ana renk (#10b981 - Zümrüt)
COLORS.BONE_WHITE     // Arka plan rengi (#f5f5f0)
COLORS.TEXT_DARK      // Koyu metin (#374151)

// Harita ayarları
MAP_CONFIG.DEFAULT_CENTER    // Başlangıç koordinatları
MAP_CONFIG.DEFAULT_ZOOM      // Başlangıç zoom seviyesi
MAP_CONFIG.MIN_ZOOM          // Minimum zoom
MAP_CONFIG.MAX_ZOOM          // Maximum zoom

// Marker stilleri
MARKER_STYLES[]       // Tüm marker stilleri (default, number, pin, star, vb.)

// Çizim tipleri
DRAWING_TYPES.LINE      // Çizgi
DRAWING_TYPES.POLYGON   // Alan
DRAWING_TYPES.CIRCLE    // Daire
DRAWING_TYPES.RECTANGLE // Dikdörtgen
DRAWING_TYPES.TEXT      // Metin

// Harita katmanları
BASEMAPS[]            // Kullanılabilir basemap'ler
```

---

### 📁 `src/components/map/` (Harita Modülü)

#### `index.js` - Ana Harita Bileşeni

**Ne zaman kullanılır:** Harita ile ilgili genel işlemler.

```javascript
// Harita oluşturma
const map = new MapComponent('map-container', options);
await map.init();

// Harita kontrolü
map.flyTo([lng, lat], zoom);     // Animasyonlu geçiş
map.jumpTo([lng, lat], zoom);    // Anında geçiş
map.fitBounds(bounds);           // Bounds'a sığdır
map.fitToPoints(points);         // Tüm noktaları göster
map.setStyle(styleUrl);          // Harita stilini değiştir
map.resize();                    // Yeniden boyutlandır
map.destroy();                   // Haritayı yok et

// Marker işlemleri
map.addMarker(point);            // Marker ekle
map.updateMarker(id, point);     // Marker güncelle
map.removeMarker(id);            // Marker sil
map.clearMarkers();              // Tüm marker'ları sil

// Çizim modları
map.enableMarkerMode(callback);  // Marker ekleme modu
map.enableLineMode(callback);    // Çizgi çizim modu
map.enablePolygonMode(callback); // Polygon çizim modu
map.enableCircleMode(callback);  // Daire çizim modu
map.enableRectangleMode(callback); // Dikdörtgen çizim modu
map.enableTextMode(callback);    // Metin ekleme modu
map.cancelDrawing();             // Çizimi iptal et

// Çizim render
map.renderDrawing(drawing);      // Çizimi haritaya ekle
map.removeDrawing(id);           // Çizimi kaldır
map.updateDrawing(drawing);      // Çizimi güncelle
map.clearDrawings();             // Tüm çizimleri temizle

// Ölçüm araçları
map.activateDistanceMeasurement();   // Mesafe ölçümünü başlat
map.activateAreaMeasurement();       // Alan ölçümünü başlat
map.deactivateMeasurementTools();    // Ölçüm araçlarını kapat
map.clearAllMeasurements();          // Mesafe ve alan ölçümlerini temizle
map.getMeasurementData();            // Ölçüm verilerini al
```

#### `MapHelpers.js` - Yardımcı Fonksiyonlar

**Ne zaman kullanılır:** Hesaplama ve yardımcı işlemler.

```javascript
// Mesafe hesaplama
calculateDistance(coord1, coord2);       // İki nokta arası (metre)
calculateTotalDistance(coordinates);     // Toplam yol (metre)
formatDistance(meters);                  // Formatla (m/km)

// Alan hesaplama
calculateArea(coordinates);              // Polygon alanı (m²)
formatArea(sqMeters);                    // Formatla (m²/km²)

// Daire hesaplamaları
calculateCircleCircumference(radius);    // Çevre
calculateCircleArea(radius);             // Alan
calculateCirclePoints(center, radius);   // Daire noktaları

// Koordinat işlemleri
calculateRectangleCorners(start, end);   // Dikdörtgen köşeleri
calculateBounds(coordinates);            // Sınırları hesapla
calculateCenter(coordinates);            // Merkezi hesapla

// Preview fonksiyonları
updatePreviewPolygon(map, coords, ...);  // Polygon preview
updatePreviewLine(map, coords, ...);     // Çizgi preview
cleanupPreview(map, layers, sources);    // Preview temizle

// Vertex işlemleri
createVertexElement(index, options);     // Vertex element oluştur
updateVertexMarkers(map, coords, ...);   // Vertex marker'ları güncelle
```

#### `MapMarkers.js` - Marker İşlemleri

**Ne zaman kullanılır:** Marker oluşturma ve yönetimi.

```javascript
// Marker oluşturma
createMarkerElement(point);              // HTML element oluştur
addMarker(map, point, onClick);          // Haritaya marker ekle
updateMarker(marker, point);             // Marker güncelle
removeMarker(marker);                    // Marker sil
removeAllMarkers(markers);               // Tüm marker'ları sil

// Text marker
addTextMarker(map, drawing, onClick);    // Metin marker ekle
updateTextMarker(marker, drawing);       // Metin marker güncelle

// Geçici marker
createTempMarker(map, coords, options);  // Geçici marker oluştur

// Görünürlük
setMarkerVisibility(marker, visible);    // Görünürlük ayarla
setAllMarkersVisibility(markers, visible);

// Sürükleme
makeMarkerDraggable(marker, onDragEnd);  // Sürüklenebilir yap
makeMarkerFixed(marker);                 // Sabit yap

// Popup
addMarkerPopup(marker, content, options);
removeMarkerPopup(marker);
```

#### `MapDrawing.js` - Çizim İşlemleri

**Ne zaman kullanılır:** Çizim modları ve çizim render'ı.

```javascript
// Çizim durumu
createDrawingState();                    // Yeni state oluştur
resetDrawingState(state, map);           // State sıfırla

// Çizim modları
enableLineMode(map, state, callbacks);   // Çizgi modu
enablePolygonMode(map, state, callbacks); // Polygon modu
enableCircleMode(map, state, callbacks); // Daire modu
enableRectangleMode(map, state, callbacks); // Dikdörtgen modu
enableTextMode(map, state, callbacks);   // Metin modu

// Callbacks örneği
{
    onComplete: (result) => { },         // Tamamlandığında
    onUpdate: (coords) => { },           // Güncelleme
    onCancel: () => { }                  // İptal
}

// Çizim render
renderDrawing(map, drawing, onClick);    // Çizimi haritaya ekle
removeDrawing(map, drawingId);           // Çizimi kaldır
updateDrawingStyle(map, drawing);        // Stil güncelle
```

#### `modules/DistanceMeasurement.js` - Mesafe Ölçüm Aracı

**Ne zaman kullanılır:** Haritada çizgi şeklinde mesafe ölçmek için.

```javascript
const distance = new DistanceMeasurement(map);
distance.activate();   // Ölçüme başla (tıklayarak noktalar ekle)
distance.clearAll();   // Tüm mesafe ölçümlerini temizle
```

Özellikler:
- Çift tıkla bitirme, ESC ile iptal
- Sürüklenebilir noktalar
- Ghost çizgi önizleme
- Minimal sonuç popup'ı (ikon + değer)

#### `modules/AreaMeasurement.js` - Alan Ölçüm Aracı

**Ne zaman kullanılır:** Haritada polygon çizerek alan ölçmek için.

```javascript
const area = new AreaMeasurement(map);
area.activate();    // Ölçüme başla (en az 3 nokta)
area.clearAll();    // Tüm alan ölçümlerini temizle
```

Özellikler:
- Çift tıkla bitirme, ESC ile iptal
- Sürüklenebilir köşe noktaları
- Ghost polygon önizleme
- Minimal sonuç popup'ı (ikon + değer)

#### `modules/MapLayers.js` - Harita Katmanları

**Ne zaman kullanılır:** HGM harita katmanlarını yönetmek için.

```javascript
const layers = new MapLayers(map);

// Basemap değiştirme
layers.changeBasemap('hgm-temel', markers);  // Temel Harita
layers.changeBasemap('hgm-uydu', markers);   // Uydu Görüntüsü
layers.changeBasemap('hgm-gece', markers);   // Gece Haritası
layers.changeBasemap('hgm-siyasi', markers); // Siyasi Harita
layers.changeBasemap('hgm-yukseklik', markers); // Yükseklik Haritası
layers.changeBasemap('openstreetmap', markers); // OpenStreetMap
```

**Mevcut Katmanlar:**
- `hgm-temel`: HGM Temel Harita (Atlas endpoint)
- `hgm-uydu`: HGM Uydu Görüntüsü (Atlas endpoint)
- `hgm-gece`: HGM Gece Haritası (Atlas endpoint)
- `hgm-siyasi`: HGM Siyasi Harita (Atlas endpoint)
- `hgm-yukseklik`: HGM Yükseklik Haritası (Atlas endpoint)
- `openstreetmap`: OpenStreetMap (varsayılan)

**CORS Çözümü:**
- Tüm HGM katmanları `atlas.harita.gov.tr/webservis/` endpoint'lerini kullanır
- `api.harita.gov.tr/arcgis/` endpoint'leri CORS nedeniyle engelleniyor
- Atlas endpoint'leri CORS uyumlu ve MEB sunucusundan erişilebilir

---

### 📁 `src/components/sidebar/` (Sidebar Modülü)

#### `index.js` - Ana Sidebar Bileşeni

**Ne zaman kullanılır:** Sidebar genel yönetimi.

```javascript
// Sidebar oluşturma
const sidebar = new SidebarComponent('sidebar-container', {
    onToggle: (isOpen) => { },
    onFlyTo: (id, type) => { },
    onSavePoint: (id, data) => { },
    onDeletePoint: (id) => { },
    // ... diğer callback'ler
});
sidebar.init();

// Görünüm yönetimi
sidebar.showListView();                  // Liste görünümü
sidebar.showDetailView(id, type);        // Detay görünümü
sidebar.setActiveTab(tab);               // Tab değiştir

// Açma/Kapama
sidebar.toggle();                        // Aç/Kapat
sidebar.open();                          // Aç
sidebar.close();                         // Kapat
sidebar.isVisible();                     // Açık mı?

// Veri yönetimi
sidebar.setPoints(points);               // Noktaları ayarla
sidebar.setDrawings(drawings);           // Çizimleri ayarla
sidebar.setSettings(settings);           // Ayarları ayarla
sidebar.addPoint(point);                 // Nokta ekle
sidebar.updatePoint(id, data);           // Nokta güncelle
sidebar.removePoint(id);                 // Nokta sil
sidebar.addDrawing(drawing);             // Çizim ekle
sidebar.updateDrawing(id, data);         // Çizim güncelle
sidebar.removeDrawing(id);               // Çizim sil

// Seçim
sidebar.selectItem(id, type);            // Öğe seç

// Yenileme
sidebar.refresh();                       // İçeriği yenile
sidebar.destroy();                       // Sidebar'ı yok et
```

#### `SidebarConfig.js` - Konfigürasyon

**Ne zaman kullanılır:** Sidebar sabitleri ve tanımları.

```javascript
// Tab tanımları
SIDEBAR_TABS.POINTS      // 'points'
SIDEBAR_TABS.DRAWINGS    // 'drawings'
SIDEBAR_TABS.SETTINGS    // 'settings'

// View tanımları
SIDEBAR_VIEWS.LIST       // 'list'
SIDEBAR_VIEWS.DETAIL     // 'detail'
SIDEBAR_VIEWS.SETTINGS   // 'settings'

// Seçenekler
MARKER_SIZES[]           // Marker boyutları
COLOR_PALETTE[]          // Renk paleti
FONT_SIZES[]             // Font boyutları
LINE_WIDTHS[]            // Çizgi kalınlıkları
FILL_OPACITIES[]         // Dolgu opaklıkları

// Varsayılan değerler
DEFAULT_POINT            // Yeni nokta varsayılanları
DEFAULT_DRAWING          // Yeni çizim varsayılanları

// CSS sınıfları
CSS_CLASSES.SIDEBAR      // 'sidebar'
CSS_CLASSES.TAB          // 'sidebar__tab'
CSS_CLASSES.LIST_ITEM    // 'sidebar__list-item'
// ... daha fazlası

// Mesajlar
MESSAGES.EMPTY_POINTS
MESSAGES.CONFIRM_DELETE_POINT
MESSAGES.SAVED
// ... daha fazlası

// Helper fonksiyonlar
createMarkerStyleOption(style, selected, color);
createColorOption(color, selected);
createSelectOptions(options, selected);
```

#### `SidebarViews.js` - Render Fonksiyonları

**Ne zaman kullanılır:** HTML render işlemleri.

```javascript
// Ana render fonksiyonları
renderTabs(activeTab);                   // Tab'ları render et
renderListView({ points, drawings, activeTab, selectedId });
renderDetailView({ item, type });
renderSettingsView({ settings, basemaps });

// Liste öğeleri
renderEmptyState(message);               // Boş durum mesajı
renderPointItem(point, selectedId);      // Nokta öğesi
renderDrawingItem(drawing, selectedId);  // Çizim öğesi

// Detay görünümleri
renderPointDetail(point);                // Nokta detayı
renderDrawingDetail(drawing);            // Çizim detayı

// Yardımcı render fonksiyonları
renderDetailHeader(title);               // Detay başlığı
renderDetailFooter(type, id);            // Detay footer
renderFormGroup(label, content);         // Form grubu
renderMarkerStylePicker(selected);       // Stil seçici
renderColorPicker(selected, dataAttr);   // Renk seçici
renderMediaSection(media);               // Medya bölümü
renderSettingsSection(title, content);   // Ayar bölümü

// Utility
escapeHtml(text);                        // HTML escape
```

#### `SidebarListeners.js` - Event Handler'lar

**Ne zaman kullanılır:** Event yönetimi.

```javascript
// Listener sınıfı
const listeners = new SidebarListeners(sidebar);

// Ana metodlar
listeners.attachAll();                   // Tüm listener'ları bağla
listeners.detachAll();                   // Tüm listener'ları kaldır

// Spesifik listener'lar
listeners.attachTabListeners();          // Tab listener'ları
listeners.attachListListeners();         // Liste listener'ları
listeners.attachDetailListeners();       // Detay listener'ları
listeners.attachSettingsListeners();     // Ayar listener'ları
listeners.attachHeaderListeners();       // Header listener'ları

// Handler'lar
listeners.handleItemClick(id, type);     // Öğe tıklama
listeners.handleListAction(action, id, type);  // Liste aksiyonu
listeners.handleDelete(id, type);        // Silme
listeners.handleSave(type, id);          // Kaydetme
listeners.collectFormData(type);         // Form veri toplama
listeners.handleStyleSelect(option);     // Stil seçimi
listeners.handleColorSelect(option);     // Renk seçimi
listeners.handleAddMedia();              // Medya ekleme
listeners.handleRemoveMedia(index);      // Medya silme
listeners.handleBasemapChange(id, option); // Basemap değişimi
listeners.handleImportData();            // Veri içe aktarma
listeners.handleClearAllData();          // Tüm verileri silme
```

---

### 📁 `src/components/` (Diğer Bileşenler)

#### `ToolbarComponent.js` - Araç Çubuğu

**Ne zaman kullanılır:** Araç çubuğu işlemleri.

```javascript
// Özellikler
- Araç butonları (marker, çizgi, polygon, daire, dikdörtgen, metin)
- Ölçüm butonları (mesafe, alan, temizle)
- Geri al / Yinele (Undo/Redo)
- Kilitleme mekanizması
- Aktif araç gösterimi

// Ölçüm temizleme
toolManager.clearAllMeasurements(); // Mesafe ve alan ölçümlerini temizler
```

#### `ModalComponent.js` - Modal Pencereler

**Ne zaman kullanılır:** Popup/modal gösterimi.

```javascript
// Özellikler
- Şablon seçim modalı
- Onay modalları
- Form modalları
```

#### `GeocoderControl.js` - Konum Arama

**Ne zaman kullanılır:** Adres/konum arama.

```javascript
// Özellikler
- Nominatim API entegrasyonu
- Arama önerileri
- Koordinata gitme
```

---

### 📁 `src/components/toolbar/` (Toolbar Modülü)

#### `modules/ActionManager.js` - Aksiyon Yönetimi

**Ne zaman kullanılır:** Toolbar aksiyon butonları (Paylaş, Şikayet Et, İstatistik, Admin).

```javascript
// Özellikler
- Admin modu kontrolü (URL'de ?admin veya #admin)
- Paylaş paneli açma
- Geri bildirim formu açma
- Admin paneline yönlendirme

// Admin modu
// URL: http://site.com?admin veya http://site.com#admin
// Admin butonları görünür olur
```

#### `panels/SharePanel.js` - Paylaş Modalı

**Ne zaman kullanılır:** Hikâye paylaşımı.

```javascript
const sharePanel = new SharePanel();
sharePanel.open();   // Modalı aç
sharePanel.close();  // Modalı kapat

// Özellikler
- Link kopyalama
- Sosyal medya paylaşımı (Twitter, Facebook, WhatsApp, Telegram, Email)
```

#### `panels/ReportPanel.js` - Geri Bildirim Formu

**Ne zaman kullanılır:** Kullanıcı geri bildirimi toplama.

```javascript
const reportPanel = new ReportPanel();
reportPanel.open();   // Formu aç
reportPanel.close();  // Formu kapat

// Form alanları
- Ad Soyad (zorunlu)
- Okul (zorunlu)
- Tür: Öneri / Hata / Uygunsuz İçerik (zorunlu)
- İlgili link (zorunlu)
- Açıklama (zorunlu)

// Veriler localStorage'a kaydedilir: 'storymap_reports'
```

---

### 📁 `src/admin/` (Admin Paneli)

#### `AdminApp.js` - Admin Uygulaması

**Ne zaman kullanılır:** Yönetim paneli işlemleri.

```javascript
// Erişim (MEB sunucusunda)
// URL: https://mebi.eba.gov.tr/upload/skill-based-app/a753e3c31a/index.html?admin=true
// admin.html dosyası güvenlik nedeniyle engelleniyor, URL parametresi kullanılır

// Özellikler
- Dashboard (özet kartlar)
- Şikayetler tablosu (filtreleme, toplu silme)
- İstatistikler (tür ve durum dağılımı)

// Şikayet yönetimi
adminApp.resolveReport(index);    // Çözüldü işaretle
adminApp.unresolveReport(index);  // Çözülmedi işaretle
adminApp.deleteReport(index);     // Tek şikayet sil
adminApp.bulkDelete();            // Seçilenleri sil
adminApp.toggleSelectAll(cb);     // Tümünü seç/kaldır

// Veri kaynağı
localStorage.getItem('storymap_reports')  // Şikayetler
localStorage.getItem('storymap_data')     // Projeler
```

#### `styles/admin.css` - Admin Stilleri

**Ne zaman kullanılır:** Admin paneli görünümü.

```css
/* Ana bileşenler */
.admin                    /* Ana layout */
.admin__sidebar           /* Sol menü */
.admin__main              /* Ana içerik */
.admin__header            /* Üst başlık */

/* Kartlar */
.stat-card                /* İstatistik kartı */
.stat-card__icon--blue    /* Mavi ikon */
.stat-card__icon--green   /* Yeşil ikon */

/* Tablo */
.table                    /* Tablo */
.badge--pending           /* Bekliyor badge */
.badge--resolved          /* Çözüldü badge */

/* Butonlar */
.btn--resolve             /* Çözüldü butonu */
.btn--pending             /* Çözülmedi butonu */
.btn--delete              /* Sil butonu */
.btn--bulk-delete         /* Toplu sil butonu */
```

---

### 📁 `src/utils/` (Yardımcı Modüller)

#### `storageManager.js` - Veri Depolama

**Ne zaman kullanılır:** Veri kaydetme/yükleme.

```javascript
// IndexedDB işlemleri
StorageManager.init();                   // Başlat
StorageManager.save(key, data);          // Kaydet
StorageManager.load(key);                // Yükle
StorageManager.delete(key);              // Sil
StorageManager.clear();                  // Tümünü sil

// LocalStorage fallback
// IndexedDB desteklenmezse otomatik LocalStorage kullanır
```

#### `styleLoader.js` - Stil Yükleme

**Ne zaman kullanılır:** Dinamik CSS yükleme.

```javascript
loadStyle(cssPath);                      // CSS dosyası yükle
```

---

### 📁 `src/styles/` (CSS Dosyaları)

```
styles/
├── global.css              # Tüm stilleri import eder
├── base/
│   └── reset.css           # Tarayıcı sıfırlama
├── variables/
│   └── colors.css          # CSS değişkenleri (renkler)
├── components/
│   ├── modal.css           # Modal stilleri
│   ├── sidebar.css         # Sidebar stilleri
│   └── toolbar.css         # Toolbar stilleri
└── utilities/
    └── helpers.css         # Yardımcı sınıflar
```

**BEM Metodolojisi:**
```css
.block { }                  /* Ana blok */
.block__element { }         /* Element */
.block--modifier { }        /* Değiştirici */

/* Örnek */
.sidebar { }
.sidebar__header { }
.sidebar__tab { }
.sidebar__tab--active { }
```

---

## 🔧 Sık Yapılan İşlemler

### Yeni Marker Stili Ekleme

1. `src/config/constants.js` dosyasını aç
2. `MARKER_STYLES` dizisine yeni stil ekle:

```javascript
{
    value: 'custom',
    label: 'Özel',
    icon: '🎯'  // veya FontAwesome class
}
```

### Yeni Renk Ekleme

1. `src/config/constants.js` → `COLORS` objesine ekle
2. `src/styles/variables/colors.css` → CSS değişkeni ekle
3. `src/components/sidebar/SidebarConfig.js` → `COLOR_PALETTE` dizisine ekle

### Yeni Çizim Tipi Ekleme

1. `src/config/constants.js` → `DRAWING_TYPES` objesine ekle
2. `src/components/map/MapDrawing.js` → Yeni enable fonksiyonu ekle
3. `src/components/sidebar/SidebarConfig.js` → `DRAWING_TYPE_LABELS` ve `DRAWING_TYPE_ICONS` güncelle

### Yeni Basemap Ekleme

1. `src/config/constants.js` → `BASEMAPS` dizisine ekle:

```javascript
{
    id: 'custom-map',
    name: 'Özel Harita',
    url: 'https://...',
    preview: '#color'
}
```

### Sidebar'a Yeni Tab Ekleme

1. `src/components/sidebar/SidebarConfig.js`:
   - `SIDEBAR_TABS` objesine ekle
   - `TAB_LABELS` objesine ekle
   - `TAB_ICONS` objesine ekle

2. `src/components/sidebar/SidebarViews.js`:
   - İlgili render fonksiyonu ekle

3. `src/components/sidebar/SidebarListeners.js`:
   - İlgili listener'ları ekle

---

## 📚 Ek Kaynaklar

- [MapLibre GL JS Docs](https://maplibre.org/maplibre-gl-js-docs/)
- [Font Awesome Icons](https://fontawesome.com/icons)
- [BEM Metodolojisi](https://getbem.com/)

---

## 🏷️ Versiyon

**Son güncelleme:** 11 Ocak 2026  
**Versiyon:** 1.2.0

> **Önemli:** Bu dosya artık aktif olarak güncellenmemektedir. Güncel bilgiler için [README.md](./README.md) ve diğer ana dokümantasyon dosyalarına bakın.

### Değişiklik Geçmişi

**v1.2.0 (18 Aralık 2025)**
- HGM CORS sorunu çözüldü (Atlas endpoint'lerine geçiş)
- MapLayers modülü eklendi (harita katmanları yönetimi)
- Admin panel erişimi güncellendi (`?admin=true` parametresi)
- MEB sunucusu uyumluluğu sağlandı

**v1.1.0 (18 Aralık 2025)**
- Paylaş modalı eklendi (sosyal medya entegrasyonu)
- Geri bildirim formu eklendi (Öneri/Hata/Uygunsuz İçerik)
- Admin paneli eklendi (Dashboard, Şikayetler, İstatistikler)
- Toolbar'a aksiyon butonları eklendi
- Admin erişimi: `?admin` query parameter

**v1.0.0 (26 Kasım 2025)**
- İlk sürüm
