# Değişiklik Günlüğü

Bu dosya, AtlasCopy projesinin tüm önemli değişikliklerini içerir.

Formatlama, [Keep a Changelog](https://keepachangelog.com/tr/1.0.0/) standardına uygundur ve bu proje [Semantic Versioning](https://semver.org/lang/tr/) kullanır.

## [Unreleased]

---

## [1.2.1] - 2026-01-11

### 📚 Dokümantasyon Güncellemesi

Tüm dokümantasyon dosyaları kapsamlı şekilde güncellendi:

- **ARCHITECTURE.md**: FAB kontrol sistemi, Timeline Web Worker mimarisi, Panel Mutex mekanizması eklendi
- **API_REFERENCE.md**: LabelManager API (changeMapMode, toggleProvinceLabels, toggleValueLabels), Timeline Web Worker API eklendi
- **MODELS.md**: FAB state modelleri, Timeline Web Worker message modelleri, currentVisualization state yapısı eklendi
- **CONFIGURATION.md**: FAB yapılandırması, Timeline yapılandırması, Web Worker ayarları eklendi
- **DATA.md**: Global mode flags, Timeline data akışı, veri sınırları güncellendi
- **ALGORITHMS.md**: Timeline filtreleme algoritmaları, Web Worker filtreleme, performans metrikleri eklendi
- **TROUBLESHOOTING.md**: FAB kontrol sorunları, Timeline sorunları, yeni hata çözümleri eklendi

Tüm dosyalar 11 Ocak 2026 tarihine ve v1.2.0 sürümüne güncellendi.

---

## [1.2.0] - 2026-01-11

### 🎛️ FAB Kontrolleri ve Görselleştirme İyileştirmeleri

#### Yeni Özellikler

##### ✅ Harita Görünüm Modları
**Özellik:** Tüm harita türleri için (Choropleth, Bubble, Dot-density) görünüm modu kontrolü.

**Implementasyon:**
- 🌍 **Tüm Harita Modu**: Tüm il/ilçe sınırları görünür (veri olsun olmasın)
- 🗺️ **Sadece Veri Modu**: Sadece verisi olan il/ilçe sınırlarını göster
- Choropleth: `fill-opacity` ve `line-opacity` ile `hasData` kontrolü
- Bubble: `bubble-source` ve `bubble-boundary` filtreleme
- Dot-density: Feature-level filtreleme
- Dosyalar: `labels-manager.js:535-680`

##### ✅ İl/İlçe İsimleri ve Değer Gösterimi
**Özellik:** Harita üzerinde konum isimleri ve sayısal değerleri gösterme/gizleme.

**Implementasyon:**
- Symbol layer kullanarak etiket oluşturma
- Turf.js centroid hesaplama
- Tekrarlı etiketleri önleme (Set kullanımı)
- Source-based etiket sistemi (choropleth-source, bubble-source, dot-density-boundary)
- Dosyalar: `labels-manager.js:21-530`

##### ✅ FAB Lejant ve Format Kontrolleri
**Özellik:** Lejant yerleşimi, etiket modu ve sayı formatı seçimi.

**Implementasyon:**
- Lejant yerleşimi: Dikey/Yatay
- Lejant etiket modu: Cetvel aralıkları / Etiketler
- Sayı formatı: Otomatik (1K, 1M) / Tam Sayı (1.234.567) / Kompakt (1,2Mn)
- Dosyalar: `visualization-handlers.js:640-688`

#### Kritik Hata Düzeltmeleri

##### ✅ FAB Event Listener Bağlanma Sorunu
**Sorun:** Event listener'lar bazen bağlanmıyordu (timing sorunu).

**Çözüm:**
- Event listener'ları HEMEN DOM'a bağlama (setTimeout yerine)
- Fonksiyon içinde labelManager/visualizationManager kontrolü
- Lazy initialization desteği
- Dosyalar: `visualization-handlers.js:601-728`

##### ✅ currentVisualization Sıfırlanma Sorunu
**Sorun:** `clearVisualization()` currentVisualization'ı sıfırlıyordu.

**Çözüm:**
- `currentVisualization` set etmeyi `create...Map` SONRASINA taşıdık
- Sıralama: clearVisualization() → create...Map() → set currentVisualization
- Tüm harita türleri için (choropleth, bubble, dot-density)
- Dosyalar: `visualization-manager.js:3091-3332`

##### ✅ Bubble Map Boundary Filtreleme
**Sorun:** "Sadece Veri" modunda bubble map il sınırları filtrelenmiyordu.

**Çözüm:**
- `userData` property'sini `currentVisualization`'a ekleme
- Boundary source'u verisi olan konumlara göre filtreleme
- `normalizeName()` ile il adı eşleştirme
- Dosyalar: `labels-manager.js:645-701`, `visualization-manager.js:3264-3285`

##### ✅ visualizationManager Global Reference
**Sorun:** `window.visualizationManager` global scope'ta erişilebilir değildi.

**Çözüm:**
- Her render fonksiyonunda global reference set etme
- App objesinden fallback alma
- Lazy initialization desteği
- Dosyalar: `visualization-manager.js:3091-3332`, `labels-manager.js:540-548`

#### UI/UX İyileştirmeleri
- ✨ FAB menüsü sürüklenebilir (drag & drop)
- ✨ Detaylı console log'ları ile debugging desteği
- ✨ Performans iyileştirmesi: Re-render yerine source güncelleme
- ✨ Dinamik boundary filtreleme (gerçek zamanlı)

---

## [2.0.0] - 2025-01-15

### 🎉 Major Update: Timeline & UI İyileştirmeleri

#### Timeline Kritik Hata Düzeltmeleri

##### ✅ "No cluster features to filter" Hatası
**Sorun:** Timeline açıldığında cluster source bazen boş olabiliyordu (timing sorunu).

**Çözüm:**
- userMarkers'tan fallback GeoJSON cache oluşturma mekanizması eklendi
- İki katmanlı cache sistemi: cluster source → userMarkers fallback
- `loadDataFromMap()` ve `_filterClusterSource()` fonksiyonlarında fallback implementasyonu
- Dosyalar: `timeline.js:369-413`, `timeline.js:930-974`

##### ✅ "Cannot read properties of null (reading 'getTime')" Hatası
**Sorun:** İlk time step'te (index 0) previousDate null oluyordu.

**Çözüm:**
- Worker'a gönderirken null check: `previousDate ? previousDate.getTime() : null`
- Worker'da null check: `previousDateTs !== null ? new Date(previousDateTs) : null`
- Filter fonksiyonlarında null handling: `if (!previousDate) return featureDate <= currentDate`
- Dosyalar: `timeline.js:988`, `timeline-worker.js:114`, `timeline-worker.js:81-84`, `timeline.js:759-761`

##### ✅ "unknown feature value" Hatası
**Sorun:** GeoJSON properties'de undefined değerler MapLibre hatası veriyordu.

**Çözüm:**
- GeoJSON oluştururken properties temizleme mekanizması eklendi
- undefined ve function değerleri filtreleme
- Sadece geçerli GeoJSON property tipleri (null, boolean, number, string, array, object)
- Dosyalar: `timeline.js:376-410`, `timeline.js:936-974`

#### Timeline Yeni Özellikler

##### ✅ Label Layer Senkronizasyonu
**Özellik:** Timeline aktifken etiketler de otomatik filtreleniyor.

**Implementasyon:**
- `_filterLabelSource()` fonksiyonu eklendi
- Her timeline filtreleme sırasında label source da güncelleniyor
- Timeline kapatıldığında label'lar restore ediliyor
- Dosyalar: `timeline.js:1098-1194`, `timeline.js:708-710`, `timeline.js:1426-1433`

**Özellikler:**
- Tarih bazlı filtreleme (cumulative ve interval modları)
- Property bazlı filtreleme (timeline'da seçili property varsa)
- Sadece point markerları işler
- Label field'ı marker.properties veya marker içinden bulur

#### UI Panel Hiyerarşisi (Mutex Mekanizması)

##### ✅ Panel Karşılıklı Hariç Tutma
**Özellik:** Veri Stili Paneli ve CBS Araçları Paneli aynı anda açık olamaz.

**Implementasyon:**

**1. CBS Araçları → Veri Stili Panelini Kapat**
- `openToolsPanel()` fonksiyonunda mutex check eklendi
- Veri Stili paneli açıksa otomatik kapanıyor
- Dosya: `ui-panels-initialization.js:124-127`

**2. Veri Stili → CBS Araçları Panelini Kapat**
- `showPanel()` fonksiyonunda mutex check eklendi
- CBS Araçları paneli açıksa otomatik kapanıyor
- Dosya: `layer-style-panel.js:341-347`

**3. Global Fonksiyon Export**
- `window.openToolsPanel` ve `window.closeToolsPanel` global yapıldı
- Cross-panel communication için
- Dosya: `ui-panels-initialization.js:153-154`

### 📚 Dokümantasyon Güncellemeleri

#### Timeline README
- Tamamen yeniden yazıldı
- Tüm yeni özellikler ve düzeltmeler eklendi
- Teknik detaylar ve veri akışı şemaları
- Bilinen sorunlar ve çözümleri bölümü
- Performans metrikleri
- Dosya: `assets/js/features/timeline/README.md`

#### Components README
- Panel Mutex Mekanizması bölümü eklendi
- Layer Style Panel detayları eklendi
- Timeline entegrasyonu dökümente edildi
- Yeni mutex ekleme rehberi
- Dosya: `assets/js/components/README.md`

### 🔧 Teknik İyileştirmeler

#### Timeline Performans
- Web Worker kullanımı optimize edildi (>1000 veri için otomatik)
- Date parsing cache mekanizması
- RequestAnimationFrame kullanımı
- Redundant filter skip mekanizması
- Batch processing

#### Kod Kalitesi
- Safe logger helpers kullanımı
- Defensive programming (null checks, undefined checks)
- GeoJSON spec compliance
- Clean code principles

### 📊 Performans Metrikleri

Timeline filtreleme performansı:
```
✅ Timeline: Filter complete - Total: 18.5ms
  - Catalog: 2.1ms
  - Cluster: 14.2ms
  - Labels: 2.2ms

📊 Cluster (Worker): 6107 → 3421 features (14.2ms)
  ⏱️ Filter: 12.1ms, SetData: 1.8ms, Transfer: 0.3ms
```

### 🐛 Düzeltilen Hatalar
- Timeline cluster source boş hatası
- Timeline previousDate null hatası
- GeoJSON undefined property hatası
- Label'ların timeline'a göre filtrelenmeme sorunu
- Panel çakışma sorunu (mutex ile çözüldü)

### ⚠️ Breaking Changes
Yok - Tüm değişiklikler geriye uyumlu.

---

## [1.1.0] - 2025-11-12

### Eklenenler

#### Yer Arama (Geocoder) Modülü
- HGM Atlas API entegrasyonu ile Türkiye genelinde yer arama özelliği eklendi
- Canlı arama (3+ karakter otomatik arama) desteği
- 500ms debounce ile optimize edilmiş arama
- Dropdown sonuç listesi ile kullanıcı dostu arayüz
- Tıklanabilir sonuçlar ve otomatik harita navigasyonu
- Modern, minimal UI tasarımı (mavi büyüteç butonu)
- Konum marker'ları ile görsel geri bildirim
- Popup içerikleri ile detaylı konum bilgisi
- ESC tuşu ile kapatma, otomatik focus
- Mobil responsive tasarım

#### Dosyalar
- `assets/js/geocoder/geocoder-manager.js` - Geocoder yöneticisi
- `assets/js/event-handlers/geocoder-event-handlers.js` - Arama event yöneticisi
- `assets/js/geocoder-latest.js` - HGM Atlas geocoder kütüphanesi
- CSS animasyonları ve stiller eklendi

#### Dokümantasyon
- README.md güncellendi - Geocoder özellikleri eklendi
- CHANGELOG.md güncellendi
- Kullanım örnekleri eklendi

### İyileştirmeler
- UI/UX geliştirmeleri (açılır/kapanır arama kutusu)
- Animasyonlar ve geçiş efektleri
- Arama sonuçlarının formatlanması
- XSS koruması (HTML escape)
- Marker görünümü optimize edildi

---

## [1.0.0] - 2025-11-07

### Eklenenler

#### Çift Tıklama Data Drawing
- Harita üzerinde çift tıklama ile veri çizimi eklendi
- Kullanıcı deneyimi iyileştirildi
- Commit: `4ced6ff`

#### Görselleştirme İyileştirmeleri
- Choropleth harita görselleştirmesi düzeltildi
- Renk skalası ve sınıflandırma iyileştirmeleri
- Lejant görünümü optimize edildi
- Commit: `9d6906c`, `f4fcaac`

#### Logger Düzeltmeleri
- Logger.log fonksiyon hatası giderildi
- Safe logger wrapper'lar eklendi
- Tüm modüller için logger güvenlik kontrolü
- Commit: `67e9076`

#### Timeline Özelliği
- Zamansal veri görselleştirme eklendi
- Kümülatif ve aralık modları
- Animasyon ve oynatma kontrolleri
- Property bazlı filtreleme
- Commit: `17fedd0`

---

## [0.9.0] - 2025-11-01

### Eklenenler

#### Test ve Coverage Sistemi
- Jest test framework entegrasyonu
- 171 test senaryosu (%100 başarı)
- Coverage raporlama sistemi
- Unit ve integration testleri
- CSV, GeoJSON, File Utils test coverage'ı artırıldı

#### Modüler Mimari Yeniden Yapılandırması
- Dependency Injection sistemi
- ApplicationCore - Merkezi orkestrasyon
- StateManager - Reaktif state yönetimi
- EventBus - Pub/sub event sistemi
- DependencyContainer - DI container
- ModuleRegistry - Modül yaşam döngüsü yönetimi
- LegacyAdapter - Geriye dönük uyumluluk

### Değiştirilenler
- Kod yapısı modüler hale getirildi
- Global değişkenler state management'a taşındı
- Event-driven architecture'a geçildi
- Backward compatibility korundu

---

## [0.8.0] - 2025-10-15

### Eklenenler

#### Astronomi Modülü
- Güneş pozisyonu gösterimi
- Ay evreleri görselleştirmesi
- Aydınlanma çizgisi (Terminator)
- Eksen eğikliği ve mevsimsel değişimler
- Güneş/ay tutulmaları
- Zaman animasyonu

#### Küre Görünümü
- MapLibre GL globe projection
- 3D dünya görünümü
- Astronomik görselleştirmelerle entegrasyon

### Geliştirmeler
- Performans optimizasyonları
- Canvas rendering iyileştirmeleri
- Memory kullanımı optimize edildi

---

## [0.7.0] - 2025-09-20

### Eklenenler

#### Gelişmiş Görselleştirme
- Choropleth harita desteği
- İl/ilçe bazlı tematik haritalar
- 4 farklı sınıflandırma metodu:
  - Quantile (Çeyreklik)
  - Equal Interval (Eşit Aralık)
  - Natural Breaks (Jenks)
  - Geometric Interval
- Dinamik renk şemaları
- İnteraktif lejant sistemi
- Lejant düzeni özelleştirmeleri (dikey/yatay)

#### Veri İçe/Dışa Aktarma
- Excel (.xlsx, .xls) import/export
- CSV import/export
- GeoJSON import/export
- KMZ import/export
- Shapefile (.shp) import
- Otomatik kolon eşleştirme
- Veri validasyonu

---

## [0.6.0] - 2025-08-10

### Eklenenler

#### Mekansal Analiz Araçları
- Buffer (Etki Alanı) analizi
- Convex Hull (Dış Sınır)
- Voronoi diyagramı
- En yakın iki nokta bulma
- Isı haritası (Heatmap)
  - Dinamik renk şemaları
  - Yarıçap, bulanıklık, yoğunluk ayarları
- Nokta kümeleme (Clustering)

#### Ölçüm Araçları
- Mesafe ölçümü (çoklu segment)
- Alan ölçümü
- Ölçüm sonuçlarını görüntüleme
- Ölçümleri temizleme

---

## [0.5.0] - 2025-07-01

### Eklenenler

#### Harita Özellikleri
- MapLibre GL JS entegrasyonu
- Çoklu altlık harita desteği:
  - OpenStreetMap
  - HGM Temel Harita
  - HGM Uydu Görüntüsü
  - HGM Gece Haritası
  - HGM Siyasi Harita
  - HGM Yükseklik Haritası
- Zoom kontrolleri
- Koordinat göstergesi
- Ölçek çubuğu
- Konum bulma (Geolocation)
- Kuzey oku göstergesi

#### Marker Sistemii
- Point (Nokta) ekleme
- Area (Alan/Poligon) çizimi
- Route (Rota/LineString) çizimi
- Circle (Daire) çizimi
- Marker renk özelleştirme
- Custom icon desteği
- Popup bilgi kutuları

---

## [0.4.0] - 2025-06-01

### Eklenenler

#### UI/UX İyileştirmeleri
- Tailwind CSS entegrasyonu
- Responsive tasarım
- Mobil uyumluluk
- Sidebar kontrol paneli
- Araç paneli (Tools panel)
- Altlık harita paneli
- Floating Action Button (FAB) label kontrolleri
- Harita başlığı (düzenlenebilir, sürüklenebilir)

#### Etiket Sistemi
- İl/ilçe etiketleri
- Değer etiketleri
- Harita modu seçimi (Tüm harita / Sadece veri)
- Sayı formatı özelleştirme (Otomatik, Tam, Kompakt)

---

## [0.3.0] - 2025-05-01

### Eklenenler

#### Veri Yönetimi
- DataManager sınıfı
- MarkerManager sınıfı
- Veri listeleme
- Veri filtreleme
- Veri arama
- Toplu veri işleme

#### Performans
- Canvas optimizasyonu
- Lazy loading
- Debounce/throttle utilities
- Memory leak önlemleri

---

## [0.2.0] - 2025-04-01

### Eklenenler

#### Temel Altyapı
- Logger sistemi
- Utility fonksiyonları
- Error handling
- Event handling sistemi
- State management (temel)

#### Türkiye Verileri
- 81 il koordinatları
- İl GeoJSON verileri
- İlçe GeoJSON verileri

---

## [0.1.0] - 2025-03-01

### Eklenenler

#### İlk Sürüm
- Proje başlatıldı
- Temel HTML/CSS/JS yapısı
- MapLibre GL JS entegrasyonu
- Temel harita gösterimi
- Basit marker ekleme
- README dosyası

---

## Sürüm Notları

### Versiyon Numaralandırma

AtlasCopy, [Semantic Versioning](https://semver.org/lang/tr/) kullanır:

- **MAJOR** (Ana): Breaking changes (API değişiklikleri)
- **MINOR** (Minör): Yeni özellikler (geriye dönük uyumlu)
- **PATCH** (Yama): Hata düzeltmeleri (geriye dönük uyumlu)

### Commit Mesaj Formatı

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type (Tip):**
- `feat`: Yeni özellik
- `fix`: Hata düzeltmesi
- `docs`: Dokümantasyon
- `style`: Kod formatı (logic değişikliği yok)
- `refactor`: Kod yeniden yapılandırma
- `perf`: Performans iyileştirmesi
- `test`: Test ekleme/düzeltme
- `chore`: Genel bakım

**Örnek:**
```
feat(visualization): Add choropleth classification methods

- Quantile classification
- Equal interval classification
- Jenks natural breaks
- Geometric interval

Closes #42
```

---

## Planlanan Özellikler

### Kısa Vadeli (1-3 Ay)

- [ ] 3D bina görselleştirme
- [ ] Raster veri desteği
- [ ] WMS/WMTS layer desteği
- [ ] Print/PDF export
- [ ] Proje kaydetme/yükleme

### Orta Vadeli (3-6 Ay)

- [ ] Çoklu kullanıcı desteği
- [ ] Cloud storage entegrasyonu
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Gelişmiş veri analizi

### Uzun Vadeli (6+ Ay)

- [ ] AI-powered spatial analysis
- [ ] Predictive analytics
- [ ] Big data support
- [ ] GraphQL API
- [ ] Micro-frontend architecture

---

## Bağımlılık Sürümleri

### Ana Bağımlılıklar

- MapLibre GL JS: ^5.10.0
- Turf.js: ^6.x
- SunCalc: ^1.9.0
- SheetJS: ^0.20.1
- Tailwind CSS: Latest (CDN)

### Geliştirme Bağımlılıkları

- Jest: ^29.7.0
- Babel: ^7.23.0
- Node.js: 14+
- NPM: 6+

---

## Teşekkürler

Katkıda bulunan tüm geliştiricilere ve açık kaynak topluluğuna teşekkürler.

---

**Proje Sahibi:** [GitHub](https://github.com/emindagg)
**Lisans:** ISC

---

[Unreleased]: https://github.com/emindagg/atlascopy/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/emindagg/atlascopy/releases/tag/v1.0.0
