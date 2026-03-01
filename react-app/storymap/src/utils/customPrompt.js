/**
 * Custom Prompt Modal - Mode Indicator Style
 */

export function customPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        // Modal HTML oluştur
        const modal = document.createElement('div');
        modal.className = 'prompt-modal';
        modal.innerHTML = `
            <div class="prompt-modal__container">
                <div class="prompt-modal__body">
                    <input type="text" class="prompt-modal__input" value="${defaultValue}" placeholder="${message}">
                </div>
                <div class="prompt-modal__footer">
                    <button class="prompt-modal__btn prompt-modal__btn--confirm">Tamam</button>
                    <button class="prompt-modal__btn prompt-modal__btn--cancel">✕</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const input = modal.querySelector('.prompt-modal__input');
        const btnCancel = modal.querySelector('.prompt-modal__btn--cancel');
        const btnConfirm = modal.querySelector('.prompt-modal__btn--confirm');

        // Modal'ı göster
        requestAnimationFrame(() => {
            modal.classList.add('prompt-modal--visible');
            input.focus();
            input.select();
        });

        const closeModal = (value) => {
            modal.classList.remove('prompt-modal--visible');
            setTimeout(() => {
                modal.remove();
                resolve(value);
            }, 200);
        };

        // Event listeners
        btnCancel.addEventListener('click', () => closeModal(null));
        btnConfirm.addEventListener('click', () => closeModal(input.value));

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') closeModal(input.value);
            if (e.key === 'Escape') closeModal(null);
        });
    });
}

/**
 * Custom Confirm Modal - Modern & Compact
 */
export function customConfirm(message, options = {}) {
    const {
        title = '',
        confirmText = 'Evet',
        cancelText = 'İptal',
        type = 'danger' // 'danger', 'warning', 'info'
    } = options;

    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        
        const iconMap = {
            danger: 'fa-trash-alt',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        modal.innerHTML = `
            <div class="confirm-modal__overlay"></div>
            <div class="confirm-modal__container">
                <div class="confirm-modal__icon confirm-modal__icon--${type}">
                    <i class="fas ${iconMap[type]}"></i>
                </div>
                <div class="confirm-modal__content">
                    ${title ? `<h3 class="confirm-modal__title">${title}</h3>` : ''}
                    <p class="confirm-modal__message">${message}</p>
                </div>
                <div class="confirm-modal__actions">
                    <button class="confirm-modal__btn confirm-modal__btn--cancel">${cancelText}</button>
                    <button class="confirm-modal__btn confirm-modal__btn--confirm confirm-modal__btn--${type}">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const overlay = modal.querySelector('.confirm-modal__overlay');
        const btnCancel = modal.querySelector('.confirm-modal__btn--cancel');
        const btnConfirm = modal.querySelector('.confirm-modal__btn--confirm');

        requestAnimationFrame(() => {
            modal.classList.add('confirm-modal--visible');
        });

        const closeModal = (result) => {
            modal.classList.remove('confirm-modal--visible');
            setTimeout(() => {
                modal.remove();
                resolve(result);
            }, 200);
        };

        overlay.addEventListener('click', () => closeModal(false));
        btnCancel.addEventListener('click', () => closeModal(false));
        btnConfirm.addEventListener('click', () => closeModal(true));

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                closeModal(false);
                document.removeEventListener('keydown', handler);
            }
            if (e.key === 'Enter') {
                closeModal(true);
                document.removeEventListener('keydown', handler);
            }
        });
    });
}
