/**
 * Sidebar Component Templates
 * Modular sidebar bileşenleri - Template String yaklaşımı
 */

const SidebarTemplates = {
    /**
     * Sidebar Header - Logo bölümü
     */
    header: () => `
        <div class="bg-white border-b border-zinc-200 px-3 py-2.5">
            <div class="flex items-center justify-center w-full">
                <img src="ogm-logo.svg" class="logo" />
            </div>
        </div>
    `,

    /**
     * Project Purpose - Proje amacı input alanı
     */
    projectPurpose: () => `
        <section class="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors">
            <div class="floating-input-container">
                <input type="text" id="map-purpose" placeholder=" " class="floating-input">
                <label for="map-purpose" class="floating-label">Proje Amacı</label>
            </div>
        </section>
    `,

    /**
     * CBS Tools Section - Araç seçim checkboxları
     */
    cbsTools: () => `
        <section class="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">Aktif CBS Araç Kiti</h3>
            <div class="space-y-2">
                <label class="flex items-center px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-all">
                    <input type="checkbox" id="tool-measurement" class="rounded border-zinc-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500 mr-2.5" checked>
                    <div class="flex items-center">
                        <i class="fa-solid fa-ruler text-emerald-600 mr-2 text-sm"></i>
                        <span class="text-sm text-zinc-700">Ölçüm Araçları</span>
                    </div>
                </label>
                <label class="flex items-center px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-all">
                    <input type="checkbox" id="tool-analysis" class="rounded border-zinc-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500 mr-2.5">
                    <div class="flex items-center">
                        <i class="fa-solid fa-chart-line text-emerald-600 mr-2 text-sm"></i>
                        <span class="text-sm text-zinc-700">Mekânsal Analiz</span>
                    </div>
                </label>
                <label class="flex items-center px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-all">
                    <input type="checkbox" id="tool-timeline" class="rounded border-zinc-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500 mr-2.5">
                    <div class="flex items-center">
                        <i class="fa-solid fa-clock text-emerald-600 mr-2 text-sm"></i>
                        <span class="text-sm text-zinc-700">Zaman Çizelgesi</span>
                    </div>
                </label>
            </div>
        </section>
    `,

    /**
     * Data Creation Section - Veri oluşturma formu
     */
    dataCreation: () => `
        <section class="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2">Veri Oluşturma</h3>
            
            <div class="space-y-3">
                <div>
                    <select id="data-type" class="w-full px-2.5 py-2 border-2 border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium">
                        <option value="none">Kapalı</option>
                        <option value="point">Nokta Verisi Ekle</option>
                        <option value="area">Alan Verisi Ekle</option>
                        <option value="route">Çizgi Verisi Ekle</option>
                        <option value="circle">Çember Verisi Ekle</option>
                    </select>
                </div>
                
                <div id="data-input-section" class="space-y-3 hidden">
                    <div>
                        <label class="block text-xs font-medium text-zinc-700 mb-1">Veri Adı</label>
                        <input type="text" id="data-name" placeholder="Örn: Tarihi Müze, Hastane, Park..." class="w-full px-2.5 py-1.5 border border-zinc-300 bg-zinc-50 rounded-lg text-xs text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-zinc-700 mb-1">📅 Tarih (Opsiyonel - Zaman çizelgesi için)</label>
                        <input type="date" id="data-timestamp" class="w-full px-2.5 py-1.5 border border-zinc-300 bg-zinc-50 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all">
                    </div>
                    <button id="add-data-btn" class="w-full bg-zinc-900 hover:bg-black text-white font-medium py-1.5 px-2.5 text-xs rounded-lg transition-all">
                        <i class="fa-solid fa-plus mr-2"></i>Veri Ekle
                    </button>
                </div>
            </div>
        </section>
    `,

    /**
     * Data Catalog Section - Veri listesi
     */
    dataCatalog: () => `
        <section class="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2">Veri Kataloğu</h3>
            <div id="data-list" class="space-y-2 max-h-40 overflow-y-auto text-sm">
                <div class="flex items-center justify-center py-8 text-zinc-400">
                    <div class="text-center">
                        <i class="fa-solid fa-database text-2xl mb-2 opacity-50"></i>
                        <p class="text-sm">Henüz veri eklenmedi</p>
                        <p class="text-xs mt-1 text-zinc-500">Haritaya tıklayarak veri eklemeye başlayın</p>
                    </div>
                </div>
            </div>
        </section>
    `,

    /**
     * Visualization Wizard Section - Çok uzun, alt fonksiyonlara bölünmüş
     */
    visualizationWizard: () => `
        <section class="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2">Veri Görselleştirme</h3>
            
            ${SidebarTemplates._wizardProgress()}
            ${SidebarTemplates._wizardStep1()}
            ${SidebarTemplates._wizardStep2()}
            ${SidebarTemplates._wizardStep3()}
            ${SidebarTemplates._wizardStep4()}
        </section>
    `,

    /**
     * Wizard Progress Bar (internal)
     */
    _wizardProgress: () => `
        <div id="wizard-progress" class="mb-3 hidden">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-1">
                    <div id="step-indicator-1" class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">1</div>
                    <div class="w-8 h-0.5 bg-zinc-300" id="progress-line-1"></div>
                    <div id="step-indicator-2" class="w-6 h-6 rounded-full bg-zinc-300 text-zinc-600 flex items-center justify-center text-[10px] font-bold">2</div>
                    <div class="w-8 h-0.5 bg-zinc-300" id="progress-line-2"></div>
                    <div id="step-indicator-3" class="w-6 h-6 rounded-full bg-zinc-300 text-zinc-600 flex items-center justify-center text-[10px] font-bold">3</div>
                </div>
            </div>
            <p id="step-title" class="text-[11px] text-zinc-600 font-medium">Dosya Yükle</p>
        </div>
    `,

    /**
     * Wizard Step 1 - File Upload (internal)
     */
    _wizardStep1: () => `
        <div id="wizard-step-1" class="space-y-3">
            <div>
                <label class="block text-xs font-medium text-zinc-700 mb-1">📁 Veri Dosyası</label>
                <div class="custom-file-input-wrapper">
                    <input type="file" id="data-file-input" accept=".xlsx,.xls,.csv" class="custom-file-input">
                    <label for="data-file-input" class="custom-file-label">
                        <span class="custom-file-button">Dosya Aç</span>
                        <span class="custom-file-name">Dosya seçilmedi</span>
                    </label>
                </div>
                <p class="text-[10px] text-zinc-500 mt-1">Excel (.xlsx, .xls) veya CSV (.csv)</p>
            </div>
            
            <div id="file-loaded-message" class="hidden p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div class="flex items-center">
                    <i class="fa-solid fa-check-circle text-emerald-600 mr-2"></i>
                    <div class="flex-1 text-xs">
                        <div class="font-semibold text-emerald-900" id="file-name-display"></div>
                        <div class="text-emerald-700 text-[10px]" id="file-info-display"></div>
                    </div>
                </div>
            </div>
        </div>
    `,

    /**
     * Wizard Step 2 - Column Mapping (internal)
     */
    _wizardStep2: () => `
        <div id="wizard-step-2" class="space-y-3 hidden">
            <div>
                <label class="block text-xs font-medium text-zinc-700 mb-2">📍 Konum Tipi</label>
                <div class="space-y-2">
                    <label class="flex items-center p-2 border-2 border-zinc-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-all">
                        <input type="radio" name="location-level" value="province" class="text-emerald-600 focus:ring-emerald-500 mr-2" checked>
                        <div class="flex-1">
                            <div class="text-xs font-semibold text-zinc-900">🏛️ İl Seviyesi</div>
                            <div class="text-[10px] text-zinc-600">Sadece il verisi</div>
                        </div>
                    </label>
                    <label class="flex items-center p-2 border-2 border-zinc-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-all">
                        <input type="radio" name="location-level" value="mixed" class="text-emerald-600 focus:ring-emerald-500 mr-2">
                        <div class="flex-1">
                            <div class="text-xs font-semibold text-zinc-900">🏘️ Karışık (İl + İlçe)</div>
                            <div class="text-[10px] text-zinc-600">Hem il hem ilçe verisi</div>
                        </div>
                    </label>
                </div>
            </div>
            
            <div id="province-column-container">
                <label class="block text-xs font-medium text-zinc-700 mb-1">🏛️ İl Sütünu</label>
                <select id="province-column-select" class="w-full px-3 py-2 border border-zinc-300 bg-zinc-50 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                    <option value="">İl sütünu seçin...</option>
                </select>
            </div>
            
            <div id="district-column-container" class="hidden">
                <label class="block text-xs font-medium text-zinc-700 mb-1">🏢 İlçe Sütünu</label>
                <select id="district-column-select" class="w-full px-3 py-2 border border-zinc-300 bg-zinc-50 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                    <option value="">İlçe sütünu seçin...</option>
                </select>
                <p class="text-[10px] text-zinc-500 mt-1">ℹ️ Karışık modda boş bırakılırsa il seviyesi kabul edilir</p>
            </div>
            
            <div>
                <label class="block text-xs font-medium text-zinc-700 mb-1">📊 Veri Sütünu</label>
                <select id="data-column-select" class="w-full px-3 py-2 border border-zinc-300 bg-zinc-50 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                    <option value="">Veri sütünu seçin...</option>
                </select>
                <p class="text-[10px] text-zinc-500 mt-1">Sadece sayısal sütünlar gösterilir</p>
            </div>
            
            <div id="column-preview" class="p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] hidden">
                <div class="font-semibold text-zinc-700 mb-1">👁️ Önizleme (ilk 3 satır)</div>
                <div id="column-preview-content" class="text-zinc-600"></div>
            </div>
            
            <div class="flex space-x-2">
                <button id="step-2-back" class="flex-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-medium py-2 px-3 rounded-lg text-xs transition-all">
                    <i class="fa-solid fa-arrow-left mr-1"></i>Geri
                </button>
                <button id="step-2-next" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-lg text-xs transition-all">
                    Eşleştir<i class="fa-solid fa-arrow-right ml-1"></i>
                </button>
            </div>
        </div>
    `,

    /**
     * Wizard Step 3 - Visualization Settings (internal) - ÇOK UZUN
     */
    _wizardStep3: () => `
        <div id="wizard-step-3" class="space-y-3 hidden">
            ${SidebarTemplates._matchSummary()}
            ${SidebarTemplates._ambiguousMatches()}
            ${SidebarTemplates._visualizationSettings()}
            
            <div class="flex space-x-2">
                <button id="step-3-back" class="flex-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-medium py-2 px-3 rounded-lg text-xs transition-all">
                    <i class="fa-solid fa-arrow-left mr-1"></i>Geri
                </button>
                <button id="step-3-next" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-lg text-xs transition-all">
                    Görselleştir<i class="fa-solid fa-eye ml-1"></i>
                </button>
            </div>
        </div>
    `,

    /**
     * Match Summary (internal)
     */
    _matchSummary: () => `
        <div id="match-summary" class="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
            <div class="text-xs font-semibold text-zinc-900 mb-2">✅ Eşleştirme Sonuçları</div>
            <div class="space-y-1 text-[11px]">
                <div class="flex items-center justify-between">
                    <span class="text-emerald-700">✅ Başarılı:</span>
                    <span id="match-successful-count" class="font-bold">0</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-amber-700">⚠️ Belirsiz:</span>
                    <span id="match-ambiguous-count" class="font-bold">0</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-red-700">❌ Hatalı:</span>
                    <span id="match-failed-count" class="font-bold">0</span>
                </div>
            </div>
            <button id="show-match-preview-btn" 
                    onclick="window.wizardInstance.showMatchPreview()" 
                    class="w-full mt-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] rounded-lg transition-all opacity-50 cursor-not-allowed" 
                    disabled>
                <i class="fa-solid fa-table mr-1"></i>Detaylı Önizleme
            </button>
        </div>
    `,

    /**
     * Ambiguous Matches (internal)
     */
    _ambiguousMatches: () => `
        <div id="ambiguous-matches-container" class="hidden">
            <div class="text-xs font-semibold text-zinc-900 mb-2">⚠️ Belirsiz Eşleşmeler</div>
            <div id="ambiguous-matches-list" class="space-y-2 max-h-64 overflow-y-auto"></div>
        </div>
    `,

    /**
     * Visualization Settings (internal) - ÇOK UZUN, daha da parçalanabilir
     */
    _visualizationSettings: () => `
        <div class="p-3 bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg space-y-3">
            <div class="text-xs font-semibold text-zinc-900 mb-2">🎨 Görselleştirme Ayarları</div>
            
            <div>
                <label class="block text-xs font-medium text-zinc-700 mb-1">🗺️ Görselleştirme Türü</label>
                <select id="viz-type-select" class="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                    <option value="choropleth" selected>🗺️ Koroplet Harita</option>
                    <option value="bubble">🔵 Kabarcık Harita</option>
                    <option value="dot">🔴 Nokta Yoğunluk</option>
                </select>
            </div>
            
            ${SidebarTemplates._choroplethSettings()}
            ${SidebarTemplates._bubbleSettings()}
            ${SidebarTemplates._suggestionPanel()}
        </div>
    `,

    /**
     * Choropleth Settings (internal)
     */
    _choroplethSettings: () => `
        <div id="viz-class-count-container">
            <label class="block text-xs font-medium text-zinc-700 mb-1">🎨 Sınıf Sayısı</label>
            <select id="viz-class-count-select" class="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                <option value="3">3 Sınıf</option>
                <option value="4">4 Sınıf</option>
                <option value="5" selected>5 Sınıf (Önerilen)</option>
                <option value="6">6 Sınıf</option>
                <option value="7">7 Sınıf</option>
            </select>
            <p class="text-[10px] text-zinc-500 mt-1">Daha fazla sınıf = daha detaylı ayırım</p>
        </div>
        
        <div id="viz-classification-container">
            <label class="block text-xs font-medium text-zinc-700 mb-1">📏 Sınıflandırma Yöntemi</label>
            <select id="viz-classification-select" class="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                <option value="jenks">Doğal kırılmalar (Jenks)</option>
                <option value="equal">Doğrusal (eşit aralıklı)</option>
                <option value="quantile" selected>Yüzdelik (eşit sayıda)</option>
                <option value="rounded">Yuvarlanmış değerler</option>
                <option value="logarithmic">Logaritmik</option>
                <option value="custom">Özel</option>
            </select>
            <div id="viz-classification-info" class="text-[10px] text-zinc-600 mt-1 bg-white p-2 rounded border border-zinc-200">
                <strong>Yüzdelik (eşit sayıda):</strong> Her sınıfta eşit sayıda öğe bulunur. Dengeli dağılım için en iyisi.
            </div>
        </div>
        
        <div id="viz-color-scheme-container">
            <label class="block text-xs font-medium text-zinc-700 mb-1">🎨 Renk Skalası</label>
            <select id="viz-color-scheme-select" class="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                <option value="reds" selected>🔴 Kırmızı Tonları</option>
                <option value="greens">🟢 Yeşil Tonları</option>
                <option value="viridis">🔵 Viridis</option>
                <option value="topographic">🏞️ Topografik</option>
                <option value="diverging_orange_blue">🟠🔵 Turuncu-Mavi</option>
                <option value="blues">🔵 Mavi Tonları</option>
                <option value="oranges">🟠 Turuncu Tonları</option>
                <option value="purples">🟣 Mor Tonları</option>
            </select>
            <div id="viz-color-preview" class="mt-2 h-6 rounded-lg overflow-hidden border border-zinc-300 shadow-sm" 
                 style="background: linear-gradient(to right, #fff5f0, #fee5d9, #fcbba1, #fc9272, #fb6a4a, #ef3b2c, #cb181d, #99000d, #67000d);">
            </div>
        </div>
        
        <div id="viz-legend-type-container">
            <label class="block text-xs font-medium text-zinc-700 mb-1">Lejant Türü</label>
            <select id="viz-legend-type-select" class="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                <option value="discrete" selected>Ayrık (Discrete)</option>
                <option value="continuous">Sürekli (Continuous)</option>
                <option value="quantized">Kuantize (Quantized)</option>
                <option value="diverging">İki Uçlu (Diverging)</option>
                <option value="categorical">Kategorik (Nominal)</option>
            </select>
            <div id="viz-legend-type-info" class="text-[10px] text-zinc-600 mt-1 bg-white p-2 rounded border border-zinc-200">
                <strong>Ayrık:</strong> Her sınıf ayrı renk kutusu ile gösterilir. En yaygın kullanım.
            </div>
        </div>
        
        <div id="viz-custom-breaks-container" class="hidden">
            <label class="block text-xs font-medium text-zinc-700 mb-1">Özel Kırılma Değerleri</label>
            <input type="text" id="viz-custom-breaks" placeholder="Örn: 100, 500, 1000, 5000" 
                   class="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
            <p class="text-[10px] text-zinc-500 mt-1">Virgülle ayrılmış sayılar girin</p>
            <p id="viz-custom-breaks-error" class="text-[10px] text-red-600 mt-1 hidden"></p>
        </div>
    `,

    /**
     * Bubble Settings (internal)
     */
    _bubbleSettings: () => `
        <div id="viz-bubble-controls" class="hidden space-y-3">
            <div>
                <label class="block text-xs font-medium text-zinc-700 mb-1">📊 Sınıflandırma Türü</label>
                <select id="viz-bubble-method" class="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                    <option value="proportional" selected>🔹 Orantısal (Proportional)</option>
                    <option value="graduated">🎯 Sınıflandırılmış (Graduated)</option>
                </select>
                <p class="text-[10px] text-zinc-500 mt-1" id="viz-bubble-method-info">ℹ️ Her değer kendi boyutuna sahip</p>
            </div>
            
            <div id="viz-bubble-class-count-container" class="hidden">
                <label class="block text-xs font-medium text-zinc-700 mb-1">🎨 Sınıf Sayısı</label>
                <select id="viz-bubble-class-count" class="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                    <option value="3">3 Sınıf</option>
                    <option value="4" selected>4 Sınıf (Önerilen)</option>
                    <option value="5">5 Sınıf</option>
                    <option value="6">6 Sınıf</option>
                </select>
            </div>
            
            <div id="viz-bubble-classification-container" class="hidden">
                <label class="block text-xs font-medium text-zinc-700 mb-1">📏 Yöntem</label>
                <select id="viz-bubble-classification" class="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                    <option value="quantile" selected>Yüzdelik (eşit sayıda)</option>
                    <option value="equal">Doğrusal (eşit aralıklı)</option>
                    <option value="jenks">Doğal kırılmalar (Jenks)</option>
                </select>
            </div>
            
            <div>
                <label class="block text-xs font-medium text-zinc-700 mb-2">🎨 Kabarcık Rengi</label>
                <input type="color" id="viz-bubble-color" value="#3b82f6" 
                       class="w-full h-10 rounded-lg border-2 border-zinc-300 cursor-pointer bg-white">
                <p class="text-[10px] text-zinc-500 mt-1">ℹ️ İstediğiniz rengi seçebilirsiniz</p>
            </div>
            <div>
                <label class="block text-xs font-medium text-zinc-700 mb-1">🔍 Kabarcık Boyutu</label>
                <input type="range" id="viz-bubble-size" min="0.5" max="2" step="0.1" value="1" 
                       class="w-full">
                <div class="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>Küçük</span>
                    <span id="viz-bubble-size-value">1.0x</span>
                    <span>Büyük</span>
                </div>
            </div>
        </div>
    `,

    /**
     * Suggestion Panel (internal)
     */
    _suggestionPanel: () => `
        <div id="viz-suggestion-panel" class="hidden bg-blue-50 border border-blue-200 rounded-lg p-2">
            <div class="flex items-start">
                <i class="fa-solid fa-lightbulb text-amber-500 mr-2 mt-0.5"></i>
                <div class="flex-1">
                    <div class="text-[11px] font-semibold text-blue-900 mb-1">💡 Önerilen Yöntem</div>
                    <div id="viz-suggestion-text" class="text-[10px] text-blue-800"></div>
                    <button id="viz-apply-suggestion" class="mt-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] rounded transition-all">
                        Uygula
                    </button>
                </div>
            </div>
        </div>
    `,

    /**
     * Wizard Step 4 (internal)
     */
    _wizardStep4: () => `
        <div id="wizard-step-4" class="space-y-3 hidden">
            <div>
                <label class="block text-xs font-medium text-zinc-700 mb-1">🗺️ Görselleştirme Türü</label>
                <select id="viz-type-select" class="w-full px-3 py-2 border border-zinc-300 bg-zinc-50 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                    <option value="choropleth" selected>🗺️ Koroplet Harita</option>
                    <option value="bubble">🔵 Kabarcık Harita</option>
                    <option value="dot">🔴 Nokta Yoğunluk</option>
                </select>
            </div>
            
            <button id="apply-viz-btn" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-lg text-xs transition-all">
                <i class="fa-solid fa-eye mr-2"></i>Görselleştir
            </button>
        </div>
    `,

    /**
     * Project Management Section - Proje kaydetme/yükleme
     */
    projectManagement: () => `
        <section class="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2">Proje Yönetimi</h3>
            
            <div class="mb-3">
                <label class="block text-xs font-medium text-zinc-700 mb-1">Dışa Aktarma Formatı</label>
                <select id="export-format" class="w-full px-3 py-2 border border-zinc-300 bg-zinc-50 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all">
                    <option value="geojson">GeoJSON - CBS uyumlu (.geojson)</option>
                    <option value="kml">KML - Google Earth (.kml)</option>
                    <option value="kmz">KMZ - Sıkıştırılmış KML (.kmz)</option>
                    <option value="shp">Shapefile - GIS (.zip)</option>
                    <option value="csv">CSV - Tablo formatı (.csv)</option>
                    <option value="xlsx">Excel - Tablo (.xlsx)</option>
                </select>
            </div>

            <div class="space-y-2">
                <button id="save-map-btn" class="w-full bg-zinc-900 hover:bg-black text-white font-medium py-2 px-3 rounded-lg transition-all">
                    <i class="fa-solid fa-download mr-2"></i>Projeyi İndir
                </button>
                
                <div class="grid grid-cols-2 gap-2">
                    <label for="load-map-input" class="bg-zinc-700 hover:bg-zinc-800 text-white font-medium py-2 px-3 rounded-lg text-center cursor-pointer text-sm transition-all">
                        <i class="fa-solid fa-upload mr-1"></i>Yükle
                    </label>
                    <button id="generate-report" class="border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-medium py-2 px-2 rounded-lg text-xs transition-all opacity-50" disabled>
                        <i class="fa-solid fa-chart-bar mr-1"></i>Rapor
                    </button>
                </div>
                
                <input type="file" id="load-map-input" class="hidden" accept=".geojson,.kml,.kmz,.shp,.zip,.csv,.xlsx,.xls">
                
                <div class="border-t border-zinc-200 pt-3 mt-3">
                    <label class="block text-xs font-medium text-zinc-700 mb-1">🌐 URL'den Veri Yükle</label>
                    <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <input type="text" id="import-url-input" placeholder="https://ornek.com/veri.geojson" class="w-full sm:flex-1 px-2.5 py-2 sm:py-1.5 border border-zinc-300 bg-zinc-50 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all">
                        <button id="import-url-btn" class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 sm:py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center" title="URL'den yükle">
                            <i class="fa-solid fa-cloud-arrow-up mr-2 sm:mr-0"></i>
                            <span class="sm:hidden">Yükle</span>
                        </button>
                    </div>
                    <p class="text-xs sm:text-[10px] text-zinc-500 mt-1.5">📌 GeoJSON, KML, CSV formatları desteklenir</p>
                </div>
            </div>
        </section>
    `,

    /**
     * Sidebar Footer - Alt bilgi
     */
    footer: () => `
        <div class="border-t border-zinc-200 bg-white px-3 py-2 pb-6 sidebar-footer">
            <div class="flex items-center justify-between text-[10px] text-zinc-600 mb-2">
                <div class="flex items-center">
                    <i class="fa-solid fa-globe text-emerald-600 mr-1"></i>
                    <span>CBS Platform v3.1.2</span>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="flex items-center"><i class="fa-solid fa-map-pin text-emerald-600 mr-1"></i>GIS</span>
                    <span class="flex items-center"><i class="fa-solid fa-chart-area text-emerald-600 mr-1"></i>Analiz</span>
                    <span class="flex items-center"><i class="fa-solid fa-layer-group text-emerald-600 mr-1"></i>Katman</span>
                </div>
            </div>
            <div class="text-center text-[10px] text-zinc-500 pt-1 pb-2 border-t border-zinc-100">
                <i class="fa-solid fa-building-columns text-emerald-600 mr-1"></i>
                <span>Ortaöğretim Genel Müdürlüğü tarafından geliştirilmiştir.</span>
            </div>
        </div>
    `,

    /**
     * Complete Sidebar - Tüm bileşenleri birleştirir
     */
    render: () => `
        ${SidebarTemplates.header()}
        <div class="flex-grow overflow-y-auto sidebar-content bg-white px-2.5 py-4 pb-20 space-y-4">
            ${SidebarTemplates.projectPurpose()}
            ${SidebarTemplates.cbsTools()}
            ${SidebarTemplates.dataCreation()}
            ${SidebarTemplates.dataCatalog()}
            ${SidebarTemplates.visualizationWizard()}
            ${SidebarTemplates.projectManagement()}
        </div>
        ${SidebarTemplates.footer()}
    `
};

/**
 * Sidebar Renderer - Sidebar'ı DOM'a render eder
 */
function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
        if (window.Logger && typeof window.Logger.error === 'function') {
            window.Logger.error('Sidebar element bulunamadı!');
        } else {
            console.error('Sidebar element bulunamadı!');
        }
        return;
    }
    
    sidebar.innerHTML = SidebarTemplates.render();
    if (window.Logger && typeof window.Logger.log === 'function') {
        window.Logger.log('✅ Sidebar başarıyla render edildi');
    } else {
        console.log('✅ Sidebar başarıyla render edildi');
    }
}

// DOMContentLoaded event'inde sidebar'ı render et
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSidebar);
} else {
    // DOM zaten yüklendiyse hemen render et
    renderSidebar();
}

// Browser global export
if (typeof window !== 'undefined') {
    window.SidebarTemplates = { renderSidebar };
}
