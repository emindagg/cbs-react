/**
 * LayerPanel - Katman yönetimi UI bileşeni
 * Kullanıcı katman seçimi ve şeffaflık ayarları
 */
class LayerPanel {
    constructor(layerManager, eventBus) {
        this.layerManager = layerManager;
        this.eventBus = eventBus;

        this.panel = null;
        this.isOpen = false;

        this.initialize();
    }

    /**
     * Başlatma
     */
    initialize() {
        this.createPanel();
        this.setupEventListeners();
        this.setupSidebarSync();
    }

    /**
     * Sidebar ile senkronizasyon
     */
    setupSidebarSync() {
        const sidebar = document.getElementById('sidebar');

        if (!sidebar) return;

        // MutationObserver ile sidebar class değişikliklerini dinle
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isSidebarOpen = !sidebar.classList.contains('hidden');

                    // Panele class ekle/çıkar
                    if (isSidebarOpen) {
                        if (this.panel) {
                            this.panel.classList.add('sidebar-open');
                        }
                    } else {
                        if (this.panel) {
                            this.panel.classList.remove('sidebar-open');
                        }
                    }
                }
            });
        });

        // Sidebar'ı gözlemle
        observer.observe(sidebar, {
            attributes: true,
            attributeFilter: ['class']
        });

        // İlk durumu ayarla
        const isSidebarOpen = !sidebar.classList.contains('hidden');
        if (isSidebarOpen) {
            if (this.panel) {
                this.panel.classList.add('sidebar-open');
            }
        }
    }

    /**
     * Panel HTML'i oluştur
     */
    createPanel() {
        // Panel container
        const panel = document.createElement('div');
        panel.id = 'layers-panel';
        panel.className = 'layers-panel';
        panel.style.display = 'none';

        // Panel içeriği (Tailwind minimal tasarım)
        panel.innerHTML = `
            <div class="p-3 border-b border-gray-200 flex justify-between items-center">
                <h2 class="text-lg font-semibold text-gray-800">Katmanlar</h2>
                <button id="layers-panel-close" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div id="layers-panel-content"></div>
        `;

        // Sayfaya ekle
        document.body.appendChild(panel);

        // Katman listesini oluştur
        const content = document.getElementById('layers-panel-content');
        this.renderLayerList(content);

        this.panel = panel;
    }

    /**
     * Katman listesini render et
     */
    renderLayerList(container) {
        const layers = this.layerManager.getAvailableLayers();

        const listHtml = layers.map(layer => {
            const isActive = this.layerManager.loadedLayers.has(layer.id);
            const isChecked = isActive && layer.visible;
            const opacity = layer.opacity * 100;
            const sliderClasses = isChecked
                ? 'opacity-slider-container max-h-16 opacity-100 pt-1.5 overflow-hidden transition-all duration-300 ease-in-out'
                : 'opacity-slider-container max-h-0 opacity-0 overflow-hidden transition-all duration-300 ease-in-out';

            return `
                <div class="border-b border-gray-200 last:border-b-0 px-3 py-1.5" data-layer-id="${layer.id}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <input type="color" value="${layer.color}" class="color-picker-input flex-shrink-0" style="background-color: ${layer.color};">
                            <span class="text-sm font-medium text-gray-700">${layer.name}</span>
                        </div>
                        <label class="toggle-label flex items-center cursor-pointer">
                            <input type="checkbox" class="toggle-checkbox" ${isChecked ? 'checked' : ''}>
                            <span class="toggle-bg"></span>
                        </label>
                    </div>
                    <div class="${sliderClasses}">
                        <div class="flex items-center space-x-2 pl-5">
                            <input type="range" min="0" max="100" value="${opacity}" class="opacity-slider flex-1">
                            <span class="text-xs font-medium text-gray-600 w-9 text-right opacity-label">${Math.round(opacity)}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = listHtml;
    }

    /**
     * Throttle fonksiyonu - performans için
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Event listener'ları ayarla
     */
    setupEventListeners() {
        // Event delegation kullanarak sadece layers-panel içindeki eventleri dinle
        document.addEventListener('click', (e) => {
            // Panel kapatma butonu
            if (e.target.closest('#layers-panel-close')) {
                this.closePanel();
            }
        });

        // Katman toggle - sadece layers-panel içindeki toggle'ları dinle
        document.addEventListener('change', (e) => {
            const toggleCheckbox = e.target.closest('#layers-panel .toggle-checkbox');
            if (toggleCheckbox) {
                // Parent div'den layerId al
                const layerItem = toggleCheckbox.closest('[data-layer-id]');
                if (!layerItem) {
                    console.warn('Layer item not found for toggle');
                    return;
                }

                const layerId = layerItem.dataset.layerId;
                const isChecked = toggleCheckbox.checked;

                // Kontrolleri göster/gizle
                const controls = layerItem.querySelector('.opacity-slider-container');
                if (!controls) return;

                // requestAnimationFrame ile smooth animasyon
                requestAnimationFrame(() => {
                    if (isChecked) {
                        controls.classList.remove('max-h-0', 'opacity-0');
                        controls.classList.add('max-h-16', 'opacity-100', 'pt-1.5');
                        this.eventBus.emit('layer:load', { layerId });
                    } else {
                        controls.classList.add('max-h-0', 'opacity-0');
                        controls.classList.remove('max-h-16', 'opacity-100', 'pt-1.5');
                        this.eventBus.emit('layer:remove', { layerId });
                    }
                });
            }
        });

        // Şeffaflık slider - throttled ve optimized
        const handleOpacityChange = this.throttle((e) => {
            const opacitySlider = e.target.closest('#layers-panel .opacity-slider');
            if (opacitySlider) {
                // Parent div'den layerId al
                const layerItem = opacitySlider.closest('[data-layer-id]');
                if (!layerItem) return;

                const layerId = layerItem.dataset.layerId;
                const opacity = parseFloat(opacitySlider.value) / 100;

                // Değer göstergesini güncelle (UI update - throttled değil)
                const valueSpan = layerItem.querySelector('.opacity-label');
                if (valueSpan) {
                    valueSpan.textContent = `${Math.round(opacitySlider.value)}%`;
                }

                // Opacity değişikliğini emit et (harita update - throttled)
                this.eventBus.emit('layer:opacity-change', { layerId, opacity });
            }
        }, 16); // ~60fps

        // Değer göstergesi için ayrı, throttled olmayan handler
        document.addEventListener('input', (e) => {
            const opacitySlider = e.target.closest('#layers-panel .opacity-slider');
            if (opacitySlider) {
                const layerItem = opacitySlider.closest('[data-layer-id]');
                if (layerItem) {
                    const valueSpan = layerItem.querySelector('.opacity-label');
                    if (valueSpan) {
                        valueSpan.textContent = `${Math.round(opacitySlider.value)}%`;
                    }
                }
                // Harita güncellemesi için throttled handler'ı çağır
                handleOpacityChange(e);
            }
        }, { passive: true });

        // Renk değiştirme - optimized
        document.addEventListener('input', (e) => {
            const colorPicker = e.target.closest('#layers-panel .color-picker-input');
            if (colorPicker) {
                // Parent div'den layerId al
                const layerItem = colorPicker.closest('[data-layer-id]');
                if (!layerItem) return;

                const layerId = layerItem.dataset.layerId;
                const color = colorPicker.value;

                // Input'un arkaplan rengini requestAnimationFrame ile güncelle
                requestAnimationFrame(() => {
                    colorPicker.style.backgroundColor = color;
                });

                // Renk değişikliğini emit et
                this.eventBus.emit('layer:color-change', { layerId, color });
            }
        }, { passive: true });

        // Katman yükleme durumunu dinle
        this.eventBus.on('layer:loading', (data) => {
            this.showLoadingIndicator(data.layerId);
        });

        this.eventBus.on('layer:loaded', (data) => {
            this.hideLoadingIndicator(data.layerId);
            this.updateLayerControls(data.layerId);
        });

        this.eventBus.on('layer:error', (data) => {
            this.hideLoadingIndicator(data.layerId);
            this.showError(data.message);
        });

        this.eventBus.on('layer:removed', (data) => {
            this.updateLayerControls(data.layerId);
        });
    }

    /**
     * Paneli aç
     */
    openPanel() {
        if (this.panel) {
            // requestAnimationFrame ile smooth açılış
            requestAnimationFrame(() => {
                this.panel.style.display = 'flex';
                this.isOpen = true;

                // Katman listesini güncelle
                const content = document.getElementById('layers-panel-content');
                this.renderLayerList(content);
            });
        }
    }

    /**
     * Paneli kapat
     */
    closePanel() {
        if (this.panel) {
            // requestAnimationFrame ile smooth kapanış
            requestAnimationFrame(() => {
                this.panel.style.display = 'none';
                this.isOpen = false;
            });
        }
    }

    /**
     * Panel açık/kapalı durumunu değiştir
     */
    togglePanel() {
        if (this.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    /**
     * Yükleniyor göstergesini göster
     */
    showLoadingIndicator(layerId) {
        const layerItem = document.querySelector(`[data-layer-id="${layerId}"]`);
        if (layerItem) {
            const checkbox = layerItem.querySelector('.toggle-checkbox');
            checkbox.disabled = true;

            const nameSpan = layerItem.querySelector('.font-medium');
            nameSpan.innerHTML += ' <i class="fa-solid fa-spinner fa-spin"></i>';
        }
    }

    /**
     * Yükleniyor göstergesini gizle
     */
    hideLoadingIndicator(layerId) {
        const layerItem = document.querySelector(`[data-layer-id="${layerId}"]`);
        if (layerItem) {
            const checkbox = layerItem.querySelector('.toggle-checkbox');
            checkbox.disabled = false;

            const nameSpan = layerItem.querySelector('.font-medium');
            const spinner = nameSpan.querySelector('.fa-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    /**
     * Katman kontrollerini güncelle
     */
    updateLayerControls(layerId) {
        const layerItem = document.querySelector(`[data-layer-id="${layerId}"]`);
        if (!layerItem) return;

        const isLoaded = this.layerManager.loadedLayers.has(layerId);
        const controls = layerItem.querySelector('.opacity-slider-container');

        if (!controls) return;

        // requestAnimationFrame ile smooth class değişiklikleri
        requestAnimationFrame(() => {
            if (isLoaded) {
                controls.classList.remove('max-h-0', 'opacity-0');
                controls.classList.add('max-h-16', 'opacity-100', 'pt-1.5');
            } else {
                controls.classList.add('max-h-0', 'opacity-0');
                controls.classList.remove('max-h-16', 'opacity-100', 'pt-1.5');
            }
        });
    }

    /**
     * Hata mesajı göster
     */
    showError(message) {
        // Basit alert kullan (daha sonra dialog-manager ile değiştirilebilir)
        alert(message);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayerPanel;
}
