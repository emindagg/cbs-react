import { MapHelpers } from './modules/MapHelpers.js';
import { MapLayers } from './modules/MapLayers.js';
import { HGM_TILE_URLS } from '../../config/hgm.js';
import { MapMarkers } from './modules/MapMarkers.js';
import { MapDrawing } from './modules/MapDrawing.js';
import { RouteManager } from './modules/RouteManager.js';
import { TimelineManager } from './modules/TimelineManager.js';
import { DistanceMeasurement } from './modules/DistanceMeasurement.js';
import { AreaMeasurement } from './modules/AreaMeasurement.js';
import { MeasurementTool } from './modules/MeasurementTool.js';
import { Toggle3DControl } from './modules/Toggle3DControl.js';

/**
 * MapComponent - Modüler harita bileşeni
 */
export class MapComponent {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            center: options.center || [35.0, 39.0], // Türkiye merkez
            zoom: options.zoom || 6,
            template: options.template || null, // Template bilgisi
            templateKey: options.templateKey || null, // Template key (point, route, timeline, storymap)
            viewMode: options.viewMode || false, // View mode (salt okunur)
            ...options
        };

        this.map = null;
        this.isMapLoaded = false;
        this.mapLoadCallbacks = [];
        this.viewMode = options.viewMode || false;

        // HGM tile hatalarını filtrele (console spam'i önle)
        this.setupConsoleFilter();

        // Modüller
        this.layers = null;
        this.markers = null;
        this.drawing = null;
        this.routeManager = null;
        this.timelineManager = null;
        this.distanceMeasurement = null;
        this.areaMeasurement = null;
        this.measurementTool = null;
        this.activePulseMarker = null;

        // Callback'ler
        this.onRouteDistanceUpdate = null; // Rota mesafesi güncellendiğinde çağrılacak

        this.init();
    }

    get draw() {
        return this.drawing ? this.drawing.draw : null;
    }

    // Rota yöneticisini başlat (dışarıdan çağrılabilir)
    initRouteManager() {
        if (!this.routeManager && this.map) {
            this.routeManager = new RouteManager(this.map, this.options.template || { type: 'route' });

            // RouteManager'dan mesafe güncellemelerini dinle
            this.routeManager.onDistanceUpdate = (totalDistance) => {
                if (this.onRouteDistanceUpdate) {
                    this.onRouteDistanceUpdate(totalDistance);
                }
            };
        }
        return this.routeManager;
    }

    onMapLoad(callback) {
        if (this.isMapLoaded) {
            callback();
        } else {
            this.mapLoadCallbacks.push(callback);
        }
    }

    async     init() {
        if (typeof maplibregl === 'undefined') return;

        const container = document.getElementById(this.containerId);
        if (!container) return;

        this.map = new maplibregl.Map({
            container: this.containerId,
            style: {
                version: 8,
                sources: {
                    'hgm-temel': {
                        type: 'raster',
                        tiles: [HGM_TILE_URLS.temel],
                        tileSize: 256,
                        maxzoom: 19
                    }
                },
                layers: [{
                    id: 'hgm-temel-layer',
                    type: 'raster',
                    source: 'hgm-temel'
                }]
            },
            center: this.options.center,
            zoom: this.options.zoom,
            maxZoom: 19,
            minZoom: 1,
            attributionControl: !this.viewMode // View mode'da attribution'ı gizle
        });

        // Modülleri başlat
        this.layers = new MapLayers(this.map);
        this.markers = new MapMarkers(this.map);
        this.drawing = new MapDrawing(this.map, this.markers);

        // Rota şablonu için RouteManager'ı başlat
        if (this.options.template && this.options.template.type === 'route') {
            this.initRouteManager();
        }

        // Timeline şablonu için TimelineManager'ı başlat
        if (this.options.template && this.options.template.type === 'timeline') {
            this.timelineManager = new TimelineManager(this.map, this.options.template);
        }

        this.map.on('load', () => {
            this.isMapLoaded = true;

            // 3D görünüm kontrolünü ekle (hem edit hem view mode'da)
            this.toggle3DControl = new Toggle3DControl();
            this.map.addControl(this.toggle3DControl, 'top-right');

            // Zoom kontrolleri (hem edit hem view mode'da)
            this.navigationControl = new maplibregl.NavigationControl({ showCompass: false });
            this.map.addControl(this.navigationControl, 'top-right');

            // Konum (Geolocate) kontrolü (hem edit hem view mode'da)
            this.geolocateControl = new maplibregl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: false,
                showUserLocation: false
            });
            this.map.addControl(this.geolocateControl, 'top-right');
            const geolocateBtn = this.map.getContainer().querySelector('.maplibregl-ctrl-geolocate');
            if (geolocateBtn) geolocateBtn.setAttribute('title', 'Konumumu Bul');
            
            // Custom location marker
            this.userLocationMarker = null;
            this.geolocateControl.on('geolocate', (e) => {
                const { longitude, latitude } = e.coords;
                
                if (!this.userLocationMarker) {
                    // Custom marker element oluştur
                    const el = document.createElement('div');
                    el.className = 'user-location-marker';
                    el.innerHTML = `
                        <div class="user-location-pin"></div>
                        <div class="user-location-shadow"></div>
                    `;
                    
                    this.userLocationMarker = new maplibregl.Marker({ element: el })
                        .setLngLat([longitude, latitude])
                        .addTo(this.map);
                } else {
                    this.userLocationMarker.setLngLat([longitude, latitude]);
                }
            });

            // Measurement araçlarını başlat
            this.distanceMeasurement = new DistanceMeasurement(this.map);
            this.areaMeasurement = new AreaMeasurement(this.map);
            this.measurementTool = new MeasurementTool(this.map);

            this.mapLoadCallbacks.forEach(cb => cb());
            this.mapLoadCallbacks = [];

            // View mode kontrolü - kontroller eklendikten sonra
            if (this.viewMode) {
                this.disableInteractions();
            }
        });

        this.setupErrorHandling();
    }

    setupConsoleFilter() {
        // MapLibre'ın internal tile hatalarını filtrele
        const originalError = console.error;
        const originalWarn = console.warn;

        console.error = (...args) => {
            const message = args.join(' ');
            // HGM tile hatalarını filtrele
            if (message.includes('atlas.harita.gov.tr') && (message.includes('403') || message.includes('401') || message.includes('Forbidden'))) {
                return; // Sessizce atla
            }
            originalError.apply(console, args);
        };

        console.warn = (...args) => {
            const message = args.join(' ');
            // HGM tile uyarılarını filtrele
            if (message.includes('atlas.harita.gov.tr')) {
                return; // Sessizce atla
            }
            // Arrow image uyarılarını filtrele (RouteManager'da kullanılıyor ama opsiyonel)
            if (message.includes('arrow') && message.includes('could not be loaded')) {
                return; // Sessizce atla
            }
            originalWarn.apply(console, args);
        };
    }

    setupErrorHandling() {
        this.map.on('error', (e) => {
            // 401 hatalarını sessizce atla (yetkisiz erişim)
            if (e.error && e.error.status === 401) {
                return;
            }

            // Network/CORS hatalarını atla (status 0 = network error, 403 = forbidden)
            if (e.error && (e.error.status === 0 || e.error.status === 403)) {
                return;
            }

            // HGM tile source hatalarını atla (CORS hataları - localhost'ta normal)
            if (e.sourceId && (e.sourceId === 'basemap' || e.sourceId.includes('hgm'))) {
                return;
            }

            // OSM tile hatalarını atla
            if (e.sourceId === 'osm') return;

            // CSS/style hatalarını atla
            const msg = e.error?.message || '';
            if (msg.includes('unknown property') || msg.includes('paint') || msg.includes('layout')) return;

            // CORS/network hata mesajlarını atla
            if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) return;

            // Gerçek hataları logla
            console.error('[MapComponent] Harita hatası:', e);
        });
    }

    // ========================================
    // NAVİGASYON
    // ========================================

    flyTo(coords, zoom, options = {}) {
        if (!this.map || !Array.isArray(coords)) return;

        let center;
        let calculatedZoom = zoom;

        if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            center = [...coords]; // Kopya oluştur
        } else if (coords.length > 0 && Array.isArray(coords[0])) {
            const bounds = MapHelpers.calculateBounds(coords);
            center = [
                (bounds.minLng + bounds.maxLng) / 2,
                (bounds.minLat + bounds.maxLat) / 2
            ];
            if (!zoom) {
                calculatedZoom = MapHelpers.calculateZoomForBounds(bounds);
            }
        } else {
            return;
        }

        // Eğer offset varsa, koordinatı manuel olarak kaydır
        // offsetY pozitif değer = marker yukarıda görünür (lat değeri azaltılır)
        if (options.offsetY) {
            // Zoom seviyesine göre lat offset hesapla
            // Zoom 12'de ~0.05 derece ≈ ekranın %30'u kadar
            const zoomFactor = Math.pow(2, 12 - (calculatedZoom || 12));
            const latOffset = options.offsetY * zoomFactor;
            center[1] = center[1] - latOffset; // Lat'ı azalt = harita yukarı kayar = marker yukarıda görünür
        }

        this.map.flyTo({
            center: center,
            zoom: calculatedZoom || this.map.getZoom(),
            duration: options.duration || 2000
        });
    }

    // ========================================
    // KATMANLAR
    // ========================================

    async changeBasemap(basemapId) {
        if (!this.layers) return;
        
        const currentMarkers = this.markers.getMarkers();
        const newMarkers = await this.layers.changeBasemap(basemapId, currentMarkers);
        this.markers.setMarkers(newMarkers);
    }

    // ========================================
    // MARKERLAR
    // ========================================

    addMarker(coords, options = {}) {
        return this.markers ? this.markers.addMarker(coords, options) : null;
    }

    addTextMarker(coords, text, options = {}) {
        return this.markers ? this.markers.addTextMarker(coords, text, options) : null;
    }

    getPointCenter(point) {
        if (!point) return null;
        if (point.drawingType === 'text') {
            return this.getTextPointCenter(point);
        }
        if (Array.isArray(point.center) && point.center.length === 2) return point.center;
        const coords = point.coords;
        if (!Array.isArray(coords) || coords.length === 0) return null;

        if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            return coords;
        }

        if (Array.isArray(coords[0])) {
            const validCoords = coords.filter(coord =>
                Array.isArray(coord)
                && coord.length >= 2
                && Number.isFinite(Number(coord[0]))
                && Number.isFinite(Number(coord[1]))
            );
            if (validCoords.length === 0) return null;

            const lngs = validCoords.map(coord => Number(coord[0]));
            const lats = validCoords.map(coord => Number(coord[1]));
            return [
                (Math.min(...lngs) + Math.max(...lngs)) / 2,
                (Math.min(...lats) + Math.max(...lats)) / 2
            ];
        }

        return null;
    }

    getTextPointCenter(point) {
        const markerLngLat = point.marker && typeof point.marker.getLngLat === 'function'
            ? point.marker.getLngLat()
            : null;
        const baseCoords = markerLngLat
            ? [markerLngLat.lng, markerLngLat.lat]
            : point.coords;

        if (!Array.isArray(baseCoords) || baseCoords.length !== 2) return null;

        const hasLeaderLine = point.leaderLine !== false;
        if (hasLeaderLine) {
            return baseCoords;
        }

        if (!this.map || typeof this.map.project !== 'function' || typeof this.map.unproject !== 'function') {
            return baseCoords;
        }

        const domCenter = this.getTextMarkerDomCenter(point.marker);
        if (domCenter) return domCenter;

        const pixel = this.map.project(baseCoords);
        const labelOffsetX = point.marker?._options?.labelOffsetX ?? point.labelOffsetX ?? 0;
        const labelOffsetY = point.marker?._options?.labelOffsetY ?? point.labelOffsetY ?? 0;
        const labelCenter = this.map.unproject([
            pixel.x + Number(labelOffsetX || 0),
            pixel.y + Number(labelOffsetY || 0)
        ]);

        return [labelCenter.lng, labelCenter.lat];
    }

    getTextMarkerDomCenter(marker) {
        if (!marker || typeof marker.getElement !== 'function' || !this.map) return null;

        const markerEl = marker.getElement();
        const labelEl = markerEl?.querySelector?.('.map-text-marker__label');
        const mapCanvas = this.map.getCanvas?.();
        if (!labelEl || !mapCanvas) return null;

        const labelRect = labelEl.getBoundingClientRect();
        const mapRect = mapCanvas.getBoundingClientRect();
        if (!labelRect.width || !labelRect.height) return null;

        const labelCenter = this.map.unproject([
            labelRect.left - mapRect.left + labelRect.width / 2,
            labelRect.top - mapRect.top + labelRect.height / 2
        ]);

        return [labelCenter.lng, labelCenter.lat];
    }

    createActivePulseMarker() {
        if (!this.map || this.activePulseMarker) return;

        const el = document.createElement('div');
        el.className = 'storymap-active-pulse';
        el.innerHTML = '<span class="storymap-active-pulse__ring"></span>';
        el.style.display = 'none';

        this.activePulseMarker = new maplibregl.Marker({
            element: el,
            anchor: 'center'
        })
            .setLngLat([0, 0])
            .addTo(this.map);
    }

    setActivePulseForPoint(point) {
        if (!this.map) return;

        const center = this.getPointCenter(point);
        if (!center) {
            this.clearActivePulse();
            return;
        }

        if (!this.activePulseMarker) {
            this.createActivePulseMarker();
        }

        const el = this.activePulseMarker?.getElement();
        if (!el) return;

        this.activePulseMarker.setLngLat(center);
        el.style.display = 'block';
    }

    clearActivePulse() {
        const el = this.activePulseMarker?.getElement();
        if (el) {
            el.style.display = 'none';
        }
    }

    enableMarkerMode(callback) {
        if (this.drawing) this.drawing.disableMode(); // Diğer modları kapat
        if (this.markers) this.markers.enableMarkerMode(callback);
    }

    // ========================================
    // ÇİZİM
    // ========================================

    enablePolygonMode(callback) {
        this.disableAllModes();
        if (this.drawing) this.drawing.enablePolygonMode(callback);
    }

    enableRouteMode(callback) {
        this.disableAllModes();
        if (this.drawing) this.drawing.enableRouteMode(callback);
    }

    enableLineMode(callback) {
        this.disableAllModes();
        if (this.drawing) this.drawing.enableLineMode(callback);
    }

    enableRectangleMode(callback) {
        this.disableAllModes();
        if (this.drawing) this.drawing.enableRectangleMode(callback);
    }

    enableCircleMode(callback) {
        this.disableAllModes();
        if (this.drawing) this.drawing.enableCircleMode(callback);
    }

    enableTextMode(callback, onFinish) {
        this.disableAllModes();
        if (this.drawing) this.drawing.enableTextMode(callback, onFinish);
    }

    updateDrawingColor(layerId, color, drawingType) {
        return this.drawing ? this.drawing.updateDrawingColor(layerId, color, drawingType) : false;
    }

    disableAllModes() {
        if (this.markers) this.markers.disableMode();
        if (this.drawing) this.drawing.disableMode();
    }

    // ========================================
    // ROTA YÖNETİMİ
    // ========================================

    async addRoutePoint(point) {
        if (this.routeManager) {
            return await this.routeManager.addRoutePoint(point);
        }
        return null;
    }

    async connectAllRoutePoints(points) {
        if (this.routeManager) {
            return await this.routeManager.connectAllPoints(points);
        }
        return null;
    }

    parseCSV(csvText) {
        if (this.routeManager) {
            return this.routeManager.parseCSV(csvText);
        }
        return [];
    }

    getRouteColorForDay(day) {
        if (this.routeManager) {
            return this.routeManager.getColorForDay(day);
        }
        return '#3b82f6';
    }

    getRouteTotalDistance() {
        if (this.routeManager) {
            return this.routeManager.getTotalDistance();
        }
        return 0;
    }

    getRouteDaySummary() {
        if (this.routeManager) {
            return this.routeManager.getDaySummary();
        }
        return [];
    }

    getRouteDisplacement() {
        if (this.routeManager) {
            return this.routeManager.getDisplacement();
        }
        return 0;
    }

    getRouteBearingAngle() {
        if (this.routeManager) {
            return this.routeManager.getBearingAngle();
        }
        return 0;
    }

    // ========================================
    // TIMELINE YÖNETİMİ
    // ========================================

    addTimelineEvent(event) {
        if (this.timelineManager) {
            return this.timelineManager.addEvent(event);
        }
        return null;
    }

    getTimelineEvents() {
        if (this.timelineManager) {
            return this.timelineManager.events;
        }
        return [];
    }

    getTimelineColorForCategory(category) {
        if (this.timelineManager) {
            return this.timelineManager.getColorForCategory(category);
        }
        return '#6b7280';
    }

    getTimelineColorForImportance(importance) {
        if (this.timelineManager) {
            return this.timelineManager.getColorForImportance(importance);
        }
        return '#d1d5db';
    }

    getTimelineStatistics() {
        if (this.timelineManager) {
            return this.timelineManager.getStatistics();
        }
        return null;
    }

    connectAllTimelineEvents(events) {
        if (this.timelineManager) {
            return this.timelineManager.connectAllEvents(events);
        }
        return null;
    }

    startTimelinePlayback(speed, onEventFocus) {
        if (this.timelineManager) {
            this.timelineManager.startPlayback(speed, onEventFocus);
        }
    }

    stopTimelinePlayback() {
        if (this.timelineManager) {
            this.timelineManager.stopPlayback();
        }
    }

    nextTimelineEvent(onEventFocus) {
        if (this.timelineManager) {
            return this.timelineManager.nextEvent(onEventFocus);
        }
        return null;
    }

    previousTimelineEvent(onEventFocus) {
        if (this.timelineManager) {
            return this.timelineManager.previousEvent(onEventFocus);
        }
        return null;
    }

    filterTimelineByDateRange(startDate, endDate) {
        if (this.timelineManager) {
            return this.timelineManager.filterByDateRange(startDate, endDate);
        }
        return [];
    }

    filterTimelineByCategory(categories) {
        if (this.timelineManager) {
            return this.timelineManager.filterByCategory(categories);
        }
        return [];
    }

    filterTimelineByImportance(minImportance) {
        if (this.timelineManager) {
            return this.timelineManager.filterByImportance(minImportance);
        }
        return [];
    }

    getTimelineMilestones() {
        if (this.timelineManager) {
            return this.timelineManager.getMilestones();
        }
        return [];
    }

    // ========================================
    // VERİ VE TEMİZLİK
    // ========================================

    getData() {
        const data = {
            center: this.map.getCenter().toArray(),
            zoom: this.map.getZoom(),
            template: this.options.templateKey, // Template key'i kaydet
            markers: this.markers ? this.markers.getMarkers().map((m, i) => ({
                id: i,
                coords: m.getLngLat().toArray()
            })) : [],
            polygons: this.drawing ? this.drawing.polygons : [],
            routes: this.drawing ? this.drawing.routes : []
        };

        // Rota verisi ekle
        if (this.routeManager) {
            data.routePoints = this.routeManager.routePoints;
            data.totalDistance = this.routeManager.getTotalDistance();
            data.daySummary = this.routeManager.getDaySummary();
        }

        // Timeline verisi ekle
        if (this.timelineManager) {
            data.timelineEvents = this.timelineManager.events;
            data.timelineStatistics = this.timelineManager.getStatistics();
        }

        return data;
    }

    // ========================================
    // MEASUREMENT (ÖLÇÜM) ARAÇLARI
    // ========================================

    /**
     * Mesafe ölçüm aracını aktifleştir
     */
    activateDistanceMeasurement() {
        // Diğer araçları deaktive et
        this.disableAllModes();
        if (this.areaMeasurement) this.areaMeasurement.deactivate();
        
        if (this.distanceMeasurement) {
            this.distanceMeasurement.resetState();
            this.distanceMeasurement.activate();
        }
    }

    /**
     * Alan ölçüm aracını aktifleştir
     */
    activateAreaMeasurement() {
        // Diğer araçları deaktive et
        this.disableAllModes();
        if (this.distanceMeasurement) this.distanceMeasurement.deactivate();
        
        if (this.areaMeasurement) {
            this.areaMeasurement.resetState();
            this.areaMeasurement.activate();
        }
    }

    /**
     * Tüm ölçüm araçlarını deaktive et
     */
    deactivateMeasurementTools() {
        if (this.distanceMeasurement) this.distanceMeasurement.deactivate();
        if (this.areaMeasurement) this.areaMeasurement.deactivate();
    }

    /**
     * Tüm ölçümleri temizle
     */
    clearAllMeasurements() {
        if (this.distanceMeasurement) this.distanceMeasurement.clearAll();
        if (this.areaMeasurement) this.areaMeasurement.clearAll();
        if (this.measurementTool) this.measurementTool.deactivate();
    }

    /**
     * Ölçüm verilerini al
     */
    getMeasurementData() {
        return {
            distance: this.distanceMeasurement ? this.distanceMeasurement.getData() : null,
            area: this.areaMeasurement ? this.areaMeasurement.getData() : null,
            measurement: this.measurementTool ? this.measurementTool.getData() : null
        };
    }

    /**
     * OneSoil benzeri ölçüm aracını aktifleştir
     */
    activateMeasurementTool() {
        // Diğer araçları deaktive et
        this.disableAllModes();
        if (this.distanceMeasurement) this.distanceMeasurement.deactivate();
        if (this.areaMeasurement) this.areaMeasurement.deactivate();
        
        if (this.measurementTool) {
            this.measurementTool.activate();
        }
    }

    /**
     * OneSoil benzeri ölçüm aracını deaktive et
     */
    deactivateMeasurementTool() {
        if (this.measurementTool) {
            this.measurementTool.deactivate();
        }
    }

    /**
     * Ölçüm aracı aktif mi?
     */
    isMeasurementToolActive() {
        return this.measurementTool ? this.measurementTool.isActive : false;
    }

    /**
     * View Mode: Sadece editing işlemlerini devre dışı bırak
     * Navigation kontrolleri (zoom, 3D, konum) aktif kalır
     */
    disableInteractions() {
        if (!this.map || !this.viewMode) return;

        // Drawing modülünü devre dışı bırak
        if (this.drawing) {
            this.drawing.enabled = false;
        }

        // Double click zoom'u aç (view mode'da da kullanışlı)
        this.map.doubleClickZoom.enable();

        // Scroll zoom'u aç (view mode'da navigation için gerekli)
        this.map.scrollZoom.enable();

        // Drag pan'i aç (view mode'da navigation için gerekli)
        this.map.dragPan.enable();

        // Keyboard navigation'ı aç
        this.map.keyboard.enable();

        // Toolbar'dan gelen çizim komutlarını ignore et
        this.viewModeActive = true;
    }

    destroy() {
        if (this.activePulseMarker) {
            this.activePulseMarker.remove();
            this.activePulseMarker = null;
        }
        if (this.routeManager) {
            this.routeManager.destroy();
        }
        if (this.timelineManager) {
            this.timelineManager.stopPlayback();
            this.timelineManager.clearEvents();
        }
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}
