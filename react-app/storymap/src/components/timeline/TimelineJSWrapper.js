/**
 * TimelineJS Wrapper
 * Knight Lab TimelineJS kütüphanesini yöneten wrapper class
 */

export class TimelineJSWrapper {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = options;
        this.timeline = null;
        this.events = [];
        this.onSlideChange = options.onSlideChange || null;
    }

    /**
     * Timeline'ı başlatır
     * @param {Array} events - Event dizisi
     * @param {Object} config - Konfigürasyon
     */
    initialize(events = [], config = {}) {
        // Event yoksa veya boşsa başlatma (hata önleme)
        if (!events || events.length === 0) {
            return;
        }

        this.events = events;

        try {
            const timelineData = this.convertToTimelineJSFormat(events, config);

            // Converted events kontrolü
            if (!timelineData.events || timelineData.events.length === 0) {
                return;
            }

            const options = {
                language: 'tr',
                font: 'default',
                timenav_height: 150,
                timenav_position: 'bottom',
                start_at_end: false,
                hash_bookmark: false,
                ...this.options.timelineOptions
            };

            // TimelineJS global TL objesi
            if (typeof TL === 'undefined') {
                console.error('[TimelineJS] TL library not loaded!');
                return;
            }

            this.timeline = new TL.Timeline(
                this.containerId,
                timelineData,
                options
            );
            this.attachEventListeners();

            // Slide değişikliği event listener'ı ekle
            if (this.timeline && this.timeline.on && typeof this.timeline.on === 'function') {
                this.timeline.on('change', (e) => {
                    if (this.onSlideChange && e.unique_id) {
                        this.onSlideChange(e.unique_id, e.slide_number);
                    }
                });
            }

        } catch (error) {
            console.error('[TimelineJS] Error creating timeline:', error);
            console.error('[TimelineJS] Error details:', error.message, error.stack);
        }
    }

    /**
     * Event'leri TimelineJS formatına çevirir
     * @param {Array} events - Bizim event formatımız
     * @param {Object} config - Template config
     * @returns {Object} TimelineJS JSON formatı
     */
    convertToTimelineJSFormat(events, config = {}) {
        const timelineData = {
            title: {
                text: {
                    headline: config.title || 'Zaman Çizelgesi',
                    text: config.description || 'Harita tabanlı interaktif zaman çizelgesi'
                }
            },
            scale: 'human',
            events: []
        };

        // Event'leri dönüştür
        events.forEach((event, index) => {
            const slide = this.convertEventToSlide(event, index);
            if (slide) {
                timelineData.events.push(slide);
            } else {
            }
        });
        return timelineData;
    }

    /**
     * Tek bir event'i TimelineJS slide formatına çevirir
     * @param {Object} event - Event objesi
     * @param {Number} index - Event index
     * @returns {Object} TimelineJS slide objesi
     */
    convertEventToSlide(event, index) {
        if (!event.date) {
            return null;
        }

        // Tarihi parse et
        const dateObj = this.parseDateString(event.date, event.time);

        const slide = {
            unique_id: `event_${event.id || index}`,
            start_date: dateObj,
            text: {
                headline: event.title || 'İsimsiz Event',
                text: event.description || ''
            }
        };

        // Kategori (group olarak)
        if (event.category) {
            slide.group = this.getCategoryLabel(event.category);
        }

        // Medya ekle - DEVRE DIŞI (base64 veriler çok büyük, donma yapıyor)
        // TimelineJS'de medya gösterilmiyor, sadece sidebar'da gösteriliyor
        // if (event.media && event.media.length > 0) {
        //     const firstMedia = event.media[0];
        //     slide.media = {
        //         url: firstMedia.url,
        //         caption: event.title,
        //         credit: event.category ? this.getCategoryLabel(event.category) : '',
        //         thumbnail: firstMedia.url
        //     };
        // }

        // Background color (importance veya category'ye göre)
        if (event.color) {
            slide.background = {
                color: event.color
            };
        }

        // Display date (Türkçe formatla)
        if (event.date) {
            slide.display_date = this.formatDateTurkish(event.date, event.time);
        }

        return slide;
    }

    /**
     * Tarih string'ini TimelineJS date object'ine çevirir
     * @param {String} dateStr - YYYY-MM-DD formatında
     * @param {String} timeStr - HH:MM formatında (opsiyonel)
     * @returns {Object} TimelineJS date objesi
     */
    parseDateString(dateStr, timeStr = null) {
        const parts = dateStr.split('-');
        const dateObj = {
            year: parseInt(parts[0]),
            month: parts.length > 1 ? parseInt(parts[1]) : 1,
            day: parts.length > 2 ? parseInt(parts[2]) : 1
        };

        if (timeStr) {
            const timeParts = timeStr.split(':');
            dateObj.hour = parseInt(timeParts[0]);
            dateObj.minute = timeParts.length > 1 ? parseInt(timeParts[1]) : 0;
        }

        return dateObj;
    }

    /**
     * Tarihi Türkçe formatlar
     * @param {String} dateStr - YYYY-MM-DD
     * @param {String} timeStr - HH:MM
     * @returns {String} Formatlanmış tarih
     */
    formatDateTurkish(dateStr, timeStr = null) {
        const d = new Date(dateStr);
        const day = d.getDate();
        const month = d.toLocaleString('tr-TR', { month: 'long' });
        const year = d.getFullYear();

        let formatted = `${day} ${month} ${year}`;
        if (timeStr) {
            formatted += ` - ${timeStr}`;
        }

        return formatted;
    }

    /**
     * Kategoriyi Türkçe'ye çevirir
     * @param {String} category
     * @returns {String}
     */
    getCategoryLabel(category) {
        const labels = {
            'Military': 'Askeri',
            'Political': 'Siyasi',
            'Cultural': 'Kültürel',
            'Scientific': 'Bilimsel',
            'Social': 'Sosyal',
            'Economic': 'Ekonomik',
            'Other': 'Diğer'
        };
        return labels[category] || category;
    }

    /**
     * Timeline event listener'larını ekler
     */
    attachEventListeners() {
        if (!this.timeline) return;

        // Slide değiştiğinde
        const container = document.getElementById(this.containerId);
        if (container) {
            // TimelineJS slide change event'i
            window.addEventListener('message', (e) => {
                if (e.data && e.data.type === 'timeline') {
                    // reserved for future cross-window messaging
                }
            });
        }
    }

    /**
     * Event'leri günceller
     * @param {Array} events - Yeni event dizisi
     */
    updateEvents(events) {
        // Eğer event yoksa güncelleme yapma (freeze'i önler)
        if (!events || events.length === 0) {
            return;
        }

        this.events = events;

        try {
            // Önce eski timeline'ı yok et
            if (this.timeline) {
                this.destroy();
            }

            // Yeni timeline'ı oluştur
            this.initialize(events, this.options.config || {});

        } catch (error) {
            console.error('[TimelineJS] Error updating timeline:', error);
        }
    }

    /**
     * Belirli bir event'e/slayta git
     * @param {Number|String} target - Event index'i veya TimelineJS unique_id değeri
     *
     * Not:
     * - TimelineJS resmi API'si genelde goToId / goTo metodlarını sağlıyor.
     * - Eski kodda kullanılan goToSlide bazı sürümlerde bulunmadığı için
     *   slayt içeriği (tl-slide-content-container) değişmiyordu.
     */
    goToSlide(target) {
        if (!this.timeline) return;

        // Eğer index geldiyse, ilgili event için unique_id üret
        let uniqueId = null;
        if (typeof target === 'number') {
            const event = this.events[target];
            if (event) {
                uniqueId = `event_${event.id || target}`;
            }
        } else if (typeof target === 'string') {
            // Dışarıdan doğrudan unique_id verilmiş olabilir
            uniqueId = target;
        }

        // Önce uniqueId ile gitmeyi dene (önerilen yol)
        if (uniqueId && typeof this.timeline.goToId === 'function') {
            this.timeline.goToId(uniqueId);
            return;
        }

        // Alternatif: bazı sürümlerde goTo(dateOrIndex) mevcut
        if (typeof target === 'number' && typeof this.timeline.goTo === 'function') {
            // TimelineJS çoğunlukla 0‑based index kabul ediyor; doğrudan gönderiyoruz
            this.timeline.goTo(target);
            return;
        }

        // Son çare: eski kodla uyumluluk (varsa)
        if (typeof this.timeline.goToSlide === 'function') {
            this.timeline.goToSlide(target);
        } else {
            // no compatible navigation method found; silently ignore
        }
    }

    /**
     * Timeline'ı göster
     */
    show() {
        const container = document.getElementById(this.containerId).parentElement;
        if (container) {
            container.style.display = 'block';
        }
    }

    /**
     * Timeline'ı gizle
     */
    hide() {
        const container = document.getElementById(this.containerId).parentElement;
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Timeline'ı yok et
     */
    destroy() {
        console.log('[TimelineJS] Destroying timeline...');
        try {
            if (this.timeline) {
                // TimelineJS'in destroy metodu yoksa, container'ı temizle
                const container = document.getElementById(this.containerId);
                if (container) {
                    // Tüm event listener'ları kaldır ve içeriği temizle
                    container.innerHTML = '';
                    console.log('[TimelineJS] Container cleared');
                }
                this.timeline = null;
            }
        } catch (error) {
            console.error('[TimelineJS] Error destroying timeline:', error);
        }
    }
}
