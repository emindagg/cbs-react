# ⏱️ Timeline - Temporal Data Visualization

Zaman serisi coğrafi verilerini görselleştirmek için interaktif timeline scrubber.

## 📋 İçerik

- **`timeline.js`** - Ana Timeline manager sınıfı
- **`timeline-worker.js`** - Büyük veri setleri için Web Worker (background filtering)

## 🎯 Özellikler

### Temel Özellikler
- ✅ **Timeline Scrubber:** Zaman aralığı seçmek için interaktif slider
- ✅ **Zaman Filtresi:** Timestamp'e göre verileri göster/gizle
- ✅ **Otomatik Oynatma:** Zaman içinde otomatik animasyon
- ✅ **Hız Kontrolü:** Oynatma hızını ayarla (100ms - 2000ms)
- ✅ **Aralık Seçimi:** Saat, gün, hafta, ay, yıl
- ✅ **İki Filtreleme Modu:**
  - **Cumulative (Kümülatif):** Başlangıçtan seçili zamana kadar tüm veriler
  - **Interval (Aralık):** Sadece seçili zaman aralığındaki veriler

### Gelişmiş Özellikler
- ✅ **Property Filtresi:** Numerik özellik bazlı ek filtreleme (örn: magnitude, depth)
- ✅ **Web Worker Desteği:** 1000+ veri için otomatik background processing
- ✅ **Performance Optimizasyonları:**
  - Date parsing cache
  - RequestAnimationFrame kullanımı
  - Batch processing
  - Skip redundant filters
- ✅ **Label Senkronizasyonu:** Timeline filtreleme sırasında etiketler de otomatik filtreleniyor
- ✅ **Fallback Mekanizmaları:** Cluster source boşsa userMarkers'tan otomatik cache

### Desteklenen Zaman Formatları
- ISO 8601: `2024-01-15T12:00:00Z`
- Unix timestamp (milliseconds): `1705320000000`
- Türkçe format: `DD/MM/YYYY HH:mm:ss` veya `DD/MM/YYYY`
- Property isimleri: `timestamp`, `time`, `Date`, `date`, `tarih`

## 📦 Kullanım

### Otomatik Başlatma
Timeline, zaman damgalı veri import edildiğinde otomatik olarak kullanılabilir hale gelir:

```javascript
// Veri import et (GeoJSON, Excel, CSV)
// Eğer veri "timestamp", "time", "Date" gibi alanlar içeriyorsa
// Timeline butonu otomatik olarak gösterilir

// Manuel başlatma
window.timelineManager = new TimelineManager(map);
window.timelineManager.show();
```

### API Kullanımı

```javascript
// Timeline'ı göster
window.timelineManager.show();

// Timeline'ı gizle
window.timelineManager.hide();

// Oynat/Duraklat
window.timelineManager.togglePlay();

// Belirli bir index'e git
window.timelineManager.currentIndex = 5;
window.timelineManager.filterMapByTime();

// Filtreleme modunu değiştir
window.timelineManager.filterMode = 'interval'; // veya 'cumulative'

// Hızı değiştir
window.timelineManager.speed = 500; // milliseconds

// Aralığı değiştir
window.timelineManager.interval = 'week'; // 'hour', 'day', 'week', 'month', 'year'
window.timelineManager.regenerateTimeData();

// Temizle
window.timelineManager.reset();
```

## 🔧 Teknik Detaylar

### Veri Akışı

```
1. Data Import (GeoJSON/Excel/CSV)
   ↓
2. loadDataFromMap()
   - Cluster source'tan veri al
   - Fallback: userMarkers'tan GeoJSON cache oluştur
   ↓
3. generateTimeRange(data)
   - Min/max tarihleri tespit et
   - Seçili intervale göre time steps oluştur
   ↓
4. filterMapByTime() (her slider hareketi veya otomatik oynatma)
   ↓
5. _performFilter()
   ├─ _filterCatalogSources() → catalog-points, polygons, lines, geometries
   ├─ _filterClusterSource() → markers (cluster source)
   │  ├─ >1000 veri: Web Worker kullan (_filterClusterSourceWithWorker)
   │  └─ <1000 veri: Main thread (_filterClusterSourceMainThread)
   └─ _filterLabelSource() → user-data-labels (etiketler)
```

### Cache Mekanizması

Timeline, orijinal veriyi cache'ler ve filtreleme sırasında bu cache'i kullanır:

```javascript
// Catalog sources için
this.originalCatalogData = {
    'catalog-points': { type: 'FeatureCollection', features: [...] },
    'catalog-polygons': { type: 'FeatureCollection', features: [...] },
    // ...
}

// Cluster source için (iki yöntem)
// Yöntem 1: Cluster source'un _data'sından
this.originalClusterData = clusterSource._data

// Yöntem 2: FALLBACK - userMarkers'tan (cluster source boşsa)
this.originalClusterData = {
    type: 'FeatureCollection',
    features: userMarkers
        .filter(marker => marker.type === 'point' || !marker.type)
        .map(marker => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [marker.lon, marker.lat] },
            properties: {
                id: marker.id,
                timestamp: marker.timestamp,
                time: marker.properties?.time || marker.time,
                // ... tüm properties, undefined değerler filtrelenerek
            }
        }))
}
```

### GeoJSON Property Temizleme

Timeline userMarkers'tan GeoJSON oluştururken undefined ve geçersiz değerleri filtreler:

```javascript
// ❌ KABUL EDİLMEZ
- undefined
- function
- circular references

// ✅ KABUL EDİLİR
- null
- boolean
- number
- string
- array
- object
```

### Web Worker Kullanımı

Büyük veri setleri (>1000 features) için otomatik olarak Web Worker kullanılır:

```javascript
// Main thread → Worker
worker.postMessage({
    type: 'FILTER',
    data: {
        features: [...],
        currentDate: timestamp,
        previousDate: timestamp || null, // null kontrolü
        filterMode: 'cumulative',
        selectedProperty: 'magnitude',
        propertyMin: 2.0,
        propertyMax: 8.0
    }
})

// Worker → Main thread
{
    type: 'FILTER_RESULT',
    data: {
        filteredFeatures: [...],
        stats: {
            originalCount: 6107,
            filteredCount: 3421,
            dateFilterCount: 2686,
            propertyFilterCount: 0,
            filterTime: 15.2 // ms
        }
    }
}
```

## 🐛 Bilinen Sorunlar ve Çözümleri

### ✅ Çözüldü: "No cluster features to filter"
**Sorun:** Timeline açıldığında cluster source boş olabiliyordu (timing sorunu).

**Çözüm:** userMarkers'tan fallback GeoJSON cache oluşturma mekanizması eklendi.

### ✅ Çözüldü: "Cannot read properties of null (reading 'getTime')"
**Sorun:** İlk time step'te (index 0) previousDate null oluyordu.

**Çözüm:**
- Worker'a gönderirken: `previousDate ? previousDate.getTime() : null`
- Worker'da: `const previousDate = previousDateTs !== null ? new Date(previousDateTs) : null`
- Filter fonksiyonunda null check: `if (!previousDate) return featureDate <= currentDate`

### ✅ Çözüldü: "unknown feature value"
**Sorun:** GeoJSON properties'de undefined değerler MapLibre hatası veriyordu.

**Çözüm:** Properties temizleme mekanizması:
```javascript
Object.keys(marker.properties).forEach(key => {
    const value = marker.properties[key];
    if (value !== undefined && typeof value !== 'function') {
        cleanProps[key] = value;
    }
});
```

### ✅ Çözüldü: Label'lar timeline'a göre filtrelenmiyordu
**Sorun:** Timeline aktifken etiketler tüm veriler için görünüyordu.

**Çözüm:** `_filterLabelSource()` fonksiyonu eklendi, her filtreleme sırasında label source da güncelleniyor.

## 📊 Performans Metrikleri

Timeline, her filtreleme işleminin süresini loglar:

```
✅ Timeline: Filter complete - Total: 18.5ms
  - Catalog: 2.1ms
  - Cluster: 14.2ms
  - Labels: 2.2ms

📊 Cluster (Worker): 6107 → 3421 features (14.2ms)
  ⏱️ Filter: 12.1ms, SetData: 1.8ms, Transfer: 0.3ms
  🔍 Filtered out - Date: 2686, Property: 0
```

## 🔄 Use Cases

- **Deprem Verileri:** USGS earthquake data (magnitude, time)
- **Yangın Verileri:** Wildfire spread over time
- **İklim Verileri:** Sıcaklık, yağış değişimleri
- **Araç Takibi:** GPS track logs
- **Tarihi Veriler:** Şehir gelişimi, nüfus değişimi

## 🎨 UI Özellikleri

- **Sürüklenebilir Panel:** Interact.js ile drag-drop
- **Daraltılabilir:** Toggle button ile minimize/maximize
- **Responsive:** Mobil ve desktop uyumlu
- **Accessibility:** ARIA labels ve keyboard navigation

---

**Status:** ✅ Fully Implemented & Optimized
**Last Updated:** 2025-01-15
**Version:** 2.0.0 (with Web Worker, Label Sync, Fallback Mechanisms)
