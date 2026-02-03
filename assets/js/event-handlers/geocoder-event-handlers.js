/**
 * Geocoder Event Handlers
 * Arama kutusu ve geocoder etkileşimleri
 */

(function() {
    'use strict';

    let geocoderManager = null;
    let currentResults = null; // Mevcut arama sonuçlarını sakla
    let searchTimeout = null; // Debounce için timeout

    /**
     * Geocoder event handler'larını başlat
     */
    function initGeocoderEventHandlers() {
        // Harita yüklenene kadar bekle
        if (!window.map || !window.map.loaded()) {
            console.log('Geocoder: Harita yükleniyor, bekleniyor...');
            setTimeout(initGeocoderEventHandlers, 500);
            return;
        }

        // GeocoderManager'ı başlat
        geocoderManager = new GeocoderManager(window.map);

        // DOM elementleri
        const toggleBtn = document.getElementById('geocoder-toggle-btn');
        const inputContainer = document.getElementById('geocoder-input-container');
        const searchInput = document.getElementById('geocoder-search-input');
        const searchBtn = document.getElementById('geocoder-search-btn');
        const closeBtn = document.getElementById('geocoder-close-btn');
        const loadingIndicator = document.getElementById('geocoder-loading');
        const errorContainer = document.getElementById('geocoder-error');
        const errorText = document.getElementById('geocoder-error-text');
        const resultsDropdown = document.getElementById('geocoder-results-dropdown');

        if (!searchInput || !searchBtn || !resultsDropdown || !toggleBtn || !inputContainer || !closeBtn) {
            console.error('Geocoder: Arama elementleri bulunamadı');
            return;
        }

        /**
         * Arama kutusunu aç
         */
        function openSearchBox() {
            toggleBtn.classList.add('hidden');
            inputContainer.classList.remove('hidden', 'closing');
            
            // Layers, Globe ve Storymap butonlarını sağa kaydır
            const layersBtn = document.getElementById('layers-toggle-btn');
            const globeBtn = document.getElementById('globe-toggle-btn');
            const storymapBtn = document.getElementById('storymap-toggle-btn');
            if (layersBtn) layersBtn.classList.add('search-open');
            if (globeBtn) globeBtn.classList.add('search-open');
            if (storymapBtn) storymapBtn.classList.add('search-open');
            
            // Katman panelini kapat
            if (window.layerPanel && window.layerPanel.isOpen) {
                window.layerPanel.togglePanel();
                if (layersBtn) layersBtn.classList.remove('active');
            }
            
            // Input'a focus ver
            searchInput.focus();
        }

        /**
         * Arama kutusunu kapat
         */
        function closeSearchBox() {
            inputContainer.classList.add('hidden');
            toggleBtn.classList.remove('hidden');
            
            // Layers, Globe ve Storymap butonlarını sola geri getir
            const layersBtn = document.getElementById('layers-toggle-btn');
            const globeBtn = document.getElementById('globe-toggle-btn');
            const storymapBtn = document.getElementById('storymap-toggle-btn');
            if (layersBtn) layersBtn.classList.remove('search-open');
            if (globeBtn) globeBtn.classList.remove('search-open');
            if (storymapBtn) storymapBtn.classList.remove('search-open');
            
            // Katman panelini kapat
            if (window.layerPanel && window.layerPanel.isOpen) {
                window.layerPanel.togglePanel();
                if (layersBtn) layersBtn.classList.remove('active');
            }

            // Temizle
            clearSearch();
        }

        /**
         * Arama fonksiyonu
         */
        function performSearch() {
            const query = searchInput.value.trim();

            if (!query || query.length < 3) {
                hideDropdown();
                if (query.length > 0 && query.length < 3) {
                    showError('En az 3 karakter girin');
                }
                return;
            }

            // UI durumunu güncelle
            showLoading();
            hideError();
            hideDropdown();

            // Aramayı yap
            geocoderManager.search(
                query,
                // Başarılı callback
                (results) => {
                    hideLoading();
                    currentResults = results;

                    // Dropdown ile sonuçları göster
                    showResultsDropdown(results);
                },
                // Hata callback
                (error) => {
                    hideLoading();
                    showError(error);
                    hideDropdown();
                }
            );
        }

        /**
         * Dropdown'da sonuçları göster
         */
        function showResultsDropdown(results) {
            const html = geocoderManager.renderResultsDropdown(results);
            resultsDropdown.innerHTML = html;
            resultsDropdown.classList.remove('hidden');

            // Sonuç öğelerine click event ekle
            const resultItems = resultsDropdown.querySelectorAll('.geocoder-result-item');
            resultItems.forEach((item, index) => {
                item.addEventListener('click', () => {
                    selectResult(index);
                });
            });
        }

        /**
         * Bir sonucu seç ve haritada göster
         */
        function selectResult(index) {
            if (!currentResults || !currentResults.features || !currentResults.features[index]) {
                return;
            }

            const selectedFeature = currentResults.features[index];

            // Haritada göster
            geocoderManager.focusOnResult(selectedFeature);

            // Input'a seçilen yerin adını yaz
            const props = selectedFeature.properties || {};
            const name = props.name || props.place_name || '';
            if (name) {
                searchInput.value = name;
            }

            // Dropdown'ı gizle
            hideDropdown();
        }

        /**
         * Dropdown'ı göster
         */
        function showDropdown() {
            resultsDropdown.classList.remove('hidden');
        }

        /**
         * Dropdown'ı gizle
         */
        function hideDropdown() {
            resultsDropdown.classList.add('hidden');
        }

        /**
         * Arama sonuçlarını ve marker'ı temizle
         */
        function clearSearch() {
            // Timeout'u iptal et
            if (searchTimeout) {
                clearTimeout(searchTimeout);
                searchTimeout = null;
            }

            searchInput.value = '';
            geocoderManager.clearResults();
            hideError();
            hideDropdown();
            currentResults = null;
        }

        /**
         * Yükleniyor göstergesini göster
         */
        function showLoading() {
            if (loadingIndicator) {
                loadingIndicator.classList.remove('hidden');
            }
            searchBtn.disabled = true;
        }

        /**
         * Yükleniyor göstergesini gizle
         */
        function hideLoading() {
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            searchBtn.disabled = false;
        }

        /**
         * Hata mesajı göster
         */
        function showError(message) {
            if (errorContainer && errorText) {
                errorText.textContent = message;
                errorContainer.classList.remove('hidden');
            }
        }

        /**
         * Hata mesajını gizle
         */
        function hideError() {
            if (errorContainer) {
                errorContainer.classList.add('hidden');
            }
        }

        // Event listener'ları ekle

        // Toggle butonu - Arama kutusunu aç
        toggleBtn.addEventListener('click', openSearchBox);

        // Close butonu - Arama kutusunu kapat
        closeBtn.addEventListener('click', closeSearchBox);

        // Arama butonu tıklama
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query.length >= 3) {
                performSearch();
            } else if (query.length > 0) {
                showError('En az 3 karakter girin');
            } else {
                showError('Lütfen bir arama terimi girin');
            }
        });

        // Enter tuşu ile arama
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Form submit'i engelle
                const query = searchInput.value.trim();
                if (query.length >= 3) {
                    // Timeout'u iptal et ve hemen ara
                    if (searchTimeout) {
                        clearTimeout(searchTimeout);
                        searchTimeout = null;
                    }
                    performSearch();
                } else if (query.length > 0) {
                    showError('En az 3 karakter girin');
                }
            }
        });

        // Input değiştiğinde - Canlı arama (3+ karakter)
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();

            // Timeout'u temizle (debounce)
            if (searchTimeout) {
                clearTimeout(searchTimeout);
                searchTimeout = null;
            }
            
            // Katman panelini kapat
            const layersBtn = document.getElementById('layers-toggle-btn');
            if (window.layerPanel && window.layerPanel.isOpen) {
                window.layerPanel.togglePanel();
                if (layersBtn) layersBtn.classList.remove('active');
            }

            if (query === '') {
                // Boşsa dropdown'ı gizle
                hideDropdown();
                currentResults = null;
            } else {
                // 3 veya daha fazla karakter varsa otomatik ara
                if (query.length >= 3) {
                    // 500ms gecikme ile ara (kullanıcı yazmayı bitirene kadar bekle)
                    searchTimeout = setTimeout(() => {
                        performSearch();
                    }, 500);
                } else {
                    // 3 karakterden az ise dropdown'ı gizle
                    hideDropdown();
                }
            }
        });

        // ESC tuşu ile dropdown kapat veya arama kutusunu kapat
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!resultsDropdown.classList.contains('hidden')) {
                    // Dropdown açıksa sadece dropdown'ı kapat
                    hideDropdown();
                } else {
                    // Dropdown kapalıysa arama kutusunu kapat
                    closeSearchBox();
                }
            }
        });

        // Dropdown dışına tıklandığında kapat
        document.addEventListener('click', (e) => {
            const searchContainer = document.getElementById('search-container');
            if (searchContainer && !searchContainer.contains(e.target)) {
                hideDropdown();
            }
        });

        // Input'a focus olunca dropdown'ı göster (eğer sonuçlar varsa)
        searchInput.addEventListener('focus', () => {
            if (currentResults && currentResults.features && currentResults.features.length > 0) {
                showDropdown();
            }
        });

        console.log('✅ Geocoder event handlers başlatıldı');
    }

    // Sayfa yüklendiğinde başlat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGeocoderEventHandlers);
    } else {
        initGeocoderEventHandlers();
    }

    // Global erişim için
    window.initGeocoderEventHandlers = initGeocoderEventHandlers;
})();
