# Görev: Mobilde Haritaya Dokunulduğunda Ankara'ya Uçma Sorununun Giderilmesi
Tarih: 2026-05-19

## Bağlam
Haritada bir nokta eklenip kaydedildikten (örneğin Ankara'da) ve harita başka bir konuma (örneğin Fransa'ya) sürüklendikten sonra, Fransa'da boş bir yere dokunulduğunda harita aniden Ankara'ya odaklanmaktadır (sanki o marker'a tıklanmış gibi). Bu durumun iki temel nedeni tespit edilmiştir:
1. `SidebarComponent` açılıp kapandığında veya görünümleri değiştiğinde harita container boyutu değişmekte, ancak `map.resize()` çağrılmadığı için MapLibre'nin projeksiyon matrisi güncel kalmamakta ve tıklanan piksel koordinatları eski Ankara marker hitbox'ı ile yanlış eşleşmektedir.
2. `ModalComponent.js` içindeki marker click dinleyicilerinde, `MapMarkers` sınıfının merkezi `shouldSuppressMarkerClick()` koruması uygulanmadığı için, çizim modundayken veya suppress süresi içindeki tıklamalar yutulmayıp marker detail tetiklemektedir.

## Plan
- [x] **Adım 1:** `ModalComponent.js` içindeki tüm marker click dinleyicilerine (satır 715, 1116, 1385, 1445, 1509 ve diğer metin marker click dinleyicilerine) `shouldSuppressMarkerClick()` koruması eklemek.
- [x] **Adım 2:** `SidebarComponent.js` içindeki `showPointDetail()`, `showListView()` ve `toggle()` metotlarına, CSS geçişleri tamamlandıktan sonra (320ms gecikmeli) çalışacak şekilde `map.resize()` tetiklemesi eklemek.
- [x] **Adım 3:** Türkçe karakter, söz dizimi ve encoding kontrollerini çalıştırarak kodun kalitesini doğrulamak.

## Doğrulama Kriterleri
- [x] Haritaya Fransa'da dokunulduğunda Ankara'daki marker asla tetiklenmemeli ve harita oraya uçmamalıdır.
- [x] Çizim araçları veya nokta ekleme araçları aktifken haritada boş bir yere dokunulduğunda ilk çizim noktası doğru yere eklenmeli, eski marker tetiklenmemelidir.
- [x] Sidebar açılıp kapandığında veya detay görünümleri arasında geçiş yapıldığında harita projeksiyonu bozulmamalıdır.
- [x] UTF-8 ve Türkçe karakter bütünlüğü korunmalıdır.

## Sonuç
Mobil görünümlerde ve sidebar geçişlerinde yaşanan haritanın beklenmedik şekilde eski marker koordinatlarına odaklanması (Ankara'ya uçması) sorunu giderildi. `map.resize()` tetiklemesiyle MapLibre'nin projeksiyon matrisi her görünüm değişiminde güncel kalmaktadır. `ModalComponent` içindeki tüm marker tipleri (nokta, metin, rota, numaralı nokta vb.) `shouldSuppressMarkerClick()` ve `wasRecentlyDragged()` korumalarıyla güvence altına alınmıştır.
