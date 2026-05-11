# OGM Materyal CBS - Sistem Mimarisi

Bu doküman, OGM Materyal CBS uygulamasının güncel kod tabanına göre teknik mimarisini açıklar. İçerik `src/`, `package.json`, build konfigürasyonu, store katmanı, harita renderer'ları, analiz araçları ve mevcut feature public API yüzeyleri okunarak güncellenmiştir.

**Son Güncelleme:** 1 Mayıs 2026
**Kod Tabanı:** React 19 + TypeScript 5.9 + Vite 7 + MapLibre GL
**Feature Sayısı:** 21 gerçek feature dizini
**Kapsam:** `docs/ARCHITECTURE.md` için güncel mimari referans

---

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Kök Dizin ve Build Yapısı](#kök-dizin-ve-build-yapısı)
- [Runtime Akışı](#runtime-akışı)
- [Katmanlı Mimari](#katmanlı-mimari)
- [Feature Envanteri](#feature-envanteri)
- [Orkestrasyon Noktaları](#orkestrasyon-noktaları)
- [Harita Mimarisi](#harita-mimarisi)
- [State Yönetimi](#state-yönetimi)
- [Veri Yaşam Döngüsü](#veri-yaşam-döngüsü)
- [Görselleştirme Pipeline](#görselleştirme-pipeline)
- [Analiz Araçları](#analiz-araçları)
- [Lejant ve Harita Sunumu](#lejant-ve-harita-sunumu)
- [Performans Stratejisi](#performans-stratejisi)
- [Build, Dağıtım ve Statik İçerik](#build-dağıtım-ve-statik-içerik)
- [Import Sınırları ve Mimari Kurallar](#import-sınırları-ve-mimari-kurallar)
- [Doğrulama Rehberi](#doğrulama-rehberi)
- [Kısa Referans Haritası](#kısa-referans-haritası)

---

## Genel Bakış

OGM Materyal CBS, tarayıcıda çalışan feature-first bir CBS uygulamasıdır. Uygulama MapLibre GL üzerinde veri içe aktarma, veri düzenleme, harita çizimi, katman yönetimi, üç adımlı tematik görselleştirme, mekânsal analiz, arazi analizi, enterpolasyon, isochrone, yükselti profili, astronomi katmanları ve harita çıktısı alma iş akışlarını tek kabukta toplar.

Mimari yaklaşım:

1. **Feature-first organizasyon:** İş alanları `src/features/<feature>` altında gruplanır.
2. **Root orchestration:** Uygulama kabuğu `AppLayout` ile kurulur; feature'lar burada public API üzerinden compose edilir.
3. **Map-level orchestration:** Harita içi araç mount noktaları `MapContainer`, `DataLayer`, `GISToolsControl` ve ilgili kontrol bileşenlerinde toplanır.
4. **Shared facade:** Cross-feature tüketimde bazı yüzeyler `src/shared/visualization` ve `src/shared/legend` üzerinden stabilize edilir.
5. **Zustand store katmanı:** Global ve store-first feature durumları `src/stores` içinde tutulur; bazı feature store dosyaları sadece re-export köprüsüdür.
6. **MapLibre data-driven rendering:** Tematik haritalar, analiz katmanları ve çizim araçları MapLibre source/layer modeliyle çizilir.
7. **Ağır hesaplamayı sınırlama:** Enterpolasyon worker kullanır; style değişimleri mümkün olduğunda `setPaintProperty` ile yapılır.

Bu repo tamamen katı bir "feature yalnız kendi içine bakar" yapısında değildir. `AppLayout`, `Sidebar`, `MapContainer`, `DataLayer` ve `GISToolsControl` bilinçli orkestrasyon istisnalarıdır.

---

## Teknoloji Yığını

| Alan | Güncel teknoloji |
|------|------------------|
| UI | React 19.2, React DOM 19.2 |
| Dil | TypeScript 5.9, strict mode |
| Build | Vite 7.3, `@vitejs/plugin-react` |
| Harita | MapLibre GL 5.23, `react-map-gl` 8.1 |
| State | Zustand 5 |
| Stil | Tailwind CSS 4, PostCSS, global `src/index.css` |
| Veri grid | AG Grid 35 |
| Mekânsal işlemler | Turf.js 7, `polylabel`, `topojson-client`, `proj4` |
| Dosya işleme | `xlsx`, `papaparse`, `shpjs`, `fflate`, KML/GeoJSON yardımcıları |
| Renk ve istatistik | `chroma-js`, `d3-*`, `simple-statistics` |
| Export | `@zumer/snapdom`, `html-to-image`, `jspdf`, `@mapbox/shp-write` |
| Test | Vitest 3, Testing Library, jsdom |
| UI yardımcıları | lucide-react, framer-motion, rc-slider, react-hot-toast |

---

## Kök Dizin ve Build Yapısı

Güncel kök yapı:

```text
react-app/
├── index.html                 # Vite giriş HTML'i, lang="tr", UTF-8
├── mebi-index.html            # Önceden üretilmiş MEBİ odaklı HTML örneği
├── package.json               # npm script'leri ve bağımlılıklar
├── vite.config.ts             # Vite base, özel static plugin'ler, manualChunks
├── vitest.config.ts           # Test konfigürasyonu
├── eslint.config.js           # Import sınırları ve kalite kuralları
├── tsconfig*.json             # TS strict ve alias konfigürasyonu
├── public/                    # geocoder.js, ikonlar, logo
├── storymap/                  # iframe ile gösterilen bağımsız storymap uygulaması
├── video-modal/               # iframe ile gösterilen eğitim videoları uygulaması
├── src/                       # Ana React uygulaması
├── docs/                      # Proje dokümantasyonu
└── tasks/                     # Görev planları ve geçmiş notlar
```

`vite.config.ts` içinde üç önemli build davranışı vardır:

- `base: '/cbs-react/'` varsayılan yayın yoludur.
- `storymap/` ve `video-modal/` klasörleri dev server'da servis edilir, build sonunda `dist/storymap` ve `dist/video-modal` altına kopyalanır.
- Vendor ve bazı feature bundle'ları `manualChunks` ile ayrılır: `react-vendor`, `map-vendor`, `map-react-vendor`, `aggrid-vendor`, `data-vendor`, `ui-vendor`, `utils-vendor`, ayrıca `astronomy`, `viz-wizard`, `data-management`.

Ana script'ler:

```bash
npm run dev
npm run build
npm run build:mebi
npm run lint
npm run lint:strict
npm run test:run
```

`build:mebi`, `pnpm exec tsc -b && pnpm exec vite build --base=./` çalıştırır ve alt klasör yayını için göreli asset yolları üretir.

---

## Runtime Akışı

Gerçek boot sırası:

```text
index.html
  -> src/main.tsx
       -> React StrictMode
       -> App
            -> useGoogleAnalytics()
            -> MapProvider (react-map-gl/maplibre)
            -> AppLayout
            -> Toaster
```

`src/main.tsx` render öncesinde MapLibre'den gelen büyük mesh vertex uyarısını console seviyesinde filtreler. Güncel dosyada geliştirme modunda localStorage/sessionStorage/IndexedDB temizleyen bir boot adımı yoktur.

`src/App.tsx`, uygulama kabuğunu `MapProvider` içine alır. Bu provider, harita bileşenlerinin `react-map-gl` context'inden map instance alabilmesini sağlar.

`src/components/layout/AppLayout.tsx`, uygulamanın ana yerleşimini ve feature mount sırasını belirler. Sidebar, harita, arama, overlay layer paneli, astronomi paneli, tematik harita başlığı, analiz panelleri, lejant, koordinat göstergesi, storymap modalı ve video modalı burada bağlanır.

---

## Katmanlı Mimari

```text
Entry
  index.html -> main.tsx -> App.tsx

Root orchestration
  AppLayout.tsx
  Sidebar.tsx

Map orchestration
  MapContainer.tsx
  DataLayer.tsx
  GISToolsControl.tsx
  TimelineControl.tsx

Feature layer
  src/features/<feature>/

Shared facade ve ortak altyapı
  src/shared/
  src/components/ui/
  src/hooks/
  src/utils/
  src/types/
  src/constants/
  src/stores/

External libraries
  MapLibre GL, Turf.js, AG Grid, xlsx, shpjs, chroma-js, simple-statistics
```

Katmanların pratik sorumlulukları:

| Katman | Sorumluluk |
|--------|------------|
| Entry | React root, global CSS, provider kurulumu |
| Root orchestration | Feature panellerini ve uygulama layout'unu birleştirme |
| Map orchestration | MapLibre component ağacı, harita içi tool mount noktaları |
| Feature | Domain UI, hook, renderer, servis ve tipleri |
| Shared | Cross-feature facade, ortak UI, utility, tip ve sabitler |
| Store | Uygulama ve feature durumlarının Zustand yüzeyleri |

---

## Feature Envanteri

`src/features` altında güncel olarak 21 feature vardır:

| Feature | Path | Public API özeti | Runtime rolü |
|---------|------|------------------|--------------|
| Astronomy | `src/features/astronomy` | `AstroPanel`, `useAstroMap`, `useAstroStore`, astro utils | Güneş, Ay, terminator, eksen ve tutulma katmanları |
| Basemap | `src/features/basemap` | `BasemapSwitcher` | Altlık seçim UI'ı |
| Clustering | `src/features/clustering` | `useClusteringStore`, `useClustering` | Nokta verisi için `normal / clustered / hidden` modları |
| Data Management | `src/features/data-management` | Veri oluşturma, içe aktarma, export, katalog, store facade | Kanonik veri yaşam döngüsü |
| Data Mapper | `src/features/data-mapper` | `DataMapper`, `DataEditor`, `DataMapperModal` | AG Grid tabanlı eşleme ve düzenleme modalı |
| Elevation Profile | `src/features/elevation-profile` | `ElevationProfileTool`, `ElevationProfilePanel`, hook/store | Çizgi/rota üzerinden yükselti profili |
| Geocoder | `src/features/geocoder` | `SearchContainer`, `useGeocoder` | HGM Atlas geocoder araması |
| Globe View | `src/features/globe-view` | `useGlobeView`, `GlobeToggleButton` | Mercator/globe projeksiyon geçişi |
| Heatmap | `src/features/heatmap` | Panel, hook, store, renderer | Yoğunluk ısı haritası |
| Interpolation | `src/features/interpolation` | Panel, legend, hook, store, renderer | IDW/Kriging enterpolasyon |
| Isochrone | `src/features/isochrone` | Panel, hook, store, renderer servisleri | Erişilebilirlik ve rota analizi |
| Layers | `src/features/layers` | `LayersPanel`, `LandCoverLegend`, `useOverlayLayers` | Hazır overlay katman kataloğu |
| Legend | `src/features/legend` | `LegendContainer`, dynamic/color/bubble/dot legend | Görselleştirme lejantı |
| Map | `src/features/map` | `MapContainer`, controls, `DataLayer`, `DistanceTool` | Çekirdek harita kabuğu |
| Spatial Analysis | `src/features/spatial-analysis` | Panel, hook, store, renderer'lar | Convex hull, Voronoi, en yakın nokta |
| Storymap Modal | `src/features/storymap-modal` | `StorymapModal` | `storymap/index.html` iframe modalı |
| Terrain Analysis | `src/features/terrain-analysis` | Panel, tool, legend, hook, store | Terrarium DEM ile bakı/eğim analizi |
| Timeline | `src/features/timeline` | `useTimelineStore`, `STEP_MS`, tipler | Zaman ve sayısal filtre state'i |
| Video Modal | `src/features/video-modal` | `VideoModal` | `video-modal/index.html` iframe modalı |
| Visualization | `src/features/visualization` | Renderer'lar, tooltip hook'ları, `VisualizationManager` | Choropleth, bubble, dot-density render |
| Viz Wizard | `src/features/viz-wizard` | Step 1/2/3, sidebar, map title | Veri görselleştirme sihirbazı |

Not: Dosya ve URL içe aktarma akışı ayrı bir feature dizini yerine `data-management` feature'ı içindedir.

---

## Orkestrasyon Noktaları

### `AppLayout`

`AppLayout` şu hook'ları ve panelleri bağlar:

- `useVisualizationLayerPersistence`
- `useOverlayLayers`
- `useAstroMap`
- `useClustering`
- `useLayerStyleSync`
- `useHeatmap`
- `useSpatialAnalysis`
- `useInterpolation`
- `useIsochrone`
- `useElevationProfile`
- `useTerrainAnalysis`

Mount edilen ana UI:

```text
Sidebar
MapContainer
MapControlStack
SearchContainer
LayersPanel
LandCoverLegend
AstroPanel
MapTitle
HeatmapPanel
SpatialAnalysisPanel
InterpolationPanel
InterpolationLegend
IsochronePanel
ElevationProfilePanel
TerrainAnalysisPanel
TerrainSlopeLegend
TerrainAspectLegend
LegendContainer
ImportedDataManagerFab
CoordinateDisplay
StorymapModal
VideoModal
```

### `Sidebar`

Sidebar dört ana iş akışını içerir:

```text
SidebarHeader
SidebarProjectPurpose
SidebarTools
VizWizardSidebar
DataManagementSection
ProjectExportSection
DataImportSection
SidebarFooter
```

`VizWizardSidebar`, `DataMapperModal` bileşenini dependency injection ile alır. Bu sayede wizard, data-mapper feature'ına doğrudan iç dosya import etmeden modalı kullanır.

### `MapContainer`

`MapContainer` MapLibre sahnesini kurar:

- Raster basemap source/layer
- `DistanceTool`
- `ElevationProfileTool`
- `TerrainAnalysisTool`
- `DataManagementDrawTool`
- `DataLayer`
- `GISToolsControl`
- `TimelineControl`
- `FeaturePopup`
- `DraggableScaleControl`
- `DraggableNorthArrow`
- `MapCompass`
- `AttributionInfoButton`

Bu dosya map-level orchestrator kabul edilir. ESLint istisnelerinde de root/map orchestrator olarak ayrı ele alınır.

---

## Harita Mimarisi

### MapLibre ve Provider

Harita `react-map-gl/maplibre` üzerinden çalışır. `App.tsx` içindeki `MapProvider`, alt bileşenlere map context sağlar. Kanonik map instance `src/stores/useMapStore.ts` içindeki `mapInstance` alanında tutulur.

Varsayılan konum Türkiye merkezidir:

```text
longitude: 35.2433
latitude: 38.9637
zoom: 6
```

### Altlık Haritalar

`useMapStore.BasemapType` şu değerleri destekler:

```text
TEMEL
UYDU
GECE
SIYASI
YUKSEKLIK
NONE
CARTO_LIGHT
CARTO_DARK
CARTO_VOYAGER
ESRI_SATELLITE
```

`BasemapSwitcher` UI'ında görünen seçenekler daha dardır:

```text
CARTO_LIGHT
ESRI_SATELLITE
TEMEL
UYDU
GECE
SIYASI
YUKSEKLIK
NONE
```

Prod ortamda varsayılan altlık `TEMEL`, geliştirme ortamında `CARTO_LIGHT` olarak ayarlanır.

### Layer Sırası

Pratik layer sırası:

```text
background veya minimal style
basemap-source / basemap-layer
overlay layer'lar
data-management layer'ları
visualization layer'ları
analysis layer'ları
label layer'ları
marker ve DOM overlay'leri
```

`MapContainer`, `basemap-layer`'ı style değişimlerinden sonra stack'in altında tutar. `useOverlayLayers` aktif overlay katmanlarını style reload sonrasında yeniden ekler ve üste taşır. `useVisualizationLayerPersistence` görselleştirme katmanlarını basemap değişimlerinde korumak için çalışır.

### DataLayer

`src/features/map/layers/DataLayer.tsx`, `useDataManagementStore.items` verisini üç source'a ayırır:

- `data-polygons`
- `data-lines`
- `data-points`

Timeline aktifse tarih ve sayısal filtre burada uygulanır. Clustering aktifse normal point layer gizlenir. Renk, opaklık, stroke ve etiket ayarları `useLayerStyleSync` ile MapLibre paint/layout property'lerine doğrudan yazılır.

### Harita Export

`src/features/map/services/mapExport.ts`, `@zumer/snapdom` ile `#app-root` DOM ağacını yakalar. MapLibre canvas için `preserveDrawingBuffer: true` `MapContainer` içinde ayarlıdır. Export akışı:

```text
GISToolsControl
  -> RegionSelector
  -> exportAsPng veya exportAsPdf
  -> snapdom capture
  -> isteğe bağlı crop
  -> PNG blob veya jsPDF
```

`data-export-ignore="true"` taşıyan kontrol UI'ları export görüntüsünden çıkarılır.

---

## State Yönetimi

### Global Store'lar

`src/stores` altındaki güncel store yüzeyleri:

| Store | Sorumluluk |
|-------|------------|
| `useVisualizationStore` | Wizard adımı, dosya verisi, eşleme, render ayarları, renk konfigürasyonu, lejant, harita başlığı |
| `useMapStore` | Map instance, basemap, globe mode, kuzey oku, yüklenme durumu |
| `useDataManagementStore` | Kanonik veri listesi, çizim durumu, katalog, layer style, FAB |
| `useToolStore` | Aktif araç, ölçüm state'i, araç menüsü modu |
| `useClusteringStore` | Clustering modu ve aktiflik |
| `useHeatmapStore` | Heatmap aktifliği, panel, preset ve konfigürasyon |
| `useInterpolationStore` | Enterpolasyon aktifliği, konfigürasyon, sonuç, worker durumu, legend ayarı |
| `useIsochroneStore` | Isochrone modu, süreler, origin, rota, loading/error |
| `useSpatialAnalysisStore` | Aktif mekânsal analiz, stiller, nearest stats |
| `useTerrainAnalysisStore` | Bakı/eğim analizi modu, sonuçlar, opaklıklar |
| `useTimelineStore` | Feature timeline store'unun root re-export'u |
| `useStorymapModalStore` | Storymap modal açık/kapalı state'i |
| `useVideoModalStore` | Video modal açık/kapalı state'i ve hedef video |

### Store Köprüleri

Bazı feature store dosyaları gerçek store implementasyonu değil, root store'a re-export köprüsüdür:

```text
src/features/data-management/store/useDataManagementStore.ts
src/features/heatmap/stores/useHeatmapStore.ts
src/features/interpolation/stores/useInterpolationStore.ts
src/features/isochrone/stores/useIsochroneStore.ts
src/features/spatial-analysis/stores/useSpatialAnalysisStore.ts
src/features/terrain-analysis/stores/useTerrainAnalysisStore.ts
src/features/clustering/stores/useClusteringStore.ts
```

Bu pattern, feature public API yüzeyini korurken gerçek state'i `src/stores` altında merkezileştirir.

### Persist Durumu

`src/utils/indexedDbStorage.ts` Zustand `StateStorage` uyumlu bir IndexedDB helper'ı sağlar. Ancak güncel kanonik `useDataManagementStore.ts` içinde `persist(...)` kullanılmamaktadır. Bu nedenle mimari dokümanda "data-management store aktif olarak IndexedDB'ye persist eder" iddiası güncel kodla doğrulanmaz.

---

## Veri Yaşam Döngüsü

### Manuel Veri Oluşturma

```text
DataCreationSection
  -> useDataManagementStore.drawMode
  -> DataManagementDrawTool
  -> kullanıcı haritada nokta/çizgi/polygon çizer
  -> addItem()
  -> DataLayer
```

Çizim akışı undo/redo, ghost point, vertex sürükleme ve ölçüm etiketi içerir. Oluşturulan öğeler `source: 'drawn'` olarak store'a eklenir.

### Dosya İçe Aktarma

```text
DataImportSection
  -> useFileImport
  -> fileParser
       -> csvProcessor
       -> excelProcessor
       -> geoJsonProcessor
       -> kmlProcessor
       -> shapefileProcessor
  -> gerekirse ColumnMapperModal
  -> transformToGeoItems
  -> addItems()
```

Desteklenen formatlar:

| Format | Uzantı | İşleyici |
|--------|--------|----------|
| CSV | `.csv` | `csvProcessor` |
| Excel | `.xlsx`, `.xls` | `excelProcessor` |
| GeoJSON | `.geojson`, `.json` | `geoJsonProcessor` |
| KML | `.kml` | `kmlProcessor` |
| Shapefile | `.zip` | `shapefileProcessor` |

Büyük veri listeleri 2000 öğelik chunk'larla store'a eklenir.

### URL İçe Aktarma

```text
UrlImporter
  -> useUrlImport
  -> fetch(url)
  -> zip/kml/geojson ayrımı
  -> addItems()
```

URL akışı `.zip`, `.kml` ve GeoJSON/JSON içeriklerini destekler. CORS ve format hataları toast ile kullanıcıya bildirilir.

### Wizard Veri Yükleme

Görselleştirme sihirbazının Step 1 akışı genel veri yönetimi import akışından ayrıdır:

```text
VizWizardStep1
  -> ColumnMapper.loadFile()
  -> CSV ise doğrudan parse
  -> Excel ise worker ile ön analiz ve header seçimi
  -> useVisualizationStore.rawData / columns
```

Bu akış yalnız choropleth/bubble/dot-density render için kullanılan tablosal veriyi hazırlar.

### Veri Dışa Aktarma

```text
ProjectExportSection veya ExportControls
  -> useDataExport
  -> exportAsGeoJSON
  -> exportAsKml
  -> exportAsShapefileZip
  -> exportAsExcel
  -> exportAsCsv
  -> downloadFile
```

GeoJSON export, `@placemarkio/geojson-rewind` ile koordinat winding düzeltmesi uygular.

---

## Görselleştirme Pipeline

Görselleştirme akışı üç adımdır:

```text
Step 1: Dosya yükleme
Step 2: Konum ve veri sütunu eşleme
Step 3: Görselleştirme türü, stil, renk, lejant, başlık ve render
```

### Step 1

`VizWizardStep1`, Excel/CSV dosyasını `ColumnMapper` ile okur. Excel için `excelWorker.ts` kullanılır. Header seçimi gerektiğinde `pendingExcel` store'a yazılır.

### Step 2

`VizWizardStep2`, `useMatching` hook'u ile il/ilçe GeoJSON index'lerini yükler ve kullanıcı verisini eşler.

```text
useMatching
  -> getVisualizationManager(map)
  -> loadProvincesGeoJSON veya loadDistrictsGeoJSON
  -> ColumnMapper.setIndexes()
  -> matchData()
  -> MatchResults
```

Konum seviyeleri:

- `province`
- `district`
- `mixed`

Sayı formatı `numberFormatter` yardımcılarıyla Türkçe/İngilizce/otomatik modda parse edilir.

### Step 3

`VizWizardStep3`, render öncesi tüm sunum ayarlarını toplar:

- Görselleştirme türü: `choropleth`, `bubble`, `dot`
- Renk ölçeği: `steps`, `continuous`
- Sınıflandırma: `jenks`, `equal`, `quantile`, `custom`, `stddev`, `continuous-*`
- Renk paleti
- Bubble boyut modu ve bivariate renk sütunu
- Dot-density ayarları
- Özel değer aralığı
- Harita ayarları: veri modu, no-data rengi, etiketler, outline
- Lejant ayarları
- Harita başlığı

Render zinciri:

```text
Step3/index.tsx
  -> useVizWizardStep3
  -> useVizRender
  -> getVisualizationManager(map)
  -> VisualizationManager.renderChoropleth/renderBubble/renderPoint
  -> ChoroplethRenderer/BubbleRenderer/PointRenderer
  -> useVisualizationStore.currentVisualization
  -> LegendContainer
```

### Classification ve Renk Sistemi

Güncel `ClassificationMethod` union'ı:

```text
quantile
equal
jenks
custom
stddev
continuous-linear
continuous-quantile
continuous-natural
```

Public classification API içinde ayrı bir K-means yöntemi yoktur. Jenks iç implementasyonda istatistiksel kümelenme yardımcısı kullanır ancak dış API adı `jenks` olarak kalır.

Sürekli ölçek preset'leri:

```text
equidistant
quantiles-4
quantiles-5
quantiles-10
natural-9
```

Renderer seviyesinde:

- Choropleth ve bivariate bubble stepped/continuous renk ifadeleri üretir.
- Continuous expression 16 stop örnekler.
- Legend continuous palette için 30 LAB renk örneği kullanır.
- Dot-density sınıflandırmalı renk skalası kullanmaz; tek renkli nokta üretir.

### Render Güncelleme Anahtarları

`useVizRender` üç ayrı güncelleme hattı kullanır:

| Hat | Tetikleyen ayarlar | Davranış |
|-----|--------------------|----------|
| `dataVizKey` | sınıflandırma, class count, renk paleti, custom range, bubble scale, legend format | Tam yeniden render |
| `paintVizKey` | dot size/color/opacity, choropleth opacity, bubble stroke/opacity | `setPaintProperty` ile hızlı güncelleme |
| `displayVizKey` | label, value, dataOnlyMode, noDataColor, outline | `VisualizationManager.updateDisplayOptions` |

Görselleştirme türünün değişmesi tek başına otomatik yeniden render tetiklemez; kullanıcı `Görselleştir`/`Yeniden Görselleştir` düğmesine basar.

---

## Analiz Araçları

Analiz araçları çoğunlukla `GISToolsControl` üzerinden aktive edilir. `GISToolsControl`, aktif aracı seçerken diğer analizleri kapatır ve state çakışmasını engeller.

### Ölçüm ve Çizim

- `DistanceTool`: mesafe ve alan ölçümü, vertex sürükleme, ara nokta ekleme, live ghost segment.
- `DataManagementDrawTool`: veri oluşturma için nokta, çizgi, polygon çizimi.
- Her iki akış da MapLibre source/layer ve DOM marker kombinasyonu kullanır.

### Buffer Analizi

Buffer analizi `src/features/map/controls/GISToolsControl.buffer.tsx` ve `src/features/map/utils/bufferAnalysis.ts` üzerinden çalışır.

Özellikler:

- Bir veya çoklu görünür katman seçimi
- Tek mesafe veya çoklu mesafe
- Metre/kilometre birimi
- Çizgi için taraf seçimi: full, left, right
- Birleştirme: none, all
- Sonuçları `useDataManagementStore.addItem()` ile veri kataloğuna ekleme
- Sonuç modları: normal, birleşik, kesişim, fark, istatistiksel özet

### Clustering

```text
GISToolsControl -> useClusteringStore.cycle()
AppLayout -> useClustering()
DataLayer -> normal point layer'ı gerekirse gizler
```

Modlar:

- `normal`
- `clustered`
- `hidden`

### Heatmap

```text
GISToolsControl -> useHeatmapStore.toggle()
AppLayout -> useHeatmap()
HeatmapRenderer -> MapLibre heatmap/circle layer'ları
```

Görünür imported/drawn item'lar nokta geometrisine dönüştürülür. Polygon ve line verilerinden temsil noktaları çıkarılır. Ağırlık alanı varsa normalize edilir.

### Spatial Analysis

`spatial-analysis` üç analiz tipi sağlar:

- Convex hull
- Voronoi
- Nearest points

Akış:

```text
GISToolsControl
  -> useSpatialAnalysisStore.toggle(type)
  -> useSpatialAnalysis()
  -> ConvexHullRenderer/VoronoiRenderer/NearestPointsRenderer
```

Analizler görünür verilerden point collection türetir.

### Interpolation

Enterpolasyon IDW ve Kriging yöntemlerini destekler.

```text
GISToolsControl
  -> useInterpolationStore.toggle()
AppLayout
  -> useInterpolation()
  -> Worker(interpolation.worker.ts)
  -> InterpolationRenderer
  -> InterpolationPanel + InterpolationLegend
```

Önemli kararlar:

- En az 3 geçerli nokta gerekir.
- En az 2 farklı değer gerekir.
- Worker mesajları `runIdRef` ile yarış durumlarına karşı korunur.
- Recompute gerektiren ayarlar debounce ile yeniden hesaplanır.
- Stil/renk değişimleri mevcut sonucu tekrar render eder.
- Raster ve vektör grid modları aynı renderer içinde yönetilir.

### Isochrone

Isochrone analizi harita tıklamasıyla origin seçer. Süre halkaları ve rota modu ayrı renderer'lar tarafından çizilir.

```text
useIsochrone
  -> fetchIsochrones()
  -> IsochroneRenderer
  -> fetchRoute()
  -> RouteRenderer
```

API çağrıları `AbortController` ile iptal edilebilir. Mevcut isochrone alanına tıklanınca popup üzerinden rota veya yeni analiz seçilebilir.

### Elevation Profile

`ElevationProfileTool`, harita üzerinde waypoint toplar. `useElevationProfile.finalize()` iki veya daha fazla noktayla yükseklik verisini ister.

```text
ElevationProfileTool
  -> useElevationProfileStore.waypoints
  -> useElevationProfile.finalize()
  -> fetchStraightElevation()
  -> ElevationProfilePanel
```

Aktif chart point state'i hot-path kabul edilir; panel gereksiz yeniden render almaması için hook seçimi `useShallow` ile sınırlandırılmıştır.

### Terrain Analysis

Arazi analizi Terrarium DEM tile kaynağına dayanır.

Modlar:

- `point-aspect`
- `polygon-slope`
- `polygon-aspect`

Akış:

```text
TerrainAnalysisTool
  -> harita tıklaması veya polygon seçimi
  -> useTerrainAnalysis()
  -> analyzePolygonSlopeFromTerrarium()
  -> analyzePolygonAspectFromTerrarium()
  -> TerrainAnalysisRenderer
  -> TerrainSlopeLegend/TerrainAspectLegend
```

Özellikler:

- Nokta tabanlı bakı/eğim/yükseklik sonucu
- Polygon eğim raster sonucu
- Polygon bakı sonucu
- Opaklık kontrolleri
- DEM istekleri için abort ref'leri
- AppLayout içinde görünür polygon seçenekleri Turf alan hesabıyla hazırlanır

### Astronomy

`useAstroMap`, `useAstroStore` ayarlarına göre MapLibre layer ve marker üretir.

Kapsam:

- Güneş marker'ı ve popup
- Ay marker'ı ve popup
- Ay evresi görseli
- Terminator/gece gölgesi
- Eksen çizgisi
- Tutulma katmanları
- Zaman oynatma
- Globe projeksiyon değişimlerinde layer yenileme

### Overlay Layers

`layers` feature hazır katman kataloğunu yönetir.

Güncel katalog:

| ID | Ad | Kaynak | Tip |
|----|----|--------|-----|
| `akarsular` | Akarsular | CDN zip | line |
| `sular` | Su Yüzeyi | CDN zip | fill |
| `ulasim` | Ulaşım | CDN zip | line |
| `dfy` | Türkiye Diri Fay Haritası | CDN zip | fill |
| `arazi_ortusu_2018` | Arazi Örtüsü (2018) | GitHub TopoJSON | fill |

Arazi örtüsü kısa URL presetleri `useOverlayLayers` içinde işlenir:

```text
/cbs/lc2018
/cbs/arazi-2018
/cbs/arazi-ortusu-2018
?landCover=1
```

---

## Lejant ve Harita Sunumu

### Lejant Seçimi

`LegendContainer`, render edilmiş `currentVisualization` snapshot'ından beslenir. Draft wizard state'i doğrudan kullanmak yerine `currentVisualization.renderSettings` tercih edilir.

Seçim mantığı:

| Durum | Kullanılan lejant |
|-------|-------------------|
| Dot-density | `DotDensityLegend` |
| Bubble, tek renk, proportional | `BubbleSizeLegend` |
| Bubble, tek renk, graduated | `BubbleSizeLegend` |
| Bubble, bivariate | Renk lejantı + `BubbleSizeLegend` |
| Yatay renk lejantı | `DynamicLegend` |
| Dikey renk lejantı | `ColorLegend` |

Bubble legend min/max değerleri, renderer'ın kullandığı dedupe mantığıyla uyumlu şekilde snapshot üzerinden çıkarılır.

### Lejant Konfigürasyonu

`LegendConfig` şunları yönetir:

- Lejant görünürlüğü
- Lejant boyutu
- Yatay/dikey yönlendirme
- Etiket tipi: ruler, ranges, custom
- Sayı formatı
- Başlık
- Ters sıralama
- Kuzey oku görünürlüğü, modeli, yönü ve boyutu

`LegendPosition` tipi mevcut olsa da güncel `LegendConfig` panelinde position selector yoktur.

### Harita Başlığı

`MapTitle` viz-wizard public API'sidir ve `AppLayout` içinde mount edilir. Store kaynağı `useVisualizationStore.mapTitle` alanıdır.

Alanlar:

- `visible`
- `title`
- `subtitle`
- `position`: `top-left`, `top-center`, `top-right`
- `fontSize`

---

## Performans Stratejisi

### Paint-only Güncellemeler

`useLayerStyleSync` ve `useVizRender` bazı değişikliklerde GeoJSON'u yeniden üretmez. Bunun yerine MapLibre API'leri kullanılır:

```text
map.setPaintProperty()
map.setLayoutProperty()
map.setFilter()
```

Bu özellikle slider, opacity, renk ve outline güncellemelerinde UI gecikmesini azaltır.

### Worker Kullanımı

İki yerde worker kullanılır:

- Excel ön analiz ve header seçimi: `src/utils/columnMapper/excelWorker.ts`
- Enterpolasyon hesaplama: `src/features/interpolation/services/interpolation.worker.ts`

### Chunk Bazlı Import

`useFileImport`, çok büyük dosyalarda 2000 öğelik chunk'lar halinde `addItems()` çağırır ve aralara event loop bırakır.

### Layer Persistence

MapLibre style reload veya projection değişimlerinde layer'lar kaybolabildiği için şu korumalar vardır:

- `MapContainer`: basemap layer sırası
- `useOverlayLayers`: overlay layer rehydrate
- `useVisualizationLayerPersistence`: visualization layer rehydrate
- `useAstroMap`: astronomi layer cleanup/setup ve globe geçiş refresh'i

### Bundle Ayrımı

`vite.config.ts` vendor bağımlılıklarını ve bazı feature'ları chunk'lara ayırır. Amaç büyük bağımlılıkların tek `vendor` dosyasına yığılmasını azaltmak ve cache davranışını iyileştirmektir.

---

## Build, Dağıtım ve Statik İçerik

### HTML ve Asset Kuralları

`index.html` UTF-8 ve Türkçe dil koduyla gelir:

```html
<html lang="tr">
<meta charset="UTF-8" />
```

Harici kaynaklar:

- MapLibre CSS: CDN
- FontAwesome CSS: CDN
- Google Fonts: CDN
- HGM Atlas Geocoder script: `/geocoder.js`

### Storymap

`storymap/` ana React app'ten ayrı bir statik uygulamadır. `StorymapModal`, `BASE_URL + 'storymap/index.html'` adresini iframe içinde açar. Dev server ve build copy davranışı Vite plugin'leriyle sağlanır.

### Video Modal

`video-modal/` eğitim videoları için ayrı statik uygulamadır. `VideoModal`, `BASE_URL + 'video-modal/index.html'` adresini iframe içinde açar. Iframe hazır olduğunda `PLAY_VIDEO` mesajı gönderilebilir.

### MEBİ Build

Alt klasör yayını için `pnpm run build:mebi` kullanılmalıdır. Bu komut Vite base değerini `./` yapar. Standart `npm run build` çıktısı `/cbs-react/` base varsayar.

`prebuild:mebi` script'i otomatik olarak `version-from-git.cjs` çalıştırır; ayrıca elle çalıştırmaya gerek yoktur.

### IIS Derin Link (SPA Fallback)

`https://ogmmateryal.eba.gov.tr/cbs/arazi-2018` gibi doğrudan açılan kısa URL'ler IIS varsayılan davranışıyla 404 döner; çünkü IIS `arazi-2018` adında bir dosya/klasör arar.

**Çözüm:** `public/web.config` dosyası `pnpm build:mebi` ile `dist/web.config` olarak kopyalanır. Bu dosya, fiziksel olarak var olmayan her yolu `index.html`'e rewrite eder; React yüklendikten sonra `pathname` kontrolü ile ilgili katman preset'i otomatik açılır.

```xml
<!-- dist/web.config -->
<rule name="CBS React SPA" stopProcessing="true">
  <match url=".*" />
  <conditions logicalGrouping="MatchAll">
    <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
    <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
  </conditions>
  <action type="Rewrite" url="index.html" />
</rule>
```

**Gereksinim:** Sunucuda **IIS URL Rewrite** modülü kurulu olmalıdır.

**Deploy adımları:**

1. `pnpm run build:mebi` çalıştır.
2. `dist/` klasörünün tamamını (özellikle `web.config` ve `index.html`) sunucudaki `/cbs` fiziksel dizinine kopyala.
3. `https://ogmmateryal.eba.gov.tr/cbs/arazi-2018` adresini doğrudan aç — uygulama yüklenip arazi örtüsü katmanı otomatik açılmalıdır.

Desteklenen kısa URL'ler (`useOverlayLayers.ts`):

| URL | Davranış |
|-----|----------|
| `/cbs/lc2018` | Arazi örtüsü katmanını açar |
| `/cbs/arazi-2018` | Arazi örtüsü katmanını açar |
| `/cbs/arazi-ortusu-2018` | Arazi örtüsü katmanını açar |
| `/cbs/corine` | CORINE arazi örtüsü katmanını açar |

---

## Import Sınırları ve Mimari Kurallar

ESLint import sınırları mimariyi korur:

1. Cross-feature deep import yasaktır:

```text
@/features/*/*
@/features/*/*/*
```

2. Feature altındaki dosyalar başka feature'ı `@/features/*` ile import edemez.

3. Root ve map-level orchestrator dosyaları istisnadır, ancak public barrel import kullanmalıdır:

```text
src/components/layout/AppLayout.tsx
src/components/sidebar/Sidebar.tsx
src/features/map/components/MapContainer.tsx
src/features/map/layers/DataLayer.tsx
src/features/map/controls/GISToolsControl*.tsx
```

4. `src/components` global alanı normalde feature import etmemelidir. `AppLayout` ve `Sidebar` bu kuralın bilinçli istisnalarıdır.

5. Feature dışına açılan API `index.ts` üzerinden belgelenir.

Doğru örnek:

```ts
import { LegendContainer } from '@/features/legend'
import { MapContainer } from '@/features/map'
```

Yanlış örnek:

```ts
import LegendContainer from '@/features/legend/components/Container'
```

---

## Doğrulama Rehberi

Mimariyi etkileyen bir değişiklikten sonra önerilen kontroller:

```bash
npm run test:run
npm run lint
npm run build
```

Dokümantasyon odaklı değişikliklerde en az şu kontroller yapılmalıdır:

```bash
git diff --check -- docs/ARCHITECTURE.md
Get-Content docs\ARCHITECTURE.md -Encoding utf8
```

Diff kontrolü whitespace hatalarını, UTF-8 okuma kontrolü ise Türkçe karakter bozulmalarını yakalamak içindir. Güncel kodda karşılığı olmayan eski referanslar dokümantasyonda tutulmamalıdır.

---

## Kısa Referans Haritası

En sık bakılan mimari dosyalar:

```text
src/main.tsx
src/App.tsx
src/components/layout/AppLayout.tsx
src/components/sidebar/Sidebar.tsx
src/features/map/components/MapContainer.tsx
src/features/map/layers/DataLayer.tsx
src/features/map/controls/GISToolsControl.tsx
src/stores/useDataManagementStore.ts
src/stores/useVisualizationStore.ts
src/features/viz-wizard/steps/Step3/index.tsx
src/features/viz-wizard/hooks/useVizRender.ts
src/features/visualization/shared/VisualizationManager.ts
src/features/legend/components/Container.tsx
src/features/interpolation/hooks/useInterpolation.ts
src/features/terrain-analysis/hooks/useTerrainAnalysis.ts
vite.config.ts
eslint.config.js
```
