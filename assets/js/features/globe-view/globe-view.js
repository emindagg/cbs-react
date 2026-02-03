/**
 * Globe View Module - MapLibre GL JS
 * Küre (globe) görünümü kontrolü ve yönetimi
 */

const GlobeView = {
    isActive: false,
    isEnabling: false, // Globe aktifleştiriliyor mu? (çift çağrıları önlemek için)
    previousProjection: null,
    previousZoom: null,
    
    /**
     * Globe görünümünü aktifleştir
     */
    enable(map) {
        if (!map) {
            Logger.warn('Globe view: Map object not provided');
            return;
        }
        
        // Eğer zaten aktifse, tekrar aktifleştirmeye gerek yok
        if (this.isActive) {
            
            return;
        }
        
        // Eğer şu anda aktifleştiriliyorsa, tekrar başlatma
        if (this.isEnabling) {
            
            return;
        }
        
        // setProjection fonksiyonu kontrolü
        if (typeof map.setProjection !== 'function') {
            Logger.warn('⚠️ Globe projection desteği yok. MapLibre GL JS 2.0+ gerekli.');
            return;
        }
        
        // Aktifleştirme başladı
        this.isEnabling = true;
        
        const applyGlobe = () => {
            try {
                // Mevcut zoom seviyesini kaydet (sadece ilk seferde)
                if (this.previousZoom === null) {
                    this.previousZoom = map.getZoom();
                }
                
                // Globe projection'ı aktifleştir
                map.setProjection({
                    type: 'globe'
                });
                
                // Zoom seviyesini globe görünümü için optimize et (küçük zoom - dünya görünümü)
                const currentZoom = map.getZoom();
                if (currentZoom > 2) {
                    map.setZoom(2);
                }
                
                // Merkezi dünya merkezine ayarla
                map.setCenter([0, 0]);
                
                this.isActive = true;
                this.isEnabling = false; // Aktifleştirme tamamlandı
                
                
                // Measurement layer'larını yeniden oluştur (projection değişimi sonrası)
                this.restoreMeasurementLayers(map);
                
            } catch (error) {
                this.isEnabling = false; // Hata durumunda flag'i sıfırla
                Logger.error('❌ Globe görünümü aktifleştirilemedi:', error);
            }
        };
        
        // Globe projection direkt uygulanabilir - style yüklü olması yeterli
        // Idle event'ini beklemeye gerek yok
        if (!map.isStyleLoaded()) {
            
            map.once('style.load', () => {
                
                applyGlobe();
            });
        } else {
            // Style zaten yüklü - direkt uygula
            
            // Direkt uygula - projection değişikliği anında çalışır
            applyGlobe();
        }
    },
    
    /**
     * Globe görünümünü devre dışı bırak (normal görünüm)
     */
    disable(map) {
        if (!map) {
            Logger.warn('Globe view: Map object not provided');
            return;
        }
        
        if (typeof map.setProjection !== 'function') {
            Logger.warn('⚠️ Globe projection desteği yok');
            return;
        }
        
        const applyMercator = () => {
            try {
                // Mercator projection'a geri dön (default)
                // MapLibre'de 'mercator' string olarak da kabul edilir
                map.setProjection('mercator');
                
                // Önceki zoom seviyesini geri yükle
                if (this.previousZoom !== null) {
                    map.setZoom(this.previousZoom);
                    this.previousZoom = null;
                } else {
                    // Önceki zoom yoksa, Türkiye'ye uygun zoom
                    map.setZoom(6);
                }
                
                // Türkiye merkezine geri dön
                map.setCenter([33.41, 39]);
                
                this.isActive = false;
                
                
                // Not: Measurement layer'ları map-interactions.js'de basemap eklendikten sonra yeniden oluşturulacak
                
            } catch (error) {
                Logger.error('❌ Globe görünümü devre dışı bırakılamadı:', error);
            }
        };
        
        // Style yüklenmişse direkt uygula, değilse bekle
        if (map.isStyleLoaded()) {
            applyMercator();
        } else {
            map.once('style.load', () => {
                applyMercator();
            });
        }
    },
    
    /**
     * Globe görünümünü toggle et
     */
    toggle(map) {
        if (this.isActive) {
            this.disable(map);
        } else {
            this.enable(map);
        }
        
        return this.isActive;
    },
    
    /**
     * Globe görünüm durumunu kontrol et
     */
    getStatus() {
        return this.isActive;
    },
    
    /**
     * Measurement layer'larını ve catalog layer'larını yeniden oluştur
     * Projection değişiminden sonra layer'lar kaybolabilir
     */
    restoreMeasurementLayers(map) {
        try {
            
            
            // 🎯 ÖNCE catalog layer'larını üste taşı (shapefile/import katmanları)
            const catalogLayerIds = [
                'catalog-polygons', 
                'catalog-polygon-outlines', 
                'catalog-polygon-outlines-dashed', 
                'catalog-lines'
            ];
            
            // İlk symbol layer'ı bul (etiketler)
            const layers = map.getStyle().layers;
            const firstSymbolLayer = layers.find(l => l.type === 'symbol');
            const symbolBeforeId = firstSymbolLayer ? firstSymbolLayer.id : undefined;
            
            // Catalog layer'larını symbol'ün önüne taşı
            catalogLayerIds.forEach(layerId => {
                if (map.getLayer(layerId)) {
                    try {
                        map.moveLayer(layerId, symbolBeforeId);
                    } catch (e) {
                        Logger.warn(`⚠️ ${layerId} layer'ı taşınamadı:`, e);
                    }
                }
            });
            
            
            
            // Distance measurement layer'larını kontrol et ve yeniden oluştur
            // Not: Tool aktif olmasa bile source varsa layer'ı yeniden oluştur (çizim tamamlanmış olabilir)
            const distanceSource = map.getSource('distance-measurements');
            const ghostSource = map.getSource('distance-ghost');
            
            if (distanceSource || ghostSource) {
                
                // Layer'lar varsa kaldır
                if (map.getLayer('distance-lines')) {
                    map.removeLayer('distance-lines');
                }
                if (map.getLayer('distance-ghost-line')) {
                    map.removeLayer('distance-ghost-line');
                }
                
                // Source verilerini kaydet
                let distanceData = null;
                let ghostData = null;
                
                if (distanceSource) {
                    // Source'daki veriyi oku
                    distanceData = distanceSource._data;
                    
                }
                
                if (ghostSource) {
                    ghostData = ghostSource._data;
                    
                }
                
                // Layer'ları yeniden ekle
                if (distanceSource && distanceData) {
                    const layers = map.getStyle().layers;
                    const firstSymbolLayer = layers.find(l => l.type === 'symbol');
                    const beforeId = firstSymbolLayer ? firstSymbolLayer.id : undefined;
                    
                    // Source'u ÖNCE set et (layer eklenmeden önce)
                    distanceSource.setData(distanceData);
                    
                    
                    map.addLayer({
                        id: 'distance-lines',
                        type: 'line',
                        source: 'distance-measurements',
                        paint: {
                            'line-color': '#ff0000',
                            'line-width': 4,
                            'line-opacity': 1
                        }
                    }, beforeId);
                    
                    
                }
                
                if (ghostSource && ghostData) {
                    const layers = map.getStyle().layers;
                    const firstSymbolLayer = layers.find(l => l.type === 'symbol');
                    // Ghost line'ı distance-lines'ın altına ekle (varsa), yoksa ilk symbol'un altına
                    const ghostBeforeId = map.getLayer('distance-lines') 
                        ? 'distance-lines' 
                        : (firstSymbolLayer ? firstSymbolLayer.id : undefined);
                    
                    // Source'u ÖNCE set et
                    ghostSource.setData(ghostData);
                    
                    
                    map.addLayer({
                        id: 'distance-ghost-line',
                        type: 'line',
                        source: 'distance-ghost',
                        paint: {
                            'line-color': '#ff0000',
                            'line-width': 3,
                            'line-dasharray': [4, 4],
                            'line-opacity': 0.8
                        }
                    }, ghostBeforeId);
                    
                    
                }
            }
            
            // Area measurement layer'larını kontrol et ve yeniden oluştur
            // Not: Tool aktif olmasa bile source varsa layer'ı yeniden oluştur (çizim tamamlanmış olabilir)
            const areaSource = map.getSource('area-measurements');
            const areaGhostSource = map.getSource('area-ghost');
            
            if (areaSource || areaGhostSource) {
                
                // Layer'lar varsa kaldır
                if (map.getLayer('area-polygons')) {
                    map.removeLayer('area-polygons');
                }
                if (map.getLayer('area-outlines')) {
                    map.removeLayer('area-outlines');
                }
                if (map.getLayer('area-ghost-fill')) {
                    map.removeLayer('area-ghost-fill');
                }
                if (map.getLayer('area-ghost-line')) {
                    map.removeLayer('area-ghost-line');
                }
                
                // Source verilerini kaydet
                let areaData = null;
                let areaGhostData = null;
                
                if (areaSource) {
                    areaData = areaSource._data;
                    
                }
                
                if (areaGhostSource) {
                    areaGhostData = areaGhostSource._data;
                    
                }
                
                // Layer'ları yeniden ekle
                if (areaSource && areaData) {
                    const layers = map.getStyle().layers;
                    const firstSymbolLayer = layers.find(l => l.type === 'symbol');
                    const beforeId = firstSymbolLayer ? firstSymbolLayer.id : undefined;
                    
                    // Source'u ÖNCE set et
                    areaSource.setData(areaData);
                    
                    
                    map.addLayer({
                        id: 'area-polygons',
                        type: 'fill',
                        source: 'area-measurements',
                        paint: {
                            'fill-color': '#22c55e',
                            'fill-opacity': 0.4
                        }
                    }, beforeId);
                    
                    map.addLayer({
                        id: 'area-outlines',
                        type: 'line',
                        source: 'area-measurements',
                        paint: {
                            'line-color': '#22c55e',
                            'line-width': 3,
                            'line-opacity': 1
                        }
                    }, beforeId);
                    
                    
                }
                
                if (areaGhostSource && areaGhostData) {
                    const layers = map.getStyle().layers;
                    const firstSymbolLayer = layers.find(l => l.type === 'symbol');
                    
                    // Ghost layer'ları area measurement layer'larının altına ekle
                    const ghostBeforeId = map.getLayer('area-polygons') 
                        ? 'area-polygons' 
                        : (firstSymbolLayer ? firstSymbolLayer.id : undefined);
                    
                    // Source'u ÖNCE set et
                    areaGhostSource.setData(areaGhostData);
                    
                    
                    map.addLayer({
                        id: 'area-ghost-fill',
                        type: 'fill',
                        source: 'area-ghost',
                        paint: {
                            'fill-color': '#22c55e',
                            'fill-opacity': 0.2
                        }
                    }, ghostBeforeId);
                    
                    map.addLayer({
                        id: 'area-ghost-line',
                        type: 'line',
                        source: 'area-ghost',
                        paint: {
                            'line-color': '#22c55e',
                            'line-width': 2,
                            'line-dasharray': [4, 4],
                            'line-opacity': 0.8
                        }
                    }, ghostBeforeId);
                    
                    
                }
            }
            
        } catch (error) {
            Logger.error('❌ Measurement layer\'ları yeniden oluşturulamadı:', error);
        }
    }
};

// Global erişim için
window.GlobeView = GlobeView;

