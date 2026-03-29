# Görev: Veri görselleştirme testlerini güncelle
Tarih: 2026-03-29

## Bağlam
Veri görselleştirme modülünde aktif runtime akışında bulunan bazı hatalar için test kapsamı eksik.
Amaç ürün kodunu değiştirmeden, bu açıkları görünür kılan ve aktif modülü hedefleyen regresyon testlerini eklemek.

## Plan
- [x] Adım 1: Mevcut görselleştirme testlerini ve hedef hook/renderer davranışlarını netleştir
- [x] Adım 2: Eksik kalan senaryolar için test dosyalarını güncelle veya yeni testler ekle
- [x] Adım 3: İlgili Vitest komutlarını çalıştırıp sonuçları ve varsa bilinen kırıkları doğrula
- [x] Adım 4: Diff, encoding ve kapsam etkisini gözden geçirip sonucu raporla

## Doğrulama kriterleri
- [x] Yeni testler aktif `src/features/visualization` ve `src/features/viz-wizard` akışlarını hedeflemeli
- [x] Testler raporlanan bug senaryolarını açık biçimde ifade etmeli
- [x] Türkçe karakterler ve UTF-8 bütünlüğü korunmalı
- [x] Değişiklik diff'i test dosyaları ve görev kaydıyla sınırlı kalmalı

## Sonuç
`useVizRender` ve legend akışı için yeni regresyon testleri eklendi.
Hedefli Vitest çalıştırmasında `useVisualizationLayerPersistence` mevcut testleri geçti; yeni regresyon testlerinden üçü beklenen şekilde kırmızıya düştü ve raporlanan sorunları görünür kıldı.
