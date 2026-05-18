# Görev: Nokta Bazlı Zoom Ayarı
Tarih: 2026-05-18

## Bağlam
Kullanıcı her nokta için özel zoom seviyesi belirlemek istiyor. Noktaya gidildiğinde veya odaklanıldığında harita, o noktanın kaydedilmiş zoom seviyesinde görüntülenmeli.

## Plan
- [x] Adım 1: Nokta veri modelinde `zoom` alanını koru.
- [x] Adım 2: Nokta detay paneline 4-18 aralığında zoom slider'ı ve değer göstergesi ekle.
- [x] Adım 3: Slider değişiminde canlı harita önizlemesi yap.
- [x] Adım 4: Odaklanma, playback ve StoryMap akışlarında `point.zoom` değerini kullan.
- [x] Adım 5: Değişiklikleri doğrula ve diff'i gözden geçir.

## Doğrulama kriterleri
- [x] View mode'da zoom ayarı görünmez.
- [x] Kaydedilen nokta zoom değeri hikâye verisinde korunur.
- [x] Zoom değeri olmayan noktalar mevcut varsayılanlarla çalışır.
- [x] Canlı önizleme Kaydet öncesinde kalıcı veri değiştirmez.

## Sonuç
Tamamlandı. Sözdizimi kontrolleri geçti ve yerel statik sunucu üzerinden `app.html?dev` yanıtı doğrulandı.
