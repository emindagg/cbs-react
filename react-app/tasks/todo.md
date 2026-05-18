# Görev: Kaydedilmiş StoryMap Projelerinde Vertex Düzenleme, Çizgi Görünmeme, Detay Paneli Zoom Sorunları ve İnteraktif Vertex Seçim Özelliğinin Giderilmesi
Tarih: 2026-05-18

## Bağlam
1. **Vertex Düzenleme Sorunu:** Storymap projesi ilk kez oluşturulduğunda vertex düzenleme sorunsuz çalışırken, kaydedilip sayfadan çıkıldıktan ve tekrar girildikten sonra vertex düzenleme çalışmamaktaydı. Bunun nedeni, kaydedilmiş veriler yüklenirken haritada oluşturulan kaynak ve katman ID'leri (`drawing-source-${point.id}` / `drawing-layer-${point.id}`) ile `onPointEditStart` / `onPointEditEnd` içindeki düzenleme fonksiyonlarının beklediği katman/kaynak ID'leri (`point.mapLayerId`, yani `polygon-171...` veya `line-171...`) arasında uyuşmazlık olmasıydı.
2. **Çizgi Görünmeme Sorunu:** Çizgi düzenleme/çizme modundayken (Mapbox Draw vertex düzenleme modundayken) sadece köşelerdeki noktaların (turuncu halkalar) görünmesi, fakat noktaları birbirine bağlayan ara çizgilerin görünmemesi sorunuydu. Bunun nedeni, `MapDrawing.js` içerisindeki Mapbox Draw `gl-draw-lines` katmanının `line-dasharray` özelliğinde kullanılan geçersiz `[2, 0]` değerinin (içerisinde 0 barındıran dasharray dizisi) Maplibre GL/WebGL tarafından reddedilmesi ve tüm katman çizimini sessizce iptal etmesiydi.
3. **Detay Paneli Varsayılan Zoom Sorunu:** Haritada herhangi bir zoom seviyesindeyken yeni bir çizim/nokta eklendiğinde açılan detay panelinde (detail panel) varsayılan zoom seviyesinin haritanın o anki zoom seviyesi yerine sürekli "14" olarak ayarlanması hatasıydı.
4. **İnteraktif Vertex Seçim İsteği:** "Düzenle" butonuna tıklandığında vertex noktalarının haritada otomatik olarak hemen açılması yerine, çizimin önce normal (seçim modunda) görünmesi ve sadece kullanıcı harita üzerindeki objeye (alan, çizgi vb.) tıkladığı anda vertex noktalarının görünür hale gelerek düzenleme modunun (direct_select) aktif olması talebi.

## Plan
- [x] **Adım 1:** `ModalComponent.js` dosyasındaki `addDrawingToMapForViewMode` fonksiyonunda oluşturulan harita kaynak ve katman ID'lerinin, `point.mapLayerId` değeri varsa onu kullanacak şekilde, yoksa mevcut `drawing-source-${point.id}` / `drawing-layer-${point.id}` yapısına düşecek şekilde güncellenmesi.
- [x] **Adım 2:** Çizgi (`line`/`arrow`) çizimlerinin katman yapısının `MapDrawing.js` ile (`${mapLayerId}-layer`) tam uyumlu hale getirilmesi.
- [x] **Adım 3:** Düzenleme başlatıldığında ve bitirildiğinde harita katmanlarının doğru şekilde gizlenmesi ve güncellenmesinin doğrulanması.
- [x] **Adım 4:** `MapDrawing.js` içindeki Mapbox Draw `gl-draw-lines` katmanının paint ayarlarından geçersiz ve uyumsuz olan `'line-dasharray'` özelliğinin kaldırılması ve çizgilerin hem aktif hem pasif modda düz çizgi olarak kararlı şekilde çizilmesinin sağlanması.
- [x] **Adım 5:** `SidebarComponent.js` üzerinde `onGetCurrentZoom` isimli bir callback mekanizması tanımlanması. Detay paneli açıldığında (`showPointDetail`) eğer noktanın/çizimin kendine ait kaydedilmiş bir zoom seviyesi yoksa haritanın o anki aktif zoom seviyesinin bu callback ile sorgulanıp otomatik varsayılan zoom olarak atanması.
- [x] **Adım 6:** `ModalComponent.js` içerisinde `this.sidebarComponent.onGetCurrentZoom` metodunun haritanın güncel zoom değerini (`Math.round(this.mapComponent.map.getZoom())`) dönecek şekilde bağlanması.
- [x] **Adım 7:** `ModalComponent.js` içinde `onPointEditStart` tetiklendiğinde `direct_select` modunu varsayılan olarak hemen açmak yerine çizimi Mapbox Draw'a ekleyip `simple_select` modunda bırakmak.
- [x] **Adım 8:** Harita üzerinde `draw.selectionchange` event'ini dinleyerek, kullanıcı ilgili çizim objesine tıkladığı anda `direct_select` moduna geçerek vertex noktalarını görünür yapmak.
- [x] **Adım 9:** Düzenleme bitiminde (`onPointEditEnd`) yeni oluşturulan event listener'ı temizlemek.

## Doğrulama kriterleri
- [x] Kaydedilmiş bir projeye tekrar giriş yapıldığında, çizilmiş alan/çizgilerin vertex düzenleme modu sorunsuz açılmalı (noktalar sürüklenmeli).
- [x] Vertex düzenleme işlemi tamamlandığında, harita üzerindeki çizimin şekli yeni koordinatlara göre başarıyla güncellenmeli ve eski şekil ortadan kalkmalı.
- [x] Çizgi düzenleme moduna girildiğinde noktalarla beraber ara çizgiler de haritada net ve kesintisiz şekilde görünmeli.
- [x] Haritada herhangi bir zoom seviyesindeyken yeni bir çizim yapıldığında veya nokta eklendiğinde, açılan detay panelinde haritanın o anki tam yuvarlanmış zoom seviyesi varsayılan değer olarak otomatik seçilmeli.
- [x] "Düzenle" butonuna tıklandığında vertex noktaları hemen açılmamalı, obje haritada yalın şekilde görünmeli. Haritadaki çizime tıklandığı anda vertex düzenleme noktaları belirip düzenleme aktif olmalı.
- [x] Kaydetme işlemi sonrasında koordinatlar doğru şekilde veritabanına/dosyaya yazılabilmeli (state güncellenmeli).

## Sonuç
Sorunlar başarıyla giderildi:
1. `ModalComponent.js` içindeki `addDrawingToMapForViewMode` fonksiyonu, veriler yüklenirken eğer çizim öğesine ait `point.mapLayerId` değeri mevcutsa harita üzerindeki kaynak (source) ve katman (layer) ID'lerinin bu değeri kullanmasını sağlayacak şekilde güncellendi. Böylece, edit modunda `onPointEditStart` ve `onPointEditEnd` tarafından tetiklenen gizleme, güncelleme ve gösterme işlemleri haritadaki katmanlarla tam olarak uyuştu.
2. `MapDrawing.js` içindeki Mapbox Draw `gl-draw-lines` stilinden geçersiz olan `'line-dasharray'` tanımı kaldırıldı. Bu sayede Maplibre GL çizim motoru katmanı başarıyla derleyip çizmeye başladı ve ara çizgiler düzenleme modunda sorunsuz görünür hale geldi.
3. `SidebarComponent.js` içerisine dinamik `onGetCurrentZoom` callback'i eklendi ve `showPointDetail` fonksiyonunda nokta kopyalanırken zoom bilgisi olmayan elemanlara haritanın o anki zoom seviyesi atandı. `ModalComponent.js` üzerinde de bu callback harita bileşeninin güncel zoom seviyesini (`Math.round(this.mapComponent.map.getZoom())`) dönecek şekilde yapılandırıldı.
4. Düzenleme moduna girildiğinde vertex noktalarının hemen açılması engellenerek interaktif seçim moduna geçildi. `_onDrawSelectionChangeHandler` event listener'ı eklenerek, kullanıcının haritadaki çizime tek bir tıklamasıyla `direct_select` moduna geçilmesi ve vertexlerin o anda dinamik olarak gösterilmesi sağlandı. Düzenleme bittiğinde ise bu event listener düzgünce bellekten temizlendi.
5. Yapılan tüm değişiklikler sonrasında proje başarıyla derlendi (build başarılı) ve sistem kararlı şekilde çalışmaya hazır hale getirildi.
