/**
 * Screenshot Selection Tool - MapLibre GL JS
 * Allows users to select a rectangular area on the map and capture it as a PNG image
 */

class ScreenshotSelectionTool {
    constructor(map) {
        this.map = map;
        this.isActive = false;
        this.isSelecting = false;
        this.startPoint = null;
        this.endPoint = null;
        this.overlay = null;
        
        // Bind event handler methods
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
    }
    
    /**
     * Activate the screenshot selection tool
     * Toggles off if already active
     */
    activate() {
        if (this.isActive) {
            this.deactivate();
            return;
        }
        
        this.isActive = true;
        this.map.getCanvas().style.cursor = 'crosshair';
        
        // Disable map interactions
        this.map.dragPan.disable();
        this.map.scrollZoom.disable();
        
        // Add event listeners to map container
        const container = this.map.getContainer();
        container.addEventListener('mousedown', this._onMouseDown);
        container.addEventListener('mousemove', this._onMouseMove);
        container.addEventListener('mouseup', this._onMouseUp);
        document.addEventListener('keydown', this._onKeyDown);
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('📷 Ekran görüntüsü aracı aktif. Fare ile seçim yapın. ESC ile iptal edin.');
        }
    }
    
    /**
     * Deactivate the screenshot selection tool
     */
    deactivate() {
        this.isActive = false;
        this.isSelecting = false;
        this.startPoint = null;
        this.endPoint = null;
        
        // Restore cursor
        this.map.getCanvas().style.cursor = '';
        
        // Re-enable map interactions
        this.map.dragPan.enable();
        this.map.scrollZoom.enable();
        
        // Remove event listeners
        const container = this.map.getContainer();
        container.removeEventListener('mousedown', this._onMouseDown);
        container.removeEventListener('mousemove', this._onMouseMove);
        container.removeEventListener('mouseup', this._onMouseUp);
        document.removeEventListener('keydown', this._onKeyDown);
        
        // Remove overlay and preview controls
        this._removeOverlay();
        this._removePreviewControls();
        
        // Update button visual state
        const screenshotBtn = document.getElementById('screenshot-selection');
        if (screenshotBtn) {
            screenshotBtn.classList.remove('tool-active');
        }
    }

    
    /**
     * Cancel the current selection
     */
    cancel() {
        this.isSelecting = false;
        this.startPoint = null;
        this.endPoint = null;
        this._removeOverlay();
        this._removePreviewControls();
        this.deactivate();
    }
    
    // Private Event Handlers
    
    _onMouseDown(e) {
        if (!this.isActive) return;
        
        // Don't start new selection if in preview mode
        if (this.previewCropArea) return;
        
        const rect = this.map.getContainer().getBoundingClientRect();
        this.startPoint = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.isSelecting = true;
        this._createOverlay();
    }
    
    _onMouseMove(e) {
        if (!this.isActive || !this.isSelecting) return;
        
        const rect = this.map.getContainer().getBoundingClientRect();
        this.endPoint = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        this._updateOverlay();
    }
    
    _onMouseUp(e) {
        if (!this.isActive || !this.isSelecting) return;
        
        const rect = this.map.getContainer().getBoundingClientRect();
        this.endPoint = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        this.isSelecting = false;
        
        const cropArea = this._calculateCropArea();
        
        if (this._validateCropArea(cropArea)) {
            // Show preview mode instead of immediately capturing
            this._showPreviewMode(cropArea);
        } else {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('⚠️ Seçim alanı çok küçük. En az 10x10 piksel olmalı.', 'warning', 3000);
            }
            this._removeOverlay();
            this.deactivate();
        }
    }
    
    _onKeyDown(e) {
        if (!this.isActive) return;
        
        if (e.key === 'Escape') {
            e.preventDefault();
            this.cancel();
        }
    }
    
    // Private Selection Management Methods
    
    _createOverlay() {
        if (this.overlay) {
            this._removeOverlay();
        }
        
        const container = this.map.getContainer();
        
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'screenshot-selection-overlay';
        this.overlay.className = 'screenshot-overlay';
        this.overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Create selection box
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'screenshot-selection-box';
        this.selectionBox.style.cssText = `
            position: absolute;
            border: 2px dashed #3b82f6;
            background: rgba(59, 130, 246, 0.1);
            pointer-events: none;
        `;
        
        // Create dimensions display
        this.dimensionsDisplay = document.createElement('div');
        this.dimensionsDisplay.className = 'screenshot-dimensions';
        this.dimensionsDisplay.style.cssText = `
            position: absolute;
            bottom: -24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
        `;
        
        this.selectionBox.appendChild(this.dimensionsDisplay);
        this.overlay.appendChild(this.selectionBox);
        container.appendChild(this.overlay);
    }
    
    _updateOverlay() {
        if (!this.overlay || !this.selectionBox || !this.startPoint || !this.endPoint) return;
        
        const cropArea = this._calculateCropArea();
        
        this.selectionBox.style.left = `${cropArea.x}px`;
        this.selectionBox.style.top = `${cropArea.y}px`;
        this.selectionBox.style.width = `${cropArea.width}px`;
        this.selectionBox.style.height = `${cropArea.height}px`;
        
        if (this.dimensionsDisplay) {
            this.dimensionsDisplay.textContent = `${cropArea.width} x ${cropArea.height} px`;
        }
    }
    
    _removeOverlay() {
        // Clean up editing listeners
        if (this._editingListeners) {
            document.removeEventListener('mousedown', this._editingListeners.onMouseDown, true);
            document.removeEventListener('mousemove', this._editingListeners.onMouseMove);
            document.removeEventListener('mouseup', this._editingListeners.onMouseUp);
            this._editingListeners = null;
        }
        
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.selectionBox = null;
        this.dimensionsDisplay = null;
        this.resizeHandles = null;
    }
    
    _calculateCropArea() {
        if (!this.startPoint || !this.endPoint) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
        
        return {
            x: Math.min(this.startPoint.x, this.endPoint.x),
            y: Math.min(this.startPoint.y, this.endPoint.y),
            width: Math.abs(this.endPoint.x - this.startPoint.x),
            height: Math.abs(this.endPoint.y - this.startPoint.y)
        };
    }
    
    _validateCropArea(cropArea) {
        return cropArea.width >= 10 && cropArea.height >= 10;
    }
    
    _showPreviewMode(cropArea) {
        // Store the crop area
        this.previewCropArea = cropArea;
        
        // Update overlay to show preview mode
        if (this.selectionBox) {
            this.selectionBox.style.border = '2px solid #10b981';
            this.selectionBox.style.background = 'rgba(16, 185, 129, 0.1)';
            this.selectionBox.style.pointerEvents = 'auto';
            this.selectionBox.style.cursor = 'default';
        }
        
        // Add resize handles
        this._addResizeHandles();
        
        // Enable dragging and resizing
        this._enableSelectionEditing();
        
        // Create preview controls
        this._createPreviewControls();
        
        // Re-enable map interactions for adjustment
        this.map.dragPan.enable();
        this.map.scrollZoom.enable();
        
        // Change cursor back to default
        this.map.getCanvas().style.cursor = '';
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('✅ Seçim tamamlandı. Alanı düzenleyebilir veya indirebilirsiniz.');
        }
    }
    
    _addResizeHandles() {
        if (!this.selectionBox) return;
        
        const handleSize = 14;
        // Only corner handles
        const positions = [
            { name: 'nw', cursor: 'nw-resize', top: -handleSize/2, left: -handleSize/2 },
            { name: 'ne', cursor: 'ne-resize', top: -handleSize/2, right: -handleSize/2 },
            { name: 'sw', cursor: 'sw-resize', bottom: -handleSize/2, left: -handleSize/2 },
            { name: 'se', cursor: 'se-resize', bottom: -handleSize/2, right: -handleSize/2 }
        ];
        
        this.resizeHandles = [];
        
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${pos.name}`;
            handle.dataset.position = pos.name;
            
            let styles = `
                position: absolute;
                width: ${handleSize}px;
                height: ${handleSize}px;
                background: white;
                border: 2px solid #10b981;
                border-radius: 50%;
                cursor: ${pos.cursor};
                z-index: 10;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            
            if (pos.top !== undefined) styles += `top: ${pos.top}px;`;
            if (pos.bottom !== undefined) styles += `bottom: ${pos.bottom}px;`;
            if (pos.left !== undefined) styles += `left: ${typeof pos.left === 'number' ? pos.left + 'px' : pos.left};`;
            if (pos.right !== undefined) styles += `right: ${pos.right}px;`;
            if (pos.transform) styles += `transform: ${pos.transform};`;
            
            handle.style.cssText = styles;
            this.selectionBox.appendChild(handle);
            this.resizeHandles.push(handle);
        });
    }
    
    _enableSelectionEditing() {
        if (!this.selectionBox) return;
        
        let isResizing = false;
        let resizeHandle = null;
        let startX, startY;
        let startCropArea;
        
        const onMouseDown = (e) => {
            // Only allow resizing from handles
            if (e.target.classList.contains('resize-handle')) {
                isResizing = true;
                resizeHandle = e.target.dataset.position;
                e.stopPropagation();
                
                startX = e.clientX;
                startY = e.clientY;
                startCropArea = { ...this.previewCropArea };
                
                // Disable map interactions during editing
                this.map.dragPan.disable();
                this.map.scrollZoom.disable();
            }
        };
        
        const onMouseMove = (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const container = this.map.getContainer().getBoundingClientRect();
            
            // Resize the selection from corners
            let newCropArea = { ...startCropArea };
            
            if (resizeHandle.includes('n')) {
                newCropArea.y = startCropArea.y + deltaY;
                newCropArea.height = startCropArea.height - deltaY;
            }
            if (resizeHandle.includes('s')) {
                newCropArea.height = startCropArea.height + deltaY;
            }
            if (resizeHandle.includes('w')) {
                newCropArea.x = startCropArea.x + deltaX;
                newCropArea.width = startCropArea.width - deltaX;
            }
            if (resizeHandle.includes('e')) {
                newCropArea.width = startCropArea.width + deltaX;
            }
            
            // Constrain to container and minimum size
            newCropArea.x = Math.max(0, newCropArea.x);
            newCropArea.y = Math.max(0, newCropArea.y);
            newCropArea.width = Math.max(50, Math.min(newCropArea.width, container.width - newCropArea.x));
            newCropArea.height = Math.max(50, Math.min(newCropArea.height, container.height - newCropArea.y));
            
            this.previewCropArea = newCropArea;
            this._updateSelectionBox();
        };
        
        const onMouseUp = () => {
            if (isResizing) {
                isResizing = false;
                resizeHandle = null;
                
                // Re-enable map interactions
                this.map.dragPan.enable();
                this.map.scrollZoom.enable();
            }
        };
        
        document.addEventListener('mousedown', onMouseDown, true);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        // Store for cleanup
        this._editingListeners = { onMouseDown, onMouseMove, onMouseUp };
    }
    
    _updateSelectionBox() {
        if (!this.selectionBox || !this.previewCropArea) return;
        
        this.selectionBox.style.left = `${this.previewCropArea.x}px`;
        this.selectionBox.style.top = `${this.previewCropArea.y}px`;
        this.selectionBox.style.width = `${this.previewCropArea.width}px`;
        this.selectionBox.style.height = `${this.previewCropArea.height}px`;
        
        if (this.dimensionsDisplay) {
            this.dimensionsDisplay.textContent = `${Math.round(this.previewCropArea.width)} x ${Math.round(this.previewCropArea.height)} px`;
        }
    }
    
    _createPreviewControls() {
        // Create controls container
        const controls = document.createElement('div');
        controls.id = 'screenshot-preview-controls';
        controls.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2000;
            display: flex;
            gap: 10px;
            background: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
        
        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = '<i class="fa-solid fa-download mr-2"></i>İndir';
        downloadBtn.style.cssText = `
            background: #10b981;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            transition: background 0.2s;
        `;
        downloadBtn.onmouseover = () => downloadBtn.style.background = '#059669';
        downloadBtn.onmouseout = () => downloadBtn.style.background = '#10b981';
        downloadBtn.onclick = () => {
            this._captureScreenshot(this.previewCropArea);
            this._removePreviewControls();
            this.deactivate();
        };
        
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.innerHTML = '<i class="fa-solid fa-times mr-2"></i>İptal';
        cancelBtn.style.cssText = `
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            transition: background 0.2s;
        `;
        cancelBtn.onmouseover = () => cancelBtn.style.background = '#dc2626';
        cancelBtn.onmouseout = () => cancelBtn.style.background = '#ef4444';
        cancelBtn.onclick = () => {
            this._removePreviewControls();
            this.cancel();
        };
        
        controls.appendChild(downloadBtn);
        controls.appendChild(cancelBtn);
        
        document.body.appendChild(controls);
        this.previewControls = controls;
    }
    
    _removePreviewControls() {
        if (this.previewControls && this.previewControls.parentNode) {
            this.previewControls.parentNode.removeChild(this.previewControls);
        }
        this.previewControls = null;
        this.previewCropArea = null;
    }
    
    // Private Capture Methods
    
    async _captureScreenshot(cropArea) {
        try {
            // Use html2canvas to capture DOM elements along with map
            await this._captureWithHtml2Canvas(cropArea);
        } catch (error) {
            console.error('Screenshot capture failed:', error);
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('❌ Ekran görüntüsü alınamadı.', 'error', 3000);
            }
        }
    }
    
    async _captureWithHtml2Canvas(cropArea) {
        const dpr = window.devicePixelRatio || 1;
        const scaledCropArea = {
            x: Math.round(cropArea.x * dpr),
            y: Math.round(cropArea.y * dpr),
            width: Math.round(cropArea.width * dpr),
            height: Math.round(cropArea.height * dpr)
        };
        
        // Create final canvas
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = scaledCropArea.width;
        finalCanvas.height = scaledCropArea.height;
        const finalCtx = finalCanvas.getContext('2d');
        
        // Step 1: Capture map canvas first (WebGL)
        try {
            await new Promise((resolve) => {
                const captureMap = () => {
                    const mapCanvas = this.map.getCanvas();
                    finalCtx.drawImage(
                        mapCanvas,
                        scaledCropArea.x, scaledCropArea.y, scaledCropArea.width, scaledCropArea.height,
                        0, 0, scaledCropArea.width, scaledCropArea.height
                    );
                    resolve();
                };
                this.map.once('render', captureMap);
                this.map.triggerRepaint();
            });
        } catch (err) {
            console.error('Map canvas capture failed:', err);
        }
        
        // Step 2: Capture DOM overlays with html2canvas
        if (typeof html2canvas === 'function') {
            const mapMain = document.getElementById('map-main');
            if (mapMain) {
                try {
                    // Hide the map canvas temporarily for html2canvas
                    const mapCanvasEl = this.map.getCanvas();
                    const originalVisibility = mapCanvasEl.style.visibility;
                    mapCanvasEl.style.visibility = 'hidden';
                    
                    const overlayCanvas = await html2canvas(mapMain, {
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: null,
                        scale: dpr,
                        logging: false,
                        ignoreElements: (element) => {
                            // Ignore selection overlay and map canvas
                            return element.id === 'screenshot-selection-overlay' ||
                                   element.classList.contains('screenshot-overlay') ||
                                   element.classList.contains('maplibregl-canvas') ||
                                   element.tagName === 'CANVAS';
                        }
                    });
                    
                    // Restore map canvas visibility
                    mapCanvasEl.style.visibility = originalVisibility;
                    
                    // Draw DOM overlays on top of map
                    finalCtx.drawImage(
                        overlayCanvas,
                        scaledCropArea.x, scaledCropArea.y, scaledCropArea.width, scaledCropArea.height,
                        0, 0, scaledCropArea.width, scaledCropArea.height
                    );
                    
                    console.log('DOM overlays captured successfully');
                } catch (err) {
                    console.warn('html2canvas overlay capture failed:', err);
                }
            }
        }
        
        // Step 3: Convert to blob and download
        finalCanvas.toBlob((blob) => {
            if (blob && blob.size > 0) {
                const filename = this._generateFilename();
                this._downloadImage(blob, filename);
                
                if (typeof showEducationalFeedback === 'function') {
                    showEducationalFeedback(`✅ Ekran görüntüsü kaydedildi: ${filename}`);
                }
            } else {
                console.error('Screenshot blob is empty');
                if (typeof window.showFeedback === 'function') {
                    window.showFeedback('❌ Ekran görüntüsü boş.', 'error', 3000);
                }
            }
        }, 'image/png');
    }
    
    async _captureCanvasOnly(cropArea) {
        return new Promise((resolve, reject) => {
            const captureFrame = () => {
                try {
                    const canvas = this.map.getCanvas();
                    const dpr = window.devicePixelRatio || 1;
                    
                    const scaledCropArea = {
                        x: Math.round(cropArea.x * dpr),
                        y: Math.round(cropArea.y * dpr),
                        width: Math.round(cropArea.width * dpr),
                        height: Math.round(cropArea.height * dpr)
                    };
                    
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = scaledCropArea.width;
                    tempCanvas.height = scaledCropArea.height;
                    
                    const ctx = tempCanvas.getContext('2d');
                    ctx.drawImage(
                        canvas,
                        scaledCropArea.x, scaledCropArea.y, scaledCropArea.width, scaledCropArea.height,
                        0, 0, scaledCropArea.width, scaledCropArea.height
                    );
                    
                    tempCanvas.toBlob((blob) => {
                        if (blob && blob.size > 0) {
                            const filename = this._generateFilename();
                            this._downloadImage(blob, filename);
                            
                            if (typeof showEducationalFeedback === 'function') {
                                showEducationalFeedback(`✅ Ekran görüntüsü kaydedildi: ${filename}`);
                            }
                            resolve();
                        } else {
                            reject(new Error('Empty blob'));
                        }
                    }, 'image/png');
                } catch (err) {
                    reject(err);
                }
            };
            
            this.map.once('render', captureFrame);
            this.map.triggerRepaint();
        });
    }
    
    _generateFilename() {
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + '-' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
        return `harita-screenshot-${timestamp}.png`;
    }
    
    _downloadImage(blob, filename) {
        try {
            const url = URL.createObjectURL(blob);
            console.log('Download URL created:', url, 'Blob size:', blob.size);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            
            // Use setTimeout to ensure the link is in DOM before clicking
            setTimeout(() => {
                link.click();
                console.log('Download link clicked');
                
                // Clean up after a delay
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    console.log('Download cleanup complete');
                }, 100);
            }, 0);
        } catch (error) {
            console.error('Download failed:', error);
            
            // Fallback: open in new tab
            try {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                console.log('Opened in new tab as fallback');
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
        }
    }
}

// Export to window for global access
if (typeof window !== 'undefined') {
    window.ScreenshotSelectionTool = ScreenshotSelectionTool;
}
