/**
 * Ayarlar görünümü renderer
 */

import { BASEMAPS } from '../constants/index.js';

/**
 * Ayarlar görünümü HTML'ini oluşturur
 * @param {Object} context - Sidebar context
 * @returns {string} HTML string
 */
export function renderSettingsView(context) {
    const { data, isOpen, mapSettings, basemaps = BASEMAPS, viewMode, hasSaved = false } = context;
    const selectedBasemap = basemaps.find(b => b.id === mapSettings.selectedBasemap) || basemaps[0];
    const inputDisabled = viewMode ? 'disabled' : '';

    // Save button text and icon based on hasSaved state
    const saveButtonText = hasSaved ? 'Güncelle' : 'Kaydet';
    const saveButtonIcon = hasSaved ? 'fa-sync-alt' : 'fa-save';
    
    return `
        <div class="sidebar ${isOpen ? '' : 'sidebar--closed'}">
            <!-- Header -->
            <div class="sidebar__header">
                <div class="sidebar__header-content">
                    <h2 class="sidebar__title">${data.title || 'Yeni Hikâye Haritam'}</h2>
                    <p class="sidebar__subtitle">${data.desc || 'Harita açıklaması'}</p>
                </div>
            </div>

            <!-- Tabs -->
            <div class="sidebar__tabs">
                <button class="sidebar__tab" data-tab="layers">
                    <i class="fa-solid fa-layer-group"></i>
                </button>
                <button class="sidebar__tab sidebar__tab--active" data-tab="settings">
                    <i class="fa-solid fa-cog"></i>
                </button>
            </div>

            <!-- Settings Content -->
            <div class="sidebar__content sidebar__content--settings">
                <!-- Altlık Harita Seç -->
                <div class="sidebar__settings-section" id="basemap-selector-section">
                    <label class="sidebar__settings-label">Altlık harita seç</label>
                    <div class="sidebar__basemap-selector">
                        <button class="sidebar__basemap-current" id="basemap-selector-btn" ${inputDisabled}>
                            <img src="${selectedBasemap.thumbnail}" alt="${selectedBasemap.name}" class="sidebar__basemap-thumb">
                            <span class="sidebar__basemap-name">${selectedBasemap.name}</span>
                        </button>
                        <div class="sidebar__basemap-dropdown" id="basemap-dropdown">
                            ${basemaps.map(basemap => `
                                <button class="sidebar__basemap-option ${basemap.id === mapSettings.selectedBasemap ? 'sidebar__basemap-option--active' : ''}" 
                                        data-basemap-id="${basemap.id}">
                                    <img src="${basemap.thumbnail}" alt="${basemap.name}" class="sidebar__basemap-thumb">
                                    <span>${basemap.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="sidebar__footer">
                ${!viewMode ? `
                <button class="sidebar__footer-btn" id="btn-save">
                    <i class="fa-solid ${saveButtonIcon}"></i>
                    <span>${saveButtonText}</span>
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
