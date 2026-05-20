/**
 * DetailPanel - Sağ tarafta açılan detay paneli modülü
 */

import { apiService } from '../../../services/apiService.js';
import { getMediaRawUrl, isVideoMedia, isEmbedVideo, getEmbedVideoUrl } from '../../../utils/mediaType.js';

export class DetailPanel {
    constructor(sidebarComponent) {
        this.sidebar = sidebarComponent;
        this.isOpen = false;
        this.point = null;
        this.pointIndex = 0;
        this.currentImageIndex = 0;
    }

    /**
     * Detay panelini açar
     * @param {number} pointIndex - Nokta indeksi
     */
    open(pointIndex) {
        const points = this.sidebar.points;
        if (pointIndex < 0 || pointIndex >= points.length) return;
        
        this.isOpen = true;
        this.pointIndex = pointIndex;
        this.point = points[pointIndex];
        this.currentImageIndex = 0;
        
        // Konuma odaklan
        if (this.sidebar.onPointFocus && this.point) {
            this.sidebar.onPointFocus(this.point);
        }
        
        this.render();
    }

    /**
     * Detay panelini kapatır
     */
    close() {
        this.isOpen = false;
        this.point = null;
        
        const detailPanel = document.querySelector('.detail-panel');
        if (detailPanel) {
            detailPanel.classList.remove('detail-panel--open');
            setTimeout(() => {
                detailPanel.remove();
            }, 300);
        }
    }

    /**
     * Panelde ileri/geri gezinme
     * @param {number} direction - Yön (-1 veya 1)
     */
    navigate(direction) {
        const points = this.sidebar.points;
        const newIndex = this.pointIndex + direction;
        
        if (newIndex >= 0 && newIndex < points.length) {
            this.pointIndex = newIndex;
            this.point = points[newIndex];
            this.currentImageIndex = 0;
            
            if (this.sidebar.onPointFocus && this.point) {
                this.sidebar.onPointFocus(this.point);
            }

            // Timeline şablonunda: Detail panelden ileri/geri yapılınca
            // TimelineJS içindeki slayt da senkron olarak değişsin.
            // ModalComponent, timeline kullanırken sidebar.onTimelineDetailNavigate
            // callback'ini atayacak.
            if (typeof this.sidebar.onTimelineDetailNavigate === 'function') {
                try {
                    this.sidebar.onTimelineDetailNavigate(this.pointIndex, this.point);
                } catch (e) {
                    console.error('[DetailPanel] onTimelineDetailNavigate error:', e);
                }
            }
            
            this.render();
        }
    }

    /**
     * Medyalar arasında gezinme
     * @param {number} direction - Yön (-1 veya 1)
     */
    navigateImage(direction) {
        const images = this.point?.media || [];
        if (images.length === 0) return;
        
        this.currentImageIndex += direction;
        if (this.currentImageIndex < 0) this.currentImageIndex = images.length - 1;
        if (this.currentImageIndex >= images.length) this.currentImageIndex = 0;
        
        this.updateImage();
    }

    /**
     * Panel medyasını günceller
     */
    updateImage() {
        const images = this.point?.media || [];
        if (images.length === 0) return;
        
        const mediaEl = document.querySelector('#detail-media');
        const counterEl = document.querySelector('.detail-panel__image-counter');
        
        if (mediaEl && images[this.currentImageIndex]) {
            mediaEl.innerHTML = this.renderDetailMedia(images[this.currentImageIndex], this.point);
        }
        if (counterEl) {
            counterEl.textContent = `${this.currentImageIndex + 1} / ${images.length}`;
        }
    }

    /**
     * Panel içindeki medya önizlemesini oluşturur
     * @param {Object|string} mediaItem
     * @param {Object} point
     * @returns {string}
     */
    renderDetailMedia(mediaItem, point) {
        const rawUrl = getMediaRawUrl(mediaItem);
        const mediaUrl = apiService.getMediaUrl(rawUrl);
        const isVideo = isVideoMedia(mediaItem);
        const isEmbed = isEmbedVideo(mediaItem);
        const title = point?.title || 'Medya';

        if (isEmbed) {
            const embedUrl = getEmbedVideoUrl(mediaItem);
            return `
                <iframe src="${embedUrl}"
                        class="detail-panel__media-video"
                        style="border: 0; width: 100%; aspect-ratio: 16/9;"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerpolicy="strict-origin-when-cross-origin"
                        allowfullscreen></iframe>
            `;
        }

        if (isVideo) {
            return `
                <video src="${mediaUrl}"
                       class="detail-panel__media-video"
                       controls
                       preload="metadata"
                       playsinline
                       controlsList="nodownload"></video>
                <button class="detail-panel__media-open" type="button" title="Büyük görüntüle">
                    <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                </button>
            `;
        }

        return `<img src="${mediaUrl}" alt="${title}" class="detail-panel__media-image">`;
    }

    /**
     * Paneli render eder
     */
    render() {
        const point = this.point;
        if (!point) return;

        const images = point.media || [];
        const hasMultipleImages = images.length > 1;
        const currentIndex = this.pointIndex;
        const totalPoints = this.sidebar.points.length;
        const isRouteTemplate = this.sidebar?.data?.templateName === 'Rota Bazlı';
        const viewMode = this.sidebar?.viewMode || false;

        // Mevcut paneli kaldır
        const existingPanel = document.querySelector('.detail-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panelHTML = `
            <div class="detail-panel">
                <!-- Üst Navigasyon -->
                <div class="detail-panel__nav">
                    <div class="detail-panel__nav-top">
                        <button class="detail-panel__nav-btn" id="detail-prev" ${currentIndex === 0 ? 'disabled' : ''}>
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <span class="detail-panel__nav-counter">${currentIndex + 1} / ${totalPoints}</span>
                        <button class="detail-panel__nav-btn" id="detail-next" ${currentIndex === totalPoints - 1 ? 'disabled' : ''}>
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                        <button class="detail-panel__close" id="detail-close">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    ${isRouteTemplate && (point.timestamp || point.duration) ? `
                        <div class="detail-panel__nav-meta">
                            ${point.timestamp ? `
                                <div class="detail-panel__nav-meta-item">
                                    <i class="fa-solid fa-clock"></i>
                                    <span>${point.timestamp}</span>
                                </div>
                            ` : ''}
                            ${point.duration ? `
                                <div class="detail-panel__nav-meta-item">
                                    <i class="fa-solid fa-hourglass-half"></i>
                                    <span>${point.duration}</span>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                <!-- Başlık -->
                <div class="detail-panel__header">
                    <h3 class="detail-panel__title">${point.title || `Öge ${currentIndex + 1}`}</h3>
                </div>

                <!-- Medya Galerisi -->
                ${images.length > 0 ? `
                    <div class="detail-panel__image">
                        ${hasMultipleImages ? `
                            <button class="detail-panel__image-nav detail-panel__image-nav--prev" id="image-prev">
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                        ` : ''}
                        <div class="detail-panel__media" id="detail-media" style="cursor: pointer;">
                            ${this.renderDetailMedia(images[0], point)}
                        </div>
                        ${hasMultipleImages ? `
                            <button class="detail-panel__image-nav detail-panel__image-nav--next" id="image-next">
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                            <div class="detail-panel__image-counter">${this.currentImageIndex + 1} / ${images.length}</div>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- Açıklama -->
                <div class="detail-panel__content">
                    ${point.description ? `
                        <p class="detail-panel__description">${point.description}</p>
                    ` : '<p class="detail-panel__description detail-panel__description--empty">Açıklama eklenmemiş</p>'}
                    
                    <!-- Koordinat Bilgisi -->
                    ${point.coords ? `
                        <div class="detail-panel__info">
                            <div class="detail-panel__info-item">
                                <i class="fa-solid fa-location-dot"></i>
                                <span>${Array.isArray(point.coords[0]) 
                                    ? `${point.coords.length} nokta` 
                                    : `${point.coords[1]?.toFixed(5)}, ${point.coords[0]?.toFixed(5)}`}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Alt Butonlar -->
                ${!viewMode ? `
                <div class="detail-panel__actions">
                    <button class="detail-panel__action-btn" id="detail-edit">
                        <i class="fa-solid fa-pencil"></i>
                        <span>Düzenle</span>
                    </button>
                    <button class="detail-panel__action-btn detail-panel__action-btn--danger" id="detail-delete">
                        <i class="fa-solid fa-trash"></i>
                        <span>Sil</span>
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', panelHTML);
        
        setTimeout(() => {
            const panel = document.querySelector('.detail-panel');
            if (panel) panel.classList.add('detail-panel--open');
        }, 10);
        
        this.setupListeners();
    }

    /**
     * Event listener'ları kurar
     */
    setupListeners() {
        const panel = document.querySelector('.detail-panel');
        const navBar = document.querySelector('.detail-panel__nav');
        
        // Kapatma butonu
        const closeBtn = document.getElementById('detail-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Nokta navigasyonu
        const prevBtn = document.getElementById('detail-prev');
        const nextBtn = document.getElementById('detail-next');
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigate(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigate(1));
        
        // Sürükleme özelliği
        if (navBar && panel) {
            this.setupDragging(navBar, panel);
        }
        
        // Resim navigasyonu
        const imagePrevBtn = document.getElementById('image-prev');
        const imageNextBtn = document.getElementById('image-next');
        if (imagePrevBtn) imagePrevBtn.addEventListener('click', () => this.navigateImage(-1));
        if (imageNextBtn) imageNextBtn.addEventListener('click', () => this.navigateImage(1));
        
        // Medyaya tıklayınca lightbox aç. Video kontrolleri modalı tetiklemez.
        const detailMedia = document.getElementById('detail-media');
        if (detailMedia) {
            detailMedia.addEventListener('click', (event) => {
                if (event.target.closest('video, iframe')) return;

                if (this.sidebar.lightbox) {
                    this.sidebar.lightbox.open(this.point?.media || [], this.currentImageIndex);
                }
            });
        }
        
        // Düzenle butonu
        const editBtn = document.getElementById('detail-edit');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                const pointId = this.point?.id;
                if (!pointId) return;

                const isMobile = window.matchMedia('(max-width: 768px)').matches;
                if (isMobile) {
                    this.close();
                    setTimeout(() => {
                        this.sidebar.showPointDetail(pointId);
                    }, 320);
                    return;
                }

                this.sidebar.showPointDetail(pointId);
            });
        }
        
        // Sil butonu
        const deleteBtn = document.getElementById('detail-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDelete());
        }
    }

    /**
     * Sürükleme işlevselliğini kurar
     */
    setupDragging(navBar, panel) {
        let isDragging = false;
        let startX, startY;
        let panelX = 0;
        let panelY = 0;
        
        navBar.style.cursor = 'grab';
        
        const onMouseDown = (e) => {
            if (e.target.closest('button')) return;
            
            isDragging = true;
            navBar.style.cursor = 'grabbing';
            
            const rect = panel.getBoundingClientRect();
            panelX = rect.left;
            panelY = rect.top;
            startX = e.clientX - panelX;
            startY = e.clientY - panelY;
            
            panel.style.right = 'auto';
            panel.style.left = panelX + 'px';
            panel.style.top = panelY + 'px';
            panel.style.transition = 'none';
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            panelX = e.clientX - startX;
            panelY = e.clientY - startY;
            
            const maxX = window.innerWidth - panel.offsetWidth;
            const maxY = window.innerHeight - panel.offsetHeight;
            
            panelX = Math.max(0, Math.min(panelX, maxX));
            panelY = Math.max(56, Math.min(panelY, maxY));
            
            panel.style.left = panelX + 'px';
            panel.style.top = panelY + 'px';
        };
        
        const onMouseUp = () => {
            isDragging = false;
            navBar.style.cursor = 'grab';
            panel.style.transition = '';
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        navBar.addEventListener('mousedown', onMouseDown);
        
        // Touch desteği
        navBar.addEventListener('touchstart', (e) => {
            if (e.target.closest('button')) return;
            
            const touch = e.touches[0];
            isDragging = true;
            
            const rect = panel.getBoundingClientRect();
            panelX = rect.left;
            panelY = rect.top;
            startX = touch.clientX - panelX;
            startY = touch.clientY - panelY;
            
            panel.style.right = 'auto';
            panel.style.left = panelX + 'px';
            panel.style.top = panelY + 'px';
            panel.style.transition = 'none';
        });
        
        navBar.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const touch = e.touches[0];
            panelX = touch.clientX - startX;
            panelY = touch.clientY - startY;
            
            const maxX = window.innerWidth - panel.offsetWidth;
            const maxY = window.innerHeight - panel.offsetHeight;
            
            panelX = Math.max(0, Math.min(panelX, maxX));
            panelY = Math.max(56, Math.min(panelY, maxY));
            
            panel.style.left = panelX + 'px';
            panel.style.top = panelY + 'px';
        });
        
        navBar.addEventListener('touchend', () => {
            isDragging = false;
            panel.style.transition = '';
        });
    }

    /**
     * Silme işlemini yönetir
     */
    async handleDelete() {
        if (!confirm('Bu noktayı silmek istediğinize emin misiniz?')) return;

        const point = this.point;

        // Undo için kaydet
        if (this.sidebar.onActionAdd && point) {
            this.sidebar.onActionAdd({
                type: 'delete_point',
                data: { ...point }
            });
        }

        // Marker'ı kaldır
        if (point && point.marker) {
            point.marker.remove();
        }

        // Haritadan çizimi kaldır (line, polygon, circle, text vb.)
        if (point && point.mapLayerId && this.sidebar.onDrawingDelete) {
            this.sidebar.onDrawingDelete(point.mapLayerId);
        }

        this.close();
        this.sidebar.removePoint(point.id);

        // Rota template'inde rota çizgisini güncelle
        const isRouteTemplate = this.sidebar.data.templateName === 'Rota Bazlı';

        if (isRouteTemplate) {
            // Kalan rota noktalarını say (çizim öğeleri hariç)
            const routePoints = this.sidebar.points.filter(p => !p.isDrawing);

            console.log('[DetailPanel] After delete, remaining route points:', routePoints.length);

            // Önce mevcut route'u tamamen temizle
            if (this.sidebar.onClearRoute) {
                console.log('[DetailPanel] Calling onClearRoute');
                this.sidebar.onClearRoute();
            } else {
                console.warn('[DetailPanel] onClearRoute callback not found');
            }

            // Sonra eğer 2+ nokta varsa yeniden çiz
            if (routePoints.length >= 2 && this.sidebar.onConnectAllPoints) {
                console.log('[DetailPanel] Reconnecting route with', routePoints.length, 'points');
                await this.sidebar.onConnectAllPoints();
            } else {
                console.log('[DetailPanel] Not enough points to draw route (<2)');
            }

            // Kalan noktaların numaralarını yeniden düzenle (1'den başla)
            this.sidebar.points.forEach((p, index) => {
                if (!p.isDrawing) {
                    const newNumber = index + 1;
                    p.number = newNumber;

                    // Marker'daki numarayı güncelle
                    if (p.marker && p.marker.getElement()) {
                        const markerEl = p.marker.getElement();
                        const numberSpan = markerEl.querySelector('.marker-number');
                        if (numberSpan) {
                            numberSpan.textContent = newNumber;
                        }
                    }
                }
            });
        }
    }
}
