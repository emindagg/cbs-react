# CBS React - Sistem Mimarisi

Bu dokümantasyon, CBS React harita platformunun teknik mimarisini, bileşenler arası ilişkileri ve tasarım kararlarını detaylı olarak açıklar.

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Mimari Katmanlar](#mimari-katmanlar)
- [Feature-First Yapı](#feature-first-yapı)
- [State Yönetimi](#state-yönetimi)
- [Uygulama Akışı](#uygulama-akışı)
- [Harita Mimarisi](#harita-mimarisi)
- [Görselleştirme Pipeline](#görselleştirme-pipeline)
- [Veri İçe Aktarma Pipeline](#veri-içe-aktarma-pipeline)
- [Performans Stratejisi](#performans-stratejisi)
- [Tasarım Desenleri](#tasarım-desenleri)

---

## Genel Bakış

### Mimari Prensipler

1. **Vertical Slice Architecture**: Her feature kendi domain'ini kapsayan bağımsız bir dilim
2. **Feature-First Organization**: Teknik katman yerine iş alanına göre gruplama
3. **Public API via Barrel Exports**: Feature'lar arası iletişim yalnızca `index.ts` üzerinden
4. **Co-location**: Her feature kendi components/hooks/services/types dosyalarını barındırır
5. **Performance First**: `startTransition` + GPU-side paint updates ile düşük INP
6. **State Isolation**: Zustand store'ları feature bazlı, minimum cross-dependency
7. **Intentional Minimalism**: Gereksiz soyutlamalardan kaçınma

### Teknoloji Stack

```yaml
Frontend Framework: React 19 + TypeScript 5.9
Build Tool: Vite 7
Harita Engine: MapLibre GL JS (react-map-gl v8)
State Management: Zustand 5
Spatial Analysis: Turf.js 7
Data Grid: AG Grid 35
Styling: Tailwind CSS 4
Testing: Vitest + Testing Library
Animation: Framer Motion
Notifications: react-hot-toast
```

---

## Mimari Katmanlar

### Sistem Bileşenleri Diyagramı

```
┌─────────────────────────────────────────────────────────┐
│                   Entry Layer                            │
│  main.tsx → App.tsx → MapProvider → AppLayout           │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Orchestration Layer                         │
│  AppLayout.tsx → Sidebar.tsx                            │
│  Feature'ları public API üzerinden compose eder         │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                Feature Layer (13 Feature)                │
│  map │ visualization │ viz-wizard │ legend │ layers     │
│  data-management │ data-import │ data-mapper            │
│  astronomy │ basemap │ clustering │ geocoder │ globe    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Shared Infrastructure                       │
│  stores/ │ utils/ │ types/ │ constants/ │ hooks/        │
│  shared/ │ components/ui/ │ services/                   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│             External Libraries                           │
│  MapLibre GL │ Turf.js │ AG Grid │ chroma-js │ d3      │
└─────────────────────────────────────────────────────────┘
```

### Katman Kuralları

| Katman | İçe Aktarabilir | İçe Aktaramaz |
|--------|----------------|---------------|
| Entry | Orchestration, Shared | Feature (doğrudan) |
| Orchestration | Feature (public API), Shared | Feature (deep import) |
| Feature | Shared, Kendi içi | Başka Feature (deep import) |
| Shared | External Libraries | Feature |

---

## Feature-First Yapı

### Klasör Yapısı

```
src/
├── features/                    # Feature modülleri
│   ├── astronomy/               # Güneş/Ay konum hesaplaması
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── utils/
│   │   └── index.ts
│   ├── basemap/                 # Altlık harita değiştirme
│   ├── clustering/              # Nokta kümeleme
│   ├── data-import/             # Dosya içe aktarma & parse
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── index.ts
│   ├── data-management/         # Veri/katman yönetimi & çizim
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── index.ts
│   ├── data-mapper/             # Sütun eşleme & veri düzenleme
│   ├── geocoder/                # Adres arama
│   ├── globe-view/              # 3D küre görünümü
│   ├── layers/                  # Overlay katman yönetimi
│   ├── legend/                  # Lejant bileşenleri
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── map/                     # Çekirdek harita işlevselliği
│   │   ├── components/
│   │   ├── controls/
│   │   ├── hooks/
│   │   ├── layers/
│   │   ├── services/
│   │   ├── tools/
│   │   ├── utils/
│   │   └── index.ts
│   ├── visualization/           # Görselleştirme render'ları
│   │   ├── bubble/
│   │   ├── choropleth/
│   │   ├── point/
│   │   ├── shared/
│   │   ├── hooks/
│   │   └── index.ts
│   └── viz-wizard/              # Görselleştirme sihirbazı (3 adım)
│       ├── components/
│       ├── hooks/
│       ├── steps/
│       └── index.ts
├── stores/                      # Global Zustand store'lar
├── components/                  # Shared UI bileşenleri
│   ├── layout/
│   ├── sidebar/
│   └── ui/
├── shared/                      # Shared modüller
│   ├── ag-grid/
│   ├── analytics/
│   ├── legend/
│   └── visualization/
├── hooks/                       # Shared hook'lar
├── utils/                       # Utility fonksiyonlar
├── types/                       # Global tip tanımları
├── constants/                   # Sabitler
├── services/                    # Shared servisler
├── assets/                      # Statik dosyalar
└── test/                        # Test yardımcıları
```

### Barrel Export Kuralı

Her feature `index.ts` üzerinden public API açar. Deep import yasaktır ve ESLint ile enforce edilir.

```typescript
// ✅ Doğru
import { MapContainer, DataLayer } from '@/features/map'

// ❌ Yanlış (deep import)
import MapContainer from '@/features/map/components/MapContainer'
```

---

## State Yönetimi

### Zustand Store Mimarisi

```
┌──────────────────────────────────┐
│          Global Stores           │
│  (src/stores/)                   │
├──────────────────────────────────┤
│  useVisualizationStore           │  → Viz wizard state, settings, GeoJSON cache
│  useMapStore                     │  → Map instance, basemap, zoom, center
│  useClusteringStore              │  → Kümeleme on/off state
│  useToolStore                    │  → GIS araç state'i
│  useDataStore (bridge)           │  → data-management'a yönlendirme
└──────────────────────────────────┘

┌──────────────────────────────────┐
│        Feature Stores            │
│  (src/features/*/stores/)        │
├──────────────────────────────────┤
│  useDataManagementStore          │  → Veri öğeleri, çizim modu, katman stilleri
│  useAstroStore                   │  → Astronomi panel state
│  useClusteringStore (feature)    │  → Clustering konfigürasyonu
└──────────────────────────────────┘
```

### Store İlkeleri

1. **Persist**: `useDataManagementStore` IndexedDB'ye persist eder (büyük GeoJSON verisi için)
2. **Minimal Cross-Dependency**: Store'lar arası bağımlılık minimize edilir
3. **Derived State**: Mümkün olduğunca `useMemo` ile türetilir, store'da tutulmaz
4. **Transaction Safety**: `sanitizeVizSettings()` ile settings güncelleme güvenliği

---

## Uygulama Akışı

### Boot Sırası

```
index.html
  └── src/main.tsx
        ├── DEV modda: clearDevStorage() (localStorage, sessionStorage, caches, IndexedDB temizliği)
        └── createRoot → StrictMode
              └── App.tsx
                    ├── useGoogleAnalytics()
                    ├── MapProvider (react-map-gl)
                    ├── AppLayout
                    └── Toaster (react-hot-toast)
```

### AppLayout Orkestrasyon

```
AppLayout.tsx
  ├── Hook'lar (sırasıyla initialize):
  │   ├── useAstroMap()                    → Astronomi hesaplamaları
  │   ├── useClustering()                  → Kümeleme mantığı
  │   ├── useVisualizationLayerPersistence → Basemap değişiminde katman koruma
  │   └── useLayerStyleSync()              → Paint property senkronizasyonu
  │
  ├── Sidebar (sol panel):
  │   ├── SidebarHeader
  │   ├── SidebarTools → Sidebar sections
  │   └── SidebarFooter
  │
  ├── Map (ana alan):
  │   └── MapContainer → MapLibre GL
  │
  ├── Controls (üst sol):
  │   ├── MapControlStack
  │   │   ├── Hamburger (sidebar toggle)
  │   │   ├── ZoomControls
  │   │   ├── BasemapSwitcher
  │   │   └── Astronomy toggle
  │   └── SearchContainer + GlobeToggleButton
  │
  └── Overlay'ler:
      ├── AstroPanel
      ├── MapTitle
      ├── LegendContainer
      ├── LayersPanel
      └── ImportedDataManagerFab
```

---

## Harita Mimarisi

### MapLibre GL Entegrasyonu

react-map-gl kütüphanesi MapLibre GL JS üzerinde thin wrapper sağlar. `MapProvider` context'i tüm feature'ların harita instance'ına erişimini sağlar.

```
MapProvider (App.tsx)
  └── MapContainer (features/map)
        ├── Map component (react-map-gl/maplibre)
        ├── DataLayer (features/map/layers)
        ├── DistanceTool (features/map/tools)
        └── DrawTool (features/map/tools)
```

### Layer Hiyerarşisi

```
1. Basemap Style (land, water, roads, labels)
2. Overlay Layers (features/layers)
3. Visualization Layers
   ├── choropleth-fill, choropleth-outline
   ├── bubble-boundary-fill, bubble-circles
   └── dot-density-boundary, dot-density-dots
4. Data Management Layers (imported/drawn features)
5. Analysis Layers (buffer, heatmap)
6. Label & Marker Layers
```

### Basemap Tipleri

| Tip | Sağlayıcı | Açıklama |
|-----|-----------|----------|
| TEMEL | HGM Atlas | Standart harita |
| UYDU | HGM Atlas | Uydu görüntüsü |
| GECE | HGM Atlas | Gece modu |
| SIYASI | HGM Atlas | Siyasi sınırlar |
| YUKSEKLIK | HGM Atlas | Yükseklik haritası |
| CARTO_LIGHT | CartoDB | Açık tema (varsayılan) |
| CARTO_DARK | CartoDB | Koyu tema |
| CARTO_VOYAGER | CartoDB | Voyager stili |
| ESRI_SATELLITE | Esri | Uydu görüntüsü |
| NONE | - | Boş arka plan |

---

## Görselleştirme Pipeline

### Viz Wizard (3 Adımlı Sihirbaz)

```
Step 1: Veri ve Tip Seçimi
  ├── Veri dosyası yükleme veya mevcut veriyi seçme
  ├── Görselleştirme tipi: choropleth | bubble | dot-density
  └── Konum seviyesi: province | district

Step 2: Sütun Eşleme
  ├── Otomatik sütun tespiti (fuzzy matching)
  ├── Lokasyon, veri, ilçe sütunu eşleme
  └── Eşleme sonuçları: successful | ambiguous | failed

Step 3: Stil Konfigürasyonu
  ├── Renk ölçeği tipi: steps | continuous
  ├── Basamaklı sınıflandırma: jenks | equal | quantile | kmeans | custom
  ├── Sürekli preset'ler: equidistant | quantiles-4 | quantiles-5 | quantiles-10 | natural-9
  ├── Renk paleti ve özel aralık (min / center / max / outOfRangeMode)
  ├── Lejant ve harita başlığı konfigürasyonu
  └── useVizRender() üzerinden renderer tetikleme
```

Step 3 içinde renk ölçeği panelleri görselleştirme tipine göre koşullu açılır:

- `ColorScaleConfig` ve `ColorSchemePicker` yalnızca `choropleth` veya `bubble + colorColumn` senaryosunda görünür.
- `StepsSection` yalnızca `scaleType === 'steps'` iken, `dot` modunda değilken ve bubble tek renkli fallback'te değilken görünür.
- `CustomRangeConfig` ayrı bir kart olarak her tipte bulunur; alanlar toggle açıldığında aktifleşir.
- `BubbleSettings` ve `DotDensitySettings` renk ölçeği panelinden ayrı akışlardır.
- Akıllı öneri kartı pratikte yalnızca `choropleth` akışında görünür.

Renk ölçeği için ana veri akışı şu zincir üzerinden ilerler:

`steps/Step3/index.tsx` → `steps/Step3/useVizWizardStep3.ts` → `stores/useVisualizationStore.ts` → `hooks/useVizRender.ts` → `features/visualization/shared/VisualizationManager.ts` → renderer servisleri → `components/layout/AppLayout.tsx` içindeki `LegendContainer`

### Görselleştirme Tipleri

```
visualization/
├── choropleth/          # Koreopleth (renk kodlu bölgeler)
│   ├── ChoroplethRenderer.tsx
│   ├── ChoroplethSettings.tsx
│   └── useChoroplethTooltip.ts
├── bubble/              # Bubble (orantılı semboller)
│   ├── BubbleRenderer.tsx
│   ├── BubbleSettings.tsx
│   └── useBubbleTooltip.ts
├── point/               # Dot Density (nokta yoğunluğu)
│   ├── PointRenderer.tsx
│   ├── DotDensitySettings.tsx
│   └── DotColorPicker.tsx
└── shared/
    └── VisualizationManager.tsx
```

### Renk İnterpolasyon Sistemi

```
Step3 UI
  ├── ColorScale/Config.tsx
  ├── Step3/components/StepsSection.tsx
  ├── CustomRange/Config.tsx
  └── shared/legend/index.ts -> LegendConfig

Store + type sözleşmesi
  ├── types/visualization.ts
  │     ├── ColorScaleType = steps | continuous
  │     ├── ClassificationMethod = jenks | equal | quantile | kmeans | custom | stddev | continuous-*
  │     └── CustomRange = min | center | max | outOfRangeMode
  └── stores/useVisualizationStore.ts
        ├── vizSettings.classificationMethod
        ├── vizSettings.legendType
        ├── colorConfig.scaleType
        └── colorConfig.interpolation / customRange / legend

Utility katmanı
  ├── constants/colorSchemes.ts (paletler, interpolated palette üretimi)
  ├── utils/classification.ts (stepped break hesaplama)
  ├── utils/interpolation.ts (continuous preset bilgisi ve normalize etme)
  ├── utils/colorInterpolation.ts (UI'nin doğrudan açmadığı geniş renk uzayı araçları)
  └── utils/mapExpressions.ts (MapLibre step/interpolate expression üretimi)

Render + overlay katmanı
  ├── hooks/useVizRender.ts
  ├── features/visualization/shared/VisualizationManager.ts
  ├── choropleth/services/ChoroplethRenderer.ts
  ├── bubble/services/BubbleRenderer.ts
  ├── point/services/PointRenderer.ts
  └── legend/components/Container.tsx
```

Mimaride kritik ayrım şudur:

- `steps` modu store'da `legendType = 'discrete'` ve stepped break hesaplarıyla ilerler.
- `continuous` modu Step 3 tarafından `legendType = 'continuous'` ve `continuous-*` classification değerlerine map edilir.
- Renderer seviyesi stepped/continuous ayrımını `legendType` üzerinden expression seçerek uygular.
- Bubble görselleştirmede `colorColumn` yoksa renk ölçeği akışı render seviyesinde bypass edilir ve `symbolFillColor` veya varsayılan dolgu rengi kullanılır.
- `LegendContainer` runtime'da `DynamicLegend`, `ColorLegend`, `BubbleSizeLegend` veya `DotDensityLegend` bileşenlerinden uygun olanı seçer.

Bu konuda detaylı belge ayrımı korunur:

- `docs/COLOR_SCALE_FEATURES.md`: hangi özelliklerin kullanıcıya açık olduğu
- `docs/COLOR_SCALE_INTEGRATION.md`: Step 3 -> store -> renderer -> legend veri akışı

---

## Veri İçe Aktarma Pipeline

### Desteklenen Formatlar

| Format | Uzantı | İşleyici |
|--------|--------|----------|
| Excel | .xlsx, .xls | excelProcessor.ts |
| CSV | .csv | excelProcessor.ts (PapaParse) |
| GeoJSON | .geojson, .json | geoJsonProcessor.ts |
| KML | .kml | kmlProcessor.ts |
| Shapefile | .zip | shapefileProcessor.ts |

### İşlem Akışı

```
Kullanıcı dosya seçer
  └── useFileImport hook
        └── fileParser.ts (dispatcher)
              ├── Uzantıya göre işleyici seçimi
              ├── excelProcessor → PapaParse/SheetJS ile parse
              ├── geoJsonProcessor → doğrudan parse
              ├── kmlProcessor → toGeoJSON dönüşümü
              └── shapefileProcessor → shpjs ile parse
                    │
                    ▼
              ParseResult döner
              ├── needsMapping: true → ColumnMapperModal açılır
              │   └── columnDetector → otomatik sütun tespiti
              │       └── dataMapper → GeoJSON öğelerine dönüştürme
              └── items: DataItem[] → useDataManagementStore.addItems()
```

### Veri Dışa Aktarma

```
useDataExport hook
  ├── GeoJSON (.geojson)
  ├── KML (.kml)
  ├── Shapefile (.zip) → shp-write
  └── Excel (.xlsx) → SheetJS
```

---

## Performans Stratejisi

### 1. `startTransition` ile React Önceliklendirme

Ağır UI/state güncellemeleri transition olarak planlanır. Kullanıcı etkileşimleri (scroll, click) bloklanmaz.

### 2. GPU-Side Paint Updates

Stil değişimlerinde GeoJSON yeniden oluşturulmaz. Doğrudan MapLibre `setPaintProperty` / `setLayoutProperty` API'si kullanılır.

```
useLayerStyleSync hook
  ├── opacity → map.setPaintProperty('layer', 'fill-opacity', value)
  ├── color → map.setPaintProperty('layer', 'fill-color', value)
  └── width → map.setPaintProperty('layer', 'circle-radius', value)
```

### 3. Persist with IndexedDB

`useDataManagementStore` büyük GeoJSON verileri için IndexedDB storage kullanır (localStorage 5MB limitinden kaçınmak için).

### 4. Memoization

- `useMemo` ile hesaplama önbellekleme
- `useCallback` ile fonksiyon referans stabilitesi
- React 19 compiler optimizasyonları

### 5. Chunk-Based Data Loading

Büyük dosyalar chunk'lar halinde store'a eklenir, UI render bloklanmaz.

---

## Tasarım Desenleri

### Barrel Export Pattern

```typescript
// src/features/map/index.ts
export { MapContainer } from './components'
export { MapControlStack, ZoomControls } from './controls'
export { DataLayer } from './layers'
export { DistanceTool, DrawTool } from './tools'
```

### Orchestrator Pattern

`AppLayout.tsx` tüm feature'ları compose eder. Feature'lar birbirini bilmez, sadece shared store'lar üzerinden iletişim kurar.

### Hook Composition

Feature mantığı custom hook'larda kapsüllenir. Bileşenler sadece UI render'dan sorumludur.

```typescript
// Hook: iş mantığı
const { importFile, isLoading } = useFileImport()

// Component: sadece UI
<Button onClick={() => importFile(file)} disabled={isLoading} />
```

### Store Bridge Pattern

Eski import yollarını korumak için bridge store'lar kullanılır:

```typescript
// src/stores/useDataStore.ts
export { useDataManagementStore as useDataStore } from '@/features/data-management'
```

### Feature Isolation + ESLint Enforcement

Cross-feature deep import'lar ESLint kuralları ile engellenir:

```javascript
// eslint.config.js
'no-restricted-imports': ['error', {
  patterns: ['@/features/*/components/*', '@/features/*/hooks/*']
}]
```

---

**Son Güncelleme:** 25 Mart 2026
**Versiyon:** 2.0.1 (Görselleştirme ve renk ölçeği akışı güncellendi)
