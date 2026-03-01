/**
 * STORYMAP PLATFORMU - ŞABLON SETİ
 * 
 * 1) Nokta Eklenen - Haritaya nokta ekleyerek hikâye oluşturma
 * 2) Alan Seçimli - Çokgen çizerek alan belirleme ve analiz
 * 3) Rota Bazlı - Noktalar arası rota çizimi ve yolculuk hikâyesi
 * 4) Timeline Bazlı - Zaman çizelgesi ile kronolojik hikâye
 */

export const templates = {
    point: {
        name: "Nokta Eklenen",
        description: "Haritaya bağımsız noktalar ekleyerek hikâye oluşturun. Her noktanın kendi başlığı ve açıklaması olur. Örnek: Bolu'daki göller, tarihi yapılar, doğal güzellikler.",
        type: "point",
        icon: "fa-map-marker-alt",
        steps: [], // Nokta Eklenen şablonunda hazır adım yok, kullanıcı kendi noktalarını ekler
        defaultCenter: [31.6, 40.7], // Bolu merkez (örnek)
        defaultZoom: 8
    },
    area: {
        name: "Alan Seçimli",
        description: "Harita üzerinde çokgen çizerek alan belirleyin. Milli parklar, ormanlar, deprem bölgeleri, havza analizleri için ideal.",
        type: "area",
        icon: "fa-draw-polygon",
        steps: [] // Varsayılan alanlar temizlendi
    },
    route: {
        name: "Rota Bazlı",
        description: "Noktalar arası rota çizimi ve yolculuk hikâyesi. Günlük kategorilendirme, mesafe hesaplama ve rota optimizasyonu.",
        type: "route",
        icon: "fa-route",
        enableAutoConnect: true, // Noktaları otomatik bağla
        enableDayColors: true, // Günlük renk kategorilendirmesi
        dayColors: {
            1: "#ef4444", // Kırmızı - 1. Gün
            2: "#f59e0b", // Turuncu - 2. Gün
            3: "#10b981", // Yeşil - 3. Gün
            4: "#3b82f6", // Mavi - 4. Gün
            5: "#8b5cf6", // Mor - 5. Gün
            6: "#ec4899", // Pembe - 6. Gün
            7: "#14b8a6"  // Teal - 7. Gün
        },
        steps: [] // Varsayılan rotalar temizlendi
    },
    timeline: {
        name: "Timeline Bazlı",
        description: "Zaman çizelgesi ile kronolojik hikâye anlatımı. Tarihsel olaylar, süreçler ve gelişmeler için ideal.",
        type: "timeline",
        icon: "fa-clock",
        enableChronologicalSort: true, // Otomatik kronolojik sıralama
        enableCategoryColors: true, // Kategoriye göre renklendirme
        enableEraGrouping: false, // Dönem gruplandırması (varsayılan kapalı)
        defaultSortOrder: 'ascending', // 'ascending' = eskiden yeniye, 'descending' = yeniden eskiye
        playbackSpeed: 2000, // Kronolojik oynatma hızı (milisaniye)
        timelineColorMode: 'category', // 'category' veya 'importance'
        categoryColors: {
            'Military': '#ef4444',    // Kırmızı - Askeri olaylar
            'Political': '#3b82f6',   // Mavi - Siyasi olaylar
            'Cultural': '#8b5cf6',    // Mor - Kültürel olaylar
            'Scientific': '#10b981',  // Yeşil - Bilimsel gelişmeler
            'Social': '#f59e0b',      // Turuncu - Sosyal olaylar
            'Economic': '#06b6d4',    // Cyan - Ekonomik olaylar
            'Other': '#6b7280'        // Gri - Diğer
        },
        importanceColors: {
            1: '#d1d5db',  // Açık gri - Normal
            2: '#93c5fd',  // Açık mavi - Düşük önem
            3: '#60a5fa',  // Mavi - Orta önem
            4: '#f59e0b',  // Turuncu - Yüksek önem
            5: '#ef4444'   // Kırmızı - Milestone (dönüm noktası)
        },
        steps: []  // Boş başlat - kullanıcı kendi event'lerini ekleyecek
    },
    storymap: {
        name: "Hikâye Haritası",
        description: "Zengin içerikli lokasyon hikâyesi anlatımı. Doğal harikalar, tarihi yerler, kültürel mekanlar için ideal. Fotoğraflar ve detaylı açıklamalarla lokasyonlarınızı anlatın.",
        type: "storymap",
        icon: "fa-book-open",
        enableRichContent: true, // Zengin içerik desteği
        enableMultipleMedia: true, // Birden fazla medya ögesi
        layoutStyle: "sidebar", // Yan panel düzeni
        defaultCenter: [35.0, 39.0], // Türkiye merkez koordinatı [lon, lat]
        defaultZoom: 6, // Türkiye'yi gösterecek zoom seviyesi
        steps: [] // Boş başlat - kullanıcı kendi noktalarını ekleyecek
    }
};
