# Görev: Koroplet, bubble ve nokta harita testlerini güncelle
Tarih: 2026-04-18

## Bağlam
Kullanıcı, koroplet harita, bubble map ve nokta harita oluşturma akışlarıyla ilgili testlerin güncellenmesini istiyor. Mevcut kapsam `useVizRender`, görselleştirme katmanı geri yükleme akışı ve ilgili legend/snapshot davranışları etrafında toplanıyor; testleri güncel render davranışıyla hizalamak gerekiyor.

## Plan
- [x] Adım 1: İlgili render ve persistence kodunu okuyup güncel davranışları netleştir.
- [x] Adım 2: Koroplet, bubble ve nokta harita oluşturma akışlarını kapsayan testleri güncelle veya eksik senaryoları ekle.
- [x] Adım 3: İlgili Vitest dosyalarını çalıştırıp başarısızlıkları gider.
- [x] Adım 4: Değişiklikleri diff ve encoding açısından kontrol edip sonucu özetle.

## Doğrulama kriterleri
- [x] Koroplet, bubble ve nokta harita render akışları için ilgili testler geçiyor.
- [x] Güncellenen testler mevcut davranışı doğruluyor; eski davranış varsayımlarına dayanmıyor.
- [x] Düzenlenen dosyalarda Türkçe karakterler ve UTF-8 bütünlüğü korunuyor.

## Sonuç
`useVizRender` testlerine bubble normalizasyon snapshot'ı ve nokta harita render yönlendirmesi eklendi. `useVisualizationLayerPersistence` testlerine bubble ve nokta harita yeniden yükleme senaryoları eklendi; hedef Vitest dosyaları ile ilgili ESLint kontrolü başarıyla geçti.
