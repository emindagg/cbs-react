/**
 * KML/KMZ Handler Module
 */
class KMLHandler {
    constructor(manager) {
        this.manager = manager;
        this.log = (...args) => (window.Logger && typeof window.Logger.log === 'function') ? window.Logger.log(...args) : console.log(...args);
        this.warn = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);
    }

    /**
     * Import KML file
     */
    async importKML(file, userMarkers, clearCallback) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const kmlText = e.target.result;
                const dataManager = this.manager._getDataManager();

                if (dataManager.importFromKML(kmlText)) {
                    await this._processImportedData(dataManager.userMarkers, userMarkers, clearCallback, file.name);
                } else {
                    if (typeof window.showFeedback === 'function') window.showFeedback('❌ KML yüklenemedi.', 'error', 3000);
                }
            } catch (error) {
                this.warn('KML import error:', error);
            }
        };
        reader.readAsText(file);
    }

    /**
     * Import KMZ file
     */
    async importKMZ(file, userMarkers, clearCallback) {
        try {
            if (file.size > 1024 * 1024 && typeof window.showEducationalFeedback === 'function') {
                window.showEducationalFeedback('⏳ Büyük KMZ işleniyor...');
            }
            
            const dataManager = this.manager._getDataManager();
            if (await dataManager.importFromKMZ(file)) {
                await this._processImportedData(dataManager.userMarkers, userMarkers, clearCallback, file.name);
            }
        } catch (error) {
            this.warn('KMZ import error:', error);
            if (typeof window.showFeedback === 'function') window.showFeedback('❌ KMZ hatası: ' + error.message, 'error', 3000);
        }
    }

    /**
     * Process imported data
     */
    async _processImportedData(markers, userMarkers, clearCallback, fileName) {
        clearCallback();
        
        const totalMarkers = markers.length;
        this.log(`📍 KML/KMZ import: ${totalMarkers} veri`);

        if (totalMarkers > 1000 && !window.clusteringEnabled) {
            this.manager.enableClustering();
        }

        const fields = this.manager.utils.extractFields(markers);

        if (totalMarkers > 200) {
            await this.manager.batchProcessor.process(markers, userMarkers, totalMarkers);
        } else {
            userMarkers.push(...markers);
            markers.forEach(marker => this.manager._addMarkerToMap(marker));
        }

        this.manager._callUpdateCallback();
        this.manager.utils.showFeedback(totalMarkers, fileName);
        this.manager._showStylePanelFAB(totalMarkers, fields);
    }

    /**
     * Export to KML
     */
    exportKML(fileName, userMarkers) {
        const dataManager = this.manager._getDataManager();
        dataManager.userMarkers = userMarkers;
        const kmlContent = dataManager.exportToKML();
        this.manager.downloadFile(kmlContent, `${fileName}.kml`, 'application/vnd.google-earth.kml+xml');
        if (typeof window.showEducationalFeedback === 'function') window.showEducationalFeedback('📍 KML export edildi.');
    }

    /**
     * Export to KMZ
     */
    async exportKMZ(fileName, userMarkers) {
        const dataManager = this.manager._getDataManager();
        dataManager.userMarkers = userMarkers;
        const kmzBlob = await dataManager.exportToKMZ();
        const url = URL.createObjectURL(kmzBlob);
        this.manager.downloadFromUrl(url, `${fileName}.kmz`);
        if (typeof window.showEducationalFeedback === 'function') window.showEducationalFeedback('🗜️ KMZ export edildi.');
    }
}

window.KMLHandler = KMLHandler;
