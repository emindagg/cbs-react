/**
 * Label Management Module - MapLibre GL JS
 * Handles label overlays for provinces/districts and values using symbol layers
 */

// Güvenli Logger helper'ları
const safeLogLabel = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeWarnLabel = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorLabel = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

class LabelManager {
    constructor(map) {
        this.map = map;
        this.provinceLabelsVisible = false;
        this.valueLabelsVisible = false;
    }
    
    /**
     * Toggle province/district name labels
     */
    toggleProvinceLabels(show) {
        safeLogLabel('🏦 toggleProvinceLabels çağrıldı:', show);
        this.provinceLabelsVisible = show;
        
        if (show) {
            this.createProvinceLabels();
        } else {
            if (this.map.getLayer('province-labels')) {
                this.map.removeLayer('province-labels');
            }
            if (this.map.getSource('province-labels-source')) {
                this.map.removeSource('province-labels-source');
            }
            window.showFeedback('❌ İl/İlçe isimleri gizlendi', 'info');
            safeLogLabel('✅ İl/İlçe labels gizlendi');
        }
    }
    
    /**
     * Create province/district name labels for choropleth visualization
     */
    async createProvinceLabels() {
        safeLogLabel('🏦 createProvinceLabels başlatıldı');
        
        if (!window.visualizationManager || !window.visualizationManager.currentVisualization) {
            safeWarnLabel('⚠️ VisualizationManager veya currentVisualization bulunamadı');
            window.showFeedback('Lütfen önce bir veri görselleştirin', 'warning');
            return;
        }
        
        safeLogLabel('🔍 currentVisualization:', window.visualizationManager.currentVisualization);
        
        if (!window.visualizationManager.currentVisualization.type) {
            safeWarnLabel('⚠️ Aktif görselleştirme yok (type null)');
            window.showFeedback('Lütfen önce bir veri görselleştirin', 'warning');
            return;
        }
        
        const viz = window.visualizationManager.currentVisualization;
        let geojson;

        // Get appropriate GeoJSON based on visualization type
        if (viz.type === 'choropleth') {
            const sourceName = window.dataMapOnlyMode ? 'choropleth-data-only' : 'choropleth-source';
            safeLogLabel(`🔍 Aranan source: ${sourceName}`);

            const source = this.map.getSource(sourceName);
            safeLogLabel(`🔍 Source bulundu:`, source);

            if (source) {
                safeLogLabel(`🔍 Source._data:`, source._data);
                safeLogLabel(`🔍 Source type:`, source.type);

                // 1) Öncelikli olarak GeoJSON kaynağın orijinal verisini kullan
                //    (querySourceFeatures tile bazlı döndüğü için zoom yaptıkça
                //    aynı il/ilçe birden fazla feature olarak gelebiliyor.)
                if (source._data) {
                    if (source._data.geojson && source._data.geojson.type === 'FeatureCollection') {
                        geojson = source._data.geojson;
                        safeLogLabel(`🔍 source._data.geojson kullanıldı (choropleth): ${geojson.features?.length || 0} feature`);
                    } else if (source._data.type === 'FeatureCollection') {
                        geojson = source._data;
                        safeLogLabel(`🔍 source._data kullanıldı (choropleth): ${geojson.features?.length || 0} feature`);
                    }
                }

                // 2) Eğer _data yoksa (ör. vector tile source) querySourceFeatures ile dene
                if (!geojson) {
                    try {
                        const features = this.map.querySourceFeatures(sourceName);
                        safeLogLabel(`🔍 querySourceFeatures sonucu: ${features ? features.length : 0} feature`);

                        if (features && features.length > 0) {
                            geojson = {
                                type: 'FeatureCollection',
                                features: features
                            };
                        }
                    } catch (err) {
                        safeWarnLabel('⚠️ querySourceFeatures hatası:', err);
                    }
                }

                if (!geojson) {
                    safeWarnLabel(`⚠️ ${sourceName} source'undan veri alınamadı`);
                    return;
                }
            } else {
                safeWarnLabel(`⚠️ ${sourceName} source bulunamadı`);
                return;
            }
        } else if (viz.type === 'dot-density') {
            // Dot density için boundary source'u kullan (il/ilçe sınırlarından centroid hesapla)
            const sourceName = 'dot-density-boundary';
            safeLogLabel(`🔍 Aranan source: ${sourceName}`);

            const source = this.map.getSource(sourceName);
            if (source) {
                safeLogLabel(`🔍 Source bulundu:`, source);

                // Dot-density sınırları da GeoJSON source olarak tutuluyor,
                // bu yüzden öncelikle _data üzerinden ilerleyelim.
                if (source._data) {
                    if (source._data.geojson && source._data.geojson.type === 'FeatureCollection') {
                        geojson = source._data.geojson;
                        safeLogLabel(`🔍 source._data.geojson kullanıldı (dot-density): ${geojson.features?.length || 0} feature`);
                    } else if (source._data.type === 'FeatureCollection') {
                        geojson = source._data;
                        safeLogLabel(`🔍 source._data kullanıldı (dot-density): ${geojson.features?.length || 0} feature`);
                    }
                }

                // _data yoksa son çare olarak querySourceFeatures
                if (!geojson) {
                    try {
                        const features = this.map.querySourceFeatures(sourceName);
                        safeLogLabel(`🔍 querySourceFeatures sonucu: ${features ? features.length : 0} feature`);

                        if (features && features.length > 0) {
                            geojson = {
                                type: 'FeatureCollection',
                                features: features
                            };
                        }
                    } catch (err) {
                        safeWarnLabel('⚠️ querySourceFeatures hatası:', err);
                    }
                }

                if (!geojson) {
                    safeWarnLabel(`⚠️ ${sourceName} source'undan veri alınamadı`);
                    return;
                }
            } else {
                safeWarnLabel(`⚠️ ${sourceName} source bulunamadı`);
                return;
            }
        } else if (viz.type === 'bubble') {
            // Bubble map için:
            // - "Tüm Harita" modu: bubble-boundary (tüm il/ilçe sınırları)
            // - "Veri Haritası" modu: bubble-source (sadece Excel'deki veriler)
            const sourceName = window.dataMapOnlyMode ? 'bubble-source' : 'bubble-boundary';
            safeLogLabel(`🔍 Aranan source: ${sourceName} (dataMapOnlyMode: ${window.dataMapOnlyMode})`);

            const source = this.map.getSource(sourceName);
            if (source) {
                safeLogLabel(`🔍 Source bulundu:`, source);

                // Bubble haritalarda da sınır kaynağı GeoJSON,
                // bu nedenle _data üzerinden tekil feature listesi alınır.
                if (source._data) {
                    if (source._data.geojson && source._data.geojson.type === 'FeatureCollection') {
                        geojson = source._data.geojson;
                        safeLogLabel(`🔍 source._data.geojson kullanıldı (bubble): ${geojson.features?.length || 0} feature`);
                    } else if (source._data.type === 'FeatureCollection') {
                        geojson = source._data;
                        safeLogLabel(`🔍 source._data kullanıldı (bubble): ${geojson.features?.length || 0} feature`);
                    }
                }

                // _data yoksa vektör kaynak için querySourceFeatures kullan
                if (!geojson) {
                    try {
                        const features = this.map.querySourceFeatures(sourceName);
                        safeLogLabel(`🔍 querySourceFeatures sonucu: ${features ? features.length : 0} feature`);

                        if (features && features.length > 0) {
                            geojson = {
                                type: 'FeatureCollection',
                                features: features
                            };
                        }
                    } catch (err) {
                        safeWarnLabel('⚠️ querySourceFeatures hatası:', err);
                    }
                }

                if (!geojson) {
                    safeWarnLabel(`⚠️ ${sourceName} source'undan veri alınamadı`);
                    return;
                }
            } else {
                safeWarnLabel(`⚠️ ${sourceName} source bulunamadı`);
                return;
            }
        }

        if (!geojson || !geojson.features || geojson.features.length === 0) {
            safeWarnLabel('⚠️ GeoJSON verisi boş');
            window.showFeedback('Görselleştirme verisi bulunamadı', 'warning');
            return;
        }

        try {
            if (typeof turf === 'undefined') {
                safeErrorLabel('❌ Turf.js yüklenmemiş');
                window.showFeedback('Harita kütüphanesi yüklenmedi', 'error');
                return;
            }

            // Calculate centroids for labels
            // Aynı il/ilçe birden fazla tile içinde yer alabildiği için,
            // isim bazlı tekrarları engellemek adına Set kullanıyoruz.
            const seenNames = new Set();
            const labelFeatures = geojson.features
                .map(feature => {
                    const centroid = turf.centroid(feature);
                    // İlçe haritalarında ILCEAD'ı öncelikle kullan
                    const rawName = feature.properties.name || 
                                   feature.properties.displayName || 
                                   feature.properties.NAME || 
                                   feature.properties.ILCEAD || 
                                   feature.properties.ILAD || '';
                    const name = this.toTitleCase(rawName || '').trim();

                    if (!name) {
                        return null;
                    }

                    // Aynı isme sahip feature'lardan sadece ilkini etiketle
                    if (seenNames.has(name)) {
                        return null;
                    }
                    seenNames.add(name);
                    
                    return {
                        type: 'Feature',
                        geometry: centroid.geometry,
                        properties: {
                            name
                        }
                    };
                })
                .filter(Boolean);
            
            const labelGeoJSON = {
                type: 'FeatureCollection',
                features: labelFeatures
            };
            
            // Add/update label source
            if (this.map.getSource('province-labels-source')) {
                this.map.getSource('province-labels-source').setData(labelGeoJSON);
            } else {
                this.map.addSource('province-labels-source', {
                    type: 'geojson',
                    data: labelGeoJSON
                });
                
            this.map.addLayer({
                id: 'province-labels',
                type: 'symbol',
                source: 'province-labels-source',
                layout: {
                    'text-field': ['get', 'name'],
                    'text-font': ['Noto Sans Regular'], // Use default MapLibre font
                    'text-size': 12,
                    'text-allow-overlap': false,
                    'text-ignore-placement': false
                },
                paint: {
                    'text-color': '#000'
                    // No halo - clean black text
                }
            });
            }
            
            window.showFeedback('✅ İl/İlçe isimleri gösterildi', 'success');
            safeLogLabel('✅ İl/İlçe labels oluşturuldu:', labelFeatures.length, 'label');
        } catch (error) {
            safeErrorLabel('❌ Label oluşturma hatası:', error);
            window.showFeedback('Label oluşturma hatası', 'error');
        }
    }
    
    /**
     * Toggle value labels on visualization
     */
    toggleValueLabels(show) {
        safeLogLabel('📊 toggleValueLabels çağrıldı:', show);
        this.valueLabelsVisible = show;
        
        if (show) {
            this.createValueLabels();
        } else {
            if (this.map.getLayer('value-labels')) {
                this.map.removeLayer('value-labels');
            }
            if (this.map.getSource('value-labels-source')) {
                this.map.removeSource('value-labels-source');
            }
            window.showFeedback('❌ Değer etiketleri gizlendi', 'info');
            safeLogLabel('✅ Value labels gizlendi');
        }
    }
    
    /**
     * Create value labels for choropleth visualization
     */
    async createValueLabels() {
        safeLogLabel('📊 createValueLabels başlatıldı');
        
        if (!window.visualizationManager || !window.visualizationManager.currentVisualization) {
            safeWarnLabel('⚠️ VisualizationManager veya currentVisualization bulunamadı');
            window.showFeedback('Lütfen önce bir veri görselleştirin', 'warning');
            return;
        }
        
        safeLogLabel('🔍 currentVisualization:', window.visualizationManager.currentVisualization);
        
        if (!window.visualizationManager.currentVisualization.type) {
            safeWarnLabel('⚠️ Aktif görselleştirme yok (type null)');
            window.showFeedback('Lütfen önce bir veri görselleştirin', 'warning');
            return;
        }
        
        const viz = window.visualizationManager.currentVisualization;
        let geojson;

        // Get appropriate GeoJSON based on visualization type
        if (viz.type === 'choropleth') {
            const sourceName = window.dataMapOnlyMode ? 'choropleth-data-only' : 'choropleth-source';
            safeLogLabel(`🔍 Aranan source: ${sourceName}`);

            const source = this.map.getSource(sourceName);
            safeLogLabel(`🔍 Source bulundu:`, source);

            if (source) {
                safeLogLabel(`🔍 Source._data:`, source._data);
                safeLogLabel(`🔍 Source type:`, source.type);

                // Try to get data from source using querySourceFeatures
                try {
                    const features = this.map.querySourceFeatures(sourceName);
                    safeLogLabel(`🔍 querySourceFeatures sonucu: ${features ? features.length : 0} feature`);

                    if (features && features.length > 0) {
                        geojson = {
                            type: 'FeatureCollection',
                            features: features
                        };
                    }
                } catch (err) {
                    safeWarnLabel('⚠️ querySourceFeatures hatası:', err);
                }

                // If querySourceFeatures failed or returned no features, try source._data
                if (!geojson && source._data) {
                    // MapLibre GL may store data in different formats
                    if (source._data.geojson) {
                        // Format: {geojson: {type: 'FeatureCollection', features: [...]}}
                        geojson = source._data.geojson;
                        safeLogLabel(`🔍 source._data.geojson kullanıldı: ${geojson.features?.length || 0} feature`);
                    } else if (source._data.type === 'FeatureCollection') {
                        // Format: {type: 'FeatureCollection', features: [...]}
                        geojson = source._data;
                        safeLogLabel(`🔍 source._data kullanıldı: ${geojson.features?.length || 0} feature`);
                    }
                }

                if (!geojson) {
                    safeWarnLabel(`⚠️ ${sourceName} source'undan veri alınamadı`);
                    return;
                }
            } else {
                safeWarnLabel(`⚠️ ${sourceName} source bulunamadı`);
                return;
            }
        } else if (viz.type === 'dot-density') {
            // Dot density - değer etiketleri desteklenmiyor, sadece konum isimleri
            window.showFeedback('⚠️ Dot density haritada değer etiketleri desteklenmiyor', 'warning');
            return;
        } else if (viz.type === 'bubble') {
            // Bubble map için bubble source'u kullan
            const sourceName = 'bubble-source';
            safeLogLabel(`🔍 Aranan source: ${sourceName}`);

            const source = this.map.getSource(sourceName);
            if (source) {
                safeLogLabel(`🔍 Source bulundu:`, source);

                // Try querySourceFeatures first
                try {
                    const features = this.map.querySourceFeatures(sourceName);
                    safeLogLabel(`🔍 querySourceFeatures sonucu: ${features ? features.length : 0} feature`);

                    if (features && features.length > 0) {
                        geojson = {
                            type: 'FeatureCollection',
                            features: features
                        };
                    }
                } catch (err) {
                    safeWarnLabel('⚠️ querySourceFeatures hatası:', err);
                }

                // Fallback to source._data
                if (!geojson && source._data) {
                    if (source._data.geojson) {
                        geojson = source._data.geojson;
                        safeLogLabel(`🔍 source._data.geojson kullanıldı: ${geojson.features?.length || 0} feature`);
                    } else if (source._data.type === 'FeatureCollection') {
                        geojson = source._data;
                        safeLogLabel(`🔍 source._data kullanıldı: ${geojson.features?.length || 0} feature`);
                    }
                }

                if (!geojson) {
                    safeWarnLabel(`⚠️ ${sourceName} source'undan veri alınamadı`);
                    return;
                }
            } else {
                safeWarnLabel(`⚠️ ${sourceName} source bulunamadı`);
                return;
            }
        }

        if (!geojson || !geojson.features || geojson.features.length === 0) {
            safeWarnLabel('⚠️ GeoJSON verisi boş');
            window.showFeedback('Görselleştirme verisi bulunamadı', 'warning');
            return;
        }

        try {
            if (typeof turf === 'undefined') {
                safeErrorLabel('❌ Turf.js yüklenmemiş');
                window.showFeedback('Harita kütüphanesi yüklenmedi', 'error');
                return;
            }

            // Calculate centroids for value labels
            // Aynı il/ilçe için birden fazla feature geldiğinde (özellikle tile bazlı kaynaklarda)
            // değer etiketinin çoğalmasını engellemek için konum anahtarına göre tekilleştiriyoruz.
            const seenLocations = new Set();
            const labelFeatures = geojson.features
                .map(feature => {
                    // Bubble map için koordinat zaten var, centroid hesaplamaya gerek yok
                    const geometry = viz.type === 'bubble'
                        ? feature.geometry
                        : turf.centroid(feature).geometry;

                    const value = viz.type === 'bubble'
                        ? (feature.properties.size || 0)
                        : (feature.properties.value || feature.properties.dataValue || 0);

                    // Konumu tekilleştirmek için mümkün olduğunca stabil bir anahtar üret
                    const locKey = feature.properties.locationId ||
                                   feature.properties.code ||
                                   feature.properties.plate ||
                                   feature.properties.ILCEAD ||
                                   feature.properties.ILAD ||
                                   feature.properties.name ||
                                   feature.id;

                    if (locKey && seenLocations.has(String(locKey))) {
                        return null;
                    }
                    if (locKey) {
                        seenLocations.add(String(locKey));
                    }
                    
                    return {
                        type: 'Feature',
                        geometry,
                        properties: {
                            value: this.formatValue(value)
                        }
                    };
                })
                .filter(f => f && f.properties.value !== '0');
            
            const labelGeoJSON = {
                type: 'FeatureCollection',
                features: labelFeatures
            };
            
            // Add/update value label source
            if (this.map.getSource('value-labels-source')) {
                this.map.getSource('value-labels-source').setData(labelGeoJSON);
            } else {
                this.map.addSource('value-labels-source', {
                    type: 'geojson',
                    data: labelGeoJSON
                });
                
            this.map.addLayer({
                id: 'value-labels',
                type: 'symbol',
                source: 'value-labels-source',
                layout: {
                    'text-field': ['get', 'value'],
                    'text-font': ['Noto Sans Regular'], // Use default MapLibre font
                    'text-size': 11,
                    'text-offset': [0, 1.5],
                    'text-allow-overlap': false
                },
                paint: {
                    'text-color': '#000'
                    // No halo - clean black text
                }
            });
            }
            
            window.showFeedback('✅ Değer etiketleri gösterildi', 'success');
            safeLogLabel('✅ Value labels oluşturuldu:', labelFeatures.length, 'label');
        } catch (error) {
            safeErrorLabel('❌ Value label oluşturma hatası:', error);
            window.showFeedback('Label oluşturma hatası', 'error');
        }
    }
    
    /**
     * Change map mode (normal, data-only, turkey-border)
     */
    changeMapMode(mode) {
        safeLogLabel('🗺️ changeMapMode çağırıldı:', mode);

        // Lazy initialization: visualizationManager yoksa App'ten al
        if (!window.visualizationManager && window.App && window.App.visualizationManager) {
            safeLogLabel('🔄 visualizationManager App\'ten alınıyor...');
            window.visualizationManager = window.App.visualizationManager;
        }

        safeLogLabel('📊 window.visualizationManager:', window.visualizationManager ? 'MEVCUT' : 'YOK');
        safeLogLabel('📊 window.App:', window.App);
        safeLogLabel('📊 currentVisualization:', window.visualizationManager?.currentVisualization);

        if (!window.visualizationManager || !window.visualizationManager.currentVisualization) {
            safeWarnLabel('⚠️ VisualizationManager veya currentVisualization bulunamadı');
            window.showFeedback('Lütfen önce bir veri görselleştirin', 'warning');
            return;
        }

        if (!window.visualizationManager.currentVisualization.type) {
            safeWarnLabel('⚠️ Aktif görselleştirme yok (type null)');
            window.showFeedback('Lütfen önce bir veri görselleştirin', 'warning');
            return;
        }

        // Set global mode flags
        window.currentMapMode = mode;
        window.dataMapOnlyMode = (mode === 'data-only');
        safeLogLabel('✅ Mod flag\'leri ayarlandı:', { currentMapMode: mode, dataMapOnlyMode: window.dataMapOnlyMode });

        const viz = window.visualizationManager.currentVisualization;
        safeLogLabel('🎨 Görselleştirme tipi:', viz.type);
        
        if (mode === 'normal') {
            // NORMAL MOD - Tüm feature'lar görünür
            safeLogLabel('🌍 NORMAL MOD aktif ediliyor...');

            if (viz.type === 'choropleth') {
                const fillLayer = this.map.getLayer('choropleth-fill');
                const outlineLayer = this.map.getLayer('choropleth-outline');
                safeLogLabel('📍 Choropleth layer\'ları:', { fill: !!fillLayer, outline: !!outlineLayer });

                if (fillLayer) {
                    this.map.setPaintProperty('choropleth-fill', 'fill-opacity', 1);
                    safeLogLabel('✅ fill-opacity = 1 (tüm feature\'lar görünür)');
                }

                if (outlineLayer) {
                    this.map.setPaintProperty('choropleth-outline', 'line-opacity', 1);
                    safeLogLabel('✅ line-opacity = 1 (tüm sınırlar görünür)');
                }

                window.showFeedback('🌍 Normal mod: Tüm harita gösteriliyor', 'success');
            } else if (viz.type === 'dot-density') {
                const { data, column, dotValue, dotColor } = viz;
                window.visualizationManager.renderDotDensity(
                    data, column, dotValue || 100, dotColor || '#f97316'
                );
                window.showFeedback('🌍 Normal mod: Tüm harita gösteriliyor', 'success');
            } else if (viz.type === 'bubble') {
                // Bubble için source'u güncelle - TÜM userData'yı göster
                safeLogLabel('🫧 Bubble map normal mod - tüm data gösteriliyor');

                const bubbleSource = this.map.getSource('bubble-source');
                if (bubbleSource && viz.userData) {
                    const allFeatures = viz.userData.map(d => ({
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [d.lon, d.lat] },
                        properties: {
                            name: d.name,
                            size: parseFloat(d[viz.column]) || 0,
                            originalSize: parseFloat(d[viz.column]) || 0
                        }
                    }));

                    bubbleSource.setData({
                        type: 'FeatureCollection',
                        features: allFeatures
                    });

                    safeLogLabel(`✅ Bubble source güncellendi: ${allFeatures.length} nokta (tüm data)`);
                }

                // ✅ YENİ: Boundary layer'ı da TÜM illeri gösterecek şekilde güncelle
                const bubbleBoundarySource = this.map.getSource('bubble-boundary');
                if (bubbleBoundarySource && window.visualizationManager) {
                    const level = viz.level || 'province';
                    const allBoundaryGeoJSON = level === 'district'
                        ? window.visualizationManager.districtsGeoJSON
                        : window.visualizationManager.provincesGeoJSON;

                    if (allBoundaryGeoJSON) {
                        bubbleBoundarySource.setData(allBoundaryGeoJSON);
                        safeLogLabel(`✅ Bubble boundary güncellendi: ${allBoundaryGeoJSON.features.length} il/ilçe sınırı (TÜM harita)`);
                    }
                }

                window.showFeedback('🌍 Normal mod: Tüm harita gösteriliyor', 'success');
            }
        } else if (mode === 'data-only') {
            // SADECE VERİ MODU - Sadece verisi olanlar görünür
            safeLogLabel('🗺️ SADECE VERİ MODU aktif ediliyor...');

            if (viz.type === 'choropleth') {
                const fillLayer = this.map.getLayer('choropleth-fill');
                const outlineLayer = this.map.getLayer('choropleth-outline');
                safeLogLabel('📍 Choropleth layer\'ları:', { fill: !!fillLayer, outline: !!outlineLayer });

                if (fillLayer) {
                    this.map.setPaintProperty('choropleth-fill', 'fill-opacity', [
                        'case',
                        ['get', 'hasData'],
                        1,
                        0
                    ]);
                    safeLogLabel('✅ fill-opacity ayarlandı: hasData ? 1 : 0 (sadece verisi olanlar görünür)');
                }

                if (outlineLayer) {
                    this.map.setPaintProperty('choropleth-outline', 'line-opacity', [
                        'case',
                        ['get', 'hasData'],
                        1,
                        0
                    ]);
                    safeLogLabel('✅ line-opacity ayarlandı: hasData ? 1 : 0 (sadece verisi olan sınırlar görünür)');
                }

                window.showFeedback('🗺️ Sadece veri modu aktif', 'success');
            } else if (viz.type === 'dot-density') {
                const { data, column, dotValue, dotColor } = viz;
                window.visualizationManager.renderDotDensity(
                    data, column, dotValue || 100, dotColor || '#f97316'
                );
                window.showFeedback('🗺️ Sadece veri modu aktif', 'success');
            } else if (viz.type === 'bubble') {
                // Bubble için SADECE source'ları güncelle, yeniden render etme!
                safeLogLabel('🫧 Bubble map sadece veri modu - source güncelleniyor');

                // Bubble source'u filtrele - sadece size > 0 olanlar
                const bubbleSource = this.map.getSource('bubble-source');
                if (bubbleSource && viz.userData) {
                    const filteredFeatures = viz.userData
                        .filter(d => (d[viz.column] || 0) > 0)
                        .map(d => ({
                            type: 'Feature',
                            geometry: { type: 'Point', coordinates: [d.lon, d.lat] },
                            properties: {
                                name: d.name,
                                size: parseFloat(d[viz.column]) || 0,
                                originalSize: parseFloat(d[viz.column]) || 0
                            }
                        }));

                    bubbleSource.setData({
                        type: 'FeatureCollection',
                        features: filteredFeatures
                    });

                    safeLogLabel(`✅ Bubble source güncellendi: ${filteredFeatures.length} nokta`);
                }

                // ✅ YENİ: Boundary layer'ı da filtrele - sadece verisi olan illerin sınırlarını göster
                const bubbleBoundarySource = this.map.getSource('bubble-boundary');

                safeLogLabel('🔍 DEBUG - Boundary filtering:');
                safeLogLabel('  - viz object keys:', Object.keys(viz));
                safeLogLabel('  - viz.userData:', viz.userData ? `${viz.userData.length} item` : 'YOK');
                safeLogLabel('  - viz.data:', viz.data ? `${viz.data.length} item` : 'YOK');
                safeLogLabel('  - bubbleBoundarySource:', bubbleBoundarySource ? 'MEVCUT' : 'YOK');
                safeLogLabel('  - window.visualizationManager:', window.visualizationManager ? 'MEVCUT' : 'YOK');

                if (bubbleBoundarySource && viz.userData && window.visualizationManager) {
                    // Verisi olan il isimlerini al
                    const locationsWithData = new Set(
                        viz.userData
                            .filter(d => (d[viz.column] || 0) > 0)
                            .map(d => window.visualizationManager.normalizeName(d.name))
                    );

                    safeLogLabel('  - Verisi olan konum sayısı:', locationsWithData.size);

                    // Tüm boundary GeoJSON'ı al ve filtrele
                    const level = viz.level || 'province';
                    const allBoundaryGeoJSON = level === 'district'
                        ? window.visualizationManager.districtsGeoJSON
                        : window.visualizationManager.provincesGeoJSON;

                    safeLogLabel('  - Level:', level);
                    safeLogLabel('  - allBoundaryGeoJSON:', allBoundaryGeoJSON ? `${allBoundaryGeoJSON.features.length} feature` : 'YOK');

                    if (allBoundaryGeoJSON) {
                        const filteredBoundary = {
                            type: 'FeatureCollection',
                            features: allBoundaryGeoJSON.features.filter(feature => {
                                const locationName = level === 'district'
                                    ? (feature.properties.ILCEAD || feature.properties.name || feature.properties.NAME)
                                    : (feature.properties.ILAD || feature.properties.name || feature.properties.NAME);
                                return locationsWithData.has(window.visualizationManager.normalizeName(locationName));
                            })
                        };

                        bubbleBoundarySource.setData(filteredBoundary);
                        safeLogLabel(`✅ Bubble boundary güncellendi: ${filteredBoundary.features.length} il/ilçe sınırı (sadece verisi olanlar)`);
                    } else {
                        safeLogLabel('⚠️ allBoundaryGeoJSON bulunamadı, boundary filtrelenemedi');
                    }
                } else {
                    safeLogLabel('⚠️ Boundary filtreleme koşulları sağlanmadı');
                }

                window.showFeedback('🗺️ Sadece veri modu aktif', 'success');
            }
        }
    }
    
    /**
     * Fit map to data bounds (show only visualization area)
     * @deprecated Use changeMapMode instead
     */
    fitToDataBounds(enabled) {
        safeLogLabel('🗺️ fitToDataBounds çağrıldı:', enabled);
        
        if (!window.visualizationManager || !window.visualizationManager.currentVisualization) {
            safeWarnLabel('⚠️ VisualizationManager veya currentVisualization bulunamadı');
            window.showFeedback('Lütfen önce bir veri görselleştirin', 'warning');
            return;
        }
        
        safeLogLabel('🔍 currentVisualization:', window.visualizationManager.currentVisualization);
        
        if (!window.visualizationManager.currentVisualization.type) {
            safeWarnLabel('⚠️ Aktif görselleştirme yok (type null)');
            window.showFeedback('Lütfen önce bir veri görselleştirin', 'warning');
            return;
        }
        
        if (enabled) {
            // Set global flag for "Data Map Only" mode
            window.dataMapOnlyMode = true;
            
            // "Sadece Veri Haritası" MODU - Veri olmayanları gizle ve zoom yap
            const viz = window.visualizationManager.currentVisualization;
            
            if (viz.type === 'choropleth') {
                // 1. Veri olmayan feature'ları gizle (opacity: 0)
                const fillLayer = this.map.getLayer('choropleth-fill');
                const outlineLayer = this.map.getLayer('choropleth-outline');
                
                if (fillLayer) {
                    this.map.setPaintProperty('choropleth-fill', 'fill-opacity', [
                        'case',
                        ['get', 'hasData'],
                        1, // Veri varsa: opacity 1
                        0    // Veri yoksa: opacity 0 (tamamen gizle)
                    ]);
                }
                
                if (outlineLayer) {
                    this.map.setPaintProperty('choropleth-outline', 'line-opacity', [
                        'case',
                        ['get', 'hasData'],
                        1,  // Veri varsa: görünür
                        0   // Veri yoksa: gizle
                    ]);
                }
                
                // No auto-zoom - user requested to remove it
                window.showFeedback('🗺️ Sadece veri haritası modu aktif', 'success');
                safeLogLabel('✅ Sadece veri haritası modu: Veri olmayanlar gizlendi');
            } else if (viz.type === 'dot-density') {
                // Dot density haritalarını yeniden çiz
                safeLogLabel('🔄 Dot density haritasını yeniden çiziyorum (Sadece Veri Haritası modu)');
                const { data, column, level, dotValue, dotColor } = viz;
                window.visualizationManager.createDotDensityMap(
                    data, 
                    column, 
                    level || 'province', 
                    dotValue || 100, 
                    dotColor || '#f97316'
                );
                window.showFeedback('🗺️ Sadece veri haritası modu aktif', 'success');
            }
        } else {
            // Unset global flag
            window.dataMapOnlyMode = false;
            
            // NORMAL MOD - Tüm feature'ları göster ve varsayılan görünüme dön
            const viz = window.visualizationManager.currentVisualization;
            
            if (viz.type === 'choropleth') {
                const fillLayer = this.map.getLayer('choropleth-fill');
                const outlineLayer = this.map.getLayer('choropleth-outline');
                
                
                if (outlineLayer) {
                    this.map.setPaintProperty('choropleth-outline', 'line-opacity', 1);
                }
                
                window.showFeedback('🗺️ Normal mod: Tüm iller gösteriliyor', 'success');
                safeLogLabel('✅ Normal mod aktif: Tüm feature\'lar görünür');
            } else if (viz.type === 'dot-density') {
                // Dot density haritalarını yeniden çiz
                safeLogLabel('🔄 Dot density haritasını yeniden çiziyorum (Normal mod)');
                const { data, column, level, dotValue, dotColor } = viz;
                window.visualizationManager.createDotDensityMap(
                    data, 
                    column, 
                    level || 'province', 
                    dotValue || 100, 
                    dotColor || '#f97316'
                );
                window.showFeedback('🗺️ Normal mod: Tüm iller gösteriliyor', 'success');
            }
        }
    }
    
    /**
     * Clear all labels
     */
    clearAllLabels() {
        this.toggleProvinceLabels(false);
        this.toggleValueLabels(false);
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('❌ Tüm etiketler kaldırıldı');
        }
    }
    
    /**
     * Format value for display
     */
    formatValue(value) {
        if (typeof value !== 'number') return String(value);
        
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            // Binlik değerler için Türkçe kısaltma: B (Bin)
            return `${(value / 1000).toFixed(1)}B`;
        }
        return value.toFixed(0);
    }
    
    /**
     * Convert string to title case
     */
    toTitleCase(str) {
        if (!str) return '';
        
        // Turkish special characters
        const turkishMap = {
            'i': 'İ', 'ı': 'I', 'ş': 'Ş', 'ğ': 'Ğ', 'ü': 'Ü', 'ö': 'Ö', 'ç': 'Ç',
            'İ': 'i', 'I': 'ı', 'Ş': 'ş', 'Ğ': 'ğ', 'Ü': 'ü', 'Ö': 'ö', 'Ç': 'ç'
        };
        
        return str.toLowerCase().split(' ').map(word => {
            if (word.length === 0) return word;
            const first = word[0];
            const upper = turkishMap[first] || first.toUpperCase();
            return upper + word.slice(1);
        }).join(' ');
    }
}

// Initialize when map is ready (optional - lazy initialization is preferred now)
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const initLabelManager = () => {
            if (window.map && typeof window.map.on === 'function') {
                window.map.on('load', () => {
                    // DI Migration: LabelManager should be obtained from ServiceLocator
                    // This auto-initialization is kept for backward compatibility
                    if (!window.labelManager) {
                        if (window.ServiceLocator && window.ServiceLocator.has('labelManager')) {
                            window.labelManager = window.ServiceLocator.get('labelManager');
                            safeLogLabel('✅ LabelManager obtained from DI Container');
                        } else {
                            window.labelManager = new LabelManager(window.map);
                            safeLogLabel('✅ LabelManager created on map load');
                        }
                    } else {
                        safeLogLabel('✅ LabelManager already exists (lazy initialized)');
                    }
                });
            } else {
                // Map not ready yet, wait for it
                setTimeout(initLabelManager, 100);
            }
        };
        initLabelManager();
    });
}

// Browser global export (export the class itself, not the instance)
if (typeof window !== 'undefined') {
    window.Labels = LabelManager;
}
