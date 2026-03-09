# Features Documentation

**Project:** CBS React Map Visualization Platform
**Last Updated:** 22 Şubat 2026

---

## Feature Overview

Bu proje 13 ana feature'dan oluşmaktadır. Her feature kendi domain'inden sorumludur ve bağımsız olarak geliştirilebilir. Feature'lar Vertical Slice Architecture prensibiyle organize edilir ve dışarıya `index.ts` barrel export üzerinden public API açar.

### Feature List

| Feature | Path | Description | Status |
|---------|------|-------------|--------|
| [Astronomy](#astronomy) | `src/features/astronomy/` | Güneş/Ay konum hesaplaması | Stable |
| [Basemap](#basemap) | `src/features/basemap/` | Altlık harita değiştirme | Stable |
| [Clustering](#clustering) | `src/features/clustering/` | Nokta kümeleme | Stable |
| [Data Import](#data-import) | `src/features/data-import/` | Dosya içe aktarma & parse | Stable |
| [Data Management](#data-management) | `src/features/data-management/` | Veri/katman yönetimi & çizim araçları | Stable |
| [Data Mapper](#data-mapper) | `src/features/data-mapper/` | Sütun eşleme & veri düzenleme | Stable |
| [Geocoder](#geocoder) | `src/features/geocoder/` | Adres arama & geocoding | Stable |
| [Globe View](#globe-view) | `src/features/globe-view/` | 3D küre görünümü | Beta |
| [Layers](#layers) | `src/features/layers/` | Overlay katman yönetimi | Stable |
| [Legend](#legend) | `src/features/legend/` | Lejant bileşenleri | Stable |
| [Map](#map) | `src/features/map/` | Çekirdek harita işlevselliği | Stable |
| [Visualization](#visualization) | `src/features/visualization/` | Görselleştirme render'ları (choropleth, bubble, dot) | Stable |
| [Viz Wizard](#viz-wizard) | `src/features/viz-wizard/` | Görselleştirme sihirbazı (3 adım) | Stable |

---

## Feature Details

### Astronomy

**Path:** `src/features/astronomy/`
**Purpose:** Güneş ve Ay konumlarını harita üzerinde hesapla ve göster

**Components:**
- `AstroPanel` - Astronomi kontrol paneli

**Hooks:**
- `useAstroMap` - Astronomi hesaplamaları ve harita entegrasyonu

**Stores:**
- `useAstroStore` - Astronomi state yönetimi

**Utils:**
- `astroUtils` - Astronomik hesaplama yardımcıları
- `eclipseUtils` - Tutulma hesaplama yardımcıları

**Dependencies:**
- `astronomy-engine` - Astronomik hesaplamalar

**Public API:**
```typescript
import { AstroPanel, useAstroMap, useAstroStore } from '@/features/astronomy'
```

---

### Basemap

**Path:** `src/features/basemap/`
**Purpose:** Farklı altlık harita sağlayıcıları arasında geçiş

**Components:**
- `BasemapSwitcher` - Altlık harita seçim UI

**Basemap Seçenekleri:**
- HGM Atlas: Temel, Uydu, Gece, Siyasi, Yükseklik
- CartoDB: Light (varsayılan), Dark, Voyager
- Esri: Satellite
- None (boş arka plan)

**Public API:**
```typescript
import { BasemapSwitcher } from '@/features/basemap'
```

---

### Clustering

**Path:** `src/features/clustering/`
**Purpose:** Harita üzerindeki noktaları kümeleme

**Hooks:**
- `useClustering` - Kümeleme mantığı

**Stores:**
- `useClusteringStore` - Kümeleme state

**Public API:**
```typescript
import { useClustering, useClusteringStore } from '@/features/clustering'
```

---

### Data Import

**Path:** `src/features/data-import/`
**Purpose:** Çeşitli dosya formatlarından veri içe aktarma

**Components:**
- `DataImportSection` - Ana içe aktarma UI
- `ColumnMapperModal` - Sütun eşleme modal'ı
- `ExportControls` - Dışa aktarma kontrolleri
- `UrlImporter` - URL tabanlı içe aktarma

**Hooks:**
- `useFileImport` - Dosya içe aktarma mantığı
- `useUrlImport` - URL içe aktarma mantığı
- `useDataExport` - Dışa aktarma mantığı

**Services:**
- `fileParser` - Dosya parse dispatcher
- `geoJsonProcessor` - GeoJSON işleme
- `excelProcessor` - Excel/CSV işleme (PapaParse + SheetJS)
- `kmlProcessor` - KML işleme (@tmcw/togeojson)
- `shapefileProcessor` - Shapefile işleme (shpjs)

**Utils:**
- `columnDetector` - Otomatik sütun tipi tespiti
- `dataMapper` - Veriyi GeoJSON öğelerine dönüştürme

**Constants:**
- `formats` - Desteklenen formatlar, kabul desenleri, sütun desenleri

**Desteklenen Formatlar:**
- Excel (.xlsx, .xls)
- CSV (.csv)
- GeoJSON (.geojson, .json)
- KML (.kml)
- Shapefile (.zip)

**Public API:**
```typescript
import {
  DataImportSection,
  ColumnMapperModal,
  ExportControls,
  UrlImporter,
  useFileImport,
  useUrlImport,
  useDataExport,
  parseFile,
  detectColumns,
  transformToGeoItems,
} from '@/features/data-import'
```

---

### Data Management

**Path:** `src/features/data-management/`
**Purpose:** Veri öğelerini yönetme, katman stilleri ve çizim araçları

**Components:**
- `DataManagementSection` - Ana veri yönetimi paneli
- `DataCatalogSection` - Veri kataloğu
- `DataCreationSection` - Yeni veri oluşturma
- `DataImportExportSection` - İçe/dışa aktarma bölümü
- `ImportedDataManagerFab` - Floating action button
- `ImportedDataTableModal` - İçe aktarılan veri tablosu modal'ı
- `ColumnMapperModal` - Sütun eşleme modal'ı
- `ExportControls` - Dışa aktarma kontrolleri
- `UrlImporter` - URL tabanlı içe aktarma

**Hooks:**
- `useFileImport` - Dosya içe aktarma
- `useUrlImport` - URL içe aktarma
- `useDataExport` - Dışa aktarma
- `useLayerStyleSync` - MapLibre paint property senkronizasyonu (INP optimizasyonu)

**Store:**
- `useDataManagementStore` - Veri öğeleri, çizim modu, katman stilleri, IndexedDB persist

**Types:**
- `DataItem`, `NewDataItem` - Veri öğe tipleri
- `DrawMode` - Çizim modları (none, point, polygon, line)
- `LayerStyles` - Katman stil konfigürasyonu
- `ColumnMapping`, `ParseResult`, `MapperData` - Veri eşleme tipleri
- `DataManagementStore` - Store interface

**Public API:**
```typescript
import {
  useDataManagementStore,
  DataManagementSection,
  ImportedDataManagerFab,
  useFileImport,
  useLayerStyleSync,
} from '@/features/data-management'
```

---

### Data Mapper

**Path:** `src/features/data-mapper/`
**Purpose:** Sütun eşleme ve AG Grid ile veri düzenleme

**Components:**
- `DataMapper` - Ana eşleme bileşeni
- `DataEditor` - AG Grid tabanlı spreadsheet düzenleyici
- `DataMapperModal` - Modal wrapper

**Hooks:**
- `useDataMapper` - Eşleme mantığı

**Özellikler:**
- Sütun eşleme
- AG Grid ile veri düzenleme
- Gerçek zamanlı validasyon
- Türkçe metin normalizasyonu

**Public API:**
```typescript
import { DataMapper, DataEditor, DataMapperModal } from '@/features/data-mapper'
```

---

### Geocoder

**Path:** `src/features/geocoder/`
**Purpose:** Adres arama ve geocoding

**Components:**
- `SearchContainer` - Arama UI

**Hooks:**
- `useGeocoder` - Geocoding mantığı

**Services:**
- `geocoderApi` - Geocoding API entegrasyonu

**Types:**
- `GeocoderResult` - Arama sonuç tipi

**Public API:**
```typescript
import { SearchContainer, useGeocoder } from '@/features/geocoder'
```

---

### Globe View

**Path:** `src/features/globe-view/`
**Purpose:** 2D/3D projeksiyon geçişi

**Components:**
- `GlobeToggleButton` - Küre modu geçiş butonu

**Hooks:**
- `useGlobeView` - Küre görünüm mantığı

**Public API:**
```typescript
import { GlobeToggleButton, useGlobeView } from '@/features/globe-view'
```

---

### Layers

**Path:** `src/features/layers/`
**Purpose:** Overlay katman yönetimi (il/ilçe sınırları, özel katmanlar)

**Components:**
- `LayersPanel` - Katman yönetim paneli

**Hooks:**
- `useOverlayLayers` - Overlay katman mantığı (toggle, opacity, color)

**Public API:**
```typescript
import { LayersPanel, useOverlayLayers } from '@/features/layers'
```

---

### Legend

**Path:** `src/features/legend/`
**Purpose:** Tüm görselleştirme tipleri için lejant bileşenleri

**Components:**
- `DynamicLegend` - Genel lejant
- `DotDensityLegend` - Nokta yoğunluğu lejantı
- `BubbleSizeLegend` - Bubble boyut lejantı
- `ColorLegend` - Gelişmiş renk lejantı
- `LegendBar` - Lejant çubuğu
- `LegendLabels` - Lejant etiketleri
- `SmartLabel` - Akıllı etiket konumlandırma
- `LegendConfig` - Konfigürasyon UI
- `LegendContainer` - Store bağlayıcısı

**Hooks:**
- `useLabelCollision` - Etiket çakışma tespiti

**Utils:**
- `itemGenerators` - Lejant öğe üreteçleri

**Types:**
- `LegendConfiguration` - Lejant konfigürasyon tipi
- `DynamicLegendProps`, `LegendBarProps`, `LegendLabelsProps`

**Lejant Tipleri:**
- Choropleth (renk skalası)
- Bubble (boyut skalası)
- Dot Density (1 nokta = X değer)

**Public API:**
```typescript
import {
  DynamicLegend,
  DotDensityLegend,
  BubbleSizeLegend,
  ColorLegend,
  LegendContainer,
  LegendConfig,
  useLabelCollision,
} from '@/features/legend'
```

---

### Map

**Path:** `src/features/map/`
**Purpose:** Çekirdek harita işlevselliği, kontroller, katmanlar ve araçlar

**Components:**
- `MapContainer` - Ana harita container'ı (react-map-gl/MapLibre GL)

**Controls:**
- `MapControlStack` - Kontrol yığını (hamburger, zoom, basemap, astro)
- `ZoomControls` - Yakınlaştırma/uzaklaştırma
- `GISToolsControl` - CBS araçları (buffer analizi, ölçüm)

**Layers:**
- `DataLayer` - Veri görselleştirme katmanı

**Tools:**
- `DistanceTool` - Mesafe ölçme aracı
- `DrawTool` - Çizim aracı (nokta, çizgi, poligon)

**Public API:**
```typescript
import {
  MapContainer,
  MapControlStack,
  ZoomControls,
  GISToolsControl,
  DataLayer,
  DistanceTool,
  DrawTool,
} from '@/features/map'
```

---

### Visualization

**Path:** `src/features/visualization/`
**Purpose:** Tüm görselleştirme tiplerinin render mantığı

**Alt Modüller:**

**Choropleth** (`visualization/choropleth/`):
- `ChoroplethRenderer` - Koreopleth render'ı
- `ChoroplethSettings` - Stil ayarları
- `useChoroplethTooltip` - Tooltip hook

**Bubble** (`visualization/bubble/`):
- `BubbleRenderer` - Bubble render'ı
- `BubbleSettings` - Stil ayarları
- `useBubbleTooltip` - Tooltip hook

**Point / Dot Density** (`visualization/point/`):
- `PointRenderer` - Nokta yoğunluğu render'ı
- `DotDensitySettings` - Ayarlar
- `DotColorPicker` - Nokta renk seçici
- Sabitler: `DEFAULT_DOT_SIZE`, `DEFAULT_DOT_COLOR`, `TARGET_TOTAL_DOTS`, vb.
- Yardımcılar: `buildZoomRadius`, `calculateSmartDotValue`

**Shared** (`visualization/shared/`):
- `VisualizationManager` - Orkestratör

**Hooks:**
- `useVisualizationLayerPersistence` - Basemap değişiminde katman koruma

**Public API:**
```typescript
import {
  ChoroplethRenderer, ChoroplethSettings, useChoroplethTooltip,
  BubbleRenderer, BubbleSettings, useBubbleTooltip,
  PointRenderer, DotDensitySettings, DotColorPicker,
  VisualizationManager,
  useVisualizationLayerPersistence,
} from '@/features/visualization'
```

---

### Viz Wizard

**Path:** `src/features/viz-wizard/`
**Purpose:** 3 adımlı görselleştirme sihirbazı

**Steps:**
- `VizWizardStep1` - Veri seçimi ve görselleştirme tipi
- `VizWizardStep2` - Sütun eşleme
- `VizWizardStep3` - Stil konfigürasyonu (renk, sınıflandırma, lejant)

**Components:**
- `WizardProgress` - İlerleme göstergesi
- `MapTitle` - Harita başlığı bileşeni
- `VizWizardSidebar` - Sidebar bölümü
- `ColorScale/` - Renk skalası bileşenleri
- `CustomRange/` - Özel aralık bileşenleri

**Hooks:**
- `useMatching` - Sütun eşleme mantığı (fuzzy matching)
- `useVizRender` - Görselleştirme render tetikleme (full re-render vs paint-only)

**Public API:**
```typescript
import {
  VizWizardStep1,
  VizWizardStep2,
  VizWizardStep3,
  WizardProgress,
  MapTitle,
  VizWizardSidebar,
} from '@/features/viz-wizard'
```

---

## Feature Dependencies

### Dependency Graph

```
┌─────────────────────┐
│     AppLayout       │ (Orchestrator)
└──────────┬──────────┘
           │
  ┌────────┼────────┬──────────┬──────────┬──────────┐
  │        │        │          │          │          │
┌─▼──┐  ┌─▼──┐  ┌──▼───┐  ┌──▼───┐  ┌───▼──┐  ┌───▼────┐
│Map │  │Viz │  │Data  │  │Legend│  │Geo   │  │Astro   │
│    │  │Wiz │  │Mgmt  │  │      │  │coder │  │nomy    │
└─┬──┘  └─┬──┘  └──┬───┘  └──┬───┘  └──────┘  └────────┘
  │       │        │         │
  │    ┌──▼──┐  ┌──▼───┐     │
  │    │Vis  │  │Data  │     │
  │    │     │  │Import│     │
  │    └─────┘  └──────┘     │
  │                          │
┌─▼──────────────────────────▼──┐
│   Shared (stores, utils,      │
│   types, constants, hooks)    │
└───────────────────────────────┘
```

### Cross-Feature Dependencies

| Feature | Depends On | Used By |
|---------|------------|---------|
| Map | Shared | Tüm feature'lar |
| Visualization | Shared | Viz Wizard, Legend |
| Viz Wizard | Visualization, Shared | Sidebar |
| Legend | Shared | AppLayout |
| Data Management | Shared | Sidebar, Map |
| Data Import | Shared | Data Management |
| Data Mapper | Shared | Sidebar |
| Layers | Shared | AppLayout |
| Geocoder | Shared | AppLayout |
| Astronomy | Shared | AppLayout |
| Clustering | Shared | AppLayout |
| Basemap | Shared | AppLayout (MapControlStack) |
| Globe View | Shared | AppLayout (SearchContainer) |

### Shared Infrastructure

Tüm feature'lar şu shared modüllere bağımlıdır:

| Modül | Path | İçerik |
|-------|------|--------|
| Global Stores | `src/stores/` | useVisualizationStore, useMapStore, useClusteringStore, useToolStore |
| Utils | `src/utils/` | classification, colorInterpolation, normalization, numberFormatter, vb. |
| Types | `src/types/` | visualization, geojson, maplibre-expressions, style |
| Constants | `src/constants/` | colorSchemes, layout |
| Shared Hooks | `src/hooks/` | useMediaQuery |
| UI Components | `src/components/ui/` | Slider, vb. |
| AG Grid | `src/shared/ag-grid/` | Locale, modules |
| Analytics | `src/shared/analytics/` | Google Analytics |

---

## Feature Status

### Maturity Overview

| Feature | Maturity | Documentation |
|---------|----------|---------------|
| Astronomy | Stable | Documented |
| Basemap | Stable | Documented |
| Clustering | Stable | Documented |
| Data Import | Stable | Documented |
| Data Management | Stable | Documented |
| Data Mapper | Stable | Documented |
| Geocoder | Stable | Documented |
| Globe View | Beta | Documented |
| Layers | Stable | Documented |
| Legend | Stable | Documented |
| Map | Stable | Documented |
| Visualization | Stable | Documented |
| Viz Wizard | Stable | Documented |

**Overall:**
- **Stable:** 12 features
- **Beta:** 1 feature (Globe View)
- **Total Feature Count:** 13

---

## Feature Guidelines

### Yeni Feature Oluşturma

Detaylı rehber: [CONTRIBUTING.md](./CONTRIBUTING.md#feature-development)

**Hızlı Kontrol Listesi:**
1. `src/features/<feature-name>/` klasörü oluştur
2. Alt klasörler: `components/`, `hooks/`, `services/` (gerektiğinde)
3. `index.ts` barrel export oluştur
4. Feature mantığını implement et
5. Bu dokümanı güncelle
6. Dependency graph'ı güncelle

### Feature Yapısı Şablonu

```
src/features/<feature-name>/
├── components/          # React bileşenleri
│   ├── MyComponent.tsx
│   └── index.ts         # (opsiyonel) bileşen barrel export
├── hooks/               # Custom hook'lar
│   └── useMyFeature.ts
├── services/            # API/iş mantığı servisleri
├── stores/              # Feature-specific Zustand store
├── utils/               # Yardımcı fonksiyonlar
├── constants/           # Sabitler
├── types.ts             # Tip tanımları
└── index.ts             # Public API (barrel export)
```

---

## References

- [Architecture Guide](./ARCHITECTURE.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Color Scale Features](./DATAWRAPPER_FEATURES.md)
- [Color Scale Integration](./DATAWRAPPER_INTEGRATION.md)

---

**Maintainers:** Development Team
**Last Review:** 22 Şubat 2026
**Next Review:** Monthly
