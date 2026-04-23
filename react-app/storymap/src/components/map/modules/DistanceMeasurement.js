/**
 * DistanceMeasurement - Mesafe Ölçüm Aracı
 * 
 * Özellikler:
 * - Çoklu nokta mesafe ölçümü (polyline)
 * - Sürüklenebilir noktalar (draggable markers)
 * - Canlı önizleme (ghost line)
 * - Dinamik mesafe hesaplama
 * - Otomatik birim dönüşümü (m/km)
 * - Çift tıklama ile sonlandırma
 * - ESC tuşu ile iptal
 * - Popup ile sonuç gösterimi
 */

export class DistanceMeasurement {
    constructor(map, onStateChange = null) {
        this.map = map;
        this.onStateChange = onStateChange;
        
        // State
        this.isActive = false;
        this.isDrawing = false;
        this.points = [];
        this.markers = [];
        this.resultPopup = null;
        this.tempPopup = null;
        this.currentMousePos = null;
        this.finalizedMeasurements = []; // Tamamlanmış ölçümler
        
        // Layer IDs
        this.lineSourceId = 'distance-measurements';
        this.lineLayerId = 'distance-lines';
        this.ghostSourceId = 'distance-ghost';
        this.ghostLayerId = 'distance-ghost-line';
        
        // Click debounce - çift tıklamada ekstra nokta eklenmesini önler
        this.clickTimeout = null;
        this.pendingClick = null;
        
        // Marker drag flag - sürükleme sırasında click'i engeller
        this.isDragging = false;
        
        // Bind methods
        this.handleMapClick = this.handleMapClick.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        
        // Initialize sources and layers
        this.initializeLayers();
    }
    
    /**
     * Layer ve source'ları oluştur
     */
    initializeLayers() {
        // Ana çizgi source
        if (!this.map.getSource(this.lineSourceId)) {
            this.map.addSource(this.lineSourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        
        // Ana çizgi layer
        if (!this.map.getLayer(this.lineLayerId)) {
            this.map.addLayer({
                id: this.lineLayerId,
                type: 'line',
                source: this.lineSourceId,
                paint: {
                    'line-color': '#111827',
                    'line-width': 3,
                    'line-opacity': 1
                }
            });
        }
        
        // Ghost önizleme source
        if (!this.map.getSource(this.ghostSourceId)) {
            this.map.addSource(this.ghostSourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        
        // Ghost önizleme layer
        if (!this.map.getLayer(this.ghostLayerId)) {
            this.map.addLayer({
                id: this.ghostLayerId,
                type: 'line',
                source: this.ghostSourceId,
                paint: {
                    'line-color': '#111827',
                    'line-width': 2,
                    'line-dasharray': [4, 4],
                    'line-opacity': 0.6
                }
            });
        }
    }
    
    /**
     * Aracı aktifleştir
     */
    activate() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.isDrawing = true;
        
        // Cursor değiştir
        this.map.getCanvas().style.cursor = 'crosshair';
        
        // Event listener'ları ekle
        this.map.on('click', this.handleMapClick);
        this.map.on('mousemove', this.onMouseMove);
        this.map.on('dblclick', this.onDoubleClick);
        document.addEventListener('keydown', this.onKeyDown);
        
        // Double click zoom'u devre dışı bırak
        this.map.doubleClickZoom.disable();
        
        
        if (this.onStateChange) {
            this.onStateChange({ isActive: true, isDrawing: true });
        }
    }
    
    /**
     * Aracı deaktive et
     */
    deactivate() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.isDrawing = false;
        
        // Cursor'u normale döndür
        this.map.getCanvas().style.cursor = '';
        
        // Event listener'ları kaldır
        this.map.off('click', this.handleMapClick);
        this.map.off('mousemove', this.onMouseMove);
        this.map.off('dblclick', this.onDoubleClick);
        document.removeEventListener('keydown', this.onKeyDown);
        
        // Double click zoom'u aktifleştir
        this.map.doubleClickZoom.enable();
        
        // Ghost layer'ı temizle
        this.clearGhostLine();
        
        // Temp popup'ı kaldır
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }
        
        
        if (this.onStateChange) {
            this.onStateChange({ isActive: false, isDrawing: false });
        }
    }
    
    /**
     * State'i sıfırla
     */
    resetState() {
        // Marker'ları kaldır
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
        
        // Noktaları temizle
        this.points = [];
        
        // Çizgileri temizle
        this.updateLines();
        this.clearGhostLine();
        
        // Popup'ları kaldır
        if (this.resultPopup) {
            this.resultPopup.remove();
            this.resultPopup = null;
        }
        
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }
        
        this.isDrawing = false;
        
    }
    
    /**
     * Tıklama kontrolü
     */
    canHandleClick() {
        return this.isActive && this.isDrawing;
    }
    
    /**
     * Harita tıklama handler
     */
    handleMapClick(e) {
        if (!this.canHandleClick()) return;
        
        // Marker sürükleniyorsa click'i ignore et
        if (this.isDragging) return;
        
        const point = { lng: e.lngLat.lng, lat: e.lngLat.lat };
        this.points.push(point);
        
        // Marker oluştur
        this.createMarker(point, this.points.length - 1);
        
        // Çizgileri güncelle
        this.updateLines();
        
        // Mesafe göster
        this.updateTempDistanceDisplay();
        
    }
    
    /**
     * Marker oluştur
     */
    createMarker(point, index) {
        const el = document.createElement('div');
        el.className = 'measurement-marker';
        
        const marker = new maplibregl.Marker({
            element: el,
            draggable: true
        })
        .setLngLat([point.lng, point.lat])
        .addTo(this.map);
        
        // Sürükleme event'leri
        marker.on('dragstart', () => {
            this.isDragging = true;
        });
        
        marker.on('drag', () => {
            // Sadece aktif drawing modunda güncelleme yap
            if (!this.isDrawing) return;
            
            const lngLat = marker.getLngLat();
            this.points[index] = { lng: lngLat.lng, lat: lngLat.lat };
            this.updateLines();
            this.updateDistanceDisplay();
        });
        
        marker.on('dragend', () => {
            // Küçük bir gecikme ile isDragging'i kapat (click event'inin önce işlenmesini engelle)
            setTimeout(() => {
                this.isDragging = false;
            }, 50);
            
            // Sadece aktif drawing modunda güncelleme yap
            if (this.isDrawing) {
                this.updateDistanceDisplay();
            }
        });
        
        this.markers.push(marker);
    }
    
    /**
     * Mouse hareket handler
     */
    onMouseMove(e) {
        if (!this.isActive || !this.isDrawing || this.points.length === 0) return;
        
        this.currentMousePos = { lng: e.lngLat.lng, lat: e.lngLat.lat };
        this.updateGhostLine();
        this.updateTempDistanceDisplay();
    }
    
    /**
     * Çift tıklama handler - ölçümü sonlandır
     */
    onDoubleClick(e) {
        if (!this.isActive || !this.isDrawing) return;
        
        // MapLibre eventi - originalEvent üzerinden DOM eventine eriş
        if (e.originalEvent) {
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();
        }
        
        // MapLibre zoom'unu engelle
        e.preventDefault && e.preventDefault();
        
        // Çift tıklama 2 click tetikler - son eklenen fazla noktayı kaldır
        if (this.points.length > 2) {
            const lastMarker = this.markers.pop();
            if (lastMarker) lastMarker.remove();
            this.points.pop();
            this.updateLines();
        }
        
        if (this.points.length >= 2) {
            this.finalizeMeasurement();
        }
        
        return false;
    }
    
    /**
     * Klavye handler - ESC ile iptal
     */
    onKeyDown(e) {
        if (e.key === 'Escape' && this.isActive) {
            this.resetState();
            this.deactivate();
        }
    }
    
    /**
     * Ana çizgileri güncelle
     */
    updateLines() {
        const source = this.map.getSource(this.lineSourceId);
        if (!source) return;
        
        if (this.points.length < 2) {
            source.setData({ type: 'FeatureCollection', features: [] });
            return;
        }
        
        const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: validPoints.map(p => [p.lng, p.lat])
            }
        };
        
        source.setData({
            type: 'FeatureCollection',
            features: [feature]
        });
        
        this.bringLayersToTop();
    }
    
    /**
     * Ghost önizleme çizgisini güncelle
     */
    updateGhostLine() {
        const source = this.map.getSource(this.ghostSourceId);
        if (!source || !this.currentMousePos || this.points.length === 0) return;
        
        const lastPoint = this.points[this.points.length - 1];
        
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [lastPoint.lng, lastPoint.lat],
                    [this.currentMousePos.lng, this.currentMousePos.lat]
                ]
            }
        };
        
        source.setData({
            type: 'FeatureCollection',
            features: [feature]
        });
    }
    
    /**
     * Ghost çizgiyi temizle
     */
    clearGhostLine() {
        const source = this.map.getSource(this.ghostSourceId);
        if (source) {
            source.setData({ type: 'FeatureCollection', features: [] });
        }
    }
    
    /**
     * Toplam mesafeyi hesapla (km)
     */
    calculateTotalDistance() {
        if (this.points.length < 2) return 0;
        
        try {
            const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
            const line = turf.lineString(validPoints.map(p => [p.lng, p.lat]));
            const distance = turf.length(line, { units: 'kilometers' });
            return distance;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Mesafeyi formatla
     */
    formatDistance(distanceKm) {
        if (distanceKm < 1) {
            return `${(distanceKm * 1000).toFixed(0)} m`;
        }
        return `${distanceKm.toFixed(2)} km`;
    }
    
    /**
     * Geçici mesafe popup'ını güncelle
     */
    updateTempDistanceDisplay() {
        if (this.points.length === 0) return;
        
        let totalDistance = this.calculateTotalDistance();
        
        // Ghost çizgi dahil mesafe
        if (this.currentMousePos && this.points.length > 0) {
            const lastPoint = this.points[this.points.length - 1];
            try {
                const ghostLine = turf.lineString([
                    [lastPoint.lng, lastPoint.lat],
                    [this.currentMousePos.lng, this.currentMousePos.lat]
                ]);
                const ghostDistance = turf.length(ghostLine, { units: 'kilometers' });
                totalDistance += ghostDistance;
            } catch (e) {}
        }
        
        const formattedDistance = this.formatDistance(totalDistance);
        
        // Popup pozisyonu - cursor yakınında
        const pos = this.currentMousePos || this.points[this.points.length - 1];
        
        if (!this.tempPopup) {
            this.tempPopup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                className: 'meas-popup meas-popup--temp',
                offset: [16, -16]
            });
        }
        
        this.tempPopup
            .setLngLat([pos.lng, pos.lat])
            .setHTML(`
                <div style="font-size: 13px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 4px;">
                    <svg viewBox="0 0 16 16" width="12" height="12" style="flex-shrink: 0;">
                        <path fill="currentColor" d="M1 5h14v6H1V5zm1 1v4h1V6H2zm2 0v2h1V6H4zm2 0v4h1V6H6zm2 0v2h1V6H8zm2 0v4h1V6h-1zm2 0v2h1V6h-1zm2 0v4h-1V6h1z"></path>
                    </svg>
                    ${formattedDistance}
                </div>
                <div style="font-size: 10px; color: #9ca3af; margin-top: 2px;">
                    Çift tıkla: Bitir | ESC: İptal
                </div>
            `)
            .addTo(this.map);
    }
    
    /**
     * Sonuç mesafe popup'ını güncelle
     */
    updateDistanceDisplay() {
        if (this.points.length < 2) return;
        
        const totalDistance = this.calculateTotalDistance();
        const formattedDistance = this.formatDistance(totalDistance);
        
        // Orta noktayı bul
        const midIndex = Math.floor(this.points.length / 2);
        const midPoint = this.points[midIndex];
        
        if (!this.resultPopup) {
            this.resultPopup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                className: 'meas-popup meas-popup--result',
                offset: [0, -15]
            });
        }
        
        this.resultPopup
            .setLngLat([midPoint.lng, midPoint.lat])
            .setHTML(`
                <div style="font-size: 14px; font-weight: 700; color: #111827; text-shadow: 0 0 3px white, 0 0 5px white; display: flex; align-items: center; gap: 4px;">
                    <svg viewBox="0 0 16 16" width="14" height="14" style="flex-shrink: 0;">
                        <path fill="currentColor" d="M1 5h14v6H1V5zm1 1v4h1V6H2zm2 0v2h1V6H4zm2 0v4h1V6H6zm2 0v2h1V6H8zm2 0v4h1V6h-1zm2 0v2h1V6h-1zm2 0v4h-1V6h1z"></path>
                    </svg>
                    ${formattedDistance}
                </div>
            `)
            .addTo(this.map);
    }
    
    /**
     * Ölçümü sonlandır
     */
    finalizeMeasurement() {
        if (this.points.length < 2) return;
        
        this.isDrawing = false;
        
        // Ghost çizgiyi temizle
        this.clearGhostLine();
        
        // Temp popup'ı kaldır
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }
        
        // Sonuç popup'ını göster
        this.updateDistanceDisplay();
        
        // Marker'ları non-draggable yap ve finalized style ekle
        this.markers.forEach(marker => {
            marker.setDraggable(false);
            const element = marker.getElement();
            if (element) {
                element.classList.add('measurement-marker--finalized');
            }
        });
        
        // Tamamlanmış ölçüm için benzersiz layer oluştur
        const finalizedId = `distance-measurement-finalized-${Date.now()}`;
        const finalizedSourceId = `${finalizedId}-source`;
        const finalizedLayerId = `${finalizedId}-line`;
        
        // Mevcut çizgi verilerini kopyala
        const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        const coordinates = validPoints.map(p => [p.lng, p.lat]);
        
        // Yeni source ve layer oluştur
        this.map.addSource(finalizedSourceId, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: coordinates }
                }]
            }
        });
        
        this.map.addLayer({
            id: finalizedLayerId,
            type: 'line',
            source: finalizedSourceId,
            paint: { 'line-color': '#1e3a5f', 'line-width': 3 }
        });
        
        // Tamamlanmış ölçümü kaydet
        this.finalizedMeasurements.push({
            markers: [...this.markers],
            popup: this.resultPopup,
            points: [...this.points],
            sourceId: finalizedSourceId,
            layerId: finalizedLayerId
        });
        
        // Ana source'u temizle (yeni ölçüm için)
        const mainSource = this.map.getSource(this.lineSourceId);
        if (mainSource) {
            mainSource.setData({ type: 'FeatureCollection', features: [] });
        }
        
        // Referansları sıfırla (yeni ölçüm için)
        this.markers = [];
        this.resultPopup = null;
        this.points = [];
        
        // Cursor'u normale döndür
        this.map.getCanvas().style.cursor = '';
        
        // Event'leri kaldır ama araç aktif kalsın
        this.map.off('click', this.handleMapClick);
        this.map.off('mousemove', this.onMouseMove);
        this.map.off('dblclick', this.onDoubleClick);
        
        // Double click zoom'u aktifleştir
        this.map.doubleClickZoom.enable();
        
        // Araç deaktif olsun ki tekrar tıklandığında aktive olabilsin
        this.isActive = false;
        
        if (this.onStateChange) {
            this.onStateChange({ isActive: false, isDrawing: false, finalized: true });
        }
    }
    
    /**
     * Layer'ları en üste taşı
     */
    bringLayersToTop() {
        try {
            const layers = this.map.getStyle().layers;
            if (!layers || layers.length === 0) return;
            
            // En üstteki non-symbol layer'ı bul
            let topLayerId = null;
            for (let i = layers.length - 1; i >= 0; i--) {
                if (layers[i].type !== 'symbol') {
                    topLayerId = layers[i].id;
                    break;
                }
            }
            
            // Layer'ları yeniden sırala
            if (this.map.getLayer(this.lineLayerId)) {
                this.map.moveLayer(this.lineLayerId);
            }
            if (this.map.getLayer(this.ghostLayerId)) {
                this.map.moveLayer(this.ghostLayerId);
            }
        } catch (error) {
        }
    }
    
    /**
     * Tüm ölçümleri temizle
     */
    clearAll() {
        // Tamamlanmış ölçümleri temizle
        this.finalizedMeasurements.forEach(m => {
            m.markers.forEach(marker => marker.remove());
            if (m.popup) m.popup.remove();
            // Tamamlanmış ölçümün layer'larını kaldır
            if (m.layerId && this.map.getLayer(m.layerId)) {
                this.map.removeLayer(m.layerId);
            }
            if (m.sourceId && this.map.getSource(m.sourceId)) {
                this.map.removeSource(m.sourceId);
            }
        });
        this.finalizedMeasurements = [];
        
        // Aktif ölçümü temizle
        this.resetState();
        this.deactivate();
        
        // Source'u temizle
        if (this.map.getSource(this.lineSourceId)) {
            this.map.getSource(this.lineSourceId).setData({
                type: 'FeatureCollection',
                features: []
            });
        }
        
    }
    
    /**
     * Ölçüm verisini al
     */
    getData() {
        return {
            type: 'distance',
            points: this.points.map(p => ({ lon: p.lng, lat: p.lat })),
            distance: this.calculateTotalDistance(),
            formattedDistance: this.formatDistance(this.calculateTotalDistance())
        };
    }
}

