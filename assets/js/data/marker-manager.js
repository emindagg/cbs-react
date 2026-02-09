/**
 * Marker Management Module - MapLibre GL JS
 * Handles adding and removing markers/geometries from the map
 * - addMarkerToMap (points)
 * - addGeometry ToMap (areas/routes)
 * - addCircleToMap (circles)
 * - removeData (delete markers)
 * - showDataOnMap (focus on specific data)
 * - changeDataColor (modify marker/geometry color)
 *
 * PHASE 3 MIGRATION: Now supports Dependency Injection
 * - Backward compatible with old constructor: new MarkerManager(map)
 * - New DI constructor: new MarkerManager({ map, stateManager, eventBus, config })
 */

// Safe Logger helpers
const safeLogMarker = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeWarnMarker = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorMarker = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

class MarkerManager {
    /**
     * Constructor with support for both old and new APIs
     * @param {MapLibreMap|Object} mapOrDeps - Either a map instance (old API) or dependencies object (new DI API)
     */
    constructor(mapOrDeps) {
        // Check if new DI style (object with map property) or old style (just map)
        if (mapOrDeps && typeof mapOrDeps === 'object' && mapOrDeps.map) {
            // New DI style
            this.map = mapOrDeps.map;
            this.state = mapOrDeps.stateManager || null;
            this.events = mapOrDeps.eventBus || null;
            this.config = mapOrDeps.config || null;
            this._useDI = true;
        } else {
            // Old style (backward compatible)
            this.map = mapOrDeps;
            this.state = null;
            this.events = null;
            this.config = null;
            this._useDI = false;
        }

        this.markers = new Map(); // Store maplibregl.Marker instances by ID
        this.geometries = []; // Store geometry IDs for catalog
        this.circleEditors = new Map(); // Store circle editing controls { centerMarker, edgeMarker, data }
        this.batchMode = false; // Flag for batch operations
        this.pendingGeometries = []; // Buffer for batch geometry additions
        // Local GeoJSON caches to avoid using private source._data
        this.catalogGeoJSON = { type: 'FeatureCollection', features: [] };
        this.clusterGeoJSON = { type: 'FeatureCollection', features: [] };

        safeLogMarker(`✅ MarkerManager initialized (DI mode: ${this._useDI})`);
    }

    /**
     * Ensure catalog source and layers exist. If not, create them.
     */
    ensureCatalogReady(callback) {
        const initCatalog = () => {
            // Add source if missing
            if (!this.map.getSource('catalog-geometries')) {
                const defaultSource = (window.dataSources && window.dataSources.catalogGeometries) || {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                };
                try {
                    this.map.addSource('catalog-geometries', defaultSource);
                } catch (_) { /* Source may already exist */ }
            }

            // Insert layers before first symbol layer if possible
            const layers = this.map.getStyle().layers || [];
            const firstSymbolLayer = layers.find(l => l.type === 'symbol');
            const beforeId = firstSymbolLayer ? firstSymbolLayer.id : undefined;

            // catalog-polygons
            if (!this.map.getLayer('catalog-polygons')) {
                try {
                    this.map.addLayer({
                        id: 'catalog-polygons',
                        type: 'fill',
                        source: 'catalog-geometries',
                        filter: ['==', ['geometry-type'], 'Polygon'],
                        paint: {
                            'fill-color': ['get', 'fillColor'],
                            'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.3]
                        }
                    }, beforeId);
                } catch (_) { /* Layer may already exist */ }
            }

            // catalog-polygon-outlines
            if (!this.map.getLayer('catalog-polygon-outlines')) {
                try {
                    this.map.addLayer({
                        id: 'catalog-polygon-outlines',
                        type: 'line',
                        source: 'catalog-geometries',
                        filter: ['==', ['geometry-type'], 'Polygon'],
                        paint: {
                            'line-color': ['get', 'strokeColor'],
                            'line-width': ['coalesce', ['get', 'strokeWidth'], 2]
                        }
                    }, beforeId);
                } catch (_) { /* Layer may already exist */ }
            }

            // catalog-polygon-outlines-dashed (for circles)
            if (!this.map.getLayer('catalog-polygon-outlines-dashed')) {
                try {
                    this.map.addLayer({
                        id: 'catalog-polygon-outlines-dashed',
                        type: 'line',
                        source: 'catalog-geometries',
                        filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'type'], 'circle']],
                        paint: {
                            'line-color': ['get', 'strokeColor'],
                            'line-width': ['coalesce', ['get', 'strokeWidth'], 2],
                            'line-dasharray': [6, 4]
                        }
                    }, beforeId);
                } catch (_) { /* Layer may already exist */ }
            }

            // catalog-lines
            if (!this.map.getLayer('catalog-lines')) {
                try {
                    this.map.addLayer({
                        id: 'catalog-lines',
                        type: 'line',
                        source: 'catalog-geometries',
                        filter: ['==', ['geometry-type'], 'LineString'],
                        paint: {
                            'line-color': ['get', 'strokeColor'],
                            'line-width': 2
                        }
                    }, beforeId);
                } catch (_) { /* Layer may already exist */ }
            }

            // Move catalog layers above basemap but below symbols
            this.moveCatalogLayersAboveBasemap();

            if (typeof callback === 'function') {
                try { callback(); } catch (_) { /* Ignore callback errors */ }
            }
        };

        if (this.map.isStyleLoaded()) {
            initCatalog();
        } else {
            this.map.once('load', initCatalog);
        }
    }

    /**
     * Move catalog layers above basemap (below first symbol layer)
     */
    moveCatalogLayersAboveBasemap() {
        const catalogLayerIds = [
            'catalog-polygons',
            'catalog-polygon-outlines',
            'catalog-polygon-outlines-dashed',
            'catalog-lines'
        ];
        const layers = this.map.getStyle().layers || [];
        const firstSymbolLayer = layers.find(l => l.type === 'symbol');
        const beforeId = firstSymbolLayer ? firstSymbolLayer.id : undefined;
        catalogLayerIds.forEach(id => {
            if (this.map.getLayer(id)) {
                try { this.map.moveLayer(id, beforeId); } catch (_) { /* Layer may not exist or moveLayer may fail */ }
            }
        });
    }
    
    addMarkerToMap(data) {
        // 🚀 PERFORMANS: Büyük dosyalarda DOM marker oluşturma
        // Clustering aktifse veya _skipMetrics flag'i varsa DOM marker oluşturma
        if (data._skipMetrics || window.clusteringEnabled) {
            // Clustering aktifse cluster source'a ekle
            if (window.clusteringEnabled) {
                this.addToClusterSource(data);
            }
            return; // DOM marker oluşturma
        }
        
        // In batch mode with large datasets, skip individual marker creation
        // They will be clustered or simplified later
        if (this.batchMode && this.pendingGeometries.length > 100) {
            // Just store the data reference, don't create marker yet
            return;
        }
        
        // Veri türüne göre farklı ikonlar ve renkler
        let iconColor = '#2563EB'; // Mavi için mavi pin ikonu
        let iconClass = 'fa-solid fa-map-pin';
        let bgGradient = 'transparent'; // Background yok
        
        if (data.type === 'area') {
            iconColor = '#059669'; // Yeşil
            iconClass = 'fa-regular fa-square';
            bgGradient = 'transparent';
        } else if (data.type === 'route') {
            iconColor = '#EA580C'; // Turuncu
            iconClass = 'fa-solid fa-minus';
            bgGradient = 'transparent';
        }
        
        // Özel renk varsa kullan (sadece ikon rengi için)
        if (data.color) {
            // Hex renk formatını kontrol et
            if (data.color.startsWith('#')) {
                iconColor = data.color;
            } else if (data.color.startsWith('linear-gradient')) {
                // Gradient ise varsayılan mavi kullan
                iconColor = '#2563EB';
            }
        }

        // Türkçe tür adları
        const typeNames = {
            'point': 'Nokta',
            'area': 'Alan',
            'route': 'Çizgi',
            'circle': 'Çember'
        };
        const typeName = typeNames[data.type] || data.type || 'Nokta';

        // Popup için ikon rengi (nokta için mavi, diğerleri için kendi renkleri)
        let popupIconColor = 'text-blue-600';
        let popupIconClass = 'fa-solid fa-map-pin';
        if (data.type === 'area') {
            popupIconColor = 'text-emerald-600';
            popupIconClass = 'fa-regular fa-square';
        } else if (data.type === 'route') {
            popupIconColor = 'text-orange-600';
            popupIconClass = 'fa-solid fa-minus';
        }
        
        const popupContent = `
            <div class="font-sans max-w-xs">
                <div class="border-b pb-2 mb-2">
                    <h4 class="font-bold text-md text-gray-800 flex items-center">
                        <i class="${popupIconClass} mr-1.5 ${popupIconColor} text-sm"></i>
                        ${data.name || 'İsimsiz'}
                    </h4>
                </div>
                <div class="space-y-1 text-sm">
                    <p><strong>Tür:</strong> ${typeName}</p>
                    <p><strong>Koordinat:</strong> ${data.lat ? data.lat.toFixed(5) : 'N/A'}, ${data.lon ? data.lon.toFixed(5) : 'N/A'}</p>
                </div>
            </div>
        `;
        
        // Create custom HTML element for marker
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = `<i class="${iconClass}"></i>`;
        el.style.background = bgGradient;
        el.style.color = iconColor; // İkon rengi (mavi için mavi pin)
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '0'; // Pin şekli için border-radius yok
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '20px'; // Pin ikonu için daha büyük
        el.style.border = 'none'; // Border yok
        el.style.boxShadow = 'none'; // Shadow yok
        el.style.cursor = 'pointer';
        // Marker z-index'i popup'tan düşük olsun
        if (data.type === 'point' || !data.type) {
            el.style.zIndex = '1000';
        }
        
        // Create MapLibre marker
        // Pin ikonu için popup'ı yukarı kaydır (marker'ın üstünde görünsün)
        let popupOptions = {};
        if (data.type === 'point' || !data.type) {
            // Pin ikonu için popup'ı daha yukarı kaydır (pin yüksekliği 24px + boşluk)
            // Popup'ın alt kısmı marker'ın üstüne denk gelsin
            popupOptions = {
                offset: { top: [0, -80], bottom: [0, 0], left: [0, 0], right: [0, 0] },
                anchor: 'bottom' // Popup'ın alt kısmı marker'a bağlı olsun
            };
        } else {
            popupOptions = { offset: 25 };
        }
        
        // Pin ikonu için marker anchor'ı ayarla (pin'in sivri ucu koordinata denk gelsin)
        const markerOptions = {};
        if (data.type === 'point' || !data.type) {
            // Pin ikonu için anchor'ı ayarla - pin'in alt kısmı (sivri uç) koordinata denk gelir
            markerOptions.anchor = 'bottom';
        }
        
        const marker = new maplibregl.Marker({ element: el, ...markerOptions })
            .setLngLat([data.lon, data.lat])
            .setPopup(new maplibregl.Popup(popupOptions).setHTML(popupContent))
            .addTo(this.map);
        
        marker._dataId = data.id;
        this.markers.set(data.id, marker);
        
        // Also add to clustering source if clustering is enabled
        if (window.clusteringEnabled) {
            this.addToClusterSource(data);
        }

        // PHASE 3: Emit event and update state (if DI mode)
        if (this._useDI && this.events) {
            this.events.emitSync('marker:added', { marker: data });
        }
    }
    
    addGeometryToMap(data) {
        let feature = null;
        
        if (data.type === 'area' && data.geometry) {
            // Polygon - add to catalog-geometries source
            const coordinates = [data.geometry.map(p => [p.lon, p.lat])];
            // Close the polygon
            coordinates[0].push(coordinates[0][0]);
            
            const polygonColor = data.color || '#059669';
            
            feature = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: coordinates
                },
                properties: {
                    id: data.id,
                    name: data.name,
                    fillColor: polygonColor,
                    strokeColor: polygonColor,
                    type: 'area',
                    pointCount: data.geometry.length,
                    // Store pre-calculated metrics if available
                    areaStr: data._metrics?.areaStr || null,
                    // Timestamp ekle (timeline için)
                    timestamp: data.timestamp || null
                }
            };
            
            // 🚀 PERFORMANS: Büyük dosyalarda hesaplama yapma
            if (data._skipMetrics) {
                feature.properties.needsCalculation = false; // Hesaplama yapma
                feature.properties.areaStr = 'Hesaplanmadı'; // Placeholder
            } else {
                feature.properties.needsCalculation = !data._metrics?.areaStr;
            }
            
        } else if (data.type === 'route' && data.geometry) {
            // Polyline - add to catalog-geometries source
            const coordinates = data.geometry.map(p => [p.lon, p.lat]);
            const routeColor = data.color || '#EA580C';
            
            feature = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                },
                properties: {
                    id: data.id,
                    name: data.name,
                    strokeColor: routeColor,
                    type: 'route',
                    pointCount: data.geometry.length,
                    // Store pre-calculated metrics if available
                    lengthStr: data._metrics?.lengthStr || null,
                    // Timestamp ekle (timeline için)
                    timestamp: data.timestamp || null
                }
            };
            
            // 🚀 PERFORMANS: Büyük dosyalarda hesaplama yapma
            if (data._skipMetrics) {
                feature.properties.needsCalculation = false; // Hesaplama yapma
                feature.properties.lengthStr = 'Hesaplanmadı'; // Placeholder
            } else {
                feature.properties.needsCalculation = !data._metrics?.lengthStr;
            }
        }
        
        // Add feature to source
        if (feature) {
            const commitFeature = () => {
                const source = this.map.getSource('catalog-geometries');
                if (source) {
                    this.catalogGeoJSON.features = [
                        ...this.catalogGeoJSON.features,
                        feature
                    ];
                    source.setData(this.catalogGeoJSON);
                    this.geometries.push(data.id);
                    // Ensure correct stacking
                    this.moveCatalogLayersAboveBasemap();
                } else {
                    // Source still missing; queue and retry once ready
                    this.pendingGeometries.push(feature);
                }
            };

            if (this.batchMode) {
                // In batch mode, collect features without updating source
                this.pendingGeometries.push(feature);
                this.geometries.push(data.id);
            } else {
                // Ensure catalog is ready, then commit
                if (!this.map.getSource('catalog-geometries')) {
                    this.pendingGeometries.push(feature);
                    this.ensureCatalogReady(() => {
                        const source = this.map.getSource('catalog-geometries');
                        if (source && this.pendingGeometries.length > 0) {
                            this.catalogGeoJSON.features = [
                                ...this.catalogGeoJSON.features,
                                ...this.pendingGeometries
                            ];
                            source.setData(this.catalogGeoJSON);
                            this.pendingGeometries = [];
                            this.moveCatalogLayersAboveBasemap();
                        }
                    });
                } else {
                    commitFeature();
                }
            }
        }
    }
    
    /**
     * Enable batch mode for adding multiple geometries at once
     */
    startBatch() {
        this.batchMode = true;
        this.pendingGeometries = [];
    }
    
    /**
     * Disable batch mode and commit all pending geometries at once
     */
    endBatch() {
        if (this.pendingGeometries.length > 0) {
            const source = this.map.getSource('catalog-geometries');
            if (source) {
                this.catalogGeoJSON.features = [
                    ...this.catalogGeoJSON.features,
                    ...this.pendingGeometries
                ];
                source.setData(this.catalogGeoJSON);
            }
            this.pendingGeometries = [];
        }
        
        // 🚀 PERFORMANS: Cluster source'u da güncelle
        if (window.clusteringEnabled && this.clusterGeoJSON.features.length > 0) {
            this.updateClusterSource();
        }
        
        this.batchMode = false;
    }
    
    addCircleToMap(data) {
        if (!data.radius) {
            safeErrorMarker('Circle data must have radius property');
            return;
        }
        
        // Ensure catalog source/layers exist before proceeding
        if (!this.map.getSource('catalog-geometries')) {
            this.ensureCatalogReady(() => this.addCircleToMap(data));
            return;
        }

        const circleColor = data.color || '#3b82f6';
        
        // Create circle as GeoJSON with turf.js
        const center = turf.point([data.lon, data.lat]);
        const buffered = turf.buffer(center, data.radius / 1000, { units: 'kilometers' });
        
        // Format radius for display
        const radiusKm = (data.radius / 1000).toFixed(2);
        const areaKm2 = (Math.PI * Math.pow(data.radius / 1000, 2)).toFixed(2);
        const perimeterKm = (2 * Math.PI * data.radius / 1000).toFixed(2);
        
        const feature = {
            type: 'Feature',
            geometry: buffered.geometry,
            properties: {
                id: data.id,
                name: data.name,
                fillColor: circleColor, // Kullanıcı rengini kullan
                fillOpacity: 0.15, // Hafif şeffaflık
                strokeColor: circleColor, // Kullanıcı rengini kullan
                strokeWidth: 2,
                dashArray: [6, 4], // 6px çizgi, 4px boşluk
                type: 'circle',
                radius: data.radius,
                // Timestamp ekle (timeline için)
                timestamp: data.timestamp || null,
                popupContent: `
                    <div style="padding: 8px;">
                        <strong>${data.name}</strong><br>
                        <strong>Yarıçap:</strong> ${radiusKm} km<br>
                        <strong>Alan:</strong> ${areaKm2} km²<br>
                        <strong>Çevre:</strong> ${perimeterKm} km
                    </div>
                `
            }
        };
        
        // Add to source
        const source = this.map.getSource('catalog-geometries');
        if (source) {
            this.catalogGeoJSON.features = [
                ...this.catalogGeoJSON.features,
                feature
            ];
            source.setData(this.catalogGeoJSON);
            this.geometries.push(data.id);
            this.moveCatalogLayersAboveBasemap();
            
            // Add edit controls
            this.addCircleEditControls(data);
            
            // Calculate area
            const area = turf.area(buffered);
            const areaStr = this.formatArea(area);
        
        const popupContent = `
            <div class="font-sans text-sm">
                <div class="font-semibold text-gray-800 mb-1">${data.name}</div>
                    <div class="text-xs text-gray-600">
                        <div><strong>Tür:</strong> Çember</div>
                        <div><strong>Yarıçap:</strong> ${data.radius.toLocaleString('tr-TR')} m</div>
                        <div class="mt-1 pt-1 border-t border-gray-200">
                            <strong>Alan:</strong> ${areaStr}
                        </div>
                </div>
            </div>
        `;
        
            feature.properties.popupContent = popupContent;
        }
    }
    
    removeData(dataId) {
        // Remove marker if exists
        if (this.markers.has(dataId)) {
            const marker = this.markers.get(dataId);
            const element = marker.getElement();
            
            marker.remove();
            this.markers.delete(dataId);
            
            // Double-check DOM cleanup (fallback)
            setTimeout(() => {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 100);
        }
        
        // Remove circle editor if exists
        if (this.circleEditors.has(dataId)) {
            const editor = this.circleEditors.get(dataId);
            
            // Get element references before removing
            const centerEl = editor.centerMarker ? editor.centerMarker.getElement() : null;
            const edgeEl = editor.edgeMarker ? editor.edgeMarker.getElement() : null;
            
            if (editor.centerMarker) editor.centerMarker.remove();
            if (editor.edgeMarker) editor.edgeMarker.remove();
            
            this.circleEditors.delete(dataId);
            
            // Force DOM cleanup (fallback)
            setTimeout(() => {
                if (centerEl && centerEl.parentNode) centerEl.parentNode.removeChild(centerEl);
                if (edgeEl && edgeEl.parentNode) edgeEl.parentNode.removeChild(edgeEl);
            }, 100);
        }
        
        // Remove geometry if exists (for area/route/circle)
        if (this.geometries.includes(dataId)) {
            const source = this.map.getSource('catalog-geometries');
            if (source) {
                this.catalogGeoJSON.features = this.catalogGeoJSON.features.filter(
                    f => f.properties.id !== dataId
                );
                source.setData(this.catalogGeoJSON);
                this.geometries = this.geometries.filter(id => id !== dataId);
            }
        }
        
        // Clear temporary point marker (shown during data entry)
        if (window.dataDrawing && typeof window.dataDrawing.clearTempPointMarker === 'function') {
            window.dataDrawing.clearTempPointMarker();
        }

        // PHASE 3: Emit event (if DI mode)
        if (this._useDI && this.events) {
            this.events.emitSync('marker:removed', { markerId: dataId });
        }
    }
    
    showDataOnMap(data) {
        safeLogMarker('📍 showDataOnMap called for:', data);
        safeLogMarker('   Type:', data.type);
        safeLogMarker('   ID:', data.id);
        safeLogMarker('   Has lat/lon:', !!data.lat && !!data.lon);
        safeLogMarker('   Has geometry:', !!data.geometry);
        
        // Handle area/route (has geometry)
        if (data.geometry && data.geometry.length > 0) {
            safeLogMarker('   Geometry exists?', this.geometries.includes(data.id));
            
            if (!this.geometries.includes(data.id)) {
                safeLogMarker('   ➕ Re-creating geometry...');
                this.addGeometryToMap(data);
                safeLogMarker('   ✅ Geometry added');
                safeLogMarker('   Geometry now exists?', this.geometries.includes(data.id));
            } else {
                safeLogMarker('   ℹ️ Geometry already exists, skipping creation');
            }
            
            // Fit bounds to geometry
            const coordinates = data.geometry.map(p => [p.lon, p.lat]);
            const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
            
            this.map.fitBounds(bounds, {
                padding: 200,
                maxZoom: 6,
                duration: 1500
            });
        }
        // Handle point/circle (no geometry, just lat/lon)
        else if (data.lat && data.lon) {
            safeLogMarker('   Marker exists?', this.markers.has(data.id));
            
            if (!this.markers.has(data.id)) {
                safeLogMarker('   ➕ Re-creating marker/circle...');
                if (data.type === 'point') {
                    this.addMarkerToMap(data);
                    safeLogMarker('   ✅ Point marker added');
                } else if (data.type === 'circle') {
                    this.addCircleToMap(data);
                    safeLogMarker('   ✅ Circle added');
                }
                safeLogMarker('   Marker now exists?', this.markers.has(data.id));
            } else {
                safeLogMarker('   ℹ️ Marker already exists, skipping creation');
            }
            
            // Fly to point
            this.map.flyTo({
                center: [data.lon, data.lat],
                zoom: 6,
                duration: 1500
            });
            
            // Open marker popup if exists
            if (this.markers.has(data.id)) {
                const marker = this.markers.get(data.id);
                setTimeout(() => {
                    marker.togglePopup();
                }, 1500);
            }
        }
    }
    
    changeDataColor(index, markerData, userMarkers, updateCallback) {
        // Renk seçici dialog'u göster
        const currentColor = markerData.color || this.getDefaultColor(markerData.type);
        
        // Create visible input element temporarily
        const input = document.createElement('input');
        input.type = 'color';
        input.value = currentColor;
        input.style.position = 'fixed';
        input.style.top = '-9999px';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        
        const handleColorChange = (e) => {
            const newColor = e.target.value;
            
            // Update marker data
            markerData.color = newColor;
            userMarkers[index].color = newColor;
            
            // Update marker visual
            if (this.markers.has(markerData.id)) {
                const marker = this.markers.get(markerData.id);
                const el = marker.getElement();
                if (el) {
                    el.style.background = newColor;
                }
            }
            
            // Update geometry color (includes circles, areas, routes)
            if (this.geometries.includes(markerData.id)) {
                const source = this.map.getSource('catalog-geometries');
                if (source) {
                    const feature = this.catalogGeoJSON.features.find(f => f.properties.id === markerData.id);
                    if (feature) {
                        feature.properties.fillColor = newColor;
                        feature.properties.strokeColor = newColor;
                        source.setData(this.catalogGeoJSON);
                    }
                }
            }
            
            // Update UI
            if (updateCallback) {
                updateCallback();
            }
            
            if (typeof showEducationalFeedback === 'function') {
                showEducationalFeedback(`🎨 "${markerData.name}" rengi güncellendi`);
            }
            
            // Cleanup
            setTimeout(() => input.remove(), 100);
        };
        
        const handleCancel = () => {
            setTimeout(() => input.remove(), 100);
        };
        
        input.addEventListener('change', handleColorChange);
        input.addEventListener('blur', handleCancel);
        
        // Trigger color picker immediately
        input.click();
    }
    
    getDefaultColor(type) {
        const defaults = {
            'point': '#2563EB',
            'area': '#059669',
            'route': '#EA580C',
            'circle': '#8B5CF6'
        };
        return defaults[type] || '#2563EB';
    }
    
    clearAllData() {
        // Remove all point markers
        this.markers.forEach(marker => marker.remove());
        this.markers.clear();
        
        // Remove all circle editor markers (center + edge)
        this.circleEditors.forEach(editor => {
            if (editor.centerMarker) editor.centerMarker.remove();
            if (editor.edgeMarker) editor.edgeMarker.remove();
        });
        this.circleEditors.clear();
        
        // Clear geometries
        const source = this.map.getSource('catalog-geometries');
        if (source) {
            this.catalogGeoJSON = { type: 'FeatureCollection', features: [] };
            source.setData(this.catalogGeoJSON);
        }
        this.geometries = [];

        // Also clear cluster source cache if exists
        const clusterSource = this.map.getSource('markers');
        if (clusterSource) {
            this.clusterGeoJSON = { type: 'FeatureCollection', features: [] };
            clusterSource.setData(this.clusterGeoJSON);
        }
        
        // Clear temporary point marker (shown during data entry)
        if (window.dataDrawing && typeof window.dataDrawing.clearTempPointMarker === 'function') {
            window.dataDrawing.clearTempPointMarker();
        }
        
        // Clear temporary markers from area/route collection
        if (window.dataDrawing && typeof window.dataDrawing.cleanupTempLayers === 'function') {
            window.dataDrawing.cleanupTempLayers();
        }
    }
    
    addToClusterSource(data) {
        // 🚀 PERFORMANS: Batch mode'da setData çağırma
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [data.lon, data.lat]
            },
            properties: {
                id: data.id,
                name: data.name,
                type: data.type,
                // Timestamp ekle (timeline için)
                timestamp: data.timestamp || null
            }
        };
        
        // Batch mode'da sadece array'e ekle, setData çağırma
        if (this.batchMode) {
            this.clusterGeoJSON.features.push(feature);
        } else {
            // Normal mode'da hemen ekle
            this.clusterGeoJSON.features.push(feature);
            const source = this.map.getSource('markers');
            if (source) {
                source.setData(this.clusterGeoJSON);
            }
        }
    }
    
    /**
     * Cluster source'u güncelle (batch işlemlerden sonra)
     */
    updateClusterSource() {
        const source = this.map.getSource('markers');
        if (source) {
            source.setData(this.clusterGeoJSON);
            safeLogMarker(`⚡ Cluster source güncellendi: ${this.clusterGeoJSON.features.length} nokta`);
        }
    }
    
    formatArea(area) {
        // Format area in m², ha, or km²
        if (area < 10000) {
            return `${Math.round(area).toLocaleString('tr-TR')} m²`;
        } else if (area < 1000000) {
            const ha = area / 10000;
            return `${ha.toLocaleString('tr-TR', { minimumFractionDigits: (ha >= 100 ? 0 : 2), maximumFractionDigits: (ha >= 100 ? 0 : 2) })} ha`;
        } else {
            const km2 = area / 1000000;
            return `${km2.toLocaleString('tr-TR', { minimumFractionDigits: (km2 >= 100 ? 0 : 2), maximumFractionDigits: (km2 >= 100 ? 0 : 2) })} km²`;
        }
    }
}

// Initialize when map is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const initMarkerHandlers = () => {
            if (window.map && typeof window.map.on === 'function') {
                window.map.on('load', () => {
                // MarkerManager is already initialized in app-bootstrap.js
                // Setup layer-based popup handlers via orchestrator
                
                // 🚀 PERFORMANS: Büyük veri setlerinde popup'ları devre dışı bırak
                const isLargeDataset = window.userMarkers && window.userMarkers.length > 5000;
                
                if (isLargeDataset) {
                    safeLogMarker('⚡ Büyük veri seti tespit edildi, popup\'lar performans için devre dışı');
                    if (typeof showEducationalFeedback === 'function') {
                        showEducationalFeedback('⚡ Performans için popup\'lar devre dışı. Zoom yaparak detay görün.');
                    }
                }
                
                if (window.mapClickOrchestrator && !isLargeDataset) {
                    // Register polygon popup handler (layer-based for performance)
                    window.mapClickOrchestrator.registerLayerHandler('catalog-polygons', {
                        name: 'polygon-popup',
                        priority: 10, // Lower than data-drawing (50) to allow data collection to take precedence
                        canHandle: (_e) => {
                            // Don't show popup if data collection is active
                            const dataTypeSelect = document.getElementById('data-type');
                            const currentMode = dataTypeSelect ? dataTypeSelect.value : 'none';
                            return currentMode === 'none';
                        },
                        handle: (e) => {
                            if (!e.features || e.features.length === 0) return;
                            const feature = e.features[0];
                            let popupContent = feature.properties.popupContent;
                            
                            // Use pre-calculated metric if available, otherwise calculate on-demand
                            if (!popupContent) {
                                let areaStr = feature.properties.areaStr;
                                
                                if (!areaStr && feature.properties.needsCalculation) {
                                    try {
                                        const polygon = turf.polygon(feature.geometry.coordinates);
                                        const area = turf.area(polygon);
                                        areaStr = window.markerManager.formatArea(area);
                                    } catch (err) {
                                        safeWarnMarker('Alan hesaplama hatası:', err);
                                        areaStr = 'Hesaplanamadı';
                                    }
                                }
                                
                                popupContent = `
                                    <div class="font-sans text-sm">
                                        <div class="font-semibold text-gray-800 mb-1">${feature.properties.name}</div>
                                        <div class="text-xs text-gray-600">
                                            <div><strong>Tür:</strong> Alan</div>
                                            <div><strong>Nokta Sayısı:</strong> ${feature.properties.pointCount}</div>
                                            ${areaStr ? `<div class="mt-1 pt-1 border-t border-gray-200"><strong>Alan:</strong> ${areaStr}</div>` : ''}
                                        </div>
                                    </div>
                                `;
                            }
                            
                            if (popupContent) {
                                new maplibregl.Popup()
                                    .setLngLat(e.lngLat)
                                    .setHTML(popupContent)
                                    .addTo(window.map);
                            }
                        }
                    });
                    
                    // Register line popup handler (layer-based for performance)
                    window.mapClickOrchestrator.registerLayerHandler('catalog-lines', {
                        name: 'line-popup',
                        priority: 10, // Lower than data-drawing (50) to allow data collection to take precedence
                        canHandle: (_e) => {
                            // Don't show popup if data collection is active
                            const dataTypeSelect = document.getElementById('data-type');
                            const currentMode = dataTypeSelect ? dataTypeSelect.value : 'none';
                            return currentMode === 'none';
                        },
                        handle: (e) => {
                            if (!e.features || e.features.length === 0) return;
                            const feature = e.features[0];
                            let popupContent = feature.properties.popupContent;
                            
                            // Use pre-calculated metric if available, otherwise calculate on-demand
                            if (!popupContent) {
                                let lengthStr = feature.properties.lengthStr;
                                
                                if (!lengthStr && feature.properties.needsCalculation) {
                                    try {
                                        const line = turf.lineString(feature.geometry.coordinates);
                                        const length = turf.length(line, {units: 'kilometers'});
                                        const lengthM = length * 1000;
                                        lengthStr = lengthM < 1000
                                            ? `${Math.round(lengthM).toLocaleString('tr-TR')} m`
                                            : `${length.toLocaleString('tr-TR', { minimumFractionDigits: (length >= 100 ? 0 : 2), maximumFractionDigits: (length >= 100 ? 0 : 2) })} km`;
                                    } catch (err) {
                                        safeWarnMarker('Mesafe hesaplama hatası:', err);
                                        lengthStr = 'Hesaplanamadı';
                                    }
                                }
                                
                                popupContent = `
                                    <div class="font-sans text-sm">
                                        <div class="font-semibold text-gray-800 mb-1">${feature.properties.name}</div>
                                        <div class="text-xs text-gray-600">
                                            <div><strong>Tür:</strong> Çizgi</div>
                                            <div><strong>Nokta Sayısı:</strong> ${feature.properties.pointCount}</div>
                                            ${lengthStr ? `<div class="mt-1 pt-1 border-t border-gray-200"><strong>Mesafe:</strong> ${lengthStr}</div>` : ''}
                                        </div>
                                    </div>
                                `;
                            }
                            
                            if (popupContent) {
                                new maplibregl.Popup()
                                    .setLngLat(e.lngLat)
                                    .setHTML(popupContent)
                                    .addTo(window.map);
                            }
                        }
                    });
                }
                
                // Change cursor on hover (throttled for performance)
                const setCursorPointer = window.performanceUtils?.rafThrottle(() => {
                    // Don't change cursor if data collection is active
                    const dataTypeSelect = document.getElementById('data-type');
                    const currentMode = dataTypeSelect ? dataTypeSelect.value : 'none';
                    if (currentMode === 'none') {
                        window.map.getCanvas().style.cursor = 'pointer';
                    }
                }) || (() => { 
                    const dataTypeSelect = document.getElementById('data-type');
                    const currentMode = dataTypeSelect ? dataTypeSelect.value : 'none';
                    if (currentMode === 'none') {
                        window.map.getCanvas().style.cursor = 'pointer';
                    }
                });
                
                const setCursorDefault = window.performanceUtils?.rafThrottle(() => {
                    // Restore appropriate cursor
                    const dataTypeSelect = document.getElementById('data-type');
                    const currentMode = dataTypeSelect ? dataTypeSelect.value : 'none';
                    window.map.getCanvas().style.cursor = currentMode === 'none' ? '' : 'crosshair';
                }) || (() => { 
                    const dataTypeSelect = document.getElementById('data-type');
                    const currentMode = dataTypeSelect ? dataTypeSelect.value : 'none';
                    window.map.getCanvas().style.cursor = currentMode === 'none' ? '' : 'crosshair';
                });
                
                window.map.on('mouseenter', 'catalog-polygons', setCursorPointer);
                window.map.on('mouseleave', 'catalog-polygons', setCursorDefault);
                window.map.on('mouseenter', 'catalog-lines', setCursorPointer);
                window.map.on('mouseleave', 'catalog-lines', setCursorDefault);
            });
        } else {
            // Map not ready yet, wait for it
            setTimeout(initMarkerHandlers, 100);
        }
        };
        initMarkerHandlers();
    });
}

// Add circle edit controls (outside class, will be added as method)
MarkerManager.prototype.addCircleEditControls = function(data) {
        // Center marker (draggable)
        const centerEl = document.createElement('div');
        centerEl.style.width = '12px';
        centerEl.style.height = '12px';
        centerEl.style.borderRadius = '50%';
        centerEl.style.background = '#2563EB';
        centerEl.style.border = '2px solid white';
        centerEl.style.cursor = 'move';
        centerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        const centerMarker = new maplibregl.Marker({
            element: centerEl,
            draggable: true
        })
            .setLngLat([data.lon, data.lat])
            .addTo(this.map);
        
        // Edge marker (draggable) - başlangıçta sağ tarafa yerleştir
        const edgeEl = document.createElement('div');
        edgeEl.style.width = '10px';
        edgeEl.style.height = '10px';
        edgeEl.style.borderRadius = '50%';
        edgeEl.style.background = '#ffffff';
        edgeEl.style.border = '2px solid #2563EB';
        edgeEl.style.cursor = 'ew-resize';
        edgeEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        // Calculate edge position (right side of circle)
        const centerPoint = turf.point([data.lon, data.lat]);
        const radiusKm = data.radius / 1000;
        const edgePoint = turf.destination(centerPoint, radiusKm, 90, { units: 'kilometers' });
        const [edgeLng, edgeLat] = edgePoint.geometry.coordinates;
        
        const edgeMarker = new maplibregl.Marker({
            element: edgeEl,
            draggable: true
        })
            .setLngLat([edgeLng, edgeLat])
            .addTo(this.map);
        
        // Store references
        this.circleEditors.set(data.id, {
            centerMarker,
            edgeMarker,
            data: { ...data }
        });
        
        // Update circle on center drag
        centerMarker.on('drag', () => {
            const newCenter = centerMarker.getLngLat();
            const edgePos = edgeMarker.getLngLat();
            
            // Calculate new radius
            const newRadius = turf.distance(
                turf.point([newCenter.lng, newCenter.lat]),
                turf.point([edgePos.lng, edgePos.lat]),
                { units: 'meters' }
            );
            
            // Update circle
            this.updateCircleGeometry(data.id, newCenter.lat, newCenter.lng, newRadius);
        });
        
        // Update circle on edge drag
        edgeMarker.on('drag', () => {
            const centerPos = centerMarker.getLngLat();
            const newEdge = edgeMarker.getLngLat();
            
            // Calculate new radius
            const newRadius = turf.distance(
                turf.point([centerPos.lng, centerPos.lat]),
                turf.point([newEdge.lng, newEdge.lat]),
                { units: 'meters' }
            );
            
            // Update circle
            this.updateCircleGeometry(data.id, centerPos.lat, centerPos.lng, newRadius);
        });
        
        // Finalize on dragend
        centerMarker.on('dragend', () => {
            const editor = this.circleEditors.get(data.id);
            if (editor) {
                // Update data reference
                const newCenter = centerMarker.getLngLat();
                const newRadius = turf.distance(
                    turf.point([newCenter.lng, newCenter.lat]),
                    turf.point([edgeMarker.getLngLat().lng, edgeMarker.getLngLat().lat]),
                    { units: 'meters' }
                );
                editor.data.lat = newCenter.lat;
                editor.data.lon = newCenter.lng;
                editor.data.radius = newRadius;
            }
        });
        
        edgeMarker.on('dragend', () => {
            const editor = this.circleEditors.get(data.id);
            if (editor) {
                // Update data reference
                const centerPos = centerMarker.getLngLat();
                const newRadius = turf.distance(
                    turf.point([centerPos.lng, centerPos.lat]),
                    turf.point([edgeMarker.getLngLat().lng, edgeMarker.getLngLat().lat]),
                    { units: 'meters' }
                );
                editor.data.radius = newRadius;
            }
        });
};

MarkerManager.prototype.updateCircleGeometry = function(circleId, lat, lng, radius) {
        const source = this.map.getSource('catalog-geometries');
        if (!source) return;
        
        const featureIndex = this.catalogGeoJSON.features.findIndex(f => f.properties.id === circleId);
        
        if (featureIndex === -1) return;
        
        // Create new circle geometry
        const center = turf.point([lng, lat]);
        const buffered = turf.buffer(center, radius / 1000, { units: 'kilometers' });
        
        // Update feature geometry
        this.catalogGeoJSON.features[featureIndex].geometry = buffered.geometry;
        this.catalogGeoJSON.features[featureIndex].properties.radius = radius;
        
        // Update popup content
        const radiusKm = (radius / 1000).toFixed(2);
        const areaKm2 = (Math.PI * Math.pow(radius / 1000, 2)).toFixed(2);
        const perimeterKm = (2 * Math.PI * radius / 1000).toFixed(2);
        
        this.catalogGeoJSON.features[featureIndex].properties.popupContent = `
            <div style="padding: 8px;">
                <strong>${this.catalogGeoJSON.features[featureIndex].properties.name}</strong><br>
                <strong>Yarıçap:</strong> ${radiusKm} km<br>
                <strong>Alan:</strong> ${areaKm2} km²<br>
                <strong>Çevre:</strong> ${perimeterKm} km
            </div>
        `;
        
        // Update source
        source.setData(this.catalogGeoJSON);
};

// Browser global export
if (typeof window !== 'undefined') {
    window.MarkerManager = MarkerManager;
}
