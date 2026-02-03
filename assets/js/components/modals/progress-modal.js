/**
 * Progress Modal
 * Shows loading progress for large file imports
 */

class ProgressModal {
    constructor() {
        this.modal = null;
        this.progressBar = null;
        this.progressText = null;
        this.cancelButton = null;
        this.isCancelled = false;
    }

    show(title = 'Dosya Yükleniyor...') {
        this.isCancelled = false;
        
        // Create modal HTML
        const modalHTML = `
            <div id="progress-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                <div class="bg-white rounded-lg shadow-2xl p-6 w-96 max-w-full mx-4">
                    <div class="text-center">
                        <div class="mb-4">
                            <i class="fa-solid fa-cloud-arrow-up text-4xl text-emerald-600 animate-pulse"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">${title}</h3>
                        <p id="progress-text" class="text-sm text-gray-600 mb-4">Hazırlanıyor...</p>
                        
                        <!-- Progress Bar -->
                        <div class="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                            <div id="progress-bar" class="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                        
                        <!-- Stats -->
                        <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                            <div class="text-left">
                                <span class="font-medium">İşlenen:</span>
                                <span id="progress-current">0</span> / <span id="progress-total">0</span>
                            </div>
                            <div class="text-right">
                                <span class="font-medium">Hız:</span>
                                <span id="progress-rate">0</span> veri/sn
                            </div>
                        </div>
                        
                        <!-- Cancel Button (hidden by default) -->
                        <button id="progress-cancel" class="hidden px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                            <i class="fa-solid fa-xmark mr-1"></i>İptal
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Get references
        this.modal = document.getElementById('progress-modal');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.cancelButton = document.getElementById('progress-cancel');
        
        // Setup cancel button (optional)
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', () => {
                this.isCancelled = true;
                this.update(0, 100, 'İptal ediliyor...');
            });
        }
    }

    update(current, total, message = '') {
        if (!this.modal) return;
        
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        
        // Update progress bar
        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
        }
        
        // Update text
        if (this.progressText && message) {
            this.progressText.textContent = message;
        }
        
        // Update stats
        const currentEl = document.getElementById('progress-current');
        const totalEl = document.getElementById('progress-total');
        if (currentEl) currentEl.textContent = current.toLocaleString('tr-TR');
        if (totalEl) totalEl.textContent = total.toLocaleString('tr-TR');
    }

    updateRate(rate) {
        const rateEl = document.getElementById('progress-rate');
        if (rateEl) {
            rateEl.textContent = Math.round(rate).toLocaleString('tr-TR');
        }
    }

    setMessage(message) {
        if (this.progressText) {
            this.progressText.textContent = message;
        }
    }

    hide() {
        if (this.modal) {
            // Fade out animation
            this.modal.style.opacity = '0';
            this.modal.style.transition = 'opacity 0.3s';
            
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.remove();
                }
                this.modal = null;
                this.progressBar = null;
                this.progressText = null;
                this.cancelButton = null;
            }, 300);
        }
    }

    isCancelledByUser() {
        return this.isCancelled;
    }
}

// Make it globally available
window.ProgressModal = ProgressModal;

