import { customPrompt } from '../../../utils/customPrompt.js';

export class ToolManager {
    constructor(toolbarElement) {
        this.toolbar = toolbarElement;
        this.mapComponent = null;
        this.sidebarComponent = null;
        this.currentTool = 'select';
        this.isToolLocked = false;
        this.modeIndicator = null;
        this.viewMode = false; // Geçici çizim modu
    }

    setComponents(mapComponent, sidebarComponent, viewMode = false) {
        this.mapComponent = mapComponent;
        this.sidebarComponent = sidebarComponent;
        this.viewMode = viewMode;
    }

    /**
     * Çizim tamamlandığında viewMode kontrolü yap
     * @param {Function} callback - Edit mode'da çalışacak callback
     */
    handleDrawingComplete(callback) {
        if (this.viewMode) {
            // View mode: Sadece toolbar'ı unlock et, sidebar'a ekleme
            this.unlockToolbar();
            this.selectToolWithoutLock('select');
            console.log('[ToolManager] Geçici çizim eklendi (view mode)');
        } else {
            // Edit mode: Normal işlem
            callback();
        }
    }

    selectTool(tool) {
        // Check if we're trying to select the same measurement tool that's already active
        if (this.isToolLocked && tool === 'measure-distance' && this.currentTool === tool) {
            // Toggle off the measurement tool
            this.cancelCurrentTool();
            return;
        }

        if (this.isToolLocked) return;

        const prevActive = this.toolbar.querySelector('.toolbar__btn--active');
        if (prevActive) prevActive.classList.remove('toolbar__btn--active');

        const newActive = this.toolbar.querySelector(`[data-tool="${tool}"]`);
        if (newActive) newActive.classList.add('toolbar__btn--active');

        this.currentTool = tool;
        this.hideModeIndicator();

        if (this.mapComponent) {
            this.mapComponent.disableAllModes();
        }

        switch (tool) {
            case 'select': break;
            case 'marker': this.activateMarkerMode(); break;
            case 'numbered': this.activateNumberedMarkerMode(); break;
            case 'line': this.activateLineMode(); break;
            case 'polygon': this.activatePolygonMode(); break;
            case 'rectangle': this.activateRectangleMode(); break;
            case 'circle': this.activateCircleMode(); break;
            case 'text': this.activateTextMode(); break;
            case 'measure-distance': this.activateDistanceMeasureMode(); break;
        }
    }

    lockToolbar() {
        this.isToolLocked = true;
        if (!this.toolbar) return;
        
        this.toolbar.classList.add('toolbar--locked');
        
        const toolBtns = this.toolbar.querySelectorAll('.toolbar__btn[data-tool]');
        toolBtns.forEach(btn => {
            const tool = btn.dataset.tool;
            // Keep the current measurement tool and select button clickable
            if (tool !== this.currentTool && tool !== 'select') {
                btn.classList.add('toolbar__btn--disabled');
                btn.style.pointerEvents = 'none';
                btn.setAttribute('disabled', 'disabled');
            }
        });
    }

    unlockToolbar() {
        this.isToolLocked = false;
        if (!this.toolbar) return;
        
        this.toolbar.classList.remove('toolbar--locked');
        
        const toolBtns = this.toolbar.querySelectorAll('.toolbar__btn[data-tool]');
        toolBtns.forEach(btn => {
            btn.classList.remove('toolbar__btn--disabled');
            btn.style.pointerEvents = '';
            btn.removeAttribute('disabled');
        });
    }

    cancelCurrentTool() {
        if (!this.isToolLocked) return;
        
        // Deactivate measurement tool
        if (this.currentTool === 'measure-distance' && this.mapComponent && this.mapComponent.measurementTool) {
            this.mapComponent.measurementTool.deactivate();
        }
        
        if (this.mapComponent) {
            this.mapComponent.disableAllModes();
        }
        
        this.unlockToolbar();
        this.hideModeIndicator();
        
        this.currentTool = 'select';
        const selectBtn = this.toolbar.querySelector('[data-tool="select"]');
        const prevActive = this.toolbar.querySelector('.toolbar__btn--active');
        if (prevActive) prevActive.classList.remove('toolbar__btn--active');
        if (selectBtn) selectBtn.classList.add('toolbar__btn--active');
    }

    // Internal helper to select tool without locking check (used after completion)
    selectToolWithoutLock(tool) {
        const prevActive = this.toolbar.querySelector('.toolbar__btn--active');
        if (prevActive) prevActive.classList.remove('toolbar__btn--active');

        const newActive = this.toolbar.querySelector(`[data-tool="${tool}"]`);
        if (newActive) newActive.classList.add('toolbar__btn--active');

        this.currentTool = tool;
    }

    showModeIndicator(message, type = 'info') {
        this.hideModeIndicator();

        this.modeIndicator = document.createElement('div');
        this.modeIndicator.className = `toolbar__mode-indicator toolbar__mode-indicator--${type}`;
        this.modeIndicator.innerHTML = `
            <i class="fa-solid fa-info-circle"></i> ${message}
            <button class="toolbar__mode-cancel" title="İptal (ESC)">
                <i class="fa-solid fa-times"></i>
            </button>
        `;
        document.body.appendChild(this.modeIndicator);
        
        const cancelBtn = this.modeIndicator.querySelector('.toolbar__mode-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelCurrentTool();
            });
        }
    }

    hideModeIndicator() {
        if (this.modeIndicator && this.modeIndicator.parentNode) {
            this.modeIndicator.parentNode.removeChild(this.modeIndicator);
            this.modeIndicator = null;
        }
    }

    // ========================================
    // ACTIVATORS
    // ========================================

    activateMarkerMode() {
        this.lockToolbar();
        const isRouteTemplate = this.sidebarComponent.data.templateName === 'Rota Bazlı';
        this.showModeIndicator('Haritaya tıklayarak nokta ekleyin', 'info');

        this.mapComponent.enableMarkerMode((data) => {
            this.hideModeIndicator();

            this.handleDrawingComplete(() => {
                // Rota şablonu için özel davranış
                if (isRouteTemplate && this.sidebarComponent.onRoutePointAdd) {
                    const nextNumber = this.sidebarComponent.getNextNumber();
                    const defaultDay = 1; // Varsayılan gün

                    // Eski marker'ı kaldır
                    if (data.marker) data.marker.remove();

                    // Benzersiz ID oluştur
                    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                    console.log('[ToolManager] Creating new route point:', {
                        id: uniqueId,
                        number: nextNumber,
                        coords: data.coords
                    });

                    // Point nesnesini oluştur
                    const pointData = {
                        id: uniqueId,
                        title: `Nokta ${nextNumber}`,
                        description: '',
                        coords: data.coords,
                        visitDay: defaultDay,
                        duration: '',
                        timestamp: '',
                        number: nextNumber,
                        media: [],
                        style: 'number',
                        shape: 'circle',
                        isNumber: true
                    };

                    // Önce sidebar'a ekle (PointManager üzerinden)
                    const addedPoint = this.sidebarComponent.addPoint(pointData);

                    console.log('[ToolManager] Point added to sidebar:', {
                        id: addedPoint.id,
                        title: addedPoint.title
                    });

                    // Sonra harita callback'i ile marker'ı oluştur
                    if (this.sidebarComponent.onRoutePointAdd) {
                        this.sidebarComponent.onRoutePointAdd(addedPoint);
                    }

                    // Detay panelini göster
                    this.sidebarComponent.showPointDetail(addedPoint.id, () => {
                        // Rota verilerini güncelle
                        if (this.sidebarComponent.onGetRouteData) {
                            const routeData = this.sidebarComponent.onGetRouteData();
                            this.sidebarComponent.updateRouteData(routeData);
                        }

                        this.unlockToolbar();
                        this.selectToolWithoutLock('select');
                    });
                } else {
                    // Normal nokta ekleme
                    const newPoint = this.sidebarComponent.addPoint({
                        title: `Nokta ${this.sidebarComponent.points.length + 1}`,
                        description: '',
                        coords: data.coords,
                        color: '#ef4444',
                        icon: 'fa-map-marker-alt',
                        marker: data.marker,
                        media: [],
                        style: 'default',
                        shape: 'circle'
                    });

                    this.sidebarComponent.showPointDetail(newPoint.id, () => {
                        this.unlockToolbar();
                        this.selectToolWithoutLock('select');
                    });
                }
            });
        });
    }

    activateNumberedMarkerMode() {
        this.lockToolbar();
        const isRouteTemplate = this.sidebarComponent.data.templateName === 'Rota Bazlı';
        this.showModeIndicator('Haritaya tıklayarak numaralı nokta ekleyin', 'info');

        this.mapComponent.enableMarkerMode(async (data) => {
            this.hideModeIndicator();

            this.handleDrawingComplete(async () => {
                const nextNumber = this.sidebarComponent.getNextNumber();

                if (data.marker) data.marker.remove();

                // Rota şablonu için özel davranış
                if (isRouteTemplate && this.sidebarComponent.onRoutePointAdd) {
                    const defaultDay = 1; // Varsayılan gün

                    // Rota noktası ekle (callback günlük renge göre marker oluşturacak)
                    const newPoint = await this.sidebarComponent.onRoutePointAdd({
                        id: Date.now(),
                        title: `Nokta ${nextNumber}`,
                        description: '',
                        coords: data.coords,
                        visitDay: defaultDay,
                        duration: '',
                        timestamp: '',
                        number: nextNumber,
                        media: [],
                        style: 'number',
                        shape: 'circle',
                        isNumber: true
                    });

                    // Sidebar'a point'i ekle
                    this.sidebarComponent.points.push(newPoint);

                    // Detay panelini göster
                    this.sidebarComponent.showPointDetail(newPoint.id, () => {
                        // Rota verilerini güncelle
                        if (this.sidebarComponent.onGetRouteData) {
                            const routeData = this.sidebarComponent.onGetRouteData();
                            this.sidebarComponent.updateRouteData(routeData);
                        }

                        this.unlockToolbar();
                        this.selectToolWithoutLock('select');
                    });
                } else {
                    // Normal numaralı nokta ekleme
                    const newMarker = this.mapComponent.addMarker(data.coords, {
                        color: '#3b82f6',
                        isNumber: true,
                        number: nextNumber,
                        shape: 'circle'
                    });

                    const newPoint = this.sidebarComponent.addPoint({
                        title: `Nokta ${nextNumber}`,
                        description: '',
                        coords: data.coords,
                        color: '#3b82f6',
                        icon: 'number',
                        marker: newMarker,
                        media: [],
                        style: 'number',
                        shape: 'circle',
                        isNumber: true,
                        number: nextNumber
                    });

                    this.sidebarComponent.showPointDetail(newPoint.id, () => {
                        this.unlockToolbar();
                        this.selectToolWithoutLock('select');
                    });
                }
            });
        });
    }

    activateLineMode() {
        this.lockToolbar();
        this.showModeIndicator('Çizgi çizmek için noktaları tıklayın. Bitirmek için çift tıklayın veya sağ tık.', 'info');

        this.mapComponent.enableLineMode((data) => {
            this.hideModeIndicator();

            this.handleDrawingComplete(() => {
                const newDrawing = this.sidebarComponent.addDrawing({
                    type: 'line',
                    title: 'Başlıksız',
                    coords: data.coords,
                    color: '#3b82f6',
                    data: data
                });

                this.sidebarComponent.showPointDetail(newDrawing.id, () => {
                    this.unlockToolbar();
                    this.selectToolWithoutLock('select');
                });
            });
        });
    }

    activatePolygonMode() {
        this.lockToolbar();
        this.showModeIndicator('Alan çizmek için noktaları tıklayın. Bitirmek için çift tıklayın veya sağ tık.', 'info');

        this.mapComponent.enablePolygonMode((data) => {
            this.hideModeIndicator();

            this.handleDrawingComplete(() => {
                const newDrawing = this.sidebarComponent.addDrawing({
                    type: 'polygon',
                    title: 'Başlıksız',
                    coords: data.coords,
                    color: '#3b82f6',
                    data: data
                });

                this.sidebarComponent.showPointDetail(newDrawing.id, () => {
                    this.unlockToolbar();
                    this.selectToolWithoutLock('select');
                });
            });
        });
    }

    activateRectangleMode() {
        this.lockToolbar();
        this.showModeIndicator('Dikdörtgen çizmek için iki köşeyi tıklayın.', 'info');

        this.mapComponent.enableRectangleMode((data) => {
            this.hideModeIndicator();

            this.handleDrawingComplete(() => {
                const newDrawing = this.sidebarComponent.addDrawing({
                    type: 'rectangle',
                    title: 'Başlıksız',
                    coords: data.coords,
                    color: '#3b82f6',
                    data: data
                });

                this.sidebarComponent.showPointDetail(newDrawing.id, () => {
                    this.unlockToolbar();
                    this.selectToolWithoutLock('select');
                });
            });
        });
    }

    activateCircleMode() {
        this.lockToolbar();
        this.showModeIndicator('Daire çizmek için merkezi tıklayın, sonra yarıçap için tekrar tıklayın.', 'info');

        this.mapComponent.enableCircleMode((data) => {
            this.hideModeIndicator();

            this.handleDrawingComplete(() => {
                const newDrawing = this.sidebarComponent.addDrawing({
                    type: 'circle',
                    title: 'Başlıksız',
                    coords: data.coords, // Polygon koordinatları (hikâye modu için)
                    center: data.center,
                    radius: data.radius,
                    color: '#3b82f6',
                    data: data
                });

                this.sidebarComponent.showPointDetail(newDrawing.id, () => {
                    this.unlockToolbar();
                    this.selectToolWithoutLock('select');
                });
            });
        });
    }

    activateTextMode() {
        this.lockToolbar();
        this.showModeIndicator('Metin eklemek için haritaya tıklayın.', 'info');

        this.mapComponent.enableTextMode(async (data) => {
            this.hideModeIndicator();

            const text = await customPrompt('Metni girin:');
            if (text) {
                const textMarker = this.mapComponent.addTextMarker(data.coords, text);

                this.handleDrawingComplete(() => {
                    const newDrawing = this.sidebarComponent.addDrawing({
                        type: 'text',
                        title: text.substring(0, 20) + (text.length > 20 ? '...' : ''),
                        text: text,
                        coords: data.coords,
                        marker: textMarker // Text marker referansını kaydet
                    });

                    this.sidebarComponent.showPointDetail(newDrawing.id, () => {
                        this.unlockToolbar();
                        this.selectToolWithoutLock('select');
                    });
                });
            } else {
                this.unlockToolbar();
                this.selectToolWithoutLock('select');
            }
        });
    }

    // ========================================
    // MEASUREMENT (ÖLÇÜM) ARAÇLARI
    // ========================================

    activateDistanceMeasureMode() {
        this.lockToolbar();
        
        if (this.mapComponent) {
            this.mapComponent.activateMeasurementTool();
            
            if (this.mapComponent.measurementTool) {
                this.mapComponent.measurementTool.onStateChange = (state) => {
                    if (!state.isActive) {
                        this.hideModeIndicator();
                        this.unlockToolbar();
                        this.selectToolWithoutLock('select');
                    }
                };
            }
        }
    }
}
