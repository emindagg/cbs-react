# Görev: Koroplet, bubble ve nokta harita testlerini yeniden doğrula
Tarih: 2026-04-18

## Bağlam
Kullanıcı, kodda yaptığı son değişikliklerden sonra koroplet harita, bubble map ve nokta harita oluşturma akışlarıyla ilgili testlerin tekrar çalıştırılmasını, mevcut davranışın detaylı incelenmesini ve eksik test kalmamasını istiyor. Çalışma odağı `useVizRender`, görselleştirme katmanı geri yükleme, legend/snapshot akışı ve bu akışlara bağlı yardımcı testlerdir.

## Plan
- [x] Adım 1: İlgili kaynak ve test dosyalarını yeniden okuyup son davranışları ve kapsamdaki boşlukları çıkar.
- [x] Adım 2: Koroplet, bubble ve nokta harita oluşturma akışları için hedef Vitest paketini çalıştırıp mevcut durumu doğrula.
- [x] Adım 3: Kaçan davranışlar için test ekle veya mevcut testleri güncelle.
- [x] Adım 4: Güncellenen testleri tekrar çalıştır, lint ile kontrol et ve diff/encoding incelemesini tamamla.

## Doğrulama kriterleri
- [x] İlgili görselleştirme testleri güncel kod üzerinde geçiyor.
- [x] Testler koroplet, bubble ve nokta harita için render, paint/display güncelleme ve yeniden yükleme davranışlarını kapsıyor.
- [x] Düzenlenen dosyalarda Türkçe karakterler ve UTF-8 bütünlüğü korunuyor.

## Sonuç
İlgili görselleştirme test paketi yeniden çalıştırıldı ve boş kalan davranışlar için ek senaryolar yazıldı. `useVizRender` içinde display-only güncellemenin aktif render türüne uygulanması, `useVisualizationLayerPersistence` içinde mevcut katman varken yeniden yükleme yapılmaması ve legend container'ın bubble/dot için aktif görselleştirmeyi esas alması artık doğrudan test ediliyor. Ek olarak `ChoroplethRenderer`, `BubbleRenderer` ve `PointRenderer` için düşük seviyeli renderer testleri yazıldı; custom-break, custom-range, backdrop ve dot/bubble üretim davranışları doğrudan `addSource`/`addLayer` çıktıları üzerinden doğrulandı. Hedef suite ve ESLint temiz geçti.
