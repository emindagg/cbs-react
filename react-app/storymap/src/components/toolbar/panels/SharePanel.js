import { apiService } from '../../../services/apiService.js';
import { storageManager } from '../../../utils/storageManager.js';
import { toast } from '../../../utils/toast.js';

export class SharePanel {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.currentStoryId = null;
        this.publicKey = null;
        this.isShared = false;
        this.escKeyHandler = null; // ESC key listener referansı
    }

    setStoryId(storyId) {
        this.currentStoryId = storyId;
        // Load share status when story ID is set
        this.loadShareStatus();
    }

    async loadShareStatus() {
        if (!this.currentStoryId || !storageManager.isBackendMode()) {
            return;
        }

        try {
            const story = await storageManager.getMap(this.currentStoryId);
            this.publicKey = story.publicKey;
            this.isShared = story.isShared;
        } catch (error) {
            console.error('[SharePanel] Failed to load share status:', error);
        }
    }

    async shareStorymap() {
        if (!this.currentStoryId) {
            toast.error('Lütfen önce haritanızı kaydedin');
            return;
        }

        try {
            if (storageManager.isBackendMode()) {
                // Backend share API'sini çağır - PATCH /api/Storymap/share/{id}
                await apiService.shareStorymap(this.currentStoryId);
                
                // Güncel storymap verisini çek (publicKey dahil)
                const story = await apiService.getStorymap(this.currentStoryId);

                // Backend küçük harfle dönüyor
                this.publicKey = story.publickey || story.Publickey;
                this.isShared = true;

                console.log('[SharePanel] Storymap shared, public key:', this.publicKey);
                toast.success('Harita paylaşıma açıldı');
            } else {
                // IndexedDB mode - generate local public key
                this.publicKey = this.currentStoryId.toString();
                this.isShared = true;
                toast.success('Harita yerel olarak paylaşıma açıldı');
            }
        } catch (error) {
            console.error('[SharePanel] Share failed:', error);
            toast.error(error.message || 'Paylaşma başarısız oldu');
        }
    }

    async unshareStorymap() {
        if (!this.currentStoryId) return;

        try {
            if (storageManager.isBackendMode()) {
                // Call backend unshare API
                await apiService.unshareStorymap(this.currentStoryId);

                this.publicKey = null;
                this.isShared = false;

                toast.success('Paylaşım iptal edildi');
            } else {
                // IndexedDB mode
                this.publicKey = null;
                this.isShared = false;
                toast.success('Paylaşım iptal edildi');
            }
        } catch (error) {
            console.error('[SharePanel] Unshare failed:', error);
            toast.error(error.message || 'İptal başarısız oldu');
        }
    }

    open() {
        if (this.isOpen) return;
        this.createModal();
        this.isOpen = true;
    }

    close() {
        if (!this.isOpen || !this.modal) return;

        // ESC key listener'ı temizle
        if (this.escKeyHandler) {
            document.removeEventListener('keydown', this.escKeyHandler);
            this.escKeyHandler = null;
        }

        this.modal.remove();
        this.modal = null;
        this.isOpen = false;
    }

    createModal() {
        const shareUrl = this.generateShareLink();
        
        this.modal = document.createElement('div');
        this.modal.className = 'share-modal';
        this.modal.innerHTML = `
            <div class="share-modal__content">
                <button class="share-modal__close" type="button">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="share-modal__header">
                    <div class="share-modal__icon">
                        <i class="fas fa-arrow-up-from-bracket"></i>
                    </div>
                    <h2 class="share-modal__title">Hikâyeni Paylaş</h2>
                    <p class="share-modal__subtitle">Bu linki paylaşarak hikâyeni başkalarıyla paylaşabilirsin</p>
                </div>
                
                <!-- Paylaşım Toggle -->
                <div class="share-modal__toggle-section">
                    <div class="share-modal__toggle-info">
                        <i class="fas fa-globe"></i>
                        <span>Herkese Açık Paylaşım</span>
                    </div>
                    <label class="share-modal__toggle">
                        <input type="checkbox" id="share-toggle" ${this.isShared ? 'checked' : ''}>
                        <span class="share-modal__toggle-slider"></span>
                    </label>
                </div>
                
                ${this.isShared ? `
                <div class="share-modal__link-box">
                    <input type="text" class="share-modal__link-input" id="share-link" value="${shareUrl}" readonly>
                    <button class="share-modal__copy-btn" id="copy-btn" title="Kopyala">
                        <i class="far fa-clipboard"></i>
                    </button>
                </div>
                
                ${this.publicKey ? `
                <div class="share-modal__code-section">
                    <div class="share-modal__code-label">
                        <i class="fas fa-key"></i>
                        <span>Paylaşım Kodu</span>
                    </div>
                    <div class="share-modal__code-box">
                        <span class="share-modal__code-value" id="share-code">${this.publicKey}</span>
                        <button class="share-modal__code-copy-btn" id="copy-code-btn" title="Kopyala">
                            <i class="far fa-copy"></i>
                        </button>
                    </div>
                </div>
                ` : ''}
                
                <div class="share-modal__divider">
                    <span>veya sosyal medyada paylaş</span>
                </div>
                
                <div class="share-modal__social-wrapper">
                    <button class="share-modal__share-btn">
                        <span class="share-modal__share-text">Paylaş</span>
                        <div class="share-modal__icons-container">
                            <div class="share-modal__icon-item share-modal__icon-item--twitter" id="share-twitter">
                                <i class="fab fa-twitter"></i>
                            </div>
                            <div class="share-modal__icon-item share-modal__icon-item--facebook" id="share-facebook">
                                <i class="fab fa-facebook-f"></i>
                            </div>
                            <div class="share-modal__icon-item share-modal__icon-item--whatsapp" id="share-whatsapp">
                                <i class="fab fa-whatsapp"></i>
                            </div>
                            <div class="share-modal__icon-item share-modal__icon-item--telegram" id="share-telegram">
                                <i class="fab fa-telegram-plane"></i>
                            </div>
                        </div>
                    </button>
                </div>
                ` : `
                <div class="share-modal__disabled-info">
                    <i class="fas fa-lock"></i>
                    <p>Paylaşımı açmak için yukarıdaki düğmeyi aktif edin</p>
                </div>
                `}
            </div>
        `;

        document.body.appendChild(this.modal);
        this.setupEventListeners();
        
        requestAnimationFrame(() => {
            this.modal.classList.add('share-modal--show');
        });
    }

    setupEventListeners() {
        const closeBtn = this.modal.querySelector('.share-modal__close');
        closeBtn.addEventListener('click', () => this.close());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Share toggle
        const shareToggle = this.modal.querySelector('#share-toggle');
        if (shareToggle) {
            shareToggle.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    await this.shareStorymap();
                } else {
                    await this.unshareStorymap();
                }
                // Modal'ı yeniden oluştur (UI güncellemesi için)
                this.refreshModal();
            });
        }

        // Copy button (sadece paylaşım açıksa var)
        const copyBtn = this.modal.querySelector('#copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyLink());
        }

        // Copy code button
        const copyCodeBtn = this.modal.querySelector('#copy-code-btn');
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => this.copyCode());
        }

        // Social buttons (sadece paylaşım açıksa var)
        const twitterBtn = this.modal.querySelector('#share-twitter');
        const facebookBtn = this.modal.querySelector('#share-facebook');
        const whatsappBtn = this.modal.querySelector('#share-whatsapp');
        const telegramBtn = this.modal.querySelector('#share-telegram');

        if (twitterBtn) {
            twitterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareToTwitter();
            });
        }
        if (facebookBtn) {
            facebookBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareToFacebook();
            });
        }
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareToWhatsApp();
            });
        }
        if (telegramBtn) {
            telegramBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareToTelegram();
            });
        }

        // ESC key - önce varsa eski listener'ı temizle
        if (this.escKeyHandler) {
            document.removeEventListener('keydown', this.escKeyHandler);
        }
        this.escKeyHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        };
        document.addEventListener('keydown', this.escKeyHandler);
    }

    refreshModal() {
        // Modal'ı kapat ve yeniden aç (UI güncellemesi için)
        if (this.modal) {
            this.modal.remove();
        }
        this.modal = null; // Referansı temizle
        this.createModal();
    }

    generateShareLink() {
        if (this.publicKey) {
            // Use public key for shared maps
            return `${window.location.origin}/cbs/storymap/view.html?code=${this.publicKey}`;
        } else if (this.currentStoryId) {
            // Fallback: use view mode with ID (IndexedDB)
            return `${window.location.origin}/cbs/storymap/app.html?mode=view&id=${this.currentStoryId}`;
        }
        // Fallback: no story
        return window.location.origin;
    }

    async copyLink() {
        const linkInput = this.modal.querySelector('#share-link');
        const copyBtn = this.modal.querySelector('#copy-btn');
        
        try {
            await navigator.clipboard.writeText(linkInput.value);
            
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.classList.add('share-modal__copy-btn--success');
            
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="far fa-clipboard"></i>';
                copyBtn.classList.remove('share-modal__copy-btn--success');
            }, 2000);
        } catch (err) {
            linkInput.select();
        }
    }

    async copyCode() {
        const codeValue = this.modal.querySelector('#share-code');
        const copyCodeBtn = this.modal.querySelector('#copy-code-btn');
        
        try {
            await navigator.clipboard.writeText(codeValue.textContent);
            
            copyCodeBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyCodeBtn.classList.add('share-modal__code-copy-btn--success');
            
            toast.success('Paylaşım kodu kopyalandı!');
            
            setTimeout(() => {
                copyCodeBtn.innerHTML = '<i class="far fa-clipboard"></i>';
                copyCodeBtn.classList.remove('share-modal__code-copy-btn--success');
            }, 2000);
        } catch (err) {
            console.error('[SharePanel] Copy code failed:', err);
            toast.error('Kopyalama başarısız oldu');
        }
    }

    shareToTwitter() {
        const url = encodeURIComponent(this.modal.querySelector('#share-link').value);
        const text = encodeURIComponent('Bu haritaya göz atın!');
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }

    shareToFacebook() {
        const url = encodeURIComponent(this.modal.querySelector('#share-link').value);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }

    shareToWhatsApp() {
        const url = this.modal.querySelector('#share-link').value;
        const text = encodeURIComponent(`Bu haritaya göz atın: ${url}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }

    shareToTelegram() {
        const url = encodeURIComponent(this.modal.querySelector('#share-link').value);
        const text = encodeURIComponent('Bu haritaya göz atın!');
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    }

}