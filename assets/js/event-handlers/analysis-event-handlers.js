/**
 * Analysis Event Handlers Module
 * Handles spatial analysis operations: buffer, clustering, convex hull, voronoi, heatmap
 * Part of the modularized EventHandlers system
 */

class AnalysisEventHandlers {
    constructor(config) {
        this.map = config.map;
        this.userMarkers = config.userMarkers;
    }

    initialize() {
        this.setupAnalysisHandlers();
    }

    setupAnalysisHandlers() {
        // Buffer analysis
        const bufferBtn = document.getElementById('buffer-analysis');
        if (bufferBtn && typeof window.spatialAnalysis !== 'undefined') {
            bufferBtn.addEventListener('click', () => {
                // Use requestAnimationFrame to avoid blocking paint
                requestAnimationFrame(async () => {
                    if (window.bufferActive) {
                        // Clear buffer layers (MapLibre) - defer to next frame
                        requestAnimationFrame(() => {
                            if (window.map.getLayer('buffer-fills')) {
                                window.map.removeLayer('buffer-fills');
                            }
                            if (window.map.getLayer('buffer-outlines')) {
                                window.map.removeLayer('buffer-outlines');
                            }
                            if (window.map.getSource('buffers')) {
                                window.map.removeSource('buffers');
                            }

                            // Clear HTML label markers
                            if (window.bufferLabelMarkers) {
                                window.bufferLabelMarkers.forEach(marker => marker.remove());
                                window.bufferLabelMarkers = [];
                            }

                            // Hide floating buffer controls
                            this.hideBufferControls();

                            window.bufferActive = false;
                            window.uiStateManager.setSelectedStyles(bufferBtn, {
                                bg: 'bg-purple-100',
                                ring: 'ring-purple-300',
                                border: 'border-l-4 border-purple-500',
                                isSelected: false
                            });
                        });
                        return;
                    }

                    // Haritadaki görünür verileri al (database yerine)
                    const visibleMarkers = [];
                    if (window.markerManager && window.markerManager.markers) {
                        window.markerManager.markers.forEach((marker, id) => {
                            const markerData = this.userMarkers.find(m => m.id === id);
                            if (markerData) visibleMarkers.push(markerData);
                        });
                    }

                    const pointMarkers = visibleMarkers.filter(m => m.type === 'point' || !m.type);

                    if (pointMarkers.length === 0) {
                        if (typeof window.showFeedback === 'function') {
                            window.showFeedback('⚠️ Etki alanı analizi için haritada en az bir nokta verisi olmalı.', 'warning', 3000);
                        }
                        return;
                    }

                    const radii = await window.dialogManager.showMultipleRadiusDialog(pointMarkers);
                    if (!radii) return;

                    // Defer heavy computation
                    requestAnimationFrame(() => {
                        window.spatialAnalysis.createBufferAnalysisMultiple(radii, pointMarkers);
                        window.bufferActive = true;
                        window.uiStateManager.setSelectedStyles(bufferBtn, {
                            bg: 'bg-purple-100',
                            ring: 'ring-purple-300',
                            border: 'border-l-4 border-purple-500',
                            isSelected: true
                        });

                        // Show floating buffer controls
                        this.showBufferControls();
                    });
                });
            });
        }

        // Other analysis buttons
        const analysisButtons = [
            { id: 'toggle-cluster', method: 'toggleClustering', update: 'updateClusterButtonSelection' },
            { id: 'build-convex', method: 'buildConvexHull', update: 'updateAnalysisButtonSelection' },
            { id: 'build-voronoi', method: 'buildVoronoi', update: 'updateAnalysisButtonSelection' },
            { id: 'nearest-facility', method: 'nearestFacility', update: 'updateAnalysisButtonSelection' },
            { id: 'toggle-heatmap', method: 'toggleHeatmap', update: 'updateHeatButtonSelection' }
        ];

        analysisButtons.forEach(({ id, method, update }) => {
            const btn = document.getElementById(id);
            if (btn && typeof window.spatialAnalysis !== 'undefined' && window.spatialAnalysis[method]) {
                btn.addEventListener('click', () => {
                    window.spatialAnalysis[method]();
                    if (window.uiStateManager && window.uiStateManager[update]) {
                        window.uiStateManager[update]();
                    }
                });
            }
        });

        // Heatmap sliders with debounce
        const heatRadius = document.getElementById('heat-radius');
        const heatBlur = document.getElementById('heat-blur');
        const heatRadiusVal = document.getElementById('heat-radius-val');
        const heatBlurVal = document.getElementById('heat-blur-val');

        if (heatRadius && heatBlur) {
            let radiusTimeout;
            let blurTimeout;

            heatRadius.addEventListener('input', function() {
                heatRadiusVal.textContent = this.value;

                // Debounce: Performans için
                clearTimeout(radiusTimeout);
                radiusTimeout = setTimeout(() => {
                    if (typeof window.spatialAnalysis !== 'undefined' && window.spatialAnalysis.refreshHeatmapIfAny) {
                        window.spatialAnalysis.refreshHeatmapIfAny();
                    }
                }, 100);
            });

            heatBlur.addEventListener('input', function() {
                heatBlurVal.textContent = this.value;

                // Debounce: Performans için
                clearTimeout(blurTimeout);
                blurTimeout = setTimeout(() => {
                    if (typeof window.spatialAnalysis !== 'undefined' && window.spatialAnalysis.refreshHeatmapIfAny) {
                        window.spatialAnalysis.refreshHeatmapIfAny();
                    }
                }, 100);
            });
        }

        // Intensity slider handled by initializeHeatmapSliders() in spatial-analysis.js
    }

    showBufferControls() {
        // Check if panel already exists
        let panel = document.getElementById('buffer-controls-floating');

        if (!panel) {
            // Create floating panel
            panel = document.createElement('div');
            panel.id = 'buffer-controls-floating';
            panel.style.cssText = `
                position: fixed;
                top: 80px;
                right: 280px;
                background: white;
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                z-index: 1000;
                min-width: 220px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            `;

            panel.innerHTML = `
                <div id="buffer-panel-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; cursor: move; user-select: none; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: 600; color: #10b981; font-size: 14px;">Etki Analizi Modu</div>
                    <button id="buffer-controls-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #6b7280; line-height: 1; padding: 0;">×</button>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px;">
                    <button id="buffer-mode-normal" style="padding: 6px 8px; font-size: 11px; border-radius: 4px; background: #d1fae5; border: 1px solid #10b981; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 4px; justify-content: center;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span>Normal
                    </button>
                    <button id="buffer-mode-union" style="padding: 6px 8px; font-size: 11px; border-radius: 4px; background: white; border: 1px solid #d1d5db; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 4px; justify-content: center;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; display: inline-block;"></span>Birleşik
                    </button>
                    <button id="buffer-mode-intersection" style="padding: 6px 8px; font-size: 11px; border-radius: 4px; background: white; border: 1px solid #d1d5db; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 4px; justify-content: center;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; display: inline-block;"></span>Kesişim
                    </button>
                    <button id="buffer-mode-difference" style="padding: 6px 8px; font-size: 11px; border-radius: 4px; background: white; border: 1px solid #d1d5db; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 4px; justify-content: center;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #8b5cf6; display: inline-block;"></span>Fark
                    </button>
                </div>
                <button id="buffer-show-stats" style="width: 100%; padding: 8px; font-size: 12px; border-radius: 4px; background: #d1fae5; border: 1px solid #10b981; cursor: pointer; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fa-solid fa-chart-bar"></i>İstatistikler
                </button>
            `;

            document.body.appendChild(panel);

            // Make panel draggable
            const header = panel.querySelector('#buffer-panel-header');
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;

            header.addEventListener('mousedown', (e) => {
                if (e.target.id === 'buffer-controls-close') return;

                isDragging = true;
                const rect = panel.getBoundingClientRect();
                initialX = e.clientX - rect.left;
                initialY = e.clientY - rect.top;

                panel.style.transition = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                // Keep panel within viewport
                const maxX = window.innerWidth - panel.offsetWidth;
                const maxY = window.innerHeight - panel.offsetHeight;

                currentX = Math.max(0, Math.min(currentX, maxX));
                currentY = Math.max(0, Math.min(currentY, maxY));

                panel.style.left = currentX + 'px';
                panel.style.top = currentY + 'px';
                panel.style.right = 'auto';
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    panel.style.transition = '';
                }
            });

            // Setup event handlers
            this.setupBufferModeHandlers();

            // Close button
            document.getElementById('buffer-controls-close').addEventListener('click', () => {
                this.hideBufferControls();
            });

            // Stats button
            document.getElementById('buffer-show-stats').addEventListener('click', () => {
                if (window.spatialAnalysis && typeof window.spatialAnalysis.showBufferStatistics === 'function') {
                    window.spatialAnalysis.showBufferStatistics();
                }
            });
        } else {
            panel.style.display = 'block';
        }
    }

    hideBufferControls() {
        const panel = document.getElementById('buffer-controls-floating');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    setupBufferModeHandlers() {
        const modes = ['normal', 'union', 'intersection', 'difference'];
        const modeColors = {
            'normal': '#10b981',      // Emerald
            'union': '#3b82f6',       // Blue
            'intersection': '#f59e0b', // Amber
            'difference': '#8b5cf6'   // Purple
        };
        const modeBgColors = {
            'normal': '#d1fae5',      // Light Emerald
            'union': '#dbeafe',       // Light Blue
            'intersection': '#fef3c7', // Light Amber
            'difference': '#ede9fe'   // Light Purple
        };

        modes.forEach(mode => {
            const btn = document.getElementById(`buffer-mode-${mode}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    // Update mode
                    if (window.spatialAnalysis && typeof window.spatialAnalysis.setBufferMode === 'function') {
                        window.spatialAnalysis.setBufferMode(mode);
                    }

                    // Update button styles
                    modes.forEach(m => {
                        const mBtn = document.getElementById(`buffer-mode-${m}`);
                        if (mBtn) {
                            if (m === mode) {
                                mBtn.style.background = modeBgColors[m];
                                mBtn.style.borderColor = modeColors[m];
                            } else {
                                mBtn.style.background = 'white';
                                mBtn.style.borderColor = '#d1d5db';
                            }
                        }
                    });
                });
            }
        });
    }
}

// Make it globally available
window.AnalysisEventHandlers = AnalysisEventHandlers;
