/**
 * Report Generation Module
 * Handles creation of analysis reports with:
 * - Project statistics
 * - Spatial analysis
 * - Measurement summaries
 * - CBS recommendations
 */

class ReportGeneration {
    constructor() {
        this.measurements = window.measurements || [];
    }
    
    generateAnalysisReport(userMarkers) {
        if (userMarkers.length === 0) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('⚠️ Rapor oluşturmak için önce veri ekleyin.', 'warning', 3000);
            }
            return;
        }

        const types = userMarkers.reduce((acc, m) => {
            acc[m.type] = (acc[m.type] || 0) + 1;
            return acc;
        }, {});

        // Mekânsal hesaplamalar
        const lats = userMarkers.map(m => m.lat);
        const lons = userMarkers.map(m => m.lon);
        const northernmost = Math.max(...lats);
        const southernmost = Math.min(...lats);
        const easternmost = Math.max(...lons);
        const westernmost = Math.min(...lons);
        
        // Yayılım hesaplama
        const latSpread = northernmost - southernmost;
        const lonSpread = easternmost - westernmost;
        const totalSpread = Math.sqrt(latSpread * latSpread + lonSpread * lonSpread);
        
        // Merkez nokta
        const centerLat = (northernmost + southernmost) / 2;
        const centerLon = (easternmost + westernmost) / 2;
        
        // Analiz sonuçları
        const distanceMeasurements = this.measurements.filter(m => m.type === 'distance');
        const areaMeasurements = this.measurements.filter(m => m.type === 'area');
        const bufferMeasurements = this.measurements.filter(m => m.type === 'buffer');

        // Harita türünü güvenli şekilde al
        const mapTypeSelect = document.getElementById('map-type');
        const mapTypeName = mapTypeSelect && mapTypeSelect.selectedOptions[0] 
            ? mapTypeSelect.selectedOptions[0].text 
            : 'Temel Harita';

        const report = `
# 📊 KAPSAMLI CBS ANALİZ RAPORU

## 🎯 Proje Bilgileri
**Proje Adı:** ${document.getElementById('map-purpose').value || 'İsimsiz CBS Projesi'}
**Analiz Tarihi:** ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}
**Harita Türü:** ${mapTypeName}
**Toplam Veri Noktası:** ${userMarkers.length}

## 📍 VERİ ANALİZİ

### Veri Türü Dağılımı
${Object.entries(types).map(([type, count]) => 
    `• ${type}: ${count} adet (${(count/userMarkers.length*100).toFixed(1)}%)`
).join('\n')}

## 🗺️ MEKÂNSAL İSTATİSTİKLER

### Coğrafi Sınırlar
• En Kuzey Nokta: ${northernmost.toFixed(5)}° (${userMarkers.find(m => m.lat === northernmost)?.name || 'Bilinmiyor'})
• En Güney Nokta: ${southernmost.toFixed(5)}° (${userMarkers.find(m => m.lat === southernmost)?.name || 'Bilinmiyor'})
• En Doğu Nokta: ${easternmost.toFixed(5)}° (${userMarkers.find(m => m.lon === easternmost)?.name || 'Bilinmiyor'})
• En Batı Nokta: ${westernmost.toFixed(5)}° (${userMarkers.find(m => m.lon === westernmost)?.name || 'Bilinmiyor'})

### Mekânsal Yayılım
• Enlem Aralığı: ${latSpread.toFixed(5)}°
• Boylam Aralığı: ${lonSpread.toFixed(5)}°
• Toplam Yayılım: ${totalSpread.toFixed(5)}°
• Merkez Koordinat: ${centerLat.toFixed(5)}°, ${centerLon.toFixed(5)}°

## 📏 ÖLÇÜM ANALİZLERİ

### Mesafe Ölçümleri
${distanceMeasurements.length > 0 ? 
    distanceMeasurements.map((m, i) => 
        `• Ölçüm ${i+1}: ${(m.value/1000).toFixed(2)} km`
    ).join('\n') + 
    `\n• Toplam Ölçülen Mesafe: ${(distanceMeasurements.reduce((sum, m) => sum + m.value, 0)/1000).toFixed(2)} km` :
    '• Henüz mesafe ölçümü yapılmamış'
}

### Alan Ölçümleri
${areaMeasurements.length > 0 ? 
    areaMeasurements.map((m, i) => 
        `• Alan ${i+1}: ${this.formatArea(m.value)}`
    ).join('\n') + 
    `\n• Toplam Ölçülen Alan: ${this.formatArea(areaMeasurements.reduce((sum, m) => sum + m.value, 0))}` :
    '• Henüz alan ölçümü yapılmamış'
}

### Etki Alanı Analizleri
${bufferMeasurements.length > 0 ? 
    bufferMeasurements.map((m, i) => {
        const result = m.value;
        return `• Etki Alanı ${i+1}: İç ${result.innerRadius}m / Dış ${result.outerRadius}m, ${result.totalPoints} nokta
  - Toplam Etki Alanı: ${this.formatArea(result.totalArea)}
  - Çakışma Sayısı: ${result.overlapping}
  - Kapsama Oranı: ${result.coverage.toFixed(1)}%`;
    }).join('\n') :
    '• Henüz buffer analizi yapılmamış'
}

## 🔥 ISI HARİTASI
Isı Haritası, veri noktalarının yoğunluğunu renk geçişleriyle görselleştirir. 
Kırmızı/sıcak tonlar yüksek yoğunluğu, mavi/soğuk tonlar düşük yoğunluğu temsil eder.
Bu sayede kümelenmeler ve odak bölgeleri hızlıca fark edilir.

## 🎯 CBS YORUMLARI VE ÖNERİLER

### Mekânsal Dağılım Analizi
${totalSpread > 1 ? 
    '📍 Veriler geniş bir coğrafi alana yayılmış - Bölgesel analiz uygun' : 
    totalSpread > 0.1 ? 
        '📍 Veriler orta ölçekli bir alanda toplanmış - Yerel analiz uygun' : 
        '📍 Veriler dar bir alanda yoğunlaşmış - Detay analiz gerekli'
}

## 📈 İLERİ ANALİZ ÖNERİLERİ

• **Kümeleme Analizi:** Benzer noktaların gruplandırılması
• **Ağ Analizi:** Noktalar arası bağlantı analizi  
• **Erişilebilirlik Analizi:** Hizmet alanlarının değerlendirilmesi
• **Zaman Serisi Analizi:** Değişim trendlerinin izlenmesi
• **Çok Kriterli Karar Analizi:** Öncelik sıralaması optimizasyonu

## 📋 SONUÇ VE DEĞERLENDİRME

Bu CBS analizi ${userMarkers.length} veri noktası üzerinde gerçekleştirilmiştir. 
${this.measurements.length > 0 ? 
    `Toplam ${this.measurements.length} adet mekânsal ölçüm ve analiz yapılmıştır.` : 
    'Ek mekânsal analizler yapılarak bulgular güçlendirilebilir.'
}

**Genel Değerlendirme:**
${userMarkers.length > 10 ? '✅ Yeterli veri noktası - Güvenilir analiz' : 
  userMarkers.length > 5 ? '⚠️ Orta düzey veri - Ek veri faydalı olur' : 
  '❌ Az veri - Daha fazla veri noktası gerekli'}
---
*Bu rapor Web CBS Eğitim Platformu v3.1 tarafından ${new Date().toISOString()} tarihinde otomatik oluşturulmuştur.*
*Analiz sonuçları eğitim amaçlıdır ve gerçek CBS projelerinde doğrulanmalıdır.*
        `;
        
        this.downloadFile(report, `Kapsamli_CBS_Analiz_Raporu_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('📊 Kapsamlı CBS analiz raporu oluşturuldu! İstatistikler, yorumlar ve öneriler dahil.');
        }
    }
    
    formatArea(area) {
        if (area > 1000000) {
            return `${(area / 1000000).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km²`;
        } else {
            return `${Math.round(area).toLocaleString('tr-TR')} m²`;
        }
    }
    
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url);
    }
}

// Make it globally available
window.ReportGeneration = ReportGeneration;
