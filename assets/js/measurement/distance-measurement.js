/**
 * Distance Measurement Tool - MapLibre GL JS
 * Gelişmiş mesafe ölçüm aracı - sürüklenebilir noktalar, dinamik önizleme
 */

class DistanceMeasurement {
    constructor(map, onStateChange) {
        this.map = map;
        this.isActive = false;
        this.isDrawing = false;
        this.points = [];
        this.markers = [];
        this.onStateChange = onStateChange;
        
        // Ghost line için geçici state
        this.ghostLine = null;
        this.mousePosition = null;
        
        // Temporary preview popup (shows total distance before finalize)
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
        if (!this.map.getSource('distance-measurements')) {
            this.map.addSource('distance-measurements', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
            
            // Layer'ı en üste eklemek için beforeId kullan
            // Tüm layer'ları al ve en üstteki layer'ı bul
            const layers = this.map.getStyle().layers;
            let topLayerId = null;
            
            // Symbol layer'lar varsa onların altına ekle (etiketler en üstte kalmalı)
            for (let i = layers.length - 1; i >= 0; i--) {
                if (layers[i].type !== 'symbol') {
                    topLayerId = layers[i].id;
                    break;
                }
            }
            
            this.map.addLayer({
                id: 'distance-lines',
                type: 'line',
                source: 'distance-measurements',
                paint: {
                    'line-color': '#111827',
                    'line-width': 2,
                    'line-opacity': 1
                }
            }, topLayerId); // En üste ekle (symbol layer'ların altına)
        }
        
        // Ghost line layer for preview
        if (!this.map.getSource('distance-ghost')) {
            this.map.addSource('distance-ghost', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
            
            // Ghost line'ı da en üste ekle
            const layers = this.map.getStyle().layers;
            let topLayerId = null;
            
            for (let i = layers.length - 1; i >= 0; i--) {
                if (layers[i].type !== 'symbol') {
                    topLayerId = layers[i].id;
                    break;
                }
            }
            
            this.map.addLayer({
                id: 'distance-ghost-line',
                type: 'line',
                source: 'distance-ghost',
                paint: {
                    'line-color': '#111827',
                    'line-width': 2,
                    'line-dasharray': [4, 4],
                    'line-opacity': 0.8
                }
            }, topLayerId); // En üste ekle
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
            showEducationalFeedback('📏 Mesafe ölçümü başladı. Haritaya tıklayarak noktalar ekleyin. Çift tıklayın veya ESC ile bitirin.');
		}
		}
		
    resetState() {
		this.points = [];
        this.markers.forEach(m => m.remove());
		this.markers = [];
        this.mousePosition = null;
		
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
        const source = this.map.getSource('distance-measurements');
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: []
            });
        }
        
        const ghostSource = this.map.getSource('distance-ghost');
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
                        this.updateLines();
                        
                        // Update total distance display during drag
                        this.updateDistanceDisplay();
                        
                        // If this is the last point and popup exists, move it too
                        if (idx === this.points.length - 1 && this.resultPopup) {
                            this.resultPopup.setLngLat([this.points[idx].lng, this.points[idx].lat]);
                        }
                        
                        marker._pendingUpdate = false;
                    });
                }
            }
        });
        
        marker.on('dragend', () =>{
            // Final update on drag end
            const newLngLat = marker.getLngLat();
            const idx = marker._pointIndex;
            if (idx >= 0 && idx < this.points.length) {
                this.points[idx] = { lng: newLngLat.lng, lat: newLngLat.lat };
                
                // Cancel any pending updates
                marker._pendingUpdate = false;
                
                // Final update
                this.updateLines();
        
                // If this is the last point and popup exists, make sure it's in final position
                if (idx === this.points.length - 1 && this.resultPopup) {
                    this.resultPopup.setLngLat([newLngLat.lng, newLngLat.lat]);
                }
                
                // Update total distance display
                this.updateDistanceDisplay();
            }
            
            // Reset drag flag after a short delay to prevent click event
            setTimeout(() => {
                marker._isDragging = false;
            }, 50);
        });
        
        this.markers.push(marker);
        
        // Update lines
        this.updateLines();
        
        // Update temporary distance popup (from 2nd point on) with current click position
        this.updateTempDistanceDisplay(lngLat);

        if (typeof showEducationalFeedback === 'function') {
            const totalDistance = this.calculateTotalDistance();
            const distanceText = totalDistance < 1 
                ? `${Math.round(totalDistance * 1000)} m`
                : `${totalDistance.toFixed(1)} km`;
            showEducationalFeedback(`📏 Nokta ${this.points.length} eklendi. Toplam mesafe: ${distanceText}. Çift tıklayın veya ESC ile bitirin.`);
        }
    }
    
    onMouseMove(e) {
        // Only show ghost line when actively drawing (not after finalization)
        if (!this.isActive || !this.isDrawing || this.points.length === 0) {
            // Clear ghost line if not drawing
            const ghostSource = this.map.getSource('distance-ghost');
            if (ghostSource && this.mousePosition) {
                ghostSource.setData({
                    type: 'FeatureCollection',
                    features: []
                });
                this.mousePosition = null;
            }
            return;
        }
        
        this.mousePosition = { lng: e.lngLat.lng, lat: e.lngLat.lat };
        this.updateGhostLine();
        // While drawing, show temporary total distance using ghost segment
        this.updateTempDistanceDisplay(this.mousePosition);
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
            if (this.points.length > 0) {
                this.finalizeMeasurement();
            } else {
                this.deactivate();
    }
        }
    }
    
    updateLines() {
        // Get source first
        const source = this.map.getSource('distance-measurements');
        if (!source) {
            Logger.warn('Distance measurement source not found');
            return;
        }
        
        if (this.points.length < 2) {
            // Clear lines if less than 2 points
            source.setData({
                type: 'FeatureCollection',
                features: []
            });
            return;
    }
    
        // Filter out any null/undefined points
        const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        
        if (validPoints.length < 2) {
            source.setData({
                type: 'FeatureCollection',
                features: []
            });
            return;
        }
        
        const coordinates = validPoints.map(p => [p.lng, p.lat]);
        
        const lineFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            },
            properties: {}
        };
        
        try {
            source.setData({
                type: 'FeatureCollection',
                features: [lineFeature]
            });
            
            // Layer'ı en üste taşı (her güncelleme sonrası)
            this.bringLayersToTop();
        } catch (error) {
            Logger.error('Error updating distance lines:', error);
        }
    }
    
    /**
     * Mesafe ölçüm layer'larını en üste taşı
     */
    bringLayersToTop() {
        try {
            const layers = this.map.getStyle().layers;
            
            // Symbol layer'ların altına taşı (etiketler en üstte kalmalı)
            let topLayerId = null;
            for (let i = layers.length - 1; i >= 0; i--) {
                if (layers[i].type !== 'symbol') {
                    topLayerId = layers[i].id;
                    break;
                }
            }
            
            // Distance layer'larını kontrol et ve gerekirse yeniden sırala
            const distanceLayer = this.map.getLayer('distance-lines');
            const ghostLayer = this.map.getLayer('distance-ghost-line');
            
            if (distanceLayer && topLayerId && distanceLayer.id !== topLayerId) {
                // Layer'ı kaldır ve en üste ekle
                const layerDef = {
                    id: 'distance-lines',
                    type: 'line',
                    source: 'distance-measurements',
                    paint: {
                        'line-color': '#111827',
                        'line-width': 2,
                        'line-opacity': 1
                    }
                };
                
                this.map.removeLayer('distance-lines');
                this.map.addLayer(layerDef, topLayerId);
            }
            
            if (ghostLayer && topLayerId && ghostLayer.id !== topLayerId) {
                const ghostLayerDef = {
                    id: 'distance-ghost-line',
                    type: 'line',
                    source: 'distance-ghost',
                    paint: {
                        'line-color': '#111827',
                        'line-width': 2,
                        'line-dasharray': [4, 4],
                        'line-opacity': 0.8
                    }
                };
                
                this.map.removeLayer('distance-ghost-line');
                this.map.addLayer(ghostLayerDef, topLayerId);
            }
        } catch (error) {
            Logger.warn('Error bringing layers to top:', error);
        }
    }
    
    updateGhostLine() {
        if (!this.mousePosition || this.points.length === 0) {
            // Clear ghost line
            const ghostSource = this.map.getSource('distance-ghost');
            if (ghostSource) {
                ghostSource.setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }
            return;
        }
        
        const lastPoint = this.points[this.points.length - 1];
        if (!lastPoint || lastPoint.lng == null || lastPoint.lat == null) return;
        
        const ghostFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [lastPoint.lng, lastPoint.lat],
                    [this.mousePosition.lng, this.mousePosition.lat]
                ]
            }
        };
        
        const ghostSource = this.map.getSource('distance-ghost');
        if (ghostSource) {
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
    
    calculateTotalDistance() {
        if (this.points.length < 2) return 0;
        
        // Filter out null/undefined points
        const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        if (validPoints.length < 2) return 0;
        
        let totalDistance = 0;
        for (let i = 0; i < validPoints.length - 1; i++) {
            try {
                const from = turf.point([validPoints[i].lng, validPoints[i].lat]);
                const to = turf.point([validPoints[i + 1].lng, validPoints[i + 1].lat]);
                totalDistance += turf.distance(from, to, { units: 'kilometers' });
            } catch (error) {
                Logger.error('Error calculating distance segment:', error);
        }
    }
    
        return totalDistance;
    }
    
    finalizeMeasurement() {
        if (this.points.length < 2) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('⚠️ Mesafe ölçümü için en az 2 nokta gerekli.', 'warning', 3000);
            }
            return;
        }
        
        const totalDistance = this.calculateTotalDistance();
        const distanceText = totalDistance < 1 
            ? `${Math.round(totalDistance * 1000)} m`
            : `${totalDistance.toFixed(1)} km`;
        
        // Remove temporary popup when finalizing
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }
        
        // Show result popup at last point with a unique ID for updates
        const lastPoint = this.points[this.points.length - 1];
        this.resultPopup = new maplibregl.Popup({
            closeOnClick: false,
            closeButton: true
        })
            .setLngLat([lastPoint.lng, lastPoint.lat])
            .setHTML(`
                <div id="distance-result-popup">
                    <strong id="distance-value">${distanceText}</strong>
                </div>
            `)
            .addTo(this.map)
            .addClassName('meas-popup');
        
        // Add to measurements array
        window.measurements.push({
            type: 'distance',
            points: this.points.map(p => ({ lat: p.lat, lon: p.lng })),
            distance: totalDistance,
            distanceText: distanceText,
            segments: this.points.length - 1
        });
        
        // Clear ghost line
        const ghostSource = this.map.getSource('distance-ghost');
        if (ghostSource) {
            ghostSource.setData({
                type: 'FeatureCollection',
                features: []
            });
        }
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`✅ Mesafe ölçümü tamamlandı: ${distanceText} (${this.points.length - 1} segment). Noktaları sürükleyebilirsiniz!`);
        }
        
        // Stop drawing but keep points and markers for editing
        this.isDrawing = false;
        this.mousePosition = null;
        
        // Note: DON'T clear this.points or this.markers - they're needed for dragging!
    }
    
    updateDistanceDisplay() {
        // Update the popup if it exists
        const distanceValueEl = document.getElementById('distance-value');
        
        if (distanceValueEl) {
            const totalDistance = this.calculateTotalDistance();
            const distanceText = totalDistance < 1 
                ? `${Math.round(totalDistance * 1000)} m`
                : `${totalDistance.toFixed(1)} km`;
            
            distanceValueEl.textContent = distanceText;
        }
    }
    
    /**
     * Update or create temporary distance popup while drawing
     * If mousePos is provided, calculates total with ghost segment
     */
    updateTempDistanceDisplay(mousePos) {
        if (!this.isActive || !this.isDrawing) return;
        
        const basePoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        const previewPoints = mousePos ? [...basePoints, mousePos] : basePoints;
        
        if (previewPoints.length < 2) {
            if (this.tempPopup) {
                this.tempPopup.remove();
                this.tempPopup = null;
            }
            return;
        }
        
        // Calculate total distance (km)
        let totalKm = 0;
        for (let i = 0; i < previewPoints.length - 1; i++) {
            try {
                const from = turf.point([previewPoints[i].lng, previewPoints[i].lat]);
                const to = turf.point([previewPoints[i + 1].lng, previewPoints[i + 1].lat]);
                totalKm += turf.distance(from, to, { units: 'kilometers' });
            } catch(_) { /* Ignore invalid coordinates */ }
        }
        const distanceText = totalKm < 1 
            ? `${Math.round(totalKm * 1000)} m`
            : `${totalKm.toFixed(1)} km`;
        
        // Position near cursor to avoid blocking clicks
        let popupLngLat;
        if (mousePos && mousePos.lng != null && mousePos.lat != null) {
            const screenPoint = this.map.project([mousePos.lng, mousePos.lat]);
            const offsetPoint = { x: screenPoint.x + 16, y: screenPoint.y - 16 };
            const offsetLngLat = this.map.unproject(offsetPoint);
            popupLngLat = [offsetLngLat.lng, offsetLngLat.lat];
        } else if (previewPoints.length) {
            const last = previewPoints[previewPoints.length - 1];
            popupLngLat = [last.lng, last.lat];
        } else {
            return;
        }
        
        const html = `
            <div id="distance-temp-popup" style="pointer-events:none"><strong>${distanceText}</strong></div>
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
    }
    
    bindEvents() {
        // Events are handled in activate/deactivate
    }
}

// Initialize when map is ready
// Note: Registration with MapClickOrchestrator is handled in app-bootstrap.js

// Promise-based initialization
if (typeof window !== 'undefined') {
    let resolveDistanceTool;
    window.distanceMeasurementReady = new Promise((resolve) => {
        resolveDistanceTool = resolve;
    });

    const initDistanceTool = () => {
        console.log('🔍 [Distance] initDistanceTool çağrıldı');

        if (!window.map || typeof window.map.on !== 'function') {
            console.log('⏳ [Distance] Map henüz hazır değil, 100ms sonra tekrar deneceğim');
            setTimeout(initDistanceTool, 100);
            return;
        }

        console.log('🔍 [Distance] Map bulundu, yüklenmesini bekliyorum...');

        // Harita yüklenene kadar polling yap (load eventi güvenilir değil)
        const checkMapLoaded = () => {
            if (window.map && window.map.loaded && window.map.loaded()) {
                console.log('✅ [Distance] Harita yüklendi! Aracı başlatıyorum');
                window.distanceMeasurementTool = new DistanceMeasurement(window.map);
                resolveDistanceTool(window.distanceMeasurementTool);
                console.log('✅ Mesafe ölçüm aracı hazır');
            } else {
                console.log('⏳ [Distance] Harita henüz yüklenmedi, 100ms sonra tekrar kontrol edeceğim');
                setTimeout(checkMapLoaded, 100);
            }
        };

        checkMapLoaded();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDistanceTool);
    } else {
        initDistanceTool();
    }
}
