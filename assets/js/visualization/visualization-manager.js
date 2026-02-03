/**
 * Visualization Manager Module - MapLibre GL JS
 * Choropleth, bubble, dot density visualizations using MapLibre data-driven styling
 */

// Güvenli Logger helper'ları
const safeLogViz = (...args) => (window.Logger && typeof window.Logger.log === 'function') ? window.Logger.log(...args) : console.log(...args);
const safeWarnViz = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorViz = (...args) => (window.Logger && typeof window.Logger.error === 'function') ? window.Logger.error(...args) : console.error(...args);

class VisualizationManager {
    constructor(map, dataManager) {
        this.map = map;
        this.dataManager = dataManager;
        
        // Cached GeoJSON data
        this.provincesGeoJSON = null;
        this.districtsGeoJSON = null;
        
        // Current visualization state
        this.currentVisualization = {
            type: null,
            data: null,
            column: null
        };
        
        // Initialize "Data Map Only" mode flag
        window.dataMapOnlyMode = false;
        
        // Color palette - Viridis
        this.colorScaleFull = [
            '#440154', '#472777', '#3b528b', '#2c728e', '#21918c', 
            '#27ad81', '#5ec962', '#aadc32', '#fde725'
        ];
        this.classCount = 5;
        this.colorScale = this.getColorPalette(5);
        this.classificationMethod = 'quantile';
        
        // Legend settings - default to vertical and ranges
        this.legendLayout = 'vertical';
        this.legendLabelMode = 'ranges'; // 'ranges' or 'labels'
    }

    getColorPalette(count) {
        const step = Math.floor((this.colorScaleFull.length - 1) / (count - 1));
        const palette = [];
        for (let i = 0; i < count; i++) {
            const index = Math.min(i * step, this.colorScaleFull.length - 1);
            palette.push(this.colorScaleFull[index]);
        }
        return palette;
    }

    setClassCount(count) {
        const validCount = Math.max(3, Math.min(7, parseInt(count) || 5));
        this.classCount = validCount;
        this.colorScale = this.getColorPalette(validCount);
    }
    
    /**
     * Load province GeoJSON (81 provinces)
     */
    async loadProvincesGeoJSON() {
        if (this.provincesGeoJSON) return this.provincesGeoJSON;
        
        try {
            // GitHub raw URL - İl verileri
            const response = await fetch('https://raw.githubusercontent.com/emindagg/turkiye_json/main/turkiye.geojson');
            this.provincesGeoJSON = await response.json();
            safeLogViz('✅ İl GeoJSON yüklendi:', this.provincesGeoJSON.features.length, 'il');
            
            // İl indeksini oluştur (column-mapping için)
            this.buildProvinceIndex();
            
            return this.provincesGeoJSON;
        } catch (error) {
            safeErrorViz('❌ İl GeoJSON yüklenemedi:', error);
            return null;
        }
    }
    
    /**
     * Build province index for column mapping
     */
    buildProvinceIndex() {
        if (!this.provincesGeoJSON) return;
        
        window.provinceIndex = {};
        
        this.provincesGeoJSON.features.forEach(feature => {
            const props = feature.properties;
            
            // HGK formatı için ILAD property'sini önceliklendir
            const provinceName = props.ILAD || props.name || props.NAME || props.il_adi || 
                               props.IL_ADI || props.adm1_tr || props.adm1_en || 
                               props.province || props.PROVINCE;
            
            if (provinceName) {
                const normalized = this.normalizeName(provinceName);
                
                window.provinceIndex[normalized] = {
                    name: provinceName,
                    properties: props,
                    geometry: feature.geometry
                };
            }
        });
        
        safeLogViz('✅ İl indeksi oluşturuldu:', Object.keys(window.provinceIndex).length, 'il');
        
        if (Object.keys(window.provinceIndex).length === 0) {
            safeErrorViz('❌ İl indeksi boş! GeoJSON property isimleri kontrol edilmeli.');
        }
    }
    
    /**
     * Load district GeoJSON (973 districts)
     */
    async loadDistrictsGeoJSON() {
        if (this.districtsGeoJSON) return this.districtsGeoJSON;
        
        try {
            // GitHub raw URL - İlçe verileri
            const response = await fetch('https://raw.githubusercontent.com/emindagg/turkiye_json/main/Hgk_ilce_FeaturesToJSON.geojson');
            this.districtsGeoJSON = await response.json();
            safeLogViz('✅ İlçe GeoJSON yüklendi:', this.districtsGeoJSON.features.length, 'ilçe');
            
            // İlçe indeksini oluştur (column-mapping için)
            this.buildDistrictIndex();
            
            return this.districtsGeoJSON;
        } catch (error) {
            safeErrorViz('❌ İlçe GeoJSON yüklenemedi:', error);
            return null;
        }
    }
    
    /**
     * Build district index for column mapping
     * İlçe adlarını normalize edip indeks oluşturur
     */
    buildDistrictIndex() {
        if (!this.districtsGeoJSON) return;
        
        window.districtIndex = {};
        
        this.districtsGeoJSON.features.forEach(feature => {
            const props = feature.properties;
            
            // HGK formatı için ILCEAD ve ILAD property'lerini önceliklendir
            const districtName = props.ILCEAD || props.ILCE_ADI || props.ilce_adi || 
                               props.ilce || props.name || props.NAME || props.ILCE || props.district;
            const provinceName = props.ILAD || props.IL_ADI || props.il_adi || 
                               props.il || props.province || props.PROVINCE || props.IL;
            
            if (districtName) {
                // İsmi normalize et (türkçe karakterler, büyük/küçük harf)
                const normalized = this.normalizeName(districtName);
                
                if (!window.districtIndex[normalized]) {
                    window.districtIndex[normalized] = [];
                }
                
                // İl + İlçe bazlı anahtar oluştur
                const provinceNormalized = provinceName ? this.normalizeName(provinceName) : '';
                const compositeKey = provinceNormalized ? `${provinceNormalized}_${normalized}` : normalized;
                
                window.districtIndex[normalized].push({
                    name: districtName,
                    province: provinceName || 'Bilinmiyor',
                    compositeKey: compositeKey,
                    properties: props,
                    geometry: feature.geometry
                });
            }
        });
        
        safeLogViz('✅ İlçe indeksi oluşturuldu:', Object.keys(window.districtIndex).length, 'benzersiz ilçe adı');
        
        if (Object.keys(window.districtIndex).length === 0) {
            safeErrorViz('❌ İlçe indeksi boş! GeoJSON property isimleri kontrol edilmeli.');
        }
    }
    
    /**
     * Alias haritası - Alternatif il isimleri
     */
    getProvinceAliases() {
        return new Map([
            ['afyon', 'Afyonkarahisar'],
            ['icel', 'Mersin'],
            ['sanliurfa', 'Şanlıurfa'],
            ['urfa', 'Şanlıurfa'],
            ['kmaras', 'Kahramanmaraş'],
            ['antep', 'Gaziantep'],
            ['diyarbakir', 'Diyarbakır'],
            ['mardin', 'Mardin'],
            ['batman', 'Batman'],
            ['sirnak', 'Şırnak']
        ]);
    }

    /**
     * Normalize Turkish text for matching
     * Kapsamlı Türkçe karakter normalizasyonu
     */
    normalizeName(text, skipAliasCheck = false) {
        if (!text) return '';
        
        let normalized = text
            .toLowerCase()
            .trim()
            // Noktalı büyük İ -> i + combining dot (i\u0307) normalizasyonu
            .replace(/i\u0307/g, 'i')
            .replace(/i̇/g, 'i')
            // Türkçe ı -> i
            .replace(/ı/g, 'i')
            // Şapkalı harfleri sadeleştir
            .replace(/[â]/g, 'a')
            .replace(/[î]/g, 'i')
            .replace(/[û]/g, 'u');
        
        // Unicode NFD: diyakritikleri ayır
        try {
            normalized = normalized
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '');
        } catch (e) {
            // Fallback if Unicode property escapes not supported
        }
        
        // Türkçe özel harfleri ASCII'ye yaklaştır
        normalized = normalized
            .replace(/ş/g, 's')
            .replace(/ğ/g, 'g')
            .replace(/ç/g, 'c')
            .replace(/ö/g, 'o')
            .replace(/ü/g, 'u')
            // Alfanumerik olmayan karakterleri kaldır
            .replace(/[^a-z0-9]/g, '');
        
        // Alias kontrolü (sonsuz döngüyü önlemek için skipAliasCheck bayrağı)
        if (!skipAliasCheck) {
            const aliases = this.getProvinceAliases();
            if (aliases.has(normalized)) {
                // Alias değerini normalize et ama alias kontrolünü atla
                return this.normalizeName(aliases.get(normalized), true);
            }
        }
        
        return normalized;
    }
    
    /**
     * Create choropleth (alias for createChoroplethMap for backward compatibility)
     */
    async createChoropleth(userData, column, level = 'province') {
        return await this.createChoroplethMap(userData, column, level);
    }

    /**
     * Choropleth Map - MapLibre data-driven styling
     */
    async createChoroplethMap(userData, column, level = 'province') {
        safeLogViz('Choropleth harita oluşturuluyor:', { userData, column, level });
        
        // Load appropriate GeoJSON
        const geojson = level === 'province' 
            ? await this.loadProvincesGeoJSON()
            : await this.loadDistrictsGeoJSON();
        
        if (!geojson) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('❌ GeoJSON verisi yüklenemedi.', 'error', 3000);
            }
            return;
        }
        
        // Extract values for classification
        const values = userData.map(d => d.value).filter(v => !isNaN(v) && v !== 0);
        
        if (values.length === 0) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('⚠️ Görselleştirme için geçerli veri bulunamadı.', 'warning', 3000);
            }
            return;
        }
        
        // Calculate breaks
        const breaks = this.calculateBreaks(values, this.classificationMethod, this.classCount);
        
        // Create color mapping using normalized names
        // For districts: use composite key (province_district) to avoid ambiguity with same district names
        const dataMap = {};
        userData.forEach(d => {
            const locationName = d.location;
            if (locationName) {
                const normalizedKey = this.normalizeName(locationName);

                // If district level, create composite key with province
                if (level === 'district' && d.originalData && d.originalData._province) {
                    const provinceName = d.originalData._province;
                    const provinceNormalized = this.normalizeName(provinceName);
                    const compositeKey = `${provinceNormalized}_${normalizedKey}`;
                    dataMap[compositeKey] = d.value;
                    safeLogViz(`📍 Mapping: "${provinceName} ${locationName}" → "${compositeKey}" = ${d.value}`);
                } else {
                    // Province level or no province info - use simple key
                    dataMap[normalizedKey] = d.value;
                }
            }
        });
        
        // TÜM feature'ları işle (veri olanlar ve olmayanlar)
        const allFeatures = [];
        const featuresWithData = [];
        const notFoundLocations = [];
        
        geojson.features.forEach(feature => {
            // GeoJSON'dan konum adını al (HGK formatı için ILAD/ILCEAD öncelikli)
            const featureName = level === 'province'
                ? (feature.properties.ILAD || feature.properties.name || feature.properties.NAME || feature.properties.IL_ADI)
                : (feature.properties.ILCEAD || feature.properties.ILCE_ADI || feature.properties.name || feature.properties.NAME);

            // Normalize edilmiş adı kullanarak veri eşleştir
            const normalizedFeatureName = this.normalizeName(featureName);

            // For district level, create composite key with province to avoid ambiguity
            let dataValue;
            if (level === 'district') {
                const featureProvinceName = feature.properties.ILAD || feature.properties.IL_ADI || feature.properties.il_adi || feature.properties.province;
                if (featureProvinceName) {
                    const provinceNormalized = this.normalizeName(featureProvinceName);
                    const compositeKey = `${provinceNormalized}_${normalizedFeatureName}`;
                    dataValue = dataMap[compositeKey];
                } else {
                    // Fallback to simple key if province not found in feature
                    dataValue = dataMap[normalizedFeatureName];
                }
            } else {
                // Province level - use simple key
                dataValue = dataMap[normalizedFeatureName];
            }
            
            // Her feature için temel özellikleri set et
            feature.properties.displayName = featureName;
            feature.properties.name = featureName;
            
            if (dataValue !== undefined && dataValue !== 0) {
                // Veri var
                feature.properties.value = dataValue;
                feature.properties.dataValue = dataValue;
                feature.properties.color = this.getColorForValue(dataValue, breaks);
                feature.properties.hasData = true;
                featuresWithData.push(feature);
            } else {
                // Veri yok - gri renk
                feature.properties.value = 0;
                feature.properties.dataValue = 0;
                feature.properties.color = '#dddddd'; // Açık gri (bubble map ile aynı)
                feature.properties.hasData = false;
            }
            
            allFeatures.push(feature);
        });
        
        // Hangi verilerin haritada bulunamadığını kontrol et
        const geojsonKeys = geojson.features.map(f => {
            const name = level === 'province'
                ? (f.properties.ILAD || f.properties.name || f.properties.NAME || f.properties.IL_ADI)
                : (f.properties.ILCEAD || f.properties.ILCE_ADI || f.properties.name || f.properties.NAME);
            return this.normalizeName(name);
        });
        
        userData.forEach(d => {
            const normalizedLocation = this.normalizeName(d.location);
            const found = geojsonKeys.includes(normalizedLocation);
            
            if (!found) {
                notFoundLocations.push({
                    original: d.location,
                    normalized: normalizedLocation,
                    value: d.value
                });
            }
        });
        
        // Eşleşmeyen konumları özetle
        if (notFoundLocations.length > 0) {
            safeWarnViz(`⚠️ Haritada ${notFoundLocations.length} konum bulunamadı:`, 
                notFoundLocations.map(l => l.original).join(', '));
        }
        
        // Değeri 0 olan konumları özetle
        const zeroValues = userData.filter(d => d.value === 0 || d.value === '0');
        if (zeroValues.length > 0) {
            safeWarnViz(`⚠️ Değeri 0 olan ${zeroValues.length} konum filtrelendi:`, 
                zeroValues.map(l => l.location).join(', '));
        }
        
        // Tüm feature'ları içeren GeoJSON oluştur
        const allFeaturesGeoJSON = {
            type: 'FeatureCollection',
            features: allFeatures
        };
        
        // Sadece veri olanları içeren GeoJSON (zoom için)
        const dataOnlyGeoJSON = {
            type: 'FeatureCollection',
            features: featuresWithData
        };
        
        safeLogViz(`📊 Görselleştirme: ${userData.length} veri → ${featuresWithData.length} ${level === 'province' ? 'il' : 'ilçe'} haritada (Toplam: ${allFeatures.length})`);
        
        // Add source to map (TÜM feature'lar - veri olanlar ve olmayanlar)
        const sourceId = 'choropleth-source';
        if (this.map.getSource(sourceId)) {
            this.map.getSource(sourceId).setData(allFeaturesGeoJSON);
        } else {
            this.map.addSource(sourceId, {
                type: 'geojson',
                data: allFeaturesGeoJSON
            });
        }
        
        // Store data-only GeoJSON for "Data Map Only" mode
        if (this.map.getSource('choropleth-data-only')) {
            this.map.getSource('choropleth-data-only').setData(dataOnlyGeoJSON);
        } else {
            this.map.addSource('choropleth-data-only', {
                type: 'geojson',
                data: dataOnlyGeoJSON
            });
        }
        
        // Create or update layers
        if (!this.map.getLayer('choropleth-fill')) {
            // Add fill layer (altlık haritanın üstüne)
            this.map.addLayer({
                id: 'choropleth-fill',
                type: 'fill',
                source: sourceId,
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 1
                }
            }); // beforeId belirtmeyerek en üste ekle
        } else {
            // Update existing layer paint properties
            this.map.setPaintProperty('choropleth-fill', 'fill-color', ['get', 'color']);
            this.map.setPaintProperty('choropleth-fill', 'fill-opacity', 1);
        }
        
        if (!this.map.getLayer('choropleth-outline')) {
            // Add outline layer (fill'in üstüne)
            this.map.addLayer({
                id: 'choropleth-outline',
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': '#6b7280',
                    'line-width': 1,
                    'line-opacity': 0.8
                }
            }); // beforeId belirtmeyerek en üste ekle
        } else {
            // Update existing layer paint properties
            this.map.setPaintProperty('choropleth-outline', 'line-color', '#6b7280');
            this.map.setPaintProperty('choropleth-outline', 'line-width', 1);
            this.map.setPaintProperty('choropleth-outline', 'line-opacity', 0.8);
        }
        
        // Hover and mouseleave handlers (only add once)
        if (!this.map._choroplethHandlersAdded) {
            
            // Add hover effect with popup
            let hoverPopup = null;
            
            this.map.on('mousemove', 'choropleth-fill', (e) => {
                if (e.features.length > 0) {
                    const feature = e.features[0];
                    
                    // Sadece Veri Haritası AKTİF: Veri olmayanlarda tooltip gösterme
                    // Normal Mod: Tüm illerde tooltip göster
                    if (window.dataMapOnlyMode && !feature.properties.hasData) {
                        if (hoverPopup) {
                            hoverPopup.remove();
                            hoverPopup = null;
                        }
                        this.map.getCanvas().style.cursor = '';
                        return;
                    }
                    
                    // Konum adını al (HGK formatı için ILAD/ILCEAD öncelikli)
                    const locationName = feature.properties.displayName || 
                        (level === 'province'
                            ? (feature.properties.ILAD || feature.properties.name || feature.properties.NAME || feature.properties.IL_ADI)
                            : (feature.properties.ILCEAD || feature.properties.ILCE_ADI || feature.properties.name || feature.properties.NAME));
                    
                    const value = feature.properties.value;
                    
                    // Eski popup varsa kaldır
                    if (hoverPopup) {
                        hoverPopup.remove();
                    }
                    
                    // Yeni popup oluştur
                    hoverPopup = new maplibregl.Popup({ 
                        closeButton: false, 
                        closeOnClick: false,
                        className: 'choropleth-popup'
                    })
                        .setLngLat(e.lngLat)
                        .setHTML(`<strong>${locationName}</strong><br>${column}: ${value.toLocaleString('tr-TR')}`)
                        .addTo(this.map);
                    
                    // Cursor'u pointer yap
                    this.map.getCanvas().style.cursor = 'pointer';
                }
            });
            
            this.map.on('mouseleave', 'choropleth-fill', () => {
                // Popup'ı kaldır
                if (hoverPopup) {
                    hoverPopup.remove();
                    hoverPopup = null;
                }
                
                // Cursor'u normal yap
                this.map.getCanvas().style.cursor = '';
            });
            
            // Mark handlers as added
            this.map._choroplethHandlersAdded = true;
        }
        
        this.currentVisualization = { type: 'choropleth', data: userData, column, breaks };
        
        // Create legend
        this.createLegend(breaks, column);
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`🗺️ Choropleth harita oluşturuldu: ${level === 'province' ? '81 il' : '973 ilçe'}`);
        }
    }

    /**
     * Bubble Map - MapLibre circle layer with data-driven radius
     */
    async createBubbleMap(userData, sizeColumn, colorColumn = null, bubbleColor = '#3b82f6', radiusMultiplier = 1, options = {}) {
        const method = options.method || 'proportional';
        const classCount = options.classCount || 4;
        const classification = options.classification || 'quantile';
        const level = options.level || 'province';
        
        safeLogViz('Bubble harita oluşturuluyor:', { userData, sizeColumn, colorColumn, bubbleColor, radiusMultiplier, method, classCount, classification, level });
        
        // Clear any existing visualization
        this.clearVisualization();
        
        // Create GeoJSON from user data
        let features = userData.map(d => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(d.lon || d.lng), parseFloat(d.lat)]
            },
            properties: {
                name: d.name || d.Il || d.Ilce,
                size: parseFloat(d[sizeColumn]) || 0,
                originalSize: parseFloat(d[sizeColumn]) || 0,
                color: colorColumn ? parseFloat(d[colorColumn]) : 0
            }
        })).filter(f => !isNaN(f.geometry.coordinates[0]) && !isNaN(f.geometry.coordinates[1]));
        
        // "Sadece Veri Haritası" modu aktifse, sadece verisi olan noktaları göster
        if (window.dataMapOnlyMode) {
            features = features.filter(f => f.properties.size > 0);
            safeLogViz('🗺️ Sadece Veri Haritası MODU: Sadece verisi olan noktalar gösterilecek');
            safeLogViz('Filtrelenmiş nokta sayısı:', features.length);
        }
        
        const geojson = {
            type: 'FeatureCollection',
            features: features
        };
        
        // Calculate max size for scaling
        const sizeValues = features.map(f => f.properties.originalSize).filter(v => v > 0);
        const maxSize = Math.max(...sizeValues);
        
        // Graduated yöntemi için sınıflandırma yap
        let breaks = null;
        if (method === 'graduated' && sizeValues.length > 0) {
            breaks = this.calculateBreaks(sizeValues, classification, classCount);
            safeLogViz('Bubble graduated breaks:', breaks);
            
            // Her feature'a sınıfına göre boyut ata
            features.forEach(feature => {
                const value = feature.properties.originalSize;
                if (value > 0) {
                    // Değerin hangi sınıfa ait olduğunu bul
                    let classIndex = 0;
                    for (let i = 0; i < breaks.length - 1; i++) {
                        if (value >= breaks[i] && value <= breaks[i + 1]) {
                            classIndex = i;
                            break;
                        }
                    }
                    
                    // Sınıf orta değerini boyut olarak kullan
                    const classMidpoint = (breaks[classIndex] + breaks[classIndex + 1]) / 2;
                    feature.properties.size = classMidpoint;
                    feature.properties.classIndex = classIndex;
                }
            });
        }
        
        // Arka planda sınırları göster (level'a göre il veya ilçe)
        const boundarySourceGeoJSON = level === 'district' 
            ? await this.loadDistrictsGeoJSON()
            : await this.loadProvincesGeoJSON();
        
        safeLogViz(`🗺️ Bubble boundary: ${level === 'district' ? 'İlçe' : 'İl'} GeoJSON yüklendi`);
        
        if (boundarySourceGeoJSON) {
            // "Sadece Veri" modunda sadece verisi olan bölgelerin border'larını göster
            let boundaryGeoJSON = boundarySourceGeoJSON;
            if (window.dataMapOnlyMode) {
                // Kullanıcı verisindeki konum isimlerini al
                const userLocations = new Set(userData.map(d => this.normalizeName(d.Ilce || d.Il || d.name)));
                
                boundaryGeoJSON = {
                    type: 'FeatureCollection',
                    features: boundarySourceGeoJSON.features.filter(feature => {
                        const locationName = level === 'district'
                            ? (feature.properties.ILCEAD || feature.properties.name || feature.properties.NAME)
                            : (feature.properties.ILAD || feature.properties.name || feature.properties.NAME);
                        return userLocations.has(this.normalizeName(locationName));
                    })
                };
                safeLogViz(`🗺️ Sadece Veri modu: Border sadece verisi olan ${level === 'district' ? 'ilçelerde' : 'illerde'}:`, boundaryGeoJSON.features.length);
            }
            
            const boundarySourceId = 'bubble-boundary';
            if (this.map.getSource(boundarySourceId)) {
                this.map.getSource(boundarySourceId).setData(boundaryGeoJSON);
            } else {
                this.map.addSource(boundarySourceId, {
                    type: 'geojson',
                    data: boundaryGeoJSON
                });
                
                // Arka plan fill
                this.map.addLayer({
                    id: 'bubble-boundary-fill',
                    type: 'fill',
                    source: boundarySourceId,
                    paint: {
                        'fill-color': '#dddddd',
                        'fill-opacity': 1
                    }
                }); // En üste ekle (altlık haritanın üstüne)
                
                // Sınır çizgileri
                this.map.addLayer({
                    id: 'bubble-boundary-line',
                    type: 'line',
                    source: boundarySourceId,
                    paint: {
                        'line-color': '#f0f1f2',
                        'line-width': 1,
                        'line-opacity': 1
                    }
                }); // En üste ekle
            }
        }
        
        // Add source to map
        const sourceId = 'bubble-source';
        if (this.map.getSource(sourceId)) {
            this.map.getSource(sourceId).setData(geojson);
            
            // Radius ve renk propertylerini güncelle
            this.map.setPaintProperty('bubble-circles', 'circle-radius', [
                'interpolate',
                ['linear'],
                ['get', 'size'],
                0, 5 * radiusMultiplier,
                maxSize, 40 * radiusMultiplier
            ]);
            
            this.map.setPaintProperty('bubble-circles', 'circle-color', 
                colorColumn ? [
                    'interpolate',
                    ['linear'],
                    ['get', 'color'],
                    0, this.colorScale[0],
                    Math.max(...features.map(f => f.properties.color)), this.colorScale[this.colorScale.length - 1]
                ] : bubbleColor
            );
        } else {
            this.map.addSource(sourceId, {
                type: 'geojson',
                data: geojson
            });
            
            // Add circle layer with data-driven styling
            this.map.addLayer({
                id: 'bubble-circles',
                type: 'circle',
                source: sourceId,
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['get', 'size'],
                        0, 5 * radiusMultiplier,
                        maxSize, 40 * radiusMultiplier
                    ],
                    'circle-color': colorColumn ? [
                        'interpolate',
                        ['linear'],
                        ['get', 'color'],
                        0, this.colorScale[0],
                        Math.max(...features.map(f => f.properties.color)), this.colorScale[this.colorScale.length - 1]
                    ] : bubbleColor,
                    'circle-opacity': 0.7
                }
            }); // En üste ekle (altlık haritanın üstüne)
            
            // Add hover popup
            let hoverPopup = null;
            
            this.map.on('mouseenter', 'bubble-circles', (e) => {
                this.map.getCanvas().style.cursor = 'pointer';
                
                if (e.features.length > 0) {
                    const feature = e.features[0];
                    
                    // Eski popup varsa kaldır
                    if (hoverPopup) {
                        hoverPopup.remove();
                    }
                    
                    hoverPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
                        .setLngLat(e.lngLat)
                        .setHTML(`
                            <strong>${feature.properties.name}</strong><br>
                            ${sizeColumn}: ${feature.properties.originalSize.toLocaleString('tr-TR')}
                            ${colorColumn ? `<br>${colorColumn}: ${feature.properties.color.toLocaleString('tr-TR')}` : ''}
                        `)
                        .addTo(this.map);
                }
            });
            
            this.map.on('mouseleave', 'bubble-circles', () => {
                this.map.getCanvas().style.cursor = '';
                
                // Popup'ı kaldır
                if (hoverPopup) {
                    hoverPopup.remove();
                    hoverPopup = null;
                }
            });
        }
        
        // ❌ KALDIRILDI: currentVisualization burada override edilmemeli!
        // renderBubbleMap zaten doğru şekilde set ediyor (matchedData + userData ile)
        // this.currentVisualization = {
        //     type: 'bubble',
        //     data: userData,
        //     column: sizeColumn,
        //     sizeColumn,
        //     colorColumn,
        //     bubbleColor,
        //     radiusMultiplier,
        //     options
        // };

        // Bubble lejantını oluştur
        this.createBubbleLegend(sizeColumn, sizeValues, maxSize, bubbleColor, radiusMultiplier, method, breaks);
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`🫧 Bubble harita oluşturuldu: ${features.length} nokta`);
        }
    }

    /**
     * Dot Density Map - Random points within polygons
     */
    async createDotDensityMap(userData, column, level = 'province', dotValue = 100, dotColor = '#f97316') {
        // Validate dotValue
        dotValue = Math.max(1, parseInt(dotValue) || 100);
        
        // Clear any existing visualization
        this.clearVisualization();
        
        // Load appropriate GeoJSON
        const geojson = level === 'province' 
            ? await this.loadProvincesGeoJSON()
            : await this.loadDistrictsGeoJSON();
        
        if (!geojson) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('❌ GeoJSON verisi yüklenemedi.', 'error', 3000);
            }
            return;
        }

        // Create data mapping (use composite key for districts to avoid ambiguity)
        const dataMap = {};
        let maxValue = 0;
        safeLogViz('=== VERI EŞLEŞTİRME ===');
        safeLogViz('Level:', level);
        userData.forEach(d => {
            const key = level === 'province' ? d['Il'] : d['Ilce'];
            const normalizedKey = this.normalizeName(key);
            const value = parseFloat(d[column]) || 0;

            // For districts, use composite key (province_district) to avoid ambiguity
            if (level === 'district' && d._province) {
                const provinceName = d._province;
                const provinceNormalized = this.normalizeName(provinceName);
                const compositeKey = `${provinceNormalized}_${normalizedKey}`;
                dataMap[compositeKey] = value;
                safeLogViz(`${provinceName} ${key} -> ${compositeKey} = ${value}`);
            } else {
                // Province level or no province info - use simple key
                dataMap[normalizedKey] = value;
                safeLogViz(`${key} -> ${normalizedKey} = ${value}`);
            }

            maxValue = Math.max(maxValue, value);
        });
        safeLogViz('Toplam veri sayısı:', Object.keys(dataMap).length);
        safeLogViz('========================');
        
        // "Sadece Veri Haritası" modu aktifse, sadece verisi olan feature'ları kullan
        let filteredGeoJSON = geojson;
        if (window.dataMapOnlyMode) {
            filteredGeoJSON = {
                type: 'FeatureCollection',
                features: geojson.features.filter(feature => {
                    const rawName = level === 'province'
                        ? (feature.properties.ILAD || feature.properties.name || feature.properties.NAME)
                        : (feature.properties.ILCEAD || feature.properties.name || feature.properties.NAME);
                    const normalizedName = this.normalizeName(rawName);

                    // For district level, check composite key
                    if (level === 'district') {
                        const featureProvinceName = feature.properties.ILAD || feature.properties.IL_ADI || feature.properties.il_adi || feature.properties.province;
                        if (featureProvinceName) {
                            const provinceNormalized = this.normalizeName(featureProvinceName);
                            const compositeKey = `${provinceNormalized}_${normalizedName}`;
                            return (dataMap[compositeKey] || dataMap[normalizedName]) > 0;
                        }
                    }

                    return dataMap[normalizedName] > 0;
                })
            };
            safeLogViz('🗺️ Sadece Veri Haritası MODU: Sadece verisi olan feature\'lar gösterilecek');
            safeLogViz('Filtrelenmiş feature sayısı:', filteredGeoJSON.features.length);
        }
        
        // Kullanıcının seçtiği dotValue'yu kullan (otomatik ayarlama yok)
        
        // Generate random points
        const allPoints = [];
        let totalValue = 0;
        let matchedFeatures = 0;
        let processedFeatures = 0;
        let totalExpectedPoints = 0;
        
        // Show progress for large datasets
        const totalFeatures = filteredGeoJSON.features.length;
        
        safeLogViz('=== GEOJSON FEATURE EŞLEŞTİRME ===');
        safeLogViz('Toplam GeoJSON feature:', totalFeatures);
        
        for (const feature of filteredGeoJSON.features) {
            processedFeatures++;

            // Level'a göre doğru property'yi seç
            const rawName = level === 'province'
                ? (feature.properties.ILAD || feature.properties.name || feature.properties.NAME)
                : (feature.properties.ILCEAD || feature.properties.name || feature.properties.NAME);
            const normalizedName = this.normalizeName(rawName);

            // For district level, use composite key with province
            let value;
            if (level === 'district') {
                const featureProvinceName = feature.properties.ILAD || feature.properties.IL_ADI || feature.properties.il_adi || feature.properties.province;
                if (featureProvinceName) {
                    const provinceNormalized = this.normalizeName(featureProvinceName);
                    const compositeKey = `${provinceNormalized}_${normalizedName}`;
                    value = dataMap[compositeKey] || 0;
                } else {
                    // Fallback to simple key if province not found
                    value = dataMap[normalizedName] || 0;
                }
            } else {
                // Province level - use simple key
                value = dataMap[normalizedName] || 0;
            }
            // Değer 0'dan büyükse en az 1 nokta üret
            const pointCount = value > 0 ? Math.max(1, Math.round(value / dotValue)) : 0;
            
            if (processedFeatures <= 3) {
                safeLogViz(`Feature ${processedFeatures}: ${rawName} -> ${normalizedName}, value=${value}, pointCount=${pointCount}`);
            }
            
            if (value > 0) {
                totalValue += value;
                matchedFeatures++;
                totalExpectedPoints += pointCount;
            }
            
            if (pointCount > 0) {
                const geometryType = feature.geometry.type;
                
                // Handle both Polygon and MultiPolygon
                if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
                    try {
                        let addedCount = 0;
                        const maxIterations = 30;
                        let iteration = 0;
                        
                        // TAM nokta sayısına ulaşana kadar rastgele noktalar üret
                        while (addedCount < pointCount && iteration < maxIterations) {
                            const remaining = pointCount - addedCount;
                            const batchSize = Math.max(remaining * 10, 100);
                            const pointsInside = turf.randomPoint(batchSize, { bbox: turf.bbox(feature) });
                            
                            for (const point of pointsInside.features) {
                                if (addedCount >= pointCount) break;
                                
                                try {
                                    if (turf.booleanPointInPolygon(point, feature)) {
                                        allPoints.push(point);
                                        addedCount++;
                                    }
                                } catch (err) {
                                    continue;
                                }
                            }
                            
                            iteration++;
                        }
                        
                        // Eksik varsa centroid ile tamamla
                        if (addedCount < pointCount) {
                            const centroid = turf.centroid(feature);
                            const remaining = pointCount - addedCount;
                            for (let i = 0; i < remaining; i++) {
                                allPoints.push(centroid);
                            }
                        }
                    } catch (error) {
                        // Hata oluştu
                    }
                }
            }
        }
        
        safeLogViz('=== SONUÇ ===');
        safeLogViz('Toplam nokta:', allPoints.length);
        safeLogViz('Eşleşen feature:', matchedFeatures);
        safeLogViz('Toplam değer:', totalValue);
        safeLogViz('Beklenen nokta:', totalExpectedPoints);
        safeLogViz('=============');
        
        if (allPoints.length === 0) {
            safeErrorViz('❌ Nokta üretilemedi!');
            safeErrorViz('DataMap keys:', Object.keys(dataMap));
            safeErrorViz('Matched features:', matchedFeatures);
            alert('Nokta üretilemedi. Veri değerleriniz çok küçük veya eşleşme sorunu var.\n\nÖneriler:\n- Her noktanın temsil ettiği değeri azaltın (daha küçük sayı)\n- Veri sütununuzun doğru seçildiğinden emin olun\n- İl/ilçe eşleştirmesini kontrol edin');
            return;
        }
        
        const pointsGeoJSON = {
            type: 'FeatureCollection',
            features: allPoints
        };
        
        // İl/ilçe sınırlarını ekle (boundary layer)
        const boundarySourceId = 'dot-density-boundary';
        if (this.map.getSource(boundarySourceId)) {
            this.map.getSource(boundarySourceId).setData(filteredGeoJSON);
        } else {
            this.map.addSource(boundarySourceId, {
                type: 'geojson',
                data: filteredGeoJSON
            });
            
            // Arka plan fill (önce fill ekle)
            this.map.addLayer({
                id: 'dot-density-boundary-fill',
                type: 'fill',
                source: boundarySourceId,
                paint: {
                    'fill-color': '#dddddd',
                    'fill-opacity': 1
                }
            }); // En üste ekle (altlık haritanın üstüne)
            
            // Sınır çizgisi katmanı (fill'in üstüne)
            this.map.addLayer({
                id: 'dot-density-boundary-line',
                type: 'line',
                source: boundarySourceId,
                paint: {
                    'line-color': '#f0f1f2',
                    'line-width': 1,
                    'line-opacity': 1
                }
            }); // En üste ekle
        }
        
        // Nokta katmanını ekle
        const sourceId = 'dot-density-source';
        if (this.map.getSource(sourceId)) {
            this.map.getSource(sourceId).setData(pointsGeoJSON);
        } else {
            this.map.addSource(sourceId, {
                type: 'geojson',
                data: pointsGeoJSON
            });
            
            this.map.addLayer({
                id: 'dot-density-points',
                type: 'circle',
                source: sourceId,
                paint: {
                    'circle-radius': 2,
                    'circle-color': dotColor,
                    'circle-opacity': 0.8
                }
            }); // En üste ekle (altlık haritanın üstüne)
        }
        
        // Eğer layer zaten varsa rengi güncelle
        if (this.map.getLayer('dot-density-points')) {
            this.map.setPaintProperty('dot-density-points', 'circle-color', dotColor);
        }
        
        this.currentVisualization = { 
            type: 'dot-density', 
            data: userData, 
            column,
            level,
            dotValue,
            dotColor,
            totalPoints: allPoints.length // Lejant için toplam nokta sayısını sakla
        };
        
        // Choropleth lejant bilgilerini temizle (dot density kendi lejantını kullanır)
        this.currentBreaks = null;
        
        // Dot density lejantını oluştur
        this.createDotDensityLegend(column, dotValue, allPoints.length, dotColor);
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`🔴 ${allPoints.length} nokta oluşturuldu (her nokta ${dotValue.toLocaleString('tr-TR')} değer temsil ediyor)`);
        }
    }
    
    /**
     * Create simple legend for dot density map
     */
    createDotDensityLegend(column, dotValue, totalPoints, dotColor = '#f97316') {
        // Remove existing legend
        this.removeLegend();
        
        // Create legend container
        const legendContainer = document.createElement('div');
        legendContainer.id = 'map-legend';
        legendContainer.className = 'map-legend';
        legendContainer.style.cssText = `
            position: absolute;
            bottom: 30px;
            right: 10px;
            background: transparent;
            padding: 8px 10px;
            border-radius: 4px;
            
            font-family: Arial, sans-serif;
            z-index: 1000;
            min-width: 160px;
        `;
        
        // Legend title (editable)
        const title = document.createElement('div');
        title.id = 'legend-title';
        title.className = 'legend-title';
        title.style.cssText = `
            font-weight: 600;
            font-size: 11px;
            color: #000;
            margin-bottom: 6px;
            padding: 2px 4px;
            border-radius: 2px;
            outline: none;
            cursor: pointer;
        `;
        title.contentEditable = 'false';
        title.textContent = column || 'Nokta Yoğunluğu';
        title.title = 'Çift tıklayarak düzenleyin';
        
        // Make title editable on double-click
        let isEditMode = false;
        
        title.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isEditMode = true;
            title.contentEditable = 'true';
            title.style.backgroundColor = '#fef3c7';
            title.style.cursor = 'text';
            title.focus();
            
            const range = document.createRange();
            range.selectNodeContents(title);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });
        
        title.addEventListener('blur', () => {
            if (isEditMode) {
                isEditMode = false;
                title.contentEditable = 'false';
                title.style.backgroundColor = 'transparent';
                title.style.cursor = 'pointer';
            }
        });
        
        title.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                title.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                title.textContent = column || 'Nokta Yoğunluğu';
                title.blur();
            }
        });
        
        legendContainer.appendChild(title);
        
        // Dot symbol and value
        const dotSymbol = document.createElement('div');
        dotSymbol.style.cssText = 'display: flex; align-items: center;';
        dotSymbol.innerHTML = `
            <div style="
                width: 10px;
                height: 10px;
                background: ${dotColor};
                border-radius: 50%;
                margin-right: 6px;
                opacity: 0.8;
            "></div>
            <span style="font-size: 11px; color: #000;">
                = ${dotValue.toLocaleString('tr-TR')}
            </span>
        `;
        legendContainer.appendChild(dotSymbol);
        
        // Add to map container
        const mapContainer = this.map.getContainer();
        mapContainer.appendChild(legendContainer);
        
        // Make legend draggable
        this.makeLegendDraggable(legendContainer, () => isEditMode);
    }
    
    /**
     * Clear all visualizations
     */
    clearVisualization() {
        const layerIds = [
            'choropleth-fill',
            'choropleth-outline',
            'bubble-circles',
            'bubble-boundary-fill',      // ✅ Bubble map için SVG harita arka planı
            'bubble-boundary-line',      // ✅ Bubble map için SVG harita sınırları
            'dot-density-points',
            'dot-density-boundary-line',
            'dot-density-boundary-fill'
        ];
        const sourceIds = [
            'choropleth-source',
            'choropleth-data-only',      // ✅ Data-only mode için
            'bubble-source',
            'bubble-boundary',           // ✅ Bubble map için SVG boundary source
            'dot-density-source',
            'dot-density-boundary'
        ];

        layerIds.forEach(id => {
            if (this.map.getLayer(id)) {
                this.map.removeLayer(id);
                safeLogViz(`🗑️ Layer silindi: ${id}`);
            }
        });

        sourceIds.forEach(id => {
            if (this.map.getSource(id)) {
                this.map.removeSource(id);
                safeLogViz(`🗑️ Source silindi: ${id}`);
            }
        });

        // Remove legend if exists
        this.removeLegend();

        this.currentVisualization = { type: null, data: null, column: null };

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('❌ Görselleştirme temizlendi');
        }
    }
    
    /**
     * Create legend for choropleth visualization
     */
    createLegend(breaks, column) {
        // Remove existing legend
        this.removeLegend();
        
        // Store breaks for color updates
        this.currentBreaks = breaks;
        
        const layout = this.legendLayout || 'vertical';
        const legendType = this.legendType || 'discrete';
        
        // Create legend container
        const legendContainer = document.createElement('div');
        legendContainer.id = 'map-legend';
        legendContainer.className = `map-legend ${layout}`;
        legendContainer.style.cssText = `
            position: absolute;
            bottom: 30px;
            right: 10px;
            background: transparent;
            padding: 15px;
            border-radius: 8px;
            
            font-family: Arial, sans-serif;
            z-index: 1000;
            min-width: ${layout === 'horizontal' ? '300px' : 'auto'};
        `;
        
        // Legend title (editable)
        const title = document.createElement('div');
        title.id = 'legend-title';
        title.className = 'legend-title';
        title.style.cssText = `
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 13px;
            color: #000;
            padding: 4px 6px;
            border-radius: 4px;
            transition: background-color 0.2s;
            outline: none;
            cursor: pointer;
        `;
        title.contentEditable = 'false';
        title.textContent = column || 'Değer';
        
        // Add edit hint on hover
        title.title = 'Çift tıklayarak düzenleyin';
        
        // Make title editable on double-click
        let isEditMode = false;
        
        title.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Sürüklemeyi engelle
            isEditMode = true;
            title.contentEditable = 'true';
            title.style.backgroundColor = '#fff3cd';
            title.style.cursor = 'text';
            title.focus();
            
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(title);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });
        
        title.addEventListener('blur', () => {
            if (isEditMode) {
                isEditMode = false;
                title.contentEditable = 'false';
                title.style.backgroundColor = 'transparent';
                title.style.cursor = 'pointer';
            }
        });
        
        title.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                title.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                title.textContent = column || 'Değer';
                title.blur();
            }
        });
        
        // Hover effect
        title.addEventListener('mouseenter', () => {
            if (!isEditMode) {
                title.style.backgroundColor = '#f8f9fa';
            }
        });
        
        title.addEventListener('mouseleave', () => {
            if (!isEditMode) {
                title.style.backgroundColor = 'transparent';
            }
        });
        
        legendContainer.appendChild(title);
        
        // Legend items container
        const itemsContainer = document.createElement('div');
        
        // For discrete-like legends, set flex layout
        // For continuous/quantized legends, let the create function handle the layout
        if (legendType === 'discrete' || legendType === 'diverging' || legendType === 'categorical') {
            itemsContainer.style.cssText = layout === 'horizontal' 
                ? 'display: flex; gap: 10px; flex-wrap: wrap;'
                : 'display: flex; flex-direction: column; gap: 5px;';
        }
        
        // Create legend items based on type
        if (legendType === 'continuous') {
            this.createContinuousLegend(itemsContainer, breaks, layout);
        } else if (legendType === 'quantized') {
            this.createQuantizedLegend(itemsContainer, breaks, layout);
        } else if (legendType === 'diverging') {
            this.createDivergingLegend(itemsContainer, breaks, layout);
        } else if (legendType === 'categorical') {
            this.createCategoricalLegend(itemsContainer, breaks, layout);
        } else {
            // Default: discrete
            this.createDiscreteLegend(itemsContainer, breaks, layout);
        }
        
        legendContainer.appendChild(itemsContainer);
        
        // Add to map
        const mapContainer = this.map.getContainer();
        mapContainer.appendChild(legendContainer);
        
        // Make legend draggable (but not when editing title)
        this.makeLegendDraggable(legendContainer, () => isEditMode);
        
        safeLogViz('✅ Lejant oluşturuldu (başlık düzenlenebilir)');
    }
    
    /**
     * Create bubble legend for size reference
     */
    createBubbleLegend(column, sizeValues, maxSize, bubbleColor, radiusMultiplier, method = 'proportional', breaks = null) {
        // Remove existing legend
        this.removeLegend();
        
        const layout = this.legendLayout || 'vertical';
        
        // Create legend container
        const legendContainer = document.createElement('div');
        legendContainer.id = 'map-legend';
        legendContainer.className = `map-legend ${layout}`;
        legendContainer.style.cssText = `
            position: absolute;
            bottom: 30px;
            right: 10px;
            background: transparent;
            padding: 15px;
            border-radius: 8px;
            
            font-family: Arial, sans-serif;
            z-index: 1000;
            min-width: ${layout === 'horizontal' ? '300px' : 'auto'};
        `;
        
        // Legend title (editable)
        const title = document.createElement('div');
        title.id = 'legend-title';
        title.className = 'legend-title';
        title.style.cssText = `
            font-weight: bold;
            margin-bottom: 12px;
            font-size: 13px;
            color: #000;
            padding: 4px 6px;
            border-radius: 4px;
            transition: background-color 0.2s;
            outline: none;
            cursor: pointer;
        `;
        title.contentEditable = 'false';
        title.textContent = column || 'Değer';
        title.title = 'Çift tıklayarak düzenleyin';
        
        // Make title editable
        let isEditMode = false;
        
        title.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isEditMode = true;
            title.contentEditable = 'true';
            title.style.backgroundColor = '#fff3cd';
            title.style.cursor = 'text';
            title.focus();
            
            const range = document.createRange();
            range.selectNodeContents(title);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });
        
        title.addEventListener('blur', () => {
            if (isEditMode) {
                isEditMode = false;
                title.contentEditable = 'false';
                title.style.backgroundColor = 'transparent';
                title.style.cursor = 'pointer';
            }
        });
        
        title.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                title.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                title.textContent = column || 'Değer';
                title.blur();
            }
        });
        
        title.addEventListener('mouseenter', () => {
            if (!isEditMode) {
                title.style.backgroundColor = '#f8f9fa';
            }
        });
        
        title.addEventListener('mouseleave', () => {
            if (!isEditMode) {
                title.style.backgroundColor = 'transparent';
            }
        });
        
        legendContainer.appendChild(title);
        
        // Calculate representative sizes
        let legendSizes;
        
        if (method === 'graduated' && breaks && breaks.length > 1) {
            // Graduated: Sınıf aralıklarını göster (her zaman range context)
            legendSizes = [];
            for (let i = breaks.length - 2; i >= 0; i--) {
                const classMidpoint = (breaks[i] + breaks[i + 1]) / 2;
                const label = `${this.formatLegendValue(breaks[i], true)} - ${this.formatLegendValue(breaks[i + 1], true)}`;
                legendSizes.push({ value: classMidpoint, label, isRange: true });
            }
        } else {
            // Proportional: Çeyrekler (her zaman label context)
            const sortedSizes = [...sizeValues].filter(v => v > 0).sort((a, b) => a - b);
            const minSize = sortedSizes[0];
            const q1 = sortedSizes[Math.floor(sortedSizes.length * 0.25)];
            const median = sortedSizes[Math.floor(sortedSizes.length * 0.5)];
            const q3 = sortedSizes[Math.floor(sortedSizes.length * 0.75)];
            
            legendSizes = [
                { value: maxSize, label: this.formatLegendValue(maxSize, false), isRange: false },
                { value: q3, label: this.formatLegendValue(q3, false), isRange: false },
                { value: median, label: this.formatLegendValue(median, false), isRange: false },
                { value: minSize, label: this.formatLegendValue(minSize, false), isRange: false }
            ];
        }
        
        // Container for circles
        const circlesContainer = document.createElement('div');
        circlesContainer.style.cssText = layout === 'horizontal'
            ? `
                display: flex;
                flex-direction: row;
                gap: 15px;
                align-items: flex-end;
                justify-content: center;
            `
            : `
                display: flex;
                flex-direction: column;
                gap: 8px;
                align-items: flex-start;
            `;
        
        legendSizes.forEach(({ value, label }) => {
            // Calculate radius (matching map circle size calculation)
            const normalizedValue = value / maxSize; // 0-1
            const radius = 5 + (normalizedValue * 35); // 5-40
            const scaledRadius = radius * radiusMultiplier;
            
            const item = document.createElement('div');
            item.style.cssText = layout === 'horizontal'
                ? `
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                `
                : `
                    display: flex;
                    align-items: center;
                    gap: 12px;
                `;
            
            // Circle
            const circle = document.createElement('div');
            circle.style.cssText = `
                width: ${scaledRadius * 2}px;
                height: ${scaledRadius * 2}px;
                border-radius: 50%;
                background-color: ${bubbleColor};
                opacity: 0.7;
                flex-shrink: 0;
            `;
            
            // Label
            const labelEl = document.createElement('span');
            labelEl.style.cssText = `
                font-size: 11px;
                color: #000;
            `;
            labelEl.textContent = label;
            
            item.appendChild(circle);
            item.appendChild(labelEl);
            circlesContainer.appendChild(item);
        });
        
        legendContainer.appendChild(circlesContainer);
        
        // Add to map
        const mapContainer = this.map.getContainer();
        mapContainer.appendChild(legendContainer);
        
        // Make legend draggable (but not when editing title)
        this.makeLegendDraggable(legendContainer, () => isEditMode);
        
        safeLogViz(`✅ Bubble lejantı oluşturuldu (${layout})`);
    }
    
    /**
     * Create discrete legend (default)
     */
    createDiscreteLegend(container, breaks, layout) {
        const isVertical = layout === 'vertical';
        
        // Safety check for breaks
        if (!breaks || !Array.isArray(breaks) || breaks.length < 2) {
            safeWarnViz('Invalid breaks array provided to createDiscreteLegend');
            return;
        }
        
        if (isVertical) {
            // Vertical mode - classic style
            const indices = Array.from({length: breaks.length - 1}, (_, i) => breaks.length - 2 - i);
            
            indices.forEach(i => {
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 3px;';
                
                const colorBox = document.createElement('div');
                colorBox.className = 'legend-color-box';
                colorBox.dataset.classIndex = i;
                colorBox.style.cssText = `
                    width: 20px;
                    height: 20px;
                    background-color: ${this.colorScale[i]};
                    border: 1px solid rgba(0,0,0,0.1);
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: all 0.2s;
                `;
                colorBox.title = 'Rengi değiştirmek için tıklayın';
                
                colorBox.addEventListener('mouseenter', () => {
                    colorBox.style.borderColor = '#007bff';
                    colorBox.style.transform = 'scale(1.1)';
                });
                
                colorBox.addEventListener('mouseleave', () => {
                    colorBox.style.borderColor = 'rgba(0,0,0,0.1)';
                    colorBox.style.transform = 'scale(1)';
                });
                
                colorBox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openColorPicker(i, colorBox);
                });
                
                const label = document.createElement('span');
                label.style.cssText = 'font-size: 11px; color: #000; white-space: nowrap;';
                
                if (this.legendLabelMode === 'labels') {
                    // Labels mode: show only upper bound with ≤ symbol
                    const max = this.formatLegendValue(breaks[i + 1]);
                    label.textContent = `≤ ${max}`;
                } else {
                    // Ranges mode: show min - max
                    const min = this.formatLegendValue(breaks[i]);
                    const max = this.formatLegendValue(breaks[i + 1]);
                    label.textContent = `${min} - ${max}`;
                }
                
                item.appendChild(colorBox);
                item.appendChild(label);
                container.appendChild(item);
            });
        } else {
            // Horizontal mode - Datawrapper style
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start;';
            
            // Color boxes container
            const colorsContainer = document.createElement('div');
            colorsContainer.style.cssText = 'display: flex; gap: 0;';
            
            // Labels container
            const labelsContainer = document.createElement('div');
            labelsContainer.style.cssText = 'display: flex; position: relative; width: 100%; margin-top: 4px;';
            
            for (let i = 0; i < breaks.length - 1; i++) {
                const colorBox = document.createElement('div');
                colorBox.className = 'legend-color-box';
                colorBox.dataset.classIndex = i;
                colorBox.style.cssText = `
                    width: 50px;
                    height: 20px;
                    background-color: ${this.colorScale[i]};
                    border-right: 1px solid rgba(255,255,255,0.3);
                    cursor: pointer;
                    transition: all 0.2s;
                `;
                colorBox.title = 'Rengi değiştirmek için tıklayın';
                
                colorBox.addEventListener('mouseenter', () => {
                    colorBox.style.opacity = '0.8';
                });
                
                colorBox.addEventListener('mouseleave', () => {
                    colorBox.style.opacity = '1';
                });
                
                colorBox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openColorPicker(i, colorBox);
                });
                
                colorsContainer.appendChild(colorBox);
            }
            
            // Add labels based on mode
            if (this.legendLabelMode === 'labels') {
                // Labels mode: show break points
                for (let i = 0; i < breaks.length; i++) {
                    const label = document.createElement('span');
                    label.style.cssText = `
                        position: absolute;
                        left: ${(i / (breaks.length - 1)) * 100}%;
                        transform: translateX(-50%);
                        font-size: 10px;
                        color: #000;
                        white-space: nowrap;
                        font-weight: 500;
                    `;
                    
                    if (i === 0) {
                        label.style.left = '0';
                        label.style.transform = 'translateX(0)';
                    } else if (i === breaks.length - 1) {
                        label.style.left = 'auto';
                        label.style.right = '0';
                        label.style.transform = 'translateX(0)';
                    }
                    
                    label.textContent = this.formatLegendValue(breaks[i]);
                    labelsContainer.appendChild(label);
                }
            } else {
                // Ranges mode: show min-max for each color box
                for (let i = 0; i < breaks.length - 1; i++) {
                    const label = document.createElement('span');
                    label.style.cssText = `
                        position: absolute;
                        left: ${((i + 0.5) / (breaks.length - 1)) * 100}%;
                        transform: translateX(-50%);
                        font-size: 10px;
                        color: #000;
                        white-space: nowrap;
                        font-weight: 500;
                    `;
                    
                    const min = this.formatLegendValue(breaks[i]);
                    const max = this.formatLegendValue(breaks[i + 1]);
                    label.textContent = `${min}-${max}`;
                    labelsContainer.appendChild(label);
                }
            }
            
            wrapper.appendChild(colorsContainer);
            wrapper.appendChild(labelsContainer);
            container.appendChild(wrapper);
        }
    }
    
    /**
     * Create continuous legend (gradient)
     */
    createContinuousLegend(container, breaks, layout) {
        const isVertical = layout === 'vertical';
        
        // Safety check for breaks
        if (!breaks || !Array.isArray(breaks) || breaks.length < 2) {
            safeWarnViz('Invalid breaks array provided to createContinuousLegend');
            return;
        }
        
        // Wrapper for gradient
        const gradientWrapper = document.createElement('div');
        gradientWrapper.style.cssText = 'position: relative;';
        
        // Gradient bar
        const gradientBar = document.createElement('div');
        gradientBar.id = 'legend-gradient-bar';
        
        if (isVertical) {
            // Dikey modda: en yüksek üstte, en düşük altta (reverse gradient)
            const reversedColors = [...this.colorScale].reverse();
            gradientBar.style.cssText = `
                width: 20px;
                height: 150px;
                background: linear-gradient(to bottom, ${reversedColors.join(', ')});
                border: 1px solid #ccc;
                position: relative;
            `;
        } else {
            gradientBar.style.cssText = `
                width: 100%;
                height: 20px;
                background: linear-gradient(to right, ${this.colorScale.join(', ')});
                border: 1px solid #ccc;
            `;
        }
        
        gradientWrapper.appendChild(gradientBar);
        
        // Labels
        const labelsContainer = document.createElement('div');
        
        if (isVertical) {
            labelsContainer.style.cssText = 'display: flex; flex-direction: column; justify-content: space-between; font-size: 10px; color: #000; height: 150px;';
        } else {
            labelsContainer.style.cssText = 'display: flex; justify-content: space-between; font-size: 10px; color: #000; margin-top: 5px;';
        }
        
        const minLabel = document.createElement('span');
        minLabel.textContent = this.formatLegendValue(breaks[0]);
        
        const maxLabel = document.createElement('span');
        maxLabel.textContent = this.formatLegendValue(breaks[breaks.length - 1]);
        
        if (isVertical) {
            // Dikey modda: max üstte, min altta
            labelsContainer.appendChild(maxLabel);
            labelsContainer.appendChild(minLabel);
        } else {
            // Yatay modda: min solda, max sağda
            labelsContainer.appendChild(minLabel);
            labelsContainer.appendChild(maxLabel);
        }
        
        if (isVertical) {
            // Vertical mode: gradient and labels side by side
            const verticalContainer = document.createElement('div');
            verticalContainer.style.cssText = 'display: flex; gap: 8px; align-items: stretch;';
            verticalContainer.appendChild(gradientWrapper);
            verticalContainer.appendChild(labelsContainer);
            container.appendChild(verticalContainer);
        } else {
            // Horizontal mode: gradient on top, labels below
            container.appendChild(gradientWrapper);
            container.appendChild(labelsContainer);
        }
    }
    
    /**
     * Create quantized legend (gradient with marked intervals)
     */
    createQuantizedLegend(container, breaks, layout) {
        const isVertical = layout === 'vertical';
        
        // Safety check for breaks
        if (!breaks || !Array.isArray(breaks) || breaks.length < 2) {
            safeWarnViz('Invalid breaks array provided to createQuantizedLegend');
            return;
        }
        
        // Wrapper
        const gradientWrapper = document.createElement('div');
        gradientWrapper.style.cssText = 'position: relative;';
        
        // Gradient bar with markers
        const gradientBar = document.createElement('div');
        
        if (isVertical) {
            // Dikey modda: en yüksek üstte, en düşük altta (reverse gradient)
            const reversedColors = [...this.colorScale].reverse();
            gradientBar.style.cssText = `
                width: 20px;
                height: 150px;
                background: linear-gradient(to bottom, ${reversedColors.join(', ')});
                border: 1px solid #ccc;
                position: relative;
            `;
        } else {
            gradientBar.style.cssText = `
                width: 100%;
                height: 20px;
                background: linear-gradient(to right, ${this.colorScale.join(', ')});
                border: 1px solid #ccc;
                position: relative;
            `;
        }
        
        // Add interval markers
        breaks.forEach((breakVal, index) => {
            if (index === 0 || index === breaks.length - 1) return; // Skip first and last
            
            const marker = document.createElement('div');
            const position = ((breakVal - breaks[0]) / (breaks[breaks.length - 1] - breaks[0])) * 100;
            
            if (isVertical) {
                // Dikey modda pozisyonu ters çevir
                marker.style.cssText = `
                    position: absolute;
                    top: ${100 - position}%;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background: transparent;
                    box-shadow: 0 0 2px rgba(0,0,0,0.5);
                `;
            } else {
                marker.style.cssText = `
                    position: absolute;
                    left: ${position}%;
                    top: 0;
                    width: 2px;
                    height: 100%;
                    background: transparent;
                    box-shadow: 0 0 2px rgba(0,0,0,0.5);
                `;
            }
            gradientBar.appendChild(marker);
        });
        
        gradientWrapper.appendChild(gradientBar);
        
        // Labels
        const labelsContainer = document.createElement('div');
        
        if (isVertical) {
            labelsContainer.style.cssText = 'display: flex; flex-direction: column; justify-content: space-between; font-size: 10px; color: #000; height: 150px;';
        } else {
            labelsContainer.style.cssText = 'display: flex; justify-content: space-between; font-size: 10px; color: #000; margin-top: 5px;';
        }
        
        // Dikey modda label'ları ters sırayla ekle
        const labelValues = [];
        breaks.forEach((breakVal, index) => {
            if (index === 0 || index === breaks.length - 1 || index % 2 === 0) {
                labelValues.push(breakVal);
            }
        });
        
        const labelsToShow = isVertical ? [...labelValues].reverse() : labelValues;
        labelsToShow.forEach(breakVal => {
            const label = document.createElement('span');
            label.textContent = this.formatLegendValue(breakVal);
            labelsContainer.appendChild(label);
        });
        
        if (isVertical) {
            const verticalContainer = document.createElement('div');
            verticalContainer.style.cssText = 'display: flex; gap: 8px; align-items: stretch;';
            verticalContainer.appendChild(gradientWrapper);
            verticalContainer.appendChild(labelsContainer);
            container.appendChild(verticalContainer);
        } else {
            container.appendChild(gradientWrapper);
            container.appendChild(labelsContainer);
        }
    }
    
    /**
     * Create diverging legend (two-way from center)
     */
    createDivergingLegend(container, breaks, layout) {
        const isVertical = layout === 'vertical';
        
        // Safety check for breaks
        if (!breaks || !Array.isArray(breaks) || breaks.length < 2) {
            safeWarnViz('Invalid breaks array provided to createDivergingLegend');
            return;
        }
        
        const midIndex = Math.floor(breaks.length / 2);
        
        if (isVertical) {
            // Vertical mode - classic style
            const indices = Array.from({length: breaks.length - 1}, (_, i) => breaks.length - 2 - i);
            
            indices.forEach(i => {
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 3px;';
                
                const isMidpoint = (i === midIndex - 1 || i === midIndex);
                
                const colorBox = document.createElement('div');
                colorBox.className = 'legend-color-box';
                colorBox.dataset.classIndex = i;
                colorBox.style.cssText = `
                    width: 20px;
                    height: 20px;
                    background-color: ${this.colorScale[i]};
                    border: ${isMidpoint ? '2px solid #333' : '1px solid rgba(0,0,0,0.1)'};
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: all 0.2s;
                `;
                colorBox.title = isMidpoint ? 'Merkez değer' : 'Rengi değiştirmek için tıklayın';
                
                colorBox.addEventListener('mouseenter', () => {
                    colorBox.style.opacity = '0.8';
                });
                
                colorBox.addEventListener('mouseleave', () => {
                    colorBox.style.opacity = '1';
                });
                
                colorBox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openColorPicker(i, colorBox);
                });
                
                const label = document.createElement('span');
                label.style.cssText = 'font-size: 11px; color: #000; white-space: nowrap;' + (isMidpoint ? ' font-weight: bold;' : '');
                
                if (this.legendLabelMode === 'labels') {
                    // Labels mode: show only upper bound with ≤ symbol
                    const max = this.formatLegendValue(breaks[i + 1]);
                    label.textContent = `≤ ${max}`;
                } else {
                    // Ranges mode: show min - max
                    const min = this.formatLegendValue(breaks[i]);
                    const max = this.formatLegendValue(breaks[i + 1]);
                    label.textContent = `${min} - ${max}`;
                }
                
                item.appendChild(colorBox);
                item.appendChild(label);
                container.appendChild(item);
            });
        } else {
            // Horizontal mode - Datawrapper style
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start;';
            
            const colorsContainer = document.createElement('div');
            colorsContainer.style.cssText = 'display: flex; gap: 0;';
            
            const labelsContainer = document.createElement('div');
            labelsContainer.style.cssText = 'display: flex; position: relative; width: 100%; margin-top: 4px;';
            
            for (let i = 0; i < breaks.length - 1; i++) {
                const isMidpoint = (i === midIndex - 1 || i === midIndex);
                
                const colorBox = document.createElement('div');
                colorBox.className = 'legend-color-box';
                colorBox.dataset.classIndex = i;
                colorBox.style.cssText = `
                    width: 50px;
                    height: 20px;
                    background-color: ${this.colorScale[i]};
                    border-right: 1px solid rgba(255,255,255,0.3);
                    ${isMidpoint ? 'border-top: 2px solid #333; border-bottom: 2px solid #333;' : ''}
                    cursor: pointer;
                    transition: all 0.2s;
                `;
                
                colorBox.addEventListener('mouseenter', () => {
                    colorBox.style.opacity = '0.8';
                });
                
                colorBox.addEventListener('mouseleave', () => {
                    colorBox.style.opacity = '1';
                });
                
                colorBox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openColorPicker(i, colorBox);
                });
                
                colorsContainer.appendChild(colorBox);
            }
            
            // Add labels based on mode
            if (this.legendLabelMode === 'labels') {
                // Labels mode: show break points
                for (let i = 0; i < breaks.length; i++) {
                    const label = document.createElement('span');
                    label.style.cssText = `
                        position: absolute;
                        left: ${(i / (breaks.length - 1)) * 100}%;
                        transform: translateX(-50%);
                        font-size: 10px;
                        color: #000;
                        white-space: nowrap;
                        font-weight: 500;
                    `;
                    
                    if (i === 0) {
                        label.style.left = '0';
                        label.style.transform = 'translateX(0)';
                    } else if (i === breaks.length - 1) {
                        label.style.left = 'auto';
                        label.style.right = '0';
                        label.style.transform = 'translateX(0)';
                    }
                    
                    label.textContent = this.formatLegendValue(breaks[i]);
                    labelsContainer.appendChild(label);
                }
            } else {
                // Ranges mode: show min-max for each color box
                for (let i = 0; i < breaks.length - 1; i++) {
                    const label = document.createElement('span');
                    label.style.cssText = `
                        position: absolute;
                        left: ${((i + 0.5) / (breaks.length - 1)) * 100}%;
                        transform: translateX(-50%);
                        font-size: 10px;
                        color: #000;
                        white-space: nowrap;
                        font-weight: 500;
                    `;
                    
                    const min = this.formatLegendValue(breaks[i]);
                    const max = this.formatLegendValue(breaks[i + 1]);
                    label.textContent = `${min}-${max}`;
                    labelsContainer.appendChild(label);
                }
            }
            
            wrapper.appendChild(colorsContainer);
            wrapper.appendChild(labelsContainer);
            container.appendChild(wrapper);
        }
    }
    
    /**
     * Create categorical legend (nominal data)
     */
    createCategoricalLegend(container, breaks, layout) {
        const isVertical = layout === 'vertical';
        
        // Safety check for breaks
        if (!breaks || !Array.isArray(breaks) || breaks.length < 2) {
            safeWarnViz('Invalid breaks array provided to createCategoricalLegend');
            return;
        }
        
        const itemCount = Math.min(this.colorScale.length, breaks.length - 1);
        const categoryLabels = this.getCategoryLabels(itemCount);
        
        if (isVertical) {
            // Vertical mode - classic style
            const indices = Array.from({length: itemCount}, (_, i) => itemCount - 1 - i);
            
            indices.forEach(i => {
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 3px;';
                
                const colorBox = document.createElement('div');
                colorBox.className = 'legend-color-box';
                colorBox.dataset.classIndex = i;
                colorBox.style.cssText = `
                    width: 20px;
                    height: 20px;
                    background-color: ${this.colorScale[i]};
                    border: 1px solid rgba(0,0,0,0.1);
                    border-radius: 3px;
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: all 0.2s;
                `;
                colorBox.title = 'Rengi değiştirmek için tıklayın';
                
                colorBox.addEventListener('mouseenter', () => {
                    colorBox.style.opacity = '0.8';
                });
                
                colorBox.addEventListener('mouseleave', () => {
                    colorBox.style.opacity = '1';
                });
                
                colorBox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openColorPicker(i, colorBox);
                });
                
                const label = document.createElement('span');
                label.style.cssText = 'font-size: 11px; color: #000; white-space: nowrap;';
                label.textContent = categoryLabels[i];
                
                item.appendChild(colorBox);
                item.appendChild(label);
                container.appendChild(item);
            });
        } else {
            // Horizontal mode - Datawrapper style
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start;';
            
            const colorsContainer = document.createElement('div');
            colorsContainer.style.cssText = 'display: flex; gap: 0;';
            
            const labelsContainer = document.createElement('div');
            labelsContainer.style.cssText = 'display: flex; position: relative; width: 100%; margin-top: 4px;';
            
            for (let i = 0; i < itemCount; i++) {
                const colorBox = document.createElement('div');
                colorBox.className = 'legend-color-box';
                colorBox.dataset.classIndex = i;
                colorBox.style.cssText = `
                    width: 50px;
                    height: 20px;
                    background-color: ${this.colorScale[i]};
                    border-right: 1px solid rgba(255,255,255,0.3);
                    cursor: pointer;
                    transition: all 0.2s;
                `;
                
                colorBox.addEventListener('mouseenter', () => {
                    colorBox.style.opacity = '0.8';
                });
                
                colorBox.addEventListener('mouseleave', () => {
                    colorBox.style.opacity = '1';
                });
                
                colorBox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openColorPicker(i, colorBox);
                });
                
                colorsContainer.appendChild(colorBox);
            }
            
            // Add category labels below color boxes
            for (let i = 0; i < itemCount; i++) {
                const label = document.createElement('span');
                label.style.cssText = `
                    position: absolute;
                    left: ${((i + 0.5) / itemCount) * 100}%;
                    transform: translateX(-50%);
                    font-size: 10px;
                    color: #000;
                    white-space: nowrap;
                    font-weight: 500;
                `;
                
                label.textContent = categoryLabels[i];
                labelsContainer.appendChild(label);
            }
            
            wrapper.appendChild(colorsContainer);
            wrapper.appendChild(labelsContainer);
            container.appendChild(wrapper);
        }
    }
    
    /**
     * Get descriptive category labels based on number of classes
     */
    getCategoryLabels(classCount) {
        const labelSets = {
            1: ['Orta'],
            2: ['Düşük', 'Yüksek'],
            3: ['Düşük', 'Orta', 'Yüksek'],
            4: ['Çok Düşük', 'Düşük', 'Yüksek', 'Çok Yüksek'],
            5: ['Çok Düşük', 'Düşük', 'Orta', 'Yüksek', 'Çok Yüksek'],
            6: ['Çok Düşük', 'Düşük', 'Orta Düşük', 'Orta Yüksek', 'Yüksek', 'Çok Yüksek'],
            7: ['Çok Düşük', 'Düşük', 'Orta Düşük', 'Orta', 'Orta Yüksek', 'Yüksek', 'Çok Yüksek']
        };
        
        // Return appropriate labels or default to numbered categories
        return labelSets[classCount] || Array.from({length: classCount}, (_, i) => `Kategori ${i + 1}`);
    }
    
    /**
     * Format legend values with intelligent formatting
     * @param {number} value - The value to format
     * @param {boolean} isRangeContext - If true, use compact format; if false, use full format for labels
     */
    formatLegendValue(value, isRangeContext = null) {
        // Use the current number format mode (default: 'auto')
        const mode = this.numberFormatMode || 'auto';
        const precision = this.numberFormatPrecision || 1;
        
        // Handle exact zero
        if (value === 0) return '0';
        
        // If context is not specified, infer from legendLabelMode
        if (isRangeContext === null) {
            // 'ranges' mode = compact format, 'labels' mode = full format
            isRangeContext = (this.legendLabelMode === 'ranges');
        }
        
        switch(mode) {
            case 'full':
                // Full numbers with thousand separators
                return new Intl.NumberFormat('tr-TR', {
                    maximumFractionDigits: 0
                }).format(Math.round(value));
            
            case 'compact':
                // Compact notation (native browser support)
                if (Intl.NumberFormat.prototype.formatToParts) {
                    return new Intl.NumberFormat('tr-TR', {
                        notation: 'compact',
                        compactDisplay: 'short',
                        maximumFractionDigits: precision
                    }).format(value);
                }
                // Fallback to auto mode
                return this.formatAuto(value, precision, isRangeContext);
            
            case 'auto':
            default:
                return this.formatAuto(value, precision, isRangeContext);
        }
    }
    
    /**
     * Auto format with K/M/B suffixes
     * @param {number} value - The value to format
     * @param {number} precision - Decimal precision
     * @param {boolean} isRangeContext - If true (ranges), use K/M; if false (labels), use full numbers
     */
    formatAuto(value, precision = 1, isRangeContext = true) {
        const absValue = Math.abs(value);
        
        // For 'labels' mode (single values), show full numbers with separators
        if (!isRangeContext) {
            return new Intl.NumberFormat('tr-TR', {
                maximumFractionDigits: 0
            }).format(Math.round(value));
        }
        
        // For 'ranges' mode (intervals), use compact K/M/B format
        if (absValue >= 1000000000) {
            return `${(value / 1000000000).toFixed(precision)}B`;
        } else if (absValue >= 1000000) {
            return `${(value / 1000000).toFixed(precision)}M`;
        } else if (absValue >= 10000) {
            // 10,000+ uses K format
            return `${(value / 1000).toFixed(precision)}K`;
        } else if (absValue >= 1000) {
            // 1,000-9,999: show with thousand separator for clarity
            return new Intl.NumberFormat('tr-TR', {
                maximumFractionDigits: 0
            }).format(Math.round(value));
        }
        
        // For decimal numbers
        if (absValue < 1 && absValue > 0) {
            return value.toFixed(precision + 1);
        }
        
        // Small whole numbers (0-999): show as-is
        return Math.round(value).toString();
    }
    
    /**
     * Set number format mode for legend
     */
    setNumberFormatMode(mode, precision = 1) {
        const validModes = ['auto', 'full', 'compact'];
        if (validModes.includes(mode)) {
            this.numberFormatMode = mode;
            this.numberFormatPrecision = precision;
            
            // Re-create legend if it exists
            if (this.currentVisualization && this.currentVisualization.type) {
                const viz = this.currentVisualization;
                
                if (viz.type === 'bubble') {
                    const sizeValues = viz.data.map(d => parseFloat(d[viz.sizeColumn]) || 0).filter(v => v > 0);
                    const maxSize = Math.max(...sizeValues);
                    
                    const method = viz.options?.method || 'proportional';
                    let breaks = null;
                    if (method === 'graduated') {
                        const classification = viz.options?.classification || 'quantile';
                        const classCount = viz.options?.classCount || 4;
                        breaks = this.calculateBreaks(sizeValues, classification, classCount);
                    }
                    
                    // Clear existing legend first
                    const existingLegend = document.getElementById('map-legend');
                    if (existingLegend) {
                        existingLegend.remove();
                    }
                    
                    this.createBubbleLegend(viz.column, sizeValues, maxSize, viz.bubbleColor, viz.radiusMultiplier, method, breaks);
                } else if (viz.type === 'choropleth' || viz.type === 'dotdensity') {
                    // Clear existing legend first
                    const existingLegend = document.getElementById('map-legend');
                    if (existingLegend) {
                        existingLegend.remove();
                    }
                    this.createLegend(viz.breaks, viz.column);
                }
            }
        }
    }
    
    /**
     * Make legend draggable
     */
    makeLegendDraggable(legendElement, isEditModeFunc) {
        if (typeof interact === 'undefined') {
            safeWarnViz('interact.js not loaded, legend will not be draggable');
            return;
        }
        
        interact(legendElement)
            .draggable({
                inertia: false,
                // Başlık düzenleme modunda sürüklemeyi engelle
                ignoreFrom: '.legend-title[contenteditable="true"]',
                listeners: {
                    start(event) {
                        // Düzenleme modundaysa sürüklemeyi engelle
                        if (isEditModeFunc && isEditModeFunc()) {
                            return false;
                        }
                        event.target.style.cursor = 'grabbing';
                    },
                    move(event) {
                        // Düzenleme modundaysa sürüklemeyi engelle
                        if (isEditModeFunc && isEditModeFunc()) {
                            return;
                        }
                        
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                        
                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end(event) {
                        if (!isEditModeFunc || !isEditModeFunc()) {
                            event.target.style.cursor = 'move';
                        }
                    }
                }
            });
        
        legendElement.style.cursor = 'move';
    }
    
    /**
     * Open color picker for a legend class
     */
    openColorPicker(classIndex, colorBox) {
        // Remove any existing color picker
        const existingPicker = document.getElementById('custom-color-picker');
        if (existingPicker) {
            existingPicker.remove();
        }
        
        // Get legend position
        const legend = document.getElementById('map-legend');
        const legendRect = legend.getBoundingClientRect();
        const boxRect = colorBox.getBoundingClientRect();
        
        // Calculate vertical offset (15% of viewport height upwards)
        const verticalOffset = window.innerHeight * 0.15;
        
        // Create custom color picker modal
        const picker = document.createElement('div');
        picker.id = 'custom-color-picker';
        picker.style.cssText = `
            position: fixed;
            left: ${legendRect.left - 260}px;
            top: ${boxRect.top - verticalOffset}px;
            background: transparent;
            border-radius: 8px;
            
            padding: 15px;
            z-index: 10000;
            width: 240px;
            font-family: Arial, sans-serif;
        `;
        
        // Title
        const title = document.createElement('div');
        title.style.cssText = 'font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #000;';
        title.textContent = `Sınıf ${classIndex + 1} Rengi`;
        picker.appendChild(title);
        
        // Native color input
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = this.colorScale[classIndex];
        colorInput.style.cssText = `
            width: 100%;
            height: 40px;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 10px;
        `;
        picker.appendChild(colorInput);
        
        // Hex input
        const hexInput = document.createElement('input');
        hexInput.type = 'text';
        hexInput.value = this.colorScale[classIndex];
        hexInput.placeholder = '#000000';
        hexInput.style.cssText = `
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
            margin-bottom: 10px;
        `;
        picker.appendChild(hexInput);
        
        // Buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = 'display: flex; gap: 8px;';
        
        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Uygula';
        applyBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
        `;
        applyBtn.addEventListener('mouseenter', () => {
            applyBtn.style.background = '#059669';
        });
        applyBtn.addEventListener('mouseleave', () => {
            applyBtn.style.background = '#10b981';
        });
        applyBtn.addEventListener('click', () => {
            this.applyColor(classIndex, colorBox, colorInput.value, picker);
        });
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'İptal';
        cancelBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
        `;
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = '#4b5563';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = '#6b7280';
        });
        cancelBtn.addEventListener('click', () => {
            picker.remove();
        });
        
        buttonsContainer.appendChild(applyBtn);
        buttonsContainer.appendChild(cancelBtn);
        picker.appendChild(buttonsContainer);
        
        // Sync color input and hex input
        colorInput.addEventListener('input', (e) => {
            hexInput.value = e.target.value;
        });
        
        hexInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                colorInput.value = value;
            }
        });
        
        // Add to DOM
        document.body.appendChild(picker);
        
        // Close on outside click
        const closeOnOutsideClick = (e) => {
            if (!picker.contains(e.target) && e.target !== colorBox) {
                picker.remove();
                document.removeEventListener('click', closeOnOutsideClick);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closeOnOutsideClick);
        }, 100);
    }
    
    /**
     * Apply selected color
     */
    applyColor(classIndex, colorBox, newColor, picker) {
        // Update color scale
        this.colorScale[classIndex] = newColor;

        // Update color box
        colorBox.style.backgroundColor = newColor;

        // Update map colors (only for choropleth)
        if (this.currentVisualization && this.currentVisualization.type === 'choropleth') {
            this.updateMapColors();
        }
        
        // Show feedback
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`✅ Sınıf ${classIndex + 1} rengi güncellendi`);
        }
        
        safeLogViz(`🎨 Renk güncellendi: Sınıf ${classIndex + 1} → ${newColor}`);
        
        // Close picker
        picker.remove();
    }
    
    /**
     * Update map colors after color picker change
     */
    updateMapColors() {
        // Get current visualization source
        const sourceId = 'choropleth-source';
        const source = this.map.getSource(sourceId);
        
        if (!source || !source._data) {
            safeWarnViz('⚠️ Choropleth source bulunamadı');
            return;
        }
        
        if (!this.currentBreaks) {
            safeWarnViz('⚠️ currentBreaks bulunamadı');
            return;
        }
        
        const geojson = source._data;

        // Validate geojson structure
        if (!geojson || !geojson.features || !Array.isArray(geojson.features)) {
            safeWarnViz('⚠️ GeoJSON features bulunamadı veya geçersiz');
            return;
        }

        // Update feature colors based on new color scale
        geojson.features.forEach(feature => {
            const value = feature.properties.value || feature.properties.dataValue || 0;
            if (value > 0) {
                feature.properties.color = this.getColorForValue(value, this.currentBreaks);
            }
        });
        
        // Update source data
        source.setData(geojson);
        
        safeLogViz('🗺️ Harita renkleri güncellendi');
    }
    
    /**
     * Remove legend
     */
    removeLegend() {
        const existingLegend = document.getElementById('map-legend');
        if (existingLegend) {
            existingLegend.remove();
        }
    }
    
    /**
     * Update legend layout (vertical/horizontal)
     */
    updateLegendLayout(layout) {
        this.legendLayout = layout;
        
        // Eğer aktif bir görselleştirme varsa lejantı yeniden oluştur
        if (this.currentVisualization && this.currentVisualization.type) {
            const viz = this.currentVisualization;
            
            if (viz.type === 'bubble') {
                // Bubble harita için lejantı yeniden oluştur
                const sizeValues = viz.data.map(d => parseFloat(d[viz.sizeColumn]) || 0).filter(v => v > 0);
                const maxSize = Math.max(...sizeValues);
                
                // Graduated ise breaks'i yeniden hesapla
                const method = viz.options?.method || 'proportional';
                let breaks = null;
                if (method === 'graduated') {
                    const classification = viz.options?.classification || 'quantile';
                    const classCount = viz.options?.classCount || 4;
                    breaks = this.calculateBreaks(sizeValues, classification, classCount);
                }
                
                this.createBubbleLegend(viz.column, sizeValues, maxSize, viz.bubbleColor, viz.radiusMultiplier, method, breaks);
            } else if (viz.type === 'dot-density') {
                // Dot density için lejantı yeniden oluştur (basit lejant)
                this.createDotDensityLegend(viz.column, viz.dotValue, viz.totalPoints || viz.data.length, viz.dotColor);
            } else if (this.currentBreaks && (viz.type === 'choropleth' || viz.type === 'dotdensity')) {
                // Choropleth için
                this.createLegend(this.currentBreaks, this.currentVisualization.column);
            }
            safeLogViz(`✅ Lejant yerleşimi güncellendi: ${layout}`);
        }
    }
    
    /**
     * Update legend label mode (ranges/labels)
     */
    updateLegendLabelMode(mode) {
        this.legendLabelMode = mode;
        
        // Eğer aktif bir görselleştirme varsa lejantı yeniden oluştur
        if (this.currentVisualization && this.currentVisualization.type) {
            const viz = this.currentVisualization;
            
            if (viz.type === 'bubble') {
                const sizeValues = viz.data.map(d => parseFloat(d[viz.sizeColumn]) || 0).filter(v => v > 0);
                const maxSize = Math.max(...sizeValues);
                
                const method = viz.options?.method || 'proportional';
                let breaks = null;
                if (method === 'graduated') {
                    const classification = viz.options?.classification || 'quantile';
                    const classCount = viz.options?.classCount || 4;
                    breaks = this.calculateBreaks(sizeValues, classification, classCount);
                }
                
                this.createBubbleLegend(viz.column, sizeValues, maxSize, viz.bubbleColor, viz.radiusMultiplier, method, breaks);
            } else if (viz.type === 'dot-density') {
                // Dot density için lejantı yeniden oluştur (basit lejant)
                this.createDotDensityLegend(viz.column, viz.dotValue, viz.totalPoints || viz.data.length, viz.dotColor);
            } else if (this.currentBreaks && viz.type === 'choropleth') {
                // Choropleth için
                this.createLegend(this.currentBreaks, viz.column);
            }
            
            safeLogViz(`✅ Lejant etiket stili güncellendi: ${mode}`);
        }
    }
    
    /**
     * Calculate breaks using different classification methods
     */
    calculateBreaks(values, method, classCount) {
        const sorted = [...values].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        
        // Equal Interval (Eşit Aralık)
        if (method === 'equal' || method === 'equal-interval') {
            const step = (max - min) / classCount;
            return Array.from({ length: classCount + 1 }, (_, i) => min + i * step);
        } 
        
        // Quantile (Yüzdelik Dilim)
        // Her sınıfta eşit sayıda gözlem olacak şekilde kırılma noktaları belirler
        else if (method === 'quantile') {
            const breaks = [min];
            for (let i = 1; i < classCount; i++) {
                const percentile = i / classCount;
                const index = percentile * (sorted.length - 1);
                const lower = Math.floor(index);
                const upper = Math.ceil(index);
                const weight = index - lower;
                
                // Linear interpolation for exact percentiles
                if (lower === upper) {
                    breaks.push(sorted[lower]);
                } else {
                    breaks.push(sorted[lower] * (1 - weight) + sorted[upper] * weight);
                }
            }
            breaks.push(max);
            return breaks;
        } 
        
        // Jenks Natural Breaks (Doğal Kırılma)
        else if (method === 'jenks' || method === 'natural-breaks') {
            return this.calculateJenksBreaks(sorted, classCount);
        } 
        
        // Rounded Values (Yuvarlanmış Değerler)
        // Datawrapper tarzı güzel yuvarlanmış sayılar üretir
        else if (method === 'rounded' || method === 'rounded-values') {
            const step = (max - min) / classCount;
            const breaks = [min];
            
            for (let i = 1; i < classCount; i++) {
                const rawValue = min + (i * step);
                const roundedValue = this.roundToNiceNumber(rawValue);
                breaks.push(roundedValue);
            }
            
            breaks.push(max);
            
            // Remove duplicates and ensure ascending order
            const uniqueBreaks = [...new Set(breaks)].sort((a, b) => a - b);
            
            // If we lost breaks due to rounding, fill in the gaps
            if (uniqueBreaks.length < classCount + 1) {
                return this.calculateBreaks(values, 'equal', classCount);
            }
            
            return uniqueBreaks;
        }
        
        // Logarithmic Interval (Logaritmik Aralık)
        else if (method === 'logarithmic') {
            // Logaritmik ölçekte eşit aralıklar
            // Min değer 0 olamaz, en az 1 olmalı
            const logMin = Math.max(1, min);
            
            if (logMin === 0 || max === 0) {
                safeWarnViz('⚠️ Logaritmik sınıflandırma için değerler 0 olamaz. Quantile kullanılıyor.');
                return this.calculateBreaks(values, 'quantile', classCount);
            }
            
            const logMinValue = Math.log10(logMin);
            const logMaxValue = Math.log10(max);
            const logStep = (logMaxValue - logMinValue) / classCount;
            
            const breaks = [];
            for (let i = 0; i <= classCount; i++) {
                breaks.push(Math.pow(10, logMinValue + (i * logStep)));
            }
            
            return breaks;
        } 
        
        // Custom (Özel Kırılma Değerleri)
        else if (method === 'custom' && this.customBreaks && this.customBreaks.length > 0) {
            return this.customBreaks;
        }
        
        // Fallback: return min-max
        return [min, max];
    }
    
    /**
     * Jenks Natural Breaks (Fisher-Jenks) Algorithm
     * Minimizes variance within classes and maximizes variance between classes
     */
    calculateJenksBreaks(sortedValues, numClasses) {
        const n = sortedValues.length;
        
        // Boundary case: if we have fewer unique values than classes
        const uniqueValues = [...new Set(sortedValues)].sort((a, b) => a - b);
        if (uniqueValues.length <= numClasses) {
            safeWarnViz(`⚠️ Jenks: ${uniqueValues.length} benzersiz değer var, ${numClasses} sınıf istendi. Quantile kullanılıyor.`);
            return this.calculateBreaks(sortedValues, 'quantile', numClasses);
        }
        
        // Boundary case: if we have fewer values than classes
        if (n <= numClasses) {
            return sortedValues;
        }
        
        // Initialize matrices
        // lowerClassLimits[i][j] = optimal lower class limit for j classes using first i values
        const lowerClassLimits = [];
        // variance[i][j] = variance for j classes using first i values
        const variance = [];
        
        // Initialize arrays
        for (let i = 0; i <= n; i++) {
            lowerClassLimits[i] = [];
            variance[i] = [];
            for (let j = 0; j <= numClasses; j++) {
                lowerClassLimits[i][j] = 0;
                variance[i][j] = 0;
            }
        }
        
        // Pre-compute sums and sum of squares for all ranges
        const sumSquares = [0];
        const sum = [0];
        
        for (let i = 0; i < n; i++) {
            sumSquares[i + 1] = sumSquares[i] + sortedValues[i] * sortedValues[i];
            sum[i + 1] = sum[i] + sortedValues[i];
        }
        
        // Initialize for 1 class
        for (let i = 1; i <= n; i++) {
            variance[i][1] = this.calculateVariance(sortedValues, 0, i - 1);
            lowerClassLimits[i][1] = 0;
        }
        
        // Fill matrices using dynamic programming
        for (let numClass = 2; numClass <= numClasses; numClass++) {
            for (let i = numClass; i <= n; i++) {
                variance[i][numClass] = Infinity;
                
                // Try all possible positions for the lower class limit
                for (let k = numClass - 1; k < i; k++) {
                    // Calculate variance for this split
                    const v1 = variance[k][numClass - 1];
                    const v2 = this.calculateVariance(sortedValues, k, i - 1);
                    const totalVariance = v1 + v2;
                    
                    // Keep the split with minimum variance
                    if (totalVariance < variance[i][numClass]) {
                        variance[i][numClass] = totalVariance;
                        lowerClassLimits[i][numClass] = k;
                    }
                }
            }
        }
        
        // Extract breaks from the matrices
        const breaks = [];
        let k = n;
        
        // Build breaks array from end to start
        for (let numClass = numClasses; numClass >= 2; numClass--) {
            const idx = lowerClassLimits[k][numClass];
            if (idx > 0 && idx < n) {
                breaks.push(sortedValues[idx]);
            }
            k = idx;
        }
        
        // Add min and max values
        breaks.reverse();
        breaks.unshift(sortedValues[0]);
        breaks.push(sortedValues[n - 1]);
        
        // Remove any duplicates and ensure sorted
        let uniqueBreaks = [...new Set(breaks)].sort((a, b) => a - b);
        
        // Ensure we have exactly numClasses + 1 breaks
        if (uniqueBreaks.length < numClasses + 1) {
            safeWarnViz(`⚠️ Jenks: ${uniqueBreaks.length} kırılma noktası bulundu, ${numClasses + 1} gerekli. Quantile kullanılıyor.`);
            return this.calculateBreaks(sortedValues, 'quantile', numClasses);
        }
        
        // If we have more than needed, trim to exact count
        if (uniqueBreaks.length > numClasses + 1) {
            uniqueBreaks = uniqueBreaks.slice(0, numClasses + 1);
        }
        
        return uniqueBreaks;
    }
    
    /**
     * Calculate variance for a subset of values
     */
    calculateVariance(values, start, end) {
        if (start >= end) return 0;
        
        const subset = values.slice(start, end + 1);
        const n = subset.length;
        
        if (n === 0) return 0;
        if (n === 1) return 0;
        
        const mean = subset.reduce((sum, val) => sum + val, 0) / n;
        const variance = subset.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
        
        return variance;
    }
    
    /**
     * Round a number to a "nice" value (inspired by Datawrapper)
     * Returns nicely rounded numbers like 10, 20, 25, 50, 100, 200, 250, 500, etc.
     */
    roundToNiceNumber(value) {
        if (value === 0) return 0;
        
        const isNegative = value < 0;
        const absValue = Math.abs(value);
        
        // Find the order of magnitude
        const magnitude = Math.pow(10, Math.floor(Math.log10(absValue)));
        
        // Normalize to 1-10 range
        const normalized = absValue / magnitude;
        
        // Round to nice numbers in the 1-10 range
        let rounded;
        if (normalized <= 1) rounded = 1;
        else if (normalized <= 2) rounded = 2;
        else if (normalized <= 2.5) rounded = 2.5;
        else if (normalized <= 5) rounded = 5;
        else rounded = 10;
        
        // Scale back to original magnitude
        const result = rounded * magnitude;
        
        return isNegative ? -result : result;
    }
    
    /**
     * Get color for value based on breaks
     */
    getColorForValue(value, breaks) {
        // Edge case: value is less than first break (minimum)
        if (value < breaks[0]) {
            return this.colorScale[0];
        }
        
        // Edge case: value equals the last break (maximum)
        if (value >= breaks[breaks.length - 1]) {
            return this.colorScale[this.colorScale.length - 1];
        }
        
        // Normal case: find the correct interval
        for (let i = 0; i < breaks.length - 1; i++) {
            if (value >= breaks[i] && value < breaks[i + 1]) {
                return this.colorScale[i];
            }
        }
        
        // Fallback (should not reach here)
        return this.colorScale[this.colorScale.length - 1];
    }

    /**
     * Set color scheme
     */
    setColorScheme(scheme) {
        const schemes = {
            viridis: ['#440154', '#472777', '#3b528b', '#2c728e', '#21918c', '#27ad81', '#5ec962', '#aadc32', '#fde725'],
            reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
            blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
            greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
            oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
            purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
            topographic: ['#4a6741', '#7b9971', '#b4c8a8', '#e8f1e1', '#f6e8c3', '#dfc27d', '#bf812d', '#8c510a', '#543005'],
            diverging_orange_blue: ['#c66b20', '#dd8a4b', '#eeaa7b', '#f4c9a8', '#dcdcdc', '#90b9d7', '#5393c3', '#2a6ba1', '#11415c']
        };
        
        if (schemes[scheme]) {
            this.colorScaleFull = schemes[scheme];
            this.colorScale = this.getColorPalette(this.classCount);
        }
    }

    /**
     * Set classification method
     */
    setClassificationMethod(method) {
        const validMethods = ['equal', 'equal-interval', 'quantile', 'jenks', 'natural-breaks', 'rounded', 'rounded-values', 'logarithmic', 'custom'];
        if (validMethods.includes(method)) {
            this.classificationMethod = method;
        }
    }

    /**
     * Set legend type
     */
    setLegendType(type) {
        this.legendType = type || 'standard';
    }

    /**
     * Set custom breaks
     */
    setCustomBreaks(breaks) {
        if (Array.isArray(breaks) && breaks.length > 0) {
            this.customBreaks = breaks.sort((a, b) => a - b);
        }
    }

    /**
     * Suggest classification method based on data distribution
     * CV Aralığı tabanlı akıllı öneri sistemi
     */
    suggestClassificationMethod(values) {
        if (!values || values.length < 2) {
            return {
                method: 'equal',
                reason: 'Yetersiz veri - varsayılan yöntem kullanılıyor'
            };
        }
        
        const sorted = [...values].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const range = max - min;
        
        // Calculate standard deviation
        const mean = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
        const variance = sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / sorted.length;
        const stdDev = Math.sqrt(variance);
        
        // Calculate coefficient of variation (varyasyon katsayısı) - yüzde olarak
        const cvPercent = (stdDev / mean) * 100;
        
        // CV tabanlı yöntem önerisi
        if (cvPercent > 100) {
            // Aşırı heterojen (uç değerli) - Logarithmic öner
            return {
                method: 'logarithmic',
                reason: `⚠️ Veriler aşırı heterojen yapıda (CV: ${cvPercent.toFixed(1)}%). Uç değerler mevcut. Logaritmik ölçeklendirme en uygun yöntemdir.`
            };
        } else if (cvPercent >= 50 && cvPercent <= 100) {
            // Heterojen - Doğal kümelenmeler var
            return {
                method: 'jenks',
                reason: `📊 Veriler heterojen dağılımlı (CV: ${cvPercent.toFixed(1)}%). Doğal kümelenmeler mevcut. Jenks Natural Breaks en iyi görselleştirmeyi sağlar.`
            };
        } else if (cvPercent >= 20 && cvPercent < 50) {
            // Orta değişkenlik
            return {
                method: 'quantile',
                reason: `📈 Veriler orta düzeyde değişkenlik gösteriyor (CV: ${cvPercent.toFixed(1)}%). Quantile yöntemi ile her sınıfa eşit sayıda gözlem düşer.`
            };
        } else {
            // Homojen (< 20%)
            return {
                method: 'equal',
                reason: `✅ Veriler homojen dağılımlı (CV: ${cvPercent.toFixed(1)}%). Equal Interval (Eşit Aralık) yöntemi yeterlidir.`
            };
        }
    }

    /**
     * Render choropleth map (wrapper for visualization wizard)
     */
    async renderChoropleth(matchedData, dataColumn) {
        if (!matchedData || matchedData.length === 0) {
            safeErrorViz('❌ Görselleştirilecek veri yok');
            return;
        }

        // getMatchedData() formatı: { ...originalData, _province, _district, _level }
        const level = matchedData[0]._level || (matchedData[0]._district ? 'district' : 'province');
        
        // matchedData'dan uygun formatta userData oluştur
        const userData = matchedData.map(result => {
            const locationName = result._district || result._province;
            const dataValue = result[dataColumn];
            
            return {
                location: locationName,
                value: parseFloat(dataValue) || 0,
                originalData: result
            };
        }).filter(item => item.location); // location'ı olmayan kayıtları filtrele
        
        if (userData.length === 0) {
            safeErrorViz('❌ Geçerli veri bulunamadı');
            alert('Görselleştirme için geçerli veri bulunamadı. Lütfen veri dosyanızı kontrol edin.');
            return;
        }
        
        safeLogViz('📊 Choropleth verisi hazır:', userData.length, 'satır');

        // Ensure this instance is available globally
        if (!window.visualizationManager) {
            window.visualizationManager = this;
            safeLogViz('✅ window.visualizationManager global reference set edildi');
        }

        // ✅ İLK createChoroplethMap çağır (clearVisualization içerir)
        await this.createChoroplethMap(userData, dataColumn, level);

        // ✅ SONRA currentVisualization set et (clearVisualization'dan sonra)
        this.currentVisualization = {
            type: 'choropleth',
            data: matchedData,
            column: dataColumn,
            level: level
        };
        safeLogViz('✅ currentVisualization set edildi (createChoroplethMap sonrası):', this.currentVisualization.type);
    }

    /**
     * Load province centroids from turkey-provinces.js
     */
    async loadProvinceCentroids() {
        if (window.provinceCentroids) {
            return window.provinceCentroids;
        }
        
        // turkey-provinces.js'den koordinatları yükle
        if (typeof getProvince === 'function') {
            const centroids = {};
            const provinceNames = [
                'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
                'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
                'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
                'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Isparta',
                'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
                'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
                'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt',
                'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
                'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman',
                'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
            ];
            
            provinceNames.forEach(name => {
                const province = getProvince(name);
                if (province) {
                    centroids[province.name] = { lat: province.lat, lon: province.lon };
                }
            });
            
            window.provinceCentroids = centroids;
            return centroids;
        }
        
        safeErrorViz('❌ turkey-provinces.js yüklenemedi');
        return null;
    }
    
    /**
     * Load district centroids from GeoJSON
     * Uses composite key (province_district) to avoid ambiguity with same district names
     */
    async loadDistrictCentroids() {
        if (window.districtCentroids) {
            return window.districtCentroids;
        }

        const geojson = await this.loadDistrictsGeoJSON();
        if (!geojson) {
            return null;
        }

        const centroids = {};
        geojson.features.forEach(feature => {
            const districtName = feature.properties.ILCEAD || feature.properties.name || feature.properties.NAME;
            const provinceName = feature.properties.ILAD || feature.properties.IL_ADI || feature.properties.il_adi || feature.properties.province;

            if (districtName && feature.geometry) {
                try {
                    const centroid = turf.centroid(feature);
                    const coords = {
                        lat: centroid.geometry.coordinates[1],
                        lon: centroid.geometry.coordinates[0]
                    };

                    // Store with composite key (province_district) to avoid ambiguity
                    if (provinceName) {
                        const provinceNormalized = this.normalizeName(provinceName);
                        const districtNormalized = this.normalizeName(districtName);
                        const compositeKey = `${provinceNormalized}_${districtNormalized}`;
                        centroids[compositeKey] = coords;
                    }

                    // Also store with simple key for backward compatibility
                    centroids[districtName] = coords;

                } catch (error) {
                    safeWarnViz(`⚠️ ${districtName} için centroid hesaplanamadı`);
                }
            }
        });

        window.districtCentroids = centroids;
        return centroids;
    }
    
    /**
     * Render bubble map (wrapper for visualization wizard)
     */
    async renderBubbleMap(matchedData, dataColumn, bubbleColor = '#3b82f6', radiusMultiplier = 1, options = {}) {
        if (!matchedData || matchedData.length === 0) {
            safeErrorViz('❌ Görselleştirilecek veri yok');
            return;
        }

        // DEBUG: Check if matchedData has required fields
        safeLogViz('🔍 matchedData[0]:', matchedData[0]);
        safeLogViz('🔍 _province field:', matchedData[0]?._province);
        safeLogViz('🔍 _district field:', matchedData[0]?._district);
        safeLogViz('🔍 _level field:', matchedData[0]?._level);

        // matchedData'dan koordinat bilgilerini içeren userData oluştur
        const hasDistrictData = matchedData.some(row => !!row._district);
        const level = hasDistrictData ? 'district' : (matchedData[0]._level || 'province');
        safeLogViz('🫧 Bubble seviye seçimi:', { hasDistrictData, firstLevel: matchedData[0]?._level, level, total: matchedData.length });
        
        // İl/ilçe koordinatlarını yükle
        const coordinatesData = level === 'province' 
            ? window.provinceCentroids || await this.loadProvinceCentroids()
            : window.districtCentroids || await this.loadDistrictCentroids();
        
        if (!coordinatesData) {
            alert('Koordinat verileri yüklenemedi');
            return;
        }
        
        // Veriyi koordinatlarla birleştir (district için composite key kullan)
        const userData = matchedData.map(row => {
            // Karışık modda ilçe datası varsa il seviyesindeki satırları atla
            if (level === 'district' && !row._district) return null;

            const locationName = row._district || row._province;
            let coords;

            // For district level, try composite key first
            if (level === 'district' && row._province) {
                const provinceName = row._province;
                const provinceNormalized = this.normalizeName(provinceName);
                const districtNormalized = this.normalizeName(locationName);
                const compositeKey = `${provinceNormalized}_${districtNormalized}`;

                // Try composite key first, fallback to simple key
                coords = coordinatesData[compositeKey] || coordinatesData[locationName];
            } else {
                // Province level - use simple key
                coords = coordinatesData[locationName];
            }

            if (!coords) {
                safeWarnViz(`⚠️ Koordinat bulunamadı: ${locationName}${row._province ? ` (${row._province})` : ''}`);
                return null;
            }

            return {
                name: locationName,
                lat: coords.lat,
                lon: coords.lon,
                [dataColumn]: parseFloat(row[dataColumn]) || 0
            };
        }).filter(item => item !== null);
        
        if (userData.length === 0) {
            alert('Koordinatlarla eşleştirilecek veri bulunamadı');
            return;
        }

        // Ensure this instance is available globally
        if (!window.visualizationManager) {
            window.visualizationManager = this;
            safeLogViz('✅ window.visualizationManager global reference set edildi');
        }

        // Level bilgisini options'a ekle
        const optionsWithLevel = { ...options, level };

        // ✅ İLK createBubbleMap çağır (clearVisualization içerir)
        await this.createBubbleMap(userData, dataColumn, null, bubbleColor, radiusMultiplier, optionsWithLevel);

        // ✅ SONRA currentVisualization set et (clearVisualization'dan sonra)
        this.currentVisualization = {
            type: 'bubble',
            data: matchedData,           // ✅ Orijinal matched data (_province, _level ile)
            userData: userData,          // ✅ Koordinatlı userData (name, lat, lon ile)
            column: dataColumn,
            sizeColumn: dataColumn,
            colorColumn: null,
            bubbleColor,
            radiusMultiplier,
            options,
            level: level
        };
        safeLogViz('✅ currentVisualization set edildi (createBubbleMap sonrası):', this.currentVisualization.type);
    }

    /**
     * Render dot density map (wrapper for visualization wizard)
     */
    async renderDotDensity(matchedData, dataColumn, dotsPerUnit, dotColor = '#f97316') {
        if (!matchedData || matchedData.length === 0) {
            safeErrorViz('❌ Görselleştirilecek veri yok');
            return;
        }

        const level = matchedData[0]._level || (matchedData[0]._district ? 'district' : 'province');

        // matchedData'yı uygun formata dönüştür (il bilgisini koru)
        const userData = matchedData.map(row => {
            const locationName = row._district || row._province;
            const dataValue = parseFloat(row[dataColumn]) || 0;
            const provinceName = row._province; // İl bilgisini koru

            return {
                [level === 'province' ? 'Il' : 'Ilce']: locationName,
                [dataColumn]: dataValue,
                _province: provinceName,  // İl bilgisini ekle
                _originalData: row  // Tüm orijinal veriyi sakla
            };
        });
        
        // Ensure this instance is available globally
        if (!window.visualizationManager) {
            window.visualizationManager = this;
            safeLogViz('✅ window.visualizationManager global reference set edildi');
        }

        // ✅ İLK createDotDensityMap çağır (clearVisualization içerir)
        await this.createDotDensityMap(userData, dataColumn, level, dotsPerUnit, dotColor);

        // ✅ SONRA currentVisualization set et (clearVisualization'dan sonra)
        this.currentVisualization = {
            type: 'dot-density',
            data: matchedData,
            column: dataColumn,
            level: level,
            dotValue: dotsPerUnit,
            dotColor: dotColor
        };
        safeLogViz('✅ currentVisualization set edildi (createDotDensityMap sonrası):', this.currentVisualization.type);
    }
}

// Initialize when map is ready
// Promise-based initialization
if (typeof window !== 'undefined') {
    let resolveVisualizationManager;
    window.visualizationManagerReady = new Promise((resolve) => {
        resolveVisualizationManager = resolve;
    });
    
    const initVisualizationManager = () => {
        if (window.map) {
            // DI Migration helper
            const getOrCreateVisualizationManager = () => {
                if (window.ServiceLocator && window.ServiceLocator.has('visualizationManager')) {
                    safeLogViz('✅ VisualizationManager obtained from DI Container');
                    return window.ServiceLocator.get('visualizationManager');
                } else {
                    safeWarnViz('⚠️ VisualizationManager created manually (DI Container not available)');
                    return new VisualizationManager(window.map, window.dataManager);
                }
            };

            // If map is already loaded, initialize immediately
            if (typeof window.map.loaded === 'function' && window.map.loaded()) {
                window.visualizationManager = getOrCreateVisualizationManager();
                resolveVisualizationManager(window.visualizationManager);
            } else if (typeof window.map.on === 'function') {
                // Otherwise wait for map load event
                window.map.on('load', () => {
                    window.visualizationManager = getOrCreateVisualizationManager();
                    resolveVisualizationManager(window.visualizationManager);
                });
            } else {
                // Map methods not available yet, retry
                setTimeout(initVisualizationManager, 100);
            }
        } else {
            // Retry if map not ready yet
            setTimeout(initVisualizationManager, 100);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVisualizationManager);
    } else {
        initVisualizationManager();
    }

    // Browser global export (export the class itself, not the instance)
    window.VisualizationManager = VisualizationManager;
}
