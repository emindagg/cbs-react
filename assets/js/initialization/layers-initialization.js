/**
 * Layers Initialization
 * Katman yönetimi sistemini başlatır
 */

function initializeLayers() {
    const safeLog = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
    const safeError = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

    // Harita yüklendiğinde başlat
    if (!window.map) {
        safeError('❌ Map not initialized. Cannot initialize layers.');
        return;
    }

    // EventBus ve StateManager'a erişim
    let eventBus, stateManager;

    if (window.app && window.app.events && window.app.state) {
        eventBus = window.app.events;
        stateManager = window.app.state;
    } else {
        // Fallback: basit event bus ve state manager oluştur
        safeLog('⚠️ ApplicationCore not available, creating simple event system');

        // Basit EventBus
        eventBus = {
            listeners: {},
            on: function(event, callback) {
                if (!this.listeners[event]) {
                    this.listeners[event] = [];
                }
                this.listeners[event].push(callback);
            },
            emit: function(event, data) {
                if (this.listeners[event]) {
                    this.listeners[event].forEach(callback => callback(data));
                }
            }
        };

        // Basit StateManager
        stateManager = {
            state: {},
            get: function(path) {
                const keys = path.split('.');
                let value = this.state;
                for (const key of keys) {
                    value = value?.[key];
                }
                return value;
            },
            set: function(path, value) {
                const keys = path.split('.');
                const lastKey = keys.pop();
                let obj = this.state;
                for (const key of keys) {
                    if (!obj[key]) obj[key] = {};
                    obj = obj[key];
                }
                obj[lastKey] = value;
            }
        };
    }

    safeLog('Initializing layers system...');

    // LayerManager'ı başlat
    const layerManager = new LayerManager(window.map, eventBus, stateManager);

    // LayerPanel'i başlat
    const layerPanel = new LayerPanel(layerManager, eventBus);

    // Buton event handler'ı
    const layersToggleBtn = document.getElementById('layers-toggle-btn');

    if (layersToggleBtn) {
        layersToggleBtn.addEventListener('click', () => {
            // Katman paneli açılacaksa, altlık harita panelini kapat
            if (!layerPanel.isOpen) {
                const basemapPanel = document.getElementById('basemap-panel');
                if (basemapPanel && !basemapPanel.classList.contains('hidden')) {
                    basemapPanel.classList.add('hidden');
                }
            }
            
            layerPanel.togglePanel();

            // Buton active durumunu değiştir
            if (layerPanel.isOpen) {
                layersToggleBtn.classList.add('active');
            } else {
                layersToggleBtn.classList.remove('active');
            }
        });
    }

    // Globe toggle butonu event handler'ı
    const globeToggleBtn = document.getElementById('globe-toggle-btn');
    
    if (globeToggleBtn) {
        globeToggleBtn.addEventListener('click', () => {
            if (typeof window.GlobeView !== 'undefined') {
                const map = window.map?.map || window.map;
                if (map) {
                    window.GlobeView.toggle(map);
                    
                    const btnText = globeToggleBtn.querySelector('.globe-btn-text');
                    
                    // Buton active durumunu ve yazısını güncelle
                    if (window.GlobeView.isActive) {
                        globeToggleBtn.classList.add('active');
                        if (btnText) btnText.textContent = '3D';
                    } else {
                        globeToggleBtn.classList.remove('active');
                        if (btnText) btnText.textContent = '2D';
                    }
                }
            } else {
                safeError('❌ GlobeView modülü bulunamadı');
            }
        });
    }

    // Global olarak erişilebilir yap
    window.layerManager = layerManager;
    window.layerPanel = layerPanel;

    safeLog('✅ Layers system initialized successfully');

    return {
        layerManager,
        layerPanel
    };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeLayers };
}
