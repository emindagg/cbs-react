/**
 * AreaMeasurement - Alan Ölçüm Aracı
 * 
 * Özellikler:
 * - Çokgen alan ölçümü (polygon)
 * - Sürüklenebilir köşe noktaları
 * - Canlı önizleme (ghost polygon)
 * - Dinamik alan hesaplama
 * - Otomatik birim dönüşümü (m²/ha/km²)
 * - Centroid hesaplama
 * - Çift tıklama ile sonlandırma
 * - ESC tuşu ile iptal
 * - Popup ile sonuç gösterimi
 */

export class AreaMeasurement {
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
        this.tempTooltip = null;
        this.currentMousePos = null;
        this.finalizedMeasurements = []; // Tamamlanmış ölçümler
        
        // Layer IDs
        this.polygonSourceId = 'area-measurements';
        this.polygonFillLayerId = 'area-polygons';
        this.polygonOutlineLayerId = 'area-outlines';
        this.ghostSourceId = 'area-ghost';
        this.ghostFillLayerId = 'area-ghost-fill';
        this.ghostOutlineLayerId = 'area-ghost-line';
        
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
        // Ana polygon source
        if (!this.map.getSource(this.polygonSourceId)) {
            this.map.addSource(this.polygonSourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        
        // Polygon fill layer
        if (!this.map.getLayer(this.polygonFillLayerId)) {
            this.map.addLayer({
                id: this.polygonFillLayerId,
                type: 'fill',
                source: this.polygonSourceId,
                paint: {
                    'fill-color': '#3b82f6',
                    'fill-opacity': 0.3
                }
            });
        }
        
        // Polygon outline layer
        if (!this.map.getLayer(this.polygonOutlineLayerId)) {
            this.map.addLayer({
                id: this.polygonOutlineLayerId,
                type: 'line',
                source: this.polygonSourceId,
                paint: {
                    'line-color': '#111827',
                    'line-width': 2,
                    'line-opacity': 1
                }
            });
        }
        
        // Ghost polygon source
        if (!this.map.getSource(this.ghostSourceId)) {
            this.map.addSource(this.ghostSourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        
        // Ghost fill layer
        if (!this.map.getLayer(this.ghostFillLayerId)) {
            this.map.addLayer({
                id: this.ghostFillLayerId,
                type: 'fill',
                source: this.ghostSourceId,
                paint: {
                    'fill-color': '#9ca3af',
                    'fill-opacity': 0.2
                }
            });
        }
        
        // Ghost outline layer
        if (!this.map.getLayer(this.ghostOutlineLayerId)) {
            this.map.addLayer({
                id: this.ghostOutlineLayerId,
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
        this.clearGhostPolygon();
        
        // Temp popup/tooltip'i kaldır
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }
        if (this.tempTooltip) {
            this.tempTooltip.remove();
            this.tempTooltip = null;
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
        
        // Polygon'ları temizle
        this.updatePolygon();
        this.clearGhostPolygon();
        
        // Popup'ları kaldır
        if (this.resultPopup) {
            this.resultPopup.remove();
            this.resultPopup = null;
        }
        
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }
        if (this.tempTooltip) {
            this.tempTooltip.remove();
            this.tempTooltip = null;
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
        
        // Polygon'u güncelle
        this.updatePolygon();
        
        // Alan göster
        this.updateTempAreaDisplay();
        
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
            this.updatePolygon();
            this.updateAreaDisplay();
        });
        
        marker.on('dragend', () => {
            // Küçük bir gecikme ile isDragging'i kapat (click event'inin önce işlenmesini engelle)
            setTimeout(() => {
                this.isDragging = false;
            }, 50);
            
            // Sadece aktif drawing modunda güncelleme yap
            if (this.isDrawing) {
                this.updateAreaDisplay();
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
        this.updateGhostPolygon();
        this.updateTempAreaDisplay();
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
        if (this.points.length > 3) {
            const lastMarker = this.markers.pop();
            if (lastMarker) lastMarker.remove();
            this.points.pop();
            this.updatePolygon();
        }
        
        if (this.points.length >= 3) {
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
     * Ana polygon'u güncelle
     */
    updatePolygon() {
        const source = this.map.getSource(this.polygonSourceId);
        if (!source) return;
        
        if (this.points.length < 3) {
            source.setData({ type: 'FeatureCollection', features: [] });
            return;
        }
        
        const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        
        // Polygon'u kapat
        const coordinates = [...validPoints.map(p => [p.lng, p.lat])];
        coordinates.push(coordinates[0]); // Başlangıç noktasına dön
        
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates]
            }
        };
        
        source.setData({
            type: 'FeatureCollection',
            features: [feature]
        });
        
        this.bringLayersToTop();
    }
    
    /**
     * Ghost önizleme polygon'unu güncelle
     */
    updateGhostPolygon() {
        const source = this.map.getSource(this.ghostSourceId);
        if (!source || !this.currentMousePos || this.points.length < 2) return;
        
        const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        
        // Ghost polygon koordinatları
        const coordinates = [
            ...validPoints.map(p => [p.lng, p.lat]),
            [this.currentMousePos.lng, this.currentMousePos.lat],
            validPoints[0] ? [validPoints[0].lng, validPoints[0].lat] : [this.currentMousePos.lng, this.currentMousePos.lat]
        ];
        
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [coordinates]
            }
        };
        
        source.setData({
            type: 'FeatureCollection',
            features: [feature]
        });
    }
    
    /**
     * Ghost polygon'u temizle
     */
    clearGhostPolygon() {
        const source = this.map.getSource(this.ghostSourceId);
        if (source) {
            source.setData({ type: 'FeatureCollection', features: [] });
        }
    }
    
    /**
     * Alan hesapla (m²)
     */
    calculateArea() {
        if (this.points.length < 3) return 0;
        
        try {
            const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
            const coordinates = [...validPoints.map(p => [p.lng, p.lat])];
            coordinates.push(coordinates[0]); // Kapat
            
            const polygon = turf.polygon([coordinates]);
            const area = turf.area(polygon);
            return area;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Ghost dahil alan hesapla
     */
    calculateGhostArea() {
        if (this.points.length < 2 || !this.currentMousePos) return 0;
        
        try {
            const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
            const coordinates = [
                ...validPoints.map(p => [p.lng, p.lat]),
                [this.currentMousePos.lng, this.currentMousePos.lat]
            ];
            coordinates.push(coordinates[0]); // Kapat
            
            const polygon = turf.polygon([coordinates]);
            const area = turf.area(polygon);
            return area;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Centroid hesapla
     */
    calculateCentroid() {
        if (this.points.length < 3) return null;
        
        try {
            const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
            const coordinates = [...validPoints.map(p => [p.lng, p.lat])];
            coordinates.push(coordinates[0]);
            
            const polygon = turf.polygon([coordinates]);
            const centroid = turf.centroid(polygon);
            
            return {
                lng: centroid.geometry.coordinates[0],
                lat: centroid.geometry.coordinates[1]
            };
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Alanı formatla
     */
    formatArea(area) {
        if (area < 10000) {
            // m² göster
            return `${area.toFixed(0)} m²`;
        } else if (area < 1000000) {
            // Hektar göster
            const ha = area / 10000;
            return `${ha.toFixed(2)} ha`;
        } else {
            // km² göster
            const km2 = area / 1000000;
            return `${km2.toFixed(2)} km²`;
        }
    }
    
    /**
     * Geçici alan popup'ını güncelle
     */
    updateTempAreaDisplay() {
        if (this.points.length < 2) return;
        
        let area = this.points.length >= 3 
            ? this.calculateArea() 
            : this.calculateGhostArea();
        
        // Ghost dahil alan
        if (this.currentMousePos && this.points.length >= 2) {
            area = this.calculateGhostArea();
        }
        
        const formattedArea = this.formatArea(area);
        
        // Sabit pozisyonlu tooltip (ekranın sol üst köşesinde)
        if (!this.tempTooltip) {
            this.tempTooltip = document.createElement('div');
            this.tempTooltip.className = 'area-measure-tooltip';
            this.tempTooltip.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 255, 255, 0.95);
                padding: 8px 14px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(0, 0, 0, 0.08);
                z-index: 1000;
                pointer-events: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            document.body.appendChild(this.tempTooltip);
        }
        
        this.tempTooltip.innerHTML = `
            <div style="font-size: 13px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 6px;">
                <svg viewBox="0 0 16 16" width="14" height="14" style="flex-shrink: 0;">
                    <path fill="currentColor" d="M2 2v12h12V2H2zm11 11H3V3h10v10z"></path>
                    <path fill="currentColor" opacity=".4" d="M4 4h8v8H4z"></path>
                </svg>
                ${formattedArea}
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 4px; text-align: center;">
                ${this.points.length < 3 ? 'En az 3 nokta gerekli' : 'Çift tıkla: Bitir'} | ESC: İptal
            </div>
        `;
        this.tempTooltip.style.display = 'block';
    }
    
    /**
     * Sonuç alan popup'ını güncelle
     */
    updateAreaDisplay() {
        if (this.points.length < 3) return;
        
        const area = this.calculateArea();
        const formattedArea = this.formatArea(area);
        const centroid = this.calculateCentroid();
        
        if (!centroid) return;
        
        if (!this.resultPopup) {
            this.resultPopup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                className: 'meas-popup meas-popup--result',
                offset: [0, -15]
            });
        }
        
        this.resultPopup
            .setLngLat([centroid.lng, centroid.lat])
            .setHTML(`
                <div style="font-size: 14px; font-weight: 700; color: #111827; text-shadow: 0 0 3px white, 0 0 5px white; display: flex; align-items: center; gap: 4px;">
                    <svg viewBox="0 0 16 16" width="14" height="14" style="flex-shrink: 0;">
                        <path fill="currentColor" d="M2 2v12h12V2H2zm11 11H3V3h10v10z"></path>
                        <path fill="currentColor" opacity=".4" d="M4 4h8v8H4z"></path>
                        <circle fill="currentColor" cx="3" cy="3" r="1.5"></circle>
                        <circle fill="currentColor" cx="13" cy="3" r="1.5"></circle>
                        <circle fill="currentColor" cx="3" cy="13" r="1.5"></circle>
                        <circle fill="currentColor" cx="13" cy="13" r="1.5"></circle>
                    </svg>
                    ${formattedArea}
                </div>
            `)
            .addTo(this.map);
    }
    
    /**
     * Ölçümü sonlandır
     */
    finalizeMeasurement() {
        if (this.points.length < 3) return;
        
        this.isDrawing = false;
        
        // Ghost polygon'u temizle
        this.clearGhostPolygon();
        
        // Temp popup/tooltip'i kaldır
        if (this.tempPopup) {
            this.tempPopup.remove();
            this.tempPopup = null;
        }
        if (this.tempTooltip) {
            this.tempTooltip.remove();
            this.tempTooltip = null;
        }
        
        // Sonuç popup'ını göster
        this.updateAreaDisplay();
        
        // Marker'ları non-draggable yap ve finalized style ekle
        this.markers.forEach(marker => {
            marker.setDraggable(false);
            const element = marker.getElement();
            if (element) {
                element.classList.add('measurement-marker--finalized');
            }
        });
        
        // Tamamlanmış ölçüm için benzersiz layer oluştur
        const finalizedId = `area-measurement-finalized-${Date.now()}`;
        const finalizedSourceId = `${finalizedId}-source`;
        const finalizedFillLayerId = `${finalizedId}-fill`;
        const finalizedOutlineLayerId = `${finalizedId}-outline`;
        
        // Mevcut polygon verilerini kopyala
        const validPoints = this.points.filter(p => p && p.lng != null && p.lat != null);
        const coordinates = [...validPoints.map(p => [p.lng, p.lat])];
        coordinates.push(coordinates[0]); // Kapat
        
        // Yeni source ve layer'lar oluştur
        this.map.addSource(finalizedSourceId, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: { type: 'Polygon', coordinates: [coordinates] }
                }]
            }
        });
        
        this.map.addLayer({
            id: finalizedFillLayerId,
            type: 'fill',
            source: finalizedSourceId,
            paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.15 }
        });
        
        this.map.addLayer({
            id: finalizedOutlineLayerId,
            type: 'line',
            source: finalizedSourceId,
            paint: { 'line-color': '#1e3a5f', 'line-width': 2 }
        });
        
        // Tamamlanmış ölçümü kaydet
        this.finalizedMeasurements.push({
            markers: [...this.markers],
            popup: this.resultPopup,
            points: [...this.points],
            sourceId: finalizedSourceId,
            fillLayerId: finalizedFillLayerId,
            outlineLayerId: finalizedOutlineLayerId
        });
        
        // Ana source'u temizle (yeni ölçüm için)
        const mainSource = this.map.getSource(this.polygonSourceId);
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
            // Layer'ları yeniden sırala
            if (this.map.getLayer(this.polygonFillLayerId)) {
                this.map.moveLayer(this.polygonFillLayerId);
            }
            if (this.map.getLayer(this.polygonOutlineLayerId)) {
                this.map.moveLayer(this.polygonOutlineLayerId);
            }
            if (this.map.getLayer(this.ghostFillLayerId)) {
                this.map.moveLayer(this.ghostFillLayerId);
            }
            if (this.map.getLayer(this.ghostOutlineLayerId)) {
                this.map.moveLayer(this.ghostOutlineLayerId);
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
            if (m.fillLayerId && this.map.getLayer(m.fillLayerId)) {
                this.map.removeLayer(m.fillLayerId);
            }
            if (m.outlineLayerId && this.map.getLayer(m.outlineLayerId)) {
                this.map.removeLayer(m.outlineLayerId);
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
        if (this.map.getSource(this.polygonSourceId)) {
            this.map.getSource(this.polygonSourceId).setData({
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
            type: 'area',
            points: this.points.map(p => ({ lon: p.lng, lat: p.lat })),
            area: this.calculateArea(),
            formattedArea: this.formatArea(this.calculateArea()),
            centroid: this.calculateCentroid()
        };
    }
}

