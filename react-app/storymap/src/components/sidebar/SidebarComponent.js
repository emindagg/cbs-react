/**
 * SidebarComponent - Modüler yan panel bileşeni
 * 
 * Bu bileşen aşağıdaki modülleri koordine eder:
 * - constants: Sabit değerler (marker stilleri, basemap'ler)
 * - renderers: HTML render fonksiyonları
 * - handlers: Event handler'lar
 * - modules: DetailPanel, Lightbox, PointManager, MediaManager
 */

// Constants
import { 
    MARKER_STYLES, 
    COLOR_PALETTE,
    BASEMAPS, 
    DEFAULT_MAP_SETTINGS 
} from './constants/index.js';

// Renderers
import { 
    renderListView, 
    renderSettingsView, 
    renderDetailView,
    renderPoints
} from './renderers/index.js';

// Handlers
import { 
    setupListViewListeners, 
    setupSettingsListeners, 
    setupDetailListeners 
} from './handlers/index.js';

// Modules
import { DetailPanel, Lightbox, PointManager, MediaManager } from './modules/index.js';

export class SidebarComponent {
    constructor(containerId, data = {}) {
        this.containerId = containerId;
        this.data = data;
        this.container = null;
        this.isOpen = true;
        this.currentView = 'list'; // 'list', 'detail', veya 'settings'
        this.currentTab = 'layers'; // 'layers' veya 'settings'
        this.editingPoint = null;
        this.viewMode = data.viewMode || false; // View mode (salt okunur)
        this.hasSaved = false; // İlk kayıt yapıldı mı?
        
        // Sabitler
        this.markerStyles = MARKER_STYLES;
        this.colorPalette = COLOR_PALETTE;
        this.basemaps = BASEMAPS;
        this.mapSettings = { ...DEFAULT_MAP_SETTINGS };
        
        // Alt modüller
        this.pointManager = new PointManager(this);
        this.mediaManager = new MediaManager(this);
        this.detailPanel = new DetailPanel(this);
        this.lightbox = new Lightbox(this);
        
        // Callback referansları
        this.onDetailCloseCallback = null;
        
        this.init();
    }

    // ========================================
    // GETTER'LAR (Geriye uyumluluk için)
    // ========================================
    
    get points() {
        return this.pointManager.points;
    }
    
    set points(value) {
        this.pointManager.points = value;
    }

    // ========================================
    // YAŞAM DÖNGÜSÜ
    // ========================================

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        this.container = container;

        // View mode: container'a class ekle
        if (this.viewMode) {
            this.container.classList.add('sidebar--view-mode');
        }

        this.render();

        // Timeline şablonunda mobilde sidebar yandan açılsın
        const templateName = this.data?.templateName || '';
        const templateType = this.data?.mapData?.template || '';
        this._isTimelineTemplate = (templateName === 'Timeline Bazlı' || templateType === 'timeline');
        this._applyTimelineMode();
    }

    // ========================================
    // RENDER
    // ========================================

    render() {
        const context = this.getContext();

        if (this.currentView === 'detail' && this.editingPoint) {
            if (this.currentTab === 'settings') {
                this.container.innerHTML = renderSettingsView(context);
                setupSettingsListeners(this);
            } else {
                this.container.innerHTML = renderDetailView(context);
                setupDetailListeners(this);
            }
        } else if (this.currentView === 'settings') {
            this.container.innerHTML = renderSettingsView(context);
            setupSettingsListeners(this);
        } else {
            this.container.innerHTML = renderListView(context);
            setupListViewListeners(this);
        }

        this._applyTimelineMode();
    }

    _applyTimelineMode() {
        if (!this._isTimelineTemplate) return;
        const sidebar = this.container.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.add('sidebar--timeline-mode');
            if (window.innerWidth <= 768 && this.isOpen) {
                const tc = document.getElementById('timelinejs-container');
                if (tc) tc.style.display = 'none';
            }
        }
    }

    /**
     * Render context'i oluşturur
     */
    getContext() {
        return {
            data: this.data,
            isOpen: this.isOpen,
            points: this.points,
            editingPoint: this.editingPoint,
            mapSettings: this.mapSettings,
            basemaps: this.basemaps,
            markerStyles: this.markerStyles,
            colorPalette: this.colorPalette,
            routeData: this.routeData || {}, // Rota verileri
            timelineData: this.timelineData || {}, // Timeline verileri
            viewMode: this.viewMode, // View mode flag
            hasSaved: this.hasSaved // Save button state
        };
    }

    /**
     * Rota verilerini güncelle (dışarıdan çağrılacak)
     */
    updateRouteData(routeData) {
        this.routeData = routeData;
        this.render();
    }

    /**
     * Timeline verilerini güncelle (dışarıdan çağrılacak)
     */
    updateTimelineData(timelineData) {
        this.timelineData = timelineData;
        this.render();
    }

    // ========================================
    // GÖRÜNÜM YÖNETİMİ
    // ========================================

    showPointDetail(pointId, onCloseCallback = null) {
        const point = this.pointManager.findPoint(pointId);
        if (!point) {
            console.error('[SidebarComponent] showPointDetail: Point not found:', pointId);
            return;
        }
        
        // Deep copy yap - marker referansını hariç tut (circular reference önleme)
        const pointCopy = {
            id: point.id,
            title: point.title,
            description: point.description,
            coords: point.coords ? [...point.coords] : null,
            color: point.color,
            icon: point.icon,
            style: point.style,
            shape: point.shape,
            isNumber: point.isNumber,
            number: point.number,
            zoom: point.zoom,
            media: point.media ? point.media.map(m => ({ ...m })) : [],
            // Rota alanları
            visitDay: point.visitDay,
            duration: point.duration,
            timestamp: point.timestamp,
            // Timeline alanları
            date: point.date,
            time: point.time,
            category: point.category,
            importance: point.importance,
            era: point.era,
            historicalContext: point.historicalContext,
            // Çizim öğesi alanları
            isDrawing: point.isDrawing,
            drawingType: point.drawingType,
            mapLayerId: point.mapLayerId,
            radius: point.radius,
            text: point.text,
            textStyle: point.textStyle,
            textPlacement: point.textPlacement,
            leaderLine: point.leaderLine,
            leaderLineStyle: point.leaderLineStyle,
            labelOffsetX: point.labelOffsetX,
            labelOffsetY: point.labelOffsetY
        };
        
        this.editingPoint = pointCopy;
        this.editingPoint.originalId = point.id;

        // Varsayılan değerler
        if (!this.editingPoint.media) this.editingPoint.media = [];
        if (!this.editingPoint.style) this.editingPoint.style = 'default';
        if (!this.editingPoint.icon) this.editingPoint.icon = 'fa-map-marker-alt';
        if (!this.editingPoint.color) this.editingPoint.color = '#ef4444';
        if (!this.editingPoint.shape) this.editingPoint.shape = 'circle';

        // Timeline varsayılan değerleri
        if (!this.editingPoint.category) this.editingPoint.category = 'Other';
        if (!this.editingPoint.importance) this.editingPoint.importance = 1;
        if (this.editingPoint.drawingType === 'text') {
            if (!this.editingPoint.textStyle) this.editingPoint.textStyle = 'boxed';
            if (!this.editingPoint.textPlacement) this.editingPoint.textPlacement = 'right';
            if (this.editingPoint.leaderLine === undefined) this.editingPoint.leaderLine = false;
            if (!this.editingPoint.leaderLineStyle) this.editingPoint.leaderLineStyle = 'solid';
            if (!this.editingPoint.text) this.editingPoint.text = '';
        }
        
        console.log('[SidebarComponent] showPointDetail: Editing point', {
            originalId: this.editingPoint.originalId,
            id: point.id,
            title: this.editingPoint.title
        });
        
        this.currentView = 'detail';
        this.currentTab = 'layers';
        this.onDetailCloseCallback = onCloseCallback;
        this.render();
    }

    showListView() {
        const closingPoint = this.editingPoint;

        if (this.onPointTextPreviewReset && closingPoint?.drawingType === 'text' && closingPoint.originalId) {
            this.onPointTextPreviewReset(closingPoint.originalId);
        }

        this.currentView = 'list';
        this.currentTab = 'layers';
        this.editingPoint = null;
        
        if (this.onDetailCloseCallback) {
            this.onDetailCloseCallback();
            this.onDetailCloseCallback = null;
        }
        
        this.render();
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const sidebar = this.container.querySelector('.sidebar');
        const toggleBtn = this.container.querySelector('#sidebar-toggle');
        const toggleIcon = toggleBtn?.querySelector('i');
        const isMobile = window.innerWidth <= 768;
        const isTimelineMode = sidebar?.classList.contains('sidebar--timeline-mode');

        const timelineContainer = document.getElementById('timelinejs-container');
        const timelinePreview = document.querySelector('.timeline-preview');

        if (this.isOpen) {
            sidebar?.classList.remove('sidebar--closed');
            if (isMobile && !isTimelineMode) {
                if (toggleIcon) toggleIcon.className = 'fa-solid fa-chevron-down';
            } else {
                if (toggleIcon) toggleIcon.className = 'fa-solid fa-chevron-left';
                const sidebarWidth = sidebar ? sidebar.offsetWidth : 315;
                const toggleWidth = 30;
                if (timelineContainer) {
                    if (isMobile && isTimelineMode) {
                        timelineContainer.style.display = 'none';
                    } else {
                        timelineContainer.style.left = (sidebarWidth + toggleWidth + 5) + 'px';
                    }
                }
                if (timelinePreview) timelinePreview.style.left = (sidebarWidth + toggleWidth) + 'px';
            }
        } else {
            sidebar?.classList.add('sidebar--closed');
            if (isMobile && !isTimelineMode) {
                if (toggleIcon) toggleIcon.className = 'fa-solid fa-chevron-up';
            } else {
                if (toggleIcon) toggleIcon.className = 'fa-solid fa-chevron-right';
                if (timelineContainer) {
                    if (isTimelineMode) {
                        timelineContainer.style.display = 'block';
                        timelineContainer.style.left = isMobile ? '0' : '10px';
                    } else {
                        timelineContainer.style.display = 'none';
                    }
                }
                if (timelinePreview) timelinePreview.style.left = '0';
            }
        }
    }

    // ========================================
    // NOKTA İŞLEMLERİ
    // ========================================

    addPoint(pointData) {
        const point = this.pointManager.addPoint(pointData);
        this.updatePointsList();
        return point;
    }

    addDrawing(drawingData) {
        const drawing = this.pointManager.addDrawing(drawingData);
        this.updatePointsList();
        return drawing;
    }

    removePoint(pointId) {
        this.pointManager.removePoint(pointId);
        this.updatePointsList();
    }

    updatePointsList() {
        const pointsContainer = this.container.querySelector('#sidebar-points');
        if (pointsContainer) {
            const isRouteTemplate = this.data.templateName === 'Rota Bazlı';
            pointsContainer.innerHTML = renderPoints(this.points, isRouteTemplate);
            setupListViewListeners(this);
        }

        const countEl = this.container.querySelector('.sidebar__section-count');
        if (countEl) {
            countEl.textContent = this.points.length;
        }
    }

    // ========================================
    // STİL İŞLEMLERİ
    // ========================================

    selectColor(color) {
        this.editingPoint.color = color;

        if (this.onPointStyleUpdate && this.editingPoint.originalId) {
            const originalPoint = this.pointManager.findPoint(this.editingPoint.originalId);
            if (originalPoint) {
                const tempUpdate = {
                    ...originalPoint,
                    color: color,
                    isDrawing: originalPoint.isDrawing,
                    drawingType: originalPoint.drawingType,
                    mapLayerId: originalPoint.mapLayerId
                };
                this.onPointStyleUpdate(tempUpdate);
            }
        }

        this.render();
    }

    selectStyle(styleId) {
        this.pointManager.applyStyle(this.editingPoint, styleId);
        
        if (this.onPointStyleUpdate && this.editingPoint.originalId) {
            const originalPoint = this.pointManager.findPoint(this.editingPoint.originalId);
            if (originalPoint) {
                const tempUpdate = {
                    ...originalPoint,
                    color: this.editingPoint.color,
                    icon: this.editingPoint.icon,
                    shape: this.editingPoint.shape,
                    isNumber: this.editingPoint.isNumber,
                    number: this.editingPoint.number,
                    isDrawing: originalPoint.isDrawing,
                    drawingType: originalPoint.drawingType,
                    mapLayerId: originalPoint.mapLayerId
                };
                this.onPointStyleUpdate(tempUpdate);
            }
        }
        
        this.render();
    }

    // ========================================
    // KAYDETME İŞLEMLERİ
    // ========================================

    savePointDetail() {
        if (!this.editingPoint) {
            console.warn('[SidebarComponent] savePointDetail: No editing point');
            return;
        }

        // Undefined veya geçersiz editingPoint kontrolü
        if (!this.editingPoint.originalId || !this.editingPoint.id) {
            console.error('[SidebarComponent] savePointDetail: Invalid editing point (undefined id)', this.editingPoint);
            this.showListView(); // Detay panelini kapat
            return;
        }

        const pointIndex = this.pointManager.findPointIndex(this.editingPoint.originalId);
        console.log('[SidebarComponent] savePointDetail:', {
            originalId: this.editingPoint.originalId,
            foundIndex: pointIndex,
            title: this.editingPoint.title
        });

        if (pointIndex > -1) {
            const originalPoint = this.points[pointIndex];
            const updatedPoint = {
                ...originalPoint,
                title: this.editingPoint.title,
                description: this.editingPoint.description,
                media: this.editingPoint.media,
                style: this.editingPoint.style,
                color: this.editingPoint.color,
                icon: this.editingPoint.icon,
                shape: this.editingPoint.shape,
                isNumber: this.editingPoint.isNumber,
                number: this.editingPoint.number,
                zoom: this.editingPoint.zoom,
                isDrawing: originalPoint.isDrawing,
                drawingType: originalPoint.drawingType,
                mapLayerId: originalPoint.mapLayerId,
                coords: originalPoint.coords, // Koordinatları koru
                // Rota bilgileri
                visitDay: this.editingPoint.visitDay,
                duration: this.editingPoint.duration,
                timestamp: this.editingPoint.timestamp,
                // Timeline bilgileri
                date: this.editingPoint.date,
                time: this.editingPoint.time,
                category: this.editingPoint.category,
                importance: this.editingPoint.importance,
                era: this.editingPoint.era,
                historicalContext: this.editingPoint.historicalContext,
                // Text annotation alanları
                text: this.editingPoint.text,
                textStyle: this.editingPoint.textStyle,
                textPlacement: this.editingPoint.textPlacement,
                leaderLine: this.editingPoint.leaderLine,
                leaderLineStyle: this.editingPoint.leaderLineStyle,
                // Sürükleme sonrası label ofseti — marker'dan en güncel değeri al
                labelOffsetX: (this.editingPoint.marker?._options?.labelOffsetX !== undefined)
                    ? this.editingPoint.marker._options.labelOffsetX
                    : this.editingPoint.labelOffsetX,
                labelOffsetY: (this.editingPoint.marker?._options?.labelOffsetY !== undefined)
                    ? this.editingPoint.marker._options.labelOffsetY
                    : this.editingPoint.labelOffsetY
            };

            this.points[pointIndex] = updatedPoint;

            console.log('[SidebarComponent] Point updated:', {
                id: updatedPoint.id,
                title: updatedPoint.title,
                index: pointIndex
            });

            if (this.onPointStyleUpdate) {
                this.onPointStyleUpdate(updatedPoint);
            }

            // Timeline data güncelleme
            if (this.onGetTimelineData) {
                const timelineData = this.onGetTimelineData();
                this.updateTimelineData(timelineData);
            }
        } else {
            console.error('[SidebarComponent] savePointDetail: Point not found at index:', pointIndex);
        }

        const callback = this.onDetailCloseCallback;
        this.onDetailCloseCallback = null;

        this.showListView();

        if (callback) callback();
    }

    deleteCurrentPoint() {
        if (!this.editingPoint) return;
        
        const pointId = this.editingPoint.originalId;
        const point = this.pointManager.findPoint(pointId);
        
        if (this.onActionAdd && point) {
            this.onActionAdd({
                type: 'delete_point',
                data: { ...point }
            });
        }
        
        // Marker'ı kaldır
        if (point && point.marker) {
            point.marker.remove();
        }
        
        // Haritadan çizimi kaldır (line, polygon, circle, text vb.)
        if (point && point.mapLayerId && this.onDrawingDelete) {
            this.onDrawingDelete(point.mapLayerId);
        }
        
        this.removePoint(pointId);
        
        const callback = this.onDetailCloseCallback;
        this.onDetailCloseCallback = null;
        
        this.showListView();
        
        if (callback) callback();
    }

    // ========================================
    // AKSİYON YÖNETİMİ
    // ========================================

    handlePointAction(action, pointId) {
        const pointIndex = this.pointManager.findPointIndex(pointId);
        const point = this.points[pointIndex];
        
        switch (action) {
            case 'focus':
                if (this.onPointFocus && point) this.onPointFocus(point);
                break;
            case 'edit':
                this.showPointDetail(pointId);
                break;
            case 'openDetail':
                this.detailPanel.open(pointIndex);

                // Timeline şablonunda: listede "Detay" butonuna tıklanınca
                // TimelineJS slaytını da aynı index'e getir (senkronizasyon).
                if (typeof this.onTimelineDetailNavigate === 'function') {
                    try {
                        this.onTimelineDetailNavigate(pointIndex, point);
                    } catch (e) {
                        console.error('[SidebarComponent] onTimelineDetailNavigate error:', e);
                    }
                }
                break;
            case 'delete':
                if (confirm('Bu noktayı silmek istediğinize emin misiniz?')) {
                    if (this.onActionAdd && point) {
                        this.onActionAdd({
                            type: 'delete_point',
                            data: { ...point }
                        });
                    }
                    
                    if (point && point.marker) {
                        point.marker.remove();
                    }
                    this.removePoint(pointId);
                }
                break;
        }
    }

    handleStepAction(action, stepId) {
        switch (action) {
            case 'focus':
                if (this.onStepFocus) this.onStepFocus(stepId);
                break;
            case 'edit':
                if (this.onStepEdit) this.onStepEdit(stepId);
                break;
            case 'delete':
                if (this.onStepDelete) this.onStepDelete(stepId);
                break;
        }
    }

    // ========================================
    // DETAY PANELİ (Geriye uyumluluk)
    // ========================================

    openDetailPanel(pointIndex) {
        this.detailPanel.open(pointIndex);
    }

    closeDetailPanel() {
        this.detailPanel.close();
    }

    // ========================================
    // LIGHTBOX (Geriye uyumluluk)
    // ========================================

    openImageLightbox() {
        const images = this.detailPanel.point?.media || [];
        this.lightbox.open(images, this.detailPanel.currentImageIndex);
    }

    // ========================================
    // YARDIMCI METODLAR
    // ========================================

    updateData(newData) {
        this.data = { ...this.data, ...newData };
        this.render();
    }

    updateSteps(steps) {
        this.data.steps = steps;
        const stepsContainer = this.container.querySelector('#sidebar-steps');
        if (stepsContainer) {
            this.render();
        }
    }

    getMapSettings() {
        return this.mapSettings;
    }

    getNextNumber() {
        return this.pointManager.getNextNumber();
    }

    /**
     * Kaydet butonunun metnini güncelle (ilk kayıttan sonra "Güncelle" olur)
     */
    updateSaveButtonText() {
        if (!this.hasSaved) {
            this.hasSaved = true;

            // Tüm save butonlarını bul ve güncelle
            const saveButtons = this.container.querySelectorAll('#btn-save, #btn-save-point');
            saveButtons.forEach(btn => {
                const textSpan = btn.querySelector('span');
                const icon = btn.querySelector('i');

                if (textSpan) {
                    textSpan.textContent = 'Güncelle';
                }

                // İkonu değiştir (save → sync)
                if (icon && icon.classList.contains('fa-save')) {
                    icon.classList.remove('fa-save');
                    icon.classList.add('fa-sync-alt');
                }
            });
        }
    }
}
