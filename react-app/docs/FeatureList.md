# FeatureList — CBS React

## MVP
- Harita görüntüleme ve katman yönetimi
- Veri içe aktarma (GeoJSON/CSV/Excel/KML/SHP)
- Veri oluşturma (Nokta, Çizgi, Alan)
- Veri katalogu ve görünürlük yönetimi

## Milestone: v0.1 (Tamamlanan)
- Ölçüm ve temel GIS araçları
- Isı haritası, enterpolasyon, mekansal analiz araçları
- Bakı ve eğim analizi paneli

## Milestone: v0.1.1 (2026-04-27, Tamamlanan)
- Veri oluşturma çizim akışına geçmiş yönetimi:
  - `Geri Al`
  - `İleri Al`
- Çizim için klavye kısayolları:
  - `Ctrl+Z`
  - `Ctrl+Y`
  - `Ctrl+Shift+Z`
- Bakı/Eğim analizinde polygon seçim metni iyileştirmesi:
  - `Polygon seçin` -> `Alan seçin`

## Milestone: v0.1.2 (2026-04-27, Tamamlanan)
- Öznitelik tablosu silme uyarı modalı Linear benzeri kompakt stile güncellendi
- Uyarı metinleri standardize edildi:
  - `Satırları sil` -> `Verileri sil`
- Silme aksiyonuna loading durumu eklendi:
  - `İşleniyor...` spinner
  - İşlem süresinde aksiyon butonları `disabled`

## v1.0 Hedefleri
- Gelişmiş düzenleme geçmişi (çok adımlı history paneli)
- Kısayol görünürlüğü ve yardım tooltipleri
- Analiz panellerinde metin standardizasyonunun tamamlanması
