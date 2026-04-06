# Görev: viz wizard Excel parser/cleaner phase 1 planı
Tarih: 2026-04-06

## Bağlam
Bu plan yalnızca Viz Wizard içindeki Excel yükleme akışı içindir.
`data-management` altındaki genel dosya yükleme alanı bu aşamanın kapsamı dışındadır.
Mevcut Viz Wizard akışı ilk satırı doğrudan header kabul ettiği için üstte boş satırlar, açıklama metinleri,
gecikmeli başlayan tablolar, duplicate başlıklar ve tamamen boş kolonlar içeren gerçek Excel dosyalarında kırılgandır.
Amaç, React store + eşleştirme akışı + AG Grid önizleme ihtiyaçlarına uyumlu, worker tabanlı ve profesyonel bir
Excel parser/cleaner phase 1 planı çıkarmaktır.

## Plan
- [x] Adım 1: Mevcut Viz Wizard Excel import zincirini haritala
  Dosyalar:
  - `src/features/viz-wizard/steps/Step1.tsx`
  - `src/utils/columnMapper.ts`
  - `src/features/viz-wizard/steps/Step2.tsx`
  - `src/features/data-mapper/DataMapper.tsx`
  Amaç:
  - Excel verisinin store'a nasıl girdiğini
  - kolon listesinin nasıl üretildiğini
  - eşleştirme ve grid tarafının hangi veri kontratını beklediğini netleştirmek

- [x] Adım 2: Kullanılacak kütüphane davranışını doğrula
  Kaynaklar:
  - SheetJS/XLSX: ham satır matrisi + `sheet_to_json` seçenekleri
  - AG Grid React: dinamik `columnDefs`, `rowData`, `getRowId`, immutable veri akışı
  Amaç:
  - worker içinde en güvenli parse yaklaşımını seçmek
  - grid tarafında minimum dönüşümle kullanılabilir çıktı tasarlamak

- [x] Adım 3: Viz Wizard için phase 1 kapsam sınırını kilitle
  Dahil:
  - Excel dosyasını güvenli okumak
  - gerçek header satırını tespit etmek
  - boş satır/sütun temizlemek
  - DataMapper önizlemesi için temiz `columns` + `rawData` üretmek
  - kullanıcıya anlamlı parse hatası göstermek
  Hariç:
  - Data Management modülüne taşıma
  - CSV akışını aynı anda refactor etme
  - gelişmiş şema tanımlama veya kullanıcıya manuel header seçtirme

- [x] Adım 4: Yeni phase 1 çıktı kontratını tasarla
  Uygulanan parser çıktısı Viz Wizard için şu alanları taşıyor:
  - `rows`: temizlenmiş ham veri satırları
  - `columns`: sanitize edilmiş kolon alanları
  - `headerRowIndex`: gerçek header'ın sheet içindeki satır numarası
  - `dataStartRowIndex`: veri bloğunun başladığı satır numarası
  - `stats`: kaç boş satır/kolon atıldı, kaç warning üretildi
  - `warnings`: fatal olmayan parse uyarıları
  Amaç:
  - parser sonucunun store, DataMapper ve debug/telemetry için yeterli olması

- [x] Adım 5: Worker tabanlı parse akışını yeniden kur
  Akış:
  1. Dosyayı worker içinde aç
  2. İlk sheet'i seç
  3. Worksheet'i `header: 1` ile matris olarak oku
  4. Phase 1 cleaner algoritmasını çalıştır
  5. Temiz sonucu ana thread'e döndür
  Teknik hedef:
  - parse maliyetini UI thread'den çıkarmak
  - büyük dosyalarda ekranın kitlenmesini önlemek
  - mevcut Step1 akışını minimum API değişikliğiyle beslemek

- [x] Adım 6: Ham sheet matrisi için ön temizleme kural setini tanımla
  Uygulanacak işlemler:
  - satır bazında hücreleri normalize et (`trim`, boş string temizliği)
  - tamamen boş satırları tespit et
  - leading/trailing tamamen boş satır bloklarını işaretle
  - tamamen boş kolonları tespit et
  - merged-cell etkisinden gelen tek hücrelik başlık/açıklama satırlarını aday olarak işaretle
  Amaç:
  - header tespiti başlamadan önce gürültüyü azaltmak
  - sonraki skorlamanın daha dayanıklı çalışmasını sağlamak

- [x] Adım 7: Auto header detection algoritmasını profesyonel hale getir
  Yöntem:
  - ilk N satır içinde aday header satırları taranacak
  - her satıra skor verilecek
  Kullanılacak sinyaller:
  - boş olmayan hücre sayısı yeterli mi
  - satırın büyük kısmı kısa/orta uzunluklu string mi
  - aynı satırda anlamsız tekrar çok mu
  - bir sonraki 3-5 satır o başlığa uygun veri davranışı gösteriyor mu
  - aday satır tek hücrelik uzun açıklama mı
  - aday satırda numerik baskınlık fazla olup aslında veri satırı olma ihtimali var mı
  Header kabul kuralı:
  - minimum skor eşiği
  - ikinci en iyi adayla fark kontrolü
  - eşik altındaysa kontrollü hata
  Amaç:
  - ilk satıra kör güvenmek yerine veri deseninden karar vermek

- [x] Adım 8: Header sanitization politikasını netleştir
  Kurallar:
  - boş header hücresi varsa fallback isim üret (`column_1`, `column_2`)
  - duplicate header deterministik yeniden adlandırılacak
  - iç field adı ile görünen label ayrılacak
  - field üretiminde güvenli karakter seti kullanılacak
  Amaç:
  - store ve grid tarafında çakışmasız kolon alanları üretmek
  - kullanıcıya yine anlaşılır başlık gösterebilmek

- [x] Adım 9: Veri bloğu temizliğini tamamla
  Kurallar:
  - header altındaki tamamen boş satırları kaldır
  - tamamen boş kolonları kaldır
  - satırların kolon uzunluğunu header'a hizala
  - yalnızca whitespace içeren hücreleri boş kabul et
  - istenmeyen trailing boş hücreleri normalize et
  Amaç:
  - DataMapper'a yalnızca gerçek tabloyu göndermek

- [x] Adım 10: Viz Wizard store ve Step1 entegrasyonunu tanımla
  Değişecek alanlar:
  - `ColumnMapper.loadFile()` dönüş tipi
  - store'a yazılan `rawData` ve `columns`
  - gerekirse parse warnings bilgisinin UI'da gösterilmesi
  Beklenen davranış:
  - dosya başarıyla parse olduysa Step2'ye geç
  - warning varsa kullanıcıyı bilgilendir ama akışı durdurma
  - fatal parse hatasında Step1'de kal ve anlamlı mesaj göster

- [x] Adım 11: DataMapper/AG Grid uyumunu phase 1 için netleştir
  Hedef:
  - mevcut `DataMapper.tsx` veri beklentisini bozmamak
  - mevcut kolon kontratını bozmadan temiz veriyle çalışmasını sağlamak
  Grid çıktısı:
  - `columns` store'a gider
  - `rawData` satır objeleri store'a gider
  - AG Grid `columnDefs` mevcut `useColumns()` akışıyla çalışmaya devam eder
  Not:
  - phase 1'de parser içinde ayrı `columnDefs` üretilmedi
  - mevcut `useColumns()` akışı korunarak risk düşük tutuldu

- [x] Adım 12: Error ve warning modelini phase 1 için kesinleştir
  Fatal hata kodları:
  - `EMPTY_WORKBOOK`
  - `EMPTY_SHEET`
  - `NO_VISIBLE_DATA`
  - `HEADER_NOT_FOUND`
  - `NO_DATA_ROWS_AFTER_HEADER`
  - `SHEET_TOO_LARGE`
  Warning kodları:
  - `LEADING_EMPTY_ROWS_SKIPPED`
  - `TITLE_ROWS_SKIPPED`
  - `EMPTY_COLUMNS_REMOVED`
  - `DUPLICATE_HEADERS_RENAMED`
  - `BLANK_HEADERS_FILLED`
  Amaç:
  - UI'nin parse sonucunu teknik exception yerine kullanıcı dostu mesajlarla yönetebilmesi

- [x] Adım 13: Örnek utility modül yapısını tanımla
  Uygulanan modüller:
  - `src/utils/columnMapper/excelParser.ts`
  - `src/utils/columnMapper/types.ts`
  - `src/utils/columnMapper/excelWorker.ts`
  Ana fonksiyonlar:
  - `readWorksheetMatrix`
  - `detectHeaderRow`
  - `sanitizeHeaders`
  - `stripEmptyRowsAndColumns`
  - `buildRowObjects`
  - `parseExcelArrayBuffer`
  Amaç:
  - phase 1'i modüler ve test edilebilir kurmak

- [x] Adım 14: Test stratejisini phase 1'e göre yaz
  Kapsanacak senaryolar:
  - tamamen boş sheet
  - üstte 3 boş satır
  - üstte 1 rapor başlığı + 1 açıklama satırı + sonra tablo
  - duplicate başlıklar
  - boş kolonlar
  - header altında ilk satırların kısmen boş olması
  - kirli ama kurtarılabilir sheet
  - kurtarılamayan ve hata dönmesi gereken sheet
  Amaç:
  - parser davranışını rastgele değil deterministik hale getirmek

- [x] Adım 15: Performans ve rollout planını tanımla
  Performans ilkeleri:
  - tüm workbook yerine yalnızca ilk aktif sheet üzerinde çalış
  - önce matris oku, sonra yalnızca seçilen tabloyu objeye dönüştür
  - UI thread yerine worker kullan
  - büyük satır sayılarında üst limit ve koruma ekle
  Rollout:
  - önce utility + worker
  - sonra Step1 entegrasyonu
  - sonra hedefli testler
  - sonra manuel kirli Excel doğrulaması

- [x] Adım 16: Nihai teknik çıktı
  Teslim edilecekler:
  - phase 1 mimari tasarım
  - örnek TypeScript utility kodu
  - hata/warning modeli
  - entegrasyon dosya listesi
  - doğrulama ve rollout stratejisi

## Doğrulama kriterleri
- [x] Plan yalnızca Viz Wizard Excel yükleme akışını hedeflemeli
- [x] Gerçek header satırını tespit edecek algoritma açıkça tanımlanmış olmalı
- [x] Tamamen boş satır ve sütunların nasıl temizleneceği net olmalı
- [x] Step1 -> store -> Step2/DataMapper entegrasyonu dosya bazında tanımlanmış olmalı
- [x] UI tarafında yakalanabilir fatal error ve warning modeli tanımlanmış olmalı
- [x] Performans için worker tabanlı yaklaşım ve büyük dosya korumaları açıklanmış olmalı

## Sonuç
Viz Wizard Excel yükleme akışı için worker tabanlı bir parse/clean pipeline uygulandı.
Yeni `excelParser` gerçek başlık satırını skorlayarak tespit ediyor; boş üst satırları, açıklama satırlarını,
tamamen boş kolonları ve duplicate/blank başlıkları kontrollü biçimde temizliyor.
`ColumnMapper.loadFile()` Excel tarafında artık bu sonucu kullanıyor; Step1 warning özetini gösteriyor ve mevcut
Step2/DataMapper sözleşmesini bozmadan temiz `rawData` + `columns` akışını sürdürüyor.
Phase 2 kapsamında Step1'e kullanıcı kontrollü Excel önizleme ekranı eklendi. Sistem olası başlık satırını öneriyor,
ancak kullanıcı satırı bizzat seçebiliyor; ayrıca `Başlık yok` moduyla ilk veri satırını belirleyip sentetik kolonlarla
başlıksız tabloyu da içeri alabiliyor. `ColumnMapper` bu akışta Excel yüklemesini iki aşamaya böldü: önce güvenli
önizleme/analiz, sonra kullanıcı onayıyla finalizasyon. `excelParser.test.ts` ve `Step1.test.tsx` phase 1 ve phase 2
senaryolarını kapsayacak şekilde çalıştırıldı; hedefli Vitest geçişi ve `npm run build` doğrulaması başarılı oldu.
