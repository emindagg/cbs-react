/**
 * MeasurementTool - OneSoil Benzeri Ölçüm Aracı
 * 
 * Özellikler:
 * - Tek butonla hem mesafe hem alan ölçümü
 * - Polyline çizimi ile başlangıç
 * - İlk noktaya tıklayarak poligon kapatma
 * - Sürüklenebilir köşe noktaları (vertex drag)
 * - Dinamik alan/çevre hesaplama
 * - Sabit üst panel (mesafe/alan bilgisi)
 * - ESC ile iptal
 */

export class MeasurementTool {
    constructor(map, onStateChange = null) {
        this.map = map;
        this.onStateChange = onStateChange;
        
        // State
        this.isActive = false;
        this.isDrawing = false;
        this.isClosed = false; // Poligon kapalı mı?
        this.points = [];
        this.markers = [];
        this.currentMousePos = null;
        
        // UI Elements
        this.topPanel = null;
        
        // Layer IDs
        this.lineSourceId = 'measurement-tool-line';
        this.lineLayerId = 'measurement-tool-line-layer';
        this.fillSourceId = 'measurement-tool-fill';
        this.fillLayerId = 'measurement-tool-fill-layer';
        this.ghostSourceId = 'measurement-tool-ghost';
        this.ghostLayerId = 'measurement-tool-ghost-layer';
        
        // Marker drag flag
        this.isDragging = false;
        this.lastTouchAt = 0;
        this.touchStartPoint = null;
        
        // First point hover detection
        this.isHoveringFirstPoint = false;
        
        // Layers initialized flag
        this.layersInitialized = false;
        
        // Bind methods
        this.handleMapClick = this.handleMapClick.bind(this);
        this.handleMapTouchStart = this.handleMapTouchStart.bind(this);
        this.handleMapTouchEnd = this.handleMapTouchEnd.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);
        
        // Initialize layers when map is ready
        if (this.map.loaded()) {
            this.initializeLayers();
        } else {
            this.map.on('load', () => this.initializeLayers());
        }
        
        // Basemap değiştiğinde layer'ları yeniden oluştur
        this.map.on('style.load', () => {
            this.layersInitialized = false;
            // Eğer noktalar varsa (çizim yapılmış), layer'ları yeniden oluştur ve çiz
            if (this.points.length > 0) {
                this.initializeLayers();
                this.updateLayers();
            }
        });
    }
    
    /**
     * Layer ve source'ları oluştur
     */
    initializeLayers() {
        // Fill source (kapalı poligon için)
        if (!this.map.getSource(this.fillSourceId)) {
            this.map.addSource(this.fillSourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        
        // Fill layer
        if (!this.map.getLayer(this.fillLayerId)) {
            this.map.addLayer({
                id: this.fillLayerId,
                type: 'fill',
                source: this.fillSourceId,
                paint: {
                    'fill-color': '#ffffff',
                    'fill-opacity': 0.35
                }
            });
        }
        
        // Line source
        if (!this.map.getSource(this.lineSourceId)) {
            this.map.addSource(this.lineSourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        
        // Line layer
        if (!this.map.getLayer(this.lineLayerId)) {
            this.map.addLayer({
                id: this.lineLayerId,
                type: 'line',
                source: this.lineSourceId,
                paint: {
                    'line-color': '#0f172a',
                    'line-width': 4,
                    'line-opacity': 1
                }
            });
        }
        
        // Ghost source (önizleme çizgisi)
        if (!this.map.getSource(this.ghostSourceId)) {
            this.map.addSource(this.ghostSourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        
        // Ghost layer
        if (!this.map.getLayer(this.ghostLayerId)) {
            this.map.addLayer({
                id: this.ghostLayerId,
                type: 'line',
                source: this.ghostSourceId,
                paint: {
                    'line-color': '#0f172a',
                    'line-width': 3,
                    'line-opacity': 0.85
                }
            });
        }
        
        this.layersInitialized = true;
    }

    
    /**
     * Aracı aktifleştir
     */
    activate() {
        if (this.isActive) return;
        
        // Layer'ları oluştur (henüz oluşturulmadıysa)
        if (!this.layersInitialized) {
            this.initializeLayers();
        }
        
        this.isActive = true;
        this.isDrawing = true;
        this.isClosed = false;
        
        // Cursor değiştir
        this.map.getCanvas().style.cursor = 'crosshair';
        
        // Event listener'ları ekle
        this.map.on('click', this.handleMapClick);
        this.map.on('touchstart', this.handleMapTouchStart);
        this.map.on('touchend', this.handleMapTouchEnd);
        this.map.on('mousemove', this.onMouseMove);
        this.map.on('dblclick', this.onDoubleClick);
        document.addEventListener('keydown', this.onKeyDown);
        
        // Double click zoom'u devre dışı bırak
        this.map.doubleClickZoom.disable();
        
        // Top panel oluştur
        this.createTopPanel();
        
        if (this.onStateChange) {
            this.onStateChange({ isActive: true, isDrawing: true, isClosed: false });
        }
    }
    
    /**
     * Aracı deaktive et ve temizle
     */
    deactivate() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.isDrawing = false;
        
        // Cursor'u normale döndür
        this.map.getCanvas().style.cursor = '';
        
        // Event listener'ları kaldır
        this.map.off('click', this.handleMapClick);
        this.map.off('touchstart', this.handleMapTouchStart);
        this.map.off('touchend', this.handleMapTouchEnd);
        this.map.off('mousemove', this.onMouseMove);
        this.map.off('dblclick', this.onDoubleClick);
        document.removeEventListener('keydown', this.onKeyDown);
        
        // Double click zoom'u aktifleştir
        this.map.doubleClickZoom.enable();
        
        // Tüm çizimleri temizle
        this.clearAll();
        
        // Top panel'i kaldır
        this.removeTopPanel();
        
        if (this.onStateChange) {
            this.onStateChange({ isActive: false, isDrawing: false, isClosed: false });
        }
    }
    
    /**
     * Tüm çizimleri temizle
     */
    clearAll() {
        // Marker'ları kaldır
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
        
        // Noktaları temizle
        this.points = [];
        this.isClosed = false;
        
        // Layer'ları temizle
        this.updateLayers();
        this.clearGhostLine();
    }
    
    /**
     * Harita tıklama handler
     */
    handleMapClick(e) {
        if (!this.isActive || this.isDragging) return;

        // Mobilde touchend ile nokta eklendiyse sentetik click'i yut.
        if (Date.now() - this.lastTouchAt < 450) return;

        this.addPointFromLngLat(e.lngLat);
    }

    /**
     * Mobil dokunma başlangıcı
     */
    handleMapTouchStart(e) {
        if (!this.isActive || this.isDragging) return;

        const touch = e.originalEvent?.touches?.[0];
        if (!touch) return;

        this.touchStartPoint = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
    }

    /**
     * Mobil dokunma bitişi - haritaya nokta ekle
     */
    handleMapTouchEnd(e) {
        if (!this.isActive || this.isDragging) return;

        const touch = e.originalEvent?.changedTouches?.[0];
        if (!touch || !this.touchStartPoint) return;

        const dx = touch.clientX - this.touchStartPoint.x;
        const dy = touch.clientY - this.touchStartPoint.y;
        const distance = Math.sqrt((dx * dx) + (dy * dy));
        const duration = Date.now() - this.touchStartPoint.time;
        this.touchStartPoint = null;

        // Pan/zoom hareketlerini ölçüm noktası sayma.
        if (distance > 12 || duration > 700) return;

        const lngLat = e.lngLat || this.getLngLatFromTouch(touch);
        if (!lngLat) return;

        this.lastTouchAt = Date.now();
        this.addPointFromLngLat(lngLat);
    }

    /**
     * Touch koordinatını harita koordinatına çevir
     */
    getLngLatFromTouch(touch) {
        const canvas = this.map.getCanvas();
        const rect = canvas.getBoundingClientRect();
        const point = [
            touch.clientX - rect.left,
            touch.clientY - rect.top
        ];
        const lngLat = this.map.unproject(point);
        return lngLat ? { lng: lngLat.lng, lat: lngLat.lat } : null;
    }

    /**
     * Ölçüm noktasını ekle
     */
    addPointFromLngLat(lngLat) {
        if (!lngLat) return;

        const clickPoint = { lng: lngLat.lng, lat: lngLat.lat };

        // Eğer poligon kapalıysa, düzenleme modundayız - yeni tıklama yok
        if (this.isClosed) return;
        
        // İlk noktaya tıklama kontrolü (poligon kapatma)
        if (this.points.length >= 3 && this.isNearFirstPoint(clickPoint)) {
            this.closePolygon();
            return;
        }
        
        // Yeni nokta ekle
        this.points.push(clickPoint);
        this.createMarker(clickPoint, this.points.length - 1);
        this.updateLayers();
        this.updateTopPanel();
    }
    
    /**
     * İlk noktaya yakın mı kontrol et
     */
    isNearFirstPoint(point) {
        if (this.points.length === 0) return false;
        
        const firstPoint = this.points[0];
        const threshold = 20; // pixel
        
        // Koordinatları pixel'e çevir
        const firstPixel = this.map.project([firstPoint.lng, firstPoint.lat]);
        const clickPixel = this.map.project([point.lng, point.lat]);
        
        const distance = Math.sqrt(
            Math.pow(firstPixel.x - clickPixel.x, 2) + 
            Math.pow(firstPixel.y - clickPixel.y, 2)
        );
        
        return distance < threshold;
    }
    
    /**
     * Poligonu kapat
     */
    closePolygon() {
        if (this.points.length < 3) return;
        
        this.isClosed = true;
        this.isDrawing = false;
        
        // Ghost çizgiyi temizle
        this.clearGhostLine();
        
        // Layer'ları güncelle (fill dahil)
        this.updateLayers();
        
        // Marker'ları düzenlenebilir yap
        this.enableVertexDrag();
        
        // Panel'i güncelle
        this.updateTopPanel();
        
        // Cursor'u normale döndür
        this.map.getCanvas().style.cursor = '';
        
        if (this.onStateChange) {
            this.onStateChange({ isActive: true, isDrawing: false, isClosed: true });
        }
    }

    
    /**
     * Marker oluştur
     */
    createMarker(point, index) {
        const el = document.createElement('div');
        el.className = 'measurement-tool-marker';
        
        const marker = new maplibregl.Marker({
            element: el,
            draggable: true
        })
        .setLngLat([point.lng, point.lat])
        .addTo(this.map);
        
        // Marker index'ini sakla
        marker._measurementIndex = index;
        
        // Sürükleme event'leri
        marker.on('dragstart', () => {
            this.isDragging = true;
        });
        
        marker.on('drag', () => {
            const lngLat = marker.getLngLat();
            const idx = marker._measurementIndex;
            this.points[idx] = { lng: lngLat.lng, lat: lngLat.lat };
            this.updateLayers();
            this.updateTopPanel();
        });
        
        marker.on('dragend', () => {
            setTimeout(() => {
                this.isDragging = false;
            }, 50);
        });
        
        this.markers.push(marker);
    }
    
    /**
     * Vertex drag'i aktifleştir
     */
    enableVertexDrag() {
        this.markers.forEach(marker => {
            marker.setDraggable(true);
        });
    }
    
    /**
     * Mouse hareket handler
     */
    onMouseMove(e) {
        if (!this.isActive || !this.isDrawing || this.points.length === 0) return;
        
        this.currentMousePos = { lng: e.lngLat.lng, lat: e.lngLat.lat };
        
        this.updateGhostLine();
        this.updateTopPanel();
    }
    
    /**
     * Klavye handler - ESC ile iptal
     */
    onKeyDown(e) {
        if (e.key === 'Escape' && this.isActive) {
            this.deactivate();
        }
    }
    
    /**
     * Çift tıklama handler - mesafe ölçümünü bitir (poligon kapatmadan)
     */
    onDoubleClick(e) {
        if (!this.isActive || !this.isDrawing) return;
        
        // Event'i engelle
        if (e.originalEvent) {
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();
        }
        
        // En az 2 nokta varsa mesafe ölçümünü bitir
        if (this.points.length >= 2) {
            // Çift tıklama 2 click tetikler - son eklenen fazla noktayı kaldır
            if (this.points.length > 2) {
                const lastMarker = this.markers.pop();
                if (lastMarker) lastMarker.remove();
                this.points.pop();
            }
            
            this.finalizeLine();
        }
        
        return false;
    }
    
    /**
     * Mesafe ölçümünü bitir (poligon kapatmadan)
     */
    finalizeLine() {
        if (this.points.length < 2) return;
        
        this.isDrawing = false;
        this.isClosed = false; // Poligon değil, sadece çizgi
        
        // Ghost çizgiyi temizle
        this.clearGhostLine();
        
        // Layer'ları güncelle
        this.updateLayers();
        
        // Panel'i güncelle
        this.updateTopPanel();
        
        // Cursor'u normale döndür
        this.map.getCanvas().style.cursor = '';
        
        if (this.onStateChange) {
            this.onStateChange({ isActive: true, isDrawing: false, isClosed: false });
        }
    }
    
    /**
     * Layer'ların varlığını kontrol et, yoksa oluştur
     */
    ensureLayers() {
        if (!this.map.getSource(this.lineSourceId) || !this.map.getLayer(this.lineLayerId)) {
            this.layersInitialized = false;
            this.initializeLayers();
        }
    }
    
    /**
     * Layer'ları güncelle
     */
    updateLayers() {
        // Layer'ların varlığını kontrol et
        this.ensureLayers();
        
        // Line layer
        const lineSource = this.map.getSource(this.lineSourceId);
        if (lineSource) {
            if (this.points.length < 2) {
                lineSource.setData({ type: 'FeatureCollection', features: [] });
            } else {
                const coords = this.points.map(p => [p.lng, p.lat]);
                
                // Kapalı poligon ise başlangıca dön
                if (this.isClosed) {
                    coords.push(coords[0]);
                }
                
                lineSource.setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: coords }
                    }]
                });
            }
        }
        
        // Fill layer (sadece kapalı poligon için)
        const fillSource = this.map.getSource(this.fillSourceId);
        if (fillSource) {
            if (!this.isClosed || this.points.length < 3) {
                fillSource.setData({ type: 'FeatureCollection', features: [] });
            } else {
                const coords = this.points.map(p => [p.lng, p.lat]);
                coords.push(coords[0]); // Kapat
                
                fillSource.setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: { type: 'Polygon', coordinates: [coords] }
                    }]
                });
            }
        }
        
        this.bringLayersToTop();
    }
    
    /**
     * Ghost önizleme çizgisini güncelle
     */
    updateGhostLine() {
        // Layer'ların varlığını kontrol et
        this.ensureLayers();
        
        const source = this.map.getSource(this.ghostSourceId);
        if (!source || !this.currentMousePos || this.points.length === 0) return;
        
        const lastPoint = this.points[this.points.length - 1];
        
        // Sadece son noktadan mouse'a çizgi çiz
        source.setData({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { 
                    type: 'LineString', 
                    coordinates: [
                        [lastPoint.lng, lastPoint.lat],
                        [this.currentMousePos.lng, this.currentMousePos.lat]
                    ]
                }
            }]
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
     * Layer'ları en üste taşı
     */
    bringLayersToTop() {
        try {
            if (this.map.getLayer(this.fillLayerId)) {
                this.map.moveLayer(this.fillLayerId);
            }
            if (this.map.getLayer(this.lineLayerId)) {
                this.map.moveLayer(this.lineLayerId);
            }
            if (this.map.getLayer(this.ghostLayerId)) {
                this.map.moveLayer(this.ghostLayerId);
            }
        } catch (error) {}
    }

    
    // ========================================
    // HESAPLAMALAR
    // ========================================
    
    /**
     * Toplam mesafe/çevre hesapla (metre)
     */
    calculatePerimeter() {
        if (this.points.length < 2) return 0;
        
        try {
            const coords = this.points.map(p => [p.lng, p.lat]);
            
            // Kapalı poligon ise başlangıca dön
            if (this.isClosed) {
                coords.push(coords[0]);
            }
            
            const line = turf.lineString(coords);
            const length = turf.length(line, { units: 'meters' });
            return length;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Ghost dahil mesafe hesapla
     */
    calculatePerimeterWithGhost() {
        if (this.points.length === 0 || !this.currentMousePos) return this.calculatePerimeter();
        
        try {
            const coords = this.points.map(p => [p.lng, p.lat]);
            coords.push([this.currentMousePos.lng, this.currentMousePos.lat]);
            
            const line = turf.lineString(coords);
            const length = turf.length(line, { units: 'meters' });
            return length;
        } catch (error) {
            return this.calculatePerimeter();
        }
    }
    
    /**
     * Alan hesapla (m²)
     */
    calculateArea() {
        if (this.points.length < 3) return 0;
        
        try {
            const coords = this.points.map(p => [p.lng, p.lat]);
            coords.push(coords[0]); // Kapat
            
            const polygon = turf.polygon([coords]);
            const area = turf.area(polygon);
            return area;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Son segment mesafesi (eklenen mesafe)
     */
    calculateLastSegment() {
        if (this.points.length < 1 || !this.currentMousePos) return 0;
        
        try {
            const lastPoint = this.points[this.points.length - 1];
            const line = turf.lineString([
                [lastPoint.lng, lastPoint.lat],
                [this.currentMousePos.lng, this.currentMousePos.lat]
            ]);
            return turf.length(line, { units: 'meters' });
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Mesafeyi formatla
     */
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters).toLocaleString('tr-TR')} m`;
        }
        return `${(meters / 1000).toFixed(2).replace('.', ',')} km`;
    }
    
    /**
     * Alanı formatla
     */
    formatArea(sqMeters) {
        const hectares = sqMeters / 10000;
        
        if (sqMeters < 10000) {
            return `${Math.round(sqMeters).toLocaleString('tr-TR')} m²`;
        } else if (hectares < 100) {
            return `${hectares.toFixed(1).replace('.', ',')} ha`;
        } else {
            const sqKm = sqMeters / 1000000;
            return `${sqKm.toFixed(2).replace('.', ',')} km²`;
        }
    }
    
    // ========================================
    // TOP PANEL (Sabit Üst Bilgi Paneli)
    // ========================================
    
    /**
     * Top panel oluştur
     */
    createTopPanel() {
        if (this.topPanel) return;
        
        this.topPanel = document.createElement('div');
        this.topPanel.className = 'measurement-tool-panel';
        this.topPanel.innerHTML = this.getPanelContent();
        document.body.appendChild(this.topPanel);
        
        // ESC butonu event'i
        const escBtn = this.topPanel.querySelector('.measurement-tool-panel__esc');
        if (escBtn) {
            escBtn.addEventListener('click', () => this.deactivate());
        }
    }
    
    /**
     * Top panel'i güncelle
     */
    updateTopPanel() {
        if (!this.topPanel) return;
        this.topPanel.innerHTML = this.getPanelContent();
        
        // ESC butonu event'ini yeniden bağla
        const escBtn = this.topPanel.querySelector('.measurement-tool-panel__esc');
        if (escBtn) {
            escBtn.addEventListener('click', () => this.deactivate());
        }
    }
    
    /**
     * Panel içeriğini oluştur
     */
    getPanelContent() {
        const escButton = `
            <button class="measurement-tool-panel__esc" title="İptal (ESC)">
                <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                ESC
            </button>
        `;
        
        if (this.isClosed) {
            // Kapalı poligon - alan ve çevre göster
            const perimeter = this.calculatePerimeter();
            const area = this.calculateArea();
            
            return `
                ${escButton}
                <div class="measurement-tool-panel__divider"></div>
                <div class="measurement-tool-panel__item">
                    <span class="measurement-tool-panel__label">Çevre</span>
                    <span class="measurement-tool-panel__value">${this.formatDistance(perimeter)}</span>
                </div>
                <div class="measurement-tool-panel__divider"></div>
                <div class="measurement-tool-panel__item">
                    <span class="measurement-tool-panel__label">Alan</span>
                    <span class="measurement-tool-panel__value measurement-tool-panel__value--primary">${this.formatArea(area)}</span>
                </div>
            `;
        } else if (!this.isDrawing && this.points.length >= 2) {
            // Çizim bitti ama poligon kapatılmadı - sadece mesafe göster
            const distance = this.calculatePerimeter();
            
            return `
                ${escButton}
                <div class="measurement-tool-panel__divider"></div>
                <div class="measurement-tool-panel__item">
                    <span class="measurement-tool-panel__label">Mesafe</span>
                    <span class="measurement-tool-panel__value measurement-tool-panel__value--primary">${this.formatDistance(distance)}</span>
                </div>
            `;
        } else if (this.points.length === 0) {
            // Henüz nokta yok
            return `
                ${escButton}
                <div class="measurement-tool-panel__divider"></div>
                <div class="measurement-tool-panel__hint">Ölçüm başlatmak için haritaya tıklayın</div>
            `;
        } else {
            // Çizim devam ediyor
            const perimeter = this.currentMousePos 
                ? this.calculatePerimeterWithGhost() 
                : this.calculatePerimeter();
            const lastSegment = this.calculateLastSegment();
            
            let content = `
                ${escButton}
                <div class="measurement-tool-panel__divider"></div>
                <div class="measurement-tool-panel__item">
                    <span class="measurement-tool-panel__label">Mesafe</span>
                    <span class="measurement-tool-panel__value">${this.formatDistance(perimeter)}</span>
                </div>
            `;
            
            // Son segment mesafesi
            if (lastSegment > 0 && this.points.length > 0) {
                content += `
                    <span class="measurement-tool-panel__segment">+${this.formatDistance(lastSegment)}</span>
                `;
            }
            
            return content;
        }
    }
    
    /**
     * Top panel'i kaldır
     */
    removeTopPanel() {
        if (this.topPanel && this.topPanel.parentNode) {
            this.topPanel.parentNode.removeChild(this.topPanel);
            this.topPanel = null;
        }
    }
    
    /**
     * Ölçüm verisini al
     */
    getData() {
        return {
            points: this.points.map(p => ({ lon: p.lng, lat: p.lat })),
            isClosed: this.isClosed,
            perimeter: this.calculatePerimeter(),
            area: this.isClosed ? this.calculateArea() : 0,
            formattedPerimeter: this.formatDistance(this.calculatePerimeter()),
            formattedArea: this.isClosed ? this.formatArea(this.calculateArea()) : null
        };
    }
}
