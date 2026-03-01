/**
 * Modern Toast Notification System
 * Refined Light Design
 */

class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Container oluştur
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Toast göster
     * @param {Object} options - Toast seçenekleri
     * @param {String} options.title - Başlık (zorunlu)
     * @param {String} options.message - Mesaj (opsiyonel)
     * @param {String} options.type - success, error, warning, info (varsayılan: success)
     * @param {Number} options.duration - Süre ms cinsinden (varsayılan: 3000)
     * @param {Boolean} options.closable - Kapatma butonu (varsayılan: true)
     */
    show(options) {
        const {
            title,
            message = '',
            type = 'success',
            duration = 3000,
            closable = true
        } = options;

        // Toast elementi oluştur
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;

        // İkon belirle
        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };
        const icon = icons[type] || icons.success;

        // HTML oluştur
        toast.innerHTML = `
            <div class="toast__icon">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="toast__content">
                <div class="toast__title">${title}</div>
                ${message ? `<div class="toast__message">${message}</div>` : ''}
            </div>
            ${closable ? '<button class="toast__close"><i class="fa-solid fa-xmark"></i></button>' : ''}
            ${duration > 0 ? '<div class="toast__progress"></div>' : ''}
        `;

        // Container'a ekle
        this.container.appendChild(toast);

        // Kapatma butonu event
        if (closable) {
            const closeBtn = toast.querySelector('.toast__close');
            closeBtn.addEventListener('click', () => {
                this.hide(toast);
            });
        }

        // Otomatik kapatma
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * Toast'u gizle
     * @param {HTMLElement} toast - Toast elementi
     */
    hide(toast) {
        toast.classList.add('toast--closing');
        setTimeout(() => {
            toast.remove();
        }, 300); // Animation süresi
    }

    /**
     * Tüm toast'ları temizle
     */
    clear() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.hide(toast));
    }

    // Kısayol metodları
    success(title, message = '', duration = 3000) {
        return this.show({ title, message, type: 'success', duration });
    }

    error(title, message = '', duration = 4000) {
        return this.show({ title, message, type: 'error', duration });
    }

    warning(title, message = '', duration = 3500) {
        return this.show({ title, message, type: 'warning', duration });
    }

    info(title, message = '', duration = 3000) {
        return this.show({ title, message, type: 'info', duration });
    }
}

// Singleton instance
const toast = new ToastManager();

export { toast };
