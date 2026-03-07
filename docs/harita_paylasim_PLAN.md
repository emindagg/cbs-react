# Kullanıcı Üretimi Veri Dahil Harita Paylaşımı

## Özet
- Paylaşım kapsamı yalnızca veri görselleştirme olmayacak; kullanıcının haritada oluşturduğu veya içe aktardığı veriler de paylaşılacak.
- Paylaşım oluşturma login gerektirecek ve mevcut storymap sunucusu kullanılacak.
- Backend içinde storymap’ten ayrı bir `MapShare` kaynağı açılacak.
- Paylaşılan link ayrı bir read-only sayfa açacak; alıcı haritayı ve veri detaylarını görecek, hiçbir şeyi düzenleyemeyecek.
- V1 varsayılanı snapshot modelidir: paylaşılan içerik otomatik değişmez. Kullanıcı yeni hali paylaşmak isterse yeniden yayınlar.

## Uygulama Davranışı
- `Paylaş` butonu şu durumda aktif olur:
  - en az bir kullanıcı verisi varsa (`drawn` veya `imported` katman),
  - veya aktif bir görselleştirme varsa,
  - veya ikisi birden varsa.
- Kullanıcı giriş yapmamışsa paylaşım akışı login’e yönlendirir.
- Login sonrası istemci tek bir `SharedMapSnapshot` üretir ve backend’e kaydeder.
- Snapshot şunları içerir:
  - `view`: `center`, `zoom`, `basemap`
  - `dataLayers`: tüm `items` listesi
  - `dataPresentation`: `layerStyles`, görünürlük bilgileri, per-item style override’ları
  - `visualization`: varsa `currentVisualization`, `colorConfig`, `mapTitle`
  - `meta`: başlık, owner, zaman damgaları, sürüm
  - `datasetRef`: il/ilçe boundary referansı gerekiyorsa
- Alıcı tarafında read-only viewer:
  - tüm kullanıcı geometrilerini haritada gösterir
  - obje seçilince sağ panel veya popup içinde `properties` alanlarını gösterir
  - aktif görselleştirme varsa legend ve başlığı da gösterir
  - import, draw, edit, save, share, delete, style değiştirme işlemlerini kapatır

## Backend ve Link Modeli
- Aynı storymap sunucusunda yeni kaynak: `MapShare`
- Endpoint’ler:
  - `POST /api/MapShare`
  - `PATCH /api/MapShare/share/{id}`
  - `PATCH /api/MapShare/unshare/{id}`
  - `GET /api/MapShare/public/{publicKey}`
- Link yapısı:
  - örnek: `shared-map.html?code={publicKey}`
- `publicKey` auth’suz okunur ama yalnızca görüntüleme yapar.
- Kullanıcı verisi GitHub’a yazılmaz.
- Ortak boundary verileri istenirse mevcut GitHub/CDN kaynağından okunmaya devam eder.
- Kullanıcının kendi oluşturduğu/import ettiği geometri ve öznitelikler snapshot içinde tam saklanır.

## Read-Only Sayfa İçeriği
- Gösterilecekler:
  - harita
  - kullanıcı oluşturduğu nokta/çizgi/poligon verileri
  - obje detay paneli
  - varsa tematik görselleştirme
  - varsa legend ve harita başlığı
- Gösterilmeyecekler:
  - veri düzenleme araçları
  - çizim araçları
  - import/export işlemleri
  - paylaşım ve kayıt kontrolleri
  - tam veri tablosu
- V1 veri görünümü: `Harita + özellik paneli`

## Test Planı
- Sadece kullanıcı çizimi olan harita paylaşılır; farklı tarayıcıda tüm geometri ve özellikler görünür.
- İçe aktarılmış GeoJSON/KML/shapefile verisi paylaşılır; alıcı tüm kayıtları read-only görür.
- Hem kullanıcı verisi hem görselleştirme birlikte paylaşılır; ikisi de doğru hydrate edilir.
- Feature seçilince öznitelik paneli doğru açılır.
- Login olmadan paylaşım başlatılamaz.
- Unshare sonrası link çalışmaz.
- Owner yerelde veri değiştirse bile mevcut public link otomatik değişmez.

## Varsayımlar
- V1’de paylaşılan snapshot sabittir; yeni içerik için yeniden paylaşım gerekir.
- V1’de alıcı veri indiremez; yalnızca görür.
- V1’de tüm `properties` alanları olduğu gibi paylaşılır; alan bazlı maskeleme yoktur.
- Storymap backend’in auth ve public-key desenleri yeniden kullanılır, storymap payload modeli kullanılmaz.
