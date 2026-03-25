# Görev: COLOR_SCALE dokümanlarını projeye göre güncelle
Tarih: 2026-03-25

## Bağlam
`docs/COLOR_SCALE_FEATURES.md` ve `docs/ARCHITECTURE.md` dosyaları mevcut React uygulamasındaki gerçek renk ölçeği akışını eksik veya kısmen eski şekilde anlatıyor.
Özellikle Step3 görünürlük kuralları, stepped/continuous ayrımı, renderer ilişkisi ve architecture içindeki renk ölçeği zinciri kodla birebir hizalanmalı.

## Plan
- [x] Adım 1: Proje yapısını, ilgili docs dosyalarını ve renk ölçeğiyle ilgili kod yollarını incele
- [x] Adım 2: Mevcut implementasyondaki gerçek feature setini ve mimari akışı çıkar, yanlış doküman iddialarını temizle
- [x] Adım 3: `docs/COLOR_SCALE_FEATURES.md` dosyasını Türkçe, güncel ve kodla hizalı şekilde son doğrulamayla güncelle
- [x] Adım 4: `docs/ARCHITECTURE.md` içindeki görselleştirme ve renk ölçeği bölümlerini gerçek state/render zincirine göre güncelle
- [x] Adım 5: Diff ve ilgili test/okuma kontrolleriyle doğrula

## Doğrulama kriterleri
- [x] Dokümanlarda geçen dosya yolları ve bileşen adları repo ile birebir eşleşmeli
- [x] İki doküman da sadece gerçekten mevcut olan UI davranışlarını, store sözleşmelerini ve utility yeteneklerini anlatmalı
- [x] Architecture dokümanı `vizSettings` / `colorConfig` ayrımını, renderer expression akışını ve bubble tek renk istisnasını doğru anlatmalı
- [x] Türkçe karakterler ve UTF-8 bütünlüğü korunmalı
- [x] Değişiklik diff'i yalnızca gerekli dosyaları içermeli

## Sonuç
`docs/COLOR_SCALE_FEATURES.md`, `docs/ARCHITECTURE.md` ve `tasks/todo.md` güncellendi.
Doğrulama için `git diff --check`, hedefli dosya yolu aramaları, UTF-8 bozulma taraması ve diff kapsam kontrolü yapıldı.
