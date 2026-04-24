# Görev: Poligon etiketlerini polylabel ile konumlandır
Tarih: 2026-04-24

## Bağlam
İl/ilçe etiketleri şu anda poligon içi nokta üretimi için `pointOnFeature` ve bazı il bazlı manuel kaydırmalar kullanıyor. Bu yaklaşım Erzincan ve Antalya gibi tekil düzeltmelerle çalışsa da uzun vadede ölçeklenmez. Amaç, varsayılan etiket noktasını `polylabel` mantığıyla üretmek ve manuel il düzeltmelerini kaldırmaktır.

## Plan
- [x] Adım 1: `polylabel` bağımlılığını projeye ekle ve tip/import kullanımını doğrula.
- [x] Adım 2: `geometryUtils` içinde `calculateLabelPoint` fonksiyonunu polylabel varsayılan olacak şekilde yeniden tasarla.
- [x] Adım 3: Polygon ve MultiPolygon için polylabel koordinat üretimini destekle; başarısız durumda mevcut `calculateCentroid`/`pointOnFeature` fallback'ini koru.
- [x] Adım 4: Erzincan ve Antalya özel offset kurallarını kaldır; renderer'ların ortak `calculateLabelPoint` kullanımını koru.
- [x] Adım 5: Geometri testlerini polylabel davranışına göre güncelle ve regresyon senaryolarını ekle.
- [x] Adım 6: Test, lint, TypeScript, build ve Türkçe karakter kontrollerini çalıştır; diff'i gözden geçir.

## Doğrulama kriterleri
- [x] Etiket noktaları varsayılan olarak poligon içinde ve kenarlardan uzak, okunabilir bir konuma yerleşiyor.
- [x] Erzincan/Antalya için manuel özel kural kalmıyor.
- [x] Koroplet, bubble ve dot label kaynakları aynı merkezi hesaplama mantığını kullanıyor.
- [x] `geometryUtils` testleri geçiyor.
- [x] Lint, TypeScript, build ve Türkçe karakter kontrolleri temiz geçiyor.

## Sonuç
`polylabel` varsayılan etiket noktası algoritması olarak eklendi. `calculateLabelPoint`, Polygon için doğrudan polylabel kullanıyor; MultiPolygon için en büyük poligonu seçiyor ve başarısız durumda mevcut `calculateCentroid` fallback'ine dönüyor. Erzincan ve Antalya özel offset kuralları kaldırıldı. Koroplet, bubble ve dot renderer'ları ortak etiket noktası üretimini kullanmaya devam ediyor.
