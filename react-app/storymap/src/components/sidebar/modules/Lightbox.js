/**
 * Lightbox - Büyük resim modal modülü
 */

import { apiService } from '../../../services/apiService.js';

export class Lightbox {
    constructor(sidebarComponent) {
        this.sidebar = sidebarComponent;
        this.images = [];
        this.currentIndex = 0;
        this.keyHandler = null;
    }

    /**
     * Lightbox'ı açar
     * @param {Array} images - Resim dizisi
     * @param {number} startIndex - Başlangıç indeksi
     */
    open(images, startIndex = 0) {
        if (!images || images.length === 0) return;
        
        this.images = images;
        this.currentIndex = startIndex;
        
        const currentImage = images[this.currentIndex];
        const rawUrl = currentImage?.url || currentImage;
        const imageUrl = apiService.getMediaUrl(rawUrl);
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
                    <img src="${imageUrl}" alt="Büyük Görüntü" class="image-lightbox__image">
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
     * Resimler arasında gezinme
     * @param {number} direction - Yön (-1 veya 1)
     */
    navigate(direction) {
        if (this.images.length === 0) return;
        
        this.currentIndex += direction;
        if (this.currentIndex < 0) this.currentIndex = this.images.length - 1;
        if (this.currentIndex >= this.images.length) this.currentIndex = 0;
        
        const currentImage = this.images[this.currentIndex];
        const rawUrl = currentImage?.url || currentImage;
        const imageUrl = apiService.getMediaUrl(rawUrl);
        
        const lightboxImage = document.querySelector('.image-lightbox__image');
        const lightboxCounter = document.querySelector('.image-lightbox__counter');
        
        if (lightboxImage) lightboxImage.src = imageUrl;
        if (lightboxCounter) lightboxCounter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        
        // Detail panel varsa onun resmini de güncelle
        if (this.sidebar.detailPanel && this.sidebar.detailPanel.isOpen) {
            this.sidebar.detailPanel.currentImageIndex = this.currentIndex;
            this.sidebar.detailPanel.updateImage();
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
