# Görev: AWS Terrarium ile bakı analizi ekle
Tarih: 2026-04-25

## Bağlam
Kullanıcı veri yüklemeden haritada doğrudan nokta seçerek bakı analizi yapmak istiyor. Çözüm AWS/Mapzen Terrarium DEM tile kaynağına dayanacak ve mevcut feature-first / VSA mimarisine uygun ayrı bir analiz modülü olarak eklenecek.

## Plan
- [x] Adım 1: Mevcut analiz aracı, store ve panel kalıplarını incele.
- [x] Adım 2: `terrain-analysis` feature dosyalarını oluştur.
- [x] Adım 3: AWS Terrarium tile okuma, decode ve Horn bakı/eğim hesaplama servislerini ekle.
- [x] Adım 4: Harita tıklama aracı, sonuç renderer'ı ve panel UI'ını bağla.
- [x] Adım 5: `GISToolsControl`, `MapContainer`, `AppLayout` ve tool store entegrasyonunu yap.
- [x] Adım 6: Birim testleri, TypeScript, build ve Türkçe karakter kontrollerini çalıştır.

## Doğrulama kriterleri
- [x] Kullanıcı haritada tek nokta seçerek bakı sonucunu görebilir.
- [x] Sonuçta yön, derece, eğim ve yükseklik Türkçe olarak gösterilir.
- [x] Analiz sonucu marker ve yön oku MapLibre katmanlarıyla çizilir.
- [x] Araç kapatıldığında sonuç katmanları temizlenir.
- [x] Birim testleri ve build başarılıdır.

## Sonuç
AWS/Mapzen Terrarium DEM tile kaynağıyla nokta tabanlı bakı analizi eklendi. Yeni `terrain-analysis` feature'ı harita tıklamasıyla DEM örnekler, Horn yöntemiyle bakı/eğim hesaplar ve sonucu marker, yön oku ve panel üzerinden Türkçe gösterir.
