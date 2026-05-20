/**
 * STORYMAP RENDERER
 * Renders scroll-based story map layout
 */

import { apiService } from '../../services/apiService.js';
import { getMediaRawUrl, isVideoMedia, isEmbedVideo, getEmbedVideoUrl, isEmbedContent } from '../../utils/mediaType.js';

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export class StoryMapRenderer {
    constructor(containerId, data) {
        this.container = document.getElementById(containerId);
        this.data = data;
    }

    /**
     * Render the complete StoryMap layout
     */
    render() {
        if (!this.container) {
            console.error('StoryMap container not found');
            return;
        }

        const hasMultipleSteps = this.data.steps && this.data.steps.length > 1;

        const html = `
            <div class="storymap-container">
                <!-- Full Screen Map (Background) -->
                <div class="storymap-map" id="storymap-map-view"></div>

                <!-- Playback Controls (Outside Header) -->
                ${hasMultipleSteps ? this.renderPlaybackControls() : ''}

                <!-- Floating Content Panel -->
                <div class="storymap-content">
                    ${this.renderHeader()}
                    ${this.renderSections()}
                    ${this.renderFooter()}
                </div>

                <!-- Logo Watermark -->
                <div class="storymap-logo-watermark">
                    <img src="storymap-alt_logo.svg" alt="CBS Logo" />
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    /**
     * Render the header section
     */
    renderHeader() {
        const showExitBtn = !this.data.viewMode;

        return `
            <div class="storymap-header">
                ${showExitBtn ? `
                <button class="storymap-exit-btn" id="storymap-exit-btn" title="Hikâye modundan çık">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                ` : ''}

                <h1 class="storymap-header__title">${this.data.title || 'Hikâye Haritası'}</h1>
                ${this.data.subtitle ? `<p class="storymap-header__subtitle">${this.data.subtitle}</p>` : ''}
                ${this.data.description ? `<p class="storymap-header__description">${this.data.description}</p>` : ''}
                <div class="storymap-header__scroll-hint">
                    <i class="fa fa-chevron-down"></i>
                </div>
            </div>
        `;
    }

    /**
     * Render playback controls
     */
    renderPlaybackControls() {
        return `
            <div class="storymap-playback">
                <button class="storymap-playback__btn" id="storymap-playback-toggle" data-playing="false" title="Otomatik Oynat">
                    <i class="fa-solid fa-play"></i>
                </button>
                <div class="storymap-playback__speeds">
                    <div class="storymap-playback__speeds-label">
                        <i class="fa-solid fa-gauge"></i>
                        <span>Hız</span>
                    </div>
                    <div class="storymap-playback__speeds-buttons">
                        <button class="storymap-playback__speed-btn" data-speed="0.5">0.5x</button>
                        <button class="storymap-playback__speed-btn storymap-playback__speed-btn--active" data-speed="1">1x</button>
                        <button class="storymap-playback__speed-btn" data-speed="1.5">1.5x</button>
                        <button class="storymap-playback__speed-btn" data-speed="2">2x</button>
                        <button class="storymap-playback__speed-btn" data-speed="3">3x</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render all story sections
     */
    renderSections() {
        if (!this.data.steps || this.data.steps.length === 0) {
            return '<div class="storymap-section"><p>Henüz hikâye eklenmedi.</p></div>';
        }

        return this.data.steps.map(step => this.renderSection(step)).join('');
    }

    /**
     * Render a single story section
     */
    renderSection(step) {
        const sceneId = `scene-${step.id}`;

        return `
            <section class="storymap-section" data-scene="${sceneId}">
                <div class="storymap-section__header">
                    <h2 class="storymap-section__title">${step.title || 'Başlık yok'}</h2>
                    ${step.subtitle ? `<p class="storymap-section__subtitle">${step.subtitle}</p>` : ''}
                </div>

                ${this.renderMedia(step.media)}

                ${this.renderEmbeds(step.embeds)}

                ${step.content ? `<div class="storymap-section__content">${step.content}</div>` : ''}

                ${this.renderFacts(step.facts)}

                ${this.renderTags(step.tags)}
            </section>
        `;
    }

    /**
     * Render media (images/videos)
     */
    renderMedia(media) {
        if (!media || media.length === 0) {
            return '';
        }

        return media.map(item => {
            const resolvedUrl = apiService.getMediaUrl(getMediaRawUrl(item));
            const isVideo = isVideoMedia(item);
            const isEmbed = isEmbedVideo(item);

            if (isEmbed) {
                const embedUrl = getEmbedVideoUrl(item);
                return `
                    <div class="storymap-section__media">
                        <iframe src="${embedUrl}"
                                class="storymap-section__video"
                                style="border: 0; width: 100%; aspect-ratio: 16/9;"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerpolicy="strict-origin-when-cross-origin"
                                allowfullscreen></iframe>
                        ${item.caption ? `<p class="storymap-section__caption">${item.caption}</p>` : ''}
                    </div>
                `;
            }

            if (!isVideo) {
                return `
                    <div class="storymap-section__media">
                        <img src="${resolvedUrl}"
                             alt="${item.caption || ''}"
                             class="storymap-section__image">
                        ${item.caption ? `<p class="storymap-section__caption">${item.caption}</p>` : ''}
                    </div>
                `;
            }

            return `
                <div class="storymap-section__media">
                    <video src="${resolvedUrl}"
                           class="storymap-section__video"
                           controls
                           playsinline
                           preload="metadata"></video>
                    ${item.caption ? `<p class="storymap-section__caption">${item.caption}</p>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Render embed blocks
     */
    renderEmbeds(embeds) {
        if (!embeds || embeds.length === 0) {
            return '';
        }

        return embeds
            .filter(item => isEmbedContent(item))
            .map((item, index) => {
                const embedUrl = getEmbedVideoUrl(item);
                const title = item.title || item.name || `Yerleştirme ${index + 1}`;

                return `
                    <div class="storymap-section__media storymap-section__embed">
                        <div class="storymap-section__embed-header" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px;">
                            <h3 style="margin: 0; font-size: 16px;">${escapeHtml(title)}</h3>
                            <a href="${escapeHtml(embedUrl)}"
                               target="_blank"
                               rel="noopener noreferrer"
                               title="Yeni sekmede aç"
                               aria-label="Yeni sekmede aç"
                               style="width: 30px; height: 30px; color: #1f4f46; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; font-size: 17px;">
                                <i class="fa-solid fa-up-right-from-square" aria-hidden="true"></i>
                            </a>
                        </div>
                        <iframe src="${escapeHtml(embedUrl)}"
                                class="storymap-section__video"
                                style="border: 0; width: 100%; aspect-ratio: 16/9;"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerpolicy="strict-origin-when-cross-origin"
                                allowfullscreen></iframe>
                        ${item.caption ? `<p class="storymap-section__caption">${escapeHtml(item.caption)}</p>` : ''}
                    </div>
                `;
            })
            .join('');
    }

    /**
     * Render facts panel
     */
    renderFacts(facts) {
        if (!facts || facts.length === 0) {
            return '';
        }

        const factsHtml = facts.map(fact => `
            <div class="storymap-fact">
                <div class="storymap-fact__label">${fact.label}</div>
                <div class="storymap-fact__value">${fact.value}</div>
            </div>
        `).join('');

        return `
            <div class="storymap-section__facts">
                ${factsHtml}
            </div>
        `;
    }

    /**
     * Render tags
     */
    renderTags(tags) {
        if (!tags || tags.length === 0) {
            return '';
        }

        const tagsHtml = tags.map(tag => `
            <span class="storymap-tag">${tag}</span>
        `).join('');

        return `
            <div class="storymap-section__tags">
                ${tagsHtml}
            </div>
        `;
    }

    /**
     * Render footer section
     */
    renderFooter() {
        return `
            <div class="storymap-footer">
                <h3 class="storymap-footer__title">Hikâye Sonu</h3>
            </div>
        `;
    }

    /**
     * Clear the container
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}
