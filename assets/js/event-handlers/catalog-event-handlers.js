/**
 * Catalog Event Handlers Module
 * Handles catalog operations, import/export, and report generation
 * Part of the modularized EventHandlers system
 */

// G�venli Logger helper'lar�
const safeLogCat = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeWarnCat = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorCat = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

class CatalogEventHandlers {
    constructor(config) {
        this.map = config.map;
        this.importExport = config.importExport;
        this.reportGeneration = config.reportGeneration;
        this.userMarkers = config.userMarkers;
    }

    initialize() {
        this.setupCatalogHandlers();
        this.setupImportExportHandlers();
        this.setupReportHandlers();
    }

    setupCatalogHandlers() {
        const clearCatalogBtn = document.getElementById('clear-catalog-map');
        if (clearCatalogBtn) {
            clearCatalogBtn.addEventListener('click', () => {
                try {
                    // Clear all markers and geometries using MarkerManager's clearAllData method
                    if (window.markerManager && typeof window.markerManager.clearAllData === 'function') {
                        window.markerManager.clearAllData();
                    }

                    // Clear catalogGeometryLayers array
                    if (Array.isArray(window.catalogGeometryLayers) && window.catalogGeometryLayers.length > 0) {
                        window.catalogGeometryLayers.length = 0;
                    }

                    // Hide and clear heatmap (heatmap is created from catalog data)
                    if (this.map.getLayer('heatmap-layer')) {
                        this.map.setLayoutProperty('heatmap-layer', 'visibility', 'none');
                    }

                    const heatmapSource = this.map.getSource('heatmap');
                    if (heatmapSource) {
                        heatmapSource.setData({
                            type: 'FeatureCollection',
                            features: []
                        });
                    }

                    // Hide cluster layers
                    const clusterLayers = ['clusters', 'cluster-count', 'unclustered-point'];
                    clusterLayers.forEach(layerId => {
                        if (this.map.getLayer(layerId)) {
                            this.map.setLayoutProperty(layerId, 'visibility', 'none');
                        }
                    });

                    // NOTE: Veri tabanı (window.userMarkers) korunuyor - sadece haritadan temizleniyor
                    // Kullanıcı dilerse verileri tekrar haritaya ekleyebilir

                    if (typeof showEducationalFeedback === 'function') {
                        showEducationalFeedback('🧹 Harita temizlendi. Katalog verileri korundu.');
                    }
                } catch (err) {
                    safeErrorCat('Katalog temizleme hatası:', err);
                    if (typeof window.showFeedback === 'function') {
                        window.showFeedback('❌ Harita temizlenemedi: ' + (err && err.message ? err.message : err), 'error', 3500);
                    }
                }
            });
        }
    }

    setupImportExportHandlers() {
        // Export
        const saveMapBtn = document.getElementById('save-map-btn');
        if (saveMapBtn) {
            saveMapBtn.addEventListener('click', () => {
                if (this.userMarkers.length === 0) {
                    if (typeof window.showFeedback === 'function') {
                        window.showFeedback('⚠️ Kaydedilecek veri bulunmuyor. Lütfen önce haritaya veri ekleyin.', 'warning', 3000);
                    }
                    return;
                }

                const exportFormat = document.getElementById('export-format').value;
                const mapPurpose = document.getElementById('map-purpose').value || 'CBS_Projesi';
                const fileName = mapPurpose.replace(/[^a-z0-9]/gi, '_').toLowerCase();

                switch(exportFormat) {
                    case 'geojson':
                        this.importExport.exportAsGeoJSON(fileName, this.userMarkers);
                        break;
                    case 'kml':
                        this.importExport.exportAsKML(fileName, this.userMarkers);
                        break;
                    case 'kmz':
                        this.importExport.exportAsKMZ(fileName, this.userMarkers);
                        break;
                    case 'shp':
                        this.importExport.exportAsShapefile(fileName, this.userMarkers);
                        break;
                    case 'csv':
                        this.importExport.exportAsCSV(fileName, this.userMarkers);
                        break;
                    case 'xlsx':
                        this.importExport.exportAsXLSX(fileName, this.userMarkers);
                        break;
                }
            });
        }

        // Import
        const loadMapInput = document.getElementById('load-map-input');
        if (loadMapInput) {
            loadMapInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;

                const fileExtension = file.name.split('.').pop().toLowerCase();
                const clearCallback = this.getClearCallback();

                if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                    this.importExport.importFromXLSX(file, this.userMarkers, clearCallback, true);
                } else if (fileExtension === 'csv') {
                    this.importExport.importFromCSV(file, this.userMarkers, clearCallback, true);
                } else if (fileExtension === 'geojson') {
                    this.importExport.importFromGeoJSON(file, this.userMarkers, clearCallback);
                } else if (fileExtension === 'kml') {
                    this.importExport.importFromKML(file, this.userMarkers, clearCallback);
                } else if (fileExtension === 'kmz') {
                    this.importExport.importFromKMZ(file, this.userMarkers, clearCallback);
                } else if (fileExtension === 'shp' || fileExtension === 'zip') {
                    // Shapefile or ZIP archive containing shapefile components
                    this.importExport.importFromShapefile(file, this.userMarkers, clearCallback);
                } else {
                    if (typeof window.showFeedback === 'function') {
                        window.showFeedback(
                            '⚠️ Desteklenmeyen dosya formatı!\n\n' +
                            '✅ Desteklenen formatlar:\n' +
                            '  • .geojson - GeoJSON\n' +
                            '  • .kml - Google Earth KML\n' +
                            '  • .kmz - Sıkıştırılmış KML\n' +
                            '  • .shp - ESRI Shapefile (tek dosya)\n' +
                            '  • .zip - Shapefile ZIP arşivi (önerilen)\n' +
                            '  • .csv - CSV veri dosyası\n' +
                            '  • .xlsx / .xls - Excel dosyası',
                            'warning',
                            5000
                        );
                    }
                }

                loadMapInput.value = '';
            });
        }

        // Import from URL
        const importUrlBtn = document.getElementById('import-url-btn');
        const importUrlInput = document.getElementById('import-url-input');

        if (importUrlBtn && importUrlInput) {
            // Button click handler
            importUrlBtn.addEventListener('click', () => {
                const url = importUrlInput.value.trim();
                if (!url) {
                    if (typeof window.showFeedback === 'function') {
                        window.showFeedback('⚠️ Lütfen bir URL girin.', 'warning', 3000);
                    }
                    importUrlInput.focus();
                    return;
                }

                const clearCallback = this.getClearCallback();
                this.importExport.importFromURL(url, this.userMarkers, clearCallback);
            });

            // Enter key handler for input
            importUrlInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    importUrlBtn.click();
                }
            });
        }
    }

    setupReportHandlers() {
        // Generate report
        const generateReportBtn = document.getElementById('generate-report');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => {
                if (this.userMarkers.length === 0) {
                    if (typeof window.showFeedback === 'function') {
                        window.showFeedback('⚠️ Rapor oluşturmak için önce veri ekleyin.', 'warning', 3000);
                    }
                    return;
                }
                this.reportGeneration.generateAnalysisReport(this.userMarkers);
            });
        }
    }

    getClearCallback() {
        return () => {
            // Clear userMarkers array
            this.userMarkers.length = 0;

            // Clear all map markers and geometries properly
            if (window.markerManager && typeof window.markerManager.clearAllData === 'function') {
                window.markerManager.clearAllData();
            }

            // Clear catalog geometries source
            const catalogSource = this.map.getSource('catalog-geometries');
            if (catalogSource) {
                catalogSource.setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }

            // Clear measurements source
            const measurementSource = this.map.getSource('measurements');
            if (measurementSource) {
                measurementSource.setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }

            // Clear buffers source
            const bufferSource = this.map.getSource('buffers');
            if (bufferSource) {
                bufferSource.setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }

            // Clear analysis sources
            const convexSource = this.map.getSource('convex-hull');
            if (convexSource) {
                convexSource.setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }

            const voronoiSource = this.map.getSource('voronoi');
            if (voronoiSource) {
                voronoiSource.setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }

            // Clear clustering source if exists
            const clusterSource = this.map.getSource('markers-cluster');
            if (clusterSource) {
                clusterSource.setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }

            // Clear catalogGeometryLayers array
            if (Array.isArray(window.catalogGeometryLayers)) {
                window.catalogGeometryLayers.length = 0;
            }

            // Clear measurements array
            if (Array.isArray(window.measurements)) {
                window.measurements.length = 0;
            }
        };
    }
}

// Make it globally available
window.CatalogEventHandlers = CatalogEventHandlers;
