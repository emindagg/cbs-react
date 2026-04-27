# PRD — CBS React

## Ürün Amacı
- Kullanıcının harita üzerinde veri oluşturma, yönetme ve analiz etme süreçlerini hızlı ve hatasız yürütmesini sağlamak.

## Hedef Kullanıcılar
- CBS analistleri
- Saha/veri operasyon ekipleri
- Karar destek ekipleri

## Temel Kullanıcı Hikayeleri
- Kullanıcı olarak haritada `Nokta / Çizgi / Alan` çizebilmek istiyorum.
- Kullanıcı olarak yanlış nokta eklediğimde geri alabilmek ve tekrar uygulayabilmek istiyorum.
- Kullanıcı olarak bakı/eğim analizinde Türkçe ve anlaşılır terimler görmek istiyorum.

## Fonksiyonel Gereksinimler
- Veri oluşturma paneli `Nokta`, `Çizgi`, `Alan` araçlarını sunar.
- Çizim akışında geçmiş yönetimi bulunur:
  - `Geri Al`
  - `İleri Al`
- Klavye kısayolları desteklenir:
  - `Ctrl+Z`: geri al
  - `Ctrl+Y`: ileri al
  - `Ctrl+Shift+Z`: ileri al (ek uyumluluk)
- Bakı/Eğim analizinde polygon seçim alanında kullanıcı metni Türkçe olmalıdır (`Alan seçin`).

## Fonksiyonel Olmayan Gereksinimler
- UI dili Türkçe ve tutarlı olmalı.
- Çizim etkileşimi akıcı olmalı, mevcut harita araçlarını bozmamalı.
- Mevcut feature sınırları korunmalı (DistanceTool etkilenmemeli).

## Kabul Kriterleri
- Veri oluşturma panelinde buton metni:
  - `Geri Al`
  - `İleri Al`
- Çizim sırasında `Ctrl+Z` ve `Ctrl+Y` beklendiği gibi çalışır.
- Bakı/Eğim analiz panelinde placeholder `Alan seçin` görünür.

## Son Milestone Güncellemesi (2026-04-27)
- Veri oluşturma çizimine undo/redo geçmişi eklendi.
- Undo/redo metinleri Türkçeleştirildi.
- `Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z` kısayolları eklendi.
- Terrain Analysis polygon select metni `Polygon seçin` -> `Alan seçin` olarak güncellendi.
