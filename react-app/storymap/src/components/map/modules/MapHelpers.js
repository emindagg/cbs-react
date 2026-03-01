/**
 * MapHelpers - Harita işlemleri için yardımcı fonksiyonlar
 */

export const MapHelpers = {
    // Koordinat dizisinin sınırlarını hesapla
    calculateBounds(coords) {
        let minLng = Infinity, maxLng = -Infinity;
        let minLat = Infinity, maxLat = -Infinity;

        coords.forEach(coord => {
            if (Array.isArray(coord) && coord.length >= 2) {
                minLng = Math.min(minLng, coord[0]);
                maxLng = Math.max(maxLng, coord[0]);
                minLat = Math.min(minLat, coord[1]);
                maxLat = Math.max(maxLat, coord[1]);
            }
        });

        return { minLng, maxLng, minLat, maxLat };
    },

    // Bounds'a göre uygun zoom seviyesini hesapla
    calculateZoomForBounds(bounds) {
        const lngDiff = bounds.maxLng - bounds.minLng;
        const latDiff = bounds.maxLat - bounds.minLat;
        const maxDiff = Math.max(lngDiff, latDiff);

        // Yaklaşık zoom hesaplama
        if (maxDiff > 10) return 5;
        if (maxDiff > 5) return 6;
        if (maxDiff > 2) return 8;
        if (maxDiff > 1) return 9;
        if (maxDiff > 0.5) return 10;
        if (maxDiff > 0.2) return 12;
        if (maxDiff > 0.1) return 13;
        if (maxDiff > 0.05) return 14;
        if (maxDiff > 0.01) return 15;
        return 16;
    },

    // İki nokta arası mesafe hesapla (km)
    calculateDistance(coord1, coord2) {
        const R = 6371; // Dünya yarıçapı km
        const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
        const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // Daire koordinatları oluştur
    createCircleCoords(center, radiusKm, points = 64) {
        const coords = [];
        const km = radiusKm;
        
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const dx = km * Math.cos(angle);
            const dy = km * Math.sin(angle);
            
            // km'yi derece'ye çevir (yaklaşık)
            const lat = center[1] + (dy / 111.32);
            const lng = center[0] + (dx / (111.32 * Math.cos(center[1] * Math.PI / 180)));
            
            coords.push([lng, lat]);
        }
        
        return coords;
    }
};
