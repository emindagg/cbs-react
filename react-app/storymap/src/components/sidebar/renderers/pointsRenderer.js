/**
 * Noktalar ve adımlar renderer
 */

/**
 * Noktalar bölümünü render eder
 * @param {Array} points - Noktalar dizisi
 * @param {Object} options - Ekstra seçenekler (templateName, routeData, viewMode)
 * @returns {string} HTML string
 */
export function renderPointsSection(points, options = {}) {
    const { templateName, routeData, viewMode } = options;
    const isRouteTemplate = templateName === 'Rota Bazlı';
    const isPointTemplate = templateName === 'Nokta Eklenen';
    const isStoryMapTemplate = templateName === 'Hikâye Haritası';

    return `
        <div class="sidebar__section">
            <div class="sidebar__section-header">
                <i class="fa-solid fa-map-marker-alt"></i>
                <span class="sidebar__section-title">${isRouteTemplate ? 'Rota Noktaları' : (isStoryMapTemplate ? 'Hikâye Adımları' : 'Noktalar')}</span>
                <span class="sidebar__section-count">${points.length}</span>
            </div>

            ${isRouteTemplate ? renderRouteTools(routeData) : ''}
            ${((isPointTemplate || isRouteTemplate) && points.length > 1) ? renderPointPlaybackControls() : ''}

            <div class="sidebar__points" id="sidebar-points">
                ${renderPoints(points, isRouteTemplate)}
            </div>
        </div>
    `;
}

/**
 * Point template otomatik oynatma kontrolleri
 * @returns {string} HTML string
 */
export function renderPointPlaybackControls() {
    return `
        <div class="point-playback">
            <button class="point-playback__btn" id="point-playback-toggle" data-playing="false" title="Otomatik Oynat">
                <i class="fa-solid fa-play"></i>
            </button>
            <div class="point-playback__speeds">
                <div class="point-playback__speeds-label">
                    <i class="fa-solid fa-gauge"></i>
                    <span>Hız</span>
                </div>
                <div class="point-playback__speeds-buttons">
                    <button class="point-playback__speed-btn" data-speed="0.5">0.5x</button>
                    <button class="point-playback__speed-btn point-playback__speed-btn--active" data-speed="1">1x</button>
                    <button class="point-playback__speed-btn" data-speed="1.5">1.5x</button>
                    <button class="point-playback__speed-btn" data-speed="2">2x</button>
                    <button class="point-playback__speed-btn" data-speed="3">3x</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Rota araçları bölümünü render eder
 * @param {Object} routeData - Rota verileri (totalDistance, daySummary, startPoint, endPoint, displacement, bearingAngle)
 * @returns {string} HTML string
 */
export function renderRouteTools(routeData = {}) {
    const {
        totalDistance = 0,
        daySummary = [],
        displacement = 0,
        bearingAngle = 0,
        hasPoints = false
    } = routeData;

    return `
        <!-- Start-End Distance Widget -->
        <div class="bearing-line">
            <div class="dot-start">
                <p class="point-label">Başlangıç</p>
            </div>
            <div class="line-dash"></div>
            <div class="measurement-box">
                <div class="measurement-item">
                    <div class="measurement-label">Toplam mesafe</div>
                    <div class="measurement-value">${hasPoints && totalDistance > 0 ? totalDistance.toFixed(2) : '0.00'} km</div>
                </div>
            </div>
            <div class="line-dash"></div>
            <div class="dot-end">
                <p class="point-label">Bitiş</p>
            </div>
        </div>
    `;
}

/**
 * Nokta listesini render eder
 * @param {Array} points - Noktalar dizisi
 * @param {boolean} isRouteTemplate - Rota şablonu mu?
 * @returns {string} HTML string
 */
export function renderPoints(points, isRouteTemplate = false) {
    if (!points || points.length === 0) {
        return `
            <div class="sidebar__empty">
                <i class="fa-solid fa-map-marker-alt"></i>
                <p>Henüz öge eklenmedi</p>
                <small>${isRouteTemplate ? 'Araç çubuğundan "Nokta ekle" seçerek haritaya işaretleyerek başlayın' : 'Araç çubuğundan bir araç seçerek öge ekleyin'}</small>
            </div>
        `;
    }

    // Rota şablonunda bağlantılı görünüm
    if (isRouteTemplate) {
        // Rota noktaları için numara sayacı
        let routePointNumber = 1;

        return points.map((point, index) => {
            const isDrawing = point.isDrawing;
            const visitDay = point.visitDay || null;
            const duration = point.duration || null;
            const distanceToNext = point.distanceToNext || null;
            const isLastPoint = index === points.length - 1;

            // Çizim öğesi mi yoksa rota noktası mı?
            const currentNumber = isDrawing ? null : routePointNumber++;

            return `
            <div class="sidebar__route-point-wrapper">
                <div class="sidebar__route-point-line-container">
                    ${!isDrawing ? `
                        <div class="sidebar__point-marker-mini" style="background-color: ${point.color || '#ef4444'}">
                            <span style="color: white; font-weight: bold; font-size: 10px;">${currentNumber}</span>
                        </div>
                    ` : `
                        <div class="sidebar__point-marker-mini sidebar__point-marker-mini--drawing" style="background-color: ${point.color || '#6b7280'}">
                            <i class="fa-solid ${point.icon || 'fa-shapes'}" style="color: white; font-size: 8px;"></i>
                        </div>
                    `}
                    ${!isLastPoint ? `<div class="sidebar__route-connecting-line"></div>` : ''}
                </div>
                <div class="sidebar__route-point-content-wrapper">
                    <div class="sidebar__point-item-minimal ${isDrawing ? 'sidebar__point-item--drawing' : ''}" data-point-id="${point.id || index}">
                        <div class="sidebar__point-content-minimal" data-action="focus">
                            <div class="sidebar__point-title-minimal">${point.title || (isDrawing ? 'Çizim' : `Nokta ${currentNumber}`)}</div>
                        </div>
                        <button class="sidebar__point-btn-minimal" data-action="openDetail" title="Detay">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                    ${!isDrawing && ((visitDay || duration) || (!isLastPoint && distanceToNext)) ? `
                        <div class="sidebar__point-meta-row">
                            <div class="sidebar__point-meta-minimal">
                                ${visitDay ? `<span class="sidebar__point-meta-tag"><i class="fa-solid fa-calendar"></i> Gün ${visitDay}</span>` : ''}
                                ${duration ? `<span class="sidebar__point-meta-tag"><i class="fa-solid fa-clock"></i> ${duration}</span>` : ''}
                            </div>
                            ${!isLastPoint && distanceToNext ? `
                                <div class="sidebar__route-distance-inline">
                                    <span>${distanceToNext} km</span>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `}).join('');
    }

    // Diğer şablonlarda bağımsız nokta kartları
    return points.map((point, index) => {
        return `
            <div class="sidebar__point-item-minimal" data-point-id="${point.id || index}" style="margin-bottom: 8px;">
                <div class="sidebar__point-content-minimal" data-action="focus">
                    <div class="sidebar__point-title-minimal">${point.title || `Nokta ${index + 1}`}</div>
                </div>
                <button class="sidebar__point-btn-minimal" data-action="openDetail" title="Detay">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Adımlar bölümünü render eder
 * @param {Array} steps - Adımlar dizisi
 * @returns {string} HTML string
 */
export function renderStepsSection(steps) {
    return `
        <div class="sidebar__section">
            <div class="sidebar__section-header">
                <i class="fa-solid fa-list-ol"></i>
                <span class="sidebar__section-title">Adımlar</span>
            </div>
            <div class="sidebar__steps" id="sidebar-steps">
                ${renderSteps(steps)}
            </div>
        </div>
    `;
}

/**
 * Adım listesini render eder
 * @param {Array} steps - Adımlar dizisi
 * @returns {string} HTML string
 */
export function renderSteps(steps) {
    if (!steps || steps.length === 0) {
        return `
            <div class="sidebar__empty">
                <i class="fa-solid fa-inbox"></i>
                <p>Henüz adım eklenmedi</p>
            </div>
        `;
    }

    return steps.map((step, index) => `
        <div class="sidebar__step-item" data-step-id="${step.id || index}">
            <div class="sidebar__step-number">${index + 1}</div>
            <div class="sidebar__step-content">
                <div class="sidebar__step-title">${step.title || `Adım ${index + 1}`}</div>
                ${step.content ? `<div class="sidebar__step-desc">${step.content.substring(0, 60)}...</div>` : ''}
            </div>
            <div class="sidebar__step-actions">
                <button class="sidebar__step-btn" data-action="focus" title="Konuma odaklan">
                    <i class="fa-solid fa-crosshairs"></i>
                </button>
                <button class="sidebar__step-btn" data-action="edit" title="Düzenle">
                    <i class="fa-solid fa-pencil"></i>
                </button>
                <button class="sidebar__step-btn" data-action="delete" title="Sil">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}
