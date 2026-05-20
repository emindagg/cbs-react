/**
 * Lightbox - Büyük medya modal modülü
 */

import { apiService } from '../../../services/apiService.js';
import { getMediaRawUrl, isVideoMedia, isEmbedVideo, getEmbedVideoUrl } from '../../../utils/mediaType.js';

export class Lightbox {
    constructor(sidebarComponent) {
        this.sidebar = sidebarComponent;
        this.images = [];
        this.currentIndex = 0;
        this.keyHandler = null;
    }

    /**
     * Lightbox'ı açar
     * @param {Array} images - Medya dizisi
     * @param {number} startIndex - Başlangıç indeksi
     */
    open(images, startIndex = 0) {
        if (!images || images.length === 0) return;
        
        this.images = images;
        this.currentIndex = startIndex;
        
        const hasMultipleImages = images.length > 1;
        
        // Mevcut lightbox varsa kaldır
        const existingLightbox = document.querySelector('.image-lightbox');
        if (existingLightbox) existingLightbox.remove();
        
        const lightboxHTML = `
            <div class="image-lightbox" id="image-lightbox">
                <div class="image-lightbox__overlay"></div>
                <div class="image-lightbox__container">
                    <button class="image-lightbox__close" id="lightbox-close">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    ${hasMultipleImages ? `
                        <button class="image-lightbox__nav image-lightbox__nav--prev" id="lightbox-prev">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                    ` : ''}
                    <div class="image-lightbox__media" id="lightbox-media">
                        ${this.renderMedia(this.images[this.currentIndex])}
                    </div>
                    ${hasMultipleImages ? `
                        <button class="image-lightbox__nav image-lightbox__nav--next" id="lightbox-next">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                        <div class="image-lightbox__counter">${this.currentIndex + 1} / ${images.length}</div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        
        this.setupListeners();
        
        // Animasyon için
        setTimeout(() => {
            const lightbox = document.getElementById('image-lightbox');
            if (lightbox) lightbox.classList.add('image-lightbox--open');
            this.bindMediaFallback();
        }, 10);
    }

    /**
     * Lightbox'ı kapatır
     */
    close() {
        const lightbox = document.getElementById('image-lightbox');
        if (!lightbox) return;
        
        lightbox.classList.add('image-lightbox--closing');
        setTimeout(() => lightbox.remove(), 200);
        
        // Klavye handler'ını kaldır
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
    }

    /**
     * Medyalar arasında gezinme
     * @param {number} direction - Yön (-1 veya 1)
     */
    navigate(direction) {
        if (this.images.length === 0) return;
        
        this.currentIndex += direction;
        if (this.currentIndex < 0) this.currentIndex = this.images.length - 1;
        if (this.currentIndex >= this.images.length) this.currentIndex = 0;
        
        const lightboxMedia = document.querySelector('#lightbox-media');
        const lightboxCounter = document.querySelector('.image-lightbox__counter');
        
        if (lightboxMedia) lightboxMedia.innerHTML = this.renderMedia(this.images[this.currentIndex]);
        if (lightboxCounter) lightboxCounter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        this.bindMediaFallback();
        
        // Detail panel varsa onun medyasını da güncelle
        if (this.sidebar.detailPanel && this.sidebar.detailPanel.isOpen) {
            this.sidebar.detailPanel.currentImageIndex = this.currentIndex;
            this.sidebar.detailPanel.updateImage();
        }
    }

    /**
     * Medya öğesini modal içinde render eder
     * @param {Object|string} mediaItem
     * @returns {string}
     */
    renderMedia(mediaItem) {
        const rawUrl = getMediaRawUrl(mediaItem);
        const mediaUrl = apiService.getMediaUrl(rawUrl);
        const isVideo = isVideoMedia(mediaItem);
        const isEmbed = isEmbedVideo(mediaItem);
        const caption = mediaItem?.caption || '';

        if (isEmbed) {
            const embedUrl = getEmbedVideoUrl(mediaItem);
            return `
                <iframe src="${embedUrl}"
                        class="image-lightbox__video"
                        style="border: 0; width: 100%; aspect-ratio: 16/9; max-height: 80vh;"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerpolicy="strict-origin-when-cross-origin"
                        allowfullscreen></iframe>
                ${caption ? `<div class="image-lightbox__caption">${caption}</div>` : ''}
            `;
        }

        if (isVideo) {
            return `
                <video src="${mediaUrl}"
                       class="image-lightbox__video"
                       controls
                       playsinline
                       preload="metadata"
                       controlsList="nodownload"></video>
                ${caption ? `<div class="image-lightbox__caption">${caption}</div>` : ''}
            `;
        }

        return `
            <img src="${mediaUrl}"
                 alt="${caption || 'Büyük Görüntü'}"
                 class="image-lightbox__image"
                 data-video-fallback="true">
            ${caption ? `<div class="image-lightbox__caption">${caption}</div>` : ''}
        `;
    }

    /**
     * Tipi eksik gelen video dosyaları önce img olarak denenirse kırık görsel oluşur.
     * Img yüklenemezse aynı kaynağı video olarak yeniden render eder.
     */
    bindMediaFallback() {
        const image = document.querySelector('.image-lightbox__image[data-video-fallback="true"]');
        if (!image) return;

        const fallbackToVideo = () => {
            const currentItem = this.images[this.currentIndex];
            if (currentItem && typeof currentItem === 'object') {
                currentItem.type = 'video';
            }

            const lightboxMedia = document.querySelector('#lightbox-media');
            if (!lightboxMedia) return;

            lightboxMedia.innerHTML = this.renderMedia({
                ...(typeof currentItem === 'object' ? currentItem : {}),
                url: getMediaRawUrl(currentItem),
                type: 'video'
            });
        };

        image.addEventListener('error', fallbackToVideo, { once: true });

        if (image.complete && image.naturalWidth === 0) {
            fallbackToVideo();
        }
    }

    /**
     * Event listener'ları kurar
     */
    setupListeners() {
        const lightbox = document.getElementById('image-lightbox');
        const overlay = lightbox.querySelector('.image-lightbox__overlay');
        const closeBtn = document.getElementById('lightbox-close');
        const prevBtn = document.getElementById('lightbox-prev');
        const nextBtn = document.getElementById('lightbox-next');
        
        const closeLightbox = () => this.close();
        
        overlay.addEventListener('click', closeLightbox);
        closeBtn.addEventListener('click', closeLightbox);
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigate(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigate(1));
        
        // Klavye desteği
        const hasMultipleImages = this.images.length > 1;
        this.keyHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            } else if (e.key === 'ArrowLeft' && hasMultipleImages) {
                this.navigate(-1);
            } else if (e.key === 'ArrowRight' && hasMultipleImages) {
                this.navigate(1);
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }
}
