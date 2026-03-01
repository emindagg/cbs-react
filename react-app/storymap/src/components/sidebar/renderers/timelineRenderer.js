/**
 * Timeline renderer - Kronolojik olay listesi ve kontroller
 * Timeline şablonu için sidebar görselleştirme
 */

/**
 * Timeline bölümünü render eder
 * @param {Array} events - Timeline olayları dizisi
 * @param {Object} options - Ekstra seçenekler (templateConfig, timelineManager, statistics, viewMode)
 * @returns {string} HTML string
 */
export function renderTimelineSection(events, options = {}) {
    const { templateConfig, statistics, viewMode } = options;
    const isEraGroupingEnabled = templateConfig?.enableEraGrouping || false;

    return `
        <div class="sidebar__section">
            <div class="sidebar__section-header">
                <i class="fa-solid fa-clock"></i>
                <span class="sidebar__section-title">Zaman Çizelgesi</span>
                <span class="sidebar__section-count">${events.length}</span>
            </div>

            ${statistics ? renderTimelineStatistics(statistics) : ''}
            ${renderTimelineControls()}

            <div class="sidebar__timeline-events" id="sidebar-timeline-events">
                ${isEraGroupingEnabled ? renderGroupedTimeline(events) : renderTimelineEvents(events)}
            </div>
        </div>
    `;
}

/**
 * Timeline istatistiklerini render eder
 * @param {Object} statistics - İstatistik verileri
 * @returns {string} HTML string
 */
export function renderTimelineStatistics(statistics) {
    const { totalEvents, dateRange, totalDuration, milestones } = statistics;

    if (!totalEvents || totalEvents === 0) {
        return '';
    }

    return `
        <div class="timeline__statistics">
            <div class="timeline__stat-item">
                <i class="fa-solid fa-calendar-days"></i>
                <div class="timeline__stat-content">
                    <div class="timeline__stat-label">Tarih Aralığı</div>
                    <div class="timeline__stat-value">${dateRange}</div>
                </div>
            </div>
            <div class="timeline__stat-item">
                <i class="fa-solid fa-hourglass-half"></i>
                <div class="timeline__stat-content">
                    <div class="timeline__stat-label">Toplam Süre</div>
                    <div class="timeline__stat-value">${totalDuration}</div>
                </div>
            </div>
            ${milestones > 0 ? `
                <div class="timeline__stat-item">
                    <i class="fa-solid fa-star"></i>
                    <div class="timeline__stat-content">
                        <div class="timeline__stat-label">Dönüm Noktaları</div>
                        <div class="timeline__stat-value">${milestones}</div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Timeline oynatma kontrollerini render eder
 * @returns {string} HTML string
 */
export function renderTimelineControls() {
    return `
        <div class="timeline__controls">
            <button class="timeline__control-btn timeline__control-btn--primary" data-action="refresh-timelinejs" title="TimelineJS'i Yenile">
                <i class="fa-solid fa-rotate-right"></i>
                <span>Yenile</span>
            </button>
            <div class="timeline__controls-divider"></div>
            <button class="timeline__control-btn" data-action="playback-start" title="Kronolojik Oynatma">
                <i class="fa-solid fa-play"></i>
            </button>
            <button class="timeline__control-btn" data-action="playback-stop" title="Durdur" disabled>
                <i class="fa-solid fa-stop"></i>
            </button>
            <button class="timeline__control-btn" data-action="previous-event" title="Önceki Olay">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button class="timeline__control-btn" data-action="next-event" title="Sonraki Olay">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;
}

/**
 * Timeline olaylarını kronolojik liste olarak render eder
 * @param {Array} events - Timeline olayları dizisi
 * @returns {string} HTML string
 */
export function renderTimelineEvents(events) {
    if (!events || events.length === 0) {
        return `
            <div class="sidebar__empty">
                <i class="fa-solid fa-clock"></i>
                <p>Henüz olay eklenmedi</p>
                <small>Araç çubuğundan "Olay ekle" seçerek kronolojik hikâyenizi oluşturmaya başlayın</small>
            </div>
        `;
    }

    // Olayları tarihe göre sırala (eskiden yeniye)
    const sortedEvents = [...events].sort((a, b) => {
        if (!a.date) return 1;  // Tarihi olmayan en sona
        if (!b.date) return -1;

        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        // Geçersiz tarihler en sona
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;

        return dateA - dateB;  // Eskiden yeniye sıralama
    });

    return sortedEvents.map((event, index) => {
        const isLastEvent = index === events.length - 1;
        const isMilestone = event.importance === 5;
        const category = event.category || 'Other';
        const color = event.color || '#6b7280';

        return `
            <div class="timeline__event-wrapper">
                <div class="timeline__event-line-container">
                    <div class="timeline__event-marker ${isMilestone ? 'timeline__event-marker--milestone' : ''}"
                         style="background-color: ${color}; border-color: ${color};">
                        ${isMilestone ? '<i class="fa-solid fa-star"></i>' : ''}
                    </div>
                    ${!isLastEvent ? '<div class="timeline__connecting-line"></div>' : ''}
                </div>

                <div class="timeline__event-content-wrapper">
                    <div class="timeline__event-item" data-event-id="${event.id || index}">
                        <div class="timeline__event-header" data-action="focus">
                            <div class="timeline__event-date">
                                ${formatEventDate(event.date, event.time)}
                            </div>
                            ${event.category ? `
                                <span class="timeline__event-category-badge" style="background-color: ${color};">
                                    ${getCategoryLabel(category)}
                                </span>
                            ` : ''}
                        </div>

                        <div class="timeline__event-body" data-action="focus">
                            <div class="timeline__event-title">${event.title || `Olay ${index + 1}`}</div>
                            ${event.historicalContext ? `
                                <div class="timeline__event-context">${event.historicalContext}</div>
                            ` : ''}
                            ${event.era ? `
                                <div class="timeline__event-era">
                                    <i class="fa-solid fa-layer-group"></i> ${event.era}
                                </div>
                            ` : ''}
                        </div>

                        <button class="timeline__event-detail-btn" data-action="openDetail" title="Detay">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>

                    ${!isLastEvent && event.timeToNext ? `
                        <div class="timeline__time-gap">
                            <i class="fa-solid fa-arrow-down"></i>
                            <span>${event.timeToNext}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Era bazlı gruplandırılmış timeline render eder
 * @param {Array} events - Timeline olayları dizisi
 * @returns {string} HTML string
 */
export function renderGroupedTimeline(events) {
    if (!events || events.length === 0) {
        return renderTimelineEvents(events); // Boş durumda normal renderer'ı kullan
    }

    // Olayları era'ya göre grupla
    const groupedByEra = {};
    events.forEach(event => {
        const era = event.era || 'Diğer Dönem';
        if (!groupedByEra[era]) {
            groupedByEra[era] = [];
        }
        groupedByEra[era].push(event);
    });

    // Her era grubu için render
    return Object.entries(groupedByEra).map(([era, eraEvents]) => {
        return `
            <div class="timeline__era-group">
                <div class="timeline__era-header">
                    <i class="fa-solid fa-layer-group"></i>
                    <span class="timeline__era-title">${era}</span>
                    <span class="timeline__era-count">${eraEvents.length}</span>
                </div>
                <div class="timeline__era-events">
                    ${renderTimelineEvents(eraEvents)}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Olay tarihini formatla
 * @param {string} date - YYYY-MM-DD formatında tarih
 * @param {string} time - HH:MM formatında saat (opsiyonel)
 * @returns {string} Formatlanmış tarih
 */
export function formatEventDate(date, time = null) {
    if (!date) return 'Tarih belirtilmemiş';

    const dateObj = new Date(date);
    if (isNaN(dateObj)) return date;

    const formatted = dateObj.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    if (time) {
        return `${formatted} - ${time}`;
    }

    return formatted;
}

/**
 * Kategori etiketini Türkçe'ye çevir
 * @param {string} category - İngilizce kategori adı
 * @returns {string} Türkçe etiket
 */
export function getCategoryLabel(category) {
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
 * Önem seviyesi ikonunu döndür
 * @param {number} importance - 1-5 arası önem seviyesi
 * @returns {string} İkon class adı
 */
export function getImportanceIcon(importance) {
    if (importance === 5) return 'fa-star'; // Milestone
    if (importance === 4) return 'fa-exclamation';
    if (importance === 3) return 'fa-circle';
    if (importance === 2) return 'fa-circle-small';
    return 'fa-dot-circle';
}

/**
 * Filtreleme kontrollerini render eder
 * @param {Object} filterOptions - Aktif filtreler
 * @returns {string} HTML string
 */
export function renderTimelineFilters(filterOptions = {}) {
    const { categories = [], minImportance = 1, dateRange = null } = filterOptions;

    return `
        <div class="timeline__filters">
            <div class="timeline__filter-header">
                <i class="fa-solid fa-filter"></i>
                <span>Filtreler</span>
                ${(categories.length > 0 || dateRange) ? `
                    <button class="timeline__filter-clear" data-action="clear-filters">
                        <i class="fa-solid fa-times"></i> Temizle
                    </button>
                ` : ''}
            </div>

            <div class="timeline__filter-group">
                <label class="timeline__filter-label">Kategori</label>
                <div class="timeline__filter-categories">
                    ${renderCategoryFilters(categories)}
                </div>
            </div>
        </div>
    `;
}

/**
 * Kategori filtre checkboxlarını render eder
 * @param {Array} selectedCategories - Seçili kategoriler
 * @returns {string} HTML string
 */
export function renderCategoryFilters(selectedCategories = []) {
    const categories = ['Military', 'Political', 'Cultural', 'Scientific', 'Social', 'Economic', 'Other'];

    return categories.map(category => {
        const isChecked = selectedCategories.includes(category);
        return `
            <label class="timeline__filter-checkbox">
                <input type="checkbox"
                       value="${category}"
                       ${isChecked ? 'checked' : ''}
                       data-action="filter-category">
                <span>${getCategoryLabel(category)}</span>
            </label>
        `;
    }).join('');
}
