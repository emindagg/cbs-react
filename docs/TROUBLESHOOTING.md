# Sorun Giderme Rehberi

Bu dokümantasyon, AtlasCopy kullanırken karşılaşılabilecek yaygın sorunları ve çözüm yöntemlerini içerir.

## İçindekiler

- [FAB Kontrol Sorunları](#fab-kontrol-sorunları)
- [Timeline Sorunları](#timeline-sorunları)
- [Görselleştirme Sorunları](#görselleştirme-sorunları)
- [Harita Sorunları](#harita-sorunları)
- [Veri Import/Export Sorunları](#veri-importexport-sorunları)
- [Performans Sorunları](#performans-sorunları)
- [Debug Yöntemleri](#debug-yöntemleri)

---

## FAB Kontrol Sorunları

### FAB Butonları Çalışmıyor

**Semptomlar:**
- Checkbox'lar tıklanınca tepki vermiyor
- Radio butonlar değişmiyor
- Console'da hata yok

**Çözüm:**
```javascript
// Event listener'ların bağlandığını kontrol edin
// visualization-handlers.js dosyasında event listener'lar
// DOM'a HEMEN bağlanmalı (setTimeout yerine)

// Doğru:
document.getElementById('fab-checkbox').addEventListener('change', handler);

// Yanlış:
setTimeout(() => {
    document.getElementById('fab-checkbox').addEventListener('change', handler);
}, 100);
```

### "Sadece Veri" Modu Çalışmıyor

**Semptomlar:**
- Mod değiştirildiğinde harita değişmiyor
- Tüm iller hala görünüyor

**Çözüm:**
```javascript
// 1. currentVisualization'ın set edildiğini kontrol edin
console.log(window.visualizationManager.currentVisualization);

// 2. Görselleştirme SONRASINDA currentVisualization set edilmeli
// Sıralama: clearVisualization() → create...Map() → set currentVisualization

// 3. Bubble map için userData'nın mevcut olduğunu kontrol edin
console.log(window.visualizationManager.currentVisualization.userData);
```

### İl/İlçe İsimleri Görünmüyor

**Semptomlar:**
- Checkbox işaretli ama etiketler yok
- Console'da "source bulunamadı" hatası

**Çözüm:**
```javascript
// 1. Önce bir görselleştirme oluşturun
// 2. Source'un mevcut olduğunu kontrol edin
console.log(map.getSource('choropleth-source'));
console.log(map.getSource('bubble-boundary'));

// 3. Turf.js'in yüklendiğini kontrol edin
console.log(typeof turf);
```

### Değer Etiketleri Yanlış Formatta

**Çözüm:**
```javascript
// Sayı formatını değiştirin (FAB menüsünden)
// Otomatik: 1K, 1M
// Tam Sayı: 1.234.567
// Kompakt: 1,2Mn
```

---

## Timeline Sorunları

### "No cluster features to filter" Hatası

**Neden:** Timeline açıldığında cluster source boş olabilir (timing sorunu).

**Çözüm:**
```javascript
// Timeline otomatik olarak userMarkers'tan fallback cache oluşturur
// Eğer hala sorun varsa:

// 1. Veri import ettikten sonra biraz bekleyin
// 2. Haritada marker'ların görünür olduğunu kontrol edin
// 3. Console'da cache durumunu kontrol edin:
console.log(timelineManager.originalClusterData);
```

### "Cannot read properties of null (reading 'getTime')" Hatası

**Neden:** İlk time step'te previousDate null.

**Çözüm:**
```javascript
// Bu hata v2.0.0'da düzeltildi
// Eğer hala alıyorsanız, timeline.js'in güncel olduğunu kontrol edin

// Worker'da null check:
if (previousDateTs !== null) {
    previousDate = new Date(previousDateTs);
}
```

### "unknown feature value" Hatası

**Neden:** GeoJSON properties'de undefined değerler.

**Çözüm:**
```javascript
// Timeline otomatik olarak undefined değerleri temizler
// Manuel temizleme:
const cleanProps = {};
Object.keys(marker.properties).forEach(key => {
    const value = marker.properties[key];
    if (value !== undefined && typeof value !== 'function') {
        cleanProps[key] = value;
    }
});
```

### Timeline Açılmıyor

**Semptomlar:**
- "Zaman damgalı veri bulunamadı" mesajı
- Timeline hemen kapanıyor

**Çözüm:**
```javascript
// Verilerinizde tarih alanı olmalı:
// timestamp, time, Date, date, tarih

// Desteklenen formatlar:
// ISO: "2025-01-11T10:30:00Z"
// Türkçe: "11/01/2025 10:30:00"
// Timestamp: 1736589000000
```

### Label'lar Timeline'a Göre Filtrelenmiyor

**Çözüm:**
```javascript
// v2.0.0'da label senkronizasyonu eklendi
// _filterLabelSource() fonksiyonu her filtrelemede çağrılır

// Manuel kontrol:
console.log(map.getSource('province-labels-source'));
```

---

## Görselleştirme Sorunları

### Choropleth Harita Görünmüyor

**Çözümler:**

1. **Veri Eşleştirme:**
```javascript
// İl adları normalize edilmeli
// "ANKARA" → "ankara"
// "İSTANBUL" → "istanbul"

// Eşleşmeyen konumları kontrol edin:
// Console'da "⚠️ Haritada X konum bulunamadı" mesajına bakın
```

2. **GeoJSON Yüklenmesi:**
```javascript
// GeoJSON'ın yüklendiğini kontrol edin
console.log(visualizationManager.provincesGeoJSON);
console.log(visualizationManager.districtsGeoJSON);
```

### Bubble Map Sınırları Görünmüyor

**Çözüm:**
```javascript
// bubble-boundary source'unun mevcut olduğunu kontrol edin
console.log(map.getSource('bubble-boundary'));

// Level'ın doğru olduğunu kontrol edin
console.log(visualizationManager.currentVisualization.level);
```

### Renk Skalası Hatalı

**Çözüm:**
```javascript
// Breaks hesaplamasını kontrol edin
console.log(visualizationManager.currentVisualization.breaks);

// Tüm değerler aynıysa renk gradyanı oluşturulamaz
const values = data.map(d => d.value);
console.log('Min:', Math.min(...values), 'Max:', Math.max(...values));
```

---

## Harita Sorunları

### Harita Görünmüyor

**Çözümler:**

1. **WebGL Desteği:**
```javascript
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
    alert('WebGL desteklenmiyor');
}
```

2. **Container Boyutu:**
```css
#map {
    width: 100%;
    height: 100vh;
}
```

3. **MapLibre CSS:**
```html
<link href="https://unpkg.com/maplibre-gl/dist/maplibre-gl.css" rel="stylesheet" />
```

### Marker'lar Yanlış Yerde

**Çözüm:**
```javascript
// Koordinat sırası: [longitude, latitude]
// Doğru: [32.8597, 39.9334]
// Yanlış: [39.9334, 32.8597]
```

### Harita Donuyor

**Çözümler:**
```javascript
// 1. Clustering aktif edin (>500 nokta için)
spatialAnalysisManager.toggleClustering();

// 2. Geometri basitleştirme
const simplified = turf.simplify(polygon, { tolerance: 0.001 });
```

---

## Veri Import/Export Sorunları

### Excel Dosyası Yüklenmiyor

**Çözümler:**

1. **Dosya Formatı:**
```javascript
// Desteklenen: .xlsx, .xls
// Maksimum boyut: 50 MB
```

2. **SheetJS Yüklenmesi:**
```html
<script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
```

### Koordinatlar Hatalı

**Çözüm:**
```javascript
// Kolon eşleştirmesini kontrol edin
// lat, latitude, enlem, y
// lng, longitude, boylam, x

// Ondalık ayırıcı: nokta (.)
// "39.9334" ✓
// "39,9334" ✗
```

### CORS Hatası

**Çözüm:**
```javascript
// Yerel geliştirme için:
// 1. Proxy kullanın
// 2. CORS-anywhere gibi servisler
// 3. Sunucu tarafında CORS header ekleyin
```

---

## Performans Sorunları

### Yavaş Veri Yükleme

**Çözümler:**

1. **Batch Processing:**
```javascript
// Büyük veri setleri otomatik olarak batch'lenir
// Chunk size: 1000
```

2. **Web Worker:**
```javascript
// Timeline >1000 feature için otomatik Worker kullanır
console.log(timelineManager.workerEnabled);
```

### Memory Leak

**Çözümler:**

1. **Timeline Cleanup:**
```javascript
// Timeline kapatıldığında:
timelineManager.destroy();
```

2. **Event Listener Temizleme:**
```javascript
map.off('click', handler);
state.unsubscribe(subscriptionId);
```

---

## Debug Yöntemleri

### Console Logging

```javascript
// Safe logger kullanımı
const safeLog = (...args) => 
    window.Logger?.log ? window.Logger.log(...args) : console.log(...args);

// State kontrolü
console.log(window.visualizationManager.currentVisualization);
console.log(window.dataMapOnlyMode);
console.log(window.labelManager);
```

### Performance Profiling

```javascript
console.time('operation');
// ... işlem
console.timeEnd('operation');

// Timeline performans logları otomatik:
// ✅ Timeline: Filter complete - Total: 18.5ms
```

### Network Debugging

```javascript
// Fetch intercept
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('Fetch:', args[0]);
    return originalFetch.apply(this, args);
};
```

### State Debugging

```javascript
// State snapshot
const state = app.state.get('');
console.log(JSON.stringify(state, null, 2));

// State history
const history = app.state.getHistory();
console.log(history.slice(-5));
```

---

## Yardım Alma

Sorun hala çözülmediyse:

1. **GitHub Issues:** https://github.com/emindagg/atlascopy/issues

2. **Hata Raporu Şablonu:**
```markdown
**Sorun:** [Kısa açıklama]

**Adımlar:**
1. ...
2. ...

**Beklenen Davranış:** [Ne olmasını bekliyordunuz]

**Gerçek Davranış:** [Ne oldu]

**Ortam:**
- Tarayıcı: Chrome 120
- OS: Windows 11
- AtlasCopy: 1.2.0

**Console Hataları:**
```
[Hata mesajları]
```
```

---

**Son Güncelleme:** 11 Ocak 2026
**Versiyon:** 1.2.0
