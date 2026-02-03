# Geocoder Modülü

## Genel Bakış

Geocoder modülü, HGM (Harita Genel Müdürlüğü) Atlas API'sini kullanarak Türkiye genelinde yer arama ve lokasyon bulma işlevselliği sağlar.

## Dosya Yapısı

```
geocoder/
├── geocoder-manager.js      # Ana geocoder yönetim sınıfı
└── README.md               # Bu dosya
```

## Özellikler

### GeocoderManager Sınıfı

**Sorumluluklar:**
- HGM Atlas API ile iletişim
- Arama sonuçlarını işleme
- Sonuçları haritada görselleştirme
- Marker ve popup yönetimi
- Adres bilgilerini formatlama

**API Endpoint:**
```
https://atlas.harita.gov.tr/search_yeni
```

## Kullanım

### Temel Arama

```javascript
const geocoderManager = new GeocoderManager(map);

// Yer ara
geocoderManager.search(
    'Ankara',
    (results) => {
        console.log('Bulunan sonuçlar:', results);
        geocoderManager.displayResults(results);
    },
    (error) => {
        console.error('Hata:', error);
    }
);
```

### Sonuç Gösterimi

```javascript
// Tek bir sonuca odaklan
geocoderManager.focusOnResult(feature);

// Tüm sonuçları haritada göster
geocoderManager.displayResults(results);
```

### Reverse Geocoding

```javascript
// Koordinatlardan adres bilgisi al
geocoderManager.reverse(
    32.8597,  // lng
    39.9334,  // lat
    (response) => {
        console.log('Konum bilgisi:', response);
    },
    (error) => {
        console.error('Hata:', error);
    }
);
```

### Temizleme

```javascript
// Tüm arama sonuçlarını ve marker'ları temizle
geocoderManager.clearResults();
```

## Veri Formatı

### Arama Sonucu (GeoJSON)

```javascript
{
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [32.8597, 39.9334]
            },
            properties: {
                name: "Ankara",
                locality: "Çankaya",      // Mahalle/Semt
                county: "Çankaya",        // İlçe
                region: "Ankara",         // İl
                confidence: 1
            }
        }
    ]
}
```

## UI Entegrasyonu

### Konum ve Pozisyonlama

Arama çubuğu **sol üst köşede**, hamburger menüsünün **hemen sağında** konumlanır:

- **Sidebar kapalıyken**: Hamburger menünün yanında (9.6px + 40px + 8px = 57.6px)
- **Sidebar açıkken**: Sidebar + hamburger yanında (288px + 16px + 40px + 8px = 352px)
- **Dinamik hareket**: Sidebar açılıp kapandığında smooth transition ile birlikte hareket eder

Pozisyonlama `ui-panels-initialization.js` içindeki `positionControls()` fonksiyonu tarafından otomatik yönetilir.

### HTML Yapısı

```html
<!-- Arama Container (Dinamik pozisyonlu) -->
<div id="search-container" class="fixed top-3 transition-all duration-300">
    <!-- Büyüteç Toggle Butonu -->
    <button id="geocoder-toggle-btn" class="bg-blue-600 hover:bg-blue-700">
        <i class="fa-solid fa-magnifying-glass text-white"></i>
    </button>

    <!-- Arama Input Container -->
    <div id="geocoder-input-container">
        <input id="geocoder-search-input" placeholder="Haritada Ara" />
        <button id="geocoder-search-btn">🔍</button>
        <button id="geocoder-close-btn">✕</button>
    </div>

    <!-- Sonuç Dropdown -->
    <div id="geocoder-results-dropdown"></div>
</div>
```

### Event Handlers

Event handler'lar `event-handlers/geocoder-event-handlers.js` dosyasında yönetilir:

- `openSearchBox()` - Arama kutusunu açar
- `closeSearchBox()` - Arama kutusunu kapatır
- `performSearch()` - Arama işlemini başlatır
- `showResultsDropdown()` - Sonuçları dropdown'da gösterir
- `selectResult(index)` - Bir sonucu seçer ve haritada gösterir

## Özellikler ve İyileştirmeler

### Canlı Arama

```javascript
// 3+ karakter yazıldığında otomatik arama
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();

    if (query.length >= 3) {
        // 500ms debounce
        searchTimeout = setTimeout(() => {
            performSearch();
        }, 500);
    }
});
```

### Adres Formatlama

```javascript
formatAddress(properties) {
    const parts = [];

    if (properties.locality) parts.push(properties.locality);
    if (properties.county) parts.push(properties.county);
    if (properties.region) parts.push(properties.region);

    return parts.join(', ');
}
```

### XSS Koruması

```javascript
escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

## Marker Özelleştirme

### Özel Marker

```javascript
const el = document.createElement('div');
el.className = 'search-marker';
el.innerHTML = '<i class="fa-solid fa-location-dot" style="color: #ef4444; font-size: 32px;"></i>';

const marker = new maplibregl.Marker({
    element: el,
    anchor: 'bottom'
}).setLngLat(coordinates).addTo(map);
```

### Minimal Popup

```javascript
const popup = new maplibregl.Popup({
    offset: [0, -45],
    closeButton: false,
    closeOnClick: false,
    className: 'geocoder-marker-popup'
});
```

## CSS Sınıfları

```css
/* Toggle butonu */
#geocoder-toggle-btn { }

/* Arama container */
#geocoder-input-container { }

/* Sonuç dropdown */
#geocoder-results-dropdown { }

/* Sonuç öğesi */
.geocoder-result-item { }
.geocoder-result-icon { }
.geocoder-result-name { }
.geocoder-result-address { }

/* Marker */
.search-marker { }
.geocoder-marker-popup { }
```

## Animasyonlar

```css
/* Açılma animasyonu - Soldan genişleyerek açılır */
@keyframes expandFromLeft {
    from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Kapanma animasyonu - Sola doğru küçülerek kapanır */
@keyframes collapseToLeft {
    from {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    to {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
    }
}

/* Uygulama */
#geocoder-input-container {
    animation: expandFromLeft 0.25s ease-out;
    transform-origin: left top;
}

#geocoder-input-container.closing {
    animation: collapseToLeft 0.2s ease-in;
}
```

## Klavye Kısayolları

- **Enter** - Arama yap
- **ESC** - Dropdown kapat veya arama kutusunu kapat
- **3+ karakter** - Otomatik arama başlat

## Performans

- **Debounce:** 500ms gecikme ile aşırı API isteklerini önler
- **Lazy Loading:** Sonuçlar sadece gerektiğinde yüklenir
- **Efficient Rendering:** Virtual scrolling ile optimize edilmiş liste

## Güvenlik

- **XSS Koruması:** Tüm kullanıcı girdileri escape edilir
- **API Rate Limiting:** Debounce ile istek sınırlaması
- **Input Validation:** 3 karakter minimum gereksinimi

## Mobil Uyumluluk

```css
@media (max-width: 768px) {
    #search-container {
        left: 0.5rem !important;
        right: 0.5rem !important;
    }

    #geocoder-input-container {
        width: 100% !important;
    }
}
```

## API Referansı

### GeocoderManager

#### Constructor

```javascript
new GeocoderManager(map)
```

**Parametreler:**
- `map` (MapLibre Map) - MapLibre GL JS harita instance'ı

#### Methods

##### search(query, onSuccess, onError)

Yer arama yapar.

**Parametreler:**
- `query` (string) - Arama terimi (min 3 karakter)
- `onSuccess` (function) - Başarı callback'i
- `onError` (function) - Hata callback'i

##### displayResults(results)

Arama sonuçlarını haritada gösterir.

##### focusOnResult(feature)

Belirli bir sonuca odaklanır ve marker ekler.

##### renderResultsDropdown(results)

Sonuçları HTML olarak render eder.

##### formatAddress(properties)

Adres bilgilerini formatlar.

##### clearResults()

Tüm sonuçları ve marker'ları temizler.

##### reverse(lng, lat, onSuccess, onError)

Koordinatlardan yer bilgisi alır (reverse geocoding).

## Örnek Senaryolar

### Senaryo 1: Kullanıcı "Ankara" arıyor

1. Kullanıcı büyütece tıklar
2. Arama kutusu açılır
3. "Ank" yazar - henüz sonuç yok (< 3 karakter)
4. "Anka" yazar - 500ms sonra otomatik arama başlar
5. Dropdown açılır, sonuçlar listelenir
6. Kullanıcı "Ankara" sonucuna tıklar
7. Harita Ankara'ya zoom yapar
8. Marker ve popup gösterilir

### Senaryo 2: Mobil Kullanım

1. Mobil cihazda büyütece tıklanır
2. Tam genişlikte arama kutusu açılır
3. Touch-friendly sonuç listesi gösterilir
4. Sonuç seçilir, harita güncellenir

## Hata Yönetimi

```javascript
try {
    geocoderManager.search('test',
        (results) => { /* ... */ },
        (error) => {
            // Kullanıcıya hata mesajı göster
            showError(error);
        }
    );
} catch (error) {
    console.error('Beklenmeyen hata:', error);
}
```

## Test

```javascript
// Test için mock data
const mockResults = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [32.8597, 39.9334]
            },
            properties: {
                name: 'Test Konumu',
                region: 'Ankara'
            }
        }
    ]
};

geocoderManager.displayResults(mockResults);
```

## Gelecek İyileştirmeler

- [ ] Arama geçmişi (history)
- [ ] Favori konumlar
- [ ] Kategori filtreleme
- [ ] Gelişmiş sıralama seçenekleri
- [ ] Offline destek
- [ ] Multi-language desteği

## Bağımlılıklar

- **MapLibre GL JS** - Harita ve marker yönetimi
- **HGM Atlas Geocoder** - Geocoding API
- **Font Awesome** - İkonlar
- **Tailwind CSS** - Stil framework

## Lisans

ISC

## Katkıda Bulunanlar

- HGM Atlas API entegrasyonu
- UI/UX tasarımı
- Event handling sistemi
- Dokümantasyon

## İletişim

Sorularınız için: [GitHub Issues](https://github.com/emindagg/atlascopy/issues)
