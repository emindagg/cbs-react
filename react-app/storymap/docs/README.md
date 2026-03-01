# StoryMap - Kapsamlı Proje Dokümantasyonu

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mimari Yapı](#mimari-yapı)
3. [Şablonlar](#şablonlar)
4. [Bileşenler](#bileşenler)
5. [Servisler](#servisler)
6. [Veri Yönetimi](#veri-yönetimi)
7. [Kullanıcı Akışları](#kullanıcı-akışları)
8. [API Referansı](#api-referansı)
9. [Stil Rehberi](#stil-rehberi)
10. [Sorun Giderme](#sorun-giderme)

---

## Genel Bakış

**StoryMap**, eğitim ve anlatı amaçlı interaktif hikâye haritaları oluşturmak için geliştirilmiş profesyonel bir full-stack web platformudur.

### Temel Özellikler

| Özellik | Açıklama |
|---------|----------|
| **MEBBİS OAuth** | Öğretmen ve öğrenci girişi |
| **4 Şablon** | Nokta, Rota, Timeline, StoryMap |
| **Dual-Mode Storage** | Backend + IndexedDB hybrid |
| **Public Paylaşım** | URL ile kolay harita paylaşımı |
| **CDN Medya Upload** | Dosya yüklemeleri için CDN |
| **Migration Aracı** | Lokal → Backend yükleme |
| **Ölçüm Araçları** | Mesafe ve alan ölçümü |
| **3D Görünüm** | Harita için 3D desteği |

### Teknoloji Stack'i

```
Frontend:
├── Vanilla JavaScript (ES6 Modules)
├── MapLibre GL JS v2+
├── Turf.js v6
├── TimelineJS v3
├── Font Awesome v6.4.0
└── BEM CSS Metodolojisi

Backend:
├── ASP.NET Core API
├── MEBBİS OAuth
├── JWT Bearer Authentication
├── SQL Server
└── Azure/CloudFlare CDN
```

### Sayfa Yapısı

| Sayfa | Dosya | Açıklama |
|-------|-------|----------|
| Landing | `index.html` | Giriş seçenekleri (3 seçenek) |
| OAuth Callback | `LoginRedirect.html` | MEBBİS token işleme |
| Uygulama | `app.html` | Ana uygulama (auth gerekli) |
| Public View | `view.html` | Paylaşılan harita görüntüleme |
| Admin | `admin/index.html` | Yönetim paneli |

---

## Mimari Yapı

### Modüler Bileşen Sistemi

Proje, 3 katmanlı modüler yapı kullanır:

```
Component/
├── renderers/     # HTML render fonksiyonları
├── handlers/      # Event listener yönetimi
└── modules/       # Business logic ve state
```

### Bileşen İletişim Deseni

Bileşenler callback fonksiyonları ile iletişim kurar:

```javascript
// ModalComponent → SidebarComponent callback örneği
this.sidebarComponent.onSave = async () => { /* save logic */ };
this.sidebarComponent.onPointAdd = (point) => { /* add to map */ };
this.sidebarComponent.onPointFocus = (point) => { /* fly to point */ };
```

### Veri Akışı

```
Kullanıcı Etkileşimi (UI)
         ↓
Event Handler (Toolbar/Sidebar)
         ↓
Callback Function (onPointAdd, onSave, vb.)
         ↓
Component Update (Map/Sidebar/Modal)
         ↓
Storage (Backend API / IndexedDB)
```

### Dosya Yapısı

```
storymap/
├── index.html                    # Landing page
├── LoginRedirect.html            # MEBBİS callback
├── app.html                      # Ana uygulama
├── view.html                     # Public görüntüleme
│
├── src/
│   ├── main.js                   # App entry point
│   ├── landingMain.js            # Landing entry
│   ├── loginRedirectMain.js      # OAuth callback
│   ├── viewMain.js               # Public view entry
│   │
│   ├── services/                 # Backend Servisleri
│   │   ├── authManager.js        # JWT token yönetimi
│   │   └── apiService.js         # REST API wrapper
│   │
│   ├── components/               # UI Bileşenleri
│   │   ├── ModalComponent.js     # Şablon seçimi
│   │   ├── StorymapManager.js    # Harita listeleme
│   │   │
│   │   ├── map/                  # Harita Sistemi
│   │   │   ├── MapComponent.js   # Ana orchestrator
│   │   │   └── modules/
│   │   │       ├── MapHelpers.js
│   │   │       ├── MapMarkers.js
│   │   │       ├── MapDrawing.js
│   │   │       ├── MapLayers.js
│   │   │       ├── RouteManager.js
│   │   │       ├── TimelineManager.js
│   │   │       ├── DistanceMeasurement.js
│   │   │       ├── AreaMeasurement.js
│   │   │       └── Toggle3DControl.js
│   │   │
│   │   ├── sidebar/              # Kenar Panel
│   │   │   ├── SidebarComponent.js
│   │   │   ├── constants/
│   │   │   ├── renderers/
│   │   │   ├── handlers/
│   │   │   └── modules/
│   │   │
│   │   ├── toolbar/              # Araç Çubuğu
│   │   │   ├── ToolbarComponent.js
│   │   │   ├── modules/
│   │   │   └── panels/
│   │   │
│   │   ├── storymap/             # StoryMap Şablonu
│   │   │   ├── StoryMapComponent.js
│   │   │   ├── StoryMapRenderer.js
│   │   │   └── StoryMapScroller.js
│   │   │
│   │   └── timeline/             # Timeline Entegrasyonu
│   │       └── TimelineJSWrapper.js
│   │
│   ├── utils/                    # Yardımcı Fonksiyonlar
│   │   ├── storageManager.js     # Dual-mode storage
│   │   ├── migrationHelper.js    # Local → Backend
│   │   ├── toast.js              # Bildirim sistemi
│   │   └── customPrompt.js       # Dialog kutuları
│   │
│   ├── data/
│   │   └── templates.js          # 4 şablon tanımı
│   │
│   └── styles/                   # BEM CSS
│       ├── variables/
│       ├── base/
│       ├── components/
│       └── utilities/
│
└── admin/                        # Yönetici Paneli
    ├── index.html
    ├── AdminApp.js
    └── styles/
```

---

## Şablonlar

### 1. Nokta Bazlı (Point)

Bağımsız noktalar ekleyerek hikâye oluşturma.

**Kullanım Alanları:**
- Tarihi mekanlar ve anıtlar
- Göller, dağlar, doğal oluşumlar
- Müzeler, kütüphaneler, turistik yerler

**Özellikler:**
- Sınırsız nokta ekleme
- Her nokta için başlık, açıklama, medya
- Özelleştirilebilir marker stilleri
- Playback kontrolleri (1x, 2x, 3x, 5x hız)

### 2. Rota Bazlı (Route)

Noktalar arası rota çizimi ve yolculuk hikâyesi.

**Kullanım Alanları:**
- Seyahat günlükleri
- Keşif rotaları
- Tarihi yolculuklar

**Özellikler:**
- **OSRM Gerçek Karayolu Rotaları**: Deniz/dağ geçişi yok
- Otomatik rota çizimi (200-300 koordinat detaylı)
- Nokta arası mesafe hesaplama
- Toplam rota mesafesi
- Yer değiştirme (displacement) hesabı
- Günlük bazlı renk kodlaması
- Rota cache mekanizması

**Günlük Renkleri:**
| Gün | Renk |
|-----|------|
| 1 | Kırmızı (#ef4444) |
| 2 | Turuncu (#f59e0b) |
| 3 | Yeşil (#10b981) |
| 4 | Mavi (#3b82f6) |
| 5 | Mor (#8b5cf6) |
| 6 | Pembe (#ec4899) |
| 7 | Teal (#14b8a6) |

### 3. Timeline Bazlı (Timeline)

Kronolojik olayları zaman çizelgesinde görselleştirme.

**Kullanım Alanları:**
- Tarihi olaylar
- Süreç belgeleme
- Dönem analizi

**Özellikler:**
- TimelineJS entegrasyonu
- Tarih bazlı otomatik sıralama
- Kategori veya önem seviyesine göre renklendirme
- Era (dönem) gruplama
- Zaman çizelgesi ve harita senkronizasyonu
- Playback kontrolleri

**Kategori Renkleri:**
| Kategori | Renk |
|----------|------|
| Military | Kırmızı (#ef4444) |
| Political | Mavi (#3b82f6) |
| Cultural | Mor (#8b5cf6) |
| Scientific | Yeşil (#10b981) |
| Social | Turuncu (#f59e0b) |
| Economic | Cyan (#06b6d4) |
| Other | Gri (#6b7280) |

### 4. Hikâye Haritası (StoryMap)

Zengin içerikli scrollytelling deneyimi.

**Kullanım Alanları:**
- Doğa harikaları
- Kültürel miras
- Detaylı mekan tanıtımları

**Özellikler:**
- Scroll bazlı sahne geçişleri
- Zengin medya desteği
- Kenar panel anlatımı
- Harita zoom ve pan animasyonları
- Otomatik playback (0.5x, 1x, 3x hız)
- 3D görünüm desteği

---

## Bileşenler

### MapComponent

Ana harita bileşeni - tüm harita işlemlerini koordine eder.

```javascript
import { MapComponent } from './components/map/MapComponent.js';

const map = new MapComponent('map-container', {
    center: [35.0, 39.0],
    zoom: 6,
    template: template,
    templateKey: 'point',
    viewMode: false
});
```

**Alt Modüller:**
- `MapHelpers`: Mesafe, alan, koordinat hesaplamaları
- `MapMarkers`: Marker CRUD, stillendirme
- `MapDrawing`: Çizim araçları (line, polygon, circle, rectangle, text)
- `MapLayers`: Katman yönetimi
- `RouteManager`: Rota çizimi ve mesafe hesaplama
- `TimelineManager`: Timeline event yerleştirme
- `DistanceMeasurement`: Mesafe ölçüm aracı
- `AreaMeasurement`: Alan ölçüm aracı
- `Toggle3DControl`: 3D görünüm kontrolü

### SidebarComponent

Veri yönetimi ve düzenleme arayüzü.

```javascript
import { SidebarComponent } from './components/sidebar/SidebarComponent.js';

const sidebar = new SidebarComponent('sidebar-container', {
    title: 'Hikâye Başlığı',
    desc: 'Açıklama',
    templateName: 'Nokta Eklenen',
    viewMode: false
});
```

**Alt Modüller:**
- `DetailPanel`: Nokta düzenleme formu
- `PointManager`: Nokta CRUD işlemleri
- `MediaManager`: Medya yükleme ve yönetimi
- `Lightbox`: Medya görüntüleyici

### ToolbarComponent

Çizim araçları ve aksiyonlar.

```javascript
import { ToolbarComponent } from './components/toolbar/ToolbarComponent.js';

const toolbar = new ToolbarComponent(viewMode);
toolbar.init(mapComponent, sidebarComponent, viewMode);
toolbar.show();
```

**Alt Modüller:**
- `ToolManager`: Çizim modu yönetimi
- `HistoryManager`: Undo/Redo stack yönetimi
- `SearchManager`: Konum arama
- `ActionManager`: Home, share, report işlemleri

### StorymapManager

Harita listeleme ve yönetim paneli.

```javascript
import { StorymapManager } from './components/StorymapManager.js';

const manager = new StorymapManager('storymap-manager-container');
await manager.init();
```

**Özellikler:**
- Backend + local haritaları listeler
- Source badge'leri (Backend / Lokal)
- Filtreleme (Tümü / Backend / Lokal)
- Migration UI (tekli veya toplu)
- Create / Open / Delete aksiyonları

---

## Servisler

### authManager

JWT token yönetimi ve oturum kontrolü.

```javascript
import { authManager } from './services/authManager.js';

// Token kaydet
authManager.saveAuth(token, userId);

// Token al
const token = authManager.getToken();

// Auth kontrolü
if (authManager.isAuthenticated()) {
    // Authenticated işlemler
}

// Çıkış
authManager.logout(); // Session temizle + landing'e yönlendir

// Korumalı sayfa kontrolü
authManager.requireAuth(); // Auth yoksa landing'e yönlendir
```

### apiService

Backend REST API wrapper.

```javascript
import { apiService } from './services/apiService.js';

// Storymap CRUD
const maps = await apiService.getAllStorymaps();
const map = await apiService.getStorymap(id);
const newId = await apiService.createStorymap(data);
await apiService.updateStorymap(id, data);
await apiService.deleteStorymap(id);

// Paylaşım
await apiService.shareStorymap(id);
await apiService.unshareStorymap(id);
const publicMap = await apiService.getStorymapByPublicKey(publicKey);

// Dosya yükleme
const filename = await apiService.uploadFile(file);
const cdnUrl = apiService.getCDNUrl(filename);
```

**API Endpoints:**

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/Login` | MEBBİS token ile giriş |
| GET | `/api/Storymap` | Tüm haritaları listele |
| GET | `/api/Storymap/{id}` | Tekil harita getir |
| POST | `/api/Storymap` | Yeni harita oluştur |
| PUT | `/api/Storymap/{id}` | Harita güncelle |
| DELETE | `/api/Storymap/{id}` | Harita sil |
| PATCH | `/api/Storymap/share/{id}` | Paylaşımı aç |
| PATCH | `/api/Storymap/unshare/{id}` | Paylaşımı kapat |
| GET | `/api/Storymap/public/{key}` | Public harita getir |
| POST | `/api/Dosya` | Dosya yükle |

---

## Veri Yönetimi

### storageManager

Dual-mode storage yöneticisi.

```javascript
import { storageManager } from './utils/storageManager.js';

// Mode kontrolü
const isBackend = storageManager.isBackendMode();

// Unified API (otomatik routing)
const saved = await storageManager.saveMap(data);
const map = await storageManager.getMap(id, source);
const maps = await storageManager.getAllMaps();
await storageManager.deleteMap(id, source);

// Migration
await storageManager.migrateMapToBackend(localId);

// Public cache
await storageManager.cachePublicStory(publicKey, data);
const cached = await storageManager.getCachedPublicStory(publicKey);
```

### Veri Formatı

```javascript
// Storymap veri yapısı
{
    id: 'guid-string',           // Backend GUID veya local timestamp
    title: 'Hikâye Başlığı',
    description: 'Açıklama',
    templateName: 'point',       // point, route, timeline, storymap
    mapData: {
        template: 'point',
        center: [35.0, 39.0],
        zoom: 6
    },
    points: [
        {
            id: 'point-1',
            title: 'Nokta Başlığı',
            description: 'Açıklama',
            coords: [lng, lat],
            color: '#ef4444',
            icon: 'fa-map-marker-alt',
            shape: 'circle',
            media: [{ type: 'image', url: '...' }],
            // Rota alanları
            visitDay: 1,
            duration: '2 saat',
            timestamp: '09:00',
            // Timeline alanları
            date: '2024-01-15',
            time: '14:30',
            category: 'Political',
            importance: 3,
            era: 'Modern'
        }
    ],
    steps: [],                   // StoryMap için
    isShared: false,
    publicKey: 'abc123',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
    source: 'backend'            // 'backend' veya 'indexeddb'
}
```

---

## Kullanıcı Akışları

### Authentication Flow

```
1. Kullanıcı landing.html'de "Öğretmen/Öğrenci Girişi" tıklar
         ↓
2. MEBBİS OAuth sayfasına yönlendirilir
   - Öğretmen: cbs/1
   - Öğrenci: cbs/0
         ↓
3. MEBBİS'te giriş yapar
         ↓
4. LoginRedirect.html'e token ile döner
   ?user={URL_ENCODED_MEBBIS_TOKEN}
         ↓
5. Token backend'e gönderilir (POST /api/Login)
         ↓
6. JWT token alınır ve sessionStorage'a kaydedilir
         ↓
7. app.html'e yönlendirilir
         ↓
8. StorymapManager gösterilir
```

### Harita Oluşturma Flow

```
1. StorymapManager'da "Yeni Harita Oluştur" tıklanır
         ↓
2. Şablon seçim modalı açılır
         ↓
3. Başlık, açıklama ve şablon seçilir
         ↓
4. "Devam Et" tıklanır
         ↓
5. MapComponent, SidebarComponent, ToolbarComponent başlatılır
         ↓
6. Kullanıcı noktalar/çizimler ekler
         ↓
7. "Kaydet" tıklanır
         ↓
8. Backend'e kaydedilir (authenticated) veya IndexedDB'ye (offline)
```

### Public Paylaşım Flow

```
1. Harita sahibi "Paylaş" butonuna tıklar
         ↓
2. Public key ile URL oluşturulur
   view.html?code={publicKey}
         ↓
3. URL kopyalanır veya sosyal medyada paylaşılır
         ↓
4. Alıcı URL'i açar
         ↓
5. view.html public key ile haritayı çeker
   GET /api/Storymap/public/{publicKey}
         ↓
6. Read-only modda harita görüntülenir
```

---

## API Referansı

Detaylı API referansı için: [API_REFERENCE.md](./API_REFERENCE.md)

---

## Stil Rehberi

### Renk Paleti

| Renk | Hex | Kullanım |
|------|-----|----------|
| Zümrüt | `#10b981` | Birincil vurgu |
| Zümrüt Koyu | `#059669` | Hover durumları |
| Kemik Beyazı | `#f5f5f0` | Arka plan |
| Koyu Gri | `#374151` | Metin |
| Açık Gri | `#e5e7eb` | Kenarlık |
| Kırmızı | `#ef4444` | Hata/Silme |
| Sarı | `#f59e0b` | Uyarı |
| Mavi | `#3b82f6` | Bilgi |

### BEM Metodolojisi

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

### Toast Bildirimleri

```javascript
import { toast } from './utils/toast.js';

// Tek mesaj kullanımı (önerilen)
toast.success('Haritanız başarıyla kaydedildi');
toast.error('Bir hata oluştu');
toast.warning('Dikkat!');
toast.info('Bilgi mesajı');
```

### Custom Confirm Dialog

```javascript
import { customConfirm } from './utils/customPrompt.js';

const confirmed = await customConfirm('Bu haritayı silmek istediğinizden emin misiniz?', {
    title: '',
    confirmText: 'Sil',
    cancelText: 'İptal',
    type: 'danger'  // 'danger', 'warning', 'info'
});

if (confirmed) {
    // Silme işlemi
}
```

---

## Sorun Giderme

Detaylı sorun giderme rehberi için: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Dokümantasyon Dosyaları

| Dosya | Açıklama | Durum |
|-------|----------|-------|
| [README.md](./README.md) | Genel bakış ve proje özeti | ✅ Güncel |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Mimari detaylar ve tasarım desenleri | ✅ Güncel |
| [API_REFERENCE.md](./API_REFERENCE.md) | Backend ve Frontend API referansı | ✅ Güncel |
| [CONFIGURATION.md](./CONFIGURATION.md) | Konfigürasyon ve ayarlar rehberi | ✅ Güncel |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Sorun giderme rehberi | ✅ Güncel |
| [AUTH_AND_LANDING_PRD.md](./AUTH_AND_LANDING_PRD.md) | Authentication PRD | ✅ Tamamlandı |
| [MEASUREMENT_PRD_mesafe_alan.md](./MEASUREMENT_PRD_mesafe_alan.md) | Ölçüm araçları PRD | ✅ Tamamlandı |
| [collaboration-feature-prd.md](./collaboration-feature-prd.md) | Ortak çalışma PRD | 🔄 Planlanmış |
| [backend_sorun_fix.md](./backend_sorun_fix.md) | Backend entegrasyon sorunları | ✅ Çözüldü |
| [REFERENCE.md](./REFERENCE.md) | Geliştirici referans tablosu (güncellenmiş) | ✅ Güncel |

---

**Son Güncelleme:** 27 Şubat 2026  
**Versiyon:** 2.1.0
