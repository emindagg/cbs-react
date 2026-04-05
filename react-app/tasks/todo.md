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

---

# Görev: proje analizi
Tarih: 2026-04-05

## Bağlam
Kullanıcı mevcut kod tabanının stack'ini, mimarisini, klasör organizasyonunu ve dikkat edilmesi gereken teknik noktaları anlamak istiyor.
Amaç, varsayım yapmadan mevcut dosyalardan hareketle kısa ama teknik olarak güvenilir bir proje analizi çıkarmak.

## Plan
- [x] Adım 1: Kök yapı, script'ler, TypeScript/Vite yapılandırması ve temel dokümanları okuyup stack özetini çıkar
- [x] Adım 2: `src/` altında uygulama kabuğu, feature modülleri, store'lar ve shared katmanlarını inceleyip mimari akışı çıkar
- [x] Adım 3: Test/lint/build yüzeyi ile dikkat çeken teknik riskleri ve güçlü yönleri belirle
- [x] Adım 4: Bulguları kullanıcıya kısa, düzenli ve dosya referanslı biçimde raporla

## Doğrulama kriterleri
- [x] Analiz proje stack'ini, ana modülleri ve giriş akışını somut dosya referanslarıyla açıklamalı
- [x] Mimari gözlemler varsayıma değil okunan dosyalara dayanmalı
- [x] Test/lint/build komutları ve mevcut görev durumu raporda yer almalı
- [x] Türkçe karakterler ve UTF-8 bütünlüğü korunmalı

## Sonuç
Proje stack'i, root orchestration akışı, feature-first modül sınırları, shared/store katmanları ve doğrulama yüzeyi dosya referanslarıyla analiz edildi.
`npm run test:run` başarılı, `npm run build` başarılı, `npm run lint` ise özellikle feature sınırı ve import sırası ihlalleri nedeniyle başarısız bulundu; ayrıca persistence temizliği ve hardcoded anahtarlar gibi dikkat gerektiren noktalar tespit edildi.
