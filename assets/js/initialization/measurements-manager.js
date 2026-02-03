/**
 * Measurements Manager
 * Handles measurement tools, label manager, and measurement clearing
 * Part of the modularized initialization system
 */

/**
 * Clear all measurements and analysis results
 * Resets measurement tools, analysis states, and clears all map sources
 */
function clearAllMeasurements() {
    if (!window.map) {
        if (window.Logger && typeof window.Logger.error === 'function') {
            Logger.error('Map not initialized');
        } else {
            console.error('Map not initialized');
        }
        return;
    }

    // Check if map is fully loaded (has getSource method)
    if (!window.map.getSource || typeof window.map.getSource !== 'function') {
        if (window.Logger && typeof window.Logger.warn === 'function') {
            Logger.warn('Map not fully loaded yet');
        } else {
            console.warn('Map not fully loaded yet');
        }
        return;
    }

    // Clear measurements source
    const measurementSource = window.map.getSource('measurements');
    if (measurementSource) {
        measurementSource.setData({
            type: 'FeatureCollection',
            features: []
        });
    }

    // Clear distance measurement sources
    const distanceSource = window.map.getSource('distance-measurements');
    if (distanceSource) {
        distanceSource.setData({
            type: 'FeatureCollection',
            features: []
        });
    }

    const distanceGhostSource = window.map.getSource('distance-ghost');
    if (distanceGhostSource) {
        distanceGhostSource.setData({
            type: 'FeatureCollection',
            features: []
        });
    }

    // Clear area measurement sources
    const areaSource = window.map.getSource('area-measurements');
    if (areaSource) {
        areaSource.setData({
            type: 'FeatureCollection',
            features: []
        });
    }

    const areaGhostSource = window.map.getSource('area-ghost');
    if (areaGhostSource) {
        areaGhostSource.setData({
            type: 'FeatureCollection',
            features: []
        });
    }

    // Clear buffers source
    const bufferSource = window.map.getSource('buffers');
    if (bufferSource) {
        bufferSource.setData({
            type: 'FeatureCollection',
            features: []
        });
    }

    // Clear analysis sources
    const convexSource = window.map.getSource('convex-hull');
    if (convexSource) {
        convexSource.setData({
            type: 'FeatureCollection',
            features: []
        });
    }

    const voronoiSource = window.map.getSource('voronoi');
    if (voronoiSource) {
        voronoiSource.setData({
            type: 'FeatureCollection',
            features: []
        });
    }

    const nearestSource = window.map.getSource('nearest-facility');
    if (nearestSource) {
        nearestSource.setData({
            type: 'FeatureCollection',
            features: []
        });
    }

    // Remove all measurement markers
    if (window.distanceMeasurementTool && window.distanceMeasurementTool.markers) {
        window.distanceMeasurementTool.markers.forEach(marker => marker.remove());
        window.distanceMeasurementTool.markers = [];
    }

    if (window.areaMeasurementTool && window.areaMeasurementTool.markers) {
        window.areaMeasurementTool.markers.forEach(marker => marker.remove());
        window.areaMeasurementTool.markers = [];
    }

    // Remove measurement popups
    if (window.distanceMeasurementTool && window.distanceMeasurementTool.resultPopup) {
        window.distanceMeasurementTool.resultPopup.remove();
        window.distanceMeasurementTool.resultPopup = null;
    }

    if (window.areaMeasurementTool && window.areaMeasurementTool.resultPopup) {
        window.areaMeasurementTool.resultPopup.remove();
        window.areaMeasurementTool.resultPopup = null;
    }

    // Reset measurement tools state
    if (window.distanceMeasurementTool) {
        window.distanceMeasurementTool.points = [];
        window.distanceMeasurementTool.isActive = false;
        window.distanceMeasurementTool.isDrawing = false;
    }

    if (window.areaMeasurementTool) {
        window.areaMeasurementTool.points = [];
        window.areaMeasurementTool.isActive = false;
        window.areaMeasurementTool.isDrawing = false;
    }

    // Reset cursor
    window.map.getContainer().style.cursor = '';

    // Reset analysis states
    if (window.analysisStates) {
        window.analysisStates.convex = false;
        window.analysisStates.voronoi = false;
        window.analysisStates.nearest = false;
    }
    window.bufferActive = false;

    // Update UI
    if (window.uiStateManager) {
        window.uiStateManager.updateMeasurementSelection();
        window.uiStateManager.updateClusterButtonSelection();
        window.uiStateManager.updateHeatButtonSelection();
        window.uiStateManager.updateAnalysisButtonSelection();
        window.uiStateManager.setSelectedStyles(
            document.getElementById('buffer-analysis'),
            { bg: 'bg-purple-100', ring: 'ring-purple-300', border: 'border-l-4 border-purple-500', isSelected: false }
        );
    }

    // Clear measurements array
    if (Array.isArray(window.measurements)) {
        window.measurements.length = 0;
    }

    if (typeof showEducationalFeedback === 'function') {
        showEducationalFeedback('🧹 Tüm ölçümler ve analizler temizlendi. Yeni ölçümler yapabilirsiniz.');
    }
}

/**
 * Initialize Label Manager
 * Polls for LabelManager availability and initializes it
 * Note: Event listeners are handled by visualization-handlers.js
 */
function initializeLabelManager() {
    if (window.map && window.LabelManager) {
        // DI Migration: Try to get LabelManager from ServiceLocator
        if (window.ServiceLocator && window.ServiceLocator.has('labelManager')) {
            window.labelManager = window.ServiceLocator.get('labelManager');
            Logger.log('✅ Label Manager obtained from DI Container');
        } else {
            window.labelManager = new LabelManager(window.map);
            Logger.log('✅ Label Manager initialized manually (event listeners in visualization-handlers.js)');
        }
    } else {
        // Module not yet loaded, retry after delay
        setTimeout(initializeLabelManager, 100);
    }
}

/**
 * Initialize Screenshot Selection Tool
 * Sets up button handler for screenshot selection
 */
function initializeScreenshotTool() {
    // Safe logger wrapper
    const safeLog = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);

    if (!window.map) {
        setTimeout(initializeScreenshotTool, 100);
        return;
    }

    // Initialize the tool if ScreenshotSelectionTool class is available
    if (window.ScreenshotSelectionTool && !window.screenshotSelectionTool) {
        window.screenshotSelectionTool = new ScreenshotSelectionTool(window.map);
        safeLog('✅ Screenshot Selection Tool initialized');
    }

    // Screenshot selection button handler
    const screenshotBtn = document.getElementById('screenshot-selection');
    if (screenshotBtn && window.screenshotSelectionTool) {
        screenshotBtn.addEventListener('click', function() {
            // Deactivate other measurement tools if active
            if (window.distanceMeasurementTool && window.distanceMeasurementTool.isActive) {
                window.distanceMeasurementTool.deactivate();
            }
            if (window.areaMeasurementTool && window.areaMeasurementTool.isActive) {
                window.areaMeasurementTool.deactivate();
            }

            // Toggle screenshot selection tool
            window.screenshotSelectionTool.activate();

            // Update button visual state
            if (window.screenshotSelectionTool.isActive) {
                screenshotBtn.classList.add('tool-active');
            } else {
                screenshotBtn.classList.remove('tool-active');
            }
        });
        safeLog('✅ Screenshot button handler attached');
    }
}

/**
 * Initialize measurement tools
 * Sets up button handlers for distance and area measurement
 * Registers handlers with MapClickOrchestrator
 */
async function initializeMeasurementTools() {
    // Safe logger wrapper
    const safeLog = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
    const safeError = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

    // Güvenlik ağı: En fazla 5 saniye bekle
    const timeout = new Promise((resolve) => setTimeout(() => {
        resolve('TIMEOUT');
    }, 5000));

    try {
        // Araçların hazır olmasını bekle (en fazla 5 saniye)
        const distanceResult = await Promise.race([
            window.distanceMeasurementReady || Promise.reject('no-promise'),
            timeout
        ]);

        const areaResult = await Promise.race([
            window.areaMeasurementReady || Promise.reject('no-promise'),
            timeout
        ]);

        // Timeout kontrolü
        if (distanceResult === 'TIMEOUT') {
            safeError('⚠️ Mesafe ölçüm aracı 5 saniye içinde yüklenemedi!');
        }
        if (areaResult === 'TIMEOUT') {
            safeError('⚠️ Alan ölçüm aracı 5 saniye içinde yüklenemedi!');
        }

        // Distance measurement button handler
        const measureDistanceBtn = document.getElementById('measure-distance');
        if (measureDistanceBtn) {
            measureDistanceBtn.addEventListener('click', function() {
                if (!window.distanceMeasurementTool) {
                    safeError('❌ Mesafe ölçüm aracı hazır değil!');
                    if (typeof showEducationalFeedback === 'function') {
                        showEducationalFeedback('⚠️ Mesafe ölçüm aracı henüz yüklenmedi. Lütfen sayfayı yenileyin.');
                    }
                    return;
                }

                // Deactivate area measurement if active
                if (window.areaMeasurementTool && window.areaMeasurementTool.isActive) {
                    window.areaMeasurementTool.deactivate();
                }

                window.distanceMeasurementTool.activate();

                if (window.uiStateManager && window.uiStateManager.updateMeasurementSelection) {
                    window.uiStateManager.updateMeasurementSelection();
                }

                if (window.distanceMeasurementTool.isActive && typeof showEducationalFeedback === 'function') {
                    showEducationalFeedback('📏 Gelişmiş mesafe ölçümü aktif! Haritada noktalara tıklayın, çift tıklayarak bitirin. ESC ile iptal edin.');
                }
            });
            safeLog('✅ Mesafe ölçüm butonu hazır');
        }

        // Area measurement button handler
        const measureAreaBtn = document.getElementById('measure-area');
        if (measureAreaBtn) {
            measureAreaBtn.addEventListener('click', function() {
                if (!window.areaMeasurementTool) {
                    safeError('❌ Alan ölçüm aracı hazır değil!');
                    if (typeof showEducationalFeedback === 'function') {
                        showEducationalFeedback('⚠️ Alan ölçüm aracı henüz yüklenmedi. Lütfen sayfayı yenileyin.');
                    }
                    return;
                }

                // Deactivate distance measurement if active
                if (window.distanceMeasurementTool && window.distanceMeasurementTool.isActive) {
                    window.distanceMeasurementTool.deactivate();
                }

                // Toggle area measurement
                window.areaMeasurementTool.activate();

                if (window.uiStateManager && window.uiStateManager.updateMeasurementSelection) {
                    window.uiStateManager.updateMeasurementSelection();
                }
            });
            safeLog('✅ Alan ölçüm butonu hazır');
        }

    } catch (error) {
        safeError('❌ Ölçüm araçları başlatılamadı:', error);
    }

    // ==========================================
    // REGISTER MAP CLICK HANDLERS WITH ORCHESTRATOR
    // ==========================================
    // Promise-based initialization - wait for tools to be ready
    (async () => {
        if (window.mapClickOrchestrator) {

            // Priority 100: Measurement tools (highest priority when active)
            // Wait for distance measurement tool to be ready
            if (window.distanceMeasurementReady) {
                await window.distanceMeasurementReady;
                window.mapClickOrchestrator.registerHandler({
                    name: 'distance-measurement',
                    priority: 100,
                    canHandle: () => window.distanceMeasurementTool.canHandleClick(),
                    handle: (e) => {
                        window.distanceMeasurementTool.handleMapClick(e);
                        return true; // Stop propagation
                    }
                });
            }

            // Wait for area measurement tool to be ready
            if (window.areaMeasurementReady) {
                await window.areaMeasurementReady;
                window.mapClickOrchestrator.registerHandler({
                    name: 'area-measurement',
                    priority: 100,
                    canHandle: () => window.areaMeasurementTool.canHandleClick(),
                    handle: (e) => {
                        window.areaMeasurementTool.handleMapClick(e);
                        return true; // Stop propagation
                    }
                });
            }

            // Priority 50: Data drawing mode
            if (window.dataDrawing) {
                window.mapClickOrchestrator.registerHandler({
                    name: 'data-drawing',
                    priority: 50,
                    canHandle: () => window.dataDrawing.canHandleClick(),
                    handle: (e) => {
                        window.dataDrawing.handleMapClick(e);
                        return true; // Stop propagation
                    }
                });
            }
        }
    })();
}

// Make functions globally available
window.clearAllMeasurements = clearAllMeasurements;
window.initializeLabelManager = initializeLabelManager;
window.initializeMeasurementTools = initializeMeasurementTools;
window.initializeScreenshotTool = initializeScreenshotTool;
