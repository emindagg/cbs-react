# CBS React Map Platform

Feature-first bir React + TypeScript harita uygulaması. MapLibre GL üzerinde büyük veriyle çalışan görselleştirmeler (choropleth / dot / bubble), dosya içe aktarma, katman yönetimi ve performans odaklı stil güncellemeleri içerir.

## Başlangıç

```bash
npm install
npm run dev
```

Varsayılan geliştirme adresi: `http://localhost:5173`

## Kullanılan Teknolojiler

- React 19 + TypeScript 5
- Vite 7
- MapLibre GL + react-map-gl
- Zustand (state)
- Vitest + Testing Library
- ESLint (feature-boundary kuralları dahil)

Detaylar için: `package.json:24-84`

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

Kaynak: `package.json:6-23`

## Mimari: Vertical Slice (Feature-First)

Kod tabanı feature bazlı organize edilir. Her feature kendi `components/hooks/services/types` alt yapısını taşır ve dışarıya `index.ts` üzerinden public API açar.

Örnek feature API dosyaları:
- `src/features/map/index.ts:6-16`
- `src/features/visualization/index.ts:1-25`
- `src/features/data-management/index.ts:1-30`

### Sınırlar

- Root orchestrator katmanı (`src/components/layout/AppLayout.tsx`) feature’ları public API üzerinden toplar.
- Feature içinden başka feature’a deep import yasaktır.
- Bu kural ESLint ile enforced edilir (`eslint.config.js:86-101`, `eslint.config.js:245-258`).

### Uygulama Akışı

- Boot: `index.html:20-23` → `src/main.tsx` → `src/App.tsx:12-15`
- Orkestrasyon: `src/components/layout/AppLayout.tsx:27`
- Harita + veri katmanı: `src/features/map/components/MapContainer.tsx:73`, `src/features/map/layers/DataLayer.tsx:34`

## Web Worker ile Dosya Okuma / İçe Aktarma

Excel/CSV gibi dosyalar ana thread’i bloklamamak için worker hattı üzerinden parse edilir.

Pipeline:
1. UI tetikleme: `src/features/data-management/components/DataImportExportSection.tsx:11`
2. Hook: `src/features/data-management/hooks/useFileImport.ts:20`
3. Dispatcher: `src/features/data-management/services/import/fileParser.ts:11`
4. Excel/CSV worker parse: `src/features/data-management/services/import/excelProcessor.ts:6-25`
5. Sonuçlar store’a chunk’lı eklenir: `src/features/data-management/hooks/useFileImport.ts:34-45`

Desteklenen formatlar:
- `geojson/json`, `xlsx/xls/csv`, `kml`, `zip(shapefile)`
- Kaynak: `src/features/data-management/services/import/fileParser.ts:15-43`

## Harita Performansı: `startTransition` + GPU `setPaintProperty`

Bu projede INP düşürmek için iki ana strateji birlikte kullanılır:

### 1) React tarafında önceliklendirme (`startTransition`)

Ağır UI/state güncellemeleri kullanıcı etkileşimlerini bloklamayacak şekilde transition olarak planlanır (özellikle büyük veri ve kontrol paneli etkileşimlerinde).

### 2) Stil güncellemelerini veri yeniden üretiminden ayırma (GPU-side)

Layer style değişimlerinde GeoJSON’i yeniden inşa etmek yerine doğrudan MapLibre katman paint/layout property’leri güncellenir:
- `src/features/data-management/hooks/useLayerStyleSync.ts:12-73`

Bu sayede:
- CPU tarafındaki veri dönüşümü azaltılır
- Map katman güncellemeleri GPU pipeline’da daha hızlı işlenir
- Etkileşim gecikmesi ciddi şekilde düşer

Ek olarak görselleştirme tarafında full re-render ile paint-only update ayrımı bulunur:
- `src/features/viz-wizard/hooks/useVizRender.ts:73-110`
- `src/features/viz-wizard/hooks/useVizRender.ts:129-148`

Sonuç bağlamı: INP değeri önceki yapıya göre yaklaşık **~16ms** seviyesine çekildi (commit geçmişindeki performans düzeltme notları ile uyumlu).

## Test ve Kalite

- Vitest `jsdom` ortamı: `vitest.config.ts:7-10`
- Coverage threshold: `%70` (line/function/branch/statement): `vitest.config.ts:24-29`
- TypeScript strict: `tsconfig.app.json:26`
- Lint kuralları (import boundary dahil): `eslint.config.js`

> Not: Coverage değeri zamanla değişir; güncel durum için `npm run test:coverage` çalıştırıp `coverage/index.html` dosyasını referans alın.

## Dokümantasyon

Detaylı teknik dokümanlar:
- `docs/ARCHITECTURE.md`
- `docs/FEATURES.md`
- `docs/CONTRIBUTING.md`
- `docs/DATAWRAPPER_FEATURES.md`
- `docs/DATAWRAPPER_INTEGRATION.md`

## Lisans

Proje lisans ve kullanım şartları için depo içi lisans/politika dosyalarını referans alın.
