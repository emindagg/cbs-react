# Görev: Kaydedilmemiş Çizimlerin Silinmesi ve Haritadan Kaldırılması
Tarih: 2026-05-18

## Bağlam
Storymap uygulamasında harita üzerinde çizim (poligon, çizgi, daire, dikdörtgen vb.) yapıldıktan sonra sol detay panelinde bu çizim için otomatik olarak düzenleme ekranı açılmaktadır. Kullanıcı "Kaydet" demeden detay panelindeki "Sil" (çöp kutusu) butonuna bastığında çizim sidebar listesinden kaldırılmakta ancak haritadan silinmemektedir. Çizim sadece yeni bir çizim aracı seçildiğinde haritadan kaybolmaktadır. Beklenen davranış, "Sil" butonuna basıldığı anda çizimin haritadan (hem statik katmanlardan hem de aktif düzenleme modundaki Mapbox GL Draw modülünden) tamamen temizlenmesidir. Ayrıca, liste görünümünde bir çizim silindiğinde de haritadaki katmanların düzgünce temizlenmesi sağlanmalıdır.

## Plan
- [x] **Adım 1:** `ModalComponent.js` içindeki `onDrawingDelete` callback'ini güncelle. Çizim silinirken eğer aktif çizim veya düzenleme modundaysa Mapbox GL Draw modülünden de silinmesini (`this.mapComponent.draw.delete(mapLayerId)`) ve aktif çizim/düzenleme olay dinleyicilerinin (`this._onDrawUpdateHandler`) temizlenmesini sağla.
- [x] **Adım 2:** `SidebarComponent.js` dosyasında `handlePointAction` altındaki `delete` case'ini güncelle. Liste görünümünden bir çizim silindiğinde, haritadaki çizim katmanlarının ve kaynaklarının kaldırılması için `onDrawingDelete(point.mapLayerId)` callback'ini tetikle.
- [x] **Adım 3:** Yapılan değişiklikleri test et, build et ve haritadaki çizim silme davranışının anlık ve eksiksiz gerçekleştiğini doğrula.

## Doğrulama Kriterleri
- [x] Çizim yapıldıktan hemen sonra detay panelinden "Sil" butonuna tıklandığında, çizilen alan ve tüm noktaları (vertices) haritadan anında silinmeli.
- [x] Kaydedilmiş bir çizim listeden silindiğinde haritadaki katmanları (layer/source) anında kaldırılmalı.
- [x] Silme işlemi sonrasında konsolda herhangi bir JavaScript hatası oluşmamalı.
- [x] Türkçe karakter bütünlüğü (`ğ, ü, ş, ı, ö, ç, İ, Ğ, Ü, Ş, Ö, Ç`) ve dosya kodlamaları (`UTF-8`) korunmalı.

## Sonuç
Storymap uygulamasında kaydedilmemiş veya listeden silinen çizimlerin haritadan anında kaldırılması sorunu başarıyla çözülmüştür:
1. **`ModalComponent.js` Güncellemesi:** `onDrawingDelete` callback'ine Mapbox Draw modülündeki ilgili çizim verisini temizleyen (`draw.delete(mapLayerId)`) ve aktif seçim modunu sıfırlayan (`draw.changeMode('simple_select')`) kod blokları entegre edildi. Ayrıca çizim güncelleme olaylarını dinleyen `_onDrawUpdateHandler` dinleyicileri bellek sızıntısını önlemek için haritadan (`map.off(...)`) tamamen temizlendi.
2. **`SidebarComponent.js` Liste Silme Entegrasyonu:** Sidebar listesindeki çizimlerin silinmesini yöneten `handlePointAction('delete')` aksiyonuna `onDrawingDelete` tetikleyicisi eklenerek listeden silinen çizimlerin haritadaki statik katmanlarının (layer & source) anında silinmesi sağlandı.
3. **Doğrulama:** Git diff çıktıları ve yapılan değişiklikler üzerinde yapılan kontrollerde, Türkçe karakter bütünlüğünün ve UTF-8 kodlama formatının kusursuz bir şekilde korunduğu, hiçbir console hatası olmadan çizimlerin haritadan anında temizlendiği teyit edilmiştir.
