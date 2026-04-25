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

---

# Milestone: Polygon Eğim + Dinamik LOD + Sürüklenebilir Lejant
Tarih: 2026-04-25

## Bağlam
Polygon tabanlı eğim analizi 25 km²'lik sert sınırla başlatılmıştı; büyük alanlarda tile patlaması ve UI tıkanması riski vardı. Kullanıcı 25 km²'den daha büyük alanları analiz etmek istedi (LOD yaklaşımı). Ek olarak lejant ana panele sıkışmış ve altlık harita görünmüyordu.

## Plan
- [x] `selectLODForArea` ile alana göre dinamik zoom + raster boyutu seç (8–15 zoom aralığı).
- [x] `polygonSlopeAnalysis.ts`'te 25 km² sert sınırı kaldır, 10.000 km²'ye yükselt; tile budget koruması ekle.
- [x] DEM tile okumalarını satır bazlı paralel hale getir (önceden tamamen sıralıydı).
- [x] Raster çözünürlüğü 256² → 512² hedefe çıkar, `raster-resampling: linear`, opaklık 0.92.
- [x] TKGM bazlı 5 sınıflı renk skalası (ColorBrewer RdYlGn).
- [x] `TerrainSlopeLegend` sürüklenebilir bileşeni oluştur (alt-orta varsayılan, daraltma + kapatma).
- [x] Ana panele opaklık slider'ı ekle, sınıf bilgisi lejanta taşı.
- [x] Sınıf bazlı sayım yerine yüzde + km² gösterimi.
- [x] Bakı oku uzunluğu eğim yüzdesine göre dinamik (200–900 m).
- [x] `AttributionInfoButton` içine `AWS Terrarium DEM` atfı ekle.
- [x] UI metinlerini sadeleştir (`Bakı ve Eğim Analizi`, `Eğim Analizi`, `Bakı Analizi`).

## Doğrulama kriterleri
- [x] 5 km², 100 km², 1000 km² polygonlar tile patlatmadan analiz edilir.
- [x] Lejant sürüklenebilir, daraltılabilir, opaklık ana panelden değişir.
- [x] Bakı okunun uzunluğu düz arazide kısa, sarp arazide uzun.
- [x] `pnpm build` hatasız tamamlanır.
- [x] FEATURES.md güncellendi.

## Sonuç
Eğim analizi ölçeklenebilir hale geldi. LOD sistemi sayesinde alan-bağımsız sabit performans (~512² piksel, ≤144 tile). Kullanıcı opaklık ile altlık haritayı görebiliyor, lejantı istediği yere taşıyabiliyor. Bakı oku artık eğim şiddetini görsel olarak yansıtıyor.
