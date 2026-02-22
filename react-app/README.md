# CBS React Map Platform

Feature-first (Vertical Slice) mimariye sahip bir React 19 + TypeScript 5 harita platformu. MapLibre GL üzerinde büyük veriyle çalışan görselleştirmeler (choropleth / dot density / bubble), çoklu dosya formatı içe aktarma, overlay katman yönetimi, CBS araçları ve performans odaklı stil güncellemeleri içerir. 13 bağımsız feature modülünden oluşur.

## Başlangıç

```bash
npm install
npm run dev
```

Varsayılan geliştirme adresi: `http://localhost:5173`

## Kullanılan Teknolojiler

- **React 19** + **TypeScript 5.9** (strict mode)
- **Vite 7** (build & dev server)
- **MapLibre GL** + **react-map-gl** v8 (harita motoru)
- **Zustand 5** (state management, IndexedDB persist)
- **Tailwind CSS 4** (styling)
- **AG Grid 35** (veri tablosu & düzenleme)
- **Turf.js 7** (mekansal analiz)
- **Vitest** + **Testing Library** (test)
- **ESLint** (feature-boundary kuralları dahil)
- **Framer Motion** (animasyon)
- **chroma-js** + **d3** (renk interpolasyonu)

## Komutlar

```bash
# Development
npm run dev
npm run build
npm run preview

# Lint
npm run lint
npm run lint:fix
npm run lint:strict

# Test
npm run test
npm run test:run
npm run test:coverage
npm run test:ui
npm run test:watch
```

## Mimari: Vertical Slice (Feature-First)

Kod tabanı 13 bağımsız feature modülü olarak organize edilir. Her feature kendi `components/hooks/services/types` alt yapısını taşır ve dışarıya `index.ts` üzerinden public API açar.

**Feature'lar:** astronomy, basemap, clustering, data-import, data-management, data-mapper, geocoder, globe-view, layers, legend, map, visualization, viz-wizard

### Sınırlar

- Root orchestrator katmanı (`AppLayout.tsx`) feature'ları public API üzerinden compose eder.
- Feature içinden başka feature'a deep import yasaktır ve ESLint ile enforce edilir.
- State paylaşımı yalnızca `src/stores/` altındaki global Zustand store'lar üzerinden yapılır.

### Uygulama Akışı

- Boot: `index.html` → `main.tsx` → `App.tsx` (MapProvider + Toaster)
- Orkestrasyon: `AppLayout.tsx` (Sidebar + MapContainer + Controls + Overlays)
- Harita: `MapContainer` → `DataLayer` → Visualization Layers

## Dosya İçe Aktarma Pipeline

Excel/CSV/GeoJSON/KML/Shapefile dosyaları `data-import` feature'ı üzerinden parse edilir.

Pipeline:
1. UI tetikleme → `DataImportSection` bileşeni
2. Hook: `useFileImport` → dosya tipi algılama
3. Dispatcher: `fileParser` → uzantıya göre işleyici seçimi
4. İşleyiciler: `excelProcessor`, `geoJsonProcessor`, `kmlProcessor`, `shapefileProcessor`
5. Sonuçlar: `useDataManagementStore.addItems()` ile store'a eklenir

Desteklenen formatlar: GeoJSON, Excel (.xlsx/.xls), CSV, KML, Shapefile (.zip)

## Harita Performansı: `startTransition` + GPU `setPaintProperty`

Bu projede INP düşürmek için iki ana strateji birlikte kullanılır:

### 1) React tarafında önceliklendirme (`startTransition`)

Ağır UI/state güncellemeleri kullanıcı etkileşimlerini bloklamayacak şekilde transition olarak planlanır.

### 2) Stil güncellemelerini veri yeniden üretiminden ayırma (GPU-side)

Layer style değişimlerinde GeoJSON yeniden inşa edilmez. `useLayerStyleSync` hook'u doğrudan MapLibre `setPaintProperty` / `setLayoutProperty` API'sini kullanır.

Bu sayede:
- CPU tarafındaki veri dönüşümü azaltılır
- Map katman güncellemeleri GPU pipeline'da daha hızlı işlenir
- Etkileşim gecikmesi ciddi şekilde düşer

Ek olarak `useVizRender` hook'u full re-render ile paint-only update arasında ayrım yapar. INP değeri yaklaşık **~16ms** seviyesindedir.

## Test ve Kalite

- Vitest `jsdom` ortamı
- Coverage threshold: `%70` (line/function/branch/statement)
- TypeScript strict mode
- ESLint: import boundary kuralları dahil

> Not: Güncel coverage durumu için `npm run test:coverage` çalıştırıp `coverage/index.html` dosyasını referans alın.

## Dokümantasyon

Detaylı teknik dokümanlar:
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Mimari, katmanlar, state yönetimi
- [docs/FEATURES.md](docs/FEATURES.md) - 13 feature'ın detaylı dökümü
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) - Geliştirme rehberi
- [docs/DATAWRAPPER_FEATURES.md](docs/DATAWRAPPER_FEATURES.md) - Renk interpolasyonu & sınıflandırma
- [docs/DATAWRAPPER_INTEGRATION.md](docs/DATAWRAPPER_INTEGRATION.md) - Datawrapper stili entegrasyon

## Lisans

Proje lisans ve kullanım şartları için depo içi lisans/politika dosyalarını referans alın.
