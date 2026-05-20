/**
 * Liste görünümü renderer
 */

import { renderPointsSection, renderStepsSection } from './pointsRenderer.js';
import { renderTimelineSection } from './timelineRenderer.js';

/**
 * Liste görünümü HTML'ini oluşturur
 * @param {Object} context - Sidebar context (data, isOpen, points, vb.)
 * @returns {string} HTML string
 */
export function renderListView(context) {
    const { data, isOpen, points, routeData, timelineData, viewMode, hasSaved = false } = context;
    const isPointTemplate = data.templateName === 'Nokta Eklenen';
    const isRouteTemplate = data.templateName === 'Rota Bazlı';
    const isTimelineTemplate = data.templateName === 'Timeline Bazlı';
    const isStoryMapTemplate = data.templateName === 'Hikâye Haritası';

    // Save button text and icon based on hasSaved state
    const saveButtonText = hasSaved ? 'Güncelle' : 'Kaydet';
    const saveButtonIcon = hasSaved ? 'fa-sync-alt' : 'fa-save';

    return `
        <div class="sidebar ${isOpen ? '' : 'sidebar--closed'} ${viewMode ? 'sidebar--view-mode' : ''}">
            <!-- Header -->
            <div class="sidebar__header">
                <div class="sidebar__header-content">
                    <h2 class="sidebar__title">${data.title || 'Yeni Hikâye Haritam'}</h2>
                    <p class="sidebar__subtitle">${data.desc || 'Harita açıklaması'}</p>
                </div>
            </div>

            <!-- Tabs -->
            <div class="sidebar__tabs">
                <button class="sidebar__tab sidebar__tab--active" data-tab="layers">
                    <i class="fa-solid fa-layer-group"></i>
                </button>
                <button class="sidebar__tab" data-tab="settings">
                    <i class="fa-solid fa-cog"></i>
                </button>
            </div>

            <!-- Content -->
            <div class="sidebar__content">
                ${isTimelineTemplate
                    ? renderTimelineSection(points, {
                        templateConfig: data.template || {},
                        statistics: timelineData?.statistics || null,
                        viewMode: viewMode
                    })
                    : (isPointTemplate || isRouteTemplate || isStoryMapTemplate
                        ? renderPointsSection(points, {
                            templateName: data.templateName,
                            routeData: routeData,
                            viewMode: viewMode
                        })
                        : renderStepsSection(data.steps))}
            </div>

            <!-- Footer -->
            <div class="sidebar__footer">
                ${isStoryMapTemplate ? `
                <button class="sidebar__footer-btn sidebar__footer-btn--primary" id="btn-storymap-view" style="background-color: var(--color-gray-900); background-image: none; color: white;">
                    <i class="fa-solid fa-book-open"></i>
                    <span>Hikâyeyi Önizle</span>
                </button>
                ` : ''}
                ${!viewMode ? `
                <button class="sidebar__footer-btn" id="btn-save">
                    <i class="fa-solid ${saveButtonIcon}"></i>
                    <span>${saveButtonText}</span>
                </button>
                <button class="sidebar__footer-btn sidebar__footer-btn--secondary" id="btn-import-data-sidebar">
                    <i class="fa-solid fa-file-import"></i>
                    <span>Veri Yükle</span>
                </button>
                <button class="sidebar__footer-btn sidebar__footer-btn--secondary" id="btn-export">
                    <i class="fa-solid fa-download"></i>
                    <span>Dışa Aktar</span>
                </button>
                ` : ''}
            </div>
        </div>
        <!-- Toggle Button - Sidebar dışında -->
        <button class="sidebar__toggle" id="sidebar-toggle" aria-label="Sidebar'ı aç/kapat">
            <i class="fa-solid ${isOpen ? 'fa-chevron-left' : 'fa-chevron-right'}"></i>
        </button>
    `;
}
