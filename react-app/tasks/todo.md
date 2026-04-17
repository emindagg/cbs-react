# Görev: Renderer ve yardımcı hesap akışı incelemesi
Tarih: 2026-04-17

## Bağlam
Kullanıcı, `ChoroplethRenderer`, `BubbleRenderer`, `PointRenderer` ile bunların bağlı yardımcıları olan `classification`, `interpolation`, `normalization`, `mapExpressions`, `symbolShapes`, `colorSchemes` modüllerinin incelenmesini istiyor.
Amaç kod yazmak değil; gerçek bugları ve hesaplama tutarsızlıklarını doğrulanabilir bulgular halinde raporlamak.

## Plan
- [x] Adım 1: Proje kökü, scriptler ve ilgili kaynak dosyaları okuyup render zincirini çıkar.
- [x] Adım 2: Renderer ve yardımcı modülleri birlikte inceleyip veri akışı, sınır durumları ve hesaplamaları doğrula.
- [x] Adım 3: İlgili testleri ve kullanım izlerini kontrol edip yalnızca doğrulanabilir bug/tutarsızlık bulgularını derle.

## Doğrulama kriterleri
- [x] Her bulgu belirli dosya ve satır referansına dayanıyor.
- [x] Bulgular gerçek davranış farkı, bug veya hesaplama tutarsızlığı içeriyor; varsayımsal stil eleştirisi içermiyor.

## Sonuç
İnceleme tamamlandı. Renderer ve yardımcılarda doğrulanabilir buglar ile hesaplama tutarsızlıkları raporlandı; kod değişikliği yapılmadı.
