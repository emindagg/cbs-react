# Görev 1: İçe Aktarılan ve Paylaşılan Storymap Projelerinde Marker İkonlarının Bozulması Hatasının Çözülmesi (TAMAMLANDI)
Tarih: 2026-05-20

## Sonuç
Başarıyla tamamlandı. Hikaye haritası (Storymap) projelerinde, dışa/içe aktarım (import/export) işlemlerinde ve paylaşım sayfalarında tüm marker'ların orijinal stilleri (damla şekli, pin ikonu, renk vb.) korundu.

---

# Görev 2: Teardrop (Damla) Marker İkonlarının Haritada Bozuk ve Yamuk Görünmesi Hatasının Çözülmesi
Tarih: 2026-05-20

## Bağlam
Haritada damla (`teardrop`) şekli seçildiğinde veya bu şekle sahip projeler içe aktarıldığında, MapLibre GL'in dış marker elementinin `transform` özelliğini ezmesinden ötürü damla şeklinin yamulması (sivri ucunun sol alta bakması) ve içindeki ikonun yan yatması sorununun çözülmesi gerekmektedir. 

## Plan
- [x] **Adım 1:** `src/components/map/modules/MapMarkers.js` dosyasında `addMarker` metodunda `isTeardrop` durumunu iç kapsayıcı (`wrapper`) mimarisiyle yeniden tasarlamak.
- [x] **Adım 2:** `src/components/storymap/StoryMapComponent.js` dosyasında `createMarkerElement` metodunda `shape === 'teardrop'` durumunu benzer iç kapsayıcı (`wrapper`) mimarisine uyarlamak.
- [x] **Adım 2.1:** `src/components/ModalComponent.js` dosyasında `addMarkerToMapForViewMode` metodundaki `isTeardrop` kısmının iç kapsayıcı (`wrapper`) yapısı ile güncellenmesi.
- [x] **Adım 3:** Editör ve izleme modlarında damlaların dikey olarak düzgün durduğunu, içindeki ikonların dik ve hizalı olduğunu doğrulamak.

## Doğrulama Kriterleri
- [x] Damla marker ucu tam dikey olarak aşağıyı gösterecek.
- [x] Damla marker içindeki ikon 45 derece yan yatmayacak, tamamen düzgün (dik) duracak.
- [x] İçe aktarılan projelerdeki damla markerlar hatasız çizilecek.
- [x] Dosyalar UTF-8 olarak kaydedilecek ve Türkçe karakterler bozulmayacak.

## Sonuç
Başarıyla tamamlandı! Sorunun iki boyutu vardı:
1. **Varsayılan şekil hatası:** `PointManager.js`'de varsayılan `shape` değeri yanlışlıkla `'teardrop'` olarak bırakılmıştı. İçe aktarılan verilerde `shape` alanı yoksa tüm marker'lar zorla damla şekline dönüştürülüyordu. Bu değer `'circle'` olarak düzeltildi.
2. **MapLibre transform çakışması:** Damla şekli kullanıldığında MapLibre'nin dış element transform'unu ezmesi nedeniyle damla yamuluyordu. Tüm marker çizim mekanizmalarında (MapMarkers.js, StoryMapComponent.js, ModalComponent.js) iç kapsayıcı (`wrapper`) div mimarisine geçildi.

---

# Görev 3: Backend Güncellemelerinin Entegre Edilmesi
Tarih: 2026-05-20

## Bağlam
Backend tarafındaki iki ana değişikliğin frontend'e uyarlanması gerekmektedir:
1. `LoginResponse` modeline eklenen `Ogrencimi` (bool) ve `Adsoyad` (string) alanlarının oturumda saklanması.
2. Dosya yükleme sistemine eklenen `/Dosya/video` endpoint'inin kullanılması ve video yükleme boyut sınırının 50 MB'a çıkarılması.

## Plan
- [x] **Adım 1:** `src/services/authManager.js` dosyasında `Ogrencimi` ve `Adsoyad` alanlarını session storage'da saklayacak ve yönetecek şekilde güncellemeler yapılması.
- [x] **Adım 2:** `src/loginRedirectMain.js` dosyasında login api response'undan bu yeni alanların okunarak `authManager.saveAuth`'a parametre olarak aktarılması.
- [x] **Adım 3:** `src/services/apiService.js` dosyasında `/Dosya/video` endpoint'ine POST isteği gönderen `uploadVideo(file)` metodunun eklenmesi.
- [x] **Adım 4:** `src/components/sidebar/modules/MediaManager.js` dosyasında video yüklemelerinde `apiService.uploadVideo` fonksiyonunun çağrılmasının sağlanması.
- [x] **Adım 5:** `src/components/sidebar/handlers/detailHandlers.js` dosyasında video yükleme boyut sınırının (MAX_VIDEO_SIZE) 30 MB'tan 50 MB'a yükseltilmesi.

## Doğrulama Kriterleri
- [x] Giriş yapıldığında kullanıcının ad-soyad ve öğrenci bilgisi session storage'a kaydedilecek, çıkış yapıldığında silinecek.
- [x] Resim yüklemeleri `/Dosya` endpoint'ini, video yüklemeleri ise `/Dosya/video` endpoint'ini kullanacak.
- [x] Video boyutu üst sınırı frontend üzerinde 50 MB olarak kontrol edilecek.
- [x] Türkçe karakterler bozulmadan UTF-8 encoding ile kaydedilecek.

## Sonuç
Başarıyla tamamlandı!
1. `LoginResponse` modelindeki `Ogrencimi` ve `Adsoyad` alanları oturum yönetim sistemine (`AuthManager`) entegre edildi. LoginRedirect akışından bu alanlar esnek (büyük/küçük harf bağımsız) okunup oturuma kaydediliyor. Çıkış yapıldığında session storage üzerinden başarıyla temizleniyor.
2. `/Dosya/video` endpoint'i `ApiService`'e eklendi. `MediaManager` üzerinden resimler `/Dosya`, videolar ise `/Dosya/video` endpoint'ine gönderilecek şekilde yönlendirildi.
3. Frontend video yükleme boyutu sınırı, backend'in yeni sınırı olan 50 MB limitine yükseltildi. Tüm kodlar UTF-8 karakter setine uygun olarak kaydedildi ve Türkçe karakter bütünlüğü korundu.
