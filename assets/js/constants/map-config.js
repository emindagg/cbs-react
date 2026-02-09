/**
 * OGM Web CBS Platform
 * Map Configuration Module Initialization Module - MapLibre GL JS
 */

const MapConfig = {
    // MapLibre style configuration
    style: {
        version: 8,
        sources: {},
        layers: [],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
    },
    
    // HGM Atlas raster tile sources (MEB'e özel API key - doğru endpoint'ler)
    atlas: {
        temel: {
            type: 'raster',
            tiles: ['https://atlas.harita.gov.tr/webservis/harita/hgm_harita/{z}/{x}/{y}.png?apikey=ESqJcw5RWSD5Unw0CVYL2z8oP8gOqIUC'],
            tileSize: 256,
            maxzoom: 18,
            attribution: '© HGM - Harita Genel Müdürlüğü'
        },
        uydu: {
            type: 'raster',
            tiles: ['https://atlas.harita.gov.tr/webservis/ortofoto/{z}/{x}/{y}.jpg?apikey=ESqJcw5RWSD5Unw0CVYL2z8oP8gOqIUC'],
            tileSize: 256,
            maxzoom: 18,
            attribution: '© HGM - Harita Genel Müdürlüğü'
        },
        gece: {
            type: 'raster',
            tiles: ['https://atlas.harita.gov.tr/webservis/harita/hgm_gece/{z}/{x}/{y}.png?apikey=ESqJcw5RWSD5Unw0CVYL2z8oP8gOqIUC'],
            tileSize: 256,
            maxzoom: 18,
            attribution: '© HGM - Harita Genel Müdürlüğü'
        },
        siyasi: {
            type: 'raster',
            tiles: ['https://atlas.harita.gov.tr/webservis/harita/hgm_siyasi/{z}/{x}/{y}.png?apikey=ESqJcw5RWSD5Unw0CVYL2z8oP8gOqIUC'],
            tileSize: 256,
            maxzoom: 18,
            attribution: '© HGM - Harita Genel Müdürlüğü'
        },
        yukseklik: {
            type: 'raster',
            tiles: ['https://atlas.harita.gov.tr/webservis/harita/hgm_yukseklik/{z}/{x}/{y}.png?apikey=ESqJcw5RWSD5Unw0CVYL2z8oP8gOqIUC'],
            tileSize: 256,
            maxzoom: 18,
            attribution: '© HGM - Harita Genel Müdürlüğü'
        }
    },

    // Default map settings
    defaults: {
        center: [33.41, 39], // [lng, lat] - MapLibre uses lon-lat order
        zoom: 5,
        minZoom: 1.2, // Kıta düzeyinde görünüm
        maxZoom: 19
    },
    
    // Heatmap configuration
    heatmap: {
        defaultRadius: 40,
        defaultBlur: 22,
        minOpacity: 0.4,
        max: 1.0,
        gradient: {
            0.00: '#0ea5e9',  // Light cyan
            0.25: '#22c55e',  // Green
            0.50: '#fde047',  // Yellow
            0.75: '#fb923c',  // Orange
            1.00: '#b91c1c'   // Red
        }
    },
    
    // Cluster configuration
    cluster: {
        maxClusterRadius: 80,
        clusterMaxZoom: 14,
        clusterRadius: 50
    },
    
    // Buffer analysis defaults
    buffer: {
        defaultRadius: 500,
        colors: ['purple', 'orange', 'pink', 'cyan', 'lime'],
        fillOpacity: 0.3,
        weight: 2
    },
    
    // Measurement tools configuration
    measurement: {
        distance: {
            color: 'blue',
            weight: 3,
            dashArray: '5, 10'
        },
        area: {
            color: 'green',
            fillColor: 'green',
            fillOpacity: 0.3,
            weight: 2
        }
    },
    
    // Analysis layers configuration
    analysis: {
        convexHull: {
            color: 'orange',
            weight: 2,
            fillOpacity: 0.2
        },
        voronoi: {
            color: 'teal',
            weight: 1,
            fillOpacity: 0
        },
        nearestFacility: {
            color: 'magenta',
            weight: 3
        }
    }
};

/**
 * Initialize the map with MapLibre GL JS
 */
function initializeMap(containerId) {
    try {
        // Create MapLibre map with HGM Temel as default
        const map = new maplibregl.Map({
            container: containerId,
            style: {
                version: 8,
                sources: {
                    'hgm-temel-src': MapConfig.atlas.temel
                },
                layers: [
                    {
                        id: 'hgm-temel-layer',
                        type: 'raster',
                        source: 'hgm-temel-src'
                    }
                ],
                glyphs: MapConfig.style.glyphs
            },
            center: MapConfig.defaults.center,
            zoom: MapConfig.defaults.zoom,
            minZoom: MapConfig.defaults.minZoom,
            maxZoom: MapConfig.defaults.maxZoom,
            attributionControl: false,
            // Canvas capture support (required for screenshot feature)
            preserveDrawingBuffer: true,
            // Performance optimizations
            maxTileCacheSize: 100, // Reduce memory usage (default: 50)
            refreshExpiredTiles: false, // Don't auto-refresh tiles
            fadeDuration: 100, // Faster fade (default: 300ms)
            crossSourceCollisions: false // Disable collision detection between sources
        });

        // Suppress tile loading errors from console (403, 404, network errors)
        map.on('error', (e) => {
            // Only suppress tile loading errors, not other critical errors
            if (e.error && (
                e.error.status === 403 ||
                e.error.status === 404 ||
                e.error.message?.includes('tile') ||
                e.error.message?.includes('Tile')
            )) {
                // Silently ignore tile loading errors
                return;
            }
            // Log other errors normally
            if (Logger && typeof Logger.error === 'function') {
                Logger.error('Map error:', e.error);
            }
        });

        return { map, config: MapConfig };
        
    } catch (error) {
        Logger.error('MapLibre GL JS initialization failed:', error);
        throw error;
    }
}

/**
 * Change basemap type
 */
function changeBasemap(map, mapType) {
    try {
        // Önce mevcut veri katmanlarının ID'lerini kaydet (sıralamayı korumak için)
        const existingDataLayers = getExistingDataLayers(map);
        
        // Remove existing basemap layers
        if (map.getLayer('hgm-temel-layer')) {
            map.removeLayer('hgm-temel-layer');
        }
        ['atlas-temel', 'atlas-uydu', 'atlas-gece', 'atlas-siyasi', 'atlas-yukseklik'].forEach(id => {
            if (map.getLayer(id)) {
                map.removeLayer(id);
            }
        });

        // Remove existing basemap sources only
        if (map.getSource('hgm-temel-src')) {
            map.removeSource('hgm-temel-src');
        }
        ['atlas-temel-src', 'atlas-uydu-src', 'atlas-gece-src', 'atlas-siyasi-src', 'atlas-yukseklik-src'].forEach(id => {
            if (map.getSource(id)) {
                map.removeSource(id);
            }
        });

        // İlk veri katmanının ID'sini bul (basemap'i onun altına eklemek için)
        const firstDataLayerId = existingDataLayers.length > 0 ? existingDataLayers[0] : undefined;

        if (mapType === 'NONE') {
            // No basemap - hiçbir şey ekleme
            
        } else {
            // Switch to Atlas basemap
            const atlasTypeMap = {
                'TEMEL': 'temel',
                'UYDU': 'uydu',
                'GECE': 'gece',
                'SIYASI': 'siyasi',
                'YUKSEKLIK': 'yukseklik'
            };
            
            const atlasType = atlasTypeMap[mapType];
            if (atlasType && MapConfig.atlas[atlasType]) {
                const sourceId = `atlas-${atlasType}-src`;
                const layerId = `atlas-${atlasType}`;
                
                map.addSource(sourceId, MapConfig.atlas[atlasType]);
                map.addLayer({
                    id: layerId,
                    type: 'raster',
                    source: sourceId
                }, firstDataLayerId); // Veri katmanlarının altına ekle
            }
        }
        
        Logger.log(`✅ Altlık harita değiştirildi: ${mapType}`);
        
    } catch (error) {
        Logger.error('Error changing basemap:', error);
    }
}

/**
 * Mevcut veri katmanlarının ID'lerini al
 */
function getExistingDataLayers(map) {
    const layers = map.getStyle().layers;
    const basemapIds = ['hgm-temel-layer', 'atlas-temel', 'atlas-uydu', 'atlas-gece', 'atlas-siyasi', 'atlas-yukseklik'];

    // Basemap olmayan tüm katmanları bul
    return layers
        .filter(l => !basemapIds.includes(l.id) && l.type !== 'background')
        .map(l => l.id);
}

/**
 * Veri katmanlarını basemap'in üstüne taşı
 * @internal reserved / map-interactions'ta yerel kopya kullanılıyor
 */
// eslint-disable-next-line no-unused-vars
function moveDataLayersAboveBasemap(map) {
    const staticDataLayerIds = [
        // LayerManager katmanları (Akarsular, Sular, Ulaşım vb.)
        'ulke-siniri', 'ulke-siniri-outline',
        'akarsular', 'akarsular-outline',
        'sular', 'sular-outline',
        'ulasim', 'ulasim-outline',
        'dfy', 'dfy-outline',
        // Shapefile/Import katmanları (EN ÖNCE)
        'catalog-polygons', 'catalog-polygon-outlines', 'catalog-polygon-outlines-dashed', 'catalog-lines',
        // Measurement katmanları
        'measurement-lines', 'measurement-polygons', 'measurement-polygon-outlines',
        'distance-lines', 'distance-ghost-line', 'area-polygons', 'area-outlines', 'area-ghost-fill', 'area-ghost-line',
        // Buffer katmanları
        'buffer-fills', 'buffer-outlines',
        // Görselleştirme katmanları
        'choropleth-fill', 'choropleth-outline',
        'bubble-fills', 'bubble-strokes', 
        'dot-density-layer',
        'heatmap-layer',
        // Cluster katmanları
        'clusters', 'cluster-count', 'unclustered-point',
        'cluster-circles', 'cluster-labels',
        'data-points-layer'
    ];
    
    // İlk symbol layer'ı bul
    const layers = map.getStyle().layers;
    const firstSymbolLayer = layers.find(l => l.type === 'symbol');
    const beforeId = firstSymbolLayer ? firstSymbolLayer.id : undefined;
    
    // Dinamik olarak tüm veri katmanlarını bul (layer-source- ile başlayanlar)
    const dynamicLayerIds = layers
        .filter(l => l.source && (l.source.startsWith('layer-source-') || l.source.startsWith('imported-')))
        .map(l => l.id);
    
    // Tüm veri katmanlarını birleştir
    const allDataLayerIds = [...new Set([...staticDataLayerIds, ...dynamicLayerIds])];
    
    // Tüm veri katmanlarını üste taşı
    allDataLayerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
            try {
                map.moveLayer(layerId, beforeId);
            } catch (e) {
                // Sessizce atla (layer zaten doğru yerdeyse hata verebilir)
            }
        }
    });
}

/**
 * Get the ID of the first data visualization layer to insert basemap layers below
 * @internal reserved
 */
// eslint-disable-next-line no-unused-vars
function getFirstDataLayerId(map) {
    const layers = map.getStyle().layers;
    const dataLayerIds = [
        // LayerManager katmanları (Akarsular, Sular, Ulaşım vb.)
        'ulke-siniri', 'ulke-siniri-outline',
        'akarsular', 'akarsular-outline',
        'sular', 'sular-outline',
        'ulasim', 'ulasim-outline',
        'dfy', 'dfy-outline',
        // Shapefile/Import katmanları (EN ÖNCE)
        'catalog-polygons', 'catalog-polygon-outlines', 'catalog-polygon-outlines-dashed', 'catalog-lines',
        // Görselleştirme katmanları
        'choropleth-fill', 'choropleth-outline',
        'bubble-fills', 'bubble-strokes', 
        'dot-density-layer',
        'heatmap-layer',
        'cluster-circles', 'cluster-labels',
        'data-points-layer'
    ];
    
    // Önce veri katmanlarını ara
    for (const layer of layers) {
        if (dataLayerIds.includes(layer.id)) {
            return layer.id;
        }
    }
    
    // Veri katmanı yoksa symbol layer ara
    for (const layer of layers) {
        if (layer.type === 'symbol') {
            return layer.id;
        }
    }
    
    return undefined;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MapConfig, initializeMap, changeBasemap };
}
