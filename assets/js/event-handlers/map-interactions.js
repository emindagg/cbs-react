/**
 * Map Interactions - MapLibre GL JS
 * Handles basemap switching and map UI controls
 */

// Güvenli Logger helper'ları
// eslint-disable-next-line no-unused-vars
const safeLogInt = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeWarnInt = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorInt = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

// ==========================================
// BASEMAP SWITCHING
// ==========================================
function initializeBasemapSelector() {
    console.log('🗺️ initializeBasemapSelector çağrıldı');

    const mapTypeSelect = document.getElementById('map-type');
    const basemapOptions = document.querySelectorAll('.basemap-option');

    console.log('🔍 mapTypeSelect:', mapTypeSelect);
    console.log('🔍 basemapOptions sayısı:', basemapOptions.length);

    if (!mapTypeSelect || basemapOptions.length === 0) {
        safeErrorInt('❌ Basemap selector elements not found');
        console.error('❌ mapTypeSelect veya basemapOptions bulunamadı!');
        return;
    }
    
    // Set initial active state
    function updateActiveState(value) {
        basemapOptions.forEach(btn => {
            if (btn.dataset.value === value) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Initial value: HGM Temel
    updateActiveState('TEMEL');

    // Handle basemap option clicks
    basemapOptions.forEach(btn => {
        console.log('➕ Basemap butonuna event listener ekleniyor:', btn.dataset.value);
        btn.addEventListener('click', (e) => {
            console.log('🖱️ Basemap butonuna tıklandı:', btn.dataset.value);
            e.stopPropagation();
            const value = btn.dataset.value;
            mapTypeSelect.value = value;
            updateActiveState(value);
            console.log('📤 mapTypeSelect change eventi tetikleniyor');
            mapTypeSelect.dispatchEvent(new Event('change'));
        });
    });

    console.log('➕ mapTypeSelect change event listener ekleniyor');

    mapTypeSelect.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        console.log('🔄 mapTypeSelect change eventi tetiklendi:', selectedValue);

        // Wait for map to be ready before changing basemap
        if (!window.map) {
            console.warn('⏳ Map henüz hazır değil, bekleniyor...');
            safeWarnInt('⏳ Map not ready yet, waiting...');
            setTimeout(() => changeBasemapInline(selectedValue), 500);
            return;
        }

        console.log('✅ Map hazır, changeBasemapInline çağrılıyor');
        // Change basemap implementation inline
        changeBasemapInline(selectedValue);
    });
    
    // Inline basemap change implementation
    function changeBasemapInline(mapType) {
        console.log('🗺️ changeBasemapInline çağrıldı, mapType:', mapType);

        // window.map might be the map object directly or { map, config }
        const map = window.map?.map || window.map;
        console.log('🔍 map nesnesi:', map);

        if (!map) {
            console.error('❌ Map başlatılmamış!');
            safeErrorInt('Map not initialized');
            return;
        }

        console.log('✅ Harita değiştiriliyor:', mapType);
        
        
        
        try {
            // Globe dışındaki harita değişiklikleri için mevcut haritaları kaldır
            // Remove existing basemap layers
            const existingLayers = ['hgm-temel-layer', 'atlas-temel', 'atlas-uydu', 'atlas-gece', 'atlas-siyasi', 'atlas-yukseklik', 'none-background-layer'];
            existingLayers.forEach(id => {
                if (map.getLayer(id)) {
                    map.removeLayer(id);
                }
            });

            // Remove existing sources
            const existingSources = ['hgm-temel-src', 'atlas-temel-src', 'atlas-uydu-src', 'atlas-gece-src', 'atlas-siyasi-src', 'atlas-yukseklik-src'];
            existingSources.forEach(id => {
                if (map.getSource(id)) {
                    map.removeSource(id);
                }
            });

            if (mapType === 'NONE') {
                // Globe görünümü aktifse kapat
                if (typeof window.GlobeView !== 'undefined' && window.GlobeView.isActive) {
                    window.GlobeView.disable(map);
                }
                
                // No basemap - set MapLibre background to light gray
                
                // Get all current layers
                const layers = map.getStyle().layers;
                
                // Find background layer
                const backgroundLayer = layers.find(layer => layer.type === 'background');
                
                if (backgroundLayer) {
                    // Update existing background layer
                    map.setPaintProperty(backgroundLayer.id, 'background-color', '#f8f9fa');
                    
                } else {
                    // No background layer found, add one at the very bottom
                    const firstLayerId = layers.length > 0 ? layers[0].id : undefined;
                    
                    map.addLayer({
                        id: 'none-background-layer',
                        type: 'background',
                        paint: {
                            'background-color': '#f8f9fa'
                        }
                    }, firstLayerId);
                    
                }
                
                // Veri katmanlarını üstte tut
                moveDataLayersAboveBasemap(map);
                
                // Measurement layer'larını yeniden üste taşı
                setTimeout(() => {
                    if (window.GlobeView && typeof window.GlobeView.restoreMeasurementLayers === 'function') {
                        window.GlobeView.restoreMeasurementLayers(map);
                    }
                }, 50);
                
            } else {
                // Globe görünümü aktifse kapat (normal harita seçildiğinde)
                if (typeof window.GlobeView !== 'undefined' && window.GlobeView.isActive) {
                    window.GlobeView.disable(map);
                }
                
                // Switch to Atlas basemap
                const atlasTypeMap = {
                    'TEMEL': 'temel',
                    'UYDU': 'uydu',
                    'GECE': 'gece',
                    'SIYASI': 'siyasi',
                    'YUKSEKLIK': 'yukseklik'
                };
                
                const atlasType = atlasTypeMap[mapType];
                if (atlasType) {
                    const sourceId = `atlas-${atlasType}-src`;
                    const layerId = `atlas-${atlasType}`;
                    
                    // HGM tile URL'leri (Mapbox GL JS formatında - MapLibre ile uyumlu!)
                    // API Key: MEB'e özel HGM API anahtarı
                    const apiKey = 'ESqJcw5RWSD5Unw0CVYL2z8oP8gOqIUC';
                    
                    // HGM ATLAS dokümantasyonundaki endpoint'ler
                    const tileUrls = {
                        'temel': `https://atlas.harita.gov.tr/webservis/harita/hgm_harita/{z}/{x}/{y}.png?apikey=${apiKey}`,
                        'uydu': `https://atlas.harita.gov.tr/webservis/ortofoto/{z}/{x}/{y}.jpg?apikey=${apiKey}`,
                        'gece': `https://atlas.harita.gov.tr/webservis/harita/hgm_gece/{z}/{x}/{y}.png?apikey=${apiKey}`,
                        'siyasi': `https://atlas.harita.gov.tr/webservis/harita/hgm_siyasi/{z}/{x}/{y}.png?apikey=${apiKey}`,
                        'yukseklik': `https://atlas.harita.gov.tr/webservis/harita/hgm_yukseklik/{z}/{x}/{y}.png?apikey=${apiKey}`
                    };
                    
                    
                    
                    map.addSource(sourceId, {
                        type: 'raster',
                        tiles: [tileUrls[atlasType]],
                        tileSize: 256,
                        maxzoom: 18,
                        attribution: '© HGM - Harita Genel Müdürlüğü'
                    });
                    
                    // Basemap'i ekle (önce en üste eklenir)
                    map.addLayer({
                        id: layerId,
                        type: 'raster',
                        source: sourceId,
                        minzoom: 0,
                        maxzoom: 22
                    });
                    
                    // Hemen ardından veri katmanlarını üste taşı
                    moveDataLayersAboveBasemap(map);
                    
                    // Measurement layer'larını yeniden üste taşı
                    setTimeout(() => {
                        if (window.GlobeView && typeof window.GlobeView.restoreMeasurementLayers === 'function') {
                            window.GlobeView.restoreMeasurementLayers(map);
                        }
                    }, 50);
                }
            }
            
        } catch (error) {
            if (window.Logger && typeof window.Logger.error === 'function') {
                safeErrorInt('Error changing basemap:', error);
            } else {
                console.error('Error changing basemap:', error);
            }
        }
    }
    
    // Helper function: Veri katmanlarını basemap'in üstüne taşı
    function moveDataLayersAboveBasemap(map) {
        const dataLayerIds = [
            // Shapefile/Import katmanları (EN ÖNCE)
            'catalog-polygons', 'catalog-polygon-outlines', 'catalog-polygon-outlines-dashed', 'catalog-lines',
            // Measurement katmanları
            'measurement-lines', 'measurement-polygons', 'measurement-polygon-outlines',
            'distance-lines', 'distance-ghost-line', 'area-polygons', 'area-outlines', 'area-ghost-fill', 'area-ghost-line',
            // Buffer katmanları
            'buffer-fills', 'buffer-outlines',
            // Görselleştirme katmanları
            'choropleth-fill', 'choropleth-outline',
            'bubble-boundary-fill', 'bubble-boundary-line', 'bubble-circles',
            'dot-density-boundary-fill', 'dot-density-boundary-line', 'dot-density-points',
            'heatmap-layer', 
            // Cluster katmanları
            'clusters', 'cluster-count', 'unclustered-point',
            'cluster-circles', 'cluster-labels', 'data-points-layer'
        ];
        
        // İlk symbol layer'ı bul
        const layers = map.getStyle().layers;
        const firstSymbolLayer = layers.find(l => l.type === 'symbol');
        const beforeId = firstSymbolLayer ? firstSymbolLayer.id : undefined;
        
        // Tüm veri katmanlarını üste taşı
        dataLayerIds.forEach(layerId => {
            if (map.getLayer(layerId)) {
                try {
                    map.moveLayer(layerId, beforeId);
                } catch (e) {
                    // Sessizce atla (layer zaten doğru yerdeyse hata verebilir)
                }
            }
        });
    }
    
    // Helper function to get the ID of the first data visualization layer
    // eslint-disable-next-line no-unused-vars
    function getFirstDataLayerId(map) {
        const layers = map.getStyle().layers;
        const dataLayerIds = [
            // Shapefile/Import katmanları (EN ÖNCE)
            'catalog-polygons', 'catalog-polygon-outlines', 'catalog-polygon-outlines-dashed', 'catalog-lines',
            // Görselleştirme katmanları
            'choropleth-fill', 'choropleth-outline',
            'bubble-boundary-fill', 'bubble-boundary-line', 'bubble-circles',
            'dot-density-boundary-fill', 'dot-density-boundary-line', 'dot-density-points',
            'heatmap-layer', 'cluster-circles', 'cluster-labels', 'data-points-layer'
        ];
        // Veri katmanlarından ilkini bul
        for (const layer of layers) {
            if (dataLayerIds.includes(layer.id)) return layer.id;
        }
        // Yoksa ilk symbol layer'ı döndür
        for (const layer of layers) {
            if (layer.type === 'symbol') return layer.id;
        }
        return undefined;
    }
}

// ==========================================
// INITIALIZE ALL MAP INTERACTIONS
// ==========================================
function initializeMapInteractions() {
    console.log('🚀 initializeMapInteractions çağrıldı');

    // Wait for map to be initialized
    if (typeof window.map === 'undefined') {
        console.warn('⏳ Map henüz tanımlı değil, 100ms sonra tekrar denenecek');
        setTimeout(initializeMapInteractions, 100);
        return;
    }

    console.log('✅ Map tanımlı, basemap selector başlatılıyor');
    // Initialize basemap selector immediately (DOM-only, doesn't need map to be loaded)
    initializeBasemapSelector();
}

// Auto-initialize when DOM is ready
console.log('📄 map-interactions.js yüklendi, readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('⏳ DOM loading, DOMContentLoaded bekleniyor');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ DOMContentLoaded tetiklendi, 200ms sonra initializeMapInteractions çağrılacak');
        setTimeout(initializeMapInteractions, 200);
    });
} else {
    console.log('✅ DOM zaten hazır, 200ms sonra initializeMapInteractions çağrılacak');
    // Small delay to ensure app-init.js has run
    setTimeout(initializeMapInteractions, 200);
}

// Browser global export
if (typeof window !== 'undefined') {
    window.MapInteractions = { initializeMapInteractions };
}
