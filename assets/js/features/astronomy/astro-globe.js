/**
 * Astronomy Globe Module - MapLibre GL JS
 * Dünya-Güneş-Ay hareketleri görselleştirmesi
 * Eğitim amaçlı astronomi modülü
 */

const AstroGlobe = {
    map: null,
    isInitialized: false,
    animationInterval: null,
    currentDate: new Date(),
    speed: 1,
    timeMode: 'local', // 'local' veya 'utc'
    
    // Feature states
    features: {
        sunPosition: false,
        terminator: false,
        moonPhase: false,
        axialTilt: false,
        eclipses: false
    },
    
    /**
     * Date objesini datetime-local input formatına çevir
     * @param {Date} date
     * @param {'local'|'utc'} [mode]
     * @returns {string}
     */
    formatDateForInput(date, mode) {
        if (!(date instanceof Date)) return '';
        const useUTC = (mode || this.timeMode) === 'utc';
        const year = useUTC ? date.getUTCFullYear() : date.getFullYear();
        const month = String((useUTC ? date.getUTCMonth() : date.getMonth()) + 1).padStart(2, '0');
        const day = String(useUTC ? date.getUTCDate() : date.getDate()).padStart(2, '0');
        const hours = String(useUTC ? date.getUTCHours() : date.getHours()).padStart(2, '0');
        const minutes = String(useUTC ? date.getUTCMinutes() : date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
    
    /**
     * Input string'ini aktif moda göre Date objesine çevir
     * @param {string} value
     * @returns {Date|null}
     */
    parseInputToDate(value) {
        if (!value) return null;
        
        if (this.timeMode === 'utc') {
            const [datePart, timePart] = value.split('T');
            if (!datePart || !timePart) return null;
            
            const [y, m, d] = datePart.split('-').map(v => parseInt(v, 10));
            const [hh, mm] = timePart.split(':').map(v => parseInt(v, 10));
            if ([y, m, d, hh, mm].some(n => Number.isNaN(n))) return null;
            
            // Değerleri UTC olarak yorumla
            return new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0));
        }
        
        // Yerel mod: tarayıcının varsayılan ISO parse davranışı
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        return d;
    },
    
    /**
     * Modülü başlat
     */
    initialize(map) {
        
        if (!map) {
            Logger.warn('AstroGlobe: Map object not provided');
            return;
        }
        
        // SunCalc kontrolü - farklı CDN'ler farklı global isimler kullanabilir
        if (typeof SunCalc === 'undefined' && typeof window.SunCalc === 'undefined') {
            Logger.error('AstroGlobe: SunCalc library not loaded');
            Logger.warn('SunCalc yükleniyor mu? Kontrol edin:', typeof SunCalc, typeof window.SunCalc);
            // Hata olsa bile devam et, sadece uyar
        }
        
        this.map = map;
        
        // Map yüklendiğinde kaynakları hazırla
        if (map.isStyleLoaded()) {
            this.prepareSources();
        } else {
            map.once('style.load', () => {
                this.prepareSources();
            });
        }
        
        // UI'ı başlat (SunCalc olmasa bile panel açılabilmeli)
        
        this.initializeUI();
        this.isInitialized = true;
    },
    
    /**
     * MapLibre kaynaklarını hazırla
     */
    prepareSources() {
        if (!this.map) {
            Logger.warn('AstroGlobe: Map not available for prepareSources');
            return;
        }
        
        if (!this.map.isStyleLoaded()) {
            Logger.warn('AstroGlobe: Map style not loaded yet');
            // Map style yüklenmesini bekle
            this.map.once('style.load', () => {
                this.prepareSources();
            });
            return;
        }
        
        try {
            // Terminator line source (aydınlanma çizgisi)
            if (!this.map.getSource('astro-terminator')) {
                this.map.addSource('astro-terminator', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                });
            }
            
            // Sun position source (Güneş konumu marker)
            if (!this.map.getSource('astro-sun-position')) {
                this.map.addSource('astro-sun-position', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                });
            }
            
            // Moon position source (Ay konumu)
            if (!this.map.getSource('astro-moon-position')) {
                this.map.addSource('astro-moon-position', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                });
            }
            
            // Eksen eğikliği ve mevsimler kaynağı
            if (!this.map.getSource('astro-axial-tilt')) {
                this.map.addSource('astro-axial-tilt', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                });
            }
            
            // Tropik çizgileri kaynağı (Yengeç ve Oğlak Dönencesi)
            if (!this.map.getSource('astro-tropics')) {
                this.map.addSource('astro-tropics', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                });
            }
            
            // Kutup çizgileri kaynağı (Kutup Daireleri)
            if (!this.map.getSource('astro-polar-circles')) {
                this.map.addSource('astro-polar-circles', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                });
            }
            
            // Tutulma kaynağı (Güneş ve Ay tutulmaları)
            if (!this.map.getSource('astro-eclipses')) {
                this.map.addSource('astro-eclipses', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                });
            }
            
        } catch (error) {
            Logger.error('AstroGlobe: Source hazırlama hatası', error);
        }
    },
    
    /**
     * UI kontrollerini başlat
     */
    initializeUI() {
        
        
        const toggleBtn = document.getElementById('toggle-astro-button');
        const astroPanel = document.getElementById('astro-panel');
        
        
        
        if (!toggleBtn || !astroPanel) {
            Logger.error('❌ AstroGlobe: UI elements not found', {
                toggleBtn: toggleBtn,
                astroPanel: astroPanel,
                docReady: document.readyState
            });
            // Retry after a short delay
            setTimeout(() => {
                
                this.initializeUI();
            }, 500);
            return;
        }
        
        // Panel'i sürüklenebilir yap
        this.makePanelDraggable(astroPanel);
        
        // Panel toggle ui-panels-initialization.js'de yapılıyor
        // Burada sadece panel içi kontroller
        
        // Panel içindeki tüm buton ve input'lara stopPropagation ekle
        const panelButtons = astroPanel.querySelectorAll('button, input[type="checkbox"], input[type="range"], input[type="datetime-local"]');
        panelButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
        
        // Feature toggles
        const sunPositionCheck = document.getElementById('astro-sun-position');
        const terminatorCheck = document.getElementById('astro-terminator');
        const moonPhaseCheck = document.getElementById('astro-moon-phase');
        const axialTiltCheck = document.getElementById('astro-axial-tilt');
        const eclipsesCheck = document.getElementById('astro-eclipses');
        const datetimeInput = document.getElementById('astro-datetime');
        const datetimeNowBtn = document.getElementById('astro-datetime-now');
        const timeModeLocalBtn = document.getElementById('astro-time-mode-local');
        const timeModeUtcBtn = document.getElementById('astro-time-mode-utc');
        const speedSlider = document.getElementById('astro-speed');
        const speedValue = document.getElementById('astro-speed-value');
        const playPauseBtn = document.getElementById('astro-play-pause-btn');
        
        
        
        // Başlangıç tarih/saat değerini ayarla
        if (datetimeInput) {
            const now = new Date();
            datetimeInput.value = this.formatDateForInput(now);
            this.currentDate = now;
        }
        
        // Hız slider güncellemesi
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                this.speed = parseFloat(e.target.value);
                speedValue.textContent = `${this.speed.toFixed(1)}x`;
            });
        }
        
        // Tarih/saat değişikliği
        if (datetimeInput) {
            datetimeInput.addEventListener('change', (e) => {
                const newDate = this.parseInputToDate(e.target.value);
                
                // Geçerli tarih kontrolü
                if (!newDate || Number.isNaN(newDate.getTime())) {
                    Logger.warn('Geçersiz tarih');
                    return;
                }
                
                // Yıl sınırı kontrolü (1-9999)
                const year = newDate.getFullYear();
                if (year < 1 || year > 9999) {
                    alert('Lütfen 1-9999 yılları arasında bir tarih seçin');
                    // Eski tarihe geri dön
                    e.target.value = this.formatDateForInput(this.currentDate);
                    return;
                }
                
                this.currentDate = newDate;
                this.updateAllFeatures();
            });
            
            // Input sırasında yıl uzunluğunu kontrol et
            datetimeInput.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value.length > 0) {
                    // Yıl kısmını al (ilk 4 karakter)
                    const yearPart = value.split('-')[0];
                    if (yearPart && yearPart.length > 4) {
                        // Yılı 4 karaktere sınırla
                        const corrected = yearPart.substring(0, 4) + value.substring(4);
                        e.target.value = corrected;
                    }
                }
            });
        }
        
        // "Şimdi" butonu: aktif moda göre şu ana dön
        if (datetimeInput && datetimeNowBtn) {
            datetimeNowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const now = new Date();
                this.currentDate = now;
                datetimeInput.value = this.formatDateForInput(now);
                this.updateAllFeatures();
            });
        }
        
        // Saat modu toggle (Yerel / UTC)
        const updateTimeModeButtons = () => {
            if (!timeModeLocalBtn || !timeModeUtcBtn) return;
            if (this.timeMode === 'utc') {
                timeModeLocalBtn.className = 'px-2 py-0.5 text-[10px] font-medium text-blue-600 bg-white';
                timeModeUtcBtn.className = 'px-2 py-0.5 text-[10px] font-medium bg-blue-600 text-white';
            } else {
                timeModeLocalBtn.className = 'px-2 py-0.5 text-[10px] font-medium bg-blue-600 text-white';
                timeModeUtcBtn.className = 'px-2 py-0.5 text-[10px] font-medium text-blue-600 bg-white';
            }
        };
        
        if (datetimeInput && timeModeLocalBtn && timeModeUtcBtn) {
            // Başlangıçta buton stillerini ayarla
            updateTimeModeButtons();
            
            timeModeLocalBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.timeMode = 'local';
                datetimeInput.value = this.formatDateForInput(this.currentDate, 'local');
                updateTimeModeButtons();
            });
            
            timeModeUtcBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.timeMode = 'utc';
                datetimeInput.value = this.formatDateForInput(this.currentDate, 'utc');
                updateTimeModeButtons();
            });
        }
        
        // Animasyon toggle butonu - context'i korumak için self kullan
        const self = this; // Context'i sakla
        
        /**
         * Play/Pause butonunun görünümünü güncelle
         */
        this.updatePlayPauseButton = function(isPlaying) {
            // Butonu her seferinde yeniden bul (replace edildiği için referans kaybolmuş olabilir)
            const btn = document.getElementById('astro-play-pause-btn');
            if (!btn) {
                Logger.warn('⚠️ Play/Pause button not found for update');
                return;
            }
            
            const icon = btn.querySelector('i');
            const text = btn.querySelector('.btn-text');
            
            if (isPlaying) {
                // Duraklat göster
                btn.className = 'flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg text-xs transition-all';
                if (icon) {
                    icon.className = 'fa-solid fa-pause mr-1';
                }
                if (text) {
                    text.textContent = 'Duraklat';
                }
                
            } else {
                // Oynat göster
                btn.className = 'flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg text-xs transition-all';
                if (icon) {
                    icon.className = 'fa-solid fa-play mr-1';
                }
                if (text) {
                    text.textContent = 'Oynat';
                }
                
            }
        };
        
        if (playPauseBtn) {
            
            
            // Mevcut listener'ı kaldırmak için butonu replace et
            const btnParent = playPauseBtn.parentNode;
            const btnClone = playPauseBtn.cloneNode(true);
            btnParent.replaceChild(btnClone, playPauseBtn);
            const playPauseBtnClean = document.getElementById('astro-play-pause-btn');
            
            if (playPauseBtnClean) {
                playPauseBtnClean.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    // Animasyon çalışıyorsa duraklat, değilse başlat
                    if (self.animationInterval) {
                        
                        self.stopAnimation();
                    } else {
                        
                        self.startAnimation();
                    }
                });
                
                // onclick fallback kaldırıldı - addEventListener yeterli
                
                
            }
        } else {
            Logger.error('❌ AstroGlobe: Play/Pause toggle button not found!');
        }
        
        // Feature checkbox'ları
        if (sunPositionCheck) {
            sunPositionCheck.addEventListener('change', (e) => {
                this.features.sunPosition = e.target.checked;
                this.toggleSunPosition();
            });
        }
        
        if (terminatorCheck) {
            terminatorCheck.addEventListener('change', (e) => {
                this.features.terminator = e.target.checked;
                this.toggleTerminator();
            });
        }
        
        if (moonPhaseCheck) {
            moonPhaseCheck.addEventListener('change', (e) => {
                this.features.moonPhase = e.target.checked;
                this.toggleMoonPhase();
            });
        }
        
        if (axialTiltCheck) {
            axialTiltCheck.addEventListener('change', (e) => {
                this.features.axialTilt = e.target.checked;
                this.toggleAxialTilt();
            });
        }
        
        if (eclipsesCheck) {
            eclipsesCheck.addEventListener('change', (e) => {
                this.features.eclipses = e.target.checked;
                this.toggleEclipses();
            });
        }
    },
    
    /**
     * Terminator çizgisini hesapla ve çiz (aydınlanma çizgisi)
     * SunCalc kullanarak gerçek terminator çizgisini hesaplar
     * Line ve gece bölgesi için polygon döndürür
     */
    computeTerminator(date) {
        if (!date) return null;
        const SunCalcLib = window.SunCalc || SunCalc;
        if (!SunCalcLib || !SunCalcLib.getPosition) {
            Logger.warn('SunCalc not available for terminator calculation');
            return null;
        }
        
        // Sub-solar point: Güneş'in tam altındaki Dünya üzerindeki nokta
        // Bu noktanın declination (eğiklik) ve hour angle'ını hesapla
        const declination = this.getSunDeclination(date);
        const hourAngle = this.getHourAngle(date);
        
        // Sub-solar point koordinatları
        const subSolarLat = declination;
        const subSolarLon = hourAngle;
        
        // Terminator çizgisi: Sub-solar point'ten 90° uzakta olan noktalar
        // Bu noktalar gece/gündüz sınırını oluşturur
        const coordinates = [];
        const steps = 180; // Yeterli çözünürlük için
        
        for (let i = 0; i <= steps; i++) {
            const lon = -180 + (i * 360 / steps);
            
            // Terminator enlemini hesapla
            // Bu nokta sub-solar point'ten 90° uzakta olmalı
            const lat = this.computeTerminatorLatForLongitude(date, lon, subSolarLat, subSolarLon);
            coordinates.push([lon, lat]);
        }
        
        // Line feature
        const lineFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            },
            properties: {
                description: 'Gece/Gündüz Sınır Çizgisi (Terminator)'
            }
        };
        
        // Gece bölgesi polygon'u oluştur
        // Terminator çizgisinden gece tarafını karart
        const nightPolygonCoords = [...coordinates];
        
        // Sub-solar point'in hangi yarımkürede olduğuna göre gece tarafını belirle
        // Terminator çizgisini kuzey/güney kutuplarıyla birleştir
        const lastLat = coordinates[coordinates.length - 1][1];
        const firstLat = coordinates[0][1];
        
        // Gece tarafını tamamla: Terminator + kutup noktaları
        if (subSolarLat >= 0) {
            // Güneş kuzey yarımkürede → Güney kutbu karart
            nightPolygonCoords.push([180, -90]);
            nightPolygonCoords.push([-180, -90]);
        } else {
            // Güneş güney yarımkürede → Kuzey kutbu karart
            nightPolygonCoords.push([180, 90]);
            nightPolygonCoords.push([-180, 90]);
        }
        
        // Polygon'u kapat
        nightPolygonCoords.push(nightPolygonCoords[0]);
        
        const nightPolygonFeature = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [nightPolygonCoords]
            },
            properties: {
                description: 'Gece Bölgesi'
            }
        };
        
        return {
            line: lineFeature,
            nightPolygon: nightPolygonFeature
        };
    },
    
    /**
     * Belirli bir boylam için terminator enlemini hesapla
     * Terminator çizgisinde solar zenith angle = 90° olur
     * 
     * Küresel trigonometri formülü:
     * cos(θs) = sin(Φ) * sin(δ) + cos(Φ) * cos(δ) * cos(h)
     * Zenith angle 90° olduğunda: 0 = sin(Φ) * sin(δ) + cos(Φ) * cos(δ) * cos(h)
     * Çözüm: sin(Φ) = -cos(h) * cos(δ) * tan(Φ) / sin(Φ)
     * Ya da: cos(θs) = 0 formülünden türetilen basit form
     */
    computeTerminatorLatForLongitude(date, longitude, subSolarLat, subSolarLon) {
        // Hour angle (saat açısı): longitude ile subsolar point arasındaki fark
        const h = longitude - subSolarLon;
        
        // Radyan'a çevir
        const h_rad = h * Math.PI / 180;
        const delta_rad = subSolarLat * Math.PI / 180;
        
        // Terminator formülü (solar zenith angle = 90° için):
        // cos(90°) = sin(Φ) * sin(δ) + cos(Φ) * cos(δ) * cos(h)
        // 0 = sin(Φ) * sin(δ) + cos(Φ) * cos(δ) * cos(h)
        // Düzenlenirse: tan(Φ) = -cos(h) / tan(δ)
        
        const cos_h = Math.cos(h_rad);
        const tan_delta = Math.tan(delta_rad);
        
        // Özel durumlar: Eğer tan(δ) = 0 ise (ekinoks zamanı)
        if (Math.abs(tan_delta) < 0.0001) {
            // Ekinoks: terminator ekvatordan geçer
            return 0;
        }
        
        // Latitude hesapla: tan(Φ) = -cos(h) / tan(δ)
        const tan_lat = -cos_h / tan_delta;
        const lat = Math.atan(tan_lat) * 180 / Math.PI;
        
        // Sınırları kontrol et (-90° ile +90° arası)
        return Math.max(-90, Math.min(90, lat));
    },
    
    /**
     * Yılın kaçıncı günü olduğunu hesapla
     */
    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    },
    
    /**
     * Güneş doğuş/batış pozisyonunu göster
     */
    toggleSunPosition() {
        if (!this.map) {
            Logger.warn('AstroGlobe: Map not available');
            return;
        }
        
        // Map style yüklenene kadar bekle
        if (!this.map.isStyleLoaded()) {
            
            this.map.once('style.load', () => {
                setTimeout(() => this.toggleSunPosition(), 100);
            });
            return;
        }
        
        // Source yoksa hazırla
        if (!this.map.getSource('astro-sun-position')) {
            this.prepareSources();
        }
        
        const source = this.map.getSource('astro-sun-position');
        if (!source) {
            Logger.warn('AstroGlobe: Sun position source not found');
            return;
        }
        
        if (this.features.sunPosition) {
            // Güneş pozisyonunu hesapla ve göster
            this.updateSunPosition();
            
            // Layer ekle (eğer yoksa)
            if (!this.map.getLayer('astro-sun-marker')) {
                this.map.addLayer({
                    id: 'astro-sun-marker',
                    type: 'circle',
                    source: 'astro-sun-position',
                    paint: {
                        'circle-radius': 10,
                        'circle-color': '#FFD700',
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#FFA500'
                    }
                });
                
                // Popup için click event
                this.map.on('click', 'astro-sun-marker', (e) => {
                    const feature = e.features[0];
                    const props = feature.properties;
                    
                    const declinationVal = parseFloat(props.declination);
                    const hourAngleVal = parseFloat(props.hourAngle);
                    
                    // Enlem formatı: derece° dakika' K/G
                    const latAbs = Math.abs(declinationVal);
                    const latDegrees = Math.floor(latAbs);
                    const latMinutes = Math.round((latAbs - latDegrees) * 60);
                    const latDirection = declinationVal >= 0 ? 'K' : 'G';
                    const latFormatted = `${latDegrees}° ${latMinutes}' ${latDirection}`;
                    
                    // Boylam formatı: derece° dakika' D/B
                    const lonAbs = Math.abs(hourAngleVal);
                    const lonDegrees = Math.floor(lonAbs);
                    const lonMinutes = Math.round((lonAbs - lonDegrees) * 60);
                    const lonDirection = hourAngleVal >= 0 ? 'D' : 'B';
                    const lonFormatted = `${lonDegrees}° ${lonMinutes}' ${lonDirection}`;
                    
                    new maplibregl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(`
                            <div style="padding: 8px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #FFA500;">
                                    <i class="fa-solid fa-sun" style="margin-right: 6px;"></i>Güneş
                                </h3>
                                <div style="font-size: 12px; line-height: 1.6;">
                                    <div><strong>Enlem:</strong> ${latFormatted}</div>
                                    <div><strong>Boylam:</strong> ${lonFormatted}</div>
                                    <div style="margin-top: 6px; font-size: 11px; color: #666;">
                                        Güneş'in tam altındaki Dünya üzerindeki nokta
                                    </div>
                                </div>
                            </div>
                        `)
                        .addTo(this.map);
                });
                
                // Cursor değişikliği
                this.map.on('mouseenter', 'astro-sun-marker', () => {
                    this.map.getCanvas().style.cursor = 'pointer';
                });
                this.map.on('mouseleave', 'astro-sun-marker', () => {
                    this.map.getCanvas().style.cursor = '';
                });
            }
        } else {
            // Layer'ı kaldır
            if (this.map.getLayer('astro-sun-marker')) {
                this.map.removeLayer('astro-sun-marker');
            }
            source.setData({
                type: 'FeatureCollection',
                features: []
            });
        }
    },
    
    /**
     * Güneş pozisyonunu güncelle
     * Sub-solar point'i (Güneş'in tam altındaki Dünya üzerindeki nokta) gösterir
     */
    updateSunPosition() {
        const SunCalcLib = window.SunCalc || SunCalc;
        if (!SunCalcLib || !SunCalcLib.getPosition) {
            Logger.warn('SunCalc.getPosition not available');
            return;
        }
        
        // Sub-solar point: Güneş'in tam altındaki Dünya üzerindeki nokta
        // Bu nokta Güneş'in declination ve hour angle'ı ile hesaplanır
        const declination = this.getSunDeclination(this.currentDate);
        const hourAngle = this.getHourAngle(this.currentDate);
        
        // Sub-solar point koordinatları
        const subSolarLat = declination;
        const subSolarLon = hourAngle;
        
        const source = this.map.getSource('astro-sun-position');
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [subSolarLon, subSolarLat]
                    },
                    properties: {
                        name: 'Güneş (Sub-Solar Point)',
                        declination: declination.toFixed(2),
                        hourAngle: hourAngle.toFixed(2)
                    }
                }]
            });
        }
    },
    
    /**
     * Güneş'in declination (eğiklik) açısını hesapla
     */
    getSunDeclination(date) {
        const dayOfYear = this.getDayOfYear(date);
        return 23.44 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
    },
    
    /**
     * Saat açısını hesapla (Sub-solar point longitude)
     * Sub-solar point: Güneş'in tam altındaki Dünya üzerindeki nokta
     * 
     * Dünya doğudan batıya döner (saat yönünde görünür):
     * - Sabah (06:00): Güneş doğuda → Sub-solar point doğuda (+90°)
     * - Öğlen (12:00): Güneş üstte → Sub-solar point 0° (Greenwich)
     * - Akşam (18:00): Güneş batıda → Sub-solar point batıda (-90°)
     * 
     * Zaman ilerledikçe Sub-solar point doğudan batıya hareket eder (normal)
     */
    getHourAngle(date) {
        const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
        // Sub-solar point longitude: 0° = Greenwich, negatif = batı, pozitif = doğu
        // Formül: (hour - 12) * 15
        // Örnek: hour=12 → 0°, hour=6 → -90° (batı), hour=18 → +90° (doğu)
        // Ama bu yanlış! Sabah doğuda olmalı, akşam batıda olmalı
        // Doğru: hour=6 → +90° (doğu), hour=18 → -90° (batı)
        // Yani: (12 - hour) * 15 değil, (hour - 12) * 15 kullanmalıyız ama ters işaret
        return -(hour - 12) * 15; // Negatif işaret: saat ilerledikçe batıya (doğru yön)
    },
    
    /**
     * Terminator çizgisini göster/gizle
     */
    toggleTerminator() {
        if (!this.map) {
            Logger.warn('AstroGlobe: Map not available');
            return;
        }
        
        // Map style yüklenene kadar bekle
        if (!this.map.isStyleLoaded()) {
            
            this.map.once('style.load', () => {
                setTimeout(() => this.toggleTerminator(), 100);
            });
            return;
        }
        
        // Source yoksa hazırla
        if (!this.map.getSource('astro-terminator')) {
            this.prepareSources();
        }
        
        const source = this.map.getSource('astro-terminator');
        if (!source) {
            Logger.warn('AstroGlobe: Terminator source not found');
            return;
        }
        
        if (this.features.terminator) {
            this.updateTerminator();
            
            // Gece bölgesi fill layer ekle (en altta olmalı)
            if (!this.map.getLayer('astro-night-shadow')) {
                // Var olan ilk label layer'ı bul (etiketlerin altına eklemek için)
                const layers = this.map.getStyle().layers;
                let firstLabelLayer = null;
                for (let i = 0; i < layers.length; i++) {
                    if (layers[i].type === 'symbol' || layers[i].id.includes('label')) {
                        firstLabelLayer = layers[i].id;
                        break;
                    }
                }
                
                // Layer'ı ekle
                const layerConfig = {
                    id: 'astro-night-shadow',
                    type: 'fill',
                    source: 'astro-terminator',
                    filter: ['==', ['get', 'description'], 'Gece Bölgesi'],
                    paint: {
                        'fill-color': '#000000',
                        'fill-opacity': 0.3  // %30 karanlık
                    }
                };
                
                if (firstLabelLayer) {
                    this.map.addLayer(layerConfig, firstLabelLayer);
                } else {
                    this.map.addLayer(layerConfig);
                }
            }
            
            // Terminator çizgisi layer ekle
            if (!this.map.getLayer('astro-terminator-line')) {
                this.map.addLayer({
                    id: 'astro-terminator-line',
                    type: 'line',
                    source: 'astro-terminator',
                    filter: ['==', ['get', 'description'], 'Gece/Gündüz Sınır Çizgisi (Terminator)'],
                    paint: {
                        'line-color': '#FFB700',  // Daha belirgin sarı
                        'line-width': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 3.5,    // Çok uzakta (zoom 0) - 1.5px daha kalın
                            2, 3.3,    // zoom 2'de
                            4, 3,      // zoom 4'te
                            6, 2.7,    // zoom 6'da
                            10, 2.5    // Yakında (zoom 10+)
                        ],
                        'line-opacity': 0.9,  // Daha opak
                        'line-dasharray': [2, 2]
                    }
                });
            }
        } else {
            // Layer'ları kaldır
            if (this.map.getLayer('astro-night-shadow')) {
                this.map.removeLayer('astro-night-shadow');
            }
            if (this.map.getLayer('astro-terminator-line')) {
                this.map.removeLayer('astro-terminator-line');
            }
            source.setData({
                type: 'FeatureCollection',
                features: []
            });
        }
    },
    
    /**
     * Terminator çizgisini güncelle
     */
    updateTerminator() {
        const terminatorData = this.computeTerminator(this.currentDate);
        const source = this.map.getSource('astro-terminator');
        
        if (source && terminatorData) {
            // Hem line hem de nightPolygon feature'larını ekle
            source.setData({
                type: 'FeatureCollection',
                features: [terminatorData.line, terminatorData.nightPolygon]
            });
        }
    },
    
    /**
     * Ay evrelerini göster/gizle
     */
    toggleMoonPhase() {
        if (!this.map) {
            Logger.warn('AstroGlobe: Map not available');
            return;
        }
        
        // Map style yüklenene kadar bekle
        if (!this.map.isStyleLoaded()) {
            
            this.map.once('style.load', () => {
                setTimeout(() => this.toggleMoonPhase(), 100);
            });
            return;
        }
        
        // Source yoksa hazırla
        if (!this.map.getSource('astro-moon-position')) {
            this.prepareSources();
        }
        
        const source = this.map.getSource('astro-moon-position');
        if (!source) {
            Logger.warn('AstroGlobe: Moon position source not found');
            return;
        }
        
        if (this.features.moonPhase) {
            this.updateMoonPhase();
            
            if (!this.map.getLayer('astro-moon-marker')) {
                this.map.addLayer({
                    id: 'astro-moon-marker',
                    type: 'circle',
                    source: 'astro-moon-position',
                    paint: {
                        'circle-radius': 8,
                        'circle-color': '#C0C0C0',
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#808080'
                    }
                });
                
                // Popup için click event
                this.map.on('click', 'astro-moon-marker', (e) => {
                    const feature = e.features[0];
                    const props = feature.properties;
                    
                    const phase = props.phase !== undefined ? (props.phase * 100).toFixed(1) : 'N/A';
                    const fraction = props.fraction !== undefined ? (props.fraction * 100).toFixed(1) : 'N/A';
                    
                    // Enlem ve Boylam formatla (derece-dakika)
                    let latFormatted = 'N/A';
                    if (props.declination !== undefined) {
                        const declinationVal = parseFloat(props.declination);
                        const latAbs = Math.abs(declinationVal);
                        const latDegrees = Math.floor(latAbs);
                        const latMinutes = Math.round((latAbs - latDegrees) * 60);
                        const latDirection = declinationVal >= 0 ? 'K' : 'G';
                        latFormatted = `${latDegrees}° ${latMinutes}' ${latDirection}`;
                    }
                    
                    let lonFormatted = 'N/A';
                    if (props.longitude !== undefined) {
                        const longitudeVal = parseFloat(props.longitude);
                        const lonAbs = Math.abs(longitudeVal);
                        const lonDegrees = Math.floor(lonAbs);
                        const lonMinutes = Math.round((lonAbs - lonDegrees) * 60);
                        const lonDirection = longitudeVal >= 0 ? 'D' : 'B';
                        lonFormatted = `${lonDegrees}° ${lonMinutes}' ${lonDirection}`;
                    }
                    
                    let phaseName = 'Bilinmeyen';
                    if (props.phase !== undefined) {
                        const p = props.phase;
                        if (p === 0 || p === 1) phaseName = 'Yeni Ay';
                        else if (p < 0.25) phaseName = 'İlk Hilal';
                        else if (p === 0.25) phaseName = 'İlk Dördün';
                        else if (p < 0.5) phaseName = 'Büyüyen Ay';
                        else if (p === 0.5) phaseName = 'Dolunay';
                        else if (p < 0.75) phaseName = 'Küçülen Ay';
                        else if (p === 0.75) phaseName = 'Son Dördün';
                        else phaseName = 'Son Hilal';
                    }
                    
                    new maplibregl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(`
                            <div style="padding: 8px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #6366f1;">
                                    <i class="fa-solid fa-moon" style="margin-right: 6px;"></i>Ay
                                </h3>
                                <div style="font-size: 12px; line-height: 1.6;">
                                    <div><strong>Enlem:</strong> ${latFormatted}</div>
                                    <div><strong>Boylam:</strong> ${lonFormatted}</div>
                                    <div><strong>Evre:</strong> ${phaseName}</div>
                                    <div><strong>Evre Değeri:</strong> ${phase}%</div>
                                    <div><strong>Aydınlanma Oranı:</strong> ${fraction}%</div>
                                    <div style="margin-top: 6px; font-size: 11px; color: #666;">
                                        Ay'ın Dünya üzerindeki konumu ve evre bilgisi
                                    </div>
                                </div>
                            </div>
                        `)
                        .addTo(this.map);
                });
                
                // Cursor değişikliği
                this.map.on('mouseenter', 'astro-moon-marker', () => {
                    this.map.getCanvas().style.cursor = 'pointer';
                });
                this.map.on('mouseleave', 'astro-moon-marker', () => {
                    this.map.getCanvas().style.cursor = '';
                });
            }
        } else {
            if (this.map.getLayer('astro-moon-marker')) {
                this.map.removeLayer('astro-moon-marker');
            }
            source.setData({
                type: 'FeatureCollection',
                features: []
            });
        }
    },
    
    /**
     * Ay pozisyonunu güncelle
     */
    updateMoonPhase() {
        try {
            const SunCalcLib = window.SunCalc || SunCalc;
            if (!SunCalcLib) {
                Logger.warn('SunCalc not available for moon phase');
                return;
            }
            
            const moonIllumination = SunCalcLib.getMoonIllumination ? SunCalcLib.getMoonIllumination(this.currentDate) : null;
            
            if (!moonIllumination) {
                Logger.warn('Moon illumination data not available');
                return;
            }
            
            // Ay'ın Dünya üzerindeki konumunu hesapla (sub-lunar point)
            // Ay, Dünya'nın çevresinde yaklaşık 27.3 günde döner (sideral month)
            
            // Ay'ın declination'ı: Güneş'in declination'ına yakın ama ±5.14° sapma ile
            const sunDeclination = this.getSunDeclination(this.currentDate);
            const moonPhaseAngle = moonIllumination.phase * 2 * Math.PI; // 0-2π
            const moonDeclinationRange = 5.14; // Ay'ın maksimum declination sapması
            const moonDeclination = sunDeclination + Math.sin(moonPhaseAngle) * moonDeclinationRange;
            
            // Gökyüzü görünümü: Ay gökyüzünde doğudan batıya hareket eder
            // (Dünya'nın dönüşü nedeniyle - Güneş gibi)
            // Güneş'in hour angle'ına benzer şekilde, ama Ay daha yavaş hareket eder
            
            // UTC saatine göre hour angle hesapla (Güneş'teki gibi)
            const utcHours = this.currentDate.getUTCHours() + this.currentDate.getUTCMinutes() / 60;
            
            // Ay'ın gökyüzündeki konumu: Güneş gibi doğudan batıya
            // Ay günde yaklaşık 13.37° ilerler (360° / 27.3 gün)
            // Ama Dünya'nın dönüşü (günde 360°) daha hızlı olduğu için
            // Ay gökyüzünde doğudan batıya hareket eder
            
            // Ay'ın orbital açısı (27.3 günlük döngü)
            const moonCycleDays = 27.321661;
            const dateMs = this.currentDate.getTime();
            const daysSinceEpoch = (dateMs / (1000 * 60 * 60 * 24)) % moonCycleDays;
            const moonDailyProgress = (daysSinceEpoch / moonCycleDays) * 360; // Ay günde ~13.37° ilerler
            
            // Ay'ın gökyüzündeki konumu (doğudan batıya)
            // Güneş gibi: hour angle = (hour - 12) * 15
            // Ama Ay olduğu için orbital ilerlemeyi de hesaba kat
            const moonHourAngle = (utcHours - 12) * 15 - (moonDailyProgress / 24); // Ay günlük ilerleme
            
            // Güneş'teki gibi: -(hour - 12) * 15 (doğudan batıya)
            let moonLon = -(moonHourAngle);
            
            // Normalize et (-180 ile +180 arası)
            while (moonLon > 180) moonLon -= 360;
            while (moonLon < -180) moonLon += 360;
            
            // Latitude'u -90 ile +90 arasında sınırla
            const moonLat = Math.max(-90, Math.min(90, moonDeclination));
            
            const source = this.map.getSource('astro-moon-position');
            if (source) {
                source.setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [moonLon, moonLat]
                        },
                        properties: {
                            name: 'Ay (Sub-Lunar Point)',
                            phase: moonIllumination.phase,
                            fraction: moonIllumination.fraction,
                            declination: moonLat.toFixed(2),
                            longitude: moonLon.toFixed(2)
                        }
                    }]
                });
            }
        } catch (error) {
            Logger.error('AstroGlobe: Moon phase update error', error);
        }
    },
    
    /**
     * Tüm özellikleri güncelle
     */
    updateAllFeatures() {
        if (this.features.sunPosition) this.updateSunPosition();
        if (this.features.terminator) this.updateTerminator();
        if (this.features.moonPhase) this.updateMoonPhase();
        if (this.features.axialTilt) this.updateAxialTilt();
        if (this.features.eclipses) this.updateEclipses();
    },
    
    /**
     * Animasyonu başlat
     */
    startAnimation() {
        if (this.animationInterval) {
            
            return;
        }
        
        
        
        const self = this; // Context'i koru
        this.animationInterval = setInterval(function() {
            // Tarih/saati ilerlet (hız çarpanı ile)
            // Her 100ms'de bir güncelleme yap
            const minutesToAdd = (self.speed * 6) / 10; // Hız çarpanı: 1x = 0.6 dakika/100ms
            self.currentDate = new Date(self.currentDate.getTime() + (minutesToAdd * 60000));
            
            // Datetime input'u güncelle (ama event tetikleme, sadece görsel)
            const datetimeInput = document.getElementById('astro-datetime');
            if (datetimeInput && typeof self.formatDateForInput === 'function') {
                datetimeInput.value = self.formatDateForInput(self.currentDate);
            }
            
            // Özellikleri güncelle
            if (self.features.sunPosition) self.updateSunPosition();
            if (self.features.terminator) self.updateTerminator();
            if (self.features.moonPhase) self.updateMoonPhase();
            if (self.features.axialTilt) self.updateAxialTilt();
            if (self.features.eclipses) self.updateEclipses();
        }, 100);
        
        // Butonu güncelle (duraklat göster)
        if (this.updatePlayPauseButton) {
            this.updatePlayPauseButton(true);
        }
        
        
    },
    
    /**
     * Animasyonu durdur
     */
    stopAnimation() {
        if (!this.animationInterval) {
            
            return;
        }
        
        clearInterval(this.animationInterval);
        this.animationInterval = null;
        
        // Butonu güncelle (oynat göster)
        if (this.updatePlayPauseButton) {
            this.updatePlayPauseButton(false);
        }
        
        
    },
    
    /**
     * Eksen eğikliği ve mevsimleri göster/gizle
     */
    toggleAxialTilt() {
        if (!this.map) {
            Logger.warn('AstroGlobe: Map not available');
            return;
        }
        
        // Map style yüklenene kadar bekle
        if (!this.map.isStyleLoaded()) {
            
            this.map.once('style.load', () => {
                setTimeout(() => this.toggleAxialTilt(), 100);
            });
            return;
        }
        
        // Sources yoksa hazırla
        if (!this.map.getSource('astro-axial-tilt')) {
            this.prepareSources();
        }
        
        if (this.features.axialTilt) {
            this.updateAxialTilt();
            
            // Tropik çizgileri layer'ı ekle (Ekvator + Yengeç ve Oğlak Dönencesi: ±23.44°)
            if (!this.map.getLayer('astro-tropics-line')) {
                this.map.addLayer({
                    id: 'astro-tropics-line',
                    type: 'line',
                    source: 'astro-tropics',
                    paint: {
                        'line-color': [
                            'case',
                            ['==', ['get', 'type'], 'equator'], '#10b981',
                            '#10b981'
                        ],
                        'line-width': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 2,    // Çok uzakta (zoom 0)
                            2, 1.8,  // zoom 2'de
                            4, 1.5,  // zoom 4'te
                            6, 1.2,  // zoom 6'da
                            10, 1    // Yakında (zoom 10+)
                        ],
                        'line-opacity': 0.8,
                        'line-dasharray': [
                            'case',
                            ['==', ['get', 'type'], 'equator'], ['literal', [2, 1]],
                            ['literal', [4, 2]]
                        ]
                    }
                });
            }
            
            // Kutup dairesi layer'ı ekle (±66.56° = 90° - 23.44°)
            if (!this.map.getLayer('astro-polar-circles-line')) {
                this.map.addLayer({
                    id: 'astro-polar-circles-line',
                    type: 'line',
                    source: 'astro-polar-circles',
                    paint: {
                        'line-color': '#3b82f6',
                        'line-width': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 2,    // Çok uzakta (zoom 0)
                            2, 1.8,  // zoom 2'de
                            4, 1.5,  // zoom 4'te
                            6, 1.2,  // zoom 6'da
                            10, 1    // Yakında (zoom 10+)
                        ],
                        'line-opacity': 0.6,
                        'line-dasharray': [2, 3]
                    }
                });
            }
            
            // Mevsim bilgisi için label layer (gün dönümleri ve ekinokslar)
            if (!this.map.getLayer('astro-axial-tilt-info')) {
                this.map.addLayer({
                    id: 'astro-axial-tilt-info',
                    type: 'circle',
                    source: 'astro-axial-tilt',
                    paint: {
                        'circle-radius': [
                            'case',
                            ['==', ['get', 'type'], 'season-info'], 12,
                            ['==', ['get', 'type'], 'equator'], 6,
                            ['==', ['get', 'type'], 'pole'], 8,
                            8
                        ],
                        'circle-color': [
                            'case',
                            ['==', ['get', 'type'], 'season-info'], '#ef4444',
                            ['==', ['get', 'type'], 'equator'], '#10b981',
                            ['==', ['get', 'type'], 'pole'], '#3b82f6',
                            '#ef4444'
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff',
                        'circle-opacity': 0.9
                    }
                });
                
                // Popup için click event
                this.map.on('click', 'astro-axial-tilt-info', (e) => {
                    const feature = e.features[0];
                    const props = feature.properties;
                    
                    let popupHTML = '';
                    const type = props.type || 'season-info';
                    
                    if (type === 'season-info') {
                        // Güneş eğikliğini derece ve dakika formatına çevir
                        const declinationVal = parseFloat(props.declination);
                        const declinationAbs = Math.abs(declinationVal);
                        const degrees = Math.floor(declinationAbs);
                        const minutes = Math.round((declinationAbs - degrees) * 60);
                        const direction = declinationVal >= 0 ? 'K' : 'G';
                        const declinationFormatted = `${degrees}° ${minutes}' ${direction}`;
                        
                        popupHTML = `
                            <div style="padding: 8px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #ef4444;">
                                    <i class="fa-solid fa-sun" style="margin-right: 6px;"></i>Mevsim Bilgisi
                                </h3>
                                <div style="font-size: 12px; line-height: 1.6;">
                                    <div><strong>Mevsim:</strong> ${props.name || 'N/A'}</div>
                                    <div><strong>Güneş Eğikliği:</strong> ${declinationFormatted}</div>
                                    ${props.info ? `<div style="margin-top: 6px; font-size: 11px; color: #666;"><em>${props.info}</em></div>` : ''}
                                    <div style="margin-top: 8px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 6px;">
                                        <strong>Eksen Eğikliği:</strong> 23° 27'<br>
                                        Bu eğiklik mevsimlerin nedeni!
                                    </div>
                                </div>
                            </div>
                        `;
                    } else if (type === 'equator') {
                        popupHTML = `
                            <div style="padding: 8px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #10b981;">
                                    <i class="fa-solid fa-circle" style="margin-right: 6px;"></i>Ekvator
                                </h3>
                                <div style="font-size: 12px; line-height: 1.6;">
                                    <div><strong>Enlem:</strong> 0°</div>
                                    <div style="margin-top: 6px; font-size: 11px; color: #666;">
                                        Ekvator çizgisi - Dünya'yı kuzey ve güney yarıkürelere ayırır
                                    </div>
                                </div>
                            </div>
                        `;
                    } else if (type === 'pole') {
                        popupHTML = `
                            <div style="padding: 8px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #3b82f6;">
                                    <i class="fa-solid fa-flag" style="margin-right: 6px;"></i>${props.name}
                                </h3>
                                <div style="font-size: 12px; line-height: 1.6;">
                                    <div><strong>Enlem:</strong> ${props.name.includes('Kuzey') ? '90° K' : '90° G'}</div>
                                </div>
                            </div>
                        `;
                    }
                    
                    new maplibregl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(popupHTML)
                        .addTo(this.map);
                });
                
                // Cursor değişikliği
                this.map.on('mouseenter', 'astro-axial-tilt-info', () => {
                    this.map.getCanvas().style.cursor = 'pointer';
                });
                this.map.on('mouseleave', 'astro-axial-tilt-info', () => {
                    this.map.getCanvas().style.cursor = '';
                });
            }
        } else {
            // Layer'ları kaldır
            if (this.map.getLayer('astro-tropics-line')) {
                this.map.removeLayer('astro-tropics-line');
            }
            if (this.map.getLayer('astro-polar-circles-line')) {
                this.map.removeLayer('astro-polar-circles-line');
            }
            if (this.map.getLayer('astro-axial-tilt-info')) {
                this.map.removeLayer('astro-axial-tilt-info');
            }
            
            // Source'ları temizle
            const tiltSource = this.map.getSource('astro-axial-tilt');
            const tropicsSource = this.map.getSource('astro-tropics');
            const polarSource = this.map.getSource('astro-polar-circles');
            
            if (tiltSource) tiltSource.setData({ type: 'FeatureCollection', features: [] });
            if (tropicsSource) tropicsSource.setData({ type: 'FeatureCollection', features: [] });
            if (polarSource) polarSource.setData({ type: 'FeatureCollection', features: [] });
        }
    },
    
    /**
     * Eksen eğikliği ve mevsimleri güncelle
     */
    updateAxialTilt() {
        const AXIAL_TILT = 23.44; // Dünya'nın eksen eğikliği (derece)
        const TROPIC_OF_CANCER = AXIAL_TILT; // Yengeç Dönencesi: +23.44°
        const TROPIC_OF_CAPRICORN = -AXIAL_TILT; // Oğlak Dönencesi: -23.44°
        const ARCTIC_CIRCLE = 90 - AXIAL_TILT; // Kuzey Kutup Dairesi: +66.56°
        const ANTARCTIC_CIRCLE = -(90 - AXIAL_TILT); // Güney Kutup Dairesi: -66.56°
        
        // Ekvator çizgisini oluştur (4 segmente bölünmüş)
        const equatorFeature = {
            type: 'Feature',
            geometry: {
                type: 'MultiLineString',
                coordinates: [
                    // Segment 1: -180 ile -90 arası
                    Array.from({ length: 91 }, (_, i) => [-180 + i, 0]),
                    // Segment 2: -90 ile 0 arası
                    Array.from({ length: 91 }, (_, i) => [-90 + i, 0]),
                    // Segment 3: 0 ile 90 arası
                    Array.from({ length: 91 }, (_, i) => [0 + i, 0]),
                    // Segment 4: 90 ile 180 arası
                    Array.from({ length: 91 }, (_, i) => [90 + i, 0])
                ]
            },
            properties: {
                name: 'Ekvator',
                latitude: 0,
                type: 'equator'
            }
        };
        
        // Tropik çizgilerini oluştur
        const tropicsFeatures = [
            // Yengeç Dönencesi (Kuzey Tropik) - 4 segmente bölünmüş
            {
                type: 'Feature',
                geometry: {
                    type: 'MultiLineString',
                    coordinates: [
                        Array.from({ length: 91 }, (_, i) => [-180 + i, TROPIC_OF_CANCER]),
                        Array.from({ length: 91 }, (_, i) => [-90 + i, TROPIC_OF_CANCER]),
                        Array.from({ length: 91 }, (_, i) => [0 + i, TROPIC_OF_CANCER]),
                        Array.from({ length: 91 }, (_, i) => [90 + i, TROPIC_OF_CANCER])
                    ]
                },
                properties: {
                    name: 'Yengeç Dönencesi',
                    latitude: TROPIC_OF_CANCER,
                    type: 'tropic'
                }
            },
            // Oğlak Dönencesi (Güney Tropik) - 4 segmente bölünmüş
            {
                type: 'Feature',
                geometry: {
                    type: 'MultiLineString',
                    coordinates: [
                        Array.from({ length: 91 }, (_, i) => [-180 + i, TROPIC_OF_CAPRICORN]),
                        Array.from({ length: 91 }, (_, i) => [-90 + i, TROPIC_OF_CAPRICORN]),
                        Array.from({ length: 91 }, (_, i) => [0 + i, TROPIC_OF_CAPRICORN]),
                        Array.from({ length: 91 }, (_, i) => [90 + i, TROPIC_OF_CAPRICORN])
                    ]
                },
                properties: {
                    name: 'Oğlak Dönencesi',
                    latitude: TROPIC_OF_CAPRICORN,
                    type: 'tropic'
                }
            }
        ];
        
        // Kutup dairelerini oluştur
        const polarCirclesFeatures = [
            // Kuzey Kutup Dairesi - 4 segmente bölünmüş
            {
                type: 'Feature',
                geometry: {
                    type: 'MultiLineString',
                    coordinates: [
                        Array.from({ length: 91 }, (_, i) => [-180 + i, ARCTIC_CIRCLE]),
                        Array.from({ length: 91 }, (_, i) => [-90 + i, ARCTIC_CIRCLE]),
                        Array.from({ length: 91 }, (_, i) => [0 + i, ARCTIC_CIRCLE]),
                        Array.from({ length: 91 }, (_, i) => [90 + i, ARCTIC_CIRCLE])
                    ]
                },
                properties: {
                    name: 'Kuzey Kutup Dairesi',
                    latitude: ARCTIC_CIRCLE,
                    type: 'polar'
                }
            },
            // Güney Kutup Dairesi - 4 segmente bölünmüş
            {
                type: 'Feature',
                geometry: {
                    type: 'MultiLineString',
                    coordinates: [
                        Array.from({ length: 91 }, (_, i) => [-180 + i, ANTARCTIC_CIRCLE]),
                        Array.from({ length: 91 }, (_, i) => [-90 + i, ANTARCTIC_CIRCLE]),
                        Array.from({ length: 91 }, (_, i) => [0 + i, ANTARCTIC_CIRCLE]),
                        Array.from({ length: 91 }, (_, i) => [90 + i, ANTARCTIC_CIRCLE])
                    ]
                },
                properties: {
                    name: 'Güney Kutup Dairesi',
                    latitude: ANTARCTIC_CIRCLE,
                    type: 'polar'
                }
            }
        ];
        
        // Mevsim bilgisi: Güneş'in declination'ına göre hangi mevsim olduğunu belirle
        const declination = this.getSunDeclination(this.currentDate);
        const season = this.getSeason(declination);
        const solsticeEquinox = this.getSolsticeEquinoxInfo(this.currentDate);
        
        // Mevsim marker'ları - daha görünür olması için birkaç nokta
        const seasonMarkers = [
            // Ekvator üzerinde (0°)
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0] // Greenwich, Ekvator
                },
                properties: {
                    name: 'Ekvator',
                    type: 'equator',
                    info: 'Ekvator çizgisi'
                }
            },
            // Güneş'in declination noktası
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, declination] // Greenwich meridian, declination latitude
                },
                properties: {
                    name: season.name,
                    declination: declination.toFixed(2),
                    info: solsticeEquinox.info,
                    type: 'season-info'
                }
            },
            // Kuzey kutup noktası (Mercator sınırına göre ayarlanmış)
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 85] // Mercator projeksiyonu 85.051129°'nin ötesini gösteremez
                },
                properties: {
                    name: 'Kuzey Kutbu',
                    type: 'pole',
                    info: 'Eksen eğikliği: 23° 27\''
                }
            },
            // Güney kutup noktası (Mercator sınırına göre ayarlanmış)
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, -85] // Mercator projeksiyonu -85.051129°'nin ötesini gösteremez
                },
                properties: {
                    name: 'Güney Kutbu',
                    type: 'pole',
                    info: 'Eksen eğikliği: 23° 27\''
                }
            }
        ];
        
        // Source'ları güncelle
        const tiltSource = this.map.getSource('astro-axial-tilt');
        const tropicsSource = this.map.getSource('astro-tropics');
        const polarSource = this.map.getSource('astro-polar-circles');
        
        if (tiltSource) {
            tiltSource.setData({
                type: 'FeatureCollection',
                features: seasonMarkers
            });
        }
        
        if (tropicsSource) {
            tropicsSource.setData({
                type: 'FeatureCollection',
                features: [equatorFeature, ...tropicsFeatures]
            });
        }
        
        if (polarSource) {
            polarSource.setData({
                type: 'FeatureCollection',
                features: polarCirclesFeatures
            });
        }
    },
    
    /**
     * Declination'a göre mevsimi belirle
     */
    getSeason(declination) {
        // Kuzey Yarıküre için mevsimler
        if (declination > 20) {
            return { name: 'Kuzey Yarıküre: Yaz / Güney: Kış', hemisphere: 'north', season: 'summer' };
        } else if (declination < -20) {
            return { name: 'Kuzey Yarıküre: Kış / Güney: Yaz', hemisphere: 'north', season: 'winter' };
        } else if (declination > 0) {
            return { name: 'Kuzey Yarıküre: İlkbahar / Güney: Sonbahar', hemisphere: 'north', season: 'spring' };
        } else {
            return { name: 'Kuzey Yarıküre: Sonbahar / Güney: İlkbahar', hemisphere: 'north', season: 'autumn' };
        }
    },
    
    /**
     * Gün dönümü veya ekinoks bilgisini al
     */
    getSolsticeEquinoxInfo(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12
        const day = date.getDate();
        
        // Yaklaşık tarihler (gerçek tarihler yıla göre değişir, bu basitleştirilmiş)
        const declination = this.getSunDeclination(date);
        
        // Gün dönümü ve ekinoks kontrolü
        if (month === 6 && day >= 20 && day <= 22) {
            return { info: 'Yaz Gün Dönümü', type: 'summer-solstice' };
        } else if (month === 12 && day >= 21 && day <= 23) {
            return { info: 'Kış Gün Dönümü', type: 'winter-solstice' };
        } else if (month === 3 && day >= 20 && day <= 22) {
            return { info: 'İlkbahar Ekinoksu', type: 'spring-equinox' };
        } else if (month === 9 && day >= 22 && day <= 24) {
            return { info: 'Sonbahar Ekinoksu', type: 'autumn-equinox' };
        }
        
        // Declination'a göre yakınlık kontrolü
        if (Math.abs(declination - 23.44) < 1) {
            return { info: 'Yaz Gün Dönümü yakın', type: 'near-summer-solstice' };
        } else if (Math.abs(declination + 23.44) < 1) {
            return { info: 'Kış Gün Dönümü yakın', type: 'near-winter-solstice' };
        } else if (Math.abs(declination) < 1) {
            return { info: 'Ekinoks yakın', type: 'near-equinox' };
        }
        
        return { info: '', type: 'normal' };
    },
    
    /**
     * Güneş/Ay tutulmalarını göster/gizle
     */
    toggleEclipses() {
        if (!this.map) {
            Logger.warn('AstroGlobe: Map not available');
            return;
        }
        
        // Map style yüklenene kadar bekle
        if (!this.map.isStyleLoaded()) {
            
            this.map.once('style.load', () => {
                setTimeout(() => this.toggleEclipses(), 100);
            });
            return;
        }
        
        // Sources yoksa hazırla
        if (!this.map.getSource('astro-eclipses')) {
            this.prepareSources();
        }
        
        if (this.features.eclipses) {
            this.updateEclipses();
            
            // Tutulma layer'ları ekle
            if (!this.map.getLayer('astro-eclipse-shadow')) {
                this.map.addLayer({
                    id: 'astro-eclipse-shadow',
                    type: 'fill',
                    source: 'astro-eclipses',
                    paint: {
                        'fill-color': '#000000',
                        'fill-opacity': 0.5
                    },
                    filter: ['==', ['get', 'type'], 'shadow']
                });
            }
            
            if (!this.map.getLayer('astro-eclipse-path')) {
                this.map.addLayer({
                    id: 'astro-eclipse-path',
                    type: 'line',
                    source: 'astro-eclipses',
                    paint: {
                        'line-color': '#8b5cf6',
                        'line-width': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 2.5,  // Çok uzakta (zoom 0)
                            2, 2,    // zoom 2'de
                            4, 1.8,  // zoom 4'te
                            6, 1.5,  // zoom 6'da
                            10, 1.2  // Yakında (zoom 10+)
                        ],
                        'line-opacity': 0.8,
                        'line-dasharray': [5, 3]
                    },
                    filter: ['==', ['get', 'type'], 'path']
                });
            }
            
            if (!this.map.getLayer('astro-eclipse-center')) {
                this.map.addLayer({
                    id: 'astro-eclipse-center',
                    type: 'circle',
                    source: 'astro-eclipses',
                    paint: {
                        'circle-radius': 12,
                        'circle-color': '#ef4444',
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff',
                        'circle-opacity': 0.9
                    },
                    filter: ['==', ['get', 'type'], 'center']
                });
                
                // Popup için click event
                this.map.on('click', 'astro-eclipse-center', (e) => {
                    const feature = e.features[0];
                    const props = feature.properties;
                    
                    const eclipseTypeName = props.eclipseType === 'solar' ? 'Güneş Tutulması' : 
                                           props.eclipseType === 'lunar' ? 'Ay Tutulması' : 'Kısmi Tutulma';
                    
                    // Ekliptik açıları derece-dakika formatına çevir
                    let eclipticLonFormatted = '';
                    if (props.eclipticLonDiff !== undefined) {
                        const lonVal = parseFloat(props.eclipticLonDiff);
                        const lonDegrees = Math.floor(lonVal);
                        const lonMinutes = Math.round((lonVal - lonDegrees) * 60);
                        eclipticLonFormatted = `${lonDegrees}° ${lonMinutes}'`;
                    }
                    
                    let eclipticLatFormatted = '';
                    if (props.eclipticLatDiff !== undefined) {
                        const latVal = parseFloat(props.eclipticLatDiff);
                        const latDegrees = Math.floor(latVal);
                        const latMinutes = Math.round((latVal - latDegrees) * 60);
                        eclipticLatFormatted = `${latDegrees}° ${latMinutes}'`;
                    }
                    
                    new maplibregl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(`
                            <div style="padding: 8px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #8b5cf6;">
                                    <i class="fa-solid fa-circle-radiation" style="margin-right: 6px;"></i>${eclipseTypeName}
                                </h3>
                                <div style="font-size: 12px; line-height: 1.6;">
                                    <div><strong>Tür:</strong> ${eclipseTypeName}</div>
                                    <div><strong>Ay Evresi:</strong> ${(props.phase * 100).toFixed(1)}%</div>
                                    ${eclipticLonFormatted ? 
                                        `<div><strong>Ekliptik Boylam Farkı:</strong> ${eclipticLonFormatted}</div>` : ''}
                                    ${eclipticLatFormatted ? 
                                        `<div><strong>Ekliptik Enlem Farkı:</strong> ${eclipticLatFormatted}</div>` : ''}
                                    <div style="margin-top: 6px; font-size: 11px; color: #666;">
                                        ${props.eclipseType === 'solar' ? 
                                            'Güneş tutulması: Ay, Güneş ile Dünya arasına girer' : 
                                            props.eclipseType === 'lunar' ?
                                            'Ay tutulması: Dünya, Güneş ile Ay arasına girer' :
                                            'Kısmi tutulma: Güneş, Ay ve Dünya yakın hizadadır'}
                                    </div>
                                </div>
                            </div>
                        `)
                        .addTo(this.map);
                });
                
                // Cursor değişikliği
                this.map.on('mouseenter', 'astro-eclipse-center', () => {
                    this.map.getCanvas().style.cursor = 'pointer';
                });
                this.map.on('mouseleave', 'astro-eclipse-center', () => {
                    this.map.getCanvas().style.cursor = '';
                });
            }
        } else {
            // Layer'ları kaldır
            if (this.map.getLayer('astro-eclipse-shadow')) {
                this.map.removeLayer('astro-eclipse-shadow');
            }
            if (this.map.getLayer('astro-eclipse-path')) {
                this.map.removeLayer('astro-eclipse-path');
            }
            if (this.map.getLayer('astro-eclipse-center')) {
                this.map.removeLayer('astro-eclipse-center');
            }
            
            // Source'u temizle
            const eclipseSource = this.map.getSource('astro-eclipses');
            if (eclipseSource) {
                eclipseSource.setData({ type: 'FeatureCollection', features: [] });
            }
        }
    },
    
    /**
     * Güneş/Ay tutulmalarını güncelle (Astronomy Engine ile gerçek tutulma hesaplama)
     */
    updateEclipses() {
        try {
            // Şimdilik basitleştirilmiş tutulma kontrolü - Astronomy Engine gelecekte eklenecek
            const SunCalcLib = window.SunCalc || SunCalc;
            if (!SunCalcLib) return;
            
            const moonIllum = SunCalcLib.getMoonIllumination(this.currentDate);
            if (!moonIllum) return;
            
            // Görselleştirme için pozisyonları hesapla
            const sunDeclination = this.getSunDeclination(this.currentDate);
            const sunHourAngle = this.getHourAngle(this.currentDate);
            const sunLat = sunDeclination;
            const sunLon = sunHourAngle;
            
            // Ay pozisyonu (basitleştirilmiş)
            const moonCycleDays = 27.321661;
            const dateMs = this.currentDate.getTime();
            const daysSinceEpoch = (dateMs / (1000 * 60 * 60 * 24)) % moonCycleDays;
            const utcHours = this.currentDate.getUTCHours() + this.currentDate.getUTCMinutes() / 60;
            const moonDailyProgress = (daysSinceEpoch / moonCycleDays) * 360;
            const moonHourAngle = (utcHours - 12) * 15 - (moonDailyProgress / 24);
            let moonLon = -(moonHourAngle);
            while (moonLon > 180) moonLon -= 360;
            while (moonLon < -180) moonLon += 360;
            const moonLat = sunDeclination + Math.sin(moonIllum.phase * 2 * Math.PI) * 5.14;
            
            // Basit tutulma kontrolü (geçici)
            const phase = moonIllum.phase;
            const isNewMoon = phase < 0.05 || phase > 0.95;
            const isFullMoon = phase > 0.45 && phase < 0.55;
            
            const isEclipse = isNewMoon || isFullMoon;
            const eclipseType = isNewMoon ? 'solar' : isFullMoon ? 'lunar' : 'partial';
            
            // Tutulma bildirimi göster/gizle
            this.showEclipseNotification(isEclipse, 0, 0, eclipseType);
            
            const eclipseFeatures = [];
            
            if (isEclipse) {
                // Tutulma merkezi
                const centerLon = (sunLon + moonLon) / 2;
                const centerLat = (sunLat + moonLat) / 2;
                
                const eclipseTypeName = eclipseType === 'solar' ? 'Güneş Tutulması' : 
                                       eclipseType === 'lunar' ? 'Ay Tutulması' : 
                                       'Kısmi Tutulma';
                
                // Tutulma merkezi marker
                eclipseFeatures.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [centerLon, centerLat]
                    },
                    properties: {
                        name: eclipseTypeName,
                        type: 'center',
                        eclipseType: eclipseType,
                        phase: moonIllum.phase.toFixed(3),
                        eclipticLonDiff: '0.00',
                        eclipticLatDiff: '0.00'
                    }
                });
                
                // Tutulma gölge bölgesi
                const shadowRadius = eclipseType === 'solar' ? 2.4 : eclipseType === 'lunar' ? 8.0 : 5.0;
                const shadowCircle = this.createCircle(centerLon, centerLat, shadowRadius);
                eclipseFeatures.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [shadowCircle]
                    },
                    properties: {
                        name: eclipseTypeName + ' Gölgesi',
                        type: 'shadow',
                        eclipseType: eclipseType
                    }
                });
                
                // Tutulma yolu
                eclipseFeatures.push({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [sunLon, sunLat],
                            [moonLon, moonLat]
                        ]
                    },
                    properties: {
                        name: eclipseTypeName + ' Yolu',
                        type: 'path',
                        eclipticLonDiff: '0.00°',
                        eclipticLatDiff: '0.00°'
                    }
                });
            }
            
            const source = this.map.getSource('astro-eclipses');
            if (source) {
                source.setData({
                    type: 'FeatureCollection',
                    features: eclipseFeatures
                });
            }
        } catch (error) {
            Logger.error('AstroGlobe: Eclipse update error', error);
        }
    },
    
    /**
     * Daire oluştur (tutulma gölgesi için)
     */
    createCircle(centerLon, centerLat, radiusDegrees) {
        const points = [];
        const numPoints = 64;
        
        for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            // Küresel koordinatlar için basitleştirilmiş hesaplama
            const lat = centerLat + radiusDegrees * Math.sin(angle);
            const lon = centerLon + (radiusDegrees * Math.cos(angle)) / Math.cos(centerLat * Math.PI / 180);
            points.push([lon, lat]);
        }
        
        points.push(points[0]); // Kapat
        return points;
    },
    
    /**
     * Tutulma bildirimi göster/gizle (gerçek ekliptik açıları ile)
     */
    showEclipseNotification(isEclipse, eclipticLonDiff, eclipticLatDiff, eclipseType) {
        const notificationEl = document.getElementById('astro-eclipse-notification');
        const notificationText = document.getElementById('astro-eclipse-text');
        const closeBtn = document.getElementById('astro-eclipse-close');
        
        if (!notificationEl || !notificationText) return;
        
        if (isEclipse) {
            // Tutulma türü (gerçek hesaplamadan)
            const eclipseTypeName = eclipseType === 'solar' ? 'Güneş Tutulması' : 
                                   eclipseType === 'lunar' ? 'Ay Tutulması' : 
                                   'Kısmi Tutulma';
            
            notificationText.innerHTML = `
                <i class="fa-solid fa-circle-radiation mr-1"></i>
                <strong>${eclipseTypeName}</strong> tespit edildi! 
                <span class="text-purple-600">(Ekliptik: ${eclipticLonDiff.toFixed(2)}°, ${eclipticLatDiff.toFixed(2)}°)</span>
            `;
            notificationEl.classList.remove('hidden');
            notificationEl.classList.add('animate-pulse');
            
            // Kapat butonu
            if (closeBtn) {
                closeBtn.onclick = () => {
                    notificationEl.classList.add('hidden');
                };
            }
        } else {
            notificationEl.classList.add('hidden');
            notificationEl.classList.remove('animate-pulse');
        }
    },
    
    /**
     * Paneli sürüklenebilir yap
     */
    makePanelDraggable(panel) {
        if (!panel) {
            Logger.warn('AstroGlobe: Panel bulunamadı');
            return;
        }
        
        // Panel header'ı bul veya oluştur
        let header = panel.querySelector('.astro-panel-header');
        
        if (!header) {
            // İlk label'ı header yap
            const firstLabel = panel.querySelector('label');
            if (firstLabel) {
                header = firstLabel;
                header.classList.add('astro-panel-header');
            } else {
                Logger.warn('AstroGlobe: Header bulunamadı');
                return;
            }
        }
        
        
        
        let isDragging = false;
        let currentX = 0;
        let currentY = 0;
        let initialX = 0;
        let initialY = 0;
        
        // Mouse move handler
        const mouseMoveHandler = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            // Panel'i viewport içinde tut
            const maxX = window.innerWidth - panel.offsetWidth;
            const maxY = window.innerHeight - panel.offsetHeight;
            
            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));
            
            panel.style.left = currentX + 'px';
            panel.style.top = currentY + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        };
        
        // Mouse up handler
        const mouseUpHandler = () => {
            if (isDragging) {
                isDragging = false;
                panel.style.transition = '';
                header.style.cursor = 'move';
                
                // Pozisyonu localStorage'a kaydet
                try {
                    localStorage.setItem('astro-panel-position', JSON.stringify({
                        x: currentX,
                        y: currentY
                    }));
                    
                } catch (error) {
                    Logger.warn('Astro panel pozisyonu kaydedilemedi:', error);
                }
            }
            
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };
        
        // Header'a mousedown event'i ekle
        header.addEventListener('mousedown', (e) => {
            // İkonlara tıklanırsa drag başlamasın
            if (e.target.tagName === 'I' || e.target.tagName === 'INPUT' || 
                e.target.tagName === 'BUTTON' || 
                e.target.closest('input') || 
                e.target.closest('button')) {
                return;
            }
            
            
            
            isDragging = true;
            const panelRect = panel.getBoundingClientRect();
            initialX = e.clientX - panelRect.left;
            initialY = e.clientY - panelRect.top;
            currentX = panelRect.left;
            currentY = panelRect.top;
            
            panel.style.transition = 'none';
            header.style.cursor = 'grabbing';
            
            // Event listener'ları mousedown içinde ekle
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
            
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Hover efekti
        header.style.cursor = 'move';
        header.style.userSelect = 'none';
        
        // Kaydedilmiş pozisyonu yükle
        try {
            const savedPosition = localStorage.getItem('astro-panel-position');
            if (savedPosition) {
                const { x, y } = JSON.parse(savedPosition);
                if (typeof x === 'number' && typeof y === 'number' && 
                    x >= 0 && y >= 0) {
                    panel.style.left = x + 'px';
                    panel.style.top = y + 'px';
                    panel.style.right = 'auto';
                    panel.style.bottom = 'auto';
                    currentX = x;
                    currentY = y;
                    
                }
            }
        } catch (error) {
            Logger.warn('Astro panel pozisyonu yüklenemedi:', error);
        }
    }
};

// Global erişim için
window.AstroGlobe = AstroGlobe;

// Debug: Modül yüklendiğini kontrol et
/* debug removed */

