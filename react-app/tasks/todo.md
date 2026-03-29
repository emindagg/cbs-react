# Görev: customBreaks otomatik rerender düzeltmesi
Tarih: 2026-03-29

## Bağlam
`useVizRender` içindeki `dataVizKey`, `customBreaks` içeriğini izlemediği için custom sınıf sınırları değişince tam rerender tetiklenmiyor.
Amaç bu anahtarı kararlı biçimde güncelleyip mevcut regresyonu düzeltmek ve gereksiz rerender üretmediğini testle doğrulamak.

## Plan
- [x] Adım 1: `useVizRender` içindeki `dataVizKey` hesaplamasını `customBreaks` içeriğini izleyecek şekilde güncelle
- [x] Adım 2: `classificationMethod !== 'custom'` iken stale `customBreaks` değişimlerinin rerender tetiklemediğini testle güvenceye al
- [x] Adım 3: Hedefli Vitest çalıştırması ile regresyonları doğrula
- [x] Adım 4: Diff ve encoding kontrolü sonrası sonucu raporla

## Doğrulama kriterleri
- [x] `customBreaks` değerleri değişince `useVizRender` yeniden render tetiklemeli
- [x] `classificationMethod !== 'custom'` iken `customBreaks` değişimi tek başına rerender tetiklememeli
- [x] Hedefli `useVizRender` test dosyası yeşil geçmeli
- [x] Türkçe karakterler ve UTF-8 bütünlüğü korunmalı

## Sonuç
`dataVizKey` içine kararlı bir `customBreaks` anahtarı eklendi.
Ek regresyon testiyle custom olmayan sınıflandırmalarda stale `customBreaks` değişiminin rerender üretmediği doğrulandı; hedefli `useVizRender` test dosyası yeşil geçti.
