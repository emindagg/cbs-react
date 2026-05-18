# Görev: Hikâye Geçişlerinde Aktif Öğeyi Belirginleştirme
Tarih: 2026-05-18

## Bağlam
Hikâye Haritası ön izlemede bir noktadan diğerine geçerken aktif olan nokta, metin veya alan harita üzerinde yeterince belirgin değildir. Birden fazla öğe yakın olduğunda kullanıcı hangi öğenin aktif sahneye ait olduğunu karıştırabilir.

## Plan
- [x] Adım 1: StoryMap sahne değişiminde aktif sahnenin koordinatına taşınan pulse marker ekle.
- [x] Adım 2: Pulse marker için yanıp sönen görsel animasyon CSS'i ekle.
- [x] Adım 3: Söz dizimi, diff ve Türkçe karakter/encoding kontrollerini çalıştır.

## Doğrulama kriterleri
- [x] Sahne değiştiğinde aktif öğenin konumunda yanıp sönen odak göstergesi görünmeli.
- [x] Nokta, metin ve alan gibi çizim öğelerinde aynı gösterge çalışmalı.
- [x] JavaScript söz dizimi hatası olmamalı.
- [x] UTF-8 ve Türkçe karakter bütünlüğü korunmalı.

## Sonuç
StoryMap sahne değişiminde aktif sahnenin koordinatına taşınan bağımsız bir pulse marker eklendi. Gösterge nokta, metin ve alan gibi tüm sahne tiplerinde aynı koordinat sistemi üzerinden çalışır; CSS tarafında yanıp sönen halka ve merkez nokta animasyonu tanımlandı.
