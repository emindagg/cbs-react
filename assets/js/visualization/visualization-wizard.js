/**
 * OGM Web CBS Platform
 * Visualization Wizard Controller
 * Çok adımlı veri görselleştirme sihirbazı
 */

// Note: showFeedback is now available globally from utils-core.js

// Güvenli Logger helper'ları (Logger.* fonksiyon değilse console fallback)
const safeLogWiz = (...args) => (window.Logger && typeof window.Logger.log === 'function') ? window.Logger.log(...args) : console.log(...args);
const safeWarnWiz = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorWiz = (...args) => (window.Logger && typeof window.Logger.error === 'function') ? window.Logger.error(...args) : console.error(...args);

class VisualizationWizard {
    constructor() {
        this.currentStep = 1;
        this.mapper = new ColumnMapper();
        this.matchResults = null;
        
        this.init();
    }
    
    init() {
        // Dosya yükleme
        document.getElementById('data-file-input').addEventListener('change', (e) => {
            // Custom file input label güncelle
            const fileNameSpan = document.querySelector('.custom-file-name');
            if (fileNameSpan && e.target.files[0]) {
                fileNameSpan.textContent = e.target.files[0].name;
            } else if (fileNameSpan) {
                fileNameSpan.textContent = 'Dosya seçilmedi';
            }
            
            this.handleFileUpload(e.target.files[0]);
        });
        
        // Konum tipi değişimi
        document.querySelectorAll('input[name="location-level"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleLocationLevelChange(e.target.value);
            });
        });
        
        // Navigation butonları
        document.getElementById('step-2-back').addEventListener('click', () => this.goToStep(1));
        document.getElementById('step-2-next').addEventListener('click', () => this.matchData());
        document.getElementById('step-3-back').addEventListener('click', () => this.goToStep(2));
        document.getElementById('step-3-next').addEventListener('click', () => this.visualize());
        document.getElementById('apply-viz-btn').addEventListener('click', () => this.visualize());
        
        // Görselleştirme ayarları
        this.initVisualizationSettings();
    }
    
    /**
     * Görselleştirme ayarlarını başlat
     */
    initVisualizationSettings() {
        const vizTypeSelect = document.getElementById('viz-type-select');
        const vizClassCountSelect = document.getElementById('viz-class-count-select');
        const vizClassificationSelect = document.getElementById('viz-classification-select');
        const vizColorSchemeSelect = document.getElementById('viz-color-scheme-select');
        const vizLegendTypeSelect = document.getElementById('viz-legend-type-select');
        const vizCustomBreaks = document.getElementById('viz-custom-breaks');
        const vizApplySuggestion = document.getElementById('viz-apply-suggestion');
        
        // Renk paletleri
        this.colorSchemes = {
            'viridis': ['#440154', '#472777', '#3b528b', '#2c728e', '#21918c', '#27ad81', '#5ec962', '#aadc32', '#fde725'],
            'topographic': ['#4a6741', '#7b9971', '#b4c8a8', '#e8f1e1', '#f6e8c3', '#dfc27d', '#bf812d', '#8c510a', '#543005'],
            'diverging_orange_blue': ['#c66b20', '#dd8a4b', '#eeaa7b', '#f4c9a8', '#dcdcdc', '#90b9d7', '#5393c3', '#2a6ba1', '#11415c'],
            'greens': ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
            'reds': ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
            'blues': ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
            'oranges': ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
            'purples': ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d']
        };
        
        // Görselleştirme türü değiştiğinde
        if (vizTypeSelect) {
            vizTypeSelect.addEventListener('change', (e) => {
                this.handleVizTypeChange(e.target.value);
            });
        }
        
        // Sınıf sayısı değiştiğinde
        if (vizClassCountSelect) {
            vizClassCountSelect.addEventListener('change', (e) => {
            });
        }
        
        // Sınıflandırma yöntemi değiştiğinde
        if (vizClassificationSelect) {
            vizClassificationSelect.addEventListener('change', (e) => {
                this.handleClassificationChange(e.target.value);
            });
        }
        
        // Renk skalası değiştiğinde
        if (vizColorSchemeSelect) {
            vizColorSchemeSelect.addEventListener('change', (e) => {
                this.handleColorSchemeChange(e.target.value);
            });
        }
        
        // Lejant türü değiştiğinde
        if (vizLegendTypeSelect) {
            vizLegendTypeSelect.addEventListener('change', (e) => {
                this.handleLegendTypeChange(e.target.value);
            });
        }
        
        // Önerilen yöntemi uygula
        if (vizApplySuggestion) {
            vizApplySuggestion.addEventListener('click', () => {
                const suggestedMethod = vizApplySuggestion.dataset.method;
                if (suggestedMethod && vizClassificationSelect) {
                    vizClassificationSelect.value = suggestedMethod;
                    this.handleClassificationChange(suggestedMethod);
                    
                    // Başarı mesajı
                    const methodNames = {
                        'quantile': 'Yüzdelik (eşit sayıda)',
                        'equal': 'Doğrusal (eşit aralıklı)',
                        'rounded': 'Yuvarlanmış değerler',
                        'jenks': 'Doğal kırılmalar (Jenks)',
                        'logarithmic': 'Logaritmik',
                        'custom': 'Özel'
                    };
                    const methodName = methodNames[suggestedMethod] || suggestedMethod;
                    showFeedback(`✅ ${methodName} yöntemi uygulandı`);
                    
                    // Paneli gizle
                    const panel = document.getElementById('viz-suggestion-panel');
                    if (panel) {
                        panel.classList.add('hidden');
                    }
                }
            });
        }
        
        // İlk yüklemede varsayılan renk önizlemesini göster
        if (vizColorSchemeSelect) {
            this.handleColorSchemeChange(vizColorSchemeSelect.value || 'viridis');
        }
        
        // Bubble method değişikliği
        const bubbleMethodSelect = document.getElementById('viz-bubble-method');
        if (bubbleMethodSelect) {
            bubbleMethodSelect.addEventListener('change', (e) => {
                const method = e.target.value;
                const classCountContainer = document.getElementById('viz-bubble-class-count-container');
                const classificationContainer = document.getElementById('viz-bubble-classification-container');
                const methodInfo = document.getElementById('viz-bubble-method-info');
                
                if (method === 'graduated') {
                    classCountContainer?.classList.remove('hidden');
                    classificationContainer?.classList.remove('hidden');
                    if (methodInfo) {
                        methodInfo.textContent = 'ℹ️ Değerler sınıflara ayrılır, daha okunabilir';
                    }
                } else {
                    classCountContainer?.classList.add('hidden');
                    classificationContainer?.classList.add('hidden');
                    if (methodInfo) {
                        methodInfo.textContent = 'ℹ️ Her değer kendi boyutuna sahip';
                    }
                }
                
                // Eğer harita zaten varsa güncelle
                if (window.visualizationManager?.currentVisualization?.type === 'bubble') {
                    const wizard = window.visualizationWizard;
                    if (wizard && wizard.mappedData) {
                        window.visualizationManager.showVisualization(
                            'bubble',
                            wizard.mappedData,
                            wizard.getVisualizationSettings()
                        );
                    }
                }
            });
        }
        
        // Bubble color picker anlık değişim
        const bubbleColorInput = document.getElementById('viz-bubble-color');
        if (bubbleColorInput) {
            bubbleColorInput.addEventListener('input', (e) => {
                // Eğer harita zaten varsa anlık güncelle
                if (window.visualizationManager?.currentVisualization?.type === 'bubble') {
                    const wizard = window.visualizationWizard;
                    if (wizard && wizard.mappedData) {
                        window.visualizationManager.showVisualization(
                            'bubble',
                            wizard.mappedData,
                            wizard.getVisualizationSettings()
                        );
                    }
                }
            });
        }
        
        // Bubble size slider güncelle
        const bubbleSizeSlider = document.getElementById('viz-bubble-size');
        const bubbleSizeValue = document.getElementById('viz-bubble-size-value');
        if (bubbleSizeSlider && bubbleSizeValue) {
            bubbleSizeSlider.addEventListener('input', (e) => {
                bubbleSizeValue.textContent = parseFloat(e.target.value).toFixed(1) + 'x';
                
                // Eğer harita zaten varsa anlık güncelle
                if (window.visualizationManager?.currentVisualization?.type === 'bubble') {
                    const wizard = window.visualizationWizard;
                    if (wizard && wizard.mappedData) {
                        window.visualizationManager.showVisualization(
                            'bubble',
                            wizard.mappedData,
                            wizard.getVisualizationSettings()
                        );
                    }
                }
            });
        }
    }
    
    /**
     * Görselleştirme türü değişimini işle
     */
    handleVizTypeChange(vizType) {
        const classCountContainer = document.getElementById('viz-class-count-container');
        const classificationContainer = document.getElementById('viz-classification-container');
        const colorSchemeContainer = document.getElementById('viz-color-scheme-container');
        const legendTypeContainer = document.getElementById('viz-legend-type-container');
        const bubbleControls = document.getElementById('viz-bubble-controls');
        const suggestionPanel = document.getElementById('viz-suggestion-panel');
        
        // Sadece choropleth için sınıf/sınıflandırma/renk/lejant ayarlarını göster
        if (vizType === 'choropleth') {
            classCountContainer?.classList.remove('hidden');
            classificationContainer?.classList.remove('hidden');
            colorSchemeContainer?.classList.remove('hidden');
            legendTypeContainer?.classList.remove('hidden');
            bubbleControls?.classList.add('hidden');
            // Choropleth için öneri panelini göster (eğer varsa)
            // suggestionPanel kontrolü suggestVisualizationMethod içinde yapılıyor
        } else if (vizType === 'bubble') {
            classCountContainer?.classList.add('hidden');
            classificationContainer?.classList.add('hidden');
            colorSchemeContainer?.classList.add('hidden');
            legendTypeContainer?.classList.add('hidden');
            bubbleControls?.classList.remove('hidden');
            // Bubble ve dot density için öneri panelini gizle (sınıflandırma yöntemi yok)
            suggestionPanel?.classList.add('hidden');
        } else {
            // Dot density için
            classCountContainer?.classList.add('hidden');
            classificationContainer?.classList.add('hidden');
            colorSchemeContainer?.classList.add('hidden');
            legendTypeContainer?.classList.add('hidden');
            bubbleControls?.classList.add('hidden');
            // Bubble ve dot density için öneri panelini gizle (sınıflandırma yöntemi yok)
            suggestionPanel?.classList.add('hidden');
        }
    }
    
    /**
     * Renk skalası değişimini işle
     */
    handleColorSchemeChange(scheme) {
        const colorPreview = document.getElementById('viz-color-preview');
        
        if (!colorPreview || !this.colorSchemes[scheme]) {
            return;
        }
        
        const colors = this.colorSchemes[scheme];
        const gradient = `linear-gradient(to right, ${colors.join(', ')})`;
        colorPreview.style.background = gradient;
    }
    
    /**
     * Lejant türü değişimini işle
     */
    handleLegendTypeChange(type) {
        const legendTypeInfo = document.getElementById('viz-legend-type-info');
        
        // Bilgi metnini güncelle
        const infoTexts = {
            'discrete': '<strong>Ayrık:</strong> Her sınıf ayrı renk kutusu ile gösterilir. En yaygın kullanım.',
            'continuous': '<strong>Sürekli:</strong> Renkler arasında kesintisiz geçiş (gradient). Büyük veri setleri için ideal.',
            'quantized': '<strong>Kuantize:</strong> Sürekli gradient üzerinde belirli aralıklar işaretlenir.',
            'diverging': '<strong>İki Uçlu:</strong> Merkez değerden iki yöne doğru farklı renkler. Artı/eksi değerler için.',
            'categorical': '<strong>Kategorik:</strong> Her kategori farklı renk. Nominal (isimsel) veriler için.'
        };
        
        if (legendTypeInfo && infoTexts[type]) {
            legendTypeInfo.innerHTML = infoTexts[type];
        }
    }
    
    /**
     * Sınıflandırma yöntemi değişimini işle
     */
    handleClassificationChange(method) {
        const customBreaksContainer = document.getElementById('viz-custom-breaks-container');
        const classificationInfo = document.getElementById('viz-classification-info');
        
        // Özel kırılma değerlerini göster/gizle
        if (method === 'custom') {
            customBreaksContainer?.classList.remove('hidden');
        } else {
            customBreaksContainer?.classList.add('hidden');
        }
        
        // Bilgi metnini güncelle
        const infoTexts = {
            'quantile': '<strong>Yüzdelik (eşit sayıda):</strong> Her sınıfta eşit sayıda öğe bulunur. Dengeli dağılım için en iyisi.',
            'equal': '<strong>Doğrusal (eşit aralıklı):</strong> Aralığı eşit genişlikte dilimlere böler. Düzenli dağılımlı veriler için uygundur.',
            'equal-interval': '<strong>Doğrusal (eşit aralıklı):</strong> Aralığı eşit genişlikte dilimlere böler. Düzenli dağılımlı veriler için uygundur.',
            'rounded': '<strong>Yuvarlanmış değerler:</strong> Güzel yuvarlak sayılar oluşturur (10, 20, 50, 100...). Okunabilirlik için en iyi seçenek.',
            'rounded-values': '<strong>Yuvarlanmış değerler:</strong> Güzel yuvarlak sayılar oluşturur (10, 20, 50, 100...). Okunabilirlik için en iyi seçenek.',
            'jenks': '<strong>Doğal kırılmalar (Jenks):</strong> Verideki doğal grupları bulur. Aykırı değerler ve eşit dağılımı dengeler.',
            'natural-breaks': '<strong>Doğal kırılmalar (Jenks):</strong> Verideki doğal grupları bulur. Aykırı değerler ve eşit dağılımı dengeler.',
            'logarithmic': '<strong>Logaritmik:</strong> Üstel dağılımlı veriler için. Büyük farkları dengeler.',
            'custom': '<strong>Özel:</strong> Kendi kırılma noktalarınızı belirleyin.'
        };
        
        if (classificationInfo && infoTexts[method]) {
            classificationInfo.innerHTML = infoTexts[method];
        }
    }
    
    /**
     * Dosya yükleme
     */
    async handleFileUpload(file) {
        if (!file) return;
        
        try {
            showFeedback('📁 Dosya yüklenmiş...');
            
            const result = await this.mapper.loadFile(file);
            
            // Dosya bilgilerini göster
            document.getElementById('file-name-display').textContent = file.name;
            document.getElementById('file-info-display').textContent = 
                `${result.rowCount} satır, ${result.columns.length} sütun`;
            document.getElementById('file-loaded-message').classList.remove('hidden');
            
            // Otomatik sütun tespiti
            const suggestions = this.mapper.detectColumns();
            
            // Sütun dropdownlarını doldur
            this.populateColumnDropdowns(result.columns, suggestions);
            
            // Adım 2'ye geç
            this.goToStep(2);
            
            showFeedback('✅ Dosya başarıyla yüklendi!');
            
        } catch (error) {
            safeErrorWiz('Dosya yükleme hatası:', error);
            alert('Dosya yüklenemedi: ' + error.message);
        }
    }
    
    /**
     * Sütun dropdownlarını doldur
     */
    populateColumnDropdowns(columns, suggestions) {
        const provinceSelect = document.getElementById('province-column-select');
        const districtSelect = document.getElementById('district-column-select');
        const dataSelect = document.getElementById('data-column-select');
        
        // İl dropdown'unu doldur
        provinceSelect.innerHTML = '<option value="">İl sütünu seçin...</option>';
        columns.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            provinceSelect.appendChild(option);
        });
        
        // İlçe dropdown'unu doldur
        districtSelect.innerHTML = '<option value="">İlçe sütünu seçin...</option>';
        columns.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            districtSelect.appendChild(option);
        });
        
        // Sadece sayısal sütunları veri dropdown'una ekle
        const numericColumns = this.mapper.detectNumericColumns();
        dataSelect.innerHTML = '<option value="">Veri sütunu seçin...</option>';
        numericColumns.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            dataSelect.appendChild(option);
        });
        
        // Otomatik önerileri uygula
        if (suggestions) {
            // İl sütunu önerisi
            if (suggestions.locationColumn) {
                provinceSelect.value = suggestions.locationColumn;
            }
            
            // İlçe sütunu önerisi (sadece varsa)
            if (suggestions.districtColumn) {
                districtSelect.value = suggestions.districtColumn;
            }
            
            // Veri sütunu önerisi
            if (suggestions.dataColumn) {
                dataSelect.value = suggestions.dataColumn;
            }
            
            // Konum seviyesi radio butonunu ayarla
            if (suggestions.locationLevel) {
                const radio = document.querySelector(`input[name="location-level"][value="${suggestions.locationLevel}"]`);
                if (radio) {
                    radio.checked = true;
                    this.handleLocationLevelChange(suggestions.locationLevel);
                }
            }
        }
        
        // Önizleme göster
        this.showPreview();
    }
    
    /**
     * Konum tipi değişimi
     */
    handleLocationLevelChange(level) {
        const provinceContainer = document.getElementById('province-column-container');
        const districtContainer = document.getElementById('district-column-container');
        
        if (level === 'province') {
            // Sadece il
            provinceContainer.classList.remove('hidden');
            districtContainer.classList.add('hidden');
        } else if (level === 'district') {
            // Sadece ilçe
            provinceContainer.classList.add('hidden');
            districtContainer.classList.remove('hidden');
        } else if (level === 'mixed') {
            // Karışık
            provinceContainer.classList.remove('hidden');
            districtContainer.classList.remove('hidden');
        }
    }
    
    /**
     * Önizleme göster
     */
    showPreview() {
        if (!this.mapper.rawData || this.mapper.rawData.length === 0) return;
        
        const preview = this.mapper.rawData.slice(0, 3);
        const previewContent = document.getElementById('column-preview-content');
        
        const html = preview.map((row, i) => {
            const cols = Object.entries(row).slice(0, 3);
            return `<div class="mb-1"><strong>Satır ${i + 1}:</strong> ${
                cols.map(([k, v]) => `${k}: ${v}`).join(', ')
            }...</div>`;
        }).join('');
        
        previewContent.innerHTML = html;
        document.getElementById('column-preview').classList.remove('hidden');
    }
    
    /**
     * Veriyi eşleştir
     */
    async matchData() {
        try {
            // Sütün seçimlerini al
            const locationLevel = document.querySelector('input[name="location-level"]:checked').value;
            const provinceColumn = document.getElementById('province-column-select').value;
            const districtColumn = document.getElementById('district-column-select').value;
            const dataColumn = document.getElementById('data-column-select').value;
            
            // Validasyon
            if (!dataColumn) {
                alert('Lütfen veri sütunu seçin!');
                return;
            }
            
            if (locationLevel === 'province' && !provinceColumn) {
                alert('Lütfen il sütunu seçin!');
                return;
            }
            
            if (locationLevel === 'district' && !districtColumn) {
                alert('Lütfen ilçe sütunu seçin!');
                return;
            }
            
            if (locationLevel === 'mixed' && !provinceColumn) {
                alert('Lütfen il sütunu seçin!');
                return;
            }
            
            showFeedback('🔄 Veri eşleştiriliyor...');
            
            // İlçe seviyesi veri varsa, GeoJSON'ları yükle
            if (locationLevel === 'district' || locationLevel === 'mixed') {
                showFeedback('📡 İlçe haritası yükleniyor...');

                // Visualization manager'dan ilçe GeoJSON'unu yükle
                // Çoklu kaynak desteği: App, window, ServiceLocator
                const vizManager = (window.App && window.App.visualizationManager) ||
                                  window.visualizationManager ||
                                  (window.ServiceLocator?.get && window.ServiceLocator.get('visualizationManager'));

                if (vizManager && typeof vizManager.loadDistrictsGeoJSON === 'function') {
                    try {
                        await vizManager.loadDistrictsGeoJSON();
                    } catch (error) {
                        safeErrorWiz('❌ İlçe GeoJSON yükleme hatası:', error);
                        alert('İlçe haritası yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
                        return;
                    }
                } else {
                    safeErrorWiz('❌ Visualization Manager bulunamadı');
                    alert('Sistem hatası: Harita yöneticisi başlatılamadı.');
                    return;
                }
            }
            
            // Sütun eşleştirmesini ayarla
            this.mapper.setColumnMapping({
                locationColumn: provinceColumn || districtColumn,
                districtColumn: districtColumn,
                dataColumn: dataColumn,
                locationLevel: locationLevel
            });
            
            // Eşleştir
            this.matchResults = await this.mapper.matchData();
            
            // Sonuçları göster
            this.displayMatchResults();
            
            // Veri analizi yap ve sınıflandırma önerisi göster
            this.suggestVisualizationMethod();
            
            // Adım 3'e geç
            this.goToStep(3);
            
            showFeedback('✅ Eşleştirme tamamlandı!');
            
        } catch (error) {
            safeErrorWiz('Eşleştirme hatası:', error);
            alert('Eşleştirme başarısız: ' + error.message);
        }
    }
    
    /**
     * Eşleştirme sonuçlarını göster
     */
    displayMatchResults() {
        const summary = this.mapper.getSummary();
        
        // Özet
        document.getElementById('match-successful-count').textContent = summary.successful;
        document.getElementById('match-ambiguous-count').textContent = summary.ambiguous;
        document.getElementById('match-failed-count').textContent = summary.failed;
        
        // Belirsiz eşleşmeler
        if (this.matchResults.ambiguous.length > 0) {
            document.getElementById('ambiguous-matches-container').classList.remove('hidden');
            this.displayAmbiguousMatches();
        } else {
            document.getElementById('ambiguous-matches-container').classList.add('hidden');
        }
        
        // Detaylı önizleme butonunu etkinleştir
        const previewBtn = document.getElementById('show-match-preview-btn');
        if (previewBtn) {
            previewBtn.disabled = false;
            previewBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
    
    /**
     * Belirsiz eşleşmeleri göster
     */
    displayAmbiguousMatches() {
        const container = document.getElementById('ambiguous-matches-list');
        container.innerHTML = '';
        
        // Aynı isimli belirsiz eşleşmeleri grupla
        const groupedAmbiguous = {};
        this.matchResults.ambiguous.forEach(result => {
            const locationName = result.originalData[this.mapper.columnMapping.locationColumn] || 
                                 result.originalData[this.mapper.columnMapping.districtColumn];
            if (!groupedAmbiguous[locationName]) {
                groupedAmbiguous[locationName] = [];
            }
            groupedAmbiguous[locationName].push(result);
        });
        
        // Her grup için kart oluştur
        Object.keys(groupedAmbiguous).forEach(locationName => {
            const results = groupedAmbiguous[locationName];
            const firstResult = results[0];
            const div = document.createElement('div');
            div.className = 'p-3 bg-amber-50 border border-amber-200 rounded-lg mb-2';
            
            div.innerHTML = `
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <div class="text-xs font-semibold text-amber-900">"${locationName}"</div>
                        <div class="text-[10px] text-amber-700">${results.length} satır, ${firstResult.ambiguousOptions.length} seçenek</div>
                    </div>
                    ${results.length > 1 ? '<span class="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">Toplu</span>' : ''}
                </div>
                <select class="w-full text-xs border border-amber-300 rounded px-2 py-1 bg-white mb-2 bulk-ambiguous-select" data-location-name="${locationName}">
                    <option value="">Seçin...</option>
                    ${firstResult.ambiguousOptions.map(opt => 
                        `<option value="${JSON.stringify(opt).replace(/"/g, '&quot;')}">${opt.province} / ${opt.name}</option>`
                    ).join('')}
                </select>
                ${results.length > 1 ? 
                    `<div class="text-[10px] text-amber-700">
                        <i class="fa-solid fa-info-circle mr-1"></i>
                        Seçim tüm "${locationName}" satırlarına uygulanacak
                    </div>` : ''}
            `;
            
            container.appendChild(div);
        });
        
        // Toplu seçim değişikliklerini dinle
        document.querySelectorAll('.bulk-ambiguous-select').forEach(select => {
            select.addEventListener('change', (e) => {
                if (e.target.value) {
                    const locationName = e.target.dataset.locationName;
                    const selectedOption = JSON.parse(e.target.value.replace(/&quot;/g, '"'));
                    
                    // Toplu çöz
                    const resolved = this.mapper.resolveBulkAmbiguity(locationName, selectedOption);
                    
                    // UI'yi yenile
                    this.displayMatchResults();
                    
                    showFeedback(`✅ "${locationName}" için ${resolved} eşleşme çözüldü!`);
                }
            });
        });
    }
    
    /**
     * Detaylı eşleşme önizlemesi göster
     */
    showMatchPreview() {
        const allResults = [
            ...this.matchResults.successful,
            ...this.matchResults.ambiguous,
            ...this.matchResults.failed
        ].sort((a, b) => a.rowIndex - b.rowIndex);
        
        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" id="match-preview-modal">
                <div class="bg-white rounded-lg shadow-2xl w-11/12 h-5/6 flex flex-col">
                    <!-- Başlık -->
                    <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">Eşleşme Önizlemesi</h3>
                            <p class="text-xs text-gray-600 mt-1">Tüm satırların eşleşme durumu</p>
                        </div>
                        <button onclick="document.getElementById('match-preview-modal').remove()" 
                                class="text-gray-500 hover:text-gray-700">
                            <i class="fa-solid fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <!-- Filtreler -->
                    <div class="p-3 border-b border-gray-200 bg-gray-50">
                        <div class="flex gap-2">
                            <button class="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200" 
                                    onclick="window.wizardInstance.filterMatchPreview('all')">
                                Tümü (${allResults.length})
                            </button>
                            <button class="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 hover:bg-green-200" 
                                    onclick="window.wizardInstance.filterMatchPreview('successful')">
                                <i class="fa-solid fa-check mr-1"></i>Başarılı (${this.matchResults.successful.length})
                            </button>
                            <button class="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200" 
                                    onclick="window.wizardInstance.filterMatchPreview('ambiguous')">
                                <i class="fa-solid fa-question mr-1"></i>Belirsiz (${this.matchResults.ambiguous.length})
                            </button>
                            <button class="px-3 py-1 text-xs rounded-full bg-red-100 text-red-800 hover:bg-red-200" 
                                    onclick="window.wizardInstance.filterMatchPreview('failed')">
                                <i class="fa-solid fa-times mr-1"></i>Hatalı (${this.matchResults.failed.length})
                            </button>
                        </div>
                    </div>
                    
                    <!-- Tablo -->
                    <div class="flex-1 overflow-auto p-4">
                        <table class="w-full text-xs border-collapse">
                            <thead class="sticky top-0 bg-gray-100 border-b-2 border-gray-300">
                                <tr>
                                    <th class="px-2 py-2 text-left font-semibold text-gray-700">#</th>
                                    <th class="px-2 py-2 text-left font-semibold text-gray-700">Durum</th>
                                    <th class="px-2 py-2 text-left font-semibold text-gray-700">Konum</th>
                                    <th class="px-2 py-2 text-left font-semibold text-gray-700">İl</th>
                                    <th class="px-2 py-2 text-left font-semibold text-gray-700">İlçe</th>
                                    <th class="px-2 py-2 text-left font-semibold text-gray-700">Veri</th>
                                    <th class="px-2 py-2 text-left font-semibold text-gray-700">Mesaj</th>
                                </tr>
                            </thead>
                            <tbody id="match-preview-tbody">
                                ${this.generatePreviewRows(allResults, 'all')}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Alt butonlar -->
                    <div class="p-4 border-t border-gray-200 flex justify-end gap-2">
                        <button onclick="window.wizardInstance.exportMatchResults()" 
                                class="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                            <i class="fa-solid fa-download mr-2"></i>Dışa Aktar (CSV)
                        </button>
                        <button onclick="document.getElementById('match-preview-modal').remove()" 
                                class="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                            Kapat
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    /**
     * Önizleme satırlarını oluştur
     */
    generatePreviewRows(results, filter) {
        let filtered = results;
        
        if (filter === 'successful') {
            filtered = results.filter(r => r.matched && !r.ambiguous);
        } else if (filter === 'ambiguous') {
            filtered = results.filter(r => r.ambiguous);
        } else if (filter === 'failed') {
            filtered = results.filter(r => !r.matched && !r.ambiguous);
        }
        
        return filtered.map(result => {
            let statusHtml, statusClass;
            
            if (result.matched && !result.ambiguous) {
                statusHtml = '<i class="fa-solid fa-check text-green-600"></i>';
                statusClass = 'bg-green-50';
            } else if (result.ambiguous) {
                statusHtml = '<i class="fa-solid fa-question text-amber-600"></i>';
                statusClass = 'bg-amber-50';
            } else {
                statusHtml = '<i class="fa-solid fa-times text-red-600"></i>';
                statusClass = 'bg-red-50';
            }
            
            const locationName = result.originalData[this.mapper.columnMapping.locationColumn] || 
                                 result.originalData[this.mapper.columnMapping.districtColumn] || '-';
            const dataValue = result.originalData[this.mapper.columnMapping.dataColumn] || '-';
            
            return `
                <tr class="${statusClass} border-b border-gray-200 hover:bg-opacity-70 match-preview-row" data-status="${result.matched && !result.ambiguous ? 'successful' : result.ambiguous ? 'ambiguous' : 'failed'}">
                    <td class="px-2 py-2 text-gray-600">${result.rowIndex}</td>
                    <td class="px-2 py-2">${statusHtml}</td>
                    <td class="px-2 py-2 font-medium">${locationName}</td>
                    <td class="px-2 py-2">${result.province || '-'}</td>
                    <td class="px-2 py-2">${result.district || '-'}</td>
                    <td class="px-2 py-2 text-right font-mono">${dataValue}</td>
                    <td class="px-2 py-2 text-gray-600 text-[10px]">${result.error || (result.ambiguous ? `${result.ambiguousOptions.length} seçenek` : 'Başarılı')}</td>
                </tr>
            `;
        }).join('');
    }
    
    /**
     * Önizleme filtreleme
     */
    filterMatchPreview(filter) {
        const allResults = [
            ...this.matchResults.successful,
            ...this.matchResults.ambiguous,
            ...this.matchResults.failed
        ].sort((a, b) => a.rowIndex - b.rowIndex);
        
        const tbody = document.getElementById('match-preview-tbody');
        if (tbody) {
            tbody.innerHTML = this.generatePreviewRows(allResults, filter);
        }
    }
    
    /**
     * Eşleşme sonuçlarını CSV olarak dışa aktar
     */
    exportMatchResults() {
        const allResults = [
            ...this.matchResults.successful,
            ...this.matchResults.ambiguous,
            ...this.matchResults.failed
        ].sort((a, b) => a.rowIndex - b.rowIndex);
        
        const headers = [
            'Satır',
            'Durum',
            'Konum',
            'İl',
            'İlçe',
            'Veri',
            'Mesaj'
        ];
        
        const rows = allResults.map(result => {
            const locationName = result.originalData[this.mapper.columnMapping.locationColumn] || 
                                 result.originalData[this.mapper.columnMapping.districtColumn] || '';
            const dataValue = result.originalData[this.mapper.columnMapping.dataColumn] || '';
            const status = result.matched && !result.ambiguous ? 'Başarılı' : result.ambiguous ? 'Belirsiz' : 'Hatalı';
            const message = result.error || (result.ambiguous ? `${result.ambiguousOptions.length} seçenek` : 'Başarılı');
            
            return [
                result.rowIndex,
                status,
                locationName,
                result.province || '',
                result.district || '',
                dataValue,
                message
            ];
        });
        
        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `eslesme-sonuclari-${Date.now()}.csv`;
        link.click();
        
        showFeedback('✅ Sonuçlar CSV olarak indirildi!');
    }
    
    /**
     * Veri analizine göre sınıflandırma yöntemi öner
     */
    suggestVisualizationMethod() {
        try {
            // Sadece choropleth için öneri göster (dot density ve bubble'da sınıflandırma yöntemi yok)
            const vizTypeSelect = document.getElementById('viz-type-select');
            const currentVizType = vizTypeSelect?.value;
            
            if (currentVizType !== 'choropleth') {
                // Dot density veya bubble seçiliyse öneri panelini gizle
                const suggestionPanel = document.getElementById('viz-suggestion-panel');
                if (suggestionPanel) {
                    suggestionPanel.classList.add('hidden');
                }
                return;
            }
            
            // Eşleştirilmiş veriden sayısal değerleri al
            const matchedData = this.mapper.getMatchedData();
            const dataColumn = this.mapper.columnMapping.dataColumn;
            
            if (!matchedData || matchedData.length === 0 || !dataColumn) {
                return;
            }
            
            // Sayısal değerleri çıkar
            const values = matchedData
                .map(row => parseFloat(row[dataColumn]))
                .filter(v => !isNaN(v) && v !== null && v !== undefined);
            
            if (values.length < 3) {
                return;
            }
            
            // VisualizationManager'ın analiz fonksiyonunu kullan
            // Çoklu kaynak desteği: App, window, ServiceLocator
            const vizManager = (window.App && window.App.visualizationManager) ||
                              window.visualizationManager ||
                              (window.ServiceLocator?.get && window.ServiceLocator.get('visualizationManager'));

            if (!vizManager || typeof vizManager.suggestClassificationMethod !== 'function') {
                safeWarnWiz('⚠️ VisualizationManager bulunamadı veya suggestClassificationMethod mevcut değil');
                return;
            }
            
            const suggestion = vizManager.suggestClassificationMethod(values);
            
            // Öneri panelini güncelle
            const suggestionPanel = document.getElementById('viz-suggestion-panel');
            const suggestionText = document.getElementById('viz-suggestion-text');
            const applySuggestionBtn = document.getElementById('viz-apply-suggestion');
            
            if (suggestionPanel && suggestionText && applySuggestionBtn) {
                // Yöntem isimlerini Türkçeleştir
                const methodNames = {
                    'quantile': 'Yüzdelik Dilim (Quantile)',
                    'equal': 'Eşit Aralık (Equal Interval)',
                    'jenks': 'Doğal Kırılma (Jenks)',
                    'logarithmic': 'Logaritmik (Logarithmic)',
                    'custom': 'Özel Kırılma Noktaları'
                };
                
                const methodName = methodNames[suggestion.method] || suggestion.method;
                
                suggestionText.innerHTML = `
                    <strong>💡 Önerilen Yöntem:</strong> ${methodName}<br>
                    <span class="text-sm text-gray-600">${suggestion.reason || ''}</span>
                `;
                
                applySuggestionBtn.dataset.method = suggestion.method;
                suggestionPanel.classList.remove('hidden');
            }
            
        } catch (error) {
            safeErrorWiz('❌ Öneri oluşturma hatası:', error);
        }
    }
    
    /**
     * Ultra-minimal dot density modal
     */
    showDotDensityModal({ totalValue, avgValue, maxValue, suggestedDotValue, onConfirm }) {
        // Modal oluştur
        const modal = document.createElement('div');
        modal.id = 'dot-density-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        // Modal içerik
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 8px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            ">
                <!-- Başlık -->
                <div style="margin-bottom: 20px;">
                    <h3 style="
                        font-size: 16px;
                        font-weight: 500;
                        color: #1f2937;
                        margin: 0 0 4px 0;
                    ">
                        Nokta Yoğunluk Ayarı
                    </h3>
                    <p style="
                        font-size: 13px;
                        color: #6b7280;
                        margin: 0;
                    ">
                        Her nokta kaç birimi temsil etsin?
                    </p>
                </div>
                
                <!-- Veri Özeti -->
                <div style="
                    background: #f9fafb;
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 16px;
                    border: 1px solid #e5e7eb;
                ">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 12px; color: #6b7280;">Toplam</span>
                        <span style="font-size: 12px; font-weight: 500; color: #1f2937;">${totalValue.toLocaleString('tr-TR')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 12px; color: #6b7280;">Ortalama</span>
                        <span style="font-size: 12px; font-weight: 500; color: #1f2937;">${Math.round(avgValue).toLocaleString('tr-TR')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-size: 12px; color: #6b7280;">En Yüksek</span>
                        <span style="font-size: 12px; font-weight: 500; color: #1f2937;">${maxValue.toLocaleString('tr-TR')}</span>
                    </div>
                </div>
                
                <!-- Input -->
                <div style="margin-bottom: 16px;">
                    <label style="
                        display: block;
                        font-size: 12px;
                        font-weight: 500;
                        color: #374151;
                        margin-bottom: 6px;
                    ">
                        Her nokta kaç birimi temsil etsin?
                    </label>
                    <input 
                        type="number" 
                        id="dot-value-input" 
                        value="${suggestedDotValue}"
                        min="1"
                        placeholder="${suggestedDotValue}"
                        style="
                            width: 100%;
                            padding: 10px 12px;
                            font-size: 14px;
                            border: 1px solid #d1d5db;
                            border-radius: 4px;
                            outline: none;
                            color: #1f2937;
                        "
                        onfocus="this.style.borderColor='#10b981'"
                        onblur="this.style.borderColor='#d1d5db'"
                    >
                    <p style="
                        font-size: 11px;
                        color: #9ca3af;
                        margin: 6px 0 0 0;
                    ">
                        Önerilen: ${suggestedDotValue.toLocaleString('tr-TR')}
                    </p>
                </div>
                
                <!-- Renk Seçimi -->
                <div style="margin-bottom: 16px;">
                    <label style="
                        display: block;
                        font-size: 12px;
                        font-weight: 500;
                        color: #374151;
                        margin-bottom: 8px;
                    ">
                        Nokta Rengi
                    </label>
                    <div style="display: flex; gap: 4px;">
                        <button class="dot-color-option" data-color="#f97316" title="Turuncu" style="
                            width: 30px;
                            height: 30px;
                            background: #f97316;
                            border: 2px solid #f97316;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="dot-color-option" data-color="#3b82f6" title="Mavi" style="
                            width: 30px;
                            height: 30px;
                            background: #3b82f6;
                            border: 2px solid #e5e7eb;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="dot-color-option" data-color="#ef4444" title="Kırmızı" style="
                            width: 30px;
                            height: 30px;
                            background: #ef4444;
                            border: 2px solid #e5e7eb;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="dot-color-option" data-color="#10b981" title="Yeşil" style="
                            width: 30px;
                            height: 30px;
                            background: #10b981;
                            border: 2px solid #e5e7eb;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="dot-color-option" data-color="#8b5cf6" title="Mor" style="
                            width: 30px;
                            height: 30px;
                            background: #8b5cf6;
                            border: 2px solid #e5e7eb;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="dot-color-option" data-color="#ec4899" title="Pembe" style="
                            width: 30px;
                            height: 30px;
                            background: #ec4899;
                            border: 2px solid #e5e7eb;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="dot-color-option" data-color="#14b8a6" title="Turkuaz" style="
                            width: 30px;
                            height: 30px;
                            background: #14b8a6;
                            border: 2px solid #e5e7eb;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="dot-color-option" data-color="#f59e0b" title="Sarı" style="
                            width: 30px;
                            height: 30px;
                            background: #f59e0b;
                            border: 2px solid #e5e7eb;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="dot-color-option" data-color="#6366f1" title="İndigo" style="
                            width: 30px;
                            height: 30px;
                            background: #6366f1;
                            border: 2px solid #e5e7eb;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                        <button class="dot-color-option" data-color="#1f2937" title="Siyah" style="
                            width: 30px;
                            height: 30px;
                            background: #1f2937;
                            border: 2px solid #e5e7eb;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                        "></button>
                    </div>
                </div>
                
                <!-- Butonlar -->
                <div style="display: flex; gap: 8px;">
                    <button 
                        id="dot-modal-cancel"
                        style="
                            flex: 1;
                            padding: 8px 16px;
                            font-size: 13px;
                            color: #6b7280;
                            background: #f3f4f6;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        "
                        onmouseover="this.style.background='#e5e7eb'"
                        onmouseout="this.style.background='#f3f4f6'"
                    >
                        İptal
                    </button>
                    <button 
                        id="dot-modal-confirm"
                        style="
                            flex: 1;
                            padding: 8px 16px;
                            font-size: 13px;
                            color: white;
                            background: #10b981;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        "
                        onmouseover="this.style.background='#059669'"
                        onmouseout="this.style.background='#10b981'"
                    >
                        Tamam
                    </button>
                </div>
            </div>
        `;
        
        // Animasyon yok - minimal
        
        document.body.appendChild(modal);
        
        // Input'a focus
        setTimeout(() => {
            const input = document.getElementById('dot-value-input');
            if (input) {
                // Başlangıç değerini sakla ve biçimlendir
                const rawVal = input.value.replace(/[^0-9]/g, '');
                input.dataset.rawValue = rawVal;
                input.value = parseInt(rawVal).toLocaleString('tr-TR');
                input.focus();
                input.select();
            }
        }, 100);
        
        // Input biçimlendirme - kullanıcı yazarken
        const formatInput = (e) => {
            const input = e.target;
            // Sadece rakamları al
            let value = input.value.replace(/[^0-9]/g, '');
            
            if (value === '') {
                input.dataset.rawValue = '';
                return;
            }
            
            // Raw değeri sakla
            input.dataset.rawValue = value;
            
            // Biçimlendir ve göster
            const formatted = parseInt(value).toLocaleString('tr-TR');
            input.value = formatted;
        };
        
        document.getElementById('dot-value-input').addEventListener('input', formatInput);
        
        // Renk seçimi
        let selectedColor = '#f97316'; // Varsayılan turuncu
        const colorButtons = modal.querySelectorAll('.dot-color-option');
        colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Tüm butonların border'larını sıfırla
                colorButtons.forEach(b => {
                    b.style.border = '2px solid #e5e7eb';
                    b.style.transform = 'scale(1)';
                });
                // Seçili butonu vurgula
                btn.style.border = `2px solid ${btn.dataset.color}`;
                btn.style.transform = 'scale(1.1)';
                selectedColor = btn.dataset.color;
            });
            
            // Hover efekti
            btn.addEventListener('mouseenter', () => {
                if (btn.dataset.color !== selectedColor) {
                    btn.style.transform = 'scale(1.05)';
                }
            });
            btn.addEventListener('mouseleave', () => {
                if (btn.dataset.color !== selectedColor) {
                    btn.style.transform = 'scale(1)';
                }
            });
        });
        
        // Event listeners
        const closeModal = () => {
            modal.remove();
        };
        
        document.getElementById('dot-modal-cancel').addEventListener('click', closeModal);
        
        document.getElementById('dot-modal-confirm').addEventListener('click', () => {
            const input = document.getElementById('dot-value-input');
            // Raw değeri kullan (biçimlendirilmemiş)
            const rawValue = input.dataset.rawValue || input.value.replace(/[^0-9]/g, '');
            const value = parseInt(rawValue);
            
            if (isNaN(value) || value < 1) {
                input.style.borderColor = '#ef4444';
                return;
            }
            
            closeModal();
            onConfirm(value, selectedColor);
            
            // Feedback göster
            showFeedback('✅ Görselleştirme tamamlandı!');
            
            // FAB butonunu göster
            const fabContainer = document.getElementById('label-fab');
            if (fabContainer) {
                fabContainer.style.display = 'block';
            }
            
            // Buton metnini güncelle
            const vizButton = document.getElementById('step-3-next');
            if (vizButton) {
                vizButton.innerHTML = '<i class="fa-solid fa-rotate mr-1"></i>Yeniden Görselleştir';
            }
            
            showFeedback('👉 Ayarları değiştirerek tekrar görselleştirebilirsiniz');
        });
        
        // Enter tuşu ile onayla
        document.getElementById('dot-value-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('dot-modal-confirm').click();
            }
        });
        
        // ESC tuşu ile kapat
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Arkaplan tıklayınca kapat
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    /**
     * Görselleştir
     */
    visualize() {
        const vizType = document.getElementById('viz-type-select').value;
        const dataColumn = this.mapper.columnMapping.dataColumn;
        const classCount = parseInt(document.getElementById('viz-class-count-select')?.value || '5');
        const classificationMethod = document.getElementById('viz-classification-select')?.value || 'quantile';
        const colorScheme = document.getElementById('viz-color-scheme-select')?.value || 'viridis';
        const legendType = document.getElementById('viz-legend-type-select')?.value || 'discrete';
        const customBreaksInput = document.getElementById('viz-custom-breaks')?.value;
        
        // Eğer hala belirsiz eşleşme varsa uyar
        if (this.matchResults.ambiguous.length > 0) {
            const proceed = confirm(
                `${this.matchResults.ambiguous.length} belirsiz eşleşme var. ` +
                `Bunlar görselleştirmede göz ardı edilecek. Devam edilsin mi?`
            );
            if (!proceed) return;
        }
        
        // Eşleştirilmiş veriyi al
        const matchedData = this.mapper.getMatchedData();
        
        if (matchedData.length === 0) {
            safeErrorWiz('❌ Görselleştirilecek veri yok!');
            alert('Görselleştirilecek veri yok!');
            return;
        }
        
        
        showFeedback('🎨 Görselleştirme oluşturuluyor...');

        // VisualizationManager ile görselleştir
        // Çoklu kaynak desteği: App, window, ServiceLocator
        const vizManager = (typeof App !== 'undefined' && App.visualizationManager) ||
                          window.visualizationManager ||
                          (window.ServiceLocator?.get && window.ServiceLocator.get('visualizationManager'));

        if (vizManager) {
            
            // Ayarları uygula (sadece choropleth için)
            if (vizType === 'choropleth') {
                vizManager.setColorScheme(colorScheme);
                vizManager.setClassCount(classCount);
                vizManager.setClassificationMethod(classificationMethod);
                vizManager.setLegendType(legendType);
                
                // Özel kırılma değerleri varsa
                if (classificationMethod === 'custom' && customBreaksInput) {
                    const breaks = customBreaksInput.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
                    if (breaks.length > 0) {
                        vizManager.setCustomBreaks(breaks);
                    } else {
                        alert('Özel kırılma değerleri geçersiz! Virgülle ayrılmış sayılar girin.');
                        return;
                    }
                }
            }
            
            // Görselleştirme türüne göre render et
            if (vizType === 'choropleth') {
                vizManager.renderChoropleth(matchedData, dataColumn);
            } else if (vizType === 'bubble') {
                // Bubble parametrelerini al
                const bubbleColor = document.getElementById('viz-bubble-color')?.value || '#3b82f6';
                const radiusMultiplier = parseFloat(document.getElementById('viz-bubble-size')?.value || '1');
                const bubbleMethod = document.getElementById('viz-bubble-method')?.value || 'proportional';
                const bubbleClassCount = parseInt(document.getElementById('viz-bubble-class-count')?.value || '4');
                const bubbleClassification = document.getElementById('viz-bubble-classification')?.value || 'quantile';
                
                // renderBubbleMap'i güncelle - parametreleri geç
                vizManager.renderBubbleMap(matchedData, dataColumn, bubbleColor, radiusMultiplier, {
                    method: bubbleMethod,
                    classCount: bubbleClassCount,
                    classification: bubbleClassification
                });
            } else if (vizType === 'dot') {
                // Veri değerlerini analiz et ve akıllı varsayılan öner
                const values = matchedData.map(row => parseFloat(row[dataColumn]) || 0).filter(v => v > 0);
                const totalValue = values.reduce((sum, v) => sum + v, 0);
                const avgValue = totalValue / values.length;
                const maxValue = Math.max(...values);
                
                // Akıllı varsayılan hesaplama
                let suggestedDotValue;
                if (maxValue > 1000000) {
                    suggestedDotValue = 50000;
                } else if (maxValue > 100000) {
                    suggestedDotValue = 10000;
                } else if (maxValue > 10000) {
                    suggestedDotValue = 1000;
                } else if (maxValue > 1000) {
                    suggestedDotValue = 100;
                } else {
                    suggestedDotValue = 10;
                }
                
                // Modern modal göster
                this.showDotDensityModal({
                    totalValue,
                    avgValue,
                    maxValue,
                    suggestedDotValue,
                    onConfirm: (dotValue, dotColor) => {
                        vizManager.renderDotDensity(matchedData, dataColumn, dotValue, dotColor);
                    }
                });
                return; // Modal açık olduğu için burada dur
            }
            
            showFeedback('✅ Görselleştirme tamamlandı!');
            
            // FAB butonunu göster
            const fabContainer = document.getElementById('label-fab');
            if (fabContainer) {
                fabContainer.style.display = 'block';
                safeLogWiz('✅ FAB butonu gösterildi');
            }
            
            // Kullanıcı Adım 3'te kalır (ayarları değiştirip tekrar görselleştirebilir)
            // Buton metnini güncelle
            const vizButton = document.getElementById('step-3-next');
            if (vizButton) {
                vizButton.innerHTML = '<i class="fa-solid fa-rotate mr-1"></i>Yeniden Görselleştir';
            }
            
            showFeedback('👉 Ayarları değiştirerek tekrar görselleştirebilirsiniz');
        } else {
            safeErrorWiz('VisualizationManager bulunamadı!');
            alert('Görselleştirme başarısız oldu.');
        }
    }
    
    /**
     * Adım geçişi
     */
    goToStep(step) {
        // Önceki adımı gizle
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`wizard-step-${i}`).classList.add('hidden');
        }
        
        // Yeni adımı göster
        document.getElementById(`wizard-step-${step}`).classList.remove('hidden');
        
        // Progress bar güncelle
        document.getElementById('wizard-progress').classList.remove('hidden');
        this.updateProgressBar(step);
        
        // Adım 3'e geri dönülmüşse buton metnini sıfırla
        if (step === 3) {
            const vizButton = document.getElementById('step-3-next');
            if (vizButton && vizButton.textContent.includes('Yeniden')) {
                // Buton zaten "Yeniden Görselleştir" ise değiştirme
            } else if (vizButton && !vizButton.textContent.includes('Görselleştir')) {
                vizButton.innerHTML = 'Görselleştir<i class="fa-solid fa-eye ml-1"></i>';
            }
        }
        
        this.currentStep = step;
    }
    
    /**
     * Progress bar güncelle
     */
    updateProgressBar(step) {
        const titles = ['Dosya Yükle', 'Sütun Eşleştir', 'Eşleştirme Sonuçları', 'Görselleştir'];
        
        document.getElementById('step-title').textContent = titles[step - 1];
        
        // İndikatörleri güncelle
        for (let i = 1; i <= 3; i++) {
            const indicator = document.getElementById(`step-indicator-${i}`);
            const line = document.getElementById(`progress-line-${i}`);
            
            if (i < step) {
                // Tamamlanmış
                indicator.className = 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold';
                if (line) line.className = 'w-8 h-0.5 bg-emerald-600';
            } else if (i === step) {
                // Aktif
                indicator.className = 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold';
                if (line) line.className = 'w-8 h-0.5 bg-zinc-300';
            } else {
                // Bekliyor
                indicator.className = 'w-6 h-6 rounded-full bg-zinc-300 text-zinc-600 flex items-center justify-center text-[10px] font-bold';
                if (line) line.className = 'w-8 h-0.5 bg-zinc-300';
            }
        }
    }
}

// Sayfa yüklendiğinde başlat
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.wizardInstance = new VisualizationWizard();
    });
}
