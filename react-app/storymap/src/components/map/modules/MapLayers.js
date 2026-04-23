/**
 * MapLayers - Harita katmanları ve altlık harita yönetimi
 * HGM Atlas API entegrasyonu ile
 */

export class MapLayers {
    constructor(map) {
        this.map = map;
        
        // HGM Atlas API Key
        this.hgmApiKey = 'AlkVjf0YFkkDuvu58l7Ndc1oiHk71IbF';
        
        this.basemapStyles = {
            // HGM Temel Harita (Atlas endpoint - CORS uyumlu) - Varsayılan
            'hgm-temel': {
                tiles: [
                    `https://atlas.harita.gov.tr/webservis/harita/hgm_harita/{z}/{x}/{y}.png?apikey=${this.hgmApiKey}`
                ]
            },
            // HGM Uydu Görüntüsü (Atlas endpoint - CORS uyumlu)
            'hgm-uydu': {
                tiles: [
                    `https://atlas.harita.gov.tr/webservis/ortofoto/{z}/{x}/{y}.jpg?apikey=${this.hgmApiKey}`
                ]
            },
            // HGM Gece Haritası (Atlas endpoint - CORS uyumlu)
            'hgm-gece': {
                tiles: [
                    `https://atlas.harita.gov.tr/webservis/harita/hgm_gece/{z}/{x}/{y}.png?apikey=${this.hgmApiKey}`
                ]
            },
            // HGM Siyasi Harita (Atlas endpoint - CORS uyumlu)
            'hgm-siyasi': {
                tiles: [
                    `https://atlas.harita.gov.tr/webservis/harita/hgm_siyasi/{z}/{x}/{y}.png?apikey=${this.hgmApiKey}`
                ]
            },
            // HGM Yükseklik Haritası (Atlas endpoint - CORS uyumlu)
            'hgm-yukseklik': {
                tiles: [
                    `https://atlas.harita.gov.tr/webservis/harita/hgm_yukseklik/{z}/{x}/{y}.png?apikey=${this.hgmApiKey}`
                ]
            }
        };
    }

    // Altlık haritayı değiştir
    changeBasemap(basemapId, markers = []) {
        if (!this.map) return;

        const basemap = this.basemapStyles[basemapId] || this.basemapStyles['hgm-temel'];

        // Yeni stil oluştur
        const newStyle = {
            version: 8,
            sources: {
                'basemap': {
                    type: 'raster',
                    tiles: basemap.tiles,
                    tileSize: 256,
                    maxzoom: 19
                }
            },
            layers: [{
                id: 'basemap-layer',
                type: 'raster',
                source: 'basemap'
            }]
        };

        // Mevcut marker'ları sakla (element bilgisiyle birlikte)
        const savedMarkers = markers.map(m => {
            const lngLat = m.getLngLat();
            return {
                coords: [lngLat.lng, lngLat.lat],
                options: m._options || {},
                element: m.getElement().cloneNode(true)
            };
        });

        // Mevcut tüm source ve layer'ları kaydet
        const savedSources = {};
        const savedLayers = [];
        const style = this.map.getStyle();
        
        if (style && style.sources) {
            Object.keys(style.sources).forEach(sourceId => {
                if (sourceId !== 'basemap') {
                    const source = this.map.getSource(sourceId);
                    if (source) {
                        // GeoJSON source ise data'yı al
                        if (source.type === 'geojson' || style.sources[sourceId].type === 'geojson') {
                            const data = source._data || source.serialize()?.data;
                            if (data) {
                                savedSources[sourceId] = JSON.parse(JSON.stringify(data));
                            }
                        }
                    }
                }
            });
        }
        
        if (style && style.layers) {
            style.layers.forEach(layer => {
                if (layer.id !== 'basemap-layer' && layer.source !== 'basemap') {
                    savedLayers.push(JSON.parse(JSON.stringify(layer)));
                }
            });
        }

        // Mevcut marker'ları haritadan kaldır (referansları koruyarak)
        markers.forEach(m => m.remove());

        // Harita stilini değiştir
        this.map.setStyle(newStyle);

        // Stil yüklendikten sonra her şeyi geri ekle
        return new Promise((resolve) => {
            this.map.once('style.load', () => {
                // Source'ları geri ekle
                Object.keys(savedSources).forEach(sourceId => {
                    try {
                        if (!this.map.getSource(sourceId)) {
                            this.map.addSource(sourceId, {
                                type: 'geojson',
                                data: savedSources[sourceId]
                            });
                        }
                    } catch (e) {
                        console.warn(`Source ${sourceId} geri yüklenemedi:`, e);
                    }
                });
                
                // Layer'ları geri ekle
                savedLayers.forEach(layer => {
                    try {
                        if (!this.map.getLayer(layer.id)) {
                            this.map.addLayer(layer);
                        }
                    } catch (e) {
                        console.warn(`Layer ${layer.id} geri yüklenemedi:`, e);
                    }
                });
                
                // Marker'ları geri ekle ve yeni listeyi döndür
                const newMarkers = [];
                savedMarkers.forEach(({ coords, options, element }) => {
                    const marker = new maplibregl.Marker({ element: element })
                        .setLngLat(coords)
                        .addTo(this.map);
                    marker._options = options;
                    newMarkers.push(marker);
                });
                
                resolve(newMarkers);
            });
        });
    }
}
