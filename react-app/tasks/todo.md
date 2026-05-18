# Görev: Kaydedilmiş StoryMap Projelerinde Vertex Düzenleme, Çizgi Görünmeme, Detay Paneli Zoom ve Çizim Bitirme Noktası Sorunlarının Giderilmesi
Tarih: 2026-05-18

## Bağlam
1. **Vertex Düzenleme Sorunu:** Storymap projesi ilk kez oluşturulduğunda vertex düzenleme sorunsuz çalışırken, kaydedilip sayfadan çıkıldıktan ve tekrar girildikten sonra vertex düzenleme çalışmamaktaydı. Bunun nedeni, kaydedilmiş veriler yüklenirken haritada oluşturulan kaynak ve katman ID'leri (`drawing-source-${point.id}` / `drawing-layer-${point.id}`) ile `onPointEditStart` / `onPointEditEnd` içindeki düzenleme fonksiyonlarının beklediği katman/kaynak ID'leri (`point.mapLayerId`, yani `polygon-171...` veya `line-171...`) arasında uyuşmazlık olmasıydı.
2. **Çizgi Görünmeme Sorunu:** Çizgi düzenleme/çizme modundayken (Mapbox Draw vertex düzenleme modundayken) sadece köşelerdeki noktaların (turuncu halkalar) görünmesi, fakat noktaları birbirine bağlayan ara çizgilerin görünmemesi sorunuydu. Bunun nedeni, `MapDrawing.js` içerisindeki Mapbox Draw `gl-draw-lines` katmanının `line-dasharray` özelliğinde kullanılan geçersiz `[2, 0]` değerinin (içerisinde 0 barındıran dasharray dizisi) Maplibre GL/WebGL tarafından reddedilmesi ve tüm katman çizimini sessizce iptal etmesiydi.
3. **Detay Paneli Varsayılan Zoom Sorunu:** Haritada herhangi bir zoom seviyesindeyken yeni bir çizim/nokta eklendiğinde açılan detay panelinde (detail panel) varsayılan zoom seviyesinin haritanın o anki zoom seviyesi yerine sürekli "14" olarak ayarlanması hatasıydı.
4. **Çizim Bitirme Noktası Sorunu (Eksik Vertex/Nokta):** Poligon, rota veya çizgi çizerken sonuncu noktada çift tıklama (double-click) veya sağ tıklama (contextmenu/right-click) yapıldığında çizimin o anki (örneğin 5.) tıklandığı konumu almadan bir önceki (4.) nokta üzerinde bitirilmesi ve son köşenin/noktanın kaybolması hatasıydı.

## Plan
- [x] **Adım 1:** `ModalComponent.js` dosyasındaki `addDrawingToMapForViewMode` fonksiyonunda oluşturulan harita kaynak ve katman ID'lerinin, `point.mapLayerId` değeri varsa onu kullanacak şekilde, yoksa mevcut `drawing-source-${point.id}` / `drawing-layer-${point.id}` yapısına düşecek şekilde güncellenmesi.
- [x] **Adım 2:** Çizgi (`line`/`arrow`) çizimlerinin katman yapısının `MapDrawing.js` ile (`${mapLayerId}-layer`) tam uyumlu hale getirilmesi.
- [x] **Adım 3:** Düzenleme başlatıldığında ve bitirildiğinde harita katmanlarının doğru şekilde gizlenmesi ve güncellenmesinin doğrulanması.
- [x] **Adım 4:** `MapDrawing.js` içindeki Mapbox Draw `gl-draw-lines` katmanının paint ayarlarından geçersiz ve uyumsuz olan `'line-dasharray'` özelliğinin kaldırılması ve çizgilerin hem aktif hem pasif modda düz çizgi olarak kararlı şekilde çizilmesinin sağlanması.
- [x] **Adım 5:** `SidebarComponent.js` üzerinde `onGetCurrentZoom` isimli bir callback mekanizması tanımlanması. Detay paneli açıldığında (`showPointDetail`) eğer noktanın/çizimin kendine ait kaydedilmiş bir zoom seviyesi yoksa haritanın o anki aktif zoom seviyesinin bu callback ile sorgulanıp otomatik varsayılan zoom olarak atanması.
- [x] **Adım 6:** `ModalComponent.js` içerisinde `this.sidebarComponent.onGetCurrentZoom` metodunun haritanın güncel zoom değerini (`Math.round(this.mapComponent.map.getZoom())`) dönecek şekilde bağlanması.
- [x] **Adım 7:** `MapDrawing.js` içerisinde çizim yapılırken haritanın varsayılan çift tıklama ile yakınlaştırma (doubleClickZoom) özelliğinin geçici olarak devredışı bırakılması ve çizim bittiğinde (`disableMode`) tekrar aktif edilmesi.
- [x] **Adım 8:** Poligon, rota ve çizgi modlarında sağ tıklama (`contextmenu`) yapıldığında tıklanan son koordinatın mükerrer olmayacak şekilde `points` dizisine eklenmesi ve ardından çizimin başarıyla tamamlanması.
- [x] **Adım 9:** Çift tıklama (`dblclick`) için harita üzerinde yerel bir dinleyici (listener) tanımlanması, çift tıklamanın ilk basımı ile eklenen son koordinatı koruyarak çizimi mükemmel şekilde o noktada sonlandırması.

## Doğrulama kriterleri
- [x] Kaydedilmiş bir projeye tekrar giriş yapıldığında, çizilmiş alan/çizgilerin vertex düzenleme modu sorunsuz açılmalı (noktalar sürüklenmeli).
- [x] Vertex düzenleme işlemi tamamlandığında, harita üzerindeki çizimin şekli yeni koordinatlara göre başarıyla güncellenmeli ve eski şekil ortadan kalkmalı.
- [x] Çizgi düzenleme moduna girildiğinde noktalarla beraber ara çizgiler de haritada net ve kesintisiz şekilde görünmeli.
- [x] Haritada herhangi bir zoom seviyesindeyken yeni bir çizim yapıldığında veya nokta eklendiğinde, açılan detay panelinde haritanın o anki tam yuvarlanmış zoom seviyesi varsayılan değer olarak otomatik seçilmeli.
- [x] Çizim yaparken çift tıklama veya sağ tıklama ile çizim bitirildiğinde, en son tıklanan (örneğin 5.) nokta da çizime başarıyla dahil edilmeli ve şekil eksiksiz tamamlanmalı.
- [x] Kaydetme işlemi sonrasında koordinatlar doğru şekilde veritabanına/dosyaya yazılabilmeli (state güncellenmeli).

## Sonuç
Sorunlar başarıyla giderildi:
1. `ModalComponent.js` içindeki `addDrawingToMapForViewMode` fonksiyonu, veriler yüklenirken eğer çizim öğesine ait `point.mapLayerId` değeri mevcutsa harita üzerindeki kaynak (source) ve katman (layer) ID'lerinin bu değeri kullanmasını sağlayacak şekilde güncellendi. Böylece, edit modunda `onPointEditStart` ve `onPointEditEnd` tarafından tetiklenen gizleme, güncelleme ve gösterme işlemleri haritadaki katmanlarla tam olarak uyuştu.
2. `MapDrawing.js` içindeki Mapbox Draw `gl-draw-lines` stilinden geçersiz olan `'line-dasharray'` tanımı kaldırıldı. Bu sayede Maplibre GL çizim motoru katmanı başarıyla derleyip çizmeye başladı ve ara çizgiler düzenleme modunda sorunsuz görünür hale geldi.
3. `SidebarComponent.js` içerisine dinamik `onGetCurrentZoom` callback'i eklendi ve `showPointDetail` fonksiyonunda nokta kopyalanırken zoom bilgisi olmayan elemanlara haritanın o anki zoom seviyesi atandı. `ModalComponent.js` üzerinde de bu callback harita bileşeninin güncel zoom seviyesini (`Math.round(this.mapComponent.map.getZoom())`) dönecek şekilde yapılandırıldı.
4. `MapDrawing.js` içerisindeki tüm çizim modlarında (`polygon`, `line`, `route`, `rectangle`, `circle`) çift tıklamayla haritanın yakınlaşması (`doubleClickZoom`) geçici olarak devredışı bırakılarak koordinat kayması engellendi. Sağ tıklama (`contextmenu`) durumunda son tıklanan koordinatın çizime eklenmesi sağlandı. Çift tıklama (`dblclick`) olayı da harita üzerinde dinlenerek son tıklanan noktanın başarıyla şekle dahil edilerek çizimin orada bitirilmesi sağlandı.
5. Yapılan tüm değişiklikler sonrasında proje başarıyla derlendi (build başarılı) ve sistem kararlı şekilde çalışmaya hazır hale getirildi.

