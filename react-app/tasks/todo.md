# Görev: En Yakın Geometri – İki Katmanlı (Girdi / Hedef) Analiz
Tarih: 2026-05-12

## Bağlam
ArcGIS Pro "Generate Near Table" aracının lise CBS dersine uygun bir alt kümesini eklemek istiyoruz. Mevcut "En Yakın Geometri" analizi tek `FeatureCollection` üzerinde çalışıyor; öğrenci "okul → en yakın hastane" gibi cross-layer sorgular yapamıyor. Bu görevde kullanıcı iki ayrı katman (örn. `okullar.geojson` ve `hastaneler.geojson`) içe aktardıktan sonra "Girdi katmanı" + "Hedef katmanı" seçip arama yarıçapı (km) ve top-N (1/3/5) belirleyerek analiz yapacak.

## Plan
- [x] Adım 1: `NearestPointsConfig` tiplerine `inputLayer`, `targetLayer`, `searchRadiusKm`, `closestCount` ekle (opsiyonel, geriye uyumlu).
- [x] Adım 2: `useSpatialAnalysisStore` defaultlarını ve setter'ı güncelle.
- [x] Adım 3: `NearestPointsRenderer.render` imzasını `inputs + targets?` olarak genişlet; topN ve radius filtresi uygula. Targets `null` ise eski self-pair davranışı korunsun.
- [x] Adım 4: `useSpatialAnalysis` hook'unda `sourceLabel` bazlı `availableLayers` listesi türet; config'e göre iki ayrı koleksiyon hazırla.
- [x] Adım 5: `SpatialAnalysisPanel` içine "Girdi/Hedef" dropdown'ları, "Arama yarıçapı (km)" input ve "En yakın N" seçici ekle.
- [x] Adım 6: `pnpm build` çalıştırıldı (temiz). Değişen alanlarda `eslint` çalıştırıldı (temiz). Mevcut diğer pre-existing lint hataları kapsam dışı.

## Doğrulama kriterleri
- [x] Panelde "Girdi" ve "Hedef" dropdown'larında `sourceLabel` bazlı katman listesi var; çizilen öğeler "Çizilenler" altında gruplanır.
- [x] "Girdi=X, Hedef=Y, Radius=5 km, N=1" akışı: her girdi için yarıçap içinde en yakın 1 hedef hesaplanır; radius dışı çiftler `searchRadiusKm` filtresiyle elenir.
- [x] Girdi seçilmemiş (Tüm veri) iken eski self-pair davranışı korunur (`targets === null` modu).
- [x] `closestCount` 1/3/5 seçeneklerinde topN sıralanmış olarak çizilir.
- [x] `pnpm build` temiz biter, kendi değişikliklerimde lint hatası yok.
- [x] Türkçe etiketler (Girdi katmanı, Hedef katmanı, Arama yarıçapı, En yakın kaç hedef?, Çizilenler, Aynı katman içi) UI'da bozulmadan görünür.

## Sonuç
ArcGIS Generate Near Table'ın lise seviyesine uygun alt kümesi eklendi:

- **Tipler/Store:** `NearestPointsConfig` artık `inputLayer`, `targetLayer`, `searchRadiusKm`, `closestCount` taşıyor. Default: tüm alanlar `null` / `1`, böylece eski davranış bozulmuyor.
- **Renderer:** `render(inputs, targets | null, style, config)` — iki koleksiyon modu (cross-layer) ve tek koleksiyon modu (self-pair). bbox prune + topN sıralama + radius filtresi. Çizgi/etiket feature'larında `rank`, `inputId`, `targetId` property'leri.
- **Hook:** `availableLayers` türetildi (`sourceLabel` bazlı + `__drawn__` özel grubu). `filterByLayer` ile iki ayrı `FeatureCollection` üretiliyor; targetLayer boş/aynı ise self-pair'e düşer.
- **UI:** Panele "Katmanlar" bölümü: Girdi/Hedef dropdown, sınırsız bırakılabilen yarıçap input ve 1/3/5 pill butonları.
- Build temiz, ilgili dosyalarda lint hatası yok.

---

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
