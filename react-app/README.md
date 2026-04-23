# OGM Materyal CBS

`OGM Materyal CBS`, React 19 + TypeScript 5 ile geliştirilen feature-first bir harita uygulamasıdır. MapLibre GL üzerinde choropleth, bubble, dot-density, heatmap, isochrone, spatial analysis ve elevation profile gibi farklı CBS iş akışlarını tek uygulama kabuğunda toplar.

Kod tabanı `src/features/` altında **19 feature modülü** içerir. Root orchestrator katmanı `src/components/layout/AppLayout.tsx` içinde sidebar, harita, arama, overlay panelleri, legend ve analiz panellerini compose eder.

## Başlangıç

```bash
npm install
npm run dev
```

Varsayılan geliştirme adresi: `http://localhost:5173`

## Teknoloji Yığını

- React 19
- TypeScript 5.9
- Vite 7
- MapLibre GL + react-map-gl
- Zustand
- Tailwind CSS 4
- AG Grid
- Turf.js
- Vitest + Testing Library
- ESLint

## Ana Modüller

Uygulamadaki feature envanteri:
- astronomy
- basemap
- clustering
- data-import
- data-management
- data-mapper
- elevation-profile
- geocoder
- globe-view
- heatmap
- isochrone
- layers
- legend
- map
- spatial-analysis
- storymap-modal
- timeline
- visualization
- viz-wizard

Öne çıkan yetenekler:
- Excel, CSV, GeoJSON, KML ve Shapefile içe aktarma
- Choropleth, bubble ve dot-density görselleştirmeleri
- Heatmap, isochrone, convex hull, Voronoi, nearest-points ve elevation profile analizleri
- Çizim araçları, ölçüm araçları ve overlay layer yönetimi
- Legend, map title ve visualization wizard akışları
- IndexedDB persist ve performans odaklı style senkronizasyonu

## Mimari

Proje Vertical Slice Architecture yaklaşımını izler.

- Root akış: `src/main.tsx` → `src/App.tsx` → `src/components/layout/AppLayout.tsx`
- Feature public API yüzeyi `index.ts` dosyaları üzerinden açılır
- Global store'lar `src/stores/` altında tutulur
- Shared facade ve ortak yardımcı modüller `src/shared/` altında yer alır

Harita kabuğu `src/features/map/` altında toplanır. Veri yaşam döngüsünün kanonik alanı `src/features/data-management/`, render orkestrasyonu `src/features/visualization/`, kullanıcı yönlendirmeli kurulum akışı ise `src/features/viz-wizard/` içindedir.

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

## Dokümantasyon

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/FEATURES.md](docs/FEATURES.md)
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- [docs/COLOR_SCALE_FEATURES.md](docs/COLOR_SCALE_FEATURES.md)
- [docs/COLOR_SCALE_INTEGRATION.md](docs/COLOR_SCALE_INTEGRATION.md)

## Notlar

- README içinde proje adı `OGM Materyal CBS` olarak kullanılır.
- Ayrıntılı feature dökümü için `docs/FEATURES.md` referans alınmalıdır.
- Teknik altlık, renderer ve servis ayrıntıları için ilgili dokümanlar README yerine `docs/` altında tutulur.

## Kısa URL Presetleri

Arazi Örtüsü (2018) katmanını hızlı açılış için:

- `https://ogmmateryal.eba.gov.tr/cbs/lc2018`
- `https://ogmmateryal.eba.gov.tr/cbs/arazi-ortusu-2018`

## Sorun Giderme

### MEBİ'de yayın sonrası beyaz ekran

Belirti:
- Uygulama `https://mebi.eba.gov.tr/upload/skill-based-app/<id>/index.html` gibi alt klasörde açılıyor ama sayfa beyaz kalıyor.

Neden:
- Build, yanlış `base` ile üretildiğinde asset yolları (`/cbs-react/...` veya `/assets/...`) yayınlanan klasörle uyuşmaz.

Çözüm (alt klasör yayını için önerilen):
```bash
cd "D:/0GM/MEB PROJELER/CBS PROJELER/cbs-react/react-app"
pnpm run build:mebi
```

Yükleme adımı:
- Sunucudaki hedef klasörü temizleyin.
- `react-app/dist` klasörünün **içeriğini** (klasörün kendisini değil) hedef klasöre kopyalayın.
- Tarayıcıda `Ctrl+F5` ile hard refresh yapın.

Doğrulama:
- `dist/index.html` içinde yolların `./assets/...` ve `./geocoder.js` olarak üretildiğini kontrol edin.
