# Görev: Harita Çizimleri ve Noktaları İçin Vertex Düzenleme Özelliği
Tarih: 2026-05-18

## Bağlam
Kullanıcının storymap üzerinde çizdiği alan (polygon), çizgi (line), daire (circle), dikdörtgen (rectangle) gibi geometrilerin düzenleme moduna girildiğinde vertex (köşe) noktalarının harita üzerinde ArcGIS/QGIS standartlarında düzenlenebilmesi ve normal/metin marker konumlarının sürüklenebilmesi istenmektedir. Bunun için Mapbox GL Draw kütüphanesi entegre edilecek ve marker sürükleme mekanizması kurulacaktır.

## Plan
- [x] Adım 1: `storymap/app.html` dosyasına Mapbox GL Draw CSS ve JS CDN bağlantılarını ekle.
- [x] Adım 2: `storymap/src/components/map/modules/MapDrawing.js` modülünde Mapbox GL Draw kontrolünü (`MapboxDraw`) arka planda başlat ve haritaya ekle.
- [x] Adım 3: `storymap/src/components/sidebar/SidebarComponent.js` modülünde:
    - [x] `showPointDetail` fonksiyonunun sonunda `onPointEditStart(point)` callback'ini çağır.
    - [x] `showListView` fonksiyonunun başında `onPointEditEnd(originalPoint)` callback'ini çağır.
    - [x] `savePointDetail` fonksiyonunda koordinatları kaydederken `coords: this.editingPoint.coords || originalPoint.coords` şeklinde güncel koordinatları kullanmasını sağla.
- [x] Adım 4: `storymap/src/components/ModalComponent.js` içindeki `setupSidebarCallbacks()` fonksiyonunda:
    - [x] `sidebarComponent.onPointEditStart(point)` tanımla: Çizim ise read-only katmanı gizle, Mapbox GL Draw'a ekle ve `direct_select` moduna geçip vertexleri düzenlenebilir yap; Marker ise `marker.setDraggable(true)` yap ve sürükleme sonunu dinle.
    - [x] `sidebarComponent.onPointEditEnd(point)` tanımla: Çizim ise draw'dan silip, haritadaki read-only katmanı güncelleyerek görünür yap; Marker ise `marker.setDraggable(false)` yap ve sürüklemeyi kapat (iptal edilmişse koordinatlarını eski haline çek).
- [x] Adım 5: Harita üzerinde hem çizimlerin (polygon, line) hem de markerların sürüklenip düzenlenmesini ve "Kaydet" veya "İptal" butonlarıyla entegrasyonu test et.

## Doğrulama Kriterleri
- [x] Çizilen alan veya çizgi düzenle moduna girildiğinde köşe noktalarında vertex yuvarlakları çıkmalı ve bunlar haritada sürüklenebilmeli.
- [x] Düzenleme esnasında koordinatlar dinamik olarak güncellenmeli.
- [x] Düzenle modundan "Kaydet" denildiğinde güncel koordinatlarla kaydedilmeli ve kalıcı olmalı.
- [x] "İptal" denildiğinde yapılan değişiklikler geri alınmalı ve eski koordinatlarına dönmeli.
- [x] Normal markerlar ve metin markerları düzenle modunda sürüklenebilmeli, linter/build hataları olmamalı.


Harita üzerindeki çizimlerin (alan, çizgi, daire, dikdörtgen) vertex (köşe) noktalarının ArcGIS/QGIS standartlarında düzenlenebilmesi için `@mapbox/mapbox-gl-draw` kütüphanesi entegre edilmiş, normal markerlar ve metin markerları için `setDraggable` sürükleme sistemi kurulmuştur. "Kaydet" ve "İptal" butonları ile tam entegrasyon sağlanarak, iptal durumunda koordinatların eski haline dönmesi, kaydetme durumunda ise güncel koordinatların kalıcı olarak veri tabanına/hafızaya yazılması garantilenmiştir. Test sırasında tespit edilen `setLayerVisibility` tanımsız metot hatası, doğrudan MapLibre GL API'si kullanılarak (`map.setLayoutProperty`) güvenli bir şekilde çözülmüş ve tüm doğrulama adımları başarıyla tamamlanmıştır.

**GÜNCELLEME (2026-05-18 - Vertex Boyut İyileştirmesi)**:
Düzenleme modunda vertex ve midpoint noktalarının büyüklükleri kullanıcı geri bildirimi doğrultusunda dengeli (balanced) bir seviyeye getirilmiştir:
- **Aktif/İnaktif Vertex Dış Daire**: 7px/5px'den **9px/7px** yarıçapa getirilerek ergonomi ile estetik arasındaki mükemmel denge kurulmuştur.
- **Aktif/İnaktif Vertex İç Daire**: 3px/5px'den **6px/4px** yarıçapa ayarlanmıştır.
- **Midpoint (Orta Noktalar)**: 3px'den **4px** yarıçapa yükseltilerek kenarlar arasından yeni vertex üretme işlemi kolaylaştırılmıştır.
- Renkler premium sarı-turuncu (`#fbb03b`) kontrastıyla korunmuş, her türlü harita altlığı üzerinde maksimum estetik ve görünürlük sunulmuştur.


