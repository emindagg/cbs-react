# BrandGuide — CBS React

## Marka İlkeleri
- Dil varsayılanı Türkçe; kısa, net ve görev odaklı metin kullanılır.
- Ton teknik ama sade olmalıdır.
- Kullanıcı akışını hızlandıran mikro metinler tercih edilir.

## Renk Sistemi (Design Tokens)
- `brand-chrome`: `#1c1c1e`
- `brand-chrome-hover`: `#2a2a2c`
- `brand-chrome-active`: `#2c2c2e`
- `brand-secondary`: `#059669`
- `brand-secondary-light`: `#10b981`
- `brand-secondary-dark`: `#047857`
- `brand-secondary-muted`: `#d1fae5`

## Renk Kullanım Kuralları
- Birincil aksiyonlarda öncelik `brand-chrome` ailesindedir.
- İkincil/olumlu durumlarda `brand-secondary` ailesi kullanılır.
- Literal hex yerine token/class kullanımı tercih edilir.
- Yeni UI geliştirmelerinde renk tekrarını azaltmak için token dışı sabit renk tanımlanmaz.

## Tipografi ve Yoğunluk
- Mikro label: `text-[9px-10px]`, `uppercase`, `tracking` artırılmış.
- Panel başlıkları: `text-[11px-12px]`, `font-semibold`.
- Aksiyon butonları: kısa metin, `font-medium` veya `font-semibold`.
- Sayısal değerlerde okunabilirlik için mümkünse `tabular-nums` kullanılır.

## Dil Politikası
- Ana arayüz dili Türkçe olmalıdır.
- İngilizce sadece özel ad ve standart formatlarda kullanılabilir (`PDF`, `Excel`, `AWS`, `OpenStreetMap`, `CARTO`).
- Aynı kavram için tek terim kullanılır (`Katman`, `Lejant`, `Alan`).

## Mikro Metin Standardı
- Buton metinleri fiil odaklı ve kısa olur: `Veri Ekle`, `Geri Al`, `İleri Al`.
- Placeholder metinleri yönlendirici örnek içerir: `Örn:` veya `ör.`.
- Durum mesajları tek tip kalıpta yazılır: bekleme, başarı, hata.
- Noktalama tutarlı olmalıdır; butonlarda nokta kullanılmaz.
- İptal/kapat/sil gibi eylem kelimeleri bağlama göre sabit kullanılır, rastgele değişmez.

## İkonografi
- Projede Font Awesome ve Lucide birlikte kullanılmaktadır.
- Yeni eklemelerde aynı panel içinde tek ikon ailesi tercih edilir.
- Küçük aksiyon ikonları metinle birlikte ve tutarlı boyutta kullanılmalıdır.

## Son Milestone Güncellemeleri (2026-04-27)
- Veri oluşturma panelinde `Redo` metni `İleri Al` olarak güncellendi.
- Çizim akışına `Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z` kısayol desteği eklendi.
- Bakı/Eğim analizinde seçim metni `Polygon seçin` yerine `Alan seçin` olarak standartlaştırıldı.
