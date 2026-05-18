# Görev: Varsayılan Yakınlaştırma Seviyesini 10 Olarak Ayarlama
Tarih: 2026-05-18

## Bağlam
Harita üzerinde yeni nokta veya çizim eklendiğinde detay panelindeki varsayılan yakınlaştırma seviyesinin (zoom) `14` (veya bazı şablonlarda `12`) yerine `10` olması istenmektedir. `ModalComponent.js` dosyasına dokunulmadan, yalnızca detay görünümü ve ilgili işleyiciler güncellenecektir.

## Plan
- [x] Adım 1: `storymap/src/components/sidebar/renderers/detailViewRenderer.js` dosyasında varsayılan zoom seviyesini `10` olarak güncelle.
- [x] Adım 2: `storymap/src/components/sidebar/handlers/detailHandlers.js` dosyasında zoom slider fallback değerini `10` olarak güncelle.
- [x] Adım 3: Değişiklikleri tarayıcıda doğrula.

## Doğrulama Kriterleri
- [x] Yeni bir nokta veya çizim eklendiğinde detay panelindeki "Yakınlaştırma Seviyesi" slider'ının varsayılan değeri `10` olarak açılmalı.
- [x] Tarayıcıda hiçbir JS veya konsol hatası oluşmamalı.

## Sonuç
`ModalComponent.js` dosyasına dokunulmadan, `detailViewRenderer.js` ve `detailHandlers.js` dosyalarında varsayılan yakınlaştırma değerleri `10` olarak güncellendi. Yeni eklenen nokta ve çizimler artık varsayılan olarak `10` zoom seviyesiyle oluşturulmaktadır.
