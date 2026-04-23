/**
 * TimelineManager - Timeline şablonu özellikleri yönetimi
 *
 * Bu modül Timeline hikâyesi özellikleri sağlar:
 * - Olayları kronolojik sıralama
 * - Olaylar arası zaman farkı hesaplama
 * - Kategori ve era bazlı gruplandırma
 * - Filtreleme ve sıralama
 * - Kronolojik oynatma kontrolü
 */
export class TimelineManager {
    constructor(map, template) {
        this.map = map;
        this.template = template;
        this.events = [];
        this.currentPlaybackIndex = 0;
        this.playbackTimer = null;
        this.isChronologicalSortEnabled = template?.enableChronologicalSort || true;
        this.categoryColors = template?.categoryColors || this.getDefaultCategoryColors();
        this.importanceColors = template?.importanceColors || this.getDefaultImportanceColors();
    }

    /**
     * Varsayılan kategori renkleri
     */
    getDefaultCategoryColors() {
        return {
            'Military': '#ef4444',    // Kırmızı
            'Political': '#3b82f6',   // Mavi
            'Cultural': '#8b5cf6',    // Mor
            'Scientific': '#10b981',  // Yeşil
            'Social': '#f59e0b',      // Turuncu
            'Economic': '#06b6d4',    // Cyan
            'Other': '#6b7280'        // Gri
        };
    }

    /**
     * Varsayılan önem seviyesi renkleri
     */
    getDefaultImportanceColors() {
        return {
            1: '#d1d5db',  // Gri - Normal
            2: '#93c5fd',  // Açık mavi
            3: '#60a5fa',  // Mavi
            4: '#f59e0b',  // Turuncu
            5: '#ef4444'   // Kırmızı - Milestone
        };
    }

    /**
     * Kategoriye göre renk döndür
     */
    getColorForCategory(category) {
        return this.categoryColors[category] || '#6b7280';
    }

    /**
     * Önem seviyesine göre renk döndür
     */
    getColorForImportance(importance) {
        return this.importanceColors[importance] || '#d1d5db';
    }

    /**
     * Timeline event ekle
     */
    addEvent(event) {
        // Önceki event'e zaman farkı hesapla
        if (this.events.length > 0 && event.date) {
            const prevEvent = this.events[this.events.length - 1];
            if (prevEvent.date) {
                const timeDiff = this.calculateTimeDifference(prevEvent.date, event.date);
                prevEvent.timeToNext = timeDiff;
            }
        }

        this.events.push(event);

        // Kronolojik sıralama açıksa sırala
        if (this.isChronologicalSortEnabled) {
            this.sortEventsByDate();
            this.recalculateTimeGaps();
        }

        return event;
    }

    /**
     * Olayları kronolojik sırala
     * @param {boolean} ascending - true: eskiden yeniye, false: yeniden eskiye
     */
    sortEventsByDate(ascending = true) {
        this.events.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);

            // Geçersiz tarihler en sona
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;

            return ascending ? dateA - dateB : dateB - dateA;
        });

        return this.events;
    }

    /**
     * İki tarih arasındaki farkı hesapla ve okunabilir formatta döndür
     * @param {string} date1 - Başlangıç tarihi (YYYY-MM-DD)
     * @param {string} date2 - Bitiş tarihi (YYYY-MM-DD)
     * @returns {string} - "2 gün", "3 ay", "1 yıl" formatında
     */
    calculateTimeDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        if (isNaN(d1) || isNaN(d2)) return '';

        const diffMs = Math.abs(d2 - d1);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Gün cinsinden hesapla
        if (diffDays === 0) return 'Aynı gün';
        if (diffDays === 1) return '1 gün';
        if (diffDays < 30) return `${diffDays} gün`;

        // Ay cinsinden
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths === 1) return '1 ay';
        if (diffMonths < 12) return `${diffMonths} ay`;

        // Yıl cinsinden
        const diffYears = Math.floor(diffDays / 365);
        const remainingMonths = Math.floor((diffDays % 365) / 30);

        if (diffYears === 1 && remainingMonths === 0) return '1 yıl';
        if (remainingMonths === 0) return `${diffYears} yıl`;
        return `${diffYears} yıl ${remainingMonths} ay`;
    }

    /**
     * Tüm olaylar için zaman farklarını yeniden hesapla
     */
    recalculateTimeGaps() {
        for (let i = 0; i < this.events.length - 1; i++) {
            if (this.events[i].date && this.events[i + 1].date) {
                const timeDiff = this.calculateTimeDifference(
                    this.events[i].date,
                    this.events[i + 1].date
                );
                this.events[i].timeToNext = timeDiff;
            }
        }

        // Son olay için timeToNext null
        if (this.events.length > 0) {
            this.events[this.events.length - 1].timeToNext = null;
        }
    }

    /**
     * Era'ya göre olayları grupla
     * @returns {Object} - { era: [events] } formatında
     */
    groupByEra() {
        const grouped = {};

        this.events.forEach(event => {
            const era = event.era || 'Diğer';
            if (!grouped[era]) {
                grouped[era] = [];
            }
            grouped[era].push(event);
        });

        return grouped;
    }

    /**
     * Kategoriye göre olayları grupla
     * @returns {Object} - { category: [events] } formatında
     */
    groupByCategory() {
        const grouped = {};

        this.events.forEach(event => {
            const category = event.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(event);
        });

        return grouped;
    }

    /**
     * Tarih aralığına göre filtrele
     * @param {string} startDate - Başlangıç tarihi (YYYY-MM-DD)
     * @param {string} endDate - Bitiş tarihi (YYYY-MM-DD)
     * @returns {Array} - Filtrelenmiş olaylar
     */
    filterByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= start && eventDate <= end;
        });
    }

    /**
     * Kategoriye göre filtrele
     * @param {Array} categories - Kategori listesi
     * @returns {Array} - Filtrelenmiş olaylar
     */
    filterByCategory(categories) {
        if (!categories || categories.length === 0) {
            return this.events;
        }

        return this.events.filter(event =>
            categories.includes(event.category)
        );
    }

    /**
     * Önem seviyesine göre filtrele
     * @param {number} minImportance - Minimum önem seviyesi (1-5)
     * @returns {Array} - Filtrelenmiş olaylar
     */
    filterByImportance(minImportance) {
        return this.events.filter(event =>
            (event.importance || 1) >= minImportance
        );
    }

    /**
     * Sadece kilometre taşlarını getir
     * @returns {Array} - Milestone olaylar (importance = 5)
     */
    getMilestones() {
        return this.events.filter(event => event.importance === 5);
    }

    /**
     * Timeline istatistikleri
     * @returns {Object} - İstatistik bilgileri
     */
    getStatistics() {
        if (this.events.length === 0) {
            return {
                totalEvents: 0,
                dateRange: '',
                totalDuration: '',
                categories: {},
                milestones: 0
            };
        }

        // Tarihleri sırala (geçerli tarihleri al)
        const dates = this.events
            .filter(e => e.date)
            .map(e => new Date(e.date))
            .filter(d => !isNaN(d))
            .sort((a, b) => a - b);

        // Hiç geçerli tarih yoksa, istatistikleri minimum bilgiyle döndür
        if (dates.length === 0) {
            const categoriesNoDates = {};
            this.events.forEach(event => {
                const cat = event.category || 'Other';
                categoriesNoDates[cat] = (categoriesNoDates[cat] || 0) + 1;
            });

            return {
                totalEvents: this.events.length,
                dateRange: '',
                totalDuration: '',
                categories: categoriesNoDates,
                milestones: this.getMilestones().length
            };
        }

        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];

        // Kategori dağılımı
        const categories = {};
        this.events.forEach(event => {
            const cat = event.category || 'Other';
            categories[cat] = (categories[cat] || 0) + 1;
        });

        return {
            totalEvents: this.events.length,
            dateRange: `${this.formatDate(firstDate)} - ${this.formatDate(lastDate)}`,
            totalDuration: this.calculateTimeDifference(
                firstDate.toISOString().split('T')[0],
                lastDate.toISOString().split('T')[0]
            ),
            categories: categories,
            milestones: this.getMilestones().length
        };
    }

    /**
     * Tarihi formatla (Türkçe)
     * @param {Date} date
     * @returns {string} - "15 Ocak 2020" formatında
     */
    formatDate(date) {
        // Savunmacı: geçersiz Date gelirse boş string döndür
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }

        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    /**
     * Kronolojik oynatma başlat
     * @param {number} speed - Milisaniye cinsinden hız (varsayılan 2000ms = 2 saniye)
     * @param {Function} onEventFocus - Her event'te çağrılacak callback
     */
    startPlayback(speed = 2000, onEventFocus = null) {
        if (this.events.length === 0) return;

        this.currentPlaybackIndex = 0;
        this.playbackTimer = setInterval(() => {
            if (this.currentPlaybackIndex < this.events.length) {
                const event = this.events[this.currentPlaybackIndex];

                // Callback varsa çağır
                if (onEventFocus && typeof onEventFocus === 'function') {
                    onEventFocus(event, this.currentPlaybackIndex);
                }

                this.currentPlaybackIndex++;
            } else {
                // Son event'e ulaşıldı, durdur
                this.stopPlayback();
            }
        }, speed);
    }

    /**
     * Oynatmayı durdur
     */
    stopPlayback() {
        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
            this.playbackTimer = null;
            this.currentPlaybackIndex = 0;
        }
    }

    /**
     * Sonraki event'e git
     * @param {Function} onEventFocus - Event'e odaklandığında çağrılacak callback
     */
    nextEvent(onEventFocus = null) {
        if (this.currentPlaybackIndex < this.events.length - 1) {
            this.currentPlaybackIndex++;
            const event = this.events[this.currentPlaybackIndex];

            if (onEventFocus && typeof onEventFocus === 'function') {
                onEventFocus(event, this.currentPlaybackIndex);
            }

            return event;
        }
        return null;
    }

    /**
     * Önceki event'e git
     * @param {Function} onEventFocus - Event'e odaklandığında çağrılacak callback
     */
    previousEvent(onEventFocus = null) {
        if (this.currentPlaybackIndex > 0) {
            this.currentPlaybackIndex--;
            const event = this.events[this.currentPlaybackIndex];

            if (onEventFocus && typeof onEventFocus === 'function') {
                onEventFocus(event, this.currentPlaybackIndex);
            }

            return event;
        }
        return null;
    }

    /**
     * Belirli bir event'e git
     * @param {number} index - Event index'i
     * @param {Function} onEventFocus - Event'e odaklandığında çağrılacak callback
     */
    goToEvent(index, onEventFocus = null) {
        if (index >= 0 && index < this.events.length) {
            this.currentPlaybackIndex = index;
            const event = this.events[index];

            if (onEventFocus && typeof onEventFocus === 'function') {
                onEventFocus(event, index);
            }

            return event;
        }
        return null;
    }

    /**
     * Tüm timeline event'lerini kronolojik sırayla bağla (haritada çizgi)
     * @param {Array} events - Timeline event'leri
     */
    connectAllEvents(events) {
        // Event'leri güncelle ve kronolojik sırala
        this.events = events.map(e => ({
            id: e.id,
            coords: e.coords,
            date: e.date,
            category: e.category,
            importance: e.importance,
            timeToNext: null
        }));

        // Kronolojik sırala
        if (this.isChronologicalSortEnabled) {
            this.sortEventsByDate();
            this.recalculateTimeGaps();
        }

        // En az 2 event gerekli
        if (this.events.length >= 2) {
            this.updateTimelineLine();
        }

        return this.events;
    }

    /**
     * Timeline çizgisini güncelle (kesikli siyah çizgi)
     */
    updateTimelineLine() {
        if (!this.map || this.events.length < 2) return;

        const timelineLineId = 'timeline-connection-line';
        const coords = this.events.map(e => e.coords);

        // Eski çizgiyi temizle
        this.removeTimelineLine();

        // Yeni timeline line ekle
        this.map.addSource(timelineLineId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: coords
                }
            }
        });

        // Kesikli siyah çizgi (dashed black line)
        this.map.addLayer({
            id: timelineLineId,
            type: 'line',
            source: timelineLineId,
            paint: {
                'line-color': '#000000',
                'line-width': 2,  // İnce çizgi
                'line-opacity': 0.7,
                'line-dasharray': [3, 3] // Kesikli çizgi (3px çizgi, 3px boşluk)
            },
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            }
        });
    }

    /**
     * Timeline çizgisini kaldır
     */
    removeTimelineLine() {
        if (!this.map) return;

        const timelineLineId = 'timeline-connection-line';

        if (this.map.getLayer(timelineLineId)) {
            this.map.removeLayer(timelineLineId);
        }

        if (this.map.getSource(timelineLineId)) {
            this.map.removeSource(timelineLineId);
        }
    }

    /**
     * Tüm event'leri temizle
     */
    clearEvents() {
        this.stopPlayback();
        this.removeTimelineLine();
        this.events = [];
        this.currentPlaybackIndex = 0;
    }

    /**
     * Event sayısını döndür
     * @returns {number}
     */
    getEventCount() {
        return this.events.length;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.removeTimelineLine();
        this.stopPlayback();
        this.events = [];
    }
}
