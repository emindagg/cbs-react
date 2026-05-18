# Görev: Rota ve Timeline Şablonlarında Pulse Denetimi
Tarih: 2026-05-18

## Bağlam
Nokta Bazlı şablona eklenen aktif pulse göstergesinin Rota Bazlı ve Timeline Bazlı şablonlarda da çalışıp çalışmadığı kontrol edilmelidir. Bu şablonların odak, oynatma ve detay navigasyonu akışları farklı callback'lerden geçmektedir.

## Plan
- [x] Adım 1: Rota Bazlı şablonda nokta odaklama ve oynatma akışlarını denetle.
- [x] Adım 2: Timeline Bazlı şablonda event odaklama, playback, ileri/geri ve detay navigasyonu akışlarını denetle.
- [x] Adım 3: Eksik bağlantı varsa pulse çağrılarını ekle.
- [x] Adım 4: Söz dizimi ve Türkçe karakter/encoding kontrollerini çalıştır.

## Doğrulama kriterleri
- [x] Rota odaklama ve oynatma akışları `_setActiveMarkerBorder(point)` üzerinden pulse'ı tetiklemeli.
- [x] Timeline playback, ileri/geri event ve detay navigasyonu `_setActiveMarkerBorder(point)` üzerinden pulse'ı tetiklemeli.
- [x] Durdurma/temizleme akışları `_setActiveMarkerBorder(null)` ile pulse'ı kapatmalı.
- [x] JavaScript söz dizimi hatası olmamalı.
- [x] UTF-8 ve Türkçe karakter bütünlüğü korunmalı.

## Sonuç
Rota ve Timeline şablonları denetlendi. Rota odaklama ve ortak oynatma akışları ile Timeline playback, ileri/geri, detay navigasyonu ve odaklama akışları zaten `_setActiveMarkerBorder(point)` üzerinden geçiyor. Pulse yönetimi bu metoda bağlı olduğu için ek kod gerekmedi; durdurma akışlarında `_setActiveMarkerBorder(null)` pulse'ı kapatıyor.
