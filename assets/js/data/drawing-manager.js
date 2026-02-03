/**
 * Data Drawing Module - MapLibre GL JS
 * Handles interactive data collection on the map:
 * - Point collection
 * - Area/polygon drawing
 * - Route/polyline drawing
 * - Circle drawing
 * - Map click handlers for data collection
 *
 * PHASE 3 MIGRATION: Now supports Dependency Injection
 * - Backward compatible with old constructor: new DataDrawing(map)
 * - New DI constructor: new DataDrawing({ map, stateManager, eventBus })
 */

// Safe Logger helpers
const safeLogDrawing = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeWarnDrawing = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorDrawing = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

class DataDrawing {
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
            this._useDI = true;
        } else {
            // Old style (backward compatible)
            this.map = mapOrDeps;
            this.state = null;
            this.events = null;
            this._useDI = false;
        }

        // State variables
        this.lastClickedLatLng = null;
        this.collectingPoints = false;
        this.collectedPoints = [];
        this.currentCollectionType = 'point';
        this.tempMarkers = [];
        this.tempPointMarker = null;
        this.ghostMarker = null;

        // Circle drawing state
        this.drawingCircle = false;
        this.circleCenter = null;
        this.circleCenterMarker = null;

        // Temporary popup for showing area/length during drawing
        this.tempPopup = null;
        this._drawingMouseMoveHandler = null;

        // Double click management for drawing (area/route)
        this._onDblClickDrawingHandler = null;
        this._doubleClickZoomDisabledByDrawing = false;

        // Bind methods
        this.handleMapClick = this.handleMapClick.bind(this);
        this.onDrawingMouseMove = this.onDrawingMouseMove.bind(this);
        this.onDoubleClickDrawing = this.onDoubleClickDrawing.bind(this);

        safeLogDrawing(`✅ DataDrawing initialized (DI mode: ${this._useDI})`);
    }
    
    canHandleClick() {
        // Don't handle if measurement tools are active
        const measurementActive = (window.distanceMeasurementTool && window.distanceMeasurementTool.isActive) || 
                                   (window.areaMeasurementTool && window.areaMeasurementTool.isActive);
        if (measurementActive) {
            return false;
        }
        
        // Check if data collection mode is active
        const dataTypeSelect = document.getElementById('data-type');
        const currentMode = dataTypeSelect ? dataTypeSelect.value : 'none';
        
        // Only handle if in an active collection mode (not "none")
        if (currentMode === 'none') {
            return false;
        }
        
        return this.collectingPoints || currentMode === 'circle' || currentMode === 'point';
    }
    
    handleMapClick(e) {
        // Veri toplama modu kontrolü
        const dataTypeSelect = document.getElementById('data-type');
        const currentMode = dataTypeSelect ? dataTypeSelect.value : 'none';
        
        if (this.collectingPoints) {
            // Çoklu nokta toplama modu - e.lngLat (MapLibre)
            this.collectPoint({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        } else if (currentMode === 'circle') {
            // Çember çizimi
            this.handleCircleClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        } else if (currentMode === 'point') {
            // Nokta ekleme modu
            this.handlePointClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        }
    }
    
    handlePointClick(lngLat) {
        // Show ghost marker at clicked location
        this.lastClickedLatLng = lngLat;
        this.showGhostMarker(lngLat);
        
        // Show input section
        const inputSection = document.getElementById('data-input-section');
        if (inputSection) {
            inputSection.classList.remove('hidden');
        }
        
        // Focus on name input
        const nameInput = document.getElementById('data-name');
        if (nameInput) {
            nameInput.focus();
        }
        
        // Keep crosshair cursor active for next point
        this.map.getCanvas().style.cursor = 'crosshair';
    }
    
    handleCircleClick(lngLat) {
        if (!this.drawingCircle || !this.circleCenter) {
            // 1. tık: merkez
            this.startCircleDrawing(lngLat);
        } else {
            // 2. tık: çemberi sabitle
            this.finalizeCircleDrawing(lngLat);
        }
    }
    
    startCircleDrawing(lngLat) {
        this.drawingCircle = true;
        this.circleCenter = lngLat;
        
        // Draggable merkez işaretçisi
        if (this.circleCenterMarker) {
            this.circleCenterMarker.remove();
        }
        
        const el = document.createElement('div');
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.borderRadius = '50%';
        el.style.background = '#2563EB';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'move';
        
        this.circleCenterMarker = new maplibregl.Marker({ 
            element: el,
            draggable: true 
        })
            .setLngLat([lngLat.lng, lngLat.lat])
            .addTo(this.map);
        
        // Update center when dragged
        this.circleCenterMarker.on('drag', () => {
            const newLngLat = this.circleCenterMarker.getLngLat();
            this.circleCenter = { lng: newLngLat.lng, lat: newLngLat.lat };
            // Trigger a fake mousemove to update the circle preview
            if (this._lastMousePos) {
                this._updateCirclePreview(this._lastMousePos);
            }
        });
        
        // Add temp circle source/layer for preview
        if (!this.map.getSource('temp-circle')) {
            this.map.addSource('temp-circle', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
            
            this.map.addLayer({
                id: 'temp-circle-fill',
                type: 'fill',
                source: 'temp-circle',
                paint: {
                    'fill-color': '#3B82F6',
                    'fill-opacity': 0.25 // Daha görünür
                }
            });
            
            this.map.addLayer({
                id: 'temp-circle-outline',
                type: 'line',
                source: 'temp-circle',
                paint: {
                    'line-color': '#2563EB',
                    'line-width': 2
                    // Düz çizgi - performans için
                }
            });
        }
        
        // Add guide line source/layer (merkez → mouse kesikli çizgi)
        if (!this.map.getSource('circle-guide')) {
            this.map.addSource('circle-guide', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
            
            this.map.addLayer({
                id: 'circle-guide-line',
                type: 'line',
                source: 'circle-guide',
                paint: {
                    'line-color': '#2563EB',
                    'line-width': 2,
                    'line-dasharray': [6, 4] // 6px çizgi, 4px boşluk
                }
            });
        }
        
        // Mouse move handler for preview
        const mouseMoveHandler = (e) => {
            this._lastMousePos = e.lngLat;
            this._updateCirclePreview(e.lngLat);
        };
        
        this.map.on('mousemove', mouseMoveHandler);
        this._circleMouseMoveHandler = mouseMoveHandler;
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('⭕ Çemberin kenarını belirlemek için haritaya tıklayın.');
        }
    }
    
    _updateCirclePreview(lngLat) {
        if (!this.circleCenter) return;
        
        const radius = turf.distance(
            turf.point([this.circleCenter.lng, this.circleCenter.lat]),
            turf.point([lngLat.lng, lngLat.lat]),
            { units: 'meters' }
        );
        
        const circle = turf.circle([this.circleCenter.lng, this.circleCenter.lat], radius / 1000, {
            steps: 64,
            units: 'kilometers'
        });
        
        const source = this.map.getSource('temp-circle');
        if (source) {
            source.setData(circle);
        }
        
        // Update guide line (merkez → mouse kesikli çizgi)
        const guideSource = this.map.getSource('circle-guide');
        if (guideSource) {
            const guideLine = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [this.circleCenter.lng, this.circleCenter.lat],
                        [lngLat.lng, lngLat.lat]
                    ]
                }
            };
            guideSource.setData({
                type: 'FeatureCollection',
                features: [guideLine]
            });
        }
        
        // Update tooltip with real-time measurements
        const radiusKm = (radius / 1000).toFixed(2);
        const radiusM = Math.round(radius);
        const area = Math.PI * Math.pow(radius, 2);
        const perimeter = 2 * Math.PI * radius;
        
        // Format area
        let areaText;
        if (area < 10000) {
            areaText = `${Math.round(area).toLocaleString('tr-TR')} m²`;
        } else if (area < 1000000) {
            areaText = `${(area / 10000).toFixed(2)} ha`;
        } else {
            areaText = `${(area / 1000000).toFixed(2)} km²`;
        }
        
        // Format perimeter
        const perimeterText = perimeter < 1000 
            ? `${Math.round(perimeter)} m`
            : `${(perimeter / 1000).toFixed(2)} km`;
        
        const tooltipHTML = `
            <div style="font-size: 11px; line-height: 1.4;">
                <strong>Yarıçap:</strong> ${radius < 1000 ? radiusM + ' m' : radiusKm + ' km'}<br>
                <strong>Alan:</strong> ${areaText}
            </div>
        `;
        
        if (!this.circleTooltip) {
            this.circleTooltip = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                className: 'circle-drawing-tooltip',
                offset: 15
            });
        }
        
        this.circleTooltip
            .setLngLat([lngLat.lng, lngLat.lat])
            .setHTML(tooltipHTML)
            .addTo(this.map);
    }
    
    finalizeCircleDrawing(lngLat) {
        // Remove mousemove handler but keep the circle visible until data is added
        if (this._circleMouseMoveHandler) {
            this.map.off('mousemove', this._circleMouseMoveHandler);
            this._circleMouseMoveHandler = null;
        }
        this._lastMousePos = null;
        
        // Remove tooltip
        if (this.circleTooltip) {
            this.circleTooltip.remove();
            this.circleTooltip = null;
        }
        
        // Remove guide line (kesikli çizgi)
        if (this.map.getLayer('circle-guide-line')) {
            this.map.removeLayer('circle-guide-line');
        }
        if (this.map.getSource('circle-guide')) {
            this.map.removeSource('circle-guide');
        }
        
        // DON'T remove temp layers yet - they will be removed when circle data is added
        // or when circle drawing is cancelled
        
        // Calculate radius
        const radius = turf.distance(
            turf.point([this.circleCenter.lng, this.circleCenter.lat]),
            turf.point([lngLat.lng, lngLat.lat]),
            { units: 'meters' }
        );
        
        this.lastClickedLatLng = this.circleCenter;
        this.lastClickedLatLng.radius = radius;
        
        // Show input section
        const inputSection = document.getElementById('data-input-section');
        if (inputSection) {
            inputSection.classList.remove('hidden');
        }
        
        // Focus on name input
        const nameInput = document.getElementById('data-name');
        if (nameInput) {
            nameInput.focus();
        }
        
        // Reset circle state
        this.drawingCircle = false;
        this.circleCenter = null;
        if (this.circleCenterMarker) {
            this.circleCenterMarker.remove();
            this.circleCenterMarker = null;
        }
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`⭕ Çember yarıçapı: ${Math.round(radius)} m. İsim girin ve kaydedin.`);
        }
    }
    
    collectPoint(lngLat) {
        // Remove temp popup when point is clicked
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }
        
        const pointIndex = this.collectedPoints.length;
        this.collectedPoints.push(lngLat);
        
        // Add draggable temp marker
        const el = document.createElement('div');
        el.style.width = '10px';
        el.style.height = '10px';
        el.style.borderRadius = '50%';
        el.style.background = this.currentCollectionType === 'area' ? '#22c55e' : '#EA580C';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'move';
        
        const marker = new maplibregl.Marker({ 
            element: el,
            draggable: true 
        })
            .setLngLat([lngLat.lng, lngLat.lat])
            .addTo(this.map);
        
        // Handle drag to update point position
        marker.on('drag', () => {
            const newLngLat = marker.getLngLat();
            this.collectedPoints[pointIndex] = { lng: newLngLat.lng, lat: newLngLat.lat };
            this.updateTempLayer();
        });
        
        this.tempMarkers.push(marker);
        
        // Update temp layer
        this.updateTempLayer();
        
        if (typeof showEducationalFeedback === 'function') {
            const pointCount = this.collectedPoints.length;
            showEducationalFeedback(`📍 Nokta eklendi (${pointCount}). Noktaları sürükleyebilirsiniz. ${this.currentCollectionType === 'area' ? 'ESC ile bitirin.' : 'ESC ile bitirin.'}`);
        }
    }
    
    updateTempLayer() {
        this.updateTempLayerWithMouse(null);
    }
    
    /**
     * Update temporary layer with optional mouse position for preview
     */
    updateTempLayerWithMouse(mousePos) {
        const allPoints = mousePos 
            ? [...this.collectedPoints, mousePos]
            : this.collectedPoints;
        
        if (allPoints.length < 2) {
            // Clear temp layer if not enough points
            const source = this.map.getSource('temp-drawing');
            if (source) {
                source.setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }
            return;
        }
        
        const coordinates = allPoints.map(p => [p.lng, p.lat]);
        
        let geojson;
        if (this.currentCollectionType === 'area' && allPoints.length >= 3) {
            // Polygon
            geojson = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[...coordinates, coordinates[0]]]
                }
            };
        } else {
            // LineString
            geojson = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                }
            };
        }
        
        // Add/update temp layer
        if (!this.map.getSource('temp-drawing')) {
            this.map.addSource('temp-drawing', {
                type: 'geojson',
                data: geojson
            });
            
            this.map.addLayer({
                id: 'temp-drawing-line',
                type: 'line',
                source: 'temp-drawing',
                paint: {
                    'line-color': '#22c55e',
                    'line-width': 2,
                    'line-dasharray': [2, 2]
                }
            });
            
            if (this.currentCollectionType === 'area') {
                this.map.addLayer({
                    id: 'temp-drawing-fill',
                    type: 'fill',
                    source: 'temp-drawing',
                    paint: {
                        'fill-color': '#22c55e',
                        'fill-opacity': 0.1
                    }
                });
            }
        } else {
            const source = this.map.getSource('temp-drawing');
            source.setData(geojson);
        }
    }
    
    startAreaCollection() {
        this.collectingPoints = true;
        this.collectedPoints = [];
        this.currentCollectionType = 'area';
        this.map.getCanvas().style.cursor = 'crosshair';

        // Add mousemove handler for showing area during drawing
        this.map.on('mousemove', this.onDrawingMouseMove);
        this._drawingMouseMoveHandler = this.onDrawingMouseMove;

        // Disable double-click zoom and finish with double-click
        this._disableDoubleClickZoomForDrawing();
        this._bindDoubleClickHandler();

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('🔷 Alan çizimi başladı. Haritaya tıklayarak noktalar ekleyin.');
        }

        // PHASE 3: Emit event and update state (if DI mode)
        if (this._useDI) {
            if (this.events) {
                this.events.emitSync('drawing:started', { type: 'area' });
            }
            if (this.state) {
                this.state.set('drawing.isDrawing', true);
                this.state.set('drawing.currentTool', 'area');
            }
        }
    }
    
    startRouteCollection() {
        this.collectingPoints = true;
        this.collectedPoints = [];
        this.currentCollectionType = 'route';
        this.map.getCanvas().style.cursor = 'crosshair';

        // Add mousemove handler for showing length during drawing
        this.map.on('mousemove', this.onDrawingMouseMove);
        this._drawingMouseMoveHandler = this.onDrawingMouseMove;

        // Disable double-click zoom and finish with double-click
        this._disableDoubleClickZoomForDrawing();
        this._bindDoubleClickHandler();

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('〰️ Rota çizimi başladı. Haritaya tıklayarak noktalar ekleyin.');
        }

        // PHASE 3: Emit event and update state (if DI mode)
        if (this._useDI) {
            if (this.events) {
                this.events.emitSync('drawing:started', { type: 'route' });
            }
            if (this.state) {
                this.state.set('drawing.isDrawing', true);
                this.state.set('drawing.currentTool', 'route');
            }
        }
    }
    
    finalizeDrawing() {
        if (!this.collectingPoints || this.collectedPoints.length < 2) {
            this.cancelDrawing();
            return null;
        }
        
        const geometry = this.collectedPoints.map(p => ({ lat: p.lat, lon: p.lng }));
        
        // Clean up (full finalize - used by external callers)
        this.cleanupTempLayers();
        this.removeTempPopup();
        this.removeMouseMoveHandler();
        this.collectingPoints = false;
        this.collectedPoints = [];
        this.map.getCanvas().style.cursor = '';
        
        // Restore dblclick state when fully finalized
        this._restoreDoubleClickZoomIfDisabled();
        this._removeDoubleClickHandler();

        return geometry;
    }
    
    cancelDrawing() {
        this.collectingPoints = false;
        this.collectedPoints = [];
        this.cleanupTempLayers();
        this.removeTempPopup();
        this.removeMouseMoveHandler();
        this.map.getCanvas().style.cursor = '';
        
        // Restore dblclick zoom if we disabled it
        this._restoreDoubleClickZoomIfDisabled();
        this._removeDoubleClickHandler();

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('❌ Çizim iptal edildi.');
        }
    }
    
    cleanupTempLayers() {
        // Remove temp markers
        this.tempMarkers.forEach(m => m.remove());
        this.tempMarkers = [];
        
        // Remove temp layers
        if (this.map.getLayer('temp-drawing-line')) {
            this.map.removeLayer('temp-drawing-line');
        }
        if (this.map.getLayer('temp-drawing-fill')) {
            this.map.removeLayer('temp-drawing-fill');
        }
        if (this.map.getSource('temp-drawing')) {
            this.map.removeSource('temp-drawing');
        }
    }
    
    /**
     * Mouse move handler for showing area/length during drawing
     */
    onDrawingMouseMove(e) {
        if (!this.collectingPoints || this.collectedPoints.length === 0) {
            this.removeTempPopup();
            return;
        }
        
        const mousePos = { lng: e.lngLat.lng, lat: e.lngLat.lat };
        const previewPoints = [...this.collectedPoints, mousePos];
        
        // Update temporary line/polygon preview with mouse position
        this.updateTempLayerWithMouse(mousePos);
        
        if (this.currentCollectionType === 'area') {
            // Show area for polygon
            if (previewPoints.length >= 3) {
                try {
                    const coordinates = [previewPoints.map(p => [p.lng, p.lat])];
                    coordinates[0].push(coordinates[0][0]); // Close polygon
                    const polygon = turf.polygon(coordinates);
                    const area = turf.area(polygon);
                    const areaText = this.formatArea(area);
                    this.showTempPopup(mousePos, areaText);
                } catch (error) {
                    this.removeTempPopup();
                }
            } else {
                this.removeTempPopup();
            }
        } else if (this.currentCollectionType === 'route') {
            // Show length for line
            if (previewPoints.length >= 2) {
                try {
                    const coordinates = previewPoints.map(p => [p.lng, p.lat]);
                    const line = turf.lineString(coordinates);
                    const length = turf.length(line, { units: 'meters' });
                    const lengthText = this.formatLength(length);
                    this.showTempPopup(mousePos, lengthText);
                } catch (error) {
                    this.removeTempPopup();
                }
            } else {
                this.removeTempPopup();
            }
        }
    }
    
    /**
     * Show temporary popup with measurement value
     */
    showTempPopup(lngLat, text) {
        // Position popup near cursor to avoid blocking clicks
        const screenPoint = this.map.project([lngLat.lng, lngLat.lat]);
        const offsetPoint = { x: screenPoint.x + 16, y: screenPoint.y - 16 };
        const offsetLngLat = this.map.unproject(offsetPoint);
        
        const html = `
            <div style="pointer-events:none; font-size: 13px; font-weight: 600; color: #000000;">
                ${text}
            </div>
        `;
        
        if (this.tempPopup) {
            this.tempPopup.setLngLat([offsetLngLat.lng, offsetLngLat.lat]).setHTML(html);
            // Update styles
            this._applyMinimalPopupStyles();
        } else {
            this.tempPopup = new maplibregl.Popup({
                closeOnClick: false,
                closeButton: false
            })
                .setLngLat([offsetLngLat.lng, offsetLngLat.lat])
                .setHTML(html)
                .addTo(this.map);
            
            // Apply styles after popup is added to DOM
            setTimeout(() => {
                this._applyMinimalPopupStyles();
            }, 0);
        }
    }
    
    /**
     * Apply minimal styles to popup (no background, just text)
     */
    _applyMinimalPopupStyles() {
        if (!this.tempPopup) return;
        
        const el = this.tempPopup.getElement && this.tempPopup.getElement();
        if (el) {
            el.style.pointerEvents = 'none';
            el.style.background = 'transparent';
            el.style.border = 'none';
            el.style.boxShadow = 'none';
            el.style.padding = '0';
            
            // Remove arrow/tip if exists
            const tip = el.querySelector('.maplibregl-popup-tip');
            if (tip) {
                tip.style.display = 'none';
            }
            
            // Style the content div (this is where the white background comes from)
            const content = el.querySelector('.maplibregl-popup-content');
            if (content) {
                content.style.background = 'transparent';
                content.style.border = 'none';
                content.style.boxShadow = 'none';
                content.style.padding = '0';
                content.style.margin = '0';
            }
        }
    }
    
    /**
     * Remove temporary popup
     */
    removeTempPopup() {
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }
    }
    
    /**
     * Remove mousemove handler
     */
    removeMouseMoveHandler() {
        if (this._drawingMouseMoveHandler) {
            this.map.off('mousemove', this._drawingMouseMoveHandler);
            this._drawingMouseMoveHandler = null;
        }
    }
    
    /**
     * Format area value
     */
    formatArea(areaM2) {
        if (areaM2 < 10000) {
            return `${Math.round(areaM2).toLocaleString('tr-TR')} m²`;
        } else if (areaM2 < 1000000) {
            return `${(areaM2 / 10000).toFixed(2)} ha`;
        } else {
            return `${(areaM2 / 1000000).toFixed(2)} km²`;
        }
    }
    
    /**
     * Format length value
     */
    formatLength(lengthM) {
        if (lengthM < 1000) {
            return `${Math.round(lengthM)} m`;
        } else {
            return `${(lengthM / 1000).toFixed(2)} km`;
        }
    }
    
    showGhostMarker(lngLat) {
        // Remove existing ghost marker
        if (this.ghostMarker) {
            this.ghostMarker.remove();
        }
        
        // Create draggable ghost marker (temporary point indicator)
        const el = document.createElement('div');
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.background = 'rgba(37, 99, 235, 0.5)';
        el.style.border = '2px solid #2563EB';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        el.style.cursor = 'move';
        
        this.ghostMarker = new maplibregl.Marker({ 
            element: el,
            draggable: true 
        })
            .setLngLat([lngLat.lng, lngLat.lat])
            .addTo(this.map);
        
        // Update lastClickedLatLng when dragged
        this.ghostMarker.on('drag', () => {
            const newLngLat = this.ghostMarker.getLngLat();
            this.lastClickedLatLng = { lng: newLngLat.lng, lat: newLngLat.lat };
        });
    }
    
    removeGhostMarker() {
        if (this.ghostMarker) {
            this.ghostMarker.remove();
            this.ghostMarker = null;
        }
    }
    
    isCollectingPoints() {
        return this.collectingPoints;
    }
    
    // Additional methods needed by event-handlers
    getLastClickedLatLng() {
        return this.lastClickedLatLng;
    }
    
    cancelPointCollection() {
        this.collectingPoints = false;
        this.collectedPoints = [];
        this.cleanupTempLayers();
        this.removeTempPopup();
        this.removeMouseMoveHandler();

        // Restore dblclick zoom and handler if any
        this._restoreDoubleClickZoomIfDisabled();
        this._removeDoubleClickHandler();
    }
    
    clearTempPointMarker() {
        // Clear old Leaflet-style temp marker (if exists)
        if (this.tempPointMarker) {
            this.tempPointMarker.remove();
            this.tempPointMarker = null;
        }
        
        // Clear MapLibre GL JS ghost marker (the one that stays visible)
        if (this.ghostMarker) {
            this.ghostMarker.remove();
            this.ghostMarker = null;
        }
    }
    
    cancelCircleDrawing() {
        this.drawingCircle = false;
        this.circleCenter = null;
        if (this.circleCenterMarker) {
            this.circleCenterMarker.remove();
            this.circleCenterMarker = null;
        }
        
        // Remove tooltip
        if (this.circleTooltip) {
            this.circleTooltip.remove();
            this.circleTooltip = null;
        }
        
        // Remove guide line (kesikli çizgi)
        if (this.map.getLayer('circle-guide-line')) {
            this.map.removeLayer('circle-guide-line');
        }
        if (this.map.getSource('circle-guide')) {
            this.map.removeSource('circle-guide');
        }
        
        // Remove temp circle layers
        if (this.map.getLayer('temp-circle-fill')) {
            this.map.removeLayer('temp-circle-fill');
        }
        if (this.map.getLayer('temp-circle-outline')) {
            this.map.removeLayer('temp-circle-outline');
        }
        if (this.map.getSource('temp-circle')) {
            this.map.removeSource('temp-circle');
        }
        
        // Remove mousemove handler if still active
        if (this._circleMouseMoveHandler) {
            this.map.off('mousemove', this._circleMouseMoveHandler);
            this._circleMouseMoveHandler = null;
        }
    }
    
    resetCircleDrawing() {
        this.cancelCircleDrawing();
        this.drawingCircle = false;
    }
    
    startPointCollection(type) {
        this.currentCollectionType = type;
        this.collectingPoints = true;
        this.collectedPoints = [];
        this.cleanupTempLayers();
        
        // Add mousemove handler for showing area/length during drawing
        if (type === 'area' || type === 'route') {
            // Remove existing handler if any
            this.removeMouseMoveHandler();
            // Add new handler
            this.map.on('mousemove', this.onDrawingMouseMove);
            this._drawingMouseMoveHandler = this.onDrawingMouseMove;

            // Disable default double-click zoom and bind double-click to finish drawing
            this._disableDoubleClickZoomForDrawing();
            this._bindDoubleClickHandler();
        }
    }
    
    getCollectedPoints() {
        return this.collectedPoints;
    }
    
    getCircleData() {
        // Circle data is stored in lastClickedLatLng after finalization
        if (!this.lastClickedLatLng || !this.lastClickedLatLng.radius) {
            return null;
        }
        return {
            center: this.lastClickedLatLng,
            radius: this.lastClickedLatLng.radius
        };
    }
    // ================================
    // Double-click handling utilities
    // ================================
    onDoubleClickDrawing(e) {
        // Stop default behavior where possible
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }

        if (!this.collectingPoints) return;

        const isArea = this.currentCollectionType === 'area';
        const isRoute = this.currentCollectionType === 'route';
        if (!isArea && !isRoute) return;

        const minPts = isArea ? 3 : 2;
        if (this.collectedPoints.length < minPts) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback(`⚠️ ${isArea ? 'Alan' : 'Rota'} çizimini bitirmek için en az ${minPts} nokta gerekir.`, 'warning', 2500);
            }
            return;
        }

        // Complete drawing but keep current preview/points for saving
        this._completeDrawingKeepPreview();

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`✅ ${isArea ? 'Alan' : 'Rota'} çizimi tamamlandı. 'Veri Ekle' ile kaydedin.`);
        }
    }

    _disableDoubleClickZoomForDrawing() {
        try {
            if (!this._doubleClickZoomDisabledByDrawing && this.map && this.map.doubleClickZoom && this.map.doubleClickZoom.disable) {
                this.map.doubleClickZoom.disable();
                this._doubleClickZoomDisabledByDrawing = true;
            }
        } catch (err) {
            // no-op
        }
    }

    _restoreDoubleClickZoomIfDisabled() {
        try {
            if (this._doubleClickZoomDisabledByDrawing && this.map && this.map.doubleClickZoom && this.map.doubleClickZoom.enable) {
                this.map.doubleClickZoom.enable();
                this._doubleClickZoomDisabledByDrawing = false;
            }
        } catch (err) {
            // no-op
        }
    }
    _bindDoubleClickHandler() {
        // Remove old handler first (safety)
        this._removeDoubleClickHandler();
        const handler = (e) => this.onDoubleClickDrawing(e);
        this.map.on('dblclick', handler);
        this._onDblClickDrawingHandler = handler;
    }

    _removeDoubleClickHandler() {
        if (this._onDblClickDrawingHandler) {
            try { this.map.off('dblclick', this._onDblClickDrawingHandler); } catch(_) { /* Ignore errors during cleanup */ }
            this._onDblClickDrawingHandler = null;
        }
    }

    _completeDrawingKeepPreview() {
        // Stop listening to mousemove and dblclick, but keep markers/layers and points
        this.removeMouseMoveHandler();
        this.removeTempPopup();
        this._removeDoubleClickHandler();
        this._restoreDoubleClickZoomIfDisabled();
        this.collectingPoints = false;
        this.map.getCanvas().style.cursor = '';
    }
}

// Initialize when map is ready
// Note: DataDrawing instance is created in app-bootstrap.js
// Handler registration is also done in app-bootstrap.js to maintain proper initialization order

// Browser global export
if (typeof window !== 'undefined') {
    window.DataDrawing = DataDrawing;
}
