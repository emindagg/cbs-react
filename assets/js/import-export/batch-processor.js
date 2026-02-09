/**
 * Batch Processor Module
 * Handles large dataset processing to prevent UI freezing
 */
class BatchProcessor {
    constructor(markerManager) {
        this.markerManager = markerManager;
        
        // Logger helpers
        this.log = (...args) => (window.Logger && typeof window.Logger.log === 'function') ? window.Logger.log(...args) : console.log(...args);
        this.warn = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);
    }

    /**
     * Utility function to create a delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Process markers in chunks
     */
    async process(markers, userMarkers, totalMarkers) {
        // Hard limit for browser stability
        const HARD_LIMIT = 50000; // Increased from 25k
        const WARNING_LIMIT = 15000;
        
        if (totalMarkers > HARD_LIMIT) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback(
                    `❌ DOSYA ÇOK BÜYÜK: ${totalMarkers.toLocaleString('tr-TR')} veri! Maksimum: ${HARD_LIMIT.toLocaleString('tr-TR')}.`,
                    'error',
                    6000
                );
            }
            throw new Error('Veri limiti aşıldı');
        }
        
        // Warning for large datasets
        if (totalMarkers > WARNING_LIMIT) {
            const shouldContinue = confirm(
                `⚠️ BÜYÜK DOSYA UYARISI\n\n` +
                `${totalMarkers.toLocaleString('tr-TR')} veri yüklemeye çalışıyorsunuz.\n` +
                `İşlem biraz zaman alabilir.\n\n` +
                `Devam etmek istiyor musunuz?`
            );
            
            if (!shouldContinue) {
                throw new Error('Kullanıcı tarafından iptal edildi');
            }
        }
        
        // Adaptive batch settings
        let BATCH_SIZE = 50;
        let BATCH_DELAY = 0;
        let UPDATE_FREQUENCY = 200;
        
        if (totalMarkers > 20000) {
            BATCH_SIZE = 500;
            UPDATE_FREQUENCY = 1000;
        } else if (totalMarkers > 10000) {
            BATCH_SIZE = 300;
            UPDATE_FREQUENCY = 500;
        } else if (totalMarkers > 5000) {
            BATCH_SIZE = 200;
            UPDATE_FREQUENCY = 250;
        } else if (totalMarkers > 2000) {
            BATCH_SIZE = 100;
        }
        
        this.log(`📦 Batch import başlıyor: ${totalMarkers} veri, ${BATCH_SIZE} veri/batch`);
        
        let processed = 0;
        const startTime = Date.now();
        
        // Progress UI
        const progressModal = typeof window.ProgressModal === 'function' ? new window.ProgressModal() : null;
        if (progressModal) {
            progressModal.show('Veriler Haritaya Ekleniyor');
            progressModal.update(0, totalMarkers, 'İşlem başlatılıyor...');
        }
        
        const updateProgress = (current, total) => {
            const percentage = Math.round((current / total) * 100);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const rate = Math.round(current / (elapsed || 1));
            
            if (progressModal) {
                progressModal.update(current, total, `İşleniyor: ${percentage}%`);
                progressModal.updateRate(rate);
            }
            
            if (typeof window.showEducationalFeedback === 'function') {
                window.showEducationalFeedback(`⏳ ${percentage}% | ${rate} veri/sn`);
            }
        };
        
        // Add to user markers array
        userMarkers.push(...markers);
        
        // Separate types for optimized processing
        const geometries = markers.filter(m => m.geometry && (m.type === 'area' || m.type === 'route'));
        const circles = markers.filter(m => m.type === 'circle');
        const points = markers.filter(m => !m.geometry && m.type !== 'circle');
        
        // Start batch mode in MarkerManager
        if (this.markerManager && typeof this.markerManager.startBatch === 'function') {
            this.markerManager.startBatch();
        }

        // 1. Process Geometries
        if (geometries.length > 0 && this.markerManager) {
            updateProgress(processed, totalMarkers);
            
            geometries.forEach(marker => {
                try {
                    this.markerManager.addGeometryToMap(marker);
                } catch (err) {
                    this.warn('Geometry eklenirken hata:', marker.name, err);
                }
            });

            processed += geometries.length;
            updateProgress(processed, totalMarkers);
        }
        
        // Commit geometries
        if (this.markerManager && typeof this.markerManager.endBatch === 'function') {
            this.markerManager.endBatch();
        }

        // 2. Process Circles (Chunked)
        if (circles.length > 0 && this.markerManager) {
            for (let i = 0; i < circles.length; i += BATCH_SIZE) {
                const batch = circles.slice(i, Math.min(i + BATCH_SIZE, circles.length));
                
                await new Promise(resolve => {
                    requestAnimationFrame(() => {
                        batch.forEach(marker => {
                            try {
                                this.markerManager.addCircleToMap(marker);
                            } catch (err) {
                                this.warn('Circle eklenirken hata:', marker.name, err);
                            }
                        });
                        resolve();
                    });
                });
                
                processed += batch.length;
                if (processed % UPDATE_FREQUENCY === 0 || processed === totalMarkers) {
                    updateProgress(processed, totalMarkers);
                }
                
                if (BATCH_DELAY > 0) await this.delay(BATCH_DELAY);
            }
        }
        
        // 3. Process Points
        if (points.length > 0) {
            // Use cluster source if enabled
            if (window.clusteringEnabled && this.markerManager && window.map) {
                const source = window.map.getSource('markers');
                if (source) {
                    const clusterFeatures = points.map(p => ({
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
                        properties: { id: p.id, name: p.name, type: p.type }
                    }));
                    
                    source.setData({ type: 'FeatureCollection', features: clusterFeatures });
                    processed += points.length;
                    updateProgress(processed, totalMarkers);
                    this.log(`⚡ ${points.length} nokta cluster source'a toplu eklendi`);
                }
            } else {
                // Standard marker addition
                if (this.markerManager) {
                    for (let i = 0; i < points.length; i += BATCH_SIZE) {
                        const batch = points.slice(i, Math.min(i + BATCH_SIZE, points.length));
                        
                        await new Promise(resolve => {
                            requestAnimationFrame(() => {
                                batch.forEach(marker => {
                                    try {
                                        this.markerManager.addMarkerToMap(marker);
                                    } catch (err) {
                                        this.warn('Marker eklenirken hata:', marker.name, err);
                                    }
                                });
                                resolve();
                            });
                        });
                        
                        processed += batch.length;
                        if (processed % UPDATE_FREQUENCY === 0 || processed === totalMarkers) {
                            updateProgress(processed, totalMarkers);
                        }
                        
                        if (BATCH_DELAY > 0) await this.delay(BATCH_DELAY);
                    }
                }
            }
        }
        
        // Completion
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        this.log(`✅ Batch import tamamlandı: ${processed} veri, ${elapsed} saniye`);
        
        if (progressModal) {
            progressModal.setMessage(`✅ Tamamlandı!`);
            await this.delay(500);
            progressModal.hide();
        }
        
        if (typeof window.showEducationalFeedback === 'function') {
            window.showEducationalFeedback(`✅ ${totalMarkers.toLocaleString('tr-TR')} veri yüklendi! (${elapsed}sn)`);
        }
    }
}

// Export to global scope
window.BatchProcessor = BatchProcessor;
