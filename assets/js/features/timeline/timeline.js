/**
 * Timeline Manager - Zaman çizelgesi kontrolü ve temporal veri filtreleme
 * MapLibre GL JS için geliştirilmiş timeline özelliği
 */

// Safe Logger helpers for timeline
const safeLogTimeline = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeWarnTimeline = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorTimeline = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

class TimelineManager {
    constructor(map) {
        this.map = map;
        this.isPlaying = false;
        this.currentIndex = 0;
        this.timeData = [];
        this.animationInterval = null;
        this.speed = 1000; // ms
        this.interval = 'day';
        this.filterMode = 'cumulative'; // 'cumulative' veya 'interval'
        this.isVisible = false;
        this.originalClusterData = null; // Orijinal cluster verisini sakla
        this.originalCatalogData = {}; // Orijinal catalog verisini sakla (source ID -> data mapping)

        // Performance optimizations
        this._dateCache = new Map(); // Cache for parsed dates
        this._filterRAF = null; // RAF handle for filter operations
        this._lastFilterIndex = -1; // Track last filtered index to avoid redundant updates
        this._lastFilterMode = null; // Track last filter mode
        this._lastSelectedProperty = null; // Track last selected property
        
        // DOM elementleri
        this.container = document.getElementById('timeline-container');
        this.playBtn = document.getElementById('timeline-play');
        this.prevBtn = document.getElementById('timeline-prev');
        this.nextBtn = document.getElementById('timeline-next');
        this.slider = document.getElementById('timeline-slider');
        this.currentDateEl = document.getElementById('timeline-current-date');
        this.totalRangeEl = document.getElementById('timeline-total-range');
        this.modeSelect = document.getElementById('timeline-mode');
        this.speedSelect = document.getElementById('timeline-speed');
        this.intervalSelect = document.getElementById('timeline-interval');
        this.toggleBtn = document.getElementById('timeline-toggle');
        this.closeBtn = document.getElementById('timeline-close');
        
        // Property filter elements
        this.propertySelect = document.getElementById('timeline-property-select');
        this.propertySliderMin = document.getElementById('timeline-property-slider-min');
        this.propertySliderMax = document.getElementById('timeline-property-slider-max');
        this.propertyRangeContainer = document.getElementById('timeline-property-range-container');
        this.propertyCurrentMinEl = document.getElementById('timeline-property-current-min');
        this.propertyCurrentMaxEl = document.getElementById('timeline-property-current-max');
        this.propertyRangeTextEl = document.getElementById('timeline-property-range-text');
        
        // Property filter state
        this.selectedProperty = null;
        this.propertyDataMin = 0;
        this.propertyDataMax = 100;
        this.propertyCurrentMin = 0;
        this.propertyCurrentMax = 100;
        this.numericProperties = new Map(); // property name -> {min, max, unit}

        // Web Worker for background filtering
        this.worker = null;
        this.workerEnabled = false;
        this.workerRequestId = 0;
        this.workerCallbacks = new Map();
        this._initWorker();

        this.initializeEventListeners();
        this.makeDraggable();
    }

    /**
     * Initialize Web Worker for background filtering
     * @private
     */
    _initWorker() {
        // Check if Worker is supported
        if (typeof Worker === 'undefined') {
            safeWarnTimeline('⚠️ Web Workers not supported, using main thread');
            return;
        }

        try {
            this.worker = new Worker('assets/js/features/timeline/timeline-worker.js');

            this.worker.onmessage = (e) => {
                const { type, requestId, data, error } = e.data;

                if (type === 'READY') {
                    this.workerEnabled = true;
                    safeLogTimeline('✅ Timeline Worker initialized and ready');
                } else if (type === 'FILTER_RESULT') {
                    const callback = this.workerCallbacks.get(requestId);
                    if (callback) {
                        callback(null, data);
                        this.workerCallbacks.delete(requestId);
                    }
                } else if (type === 'ERROR') {
                    const callback = this.workerCallbacks.get(requestId);
                    if (callback) {
                        callback(error, null);
                        this.workerCallbacks.delete(requestId);
                    }
                    safeErrorTimeline('❌ Worker error:', error);
                }
            };

            this.worker.onerror = (error) => {
                safeErrorTimeline('❌ Worker error:', error);
                this.workerEnabled = false;
            };

        } catch (error) {
            safeWarnTimeline('⚠️ Failed to initialize worker:', error.message);
            this.workerEnabled = false;
        }
    }
    
    /**
     * Event listener'ları başlat
     */
    initializeEventListeners() {
        // Check if DOM elements exist (they might not exist on test pages)
        if (!this.playBtn || !this.prevBtn || !this.nextBtn) {
            safeWarnTimeline('Timeline: DOM elements not found, skipping event listeners');
            return;
        }

        // Play/Pause
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Önceki/Sonraki
        this.prevBtn.addEventListener('click', () => this.previous());
        this.nextBtn.addEventListener('click', () => this.next());
        
        // Slider (throttled for performance)
        const throttledFilterByTime = window.throttle ? window.throttle(() => {
            this.filterMapByTime();
        }, 100) : () => this.filterMapByTime();

        this.slider.addEventListener('input', (e) => {
            this.currentIndex = parseInt(e.target.value);
            this.updateTimeDisplay();
            throttledFilterByTime();
        });
        
        // Mod ayarı
        this.modeSelect.addEventListener('change', (e) => {
            this.filterMode = e.target.value;
            this.filterMapByTime();
            
            // Kullanıcıya bilgi ver
            const modeText = this.filterMode === 'cumulative' ? 'Kümülatif' : 'Aralık';
            window.showFeedback(`📊 Filtreleme modu: ${modeText}`, 'info', 2000);
        });
        
        // Hız ayarı
        this.speedSelect.addEventListener('change', (e) => {
            this.speed = parseInt(e.target.value);
            if (this.isPlaying) {
                this.stop();
                this.play();
            }
        });
        
        // Aralık ayarı
        this.intervalSelect.addEventListener('change', (e) => {
            this.interval = e.target.value;
            this.regenerateTimeData();
        });
        
        // Kapatma
        this.closeBtn.addEventListener('click', () => this.hide());
        
        // Toggle collapse
        this.toggleBtn.addEventListener('click', () => this.toggleCollapse());
        
        // Property filter
        this.propertySelect.addEventListener('change', (e) => {
            this.selectedProperty = e.target.value || null;
            if (this.selectedProperty) {
                this.showPropertyRange();
            } else {
                this.hidePropertyRange();
            }
            this.filterMapByTime();
        });
        
        // Property sliders (throttled for performance)
        const throttledPropertyFilter = window.throttle ? window.throttle(() => {
            this.filterMapByTime();
        }, 100) : () => this.filterMapByTime();

        this.propertySliderMin.addEventListener('input', (e) => {
            this.propertyCurrentMin = parseFloat(e.target.value);

            // Minimum, maksimumdan büyük olamaz
            if (this.propertyCurrentMin > this.propertyCurrentMax) {
                this.propertyCurrentMin = this.propertyCurrentMax;
                this.propertySliderMin.value = this.propertyCurrentMin;
            }

            this.updatePropertyDisplay();
            throttledPropertyFilter();
        });
        
        this.propertySliderMax.addEventListener('input', (e) => {
            this.propertyCurrentMax = parseFloat(e.target.value);

            // Maksimum, minimumdan küçük olamaz
            if (this.propertyCurrentMax < this.propertyCurrentMin) {
                this.propertyCurrentMax = this.propertyCurrentMin;
                this.propertySliderMax.value = this.propertyCurrentMax;
            }

            this.updatePropertyDisplay();
            throttledPropertyFilter();
        });
        
        // Hover durumunda z-index ayarla (hangi tutamak üstte olacak)
        this.propertySliderMin.addEventListener('mousedown', () => {
            this.propertySliderMin.style.zIndex = '5';
            this.propertySliderMax.style.zIndex = '4';
        });
        
        this.propertySliderMax.addEventListener('mousedown', () => {
            this.propertySliderMax.style.zIndex = '6';
            this.propertySliderMin.style.zIndex = '4';
        });
    }
    
    /**
     * Timeline'ı sürüklenebilir yap
     */
    makeDraggable() {
        if (!this.container) {
            safeWarnTimeline('Timeline: Container not found, skipping makeDraggable');
            return;
        }
        if (typeof interact !== 'undefined') {
            interact('#timeline-container')
                .draggable({
                    allowFrom: '.timeline-header',
                    listeners: {
                        move(event) {
                            const target = event.target;
                            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                            
                            target.style.transform = `translate(${x}px, ${y}px)`;
                            target.setAttribute('data-x', x);
                            target.setAttribute('data-y', y);
                        }
                    }
                });
        }
    }
    
    /**
     * Timeline'ı göster
     */
    show() {
        this.container.classList.remove('hidden');
        this.container.classList.add('show');
        this.isVisible = true;
        
        // Veri varsa zaman aralığını oluştur
        this.loadDataFromMap();
        
        // Sayısal property'leri tespit et ve dropdown'u doldur
        this.detectNumericProperties();
        this.populatePropertySelect();
    }
    
    /**
     * Timeline'ı gizle
     */
    hide() {
        this.container.classList.add('hidden');
        this.container.classList.remove('show');
        this.isVisible = false;
        this.stop();

        // Filtreyi temizle
        this.clearTimeFilter();

        // Clear worker cache when hiding timeline
        if (this.workerEnabled && this.worker) {
            this.worker.postMessage({ type: 'CLEAR_CACHE' });
        }
    }

    /**
     * Destroy timeline and cleanup resources
     */
    destroy() {
        this.stop();
        this.clearTimeFilter();

        // Terminate worker
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.workerEnabled = false;
            safeLogTimeline('🛑 Timeline Worker terminated');
        }

        // Clear callbacks
        this.workerCallbacks.clear();

        // Clear cache
        this._dateCache.clear();
    }
    
    /**
     * Daralt/Genişlet
     */
    toggleCollapse() {
        this.container.classList.toggle('collapsed');
    }
    
    /**
     * Haritadan veri yükle
     */
    loadDataFromMap() {
        const allData = [];

        // 1. Önce MapLibre source'larından verileri topla
        const sources = ['catalog-points', 'catalog-polygons', 'catalog-lines', 'catalog-geometries'];
        sources.forEach(sourceId => {
            const source = this.map.getSource(sourceId);
            if (source && source._data && source._data.features) {
                // Orijinal veriyi sakla (ilk seferinde)
                if (!this.originalCatalogData[sourceId]) {
                    this.originalCatalogData[sourceId] = JSON.parse(JSON.stringify(source._data));
                }

                // ALWAYS use original data, not filtered data
                const dataToUse = this.originalCatalogData[sourceId] || source._data;

                dataToUse.features.forEach(feature => {
                    if (feature.properties) {
                        const dateValue = feature.properties.timestamp || feature.properties.time || feature.properties.Date || feature.properties.date || feature.properties.tarih;
                        if (dateValue) {
                            allData.push({
                                id: feature.properties.id,
                                timestamp: this.parseDate(dateValue),
                                type: feature.geometry.type,
                                name: feature.properties.name || feature.properties.Location || feature.properties.il
                            });
                        }
                    }
                });
            }
        });

        // 2. Cluster source'u da kontrol et (nokta verileri için)
        const clusterSource = this.map.getSource('markers');
        const userMarkers = window.eventHandlers?.userMarkers || window.userMarkers || [];

        if (clusterSource) {
            // Orijinal cluster verisini sakla (ilk seferinde)
            if (!this.originalClusterData && clusterSource._data && clusterSource._data.features) {
                this.originalClusterData = JSON.parse(JSON.stringify(clusterSource._data));
                safeLogTimeline(`💾 Timeline: Cached original cluster data (${this.originalClusterData.features.length} features)`);
            }
            // FALLBACK: Eğer cluster source'ta veri yoksa userMarkers'tan cache oluştur
            else if (!this.originalClusterData && userMarkers.length > 0) {
                this.originalClusterData = {
                    type: 'FeatureCollection',
                    features: userMarkers
                        .filter(marker => marker.type === 'point' || !marker.type) // Sadece point'leri al
                        .map(marker => {
                            // Clean properties: remove undefined values and functions
                            const cleanProps = {};
                            if (marker.properties && typeof marker.properties === 'object') {
                                Object.keys(marker.properties).forEach(key => {
                                    const value = marker.properties[key];
                                    // Only include valid GeoJSON property types
                                    if (value !== undefined && typeof value !== 'function') {
                                        cleanProps[key] = value;
                                    }
                                });
                            }

                            // Build feature with only defined values
                            const props = {
                                id: marker.id,
                                name: marker.name,
                                ...cleanProps
                            };

                            // Add timestamp fields only if they exist
                            if (marker.timestamp !== undefined) props.timestamp = marker.timestamp;
                            if (marker.Date !== undefined) props.Date = marker.Date;
                            if (marker.date !== undefined) props.date = marker.date;
                            if (marker.time !== undefined) props.time = marker.time;
                            if (marker.tarih !== undefined) props.tarih = marker.tarih;

                            return {
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: [marker.lon, marker.lat]
                                },
                                properties: props
                            };
                        })
                };
                safeLogTimeline(`💾 Timeline: Cached cluster data from userMarkers (${this.originalClusterData.features.length} features)`);
            }

            // ALWAYS use original data, not filtered data
            const dataToUse = this.originalClusterData || clusterSource._data;

            if (dataToUse && dataToUse.features) {
                dataToUse.features.forEach(feature => {
                    if (feature.properties) {
                        const dateValue = feature.properties.timestamp || feature.properties.time || feature.properties.Date || feature.properties.date || feature.properties.tarih;
                        if (dateValue) {
                            allData.push({
                                id: feature.properties.id,
                                timestamp: this.parseDate(dateValue),
                                type: 'Point',
                                name: feature.properties.name || feature.properties.Location || feature.properties.il
                            });
                        }
                    }
                });
            }
        }

        // 3. Eğer source'larda veri yoksa, userMarkers'dan kontrol et (fallback)
        // Bu özellikle import sonrası hemen timeline açıldığında gereklidir
        if (allData.length === 0 && userMarkers.length > 0) {
            userMarkers.forEach(marker => {
                const dateValue = marker.timestamp || marker.time || marker.Date || marker.date || marker.tarih;
                if (dateValue) {
                    allData.push({
                        id: marker.id,
                        timestamp: this.parseDate(dateValue),
                        type: marker.type || 'Point',
                        name: marker.name || marker.Location || marker.il
                    });
                }
            });
        }
        
        if (allData.length === 0) {
            // Debug: Hangi source'larda veri var kontrol et
            const catalogCount = this.map.getSource('catalog-geometries')?._data?.features?.length || 0;
            const clusterCount = this.map.getSource('markers')?._data?.features?.length || 0;
            const userMarkersCount = userMarkers.length;
            const userMarkersWithDate = userMarkers.filter(m => m.timestamp || m.time || m.Date || m.date || m.tarih).length;
            // Daha açıklayıcı hata mesajı
            let debugInfo = '⚠️ Zaman damgalı veri bulunamadı.\n';
            debugInfo += `Taranan source'lar: catalog-geometries (${catalogCount}), markers (${clusterCount})\n`;
            if (userMarkersCount > 0) {
                debugInfo += `userMarkers: ${userMarkersCount} (tarihli: ${userMarkersWithDate})\n`;
            }
            debugInfo += `Timeline için verilerinizde "timestamp", "time", "Date", "date", "tarih" alanı olmalı.`;
            
            window.showFeedback(debugInfo, 'warning', 6000);
            this.hide();
            return;
        }
        
        // Tarihe göre sırala
        allData.sort((a, b) => a.timestamp - b.timestamp);
        
        // Zaman aralığını oluştur
        this.generateTimeRange(allData);
    }
    
    /**
     * Zaman aralığını oluştur
     */
    generateTimeRange(data) {
        if (data.length === 0) {
            safeWarnTimeline('⚠️ Timeline: No data to generate time range');
            return;
        }

        const minDate = new Date(data[0].timestamp);
        const maxDate = new Date(data[data.length - 1].timestamp);

        safeLogTimeline(`📅 Timeline: Date range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
        safeLogTimeline(`📅 Timeline: Time span: ${((maxDate - minDate) / (1000 * 60 * 60 * 24)).toFixed(2)} days`);

        this.timeData = [];
        let currentDate = new Date(minDate);
        let stepCount = 0;
        const maxSteps = 10000; // Safety limit to prevent infinite loop

        while (currentDate <= maxDate && stepCount < maxSteps) {
            this.timeData.push(new Date(currentDate));
            currentDate = this.incrementDate(currentDate, this.interval);
            stepCount++;
        }

        if (stepCount >= maxSteps) {
            safeWarnTimeline(`⚠️ Timeline: Reached max steps limit (${maxSteps}), stopping`);
        }

        safeLogTimeline(`📊 Timeline: Generated ${this.timeData.length} time steps with interval: ${this.interval}`);

        // Slider'ı güncelle
        this.slider.max = this.timeData.length - 1;
        this.slider.value = 0;
        this.currentIndex = 0;

        safeLogTimeline(`🎚️ Timeline: Slider configured - max: ${this.slider.max}, value: ${this.slider.value}`);

        // Force slider background reset (fix for visual bug where progress bar stays full)
        this.slider.style.background = `linear-gradient(to right, #10b981 0%, #d4d4d8 0%)`;

        // Tarih aralığını göster
        this.updateTimeDisplay();
        this.updateRangeDisplay();

        // İlk filtrelemeyi yap (timeline açıldığında ilk zaman adımını göster)
        this.filterMapByTime();
    }
    
    /**
     * Yeni aralığa göre zaman verilerini yeniden oluştur
     */
    regenerateTimeData() {
        safeLogTimeline(`🔄 Timeline: Regenerating time data with interval: ${this.interval}`);

        // Clear filter cache to ensure new filtering happens
        this._lastFilterIndex = -1;
        this._lastFilterMode = null;
        this._lastSelectedProperty = null;

        this.loadDataFromMap();
    }
    
    /**
     * Tarih string'ini parse et (DD/MM/YYYY HH:mm:ss veya ISO formatı)
     * Cached for performance
     */
    parseDate(dateString) {
        if (!dateString) return null;

        // Eğer zaten Date object'iyse, direkt döndür
        if (dateString instanceof Date) return dateString;

        // Check cache first
        if (this._dateCache.has(dateString)) {
            return this._dateCache.get(dateString);
        }

        let parsedDate;

        // Türkçe format: DD/MM/YYYY HH:mm:ss veya DD/MM/YYYY
        if (typeof dateString === 'string' && dateString.includes('/')) {
            const parts = dateString.split(' ');
            const datePart = parts[0]; // DD/MM/YYYY
            const timePart = parts[1] || '00:00:00'; // HH:mm:ss

            const [day, month, year] = datePart.split('/');
            const [hours, minutes, seconds] = timePart.split(':');

            // JavaScript Date: month 0-11 olduğu için -1
            parsedDate = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hours) || 0,
                parseInt(minutes) || 0,
                parseInt(seconds) || 0
            );
        } else {
            // ISO format veya başka format
            parsedDate = new Date(dateString);
        }

        // Cache the result (limit cache size to prevent memory issues)
        if (this._dateCache.size < 10000) {
            this._dateCache.set(dateString, parsedDate);
        }

        return parsedDate;
    }
    
    /**
     * Tarihi artır
     */
    incrementDate(date, interval) {
        const newDate = new Date(date);
        switch (interval) {
            case 'hour':
                newDate.setHours(newDate.getHours() + 1);
                break;
            case 'day':
                newDate.setDate(newDate.getDate() + 1);
                break;
            case 'week':
                newDate.setDate(newDate.getDate() + 7);
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + 1);
                break;
            case 'year':
                newDate.setFullYear(newDate.getFullYear() + 1);
                break;
        }
        return newDate;
    }
    
    /**
     * Zaman gösterimini güncelle
     */
    updateTimeDisplay() {
        if (this.timeData.length === 0) {
            this.currentDateEl.textContent = '-';
            return;
        }
        
        const currentDate = this.timeData[this.currentIndex];
        this.currentDateEl.textContent = this.formatDate(currentDate);
        
        // Slider progress rengi
        const percentage = (this.currentIndex / (this.timeData.length - 1)) * 100;
        this.slider.style.background = `linear-gradient(to right, #10b981 ${percentage}%, #d4d4d8 ${percentage}%)`;
    }
    
    /**
     * Toplam aralık gösterimini güncelle
     */
    updateRangeDisplay() {
        if (this.timeData.length === 0) {
            this.totalRangeEl.textContent = '-';
            return;
        }
        
        const startDate = this.formatDate(this.timeData[0]);
        const endDate = this.formatDate(this.timeData[this.timeData.length - 1]);
        this.totalRangeEl.textContent = `${startDate} - ${endDate}`;
    }
    
    /**
     * Tarihi formatla
     */
    formatDate(date) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        if (this.interval === 'hour') {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        return date.toLocaleDateString('tr-TR', options);
    }
    
    /**
     * Haritayı zamana göre filtrele
     */
    filterMapByTime() {
        if (this.timeData.length === 0) return;

        // Cancel pending filter if exists
        if (this._filterRAF) {
            cancelAnimationFrame(this._filterRAF);
            safeLogTimeline('⏭️ Timeline: Cancelled pending filter operation');
        }

        const rafStart = performance.now();
        safeLogTimeline(`🎬 Timeline: filterMapByTime called at index ${this.currentIndex}`);

        // Use requestAnimationFrame for smooth updates
        this._filterRAF = requestAnimationFrame(() => {
            const rafDelay = performance.now() - rafStart;
            safeLogTimeline(`⏱️ Timeline: RAF delay: ${rafDelay.toFixed(2)}ms`);
            this._performFilter();
            this._filterRAF = null;
        });
    }

    /**
     * Actually perform the filtering (called via RAF)
     * @private
     */
    _performFilter() {
        const performStart = performance.now();

        if (this._shouldSkipFilter()) {
            safeLogTimeline('⏭️ Timeline: Filter skipped (no changes)');
            return;
        }

        safeLogTimeline(`🔄 Timeline: Starting filter - index: ${this.currentIndex}, mode: ${this.filterMode}, property: ${this.selectedProperty || 'none'}`);

        this._updateFilterCache();

        const currentDate = this.timeData[this.currentIndex];
        const previousDate = this._calculatePreviousDate(currentDate);

        const catalogStart = performance.now();
        this._filterCatalogSources(currentDate, previousDate);
        const catalogTime = performance.now() - catalogStart;

        const clusterStart = performance.now();
        this._filterClusterSource(currentDate, previousDate);
        const clusterTime = performance.now() - clusterStart;

        const labelStart = performance.now();
        this._filterLabelSource(currentDate, previousDate);
        const labelTime = performance.now() - labelStart;

        const totalTime = performance.now() - performStart;
        safeLogTimeline(`✅ Timeline: Filter complete - Total: ${totalTime.toFixed(2)}ms (Catalog: ${catalogTime.toFixed(2)}ms, Cluster: ${clusterTime.toFixed(2)}ms, Labels: ${labelTime.toFixed(2)}ms)`);
    }

    /**
     * Check if filtering should be skipped (nothing changed)
     * @private
     */
    _shouldSkipFilter() {
        return this._lastFilterIndex === this.currentIndex &&
               this._lastFilterMode === this.filterMode &&
               this._lastSelectedProperty === this.selectedProperty &&
               this._lastPropertyMin === this.propertyCurrentMin &&
               this._lastPropertyMax === this.propertyCurrentMax;
    }

    /**
     * Update the filter cache
     * @private
     */
    _updateFilterCache() {
        this._lastFilterIndex = this.currentIndex;
        this._lastFilterMode = this.filterMode;
        this._lastSelectedProperty = this.selectedProperty;
        this._lastPropertyMin = this.propertyCurrentMin;
        this._lastPropertyMax = this.propertyCurrentMax;
    }

    /**
     * Calculate previous date based on current mode and interval
     * @private
     */
    _calculatePreviousDate(currentDate) {
        let previousDate = this.currentIndex > 0 ? this.timeData[this.currentIndex - 1] : null;

        if (this.filterMode === 'interval' && !previousDate) {
            previousDate = new Date(currentDate);
            switch (this.interval) {
                case 'hour':
                    previousDate.setHours(previousDate.getHours() - 1);
                    break;
                case 'day':
                    previousDate.setDate(previousDate.getDate() - 1);
                    break;
                case 'week':
                    previousDate.setDate(previousDate.getDate() - 7);
                    break;
                case 'month':
                    previousDate.setMonth(previousDate.getMonth() - 1);
                    break;
                case 'year':
                    previousDate.setFullYear(previousDate.getFullYear() - 1);
                    break;
            }
        }

        return previousDate;
    }

    /**
     * Filter a feature by date based on current filter mode
     * @private
     */
    _filterFeatureByDate(featureDate, currentDate, previousDate) {
        if (!featureDate) return true;

        if (this.filterMode === 'cumulative') {
            return featureDate <= currentDate;
        } else {
            // In interval mode, if previousDate is null, show all features up to currentDate
            if (!previousDate) {
                return featureDate <= currentDate;
            }
            return featureDate > previousDate && featureDate <= currentDate;
        }
    }

    /**
     * Filter a feature by property value
     * @private
     */
    _filterFeatureByProperty(propertyValue) {
        if (!this.selectedProperty) return true;

        const numValue = parseFloat(propertyValue);
        if (!isNaN(numValue) && isFinite(numValue)) {
            return numValue >= this.propertyCurrentMin && numValue <= this.propertyCurrentMax;
        }
        return false;
    }

    /**
     * Get date value from feature properties
     * @private
     */
    _getFeatureDateValue(feature) {
        if (!feature.properties) return null;
        return feature.properties.timestamp ||
               feature.properties.time ||  // Unix timestamp (milliseconds)
               feature.properties.Date ||
               feature.properties.date ||
               feature.properties.tarih;
    }

    /**
     * Filter catalog sources (points, polygons, lines, geometries)
     * @private
     */
    _filterCatalogSources(currentDate, previousDate) {
        const sources = ['catalog-points', 'catalog-polygons', 'catalog-lines', 'catalog-geometries'];
        let totalOriginal = 0;
        let totalFiltered = 0;

        sources.forEach(sourceId => {
            const sourceStart = performance.now();
            const source = this.map.getSource(sourceId);
            if (!source) return;

            const originalData = this.originalCatalogData?.[sourceId] || source._data;
            // Check valid FeatureCollection structure
            if (!originalData || !originalData.features) return;

            const originalCount = originalData.features.length;
            if (originalCount === 0) return;

            totalOriginal += originalCount;

            const filteredFeatures = originalData.features.filter(feature => {
                const dateValue = this._getFeatureDateValue(feature);
                if (!dateValue) return true;

                const featureDate = this.parseDate(dateValue);
                const dateResult = this._filterFeatureByDate(featureDate, currentDate, previousDate);

                if (!dateResult) return false;

                const propertyValue = feature.properties[this.selectedProperty];
                return this._filterFeatureByProperty(propertyValue);
            });

            totalFiltered += filteredFeatures.length;

            // Ensure we are passing a valid FeatureCollection
            const dataToSet = {
                type: 'FeatureCollection',
                features: filteredFeatures
            };
            
            try {
                source.setData(dataToSet);
            } catch (e) {
                safeWarnTimeline(`Error updating source ${sourceId}:`, e);
            }

            const sourceTime = performance.now() - sourceStart;
            safeLogTimeline(`  📊 ${sourceId}: ${originalCount} → ${filteredFeatures.length} features (${sourceTime.toFixed(2)}ms)`);
        });

        if (totalOriginal > 0) {
            safeLogTimeline(`  📈 Catalog total: ${totalOriginal} → ${totalFiltered} features`);
        }
    }

    /**
     * Get property value from feature or userMarkers
     * @private
     */
    _getPropertyValue(feature, userMarkers) {
        let propertyValue = feature.properties ?
            parseFloat(feature.properties[this.selectedProperty]) : NaN;

        if (isNaN(propertyValue) && feature.properties?.id) {
            const marker = userMarkers.find(m => m.id === feature.properties.id);
            if (marker) {
                if (marker.properties?.[this.selectedProperty]) {
                    propertyValue = parseFloat(marker.properties[this.selectedProperty]);
                } else {
                    propertyValue = parseFloat(marker[this.selectedProperty]);
                }
            }
        }

        return propertyValue;
    }

    /**
     * Get date from feature or userMarkers
     * @private
     */
    _getFeatureDate(feature, userMarkers) {
        let dateValue = this._getFeatureDateValue(feature);
        if (dateValue) {
            return this.parseDate(dateValue);
        }

        if (userMarkers.length > 0 && feature.properties?.id) {
            const marker = userMarkers.find(m => m.id === feature.properties.id);
            if (marker) {
                dateValue = marker.timestamp || marker.time || marker.Date || marker.date || marker.tarih;
                if (dateValue) {
                    return this.parseDate(dateValue);
                }
            }
        }

        return null;
    }

    /**
     * Filter cluster source (user markers)
     * @private
     */
    _filterClusterSource(currentDate, previousDate) {
        const clusterSource = this.map.getSource('markers');
        if (!clusterSource) {
            safeLogTimeline('  ⚠️ Cluster source not found');
            return;
        }

        const originalData = clusterSource._data;
        const userMarkers = window.eventHandlers?.userMarkers || window.userMarkers || [];

        // Store original data on first run
        if (!this.originalClusterData && originalData?.features) {
            this.originalClusterData = {
                type: originalData.type,
                features: originalData.features.slice()
            };
            safeLogTimeline(`  💾 Cached original cluster data: ${this.originalClusterData.features.length} features`);
        }
        // FALLBACK: Eğer cluster source'ta veri yoksa userMarkers'tan cache oluştur
        else if (!this.originalClusterData && userMarkers.length > 0) {
            this.originalClusterData = {
                type: 'FeatureCollection',
                features: userMarkers
                    .filter(marker => marker.type === 'point' || !marker.type) // Sadece point'leri al
                    .map(marker => {
                        // Clean properties: remove undefined values and functions
                        const cleanProps = {};
                        if (marker.properties && typeof marker.properties === 'object') {
                            Object.keys(marker.properties).forEach(key => {
                                const value = marker.properties[key];
                                // Only include valid GeoJSON property types
                                if (value !== undefined && typeof value !== 'function') {
                                    cleanProps[key] = value;
                                }
                            });
                        }

                        // Build feature with only defined values
                        const props = {
                            id: marker.id,
                            name: marker.name,
                            ...cleanProps
                        };

                        // Add timestamp fields only if they exist
                        if (marker.timestamp !== undefined) props.timestamp = marker.timestamp;
                        if (marker.Date !== undefined) props.Date = marker.Date;
                        if (marker.date !== undefined) props.date = marker.date;
                        if (marker.time !== undefined) props.time = marker.time;
                        if (marker.tarih !== undefined) props.tarih = marker.tarih;

                        return {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [marker.lon, marker.lat]
                            },
                            properties: props
                        };
                    })
            };
            safeLogTimeline(`  💾 Cached cluster data from userMarkers: ${this.originalClusterData.features.length} features`);
        }

        const sourceData = this.originalClusterData || originalData;
        if (!sourceData?.features) {
            safeLogTimeline('  ⚠️ No cluster features to filter');
            safeLogTimeline(`  🔍 Debug - originalClusterData: ${!!this.originalClusterData}, originalData: ${!!originalData}, userMarkers: ${userMarkers.length}`);
            return;
        }

        // Use worker if available and dataset is large
        if (this.workerEnabled && sourceData.features.length > 1000) {
            this._filterClusterSourceWithWorker(clusterSource, sourceData, currentDate, previousDate);
        } else {
            this._filterClusterSourceMainThread(clusterSource, sourceData, currentDate, previousDate);
        }
    }

    /**
     * Filter cluster source using Web Worker (for large datasets)
     * @private
     */
    _filterClusterSourceWithWorker(clusterSource, sourceData, currentDate, previousDate) {
        const clusterStart = performance.now();
        const requestId = ++this.workerRequestId;

        safeLogTimeline(`  🔧 Using Web Worker for ${sourceData.features.length} features`);

        this.workerCallbacks.set(requestId, (error, result) => {
            if (error) {
                safeErrorTimeline('  ❌ Worker error, falling back to main thread:', error);
                this._filterClusterSourceMainThread(clusterSource, sourceData, currentDate, previousDate);
                return;
            }

            const { filteredFeatures, stats } = result;

            const setDataStart = performance.now();
            clusterSource.setData({
                type: 'FeatureCollection',
                features: filteredFeatures
            });
            const setDataTime = performance.now() - setDataStart;

            const totalTime = performance.now() - clusterStart;
            safeLogTimeline(`  📊 Cluster (Worker): ${stats.originalCount} → ${stats.filteredCount} features (${totalTime.toFixed(2)}ms)`);
            safeLogTimeline(`    ⏱️ Filter: ${stats.filterTime.toFixed(2)}ms, SetData: ${setDataTime.toFixed(2)}ms, Transfer: ${(totalTime - stats.filterTime - setDataTime).toFixed(2)}ms`);
            safeLogTimeline(`    🔍 Filtered out - Date: ${stats.dateFilterCount}, Property: ${stats.propertyFilterCount}`);
        });

        // Send filter request to worker
        this.worker.postMessage({
            type: 'FILTER',
            requestId,
            data: {
                features: sourceData.features,
                currentDate: currentDate.getTime(),
                previousDate: previousDate ? previousDate.getTime() : null,
                filterMode: this.filterMode,
                selectedProperty: this.selectedProperty,
                propertyMin: this.propertyCurrentMin,
                propertyMax: this.propertyCurrentMax
            }
        });
    }

    /**
     * Filter cluster source on main thread (fallback or small datasets)
     * @private
     */
    _filterClusterSourceMainThread(clusterSource, sourceData, currentDate, previousDate) {
        const clusterStart = performance.now();
        const userMarkers = window.eventHandlers?.userMarkers || window.userMarkers || [];
        const originalCount = sourceData.features.length;
        let dateFilterCount = 0;
        let propertyFilterCount = 0;
        let markerLookupCount = 0;

        const filterStart = performance.now();
        const filteredFeatures = sourceData.features.filter(feature => {
            const featureDate = this._getFeatureDate(feature, userMarkers);
            if (!featureDate) return true;

            const dateResult = this._filterFeatureByDate(featureDate, currentDate, previousDate);
            if (!dateResult) {
                dateFilterCount++;
                return false;
            }

            const propertyValue = this._getPropertyValue(feature, userMarkers);
            if (feature.properties?.id) {
                markerLookupCount++;
            }
            const propResult = this._filterFeatureByProperty(propertyValue);
            if (!propResult) {
                propertyFilterCount++;
            }
            return propResult;
        });
        const filterTime = performance.now() - filterStart;

        const setDataStart = performance.now();
        clusterSource.setData({
            type: 'FeatureCollection',
            features: filteredFeatures
        });
        const setDataTime = performance.now() - setDataStart;

        const totalTime = performance.now() - clusterStart;
        safeLogTimeline(`  📊 Cluster (Main): ${originalCount} → ${filteredFeatures.length} features (${totalTime.toFixed(2)}ms)`);
        safeLogTimeline(`    ⏱️ Filter: ${filterTime.toFixed(2)}ms, SetData: ${setDataTime.toFixed(2)}ms`);
        safeLogTimeline(`    🔍 Filtered out - Date: ${dateFilterCount}, Property: ${propertyFilterCount}`);
        if (markerLookupCount > 0) {
            safeLogTimeline(`    ⚠️ Marker lookups: ${markerLookupCount} (potential O(n²) issue!)`);
        }
    }

    /**
     * Filter label source (user-data-labels) to match timeline filter
     * @private
     */
    _filterLabelSource(currentDate, previousDate) {
        const labelSource = this.map.getSource('user-data-labels');
        if (!labelSource) {
            return; // No label source, nothing to filter
        }

        const userMarkers = window.eventHandlers?.userMarkers || window.userMarkers || [];
        if (userMarkers.length === 0) {
            return;
        }

        // Get current label settings from LayerStylePanel
        const layerStylePanel = window.layerStylePanel;
        if (!layerStylePanel || !layerStylePanel.currentSettings.labelField) {
            return; // No label field selected
        }

        const labelField = layerStylePanel.currentSettings.labelField;

        // Filter userMarkers based on timeline
        const filteredFeatures = [];
        let filteredCount = 0;

        userMarkers.forEach(marker => {
            // Only process point markers
            if (marker.type !== 'point' && marker.type) {
                return;
            }

            // Get date from marker
            const dateValue = marker.timestamp || marker.time || marker.Date || marker.date || marker.tarih ||
                            marker.properties?.timestamp || marker.properties?.time ||
                            marker.properties?.Date || marker.properties?.date || marker.properties?.tarih;

            if (!dateValue) {
                // No date, include by default
                filteredFeatures.push(marker);
                return;
            }

            const featureDate = this.parseDate(dateValue);
            const dateResult = this._filterFeatureByDate(featureDate, currentDate, previousDate);

            if (!dateResult) {
                filteredCount++;
                return; // Filtered out by date
            }

            // Filter by property if selected
            if (this.selectedProperty) {
                const propertyValue = marker.properties?.[this.selectedProperty] || marker[this.selectedProperty];
                const propResult = this._filterFeatureByProperty(propertyValue);
                if (!propResult) {
                    filteredCount++;
                    return; // Filtered out by property
                }
            }

            filteredFeatures.push(marker);
        });

        // Create label GeoJSON from filtered markers
        const labelGeoJSON = {
            type: 'FeatureCollection',
            features: filteredFeatures
                .filter(marker => marker.lat && marker.lon) // Only point markers
                .map(marker => {
                    // Get label text
                    let labelText = null;
                    if (marker.properties && labelField in marker.properties) {
                        labelText = marker.properties[labelField];
                    } else if (labelField in marker) {
                        labelText = marker[labelField];
                    }

                    if (!labelText || labelText === '') {
                        return null;
                    }

                    return {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [marker.lon, marker.lat]
                        },
                        properties: {
                            label: String(labelText)
                        }
                    };
                })
                .filter(f => f !== null)
        };

        // Update label source
        labelSource.setData(labelGeoJSON);
        safeLogTimeline(`  🏷️ Labels: ${userMarkers.length} → ${labelGeoJSON.features.length} labels (filtered: ${filteredCount})`);
    }

    /**
     * Sayısal property'leri tespit et
     */
    detectNumericProperties() {
        this.numericProperties.clear();
        
        // Tüm veri kaynaklarını topla
        let allFeatures = [];
        
        // 1. MapLibre source'larından (catalog ve cluster)
        const sources = ['catalog-points', 'catalog-polygons', 'catalog-lines', 'catalog-geometries', 'markers'];
        sources.forEach(sourceId => {
            const source = this.map.getSource(sourceId);
            if (source && source._data && source._data.features) {
                allFeatures = allFeatures.concat(source._data.features);
            }
        });
        
        // 2. userMarkers'dan (fallback)
        const userMarkers = window.eventHandlers?.userMarkers || window.userMarkers || [];
        if (allFeatures.length === 0 && userMarkers.length > 0) {
            allFeatures = userMarkers.map(m => ({ properties: m }));
        }
        
        if (allFeatures.length === 0) {
            return;
        }
        
        // İlk birkaç feature'dan sayısal alanları tespit et
        const sampleSize = Math.min(20, allFeatures.length);
        const propertyStats = new Map(); // property -> [values]
        
        for (let i = 0; i < sampleSize; i++) {
            let props = allFeatures[i].properties || allFeatures[i];
            
            // Eğer userMarkers'dan geliyorsa ve içinde properties varsa, oradan al
            if (props.properties && typeof props.properties === 'object') {
                props = { ...props, ...props.properties };
            }
            
            // Her property'yi kontrol et
            for (const [key, value] of Object.entries(props)) {
                // Zaten zaman alanlarını, koordinat ve id alanlarını atla
                if (key === 'timestamp' || key === 'time' || key === 'Date' || key === 'date' || key === 'tarih' ||
                    key === 'id' || key === 'type' || key === 'name' ||
                    key === 'Location' || key === 'EventID' || key === 'OBJECTID' ||
                    key === 'Latitude' || key === 'Longitude' ||
                    key === 'latitude' || key === 'longitude' ||
                    key === 'lat' || key === 'lon' || key === 'lng' ||
                    key === 'Type' || key === 'geometry' || key === 'properties' || key === '_metrics') {
                    continue;
                }
                
                // Sayısal mı kontrol et
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && isFinite(numValue)) {
                    if (!propertyStats.has(key)) {
                        propertyStats.set(key, []);
                    }
                    propertyStats.get(key).push(numValue);
                }
            }
        }
        
        // Tüm feature'ları tara ve min/max değerleri bul
        propertyStats.forEach((values, key) => {
            const allValues = [];
            
            allFeatures.forEach(feature => {
                let props = feature.properties || feature;
                
                // Eğer içinde properties varsa, oradan al
                if (props.properties && typeof props.properties === 'object') {
                    props = { ...props, ...props.properties };
                }
                
                const numValue = parseFloat(props[key]);
                if (!isNaN(numValue) && isFinite(numValue)) {
                    allValues.push(numValue);
                }
            });
            
            if (allValues.length > 0) {
                const min = Math.min(...allValues);
                const max = Math.max(...allValues);
                
                // Birim tahmin et (property adına göre)
                let unit = '';
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('magnitude') || lowerKey.includes('büyüklük')) {
                    unit = '';
                } else if (lowerKey.includes('depth') || lowerKey.includes('derinlik')) {
                    unit = ' km';
                } else if (lowerKey.includes('temp') || lowerKey.includes('sıcaklık')) {
                    unit = '°C';
                } else if (lowerKey.includes('yağış') || lowerKey.includes('rain')) {
                    unit = ' mm';
                } else if (lowerKey.includes('rms')) {
                    unit = ' s';
                }
                
                this.numericProperties.set(key, { min, max, unit, count: allValues.length });
            }
        });
    }
    
    /**
     * Property dropdown'unu doldur
     */
    populatePropertySelect() {
        // Mevcut seçeneği sakla
        const currentValue = this.propertySelect.value;
        
        // Temizle
        this.propertySelect.innerHTML = '<option value="">Filtre Yok</option>';
        
        // Sayısal property'leri ekle
        this.numericProperties.forEach((stats, propertyName) => {
            const option = document.createElement('option');
            option.value = propertyName;
            option.textContent = `${propertyName} (${stats.min.toFixed(1)} - ${stats.max.toFixed(1)}${stats.unit})`;
            this.propertySelect.appendChild(option);
        });
        
        // Eski seçimi geri yükle
        if (currentValue && this.numericProperties.has(currentValue)) {
            this.propertySelect.value = currentValue;
        }
    }
    
    /**
     * Property range slider'ını göster
     */
    showPropertyRange() {
        if (!this.selectedProperty || !this.numericProperties.has(this.selectedProperty)) {
            return;
        }
        
        const stats = this.numericProperties.get(this.selectedProperty);
        this.propertyDataMin = stats.min;
        this.propertyDataMax = stats.max;
        this.propertyCurrentMin = stats.min;
        this.propertyCurrentMax = stats.max;
        
        const step = (stats.max - stats.min) / 100;
        
        // Min slider'ı güncelle
        this.propertySliderMin.min = stats.min;
        this.propertySliderMin.max = stats.max;
        this.propertySliderMin.value = stats.min;
        this.propertySliderMin.step = step;
        
        // Max slider'ı güncelle
        this.propertySliderMax.min = stats.min;
        this.propertySliderMax.max = stats.max;
        this.propertySliderMax.value = stats.max;
        this.propertySliderMax.step = step;
        
        // Göster
        this.propertyRangeContainer.classList.remove('hidden');
        this.updatePropertyDisplay();
        
        window.showFeedback(`📊 Filtre: ${this.selectedProperty}`, 'info', 2000);
    }
    
    /**
     * Property range slider'ını gizle
     */
    hidePropertyRange() {
        this.propertyRangeContainer.classList.add('hidden');
        this.selectedProperty = null;
    }
    
    /**
     * Property değer gösterimini güncelle
     */
    updatePropertyDisplay() {
        if (!this.selectedProperty || !this.numericProperties.has(this.selectedProperty)) {
            return;
        }
        
        const stats = this.numericProperties.get(this.selectedProperty);
        const unit = stats.unit;
        
        // Değerleri göster
        this.propertyCurrentMinEl.textContent = `${this.propertyCurrentMin.toFixed(1)}${unit}`;
        this.propertyCurrentMaxEl.textContent = `${this.propertyCurrentMax.toFixed(1)}${unit}`;
        
        // Range track'i güncelle (yeşil bar)
        const rangeTrack = this.propertyRangeContainer.querySelector('.timeline-range-track::before') || 
                          this.propertyRangeContainer.querySelector('.timeline-range-track');
        
        if (rangeTrack) {
            const minPercent = ((this.propertyCurrentMin - this.propertyDataMin) / (this.propertyDataMax - this.propertyDataMin)) * 100;
            const maxPercent = ((this.propertyCurrentMax - this.propertyDataMin) / (this.propertyDataMax - this.propertyDataMin)) * 100;
            
            // ::before pseudo-element'e CSS variable ile set ediyoruz
            this.propertyRangeContainer.style.setProperty('--range-min', minPercent + '%');
            this.propertyRangeContainer.style.setProperty('--range-max', maxPercent + '%');
        }
    }
    
    /**
     * Zaman filtresini temizle
     */
    clearTimeFilter() {
        const sources = ['catalog-points', 'catalog-polygons', 'catalog-lines', 'catalog-geometries'];
        
        sources.forEach(sourceId => {
            const source = this.map.getSource(sourceId);
            if (source) {
                // Orijinal veriyi geri yükle
                const originalData = this.originalCatalogData?.[sourceId] || source._data;
                if (originalData) {
                    source.setData(originalData);
                }
            }
        });
        
        // Cluster source'u da temizle
        const clusterSource = this.map.getSource('markers');
        if (clusterSource) {
            // Orijinal cluster verisini geri yükle
            if (this.originalClusterData && this.originalClusterData.type === 'FeatureCollection') {
                try {
                    clusterSource.setData(this.originalClusterData);
                } catch (e) {
                    safeWarnTimeline('Timeline: Error restoring cluster data', e);
                }
            }
            // else if (clusterSource._data) bloğu kaldırıldı çünkü _data her zaman güvenli GeoJSON değildir.
            // Orijinal veri yedeği yoksa, henüz filtreleme yapılmamış demektir, dolayısıyla geri almaya gerek yok.
        }

        // Label source'u da temizle
        const labelSource = this.map.getSource('user-data-labels');
        const layerStylePanel = window.layerStylePanel;
        if (labelSource && layerStylePanel && layerStylePanel.currentSettings.labelField) {
            // Restore labels by calling updateBasicLabels (which uses all userMarkers)
            layerStylePanel.updateBasicLabels();
            safeLogTimeline('🏷️ Labels restored to show all data');
        }
    }
    
    /**
     * Oynat/Duraklat
     */
    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }
    
    /**
     * Oynatmayı başlat
     */
    play() {
        if (this.timeData.length === 0) {
            window.showFeedback('⚠️ Oynatılacak zaman verisi yok', 'warning');
            return;
        }

        safeLogTimeline(`▶️ Timeline: Animation started - ${this.timeData.length} frames, ${this.speed}ms interval, mode: ${this.filterMode}`);

        this.isPlaying = true;
        this.playBtn.classList.add('playing');
        this.playBtn.querySelector('i').classList.remove('fa-play');
        this.playBtn.querySelector('i').classList.add('fa-pause');

        let frameCount = 0;
        const animationStart = performance.now();

        this.animationInterval = setInterval(() => {
            const frameStart = performance.now();
            frameCount++;

            if (this.currentIndex < this.timeData.length - 1) {
                this.currentIndex++;
                this.slider.value = this.currentIndex;
                this.updateTimeDisplay();
                this.filterMapByTime();

                const frameTime = performance.now() - frameStart;
                if (frameTime > this.speed * 0.8) {
                    safeWarnTimeline(`⚠️ Timeline: Frame ${frameCount} took ${frameTime.toFixed(2)}ms (threshold: ${this.speed}ms) - Animation lagging!`);
                }
            } else {
                // Sona ulaşıldı, başa dön veya durdur
                const totalTime = performance.now() - animationStart;
                const avgFrameTime = totalTime / frameCount;
                safeLogTimeline(`🏁 Timeline: Animation completed - ${frameCount} frames in ${totalTime.toFixed(2)}ms (avg: ${avgFrameTime.toFixed(2)}ms/frame)`);

                this.stop();
                this.currentIndex = 0;
                this.slider.value = 0;
                // Force slider background reset
                this.slider.style.background = `linear-gradient(to right, #10b981 0%, #d4d4d8 0%)`;
                this.updateTimeDisplay();
                this.filterMapByTime();
            }
        }, this.speed);
    }
    
    /**
     * Oynatmayı durdur
     */
    stop() {
        safeLogTimeline(`⏸️ Timeline: Animation stopped at index ${this.currentIndex}`);

        this.isPlaying = false;
        this.playBtn.classList.remove('playing');
        this.playBtn.querySelector('i').classList.remove('fa-pause');
        this.playBtn.querySelector('i').classList.add('fa-play');

        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }
    
    /**
     * Önceki zaman adımı
     */
    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.slider.value = this.currentIndex;
            this.updateTimeDisplay();
            this.filterMapByTime();
        }
    }
    
    /**
     * Sonraki zaman adımı
     */
    next() {
        if (this.currentIndex < this.timeData.length - 1) {
            this.currentIndex++;
            this.slider.value = this.currentIndex;
            this.updateTimeDisplay();
            this.filterMapByTime();
        }
    }
    
    /**
     * Timeline durumunu al
     */
    isActive() {
        return this.isVisible;
    }
    
    /**
     * Timeline'ı sıfırla
     */
    reset() {
        this.stop();
        this.currentIndex = 0;
        this.slider.value = 0;
        this.timeData = [];
        // Force slider background reset
        this.slider.style.background = `linear-gradient(to right, #10b981 0%, #d4d4d8 0%)`;
        this.updateTimeDisplay();
        this.clearTimeFilter();

        // Property filtresini de sıfırla
        this.selectedProperty = null;
        this.propertySelect.value = '';
        this.hidePropertyRange();
        this.numericProperties.clear();
    }
}

// Global timeline manager instance
window.timelineManager = null;

/**
 * Timeline manager'ı başlat
 */
function initializeTimeline(map) {
    if (!window.timelineManager) {
        // DI Migration: Try to get TimelineManager from ServiceLocator
        if (window.ServiceLocator && window.ServiceLocator.has('timelineManager')) {
            window.timelineManager = window.ServiceLocator.get('timelineManager');
            safeLogTimeline('✅ TimelineManager obtained from DI Container');
        } else {
            window.timelineManager = new TimelineManager(map);
            safeWarnTimeline('⚠️ TimelineManager created manually (DI Container not available)');
        }
    }
}

// Global export
window.initializeTimeline = initializeTimeline;

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimelineManager, initializeTimeline };
}

// Browser global export
if (typeof window !== 'undefined') {
    window.Timeline = TimelineManager;
}

