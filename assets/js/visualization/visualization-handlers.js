/**
 * Visualization Handlers Module
 * 
 * Manages visualization wizard event handlers, FAB controls, label manager,
 * map title editing, north arrow, and distance measurement tool initialization.
 * 
 * This module handles:
 * - Visualization wizard UI interactions
 * - Column selection and classification
 * - FAB (Floating Action Button) menu
 * - Label manager initialization
 * - North arrow controls
 * - Map title editing
 * - Distance measurement tool setup
 */

(function() {
    'use strict';
    
    // Güvenli Logger helper'ları (Logger.* fonksiyon değilse console fallback)
    const safeLogVH = (...args) => (window.Logger && typeof window.Logger.log === 'function') ? window.Logger.log(...args) : console.log(...args);
    const safeWarnVH = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);
    const safeErrorVH = (...args) => (window.Logger && typeof window.Logger.error === 'function') ? window.Logger.error(...args) : console.error(...args);
    
    class VisualizationHandlers {
        constructor() {
            this.visualizationManager = null;
            this.currentVizData = null;
            this.suggestedMethod = null;
            this.labelManager = null;
            this.distanceMeasurementTool = null;
            
            // Helper functions to access module methods safely
            this.showEducationalFeedback = this.createFeedbackHelper();
            this.updateMeasurementSelection = this.createMeasurementSelectionHelper();
        }
        
        /**
         * Helper function to show educational feedback
         */
        createFeedbackHelper() {
            return function(message) {
                if (window.uiComponents && typeof window.uiComponents.showEducationalFeedback === 'function') {
                    window.uiComponents.showEducationalFeedback(message);
                }
            };
        }
        
        /**
         * Helper function to update measurement selection
         */
        createMeasurementSelectionHelper() {
            return function() {
                if (window.uiStateManager && typeof window.uiStateManager.updateMeasurementSelection === 'function') {
                    window.uiStateManager.updateMeasurementSelection();
                }
            };
        }
        
        /**
         * Initialize all visualization handlers
         */
        init() {
            this.initializeApp();
            this.initializeVisualizationManager();
            this.initializeVisualizationWizard();
            this.initializeFABControls();
            this.initializeMapTitleEditing();
            this.initializeLabelManager();
            this.initializeNorthArrow();
            this.initializeFABDragging();
            this.initializeDistanceMeasurementTool();
        }
        
        /**
         * Initialize global App object
         */
        initializeApp() {
            if (typeof window.App === 'undefined') {
                window.App = {
                    visualizationManager: null,
                    dataManager: null,
                    map: window.map
                };
            }
        }
        
        /**
         * Initialize Visualization Manager - Promise-based
         */
        async initializeVisualizationManager() {
            // Wait for visualization.js to create the global instance
            if (window.visualizationManagerReady) {
                await window.visualizationManagerReady;
                this.visualizationManager = window.visualizationManager;
                window.App.visualizationManager = window.visualizationManager;
            }
        }
        
        /**
         * Initialize Visualization Wizard UI handlers
         */
        initializeVisualizationWizard() {
            const vizColumnSelect = document.getElementById('viz-column-select');
            const vizApplySuggestion = document.getElementById('viz-apply-suggestion');
            const vizClassCountSelect = document.getElementById('viz-class-count-select');
            const applyVizBtn = document.getElementById('apply-viz-btn');
            const toggleVizBtn = document.getElementById('toggle-viz');
            const vizClassificationSelect = document.getElementById('viz-classification-select');
            
            
            // Column selection change handler
            if (vizColumnSelect) {
                vizColumnSelect.addEventListener('change', () => this.handleColumnChange());
            }
            
            // Apply suggestion button
            if (vizApplySuggestion) {
                vizApplySuggestion.addEventListener('click', () => this.handleApplySuggestion());
            }
            
            // Class count change
            if (vizClassCountSelect) {
                vizClassCountSelect.addEventListener('change', () => this.handleClassCountChange());
            }
            
            // Apply visualization button
            if (applyVizBtn) {
                applyVizBtn.addEventListener('click', () => this.handleApplyVisualization());
            }
            
            // Clear visualization button
            if (toggleVizBtn) {
                toggleVizBtn.addEventListener('click', () => this.handleClearVisualization());
            }
            
            // Classification method change
            if (vizClassificationSelect) {
                this.updateClassificationInfo(vizClassificationSelect.value);
                vizClassificationSelect.addEventListener('change', (e) => {
                    this.updateClassificationInfo(e.target.value);
                });
            }
        }
        
        /**
         * Handle column selection change
         */
        handleColumnChange() {
            const vizColumnSelect = document.getElementById('viz-column-select');
            const vizSuggestionPanel = document.getElementById('viz-suggestion-panel');
            const vizSuggestionText = document.getElementById('viz-suggestion-text');
            
            const column = vizColumnSelect.value;
            if (!column || !this.currentVizData || !this.visualizationManager) {
                vizSuggestionPanel?.classList.add('hidden');
                return;
            }
            
            // Get selected column values
            const values = this.currentVizData
                .filter(r => !r._notMatched && r[column] !== null && r[column] !== undefined && !isNaN(r[column]))
                .map(r => Number(r[column]));
            
            if (values.length === 0) {
                vizSuggestionPanel?.classList.add('hidden');
                return;
            }
            
            // Calculate automatic suggestion
            const suggestion = this.visualizationManager.suggestClassificationMethod(values);
            this.suggestedMethod = suggestion.method;
            
            // Show suggestion
            if (vizSuggestionText) {
                vizSuggestionText.innerHTML = `
                    <strong>${this.getMethodLabel(suggestion.method)}</strong><br>
                    <span style="font-size: 11px;">${suggestion.reason}</span>
                `;
            }
            vizSuggestionPanel?.classList.remove('hidden');
            
            safeLogVH('💡 Önerilen yöntem:', suggestion);
        }
        
        /**
         * Handle apply suggestion button
         */
        handleApplySuggestion() {
            const vizClassificationSelect = document.getElementById('viz-classification-select');
            
            if (this.suggestedMethod && vizClassificationSelect) {
                vizClassificationSelect.value = this.suggestedMethod;
                this.updateClassificationInfo(this.suggestedMethod);
                this.showEducationalFeedback(`✅ ${this.getMethodLabel(this.suggestedMethod)} yöntemi uygulandı`);
            }
        }
        
        /**
         * Handle class count change
         */
        handleClassCountChange() {
            const vizClassCountSelect = document.getElementById('viz-class-count-select');
            const count = parseInt(vizClassCountSelect.value) || 5;
            
            if (this.visualizationManager) {
                this.visualizationManager.setClassCount(count);
                safeLogVH('🎨 Sınıf sayısı:', count);
            }
        }
        
        /**
         * Handle apply visualization button
         */
        handleApplyVisualization() {
            const vizColumnSelect = document.getElementById('viz-column-select');
            const vizTypeSelect = document.getElementById('viz-type-select');
            const vizClassificationSelect = document.getElementById('viz-classification-select');
            const vizCustomBreaksInput = document.getElementById('viz-custom-breaks');
            const vizCustomBreaksError = document.getElementById('viz-custom-breaks-error');
            const vizClassCountSelect = document.getElementById('viz-class-count-select');
            
            const column = vizColumnSelect?.value;
            const vizType = vizTypeSelect?.value || 'bubble';
            const classificationMethod = vizClassificationSelect?.value || 'quantile';
            let customBreaks = null;
            
            safeLogVH('🎨 Görselleştir butonuna tıklandı');
            
            // Validation
            if (!column) {
                alert('Lütfen bir veri sütunu seçin!');
                return;
            }
            
            if (!vizType) {
                alert('Lütfen bir görselleştirme türü seçin!');
                return;
            }
            
            if (!this.currentVizData) {
                alert('Veri yüklü değil!');
                return;
            }
            
            if (!this.visualizationManager) {
                alert('Visualization Manager başlatılmadı!');
                return;
            }
            
            // Show FAB button
            this.showFAB();
            
            // Handle custom breaks
            if (classificationMethod === 'custom') {
                const raw = (vizCustomBreaksInput?.value || '').trim();
                if (!raw) {
                    vizCustomBreaksError?.classList.remove('hidden');
                    vizCustomBreaksError.textContent = 'Lütfen en az iki sınır değeri girin.';
                    return;
                }

                const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
                customBreaks = parts.map(Number).filter(v => !isNaN(v));

                if (customBreaks.length < 2) {
                    vizCustomBreaksError?.classList.remove('hidden');
                    vizCustomBreaksError.textContent = 'En az iki geçerli sayısal değer girin.';
                    return;
                }

                if (customBreaks.length > 7) {
                    vizCustomBreaksError?.classList.remove('hidden');
                    vizCustomBreaksError.textContent = 'En fazla 7 sınır değeri girebilirsiniz.';
                    return;
                }

                customBreaks.sort((a, b) => a - b);
                vizCustomBreaksError?.classList.add('hidden');
            } else {
                vizCustomBreaksError?.classList.add('hidden');
            }

            try {
                // Apply settings
                if (this.visualizationManager) {
                    const classCount = parseInt(vizClassCountSelect?.value) || 5;
                    this.visualizationManager.setClassCount(classCount);
                    this.visualizationManager.setClassificationMethod(classificationMethod);
                    this.visualizationManager.setCustomBreaks(customBreaks);
                }
                
                const vizNames = {
                    'bubble': 'Kabarcık',
                    'dot': 'Nokta Yoğunluk',
                    'choropleth': 'Choropleth'
                };
                
                this.showEducationalFeedback(`🎨 ${vizNames[vizType]} harita oluşturuluyor...`);
                
                // Render visualization
                if (vizType === 'bubble') {
                    this.visualizationManager.renderBubbleMap(this.currentVizData, column);
                    this.showEducationalFeedback('✅ Kabarcık harita oluşturuldu!');
                } else if (vizType === 'dot') {
                    const defaultUnit = 10000;
                    const unit = prompt('Her nokta kaç birimi temsil etsin? (Varsayılan: ' + defaultUnit + ')', defaultUnit);
                    const dotsPerUnit = unit ? parseInt(unit) : defaultUnit;
                    
                    if (isNaN(dotsPerUnit) || dotsPerUnit <= 0) {
                        alert('Geçersiz değer!');
                        return;
                    }
                    
                    this.visualizationManager.renderDotDensity(this.currentVizData, column, dotsPerUnit);
                    this.showEducationalFeedback('✅ Nokta yoğunluk haritası oluşturuldu!');
                } else if (vizType === 'choropleth') {
                    this.visualizationManager.renderChoropleth(this.currentVizData, column);
                    this.showEducationalFeedback('✅ Choropleth harita oluşturuldu!');
                }
                
                // Ensure FAB is visible after visualization completes
                setTimeout(() => {
                    this.showFAB();
                }, 200);
            } catch (error) {
                safeErrorVH('Görselleştirme hatası:', error);
                alert('Görselleştirme oluşturulamadı: ' + error.message);
            }
        }
        
        /**
         * Show FAB button
         */
        showFAB() {
            const fabContainer = document.getElementById('label-fab');
            if (fabContainer) {
                localStorage.removeItem('fabPosition');
                fabContainer.style.display = 'block';
                fabContainer.style.transform = 'translate(0px, 0px)';
                fabContainer.setAttribute('data-x', '0');
                fabContainer.setAttribute('data-y', '0');
                fabContainer.style.visibility = 'visible';
                fabContainer.style.opacity = '1';
            }
        }
        
        /**
         * Handle clear visualization button
         */
        handleClearVisualization() {
            safeLogVH('🧹 handleClearVisualization çağrıldı');
            safeLogVH('visualizationManager var mı?', !!this.visualizationManager);
            safeLogVH('window.visualizationManager var mı?', !!window.visualizationManager);

            // Use window.visualizationManager if instance property is not set
            const vizManager = this.visualizationManager || window.visualizationManager;

            if (vizManager) {
                safeLogVH('✅ vizManager bulundu, clearVisualization çağrılıyor...');
                vizManager.clearVisualization();
                this.showEducationalFeedback('🧹 Görselleştirme temizlendi');

                // Ensure labelManager exists before clearing labels
                if (!window.labelManager && window.map && window.Labels) {
                    safeLogVH('🏗️ labelManager oluşturuluyor (clear için)...');
                    window.labelManager = new window.Labels(window.map);
                }

                // Clear all labels (province names and values)
                const toggleProvinceLabels = document.getElementById('toggle-province-labels');
                const toggleValueLabels = document.getElementById('toggle-value-labels');

                // Force clear province labels from map (even if checkbox is unchecked)
                if (window.labelManager && typeof window.labelManager.toggleProvinceLabels === 'function') {
                    safeLogVH('🏦 İl/İlçe etiketleri temizleniyor...');
                    window.labelManager.toggleProvinceLabels(false);
                }
                if (toggleProvinceLabels) {
                    toggleProvinceLabels.checked = false;
                }

                // Force clear value labels from map (even if checkbox is unchecked)
                if (window.labelManager && typeof window.labelManager.toggleValueLabels === 'function') {
                    safeLogVH('📊 Değer etiketleri temizleniyor...');
                    window.labelManager.toggleValueLabels(false);
                }
                if (toggleValueLabels) {
                    toggleValueLabels.checked = false;
                }

                // Clear map title
                const toggleMapTitle = document.getElementById('toggle-map-title');
                const mapTitleContainer = document.getElementById('map-title-container');
                if (mapTitleContainer) {
                    mapTitleContainer.style.display = 'none';
                    safeLogVH('📝 Harita başlığı gizlendi');
                }
                if (toggleMapTitle) {
                    toggleMapTitle.checked = false;
                }

                // Clear north arrow
                const toggleNorthArrow = document.getElementById('toggle-north-arrow');
                const northArrowContainer = document.getElementById('north-arrow-container');
                if (northArrowContainer) {
                    northArrowContainer.style.display = 'none';
                    safeLogVH('🧭 Yön oku gizlendi');
                }
                if (toggleNorthArrow) {
                    toggleNorthArrow.checked = false;
                }

                // Hide FAB button
                const fabContainer = document.getElementById('label-fab');
                if (fabContainer) {
                    fabContainer.style.display = 'none';
                    const fabMenu = document.getElementById('fab-menu');
                    if (fabMenu) {
                        fabMenu.style.display = 'none';
                    }
                }

                safeLogVH('✅ Temizleme tamamlandı');
            } else {
                safeErrorVH('❌ visualizationManager bulunamadı!');
                alert('Görselleştirme yöneticisi bulunamadı. Lütfen sayfayı yenileyin.');
            }
        }
        
        /**
         * Get method label in Turkish
         */
        getMethodLabel(method) {
            switch (method) {
                case 'equal-interval': return 'Doğrusal (eşit aralıklı)';
                case 'equal': return 'Doğrusal (eşit aralıklı)';
                case 'quantile': return 'Yüzdelik (eşit sayıda)';
                case 'rounded': return 'Yuvarlanmış değerler';
                case 'rounded-values': return 'Yuvarlanmış değerler';
                case 'natural-breaks': return 'Doğal kırılmalar (Jenks)';
                case 'jenks': return 'Doğal kırılmalar (Jenks)';
                case 'logarithmic': return 'Logaritmik';
                case 'custom': return 'Özel';
                default: return method;
            }
        }
        
        /**
         * Update classification info text
         */
        updateClassificationInfo(method) {
            const vizClassificationInfo = document.getElementById('viz-classification-info');
            const vizCustomBreaksContainer = document.getElementById('viz-custom-breaks-container');
            const vizClassCountContainer = document.getElementById('viz-class-count-container');
            
            if (!vizClassificationInfo) return;
            
            let message = '';
            switch (method) {
                case 'equal-interval':
                case 'equal':
                    message = 'Veri aralığını eşit genişlikte dilimlere böler. Düzenli dağılımlı veriler için uygundur.';
                    break;
                case 'quantile':
                    message = 'Her sınıfta eşit sayıda öğe bulunur. Dengeli dağılım ve karşılaştırma için en iyisi.';
                    break;
                case 'rounded':
                case 'rounded-values':
                    message = 'Güzel yuvarlak sayılar oluşturur (10, 20, 50, 100, 500...). Okunabilirlik için en iyi seçenek.';
                    break;
                case 'natural-breaks':
                case 'jenks':
                    message = 'Verideki doğal grupları bulur. Aykırı değerleri gösterirken eşit dağılımı koruma dengesi sağlar.';
                    break;
                case 'custom':
                    message = 'Kendi kırılma noktalarınızı belirleyin. Virgülle ayrılmış artan değerler girin (örn: 1000, 2500, 5000).';
                    if (vizCustomBreaksContainer) {
                        vizCustomBreaksContainer.classList.remove('hidden');
                    }
                    break;
                case 'logarithmic':
                    message = 'Üstel dağılımlı verideki uç değerleri dengeler. Geniş aralıklı veri setleri için kullanılır.';
                    break;
                default:
                    message = '';
            }
            
            if (message) {
                vizClassificationInfo.textContent = message;
                vizClassificationInfo.classList.remove('hidden');
            } else {
                vizClassificationInfo.textContent = '';
                vizClassificationInfo.classList.add('hidden');
            }
            
            if (vizCustomBreaksContainer) {
                vizCustomBreaksContainer.classList.toggle('hidden', method !== 'custom');
            }
            
            // Custom seçiliyken sınıf sayısı kontrolü devre dışı
            if (vizClassCountContainer) {
                vizClassCountContainer.classList.toggle('hidden', method === 'custom');
            }
        }
        
        /**
         * Initialize FAB controls
         */
        initializeFABControls() {
            const fabBtn = document.getElementById('fab-main-btn');
            const fabMenu = document.getElementById('fab-menu');
            
            window.fabWasDragged = false;
            
            if (fabBtn && fabMenu) {
                fabBtn.addEventListener('click', (e) => {
                    // Check if this was a drag operation (moved more than a small threshold)
                    if (window.fabWasDragged) {
                        e.stopPropagation();
                        e.preventDefault();
                        // Reset the flag immediately for next click
                        window.fabWasDragged = false;
                        return;
                    }
                    
                    e.stopPropagation();
                    
                    // Check if menu is currently visible
                    // Use getComputedStyle for more reliable visibility check
                    const computedDisplay = window.getComputedStyle(fabMenu).display;
                    const isVisible = computedDisplay !== 'none';
                    
                    if (isVisible) {
                        fabMenu.style.display = 'none';
                    } else {
                        const basemapPanel = document.getElementById('basemap-panel');
                        if (basemapPanel) {
                            basemapPanel.classList.add('hidden');
                        }
                        fabMenu.style.display = 'block';
                    }
                });
                
                fabMenu.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
                
                document.addEventListener('click', (e) => {
                    const fab = document.getElementById('label-fab');
                    if (fab && !fab.contains(e.target)) {
                        if (fabMenu.style.display !== 'none') {
                            fabMenu.style.display = 'none';
                        }
                    }
                });
            }
        }
        
        /**
         * Initialize map title editing and dragging
         */
        initializeMapTitleEditing() {
            const toggleMapTitle = document.getElementById('toggle-map-title');
            const mapTitle = document.getElementById('map-title');
            const mapTitleContainer = document.getElementById('map-title-container');
            
            if (!toggleMapTitle || !mapTitle || !mapTitleContainer) return;
            
            let titleInteractable = null;
            let isEditMode = false;
            
            toggleMapTitle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    mapTitleContainer.style.display = 'block';
                    if (!titleInteractable) {
                        this.initializeTitleDragging(mapTitle, () => isEditMode);
                    }
                } else {
                    mapTitleContainer.style.display = 'none';
                }
            });
            
            // Double-click to enter edit mode
            mapTitle.addEventListener('dblclick', (e) => {
                e.preventDefault();
                isEditMode = true;
                mapTitle.contentEditable = 'true';
                mapTitle.style.cursor = 'text';
                mapTitle.focus();
                
                const range = document.createRange();
                range.selectNodeContents(mapTitle);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            });
            
            mapTitle.addEventListener('blur', () => {
                isEditMode = false;
                mapTitle.contentEditable = 'false';
                mapTitle.style.cursor = 'move';
            });
            
            mapTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    mapTitle.blur();
                }
            });
        }
        
        /**
         * Initialize title dragging with interact.js
         */
        initializeTitleDragging(mapTitle, isEditModeFunc) {
            if (typeof interact === 'undefined') {
                safeWarnVH('interact.js not loaded, retrying...');
                setTimeout(() => this.initializeTitleDragging(mapTitle, isEditModeFunc), 100);
                return;
            }
            
            interact(mapTitle)
                .draggable({
                    inertia: false,
                    listeners: {
                        start(event) {
                            if (isEditModeFunc()) {
                                return false;
                            }
                            event.target.style.transition = 'none';
                            event.target.style.cursor = 'grabbing';
                        },
                        move(event) {
                            if (isEditModeFunc()) {
                                return;
                            }
                            
                            const target = event.target;
                            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                            
                            target.style.transform = `translate(${x}px, ${y}px)`;
                            target.setAttribute('data-x', x);
                            target.setAttribute('data-y', y);
                        },
                        end(event) {
                            if (!isEditModeFunc()) {
                                event.target.style.transition = 'all 0.2s ease';
                                event.target.style.cursor = 'move';
                            }
                        }
                    }
                });
            
            mapTitle.style.cursor = 'move';
            mapTitle.contentEditable = 'false';
            safeLogVH('✅ Map title dragging initialized');
        }
        
        /**
         * Initialize Label Manager event listeners
         */
        initializeLabelManager() {
            // Event listener'ları DOM element'lerine HEMEN bağla
            // Fonksiyon çağrıldığında labelManager/visualizationManager kontrolü yap

            const toggleProvinceLabels = document.getElementById('toggle-province-labels');
            const toggleValueLabels = document.getElementById('toggle-value-labels');
            const mapModeNormal = document.getElementById('map-mode-normal');
            const mapModeDataOnly = document.getElementById('map-mode-data-only');
            const fabLegendLayout = document.getElementById('fab-legend-layout');

            if (toggleProvinceLabels) {
                toggleProvinceLabels.addEventListener('change', (e) => {
                    e.stopPropagation();

                    // Lazy initialization
                    if (!window.labelManager && window.map && window.Labels) {
                        safeLogVH('🏗️ labelManager oluşturuluyor (lazy init)...');
                        window.labelManager = new window.Labels(window.map);
                    }

                    if (window.labelManager && typeof window.labelManager.toggleProvinceLabels === 'function') {
                        window.labelManager.toggleProvinceLabels(e.target.checked);
                    } else {
                        safeWarnVH('⚠️ labelManager henüz hazır değil');
                        window.showFeedback('⚠️ Harita henüz yüklenmedi', 'warning');
                    }
                });
            }

            if (toggleValueLabels) {
                toggleValueLabels.addEventListener('change', (e) => {
                    e.stopPropagation();

                    // Lazy initialization
                    if (!window.labelManager && window.map && window.Labels) {
                        safeLogVH('🏗️ labelManager oluşturuluyor (lazy init)...');
                        window.labelManager = new window.Labels(window.map);
                    }

                    if (window.labelManager && typeof window.labelManager.toggleValueLabels === 'function') {
                        window.labelManager.toggleValueLabels(e.target.checked);
                    } else {
                        safeWarnVH('⚠️ labelManager henüz hazır değil');
                        window.showFeedback('⚠️ Harita henüz yüklenmedi', 'warning');
                    }
                });
            }

            // Map mode radio buttons
            const handleMapModeChange = () => {
                safeLogVH('🗺️ Map mode değişti, radio state:', {
                    normal: mapModeNormal ? mapModeNormal.checked : 'N/A',
                    dataOnly: mapModeDataOnly ? mapModeDataOnly.checked : 'N/A'
                });

                let mode = 'normal';
                if (mapModeDataOnly && mapModeDataOnly.checked) mode = 'data-only';

                // Lazy initialization: labelManager yoksa oluştur
                if (!window.labelManager) {
                    if (window.map && window.Labels) {
                        safeLogVH('🏗️ labelManager oluşturuluyor (lazy init)...');
                        window.labelManager = new window.Labels(window.map);
                        safeLogVH('✅ labelManager oluşturuldu');
                    } else {
                        safeWarnVH('⚠️ Map veya Labels class henüz hazır değil');
                        window.showFeedback('⚠️ Harita henüz yüklenmedi', 'warning');
                        return;
                    }
                }

                if (window.labelManager && typeof window.labelManager.changeMapMode === 'function') {
                    window.labelManager.changeMapMode(mode);
                } else {
                    safeWarnVH('⚠️ labelManager.changeMapMode fonksiyonu bulunamadı');
                }
            };

            if (mapModeNormal) {
                mapModeNormal.addEventListener('change', handleMapModeChange);
            }
            if (mapModeDataOnly) {
                mapModeDataOnly.addEventListener('change', handleMapModeChange);
            }

            if (fabLegendLayout) {
                fabLegendLayout.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const layout = e.target.value;
                    if (window.visualizationManager && typeof window.visualizationManager.updateLegendLayout === 'function') {
                        window.visualizationManager.updateLegendLayout(layout);
                        if (typeof showEducationalFeedback === 'function') {
                            const layoutName = layout === 'vertical' ? 'Dikey' : 'Yatay';
                            showEducationalFeedback(`⚙️ Lejant yerleşimi: ${layoutName}`);
                        }
                    } else {
                        safeWarnVH('⚠️ visualizationManager henüz hazır değil');
                    }
                });
            }

            // Legend label mode listener
            const fabLegendLabelMode = document.getElementById('fab-legend-label-mode');
            if (fabLegendLabelMode) {
                fabLegendLabelMode.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const mode = e.target.value;
                    if (window.visualizationManager && typeof window.visualizationManager.updateLegendLabelMode === 'function') {
                        window.visualizationManager.updateLegendLabelMode(mode);
                        if (typeof showEducationalFeedback === 'function') {
                            const modeName = mode === 'ranges' ? 'Cetvel aralıkları' : 'Etiketler';
                            showEducationalFeedback(`⚙️ Lejant etiketleri: ${modeName}`);
                        }
                    } else {
                        safeWarnVH('⚠️ visualizationManager henüz hazır değil');
                    }
                });
            }

            // Number format listener
            const fabNumberFormat = document.getElementById('fab-number-format');
            if (fabNumberFormat) {
                fabNumberFormat.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const format = e.target.value;
                    if (window.visualizationManager && typeof window.visualizationManager.setNumberFormatMode === 'function') {
                        window.visualizationManager.setNumberFormatMode(format);
                        if (typeof showEducationalFeedback === 'function') {
                            const formatNames = {
                                'auto': 'Otomatik (1K, 1M)',
                                'full': 'Tam Sayı (1.234.567)',
                                'compact': 'Kompakt (1,2Mn)'
                            };
                            showEducationalFeedback(`🔢 Sayı formatı: ${formatNames[format]}`);
                        }
                    } else {
                        safeWarnVH('⚠️ visualizationManager henüz hazır değil');
                    }
                });
            }

            safeLogVH('✅ FAB event listener\'ları bağlandı');
        }
        
        /**
         * Initialize North Arrow
         */
        initializeNorthArrow() {
            const init = () => {
                const toggleNorthArrow = document.getElementById('toggle-north-arrow');
                const northArrowContainer = document.getElementById('north-arrow-container');

                if (!toggleNorthArrow || !northArrowContainer) {
                    safeWarnVH('North arrow elements not found');
                    return;
                }

                toggleNorthArrow.addEventListener('change', function() {
                        if (this.checked) {
                            northArrowContainer.style.display = 'block';
                            safeLogVH('🧭 Kuzey oku gösterildi');
                        } else {
                            northArrowContainer.style.display = 'none';
                            safeLogVH('🧭 Kuzey oku gizlendi');
                        }
                });

                if (typeof interact !== 'undefined') {
                    try {
                        const savedPosition = localStorage.getItem('northArrowPosition');
                        if (savedPosition) {
                            const { x, y } = JSON.parse(savedPosition);
                            northArrowContainer.style.transform = `translate(${x}px, ${y}px)`;
                            northArrowContainer.setAttribute('data-x', x);
                            northArrowContainer.setAttribute('data-y', y);
                        }
                    } catch (error) {
                        safeWarnVH('Could not restore north arrow position:', error);
                    }

                    interact(northArrowContainer)
                        .draggable({
                            inertia: false,
                            modifiers: [
                                interact.modifiers.restrictRect({
                                    restriction: 'parent',
                                    endOnly: true
                                })
                            ],
                            listeners: {
                                move(event) {
                                    const target = event.target;
                                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                                    target.style.transform = `translate(${x}px, ${y}px)`;
                                    target.setAttribute('data-x', x);
                                    target.setAttribute('data-y', y);
                                },
                                end(event) {
                                    try {
                                        const x = parseFloat(event.target.getAttribute('data-x')) || 0;
                                        const y = parseFloat(event.target.getAttribute('data-y')) || 0;
                                        localStorage.setItem('northArrowPosition', JSON.stringify({ x, y }));
                                    } catch (error) {
                                        safeWarnVH('Could not save north arrow position:', error);
                                    }
                                }
                            }
                        });

                } else {
                    safeWarnVH('interact.js not loaded, north arrow will not be draggable');
                    setTimeout(init, 200);
                }
            };
            
            setTimeout(init, 700);
        }
        
        /**
         * Initialize FAB button dragging
         */
        initializeFABDragging() {
            const init = () => {
                if (typeof interact === 'undefined') {
                    safeWarnVH('interact.js not loaded for FAB, retrying...');
                    setTimeout(init, 100);
                    return;
                }
                
                const fabContainer = document.getElementById('label-fab');
                if (!fabContainer) {
                    safeWarnVH('FAB container not found, retrying...');
                    setTimeout(init, 100);
                    return;
                }
                
                try {
                    const savedPosition = localStorage.getItem('fabPosition');
                    if (savedPosition) {
                        const { x, y } = JSON.parse(savedPosition);
                        fabContainer.style.transform = `translate(${x}px, ${y}px)`;
                        fabContainer.setAttribute('data-x', x);
                        fabContainer.setAttribute('data-y', y);
                    }
                } catch (error) {
                    safeWarnVH('Could not restore FAB position:', error);
                }
                
                interact(fabContainer)
                    .draggable({
                        inertia: false,
                        listeners: {
                            start(event) {
                                window.fabWasDragged = false;
                                window.fabDragStartX = event.clientX;
                                window.fabDragStartY = event.clientY;
                            },
                            move(event) {
                                // Only consider it a drag if moved more than 5 pixels
                                const deltaX = Math.abs(event.clientX - window.fabDragStartX);
                                const deltaY = Math.abs(event.clientY - window.fabDragStartY);
                                
                                if (deltaX > 5 || deltaY > 5) {
                                    window.fabWasDragged = true;
                                }
                                
                                const target = event.target;
                                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                                
                                target.style.transform = `translate(${x}px, ${y}px)`;
                                target.setAttribute('data-x', x);
                                target.setAttribute('data-y', y);
                            },
                            end(event) {
                                try {
                                    const x = parseFloat(event.target.getAttribute('data-x')) || 0;
                                    const y = parseFloat(event.target.getAttribute('data-y')) || 0;
                                    localStorage.setItem('fabPosition', JSON.stringify({ x, y }));
                                } catch (error) {
                                    safeWarnVH('Could not save FAB position:', error);
                                }
                                
                                // Reset the drag flag after a short delay to prevent click
                                // But the click handler will reset it immediately if triggered
                                setTimeout(() => {
                                    window.fabWasDragged = false;
                                }, 200);
                            }
                        }
                        });
            };
            
            setTimeout(init, 600);
        }
        
        /**
         * Initialize Distance Measurement Tool
         */
        initializeDistanceMeasurementTool() {
            if (typeof DistanceMeasurement !== 'undefined') {
                this.distanceMeasurementTool = new DistanceMeasurement(window.map, this.updateMeasurementSelection);
            } else {
                safeErrorVH('❌ DistanceMeasurement sınıfı yüklenmedi!');
            }
        }
    }
    
    // Create and expose instance globally
    const visualizationHandlers = new VisualizationHandlers();
    window.visualizationHandlers = visualizationHandlers;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            visualizationHandlers.init();
        });
    } else {
        // DOM already loaded
        visualizationHandlers.init();
    }
    
})();
