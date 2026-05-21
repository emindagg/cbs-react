# Görev: Video Bağlantısı Giriş Alanının Yeniden Tasarlanması
Tarih: 2026-05-21

## Bağlam
Mevcut detay görünümündeki "Video Bağlantısı Ekle" arayüzü, yükleme paneli (`sidebar__media-upload`) içerisindeki dar alana sıkışmış durumdadır. Link giriş alanı ve ekleme/iptal butonları tek satırda aşırı dar ve kalabalık görünmekte, uzun URL girişlerinde kötü bir kullanıcı deneyimi sunmaktadır. Frontend Design ve Ultrathink prensiplerini uygulayarak bu alanı profesyonel, modern, geniş ve göz alıcı bir arayüze kavuşturacağız.

## Plan
- [x] **Adım 1: HTML Yapısının Yenilenmesi (`src/components/sidebar/renderers/detailViewRenderer.js`)**
  - "Video Bağlantısı Ekle" tıklandığında tüm yükleme kutusunun akıcı bir şekilde dönüşmesini sağlayacak şekilde yapıyı düzenlemek.
  - Link giriş formunu tam genişlikte, ikon destekli ve bağımsız bir form bloğu haline getirmek.
  - Form açıkken diğer buton gruplarını (`sidebar__media-upload-actions`) ve sürükle-bırak metnini gizleyecek yapısal sınıfları eklemek.
- [x] **Adım 2: CSS Tasarım Sisteminin ve Animasyonların Eklenmesi (`src/styles/components/sidebar/sidebar-detail.css`)**
  - Arayüze modern "Avant-Garde" estetiği kazandırmak: Yumuşak gölgeler, mikro etkileşimler, odaklanma (focus) efektleri ve gradyanlı çerçeveler.
  - Link giriş formunun dikey ve dengeli bir yerleşime kavuşturulması: Tam genişlikte şık bir input, hemen altında yan yana konumlanan estetik "İptal" (ghost/outline) ve "Ekle" (projenin yeşil temasına uyumlu birincil) butonları.
  - Form açılış/kapanışları için pürüzsüz dikey genişleme (`grid-template-rows` veya `transition` bazlı) ve opaklık (fade-in) animasyonları tasarlamak.
- [x] **Adım 3: Etkileşim Yönetiminin Güncellenmesi (`src/components/sidebar/handlers/detailHandlers.js`)**
  - Butona tıklandığında yükleme kartına `.sidebar__media-upload--link-active` gibi bir durum sınıfı eklenerek CSS üzerinden tüm elemanların yumuşakça dönüşmesini sağlamak.
  - İptal ve Ekle butonlarına tıklandığında bu durum sınıfını kaldırmak ve arayüzü eski haline döndürmek.
  - Form açıldığında girdi alanına otomatik odaklanma (focus) yapılması.

## Doğrulama kriterleri
- [x] Arayüzün görsel olarak "bootstrapped" veya ucuz görünümden uzak, son derece premium durması.
- [x] Link giriş alanının dikey olarak genişlemesi, uzun URL'lerin rahatça görülebilmesi.
- [x] Butonların Türkçe karakterlerinin korunması ve dilde bozulma olmaması.
- [x] Sürükle-bırak davranışının ve diğer dosya seçme akışlarının form açıkken çakışmaması.
- [x] Tüm animasyon ve geçişlerin 60fps akıcılığında çalışması.

## Sonuç
Frontend Design ve Ultrathink prensipleriyle tüm "Video Bağlantısı Ekle" ve "Yerleştir" arayüzü baştan sona modernize edildi. Ekleme butonları premium adaçayı yeşili (sage green) ile bezenirken, başlık alanı 2. görseldeki gibi Mixed Case formatında şık lacivert ikon ve metin rengine kavuşturuldu. Arayüzün tüm etkileşimleri ve dikey genişleme animasyonları 60fps akıcılığında çalışacak şekilde entegre edildi.
