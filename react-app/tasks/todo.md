# Görev: Öznitelik Tablosu ve Harita Seçim Senkronizasyonu
Tarih: 2026-05-21

## Bağlam
Öznitelik tablosunda seçilen satırların harita üzerinde ArcGIS benzeri şekilde anında vurgulanması isteniyor. Mevcut yapıda harita katmanları yalnızca tek `activeItemId` üzerinden seçili durumu alıyor, AG Grid tablo seçimi ise store ile senkronize edilmiyor.

## Plan
- [x] Adım 1: Data management store'a çoklu seçim durumunu ve seçim güncelleme yardımcılarını ekle.
- [x] Adım 2: Öznitelik tablosundaki AG Grid seçimlerini store'a yaz ve dışarıdan gelen seçim değişince tablo satırlarını senkronize et.
- [x] Adım 3: Harita veri katmanlarını çoklu seçim durumuna göre turkuaz/cyan vurgulama ile çiz.
- [x] Adım 4: Haritadaki veri tıklamalarını tablo seçimiyle aynı store durumuna bağla.
- [x] Adım 5: Test, build ve Türkçe karakter/encoding kontrolünü çalıştır.

## Doğrulama kriterleri
- [x] Tabloda seçilen bir veya birden fazla satır haritada turkuaz vurguyla görünmeli.
- [x] Haritada bir veri öğesine tıklanınca aynı seçim state'i güncellenmeli.
- [x] Silinen veya temizlenen öğelerin seçim state'inde hayalet ID bırakmaması sağlanmalı.
- [x] İlgili testler ve build başarılı olmalı.
- [x] Türkçe karakterler bozulmadan kalmalı.

## Sonuç
Öznitelik tablosu ve harita veri katmanları aynı çoklu seçim state'ini kullanacak şekilde senkronize edildi. Tabloda seçilen satırlar haritada turkuaz vurguyla çiziliyor; haritada veri öğesine tıklanınca aynı seçim tablonun seçili satırlarına yansıyor.
