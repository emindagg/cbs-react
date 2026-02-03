# OGM CBS Sunum Metni (Öğretmenlere Yönelik, Adım Adım)

## 1. Açılış (1 dk)
- “Merhaba, bugün OGM CBS ile veriyi harita üstünde nasıl kolayca göstereceğimizi ve sınıfta nasıl anlatıya dönüştüreceğimizi paylaşacağım.”
- “Hedef: Öğrenciye mekânsal farkındalık kazandırmak; öğretmene veriyle hikâye anlatmayı hızlandırmak.”

## 2. Neden OGM CBS? (1 dk)
- Kurulum yok: Tarayıcıdan aç, hemen kullan.
- Türkiye odaklı arama ve hazır sınır/katman verileri.
- Harita + veri + anlatı aynı ekranda; dışa aktarma ve ekran görüntüsü hazır.

## 3. Arayüz Turu (2 dk)
- **Sol Panel**: Veri yükleme, görselleştirme, analiz, timeline, astronomi.
- **Arama (büyüteç)**: İl/ilçe/yer adı yaz; canlı sonuç; tıkla, harita odaklansın.
- **Altlık Harita**: Açık sokak, uydu, gece, küre; gerekirse “haritayı gizle”.
- **Lejant & Etiketler**: Renklerin anlamı, il/ilçe adları, değer etiketleri, kuzey oku, harita başlığı.
- **Araç Çubuğu**: Çizim, ölçüm, analiz kısayolları; sağ üst zoom/döndürme.

## 4. Demo: Yer Bulma (1 dk)
- Adım: Büyüteç → “Ankara” yaz → sonuçtan seç → harita otomatik ortalanır.
- İpucu: 3+ karakter yazmak sonuçları açar; internet bağlantısını hatırlatın.

## 5. Veri Yükleme (Import) (3 dk)
- Desteklenenler: Excel/CSV, GeoJSON/JSON, KMZ/KML, Shapefile (ZIP).
- Akış: “Veri Yükle” → dosyayı seç → kolon eşleştir (enlem/boylam) → ön izleme → içeri al.
- Büyük dosya: İlerleme çubuğu; hatalı satırları uyarıda gösterir.
- Sonuç: Nokta/çizgi/alanlar haritada; liste panelinde de görünür.
- İpucu: 50 MB üstü dosyayı bölün; koordinat adları `lat/lng` veya `latitude/longitude` olsun.

## 6. Demo: Görselleştirme (4 dk)
- Adım: Veri sütunu seç → “Choropleth” → sınıf sayısı (3–7, genelde 5) → renk paleti seç → uygula.
- Lejant otomatik gelir; sayı formatını kompakt/tam seçebilirsiniz.
- Alternatifler: Bubble (baloncuk boyu değeri temsil eder), Dot Density (nokta yoğunluğu).
- İpucu: Renk paletini sade tutun; lejantı ekranın boş tarafına hizalayın.

## 7. Analiz Araçları (4 dk)
- **Buffer**: Nokta/çizgi/alan etrafında metre cinsinden etki alanı.
- **Heatmap**: Yoğunluğu ısı haritası olarak gösterir; yarıçap/yoğunluk ayarlanabilir.
- **Clustering**: Çok nokta varsa kümeler; yakınlaştırınca detay açılır.
- **Convex Hull**: Nokta grubunun dış sınırı.
- **Voronoi**: Noktalar arası etki bölgeleri.
- **Nearest Facility**: En yakın iki noktayı bulur.
- İpucu: Öğrencilere “önce ham veri, sonra cluster/heatmap” sırasını gösterin.

## 8. Ölçüm ve Çizim (3 dk)
- **Mesafe**: Çok nokta tıklayarak çizgi; her segment ve toplam mesafe etiketi.
- **Alan**: Poligon çiz; alan ve çevre otomatik hesaplanır.
- **Çizim Araçları**: Nokta, rota, alan, daire; her birine ad/açıklama eklenir.
- İpucu: Sunum öncesi örnek bir rota ve alan çizin; etiketleri düzenleyin.

## 9. Timeline (3 dk)
- Zaman damgalı veri için oynatıcı.
- Modlar: **Kümülatif** (geçmiş birikir) / **Interval** (sadece o dönem).
- Kontroller: Oynat/duraklat, ileri-geri adım, hız seçimi.
- İpucu: Deprem, göç, nüfus artışı gibi zamansal örneklerle gösterin.

## 10. Astronomi (2 dk)
- Gece/gündüz hattı, güneş/ay konumu, ay evreleri, tutulma çizgisi.
- Tarihi ileri/geri sar; hız çarpanı değiştir; küre görünümünde göster.
- İpucu: Mevsim geçişlerini göstermek için tarih çubuğunu kaydırın.

## 11. Dışa Aktarım ve Sunum Hazırlığı (2 dk)
- Dışa aktar: Excel/CSV/GeoJSON; ekran görüntüsü aracıyla seçili alanı yakala.
- Etiketler: İl/ilçe adları, değer etiketleri, kuzey oku, başlık aç/kapa.
- Lejant: Yatay/dikey; boş alana hizalayın; renkleri sade tutun.
- İpucu: Sunum slaytına kopyalamadan önce gereksiz katmanları gizleyin.

- “OGM CBS, haritayı, veriyi ve hikâyeyi birleştirir; sınıf anlatısını hızlandırır.”
- “Sorularınızı uygulama üzerinde birlikte deneyebiliriz.”

---

### Slayt Sırası Önerisi
1) Başlık & Amaç  
2) Neden AtlasCopy  
3) Arayüz Turu  
4) Yer Arama Demo  
5) Veri Yükleme  
6) Görselleştirme Demo  
7) Analiz Araçları  
8) Ölçüm & Çizim  
9) Timeline  
10) Astronomi  
11) Dışa Aktarım  
12) Kapanış & Soru-Cevap

### Canlı Demo Sırası
- Arama: “Ankara” → odaklan.
- Import: örnek Excel/CSV → haritada göster.
- Choropleth: 5 sınıf + renk paleti → lejant göster.
- Buffer + Heatmap aç/kapa.
- Timeline: oynat/duraklat.
- Astronomi: gece/gündüz hattı aç.

