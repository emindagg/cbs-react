/**
 * Coordinate Mapper Modal - Modernized
 * CSV/Excel import için kolon eşleştirme UI'ı
 */

// Güvenli Logger
const safeLogCoord = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeWarnCoord = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);

class CoordinateMapper {
    constructor() {
        this.modal = null;
        this.columns = [];
        this.previewData = [];
        this.resolveCallback = null;
        this.rejectCallback = null;
        this.showPreview = true;
    }

    /**
     * Show coordinate mapping modal
     * @param {Array<string>} columns - Available columns
     * @param {Array<Object>} previewData - First 5-10 rows for preview
     * @param {Object} autoDetected - Auto-detected columns {lat, lon, name, type}
     * @returns {Promise<Object>} - Selected mapping {lat, lon, name, type}
     */
    show(columns, previewData, autoDetected = {}) {
        return new Promise((resolve, reject) => {
            this.columns = columns;
            this.previewData = previewData.slice(0, 3); // Only first 3 rows
            this.resolveCallback = resolve;
            this.rejectCallback = reject;

            this.createModal(autoDetected);
            this.showModal();
        });
    }

    createModal(autoDetected) {
        // Remove existing modal
        const existing = document.getElementById('coordinate-mapper-modal');
        if (existing) {
            existing.remove();
        }

        // Generate preview table HTML
        const previewHTML = this.generatePreviewTable(autoDetected);

        // Create modal HTML with modern design
        const modalHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

                #coordinate-mapper-modal {
                    font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
                }

                .coord-modal-container {
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    max-width: 560px;
                    width: 100%;
                    overflow: hidden;
                    transform: scale(0.95);
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .coord-modal-container.active {
                    transform: scale(1);
                    opacity: 1;
                }

                .coord-header {
                    background: #1c1c1e;
                    padding: 20px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .coord-header-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .coord-icon {
                    width: 20px;
                    height: 20px;
                    color: #60a5fa;
                    flex-shrink: 0;
                }

                .coord-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #ffffff;
                    letter-spacing: -0.02em;
                    margin: 0;
                }

                .coord-close {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    color: rgba(255, 255, 255, 0.6);
                    transition: all 0.2s ease;
                    cursor: pointer;
                    border: none;
                    background: transparent;
                }

                .coord-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                }

                .coord-body {
                    padding: 24px;
                }

                .coord-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    color: #15803d;
                    margin-bottom: 20px;
                }

                .coord-status-icon {
                    width: 14px;
                    height: 14px;
                }

                .coord-selects {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .coord-field {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .coord-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #374151;
                    letter-spacing: -0.01em;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .coord-required {
                    color: #ef4444;
                    font-size: 14px;
                }

                .coord-select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: 'JetBrains Mono', monospace;
                    color: #1f2937;
                    background: #ffffff;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    outline: none;
                }

                .coord-select:hover {
                    border-color: #d1d5db;
                    background: #f9fafb;
                }

                .coord-select:focus {
                    border-color: #1c1c1e;
                    background: #ffffff;
                    box-shadow: 0 0 0 3px rgba(28, 28, 30, 0.1);
                }

                .coord-preview {
                    margin-top: 20px;
                    border-top: 1px solid #f3f4f6;
                    padding-top: 16px;
                }

                .coord-preview-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                }

                .coord-preview-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .coord-preview-toggle {
                    font-size: 11px;
                    color: #6b7280;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .coord-preview-toggle:hover {
                    background: #f3f4f6;
                    color: #374151;
                }

                .coord-table-wrapper {
                    overflow-x: auto;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                    max-height: 200px;
                    transition: all 0.3s ease;
                }

                .coord-table-wrapper.hidden {
                    max-height: 0;
                    border: none;
                    margin: 0;
                    opacity: 0;
                }

                .coord-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }

                .coord-table th {
                    background: #f9fafb;
                    padding: 10px 12px;
                    text-align: left;
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 600;
                    color: #374151;
                    border-bottom: 1px solid #e5e7eb;
                    font-size: 11px;
                    white-space: nowrap;
                }

                .coord-table th.highlight {
                    background: #fef3c7;
                    color: #92400e;
                }

                .coord-table td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #f3f4f6;
                    font-family: 'JetBrains Mono', monospace;
                    color: #6b7280;
                    white-space: nowrap;
                }

                .coord-table tr:last-child td {
                    border-bottom: none;
                }

                .coord-table td.highlight {
                    background: #fffbeb;
                    color: #92400e;
                    font-weight: 500;
                }

                .coord-footer {
                    padding: 16px 24px;
                    background: #f9fafb;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    border-top: 1px solid #f3f4f6;
                }

                .coord-info {
                    font-size: 12px;
                    color: #6b7280;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .coord-actions {
                    display: flex;
                    gap: 8px;
                }

                .coord-btn {
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    outline: none;
                    letter-spacing: -0.01em;
                }

                .coord-btn-cancel {
                    background: #ffffff;
                    color: #6b7280;
                    border: 1.5px solid #e5e7eb;
                }

                .coord-btn-cancel:hover {
                    background: #f9fafb;
                    color: #374151;
                    border-color: #d1d5db;
                }

                .coord-btn-confirm {
                    background: #1c1c1e;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .coord-btn-confirm:hover {
                    background: #000000;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(28, 28, 30, 0.3);
                }

                .coord-btn-confirm:active {
                    transform: translateY(0);
                }

                .coord-check-icon {
                    width: 16px;
                    height: 16px;
                }

                @media (max-width: 640px) {
                    .coord-selects {
                        grid-template-columns: 1fr;
                    }

                    .coord-footer {
                        flex-direction: column-reverse;
                        align-items: stretch;
                    }

                    .coord-actions {
                        width: 100%;
                    }

                    .coord-btn {
                        flex: 1;
                    }
                }
            </style>

            <div id="coordinate-mapper-modal" class="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center p-4" style="display: none; backdrop-filter: blur(4px);">
                <div class="coord-modal-container">
                    <!-- Header -->
                    <div class="coord-header">
                        <div class="coord-header-title">
                            <svg class="coord-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                            </svg>
                            <h3 class="coord-title">Koordinat Eşleştirme</h3>
                        </div>
                        <button id="coord-mapper-close" class="coord-close">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="coord-body">
                        <!-- Status Badge -->
                        <div class="coord-status">
                            <svg class="coord-status-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span>Otomatik algılama tamamlandı</span>
                        </div>

                        <!-- Coordinate Selects -->
                        <div class="coord-selects">
                            <!-- Latitude -->
                            <div class="coord-field">
                                <label class="coord-label">
                                    Enlem
                                    <span class="coord-required">*</span>
                                </label>
                                <select id="coord-lat-select" class="coord-select">
                                    <option value="">Seçin...</option>
                                    ${this.columns.map(col => `
                                        <option value="${col}" ${col === autoDetected.lat ? 'selected' : ''}>
                                            ${col}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <!-- Longitude -->
                            <div class="coord-field">
                                <label class="coord-label">
                                    Boylam
                                    <span class="coord-required">*</span>
                                </label>
                                <select id="coord-lon-select" class="coord-select">
                                    <option value="">Seçin...</option>
                                    ${this.columns.map(col => `
                                        <option value="${col}" ${col === autoDetected.lon ? 'selected' : ''}>
                                            ${col}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- Preview Section -->
                        <div class="coord-preview">
                            <div class="coord-preview-header">
                                <span class="coord-preview-title">Veri Önizleme</span>
                                <button id="coord-preview-toggle" class="coord-preview-toggle">
                                    <span id="coord-preview-toggle-text">Gizle</span>
                                    <svg id="coord-preview-toggle-icon" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </button>
                            </div>
                            <div id="coord-table-wrapper" class="coord-table-wrapper">
                                ${previewHTML}
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="coord-footer">
                        <div class="coord-info">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                            </svg>
                            <span>${this.previewData.length} satır bulundu</span>
                        </div>
                        <div class="coord-actions">
                            <button id="coord-mapper-cancel" class="coord-btn coord-btn-cancel">
                                İptal
                            </button>
                            <button id="coord-mapper-confirm" class="coord-btn coord-btn-confirm">
                                <svg class="coord-check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                Onayla
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('coordinate-mapper-modal');

        this.attachEventListeners(autoDetected);
    }

    generatePreviewTable(autoDetected) {
        if (!this.previewData || this.previewData.length === 0) {
            return '<div class="coord-table" style="padding: 20px; text-align: center; color: #9ca3af;">Önizleme verisi yok</div>';
        }

        const headers = this.columns;
        const rows = this.previewData;

        let html = '<table class="coord-table"><thead><tr>';

        // Table headers
        headers.forEach(header => {
            const isHighlighted = header === autoDetected.lat || header === autoDetected.lon;
            html += `<th class="${isHighlighted ? 'highlight' : ''}">${header}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Table rows
        rows.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                const isHighlighted = header === autoDetected.lat || header === autoDetected.lon;
                const value = row[header] !== undefined && row[header] !== null ? row[header] : '-';
                html += `<td class="${isHighlighted ? 'highlight' : ''}">${value}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    attachEventListeners(autoDetected) {
        // Close button
        document.getElementById('coord-mapper-close')?.addEventListener('click', () => this.cancel());

        // Cancel button
        document.getElementById('coord-mapper-cancel')?.addEventListener('click', () => this.cancel());

        // Confirm button
        document.getElementById('coord-mapper-confirm')?.addEventListener('click', () => this.confirm());

        // Preview toggle
        document.getElementById('coord-preview-toggle')?.addEventListener('click', () => {
            this.showPreview = !this.showPreview;
            const wrapper = document.getElementById('coord-table-wrapper');
            const toggleText = document.getElementById('coord-preview-toggle-text');
            const toggleIcon = document.getElementById('coord-preview-toggle-icon');

            if (this.showPreview) {
                wrapper.classList.remove('hidden');
                toggleText.textContent = 'Gizle';
                toggleIcon.style.transform = 'rotate(0deg)';
            } else {
                wrapper.classList.add('hidden');
                toggleText.textContent = 'Göster';
                toggleIcon.style.transform = 'rotate(-90deg)';
            }
        });

        // Select change handlers - update preview highlighting
        const latSelect = document.getElementById('coord-lat-select');
        const lonSelect = document.getElementById('coord-lon-select');

        const updateHighlighting = () => {
            const lat = latSelect?.value;
            const lon = lonSelect?.value;

            // Remove all highlights
            document.querySelectorAll('.coord-table th, .coord-table td').forEach(el => {
                el.classList.remove('highlight');
            });

            // Add new highlights
            if (lat || lon) {
                const headers = Array.from(document.querySelectorAll('.coord-table th'));
                headers.forEach((th, index) => {
                    if (th.textContent === lat || th.textContent === lon) {
                        th.classList.add('highlight');
                        // Highlight corresponding column cells
                        document.querySelectorAll(`.coord-table td:nth-child(${index + 1})`).forEach(td => {
                            td.classList.add('highlight');
                        });
                    }
                });
            }
        };

        latSelect?.addEventListener('change', updateHighlighting);
        lonSelect?.addEventListener('change', updateHighlighting);

        // Close on background click
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.cancel();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.modal && this.modal.style.display !== 'none') {
                if (e.key === 'Escape') {
                    this.cancel();
                } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    this.confirm();
                }
            }
        });
    }

    showModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            // Trigger animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const container = this.modal.querySelector('.coord-modal-container');
                    container?.classList.add('active');
                });
            });
        }
    }

    hideModal() {
        if (this.modal) {
            const container = this.modal.querySelector('.coord-modal-container');
            container?.classList.remove('active');

            setTimeout(() => {
                this.modal.style.display = 'none';
                this.modal.remove();
            }, 300);
        }
    }

    confirm() {
        const lat = document.getElementById('coord-lat-select')?.value;
        const lon = document.getElementById('coord-lon-select')?.value;

        // Validation
        if (!lat || !lon) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('❌ Lütfen Enlem ve Boylam kolonlarını seçin!', 'error', 3000);
            }
            return;
        }

        safeLogCoord('✅ Kolon eşleştirme:', { lat, lon });

        this.hideModal();

        if (this.resolveCallback) {
            this.resolveCallback({ lat, lon, name: '', type: '' });
        }
    }

    cancel() {
        safeWarnCoord('⚠️ Kolon eşleştirme iptal edildi');
        this.hideModal();

        if (this.rejectCallback) {
            this.rejectCallback(new Error('Kullanıcı tarafından iptal edildi'));
        }
    }
}

// Global instance
window.CoordinateMapper = CoordinateMapper;
