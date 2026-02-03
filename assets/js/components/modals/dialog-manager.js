/**
 * Dialog Manager
 * Handles radius input dialogs for buffer analysis with Turkish number formatting
 */

(function() {
    'use strict';

    // Note: formatNumber and unformatNumber are now available globally from utils-core.js

    // ==========================================
    // DIALOG OVERLAY
    // ==========================================
    
    const radiusDialogOverlay = document.createElement('div');
    radiusDialogOverlay.className = 'radius-dialog-overlay';
    document.body.appendChild(radiusDialogOverlay);

    // ==========================================
    // SIMPLE RADIUS DIALOG (2 rings)
    // ==========================================
    
    /**
     * Show a dialog to input two radius values
     * @param {Object} defaults - Default radius values
     * @param {number} defaults.first - First radius default value
     * @param {number} defaults.second - Second radius default value
     * @returns {Promise<Object|null>} Object with {firstRadiusInput, secondRadiusInput} or null if cancelled
     */
    function showRadiusInputDialog(defaults) {
        return new Promise((resolve) => {
            radiusDialogOverlay.innerHTML = '';

            const dialog = document.createElement('div');
            dialog.className = 'radius-dialog';
            dialog.innerHTML = `
                <h2>Etki Alanı Yarıçapları</h2>
                <div>
                    <label>1. halka yarıçapı (metre)</label>
                    <input type="text" id="radius-input-1" value="${defaults.first}" inputmode="numeric" pattern="[0-9.,]*">
                </div>
                <div style="margin-top:0.75rem;">
                    <label>2. halka yarıçapı (metre)</label>
                    <input type="text" id="radius-input-2" value="${defaults.second}" inputmode="numeric" pattern="[0-9.,]*">
                </div>
                <div class="radius-dialog-error" id="radius-dialog-error">Lütfen geçerli ve pozitif değerler girin.</div>
                <div class="radius-dialog-actions">
                    <button class="radius-dialog-cancel">Vazgeç</button>
                    <button class="radius-dialog-confirm">Analizi Başlat</button>
                </div>
            `;

            radiusDialogOverlay.appendChild(dialog);
            radiusDialogOverlay.style.display = 'flex';

            const firstInput = dialog.querySelector('#radius-input-1');
            const secondInput = dialog.querySelector('#radius-input-2');
            const errorElem = dialog.querySelector('#radius-dialog-error');
            const confirmBtn = dialog.querySelector('.radius-dialog-confirm');
            const cancelBtn = dialog.querySelector('.radius-dialog-cancel');

            function closeDialog(result) {
                radiusDialogOverlay.style.display = 'none';
                radiusDialogOverlay.innerHTML = '';
                resolve(result);
            }

            cancelBtn.addEventListener('click', () => closeDialog(null));

            confirmBtn.addEventListener('click', () => {
                const firstValue = firstInput.value.trim();
                const secondValue = secondInput.value.trim();

                if (!firstValue || !secondValue || isNaN(firstValue) || isNaN(secondValue) || 
                    Number(firstValue) <= 0 || Number(secondValue) <= 0) {
                    errorElem.style.display = 'block';
                    return;
                }

                errorElem.style.display = 'none';
                closeDialog({ firstRadiusInput: firstValue, secondRadiusInput: secondValue });
            });

            radiusDialogOverlay.addEventListener('click', (event) => {
                if (event.target === radiusDialogOverlay) {
                    closeDialog(null);
                }
            }, { once: true });

            requestAnimationFrame(() => {
                firstInput.focus();
                firstInput.select();
            });
        });
    }

    // ==========================================
    // MULTIPLE RADIUS DIALOG (for multiple markers)
    // ==========================================
    
    /**
     * Show a dialog to input radius values for multiple markers
     * @param {Array<Object>} markers - Array of marker objects with 'id' and 'name' properties
     * @returns {Promise<Object|null>} Object with marker IDs as keys and radius values, or null if cancelled
     */
    function showMultipleRadiusDialog(markers) {
        return new Promise((resolve) => {
            radiusDialogOverlay.innerHTML = '';

            const dialog = document.createElement('div');
            dialog.className = 'radius-dialog';
            dialog.style.maxHeight = '80vh';
            dialog.style.overflowY = 'auto';
            
            let inputsHTML = markers.map((marker, index) => `
                <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: #f0fdf4; border-radius: 0.375rem; border: 1px solid #d1fae5;">
                    <div style="font-weight: 500; color: #065f46; margin-bottom: 0.5rem; font-size: 0.9rem;">
                        ${marker.name}
                    </div>
                    <div>
                        <label style="font-size: 0.75rem; color: #059669; display: block; margin-bottom: 0.25rem;">Yarıçap (metre)</label>
                        <input type="text" id="radius-${index}" value="500" inputmode="numeric" pattern="[0-9.,]*"
                               style="width: 100%; padding: 0.5rem; border: 1px solid #a7f3d0; border-radius: 0.375rem; font-size: 0.875rem;">
                    </div>
                </div>
            `).join('');

            dialog.innerHTML = `
                <h2 style="margin-bottom: 1rem; color: #111827;">Etki Alanı Ayarları</h2>
                <div style="margin-bottom: 0.75rem; padding: 0.5rem 0.75rem; background: #ecfdf5; border-radius: 0.375rem; font-size: 0.8rem; color: #047857;">
                    Her nokta için farklı yarıçap değerleri girebilirsiniz
                </div>
                ${inputsHTML}
                <div class="radius-dialog-error" id="radius-dialog-error" style="display: none;">Lütfen tüm alanları geçerli ve pozitif değerlerle doldurun.</div>
                <div class="radius-dialog-actions" style="margin-top: 1rem;">
                    <button class="radius-dialog-cancel">İptal</button>
                    <button class="radius-dialog-confirm">Analizi Başlat</button>
                </div>
            `;

            radiusDialogOverlay.appendChild(dialog);
            radiusDialogOverlay.style.display = 'flex';

            const errorElem = dialog.querySelector('#radius-dialog-error');
            const confirmBtn = dialog.querySelector('.radius-dialog-confirm');
            const cancelBtn = dialog.querySelector('.radius-dialog-cancel');
            
            // Input'lara formatlama ekle
            markers.forEach((marker, index) => {
                const radiusInput = dialog.querySelector(`#radius-${index}`);
                let isFormatting = false;
                
                // Format on input - anlık formatlama
                radiusInput.addEventListener('input', function(e) {
                    if (isFormatting) return; // Prevent infinite loop
                    
                    const unformatted = unformatNumber(e.target.value);
                    
                    if (unformatted !== '' && /^\d+$/.test(unformatted)) {
                        isFormatting = true;
                        const numValue = parseInt(unformatted, 10);
                        const formatted = formatNumber(numValue);
                        e.target.value = formatted;
                        
                        // Cursor'ı sona al (sadece text input'lar için)
                        setTimeout(() => {
                            if (e.target.type === 'text') {
                                e.target.setSelectionRange(formatted.length, formatted.length);
                            }
                        }, 0);
                        
                        isFormatting = false;
                    }
                });
                
                // Format on blur (fallback)
                radiusInput.addEventListener('blur', function(e) {
                    const unformatted = unformatNumber(e.target.value);
                    if (unformatted !== '' && /^\d+$/.test(unformatted)) {
                        const numValue = parseInt(unformatted, 10);
                        e.target.value = formatNumber(numValue);
                    }
                });
            });

            function closeDialog(result) {
                radiusDialogOverlay.style.display = 'none';
                radiusDialogOverlay.innerHTML = '';
                resolve(result);
            }

            cancelBtn.addEventListener('click', () => closeDialog(null));

            confirmBtn.addEventListener('click', () => {
                const radii = {}; // Object with marker IDs as keys
                let hasError = false;

                markers.forEach((marker, index) => {
                    const radiusInput = dialog.querySelector(`#radius-${index}`);
                    
                    // Get raw value from input
                    let rawValue = radiusInput.value.trim();
                    
                    // Remove any formatting (Turkish separators)
                    const value = unformatNumber(rawValue);

                    // Validate: check if value is empty or invalid
                    if (!value || value === '-' || isNaN(value) || Number(value) <= 0) {
                        hasError = true;
                        return;
                    }

                    const radius = parseInt(value, 10);
                    radii[marker.id] = radius;
                });

                if (hasError) {
                    errorElem.style.display = 'block';
                    return;
                }

                errorElem.style.display = 'none';
                closeDialog(radii);
            });

            radiusDialogOverlay.addEventListener('click', (event) => {
                if (event.target === radiusDialogOverlay) {
                    closeDialog(null);
                }
            }, { once: true });

            // İlk input'a focus ver
            requestAnimationFrame(() => {
                const firstInput = dialog.querySelector('#radius-0');
                if (firstInput) {
                    firstInput.focus();
                    firstInput.select();
                }
            });
        });
    }

    // ==========================================
    // EXPORT TO WINDOW
    // ==========================================
    
    window.dialogManager = {
        formatNumber,
        unformatNumber,
        showRadiusInputDialog,
        showMultipleRadiusDialog
    };

    // Browser global export (export as ModalManager for tests)
    window.ModalManager = window.dialogManager;

})();
