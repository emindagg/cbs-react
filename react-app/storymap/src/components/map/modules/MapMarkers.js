/**
 * MapMarkers - Marker yönetimi
 */

export class MapMarkers {
    constructor(map) {
        this.map = map;
        this.markers = [];
        this.currentClickHandler = null;
    }

    // Marker ekle
    addMarker(coords, options = {}) {
        if (!this.map) return null;

        const el = document.createElement('div');
        el.className = 'map-marker';
        
        const isTeardrop = options.shape === 'teardrop';
        const isNumber = options.isNumber || false;
        
        if (isTeardrop) {
            // Damla şekli (%35 büyütülmüş, beyaz border)
            el.style.width = '27px';
            el.style.height = '36px';
            el.style.backgroundColor = options.color || '#10b981';
            el.style.borderRadius = '50% 50% 50% 0';
            el.style.transform = 'rotate(-45deg)';
            el.style.border = '2px solid #fff';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';

            // İkon ekle
            const icon = document.createElement('i');
            icon.className = `fa-solid ${options.icon || 'fa-location-dot'}`;
            icon.style.color = 'white';
            icon.style.fontSize = '11px';
            icon.style.transform = 'rotate(45deg)'; // Damla döndürüldüğü için ikonu düzelt
            el.appendChild(icon);
        } else if (isNumber) {
            // Sayı şekli (%35 büyütülmüş, beyaz border)
            el.style.width = '27px';
            el.style.height = '27px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = options.color || '#3b82f6';
            el.style.border = '2px solid #fff';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';

            // Sayı ekle
            const numberSpan = document.createElement('span');
            numberSpan.className = 'marker-number';
            numberSpan.textContent = options.number || '1';
            numberSpan.style.color = 'white';
            numberSpan.style.fontSize = '12px';
            numberSpan.style.fontWeight = 'bold';
            numberSpan.style.fontFamily = 'Arial, sans-serif';
            el.appendChild(numberSpan);
        } else {
            // Yuvarlak şekil (%35 büyütülmüş, beyaz border)
            el.style.width = '26px';
            el.style.height = '26px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = options.color || '#3b82f6';
            el.style.border = '2px solid #fff';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';

            // İkon ekle
            const icon = document.createElement('i');
            icon.className = `fa-solid ${options.icon || 'fa-map-marker-alt'}`;
            icon.style.color = 'white';
            icon.style.fontSize = '10px';
            el.appendChild(icon);
        }

        const marker = new maplibregl.Marker({ element: el })
            .setLngLat(coords)
            .addTo(this.map);

        // Popup ekle
        if (options.popup) {
            const popup = new maplibregl.Popup({ offset: 25 })
                .setHTML(`<div style="padding: 5px; font-size: 14px;">${options.popup}</div>`);
            marker.setPopup(popup);
        }

        // Options'ı marker nesnesine ekle (daha sonra kullanmak için)
        marker._options = options;
        
        this.markers.push(marker);
        return marker;
    }

    // Metin marker ekle
    addTextMarker(coords, text) {
        const el = document.createElement('div');
        el.className = 'map-text-marker';
        
        // Sadece ikon göster
        el.innerHTML = '<i class="fa-solid fa-font"></i>';
        el.style.cssText = `
            background: #3b82f6;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 9px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.25);
            cursor: pointer;
            pointer-events: auto;
        `;

        const marker = new maplibregl.Marker({ element: el })
            .setLngLat(coords)
            .addTo(this.map);

        this.markers.push(marker);
        return marker;
    }

    // Marker ekleme modunu aktif et
    enableMarkerMode(callback, onFinish) {
        this.disableMode();
        
        if (!this.map) return;

        const clickHandler = (e) => {
            const coords = [e.lngLat.lng, e.lngLat.lat];
            const marker = this.addMarker(coords, {
                color: '#ef4444',
                popup: 'Yeni Nokta'
            });
            
            // Tek nokta eklendikten sonra modu kapat
            this.disableMode();
            if (onFinish) onFinish();
            
            if (callback) {
                callback({
                    type: 'marker',
                    coords: coords,
                    marker: marker
                });
            }
        };

        this.map.on('click', clickHandler);
        this.map.getCanvas().style.cursor = 'crosshair';
        this.currentClickHandler = clickHandler;
    }

    // Modu devre dışı bırak
    disableMode() {
        if (this.map && this.currentClickHandler) {
            this.map.off('click', this.currentClickHandler);
            this.map.getCanvas().style.cursor = '';
            this.currentClickHandler = null;
        }
    }

    // Tüm markerları temizle
    clearMarkers() {
        this.markers.forEach(m => m.remove());
        this.markers = [];
    }

    // Belirli bir markerı sil
    removeMarker(marker) {
        if (!marker) return;
        marker.remove();
        this.markers = this.markers.filter(m => m !== marker);
    }

    // Marker listesini güncelle (örn: basemap değişiminden sonra)
    setMarkers(newMarkers) {
        this.markers = newMarkers;
    }

    getMarkers() {
        return this.markers;
    }
}
