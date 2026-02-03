/**
 * GeoJSON Handler Module
 * Handles import and export of GeoJSON data
 */
class GeoJSONHandler {
    constructor(manager) {
        this.manager = manager;
        // Logger helpers
        this.log = (...args) => (window.Logger && typeof window.Logger.log === 'function') ? window.Logger.log(...args) : console.log(...args);
        this.warn = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);
    }

    /**
     * Import from GeoJSON file
     */
    async import(file, userMarkers, clearCallback) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const loadedData = JSON.parse(e.target.result);
                    
                    // Validasyon: FeatureCollection veya Feature olmalı
                    let validGeoJSON = null;
                    
                    if (loadedData.type === 'FeatureCollection' && Array.isArray(loadedData.features)) {
                        validGeoJSON = loadedData;
                    } else if (loadedData.type === 'Feature') {
                        // Tek feature'ı collection'a çevir
                        validGeoJSON = {
                            type: 'FeatureCollection',
                            features: [loadedData]
                        };
                    } else if (Array.isArray(loadedData)) {
                         // Array ise collection yap (bazı API'ler direkt array döner)
                         validGeoJSON = {
                             type: 'FeatureCollection',
                             features: loadedData
                         };
                    }
                    
                    if (validGeoJSON) {
                        // MapLibre için temiz GeoJSON oluştur (metadata gibi ekstra alanları temizle)
                        // Sadece type ve features alanlarını al
                        const cleanGeoJSON = {
                            type: 'FeatureCollection',
                            features: validGeoJSON.features
                        };
                        
                        await this.processData(cleanGeoJSON, userMarkers, clearCallback, file.name);
                        resolve(true);
                    } else {
                        if (typeof window.showFeedback === 'function') window.showFeedback('❌ Geçersiz GeoJSON formatı.', 'error', 3000);
                        reject(new Error('Input data is not a valid GeoJSON object'));
                    }
                } catch (error) {
                    if (typeof window.showFeedback === 'function') window.showFeedback('❌ Dosya okuma hatası: ' + error.message, 'error', 3500);
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    /**
     * Process GeoJSON data
     */
    async processData(geoJSON, userMarkers, clearCallback, fileName = 'geojson') {
        clearCallback();
        
        const markers = [];
        geoJSON.features.forEach((feature, index) => {
            const props = feature.properties || {};
            const name = this.manager.utils.extractName(props) || `İsimsiz ${feature.geometry.type}`;
            const metrics = this.manager.utils.calculateMetrics(feature);
            const timestamp = this.manager.utils.extractTimestamp(props);

            const isCircle = (props.type && String(props.type).toLowerCase() === 'circle') || props.circle === true || typeof props.radius === 'number';
            const centerLat = typeof props.centerLat === 'number' ? props.centerLat : this.manager.utils.getCenterLat(feature);
            const centerLon = typeof props.centerLon === 'number' ? props.centerLon : this.manager.utils.getCenterLon(feature);

            const markerData = {
                id: Date.now() + index + Math.random(),
                name: name,
                type: isCircle ? 'circle' : this.manager.utils.getMarkerType(feature.geometry.type),
                lat: centerLat,
                lon: centerLon,
                radius: isCircle ? (Number(props.radius) || 0) : undefined,
                geometry: isCircle ? null : this.manager.utils.getGeometry(feature),
                properties: props,
                _metrics: metrics,
                timestamp: timestamp,
                time: props.time || timestamp,
                Date: props.Date || props.date,
                date: props.date,
                tarih: props.tarih
            };
            
            markers.push(markerData);
        });

        // Clustering check
        if (markers.length > 1000 && !window.clusteringEnabled) {
            this.log('⚡ Büyük GeoJSON dosyası, clustering otomatik aktif ediliyor...');
            this.manager.enableClustering();
        }

        // Field extraction for UI
        const fields = this.manager.utils.extractFields(markers);
        
        // Process markers
        if (markers.length > 200) {
            if (typeof window.showEducationalFeedback === 'function') window.showEducationalFeedback('⏳ Büyük dosya işleniyor...');
            await this.manager.batchProcessor.process(markers, userMarkers, markers.length);
        } else {
            markers.forEach(marker => {
                userMarkers.push(marker);
                this.manager._addMarkerToMap(marker);
            });
        }

        this.manager._callUpdateCallback();
        this.manager.utils.showFeedback(markers.length, fileName);
        this.manager._showStylePanelFAB(markers.length, fields);
        
        // Add dataset support
        if (typeof window.addDataSet === 'function') {
            window.addDataSet({
                name: fileName.replace(/\.(geojson|json)$/i, ''),
                fileName: fileName,
                type: 'geojson',
                markers: userMarkers.slice(-markers.length),
                fields: fields,
                setAsActive: true
            });
            if (typeof window.updateMapWithDataSets === 'function') window.updateMapWithDataSets();
        }
    }

    /**
     * Export markers to GeoJSON
     */
    export(fileName, userMarkers) {
        const geoJSON = {
            type: "FeatureCollection",
            features: userMarkers.map(marker => {
                let geometry;
                if (marker.type === 'circle') {
                    geometry = { type: "Point", coordinates: [marker.lon, marker.lat] };
                } else if (marker.type === 'area' && marker.geometry) {
                    const coordinates = marker.geometry.map(p => [p.lon, p.lat]);
                    if (coordinates.length > 0) coordinates.push(coordinates[0]); // Close loop
                    geometry = { type: "Polygon", coordinates: [coordinates] };
                } else if (marker.type === 'route' && marker.geometry) {
                    geometry = { type: "LineString", coordinates: marker.geometry.map(p => [p.lon, p.lat]) };
                } else {
                    geometry = { type: "Point", coordinates: [marker.lon, marker.lat] };
                }
                
                return {
                    type: "Feature",
                    geometry: geometry,
                    properties: {
                        name: marker.name,
                        type: marker.type,
                        ...(marker.type === 'circle' ? { circle: true, radius: marker.radius } : {})
                    }
                };
            })
        };
        
        this.manager.downloadFile(JSON.stringify(geoJSON, null, 2), `${fileName}.geojson`, 'application/geo+json');
        if (typeof window.showEducationalFeedback === 'function') window.showEducationalFeedback('🗺️ GeoJSON export edildi.');
    }
}

window.GeoJSONHandler = GeoJSONHandler;
