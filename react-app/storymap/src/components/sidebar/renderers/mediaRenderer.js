/**
 * Medya öğeleri renderer
 */

import { apiService } from '../../../services/apiService.js';
import {
    getMediaRawUrl,
    isVideoMedia,
    isEmbedVideo,
    getYouTubeId,
    getEmbedSourceUrl
} from '../../../utils/mediaType.js';

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Medya öğelerini render eder
 * @param {Array} media - Medya öğeleri dizisi
 * @returns {string} HTML string
 */
export function renderMediaItems(media) {
    if (!media || media.length === 0) return '';
    
    return media.map((item, index) => {
        const resolvedUrl = apiService.getMediaUrl(getMediaRawUrl(item));
        const isVideo = isVideoMedia(item);
        const isEmbed = isEmbedVideo(item);
        const youtubeId = isEmbed ? getYouTubeId(getMediaRawUrl(item)) : null;

        let previewHtml = '';
        if (youtubeId) {
            previewHtml = `
                <img src="https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg" class="sidebar__media-preview" alt="">
                <div class="sidebar__media-type">YouTube</div>
                <div class="sidebar__media-play"><i class="fa-solid fa-play"></i></div>
            `;
        } else if (isEmbed) {
            previewHtml = `
                <div class="sidebar__media-preview" style="display: flex; align-items: center; justify-content: center; background: #f3f4f6; color: #4b5563; height: 100%;">
                    <i class="fa-solid fa-video" style="font-size: 24px;"></i>
                </div>
                <div class="sidebar__media-type">Web Video</div>
                <div class="sidebar__media-play"><i class="fa-solid fa-play"></i></div>
            `;
        } else if (isVideo) {
            previewHtml = `
                <video src="${resolvedUrl}" class="sidebar__media-preview" preload="metadata" playsinline></video>
                <div class="sidebar__media-type">Video</div>
                <div class="sidebar__media-play"><i class="fa-solid fa-play"></i></div>
            `;
        } else {
            previewHtml = `<img src="${resolvedUrl}" class="sidebar__media-preview" alt="">`;
        }

        return `
        <div class="sidebar__media-item" data-media-index="${index}">
            <div class="sidebar__media-preview-container" data-media-preview="${index}">
                ${previewHtml}
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
                   placeholder="Açıklama ekle..."
                   value="${item.caption || ''}">
        </div>
    `;
    }).join('');
}

/**
 * Yerleştirme bloklarını render eder.
 * @param {Array} embeds - Yerleştirme blokları dizisi
 * @param {Object} options
 * @returns {string} HTML string
 */
export function renderEmbedItems(embeds, options = {}) {
    const canEdit = options.canEdit === true;

    if (!embeds || embeds.length === 0) {
        return '';
    }

    return embeds.map((item, index) => {
        const title = item.title || item.name || `Yerleştir ${index + 1}`;
        const url = getEmbedSourceUrl(item);

        return `
            <div class="sidebar__embed-item" data-embed-index="${index}">
                <div class="sidebar__embed-preview">
                    <div class="sidebar__embed-icon">
                        <i class="fa-solid fa-code"></i>
                    </div>
                    <div class="sidebar__embed-meta">
                        <div class="sidebar__embed-name">${escapeHtml(title)}</div>
                        <div class="sidebar__embed-url-preview">${escapeHtml(url)}</div>
                    </div>
                    ${canEdit ? `
                    <button type="button" class="sidebar__embed-remove" data-embed-index="${index}" title="Yerleştirmeyi sil">
                        <i class="fa-solid fa-times"></i>
                    </button>
                    ` : ''}
                </div>
                ${canEdit ? `
                <input type="text"
                       class="sidebar__embed-title-input"
                       data-embed-index="${index}"
                       placeholder="Yerleştirme başlığı"
                       value="${escapeHtml(title)}">
                <input type="text"
                       class="sidebar__embed-url"
                       data-embed-index="${index}"
                       placeholder="Yerleştirme bağlantısı"
                       value="${escapeHtml(url)}">
                ` : ''}
            </div>
        `;
    }).join('');
}
