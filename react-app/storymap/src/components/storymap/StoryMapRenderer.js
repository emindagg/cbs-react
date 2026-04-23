/**
 * STORYMAP RENDERER
 * Renders scroll-based story map layout
 */

import { apiService } from '../../services/apiService.js';

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
            const resolvedUrl = apiService.getMediaUrl(item.url);
            if (item.type === 'image') {
                return `
                    <div class="storymap-section__media">
                        <img src="${resolvedUrl}"
                             alt="${item.caption || ''}"
                             class="storymap-section__image">
                        ${item.caption ? `<p class="storymap-section__caption">${item.caption}</p>` : ''}
                    </div>
                `;
            }
            return '';
        }).join('');
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
