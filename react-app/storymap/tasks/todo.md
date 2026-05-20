# Görev: GeoJSON İçe Aktarımında Renk Değişimi Hatasının Düzeltilmesi
Tarih: 2026-05-20

## Bağlam
CBS verisi (GeoJSON vb.) içe aktarıldığında oluşan çizim nesnelerinin rengi değiştirildiğinde, haritadaki salt okunur katmanlar gizli olduğundan ve Mapbox GL Draw eklentisindeki aktif çizim rengi dinamik güncellenemediğinden renk değişimi haritaya anında yansımamaktadır. Ayrıca detay görünümünden çıkıldığında veya kaydedildiğinde koordinat/renk uyuşmazlığı nedeniyle çizimler haritadan silinebilmektedir. Konsolda da `Unknown action: import` uyarısı yer almaktadır.

## Plan
- [x] Adım 1: `PointManager.js` dosyasındaki `addDrawing` metodunu `drawingType` ve `mapLayerId` değerlerini esnek şekilde alacak şekilde güncellemek.
- [x] Adım 2: `ModalComponent.js` içindeki `onImportDataSubmit` metodunda çizimler eklenirken `type` ve `drawingType` alanlarının doğru gönderildiğinden emin olmak.
- [x] Adım 3: `ActionManager.js` içindeki `handleAction` switch-case yapısına `case 'import':` ekleyerek konsoldaki `Unknown action: import` uyarısını gidermek.
- [x] Adım 4: `ModalComponent.js` içindeki `onPointStyleUpdate` metodunu, renk değiştiğinde Mapbox Draw koordinatlarını alacak, derinlik kontrolüyle LineString/Polygon formatlarını garanti altına alacak, `source.setData` ile salt okunur katmanı güncelleyecek ve `visible` yaparak rengi haritada anında gösterecek şekilde güncellemek.
- [x] Adım 5: `ModalComponent.js` içindeki `onPointEditEnd` metodunu, kaydetme/bitirme esnasında derinlik kontrolüyle `source.setData` çağırıp ardından `updateDrawingColor` tetikleyerek çizimin nihai rengini garanti altına alacak şekilde güncellemek.

## Doğrulama kriterleri
- [x] İçe aktarılan çizim nesnelerinde `mapLayerId` ve `drawingType` alanlarının doğru set edilmesi.
- [x] Konsoldaki `Unknown action: import` uyarısının tamamen kaybolması.
- [x] Renk değiştiğinde haritadaki poligon/çizgi renginin anında güncellenmesi.
- [x] Kaydetme işlemi sonrasında veya renk seçildiğinde çizimin haritadan kaybolmaması.

## Sonuç
CBS verisi içe aktarımı sonrası renk değiştirme ve çizimin haritadan kaybolması hataları kökten çözülmüştür. Koordinat dizisi derinlik kontrolü sayesinde Mapbox GL JS geçersiz GeoJSON almamakta ve çizimler asla haritadan silinmemektedir. Renk güncellemeleri hem düzenleme anında hem de kaydetme sonrasında anlık olarak yansıtılmaktadır. `import` eylem uyarısı konsoldan giderilmiştir.
