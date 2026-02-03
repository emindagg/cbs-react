/**
 * Area Measurement Tool - MapLibre GL JS
 * Gelişmiş alan ölçüm aracı - sürüklenebilir noktalar, dinamik önizleme
 */

class AreaMeasurement {
    constructor(map, onStateChange) {
        this.map = map;
        this.isActive = false;
        this.isDrawing = false;
        this.points = [];
        this.markers = [];
        this.onStateChange = onStateChange;
        
        // Result popup
        this.resultPopup = null;
        // Temporary preview popup (shows area before finalize)
        this.tempPopup = null;
        
        // Bind methods
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }
    
    activate() {
        if (this.isActive) {
            // If already active, deactivate instead (toggle behavior)
            this.deactivate();
            return;
        }
        
        this.resetState();
        this.isActive = true;
        this.isDrawing = true;
        this.map.getCanvas().style.cursor = 'crosshair';
        
        // Initialize measurement sources if needed
        if (!this.map.getSource('area-measurements')) {
            this.map.addSource('area-measurements', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
            
            // Layer'ları en üste eklemek için beforeId kullan
            const layers = this.map.getStyle().layers;
            let topLayerId = null;
            
            // Symbol layer'lar varsa onların altına ekle
            for (let i = layers.length - 1; i >= 0; i--) {
                if (layers[i].type !== 'symbol') {
                    topLayerId = layers[i].id;
                    break;
                }
            }
            
            this.map.addLayer({
                id: 'area-polygons',
                type: 'fill',
                source: 'area-measurements',
                paint: {
                    'fill-color': '#9ca3af',
                    'fill-opacity': 0.4
                }
            }, topLayerId);
            
            this.map.addLayer({
                id: 'area-outlines',
                type: 'line',
                source: 'area-measurements',
                paint: {
                    'line-color': '#111827',
                    'line-width': 2,
                    'line-opacity': 1
                }
            }, topLayerId);
        }
        
        // Ghost polygon layer for preview
        if (!this.map.getSource('area-ghost')) {
            this.map.addSource('area-ghost', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
            
            const layers = this.map.getStyle().layers;
            let topLayerId = null;
            
            for (let i = layers.length - 1; i >= 0; i--) {
                if (layers[i].type !== 'symbol') {
                    topLayerId = layers[i].id;
                    break;
                }
            }
            
            this.map.addLayer({
                id: 'area-ghost-fill',
                type: 'fill',
                source: 'area-ghost',
                paint: {
                    'fill-color': '#9ca3af',
                    'fill-opacity': 0.2
                }
            }, topLayerId);
            
            this.map.addLayer({
                id: 'area-ghost-line',
                type: 'line',
                source: 'area-ghost',
                paint: {
                    'line-color': '#111827',
                    'line-width': 2,
                    'line-dasharray': [4, 4],
                    'line-opacity': 0.8
                }
            }, topLayerId);
        }
        
        // Add event listeners
        this.map.on('mousemove', this.onMouseMove);
        this.map.on('dblclick', this.onDoubleClick);
        document.addEventListener('keydown', this.onKeyDown);
        
        // Layer'ları en üste taşı (aktivasyon sonrası)
        setTimeout(() => {
            this.bringLayersToTop();
        }, 100);
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('🔷 Alan ölçümü başladı. Çokgen çizmek için haritaya tıklayın. Çift tıklayın veya ESC ile bitirin.');
        }
    }
    
    resetState() {
        this.points = [];
        this.markers.forEach(m => m.remove());
        this.markers = [];
        
        // Remove popup if exists
        if (this.resultPopup) {
            this.resultPopup.remove();
            this.resultPopup = null;
        }
        // Remove temporary popup if exists
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }
        
        // Clear measurement sources
        const source = this.map.getSource('area-measurements');
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: []
            });
        }
        
        const ghostSource = this.map.getSource('area-ghost');
        if (ghostSource) {
            ghostSource.setData({
                type: 'FeatureCollection',
                features: []
            });
        }
    }
    
    deactivate() {
        this.isActive = false;
        this.isDrawing = false;
        this.map.getCanvas().style.cursor = '';
        
        // Remove event listeners
        this.map.off('mousemove', this.onMouseMove);
        this.map.off('dblclick', this.onDoubleClick);
        document.removeEventListener('keydown', this.onKeyDown);
        
        // Remove temporary popup on deactivate
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }
    }
    
    canHandleClick() {
        // Only handle clicks when actively drawing (not after finalization)
        return this.isActive && this.isDrawing;
    }
    
    handleMapClick(e) {
        // Only handle clicks when actively drawing
        if (!this.isActive || !this.isDrawing) {
            return;
        }
        
        const lngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };
        this.points.push(lngLat);
        
        // Add draggable marker
        const el = document.createElement('div');
        el.style.width = '12px';
        el.style.height = '12px';
        el.style.borderRadius = '50%';
        el.style.background = '#ffffff';
        el.style.border = '3px solid #111827';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'move';
        el.style.zIndex = '1000';
        el.style.transition = 'none';
        el.style.willChange = 'auto';
        
        // Prevent click events from bubbling to map (but allow drag)
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
        });
        
        const marker = new maplibregl.Marker({
            element: el,
            draggable: true
        })
            .setLngLat([lngLat.lng, lngLat.lat])
            .addTo(this.map);
        
        // Store marker with its point index
        const pointIndex = this.points.length - 1;
        marker._pointIndex = pointIndex;
        marker._isDragging = false;
        marker._pendingUpdate = false;
        
        // MapLibre marker drag events
        marker.on('dragstart', () => {
            marker._isDragging = true;
        });
        
        marker.on('drag', () => {
            const newLngLat = marker.getLngLat();
            const idx = marker._pointIndex;
            if (idx >= 0 && idx < this.points.length) {
                this.points[idx] = { lng: newLngLat.lng, lat: newLngLat.lat };
                
                // Throttle updates - only update if no pending update
                if (!marker._pendingUpdate) {
                    marker._pendingUpdate = true;
                    requestAnimationFrame(() => {
                        this.updatePolygon();
                        // Update area display during drag if popup exists
                        if (this.resultPopup && this.points.length >= 3) {
                            this.updateAreaDisplay();
                        }
                        marker._pendingUpdate = false;
                    });
                }
            }
        });
        
        marker.on('dragend', () => {
            // Final update on drag end
            const newLngLat = marker.getLngLat();
            const idx = marker._pointIndex;
            if (idx >= 0 && idx < this.points.length) {
                this.points[idx] = { lng: newLngLat.lng, lat: newLngLat.lat };
                
                // Cancel any pending updates
                marker._pendingUpdate = false;
                
                // Final update
                this.updatePolygon();
                
                // Update total area display
                this.updateAreaDisplay();
            }
            
            // Reset drag flag after a short delay to prevent click event
            setTimeout(() => {
                marker._isDragging = false;
            }, 50);
        });
        
        this.markers.push(marker);
        
        // Update polygon preview
        this.updatePolygon();
        
        // Update temporary area popup (from 3rd point on)
        this.updateTempAreaDisplay(lngLat);

        // Show current area if we have at least 3 points
        if (typeof showEducationalFeedback === 'function') {
            if (this.points.length >= 3) {
                const area = this.calculateArea();
                const areaText = this.formatArea(area);
                showEducationalFeedback(`🔷 Nokta ${this.points.length} eklendi. Güncel alan: ${areaText}. Çift tıklayın veya ESC ile bitirin.`);
            } else if (this.points.length === 2) {
                // Show distance between two points
                const from = turf.point([this.points[0].lng, this.points[0].lat]);
                const to = turf.point([this.points[1].lng, this.points[1].lat]);
                const distance = turf.distance(from, to, { units: 'kilometers' });
                const distanceText = distance < 1 
                    ? `${Math.round(distance * 1000)} m`
                    : `${distance.toFixed(1)} km`;
                showEducationalFeedback(`🔷 Nokta ${this.points.length} eklendi. Mesafe: ${distanceText}. Bir nokta daha ekleyin.`);
            } else {
                showEducationalFeedback(`🔷 Nokta ${this.points.length} eklendi. En az 3 nokta gerekli.`);
            }
        }
    }
    
    onMouseMove(e) {
        // Only show ghost polygon when actively drawing (not after finalization)
        if (!this.isActive || !this.isDrawing || this.points.length === 0) {
            // Clear ghost polygon if not drawing
            const ghostSource = this.map.getSource('area-ghost');
            if (ghostSource) {
                ghostSource.setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }
            return;
        }
        
        // Show ghost polygon with mouse position
        const mousePos = { lng: e.lngLat.lng, lat: e.lngLat.lat };
        this.updateGhostPolygon(mousePos);
        // While drawing, show temporary area using ghost polygon (requires >=2 fixed points + mouse)
        this.updateTempAreaDisplay(mousePos);
    }
    
    onDoubleClick(e) {
        if (!this.isActive || !this.isDrawing) return;
        
        e.preventDefault();
        this.finalizeMeasurement();
    }
    
    onKeyDown(e) {
        if (!this.isActive || !this.isDrawing) return;
        
        if (e.key === 'Escape') {
            e.preventDefault();
            if (this.points.length >= 3) {
                this.finalizeMeasurement();
        } else {
                this.deactivate();
            }
        }
    }
    
    updatePolygon() {
        const source = this.map.getSource('area-measurements');
        if (!source) {
            Logger.warn('Area measurement source not found');
            return;
        }
        
        if (this.points.length < 3) {
            // Show as line if less than 3 points
            if (this.points.length === 2) {
                const lineFeature = {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: this.points.map(p => [p.lng, p.lat])
                    },
                    properties: {}
                };
                
                try {
                    source.setData({
                        type: 'FeatureCollection',
                        features: [lineFeature]
                    });
                } catch (error) {
                    Logger.error('Error updating area lines:', error);
                }
            } else {
                source.setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }
            return;
        }
        
        // Filter out any null/undefined points
        const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        
        if (validPoints.length < 3) {
            source.setData({
                type: 'FeatureCollection',
                features: []
            });
            return;
        }
        
        const coordinates = [validPoints.map(p => [p.lng, p.lat])];
        // Close the polygon
        coordinates[0].push(coordinates[0][0]);
        
        const polygonFeature = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: coordinates
            },
            properties: {}
        };
        
        try {
            source.setData({
                type: 'FeatureCollection',
                features: [polygonFeature]
            });
            
            // Layer'ı en üste taşı (her güncelleme sonrası)
            this.bringLayersToTop();
        } catch (error) {
            Logger.error('Error updating area polygon:', error);
        }
    }
    
    /**
     * Alan ölçüm layer'larını en üste taşı
     */
    bringLayersToTop() {
        try {
            const layers = this.map.getStyle().layers;
            
            // Symbol layer'ların altına taşı
            let topLayerId = null;
            for (let i = layers.length - 1; i >= 0; i--) {
                if (layers[i].type !== 'symbol') {
                    topLayerId = layers[i].id;
                    break;
                }
            }
            
            // Area layer'larını kontrol et ve gerekirse yeniden sırala
            const polygonLayer = this.map.getLayer('area-polygons');
            const outlineLayer = this.map.getLayer('area-outlines');
            const ghostFillLayer = this.map.getLayer('area-ghost-fill');
            const ghostLineLayer = this.map.getLayer('area-ghost-line');
            
            if (polygonLayer && topLayerId && polygonLayer.id !== topLayerId) {
                const layerDef = {
                    id: 'area-polygons',
                    type: 'fill',
                    source: 'area-measurements',
                    paint: {
                        'fill-color': '#9ca3af',
                        'fill-opacity': 0.4
                    }
                };
                
                this.map.removeLayer('area-polygons');
                this.map.addLayer(layerDef, topLayerId);
            }
            
            if (outlineLayer && topLayerId && outlineLayer.id !== topLayerId) {
                const layerDef = {
                    id: 'area-outlines',
                    type: 'line',
                    source: 'area-measurements',
                    paint: {
                        'line-color': '#111827',
                        'line-width': 2,
                        'line-opacity': 1
                    }
                };
                
                this.map.removeLayer('area-outlines');
                this.map.addLayer(layerDef, topLayerId);
            }
            
            if (ghostFillLayer && topLayerId && ghostFillLayer.id !== topLayerId) {
                const layerDef = {
                    id: 'area-ghost-fill',
                    type: 'fill',
                    source: 'area-ghost',
                    paint: {
                        'fill-color': '#9ca3af',
                        'fill-opacity': 0.2
                    }
                };
                
                this.map.removeLayer('area-ghost-fill');
                this.map.addLayer(layerDef, topLayerId);
            }
            
            if (ghostLineLayer && topLayerId && ghostLineLayer.id !== topLayerId) {
                const layerDef = {
                    id: 'area-ghost-line',
                    type: 'line',
                    source: 'area-ghost',
                    paint: {
                        'line-color': '#111827',
                        'line-width': 2,
                        'line-dasharray': [4, 4],
                        'line-opacity': 0.8
                    }
                };
                
                this.map.removeLayer('area-ghost-line');
                this.map.addLayer(layerDef, topLayerId);
            }
        } catch (error) {
            Logger.warn('Error bringing layers to top:', error);
        }
    }
    
    updateGhostPolygon(mousePos) {
        const ghostSource = this.map.getSource('area-ghost');
        if (!ghostSource) return;
        
        if (this.points.length < 2) {
            ghostSource.setData({
                type: 'FeatureCollection',
                features: []
            });
            return;
        }
        
        const ghostPoints = [...this.points, mousePos];
        
        if (ghostPoints.length >= 3) {
            // Show as polygon
            const coordinates = [ghostPoints.map(p => [p.lng, p.lat])];
            coordinates[0].push(coordinates[0][0]);
            
            const ghostFeature = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: coordinates
                },
                properties: {}
            };
            
            try {
                ghostSource.setData({
                    type: 'FeatureCollection',
                    features: [ghostFeature]
                });
            } catch (error) {
                Logger.error('Error updating ghost polygon:', error);
            }
        } else {
            // Show as line
            const ghostFeature = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: ghostPoints.map(p => [p.lng, p.lat])
                },
                properties: {}
            };
            
            try {
                ghostSource.setData({
                    type: 'FeatureCollection',
                    features: [ghostFeature]
                });
            } catch (error) {
                Logger.error('Error updating ghost line:', error);
            }
        }
    }
    
    calculateArea() {
        if (this.points.length < 3) return 0;
        
        // Filter out null/undefined points
        const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        if (validPoints.length < 3) return 0;
        
        const coordinates = [validPoints.map(p => [p.lng, p.lat])];
        coordinates[0].push(coordinates[0][0]); // Close polygon
        
        try {
            const polygon = turf.polygon(coordinates);
            const area = turf.area(polygon);
            return area;
        } catch (error) {
            Logger.error('Error calculating area:', error);
            return 0;
        }
    }
    
    formatArea(area) {
        if (area < 10000) {
            // m² için tam sayı
            return `${Math.round(area).toLocaleString('tr-TR')} m²`;
        } else if (area < 1000000) {
            // Hektar için 1 ondalık
            const ha = area / 10000;
            return `${ha.toFixed(1)} ha`;
        } else {
            // km² için 1 ondalık
            const km2 = area / 1000000;
            return `${km2.toFixed(1)} km²`;
        }
    }
    
    finalizeMeasurement() {
        if (this.points.length < 3) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('⚠️ Alan ölçümü için en az 3 nokta gerekli.', 'warning', 3000);
            }
            return;
        }
        
        const area = this.calculateArea();
        const areaText = this.formatArea(area);
        
        // Remove temporary popup when finalizing
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }

        // Calculate centroid for popup position
        const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        const coordinates = [validPoints.map(p => [p.lng, p.lat])];
        coordinates[0].push(coordinates[0][0]);
        
        try {
            const polygon = turf.polygon(coordinates);
            const centroid = turf.centroid(polygon);
            
            // Show result popup at centroid
            this.resultPopup = new maplibregl.Popup({
                closeOnClick: false,
                closeButton: true
            })
                .setLngLat(centroid.geometry.coordinates)
                .setHTML(`
                    <div id="area-result-popup">
                        <strong id="area-value">${areaText}</strong>
                    </div>
                `)
                .addTo(this.map)
                .addClassName('meas-popup');
        } catch (error) {
            Logger.error('Error creating popup:', error);
        }
        
        // Add to measurements array
        window.measurements.push({
            type: 'area',
            points: this.points.map(p => ({ lat: p.lat, lon: p.lng })),
            area: area,
            areaText: areaText
        });
        
        // Clear ghost polygon
        const ghostSource = this.map.getSource('area-ghost');
        if (ghostSource) {
            ghostSource.setData({
                type: 'FeatureCollection',
                features: []
            });
        }
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`✅ Alan ölçümü tamamlandı: ${areaText}. Noktaları sürükleyebilirsiniz!`);
        }
        
        // Stop drawing but keep points and markers for editing
        this.isDrawing = false;
        
        // Note: DON'T clear this.points or this.markers - they're needed for dragging!
    }
    
    updateAreaDisplay() {
        // Update the popup if it exists
        const areaValueEl = document.getElementById('area-value');
        
        if (areaValueEl) {
            const area = this.calculateArea();
            const areaText = this.formatArea(area);
            areaValueEl.textContent = areaText;
        }
    }
    
    /**
     * Update or create temporary area popup while drawing
     * If mousePos is provided, calculates area with ghost point
     */
    updateTempAreaDisplay(mousePos) {
        if (!this.isActive || !this.isDrawing) return;
        
        // Determine points to use: current points + optional mouse position
        const basePoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        const previewPoints = mousePos ? [...basePoints, mousePos] : basePoints;
        
        if (previewPoints.length < 3) {
            // Not enough points to show area; remove temp popup if any
            if (this.tempPopup) {
                this.tempPopup.remove();
                this.tempPopup = null;
            }
            return;
        }
        
        try {
            const coordinates = [previewPoints.map(p => [p.lng, p.lat])];
            coordinates[0].push(coordinates[0][0]);
            const polygon = turf.polygon(coordinates);
            const centroid = turf.centroid(polygon);
            const area = turf.area(polygon);
            const areaText = this.formatArea(area);
            
            // Prefer positioning near cursor to avoid blocking clicks
            let popupLngLat = centroid.geometry.coordinates;
            if (mousePos && mousePos.lng != null && mousePos.lat != null) {
                const screenPoint = this.map.project([mousePos.lng, mousePos.lat]);
                const offsetPoint = { x: screenPoint.x + 16, y: screenPoint.y - 16 };
                const offsetLngLat = this.map.unproject(offsetPoint);
                popupLngLat = [offsetLngLat.lng, offsetLngLat.lat];
            }
            
            const html = `
                <div id="area-temp-popup" style="pointer-events:none"><strong>${areaText}</strong></div>
            `;
            
            if (this.tempPopup) {
                this.tempPopup.setLngLat(popupLngLat).setHTML(html);
                const el = this.tempPopup.getElement && this.tempPopup.getElement();
                if (el) { el.style.pointerEvents = 'none'; }
            } else {
                this.tempPopup = new maplibregl.Popup({
                    closeOnClick: false,
                    closeButton: false
                })
                    .setLngLat(popupLngLat)
                    .setHTML(html)
                    .addTo(this.map)
                    .addClassName('meas-popup');
                const el = this.tempPopup.getElement && this.tempPopup.getElement();
                if (el) { el.style.pointerEvents = 'none'; }
            }
        } catch (error) {
            // On any error, fail soft and hide temp popup
            if (this.tempPopup) {
                this.tempPopup.remove();
                this.tempPopup = null;
            }
        }
    }
    
    bindEvents() {
        // Events are handled in activate/deactivate
    }
}

// Initialize when map is ready
// Note: Registration with MapClickOrchestrator is handled in app-bootstrap.js

// Promise-based initialization
if (typeof window !== 'undefined') {
    let resolveAreaTool;
    window.areaMeasurementReady = new Promise((resolve) => {
        resolveAreaTool = resolve;
    });

    const initAreaTool = () => {
        console.log('🔍 [Area] initAreaTool çağrıldı');

        if (!window.map || typeof window.map.on !== 'function') {
            console.log('⏳ [Area] Map henüz hazır değil, 100ms sonra tekrar deneceğim');
            setTimeout(initAreaTool, 100);
            return;
        }

        console.log('🔍 [Area] Map bulundu, yüklenmesini bekliyorum...');

        // Harita yüklenene kadar polling yap (load eventi güvenilir değil)
        const checkMapLoaded = () => {
            if (window.map && window.map.loaded && window.map.loaded()) {
                console.log('✅ [Area] Harita yüklendi! Aracı başlatıyorum');
                window.areaMeasurementTool = new AreaMeasurement(window.map);
                resolveAreaTool(window.areaMeasurementTool);
                console.log('✅ Alan ölçüm aracı hazır');
            } else {
                console.log('⏳ [Area] Harita henüz yüklenmedi, 100ms sonra tekrar kontrol edeceğim');
                setTimeout(checkMapLoaded, 100);
            }
        };

        checkMapLoaded();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAreaTool);
    } else {
        initAreaTool();
    }
}
