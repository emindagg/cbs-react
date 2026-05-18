# Görev: Storymap Yeni Proje Oluştururken Eski Projenin Görünmesi Sorununun Giderilmesi
Tarih: 2026-05-18

## Bağlam
Storymap'te bir proje oluşturulup kaydedildikten sonra, ana sayfaya dönülüp "Yeni Harita Oluştur" seçeneğiyle yeni bir proje oluşturulmaya çalışıldığında, bir önceki projeye ait verilerin (noktalar, çizimler, başlık vb.) yeni projede görünmesi sorunu bulunmaktadır. Bu durumun nedeni `ModalComponent` imha edilirken (destroy) başlangıç modalı elementleri üzerindeki event listener'ların kaldırılmamasıdır. Bu sebeple eski `ModalComponent` örnekleri hafızada kalmakta ve "Devam Et" butonuna tıklandığında eski listener tetiklenerek eski projeyi yüklemektedir.

## Plan
- [x] **Adım 1:** `ModalComponent.js` dosyasında başlangıç modalı event listener'larını isimlendirilmiş/referanslı fonksiyonlar haline getirmek.
- [x] **Adım 2:** `setupListeners` fonksiyonunu bu yeni referanslı listener'ları kullanacak şekilde güncellemek.
- [x] **Adım 3:** `destroy` fonksiyonunda bu listener'ları `removeEventListener` ile tamamen kaldırmak ve `storyMapExitHandler` event'ini temizlemek.
- [x] **Adım 4:** `destroy` fonksiyonunda `this.storyData` ve `this.currentStoryId` alanlarını sıfırlamak.

## Doğrulama kriterleri
- [x] `ModalComponent` imha edildiğinde tüm input ve buton event listener'ları temizlenmeli.
- [x] Bir önceki projeden çıkıp yeni proje oluşturulduğunda eski projenin noktaları ve çizimleri haritada veya sidebar'da görünmemeli.
- [x] Yeni harita oluşturulurken başlık ve açıklama alanları beklendiği gibi temiz ve yeni girilen verilerle başlamalı.

## Sonuç
`ModalComponent` sızıntısı giderildi. Olay dinleyicileri (event listeners) artık `destroy` sırasında tamamen temizleniyor ve state sıfırlanıyor. Yeni proje oluşturulduğunda eski projenin kalıntıları tamamen engellendi ve temiz bir başlangıç sağlandı.
