# Harita Paylaşım Mimarisi

## Özet
- Araştırma sonucu: ana React uygulaması bugün local-first çalışıyor; kullanıcı katmanları tarayıcı depolamasında tutuluyor, paylaşım backend’i yok. Statik il/ilçe sınırları GitHub Raw’dan okunuyor; kullanıcı haritası GitHub’a yazılmıyor. Dayanak: [useDataManagementStore.ts](/D:/0GM/MEB%20PROJELER/CBS%20PROJELER/cbs-react/react-app/src/features/data-management/store/useDataManagementStore.ts#L29), [VisualizationManager.ts](/D:/0GM/MEB%20PROJELER/CBS%20PROJELER/cbs-react/react-app/src/features/visualization/shared/VisualizationManager.ts#L49), [apiService.js](/D:/0GM/MEB%20PROJELER/CBS%20PROJELER/cbs-react/react-app/storymap/src/services/apiService.js#L219).
- Doğru model, storymap’teki desenin aynısı: haritayı backend’de JSON belge olarak sakla, paylaşınca `publicKey` üret, auth’suz read-only viewer ile aç.
- Karar: kullanıcı verisini her paylaşımda GitHub’a yazma. Paylaşım dokümanını uzak depoda sakla; ortak boundary verisini share başına DB’ye kopyalama.

## Uygulama Tasarımı
- Ana uygulamaya bir `Paylaş` butonu eklenir; yalnızca paylaşılabilir içerik varsa aktif olur.
- Kullanıcı paylaş dediğinde istemci bir `SharedMapSnapshot` üretir:
  - `view`: `center`, `zoom`, `basemap`
  - `dataLayers`: `items`, `layerStyles`
  - `visualization`: `currentVisualization`, `colorConfig`, `mapTitle`
  - `datasetRef`: `province-v1` veya `district-v1`
  - `meta`: `title`, `version`, zaman damgaları
- Snapshot backend’e kaydedilir; metadata veritabanında, büyük JSON payload object storage/blob alanında tutulur.
- Share açılınca backend `publicKey` üretir; link ayrı bir viewer entry olur: `shared-map.html?code={publicKey}`. Mevcut projede router olmadığı için ayrı HTML/entry seçilir; tüm uygulamaya router eklenmez.
- Public viewer `GET public/{publicKey}` ile snapshot’ı alır ve read-only layout içinde haritayı hydrate eder; pan/zoom serbest, import/draw/edit/share yoktur.
- Unshare akışı `publicKey`’i iptal eder; eski link “paylaşım kapatıldı” ekranına düşer.
- Statik il/ilçe boundary GeoJSON snapshot’a gömülmez. Viewer bunları `datasetRef` üzerinden ortak kaynaktan çözer. Kullanıcının çizdiği veya içe aktardığı geometri ise snapshot içinde tam saklanır.

## API ve Veri Sözleşmesi
- Yeni kaynak: `MapShare`
- Endpoint’ler:
  - `POST /api/MapShare`
  - `PUT /api/MapShare/{id}`
  - `PATCH /api/MapShare/share/{id}`
  - `PATCH /api/MapShare/unshare/{id}`
  - `GET /api/MapShare/public/{publicKey}`
- Snapshot şeması:
  - `version: 1`
  - `view: { center, zoom, basemap }`
  - `dataLayers: { items, layerStyles }`
  - `visualization: { currentVisualization, colorConfig, mapTitle } | null`
  - `datasetRef: 'province-v1' | 'district-v1' | null`
  - `meta: { title, ownerId, createdAt, updatedAt }`
- Public viewer için `rawData`, wizard step state, `matchResults`, geçici modal state ve browser cache verisi taşınmaz; yalnızca yeniden render için gereken snapshot saklanır.

## Test Planı
- Çizilmiş katmanlı harita paylaşılır; farklı tarayıcıda aynı geometri görünür.
- İçe aktarılmış GeoJSON/KML/shapefile katmanlı harita paylaşılır; kullanıcı verisi GitHub’a bağlı olmadan yüklenir.
- Choropleth, bubble ve dot görselleştirmeleri paylaşılır; legend, başlık, basemap ve zoom korunur.
- Sadece il/ilçe tematik görselleştirme paylaşılır; boundary verisi ortak kaynaktan çözülür, DB’ye kopyalanmaz.
- Unshare sonrası eski link açılmaz.
- Read-only viewer’da düzenleme kontrolleri görünmez veya çalışmaz.
- Büyük payload limitleri ve hata mesajları doğrulanır.

## Varsayımlar ve Seçilen Varsayılanlar
- V1 paylaşım modeli snapshot’tır; owner linki ancak yeniden güncelleyerek değiştirir.
- Paylaşım oluşturmak auth gerektirir; linke sahip herkes auth’suz görüntüler.
- Kullanıcı verisi GitHub’a yazılmaz.
- Storymap altyapısı doğrudan reuse edilmez; yalnızca backend deseni reuse edilir, çünkü mevcut `StorymapModal` ana uygulama state’ini storymap’e taşımıyor.
