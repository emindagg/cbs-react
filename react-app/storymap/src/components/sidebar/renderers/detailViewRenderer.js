/**
 * Detay görünümü renderer
 */

import {
    MARKER_STYLES,
    COLOR_PALETTE,
    TEXT_ANNOTATION_STYLES,
    LEADER_LINE_STYLES
} from '../constants/index.js';
import { renderMediaItems } from './mediaRenderer.js';

/**
 * Detay görünümü HTML'ini oluşturur
 * @param {Object} context - Sidebar context
 * @returns {string} HTML string
 */
export function renderDetailView(context) {
    const { editingPoint, isOpen, markerStyles = MARKER_STYLES, colorPalette = COLOR_PALETTE, data, viewMode } = context;
    const point = editingPoint;
    const isRouteTemplate = data?.templateName === 'Rota Bazlı';
    const isTimelineTemplate = data?.templateName === 'Timeline Bazlı';
    const isStoryMapTemplate = data?.templateName === 'Hikâye Haritası';
    const isTextDrawing = point?.drawingType === 'text';
    const defaultZoom = (isTimelineTemplate || isStoryMapTemplate) ? 12 : 14;
    const pointZoom = Number.isFinite(Number(point.zoom))
        ? Math.max(1, Math.min(18, Number(point.zoom)))
        : defaultZoom;

    // Detail panel her zaman "Kaydet" gösterir (her nokta bağımsız)
    const saveButtonText = 'Kaydet';
    const saveButtonIcon = 'fa-save';

    // Rota template için sadece sayı stilini göster
    const availableStyles = isRouteTemplate
        ? markerStyles.filter(s => s.id === 'number')
        : markerStyles;

    const selectedStyle = availableStyles.find(s => s.id === point.style) || availableStyles[0];
    const inputDisabled = viewMode ? 'disabled' : '';

    return `
        <div class="sidebar ${isOpen ? '' : 'sidebar--closed'}">
            <!-- Detail Header -->
            <div class="sidebar__detail-header">
                <div class="sidebar__detail-tabs">
                    <button class="sidebar__detail-tab sidebar__detail-tab--active" data-tab="layers">
                        <i class="fa-solid fa-layer-group"></i>
                    </button>
                    <button class="sidebar__detail-tab" data-tab="settings">
                        <i class="fa-solid fa-cog"></i>
                    </button>
                </div>
            </div>

            <!-- Back Button -->
            <div class="sidebar__detail-back">
                <button class="sidebar__back-btn" id="btn-back">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Tüm detaylar</span>
                </button>
            </div>

            <!-- Detail Content -->
            <div class="sidebar__detail-content">
                <!-- Image/Video Upload Area -->
                <div class="sidebar__media-section">
                    <div class="sidebar__media-grid" id="media-grid">
                        ${renderMediaItems(point.media || [])}
                    </div>
                    ${!viewMode ? `
                    <div class="sidebar__media-upload" id="media-upload-area">
                        <div class="sidebar__media-upload-content">
                            <span>Görüntü veya video</span>
                        </div>
                        <input type="file" id="media-input" accept="image/*,video/*" multiple hidden>
                    </div>
                    ` : ''}
                </div>

                <!-- Title Input -->
                <div class="sidebar__detail-field">
                    <input type="text"
                           class="sidebar__detail-input"
                           id="point-title"
                           placeholder="Adı (isteğe bağlı)"
                           value="${point.title || ''}"
                           ${inputDisabled}>
                </div>

                <!-- Description Input -->
                <div class="sidebar__detail-field">
                    <textarea class="sidebar__detail-textarea"
                              id="point-description"
                              placeholder="Açıklama (isteğe bağlı)"
                              rows="4"
                              ${inputDisabled}>${point.description || ''}</textarea>
                </div>

                ${!viewMode && isTextDrawing ? `
                <!-- Ek Açıklama Stili -->
                <div class="sidebar__text-annotation-section">
                    <div class="sidebar__text-annotation-title">
                        <i class="fa-solid fa-comment-dots"></i>
                        <span>Ek Açıklama Stili</span>
                    </div>

                    <div class="sidebar__detail-field">
                        <label class="sidebar__detail-label" for="point-text-content">İçerik</label>
                        <textarea class="sidebar__detail-textarea sidebar__text-content"
                                  id="point-text-content"
                                  placeholder="Metin içeriğini yazın"
                                  rows="4">${point.text || ''}</textarea>
                    </div>

                    <div class="sidebar__detail-field">
                        <label class="sidebar__detail-label">Stil</label>
                        <div class="sidebar__text-style-grid">
                            ${TEXT_ANNOTATION_STYLES.map(style => `
                                <button class="sidebar__text-style-option ${style.id === (point.textStyle || 'boxed') ? 'sidebar__text-style-option--active' : ''}"
                                        data-text-style="${style.id}"
                                        title="${style.name}">
                                    <span class="sidebar__text-style-preview sidebar__text-style-preview--${style.id}">${style.preview}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="sidebar__detail-field">
                        <div class="sidebar__detail-label sidebar__text-toggle-label">
                            <span>Belirtme çizgisi</span>
                            <label class="sidebar__switch">
                                <input type="checkbox"
                                       id="point-leader-line"
                                       ${point.leaderLine !== false ? 'checked' : ''}>
                                <span class="sidebar__switch-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="sidebar__detail-field" id="leader-line-style-field" style="display: ${point.leaderLine !== false ? 'block' : 'none'};">
                        <label class="sidebar__detail-label">Çizgi türü</label>
                        <div class="sidebar__leader-line-grid">
                            ${LEADER_LINE_STYLES.map(lineStyle => `
                                <button class="sidebar__leader-line-option ${lineStyle.id === (point.leaderLineStyle || 'solid') ? 'sidebar__leader-line-option--active' : ''}"
                                        data-leader-line-style="${lineStyle.id}"
                                        title="${lineStyle.name}">
                                    <span class="sidebar__leader-line-preview sidebar__leader-line-preview--${lineStyle.id}"></span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}

                ${!viewMode ? `
                <!-- Yakınlaştırma Seviyesi -->
                <div class="sidebar__detail-field">
                    <label class="sidebar__detail-label" for="point-zoom">
                        Yakınlaştırma Seviyesi
                        <span class="sidebar__zoom-value" id="point-zoom-value">${pointZoom}</span>
                    </label>
                    <input type="range"
                           class="sidebar__zoom-slider"
                           id="point-zoom"
                           min="1"
                           max="18"
                           step="1"
                           value="${pointZoom}">
                </div>
                ` : ''}

                ${isRouteTemplate ? `
                <!-- Rota Bilgileri -->
                <div class="sidebar__route-info-section">
                    <div class="sidebar__route-info-title">
                        <i class="fa-solid fa-route"></i>
                        <span>Rota Bilgileri</span>
                    </div>

                    <!-- Ziyaret Günü -->
                    <div class="sidebar__detail-field">
                        <label class="sidebar__detail-label">Ziyaret Günü</label>
                        <input type="number"
                               class="sidebar__detail-input"
                               id="point-visitday"
                               placeholder="Gün numarası (ör: 1, 2, 3...)"
                               min="1"
                               max="30"
                               value="${point.visitDay || 1}"
                               ${inputDisabled}>
                    </div>

                    <!-- Zaman -->
                    <div class="sidebar__detail-field">
                        <label class="sidebar__detail-label">Varış Zamanı</label>
                        <input type="text"
                               class="sidebar__detail-input"
                               id="point-timestamp"
                               placeholder="Örn: 09:00, 14:30"
                               value="${point.timestamp || ''}"
                               ${inputDisabled}>
                    </div>

                    ${point.distanceToNext ? `
                    <!-- Sonraki Noktaya Mesafe (Sadece Gösterim) -->
                    <div class="sidebar__route-info-stat">
                        <i class="fa-solid fa-arrow-right"></i>
                        <span>Sonraki noktaya <strong>${point.distanceToNext} km</strong></span>
                    </div>
                    ` : ''}
                </div>
                ` : ''}

                ${isTimelineTemplate ? `
                <!-- Timeline Bilgileri -->
                <div class="sidebar__timeline-info-section">
                    <div class="sidebar__timeline-info-title">
                        <i class="fa-solid fa-clock"></i>
                        <span>Zaman Çizelgesi Bilgileri</span>
                    </div>

                    <!-- Tarih (Zorunlu) -->
                    <div class="sidebar__detail-field">
                        <label class="sidebar__detail-label">
                            <i class="fa-solid fa-calendar-day"></i> Tarih *
                        </label>
                        <input type="date"
                               class="sidebar__detail-input"
                               id="point-date"
                               required
                               value="${point.date || ''}"
                               ${inputDisabled}>
                    </div>

                    <!-- Saat (İsteğe bağlı) -->

                    ${point.timeToNext ? `
                    <!-- Sonraki Olaya Zaman Farkı (Sadece Gösterim) -->
                    <div class="sidebar__timeline-info-stat">
                        <i class="fa-solid fa-arrow-down"></i>
                        <span>Sonraki olaya <strong>${point.timeToNext}</strong></span>
                    </div>
                    ` : ''}
                </div>
                ` : ''}

                ${!viewMode && !isRouteTemplate && !isTimelineTemplate && !isTextDrawing ? `
                <!-- Style Selector -->
                <div class="sidebar__detail-field">
                    <label class="sidebar__detail-label">Stil</label>
                    <div class="sidebar__style-selector">
                        <button class="sidebar__style-current" id="style-selector-btn">
                            <div class="sidebar__style-icon" style="background-color: ${point.color || selectedStyle.color}">
                                ${selectedStyle.isNumber
                                    ? `<span style="color: white; font-weight: bold; font-size: 11px;">${point.number || '1'}</span>`
                                    : `<i class="fa-solid ${selectedStyle.icon}"></i>`
                                }
                            </div>
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                        <div class="sidebar__style-dropdown" id="style-dropdown">
                            ${availableStyles.map(style => `
                                <button class="sidebar__style-option ${style.id === point.style ? 'sidebar__style-option--active' : ''}"
                                        data-style-id="${style.id}">
                                    <div class="sidebar__style-icon" style="background-color: ${style.color}">
                                        ${style.isNumber
                                            ? `<span style="color: white; font-weight: bold; font-size: 11px;">1</span>`
                                            : `<i class="fa-solid ${style.icon}"></i>`
                                        }
                                    </div>
                                    <span>${style.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}

                ${!isTimelineTemplate && !isTextDrawing ? `
                <!-- Renk Seçici -->
                <div class="sidebar__field">
                    <label class="sidebar__label">Renk</label>
                    <div class="sidebar__color-picker">
                        ${colorPalette.map(color => `
                            <button class="sidebar__color-option ${point.color === color ? 'sidebar__color-option--active' : ''}"
                                    data-color="${color}"
                                    style="background-color: ${color}">
                            </button>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Detail Footer -->
            <div class="sidebar__detail-footer">
                ${viewMode ? `
                <button class="sidebar__detail-save" id="btn-back" style="width: 100%;">
                    Kapat
                </button>
                ` : `
                <button class="sidebar__detail-save" id="btn-save-point">
                    <i class="fa-solid ${saveButtonIcon}"></i>
                    <span>${saveButtonText}</span>
                </button>
                <button class="sidebar__detail-delete" id="btn-delete-point">
                    <i class="fa-solid fa-trash"></i>
                </button>
                `}
            </div>
        </div>
        <!-- Toggle Button - Sidebar dışında -->
        <button class="sidebar__toggle" id="sidebar-toggle" aria-label="Sidebar'ı aç/kapat">
            <i class="fa-solid ${isOpen ? 'fa-chevron-left' : 'fa-chevron-right'}"></i>
        </button>
    `;
}
