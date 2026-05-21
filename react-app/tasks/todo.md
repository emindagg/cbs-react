# Görev: Öznitelik Tablosu ve Harita Seçim Senkronizasyonu
Tarih: 2026-05-21

## Bağlam
Öznitelik tablosunda seçilen satırların harita üzerinde ArcGIS benzeri şekilde anında vurgulanması isteniyor. Mevcut yapıda harita katmanları yalnızca tek `activeItemId` üzerinden seçili durumu alıyor, AG Grid tablo seçimi ise store ile senkronize edilmiyor.

## Plan
- [x] Adım 1: Data management store'a çoklu seçim durumunu ve seçim güncelleme yardımcılarını ekle.
- [x] Adım 2: Öznitelik tablosundaki AG Grid seçimlerini store'a yaz ve dışarıdan gelen seçim değişince tablo satırlarını senkronize et.
- [x] Adım 3: Harita veri katmanlarını çoklu seçim durumuna göre turkuaz/cyan vurgulama ile çiz.
- [x] Adım 4: Haritadaki veri tıklamalarını tablo seçimiyle aynı store durumuna bağla.
- [x] Adım 5: Test, build ve Türkçe karakter/encoding kontrolünü çalıştır.

## Doğrulama kriterleri
- [x] Tabloda seçilen bir veya birden fazla satır haritada turkuaz vurguyla görünmeli.
- [x] Haritada bir veri öğesine tıklanınca aynı seçim state'i güncellenmeli.
- [x] Silinen veya temizlenen öğelerin seçim state'inde hayalet ID bırakmaması sağlanmalı.
- [x] İlgili testler ve build başarılı olmalı.
- [x] Türkçe karakterler bozulmadan kalmalı.

## Sonuç
Öznitelik tablosu ve harita veri katmanları aynı çoklu seçim state'ini kullanacak şekilde senkronize edildi. Tabloda seçilen satırlar haritada turkuaz vurguyla çiziliyor; haritada veri öğesine tıklanınca aynı seçim tablonun seçili satırlarına yansıyor.

---

# Görev: Öznitelik Tablosunu Alt Çekmeceye Dönüştürme
Tarih: 2026-05-21

## Bağlam
Öznitelik tablosu mevcut durumda haritayı karartan tam ekran modal olarak açılıyor. CBS kullanımında tablo açıkken harita bağlamının korunması ve harita etkileşiminin devam etmesi gerekiyor.

## Plan
- [x] Adım 1: Modal backdrop yapısını kaldırıp paneli ekranın altına sabitlenen çekmeceye dönüştür.
- [x] Adım 2: Panel yüksekliğini kullanıcı tarafından sürüklenebilir hale getir.
- [x] Adım 3: Header ve aksiyonları dar ekranlarda taşmayacak şekilde düzenle.
- [x] Adım 4: Test, build ve Türkçe karakter kontrolünü çalıştır.

## Doğrulama kriterleri
- [x] Tablo açıkken haritanın üst kısmı görünür ve etkileşilebilir kalmalı.
- [x] Alt çekmece başlık bölgesinden/handle üzerinden yeniden boyutlandırılabilmeli.
- [x] Satır seçimi ve harita vurgulama davranışı korunmalı.
- [x] İlgili testler ve build başarılı olmalı.
- [x] Türkçe karakterler bozulmadan kalmalı.

## Sonuç
Öznitelik tablosu tam ekran modal yerine alt çekmece olarak açılacak şekilde güncellendi. Backdrop kaldırıldı, panel dışındaki harita alanı etkileşime açık bırakıldı ve panel yüksekliği üst tutamaçtan sürüklenebilir hale getirildi.

---

# Görev: Öznitelik Tablosu Genişlik Ayarı
Tarih: 2026-05-21

## Bağlam
Alt çekmeceye dönüştürülen öznitelik tablosunun yalnızca yüksekliği ayarlanabiliyordu. Kullanıcı panelin yanlardan da sürüklenerek genişlikte ayarlanmasını istedi.

## Plan
- [x] Adım 1: Panel genişliği için ayrı `vw` tabanlı state ve sınır değerleri ekle.
- [x] Adım 2: Sol ve sağ kenarlara genişlik sürükleme alanları ekle.
- [x] Adım 3: Test, build ve Türkçe karakter kontrolünü çalıştır.

## Doğrulama kriterleri
- [x] Panel sol ve sağ kenarlardan sürüklenerek daraltılıp genişletilebilmeli.
- [x] Mevcut yükseklik ayarı çalışmaya devam etmeli.
- [x] İlgili testler ve build başarılı olmalı.
- [x] Türkçe karakterler bozulmadan kalmalı.

## Sonuç
Panel genişliği için `vw` tabanlı state eklendi. Kullanıcı artık alt çekmecenin sol veya sağ kenarından sürükleyerek öznitelik tablosunun genişliğini ayarlayabilir.

---

# Görev: Tablo Checkbox Seçimi ve Harita Vurgusunu Ayırma
Tarih: 2026-05-21

## Bağlam
Öznitelik tablosunda checkbox seçimi toplu silme işlemi için kullanılmalı; satırdaki `Ad` hücresine tıklamak ise checkbox'ı işaretlemeden yalnızca haritadaki ilgili geometriyi vurgulamalı.

## Plan
- [x] Adım 1: Harita vurgusunu `activeItemId`, checkbox seçimlerini `selectedItemIds` üzerinden ayrı çalışacak hale getir.
- [x] Adım 2: `Ad` hücresine tıklanınca yalnızca harita vurgusunu güncelle.
- [x] Adım 3: Test, build ve Türkçe karakter kontrolünü çalıştır.

## Doğrulama kriterleri
- [x] `Ad` hücresine tıklamak checkbox'ı işaretlememeli.
- [x] `Ad` hücresine tıklamak haritada ilgili geometriyi vurgulamalı.
- [x] Checkbox seçimi toplu silme işlemi için ayrı kalmalı.
- [x] İlgili testler ve build başarılı olmalı.
- [x] Türkçe karakterler bozulmadan kalmalı.

## Sonuç
Checkbox seçimleri toplu işlem state'i olarak bırakıldı. `Ad` hücresine tıklamak artık checkbox'ı işaretlemeden yalnızca harita vurgusunu güncelliyor.
