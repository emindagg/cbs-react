/**
 * Shapefile Handler Module
 */
class ShapefileHandler {
    constructor(manager) {
        this.manager = manager;
        this.log = (...args) => (window.Logger && typeof window.Logger.log === 'function') ? window.Logger.log(...args) : console.log(...args);
        this.warn = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);
    }

    /**
     * Import Shapefile (ZIP or .shp)
     */
    async import(file, userMarkers, clearCallback) {
        try {
            const isZip = file.name.toLowerCase().endsWith('.zip');
            if (typeof window.showEducationalFeedback === 'function') {
                window.showEducationalFeedback(isZip ? '📦 ZIP işleniyor...' : '⏳ Shapefile işleniyor...');
            }

            const dataManager = this.manager._getDataManager();
            if (await dataManager.importFromShapefile(file)) {
                clearCallback();
                const markers = dataManager.userMarkers;
                
                // Fields extraction
                const fieldsSet = new Set();
                const sampleSize = Math.min(100, markers.length);
                for(let i=0; i<sampleSize; i++) {
                    if (markers[i]?.properties) Object.keys(markers[i].properties).forEach(k => fieldsSet.add(k));
                }
                const fields = Array.from(fieldsSet);

                if (markers.length > 200) {
                    await this.manager.batchProcessor.process(markers, userMarkers, markers.length);
                } else {
                    userMarkers.push(...markers);
                    markers.forEach(m => this.manager._addMarkerToMap(m));
                }

                this.manager._callUpdateCallback();
                this.manager.utils.showFeedback(markers.length, isZip ? 'ZIP' : 'Shapefile');
                this.manager._showStylePanelFAB(markers.length, fields);
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    handleError(error) {
        this.warn('Shapefile Error:', error);
        let msg = "❌ Hata oluştu.";
        
        if (error.message.includes("ZIP içinde .shp")) msg = "❌ ZIP içinde .shp dosyası eksik.";
        else if (error.message.includes("Geçersiz ZIP")) msg = "❌ Geçersiz ZIP dosyası.";
        else if (error.message.includes("kütüphanesi yüklenmemiş")) msg = "❌ shp.js kütüphanesi eksik.";
        
        if (typeof window.showFeedback === 'function') window.showFeedback(msg, 'error', 5000);
    }

    export(fileName, userMarkers) {
        const dataManager = this.manager._getDataManager();
        dataManager.userMarkers = userMarkers;
        const geojson = dataManager.exportToGeoJSON();
        this.manager.downloadFile(JSON.stringify(geojson, null, 2), `${fileName}.geojson`, 'application/geo+json');
        if (typeof window.showEducationalFeedback === 'function') {
            window.showEducationalFeedback('💡 Shapefile export için GeoJSON indirildi. QGIS ile dönüştürebilirsiniz.');
        }
    }
}

window.ShapefileHandler = ShapefileHandler;
