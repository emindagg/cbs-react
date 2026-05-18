# Görev: Metin Kutularının Zoom Out Sırasında Haritayı Kapatmasını Önleme
Tarih: 2026-05-18

## Bağlam
Haritaya eklenen metin kutuları DOM marker olarak sabit piksel boyutunda çiziliyor. Harita zoom out olduğunda coğrafi ölçek küçülürken metin kutusu ekranda aynı boyutta kaldığı için haritayı kapatıyor; Hikâye Haritası geçişlerinde aktif olmayan metinler de görüntüyü kalabalıklaştırıyor.

## Plan
- [x] Adım 1: Metin marker render davranışını zoom seviyesine göre küçült/gizle ve uzun metin kırılımını iyileştir.
- [x] Adım 2: Hikâye Haritası ön izlemede metin kutularını aktif sahneye göre göster/gizle.
- [x] Adım 3: Söz dizimi, diff ve Türkçe karakter/encoding kontrollerini çalıştır.

## Doğrulama kriterleri
- [x] Zoom out olduğunda metin kutusu haritayı kapatmamalı.
- [x] Aktif Hikâye Haritası sahnesindeki metin görünmeli, aktif olmayan sahne metinleri gizlenmeli.
- [x] Uzun metinler kutudan taşmamalı.
- [x] JavaScript söz dizimi hatası olmamalı.
- [x] UTF-8 ve Türkçe karakter bütünlüğü korunmalı.

## Sonuç
Metin marker'larına zoom seviyesine göre otomatik ölçekleme ve düşük zoom'da gizleme eklendi. Uzun metinler artık `overflow-wrap: anywhere` ile kutu içinde kırılıyor. Hikâye Haritası ön izlemede metin çizimleri sahne id'siyle takip ediliyor; yalnızca aktif sahneye ait metin kutusu görünür kalıyor, diğer metinler geçiş sırasında haritayı kapatmıyor.
