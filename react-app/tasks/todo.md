# Görev: README adını ve özetini güncelle
Tarih: 2026-03-26

## Bağlam
`README.md` hâlâ eski proje adı ve eski feature sayısı üzerinden konuşuyor.
README içeriğinin `OGM Materyal CBS` adıyla ve güncel 19 feature envanteriyle hizalanması gerekiyor; varsa yanlış ürün adı referansları kaldırılmalı.

## Plan
- [x] Adım 1: Mevcut README içeriğini ve proje adı referanslarını tara
- [x] Adım 2: README başlığını ve ürün adını `OGM Materyal CBS` olacak şekilde güncelle
- [x] Adım 3: README özetini, feature sayısını ve ana modül listesini güncel repo durumuna göre hizala
- [x] Adım 4: Diff ve encoding kontrolleriyle değişikliği doğrula

## Doğrulama kriterleri
- [x] README başlığı `OGM Materyal CBS` olmalı
- [x] README içindeki feature sayısı ve feature listesi güncel repo ile uyumlu olmalı
- [x] Yanlış ürün adı referansları README içinde bulunmamalı
- [x] Türkçe karakterler ve UTF-8 bütünlüğü korunmalı
- [x] Değişiklik diff'i yalnızca gerekli dosyaları içermeli

## Sonuç
`README.md` proje adı ve özet akışı açısından güncellendi.
Doğrulama için README taraması, feature klasör sayısı kontrolü ve `git diff --check -- README.md tasks/todo.md` kullanıldı.
