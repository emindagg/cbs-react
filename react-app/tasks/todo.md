# Görev: Kaydedilmiş StoryMap Projelerinde Vertex Düzenlemenin Çalışmaması Sorununun Giderilmesi
Tarih: 2026-05-18

## Bağlam
Storymap projesi ilk kez oluşturulduğunda vertex düzenleme sorunsuz çalışırken, kaydedilip sayfadan çıkıldıktan ve tekrar girildikten sonra vertex düzenleme çalışmamaktadır. Bunun nedeni, kaydedilmiş veriler yüklenirken haritada oluşturulan GeoJSON kaynak (source) ve katman (layer) ID'lerinin (`drawing-source-${point.id}` / `drawing-layer-${point.id}`) ile `onPointEditStart` / `onPointEditEnd` içindeki düzenleme fonksiyonlarının beklediği katman/kaynak ID'leri (`point.mapLayerId`, yani `polygon-171...` veya `line-171...`) arasında uyuşmazlık olmasıdır. Yükleme esnasında katmanlar uyuşmadığı için eski katman gizlenememekte ve düzenleme sonrası katman güncellenememektedir.

## Plan
- [x] **Adım 1:** `ModalComponent.js` dosyasındaki `addDrawingToMapForViewMode` fonksiyonunda oluşturulan harita kaynak ve katman ID'lerinin, `point.mapLayerId` değeri varsa onu kullanacak şekilde, yoksa mevcut `drawing-source-${point.id}` / `drawing-layer-${point.id}` yapısına düşecek şekilde güncellenmesi.
- [x] **Adım 2:** Çizgi (`line`/`arrow`) çizimlerinin katman yapısının `MapDrawing.js` ile (`${mapLayerId}-layer`) tam uyumlu hale getirilmesi.
- [x] **Adım 3:** Düzenleme başlatıldığında ve bitirildiğinde harita katmanlarının doğru şekilde gizlenmesi ve güncellenmesinin doğrulanması.

## Doğrulama kriterleri
- [x] Kaydedilmiş bir projeye tekrar giriş yapıldığında, çizilmiş alan/çizgilerin vertex düzenleme modu sorunsuz açılmalı (noktalar sürüklenmeli).
- [x] Vertex düzenleme işlemi tamamlandığında, harita üzerindeki çizimin şekli yeni koordinatlara göre başarıyla güncellenmeli ve eski şekil ortadan kalkmalı.
- [x] Kaydetme işlemi sonrasında koordinatlar doğru şekilde veritabanına/dosyaya yazılabilmeli (state güncellenmeli).

## Sonuç
Sorun başarıyla giderildi. `ModalComponent.js` içindeki `addDrawingToMapForViewMode` fonksiyonu, veriler yüklenirken eğer çizim öğesine ait `point.mapLayerId` değeri mevcutsa harita üzerindeki kaynak (source) ve katman (layer) ID'lerinin bu değeri kullanmasını sağlayacak şekilde güncellendi. Böylece, edit modunda `onPointEditStart` ve `onPointEditEnd` tarafından tetiklenen gizleme, güncelleme ve gösterme işlemleri haritadaki katmanlarla tam olarak uyuştu. Yapılan değişiklikler sonrasında proje başarıyla derlendi (build başarılı) ve sistem kararlı şekilde çalışmaya hazır hale getirildi.
