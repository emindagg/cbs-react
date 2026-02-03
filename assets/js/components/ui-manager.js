/**
 * UI Components Module - MapLibre GL JS
 * Handles draggable UI elements and educational feedback
 * - FAB (Floating Action Button) dragging
 * - Map title dragging and editing
 * - North arrow dragging
 * - Locate button dragging
 * - Scale display dragging
 * - Educational feedback system
 * - Mouse coordinates display
 *
 * PHASE 3 MIGRATION: Now supports Dependency Injection
 * - Backward compatible with old constructor: new UIComponents(map)
 * - New DI constructor: new UIComponents({ map, stateManager, eventBus })
 */

class UIComponents {
    /**
     * Constructor with support for both old and new APIs
     * @param {MapLibreMap|Object} mapOrDeps - Either a map instance (old API) or dependencies object (new DI API)
     */
    constructor(mapOrDeps) {
        // Check if new DI style (object with map property) or old style (just map)
        if (mapOrDeps && typeof mapOrDeps === 'object' && mapOrDeps.map) {
            // New DI style
            this.map = mapOrDeps.map;
            this.state = mapOrDeps.stateManager || null;
            this.events = mapOrDeps.eventBus || null;
            this._useDI = true;
        } else {
            // Old style (backward compatible)
            this.map = mapOrDeps;
            this.state = null;
            this.events = null;
            this._useDI = false;
        }

        this.locationMarker = null;
        if (window.Logger && typeof window.Logger.log === 'function') {
            window.Logger.log(`✅ UIComponents initialized (DI mode: ${this._useDI})`);
        } else {
            console.log(`✅ UIComponents initialized (DI mode: ${this._useDI})`);
        }
    }
    
    // Initialize all UI components
    initializeAll() {
        this.initializeFABDragging();
        this.initializeMapTitle();
        this.initializeLocateButton();
        this.initializeScaleDisplay();
        this.initializeMouseCoordinates();
    }
    
    // Educational feedback system
    showEducationalFeedback(message) {
        const feedbackContainer = document.getElementById('educational-feedback');
        if (!feedbackContainer) return;

        const feedbackItem = document.createElement('div');
        feedbackItem.className = 'bg-white border border-indigo-100 rounded-md shadow-sm p-2 text-xs text-indigo-700 animation-fade-in';
        feedbackItem.textContent = message;

        feedbackContainer.prepend(feedbackItem);

        setTimeout(() => {
            feedbackItem.classList.add('opacity-0');
            setTimeout(() => feedbackItem.remove(), 500);
        }, 4000);
    }
    
    // North Arrow initialization
    initializeNorthArrow() {
        if (window.Logger && typeof window.Logger.log === 'function') {
            window.Logger.log('ℹ️ North arrow handlers in visualization-handlers.js');
        } else {
            console.log('ℹ️ North arrow handlers in visualization-handlers.js');
        }
    }
    
    // Map Title initialization
    initializeMapTitle() {
    }
    
    // FAB Button dragging
    initializeFABDragging() {
        if (typeof interact === 'undefined') {
            if (window.Logger && typeof window.Logger.warn === 'function') {
                window.Logger.warn('interact.js not loaded for FAB, retrying...');
            } else {
                console.warn('interact.js not loaded for FAB, retrying...');
            }
            setTimeout(() => this.initializeFABDragging(), 100);
            return;
        }

        const fabContainer = document.getElementById('label-fab');
        if (!fabContainer) {
            if (window.Logger && typeof window.Logger.warn === 'function') {
                window.Logger.warn('FAB container not found, retrying...');
            } else {
                console.warn('FAB container not found, retrying...');
            }
            setTimeout(() => this.initializeFABDragging(), 100);
            return;
        }
        
        // Set initial position from localStorage or default
        try {
            const savedPosition = localStorage.getItem('fabPosition');
            if (savedPosition) {
                const { x, y } = JSON.parse(savedPosition);
                fabContainer.style.transform = `translate(${x}px, ${y}px)`;
                fabContainer.setAttribute('data-x', x);
                fabContainer.setAttribute('data-y', y);
            }
        } catch (error) {
            if (window.Logger && typeof window.Logger.warn === 'function') {
                window.Logger.warn('Could not restore FAB position:', error);
            } else {
                console.warn('Could not restore FAB position:', error);
            }
        }

        interact(fabContainer)
            .draggable({
                inertia: false,
                listeners: {
                    start(event) {
                        window.fabWasDragged = false;
                    },
                    move(event) {
                        window.fabWasDragged = true;
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                        
                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end(event) {
                        // Save position to localStorage
                        try {
                            const x = parseFloat(event.target.getAttribute('data-x')) || 0;
                            const y = parseFloat(event.target.getAttribute('data-y')) || 0;
                            localStorage.setItem('fabPosition', JSON.stringify({ x, y }));
                        } catch (error) {
                            if (window.Logger && typeof window.Logger.warn === 'function') {
                                window.Logger.warn('Could not save FAB position:', error);
                            } else {
                                console.warn('Could not save FAB position:', error);
                            }
                        }
                        
                        // Reset drag flag after a short delay
                        setTimeout(() => {
                            window.fabWasDragged = false;
                        }, 100);
                    }
                }
            });
        
    }
    
    // Locate button with dragging
    initializeLocateButton() {
        const locateBtn = document.getElementById('locate-me-btn');
        
        let locateDragChecker = null;
        if (locateBtn) {
            locateDragChecker = this.makeDraggable(locateBtn);
        }
        
        // Konum bulma özelliği
        if (locateBtn && locateDragChecker) {
            locateBtn.addEventListener('click', (e) => {
                // Sürükleme sonrası tıklamayı engelle
                if (locateDragChecker.wasDragged(e)) {
                    return;
                }
                this.handleLocateClick(locateBtn);
            });
        }
    }
    
    handleLocateClick(locateBtn) {
        if (!navigator.geolocation) {
            alert('Tarayıcınız konum servislerini desteklemiyor.');
            return;
        }
        
        // Buton durumunu göster
        locateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-sm"></i>';
        locateBtn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                
                // Önceki konum işaretçisini temizle
                if (this.locationMarker) {
                    this.locationMarker.remove();
                }
                
                // Konum işaretçisini ekle - MapLibre Marker
                const el = document.createElement('div');
                el.className = 'custom-marker';
                el.style.background = '#ef4444';
                el.style.color = 'white';
                el.style.width = '16px';
                el.style.height = '16px';
                el.style.borderRadius = '50%';
                el.style.border = '3px solid white';
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                
                // Doğruluk değerini okunur formata çevir
                const formatAccuracy = (m) => {
                    if (typeof m !== 'number' || isNaN(m)) return '–';
                    if (m >= 1000) {
                        const km = m / 1000;
                        const decimals = km >= 100 ? 0 : 1;
                        return `${km.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} km`;
                    }
                    return `${Math.round(m).toLocaleString('tr-TR')} m`;
                };
                const accuracyText = formatAccuracy(accuracy);

                const popupContent = `
                    <div style="min-width: 200px;">
                        <h4 style="margin: 0 0 10px 0; font-weight: bold;">📍 Konumunuz</h4>
                        <p style="margin: 5px 0;"><strong>Koordinat:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
                        <p style="margin: 5px 0;"><strong>Doğruluk:</strong> ±${accuracyText}</p>
                    </div>
                `;
                
                this.locationMarker = new maplibregl.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupContent))
                    .addTo(this.map);
                
                this.locationMarker.togglePopup();
                
                // Haritayı konuma odakla
                this.map.flyTo({
                    center: [lng, lat],
                    zoom: 15,
                    duration: 1500
                });
                
                // Buton durumunu eski haline getir
                locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs text-sm"></i>';
                locateBtn.disabled = false;
                
                if (typeof showEducationalFeedback === 'function') {
                    showEducationalFeedback('📍 Konumunuz bulundu ve haritada gösteriliyor.');
                }
            },
            (error) => {
                if (window.Logger && typeof window.Logger.error === 'function') {
                    window.Logger.error('Geolocation error:', error);
                } else {
                    console.error('Geolocation error:', error);
                }
                let errorMessage = 'Konum alınamadı.';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Konum izni reddedildi. Tarayıcı ayarlarından konum iznini aktif edin.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Konum bilgisi şu anda kullanılamıyor.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Konum tespiti zaman aşımına uğradı.';
                        break;
                }
                
                alert(errorMessage);
                
                // Buton durumunu eski haline getir
                locateBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs text-sm"></i>';
                locateBtn.disabled = false;
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        );
    }
    
    // Scale line (Modern grafik ölçek çubuğu)
    initializeScaleDisplay() {
        const container = document.getElementById('scale-line-container');

        if (!container) {
            if (window.Logger && typeof window.Logger.warn === 'function') {
                window.Logger.warn('Scale line container not found');
            } else {
                console.warn('Scale line container not found');
            }
            return;
        }

        // Clear existing scale displays to prevent duplicates
        container.innerHTML = '';

        // Create modern scale bar wrapper
        const scaleWrapper = document.createElement('div');
        scaleWrapper.style.cssText = `
            padding: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        // Create scale bar content
        const scaleContent = document.createElement('div');
        scaleContent.style.cssText = 'display: flex; flex-direction: column;';
        
        // Distance text (üstte)
        const distanceText = document.createElement('div');
        distanceText.className = 'scale-distance';
        distanceText.style.cssText = `
            font-size: 10px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 2px;
        `;
        
        // Scale bar container
        const barContainer = document.createElement('div');
        barContainer.style.cssText = 'position: relative;';
        
        // Scale bar segments
        const scaleBar = document.createElement('div');
        scaleBar.className = 'scale-bar';
        scaleBar.style.cssText = `
            display: flex;
            height: 8px;
            border-radius: 0;
            overflow: hidden;
            box-shadow: none;
        `;
        
        barContainer.appendChild(scaleBar);
        scaleContent.appendChild(distanceText);
        scaleContent.appendChild(barContainer);
        scaleWrapper.appendChild(scaleContent);
        container.appendChild(scaleWrapper);
        
        // Make the scale line draggable
        this.makeDraggable(container);
        
        const updateScale = () => {
            try {
                // Globe projection için ölçek hesaplaması - ekranın alt kısmından ölç (daha doğru)
                const containerHeight = this.map._container.clientHeight;
                const containerWidth = this.map._container.clientWidth;
                
                // Ölçek çubuğu için Y konumunu belirle (alt kısım, globe için daha stabil)
                // Globe projection'da merkez çizgisi distortion'a maruz kalır
                const y = containerHeight - 100; // Alt kısımdan sabit bir nokta
                const centerX = containerWidth / 2;
                const maxWidth = 120; // Modern bar için biraz daha geniş
                
                // Sol ve sağ noktaları belirle (merkezden başlayarak)
                const leftPoint = [centerX - maxWidth / 2, y];
                const rightPoint = [centerX + maxWidth / 2, y];
                
                // Unproject ile gerçek koordinatlara çevir
                const leftLngLat = this.map.unproject(leftPoint);
                const rightLngLat = this.map.unproject(rightPoint);
                
                // Haversine formülü ile gerçek mesafeyi hesapla (globe projection için doğru)
                const maxMeters = this.getDistance(leftLngLat, rightLngLat);
                
                // Negatif veya geçersiz değer kontrolü
                if (!maxMeters || maxMeters <= 0 || !isFinite(maxMeters)) {
                    if (window.Logger && typeof window.Logger.warn === 'function') {
                        window.Logger.warn('Ölçek hesaplaması geçersiz, varsayılan değer kullanılıyor');
                    } else {
                        console.warn('Ölçek hesaplaması geçersiz, varsayılan değer kullanılıyor');
                    }
                    return;
                }
                
                // Uygun bir ölçek değeri seç
                const { distance, label: distLabel } = this.getRoundedDistance(maxMeters);
                const ratio = distance / maxMeters;
                const width = maxWidth * ratio;
                
                // Minimum ve maksimum genişlik kontrolü
                const finalWidth = Math.max(20, Math.min(width, maxWidth));
                
                // Create segments (4 alternating colors)
                const segmentCount = 4;
                const segmentWidth = finalWidth / segmentCount;
                
                scaleBar.innerHTML = '';
                for (let i = 0; i < segmentCount; i++) {
                    const segment = document.createElement('div');
                    segment.style.cssText = `
                        width: ${segmentWidth}px;
                        background: ${i % 2 === 0 ? '#000000' : '#ffffff'};
                        border: 1px solid #000000;
                        box-sizing: border-box;
                        transition: all 0.3s ease;
                    `;
                    scaleBar.appendChild(segment);
                }
                
                // Update distance text with '0' and end value (üstte)
                distanceText.style.width = 'auto';
                distanceText.innerHTML = `
                    <div style="display: flex; align-items: center;">
                        <span style="color: #1e293b; font-weight: 700;">0</span>
                        <span style="margin-left: ${Math.max(finalWidth - 20, 0)}px; white-space: nowrap; font-weight: 700;">${distLabel}</span>
                    </div>
                `;
            } catch (error) {
                if (window.Logger && typeof window.Logger.error === 'function') {
                    window.Logger.error('Ölçek çubuğu güncellenirken hata:', error);
                } else {
                    console.error('Ölçek çubuğu güncellenirken hata:', error);
                }
            }
        };
        
        // Throttled update function for render events (to avoid too many updates)
        let renderTimeout;
        const throttledUpdateScale = () => {
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(updateScale, 100); // 100ms throttle
        };
        
        // Update scale on zoom, move, and projection changes
        this.map.on('zoom', updateScale);
        this.map.on('move', updateScale);
        this.map.on('render', throttledUpdateScale); // Globe projection değişikliklerini yakalamak için (throttled)
        
        // Initial update
        updateScale();
    }
    
    // Calculate distance between two points in meters
    getDistance(lngLat1, lngLat2) {
        const R = 6371000; // Earth radius in meters
        const rad = Math.PI / 180;
        const lat1 = lngLat1.lat * rad;
        const lat2 = lngLat2.lat * rad;
        const a = Math.sin(lat1) * Math.sin(lat2) +
                  Math.cos(lat1) * Math.cos(lat2) * Math.cos((lngLat2.lng - lngLat1.lng) * rad);
        return Math.acos(Math.min(a, 1)) * R;
    }
    
    // Get rounded distance with appropriate label
    getRoundedDistance(meters) {
        if (meters >= 1000) {
            const km = meters / 1000;
            const distances = [1, 2, 3, 5, 10, 20, 25, 50, 75, 100, 150, 200, 250, 500, 750, 1000, 2000, 2500];
            for (let i = distances.length - 1; i >= 0; i--) {
                if (km >= distances[i]) {
                    return { distance: distances[i] * 1000, label: distances[i] + ' km' };
                }
            }
            return { distance: 1000, label: '1 km' };
        } else {
            const distances = [1, 2, 5, 10, 20, 25, 50, 75, 100, 150, 200, 250, 500, 750];
            for (let i = distances.length - 1; i >= 0; i--) {
                if (meters >= distances[i]) {
                    return { distance: distances[i], label: distances[i] + ' m' };
                }
            }
            return { distance: 1, label: '1 m' };
        }
    }
    
    // Mouse coordinates display
    initializeMouseCoordinates() {
        const coordinateDisplay = document.getElementById('mouse-coordinates');

        if (!coordinateDisplay) {
            if (window.Logger && typeof window.Logger.warn === 'function') {
                window.Logger.warn('Coordinate display element not found');
            } else {
                console.warn('Coordinate display element not found');
            }
            return;
        }
        
        this.map.on('mousemove', (e) => {
            const coords = e.lngLat;
            coordinateDisplay.textContent = `Koordinatlar: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
        });
        
    }
    
    // Generic draggable utility
    makeDraggable(element) {
        if (typeof interact === 'undefined') {
            if (window.Logger && typeof window.Logger.warn === 'function') {
                window.Logger.warn('interact.js not loaded');
            } else {
                console.warn('interact.js not loaded');
            }
            return null;
        }
        
        let wasDragged = false;
        
        // Set initial position from localStorage
        const storageKey = `${element.id}_position`;
        try {
            const savedPosition = localStorage.getItem(storageKey);
            if (savedPosition) {
                const { x, y } = JSON.parse(savedPosition);
                element.style.transform = `translate(${x}px, ${y}px)`;
                element.setAttribute('data-x', x);
                element.setAttribute('data-y', y);
            }
        } catch (error) {
            if (window.Logger && typeof window.Logger.warn === 'function') {
                window.Logger.warn(`Could not restore ${element.id} position:`, error);
            } else {
                console.warn(`Could not restore ${element.id} position:`, error);
            }
        }
        
        interact(element)
            .draggable({
                inertia: false,
                listeners: {
                    start(event) {
                        wasDragged = false;
                    },
                    move(event) {
                        wasDragged = true;
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                        
                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end(event) {
                        // Save position to localStorage
                        try {
                            const x = parseFloat(event.target.getAttribute('data-x')) || 0;
                            const y = parseFloat(event.target.getAttribute('data-y')) || 0;
                            localStorage.setItem(storageKey, JSON.stringify({ x, y }));
                        } catch (error) {
                            if (window.Logger && typeof window.Logger.warn === 'function') {
                                window.Logger.warn(`Could not save ${element.id} position:`, error);
                            } else {
                                console.warn(`Could not save ${element.id} position:`, error);
                            }
                        }
                    }
                }
            });
        
        return {
            wasDragged: () => wasDragged
        };
    }
}

// Export showEducationalFeedback as global function for backward compatibility
if (typeof window !== 'undefined') {
    window.showEducationalFeedback = function(message) {
        if (window.uiComponents) {
            window.uiComponents.showEducationalFeedback(message);
        } else {
            if (window.Logger && typeof window.Logger.log === 'function') {
                window.Logger.log('Educational feedback:', message);
            } else {
                console.log('Educational feedback:', message);
            }
        }
    };
}

// Browser global export
if (typeof window !== 'undefined') {
    window.UIComponents = UIComponents;
}
