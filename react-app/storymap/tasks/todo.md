# Görev: Hikâye Ön İzlemede Nokta Stilinin Korunması
Tarih: 2026-05-18

## Bağlam
Hikâye Haritası ön izleme modunda normal nokta aracıyla eklenen noktalar, kullanıcının seçtiği marker stili yerine sıralı numara marker'ı gibi görünmektedir. Beklenen davranış, noktanın editördeki ikon, renk, şekil ve numara durumunun ön izlemede korunmasıdır.

## Plan
- [x] Adım 1: Ön izleme için oluşturulan `steps` verisine marker stil alanlarını ekle.
- [x] Adım 2: StoryMap marker render işlemini sabit sıra numarası yerine noktanın kendi stil verisini kullanacak şekilde güncelle.
- [x] Adım 3: Söz dizimi, diff ve Türkçe karakter/encoding kontrollerini çalıştır.

## Doğrulama kriterleri
- [x] Normal nokta ön izlemede numaralı marker'a dönüşmemeli.
- [x] Gerçek numaralı nokta seçildiyse numarası korunmalı.
- [x] JavaScript söz dizimi hatası olmamalı.
- [x] UTF-8 ve Türkçe karakter bütünlüğü korunmalı.

## Sonuç
Hikâye Haritası ön izleme ve görüntüleme akışlarında noktanın `color`, `icon`, `style`, `shape`, `isNumber` ve `number` alanları `steps` verisine taşındı. StoryMap marker render işlemi artık tüm normal noktaları otomatik sıra numarasına çevirmiyor; yalnızca gerçekten numaralı marker ise numara gösteriyor, diğer durumlarda noktanın kendi ikon ve rengini kullanıyor.
