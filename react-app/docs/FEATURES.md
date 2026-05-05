# Özellik Dokümantasyonu

**Proje:** OGM Materyal CBS
**Son Güncelleme:** 1 Mayıs 2026
**İncelenen kapsam:** `package.json`, `src/main.tsx`, `src/App.tsx`, `src/components/`, `src/features/`, `src/stores/`, `src/shared/`, `src/types/`, `src/utils/`, `docs/` ve mevcut public export yüzeyleri.

---

## Genel Bakış

Bu uygulama React 19 + TypeScript 5.9 + Vite 7 üzerinde çalışan feature-first bir CBS platformudur. Harita kabuğu MapLibre GL ve `react-map-gl/maplibre` ile kurulur; veri durumu Zustand store'larında tutulur; analiz, görselleştirme ve içe/dışa aktarma akışları `src/features/` altında dikey modüller halinde ayrılmıştır.

`src/features/` altında güncel olarak **21 feature modülü** vardır:

- `astronomy`
- `basemap`
- `clustering`
- `data-management`
- `data-mapper`
- `elevation-profile`
- `geocoder`
- `globe-view`
- `heatmap`
- `interpolation`
- `isochrone`
- `layers`
- `legend`
- `map`
- `spatial-analysis`
- `storymap-modal`
- `terrain-analysis`
- `timeline`
- `video-modal`
- `visualization`
- `viz-wizard`

Dosya/URL içe aktarma, kolon eşleme ve dışa aktarma yüzeyleri güncel kodda `src/features/data-management/` altında toplanmıştır.

---

## Uygulama Orkestrasyonu

### Root Akış

1. `src/main.tsx`
   - `#root` elementini bulur ve React `StrictMode` ile `App` bileşenini render eder.
   - MapLibre'den gelen `Max vertices per segment is 65535` uyarısını `console.warn` ve `console.error` üzerinde filtreler.
   - Eski dokümanlardaki gibi `localStorage`, `sessionStorage`, `Cache Storage` veya `IndexedDB` temizliği yapmaz.

2. `src/App.tsx`
   - `MapProvider` ile MapLibre context'ini kurar.
   - `AppLayout` bileşenini ve `react-hot-toast` `Toaster` bileşenini mount eder.
   - `useGoogleAnalytics` hook'u ile Google Analytics başlatılır.

3. `src/components/layout/AppLayout.tsx`
   - Uygulamanın ana composition katmanıdır.
   - Sidebar, harita, arama, altlık, overlay katmanları, astronomi, görselleştirme başlığı, heatmap, spatial analysis, interpolation, isochrone, elevation profile, terrain analysis, legend, veri yönetimi FAB'i, koordinat göstergesi, storymap modal ve video modal burada bir araya gelir.

### Sidebar Akışı

`src/components/sidebar/Sidebar.tsx` şu parçaları compose eder:

- `SidebarHeader`
- `SidebarProjectPurpose`
- `SidebarTools`
- `VizWizardSidebar`
- `DataManagementSection`
- `ProjectExportSection`
- `DataImportSection`
- `SidebarFooter`

Sidebar içinde görselleştirme sihirbazı, veri oluşturma/katalog yönetimi, proje dışa aktarma, dosya/URL içe aktarma ve eğitim videolarına erişen akıllı yardım yüzeyi birlikte çalışır.

### Harita Akışı

`src/features/map/components/MapContainer.tsx` ana MapLibre sahnesidir.

Mount edilen ana parçalar:

- Raster altlık source/layer
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

`MapContainer`, globe görünümünde koyu uzay arka planını ve yıldız overlay'ini de yönetir. `preserveDrawingBuffer: true` ayarı harita export işlemleri için bilinçli olarak açıktır.

---

## Güncel Feature Envanteri

| Feature | Path | Primary Public API | Güncel rol |
| --- | --- | --- | --- |
| Astronomy | `src/features/astronomy/` | `AstroPanel`, `useAstroMap`, `useAstroStore`, astro/eclipses yardımcıları | Güneş, Ay, terminator, eksen eğikliği ve tutulma katmanlarını yönetir |
| Basemap | `src/features/basemap/` | `BasemapSwitcher` | Altlık harita seçim UI'ı; gerçek raster endpoint çözümü `MapContainer` içindedir |
| Clustering | `src/features/clustering/` | `useClusteringStore`, `useClustering`, `ClusterMode` | Nokta verilerini normal, kümeli veya gizli modda sunar |
| Data Management | `src/features/data-management/` | Store re-export, veri yönetimi bileşenleri, import/export hook'ları | Kanonik veri domain'i; çizim, içe aktarma, katalog, stil, dışa aktarma ve akıllı yardım burada |
| Data Mapper | `src/features/data-mapper/` | `DataMapper`, `DataEditor`, `DataMapperModal` | AG Grid tabanlı veri eşleme ve düzenleme modalı |
| Elevation Profile | `src/features/elevation-profile/` | `ElevationProfilePanel`, `ElevationProfileTool`, `useElevationProfile`, store, tipler | Harita üzerinden çizilen rota/çizgi için yükselti profili üretir |
| Geocoder | `src/features/geocoder/` | `SearchContainer`, `useGeocoder` | HGM Atlas arama, koordinat odaklama ve sonuç gösterimi |
| Globe View | `src/features/globe-view/` | `useGlobeView`, `GlobeToggleButton` | Mercator/globe projeksiyon geçişi |
| Heatmap | `src/features/heatmap/` | `HeatmapPanel`, `useHeatmap`, `useHeatmapStore`, `HeatmapRenderer`, tipler | Görünür veri öğelerinden yoğunluk haritası üretir |
| Interpolation | `src/features/interpolation/` | `InterpolationPanel`, `InterpolationLegend`, `useInterpolation`, `useInterpolationStore`, `InterpolationRenderer`, tipler | IDW/Kriging enterpolasyonu; raster ve vektör grid görünümleri |
| Isochrone | `src/features/isochrone/` | `IsochronePanel`, `useIsochrone`, `useIsochroneStore`, tipler | OpenRouteService ile erişilebilirlik halkaları ve rota üretimi |
| Layers | `src/features/layers/` | `LayersPanel`, `LandCoverLegend`, `useOverlayLayers` | Hazır overlay katmanlarını yükler, stiller ve lejantını gösterir |
| Legend | `src/features/legend/` | Legend bileşenleri, `LegendContainer`, `LegendConfig`, `useLabelCollision`, tipler | Görselleştirme tipine göre dinamik lejant seçimi ve yapılandırması |
| Map | `src/features/map/` | `MapContainer`, kontroller, hook'lar, `DataLayer`, `DistanceTool` | Çekirdek harita sahnesi, kontroller, export ve veri katmanı |
| Spatial Analysis | `src/features/spatial-analysis/` | `SpatialAnalysisPanel`, `useSpatialAnalysis`, renderer'lar, store, tipler | Convex hull, Voronoi ve nearest-points analizleri |
| Storymap Modal | `src/features/storymap-modal/` | `StorymapModal` | Hikâye haritasını iframe modal olarak gösterir |
| Terrain Analysis | `src/features/terrain-analysis/` | `TerrainAnalysisPanel`, `TerrainAnalysisTool`, `TerrainAspectLegend`, `TerrainSlopeLegend`, `useTerrainAnalysis`, store, tipler | Nokta bakı, polygon bakı haritası ve polygon eğim haritası üretir |
| Timeline | `src/features/timeline/` | `useTimelineStore`, `STEP_MS`, timeline tipleri | Tarih ve sayısal alan temelli filtreleme durumunu yönetir |
| Video Modal | `src/features/video-modal/` | `VideoModal` | Eğitim videoları iframe modalını yönetir |
| Visualization | `src/features/visualization/` | Choropleth, bubble, dot-density renderer'ları, tooltip hook'ları, `VisualizationManager`, persistence hook'u | İl/ilçe tabanlı tematik harita render orkestrasyonu |
| Viz Wizard | `src/features/viz-wizard/` | `VizWizardStep1`, `VizWizardStep2`, `VizWizardStep3`, `WizardProgress`, `MapTitle`, `VizWizardSidebar` | Dosya yükleme, eşleme, görselleştirme ve sunum ayarı sihirbazı |

---

## Feature Detayları

### Astronomy

**Path:** `src/features/astronomy/`
**Public API:** `AstroPanel`, `useAstroMap`, `useAstroStore`, `astroUtils`, `eclipseUtils`

Astronomi feature'ı panel, store, MapLibre katmanları, marker'lar ve hesaplama yardımcılarından oluşur.

- `AstroPanel`, zaman seçimi, yerel/UTC modu, hız, oynatma ve feature toggle'larını sunar.
- `useAstroStore`, `isEnabled`, `currentDate`, `moonPhaseAngle`, `speed`, `timeMode`, `isPlaying` ve aktif astronomi katmanlarını tutar.
- `useAstroMap`, MapLibre kaynak/katman rehydration, canlı zaman animasyonu, Güneş/Ay marker'ları ve popup'larını yönetir.
- Desteklenen görünümler: Güneş konumu, aydınlanma çizgisi/gece gölgesi, Ay evresi, eksen eğikliği ve tutulma analizi.
- Globe projeksiyon geçişlerinde astronomi katmanları temizlenip yeniden kurulacak şekilde tasarlanmıştır.

### Basemap

**Path:** `src/features/basemap/`
**Public API:** `BasemapSwitcher`

Basemap feature'ı yalnız seçim UI'ıdır; tile URL üretimi `MapContainer` içinde yapılır.

- Store tipi `BasemapType`: `TEMEL`, `UYDU`, `GECE`, `SIYASI`, `YUKSEKLIK`, `NONE`, `CARTO_LIGHT`, `CARTO_DARK`, `CARTO_VOYAGER`, `ESRI_SATELLITE`.
- UI'da görünen seçenekler: Carto Açık, Uydu, HGM Temel, HGM Uydu, HGM Gece, HGM Siyasi, HGM Yükseklik, Altlık Haritayı Gizle.
- Production ortamında `CARTO_LIGHT` ve `ESRI_SATELLITE` seçenekleri listeden gizlenir.
- Varsayılan altlık production'da `TEMEL`, development ortamında `CARTO_LIGHT`.
- HGM altlıkları `VITE_HGM_API_KEY` kullanır.

### Clustering

**Path:** `src/features/clustering/`
**Public API:** `useClusteringStore`, `ClusterMode`, `useClustering`

Nokta kümeleme davranışı `normal`, `clustered`, `hidden` modlarıyla çalışır.

- `useClusteringStore`, mode cycle mantığını yönetir.
- `useClustering`, görünür point/MultiPoint öğelerini `useDataManagementStore` üzerinden okur.
- Timeline aktifse tarih aralığı ve sayısal filtreler kümeleme verisine uygulanır.
- Kümeli modda `clustered-points-source`, `clusters-layer`, `cluster-count-layer` ve `unclustered-point-layer` oluşturulur.
- `hidden` modunda cluster kapalıdır; `DataLayer` point layer'larını da çizmez.

### Data Management

**Path:** `src/features/data-management/`
**Public API:** `useDataManagementStore`, `DataCatalogSection`, `DataCreationSection`, `DataImportSection`, `DataManagementDrawTool`, `DataManagementSection`, `ImportedDataManagerFab`, `ImportedDataTableModal`, `ColumnMapperModal`, `ExportControls`, `UrlImporter`, `ProjectExportSection`, `useDataExport`, `useFileImport`, `useLayerStyleSync`, `useUrlImport`, tipler

Data Management projenin kanonik veri domain'idir.

- Store gerçek olarak `src/stores/useDataManagementStore.ts` içindedir; feature altındaki store dosyası re-export yapar.
- Veri türleri: `point`, `line`, `polygon`.
- Veri kaynakları: `drawn` ve `imported`.
- Çizim modları: `none`, `point`, `line`, `polygon`.
- Store; veri listesi, aktif öğe, import durumu, layer style, FAB konumu, çizim noktaları, ghost point, undo/redo stack ve draw state bilgisini tutar.
- Aktif Zustand persist wrapper yoktur. `indexedDbStorage` yardımcı modülü repo içinde durur ancak güncel store tanımında persist ile bağlanmamıştır.

Alt bileşenler ve hook'lar:

- `DataCreationSection`, harita üzerinde nokta/çizgi/alan oluşturmayı ve çizim undo/redo akışını sunar.
- `DataCatalogSection`, drawn/imported verileri listeler; görünürlük, silme ve çift tıkla renk düzenleme sağlar. Çok büyük imported source'lar performans için katalogda gizlenip yönetim paneline yönlendirilir.
- `DataManagementDrawTool`, aktif çizim modunu MapLibre etkileşimine bağlar.
- `ImportedDataManagerFab` ve `ImportedDataTableModal`, içe aktarılan verileri ayrı yönetim yüzeyinde görüntüler/düzenler.
- `DataImportSection`, dosya sürükle-bırak, URL import, kolon eşleme modalı ve `SmartAssistant` yardım bileşenini içerir.
- `ProjectExportSection`, proje verisi dışa aktarma akışını sidebar içine koyar.
- `useLayerStyleSync`, store'daki stil değişikliklerini MapLibre paint/layout property'lerine doğrudan yansıtır.

Import/export desteği:

- Import formatları: GeoJSON/JSON, Excel/XLSX/XLS, CSV, KML, Shapefile ZIP.
- Export formatları: GeoJSON, KML, Shapefile ZIP, Excel XLSX, CSV.
- Parser servisleri `services/import/` altında; exporter servisleri `services/export/` altında tutulur.
- Büyük importlarda veriler 2000'lik parçalarla store'a eklenir.

Akıllı yardım:

- `components/smart-assistant/` eğitim video kataloğu, arama, sesli arama, bağlamsal öneri ve video modal açma akışını içerir.
- Video oynatma `useVideoModalStore` üzerinden `video-modal` feature'ına bağlanır.

### Data Mapper

**Path:** `src/features/data-mapper/`
**Public API:** `DataMapper`, `DataEditor`, `DataMapperModal`

Data Mapper bir service/store paketi değil, AG Grid tabanlı tablo düzenleme ve eşleme UI'ıdır.

- İç bileşenler: `Editor`, `Grid`, `Modal`, `ModalToolbar`, `SidebarForm`, `CorrectionPanel`, `ExcelHeaderPanel`, `StatusCell`.
- İç hook: `useColumns`.
- `VizWizardStep2` içinde matching tablosu olarak kullanılır.
- `DataImportSection` içindeki `ColumnMapperModal` ile karıştırılmamalıdır; o genel dosya import kolon eşleme modalıdır.

### Elevation Profile

**Path:** `src/features/elevation-profile/`
**Public API:** `ElevationProfilePanel`, `ElevationProfileTool`, `useElevationProfile`, `useElevationProfileStore`, tipler

Yükselti profili iki parçalı çalışır.

- `ElevationProfileTool`, `MapContainer` içinde mount edilir ve harita üzerinde waypoint/çizgi etkileşimini yönetir.
- `ElevationProfilePanel`, `AppLayout` içinde mount edilir.
- `useElevationProfile`, waypoint listesi, loading/error, yükselti noktaları, istatistik ve finalize akışını orkestre eder.
- `elevationProfileApi.ts`, OpenRouteService Elevation API (`https://api.openrouteservice.org/elevation/line`) ile çalışır.
- Ortaya çıkan istatistikler minimum, maksimum, ortalama yükseklik, toplam tırmanış, toplam iniş, toplam mesafe, maksimum ve ortalama eğim alanlarını kapsar.
- API anahtarı `VITE_ORS_API_KEY` üzerinden alınır.

### Geocoder

**Path:** `src/features/geocoder/`
**Public API:** `SearchContainer`, `useGeocoder`

Geocoder feature'ı üst kontrol alanındaki arama yüzeyidir.

- `SearchContainer`, arama butonu/input'u, katman butonu, globe kontrolü ve hikâye haritası butonuyla aynı yatay kontrol grubunda çalışır.
- `GeocoderManager`, HGM Atlas arama servisini `https://atlas.harita.gov.tr/search_yeni` taban adresiyle kullanır.
- `index.html` içinde `/geocoder.js` harici HGM Atlas geocoder kütüphanesi yüklenir.
- En az 3 karakterli arama yapılır; ayrıca `lat,lng` formatındaki koordinatlar doğrudan haritaya odaklanır.
- Sonuçlar marker, popup ve gerektiğinde çoklu sonuç layer'ı olarak haritaya işlenir.

### Globe View

**Path:** `src/features/globe-view/`
**Public API:** `useGlobeView`, `GlobeToggleButton`

Globe View feature'ı harita projeksiyon geçişini yönetir.

- `useGlobeView`, MapLibre `setProjection` ile `mercator` ve `globe` arasında geçiş yapar.
- Globe moduna geçerken önceki zoom saklanır, dünya görünümüne uygun zoom/merkez uygulanır ve koyu canvas arka planı ayarlanır.
- Globe modundaki yıldızlı arka plan `MapContainer` içinde render edilir.
- Store tarafında `useMapStore.isGlobeMode` güncellenir.

### Heatmap

**Path:** `src/features/heatmap/`
**Public API:** `HeatmapPanel`, `useHeatmap`, `useHeatmapStore`, `HeatmapRenderer`, tipler

Heatmap feature'ı görünür verilerden yoğunluk haritası üretir.

- `GISToolsControl` içindeki `Isı Haritası` aksiyonuyla açılır.
- `useHeatmap`, visible imported/drawn verileri okur ve MapLibre renderer'a aktarır.
- Nokta dışı geometriler centroid veya orta nokta mantığıyla point'e dönüştürülür.
- Sayısal alanlar ilk örneklem üzerinden çıkarılır; ağırlık alanı seçilirse değerler normalize edilir.
- `HeatmapPanel`, preset, ağırlık alanı ve konfigürasyon ayarlarını sunar.

### Interpolation

**Path:** `src/features/interpolation/`
**Public API:** `InterpolationPanel`, `InterpolationLegend`, `useInterpolation`, `useInterpolationStore`, `InterpolationRenderer`, tipler

Interpolation feature'ı noktasal değerlerden yüzey üretir.

- `GISToolsControl` içindeki `Enterpolasyon` aksiyonuyla açılır.
- Yöntemler: `idw`, `kriging`.
- Grid tipleri: `smooth`, `square`, `hex`, `triangle`, `isoband`.
- Kriging modelleri: `gaussian`, `exponential`, `spherical`.
- Renk rampaları: `spectral`, `spectral-reverse`, `green-red`, `red-green`, `viridis`, `magma`, `terrain`, `blues`, `reds`.
- Semboloji: `stretch` veya `classify`.
- Ağır hesaplama `interpolation.worker.ts` içinde Web Worker ile yapılır.
- `smooth` grid tipinde sınıflandırılmış semboloji desteklenmez; `symbologyConstraints.ts` efektif sembolojiyi `stretch` olarak çözer.
- `InterpolationLegend`, harita üzerinde floating/sürüklenebilir çalışır ve başlık düzenlemesini destekler.
- Nokta değerlerini harita üzerinde gösterme seçeneği vardır.

### Isochrone

**Path:** `src/features/isochrone/`
**Public API:** `IsochronePanel`, `useIsochrone`, `useIsochroneStore`, tipler

Isochrone feature'ı erişilebilirlik ve rota akışını yönetir.

- `GISToolsControl` içindeki `Erişilebilirlik Analizi` aksiyonuyla açılır.
- OpenRouteService API kullanılır: `/v2/isochrones/{profile}` ve `/v2/directions/{profile}/geojson`.
- Başlangıç noktası harita tıklamasıyla seçilir.
- Süre aralıkları seçilebilir; sonuçlar `IsochroneRenderer` ile çizilir.
- Kullanıcı mevcut isochrone içinde tıklarsa rota alma veya yeni analiz başlatma popup'ı gösterilir.
- Rota sonucu `RouteRenderer` ile çizilir ve mesafe/süre istatistiği panelde sunulur.
- API anahtarı `VITE_ORS_API_KEY` üzerinden alınır.

### Layers

**Path:** `src/features/layers/`
**Public API:** `LayersPanel`, `LandCoverLegend`, `useOverlayLayers`

Layers feature'ı hazır overlay kataloglarını yönetir.

Güncel overlay tanımları:

- `akarsular` - Akarsular, line, `akarsular.zip`
- `sular` - Su Yüzeyi, fill, `sular.zip`
- `ulasim` - Ulaşım, line, `ulasim.zip`
- `dfy` - Türkiye Diri Fay Haritası, fill, `diri_fay.zip`
- `arazi_ortusu_2018` - Arazi Örtüsü (2018), fill, TopoJSON URL

Teknik davranış:

- Shapefile ZIP kaynakları `https://cdn.jsdelivr.net/gh/emindagg/katman_verisi/` taban adresinden `shpjs` ile okunur.
- TopoJSON kaynakları `topojson-client` ile GeoJSON'a dönüştürülür.
- Arazi örtüsü katmanı için vertex sayısı `@turf/simplify` ile düşürülür.
- Style reload sonrasında aktif overlay layer'lar yeniden haritaya eklenir ve en üste taşınır.
- Arazi Örtüsü kısa URL presetleri desteklenir: `/cbs/lc2018`, `/cbs/arazi-2018`, `/cbs/arazi-ortusu-2018` (geri uyumluluk) ve `?landCover=1`.
- `LandCoverLegend`, arazi örtüsü aktifken sınıf lejantını gösterir.

### Legend

**Path:** `src/features/legend/`
**Public API:** `DynamicLegend`, `DotDensityLegend`, `BubbleSizeLegend`, `ColorLegend`, `LegendBar`, `LegendLabels`, `SmartLabel`, `LegendConfig`, `LegendContainer`, `useLabelCollision`, tipler

Legend feature'ı görselleştirme tipine göre uygun lejantı seçer ve yapılandırır.

- `LegendContainer`, `useVisualizationStore` durumuna göre aktif lejantı belirler.
- Choropleth ve bazı bubble senaryolarında `DynamicLegend`/`ColorLegend` kullanılır.
- Tek değişkenli bubble görünümlerinde `BubbleSizeLegend` kullanılır.
- Dot-density görünümlerinde `DotDensityLegend` kullanılır.
- `DynamicLegend`, sürükle-bırak, inline başlık düzenleme ve etiket çakışma yönetimi içerir.
- Yardımcılar: `itemGenerators`, `collapseConsecutiveLabels`, `disambiguateBoundaryLabels`, `selectEvenlySpacedItems`.

### Map

**Path:** `src/features/map/`
**Public API:** `MapContainer`, `MapControlStack`, `ZoomControls`, `GISToolsControl`, `CoordinateDisplay`, `GeolocationButton`, `useCoordinateDisplay`, `useGeolocation`, `DataLayer`, `DistanceTool`

Map feature'ı uygulamanın çekirdek harita yüzeyidir.

- `MapContainer`, MapLibre sahnesini ve basemap raster source/layer'ını kurar.
- `DataLayer`, drawn/imported verileri point, line ve polygon source'larına ayırır; timeline ve clustering modlarını dikkate alır.
- `DistanceTool`, mesafe ölçümünü yönetir.
- `GISToolsControl`, ölçüm, buffer, clustering, heatmap, isochrone, spatial analysis, interpolation, terrain analysis, elevation profile, PNG/PDF export ve temizleme aksiyonlarını sunar.
- `MapControlStack`, sidebar toggle, zoom, geolocation, basemap ve astronomy toggle kontrollerini bir arada tutar.
- `TimelineControl`, feature olarak `timeline` store'unu kullanır ancak UI olarak map feature altında bulunur.
- `FeaturePopup`, haritadaki veri öğelerini seçme/inceleme davranışını sağlar.
- `mapExport.ts`, `@zumer/snapdom` ve `jspdf` ile harita + overlay çıktısını PNG/PDF olarak alır; istenirse seçili bölge kırpılır.
- `AttributionInfoButton`, HGM, OpenRouteService/OpenStreetMap, Copernicus ve AWS Terrarium DEM atıflarını gösterir.

### Spatial Analysis

**Path:** `src/features/spatial-analysis/`
**Public API:** `SpatialAnalysisPanel`, `useSpatialAnalysis`, `useSpatialAnalysisStore`, `ConvexHullRenderer`, `VoronoiRenderer`, `NearestPointsRenderer`, tipler

Spatial Analysis feature'ı görünür veri öğelerinden nokta temelli analizler üretir.

- Analizler `GISToolsControl` içindeki `Dış Sınır`, `En Yakın Alanlar` ve `En Yakın Nokta` aksiyonlarıyla açılır.
- Point dışı geometriler centroid veya orta nokta ile analiz noktalarına dönüştürülür.
- `ConvexHullRenderer`, en az 3 noktayla dış sınır poligonu üretir.
- `VoronoiRenderer`, en az 2 noktayla Voronoi alanlarını üretir.
- `NearestPointsRenderer`, en yakın nokta bağlantılarını ve istatistiklerini üretir.
- Panelde her analiz için stil ayarları ve nearest-points konfigürasyonu bulunur.

### Storymap Modal

**Path:** `src/features/storymap-modal/`
**Public API:** `StorymapModal`

Storymap feature'ı tek bileşenli modal sunum katmanıdır.

- Durum `src/stores/useStorymapModalStore.ts` içinde tutulur.
- `SearchContainer` içindeki `Hikâye Haritası` butonu ile açılır.
- İçerik iframe modal olarak gösterilir.
- Kapatma ve modal dışından imperative açma/kapatma store API'si desteklenir.

### Terrain Analysis

**Path:** `src/features/terrain-analysis/`
**Public API:** `TerrainAnalysisPanel`, `TerrainAnalysisTool`, `TerrainAspectLegend`, `TerrainSlopeLegend`, `useTerrainAnalysis`, `useTerrainAnalysisStore`, tipler

Terrain Analysis feature'ı AWS/Mapzen Terrarium DEM tile kaynağından yükseklik okuyarak bakı ve eğim analizleri üretir.

Modlar:

- `point-aspect`: Haritada seçilen tek noktada bakı, eğim ve yükseklik hesaplar.
- `polygon-aspect`: Seçili polygon içinde bakı yönü raster haritası üretir.
- `polygon-slope`: Seçili polygon içinde eğim yüzdesi raster haritası üretir.

Teknik davranış:

- `TerrainAnalysisTool`, `MapContainer` içinde mount edilir ve aktif tool durumunda harita tıklamalarını analiz noktasına çevirir.
- `useTerrainAnalysis`, renderer lifecycle, abort controller, panel state ve analiz çalıştırma fonksiyonlarını yönetir.
- `terrainTiles.ts`, Terrarium RGB değerlerini yüksekliğe decode eder.
- `terrainMath.ts`, Horn yöntemiyle eğim/bakı hesapları, global pixel dönüşümü, LOD seçimi ve çözünürlük hesaplarını içerir.
- Polygon analizlerinde maksimum alan 10.000 km²'dir.
- LOD sistemi alan ve en/boy oranına göre zoom ve raster boyutunu seçer; raster boyutu 64-640 aralığında tutulur.
- DEM okuma satır bazlı paralel promise gruplarıyla yapılır; analiz abort edilebilir.
- `TerrainAnalysisRenderer`, point aspect marker/ok/etiket, polygon slope raster ve polygon aspect raster katmanlarını yönetir.
- `TerrainSlopeLegend` ve `TerrainAspectLegend` harita üzerinde sürüklenebilir lejantlar olarak gösterilir.
- Slope ve aspect opaklığı panelden ayrı ayrı ayarlanır.

### Timeline

**Path:** `src/features/timeline/`
**Public API:** `useTimelineStore`, `STEP_MS`, `FilterMode`, `TimeStep`, `NumericFilter`, `TimelineState`

Timeline store-first bir feature'dır; görünür UI `src/features/map/controls/TimelineControl.tsx` içindedir.

- Store; aktiflik, daraltılmış durum, filtre modu, zaman adımı, oynatma hızı, tarih aralığı ve sayısal filtreyi tutar.
- Filtre modları: `cumulative`, `range`.
- Zaman adımları: `hour`, `day`, `week`, `month`, `year`.
- `TimelineControl`, tarihli en az 2 veri olduğunda aktif çalışır.
- Tarih filtresi `DataLayer` ve `useClustering` tarafından tüketilir.
- Sayısal filtre, veri özelliklerinden otomatik bulunan sayısal alanlara uygulanır.
- Root `src/stores/useTimelineStore.ts`, feature store'unu re-export eden bridge'tir.

### Video Modal

**Path:** `src/features/video-modal/`
**Public API:** `VideoModal`

Video Modal feature'ı eğitim videoları kütüphanesini iframe modal olarak açar.

- Durum `src/stores/useVideoModalStore.ts` içinde tutulur.
- `VideoModal` içerik URL'sini `${import.meta.env.BASE_URL}video-modal/index.html` olarak oluşturur.
- `SmartAssistant`, belirli bir video ID'siyle modalı açabilir.
- İframe `VIDEO_MODAL_READY` mesajı gönderdiğinde hedef video `PLAY_VIDEO` mesajıyla oynatılır.
- ESC, overlay tıklaması ve kapatma butonu desteklenir; kapanırken iframe `about:blank` yapılır.

### Visualization

**Path:** `src/features/visualization/`
**Public API:** `BubbleRenderer`, `BubbleSettings`, `useBubbleTooltip`, `BUBBLE_DEFAULT_FILL_COLOR`, `ChoroplethRenderer`, `useChoroplethTooltip`, `PointRenderer`, `DotDensitySettings`, `DotColorPicker`, dot-density sabitleri/helper'ları, `VisualizationManager`, `getVisualizationManager`, `useVisualizationLayerPersistence`

Visualization feature'ı il/ilçe tabanlı tematik render omurgasıdır.

- Desteklenen ana tipler: `choropleth`, `bubble`, `dot`.
- `VisualizationManager`, il ve ilçe GeoJSON dosyalarını GitHub raw URL'lerinden yükler, province/district index oluşturur ve ilgili renderer'a yönlendirir.
- İl verisi: `iller_tuik_standart.geojson`.
- İlçe verisi: `ilceler_key_react.geojson`.
- `ChoroplethRenderer`, renk sınıflandırması ve choropleth layer'larını üretir.
- `BubbleRenderer`, proportional/graduated bubble ve opsiyonel bivariate renk alanını üretir.
- `PointRenderer`, dot-density layer'larını ve backdrop fill/outline katmanlarını üretir.
- `labelLayers.ts`, isim ve değer etiketlerini tek/ayrı symbol layer mantığıyla uygular.
- `customRange.ts`, özel değer aralığı ve aralık dışı davranışını destekler.
- `useVisualizationLayerPersistence`, style değişimlerinde görselleştirme katmanlarını geri yüklemeye yardımcı olur.
- Public `ChoroplethSettings` bileşeni yoktur; eski referanslar güncel değildir.

### Viz Wizard

**Path:** `src/features/viz-wizard/`
**Public API:** `VizWizardStep1`, `VizWizardStep2`, `VizWizardStep3`, `WizardProgress`, `MapTitle`, `VizWizardSidebar`

Viz Wizard kullanıcıyı veri yüklemeden harita render'a kadar yönlendirir.

- Step 1: Excel/XLS/CSV dosya yükleme, sürükle-bırak, Excel temizlik uyarıları ve ilk kolon önerileri.
- Step 2: İl/ilçe matching, numeric locale seçimi, AG Grid tabanlı `DataMapperModal` ile tablo düzenleme ve yeniden matching.
- Step 3: Görselleştirme tipi, renk skalası, sınıflandırma, custom breaks, custom range, bubble/dot ayarları, veri dağılımı önizleme, veri modu, etiket/değer gösterimi, no-data rengi, sınır stili, lejant ayarı, map title ve render işlemi.
- `useVizRender`, render işlemini `VisualizationManager` üzerinden yapar; data-affecting ayarlarda full re-render, paint/display-only ayarlarda doğrudan property update uygulanır.
- `useVizSuggestion`, uygun sınıflandırma önerileri üretir.
- `MapTitle`, harita üzerinde konumlandırılabilir başlık/alt başlık sunar.

---

## Global Store Katmanı

`src/stores/` altında güncel store yüzeyi:

- `useVisualizationStore`: wizard state, pending Excel, raw data, kolon eşleme, match sonuçları, viz ayarları, GeoJSON cache/index, current visualization, color config, legend config, map title, excluded rows ve numeric locale.
- `useMapStore`: map instance, yüklenme durumu, zoom/center, aktif basemap, globe mode, kuzey oku görünürlüğü/stili/yönü/boyutu.
- `useToolStore`: aktif araç, ölçüm ve ileri analiz görünürlüğü, araç menüsü modu, mesafe ölçüm state'i.
- `useDataManagementStore`: drawn/imported data, aktif öğe, import durumu, layer styles, FAB pozisyonu, çizim state'i ve veri mutasyonları.
- `useClusteringStore`: cluster mode ve enabled state.
- `useHeatmapStore`: heatmap active/config/preset/panel state.
- `useInterpolationStore`: interpolation active/panel/config/result/processing/error/legend state.
- `useIsochroneStore`: erişilebilirlik modu, süreler, origin, isochrone/route data, loading/error ve route state.
- `useSpatialAnalysisStore`: aktif analiz, panel state, convex hull/Voronoi/nearest-points stil ve istatistikleri.
- `useTerrainAnalysisStore`: terrain active/panel/loading/error, mod, nokta sonucu, polygon seçimi, slope/aspect sonuçları ve opaklıkları.
- `useTimelineStore`: `src/features/timeline` store'unu re-export eder.
- `useStorymapModalStore`: storymap modal state ve imperative API.
- `useVideoModalStore`: video modal state, hedef video ID'si ve imperative API.

Veri store'u için güncel public yüzey `useDataManagementStore` adıdır.

---

## Shared ve Yardımcı Altyapı

### Shared

- `src/shared/analytics/`: Google Analytics script yükleme, event ve page view yardımcıları.
- `src/shared/ag-grid/`: AG Grid modül setleri ve Türkçe locale.
- `src/shared/visualization/`: visualization feature facade'ı.
- `src/shared/legend/`: legend feature facade'ı.
- `src/shared/northArrowStyles.tsx`: kuzey oku stil tanımları.

### Önemli Utils

- `classification.ts`, `colorInterpolation.ts`, `colorSchemes.ts`: sınıflandırma ve renk ölçeği altyapısı.
- `columnMapper/`: Excel/CSV parsing, kolon algılama ve veri eşleme yardımcıları.
- `geometryUtils.ts`, `geometryParser.ts`, `geometryTypeGuards.ts`: geometri okuma, doğrulama ve yardımcı işlemler.
- `mapExpressions.ts`: MapLibre expression yardımcıları.
- `legendClassCount.ts`: lejant sınıf sayısı kısıtları.
- `normalization.ts`: görselleştirme değer normalizasyonu.
- `numberFormatter.ts`: TR/EN numeric locale parse ve formatlama.
- `turkishNormalizer.ts`: Türkçe konum adlarını normalize etme ve plaka kodu eşleme.
- `symbolShapes.ts`: sembol şekli yardımcıları.
- `prng.ts`: deterministik dot-density dağıtımı için pseudo-random yardımcı.
- `indexedDbStorage.ts`: Zustand storage adapter'ı; güncel data-management store içinde aktif kullanılmıyor.

---

## Harici Servisler ve Ortam Değişkenleri

Güncel `.env.example` değişkenleri:

- `VITE_ORS_API_KEY`: OpenRouteService isochrone, directions ve elevation API istekleri için.
- `VITE_HGM_API_KEY`: HGM raster altlık endpoint'leri için.
- `VITE_GA_MEASUREMENT_ID`: Google Analytics için.

Harici kaynaklar:

- HGM Atlas raster altlıkları ve geocoder.
- OpenRouteService isochrone, directions ve elevation servisleri.
- AWS/Mapzen Terrarium DEM tile kaynağı.
- GitHub raw Türkiye il/ilçe GeoJSON kaynakları.
- jsDelivr/GitHub overlay shapefile ve TopoJSON kaynakları.
- Copernicus arazi örtüsü verisi.
- Google Analytics.

---

## Güncel Sınır Notları

- Feature envanteri `src/features/` altındaki 21 modüle göre tutulur.
- Import/export işlevleri `data-management` altındadır.
- `main.tsx` yalnız root render ve MapLibre uyarı filtresi içerir.
- `data-management` store'u aktif Zustand persist wrapper kullanmaz.
- `Terrain Analysis`, `point-aspect`, `polygon-aspect` ve `polygon-slope` modlarını destekler.
- `Layers` feature'ı `akarsular`, `sular`, `ulasim`, `dfy` ve `arazi_ortusu_2018` katmanlarını içerir.
- `Video Modal`, ayrı feature modülüdür ve `SmartAssistant` ile entegredir.
- `Visualization` public yüzeyi renderer'lar, ayar bileşenleri, tooltip hook'ları, `VisualizationManager` ve persistence hook'u üzerinden açılır.
- `BasemapSwitcher` production ortamında Carto/Esri seçeneklerini gizler; store daha geniş `BasemapType` setini destekler.
- `Timeline` UI'ı `map/controls/TimelineControl.tsx` altında render edilir.

---

## Referans Dosyalar

- `README.md`
- `ARCHITECTURE.md`
- `docs/ARCHITECTURE.md`
- `docs/COLOR_SCALE_FEATURES.md`
- `docs/COLOR_SCALE_INTEGRATION.md`
- `docs/CONTRIBUTING.md`
- `docs/FeatureList.md`
- `docs/PRD.md`
- `docs/TechStack.md`

---

**Bakım:** Development Team
**Son İnceleme:** 1 Mayıs 2026
