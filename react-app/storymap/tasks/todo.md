# Görev: Harita Zoom Değişikliğinde Slider'ın Dinamik Güncellenmesi
Tarih: 2026-05-18

## Bağlam
Storymap uygulamasında detay görünümünde (nokta düzenleme paneli) bir "Yakınlaştırma Seviyesi" (zoom) slider'ı bulunmaktadır. Kullanıcı haritayı doğrudan sürükleyerek veya zoom kontrolleri ile yakınlaştırıp uzaklaştırdığında, detay panelindeki bu slider'ın ve gösterilen zoom değerinin haritanın güncel zoom seviyesine göre dinamik olarak güncellenmesi istenmektedir.

## Plan
- [x] Adım 1: `ModalComponent.js` dosyasında harita yüklendikten sonra (`onMapLoad`) haritanın zoom değişikliklerini dinleyecek bir olay dinleyici (`zoom` veya `zoomend`) ekle.
- [x] Adım 2: Olay tetiklendiğinde, sidebar'ın detay görünümünde (`currentView === 'detail'`) ve düzenleme modunda (`editingPoint` aktif) olup olmadığını kontrol et.
- [x] Adım 3: Eğer detay modundaysa, haritanın güncel zoom değerini tam sayıya yuvarlayıp (`1` ile `18` sınırları arasında) `sidebarComponent.editingPoint.zoom` değerini güncelle.
- [x] Adım 4: Detay panelindeki `#point-zoom` (slider input) ve `#point-zoom-value` (değer metni) DOM elemanlarını bulup güncel zoom değerini bunlara yansıt.
- [x] Adım 5: Harita zoomlandığında detay panelindeki slider'ın senkronize bir şekilde güncellendiğini test et ve doğrula.

## Doğrulama kriterleri
- [x] Haritada zoom yapıldığında (yakınlaşma veya uzaklaşma), detay panelindeki slider topuzu (slider thumb) otomatik olarak hareket etmeli.
- [x] Slider'ın yanındaki yakınlaştırma seviyesi rakamı (ör: 6, 12, 14) güncel zoom seviyesini anlık olarak göstermeli.
- [x] Harita zoomlandığında güncellenen zoom seviyesi, detay panelinde "Kaydet" butonuna basıldığında doğru bir şekilde `editingPoint` verisine kaydedilmeli.
- [x] Kodda herhangi bir JavaScript hatası veya çakışma olmamalı.

## Sonuç
Storymap uygulamasında detay panelindeki zoom seviyesi slider'ı ile haritanın zoom seviyesi mükemmel şekilde senkronize edilmiştir. `ModalComponent.js` içinde `setupSidebarCallbacks` fonksiyonuna eklenen dinamik harita olay dinleyicisi sayesinde:
1. Haritada scroll/çift tıklama/navigasyon araçları ile yapılan zoom değişiklikleri MapLibre'ın `zoom` olayı ile yakalanır.
2. Harita zoom değeri 1-18 arası tam sayı sınırlarına (`Math.round` ile) yuvarlanır.
3. Düzenlenen noktanın zoom state'i (`sidebarComponent.editingPoint.zoom`) anında güncellenir.
4. DOM üzerindeki slider input (`#point-zoom`) ve gösterge değeri (`#point-zoom-value`) sorunsuz ve anlık şekilde güncellenerek kullanıcıya geri bildirim verilir.
5. Değişiklikler test edilmiş ve başarılı bir şekilde derlenmiştir (`tsc -b && vite build` sıfır hatayla tamamlandı). Türkçe karakter bütünlüğü titizlikle korunmuştur.
