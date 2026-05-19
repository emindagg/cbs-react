# Görev: Mobilde Nokta Aracı Kayıt Sonrası Açık Kalması
Tarih: 2026-05-19

## Bağlam
Nokta veya numaralı nokta ekleyip kaydettikten sonra mobilde haritaya ilk dokunma/sürükleme yeni `addPoint` kayıtları üretebiliyor. Loglarda `PointManager addPoint` tekrarlandığı için marker ekleme modunun touch/click listener'ı kayıttan sonra açık kalabiliyor.

## Plan
- [x] Adım 1: Loglara göre `addPoint` tekrarını marker modu kapanışı üzerinden analiz et.
- [x] Adım 2: Nokta/numaralı nokta tamamlanınca `disableAllModes()` çağıran ortak tamamlanma akışı ekle.
- [x] Adım 3: Nokta ve numaralı nokta detay kapanış callback'lerini bu ortak akışa bağla.
- [x] Adım 4: `savePointDetail()` içinde detay kapanış callback'inin iki kez çalışmasını engelle.
- [x] Adım 5: Marker modu için eski/geç mobil touch-callback'lerini engelleyen oturum koruması ekle.
- [x] Adım 6: Söz dizimi, diff ve Türkçe karakter/encoding kontrollerini çalıştır.

## Doğrulama kriterleri
- [x] Nokta kaydından sonra marker ekleme modu/touch listener'ı kapalı olmalı.
- [x] Numaralı nokta kaydından sonra marker ekleme modu/touch listener'ı kapalı olmalı.
- [x] Detay kaydetme callback'i tek kez çalışmalı.
- [x] Geç gelen mobil touch/click callback'i yeni nokta ekleyememeli.
- [x] JavaScript söz dizimi hatası olmamalı.
- [x] UTF-8 ve Türkçe karakter bütünlüğü korunmalı.

## Sonuç
Nokta ve numaralı nokta detay kapanış callback'leri ortak `completeCurrentTool()` akışına bağlandı. Marker callback'i başlar başlamaz `disableAllModes()` çağrılıyor ve `MapMarkers` artık aktif oturum kontrolü yaptığı için kapanmış marker moduna ait geç touch/click olayları yeni `addPoint` üretemiyor. `savePointDetail()` kapanışı `showListView()` üzerinden tek callback akışında tutuldu.
