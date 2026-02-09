/**
 * LayerManager - Katman yönetimi sistemi
 * Shapefile ve diğer vektör katmanları yönetir
 */
class LayerManager {
    constructor(map, eventBus, stateManager) {
        this.map = map;
        this.eventBus = eventBus;
        this.stateManager = stateManager;

        // ----------------------------------------------------------
        // VERİ KAYNAĞI AYARLARI
        // ----------------------------------------------------------
        // 'local': Dosyaları ./katmanverisi/ klasöründen çeker
        // 'remote': Dosyaları GitHub/CDN üzerinden çeker
        this.dataSourceMode = 'remote'; 

        // GitHub Repo Bilgileri (Sadece 'remote' modunda kullanılır)
        // Örnek: https://cdn.jsdelivr.net/gh/KULLANICI_ADI/REPO_ADI@main/
        this.remoteBaseUrl = 'https://cdn.jsdelivr.net/gh/emindagg/katman_verisi/';
        
        // Seçilen moda göre base path'i ayarla
        this.layerBasePath = this.dataSourceMode === 'remote' 
            ? this.remoteBaseUrl 
            : './katmanverisi/';
        // ----------------------------------------------------------

        // Mevcut katmanlar
        this.availableLayers = [
            {
                id: 'akarsular',
                name: 'Akarsular',
                file: 'akarsular.zip',
                fileType: 'zip',
                type: 'line',
                color: '#0066cc',
                visible: false,
                opacity: 0.9
            },
            {
                id: 'sular',
                name: 'Sular',
                file: 'sular.zip',
                fileType: 'zip',
                type: 'fill',
                color: '#4da6ff',
                visible: false,
                opacity: 0.6
            },
            {
                id: 'ulasim',
                name: 'Ulaşım',
                file: 'ulasim.zip',
                fileType: 'zip',
                type: 'line',
                color: '#ff6600',
                visible: false,
                opacity: 0.8
            },
            {
                id: 'dfy',
                name: 'Türkiye Diri Fay Haritası',
                file: 'diri_fay.zip',
                fileType: 'zip',
                type: 'fill',
                color: '#33cc33',
                visible: false,
                opacity: 0.6
            }
        ];

        // Yüklenen katmanlar
        this.loadedLayers = new Map();

        this.initialize();
    }

    /**
     * Başlatma
     */
    initialize() {
        // State'i ayarla
        if (!this.stateManager.get('layers')) {
            this.stateManager.set('layers', {
                available: this.availableLayers,
                active: []
            });
        }

        // Event listener'ları kaydet
        this.setupEventListeners();
    }

    /**
     * Event listener'ları ayarla
     */
    setupEventListeners() {
        // Katman yükleme isteği
        this.eventBus.on('layer:load', (data) => {
            this.loadLayer(data.layerId);
        });

        // Katman kaldırma isteği
        this.eventBus.on('layer:remove', (data) => {
            this.removeLayer(data.layerId);
        });

        // Şeffaflık değişimi
        this.eventBus.on('layer:opacity-change', (data) => {
            this.updateLayerOpacity(data.layerId, data.opacity);
        });

        // Görünürlük değişimi
        this.eventBus.on('layer:visibility-change', (data) => {
            this.toggleLayerVisibility(data.layerId, data.visible);
        });

        // Renk değişimi
        this.eventBus.on('layer:color-change', (data) => {
            this.updateLayerColor(data.layerId, data.color);
        });
    }

    /**
     * Katman yükle
     */
    async loadLayer(layerId) {
        try {
            const layerConfig = this.availableLayers.find(l => l.id === layerId);
            if (!layerConfig) {
                throw new Error(`Layer not found: ${layerId}`);
            }

            // Zaten yüklü mü kontrol et
            if (this.loadedLayers.has(layerId)) {
                this.toggleLayerVisibility(layerId, true);
                return;
            }

            this.eventBus.emit('layer:loading', { layerId, message: 'Katman yükleniyor...' });

            // Dosya yolunu oluştur
            const filePath = this.layerBasePath + layerConfig.file;

            // Dosya tipine göre yükle
            let geojson;
            if (layerConfig.fileType === 'geojson') {
                geojson = await this.loadGeoJSON(filePath);
            } else if (layerConfig.fileType === 'zip') {
                geojson = await this.loadZipShapefile(filePath);
            } else {
                geojson = await this.loadShapefile(filePath);
            }

            // Haritaya ekle
            await this.addLayerToMap(layerId, layerConfig, geojson);

            // Yüklenen katmanları güncelle
            this.loadedLayers.set(layerId, {
                config: layerConfig,
                geojson: geojson
            });

            // State güncelle
            const activeLayers = this.stateManager.get('layers.active') || [];
            activeLayers.push(layerId);
            this.stateManager.set('layers.active', activeLayers);

            this.eventBus.emit('layer:loaded', { layerId });

        } catch (error) {
            console.error(`Error loading layer ${layerId}:`, error);
            this.eventBus.emit('layer:error', {
                layerId,
                message: `Katman yüklenemedi: ${error.message}`
            });
        }
    }

    /**
     * GeoJSON yükle
     */
    async loadGeoJSON(filePath) {
        return new Promise((resolve, reject) => {
            // Tam URL oluştur
            const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
            const fullUrl = new URL(filePath, baseUrl).href;

            fetch(fullUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(geojson => {
                    // Eğer FeatureCollection değilse, dönüştür
                    if (geojson.type !== 'FeatureCollection') {
                        geojson = {
                            type: 'FeatureCollection',
                            features: Array.isArray(geojson) ? geojson : [geojson]
                        };
                    }
                    resolve(geojson);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    /**
     * Zip içindeki Shapefile yükle
     */
    async loadZipShapefile(filePath) {
        return new Promise((resolve, reject) => {
            // Tam URL oluştur
            const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
            const fullUrl = new URL(filePath, baseUrl).href;

            // shp.js zip dosyalarını destekler
            shp(fullUrl).then(geojson => {
                // Eğer FeatureCollection değilse, dönüştür
                if (geojson.type !== 'FeatureCollection') {
                    geojson = {
                        type: 'FeatureCollection',
                        features: Array.isArray(geojson) ? geojson : [geojson]
                    };
                }
                resolve(geojson);
            }).catch(error => {
                reject(error);
            });
        });
    }

    /**
     * Shapefile yükle
     */
    async loadShapefile(filePath) {
        return new Promise((resolve, reject) => {
            // Tam URL oluştur
            const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
            const fullUrl = new URL(filePath, baseUrl).href;

            // shp.js kullanarak shapefile'ı yükle
            shp(fullUrl).then(geojson => {
                // Eğer FeatureCollection değilse, dönüştür
                if (geojson.type !== 'FeatureCollection') {
                    geojson = {
                        type: 'FeatureCollection',
                        features: Array.isArray(geojson) ? geojson : [geojson]
                    };
                }
                resolve(geojson);
            }).catch(error => {
                reject(error);
            });
        });
    }

    /**
     * Katmanı haritaya ekle
     */
    async addLayerToMap(layerId, config, geojson) {
        // Source ekle
        const sourceId = `layer-source-${layerId}`;

        if (!this.map.getSource(sourceId)) {
            this.map.addSource(sourceId, {
                type: 'geojson',
                data: geojson
            });
        }

        // Layer tipi belirleme
        let layerType, paintProperties;

        if (config.type === 'line') {
            layerType = 'line';
            paintProperties = {
                'line-color': config.color,
                'line-width': 2,
                'line-opacity': config.opacity
            };
        } else if (config.type === 'fill') {
            layerType = 'fill';
            paintProperties = {
                'fill-color': config.color,
                'fill-opacity': config.opacity
            };

            // Outline ekle
            if (!this.map.getLayer(`${layerId}-outline`)) {
                this.map.addLayer({
                    id: `${layerId}-outline`,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': '#000000',
                        'line-width': 1,
                        'line-opacity': 0.5
                    }
                });
            }
        } else {
            // Default: circle
            layerType = 'circle';
            paintProperties = {
                'circle-color': config.color,
                'circle-radius': 5,
                'circle-opacity': config.opacity
            };
        }

        // Ana layer ekle
        if (!this.map.getLayer(layerId)) {
            this.map.addLayer({
                id: layerId,
                type: layerType,
                source: sourceId,
                paint: paintProperties
            });
        }
    }

    /**
     * Katmanı kaldır
     */
    removeLayer(layerId) {
        try {
            // Haritadan kaldır
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }

            // Outline varsa kaldır
            if (this.map.getLayer(`${layerId}-outline`)) {
                this.map.removeLayer(`${layerId}-outline`);
            }

            // Source'u kaldır
            const sourceId = `layer-source-${layerId}`;
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }

            // Yüklenen katmanlardan kaldır
            this.loadedLayers.delete(layerId);

            // State güncelle
            const activeLayers = this.stateManager.get('layers.active') || [];
            const index = activeLayers.indexOf(layerId);
            if (index > -1) {
                activeLayers.splice(index, 1);
                this.stateManager.set('layers.active', activeLayers);
            }

            this.eventBus.emit('layer:removed', { layerId });

        } catch (error) {
            console.error(`Error removing layer ${layerId}:`, error);
        }
    }

    /**
     * Katman şeffaflığını güncelle
     */
    updateLayerOpacity(layerId, opacity) {
        try {
            if (!this.map.getLayer(layerId)) {
                return;
            }

            const layerConfig = this.availableLayers.find(l => l.id === layerId);
            if (!layerConfig) return;

            // Opacity değerini ayarla
            const opacityValue = parseFloat(opacity);

            if (layerConfig.type === 'line') {
                this.map.setPaintProperty(layerId, 'line-opacity', opacityValue);
            } else if (layerConfig.type === 'fill') {
                this.map.setPaintProperty(layerId, 'fill-opacity', opacityValue);
            } else {
                this.map.setPaintProperty(layerId, 'circle-opacity', opacityValue);
            }

            // Config güncelle
            layerConfig.opacity = opacityValue;

        } catch (error) {
            console.error(`Error updating opacity for ${layerId}:`, error);
        }
    }

    /**
     * Katman görünürlüğünü değiştir
     */
    toggleLayerVisibility(layerId, visible) {
        try {
            if (!this.map.getLayer(layerId)) {
                // Layer yüklü değilse, yükle
                if (visible) {
                    this.loadLayer(layerId);
                }
                return;
            }

            const visibility = visible ? 'visible' : 'none';
            this.map.setLayoutProperty(layerId, 'visibility', visibility);

            // Outline varsa onu da ayarla
            if (this.map.getLayer(`${layerId}-outline`)) {
                this.map.setLayoutProperty(`${layerId}-outline`, 'visibility', visibility);
            }

            // Config güncelle
            const layerConfig = this.availableLayers.find(l => l.id === layerId);
            if (layerConfig) {
                layerConfig.visible = visible;
            }

        } catch (error) {
            console.error(`Error toggling visibility for ${layerId}:`, error);
        }
    }

    /**
     * Tüm aktif katmanları al
     */
    getActiveLayers() {
        return Array.from(this.loadedLayers.keys());
    }

    /**
     * Katman bilgisi al
     */
    getLayerInfo(layerId) {
        return this.availableLayers.find(l => l.id === layerId);
    }

    /**
     * Tüm mevcut katmanları al
     */
    getAvailableLayers() {
        return this.availableLayers;
    }

    /**
     * Katman rengini güncelle
     */
    updateLayerColor(layerId, color) {
        try {
            if (!this.map.getLayer(layerId)) {
                return;
            }

            const layerConfig = this.availableLayers.find(l => l.id === layerId);
            if (!layerConfig) return;

            // Rengi güncelle
            if (layerConfig.type === 'line') {
                this.map.setPaintProperty(layerId, 'line-color', color);
            } else if (layerConfig.type === 'fill') {
                this.map.setPaintProperty(layerId, 'fill-color', color);
            } else {
                this.map.setPaintProperty(layerId, 'circle-color', color);
            }

            // Config güncelle
            layerConfig.color = color;

        } catch (error) {
            console.error(`Error updating color for ${layerId}:`, error);
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayerManager;
}
