/**
 * Data Event Handlers Module
 * Handles data collection events: points, areas, routes, circles
 * Part of the modularized EventHandlers system
 */

class DataEventHandlers {
    constructor(config) {
        this.map = config.map;
        this.dataDrawing = config.dataDrawing;
        this.markerManager = config.markerManager;
        this.userMarkers = config.userMarkers;
        this.updateDataList = config.updateDataList;
    }

    initialize() {
        this.setupDataCollectionHandlers();
    }

    setupDataCollectionHandlers() {
        const dataTypeSelect = document.getElementById('data-type');
        const addDataBtn = document.getElementById('add-data-btn');
        const dataNameInput = document.getElementById('data-name');
        const dataInputSection = document.getElementById('data-input-section');

        if (!dataTypeSelect || !addDataBtn) return;

        // Veri türü değiştiğinde
        dataTypeSelect.addEventListener('change', (e) => {
            const type = e.target.value;
            const mapContainer = this.map.getContainer();

            // Input section'ı göster/gizle
            if (type === 'none') {
                dataInputSection.classList.add('hidden');
            } else {
                dataInputSection.classList.remove('hidden');
            }

            // Moda göre işlem yap (use window.dataDrawing for correct instance)
            const dataDrawing = window.dataDrawing || this.dataDrawing;

            if (type === 'none') {
                mapContainer.style.cursor = '';
                dataDrawing.cancelPointCollection();
                dataDrawing.cancelCircleDrawing();
                dataDrawing.clearTempPointMarker();
            } else if (type === 'point') {
                mapContainer.style.cursor = 'crosshair';
                dataDrawing.cancelPointCollection();
                dataDrawing.cancelCircleDrawing();
                if (typeof showEducationalFeedback === 'function') {
                    showEducationalFeedback('📍 Nokta ekleme modu aktif!');
                }
            } else if (type === 'area') {
                mapContainer.style.cursor = 'crosshair';
                dataDrawing.startPointCollection('area');
                dataDrawing.cancelCircleDrawing();
                if (typeof showEducationalFeedback === 'function') {
                    showEducationalFeedback('🔷 Alan ekleme modu aktif!');
                }
            } else if (type === 'route') {
                mapContainer.style.cursor = 'crosshair';
                dataDrawing.startPointCollection('route');
                dataDrawing.cancelCircleDrawing();
                if (typeof showEducationalFeedback === 'function') {
                    showEducationalFeedback('〰️ Rota ekleme modu aktif!');
                }
            } else if (type === 'circle') {
                mapContainer.style.cursor = 'crosshair';
                dataDrawing.cancelPointCollection();
                dataDrawing.resetCircleDrawing();
                if (typeof showEducationalFeedback === 'function') {
                    showEducationalFeedback('⭕ Çember çizimi: Merkez için tıklayın, sonra yarıçap için tekrar tıklayın.');
                }
            }
        });

        // Veri ekleme fonksiyonu (hem buton hem Enter için kullanılacak)
        const handleAddData = () => {
            const name = dataNameInput.value;
            if (!name) {
                if (typeof window.showFeedback === 'function') {
                    window.showFeedback('⚠️ Lütfen veri için bir isim giriniz.', 'warning', 3000);
                }
                return;
            }

            const dataType = dataTypeSelect.value;

            if (dataType === 'point') {
                this.handlePointDataAdd(name, dataNameInput);
            } else if (dataType === 'circle') {
                this.handleCircleDataAdd(name, dataNameInput);
            } else {
                this.handleGeometryDataAdd(name, dataType, dataNameInput);
            }
        };

        // Veri ekleme butonu
        addDataBtn.addEventListener('click', handleAddData);

        // Enter tuşu ile veri ekleme
        if (dataNameInput) {
            dataNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddData();
                }
            });
        }
    }

    handlePointDataAdd(name, dataNameInput) {
        // Use window.dataDrawing instead of this.dataDrawing (correct instance)
        const dataDrawing = window.dataDrawing || this.dataDrawing;
        const lastClickedLatLng = dataDrawing.getLastClickedLatLng();

        if (!lastClickedLatLng) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('⚠️ Lütfen önce haritada bir noktaya tıklayın.', 'warning', 3000);
            }
            return;
        }

        // Timestamp al
        const timestampInput = document.getElementById('data-timestamp');
        const timestamp = timestampInput && timestampInput.value ? new Date(timestampInput.value).toISOString() : null;

        const markerData = {
            name,
            lat: lastClickedLatLng.lat,
            lon: lastClickedLatLng.lng,
            type: 'point',
            id: Date.now(),
            timestamp
        };

        this.userMarkers.push(markerData);
        this.markerManager.addMarkerToMap(markerData);
        this.updateDataList();

        if (typeof window.spatialAnalysis !== 'undefined' && window.spatialAnalysis.refreshHeatmapIfAny) {
            window.spatialAnalysis.refreshHeatmapIfAny();
        }

        dataDrawing.clearTempPointMarker();
        dataNameInput.value = '';

        // Timestamp input'u temizle
        if (timestampInput) {
            timestampInput.value = '';
        }

        if (dataDrawing.clearLastClickedLatLng) {
            dataDrawing.clearLastClickedLatLng();
        } else {
            dataDrawing.lastClickedLatLng = null;
        }

        // Keep crosshair cursor for next point
        this.map.getCanvas().style.cursor = 'crosshair';

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`✅ Nokta eklendi! Yeni nokta için tekrar haritaya tıklayın veya modu kapatın.`);
        }
    }

    handleCircleDataAdd(name, dataNameInput) {
        const dataDrawing = window.dataDrawing || this.dataDrawing;
        const circleData = dataDrawing.getCircleData();

        if (!circleData || !circleData.center || !circleData.radius) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('⚠️ Lütfen önce çemberi çizin (merkez ve yarıçapı belirleyin).', 'warning', 3000);
            }
            return;
        }

        // Timestamp al
        const timestampInput = document.getElementById('data-timestamp');
        const timestamp = timestampInput && timestampInput.value ? new Date(timestampInput.value).toISOString() : null;

        const markerData = {
            name,
            lat: circleData.center.lat,
            lon: circleData.center.lng,
            type: 'circle',
            radius: circleData.radius,
            id: Date.now(),
            timestamp
        };

        this.userMarkers.push(markerData);
        this.markerManager.addCircleToMap(markerData);
        this.updateDataList();

        if (typeof window.spatialAnalysis !== 'undefined' && window.spatialAnalysis.refreshHeatmapIfAny) {
            window.spatialAnalysis.refreshHeatmapIfAny();
        }

        // Now remove temp layers since permanent circle is added
        dataDrawing.cancelCircleDrawing();
        dataNameInput.value = '';

        // Timestamp input'u temizle
        if (timestampInput) {
            timestampInput.value = '';
        }

        // Keep crosshair cursor for next circle
        this.map.getCanvas().style.cursor = 'crosshair';

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('✅ Çember verisi eklendi! Yeni çember için merkez noktasına tıklayın.');
        }
    }

    handleGeometryDataAdd(name, dataType, dataNameInput) {
        const dataDrawing = window.dataDrawing || this.dataDrawing;
        const collectedPoints = dataDrawing.getCollectedPoints();

        // Timestamp al
        const timestampInput = document.getElementById('data-timestamp');
        const timestamp = timestampInput && timestampInput.value ? new Date(timestampInput.value).toISOString() : null;

        if (collectedPoints.length < 2) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback(`⚠️ ${dataType === 'area' ? 'Alan' : 'Rota'} verisi için en az ${dataType === 'area' ? '3' : '2'} nokta seçmelisiniz.`, 'warning', 3000);
            }
            return;
        }

        if (dataType === 'area' && collectedPoints.length < 3) {
            if (typeof window.showFeedback === 'function') {
                window.showFeedback('⚠️ Alan verisi için en az 3 nokta gereklidir.', 'warning', 3000);
            }
            return;
        }

        // Merkez noktayı hesapla
        const centerLat = collectedPoints.reduce((sum, p) => sum + p.lat, 0) / collectedPoints.length;
        const centerLon = collectedPoints.reduce((sum, p) => sum + p.lng, 0) / collectedPoints.length;

        const markerData = {
            name,
            lat: centerLat,
            lon: centerLon,
            type: dataType,
            geometry: collectedPoints.map(p => ({ lat: p.lat, lon: p.lng })),
            id: Date.now(),
            timestamp
        };

        this.userMarkers.push(markerData);
        this.markerManager.addGeometryToMap(markerData);
        this.updateDataList();

        if (typeof window.spatialAnalysis !== 'undefined' && window.spatialAnalysis.refreshHeatmapIfAny) {
            window.spatialAnalysis.refreshHeatmapIfAny();
        }

        dataNameInput.value = '';

        // Timestamp input'u temizle
        if (timestampInput) {
            timestampInput.value = '';
        }

        dataDrawing.cancelPointCollection();

        // Alan/Rota eklendikten sonra mod AÇIK kalsın
        dataDrawing.startPointCollection(dataType);

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`✅ ${dataType === 'area' ? 'Alan' : 'Rota'} verisi eklendi! Yeni ${dataType === 'area' ? 'alan' : 'rota'} için tekrar tıklayın veya modu kapatın.`);
        }
    }
}

// Make it globally available
window.DataEventHandlers = DataEventHandlers;
