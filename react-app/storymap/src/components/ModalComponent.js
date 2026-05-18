import { templates } from '../data/templates.js';
import { MapComponent } from './MapComponent.js';
import { SidebarComponent } from './SidebarComponent.js';
import { ToolbarComponent } from './ToolbarComponent.js';
import { TimelineJSWrapper } from './timeline/TimelineJSWrapper.js';
import { StoryMapComponent } from './storymap/StoryMapComponent.js';
import { storageManager } from '../utils/storageManager.js';
import { customPrompt } from '../utils/customPrompt.js';
import { toast } from '../utils/toast.js';
import { apiService } from '../services/apiService.js';

export class ModalComponent {
    constructor(elementId, options = {}) {
        // CSS zaten global.css üzerinden yükleniyor

        // View mode options
        this.viewMode = options.viewMode || false;
        this.storyData = options.storyData || null;

        this.container = document.getElementById(elementId);
        this.inputs = {
            title: document.getElementById('input-title'),
            desc: document.getElementById('input-desc'),
            template: document.getElementById('template-select'),
            btn: document.getElementById('btn-start')
        };

        // Mockup elementleri
        this.mockups = document.querySelectorAll('.mockup');

        // View mode ise listener'ları kurma (modal zaten gizli olacak)
        if (!this.viewMode) {
            this.setupListeners();
        }
    }

    setupListeners() {
        // Olay dinleyicileri referanslarını sakla (destroy sırasında temizleyebilmek için)
        this.onTitleInput = (e) => {
            this.updateMockupTitle(e.target.value || 'Yeni Hikâye');
            // Yazı yazılınca hata mesajını gizle
            if (e.target.value.trim()) {
                this.hideTitleError();
            }
        };

        this.onDescInput = (e) => {
            this.updateMockupDesc(e.target.value || 'Açıklama burada görünecek...');
        };

        this.onTemplateChange = (e) => {
            this.updateMockup(e.target.value);
        };

        this.onBtnClick = () => this.startGame();

        this.onTitleKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.startGame();
            }
        };

        if (this.inputs.title) {
            this.inputs.title.addEventListener('input', this.onTitleInput);
            this.inputs.title.addEventListener('keydown', this.onTitleKeydown);
        }
        if (this.inputs.desc) {
            this.inputs.desc.addEventListener('input', this.onDescInput);
        }
        if (this.inputs.template) {
            this.inputs.template.addEventListener('change', this.onTemplateChange);
        }
        if (this.inputs.btn) {
            this.inputs.btn.addEventListener('click', this.onBtnClick);
        }

        // İlk yüklemede mockup'ı göster
        if (this.inputs.template) {
            this.updateMockup(this.inputs.template.value);
        }
    }

    /**
     * Seçilen şablona göre mockup'ı değiştirir
     * @param {String} templateKey - Şablon anahtarı (point, storymap, route, timeline)
     */
    updateMockup(templateKey) {
        // Tüm mockup'ları gizle
        this.mockups.forEach(mockup => {
            mockup.classList.add('hidden');
        });

        // Seçili mockup'ı göster
        const activeMockup = document.querySelector(`[data-mockup="${templateKey}"]`);
        if (activeMockup) {
            activeMockup.classList.remove('hidden');
        }

        // Mevcut başlık ve açıklamayı yeni mockup'a uygula
        const currentTitle = this.inputs.title.value || 'Yeni Hikâye';
        const currentDesc = this.inputs.desc.value || 'Açıklama burada görünecek...';
        this.updateMockupTitle(currentTitle);
        this.updateMockupDesc(currentDesc);
    }

    /**
     * Aktif mockup'ın başlığını günceller
     * @param {String} title - Başlık metni
     */
    updateMockupTitle(title) {
        const templateKey = this.inputs.template.value;
        const titleEl = document.getElementById(`preview-title-${templateKey}`);
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    /**
     * Aktif mockup'ın açıklamasını günceller
     * @param {String} desc - Açıklama metni
     */
    updateMockupDesc(desc) {
        const templateKey = this.inputs.template.value;
        const descEl = document.getElementById(`preview-desc-${templateKey}`);
        if (descEl) {
            descEl.textContent = desc;
        }
    }

    startGame(storyData = null) {
        // Story data varsa (view veya edit mode), oradan bilgileri al
        let title, desc, templateKey;

        if (storyData || this.storyData) {
            const data = storyData || this.storyData;
            title = data.title;
            desc = data.desc;
            templateKey = data.mapData?.template || 'point';
        } else {
            // Yeni harita: form'dan bilgileri al
            title = this.inputs.title.value.trim();
            desc = this.inputs.desc.value;
            templateKey = this.inputs.template.value;

            if (!title) {
                this.showTitleError();
                return;
            } else {
                this.hideTitleError();
            }
        }

        // Seçilen template'i sakla (onSave callback'inde kullanılacak)
        this.selectedTemplate = templateKey;

        // Modalı gizle
        this.container.style.display = 'none';

        // Template bilgilerini al
        const template = templates[templateKey];

        // Harita container'ını göster
        const mapContainer = document.getElementById('map-container');
        const sidebarContainer = document.getElementById('sidebar-container');

        if (mapContainer && sidebarContainer) {
            mapContainer.style.display = 'block';
            sidebarContainer.style.display = 'block';

            // Template bilgilerini al
            const template = templates[templateKey];
            const initialCoords = template?.steps?.[0]?.coords || [35.0, 39.0];
            const initialZoom = template?.steps?.[0]?.zoom || 6;

            // Haritayı başlat (template bilgisi ile)
            this.mapComponent = new MapComponent('map-container', {
                center: initialCoords,
                zoom: initialZoom,
                template: template,
                templateKey: templateKey, // Template key'i geçir (point, route, timeline, storymap)
                viewMode: this.viewMode
            });

            // Sidebar'ı başlat
            this.sidebarComponent = new SidebarComponent('sidebar-container', {
                title: title,
                desc: desc,
                templateName: template?.name || 'Nokta Eklenen',
                steps: template?.steps || [],
                template: template, // Template config'i sidebar'a geçir
                viewMode: this.viewMode
            });

            this.sidebarComponent.onGetCurrentZoom = () => {
                if (this.mapComponent && this.mapComponent.map) {
                    return Math.round(this.mapComponent.map.getZoom());
                }
                return 14;
            };

            // Eğer mevcut harita açılıyorsa, hasSaved flag'ini true yap
            // (ilk render'da buton "Güncelle" olarak gösterilecek)
            if (storyData || this.storyData) {
                this.sidebarComponent.hasSaved = true;
            }

            // Toolbar'ı başlat ve göster (edit mode'da her zaman, view mode'da storymap hariç)
            const isStoryMapTemplate = templateKey === 'storymap';
            const showToolbar = !this.viewMode || (this.viewMode && !isStoryMapTemplate);

            if (showToolbar) {
                this.toolbarComponent = new ToolbarComponent(this.viewMode);
                this.toolbarComponent.init(this.mapComponent, this.sidebarComponent, this.viewMode);
                this.toolbarComponent.show();

                // Paylaşmadan önce kaydetme callback'i (sadece edit mode'da)
                if (!this.viewMode && this.toolbarComponent.actionManager) {
                    this.toolbarComponent.actionManager.onBeforeShare = async () => {
                        if (this.sidebarComponent && this.sidebarComponent.onSave) {
                            await this.sidebarComponent.onSave();
                        }
                    };
                }

                // Undo/Redo için SidebarComponent callback'i
                this.sidebarComponent.onActionAdd = (action) => {
                    this.toolbarComponent.addAction(action);
                };
            }

            // Çizim silme callback'i (line, polygon, circle, text vb.)
            this.sidebarComponent.onDrawingDelete = (mapLayerId) => {
                if (this.mapComponent && this.mapComponent.map) {
                    const map = this.mapComponent.map;
                    // Layer'ları kaldır
                    if (map.getLayer(`${mapLayerId}-layer`)) map.removeLayer(`${mapLayerId}-layer`);
                    if (map.getLayer(`${mapLayerId}-outline`)) map.removeLayer(`${mapLayerId}-outline`);
                    // Source'u kaldır
                    if (map.getSource(mapLayerId)) map.removeSource(mapLayerId);

                    // Mapbox Draw'dan da sil (eğer aktif çizim modundaysa veya oradaysa)
                    if (this.mapComponent.draw) {
                        try {
                            this.mapComponent.draw.delete(mapLayerId);
                            // Seçim modunu temizle
                            if (this.mapComponent.draw.getMode() === 'direct_select') {
                                this.mapComponent.draw.changeMode('simple_select');
                            }
                        } catch (e) {
                            console.error('[ModalComponent] Mapbox Draw delete error:', e);
                        }
                    }

                    // Aktif çizim/düzenleme olay dinleyicilerini kaldır
                    if (this._onDrawUpdateHandler) {
                        map.off('draw.update', this._onDrawUpdateHandler);
                        map.off('draw.selectionchange', this._onDrawUpdateHandler);
                        this._onDrawUpdateHandler = null;
                    }
                }
            };

            // TimelineJS'i başlat (timeline template için)
            const isTimelineTemplate = template?.type === 'timeline';
            if (isTimelineTemplate) {
                this.timelineJS = new TimelineJSWrapper('timeline-embed', {
                    config: {
                        title: title,
                        description: desc
                    },
                    timelineOptions: {
                        language: 'tr',
                        font: 'default',
                        timenav_height: 150
                    },
                    onSlideChange: (uniqueId, slideNumber) => {
                        // Event ID'yi çıkar (format: event_12345)
                        const eventId = uniqueId ? uniqueId.replace('event_', '') : null;

                        // İlgili point'i bul ve haritaya uç
                        if (eventId) {
                            // Hem string hem number olarak dene (ID formatı farklı olabilir)
                            let point = this.sidebarComponent.points.find(p => p.id === eventId);
                            if (!point) {
                                point = this.sidebarComponent.points.find(p => p.id.toString() === eventId);
                            }
                            if (!point) {
                                point = this.sidebarComponent.points.find(p => p.id === parseInt(eventId));
                            }

                            if (point && point.coords) {
                                // Timeline paneli 400px, marker'ın görünür alanda kalması için padding ekliyoruz
                                this.mapComponent.flyTo(point.coords, this.getPointZoom(point, 12), {
                                    duration: 1000,
                                        offsetY: 0.025
                                });

                                // Active state güncelle
                                const eventItems = document.querySelectorAll('.timeline__event-item');
                                eventItems.forEach(item => item.classList.remove('timeline__event-item--active'));
                                const activeItem = document.querySelector(`[data-event-id="${eventId}"]`);
                                if (activeItem) {
                                    activeItem.classList.add('timeline__event-item--active');
                                }
                            }
                        }
                    }
                });

                // TimelineJS container'ını göster
                const timelineContainer = document.getElementById('timelinejs-container');
                if (timelineContainer) {
                    timelineContainer.style.display = 'block';
                }
            }

            // Harita yüklendikten sonra callback'leri bağla
            this.mapComponent.onMapLoad(() => {
                // View mode: Etkileşimleri devre dışı bırak
                if (this.viewMode) {
                    this.mapComponent.disableInteractions();
                }

                // Story data varsa yükle (view mode veya edit mode fark etmez)
                if (storyData || this.storyData) {
                    this.loadStoryForViewMode(storyData || this.storyData);
                }

                this.setupSidebarCallbacks();

                // Timeline template için TimelineJS'i initialize et
                if (isTimelineTemplate && this.timelineJS) {
                    // İlk event'leri yükle
                    const initialEvents = this.sidebarComponent.points || [];
                    this.timelineJS.initialize(initialEvents, {
                        title: title,
                        description: desc
                    });
                }

                // Normal mode: Eğer var olan bir story açılıyorsa, SharePanel'e ID'yi geçir
                if (!this.viewMode && storyData && storyData.id) {
                    if (this.toolbarComponent && this.toolbarComponent.actionManager) {
                        this.toolbarComponent.actionManager.sharePanel.setStoryId(storyData.id);
                    }
                }
            });
        }
    }

    getPointZoom(point, fallbackZoom) {
        const zoom = Number(point?.zoom);
        if (!Number.isFinite(zoom)) return fallbackZoom;
        return Math.max(1, Math.min(18, zoom));
    }

    getTextMarkerOptions(point) {
        return {
            textStyle: point?.textStyle || 'boxed',
            textPlacement: point?.textPlacement || 'left',
            leaderLine: point?.leaderLine !== false,
            leaderLineStyle: point?.leaderLineStyle || 'gradient',
            anchorColor: point?.color || '#334155',
            leaderColor: point?.color || '#334155',
            labelOffsetX: point?.labelOffsetX !== undefined ? point.labelOffsetX : null,
            labelOffsetY: point?.labelOffsetY !== undefined ? point.labelOffsetY : null
        };
    }

    updateTextMarker(point) {
        if (!point || !point.coords || !this.mapComponent) return null;

        const targetPoint = point.originalId
            ? this.sidebarComponent?.pointManager?.findPoint(point.originalId)
            : point;
        const renderPoint = targetPoint ? { ...targetPoint, ...point } : point;

        // Eski marker'dan sürükleme ofsetini kaydet (silinmeden önce)
        // Ancak belirtme çizgisi durumu değiştiyse (örn: açılıp kapandıysa), yeni ofsetlerin uygulanabilmesi için eski değeri koruma
        const oldLeaderLine = targetPoint?.marker?._options?.leaderLine === true;
        const newLeaderLine = renderPoint.leaderLine === true;
        const leaderLineChanged = oldLeaderLine !== newLeaderLine;

        if (!leaderLineChanged && targetPoint?.marker?._options?.labelOffsetX !== undefined) {
            renderPoint.labelOffsetX = targetPoint.marker._options.labelOffsetX;
            renderPoint.labelOffsetY = targetPoint.marker._options.labelOffsetY;
        }

        if (targetPoint?.marker) {
            if (this.mapComponent.markers?.removeMarker) {
                this.mapComponent.markers.removeMarker(targetPoint.marker);
            } else {
                targetPoint.marker.remove();
            }
            targetPoint.marker = null;
        }

        const text = renderPoint.text || renderPoint.title || 'Metin';
        const marker = this.mapComponent.addTextMarker(renderPoint.coords, text, this.getTextMarkerOptions(renderPoint));
        
        if (marker && marker.getElement()) {
            marker.getElement().addEventListener('click', (e) => {
                if (this.sidebarComponent && !this.sidebarComponent.viewMode) {
                    const idToEdit = targetPoint?.id || point?.id;
                    if (idToEdit) {
                        this.sidebarComponent.showPointDetail(idToEdit);
                        e.stopPropagation(); // Try to prevent other map clicks
                    }
                }
            });
        }

        if (targetPoint) {
            targetPoint.marker = marker;
        }
        if (point !== targetPoint) {
            point.marker = marker;
        }
        return marker;
    }

    setupSidebarCallbacks() {
        if (!this.sidebarComponent || !this.mapComponent) return;

        const isPointTemplate = this.sidebarComponent.data.templateName === 'Nokta Eklenen';
        const isRouteTemplate = this.sidebarComponent.data.templateName === 'Rota Bazlı';
        const isTimelineTemplate = this.sidebarComponent.data.templateName === 'Timeline Bazlı';
        const isStoryMapTemplate = this.sidebarComponent.data.templateName === 'Hikâye Haritası';
        const defaultPointZoom = (isTimelineTemplate || isStoryMapTemplate) ? 12 : 14;

        this.sidebarComponent.onPointZoomPreview = (point, zoom) => {
            if (!point || !point.coords || this.viewMode) return;
            const isMobile = window.innerWidth <= 768;
            this.mapComponent.flyTo(point.coords, this.getPointZoom({ zoom }, defaultPointZoom), {
                duration: 300,
                offsetY: isMobile ? 0.02 : 0.025
            });
        };

        // Harita zoom değişimini dinle ve detay panelindeki slider'ı güncelle
        if (this.mapComponent.map) {
            this.mapComponent.map.on('zoom', () => {
                if (
                    this.sidebarComponent &&
                    this.sidebarComponent.currentView === 'detail' &&
                    this.sidebarComponent.editingPoint
                ) {
                    const mapZoom = Math.round(this.mapComponent.map.getZoom());
                    const zoom = Math.max(1, Math.min(18, mapZoom));

                    if (this.sidebarComponent.editingPoint.zoom !== zoom) {
                        this.sidebarComponent.editingPoint.zoom = zoom;

                        const zoomInput = document.getElementById('point-zoom');
                        if (zoomInput) {
                            zoomInput.value = zoom;
                        }

                        const zoomValueText = document.getElementById('point-zoom-value');
                        if (zoomValueText) {
                            zoomValueText.textContent = zoom;
                        }
                    }
                }
            });
        }

        // ----------------------------------------
        // Noktaları/Çizimleri Düzenleme Başlangıcı
        // ----------------------------------------
        this.sidebarComponent.onPointEditStart = (point) => {
            if (!point || this.viewMode) return;

            // console.log('[ModalComponent] onPointEditStart:', point);

            // Çizim öğesi ise (line, polygon, circle, rectangle)
            if (point.isDrawing && point.mapLayerId) {
                // Haritadaki salt okunur katmanı geçici olarak gizle
                const map = this.mapComponent.map;
                if (map) {
                    const layersToHide = [`${point.mapLayerId}-layer`, `${point.mapLayerId}-outline`];
                    layersToHide.forEach(lyrId => {
                        if (map.getLayer(lyrId)) {
                            map.setLayoutProperty(lyrId, 'visibility', 'none');
                        }
                    });
                }

                // Mapbox GL Draw modülünü kontrol et
                if (this.mapComponent.draw) {
                    this.mapComponent.draw.deleteAll(); // Temizle

                    // GeoJSON formatına dönüştür ve ekle
                    let geometryType = 'Polygon';
                    let coords = point.coords;
                    if (point.drawingType === 'line') {
                        geometryType = 'LineString';
                    } else {
                        // Poligon, circle, rectangle için Mapbox Draw [[x, y], ...] şeklinde poligon bekler
                        coords = [point.coords];
                    }

                    const feature = {
                        id: point.mapLayerId,
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: geometryType,
                            coordinates: coords
                        }
                    };

                    this.mapComponent.draw.add(feature);

                    // direct_select moduna geç ve bu çizimi seç
                    setTimeout(() => {
                        try {
                            this.mapComponent.draw.changeMode('direct_select', {
                                featureId: point.mapLayerId
                            });
                            // console.log('[ModalComponent] Mapbox Draw direct_select mode activated for:', point.mapLayerId);
                        } catch (e) {
                            console.error('[ModalComponent] Mapbox Draw changeMode error:', e);
                        }
                    }, 100);

                    // Vertex değişikliklerini dinleyen event listener'ı tanımla
                    this._onDrawUpdateHandler = (e) => {
                        const features = this.mapComponent.draw.getAll().features;
                        const currentFeature = features.find(f => f.id === point.mapLayerId);
                        if (currentFeature && currentFeature.geometry) {
                            let newCoords = currentFeature.geometry.coordinates;
                            if (point.drawingType !== 'line') {
                                // Poligon ise ilk halkayı al
                                newCoords = newCoords[0];
                            }
                            // Sidebar'daki editingPoint koordinatlarını güncelle
                            if (this.sidebarComponent.editingPoint) {
                                this.sidebarComponent.editingPoint.coords = newCoords;
                            }
                            // console.log('[ModalComponent] Draw updated. New coords:', newCoords);
                        }
                    };

                    this.mapComponent.map.on('draw.update', this._onDrawUpdateHandler);
                    this.mapComponent.map.on('draw.selectionchange', this._onDrawUpdateHandler);
                }
            } 
            // Normal veya Metin marker ise
            else if (point.marker) {
                // Sürüklemeyi aç
                point.marker.setDraggable(true);
                // console.log('[ModalComponent] Marker setDraggable: true');

                // Sürükleme sonunu dinle
                this._currentMarkerDragEndHandler = () => {
                    const newLngLat = point.marker.getLngLat();
                    const newCoords = [newLngLat.lng, newLngLat.lat];
                    
                    if (this.sidebarComponent.editingPoint) {
                        this.sidebarComponent.editingPoint.coords = newCoords;
                    }
                    // console.log('[ModalComponent] Marker dragged. New coords:', newCoords);

                    // Eğer metin marker ise lider çizgisini vb. güncelle
                    if (point.drawingType === 'text') {
                        // sidebar'daki editingPoint'i kullan
                        const tempPoint = {
                            ...this.sidebarComponent.editingPoint,
                            coords: newCoords
                        };
                        this.updateTextMarker(tempPoint);
                    }
                };

                point.marker.on('dragend', this._currentMarkerDragEndHandler);
            }
        };

        // ----------------------------------------
        // Noktaları/Çizimleri Düzenleme Bitişi (Kaydet, İptal veya Sil)
        // ----------------------------------------
        this.sidebarComponent.onPointEditEnd = (point) => {
            if (!point || this.viewMode) return;

            // console.log('[ModalComponent] onPointEditEnd:', point);

            // Çizim öğesi ise
            if (point.isDrawing && point.mapLayerId) {
                // Event listener'ları kaldır
                if (this._onDrawUpdateHandler) {
                    this.mapComponent.map.off('draw.update', this._onDrawUpdateHandler);
                    this.mapComponent.map.off('draw.selectionchange', this._onDrawUpdateHandler);
                    this._onDrawUpdateHandler = null;
                }

                // Mapbox Draw'dan sil
                if (this.mapComponent.draw) {
                    this.mapComponent.draw.deleteAll();
                }

                // Haritadaki read-only katmanı güncelle ve görünür yap
                if (point.coords) {
                    const source = this.mapComponent.map.getSource(point.mapLayerId);
                    if (source) {
                        let geometryType = 'Polygon';
                        let coords = point.coords;
                        if (point.drawingType === 'line') {
                            geometryType = 'LineString';
                        } else {
                            coords = [point.coords];
                        }

                        source.setData({
                            type: 'Feature',
                            geometry: {
                                type: geometryType,
                                coordinates: coords
                            }
                        });
                    }
                }

                const map = this.mapComponent.map;
                if (map) {
                    const layersToShow = [`${point.mapLayerId}-layer`, `${point.mapLayerId}-outline`];
                    layersToShow.forEach(lyrId => {
                        if (map.getLayer(lyrId)) {
                            map.setLayoutProperty(lyrId, 'visibility', 'visible');
                        }
                    });
                }
            } 
            // Normal veya Metin marker ise
            else if (point.marker) {
                // Sürüklemeyi kapat
                point.marker.setDraggable(false);

                if (this._currentMarkerDragEndHandler) {
                    point.marker.off('dragend', this._currentMarkerDragEndHandler);
                    this._currentMarkerDragEndHandler = null;
                }

                // İptal edildiyse orijinal koordinatlarına geri döndür
                if (point.coords) {
                    point.marker.setLngLat(point.coords);
                    if (point.drawingType === 'text') {
                        this.updateTextMarker(point);
                    }
                }
            }
        };

        this.sidebarComponent.onPointTextPreview = (point) => {
            if (!point || !point.coords || this.viewMode) return;
            if (point.drawingType !== 'text') return;

            this.updateTextMarker(point);
        };

        this.sidebarComponent.onPointTextPreviewReset = (pointId) => {
            if (!pointId || this.viewMode) return;
            const originalPoint = this.sidebarComponent.pointManager.findPoint(pointId);
            if (originalPoint && originalPoint.drawingType === 'text') {
                this.updateTextMarker(originalPoint);
            }
        };

        // Rota şablonu için özel callback'ler
        if (isRouteTemplate) {
            // Rota noktası eklendiğinde marker oluştur (kullanıcı rengini kullan)
            this.sidebarComponent.onRoutePointAdd = async (point) => {
                const color = point.color || '#ef4444'; // Kullanıcının seçtiği renk veya varsayılan

                // Marker ekle (tooltip ile)
                const marker = this.mapComponent.addMarker(point.coords, {
                    color: color,
                    icon: point.icon || 'fa-map-marker-alt',
                    shape: point.shape || 'circle',
                    isNumber: true,
                    number: point.number || 1,
                    popup: `<div style="font-weight: 600; color: #374151;">${point.title}</div>`
                });

                // RouteManager'a ekle
                const routePoint = {
                    id: point.id,
                    coords: point.coords,
                    visitDay: point.visitDay,
                    duration: point.duration,
                    timestamp: point.timestamp,
                    distanceToNext: null
                };

                await this.mapComponent.addRoutePoint(routePoint);

                // Point'e marker referansını ekle
                point.marker = marker;
                point.color = color;

                // Marker'a click event ekle - detail panel aç
                marker.getElement().addEventListener('click', () => {
                    if (point.id) {
                        this.sidebarComponent.showPointDetail(point.id);
                    }
                });

                return point;
            };

            // Tüm rota noktalarını bağla
            this.sidebarComponent.onConnectAllPoints = async () => {
                // Sadece normal marker'ları al, çizim öğelerini (isDrawing: true) hariç tut
                const points = this.sidebarComponent.points
                    .filter(p => !p.isDrawing)
                    .map(p => ({
                        id: p.id,
                        coords: p.coords,
                        visitDay: p.visitDay || 1,
                        duration: p.duration,
                        timestamp: p.timestamp
                    }));

                await this.mapComponent.connectAllRoutePoints(points);
            };

            // Get route data callback
            this.sidebarComponent.onGetRouteData = () => {
                // Sadece normal marker'ları say, çizim öğelerini hariç tut
                const routePoints = this.sidebarComponent.points.filter(p => !p.isDrawing);
                const hasPoints = routePoints.length >= 2;
                return {
                    totalDistance: this.mapComponent.getRouteTotalDistance(),
                    daySummary: this.mapComponent.getRouteDaySummary(),
                    displacement: this.mapComponent.getRouteDisplacement(),
                    bearingAngle: this.mapComponent.getRouteBearingAngle(),
                    hasPoints: hasPoints
                };
            };

            // Noktaya odaklan (rota şablonu için)
            this.sidebarComponent.onPointFocus = (point) => {
                if (point && point.coords) {
                    const isMobile = window.innerWidth <= 768;
                    this.mapComponent.flyTo(point.coords, this.getPointZoom(point, 14), isMobile ? { offsetY: 0.02 } : {});

                    // Tüm popup'ları kapat
                    this.sidebarComponent.points.forEach(p => {
                        if (p.marker && p.marker.getPopup() && p.marker.getPopup().isOpen()) {
                            p.marker.togglePopup();
                        }
                    });

                    // Seçili popup'ı aç
                    if (point.marker && point.marker.getPopup()) {
                        if (!point.marker.getPopup().isOpen()) {
                            point.marker.togglePopup();
                        }
                    }

                    this._setActiveMarkerBorder(point);
                }
            };

            // Mesafe güncellemelerini dinle ve sidebar'ı güncelle
            this.mapComponent.onRouteDistanceUpdate = (totalDistance) => {
                const routePoints = this.sidebarComponent.points.filter(p => !p.isDrawing);
                const hasPoints = routePoints.length >= 2;

                this.sidebarComponent.updateRouteData({
                    totalDistance: totalDistance,
                    daySummary: this.mapComponent.getRouteDaySummary(),
                    displacement: this.mapComponent.getRouteDisplacement(),
                    bearingAngle: this.mapComponent.getRouteBearingAngle(),
                    hasPoints: hasPoints
                });
            };

            // Route temizleme callback'i (nokta silindiğinde kullanılır)
            this.sidebarComponent.onClearRoute = () => {
                if (this.mapComponent.routeManager) {
                    this.mapComponent.routeManager.removeRouteLine();
                    this.mapComponent.routeManager.routePoints = [];
                } else {
                    console.warn('[ModalComponent] RouteManager not found');
                }
            };
        }

        // Timeline şablonu için özel callback'ler
        if (isTimelineTemplate) {
            // Timeline event eklendiğinde marker oluştur
            this.sidebarComponent.onTimelineEventAdd = (event) => {
                // Kategori veya önem seviyesine göre renk belirle
                const templateConfig = this.sidebarComponent.data.template || {};
                const colorMode = templateConfig.timelineColorMode || 'category';

                let color;
                if (colorMode === 'importance') {
                    color = this.mapComponent.getTimelineColorForImportance(event.importance || 1);
                } else {
                    color = this.mapComponent.getTimelineColorForCategory(event.category || 'Other');
                }

                // Marker ekle
                const marker = this.mapComponent.addMarker(event.coords, {
                    color: color,
                    icon: event.importance === 5 ? 'fa-star' : 'fa-clock',
                    shape: 'circle',
                    popup: `<div style="font-weight: 600; color: #374151;">${event.title}</div>
                            <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${event.date || ''}</div>`
                });

                // TimelineManager'a ekle
                this.mapComponent.addTimelineEvent({
                    id: event.id,
                    coords: event.coords,
                    date: event.date,
                    time: event.time,
                    category: event.category,
                    importance: event.importance,
                    era: event.era,
                    historicalContext: event.historicalContext
                });

                // Event'e marker referansını ekle
                event.marker = marker;
                event.color = color;

                // TimelineJS'i güncelle - GEÇİCİ OLARAK DEVRE DIŞI (freeze sorunu)
                if (this.timelineJS && false) {  // false ile devre dışı
                    this.timelineJS.updateEvents(this.sidebarComponent.points);
                }

                return event;
            };

            // Timeline istatistiklerini al
            this.sidebarComponent.onGetTimelineData = () => {
                return {
                    statistics: this.mapComponent.getTimelineStatistics()
                };
            };

            // Tüm timeline event'lerini haritada bağla (kesikli çizgi ile)
            this.sidebarComponent.onConnectAllTimelineEvents = () => {
                const events = this.sidebarComponent.points
                    .filter(p => !p.isDrawing)  // Çizim öğelerini hariç tut
                    .map(p => ({
                        id: p.id,
                        coords: p.coords,
                        date: p.date,
                        category: p.category,
                        importance: p.importance
                    }));

                this.mapComponent.connectAllTimelineEvents(events);
            };

            // TimelineJS'i manuel yenileme
            let isRefreshing = false;  // Çift tıklama önleme
            this.sidebarComponent.onRefreshTimelineJS = () => {
                // Zaten yenileniyorsa atla
                if (isRefreshing) {
                    toast.warning('Timeline zaten yenileniyor, lütfen bekleyin');
                    return;
                }

                if (!this.sidebarComponent.points || this.sidebarComponent.points.length === 0) {
                    toast.warning('Event Gerekli', 'Yenilemek için en az bir event ekleyin.');
                    return;
                }

                if (!this.timelineJS) {
                    toast.error('Timeline Hatası', 'Timeline başlatılamadı. Sayfayı yenileyin.');
                    return;
                }

                isRefreshing = true;
                const refreshBtn = document.querySelector('[data-action="refresh-timelinejs"]');
                if (refreshBtn) {
                    refreshBtn.disabled = true;
                    refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Yükleniyor...</span>';
                }

                // Timeout ile güvenli güncelleme
                setTimeout(() => {
                    try {
                        this.timelineJS.updateEvents(this.sidebarComponent.points);

                        // Haritadaki event'leri de bağla (kesikli çizgi ile)
                        if (this.sidebarComponent.onConnectAllTimelineEvents) {
                            this.sidebarComponent.onConnectAllTimelineEvents();
                        }

                        // Başarılı mesajı
                        if (refreshBtn) {
                            refreshBtn.innerHTML = '<i class="fa-solid fa-check"></i><span>Başarılı!</span>';
                            setTimeout(() => {
                                refreshBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i><span>Yenile</span>';
                                refreshBtn.disabled = false;
                                isRefreshing = false;
                            }, 1000);
                        }
                    } catch (error) {
                        toast.error(`Timeline yenilenirken hata: ${error.message}`);

                        if (refreshBtn) {
                            refreshBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i><span>Yenile</span>';
                            refreshBtn.disabled = false;
                        }
                        isRefreshing = false;
                    }
                }, 100);  // 100ms bekle, UI'ın güncellenmesini sağla
            };

            // Timeline playback başlat (TimelineJS kullanıldığı için sadece harita odaklaması)
            this.sidebarComponent.onTimelinePlaybackStart = () => {
                const templateConfig = this.sidebarComponent.data.template || {};
                const speed = templateConfig.playbackSpeed || 2000;

                this.mapComponent.startTimelinePlayback(speed, (event, index) => {
                    // Event'e odaklan
                    const point = this.sidebarComponent.points.find(p => p.id === event.id);
                    if (point) {
                        // Haritada zoom yap
                        this.mapComponent.flyTo(point.coords, this.getPointZoom(point, 12), {
                                    duration: 1000,
                                    offsetY: 0.025
                                });

                        // TimelineJS'i de güncelle
                        if (this.timelineJS) {
                            this.timelineJS.goToSlide(index);
                        }

                        // Active state ekle (sidebar'daki timeline item'lar için)
                        const eventItems = document.querySelectorAll('.timeline__event-item');
                        eventItems.forEach(item => item.classList.remove('timeline__event-item--active'));
                        const activeItem = document.querySelector(`[data-event-id="${event.id}"]`);
                        if (activeItem) activeItem.classList.add('timeline__event-item--active');

                        this._setActiveMarkerBorder(point);
                    }
                });
            };

            // Timeline playback durdur
            this.sidebarComponent.onTimelinePlaybackStop = () => {
                this.mapComponent.stopTimelinePlayback();

                // Active state'leri temizle
                const eventItems = document.querySelectorAll('.timeline__event-item');
                eventItems.forEach(item => item.classList.remove('timeline__event-item--active'));

                this._setActiveMarkerBorder(null);
            };

            // Sonraki event'e git
            this.sidebarComponent.onTimelineNextEvent = () => {
                this.mapComponent.nextTimelineEvent((event, index) => {
                    const point = this.sidebarComponent.points.find(p => p.id === event.id);
                    if (point) {
                        this.mapComponent.flyTo(point.coords, this.getPointZoom(point, 12), {
                                    duration: 1000,
                                    offsetY: 0.025
                                });

                        // TimelineJS'i de güncelle
                        if (this.timelineJS) {
                            this.timelineJS.goToSlide(index);
                        }

                        // Active state güncelle
                        const eventItems = document.querySelectorAll('.timeline__event-item');
                        eventItems.forEach(item => item.classList.remove('timeline__event-item--active'));
                        const activeItem = document.querySelector(`[data-event-id="${event.id}"]`);
                        if (activeItem) activeItem.classList.add('timeline__event-item--active');

                        this._setActiveMarkerBorder(point);
                    }
                });
            };

            // Önceki event'e git
            this.sidebarComponent.onTimelinePreviousEvent = () => {
                const event = this.mapComponent.previousTimelineEvent((event, index) => {
                    const point = this.sidebarComponent.points.find(p => p.id === event.id);
                    if (point) {
                        this.mapComponent.flyTo(point.coords, this.getPointZoom(point, 12), {
                                    duration: 1000,
                                    offsetY: 0.025
                                });

                        // TimelineJS'i de güncelle
                        if (this.timelineJS) {
                            this.timelineJS.goToSlide(index);
                        }

                        // Active state güncelle
                        const eventItems = document.querySelectorAll('.timeline__event-item');
                        eventItems.forEach(item => item.classList.remove('timeline__event-item--active'));
                        const activeItem = document.querySelector(`[data-event-id="${event.id}"]`);
                        if (activeItem) activeItem.classList.add('timeline__event-item--active');

                        this._setActiveMarkerBorder(point);
                    }
                });
            };

            // Detail panel navigasyonu (1 / N ileri-geri) ile TimelineJS slaytını senkronize et
            this.sidebarComponent.onTimelineDetailNavigate = (pointIndex, point) => {
                if (this.timelineJS) {
                    this.timelineJS.goToSlide(pointIndex);
                }
                if (point) this._setActiveMarkerBorder(point);
            };

            // Event'e odaklan
            this.sidebarComponent.onPointFocus = (point) => {
                if (point && point.coords) {
                    const isMobile = window.innerWidth <= 768;
                    this.mapComponent.flyTo(point.coords, this.getPointZoom(point, 12), {
                        duration: 1000,
                        offsetY: isMobile ? 0.02 : 0.025
                    });

                    // Tüm popup'ları kapat
                    this.sidebarComponent.points.forEach(p => {
                        if (p.marker && p.marker.getPopup() && p.marker.getPopup().isOpen()) {
                            p.marker.togglePopup();
                        }
                    });

                    // Seçili popup'ı aç
                    if (point.marker && point.marker.getPopup()) {
                        if (!point.marker.getPopup().isOpen()) {
                            point.marker.togglePopup();
                        }
                    }

                    this._setActiveMarkerBorder(point);
                }
            };
        }

        // Nokta Eklenen ve StoryMap şablonu için özel callback'ler
        if (isPointTemplate || isStoryMapTemplate) {
            // Marker ekleme callback'i (import için gerekli)
            this.sidebarComponent.onPointAdd = (point) => {
                // Çizim öğeleri için bu validasyonu atla (onlar zaten import sırasında işlendi)
                const isDrawing = point.isDrawing || !!point.drawingType;

                if (isDrawing) {
                    return point;
                }
                
                // Marker için koordinat kontrolü
                if (!point.coords || !Array.isArray(point.coords) || point.coords.length !== 2) {
                    console.warn('[onPointAdd] Invalid coords format', point.coords);
                    return point;
                }

                const lng = Number(point.coords[0]);
                const lat = Number(point.coords[1]);
                
                if (isNaN(lng) || isNaN(lat) || !isFinite(lng) || !isFinite(lat)) {
                    console.warn('[onPointAdd] Invalid coords values', point.coords);
                    return point;
                }

                try {
                    // Marker oluştur
                    const marker = this.mapComponent.addMarker([lng, lat], {
                        color: point.color || '#ef4444',
                        icon: point.icon || 'fa-map-marker-alt',
                        shape: point.shape || 'circle',
                        isNumber: point.isNumber || false,
                        number: point.number || 1,
                        popup: point.title ? `<div style="font-weight: 600; color: #374151;">${point.title}</div>` : null
                    });

                    point.marker = marker;

                    // Marker'a click event ekle - detail panel aç
                    marker.getElement().addEventListener('click', () => {
                        if (point.id) {
                            this.sidebarComponent.showPointDetail(point.id);
                        }
                    });
                } catch (err) {
                    console.error('[onPointAdd] Failed to create marker:', err, point);
                }
                
                return point;
            };

            // Noktaya odaklan
            this.sidebarComponent.onPointFocus = (point) => {
                if (point && point.coords) {
                    const isMobile = window.innerWidth <= 768;
                    this.mapComponent.flyTo(point.coords, this.getPointZoom(point, 14), isMobile ? { offsetY: 0.02 } : {});

                    // Tüm popup'ları kapat
                    this.sidebarComponent.points.forEach(p => {
                        if (p.marker && p.marker.getPopup() && p.marker.getPopup().isOpen()) {
                            p.marker.togglePopup();
                        }
                    });

                    // Seçili popup'ı aç
                    if (point.marker && point.marker.getPopup()) {
                        if (!point.marker.getPopup().isOpen()) {
                            point.marker.togglePopup();
                        }
                    }

                    this._setActiveMarkerBorder(point);
                }
            };

        }

        // Point ve Route template otomatik oynatma
        if (isPointTemplate || isRouteTemplate) {
            let pointPlaybackTimer = null;
            let pointPlaybackIndex = 0;
            let pointPlaybackSpeed = 2000; // Varsayılan 2 saniye (1.0x)

            this.sidebarComponent.onPointPlaybackStart = () => {
                pointPlaybackIndex = 0;

                // Mevcut timer'ı temizle
                if (pointPlaybackTimer) {
                    clearInterval(pointPlaybackTimer);
                }

                // Otomatik oynatma başlat
                pointPlaybackTimer = setInterval(() => {
                    const points = this.sidebarComponent.points; // TÜM öğeler (çizimler dahil)

                    if (pointPlaybackIndex < points.length) {
                        const point = points[pointPlaybackIndex];

                        // Noktaya/Çizime odaklan
                        if (point && point.coords) {
                            // Koordinat tipini kontrol et (tek nokta mı, çoklu koordinat mı)
                            let targetCoords = point.coords;

                            // Eğer çizim öğesiyse (array of arrays) merkez noktayı hesapla
                            if (point.isDrawing && Array.isArray(point.coords[0])) {
                                // Line, polygon, vb için merkez hesapla
                                const lngs = point.coords.map(c => c[0]);
                                const lats = point.coords.map(c => c[1]);
                                const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
                                const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
                                targetCoords = [centerLng, centerLat];
                            }

                            this.mapComponent.flyTo(targetCoords, this.getPointZoom(point, 14), {
                                duration: 1000
                            });

                            // Popup aç (sadece marker'lar için)
                            if (!point.isDrawing && point.marker && point.marker.getPopup()) {
                                // Tüm popup'ları kapat
                                points.forEach(p => {
                                    if (p.marker && p.marker.getPopup() && p.marker.getPopup().isOpen()) {
                                        p.marker.togglePopup();
                                    }
                                });

                                // Seçili popup'ı aç
                                if (!point.marker.getPopup().isOpen()) {
                                    point.marker.togglePopup();
                                }
                            }

                            // Sidebar'da highlight
                            const items = document.querySelectorAll('.sidebar__point-item-minimal');
                            items.forEach(item => item.classList.remove('sidebar__point-item--active'));
                            const activeItem = document.querySelector(`[data-point-id="${point.id}"]`);
                            if (activeItem) {
                                activeItem.classList.add('sidebar__point-item--active');
                            }

                            this._setActiveMarkerBorder(point);

                            // DetailPanel senkronizasyonu
                            if (this.sidebarComponent.detailPanel && this.sidebarComponent.detailPanel.isOpen) {
                                // Tüm noktalar içinde index bul (çizimler dahil)
                                const allPointsIndex = this.sidebarComponent.points.findIndex(p => p.id === point.id);
                                if (allPointsIndex !== -1) {
                                    this.sidebarComponent.detailPanel.open(allPointsIndex);
                                }
                            }
                        }

                        pointPlaybackIndex++;
                    } else {
                        // Son noktaya ulaşıldı, durdur
                        if (this.sidebarComponent.onPointPlaybackStop) {
                            this.sidebarComponent.onPointPlaybackStop();
                        }
                    }
                }, pointPlaybackSpeed);
            };

            this.sidebarComponent.onPointPlaybackStop = () => {
                if (pointPlaybackTimer) {
                    clearInterval(pointPlaybackTimer);
                    pointPlaybackTimer = null;
                }
                pointPlaybackIndex = 0;

                // Highlight'ları temizle
                const items = document.querySelectorAll('.sidebar__point-item-minimal');
                items.forEach(item => item.classList.remove('sidebar__point-item--active'));

                this._setActiveMarkerBorder(null);

                // Butonu sıfırla
                const playbackToggle = document.querySelector('#point-playback-toggle');
                if (playbackToggle) {
                    playbackToggle.setAttribute('data-playing', 'false');
                    playbackToggle.innerHTML = '<i class="fa-solid fa-play"></i>';
                    playbackToggle.title = 'Otomatik Oynat';
                }
            };

            this.sidebarComponent.onPointPlaybackSpeedChange = (speed) => {
                // Hız değeri (0.5x = 4000ms, 1.0x = 2000ms, 3.0x = 666ms)
                pointPlaybackSpeed = 2000 / speed;

                // Eğer playback aktifse, yeniden başlat
                const playbackToggle = document.querySelector('#point-playback-toggle');
                if (playbackToggle && playbackToggle.getAttribute('data-playing') === 'true') {
                    if (pointPlaybackTimer) {
                        clearInterval(pointPlaybackTimer);
                    }
                    // Yeni hızla devam et
                    pointPlaybackTimer = setInterval(() => {
                        const points = this.sidebarComponent.points; // TÜM öğeler (çizimler dahil)

                        if (pointPlaybackIndex < points.length) {
                            const point = points[pointPlaybackIndex];

                            if (point && point.coords) {
                                // Koordinat tipini kontrol et
                                let targetCoords = point.coords;

                                // Çizim öğesi için merkez hesapla
                                if (point.isDrawing && Array.isArray(point.coords[0])) {
                                    const lngs = point.coords.map(c => c[0]);
                                    const lats = point.coords.map(c => c[1]);
                                    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
                                    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
                                    targetCoords = [centerLng, centerLat];
                                }

                                this.mapComponent.flyTo(targetCoords, this.getPointZoom(point, 14), {
                                    duration: 1000
                                });

                                // Popup aç (sadece marker'lar için)
                                if (!point.isDrawing && point.marker && point.marker.getPopup()) {
                                    points.forEach(p => {
                                        if (p.marker && p.marker.getPopup() && p.marker.getPopup().isOpen()) {
                                            p.marker.togglePopup();
                                        }
                                    });

                                    if (!point.marker.getPopup().isOpen()) {
                                        point.marker.togglePopup();
                                    }
                                }

                                const items = document.querySelectorAll('.sidebar__point-item-minimal');
                                items.forEach(item => item.classList.remove('sidebar__point-item--active'));
                                const activeItem = document.querySelector(`[data-point-id="${point.id}"]`);
                                if (activeItem) {
                                    activeItem.classList.add('sidebar__point-item--active');
                                }

                                this._setActiveMarkerBorder(point);

                                // DetailPanel senkronizasyonu
                                if (this.sidebarComponent.detailPanel && this.sidebarComponent.detailPanel.isOpen) {
                                    const allPointsIndex = this.sidebarComponent.points.findIndex(p => p.id === point.id);
                                    if (allPointsIndex !== -1) {
                                        this.sidebarComponent.detailPanel.open(allPointsIndex);
                                    }
                                }
                            }

                            pointPlaybackIndex++;
                        } else {
                            if (this.sidebarComponent.onPointPlaybackStop) {
                                this.sidebarComponent.onPointPlaybackStop();
                            }
                        }
                    }, pointPlaybackSpeed);
                }
            };
        }

        // Marker stilini güncelle (her iki şablon için ortak)
        this.sidebarComponent.onPointStyleUpdate = async (point) => {
            // Çizim öğesi mi kontrol et (çizgi, polygon, daire, dikdörtgen, ok)
            if (point.isDrawing && point.mapLayerId) {
                // Çizimin rengini güncelle
                this.mapComponent.updateDrawingColor(
                    point.mapLayerId,
                    point.color || '#3b82f6',
                    point.drawingType
                );
            }
            // Metin açıklaması yeniden çiz
            else if (point.isDrawing && point.drawingType === 'text' && point.coords) {
                this.updateTextMarker(point);
            }
            // Timeline şablonu için özel marker güncelleme
            else if (isTimelineTemplate && point && point.marker) {
                const templateConfig = this.sidebarComponent.data.template || {};
                const colorMode = templateConfig.timelineColorMode || 'category';

                // Rengi yeniden hesapla
                let color;
                if (colorMode === 'importance') {
                    color = this.mapComponent.getTimelineColorForImportance(point.importance || 1);
                } else {
                    color = this.mapComponent.getTimelineColorForCategory(point.category || 'Other');
                }

                const coords = point.marker.getLngLat();
                point.marker.remove();

                const newMarker = this.mapComponent.addMarker([coords.lng, coords.lat], {
                    color: color,
                    icon: point.importance === 5 ? 'fa-star' : 'fa-clock',
                    shape: 'circle',
                    popup: `<div style="font-weight: 600; color: #374151;">${point.title}</div>
                            <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${point.date || ''}</div>`
                });

                point.marker = newMarker;
                point.color = color;

                // SADECE haritadaki çizgiyi güncelle (diğer ağır işlemler KAPALI)
                // addTimelineEvent() ÇAĞRILMIYOR (sortEventsByDate ve recalculateTimeGaps'ı tetikliyor, donma yapıyor)
                if (this.sidebarComponent.onConnectAllTimelineEvents) {
                    const allEvents = this.sidebarComponent.points
                        .filter(p => !p.isDrawing)
                        .map(p => ({
                            id: p.id,
                            coords: p.coords,
                            date: p.date,
                            category: p.category,
                            importance: p.importance
                        }));

                    if (allEvents.length >= 2) {
                        // Çizgiyi güncelle (SADECE bu, diğer işlemler yok)
                        this.mapComponent.connectAllTimelineEvents(allEvents);
                    }
                }

                // Timeline istatistiklerini güncelle (hafif işlem)
                const timelineData = this.sidebarComponent.onGetTimelineData();
                this.sidebarComponent.updateTimelineData(timelineData);

                // TimelineJS'i güncelle - GEÇİCİ OLARAK DEVRE DIŞI (freeze sorunu)
                if (this.timelineJS && false) {  // false ile devre dışı
                    this.timelineJS.updateEvents(this.sidebarComponent.points);
                }
            }
            // Rota şablonu için özel marker güncelleme
            else if (isRouteTemplate && point && point.marker) {
                const coords = point.marker.getLngLat();
                point.marker.remove();

                const newMarker = this.mapComponent.addMarker([coords.lng, coords.lat], {
                    color: point.color || '#ef4444',
                    icon: point.icon || 'fa-map-marker-alt',
                    shape: point.shape || 'circle',
                    isNumber: true,
                    number: point.number || 1,
                    popup: `<div style="font-weight: 600; color: #374151;">${point.title}</div>`
                });

                point.marker = newMarker;

                // Rota çizgilerini ve mesafeleri yeniden hesapla (sadece normal marker'lar)
                const allPoints = this.sidebarComponent.points
                    .filter(p => !p.isDrawing)
                    .map(p => ({
                        id: p.id,
                        coords: p.coords,
                        visitDay: p.visitDay || 1,
                        duration: p.duration,
                        timestamp: p.timestamp
                    }));

                if (allPoints.length >= 2) {
                    const updatedRoutePoints = await this.mapComponent.connectAllRoutePoints(allPoints);

                    // Sidebar points'e distanceToNext değerlerini kopyala
                    if (updatedRoutePoints) {
                        updatedRoutePoints.forEach(routePoint => {
                            const sidebarPoint = this.sidebarComponent.points.find(p => p.id === routePoint.id);
                            if (sidebarPoint) {
                                sidebarPoint.distanceToNext = routePoint.distanceToNext;
                            }
                        });
                    }
                }

                // Route data'yı güncelle
                if (this.sidebarComponent.onGetRouteData) {
                    const routeData = this.sidebarComponent.onGetRouteData();
                    this.sidebarComponent.updateRouteData(routeData);
                }
            }
            // Normal marker (nokta eklenen şablonu)
            else if (point && point.marker) {
                const coords = point.marker.getLngLat();

                // Eski marker'ı kaldır
                point.marker.remove();

                // Yeni marker oluştur (shape ve number bilgisiyle)
                const newMarker = this.mapComponent.addMarker([coords.lng, coords.lat], {
                    color: point.color || '#ef4444',
                    icon: point.icon || 'fa-map-marker-alt',
                    shape: point.shape || 'circle',
                    isNumber: point.isNumber || false,
                    number: point.number || 1
                });

                // Point'in marker referansını güncelle
                point.marker = newMarker;
            }
        };

        // Timeline şablonu için başlangıç event'lerini yükle
        if (isTimelineTemplate && this.sidebarComponent.data.steps) {
            this.sidebarComponent.data.steps.forEach((step, index) => {
                // Event nesnesini oluştur
                const event = {
                    id: step.id || index + 1,
                    title: step.title,
                    description: step.content || '',
                    coords: step.coords,
                    date: step.date,
                    time: step.time,
                    category: step.category || 'Other',
                    importance: step.importance || 1,
                    era: step.era || '',
                    historicalContext: step.historicalContext || '',
                    zoom: step.zoom
                };

                // Sidebar'a point olarak ekle
                this.sidebarComponent.addPoint(event);

                // Marker oluştur ve haritaya ekle
                if (this.sidebarComponent.onTimelineEventAdd) {
                    const updatedEvent = this.sidebarComponent.onTimelineEventAdd(event);
                    // Point'i güncelle
                    const pointIndex = this.sidebarComponent.points.findIndex(p => p.id === event.id);
                    if (pointIndex >= 0) {
                        this.sidebarComponent.points[pointIndex] = { ...this.sidebarComponent.points[pointIndex], ...updatedEvent };
                    }
                }
            });

            // Timeline istatistiklerini güncelle
            if (this.sidebarComponent.onGetTimelineData) {
                const timelineData = this.sidebarComponent.onGetTimelineData();
                this.sidebarComponent.updateTimelineData(timelineData);
            }
        }

        // Kaydet (sadece edit mode'da)
        if (!this.viewMode) {
            this.sidebarComponent.onSave = async () => {
                const data = {
                    id: this.currentStoryId, // undefined for new maps, GUID/number for existing
                    title: this.sidebarComponent.data.title || 'İsimsiz Harita',
                    description: this.sidebarComponent.data.desc || '',
                    templateName: this.selectedTemplate || 'point',
                    mapData: this.mapComponent.getData(),
                    steps: this.sidebarComponent.data.steps || [],
                    points: this.sidebarComponent.points.map(p => ({
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    coords: p.coords,
                    color: p.color,
                    icon: p.icon,
                    shape: p.shape,
                    style: p.style,
                    zoom: p.zoom,
                    media: p.media,
                    // Timeline fields
                    date: p.date,
                    time: p.time,
                    category: p.category,
                    importance: p.importance,
                    era: p.era,
                    historicalContext: p.historicalContext,
                    // Route fields
                    visitDay: p.visitDay,
                    duration: p.duration,
                    timestamp: p.timestamp,
                    distanceToNext: p.distanceToNext,
                    timeToNext: p.timeToNext,
                    // Drawing fields
                    isDrawing: p.isDrawing,
                    drawingType: p.drawingType,
                    mapLayerId: p.mapLayerId,
                    isNumber: p.isNumber,
                    number: p.number,
                    text: p.text,
                    textStyle: p.textStyle,
                    textPlacement: p.textPlacement,
                    leaderLine: p.leaderLine,
                    leaderLineStyle: p.leaderLineStyle
                }))
            };

            try {
                // Save via storageManager (auto-routes to backend or IndexedDB)
                const savedStory = await storageManager.saveMap(data);

                // Update currentStoryId for future saves
                this.currentStoryId = savedStory.id;

                // SharePanel'e story ID'sini geçir
                if (this.toolbarComponent && this.toolbarComponent.actionManager) {
                    this.toolbarComponent.actionManager.sharePanel.setStoryId(savedStory.id);
                }

                // Toast mesajı (ilk kayıt mı güncelleme mi?)
                const isFirstSave = !this.sidebarComponent.hasSaved;
                const toastMessage = isFirstSave ? 'Haritanız başarıyla kaydedildi' : 'Haritanız başarıyla güncellendi';

                // Kaydet butonunu "Güncelle" olarak değiştir (ilk kayıttan sonra)
                this.sidebarComponent.updateSaveButtonText();

                toast.success(toastMessage);
            } catch (e) {
                console.error('[ModalComponent] Save failed:', e);
                toast.error(e.message || 'Kaydetme başarısız oldu');
            }
        };
        } // End of !this.viewMode for onSave

        // Altlık harita değiştirme
        this.sidebarComponent.onBasemapChange = (basemapId) => {
            if (this.mapComponent) {
                this.mapComponent.changeBasemap(basemapId);
            }
        };

        // Dışa aktar (sadece edit mode'da)
        if (!this.viewMode) {
            this.sidebarComponent.onExport = () => {
            // Görseller HARİÇ tüm bilgileri dışa aktar:
            // - Genel başlık ve açıklama
            // - Adımlar (steps)
            // - Noktalar / timeline event'leri (tüm metin ve sayısal alanlar)
            // - Medya için sadece isim + caption (url/base64 hariç)
            // - Harita verisi (marker/çizim/rota/timeline istatistikleri vb.)
            const exportedPoints = (this.sidebarComponent.points || []).map((p) => {
                // Koordinatları array formatına çevir
                let coords = p.coords;
                
                // Çizim öğesi için özel işlem
                if (p.isDrawing && Array.isArray(coords)) {
                    // Polygon/Line: array of arrays - olduğu gibi bırak
                    if (coords.length > 0 && Array.isArray(coords[0])) {
                        coords = coords.map(c => Array.isArray(c) ? [c[0], c[1]] : c);
                    }
                    // Circle/single point: [lng, lat]
                    else if (coords.length === 2 && typeof coords[0] === 'number') {
                        coords = [coords[0], coords[1]];
                    }
                }
                // Normal marker için
                else if (coords && typeof coords === 'object' && !Array.isArray(coords)) {
                    // MapLibre LngLat objesi ise array'e çevir
                    if (coords.lng !== undefined && coords.lat !== undefined) {
                        coords = [coords.lng, coords.lat];
                    } else if (coords.lon !== undefined && coords.lat !== undefined) {
                        coords = [coords.lon, coords.lat];
                    }
                } else if (Array.isArray(coords) && coords.length === 2) {
                    // Zaten array formatında, kopyala
                    coords = [coords[0], coords[1]];
                }

                return {
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    coords: coords,
                    color: p.color,
                    icon: p.icon,
                    shape: p.shape,
                    style: p.style,
                    zoom: p.zoom,
                    isNumber: p.isNumber,
                    number: p.number,
                    // Çizim öğesi alanları
                    isDrawing: p.isDrawing || false,
                    drawingType: p.drawingType,
                    mapLayerId: p.mapLayerId,
                    radius: p.radius,
                    text: p.text,
                    textStyle: p.textStyle,
                    textPlacement: p.textPlacement,
                    leaderLine: p.leaderLine,
                    leaderLineStyle: p.leaderLineStyle,
                    // Rota alanları
                    visitDay: p.visitDay,
                    duration: p.duration,
                    timestamp: p.timestamp,
                    // Timeline alanları
                    date: p.date,
                    time: p.time,
                    category: p.category,
                    importance: p.importance,
                    era: p.era,
                    historicalContext: p.historicalContext,
                    // Medya: sadece metinsel metadata, görsel verisi (url/base64) YOK
                    media: Array.isArray(p.media)
                        ? p.media.map((m) => ({
                              type: m.type,
                              name: m.name,
                              caption: m.caption
                          }))
                        : []
                };
            });

            const data = {
                title: this.sidebarComponent.data.title,
                desc: this.sidebarComponent.data.desc,
                mapData: this.mapComponent.getData(),
                steps: this.sidebarComponent.data.steps,
                points: exportedPoints,
                exportedAt: new Date().toISOString()
            };

            const blob = new Blob(
                [JSON.stringify(data, null, 2)],
                { type: 'application/json' }
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success('Harita JSON dosyası olarak indirildi');
        };

            this.sidebarComponent.onImport = () => {
            // Dosya seçici oluştur
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json,.json';

            input.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const imported = JSON.parse(ev.target.result);

                        // Temel alanları güncelle
                        if (imported.title) {
                            this.sidebarComponent.data.title = imported.title;
                        }
                        if (imported.desc) {
                            this.sidebarComponent.data.desc = imported.desc;
                        }
                        if (Array.isArray(imported.steps)) {
                            // Steps içindeki koordinatları normalize et ve doğrula
                            this.sidebarComponent.data.steps = imported.steps.map(step => {
                                if (step.coords) {
                                    let validCoords = null;
                                    if (Array.isArray(step.coords) && step.coords.length === 2) {
                                        const lng = Number(step.coords[0]);
                                        const lat = Number(step.coords[1]);
                                        if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                            validCoords = [lng, lat];
                                        }
                                    } else if (typeof step.coords === 'object') {
                                        if (step.coords.lng !== undefined && step.coords.lat !== undefined) {
                                            const lng = Number(step.coords.lng);
                                            const lat = Number(step.coords.lat);
                                            if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                                validCoords = [lng, lat];
                                            }
                                        } else if (step.coords.lon !== undefined && step.coords.lat !== undefined) {
                                            const lng = Number(step.coords.lon);
                                            const lat = Number(step.coords.lat);
                                            if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                                validCoords = [lng, lat];
                                            }
                                        }
                                    }
                                    
                                    if (validCoords) {
                                        step.coords = validCoords;
                                    } else {
                                        console.warn(`[Import] Step ${step.id} has invalid coordinates`, step.coords);
                                        delete step.coords; // Geçersiz koordinatı kaldır
                                    }
                                }
                                return step;
                            });
                        }

                        // Noktalar / timeline event'leri ekle
                        if (Array.isArray(imported.points) && imported.points.length > 0) {
                            // Mevcut listeye ekleyelim (kullanıcı genelde boş bir projeye import yapar)
                            imported.points.forEach((p, index) => {
                                // Eksik id varsa basit bir id ver
                                if (!p.id) {
                                    p.id = Date.now() + index;
                                }

                                // Çizim öğesi mi kontrol et
                                // drawingType varsa otomatik olarak çizim kabul et (eski export'lar için)
                                const isDrawing = p.isDrawing === true || !!p.drawingType;
                                
                                // Koordinatları normalize et ve doğrula
                                let validCoords = null;
                                
                                if (isDrawing) {
                                    // Çizim öğeleri için koordinat array of arrays olabilir
                                    if (Array.isArray(p.coords)) {
                                        // Text: Tek nokta olmalı, eğer array of arrays ise ilk noktayı al
                                        if (p.drawingType === 'text' && p.coords.length > 0 && Array.isArray(p.coords[0])) {
                                            const coord = p.coords[0];
                                            const lng = Number(coord[0]);
                                            const lat = Number(coord[1]);
                                            if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                                validCoords = [lng, lat];
                                            }
                                        }
                                        // Polygon/Line: [[lng, lat], [lng, lat], ...]
                                        else if (p.coords.length > 0 && Array.isArray(p.coords[0])) {
                                            validCoords = p.coords.map(coord => {
                                                if (Array.isArray(coord) && coord.length >= 2) {
                                                    return [Number(coord[0]), Number(coord[1])];
                                                }
                                                return null;
                                            }).filter(c => c !== null);
                                            
                                            if (validCoords.length === 0) {
                                                validCoords = null;
                                            }
                                        }
                                        // Obje formatında koordinatlar: [{lng, lat}, {lng, lat}, ...]
                                        else if (p.coords.length > 0 && typeof p.coords[0] === 'object' && !Array.isArray(p.coords[0])) {
                                            validCoords = p.coords.map(coord => {
                                                if (coord && (coord.lng !== undefined || coord.lon !== undefined) && coord.lat !== undefined) {
                                                    const lng = Number(coord.lng || coord.lon);
                                                    const lat = Number(coord.lat);
                                                    if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                                        return [lng, lat];
                                                    }
                                                }
                                                return null;
                                            }).filter(c => c !== null);
                                            
                                            if (validCoords.length === 0) {
                                                validCoords = null;
                                            }
                                        }
                                        // Flat array formatı: [lng1, lat1, lng2, lat2, ...]
                                        else if (p.coords.length > 2 && p.coords.length % 2 === 0 && typeof p.coords[0] === 'number') {
                                            validCoords = [];
                                            for (let i = 0; i < p.coords.length; i += 2) {
                                                const lng = Number(p.coords[i]);
                                                const lat = Number(p.coords[i + 1]);
                                                if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                                    validCoords.push([lng, lat]);
                                                }
                                            }
                                            if (validCoords.length === 0) {
                                                validCoords = null;
                                            }
                                        }
                                        // Circle ve Text: [lng, lat] tek nokta
                                        else if (p.coords.length === 2 && typeof p.coords[0] === 'number') {
                                            const lng = Number(p.coords[0]);
                                            const lat = Number(p.coords[1]);
                                            if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                                validCoords = [lng, lat];
                                            }
                                        }
                                    }
                                } else {
                                    // Normal marker için tek nokta
                                    if (p.coords) {
                                        if (Array.isArray(p.coords) && p.coords.length === 2) {
                                            const lng = Number(p.coords[0]);
                                            const lat = Number(p.coords[1]);
                                            if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                                validCoords = [lng, lat];
                                            }
                                        } else if (typeof p.coords === 'object') {
                                            // Obje formatındaysa array'e çevir
                                            if (p.coords.lng !== undefined && p.coords.lat !== undefined) {
                                                const lng = Number(p.coords.lng);
                                                const lat = Number(p.coords.lat);
                                                if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                                    validCoords = [lng, lat];
                                                }
                                            } else if (p.coords.lon !== undefined && p.coords.lat !== undefined) {
                                                const lng = Number(p.coords.lon);
                                                const lat = Number(p.coords.lat);
                                                if (!isNaN(lng) && !isNaN(lat) && isFinite(lng) && isFinite(lat)) {
                                                    validCoords = [lng, lat];
                                                }
                                            }
                                        }
                                    }
                                }

                                // Koordinat geçersizse bu noktayı atla
                                if (!validCoords) {
                                    console.warn(`[Import] Point ${p.id} (${p.drawingType || 'marker'}) skipped: invalid coordinates`, {
                                        isDrawing: isDrawing,
                                        drawingType: p.drawingType,
                                        coordsType: Array.isArray(p.coords) ? 'array' : typeof p.coords,
                                        coordsLength: Array.isArray(p.coords) ? p.coords.length : 0,
                                        firstElementType: Array.isArray(p.coords) && p.coords[0] ? (Array.isArray(p.coords[0]) ? 'array' : typeof p.coords[0]) : 'none',
                                        coords: p.coords
                                    });
                                    return;
                                }

                                // Geçerli koordinatı ata
                                p.coords = validCoords;

                                // Sidebar listesine ekle
                                const point = this.sidebarComponent.addPoint(p);

                                // Çizim öğesi ise haritaya çizim olarak ekle
                                if (isDrawing && point.drawingType && this.mapComponent.drawing) {
                                    try {
                                        const mapLayerId = point.mapLayerId || `${point.drawingType}-${Date.now()}`;
                                        
                                        switch (point.drawingType) {
                                            case 'polygon':
                                            case 'rectangle':
                                            case 'circle':
                                                // Polygon ve türevleri için drawPolygon kullan
                                                // Poligonun kapalı olduğundan emin ol (ilk nokta == son nokta)
                                                let polygonCoords = [...point.coords];
                                                if (polygonCoords.length > 2) {
                                                    const first = polygonCoords[0];
                                                    const last = polygonCoords[polygonCoords.length - 1];
                                                    // Array karşılaştırması
                                                    const isClosed = first[0] === last[0] && first[1] === last[1];
                                                    
                                                    if (!isClosed) {
                                                        polygonCoords.push(first);
                                                    }
                                                }
                                                this.mapComponent.drawing.drawPolygon(polygonCoords, mapLayerId);
                                                break;
                                            case 'line':
                                            case 'arrow':
                                                // Line ve arrow için drawLine kullan
                                                this.mapComponent.drawing.drawLine(point.coords, mapLayerId);
                                                break;
                                            case 'text':
                                                // Text marker için addTextMarker kullan
                                                const textContent = point.text || point.title || point.description;

                        if (textContent) {
                            let textCoords = point.coords;
                            if (Array.isArray(textCoords[0])) {
                                textCoords = textCoords[0];
                            }
                            const marker = this.mapComponent.addTextMarker(textCoords, textContent, {
                                textStyle: point.textStyle || 'boxed',
                                textPlacement: point.textPlacement || 'left',
                                leaderLine: point.leaderLine !== false,
                                leaderLineStyle: point.leaderLineStyle || 'gradient',
                                anchorColor: point.color || '#334155',
                                leaderColor: point.color || '#334155'
                            });
                                                    if (marker) {
                                                        const idx = this.sidebarComponent.points.findIndex(pt => pt.id === point.id);
                                                        if (idx >= 0) {
                                                            this.sidebarComponent.points[idx].marker = marker;
                                                        }
                                                        if (marker.getElement()) {
                                                            marker.getElement().addEventListener('click', (e) => {
                                                                if (this.sidebarComponent && !this.sidebarComponent.viewMode && point.id) {
                                                                    this.sidebarComponent.showPointDetail(point.id);
                                                                    e.stopPropagation();
                                                                }
                                                            });
                                                        }
                                                    } else {
                                                        console.warn('[Import] Text marker creation failed');
                                                    }
                                                } else {
                                                    console.warn('[Import] Text content is empty, skipping text marker');
                                                }
                                                break;
                                        }
                                        
                                        // Rengi güncelle
                                        if (point.color) {
                                            this.mapComponent.updateDrawingColor(mapLayerId, point.color, point.drawingType);
                                        }
                                        
                                        // Map layer ID'yi point'e kaydet
                                        const idx = this.sidebarComponent.points.findIndex(pt => pt.id === point.id);
                                        if (idx >= 0) {
                                            this.sidebarComponent.points[idx].mapLayerId = mapLayerId;
                                        }
                                    } catch (err) {
                                        console.error(`[Import] Failed to add drawing ${point.drawingType}:`, err);
                                    }
                                    return; // Çizim öğeleri için marker ekleme
                                }

                                // Timeline şablonu ise haritaya marker + timeline event ekle
                                const isTimelineTemplate = this.sidebarComponent.data.templateName === 'Timeline Bazlı';
                                const isRouteTemplate = this.sidebarComponent.data.templateName === 'Rota Bazlı';

                                if (isTimelineTemplate && this.sidebarComponent.onTimelineEventAdd) {
                                    const updatedEvent = this.sidebarComponent.onTimelineEventAdd(point);
                                    // Sidebar points içindeki referansı güncelle
                                    const idx = this.sidebarComponent.points.findIndex(pt => pt.id === point.id);
                                    if (idx >= 0) {
                                        this.sidebarComponent.points[idx] = {
                                            ...this.sidebarComponent.points[idx],
                                            ...updatedEvent
                                        };
                                    }
                                } else if (isRouteTemplate && this.sidebarComponent.onRoutePointAdd) {
                                    this.sidebarComponent.onRoutePointAdd(point);
                                } else if (this.sidebarComponent.onPointAdd) {
                                    // Nokta Eklenen ve Hikâye Haritası şablonları için marker ekle
                                    const updatedPoint = this.sidebarComponent.onPointAdd(point);
                                    // Sidebar points içindeki referansı güncelle
                                    const idx = this.sidebarComponent.points.findIndex(pt => pt.id === point.id);
                                    if (idx >= 0) {
                                        this.sidebarComponent.points[idx] = {
                                            ...this.sidebarComponent.points[idx],
                                            ...updatedPoint
                                        };
                                    }
                                }
                            });

                            // Timeline istatistikleri ve çizgiyi güncelle
                            const isTimelineTemplate = this.sidebarComponent.data.templateName === 'Timeline Bazlı';
                            if (isTimelineTemplate) {
                                if (this.sidebarComponent.onGetTimelineData) {
                                    const timelineData = this.sidebarComponent.onGetTimelineData();
                                    this.sidebarComponent.updateTimelineData(timelineData);
                                }

                                if (this.sidebarComponent.onConnectAllTimelineEvents) {
                                    this.sidebarComponent.onConnectAllTimelineEvents();
                                }

                                // TimelineJS verisini de güncelle (import tek seferlik olduğu için güvenli)
                                if (this.timelineJS) {
                                    this.timelineJS.updateEvents(this.sidebarComponent.points);
                                }
                            }
                        }

                        // Timeline ve Rota verilerini geri yükle
                        if (imported.mapData) {
                            // Timeline verisi
                            if (imported.mapData.timelineEvents && this.mapComponent.timelineManager) {
                                this.mapComponent.timelineManager.events = imported.mapData.timelineEvents;
                                this.mapComponent.timelineManager.updateTimelineLine();
                            }
                            
                            // Rota verisi - RouteManager yoksa ve veri varsa başlat
                            if (!this.mapComponent.routeManager && imported.mapData.routePoints && imported.mapData.routePoints.length > 0) {
                                if (this.mapComponent.initRouteManager) {
                                    this.mapComponent.initRouteManager();
                                }
                            }
                            
                            // Rota verisi geri yükle
                            if (this.mapComponent.routeManager) {
                                if (imported.mapData.routePoints && Array.isArray(imported.mapData.routePoints)) {
                                    this.mapComponent.routeManager.routePoints = imported.mapData.routePoints;
                                    
                                    // Önce rotayı çiz
                                    if (this.mapComponent.routeManager.updateRoute) {
                                        this.mapComponent.routeManager.updateRoute();
                                    } else if (this.mapComponent.routeManager.updateRouteLine) {
                                        this.mapComponent.routeManager.updateRouteLine();
                                    }
                                    
                                    // Sonra mesafeyi hesapla veya yükle
                                    if (imported.mapData.totalDistance) {
                                        this.mapComponent.routeManager.totalDistance = imported.mapData.totalDistance;
                                    } else {
                                        this.mapComponent.routeManager.calculateTotalDistance();
                                    }
                                    
                                    // Günlük özeti güncelle
                                    if (imported.mapData.daySummary) {
                                        this.mapComponent.routeManager.daySummary = imported.mapData.daySummary;
                                    } else {
                                        this.mapComponent.routeManager.updateDaySummary();
                                    }
                                    
                                    // Mesafeleri hesapla
                                    if (this.mapComponent.routeManager.calculateAllDistances) {
                                        this.mapComponent.routeManager.calculateAllDistances();
                                    }
                                    
                                    // Toplam mesafeyi hesapla
                                    const totalDistance = this.mapComponent.routeManager.getTotalDistance ? 
                                        this.mapComponent.routeManager.getTotalDistance() : 0;
                                    
                                    // Sidebar noktalarına distanceToNext değerlerini aktar
                                    const routePoints = this.mapComponent.routeManager.routePoints;
                                    routePoints.forEach((rp, idx) => {
                                        // Sidebar'daki eşleşen noktayı bul
                                        const sidebarPoint = this.sidebarComponent.points.find(p => 
                                            p.coords && rp.coords &&
                                            Math.abs(p.coords[0] - rp.coords[0]) < 0.0001 &&
                                            Math.abs(p.coords[1] - rp.coords[1]) < 0.0001
                                        );
                                        if (sidebarPoint) {
                                            sidebarPoint.distanceToNext = rp.distanceToNext;
                                        }
                                    });
                                    
                                    // Sidebar'daki rota panelini güncellemek için
                                    if (this.sidebarComponent.updateRouteData) {
                                        this.sidebarComponent.updateRouteData({
                                            totalDistance: totalDistance,
                                            daySummary: this.mapComponent.routeManager.daySummary,
                                            displacement: totalDistance,
                                            hasPoints: true
                                        });
                                    }
                                }
                            }
                        }

                        // Sidebar'ı yeniden çiz
                        this.sidebarComponent.render();

                        toast.success('Veri başarıyla içe aktarıldı');
                    } catch (err) {
                        console.error('[Import] JSON parse error:', err);
                        toast.error(`JSON dosyası okunamadı: ${err.message}`);
                    }
                };

                reader.readAsText(file, 'utf-8');
            }, { once: true });

            input.click();
        };
        } // End of !this.viewMode for onExport and onImport

        // Adım odaklan
        this.sidebarComponent.onStepFocus = (stepId) => {
            // Step ID'yi bul - hem id hem index ile dene
            const stepIdNum = parseInt(stepId);
            const step = this.sidebarComponent.data.steps.find((s, index) => {
                return (s.id === stepIdNum) || 
                       (s.id == stepId) || 
                       (index == stepId) ||
                       (index == stepIdNum);
            });
            
            if (!step) {
                return;
            }
            
            if (!step.coords) {
                return;
            }
            
            // Coords [lat, lon] formatındaysa [lon, lat]'e çevir
            let coords = [...step.coords];
            if (Array.isArray(coords) && coords.length === 2) {
                const first = coords[0];
                const second = coords[1];
                
                // Türkiye koordinatları: lat 36-42, lon 26-45
                // Eğer ilk değer 36-42 arasında (enlem) VE ikinci değer 26-45 arasındaysa (boylam) [lat, lon] formatındadır
                const firstIsLat = first >= 36 && first <= 42;
                const secondIsLon = second >= 26 && second <= 45;
                
                if (firstIsLat && secondIsLon) {
                    // [lat, lon] formatında, [lon, lat]'e çevir
                    coords = [second, first];
                } else {
                    // Zaten [lon, lat] formatında
                    coords = [first, second];
                }
            }
            
            // Harita yüklenene kadar bekle
            if (!this.mapComponent.map) {
                const checkInterval = setInterval(() => {
                    if (this.mapComponent.map) {
                        clearInterval(checkInterval);
                        this.mapComponent.flyTo(coords, this.getPointZoom(step, 13));
                    }
                }, 100);
                setTimeout(() => clearInterval(checkInterval), 5000);
            } else {
                this.mapComponent.flyTo(coords, this.getPointZoom(step, 13));
            }
        };

        // Adım düzenle
        this.sidebarComponent.onStepEdit = async (stepId) => {
            const step = this.sidebarComponent.data.steps.find(s => (s.id || s) == stepId);
            if (step) {
                const newTitle = await customPrompt('Yeni başlık:', step.title);
                if (newTitle) {
                    step.title = newTitle;
                    this.sidebarComponent.updateSteps(this.sidebarComponent.data.steps);
                }
            }
        };

        // Adım sil
        this.sidebarComponent.onStepDelete = (stepId) => {
            if (confirm('Bu adımı silmek istediğinize emin misiniz?')) {
                const steps = this.sidebarComponent.data.steps.filter(s => (s.id || s) != stepId);
                this.sidebarComponent.updateSteps(steps);
                this.sidebarComponent.data.steps = steps;
            }
        };

        // StoryMap görünümüne geç (storymap template için)
        if (isStoryMapTemplate) {
            this.sidebarComponent.onStoryMapView = () => {
                // Çizim öğesinin merkez koordinatını hesapla
                const getDrawingCenter = (point) => {
                    // Daire için center alanını kullan
                    if (point.center) return point.center;
                    
                    const coords = point.coords;
                    if (!coords || coords.length === 0) return [35.0, 39.0];
                    if (!Array.isArray(coords[0])) return coords; // Tek nokta
                    
                    // Koordinat dizisinin merkezini bul
                    let sumLng = 0, sumLat = 0;
                    coords.forEach(coord => {
                        sumLng += coord[0];
                        sumLat += coord[1];
                    });
                    return [sumLng / coords.length, sumLat / coords.length];
                };

                // Tüm noktaları steps formatına çevir (marker + çizim öğeleri)
                const steps = this.sidebarComponent.points.map((point, index) => {
                    // Çizim öğesi ise merkez koordinatını hesapla
                    const coords = point.isDrawing 
                        ? getDrawingCenter(point) 
                        : point.coords;
                    
                    return {
                        id: point.id || index + 1,
                        title: point.title,
                        subtitle: point.subtitle || '',
                        content: point.description || '',
                        coords: coords,
                        zoom: this.getPointZoom(point, 12),
                        media: point.media || [],
                        facts: point.facts || [],
                        tags: point.tags || [],
                        isDrawing: point.isDrawing || false
                    };
                });

                // Çizim öğelerini ayrıca haritada göstermek için ayır
                const drawings = this.sidebarComponent.points
                    .filter(point => point.isDrawing)
                    .map(point => ({
                        id: point.id,
                        type: point.drawingType,
                        coords: point.coords,
                        color: point.color || '#3b82f6',
                        title: point.title
                    }));

                // Normal editör container'ları gizle
                const mapContainer = document.getElementById('map-container');
                const sidebarContainer = document.getElementById('sidebar-container');
                const toolbarEl = document.getElementById('map-toolbar');
                const timelineContainer = document.getElementById('timelinejs-container');

                if (mapContainer) mapContainer.style.display = 'none';
                if (sidebarContainer) sidebarContainer.style.display = 'none';
                if (toolbarEl) {
                    toolbarEl.classList.add('hidden');
                }
                if (timelineContainer) timelineContainer.style.display = 'none';

                // StoryMap container'ı göster
                const storymapContainer = document.getElementById('storymap-container');
                if (storymapContainer) {
                    storymapContainer.innerHTML = '';
                    storymapContainer.style.display = 'block';

                    // StoryMap component'i başlat
                    const template = templates[this.inputs.template.value];
                    this.storyMapComponent = new StoryMapComponent('storymap-container', {
                        title: this.sidebarComponent.data.title,
                        subtitle: this.sidebarComponent.data.desc,
                        description: this.sidebarComponent.data.desc,
                        steps: steps,
                        drawings: drawings
                    }, template);

                    this.storyMapComponent.init();

                    // Önceki listener'ı temizle (varsa)
                    if (this.storyMapExitHandler) {
                        document.removeEventListener('storymap:exit', this.storyMapExitHandler);
                    }

                    // Çıkış eventini dinle
                    this.storyMapExitHandler = () => {
                        this.exitStoryMapView();
                    };
                    document.addEventListener('storymap:exit', this.storyMapExitHandler);
                }
            };
        }
    }

    /**
     * Aktif noktanın harita marker'ına kırmızı border, diğerlerine beyaz border uygular.
     * @param {Object|null} activePoint - Aktif nokta veya null (hepsi beyaz).
     */
    _setActiveMarkerBorder(activePoint) {
        if (!this.sidebarComponent || !this.sidebarComponent.points) return;
        const activeId = activePoint != null && activePoint.id != null ? String(activePoint.id) : null;
        this.sidebarComponent.points.forEach(p => {
            if (p.isDrawing || !p.marker) return;
            const el = p.marker.getElement && p.marker.getElement();
            if (el) {
                const isActive = activeId != null && String(p.id) === activeId;
                el.style.border = isActive ? '2px solid #18181B' : '2px solid #fff';
            }
        });
    }

    /**
     * StoryMap görünümünden çık ve editöre dön
     */
    exitStoryMapView() {
        // StoryMap component'i temizle
        try {
            if (this.storyMapComponent) {
                this.storyMapComponent.destroy();
                this.storyMapComponent = null;
            }
        } catch (err) {
            console.error('[ModalComponent] StoryMap destroy error:', err);
            this.storyMapComponent = null;
        }

        // Event listener'ı temizle
        if (this.storyMapExitHandler) {
            document.removeEventListener('storymap:exit', this.storyMapExitHandler);
            this.storyMapExitHandler = null;
        }

        // StoryMap container'ı gizle ve içeriğini temizle
        const storymapContainer = document.getElementById('storymap-container');
        if (storymapContainer) {
            storymapContainer.innerHTML = '';
            storymapContainer.style.display = 'none';
        }

        // Normal editör container'ları göster
        const mapContainer = document.getElementById('map-container');
        const sidebarContainer = document.getElementById('sidebar-container');
        const toolbarEl = document.getElementById('map-toolbar');

        if (mapContainer) mapContainer.style.display = 'block';
        if (sidebarContainer) sidebarContainer.style.display = 'block';
        if (toolbarEl) {
            toolbarEl.classList.remove('hidden');
            toolbarEl.style.removeProperty('display');
        }

        // ToolbarComponent varsa show() ile de göster
        if (this.toolbarComponent) {
            this.toolbarComponent.show();
        }

        // Haritayı yeniden boyutlandır
        if (this.mapComponent && this.mapComponent.map) {
            setTimeout(() => {
                try {
                    this.mapComponent.map.resize();
                } catch (err) {
                    console.error('[ModalComponent] Map resize error:', err);
                }
            }, 100);
        }
    }

    showTitleError() {
        const errorEl = document.getElementById('title-error');
        const inputEl = this.inputs.title;
        
        if (errorEl) {
            errorEl.style.display = 'flex';
        }
        if (inputEl) {
            inputEl.classList.add('modal__input--error');
            inputEl.focus();
        }
    }

    hideTitleError() {
        const errorEl = document.getElementById('title-error');
        const inputEl = this.inputs.title;

        if (errorEl) {
            errorEl.style.display = 'none';
        }
        if (inputEl) {
            inputEl.classList.remove('modal__input--error');
        }
    }

    /**
     * Timeline preview panelini günceller
     * @param {Object} point - Gösterilecek event/point
     */
    updateTimelinePreview(point) {
        if (!point) {
            return;
        }

        // Başlık güncelle
        const titleEl = document.getElementById('preview-event-title');
        if (titleEl) {
            titleEl.textContent = point.title || 'Event Başlığı';
        }

        // Tarih güncelle
        const dateEl = document.getElementById('preview-event-date');
        if (dateEl) {
            const dateText = point.date ? this.formatDate(point.date, point.time) : 'Tarih belirtilmemiş';
            dateEl.innerHTML = `<i class="fa-solid fa-calendar"></i> ${dateText}`;
        }

        // Kategori güncelle
        const categoryEl = document.getElementById('preview-event-category');
        if (categoryEl) {
            const categoryText = this.getCategoryLabel(point.category || 'Other');
            categoryEl.innerHTML = `<i class="fa-solid fa-tag"></i> ${categoryText}`;
        }

        // Resimleri güncelle
        const imagesEl = document.getElementById('preview-event-images');

        if (imagesEl) {
            if (point.media && point.media.length > 0) {
                const imagesHTML = point.media.map((mediaItem, index) => {
                    const isVideo = mediaItem.type === 'video';
                    return `
                        <div class="timeline-preview__image-item ${isVideo ? 'timeline-preview__image-item--video' : ''}"
                             data-index="${index}">
                            ${isVideo
                                ? `<video src="${apiService.getMediaUrl(mediaItem.url)}" style="width: 100%; height: 100%; object-fit: cover;"></video>`
                                : `<img src="${apiService.getMediaUrl(mediaItem.url)}" alt="${point.title}" style="width: 100%; height: 100%; object-fit: cover;">`
                            }
                        </div>
                    `;
                }).join('');

                imagesEl.innerHTML = imagesHTML;
            } else {
                imagesEl.innerHTML = `
                    <div class="timeline-preview__no-images">
                        <i class="fa-solid fa-image"></i>
                        <span>Bu event için resim bulunmuyor</span>
                    </div>
                `;
            }
        }
    }

    /**
     * Tarihi formatlar
     * @param {String} date - YYYY-MM-DD formatında tarih
     * @param {String} time - HH:MM formatında saat (opsiyonel)
     * @returns {String} Formatlanmış tarih
     */
    formatDate(date, time) {
        if (!date) return 'Tarih belirtilmemiş';

        const d = new Date(date);
        const day = d.getDate();
        const month = d.toLocaleString('tr-TR', { month: 'long' });
        const year = d.getFullYear();

        let formatted = `${day} ${month} ${year}`;
        if (time) {
            formatted += ` - ${time}`;
        }

        return formatted;
    }

    /**
     * Kategori etiketini Türkçe'ye çevirir
     * @param {String} category - İngilizce kategori adı
     * @returns {String} Türkçe kategori adı
     */
    getCategoryLabel(category) {
        const labels = {
            'Military': 'Askeri',
            'Political': 'Siyasi',
            'Cultural': 'Kültürel',
            'Scientific': 'Bilimsel',
            'Social': 'Sosyal',
            'Economic': 'Ekonomik',
            'Other': 'Diğer'
        };
        return labels[category] || category;
    }

    /**
     * View Mode: Story data'yı yükle
     * @param {Object} storyData - Yüklenecek story data
     */
    async loadStoryForViewMode(storyData) {
        if (!storyData || !this.mapComponent || !this.sidebarComponent) {
            console.error('[ModalComponent] View mode data yüklenemedi');
            return;
        }

        // Template bilgisini al
        const isTimelineTemplate = this.sidebarComponent.data.templateName === 'Timeline Bazlı';
        const isRouteTemplate = this.sidebarComponent.data.templateName === 'Rota Bazlı';
        
        // Map center ve zoom'u ayarla
        if (storyData.mapData) {
            const { center, zoom } = storyData.mapData;
            if (center && zoom) {
                this.mapComponent.map.setCenter(center);
                this.mapComponent.map.setZoom(zoom);
            }

            // Timeline template için timeline manager'ı initialize et
            if (isTimelineTemplate) {
                if (!this.mapComponent.timelineManager) {
                    this.mapComponent.initTimelineManager();
                }
                // Timeline events'leri yükle
                if (storyData.mapData.timelineEvents) {
                    this.mapComponent.timelineManager.events = storyData.mapData.timelineEvents;
                }
            }

            // Rota template için route manager'ı initialize et
            if (isRouteTemplate) {
                if (!this.mapComponent.routeManager) {
                    this.mapComponent.initRouteManager();
                }
                // Route points'leri yükle
                if (storyData.mapData.routePoints) {
                    this.mapComponent.routeManager.points = storyData.mapData.routePoints;
                }
            }
        }

        // Points'i yükle
        const points = storyData.points || [];
        if (points.length > 0) {
            points.forEach((point) => {
                // Sidebar'a point ekle
                this.sidebarComponent.pointManager.points.push(point);

                // Haritaya marker/drawing ekle
                if (point.isDrawing) {
                    // Çizim öğesi
                    this.addDrawingToMapForViewMode(point);
                } else {
                    // Normal marker
                    this.addMarkerToMapForViewMode(point);
                }
            });

            // Sidebar'ı güncelle (render)
            this.sidebarComponent.render();

            // Rota template için özel işlemler
            if (isRouteTemplate) {
                const routePoints = this.sidebarComponent.points
                    .filter(p => !p.isDrawing)
                    .map(p => ({
                        id: p.id,
                        coords: p.coords,
                        visitDay: p.visitDay || 1,
                        duration: p.duration,
                        timestamp: p.timestamp,
                        distanceToNext: p.distanceToNext
                    }));

                if (routePoints.length >= 2) {
                    // RouteManager'ı initialize et
                    if (!this.mapComponent.routeManager) {
                        this.mapComponent.initRouteManager();
                    }

                    if (this.mapComponent.routeManager) {
                        try {
                            await this.mapComponent.routeManager.updateRouteLine(routePoints);

                            if (!this.viewMode) {
                                const routeData = {
                                    totalDistance: this.mapComponent.getRouteTotalDistance(),
                                    daySummary: this.mapComponent.getRouteDaySummary(),
                                    displacement: this.mapComponent.getRouteDisplacement(),
                                    bearingAngle: this.mapComponent.getRouteBearingAngle(),
                                    hasPoints: true
                                };
                                this.sidebarComponent.updateRouteData(routeData);
                            }
                        } catch (error) {
                            console.error('[ModalComponent] ✗ Rota çizgileri çizilirken hata:', error);
                        }
                    } else {
                        console.error('[ModalComponent] ✗ RouteManager initialize edilemedi!');
                    }
                } else {
                    console.warn('[ModalComponent] ✗ Yetersiz rota noktası:', routePoints.length, '(minimum 2 gerekli)');
                }
            }

            // Timeline template için özel işlemler
            if (isTimelineTemplate) {
                if (this.mapComponent.timelineManager) {
                    try {
                        this.mapComponent.timelineManager.updateTimelineLine();
                    } catch (error) {
                        console.error('[ModalComponent] ✗ Timeline çizgileri çizilirken hata:', error);
                    }

                    // Timeline statistics güncelle (sadece edit mode'da)
                    if (!this.viewMode) {
                        try {
                            const timelineData = this.mapComponent.timelineManager.getStatistics();
                            if (timelineData) {
                                this.sidebarComponent.updateTimelineData(timelineData);
                            } else {
                                console.warn('[ModalComponent] ✗ Timeline data boş');
                            }
                        } catch (error) {
                            console.error('[ModalComponent] ✗ Timeline statistics güncellenirken hata:', error);
                        }
                    }
                } else {
                    console.error('[ModalComponent] ✗ TimelineManager bulunamadı!');
                }

                // TimelineJS'i initialize et
                if (this.timelineJS) {
                    try {
                        this.timelineJS.initialize(this.sidebarComponent.points, {
                            title: storyData.title,
                            description: storyData.desc
                        });
                    } catch (error) {
                        console.error('[ModalComponent] ✗ TimelineJS initialize hatası:', error);
                    }
                } else {
                    console.error('[ModalComponent] ✗ TimelineJS bulunamadı!');
                }
            }

        }

        if (storyData.id) {
            this.currentStoryId = storyData.id;
        }

        // SharePanel'e story ID'sini geçir
        if (storyData.id && this.toolbarComponent && this.toolbarComponent.actionManager) {
            this.toolbarComponent.actionManager.sharePanel.setStoryId(storyData.id);
        }
    }

    /**
     * Helper: Marker'ı haritaya ekle (View Mode)
     */
    addMarkerToMapForViewMode(point) {
        if (!this.mapComponent || !point.coords) return;

        const map = this.mapComponent.map;
        const el = document.createElement('div');
        el.className = 'map-marker';
        
        const isNumber = point.isNumber || point.style === 'number';
        const isTeardrop = point.shape === 'teardrop';
        
        if (isNumber && point.number) {
            // Numaralı marker - rota için (%35 büyütülmüş, beyaz border)
            el.style.cssText = `
                width: 27px;
                height: 27px;
                border-radius: 50%;
                background-color: ${point.color || '#ef4444'};
                border: 2px solid #fff;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            const numberSpan = document.createElement('span');
            numberSpan.className = 'marker-number';
            numberSpan.textContent = point.number;
            numberSpan.style.cssText = `
                color: white;
                font-size: 12px;
                font-weight: bold;
                font-family: Arial, sans-serif;
            `;
            el.appendChild(numberSpan);
        } else if (isTeardrop) {
            // Damla şekli (%35 büyütülmüş, beyaz border)
            el.style.cssText = `
                width: 27px;
                height: 36px;
                background-color: ${point.color || '#10b981'};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 2px solid #fff;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            const icon = document.createElement('i');
            icon.className = `fa-solid ${point.icon || 'fa-location-dot'}`;
            icon.style.cssText = `
                color: white;
                font-size: 11px;
                transform: rotate(45deg);
            `;
            el.appendChild(icon);
        } else {
            // Yuvarlak marker (%35 büyütülmüş, beyaz border)
            el.style.cssText = `
                width: 26px;
                height: 26px;
                border-radius: 50%;
                background-color: ${point.color || '#3b82f6'};
                border: 2px solid #fff;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            const icon = document.createElement('i');
            icon.className = `fa-solid ${point.icon || 'fa-map-marker-alt'}`;
            icon.style.cssText = `
                color: white;
                font-size: 10px;
            `;
            el.appendChild(icon);
        }

        // Marker oluştur
        const marker = new maplibregl.Marker({ element: el })
            .setLngLat(point.coords)
            .addTo(map);

        // Popup ekle (eğer varsa)
        if (point.title) {
            const popup = new maplibregl.Popup({ offset: 25 })
                .setHTML(`<div style="padding: 5px; font-size: 14px; font-weight: 600; color: #374151;">${point.title}</div>`);
            marker.setPopup(popup);
        }

        // Marker'ı sakla
        if (!this.mapComponent.markers) {
            this.mapComponent.markers = {};
        }
        this.mapComponent.markers[point.id] = marker;
        
        // Point'e marker referansını ekle
        point.marker = marker;
    }

    /**
     * Helper: Çizim öğesini haritaya ekle (View Mode)
     */
    addDrawingToMapForViewMode(point) {
        if (!this.mapComponent || !point.coords) return;

        const map = this.mapComponent.map;
        const sourceId = point.mapLayerId || `drawing-source-${point.id}`;
        const layerId = point.mapLayerId ? `${point.mapLayerId}-layer` : `drawing-layer-${point.id}`;
        const outlineId = point.mapLayerId ? `${point.mapLayerId}-outline` : `${layerId}-outline`;

        // Drawing type'a göre source oluştur
        let sourceData;
        if (point.drawingType === 'line' || point.drawingType === 'arrow') {
            sourceData = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: point.coords
                }
            };
        } else if (point.drawingType === 'polygon' || point.drawingType === 'rectangle') {
            sourceData = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [point.coords]
                }
            };
        } else if (point.drawingType === 'circle') {
            sourceData = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [point.coords]
                }
            };
        } else if (point.drawingType === 'text') {
            const textContent = point.text || point.title || 'Metin';
            const textCoords = Array.isArray(point.coords[0]) ? point.coords[0] : point.coords;
            const marker = this.mapComponent.addTextMarker(textCoords, textContent, {
                textStyle: point.textStyle || 'boxed',
                textPlacement: point.textPlacement || 'left',
                leaderLine: point.leaderLine !== false,
                leaderLineStyle: point.leaderLineStyle || 'gradient',
                anchorColor: point.color || '#334155',
                leaderColor: point.color || '#334155'
            });
            if (marker) {
                point.marker = marker;
                if (marker.getElement()) {
                    marker.getElement().addEventListener('click', (e) => {
                        if (this.sidebarComponent && !this.sidebarComponent.viewMode && point.id) {
                            this.sidebarComponent.showPointDetail(point.id);
                            e.stopPropagation();
                        }
                    });
                }
            }
            return;
        }

        if (!sourceData) return;

        // Source ekle
        if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
                type: 'geojson',
                data: sourceData
            });
        }

        // Layer ekle
        if (!map.getLayer(layerId)) {
            if (point.drawingType === 'line' || point.drawingType === 'arrow') {
                map.addLayer({
                    id: layerId,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': point.color || '#3b82f6',
                        'line-width': 3,
                        'line-opacity': 0.8
                    }
                });
            } else {
                map.addLayer({
                    id: layerId,
                    type: 'fill',
                    source: sourceId,
                    paint: {
                        'fill-color': point.color || '#3b82f6',
                        'fill-opacity': 0.3
                    }
                });

                map.addLayer({
                    id: outlineId,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': point.color || '#3b82f6',
                        'line-width': 2,
                        'line-opacity': 0.8
                    }
                });
            }
        }
    }

    /**
     * Destroy metodu - Tüm component'leri ve state'i temizler
     */
    destroy() {
        console.log('[ModalComponent] destroy calling...');

        // Olay dinleyicilerini kaldır (sızıntıları önlemek için)
        if (this.inputs) {
            if (this.inputs.title) {
                if (this.onTitleInput) this.inputs.title.removeEventListener('input', this.onTitleInput);
                if (this.onTitleKeydown) this.inputs.title.removeEventListener('keydown', this.onTitleKeydown);
            }
            if (this.inputs.desc && this.onDescInput) {
                this.inputs.desc.removeEventListener('input', this.onDescInput);
            }
            if (this.inputs.template && this.onTemplateChange) {
                this.inputs.template.removeEventListener('change', this.onTemplateChange);
            }
            if (this.inputs.btn && this.onBtnClick) {
                this.inputs.btn.removeEventListener('click', this.onBtnClick);
            }
        }

        // Çıkış event listener'ını temizle
        if (this.storyMapExitHandler) {
            document.removeEventListener('storymap:exit', this.storyMapExitHandler);
            this.storyMapExitHandler = null;
        }

        // MapComponent'i temizle
        if (this.mapComponent) {
            this.mapComponent.destroy();
            this.mapComponent = null;
        }

        // SidebarComponent'i temizle
        if (this.sidebarComponent) {
            // Points ve drawings temizle
            this.sidebarComponent.points = [];
            this.sidebarComponent.drawings = [];
            this.sidebarComponent = null;
        }

        // ToolbarComponent'i temizle
        if (this.toolbarComponent) {
            this.toolbarComponent = null;
        }

        // StoryMapComponent'i temizle
        if (this.storyMapComponent) {
            if (typeof this.storyMapComponent.destroy === 'function') {
                this.storyMapComponent.destroy();
            }
            this.storyMapComponent = null;
        }

        // TimelineJS wrapper'ı temizle
        if (this.timelineJSWrapper) {
            if (typeof this.timelineJSWrapper.destroy === 'function') {
                this.timelineJSWrapper.destroy();
            }
            this.timelineJSWrapper = null;
        }

        // State'i sıfırla
        this.storyData = null;
        this.currentStoryId = null;

        // Data state'i sıfırla
        this.data = {
            title: '',
            desc: '',
            templateName: null,
            template: null,
            mapData: null,
            points: [],
            drawings: []
        };
    }
}
