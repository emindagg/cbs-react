/**
 * Layer Style Panel
 * Import edilen veriler için stil ayarları paneli
 */

const safeLogStyle = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);

class LayerStylePanel {
    constructor() {
        this.isVisible = false;
        this.currentSettings = {
            // Tema Özellikleri
            clusterEnabled: true,
            opacity: 0.9,
            width: 2,  // Small default for better visibility
            fillColor: '#3b82f6',
            strokeWidth: 1,
            strokeColor: '#000000',

            // Yazı Özellikleri
            labelField: '',
            labelSize: 16,
            labelColor: '#000000'
        };

        this.availableFields = [];
        this.fab = null;
        this.panel = null;

        // Debounce timers for slow operations
        this.labelDebounceTimer = null;
        this.labelDebounceDelay = 500; // 500ms delay for label operations

        // FAB dragging state
        this.isDragging = false;
        this.fabPosition = { x: null, y: null }; // null = use default CSS position
        this.dragOffset = { x: 0, y: 0 };
    }

    /**
     * Debounce utility - delays execution until user stops interacting
     */
    debounce(func, delay) {
        return (...args) => {
            clearTimeout(this.labelDebounceTimer);
            this.labelDebounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Show floating action button after import
     */
    showFAB(dataCount, availableFields = []) {
        console.log('🔍 showFAB received:', { dataCount, availableFields });
        this.availableFields = availableFields;

        // If panel is already open, refresh the dataset list
        if (this.isVisible && this.panel) {
            this.refreshDataSetList();
        }

        // Remove existing FAB
        if (this.fab) {
            this.fab.remove();
        }

        // Create FAB (40% smaller: 56px → 32px)
        const fabHTML = `
            <button id="layer-style-fab"
                    class="fixed w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-colors z-[1000] flex items-center justify-center group cursor-move"
                    style="${this.fabPosition.x !== null ? `left: ${this.fabPosition.x}px; top: ${this.fabPosition.y}px;` : 'bottom: 1.5rem; right: 1.5rem;'}"
                    title="Veri Stil Ayarları (Sürüklenebilir)">
                <svg class="w-4 h-4 group-hover:rotate-90 transition-transform pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    ${dataCount} veri
                </span>
            </button>
        `;

        document.body.insertAdjacentHTML('beforeend', fabHTML);
        this.fab = document.getElementById('layer-style-fab');

        // Add click handler
        this.fab.addEventListener('click', (_e) => {
            // Only trigger panel if not dragging
            if (!this.isDragging) {
                this.togglePanel();
            }
        });

        // Add drag handlers
        this.addDragHandlers();

        // Animate in
        setTimeout(() => {
            this.fab.classList.add('animate-bounce');
            setTimeout(() => this.fab.classList.remove('animate-bounce'), 2000);
        }, 100);

        safeLogStyle('✅ Layer style FAB created');
    }

    /**
     * Add drag handlers to FAB
     */
    addDragHandlers() {
        if (!this.fab) return;

        // Mouse events
        this.fab.addEventListener('mousedown', (e) => {
            e.preventDefault();

            this.isDragging = false; // Will become true if mouse moves
            const rect = this.fab.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;

            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('mouseup', this.onMouseUp);
        });

        // Touch events
        this.fab.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];

            this.isDragging = false;
            const rect = this.fab.getBoundingClientRect();
            this.dragOffset.x = touch.clientX - rect.left;
            this.dragOffset.y = touch.clientY - rect.top;

            document.addEventListener('touchmove', this.onTouchMove);
            document.addEventListener('touchend', this.onTouchEnd);
        });
    }

    onMouseMove = (e) => {
        // Detect if this is a drag (moved more than 5px)
        const distance = Math.sqrt(
            Math.pow(e.clientX - this.dragOffset.x - (this.fabPosition.x || 0), 2) +
            Math.pow(e.clientY - this.dragOffset.y - (this.fabPosition.y || 0), 2)
        );

        if (distance > 5) {
            this.isDragging = true;
        }

        if (this.isDragging && this.fab) {
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;

            // Constrain to viewport
            const maxX = window.innerWidth - this.fab.offsetWidth;
            const maxY = window.innerHeight - this.fab.offsetHeight;

            this.fabPosition.x = Math.max(0, Math.min(x, maxX));
            this.fabPosition.y = Math.max(0, Math.min(y, maxY));

            this.fab.style.left = this.fabPosition.x + 'px';
            this.fab.style.top = this.fabPosition.y + 'px';
            this.fab.style.bottom = 'auto';
            this.fab.style.right = 'auto';
        }
    }

    onMouseUp = (_e) => {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);

        // Reset isDragging after a short delay to prevent click event
        setTimeout(() => {
            this.isDragging = false;
        }, 100);
    }

    onTouchMove = (e) => {
        const touch = e.touches[0];

        // Detect if this is a drag
        const distance = Math.sqrt(
            Math.pow(touch.clientX - this.dragOffset.x - (this.fabPosition.x || 0), 2) +
            Math.pow(touch.clientY - this.dragOffset.y - (this.fabPosition.y || 0), 2)
        );

        if (distance > 5) {
            this.isDragging = true;
        }

        if (this.isDragging && this.fab) {
            e.preventDefault();
            const x = touch.clientX - this.dragOffset.x;
            const y = touch.clientY - this.dragOffset.y;

            // Constrain to viewport
            const maxX = window.innerWidth - this.fab.offsetWidth;
            const maxY = window.innerHeight - this.fab.offsetHeight;

            this.fabPosition.x = Math.max(0, Math.min(x, maxX));
            this.fabPosition.y = Math.max(0, Math.min(y, maxY));

            this.fab.style.left = this.fabPosition.x + 'px';
            this.fab.style.top = this.fabPosition.y + 'px';
            this.fab.style.bottom = 'auto';
            this.fab.style.right = 'auto';
        }
    }

    onTouchEnd = (_e) => {
        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);

        // Reset isDragging after a short delay
        setTimeout(() => {
            this.isDragging = false;
        }, 100);
    }

    /**
     * Hide FAB
     */
    hideFAB() {
        if (this.fab) {
            this.fab.remove();
            this.fab = null;
        }
    }

    /**
     * Toggle panel visibility
     */
    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    /**
     * Render dataset list HTML
     */
    renderDataSetList() {
        if (!window.dataSets || window.dataSets.length === 0) {
            return `<div class="text-xs text-gray-500 italic">Henüz veri yüklenmedi</div>`;
        }

        return window.dataSets.map(ds => `
            <div class="flex items-center space-x-1.5 bg-gray-50 rounded p-1.5 hover:bg-gray-100 transition-colors">
                <input type="radio"
                       name="dataset-selector"
                       id="dataset-${ds.id}"
                       value="${ds.id}"
                       ${window.activeDataSetId === ds.id ? 'checked' : ''}
                       class="w-3 h-3 text-emerald-600 focus:ring-emerald-500">
                <label for="dataset-${ds.id}" class="flex-1 text-xs text-gray-700 cursor-pointer truncate" title="${ds.fileName}">
                    ${ds.name}
                </label>
                <button class="dataset-delete-btn text-red-600 hover:text-red-800 transition-colors p-0.5"
                        data-dataset-id="${ds.id}"
                        title="Veri setini sil">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    /**
     * Refresh dataset list without reloading entire panel
     */
    refreshDataSetList() {
        const datasetListContainer = document.getElementById('dataset-list');
        if (datasetListContainer) {
            datasetListContainer.innerHTML = this.renderDataSetList();

            // Re-attach event listeners for the new list
            this.attachDataSetEventListeners();

            console.log('🔄 Dataset list refreshed');
        }
    }

    /**
     * Attach event listeners for dataset selector (separated for refresh)
     */
    attachDataSetEventListeners() {
        // Dataset radio buttons - change active dataset
        document.querySelectorAll('input[name="dataset-selector"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked && typeof window.setActiveDataSet === 'function') {
                    window.setActiveDataSet(e.target.value);

                    // Update available fields for the new dataset
                    const dataset = window.getActiveDataSet();
                    if (dataset) {
                        this.availableFields = dataset.fields || [];
                        safeLogStyle('✅ Active dataset changed:', dataset.name);
                    }
                }
            });
        });

        // Dataset delete buttons
        document.querySelectorAll('.dataset-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const datasetId = btn.getAttribute('data-dataset-id');
                if (datasetId && typeof window.removeDataSet === 'function') {
                    if (confirm('Bu veri setini silmek istediğinizden emin misiniz?')) {
                        const removed = window.removeDataSet(datasetId);
                        if (removed) {
                            // Refresh just the dataset list
                            this.refreshDataSetList();

                            if (typeof window.showFeedback === 'function') {
                                window.showFeedback(`✅ Veri seti silindi: ${removed.name}`, 'success', 2000);
                            }
                        }
                    }
                }
            });
        });
    }

    /**
     * Show style panel
     */
    showPanel() {
        console.log('🔍 showPanel - availableFields:', this.availableFields);

        // MUTEX: Close CBS Tools Panel if open
        if (typeof window.closeToolsPanel === 'function') {
            const toolsPanel = document.getElementById('tools-panel');
            if (toolsPanel && !toolsPanel.classList.contains('hidden')) {
                window.closeToolsPanel();
            }
        }

        // Read current styles from map before showing panel
        this._syncSettingsFromMap();

        if (this.panel) {
            this.panel.remove();
        }

        const panelHTML = `
            <div id="layer-style-panel" class="fixed bottom-24 right-6 w-64 bg-white rounded-lg shadow-2xl z-[1001] border border-gray-200 overflow-hidden">
                <!-- Header -->
                <div class="bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2 flex items-center justify-between">
                    <h3 class="text-white text-sm font-semibold flex items-center space-x-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                        </svg>
                        <span>Veri Stili</span>
                    </h3>
                    <button id="style-panel-close" class="text-white hover:text-gray-200 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- Content -->
                <div class="p-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <!-- Dataset Selector -->
                    <div class="mb-3 pb-3 border-b border-gray-200">
                        <label class="text-xs text-gray-700 font-semibold block mb-1.5">Seçili Veri Seti</label>
                        <div id="dataset-list" class="space-y-1.5 mb-2 max-h-32 overflow-y-auto">
                            ${this.renderDataSetList()}
                        </div>
                        <div class="flex space-x-1.5">
                            <button id="show-selected-dataset-btn" class="flex-1 px-2 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors flex items-center justify-center space-x-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                </svg>
                                <span>Sadece Bu</span>
                            </button>
                            <button id="show-all-datasets-btn" class="flex-1 px-2 py-1.5 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors flex items-center justify-center space-x-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                                </svg>
                                <span>Tümü</span>
                            </button>
                        </div>
                    </div>

                    <!-- Tema Özellikleri -->
                    <div class="mb-3">
                        <button class="w-full flex items-center justify-between text-left font-semibold text-gray-700 text-xs py-1.5"
                                onclick="this.nextElementSibling.classList.toggle('hidden')">
                            <span>▼ Tema</span>
                        </button>
                        <div class="space-y-2 pl-1.5 mt-1.5">
                            <!-- Küme Gösterimi -->
                            <div class="flex items-center justify-between">
                                <label class="text-xs text-gray-700">Küme</label>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="cluster-toggle" class="sr-only peer" ${this.currentSettings.clusterEnabled ? 'checked' : ''}>
                                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                            </div>

                            <!-- Şeffaflık -->
                            <div>
                                <label class="text-xs text-gray-700 flex items-center justify-between mb-0.5">
                                    <span>Şeffaflık</span>
                                    <input type="number" id="opacity-value" value="${this.currentSettings.opacity}" step="0.1" min="0" max="1"
                                           class="w-14 px-1.5 py-0.5 text-xs border border-gray-300 rounded">
                                </label>
                                <input type="range" id="opacity-slider" min="0" max="1" step="0.1" value="${this.currentSettings.opacity}"
                                       class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600">
                            </div>

                            <!-- Genişlik -->
                            <div>
                                <label class="text-xs text-gray-700 block mb-0.5">Genişlik</label>
                                <input type="number" id="width-input" value="${this.currentSettings.width}" min="1" max="50"
                                       class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs">
                            </div>

                            <!-- Dolgu Rengi -->
                            <div>
                                <label class="text-xs text-gray-700 block mb-0.5">Dolgu Rengi</label>
                                <div class="flex items-center space-x-1.5">
                                    <input type="color" id="fill-color" value="${this.currentSettings.fillColor}"
                                           class="w-10 h-8 border border-gray-300 rounded cursor-pointer">
                                    <input type="text" id="fill-color-text" value="${this.currentSettings.fillColor}"
                                           class="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono">
                                </div>
                            </div>

                            <!-- Çizgi Kalınlığı -->
                            <div>
                                <label class="text-xs text-gray-700 block mb-0.5">Çizgi Kalınlığı</label>
                                <input type="number" id="stroke-width" value="${this.currentSettings.strokeWidth}" min="0" max="10"
                                       class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs">
                            </div>

                            <!-- Çizgi Rengi -->
                            <div>
                                <label class="text-xs text-gray-700 block mb-0.5">Çizgi Rengi</label>
                                <div class="flex items-center space-x-1.5">
                                    <input type="color" id="stroke-color" value="${this.currentSettings.strokeColor}"
                                           class="w-10 h-8 border border-gray-300 rounded cursor-pointer">
                                    <input type="text" id="stroke-color-text" value="${this.currentSettings.strokeColor}"
                                           class="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Yazı Özellikleri -->
                    <div class="mb-3 border-t border-gray-200 pt-3">
                        <button class="w-full flex items-center justify-between text-left font-semibold text-gray-700 text-xs py-1.5"
                                onclick="this.nextElementSibling.classList.toggle('hidden')">
                            <span>▼ Yazı</span>
                        </button>
                        <div class="space-y-2 pl-1.5 mt-1.5">
                            <!-- Yazı Alanı -->
                            <div>
                                <label class="text-xs text-gray-700 block mb-0.5">Yazı Alanı</label>
                                <select id="label-field" class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white">
                                    <option value="">-- Seçin --</option>
                                    ${this.availableFields.map(field => `
                                        <option value="${field}" ${field === this.currentSettings.labelField ? 'selected' : ''}>
                                            ${field}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <!-- Yazı Büyüklüğü -->
                            <div>
                                <label class="text-xs text-gray-700 block mb-0.5">Yazı Büyüklüğü</label>
                                <input type="number" id="label-size" value="${this.currentSettings.labelSize}" min="8" max="32"
                                       class="w-full px-2 py-1.5 border border-gray-300 rounded text-xs">
                            </div>

                            <!-- Yazı Rengi -->
                            <div>
                                <label class="text-xs text-gray-700 block mb-0.5">Yazı Rengi</label>
                                <div class="flex items-center space-x-1.5">
                                    <input type="color" id="label-color" value="${this.currentSettings.labelColor}"
                                           class="w-10 h-8 border border-gray-300 rounded cursor-pointer">
                                    <input type="text" id="label-color-text" value="${this.currentSettings.labelColor}"
                                           class="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="bg-gray-50 px-3 py-2 flex justify-end space-x-1.5 border-t border-gray-200">
                    <button id="style-reset-btn" class="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors">
                        Sıfırla
                    </button>
                    <button id="style-apply-btn" class="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors">
                        Uygula
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', panelHTML);
        this.panel = document.getElementById('layer-style-panel');
        this.isVisible = true;

        this.attachPanelEventListeners();

        // Animate in
        setTimeout(() => {
            this.panel.classList.add('animate-slideInRight');
        }, 10);

        safeLogStyle('✅ Layer style panel opened');
    }

    /**
     * Hide panel
     */
    hidePanel() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        this.isVisible = false;
    }

    /**
     * Attach event listeners to panel elements
     */
    attachPanelEventListeners() {
        // Close button
        document.getElementById('style-panel-close')?.addEventListener('click', () => this.hidePanel());

        // ===== DATASET SELECTOR =====

        // Attach dataset-specific event listeners
        this.attachDataSetEventListeners();

        // Show selected dataset button - show ONLY selected, hide others
        document.getElementById('show-selected-dataset-btn')?.addEventListener('click', () => {
            const dataset = window.getActiveDataSet();
            if (dataset) {
                // Show only this dataset, hide others
                if (typeof window.showOnlyDataSet === 'function') {
                    window.showOnlyDataSet(dataset.id);
                }

                if (typeof window.showFeedback === 'function') {
                    window.showFeedback(`👁️ Sadece gösterilen: ${dataset.name} (${dataset.markers.length} veri)`, 'info', 2000);
                }
                safeLogStyle('👁️ Showing only dataset:', dataset.name);
            } else {
                if (typeof window.showFeedback === 'function') {
                    window.showFeedback('⚠️ Seçili veri seti yok', 'warning', 2000);
                }
            }
        });

        // Show all datasets button
        document.getElementById('show-all-datasets-btn')?.addEventListener('click', () => {
            if (typeof window.showAllDataSets === 'function') {
                window.showAllDataSets();

                const totalMarkers = window.dataSets.reduce((sum, ds) => sum + ds.markers.length, 0);
                if (typeof window.showFeedback === 'function') {
                    window.showFeedback(`👁️ Tüm veri setleri gösteriliyor (${totalMarkers} veri)`, 'info', 2000);
                }
                safeLogStyle('👁️ Showing all datasets');
            }
        });

        // ===== FAST OPERATIONS - INSTANT UPDATE (GPU operations) =====

        // Cluster toggle - instant
        document.getElementById('cluster-toggle')?.addEventListener('change', () => {
            this.applySettingsInstant();
        });

        // Opacity slider sync + instant update
        const opacitySlider = document.getElementById('opacity-slider');
        const opacityValue = document.getElementById('opacity-value');
        if (opacitySlider && opacityValue) {
            opacitySlider.addEventListener('input', (e) => {
                opacityValue.value = e.target.value;
                this.applySettingsInstant(); // Instant update
            });
            opacityValue.addEventListener('input', (e) => {
                opacitySlider.value = e.target.value;
                this.applySettingsInstant(); // Instant update
            });
        }

        // Width - instant update
        // Width - instant update (use change tracking to avoid spinner click issues)
        const widthInput = document.getElementById('width-input');
        if (widthInput) {
            let lastWidth = widthInput.value;
            widthInput.addEventListener('input', () => {
                if (widthInput.value !== lastWidth && widthInput.value !== '') {
                    lastWidth = widthInput.value;
                    this.applySettingsInstant();
                }
            });
            widthInput.addEventListener('change', () => {
                if (widthInput.value !== lastWidth) {
                    lastWidth = widthInput.value;
                    this.applySettingsInstant();
                }
            });
        }

        // Stroke width - instant update (use 'change' to avoid spinner click issues)
        const strokeWidthInput = document.getElementById('stroke-width');
        if (strokeWidthInput) {
            // Use both change and input, but input only when value actually changes
            let lastStrokeWidth = strokeWidthInput.value;
            strokeWidthInput.addEventListener('input', () => {
                if (strokeWidthInput.value !== lastStrokeWidth && strokeWidthInput.value !== '') {
                    lastStrokeWidth = strokeWidthInput.value;
                    this.applySettingsInstant();
                }
            });
            strokeWidthInput.addEventListener('change', () => {
                if (strokeWidthInput.value !== lastStrokeWidth) {
                    lastStrokeWidth = strokeWidthInput.value;
                    this.applySettingsInstant();
                }
            });
        }

        // Color pickers - instant update with sync
        this.syncColorPickerWithInstantUpdate('fill-color', 'fill-color-text');
        this.syncColorPickerWithInstantUpdate('stroke-color', 'stroke-color-text');

        // ===== SLOW OPERATIONS - DEBOUNCED UPDATE (DOM/Canvas operations) =====

        // Label field - debounced (creates/removes many labels)
        document.getElementById('label-field')?.addEventListener('change',
            this.debounce(() => this.applySettingsInstant(), this.labelDebounceDelay)
        );

        // Label size - debounced
        document.getElementById('label-size')?.addEventListener('input',
            this.debounce(() => this.applySettingsInstant(), this.labelDebounceDelay)
        );

        // Label color - debounced
        this.syncColorPickerWithDebounce('label-color', 'label-color-text');

        // ===== BUTTONS =====

        // Apply button (still available for manual apply)
        document.getElementById('style-apply-btn')?.addEventListener('click', () => this.applySettings());

        // Reset button
        document.getElementById('style-reset-btn')?.addEventListener('click', () => this.resetSettings());
    }

    /**
     * Sync color picker with text input - INSTANT UPDATE
     */
    syncColorPickerWithInstantUpdate(colorId, textId) {
        const colorInput = document.getElementById(colorId);
        const textInput = document.getElementById(textId);

        if (colorInput && textInput) {
            colorInput.addEventListener('input', (e) => {
                textInput.value = e.target.value;
                this.applySettingsInstant(); // Instant update
            });
            textInput.addEventListener('input', (e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    colorInput.value = e.target.value;
                    this.applySettingsInstant(); // Instant update
                }
            });
        }
    }

    /**
     * Sync color picker with text input - DEBOUNCED UPDATE
     */
    syncColorPickerWithDebounce(colorId, textId) {
        const colorInput = document.getElementById(colorId);
        const textInput = document.getElementById(textId);

        const debouncedUpdate = this.debounce(() => this.applySettingsInstant(), this.labelDebounceDelay);

        if (colorInput && textInput) {
            colorInput.addEventListener('input', (e) => {
                textInput.value = e.target.value;
                debouncedUpdate();
            });
            textInput.addEventListener('input', (e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    colorInput.value = e.target.value;
                    debouncedUpdate();
                }
            });
        }
    }

    /**
     * Apply settings instantly (no feedback message)
     */
    applySettingsInstant() {
        // Get current values with proper validation
        const strokeWidthValue = parseInt(document.getElementById('stroke-width')?.value);
        const widthValue = parseInt(document.getElementById('width-input')?.value);
        const opacityValue = parseFloat(document.getElementById('opacity-value')?.value);
        const labelSizeValue = parseInt(document.getElementById('label-size')?.value);
        
        this.currentSettings = {
            clusterEnabled: document.getElementById('cluster-toggle')?.checked,
            opacity: isNaN(opacityValue) ? this.currentSettings.opacity : opacityValue,
            width: isNaN(widthValue) ? this.currentSettings.width : widthValue,
            fillColor: document.getElementById('fill-color')?.value || '#3b82f6',
            strokeWidth: isNaN(strokeWidthValue) ? this.currentSettings.strokeWidth : strokeWidthValue,
            strokeColor: document.getElementById('stroke-color')?.value || '#000000',
            labelField: document.getElementById('label-field')?.value || '',
            labelSize: isNaN(labelSizeValue) ? this.currentSettings.labelSize : labelSizeValue,
            labelColor: document.getElementById('label-color')?.value || '#000000'
        };

        safeLogStyle('⚡ Instant update:', this.currentSettings);

        // Apply to map
        this.updateMapStyles();
    }

    /**
     * Apply settings to map
     */
    applySettings() {
        // Get current values with proper validation
        const strokeWidthValue = parseInt(document.getElementById('stroke-width')?.value);
        const widthValue = parseInt(document.getElementById('width-input')?.value);
        const opacityValue = parseFloat(document.getElementById('opacity-value')?.value);
        const labelSizeValue = parseInt(document.getElementById('label-size')?.value);
        
        this.currentSettings = {
            clusterEnabled: document.getElementById('cluster-toggle')?.checked,
            opacity: isNaN(opacityValue) ? this.currentSettings.opacity : opacityValue,
            width: isNaN(widthValue) ? this.currentSettings.width : widthValue,
            fillColor: document.getElementById('fill-color')?.value || '#3b82f6',
            strokeWidth: isNaN(strokeWidthValue) ? this.currentSettings.strokeWidth : strokeWidthValue,
            strokeColor: document.getElementById('stroke-color')?.value || '#000000',
            labelField: document.getElementById('label-field')?.value || '',
            labelSize: isNaN(labelSizeValue) ? this.currentSettings.labelSize : labelSizeValue,
            labelColor: document.getElementById('label-color')?.value || '#000000'
        };

        safeLogStyle('✅ Applying settings:', this.currentSettings);

        // Apply to map
        this.updateMapStyles();

        // Show feedback
        if (typeof window.showFeedback === 'function') {
            window.showFeedback('✅ Stil ayarları uygulandı!', 'success', 2000);
        }
    }

    /**
     * Reset to default settings
     */
    resetSettings() {
        this.currentSettings = {
            clusterEnabled: true,
            opacity: 0.9,
            width: 2,  // Small default for better visibility
            fillColor: '#3b82f6',
            strokeWidth: 1,
            strokeColor: '#000000',
            labelField: '',
            labelSize: 16,
            labelColor: '#000000'
        };

        this.hidePanel();
        this.showPanel();

        safeLogStyle('✅ Settings reset to defaults');
    }

    /**
     * Sync current settings from map's actual paint properties
     * @private
     */
    _syncSettingsFromMap() {
        const map = window.map;
        if (!map) {
            safeLogStyle('⚠️ _syncSettingsFromMap: map not found');
            return;
        }

        try {
            // Try to read from unclustered-point layer (most common)
            if (map.getLayer('unclustered-point')) {
                const radius = map.getPaintProperty('unclustered-point', 'circle-radius');
                const color = map.getPaintProperty('unclustered-point', 'circle-color');
                const opacity = map.getPaintProperty('unclustered-point', 'circle-opacity');
                const strokeWidth = map.getPaintProperty('unclustered-point', 'circle-stroke-width');
                const strokeColor = map.getPaintProperty('unclustered-point', 'circle-stroke-color');

                safeLogStyle('🔍 Raw values from map:', { radius, color, opacity, strokeWidth, strokeColor });

                // Only update if we got valid values (not expressions)
                if (typeof radius === 'number') this.currentSettings.width = radius;
                if (typeof color === 'string') this.currentSettings.fillColor = color;
                if (typeof opacity === 'number') this.currentSettings.opacity = opacity;
                if (typeof strokeWidth === 'number') this.currentSettings.strokeWidth = strokeWidth;
                if (typeof strokeColor === 'string') this.currentSettings.strokeColor = strokeColor;

                safeLogStyle('🔄 Synced settings from map:', this.currentSettings);
            } else {
                safeLogStyle('⚠️ _syncSettingsFromMap: unclustered-point layer not found, using defaults');
            }
        } catch (error) {
            safeLogStyle('⚠️ Could not sync settings from map:', error.message);
        }
    }

    /**
     * Update map styles based on current settings
     */
    updateMapStyles() {
        const map = window.map;
        if (!map) return;

        try {
            // 1. Update cluster visibility
            // Küme gösterimi KAPALI ise: source'u cluster:false ile yeniden oluştur
            // Küme gösterimi AÇIK ise: source'u cluster:true ile yeniden oluştur

            if (this.currentSettings.clusterEnabled) {
                // Clustering enabled: ensure source has cluster:true
                this._ensureClusteredSource();

                // Show cluster layers
                if (map.getLayer('clusters')) {
                    map.setLayoutProperty('clusters', 'visibility', 'visible');
                }
                if (map.getLayer('cluster-count')) {
                    map.setLayoutProperty('cluster-count', 'visibility', 'visible');
                }
                if (map.getLayer('unclustered-point')) {
                    map.setLayoutProperty('unclustered-point', 'visibility', 'visible');
                    // Restore original filter (only unclustered points)
                    map.setFilter('unclustered-point', ['!', ['has', 'point_count']]);
                }
            } else {
                // Clustering disabled: recreate source with cluster:false
                this._ensureNonClusteredSource();

                // Hide cluster layers
                if (map.getLayer('clusters')) {
                    map.setLayoutProperty('clusters', 'visibility', 'none');
                }
                if (map.getLayer('cluster-count')) {
                    map.setLayoutProperty('cluster-count', 'visibility', 'none');
                }
                // Show all points layer
                if (map.getLayer('unclustered-point')) {
                    map.setLayoutProperty('unclustered-point', 'visibility', 'visible');
                    // No filter needed since source doesn't cluster
                    map.setFilter('unclustered-point', null);
                }
            }

            // 2. Update cluster point colors and size
            if (map.getLayer('unclustered-point')) {
                map.setPaintProperty('unclustered-point', 'circle-color', this.currentSettings.fillColor);
                map.setPaintProperty('unclustered-point', 'circle-radius', this.currentSettings.width);  // ADDED: Width update
                map.setPaintProperty('unclustered-point', 'circle-opacity', this.currentSettings.opacity);
                map.setPaintProperty('unclustered-point', 'circle-stroke-color', this.currentSettings.strokeColor);
                map.setPaintProperty('unclustered-point', 'circle-stroke-width', this.currentSettings.strokeWidth);
            }

            // 3. Update polygon fill (catalog geometries)
            if (map.getLayer('catalog-polygons')) {
                // Set default fill color for all polygons
                map.setPaintProperty('catalog-polygons', 'fill-color', this.currentSettings.fillColor);
                map.setPaintProperty('catalog-polygons', 'fill-opacity', this.currentSettings.opacity * 0.3); // 30% of opacity
            }

            // 4. Update polygon outlines
            if (map.getLayer('catalog-polygon-outlines')) {
                map.setPaintProperty('catalog-polygon-outlines', 'line-color', this.currentSettings.strokeColor);
                map.setPaintProperty('catalog-polygon-outlines', 'line-width', this.currentSettings.strokeWidth);
                map.setPaintProperty('catalog-polygon-outlines', 'line-opacity', this.currentSettings.opacity);
            }

            // 5. Update dashed polygon outlines (circles)
            if (map.getLayer('catalog-polygon-outlines-dashed')) {
                map.setPaintProperty('catalog-polygon-outlines-dashed', 'line-color', this.currentSettings.strokeColor);
                map.setPaintProperty('catalog-polygon-outlines-dashed', 'line-width', this.currentSettings.strokeWidth);
                map.setPaintProperty('catalog-polygon-outlines-dashed', 'line-opacity', this.currentSettings.opacity);
            }

            // 6. Update line strings
            if (map.getLayer('catalog-lines')) {
                map.setPaintProperty('catalog-lines', 'line-color', this.currentSettings.strokeColor);
                map.setPaintProperty('catalog-lines', 'line-width', this.currentSettings.width);
                map.setPaintProperty('catalog-lines', 'line-opacity', this.currentSettings.opacity);
            }

            // 7. Update HTML marker opacity (for point markers)
            if (window.markerManager && window.markerManager.markers) {
                window.markerManager.markers.forEach(marker => {
                    if (marker._element) {
                        marker._element.style.opacity = this.currentSettings.opacity;
                    }
                });
            }

            // 8. Update labels for imported data
            if (this.currentSettings.labelField) {
                // Use basic labels for user markers (imported data)
                this.updateBasicLabels();
            } else {
                // Clear labels if no field selected
                this.clearDataLabels();
            }

            safeLogStyle('✅ Map styles updated:', this.currentSettings);
        } catch (error) {
            console.error('Error updating map styles:', error);
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('⚠️ Bazı stiller uygulanamadı', 'warning', 2000);
            }
        }
    }

    /**
     * Clear data labels
     */
    clearDataLabels() {
        const map = window.map;
        if (!map) return;

        try {
            if (map.getLayer('user-data-labels')) {
                map.removeLayer('user-data-labels');
            }
            if (map.getSource('user-data-labels')) {
                map.removeSource('user-data-labels');
            }
            safeLogStyle('✅ Data labels cleared');
        } catch (error) {
            console.error('Error clearing labels:', error);
        }
    }

    /**
     * Update basic labels for imported data using MapLibre symbol layer
     */
    updateBasicLabels() {
        const map = window.map;
        if (!map || !window.userMarkers || !this.currentSettings.labelField) return;

        try {
            safeLogStyle(`🏷️ Creating labels for field: "${this.currentSettings.labelField}"`);

            // Create GeoJSON features for labels
            const features = [];
            let foundCount = 0;
            let notFoundCount = 0;

            window.userMarkers.forEach((marker, index) => {
                // Try to get label text from properties first, then from marker itself
                let labelText = null;

                if (marker.properties && this.currentSettings.labelField in marker.properties) {
                    labelText = marker.properties[this.currentSettings.labelField];
                } else if (this.currentSettings.labelField in marker) {
                    labelText = marker[this.currentSettings.labelField];
                }

                // Debug first 3 markers
                if (index < 3) {
                    safeLogStyle(`📍 Marker ${index}:`, {
                        field: this.currentSettings.labelField,
                        labelText: labelText,
                        hasProperties: !!marker.properties,
                        propertiesKeys: marker.properties ? Object.keys(marker.properties).join(', ') : 'none',
                        markerKeys: Object.keys(marker).filter(k => !['properties', 'geometry'].includes(k)).join(', ')
                    });
                }

                if (!labelText || labelText === '') {
                    notFoundCount++;
                    return;
                }

                foundCount++;

                // Only create labels for point markers (not geometries)
                if (marker.lat && marker.lon) {
                    features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [marker.lon, marker.lat]
                        },
                        properties: {
                            label: String(labelText)
                        }
                    });
                }
            });

            const labelGeoJSON = {
                type: 'FeatureCollection',
                features: features
            };

            // Update or create label source and layer
            if (map.getSource('user-data-labels')) {
                map.getSource('user-data-labels').setData(labelGeoJSON);
            } else {
                map.addSource('user-data-labels', {
                    type: 'geojson',
                    data: labelGeoJSON
                });

                map.addLayer({
                    id: 'user-data-labels',
                    type: 'symbol',
                    source: 'user-data-labels',
                    layout: {
                        'text-field': ['get', 'label'],
                        'text-font': ['Noto Sans Regular'],
                        'text-size': this.currentSettings.labelSize,
                        'text-offset': [0, -1.5],
                        'text-anchor': 'bottom',
                        'text-allow-overlap': false,
                        'text-ignore-placement': false
                    },
                    paint: {
                        'text-color': this.currentSettings.labelColor,
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 1
                    }
                });
            }

            // Update text properties if layer exists
            if (map.getLayer('user-data-labels')) {
                map.setLayoutProperty('user-data-labels', 'text-size', this.currentSettings.labelSize);
                map.setPaintProperty('user-data-labels', 'text-color', this.currentSettings.labelColor);
            }

            safeLogStyle(`✅ Labels updated: ${features.length} labels created (found: ${foundCount}, not found: ${notFoundCount})`);
        } catch (error) {
            console.error('Error creating labels:', error);
        }
    }

    /**
     * Ensure markers source has cluster:true
     * @private
     */
    _ensureClusteredSource() {
        const map = window.map;
        if (!map) return;

        // Check if already in clustered mode (avoid unnecessary recreation)
        if (window._markersSourceClusterState === true) {
            return; // Already clustered, no need to recreate
        }

        try {
            const source = map.getSource('markers');
            if (!source) return;

            // Get current source data before recreating (safely)
            let sourceData = { type: 'FeatureCollection', features: [] };
            try {
                const currentData = source._data;
                if (currentData && currentData.features && Array.isArray(currentData.features)) {
                    sourceData = currentData;
                }
            } catch (e) {
                safeLogStyle('⚠️ Could not access clustered source data');
            }

            // Remove layers that use this source
            ['clusters', 'cluster-count', 'unclustered-point'].forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.removeLayer(layerId);
                }
            });

            // Remove and recreate source with cluster:true
            map.removeSource('markers');
            map.addSource('markers', {
                type: 'geojson',
                data: sourceData,
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50
            });

            // Recreate layers with fixed configuration
            if (!map.getLayer('clusters')) {
                map.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'markers',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
                        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
                    }
                });
            }

            if (!map.getLayer('cluster-count')) {
                map.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'markers',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': ['get', 'point_count_abbreviated'],
                        'text-font': ['Noto Sans Regular'],
                        'text-size': 12
                    },
                    paint: { 'text-color': '#ffffff' }
                });
            }

            if (!map.getLayer('unclustered-point')) {
                map.addLayer({
                    id: 'unclustered-point',
                    type: 'circle',
                    source: 'markers',
                    filter: ['!', ['has', 'point_count']],
                    paint: {
                        'circle-color': this.currentSettings.fillColor,
                        'circle-radius': this.currentSettings.width,
                        'circle-stroke-width': this.currentSettings.strokeWidth,
                        'circle-stroke-color': this.currentSettings.strokeColor,
                        'circle-opacity': this.currentSettings.opacity
                    }
                });
            }

            // Mark as clustered
            window._markersSourceClusterState = true;
            safeLogStyle('✅ Clustered source ensured');
        } catch (error) {
            console.error('Error ensuring clustered source:', error);
        }
    }

    /**
     * Ensure markers source has cluster:false to show all points at any zoom
     * @private
     */
    _ensureNonClusteredSource() {
        const map = window.map;
        if (!map) return;

        // Check if already in non-clustered mode (avoid unnecessary recreation)
        if (window._markersSourceClusterState === false) {
            return; // Already non-clustered, no need to recreate
        }

        try {
            const source = map.getSource('markers');
            if (!source) return;

            // Get current source data before recreating (safely)
            let sourceData = { type: 'FeatureCollection', features: [] };
            try {
                const currentData = source._data;
                if (currentData && currentData.features && Array.isArray(currentData.features)) {
                    sourceData = currentData;
                }
            } catch (e) {
                safeLogStyle('⚠️ Could not access non-clustered source data');
            }

            // Remove layers that use this source
            ['clusters', 'cluster-count', 'unclustered-point'].forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.removeLayer(layerId);
                }
            });

            // Remove and recreate source WITHOUT clustering
            map.removeSource('markers');
            map.addSource('markers', {
                type: 'geojson',
                data: sourceData,
                cluster: false  // This is the key: disable clustering entirely
            });

            // Recreate layers with fixed configuration (clusters will be hidden but structure remains for switching back)
            if (!map.getLayer('clusters')) {
                map.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'markers',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
                        'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
                    }
                });
            }

            if (!map.getLayer('cluster-count')) {
                map.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'markers',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': ['get', 'point_count_abbreviated'],
                        'text-font': ['Noto Sans Regular'],
                        'text-size': 12
                    },
                    paint: { 'text-color': '#ffffff' }
                });
            }

            if (!map.getLayer('unclustered-point')) {
                map.addLayer({
                    id: 'unclustered-point',
                    type: 'circle',
                    source: 'markers',
                    // No filter property - show ALL points since source doesn't cluster
                    paint: {
                        'circle-color': this.currentSettings.fillColor,
                        'circle-radius': this.currentSettings.width,
                        'circle-stroke-width': this.currentSettings.strokeWidth,
                        'circle-stroke-color': this.currentSettings.strokeColor,
                        'circle-opacity': this.currentSettings.opacity
                    }
                });
            }

            // Mark as non-clustered
            window._markersSourceClusterState = false;
            safeLogStyle('✅ Non-clustered source ensured - all points will be visible at any zoom');
        } catch (error) {
            console.error('Error ensuring non-clustered source:', error);
        }
    }
}

// Export class for instantiation
window.LayerStylePanel = LayerStylePanel;

// Create global singleton instance
window.layerStylePanel = new LayerStylePanel();
