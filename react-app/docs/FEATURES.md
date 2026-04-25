# Features Documentation

**Project:** CBS React Map Visualization Platform
**Last Updated:** 19 Nisan 2026

---

## Genel Bakış

Bu repo artık `src/features/` altında **21 feature modülü** içeriyor. Eski dokümanlardaki `13 feature` ifadesi güncel durumu yansıtmıyor.

Feature'lar hâlâ Vertical Slice yaklaşımıyla organize ediliyor, ancak hepsi aynı ağırlıkta değil:
- Bazıları tam feature paketi olarak `component + hook + service/renderer + store` içeriyor.
- Bazıları store-first davranıyor ve UI'si başka feature içinde mount ediliyor.
- Bazıları da tek bileşenli sunum feature'ı olarak çalışıyor.

Tüm feature'ların dışarı açtığı yüzey `index.ts` üzerinden tanımlanıyor. Bu doküman public API yüzeyini, gerçek runtime rolünü ve feature'lar arası güncel ilişkiyi kod tabanıyla hizalı şekilde özetler.

---

## Uygulama Orkestrasyonu

Güncel uygulama akışı:
1. `src/main.tsx`
   - Render öncesi `localStorage`, `sessionStorage`, `Cache Storage` ve mevcut `IndexedDB` verilerini temizler.
   - Ardından `App` bileşenini başlatır.
2. `src/App.tsx`
   - `MapProvider` ve `react-hot-toast` `Toaster` ile uygulama kabuğunu kurar.
   - `useGoogleAnalytics` hook'unu initialize eder.
3. `src/components/layout/AppLayout.tsx`
   - Uygulamanın gerçek orchestrator katmanıdır.
   - `Sidebar`, `MapContainer`, `SearchContainer`, `LayersPanel`, `AstroPanel`, `MapTitle`, `HeatmapPanel`, `SpatialAnalysisPanel`, `IsochronePanel`, `ElevationProfilePanel`, `LegendContainer`, `ImportedDataManagerFab`, `CoordinateDisplay` ve `StorymapModal` bileşenlerini compose eder.

`AppLayout` tek root orchestrator'dür; ancak tüm composition burada bitmez. Sidebar tarafında `Sidebar.tsx`, `VizWizardSidebar`, `DataMapperModal`, `DataManagementSection`, `ProjectExportSection` ve `DataImportSection` akışlarını kendi alanında birleştirir. Harita tarafında `MapContainer`, ölçüm araçları, veri katmanları, zaman çizelgesi ve ileri analiz araçlarının mount noktasıdır; ayrıca `data-management` ve `elevation-profile` gibi feature'lardan gelen parçaları da doğrudan compose eder.

---

## Güncel Feature Envanteri

| Feature | Path | Primary Public API | Güncel rol |
|---------|------|--------------------|------------|
| Astronomy | `src/features/astronomy/` | `AstroPanel`, `useAstroMap`, `useAstroStore`, astro utils | Güneş/Ay katmanları, astronomi paneli ve hesaplama yardımcıları |
| Basemap | `src/features/basemap/` | `BasemapSwitcher` | Altlık seçim UI'ı; gerçek raster çözümü `MapContainer` içinde |
| Clustering | `src/features/clustering/` | `useClusteringStore`, `useClustering` | Nokta kümelerini `normal / clustered / hidden` modlarında yönetir |
| Data Import | `src/features/data-import/` | `DataImportSection`, import hook'ları, parser servisleri | İnce import paketi; tam veri yaşam döngüsünün kanonik yeri değildir |
| Data Management | `src/features/data-management/` | `useDataManagementStore`, yönetim bileşenleri, import/export hook'ları | Çizim, imported data, persist, layer style ve tam export hattının ana feature'ı |
| Data Mapper | `src/features/data-mapper/` | `DataMapper`, `DataEditor`, `DataMapperModal` | AG Grid tabanlı eşleme ve veri düzenleme UI modülü |
| Elevation Profile | `src/features/elevation-profile/` | `ElevationProfilePanel`, `ElevationProfileTool`, `useElevationProfile` | Harita üzerinde rota/çizgi seçip yükselti profili üretir |
| Geocoder | `src/features/geocoder/` | `SearchContainer`, `useGeocoder` | Üst kontrol alanına gömülü arama ve geocoding akışı |
| Globe View | `src/features/globe-view/` | `useGlobeView`, `GlobeToggleButton` | Mercator/globe projeksiyon geçişi |
| Heatmap | `src/features/heatmap/` | `HeatmapPanel`, `useHeatmap`, `useHeatmapStore`, `HeatmapRenderer` | Nokta verilerinden yoğunluk tabanlı ısı haritası üretir |
| Interpolation | `src/features/interpolation/` | `InterpolationPanel`, `InterpolationLegend`, `useInterpolation`, `useInterpolationStore`, `InterpolationRenderer` | IDW/Kriging enterpolasyon analizi, vektör + pürüzsüz raster görünüm, sürüklenebilir lejant |
| Isochrone | `src/features/isochrone/` | `IsochronePanel`, `useIsochrone`, `useIsochroneStore` | Erişilebilirlik analizi, isochrone ve rota akışı |
| Layers | `src/features/layers/` | `LayersPanel`, `useOverlayLayers` | Hazır overlay katmanlarını yükler ve stillerini yönetir |
| Legend | `src/features/legend/` | `LegendContainer`, `DynamicLegend`, `ColorLegend`, `BubbleSizeLegend`, `DotDensityLegend` | Görselleştirme tipine göre uygun legend bileşenini seçer |
| Map | `src/features/map/` | `MapContainer`, `MapControlStack`, `DataLayer`, araç/controls export'ları | Çekirdek harita kabuğu, tool mount noktası, veri katmanları ve harita domain'i içinde ikincil orchestration katmanı |
| Spatial Analysis | `src/features/spatial-analysis/` | `SpatialAnalysisPanel`, `useSpatialAnalysis`, renderer'lar | Convex hull, Voronoi ve nearest-points analizi |
| Storymap Modal | `src/features/storymap-modal/` | `StorymapModal` | Storymap içeriğini iframe modal olarak gösterir |
| Terrain Analysis | `src/features/terrain-analysis/` | `TerrainAnalysisPanel`, `TerrainAnalysisTool`, `useTerrainAnalysis` | AWS/Mapzen Terrarium DEM tile kaynağıyla nokta tabanlı bakı/eğim analizi |
| Timeline | `src/features/timeline/` | `useTimelineStore`, `STEP_MS`, timeline tipleri | Zaman tabanlı filtreleme ve oynatma durumu; UI `map` feature içinde |
| Visualization | `src/features/visualization/` | renderer'lar, tooltip hook'ları, `VisualizationManager`, `useVisualizationLayerPersistence` | Choropleth, bubble ve dot-density render orkestrasyonu |
| Viz Wizard | `src/features/viz-wizard/` | `VizWizardStep1`, `VizWizardStep2`, `VizWizardStep3`, `VizWizardSidebar`, `MapTitle` | İçe aktarma, eşleme, render ve harita sunum ayarlarını yöneten sihirbaz |

---

## Feature Detayları

### Astronomy

**Path:** `src/features/astronomy/`
**Public API:** `AstroPanel`, `useAstroMap`, `useAstroStore`, `astroUtils`, `eclipseUtils`

Gerçek kapsam dokümanın eski sürümündekinden daha geniştir.
- Bileşenler: `AstroPanel`, `MoonPhaseDisplay`
- Hook'lar: `useAstroMap`, `useAstroLayers`, `useAstroInteraction`, `useAstroData`
- Store: `useAstroStore`
- Yardımcılar: `astroUtils`, `eclipseUtils`, `sunVisual`, `moonPhaseVisual`

Feature panel kontrollü Güneş/Ay görselleştirmelerini ve ilgili hesaplama yardımcılarını sağlar.

### Basemap

**Path:** `src/features/basemap/`
**Public API:** `BasemapSwitcher`

Bu feature altlık seçim UI'ıdır; gerçek tile endpoint çözümü `src/features/map/components/MapContainer.tsx` içinde yapılır.
- Görünür UI seçenekleri: `CARTO_LIGHT`, `ESRI_SATELLITE`, `TEMEL`, `UYDU`, `GECE`, `SIYASI`, `YUKSEKLIK`, `NONE`
- Store ve `MapContainer` tarafında ek olarak `CARTO_DARK` ve `CARTO_VOYAGER` desteği vardır, ancak switcher UI'ında görünmez.
- Seçim durumu `useMapStore` üzerinden tutulur.

### Clustering

**Path:** `src/features/clustering/`
**Public API:** `useClusteringStore`, `ClusterMode`, `useClustering`

Bu feature yalnız bir toggle değildir.
- Üç modlu davranış: `normal`, `clustered`, `hidden`
- `useClustering` hook'u görünür nokta verilerini `data-management`, zaman filtresini `timeline`, map instance'ını `useMapStore` üzerinden okur.
- Runtime'da `clustered-points-source`, `clusters-layer`, `cluster-count-layer` ve `unclustered-point-layer` oluşturur.

### Data Import

**Path:** `src/features/data-import/`
**Public API:** `DataImportSection`, `ColumnMapperModal`, `ExportControls`, `UrlImporter`, `useFileImport`, `useUrlImport`, `useDataExport`, parser servisleri, mapper util'leri

Bu feature repoda hâlâ ayrı bir import paketi olarak duruyor, ancak veri yaşam döngüsünün kanonik alanı değildir.
- Parser zinciri: `fileParser`, `geoJsonProcessor`, `excelProcessor`, `kmlProcessor`, `shapefileProcessor`
- Yardımcılar: `detectColumns`, `transformToGeoItems`, format sabitleri
- Hook'lar veri yazarken `useDataStore` kullanır; bu store bağımsız bir domain store değil, `useDataManagementStore` için compatibility bridge'dir.
- `useDataExport` yüzeyi sınırlıdır; tam export kabiliyeti `data-management` tarafındadır.

### Data Management

**Path:** `src/features/data-management/`
**Public API:** `useDataManagementStore`, `DataCatalogSection`, `DataCreationSection`, `DataImportSection`, `DataManagementDrawTool`, `DataManagementSection`, `ImportedDataManagerFab`, `ImportedDataTableModal`, `ColumnMapperModal`, `ExportControls`, `UrlImporter`, `ProjectExportSection`, `useDataExport`, `useFileImport`, `useLayerStyleSync`, `useUrlImport`

Bu feature projenin kanonik veri domain'idir.
- Store `src/stores/useDataManagementStore.ts` içinde tutulur; feature altındaki `store/useDataManagementStore.ts` sadece re-export yapar.
- Imported/drawn item ayrımı, draw mode, selected item, imported source visibility, layer style ve FAB konumu burada yönetilir.
- Persist katmanı `indexedDbStorage` üzerinden çalışır.
- `useLayerStyleSync`, MapLibre paint/layout property güncellemelerini doğrudan uygular.
- Export zinciri burada daha tamdır: GeoJSON, KML, SHP ve XLSX exporter servisleri bulunur.

### Data Mapper

**Path:** `src/features/data-mapper/`
**Public API:** `DataMapper`, `DataEditor`, `DataMapperModal`

Bu feature bir hook/service paketi değil, interaktif bir veri eşleme ve düzenleme UI modülüdür.
- AG Grid tabanlı editor/grid katmanı içerir.
- İç bileşenler: `Editor`, `Grid`, `Modal`, `ModalToolbar`, `SidebarForm`, `CorrectionPanel`, `StatusCell`
- İç hook: `useColumns`
- Dışarı açılan public hook bulunmaz.

### Elevation Profile

**Path:** `src/features/elevation-profile/`
**Public API:** `ElevationProfilePanel`, `ElevationProfileTool`, `useElevationProfile`, `useElevationProfileStore`, tipler

Feature iki parçalı çalışır.
- `ElevationProfileTool`, `MapContainer` içinde mount edilir ve waypoint/çizgi etkileşimini yönetir.
- `ElevationProfilePanel`, `AppLayout` içinde mount edilir.
- `useElevationProfile` akışı yükseklik verisi, istatistik, aktif nokta ve finalize işlemlerini orkestre eder.
- API katmanı `services/elevationProfileApi.ts` içindedir.

### Geocoder

**Path:** `src/features/geocoder/`
**Public API:** `SearchContainer`, `useGeocoder`

Geocoder feature yalnızca bir arama kutusu değildir.
- `SearchContainer`, `AppLayout` içinde üst kontrol alanında kullanılır.
- `SearchResults`, `geocoderService`, `types/atlasGeocoder.ts` dosyaları feature'ın gerçek kapsamındadır.
- Eski dokümandaki `geocoderApi` adı güncel değildir; gerçek servis adı `geocoderService`'dir.
- Aynı alan globe toggle, layers panel durumu ve storymap açma davranışıyla entegredir.

### Globe View

**Path:** `src/features/globe-view/`
**Public API:** `useGlobeView`, `GlobeToggleButton`

Feature kendi başına harita sahnesi kurmaz; `map` feature ile birlikte çalışır.
- `useGlobeView`, MapLibre `setProjection` ile `mercator / globe` geçişini yapar.
- `GlobeToggleButton` toggle UI yüzeyidir.
- Globe görünümündeki uzay arka planı ve koyu background layer uygulaması `MapContainer` içinde yapılır.

### Heatmap

**Path:** `src/features/heatmap/`
**Public API:** `HeatmapPanel`, `useHeatmap`, `useHeatmapStore`, `HeatmapRenderer`, tipler

Feature imported/drawn nokta verilerinden yoğunluk haritası üretir.
- `GISToolsControl` aktivasyonu tetikler.
- `AppLayout` paneli mount eder.
- `useHeatmap` sayısal alanlar, preset'ler ve görünür veri üzerinden konfigürasyonu yönetir.
- `HeatmapRenderer` MapLibre katman üretiminden sorumludur.

### Interpolation

**Path:** `src/features/interpolation/`
**Public API:** `InterpolationPanel`, `InterpolationLegend`, `useInterpolation`, `useInterpolationStore`, `InterpolationRenderer`, tipler

Feature, nokta verilerinden IDW/Kriging tabanlı enterpolasyon yüzeyi üretir.
- Aktivasyon `GISToolsControl` üzerinden yapılır; panel `AppLayout` içinde mount edilir.
- Hesaplama tarafında ağır işlemler Web Worker'da yürütülür (`interpolation.worker.ts`), render tarafı `InterpolationRenderer` ile yönetilir.
- `gridType` modları: vektör (`square`, `triangle`, `hex`, `isoband`) + raster (`smooth` / pürüzsüz).
- Pürüzsüz modda sonuç raster olarak üretilir; renkleme canvas + image source + raster layer akışıyla uygulanır.
- `InterpolationLegend` harita üstünde floating/sürüklenebilir çalışır; başlığı kullanıcı düzenleyebilir.
- Nokta değerlerini harita üzerinde gösterme seçeneği vardır; değer katmanları dolgu/raster katmanlarının üstüne taşınacak şekilde yönetilir.
- İş kuralı: `smooth` modunda sınıflandırılmış semboloji desteklenmez; UI tarafında seçenek gizlenir, renderer tarafında efektif semboloji `stretch`e düşürülür (tek kaynak kuralı: `symbologyConstraints.ts`).

### Isochrone

**Path:** `src/features/isochrone/`
**Public API:** `IsochronePanel`, `useIsochrone`, `useIsochroneStore`, tipler

Feature erişilebilirlik analizi akışını yönetir.
- Servisler: `isochroneApi`, `IsochroneRenderer`, `RouteRenderer`
- Panel `AppLayout` içinde mount edilir.
- Aktivasyon `GISToolsControl` üzerinden yapılır.
- Harita etkileşiminden başlangıç noktası alır, süre halkaları ve rota akışını yönetir.

### Layers

**Path:** `src/features/layers/`
**Public API:** `LayersPanel`, `useOverlayLayers`

Bu feature overlay layer yönetimi için iki parçalıdır.
- `LayersPanel` sadece UI render eder.
- Asıl yükleme ve stil yönetimi `useOverlayLayers` hook'unda bulunur.
- Overlay seti config tabanlıdır ve şu an `akarsular`, `sular`, `ulasim`, `dfy` katmanlarını yönetir.
- Hook, shapefile zip kaynaklarını `shpjs` ile alır ve `styledata` sonrası source/layer durumunu yeniden uygular.

### Legend

**Path:** `src/features/legend/`
**Public API:** `DynamicLegend`, `DotDensityLegend`, `BubbleSizeLegend`, `ColorLegend`, `LegendBar`, `LegendLabels`, `SmartLabel`, `LegendConfig`, `LegendContainer`, `useLabelCollision`, tipler

Legend feature yalnızca statik bileşen listesi değildir; seçim mantığı içerir.
- `LegendContainer`, store durumuna ve viz tipine göre uygun legend bileşenini seçer.
- Dot-density için `DotDensityLegend`, tek değişkenli bubble için çoğunlukla `BubbleSizeLegend`, choropleth ve bazı bubble senaryoları için `DynamicLegend` veya `ColorLegend` kullanılır.
- `DynamicLegend` sürükle-bırak, başlık inline edit ve etiket çakışma yönetimi içerir.
- Yardımcılar: `itemGenerators`, `collapseConsecutiveLabels`, `disambiguateBoundaryLabels`, `selectEvenlySpacedItems`

### Map

**Path:** `src/features/map/`
**Public API:** `MapContainer`, `MapControlStack`, `ZoomControls`, `GISToolsControl`, `CoordinateDisplay`, `GeolocationButton`, `useCoordinateDisplay`, `useGeolocation`, `DataLayer`, `DistanceTool`, `DrawTool`

Bu feature çekirdek harita kabuğudur.
- `MapContainer` içinde raster basemap source/layer, `DistanceTool`, `ElevationProfileTool`, `DataManagementDrawTool`, `DataLayer`, `GISToolsControl` ve `TimelineControl` mount edilir.
- Harita dışı yardımcı kontroller `DraggableScaleControl`, `DraggableNorthArrow` ve `MapCompass` ile tamamlanır.
- `MapControlStack`, sidebar toggle, zoom, geolocation, injected basemap control ve astronomy toggle içerir.
- `GISToolsControl` yalnız ölçüm değil; buffer, clustering, heatmap, isochrone, convex hull, voronoi, nearest points, bakı analizi, elevation profile, screenshot ve temizleme aksiyonlarını tetikler.

### Spatial Analysis

**Path:** `src/features/spatial-analysis/`
**Public API:** `SpatialAnalysisPanel`, `useSpatialAnalysis`, `useSpatialAnalysisStore`, `ConvexHullRenderer`, `VoronoiRenderer`, `NearestPointsRenderer`, tipler

Feature ileri mekânsal analiz araçlarını toplar.
- Panel `AppLayout` içinde mount edilir.
- Aktivasyon `GISToolsControl` içindeki `convex-hull`, `voronoi`, `nearest-points` aksiyonlarıyla yapılır.
- Analizler görünür veri noktalarından türetilir.
- Renderer'lar sonuç katmanlarını haritaya uygular.

### Storymap Modal

**Path:** `src/features/storymap-modal/`
**Public API:** `StorymapModal`

Bu feature tek bileşenli bir sunum katmanıdır.
- `AppLayout` içinde sürekli mount edilir.
- Durum yönetimi `src/stores/useStorymapModalStore.ts` içindedir.
- Storymap içeriğini iframe modal olarak açar; kapatma ve yeni sekmede açma akışlarını destekler.

### Terrain Analysis

**Path:** `src/features/terrain-analysis/`
**Public API:** `TerrainAnalysisPanel`, `TerrainAnalysisTool`, `useTerrainAnalysis`, `useTerrainAnalysisStore`, tipler

Feature nokta tabanlı arazi bakı/eğim analizini yönetir.
- Aktivasyon `GISToolsControl` içindeki `Bakı Analizi` aksiyonuyla yapılır.
- `TerrainAnalysisTool`, `MapContainer` içinde mount edilir ve aktif araçta harita tıklamasını analiz noktasına çevirir.
- AWS/Mapzen Terrarium DEM tile kaynağı doğrudan frontend'den okunur; RGB değerleri yükseklik değerine decode edilir.
- 3x3 komşuluk üzerinde Horn yöntemiyle bakı, eğim ve merkez yükseklik hesaplanır.
- Sonuç `TerrainAnalysisRenderer` ile marker, yön oku ve etiket olarak haritaya uygulanır; `TerrainAnalysisPanel` sonucu Türkçe gösterir.

### Timeline

**Path:** `src/features/timeline/`
**Public API:** `useTimelineStore`, `STEP_MS`, `FilterMode`, `TimeStep`, `NumericFilter`, `TimelineState`

Timeline store-first bir feature'dır.
- Asıl mantık `src/features/timeline/stores/useTimelineStore.ts` içindedir.
- Root store katmanındaki `src/stores/useTimelineStore.ts` yalnız re-export bridge'tir.
- Görsel kontrol `src/features/map/controls/TimelineControl.tsx` içinde sunulur.
- `DataLayer` ve `clustering` tarafı timeline filtresini tüketir.

### Visualization

**Path:** `src/features/visualization/`
**Public API:** `BubbleRenderer`, `BubbleSettings`, `useBubbleTooltip`, `ChoroplethRenderer`, `useChoroplethTooltip`, `PointRenderer`, `DotDensitySettings`, `DotColorPicker`, dot-density sabitleri/helper'ları, `VisualizationManager`, `useVisualizationLayerPersistence`

Visualization feature eski dokümandaki bazı iddialardan farklıdır.
- `ChoroplethSettings` diye bir public bileşen yoktur.
- `point` alt modülü fiilen dot-density odaklıdır.
- `VisualizationManager`, il/ilçe GeoJSON yükleme, index oluşturma ve `choropleth / bubble / dot-density` yönlendirmesini yapar.
- Önemli yardımcı dosyalar: `shared/labelLayers.ts`, `shared/customRange.ts`
- `useVisualizationLayerPersistence`, style değişimlerinde katman geri yükleme akışını yönetir.

### Viz Wizard

**Path:** `src/features/viz-wizard/`
**Public API:** `VizWizardStep1`, `VizWizardStep2`, `VizWizardStep3`, `WizardProgress`, `MapTitle`, `VizWizardSidebar`

Adım açıklamaları eski dokümandan farklıdır.
- Step 1: Dosya yükleme ve ilk veri alma akışı
- Step 2: GeoJSON matching ve `DataMapperModal` ile eşleme/düzenleme
- Step 3: Görselleştirme tipi seçimi, render tetikleme, renk skalası, bubble/dot ayarları, custom breaks, custom range, map title ve legend ayarları
- Önemli iç hook'lar: `useMatching`, `useVizRender`, `useVizSuggestion`, `steps/Step3/useVizWizardStep3`
- Önemli iç modüller: `ColorScale`, `CustomRange`, `ColorSchemePicker`, `StyleConfig`, `MatchResults`

---

## Global Store ve Shared Altyapı

### Global Store'lar

`src/stores/` altında güncel olarak şu store yüzeyleri bulunur:
- `useVisualizationStore`: görselleştirme konfigürasyonu, map title, legend ilişkileri
- `useMapStore`: map instance, basemap, globe mode, yüklenme durumu
- `useToolStore`: aktif araçlar ve tools menu durumu
- `useDataManagementStore`: kanonik veri store'u
- `useDataStore`: `useDataManagementStore` için compatibility alias
- `useClusteringStore`: clustering modu
- `useHeatmapStore`: heatmap durumu ve preset'leri
- `useIsochroneStore`: isochrone durumu
- `useSpatialAnalysisStore`: ileri analiz durumu
- `useTerrainAnalysisStore`: nokta tabanlı bakı/eğim analizi durumu
- `useStorymapModalStore`: storymap modal açık/kapalı durumu
- `useTimelineStore`: feature-level timeline store'u re-export eden bridge

Not: Her feature kendi local store'una sahip değildir. Özellikle `visualization`, `legend` ve `viz-wizard` omurgasını büyük ölçüde `useVisualizationStore` taşır.

### Shared Modüller

`src/shared/` altında güncel shared yüzeyler:
- `src/shared/analytics/`: Google Analytics init ve tracking hook'ları
- `src/shared/ag-grid/`: ortak AG Grid modül setleri ve Türkçe locale
- `src/shared/visualization/index.ts`: feature sınırını koruyan visualization facade'ı
- `src/shared/legend/index.ts`: legend facade'ı
- `src/shared/northArrowStyles.tsx`: kuzey oku stilleri

---

## Önemli Güncelleme Notları

Bu dokümanın önceki sürümüne göre düzeltilen başlıca noktalar:
- Feature sayısı `13` değil `20`
- `Map` feature kapsamı artık zaman çizelgesi, yükselti profili aracı ve geniş GIS tools menüsünü de içeriyor
- `Layers` feature'ı genel “il/ilçe sınırları” anlatısından ziyade belirli overlay katalogları etrafında çalışıyor
- `Data Import` ile `Data Management` artık ayrı sorumluluklarla belgeleniyor; kanonik veri yaşam döngüsü `data-management` tarafında
- `Data Mapper` public hook açmıyor; esas olarak düzenleme/eşleme UI modülü
- `Interpolation` feature'ı eklendi: IDW/Kriging, pürüzsüz raster görünüm, floating lejant ve nokta değer label katmanları
- Pürüzsüz modda semboloji davranışı netleştirildi: sınıflandırma değil sürekli geçiş
- `Visualization` tarafında `ChoroplethSettings` public API'si yok
- `Viz Wizard` adımlarının rolü değişmiş durumda; özellikle Step 3 yalnız stil ayarı değil, render ve sunum ayarlarının merkezi
- `Geocoder` servis adı `geocoderApi` değil `geocoderService`
- `Timeline` store-first bir feature; UI yüzeyi `map` feature içinde sunuluyor

---

## Referanslar

- `docs/ARCHITECTURE.md`
- `docs/COLOR_SCALE_FEATURES.md`
- `docs/COLOR_SCALE_INTEGRATION.md`
- `docs/CONTRIBUTING.md`
- `README.md`

---

**Maintainers:** Development Team
**Last Review:** 19 Nisan 2026
