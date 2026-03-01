# StoryMap - API Referans Dokümantasyonu

## 📋 İçindekiler

1. [Backend API](#backend-api)
2. [Frontend Servisleri](#frontend-servisleri)
3. [Bileşen API'leri](#bileşen-apileri)
4. [Utility Fonksiyonları](#utility-fonksiyonları)
5. [Event Sistemi](#event-sistemi)

---

## Backend API

### Base URL

```
Production: https://ogmmateryal.eba.gov.tr/cbs-backend/api
CDN: https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles
```

### Response Format

Tüm endpoint'ler aşağıdaki formatta yanıt döner:

```json
{
    "data": { ... },      // Asıl veri (object veya array)
    "errorMessage": null  // Hata varsa string
}
```

**Önemli:** Key isimleri küçük harf (`id`, `baslik`, `token` vb.)

---

### Authentication

#### POST /api/Login

MEBBİS token ile giriş yapar.

**Request:**
```json
{
    "token": "URL_ENCODED_MEBBIS_TOKEN"
}
```

**Response:**
```json
{
    "data": {
        "kullaniciid": "guid-string",
        "token": "jwt-bearer-token"
    },
    "errorMessage": null
}
```

**Kullanım:**
```javascript
const response = await apiService.login(mebbisToken);
const { kullaniciid, token } = response.data;
authManager.saveAuth(token, kullaniciid);
```

---

### Storymap CRUD

#### GET /api/Storymap

Kullanıcının tüm haritalarını listeler.

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
    "data": [
        {
            "id": "guid-string",
            "baslik": "Harita Başlığı",
            "aciklama": "Açıklama",
            "sablon": "point",
            "isshared": false,
            "publickey": "abc123"
        }
    ],
    "errorMessage": null
}
```

---

#### GET /api/Storymap/{id}

Tekil harita detayını getirir.

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
    "data": {
        "id": "guid-string",
        "baslik": "Harita Başlığı",
        "aciklama": "Açıklama",
        "sablon": "point",
        "jsondata": "{\"mapData\":{...},\"points\":[...]}",
        "isshared": false,
        "publickey": "abc123"
    },
    "errorMessage": null
}
```

**jsondata Yapısı:**
```json
{
    "mapData": {
        "template": "point",
        "center": [35.0, 39.0],
        "zoom": 6
    },
    "points": [
        {
            "id": "point-1",
            "title": "Nokta Başlığı",
            "description": "Açıklama",
            "coords": [35.0, 39.0],
            "color": "#ef4444",
            "icon": "fa-map-marker-alt",
            "media": []
        }
    ],
    "steps": []
}
```

---

#### POST /api/Storymap

Yeni harita oluşturur.

**Headers:**
```
Authorization: Bearer {jwt-token}
Content-Type: application/json
```

**Request:**
```json
{
    "Sablon": "point",
    "Baslik": "Harita Başlığı",
    "Aciklama": "Açıklama",
    "Jsondata": "{\"mapData\":{...},\"points\":[...]}"
}
```

**Response:**
```json
{
    "data": "new-guid-string",
    "errorMessage": null
}
```

---

#### PUT /api/Storymap/{id}

Mevcut haritayı günceller.

**Headers:**
```
Authorization: Bearer {jwt-token}
Content-Type: application/json
```

**Request:**
```json
{
    "Sablon": "point",
    "Baslik": "Güncel Başlık",
    "Aciklama": "Güncel Açıklama",
    "Jsondata": "{\"mapData\":{...},\"points\":[...]}"
}
```

**Response:**
```json
{
    "data": null,
    "errorMessage": null
}
```

---

#### DELETE /api/Storymap/{id}

Haritayı siler.

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
    "data": null,
    "errorMessage": null
}
```

---

### Paylaşım

#### PATCH /api/Storymap/share/{id}

Haritayı paylaşıma açar.

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
    "data": {
        "publickey": "generated-public-key"
    },
    "errorMessage": null
}
```

---

#### PATCH /api/Storymap/unshare/{id}

Harita paylaşımını kapatır.

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
    "data": null,
    "errorMessage": null
}
```

---

#### GET /api/Storymap/public/{publicKey}

Public key ile harita getirir (auth gerektirmez).

**Response:**
```json
{
    "data": {
        "id": "guid-string",
        "baslik": "Harita Başlığı",
        "aciklama": "Açıklama",
        "sablon": "point",
        "jsondata": "{...}"
    },
    "errorMessage": null
}
```

---

### Dosya Yükleme

#### POST /api/Dosya

Dosya yükler (multipart/form-data).

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Request:**
```
Content-Type: multipart/form-data
File: [binary data]
```

**Response:**
```
202601/abc123.jpg
```

**CDN URL Oluşturma:**
```javascript
const filename = await apiService.uploadFile(file);
const cdnUrl = apiService.getCDNUrl(filename);
// https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles/202601/abc123.jpg
```

---

## Frontend Servisleri

### authManager

JWT token yönetimi.

```javascript
import { authManager } from './services/authManager.js';
```

#### Metodlar

| Metod | Parametreler | Dönüş | Açıklama |
|-------|--------------|-------|----------|
| `saveAuth(token, userId)` | string, string | void | Token ve userId kaydet |
| `getToken()` | - | string\|null | Token al |
| `getUserId()` | - | string\|null | User ID al |
| `isAuthenticated()` | - | boolean | Auth durumu |
| `logout()` | - | void | Çıkış yap + yönlendir |
| `requireAuth()` | - | boolean | Auth kontrolü + yönlendir |
| `getMebbisLoginUrl(baseUrl, userType)` | string, number | string | MEBBİS URL oluştur |

---

### apiService

Backend API wrapper.

```javascript
import { apiService } from './services/apiService.js';
```

#### Metodlar

| Metod | Parametreler | Dönüş | Açıklama |
|-------|--------------|-------|----------|
| `login(mebbisToken)` | string | Promise<Object> | Giriş yap |
| `getAllStorymaps()` | - | Promise<Array> | Tüm haritalar |
| `getStorymap(id)` | string | Promise<Object> | Tekil harita |
| `createStorymap(data)` | Object | Promise<string> | Yeni harita |
| `updateStorymap(id, data)` | string, Object | Promise<void> | Güncelle |
| `deleteStorymap(id)` | string | Promise<void> | Sil |
| `shareStorymap(id)` | string | Promise<Object> | Paylaş |
| `unshareStorymap(id)` | string | Promise<void> | Paylaşımı kapat |
| `getStorymapByPublicKey(key)` | string | Promise<Object> | Public harita |
| `uploadFile(file)` | File | Promise<string> | Dosya yükle |
| `getCDNUrl(filename)` | string | string | CDN URL oluştur |
| `isOnline()` | - | boolean | Bağlantı durumu |

---

### storageManager

Dual-mode storage yöneticisi.

```javascript
import { storageManager } from './utils/storageManager.js';
```

#### Metodlar

| Metod | Parametreler | Dönüş | Açıklama |
|-------|--------------|-------|----------|
| `isBackendMode()` | - | boolean | Backend modu mu? |
| `saveMap(data)` | Object | Promise<Object> | Harita kaydet |
| `getMap(id, source?)` | string\|number, string? | Promise<Object\|null> | Harita getir |
| `getAllMaps()` | - | Promise<Array> | Tüm haritalar |
| `deleteMap(id, source)` | string\|number, string | Promise<boolean> | Harita sil |
| `migrateMapToBackend(localId)` | number | Promise<Object> | Migration |
| `cachePublicStory(key, data)` | string, Object | Promise<boolean> | Public cache |
| `getCachedPublicStory(key)` | string | Promise<Object\|null> | Cache getir |
| `saveSetting(key, value)` | string, any | Promise<boolean> | Ayar kaydet |
| `getSetting(key, default?)` | string, any? | Promise<any> | Ayar getir |

---

## Bileşen API'leri

### MapComponent

```javascript
import { MapComponent } from './components/map/MapComponent.js';

const map = new MapComponent('container-id', {
    center: [35.0, 39.0],
    zoom: 6,
    template: template,
    templateKey: 'point',
    viewMode: false
});
```

#### Metodlar

| Metod | Parametreler | Dönüş | Açıklama |
|-------|--------------|-------|----------|
| `onMapLoad(callback)` | Function | void | Harita yüklendiğinde |
| `flyTo(coords, zoom, options?)` | Array, number, Object? | void | Animasyonlu geçiş |
| `changeBasemap(basemapId)` | string | Promise<void> | Basemap değiştir |
| `addMarker(coords, options?)` | Array, Object? | Marker | Marker ekle |
| `addTextMarker(coords, text)` | Array, string | Marker | Text marker |
| `enableMarkerMode(callback)` | Function | void | Marker modu |
| `enableLineMode(callback)` | Function | void | Çizgi modu |
| `enablePolygonMode(callback)` | Function | void | Polygon modu |
| `enableCircleMode(callback)` | Function | void | Daire modu |
| `enableRectangleMode(callback)` | Function | void | Dikdörtgen modu |
| `enableTextMode(callback, onFinish)` | Function, Function | void | Text modu |
| `disableAllModes()` | - | void | Tüm modları kapat |
| `updateDrawingColor(layerId, color, type)` | string, string, string | boolean | Renk güncelle |
| `addRoutePoint(point)` | Object | Promise<Object> | Rota noktası |
| `connectAllRoutePoints(points)` | Array | Promise<Array> | Rotayı bağla |
| `getRouteTotalDistance()` | - | number | Toplam mesafe |
| `getRouteDisplacement()` | - | number | Yer değiştirme |
| `addTimelineEvent(event)` | Object | Object | Timeline event |
| `getTimelineStatistics()` | - | Object | İstatistikler |
| `startTimelinePlayback(speed, callback)` | number, Function | void | Playback başlat |
| `stopTimelinePlayback()` | - | void | Playback durdur |
| `activateDistanceMeasurement()` | - | void | Mesafe ölçümü |
| `activateAreaMeasurement()` | - | void | Alan ölçümü |
| `clearAllMeasurements()` | - | void | Ölçümleri temizle |
| `getData()` | - | Object | Harita verisi |
| `destroy()` | - | void | Temizle |

---

### SidebarComponent

```javascript
import { SidebarComponent } from './components/sidebar/SidebarComponent.js';

const sidebar = new SidebarComponent('container-id', {
    title: 'Başlık',
    desc: 'Açıklama',
    templateName: 'Nokta Eklenen',
    viewMode: false
});
```

#### Metodlar

| Metod | Parametreler | Dönüş | Açıklama |
|-------|--------------|-------|----------|
| `render()` | - | void | Yeniden render |
| `showPointDetail(pointId, callback?)` | string, Function? | void | Detay göster |
| `showListView()` | - | void | Liste görünümü |
| `toggle()` | - | void | Aç/Kapat |
| `addPoint(pointData)` | Object | Object | Nokta ekle |
| `addDrawing(drawingData)` | Object | Object | Çizim ekle |
| `removePoint(pointId)` | string | void | Nokta sil |
| `updatePointsList()` | - | void | Liste güncelle |
| `selectColor(color)` | string | void | Renk seç |
| `selectStyle(styleId)` | string | void | Stil seç |
| `savePointDetail()` | - | void | Detay kaydet |
| `deleteCurrentPoint()` | - | void | Mevcut noktayı sil |
| `handlePointAction(action, pointId)` | string, string | void | Aksiyon işle |
| `updateRouteData(routeData)` | Object | void | Rota verisi güncelle |
| `updateTimelineData(timelineData)` | Object | void | Timeline verisi güncelle |
| `updateSaveButtonText()` | - | void | Kaydet butonunu güncelle |
| `getNextNumber()` | - | number | Sonraki numara |

#### Callback'ler

```javascript
sidebar.onPointAdd = (point) => { };
sidebar.onPointFocus = (point) => { };
sidebar.onPointStyleUpdate = (point) => { };
sidebar.onSave = async () => { };
sidebar.onActionAdd = (action) => { };
sidebar.onDrawingDelete = (mapLayerId) => { };
sidebar.onRoutePointAdd = async (point) => { };
sidebar.onConnectAllPoints = async () => { };
sidebar.onGetRouteData = () => { };
sidebar.onTimelineEventAdd = (event) => { };
sidebar.onRefreshTimelineJS = () => { };
sidebar.onTimelinePlaybackStart = () => { };
sidebar.onTimelinePlaybackStop = () => { };
```

---

### ToolbarComponent

```javascript
import { ToolbarComponent } from './components/toolbar/ToolbarComponent.js';

const toolbar = new ToolbarComponent(viewMode);
toolbar.init(mapComponent, sidebarComponent, viewMode);
```

#### Metodlar

| Metod | Parametreler | Dönüş | Açıklama |
|-------|--------------|-------|----------|
| `init(map, sidebar, viewMode)` | MapComponent, SidebarComponent, boolean | void | Başlat |
| `show()` | - | void | Göster |
| `hide()` | - | void | Gizle |
| `addAction(action)` | Object | void | Undo stack'e ekle |
| `disableEditingTools()` | - | void | Düzenleme araçlarını kapat |

---

### StorymapManager

```javascript
import { StorymapManager } from './components/StorymapManager.js';

const manager = new StorymapManager('container-id');
await manager.init();
```

#### Metodlar

| Metod | Parametreler | Dönüş | Açıklama |
|-------|--------------|-------|----------|
| `init()` | - | Promise<void> | Başlat |
| `loadStorymaps()` | - | Promise<void> | Haritaları yükle |
| `render()` | - | void | Render |
| `applyFilter(filter)` | string | void | Filtre uygula |
| `migrateAllMaps()` | - | Promise<void> | Toplu migration |
| `migrateSingleMap(localId)` | number | Promise<void> | Tekli migration |
| `openStorymap(id, source)` | string\|number, string | void | Harita aç |
| `deleteStorymap(id, source)` | string\|number, string | Promise<void> | Harita sil |

---

## Utility Fonksiyonları

### toast

Bildirim sistemi.

```javascript
import { toast } from './utils/toast.js';

toast.success('Başarılı mesaj');
toast.error('Hata mesajı');
toast.warning('Uyarı mesajı');
toast.info('Bilgi mesajı');

// Detaylı kullanım
toast.show({
    title: 'Başlık',
    message: 'Mesaj',
    type: 'success',    // success, error, warning, info
    duration: 3000,     // ms
    closable: true
});
```

---

### customPrompt / customConfirm

Dialog kutuları.

```javascript
import { customPrompt, customConfirm } from './utils/customPrompt.js';

// Prompt
const value = await customPrompt('Mesaj', 'varsayılan değer');

// Confirm
const confirmed = await customConfirm('Emin misiniz?', {
    title: 'Başlık',
    confirmText: 'Evet',
    cancelText: 'İptal',
    type: 'danger'  // danger, warning, info
});
```

---

### migrationHelper

Local → Backend migration.

```javascript
import { migrationHelper } from './utils/migrationHelper.js';

// Kontrol
const hasLocal = await migrationHelper.hasLocalMaps();
const count = await migrationHelper.getLocalMapsCount();

// Migration
const results = await migrationHelper.migrateAllMaps((current, total, title) => {
    console.log(`${current}/${total}: ${title}`);
});
// results: { total, success, failed, errors }
```

---

## Event Sistemi

### Custom Events

```javascript
// Harita oluşturma
window.dispatchEvent(new CustomEvent('create-new-storymap'));

// Harita açma
window.dispatchEvent(new CustomEvent('open-storymap', {
    detail: { id, source }
}));

// StorymapManager'a dön
window.dispatchEvent(new CustomEvent('show-storymap-manager'));

// Ana sayfaya dön
window.dispatchEvent(new CustomEvent('navigate-home'));

// StoryMap çıkış
document.dispatchEvent(new CustomEvent('storymap:exit', {
    bubbles: true,
    detail: { data }
}));
```

### Event Listeners

```javascript
// main.js'de dinleme
window.addEventListener('create-new-storymap', () => {
    this.showTemplateSelection();
});

window.addEventListener('open-storymap', (e) => {
    this.openStorymap(e.detail.id, e.detail.source);
});

window.addEventListener('show-storymap-manager', () => {
    this.backToStorymapManager();
});
```

---

## Hata Kodları

### HTTP Status Codes

| Kod | Açıklama | İşlem |
|-----|----------|-------|
| 200 | Başarılı | - |
| 201 | Oluşturuldu | - |
| 400 | Bad Request | Hata mesajı göster |
| 401 | Unauthorized | Logout + landing'e yönlendir |
| 403 | Forbidden | Yetki hatası göster |
| 404 | Not Found | Kaynak bulunamadı |
| 500 | Server Error | Sunucu hatası göster |

### Error Handling

```javascript
// apiService.js
async _handleHTTPError(response) {
    const status = response.status;

    switch (status) {
        case 401:
            authManager.logout();
            throw new Error('Oturum süresi doldu');
        case 403:
            throw new Error('Yetkiniz bulunmuyor');
        case 404:
            throw new Error('Kaynak bulunamadı');
        case 500:
            throw new Error('Sunucu hatası');
        default:
            throw new Error(`Hata (${status})`);
    }
}
```

---

**Son Güncelleme:** 27 Şubat 2026  
**Versiyon:** 2.1.0
