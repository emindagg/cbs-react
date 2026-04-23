/**
 * Medya öğeleri renderer
 */

import { apiService } from '../../../services/apiService.js';

/**
 * Medya öğelerini render eder
 * @param {Array} media - Medya öğeleri dizisi
 * @returns {string} HTML string
 */
export function renderMediaItems(media) {
    if (!media || media.length === 0) return '';
    
    return media.map((item, index) => {
        const resolvedUrl = apiService.getMediaUrl(item.url);
        return `
        <div class="sidebar__media-item" data-media-index="${index}">
            <div class="sidebar__media-preview-container">
                ${item.type === 'video' 
                    ? `<video src="${resolvedUrl}" class="sidebar__media-preview"></video>
                       <div class="sidebar__media-play"><i class="fa-solid fa-play"></i></div>`
                    : `<img src="${resolvedUrl}" class="sidebar__media-preview" alt="">`
                }
                <button class="sidebar__media-remove" data-media-index="${index}">
                    <i class="fa-solid fa-times"></i>
                </button>
                <button class="sidebar__media-edit-caption" data-media-index="${index}" title="Açıklama düzenle">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </div>
            <input type="text" 
                   class="sidebar__media-caption" 
                   data-media-index="${index}"
                   placeholder="Görsel açıklaması..."
                   value="${item.caption || ''}">
        </div>
    `;
    }).join('');
}
