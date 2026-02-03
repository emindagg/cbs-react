# AtlasCopy - Web Tabanlı Coğrafi Bilgi Sistemi

## Genel Bakış

AtlasCopy, MapLibre GL JS tabanlı, modern ve eğitim odaklı bir Web CBS (Coğrafi Bilgi Sistemi) platformudur. OGM (Orman Genel Müdürlüğü) için geliştirilmiş bu platform, harita görselleştirme, mekansal analiz, astronomi modülleri ve veri yönetimi yetenekleri sunar.

### Temel Özellikler

- **Yer Arama (Geocoder)**: HGM Atlas API entegrasyonu ile Türkiye genelinde yer arama
- **Harita Görselleştirme**: Choropleth, bubble ve dot density görselleştirmeleri
- **Mekansal Analiz**: Buffer, convex hull, voronoi, nearest facility, heatmap, clustering
- **Astronomi Modülü**: Güneş/ay pozisyonları, tutulmalar, mevsimsel değişimler
- **Timeline**: Zamansal veri görselleştirme ve animasyonu
- **Ölçüm Araçları**: Mesafe ve alan ölçümleri
- **Veri Yönetimi**: Excel, CSV, GeoJSON, KMZ, Shapefile import/export
- **Modüler Mimari**: Dependency Injection, State Management, Event-driven

## Hızlı Başlangıç

### Gereksinimler

- Modern web tarayıcı (Chrome, Firefox, Safari, Edge)
- Node.js 14+ (geliştirme için)
- NPM veya Yarn (geliştirme için)

### Kurulum

1. **Projeyi klonlayın:**
```bash
git clone https://github.com/emindagg/atlascopy.git
cd atlascopy
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Testleri çalıştırın:**
```bash
npm test
```

4. **Uygulamayı başlatın:**
```bash
# Basit HTTP sunucusu ile
python -m http.server 8000
# veya
npx serve
```

5. **Tarayıcıda açın:**
```
http://localhost:8000
```

## Proje Yapısı

```
atlascopy/
├── assets/
│   ├── css/                    # Stil dosyaları
│   └── js/
│       ├── core/               # Çekirdek sistemler (DI, State, Events)
│       ├── components/         # UI bileşenleri
│       ├── data/               # Veri yönetimi
│       ├── geocoder/           # Yer arama modülü (HGM Atlas API)
│       ├── features/           # Özellik modülleri
│       │   ├── astronomy/      # Astronomi modülü
│       │   ├── globe-view/     # Küre görünümü
│       │   └── timeline/       # Zaman çizelgesi
│       ├── import-export/      # Veri içe/dışa aktarma
│       ├── measurement/        # Ölçüm araçları
│       ├── spatial-analysis/   # Mekansal analiz
│       ├── visualization/      # Görselleştirme
│       ├── event-handlers/     # Event yöneticileri
│       ├── utils/              # Yardımcı fonksiyonlar
│       └── initialization/     # Başlatma modülleri
├── docs/                       # Dokümantasyon
├── tests/                      # Test dosyaları
├── coverage/                   # Test coverage raporları
├── index.html                  # Ana sayfa
└── package.json               # Proje yapılandırması
```

## Kullanım Örnekleri

### Yer Arama (Geocoder)

```javascript
// Programatik arama
const geocoderManager = new GeocoderManager(map);

geocoderManager.search(
    'Ankara',
    (results) => {
        // Arama başarılı
        console.log('Bulunan sonuçlar:', results.features.length);
        geocoderManager.displayResults(results);
    },
    (error) => {
        // Hata durumu
        console.error('Arama hatası:', error);
    }
);

// UI üzerinden arama
// Kullanıcı sol üstteki mavi büyüteç butonuna tıklar (hamburger menü yanında)
// Arama kutusunu açar ve "İstanbul" yazar
// Canlı arama otomatik olarak sonuçları gösterir
// Sidebar açılıp kapandığında arama çubuğu dinamik olarak hareket eder
```

**Özellikler:**
- 🔍 Canlı arama (3+ karakter otomatik arama)
- 🗺️ HGM Atlas API entegrasyonu
- 📍 Dropdown sonuç listesi
- 🎯 Tıklanabilir sonuçlar
- ⚡ 500ms debounce ile optimize edilmiş
- 🎨 Modern ve minimal UI
- 📍 Dinamik pozisyonlama (sidebar ile uyumlu hareket)

### Harita Üzerine Marker Ekleme

```javascript
// Marker ekle
const marker = {
    id: Date.now(),
    type: 'point',
    coordinates: [35.2433, 38.9637],
    name: 'Örnek Nokta',
    description: 'Test açıklaması'
};

window.markerManager.addMarkerToMap(marker);
```

### Choropleth Harita Oluşturma

```javascript
// İl bazlı görselleştirme
const visualizationManager = new VisualizationManager(map, dataManager);
await visualizationManager.visualizeChoropleth(data, {
    column: 'nufus',
    classificationMethod: 'quantile',
    classCount: 5
});

// Harita oluşturduktan sonra FAB (Floating Action Button) kontrollerini kullanın:
// 1. Sağ alttaki FAB butonuna tıklayın
// 2. "Tüm Harita" / "Sadece Veri" modu seçin
// 3. İl/İlçe İsimleri checkbox'ını aktif edin
// 4. Değerler checkbox'ını aktif edin
// 5. Lejant yerleşimini değiştirin (Dikey/Yatay)
```

### FAB Kontrolleri ile Görselleştirme Özelleştirme

```javascript
// Programatik olarak harita modunu değiştirme
window.labelManager.changeMapMode('data-only'); // Sadece verisi olanları göster
window.labelManager.changeMapMode('normal');    // Tüm haritayı göster

// İl/İlçe isimlerini göster/gizle
window.labelManager.toggleProvinceLabels(true);  // Göster
window.labelManager.toggleProvinceLabels(false); // Gizle

// Değerleri göster/gizle
window.labelManager.toggleValueLabels(true);     // Göster
window.labelManager.toggleValueLabels(false);    // Gizle
```

### Mekansal Analiz

```javascript
// Buffer analizi
const spatialAnalysis = window.spatialAnalysisManager;
spatialAnalysis.performBufferAnalysis(500); // 500 metre

// Heatmap oluşturma
spatialAnalysis.toggleHeatmap();
```

## Teknoloji Stack

### Frontend
- **MapLibre GL JS** 5.10.0 - Harita renderı
- **Turf.js** 6.x - Mekansal analiz
- **SunCalc** 1.9.0 - Astronomi hesaplamaları
- **SheetJS** 0.20.1 - Excel işlemleri
- **JSZip** 3.10.1 - KMZ desteği
- **Shapefile.js** 4.0.4 - SHP desteği
- **Tailwind CSS** - UI framework

### Development & Testing
- **Jest** 29.7.0 - Test framework
- **Babel** 7.23.0 - JavaScript transpiler
- **Coverage**: %1.44 (171 başarılı test)

## Mimari

AtlasCopy, modern yazılım tasarım prensiplerini takip eden modüler bir mimariye sahiptir:

### Çekirdek Sistemler

1. **ApplicationCore**: Merkezi orkestrasyon katmanı
2. **StateManager**: Reaktif state yönetimi (Observer pattern)
3. **EventBus**: Pub/sub event sistemi
4. **DependencyContainer**: Dependency injection container
5. **ModuleRegistry**: Modül yaşam döngüsü yönetimi
6. **LegacyAdapter**: Geriye dönük uyumluluk

### Veri Akışı

```
User Action → Module Method → State Update → UI Update
                            ↓
                     Event Emission → Event Handlers
```

Detaylı mimari bilgi için: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Test ve Kalite

### Test Coverage

- **Statements**: 1.44%
- **Branches**: 1.30%
- **Functions**: 1.88%
- **Lines**: 1.41%
- **Test Suites**: 8
- **Total Tests**: 171 ✅

### Test Çalıştırma

```bash
# Tüm testler
npm test

# Coverage raporu
npm run test:coverage

# Watch mode
npm run test:watch

# HTML raporu görüntüle
open coverage/lcov-report/index.html
```

## Dokümantasyon

- [README.md](./README.md) - Projenin genel tanıtımı (bu dosya)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Sistem mimarisi ve tasarım desenleri
- [API_REFERENCE.md](./API_REFERENCE.md) - API dokümantasyonu
- [MODELS.md](./MODELS.md) - Veri modelleri ve algoritmaları
- [DATA.md](./DATA.md) - Veri yapıları ve şemaları
- [ALGORITHMS.md](./ALGORITHMS.md) - Algoritmalar ve hesaplama yöntemleri
- [CONFIGURATION.md](./CONFIGURATION.md) - Yapılandırma rehberi
- [CHANGELOG.md](./CHANGELOG.md) - Sürüm geçmişi
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Sorun giderme rehberi

## Katkıda Bulunma

Projeye katkıda bulunmak için:

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Commit Convention

```
feat: Yeni özellik
fix: Hata düzeltmesi
docs: Dokümantasyon
style: Kod formatı
refactor: Kod yeniden yapılandırma
test: Test ekleme/düzeltme
chore: Genel bakım
```

## Lisans

Bu proje ISC lisansı altında lisanslanmıştır.

## İletişim

Proje Sahibi: [GitHub](https://github.com/emindagg)

## Teşekkürler

- MapLibre GL JS ekibi
- Turf.js topluluğu
- Açık kaynak topluluğu

---

**Son Güncelleme:** 11 Ocak 2026
**Versiyon:** 1.2.0
**Durum:** ✅ Aktif Geliştirme

### Yeni Özellikler (v1.2.0) - 11 Ocak 2026

#### 🎛️ FAB (Floating Action Button) Kontrolleri
- ✨ **Harita Görünüm Modları**: Tüm harita türleri için (Choropleth, Bubble, Dot-density)
  - 🌍 **Tüm Harita Modu**: Tüm il/ilçe sınırları görünür (veri olsun olmasın)
  - 🗺️ **Sadece Veri Modu**: Sadece verisi olan il/ilçe sınırları görünür
- 🏷️ **İl/İlçe İsimleri**: Harita üzerinde konum isimlerini gösterme/gizleme
- 📊 **Değer Gösterimi**: Harita üzerinde sayısal değerleri gösterme/gizleme
- 🎨 **Lejant Yerleşimi**: Dikey/Yatay lejant düzeni seçimi
- 📐 **Lejant Etiket Modu**: Cetvel aralıkları veya etiket gösterimi
- 🔢 **Sayı Formatı**: Otomatik (1K, 1M) / Tam Sayı (1.234.567) / Kompakt (1,2Mn)
- 🧭 **Yön Oku**: Harita üzerinde kuzey yön oku gösterimi
- 📝 **Harita Başlığı**: Düzenlenebilir ve sürüklenebilir başlık

#### 🐛 Kritik Hata Düzeltmeleri
- ✅ FAB buton event listener'larının bağlanmaması sorunu çözüldü
- ✅ `labelManager` lazy initialization eklendi
- ✅ `window.visualizationManager` global reference sorunu çözüldü
- ✅ `currentVisualization` parametrelerinin eksik olması düzeltildi
- ✅ `currentVisualization` sıfırlanma sorunu çözüldü (clearVisualization timing)
- ✅ Bubble map boundary filtreleme özelliği eklendi
- ✅ Choropleth/Bubble/Dot-density için "Sadece Veri" modu tam olarak çalışıyor

#### 🎨 UI/UX İyileştirmeleri
- ✨ FAB menüsü sürüklenebilir (drag & drop)
- ✨ Detaylı console log'ları ile debugging desteği
- ✨ Performans iyileştirmesi: Re-render yerine source güncelleme
- ✨ Dinamik boundary filtreleme (gerçek zamanlı)

### Önceki Özellikler (v1.1.0) - 12 Kasım 2025
- ✨ HGM Atlas API entegrasyonu ile yer arama (Geocoder)
- 🔍 Canlı arama ve otomatik tamamlama
- 📍 Dropdown sonuç listesi ile kolay navigasyon
- 🎨 Modern ve kullanıcı dostu arama UI
- 📐 Dinamik pozisyonlama: Sidebar ile uyumlu hareket
- 🐛 Bug fix: Veri görselleştirmede koordinat modalı hatası düzeltildi
