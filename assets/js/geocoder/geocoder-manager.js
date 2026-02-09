/**
 * Geocoder Manager - Atlas Harita Arama Entegrasyonu
 * HGM Atlas API kullanarak yer arama ve haritada gösterim
 */

class GeocoderManager {
    constructor(map) {
        this.map = map;
        this.geocoder = null;
        this.searchMarker = null;
        this.searchResultsLayer = 'search-results';
        this.init();
    }

    /**
     * Geocoder'ı başlat
     */
    init() {
        if (typeof Geocoder === 'undefined') {
            console.error('Geocoder kütüphanesi yüklenemedi');
            return;
        }

        // HGM Atlas API endpoint
        this.geocoder = new Geocoder('https://atlas.harita.gov.tr/search_yeni');
        console.log('Geocoder Manager başlatıldı');
    }

    /**
     * Yer arama
     * @param {string} query - Arama sorgusu
     * @param {Function} onSuccess - Başarılı arama sonrası çağrılacak fonksiyon
     * @param {Function} onError - Hata durumunda çağrılacak fonksiyon
     */
    search(query, onSuccess, onError) {
        if (!this.geocoder) {
            console.error('Geocoder başlatılmamış');
            if (onError) onError('Geocoder başlatılmamış');
            return;
        }

        if (!query || query.trim() === '') {
            if (onError) onError('Lütfen bir arama terimi girin');
            return;
        }

        // Mevcut harita merkezi koordinatlarını al
        const center = this.map.getCenter();

        this.geocoder.search({
            query: query.trim(),
            lng: center.lng,
            lat: center.lat,
            onload: (response, error) => {
                if (error) {
                    console.error('Arama hatası:', response);
                    if (onError) onError('Arama sırasında bir hata oluştu');
                    return;
                }

                if (!response.features || response.features.length === 0) {
                    if (onError) onError(`"${query}" için sonuç bulunamadı`);
                    return;
                }

                if (onSuccess) onSuccess(response);
            }
        });
    }

    /**
     * Arama sonuçlarını haritada göster
     * @param {Object} results - GeoJSON sonuçları
     */
    displayResults(results) {
        if (!results || !results.features || results.features.length === 0) {
            return;
        }

        // İlk sonuca odaklan
        const firstResult = results.features[0];
        this.focusOnResult(firstResult);

        // Sonuçları haritada işaretle (birden fazla sonuç varsa)
        if (results.features.length > 1) {
            this.addResultsToMap(results);
        }
    }

    /**
     * Arama sonuçlarını dropdown listesinde göster
     * @param {Object} results - GeoJSON sonuçları
     * @param {Function} onResultClick - Sonuca tıklandığında çağrılacak fonksiyon
     * @returns {string} HTML string
     */
    renderResultsDropdown(results, _onResultClick) {
        if (!results || !results.features || results.features.length === 0) {
            return '<div class="geocoder-no-results">Sonuç bulunamadı</div>';
        }

        let html = '<div class="geocoder-results-list">';

        results.features.forEach((feature, index) => {
            const props = feature.properties || {};

            // Atlas API'den gelen veri yapısı:
            // name: Ana yer ismi
            // locality: Mahalle/semt
            // county: İlçe
            // region: İl/Şehir
            let name = props.name || props.place_name || props.text || 'İsimsiz konum';
            let address = this.formatAddress(props);

            html += `
                <div class="geocoder-result-item" data-index="${index}">
                    <div class="geocoder-result-icon">
                        <i class="fa-solid fa-location-dot" style="color: #3b82f6;"></i>
                    </div>
                    <div class="geocoder-result-content">
                        <div class="geocoder-result-name">${this.escapeHtml(name)}</div>
                        ${address ? `<div class="geocoder-result-address">${this.escapeHtml(address)}</div>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * Adres bilgisini formatla
     * @param {Object} properties - Feature properties
     * @returns {string} Formatlanmış adres
     */
    formatAddress(properties) {
        const parts = [];

        // Atlas API field'ları:
        // locality: Mahalle/semt
        // county: İlçe
        // region: İl

        // Mahalle/Semt (locality)
        if (properties.locality && properties.locality !== properties.name) {
            parts.push(properties.locality);
        }

        // İlçe (county)
        if (properties.county && properties.county !== properties.name) {
            parts.push(properties.county);
        }

        // İl/Şehir (region)
        if (properties.region && properties.region !== properties.name) {
            parts.push(properties.region);
        }

        // Eski format field'ları da kontrol et (geriye dönük uyumluluk)
        if (parts.length === 0) {
            if (properties.mahalle && properties.mahalle !== properties.name) {
                parts.push(properties.mahalle);
            }
            if (properties.ilce && properties.ilce !== properties.name) {
                parts.push(properties.ilce);
            }
            if (properties.il && properties.il !== properties.name) {
                parts.push(properties.il);
            }
        }

        // place_name varsa ve name'den farklıysa
        if (parts.length === 0 && properties.place_name && properties.place_name !== properties.name) {
            // Virgüllerle ayrılmış place_name'i parçala
            const placeParts = properties.place_name.split(',').map(p => p.trim());
            if (placeParts.length > 1) {
                // İlk kısmı (name) atla, geri kalanı adres olarak kullan
                return placeParts.slice(1).join(', ');
            }
        }

        return parts.filter(p => p).join(', ');
    }

    /**
     * HTML karakterlerini escape et (XSS koruması)
     * @param {string} text - Escape edilecek metin
     * @returns {string} Güvenli metin
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Belirli bir sonuca odaklan ve işaretle
     * @param {Object} feature - GeoJSON feature
     */
    focusOnResult(feature) {
        if (!feature || !feature.geometry) {
            return;
        }

        const geometry = feature.geometry;
        const properties = feature.properties || {};

        // Koordinatları al
        let coordinates;
        let bounds;

        if (geometry.type === 'Point') {
            coordinates = geometry.coordinates;

            // Noktaya yakınlaş
            this.map.flyTo({
                center: coordinates,
                zoom: 14,
                duration: 1500,
                essential: true
            });

            // Marker ekle
            this.addSearchMarker(coordinates, properties);
        } else if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
            // Poligon sınırlarına yakınlaş
            bounds = this.getBounds(geometry);
            if (bounds) {
                this.map.fitBounds(bounds, {
                    padding: 50,
                    duration: 1500,
                    essential: true
                });
            }
        }
    }

    /**
     * Arama sonucu için marker ekle
     * @param {Array} coordinates - [lng, lat]
     * @param {Object} properties - Yer özellikleri
     */
    addSearchMarker(coordinates, properties) {
        // Eski marker'ı kaldır
        this.removeSearchMarker();

        // Marker elementi oluştur
        const el = document.createElement('div');
        el.className = 'search-marker';
        el.innerHTML = '<i class="fa-solid fa-location-dot" style="color: #ef4444; font-size: 32px;"></i>';

        // Popup içeriği - Minimal stil, sadece kalın siyah text (2 satıra sığabilir)
        const placeName = properties.name || properties.place_name || 'Seçili konum';
        const popupHTML = `
            <div style="
                font-family: system-ui, -apple-system, sans-serif;
                font-weight: 700;
                font-size: 14px;
                color: #000;
                max-width: 200px;
                line-height: 1.3;
                text-align: center;
                text-shadow: 0 0 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.8);
            ">${placeName}</div>
        `;

        // MapLibre Marker oluştur
        this.searchMarker = new maplibregl.Marker({
            element: el,
            anchor: 'bottom'
        })
            .setLngLat(coordinates)
            .setPopup(new maplibregl.Popup({
                offset: [0, -45], // Text'i marker'ın üstüne taşı
                closeButton: false,
                closeOnClick: false,
                className: 'geocoder-marker-popup'
            }).setHTML(popupHTML))
            .addTo(this.map);

        // Popup'ı otomatik aç
        this.searchMarker.togglePopup();
    }

    /**
     * Arama marker'ını kaldır
     */
    removeSearchMarker() {
        if (this.searchMarker) {
            this.searchMarker.remove();
            this.searchMarker = null;
        }
    }

    /**
     * Tüm arama sonuçlarını haritada göster
     * @param {Object} results - GeoJSON sonuçları
     */
    addResultsToMap(results) {
        // Kaynak varsa güncelle, yoksa ekle
        if (this.map.getSource(this.searchResultsLayer)) {
            this.map.getSource(this.searchResultsLayer).setData(results);
        } else {
            this.map.addSource(this.searchResultsLayer, {
                type: 'geojson',
                data: results
            });

            // Layer ekle
            this.map.addLayer({
                id: this.searchResultsLayer,
                type: 'circle',
                source: this.searchResultsLayer,
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#3b82f6',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2
                }
            });
        }
    }

    /**
     * Arama sonuçlarını temizle
     */
    clearResults() {
        this.removeSearchMarker();

        if (this.map.getLayer(this.searchResultsLayer)) {
            this.map.removeLayer(this.searchResultsLayer);
        }

        if (this.map.getSource(this.searchResultsLayer)) {
            this.map.removeSource(this.searchResultsLayer);
        }
    }

    /**
     * Geometrinin sınırlarını hesapla
     * @param {Object} geometry - GeoJSON geometry
     * @returns {Array} bounds - [[minLng, minLat], [maxLng, maxLat]]
     */
    getBounds(geometry) {
        let coords = [];

        if (geometry.type === 'Polygon') {
            coords = geometry.coordinates[0];
        } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach(polygon => {
                coords = coords.concat(polygon[0]);
            });
        }

        if (coords.length === 0) return null;

        const lngs = coords.map(c => c[0]);
        const lats = coords.map(c => c[1]);

        return [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)]
        ];
    }

    /**
     * Reverse geocoding - Koordinatlardan yer bilgisi al
     * @param {number} lng - Boylam
     * @param {number} lat - Enlem
     * @param {Function} onSuccess - Başarılı sonuç callback
     * @param {Function} onError - Hata callback
     */
    reverse(lng, lat, onSuccess, onError) {
        if (!this.geocoder) {
            console.error('Geocoder başlatılmamış');
            if (onError) onError('Geocoder başlatılmamış');
            return;
        }

        this.geocoder.reverse({
            lng: lng,
            lat: lat,
            type: 0, // 0: Tüm sonuçlar
            onload: (response, error) => {
                if (error) {
                    console.error('Reverse geocoding hatası:', response);
                    if (onError) onError('Konum bilgisi alınamadı');
                    return;
                }

                console.log('Reverse geocoding sonucu:', response);
                if (onSuccess) onSuccess(response);
            }
        });
    }
}

// Global olarak erişilebilir yap
window.GeocoderManager = GeocoderManager;
