# Kimlik Doğrulamalı Harita Paylaşımı Master Planı

## Özet
- Paylaşım oluşturma yalnızca giriş yapmış kullanıcıya açık olacak ve mevcut storymap sunucusu kullanılacak.
- Storymap mantığı örnek alınacak ama ayrı bir backend kaynağı açılacak: `MapShare`.
- Paylaşılan link ayrı bir read-only sayfada açılacak; linke sahip herkes yalnızca görüntüleyebilecek.
- Kullanıcının kendi çizdiği veriler, içe aktardığı veriler ve veri görselleştirmede kullandığı kullanıcı verileri paylaşım kapsamına girecek.
- Ortak il/ilçe boundary GeoJSON verisi paylaşım kaydına veya dataset dosyasına gömülmeyecek; yalnızca referans tutulacak.
- `30 MB`, sunucuya kabul edilen en büyük paylaşım veri paketi sınırı olacak.
- Kullanıcıya ait ham veri veritabanına yazılmayacak; dataset dosyası olarak sunucu diskine yazılacak. Veritabanı yalnızca paylaşım ayarlarını ve dataset referansını tutacak.
- Paylaşım snapshot mantığında çalışacak: link oluşturulduktan sonra sabit kalacak. Yeni içerik için yeni paylaşım oluşturulacak.

## Mimari Tasarım
- Aynı backend içinde iki yeni kaynak açılır:
  - `MapShares`
  - `MapDatasets`
- `MapShare` yalnızca küçük ve sorgulanabilir metadata tutar:
  - `Id`, `OwnerId`, `Title`, `Description`
  - `IsShared`, `PublicKey`
  - `ConfigJson`
  - `DatasetId`
  - `CreatedAt`, `UpdatedAt`, `Version`
- `MapDataset` veri dosyasının metadata kaydıdır:
  - `Id`, `OwnerId`
  - `StoragePath`
  - `SizeBytes`
  - `Format = json`
  - `CreatedAt`, `Version`
- Asıl kullanıcı verisi storymap sunucusunun public olmayan disk alanına yazılır:
  - önerilen yol: `storage/map-datasets/{datasetId}.json`
- Public viewer dataset dosyasına doğrudan URL ile gitmez; yalnızca backend public endpoint’i üzerinden içerik alır.

## Veri Sözleşmesi
- `ConfigJson` yalnızca görünüm ve paylaşım ayarlarını içerir:
  - `viewState`: `center`, `zoom`, `basemap`
  - `presentation`: `layerStyles`, görünürlük durumu
  - `visualizationConfig`: `type`, `column`, `locationLevel`, `renderSettings`, `colorConfig`, `mapTitle`
  - `boundaryRef`: `province-v1`, `district-v1` veya `null`
- `MapDataset` dosyası kullanıcıya ait asıl içeriği içerir:
  - `items`: kullanıcının çizdiği veya import ettiği tüm `DataItem[]`
  - `visualizationData`: varsa görselleştirmenin kullandığı kullanıcı veri satırları
  - `datasetMeta`: kaynak adı, oluşturulma zamanı, sürüm
- Ortak Türkiye boundary verisi hiçbir durumda paylaşım verisinin içine konmaz.
- Kullanıcı kendi özel boundary/polygon verisini import ettiyse bu kullanıcı verisidir ve dataset dosyasına dahil edilir.

## Boyut Kuralı
- Backend, `MapDataset` için üretilecek JSON’un UTF-8 byte boyutunu ölçer.
- `<= 30 MB`
  - veri kabul edilir
  - dataset dosyası diske yazılır
  - `MapShare` kaydı bu dataset’e referans verir
- `> 30 MB`
  - veri kabul edilmez
  - kullanıcıya açık hata mesajı döner
- `30 MB`, veritabanına yazma eşiği değil, sunucuya kabul eşiğidir.
- V1’de kullanıcı verisi inline olarak DB’ye gömülmez; tüm kullanıcı verisi dataset dosyası olarak saklanır.

## Frontend Davranışı
- Ana uygulamaya `Paylaş` butonu eklenir.
- Buton şu durumda aktif olur:
  - `items.length > 0`
  - veya aktif bir `currentVisualization` varsa
- Kullanıcı giriş yapmamışsa mevcut storymap auth akışıyla login olur.
- Login sonrası frontend tek bir paylaşım isteği üretir:
  - `Title`, `Description`
  - `ConfigJson`
  - `UserDataBundle`
- Frontend local IndexedDB verisini paylaşılmış veri saymaz; backend’e tam snapshot yollar.
- Ayrı viewer entry oluşturulur:
  - önerilen sayfa: `shared-map.html?code={publicKey}`
- Uygulamada router olmadığı için mevcut SPA’ya router eklenmez; paylaşım viewer ayrı React entry olur.

## Read-Only Viewer
- Public viewer şu özellikleri sunar:
  - haritayı açma
  - pan/zoom
  - feature seçme
  - seçilen öğenin `properties` bilgisini sağ panel veya popup içinde gösterme
  - varsa başlık ve legend gösterme
- Public viewer şu işlemleri kapatır:
  - import
  - draw/edit/delete
  - export
  - share/save
  - stil değiştirme
  - veri tablosu düzenleme
- V1 veri görünümü: `Harita + özellik paneli`

## Backend API
- `POST /api/MapShare`
  - auth zorunlu
  - body: `Title + Description + ConfigJson + UserDataBundle`
  - backend boyutu ölçer, dataset dosyasını yazar, `MapShare` kaydını oluşturur
  - response: `shareId`
- `GET /api/MapShare/{id}`
  - auth zorunlu
  - owner kendi paylaşım kaydını görür
- `PATCH /api/MapShare/share/{id}`
  - auth zorunlu
  - `IsShared = true`, `PublicKey` üretir
- `PATCH /api/MapShare/unshare/{id}`
  - auth zorunlu
  - `IsShared = false`, `PublicKey` geçersizleşir
- `GET /api/MapShare/public/{publicKey}`
  - auth gerekmez
  - backend `ConfigJson` ile dataset verisini birleştirip viewer’a tek payload döner
- `PUT /api/MapShare/{id}`
  - yalnızca `IsShared = false` kayıtlarda izin verilir
  - `IsShared = true` kayıt immutable kabul edilir
- Paylaşıma açılmış kayıt güncellenmez; yeni içerik için yeni paylaşım oluşturulur.

## Kullanıcı Akışı
- Kullanıcı haritasını hazırlar.
- `Paylaş` der.
- Login yoksa giriş yapar.
- Sistem `ConfigJson` ve `UserDataBundle` üretir.
- Backend veri boyutunu ölçer.
- Veri `30 MB` altındaysa dataset dosyası diske yazılır ve `MapShare` kaydı açılır.
- Kullanıcı yayına alır, `publicKey` üretilir ve link verilir.
- Link alan kişi `shared-map.html?code=...` ile read-only görüntüler.
- Kullanıcı sonra haritayı değiştirirse eski link değişmez.
- Yeni hali paylaşmak isterse yeni paylaşım oluşturur.

## Test Planı
- Giriş yapmamış kullanıcı paylaşamaz.
- Sadece çizilmiş veri içeren paylaşım oluşturulur ve public viewer’da açılır.
- Küçük import veri paylaşılır; dataset dosyası diske yazılır ve doğru görüntülenir.
- Büyük ama `30 MB` altı import veri paylaşılır; yine dataset modunda doğru çalışır.
- `30 MB` üstü veri paylaşımı reddedilir.
- Kullanıcı verisi + choropleth/bubble/dot görselleştirme birlikte paylaşılır.
- Boundary verisinin ne DB’ye ne dataset dosyasına girmediği doğrulanır.
- Public viewer’da feature seçince özellik paneli doğru dolar.
- `unshare` sonrası eski link erişilemez olur.
- Paylaşıma açılmış bir kayıt güncellenmek istenirse backend reddeder.
- Dataset dosyası diskten silinmişse public endpoint kontrollü hata döner.

## Varsayımlar ve Seçilen Varsayılanlar
- Aynı storymap sunucusu ve aynı auth mekanizması kullanılacak.
- Storymap payload modeli yeniden kullanılmayacak; yalnızca auth ve public-key paylaşım deseni yeniden kullanılacak.
- V1’de object storage yok; dosya storage storymap sunucusu diski olacak.
- V1’de dataset dosyaları public klasöre yazılmayacak.
- V1’de download/export public tarafta olmayacak.
- V1’de paylaşım linki sabit snapshot olacak; aynı link canlı güncellenmeyecek.
- V1’de `30 MB` yükleme üst sınırı olacak.
- V1’de tüm kullanıcı verisi varsayılan olarak dataset dosyasına yazılacak; DB yalnızca config ve referans tutacak.
