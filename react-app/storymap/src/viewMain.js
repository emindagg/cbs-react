import { apiService } from './services/apiService.js';
import { storageManager } from './utils/storageManager.js';
import { StoryMapComponent } from './components/storymap/StoryMapComponent.js';
import { ModalComponent } from './components/ModalComponent.js';
import { templates } from './data/templates.js';

/**
 * ViewMain - Public key görüntüleme sayfası
 * view.html?code={publicKey} ile erişilir
 * Authentication gerektirmez
 */

class PublicViewer {
    constructor() {
        this.publicKey = null;
        this.storyData = null;
        this.modal = null;
        this.storyMapComponent = null;
        this.init();
    }

    async init() {
        // URL'den public key'i al
        const urlParams = new URLSearchParams(window.location.search);
        this.publicKey = urlParams.get('code');

        if (!this.publicKey) {
            this.showError('Geçersiz Bağlantı', 'Paylaşım kodu eksik veya hatalı. Lütfen size gönderilen bağlantıyı tekrar kontrol edin.');
            return;
        }

        try {
            // Backend'den story'yi çek
            await this.loadStorymap();
        } catch (error) {
            console.error('[PublicViewer] Error loading storymap:', error);
            this.handleLoadError(error);
        }
    }

    async loadStorymap() {
        try {
            // Backend API'den public key ile story'yi al
            const backendData = await apiService.getStorymapByPublicKey(this.publicKey);

            // Backend formatını internal formata çevir
            this.storyData = this.transformBackendData(backendData);

            // IndexedDB'ye cache'le (offline viewing için)
            await this.cacheToIndexedDB(this.storyData);

            // Story'yi render et
            this.renderStorymap();

        } catch (error) {
            // Backend başarısız olursa, IndexedDB cache'den dene
            console.warn('[PublicViewer] Backend failed, trying IndexedDB cache:', error);
            await this.loadFromCache();
        }
    }

    async loadFromCache() {
        try {
            // Cache'de public key ile saklanan veriyi ara
            const cachedStory = await storageManager.getCachedPublicStory(this.publicKey);

            if (cachedStory) {
                console.log('[PublicViewer] Loaded from cache:', cachedStory);
                this.storyData = cachedStory;
                this.renderStorymap();
            } else {
                throw new Error('Cache bulunamadı');
            }
        } catch (error) {
            this.showError(
                'Harita Bulunamadı',
                'Paylaşım kodu geçersiz veya harita artık paylaşılmıyor.'
            );
        }
    }

    transformBackendData(backendData) {
        // Backend response: { Id, Kullaniciid, Sablon, Baslik, Aciklama, Jsondata, Publickey, Isshared, Olusturmaturihi }
        // Internal format: { id, title, desc, templateName, mapData, steps, points }

        let jsonData = {};
        try {
            // Backend field'i hem büyük hem küçük harfle dene
            const jsondataField = backendData.Jsondata || backendData.jsondata;
            jsonData = JSON.parse(jsondataField);
        } catch (error) {
            console.error('[PublicViewer] Failed to parse Jsondata:', error);
            jsonData = { mapData: {}, steps: [], points: [] };
        }

        return {
            id: backendData.Id || backendData.id,
            title: backendData.Baslik || backendData.baslik,
            desc: backendData.Aciklama || backendData.aciklama,
            templateName: backendData.Sablon || backendData.sablon,
            mapData: jsonData.mapData || {},
            steps: jsonData.steps || [],
            points: jsonData.points || [],
            publicKey: backendData.Publickey || backendData.publickey,
            isShared: backendData.Isshared || backendData.isshared,
            createdAt: backendData.Olusturmaturihi || backendData.olusturmaturihi,
            source: 'backend'
        };
    }

    async cacheToIndexedDB(storyData) {
        try {
            // Public story'leri cache'lemek için storageManager'a method eklenecek
            await storageManager.cachePublicStory(this.publicKey, storyData);
        } catch (error) {
            console.warn('[PublicViewer] Failed to cache story:', error);
            // Cache başarısız olsa da devam et
        }
    }

    renderStorymap() {
        // Loading overlay'i gizle
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        // Template bilgisini belirle
        const templateKey = this.storyData.templateName || this.storyData.mapData?.template || 'point';
        const isStoryMap = templateKey === 'storymap' || templateKey === 'Storymap Bazlı';

        // StoryMap özel durumu
        if (isStoryMap) {
            this.loadStoryMapViewer();
        } else {
            this.loadNormalViewer();
        }
    }

    loadStoryMapViewer() {
        // StoryMap için özel viewer
        const appContainer = document.getElementById('app-container');
        appContainer.innerHTML = '<div id="storymap-container"></div>';

        const storymapContainer = document.getElementById('storymap-container');
        storymapContainer.style.display = 'block';

        // Points'i steps formatına çevir
        const steps = (this.storyData.points || []).map((point, index) => {
            // Coords formatını kontrol et, string ise parse etmeye çalış veya valid bir dizi olduğundan emin ol
            let validCoords = [35.0, 39.0]; // Default Türkiye
            if (point.coords) {
                if (Array.isArray(point.coords) && point.coords.length === 2) {
                    validCoords = point.coords.map(Number);
                } else if (typeof point.coords === 'string') {
                    try {
                        const parsed = JSON.parse(point.coords);
                        if (Array.isArray(parsed) && parsed.length === 2) {
                            validCoords = parsed.map(Number);
                        }
                    } catch (e) {
                        console.warn('[PublicViewer] Invalid coords format:', point.coords);
                    }
                } else if (point.coords.lng !== undefined && point.coords.lat !== undefined) {
                    validCoords = [Number(point.coords.lng), Number(point.coords.lat)];
                }
            }

            return {
                id: point.id || index + 1,
                title: point.title,
                subtitle: point.subtitle || '',
                content: point.description || '',
                coords: validCoords,
                zoom: Number.isFinite(Number(point.zoom)) ? Math.max(1, Math.min(18, Number(point.zoom))) : 12,
                media: point.media || [],
                facts: point.facts || [],
                tags: point.tags || [],
                isDrawing: point.isDrawing || false
            };
        });

        // StoryMapComponent başlat
        const template = templates['storymap'];
        this.storyMapComponent = new StoryMapComponent('storymap-container', {
            title: this.storyData.title,
            subtitle: this.storyData.desc,
            description: this.storyData.desc,
            steps: steps,
            drawings: this.extractDrawings(this.storyData.points || []),
            viewMode: true
        }, template);

        this.storyMapComponent.init();
    }

    loadNormalViewer() {
        // Normal şablonlar için viewer (point, route, timeline)
        try {
            console.log('[PublicViewer] Creating ModalComponent...');
            this.modal = new ModalComponent('app-container', {
                viewMode: true,
                storyData: this.storyData
            });
            console.log('[PublicViewer] ModalComponent created successfully');

            console.log('[PublicViewer] Calling startGame...');
            this.modal.startGame(this.storyData);
            console.log('[PublicViewer] startGame called successfully');
        } catch (error) {
            console.error('[PublicViewer] Error in loadNormalViewer:', error);
            this.showError('Görüntüleme Hatası', 'Harita içeriği işlenirken bir sorun oluştu. Sayfayı yenileyerek tekrar deneyin.');
        }
    }

    extractDrawings(points) {
        return points
            .filter(p => p.isDrawing)
            .map(p => ({
                id: p.id,
                type: p.drawingType,
                coords: p.coords,
                color: p.color || '#3b82f6',
                title: p.title
            }));
    }

    handleLoadError(error) {
        if (error.message && error.message.includes('404')) {
            this.showError(
                'Harita Bulunamadı',
                'Paylaşım kodu geçersiz veya harita artık paylaşılmıyor.'
            );
        } else if (error.message && error.message.includes('403')) {
            this.showError(
                'Erişim Kısıtlandı',
                'Bu haritaya erişim izniniz bulunmuyor. Harita sahibinden yeni bir paylaşım bağlantısı isteyebilirsiniz.'
            );
        } else {
            this.showError(
                'Bağlantı Hatası',
                'Harita yüklenirken beklenmeyen bir sorun oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.'
            );
        }
    }

    showError(title, message) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        const errorOverlay = document.getElementById('error-overlay');
        const errorMessage = document.getElementById('error-message');

        if (errorOverlay && errorMessage) {
            errorMessage.textContent = message;
            const titleEl = document.getElementById('error-title');
            if (titleEl) titleEl.textContent = title;

            const hintsEl = document.getElementById('error-hints');
            if (hintsEl) hintsEl.style.display = 'flex';

            const codeInput = document.getElementById('error-share-code');
            if (codeInput) {
                codeInput.value = this.publicKey || '';
                codeInput.placeholder = 'Paylaşım kodunu girin...';
                codeInput.parentElement.style.display = 'flex';
            }

            const retryBtn = document.getElementById('error-retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    const newCode = codeInput ? codeInput.value.trim() : '';
                    if (newCode) {
                        const url = new URL(window.location.href);
                        url.searchParams.set('code', newCode);
                        window.location.href = url.toString();
                    }
                });
            }

            if (codeInput) {
                codeInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        retryBtn?.click();
                    }
                });
            }

            errorOverlay.style.display = 'flex';
        }
    }
}

// DOM yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    new PublicViewer();
});
