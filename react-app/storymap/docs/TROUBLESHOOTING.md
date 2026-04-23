# StoryMap - Sorun Giderme Rehberi

## 📋 İçindekiler

1. [Genel Sorunlar](#genel-sorunlar)
2. [Authentication Sorunları](#authentication-sorunları)
3. [Harita Sorunları](#harita-sorunları)
4. [Storage Sorunları](#storage-sorunları)
5. [API Sorunları](#api-sorunları)
6. [Performans Sorunları](#performans-sorunları)
7. [Tarayıcı Uyumluluk Sorunları](#tarayıcı-uyumluluk-sorunları)
8. [Hata Kodları](#hata-kodları)

---

## Genel Sorunlar

### Sayfa Yüklenmiyor / Beyaz Ekran

**Belirtiler:**
- Sayfa tamamen beyaz
- Console'da JavaScript hataları
- Bileşenler render edilmiyor

**Olası Nedenler ve Çözümler:**

1. **ES6 Module Hatası**
   ```
   Hata: Failed to load module script
   ```
   - Çözüm: Projeyi bir web server üzerinden çalıştırın (file:// protokolü çalışmaz)
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx http-server -p 8000
   ```

2. **CORS Hatası**
   ```
   Hata: Access to fetch blocked by CORS policy
   ```
   - Çözüm: Backend CORS ayarlarını kontrol edin
   - Development için browser CORS extension kullanabilirsiniz

3. **JavaScript Syntax Hatası**
   - Console'da hatayı bulun
   - İlgili dosyayı kontrol edin
   - Eksik parantez, virgül vb. kontrol edin

### Uygulama Donuyor / Yanıt Vermiyor

**Olası Nedenler:**

1. **Sonsuz Döngü**
   - Console'da stack overflow hatası kontrol edin
   - Event listener'larda döngü kontrolü yapın

2. **Büyük Veri İşleme**
   - IndexedDB'de çok büyük veri
   - Çözüm: Verileri parçalara bölün

3. **Memory Leak**
   - Event listener'lar temizlenmiyor
   - Çözüm: Component destroy metodlarını kontrol edin

---

## Authentication Sorunları

### MEBBİS Girişi Başarısız

**Belirtiler:**
- MEBBİS'ten döndükten sonra hata
- Token işlenemiyor
- Sürekli landing sayfasına yönlendirme

**Çözümler:**

1. **Token URL Encoding Sorunu**
   ```javascript
   // YANLIŞ - URLSearchParams decode eder
   const token = new URLSearchParams(search).get('user');
   
   // DOĞRU - Ham değeri al
   const match = window.location.search.match(/[?&]user=([^&]*)/);
   const token = match ? match[1] : null;
   ```

2. **Backend Response Format Hatası**
   ```javascript
   // Backend response: { data: { kullaniciid, token }, errorMessage }
   
   // YANLIŞ
   const token = response.token;
   
   // DOĞRU
   const token = response.data.token;
   ```

3. **Session Storage Dolu**
   - Browser'da sessionStorage'ı temizleyin
   - DevTools → Application → Session Storage → Clear

### Token Expired / 401 Unauthorized

**Belirtiler:**
- API istekleri 401 döndürüyor
- Otomatik logout oluyor

**Çözümler:**

1. **Token Kontrolü**
   ```javascript
   // Token var mı kontrol et
   const token = sessionStorage.getItem('storymap_auth_token');
   console.log('Token:', token ? 'Mevcut' : 'Yok');
   ```

2. **Yeniden Giriş**
   - Çıkış yapın ve tekrar giriş yapın
   - MEBBİS oturumunun açık olduğundan emin olun

3. **Backend Token Süresi**
   - Backend'de token expiry süresini kontrol edin
   - Varsayılan: 24 saat

### Yetkilendirme Hatası (403 Forbidden)

**Belirtiler:**
- API istekleri 403 döndürüyor
- "Yetkiniz bulunmuyor" mesajı

**Çözümler:**

1. **Kullanıcı Yetkisi**
   - Kullanıcının ilgili kaynağa erişim yetkisi var mı?
   - Başka kullanıcının haritasına erişmeye çalışıyor olabilir

2. **Backend Yetki Kontrolü**
   - Backend'de authorization logic'i kontrol edin

---

## Harita Sorunları

### Harita Yüklenmiyor

**Belirtiler:**
- Harita alanı boş veya gri
- MapLibre hataları console'da

**Çözümler:**

1. **WebGL Desteği**
   ```javascript
   // WebGL kontrolü
   const canvas = document.createElement('canvas');
   const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
   if (!gl) {
       console.error('WebGL desteklenmiyor');
   }
   ```
   - Çözüm: Tarayıcı ayarlarından hardware acceleration'ı açın

2. **Basemap URL Hatası**
   - Network tab'da tile isteklerini kontrol edin
   - 404 veya CORS hatası var mı?

3. **Container Boyutu**
   ```javascript
   // Container'ın boyutu olmalı
   const container = document.getElementById('map-container');
   console.log('Container size:', container.offsetWidth, container.offsetHeight);
   ```
   - Çözüm: CSS'de container'a width/height verin

### Marker'lar Görünmüyor

**Belirtiler:**
- Noktalar ekleniyor ama haritada görünmüyor
- Console'da hata yok

**Çözümler:**

1. **Koordinat Formatı**
   ```javascript
   // MapLibre [lng, lat] formatı kullanır
   // YANLIŞ
   marker.setLngLat([lat, lng]);
   
   // DOĞRU
   marker.setLngLat([lng, lat]);
   ```

2. **Z-Index Sorunu**
   - Marker'lar basemap altında kalıyor olabilir
   - CSS'de z-index kontrol edin

3. **Marker Element Hatası**
   ```javascript
   // Element oluşturulmuş mu?
   const el = marker.getElement();
   console.log('Marker element:', el);
   ```

### Rota Çizilmiyor (Route Template)

**Belirtiler:**
- Noktalar ekleniyor ama aralarında çizgi yok
- OSRM hataları

**Çözümler:**

1. **OSRM API Erişimi**
   ```javascript
   // OSRM API'yi test et
   fetch('https://router.project-osrm.org/route/v1/driving/35,39;36,40?overview=full&geometries=geojson')
       .then(r => r.json())
       .then(console.log)
       .catch(console.error);
   ```

2. **Koordinat Geçerliliği**
   - Koordinatlar geçerli aralıkta mı? (lat: -90 to 90, lng: -180 to 180)
   - Deniz üzerinde nokta var mı? (OSRM karayolu rotası çizer)

3. **Async/Await Kullanımı**
   ```javascript
   // YANLIŞ - await eksik
   this.routeManager.connectAllPoints(points);
   
   // DOĞRU
   await this.routeManager.connectAllPoints(points);
   ```

4. **Fallback Çizgi**
   - OSRM başarısız olursa düz çizgi çizilmeli
   - Console'da "using straight line" mesajı var mı?

### HGM Harita Katmanları Yüklenmiyor

**Belirtiler:**
- HGM basemap'leri çalışmıyor
- CORS hataları

**Çözümler:**

1. **Atlas Endpoint Kullanımı**
   ```javascript
   // YANLIŞ - CORS engelli
   const url = 'https://api.harita.gov.tr/arcgis/...';
   
   // DOĞRU - CORS uyumlu
   const url = 'https://atlas.harita.gov.tr/webservis/...';
   ```

2. **Network Kontrolü**
   - atlas.harita.gov.tr erişilebilir mi?
   - VPN/Proxy kullanıyorsanız kapatın

---

## Storage Sorunları

### IndexedDB Hatası

**Belirtiler:**
- Veriler kaydedilmiyor
- "QuotaExceededError" hatası
- IndexedDB açılamıyor

**Çözümler:**

1. **Quota Aşımı**
   ```javascript
   // Storage kullanımını kontrol et
   if (navigator.storage && navigator.storage.estimate) {
       const estimate = await navigator.storage.estimate();
       console.log('Kullanılan:', estimate.usage);
       console.log('Kota:', estimate.quota);
   }
   ```
   - Çözüm: Eski verileri silin veya medya boyutunu küçültün

2. **Private/Incognito Mode**
   - Gizli modda IndexedDB sınırlı
   - Normal modda deneyin

3. **Database Bozulması**
   ```javascript
   // Database'i sıfırla
   indexedDB.deleteDatabase('StoryMapDB');
   // Sayfayı yenileyin
   ```

### Veriler Kayboldu

**Belirtiler:**
- Daha önce kaydedilen haritalar görünmüyor
- Liste boş

**Çözümler:**

1. **Storage Mode Kontrolü**
   ```javascript
   // Backend mode mu, local mode mu?
   const isBackend = storageManager.isBackendMode();
   console.log('Storage mode:', isBackend ? 'Backend' : 'Local');
   ```

2. **Farklı Tarayıcı/Cihaz**
   - IndexedDB tarayıcıya özel
   - Backend'e kaydetmediyseniz başka cihazda görünmez

3. **Cache Temizleme**
   - Browser cache temizlendiyse IndexedDB de silinmiş olabilir

### Migration Başarısız

**Belirtiler:**
- Local → Backend yükleme çalışmıyor
- "Migration failed" hatası

**Çözümler:**

1. **Authentication Kontrolü**
   - Giriş yapmış olmalısınız
   - Token geçerli olmalı

2. **Veri Formatı**
   ```javascript
   // Veri formatını kontrol et
   const localMap = await storageManager.getMapFromIndexedDB(id);
   console.log('Local map:', localMap);
   ```

3. **Backend Bağlantısı**
   - API erişilebilir mi?
   - Network tab'da hataları kontrol edin

---

## API Sorunları

### API İstekleri Başarısız

**Belirtiler:**
- Network hatası
- Timeout
- 500 Internal Server Error

**Çözümler:**

1. **Network Kontrolü**
   ```javascript
   // API erişilebilir mi?
   fetch('https://ogmmateryal.eba.gov.tr/cbs-backend/api/Storymap')
       .then(r => console.log('Status:', r.status))
       .catch(e => console.error('Network error:', e));
   ```

2. **Request Format**
   ```javascript
   // Headers doğru mu?
   const headers = {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
   };
   ```

3. **Request Body**
   ```javascript
   // JSON formatı doğru mu?
   const body = JSON.stringify({
       Sablon: 'point',
       Baslik: 'Test',
       Aciklama: 'Test açıklama',
       Jsondata: JSON.stringify({ mapData: {}, points: [] })
   });
   ```

### Response Parse Hatası

**Belirtiler:**
- "Unexpected token" hatası
- JSON parse error

**Çözümler:**

1. **Response Format Kontrolü**
   ```javascript
   // Raw response'u kontrol et
   const response = await fetch(url);
   const text = await response.text();
   console.log('Raw response:', text);
   
   // Sonra parse et
   const json = JSON.parse(text);
   ```

2. **Backend Response Wrapper**
   ```javascript
   // Backend { data, errorMessage } döndürüyor
   const result = await response.json();
   const actualData = result.data;
   ```

### Dosya Yükleme Başarısız

**Belirtiler:**
- Medya yüklenmiyor
- CDN URL'i çalışmıyor

**Çözümler:**

1. **Dosya Boyutu**
   - Maksimum 30MB
   - Büyük dosyaları sıkıştırın

2. **Dosya Formatı**
   - Desteklenen: jpg, png, webp, gif, mp4, webm
   - Diğer formatlar reddedilir

3. **FormData Kullanımı**
   ```javascript
   const formData = new FormData();
   formData.append('file', file);
   
   // Content-Type header'ı EKLEME - browser otomatik ayarlar
   const response = await fetch(url, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token}` },
       body: formData
   });
   ```

---

## Performans Sorunları

### Yavaş Yükleme

**Belirtiler:**
- Sayfa yavaş açılıyor
- Harita geç yükleniyor

**Çözümler:**

1. **Network Analizi**
   - DevTools → Network → Waterfall analizi
   - Büyük dosyaları tespit edin

2. **Lazy Loading**
   ```javascript
   // Bileşenleri ihtiyaç halinde yükle
   if (isTimelineTemplate) {
       const { TimelineJSWrapper } = await import('./TimelineJSWrapper.js');
   }
   ```

3. **Medya Optimizasyonu**
   - Büyük resimleri sıkıştırın
   - WebP formatı kullanın

### Memory Leak

**Belirtiler:**
- Uzun kullanımda yavaşlama
- Browser memory kullanımı artıyor

**Çözümler:**

1. **Event Listener Temizleme**
   ```javascript
   // Component destroy'da listener'ları kaldır
   destroy() {
       this.map.off('click', this.handleClick);
       this.markers.forEach(m => m.remove());
       this.markers = [];
   }
   ```

2. **Memory Profiling**
   - DevTools → Memory → Heap snapshot
   - Detached DOM nodes kontrol edin

### Timeline Donması

**Belirtiler:**
- TimelineJS güncellemelerinde donma
- Çok sayıda event'te yavaşlama

**Çözümler:**

1. **Manuel Refresh**
   ```javascript
   // Auto-update kapalı, manuel refresh kullan
   this.sidebarComponent.onRefreshTimelineJS = () => {
       this.timelineJS.updateEvents(this.points);
   };
   ```

2. **Event Sayısı Limiti**
   - 100+ event performansı etkiler
   - Pagination veya filtering düşünün

---

## Tarayıcı Uyumluluk Sorunları

### Safari Sorunları

**Belirtiler:**
- Safari'de çalışmıyor
- IndexedDB hataları

**Çözümler:**

1. **Private Mode**
   - Safari private mode'da IndexedDB sınırlı
   - Normal modda deneyin

2. **ES6 Module Desteği**
   - Safari 14+ gerekli
   - Eski versiyonlar desteklenmiyor

### Mobile Sorunları

**Belirtiler:**
- Touch event'ler çalışmıyor
- Responsive sorunları

**Çözümler:**

1. **Viewport Meta**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```

2. **Touch Event Desteği**
   ```javascript
   // Touch ve mouse event'leri birlikte kullan
   element.addEventListener('touchstart', handler);
   element.addEventListener('mousedown', handler);
   ```

### Internet Explorer

**Durum:** Desteklenmiyor

- ES6 modules desteği yok
- MapLibre GL JS desteği yok
- Kullanıcıları modern tarayıcıya yönlendirin

---

## Hata Kodları

### HTTP Status Kodları

| Kod | Anlam | Çözüm |
|-----|-------|-------|
| 400 | Bad Request | Request body/params kontrol edin |
| 401 | Unauthorized | Yeniden giriş yapın |
| 403 | Forbidden | Yetki kontrolü yapın |
| 404 | Not Found | URL/ID doğru mu kontrol edin |
| 500 | Server Error | Backend loglarını kontrol edin |
| 502 | Bad Gateway | Backend çalışıyor mu kontrol edin |
| 503 | Service Unavailable | Sunucu bakımda olabilir |

### JavaScript Hata Mesajları

| Hata | Anlam | Çözüm |
|------|-------|-------|
| `TypeError: Cannot read property 'x' of undefined` | Null/undefined erişimi | Optional chaining kullanın (`?.`) |
| `SyntaxError: Unexpected token` | JSON parse hatası | Response formatını kontrol edin |
| `ReferenceError: x is not defined` | Tanımsız değişken | Import/export kontrol edin |
| `QuotaExceededError` | Storage dolu | Eski verileri silin |
| `NetworkError` | Ağ hatası | İnternet bağlantısını kontrol edin |

### MapLibre Hata Mesajları

| Hata | Anlam | Çözüm |
|------|-------|-------|
| `Style is not done loading` | Stil yüklenmedi | `map.on('load')` içinde çalıştırın |
| `Source "x" already exists` | Kaynak zaten var | Önce kaldırın veya kontrol edin |
| `Layer "x" does not exist` | Katman yok | Katman adını kontrol edin |
| `Invalid LngLat` | Geçersiz koordinat | Koordinat formatını kontrol edin |

---

## Debug Araçları

### Console Logging

```javascript
// Detaylı logging için
localStorage.setItem('storymap_debug', 'true');

// Logging helper
const debug = localStorage.getItem('storymap_debug') === 'true';
if (debug) {
    console.log('[StoryMap]', message, data);
}
```

### Network Monitoring

```javascript
// API isteklerini izle
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    console.log('[Fetch]', args[0]);
    const response = await originalFetch(...args);
    console.log('[Response]', response.status);
    return response;
};
```

### Storage Inspector

```javascript
// IndexedDB içeriğini görüntüle
async function inspectStorage() {
    const maps = await storageManager.getAllMaps();
    console.table(maps.map(m => ({
        id: m.id,
        title: m.title,
        source: m.source,
        pointCount: m.points?.length || 0
    })));
}
```

---

## Destek

### Log Toplama

Sorun bildirirken şunları ekleyin:

1. **Browser bilgisi**
   ```javascript
   console.log(navigator.userAgent);
   ```

2. **Console hataları**
   - Tüm console çıktısını kopyalayın

3. **Network hataları**
   - DevTools → Network → Failed requests

4. **Adımlar**
   - Sorunu tekrarlamak için adımlar

### İletişim

- GitHub Issues: Teknik sorunlar için
- Email: Genel sorular için

---

**Son Güncelleme:** 27 Şubat 2026  
**Versiyon:** 2.1.0
