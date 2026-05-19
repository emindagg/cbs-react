import { MapHelpers } from './MapHelpers.js';

/**
 * RouteManager - Rota hikâyesi özellikleri yönetimi
 *
 * Bu modül Mapog benzeri rota hikâyesi özellikleri sağlar:
 * - Noktaları otomatik bağlama (Location Connection Tool)
 * - Günlük renk kategorilendirmesi
 * - Mesafe hesaplama
 * - CSV/Excel import
 */
export class RouteManager {
    constructor(map, template) {
        this.map = map;
        this.template = template;
        this.routePoints = [];
        this.routeLineId = 'main-route-line';
        this.isAutoConnectEnabled = template?.enableAutoConnect || false;
        this.isDayColorsEnabled = template?.enableDayColors || false;
        this.dayColors = template?.dayColors || this.getDefaultDayColors();
        this.useRealRouting = true; // OSRM routing kullan
        this.routingCache = new Map(); // Bellekte cache
        this.onDistanceUpdate = null; // Mesafe güncellendiğinde çağrılacak callback
    }

    /**
     * Varsayılan günlük renkler
     */
    getDefaultDayColors() {
        return {
            1: "#ef4444", // Kırmızı - 1. Gün
            2: "#f59e0b", // Turuncu - 2. Gün
            3: "#10b981", // Yeşil - 3. Gün
            4: "#3b82f6", // Mavi - 4. Gün
            5: "#8b5cf6", // Mor - 5. Gün
            6: "#ec4899", // Pembe - 6. Gün
            7: "#14b8a6"  // Teal - 7. Gün
        };
    }

    /**
     * Ziyaret gününe göre renk döndür
     */
    getColorForDay(day) {
        if (!this.isDayColorsEnabled) {
            return '#3b82f6'; // Varsayılan mavi
        }
        return this.dayColors[day] || '#6b7280'; // Gri (varsayılan)
    }

    /**
     * Rota noktası ekle
     */
    async addRoutePoint(point) {
        // Önceki noktaya mesafe hesapla
        if (this.routePoints.length > 0) {
            const prevPoint = this.routePoints[this.routePoints.length - 1];
            const distance = MapHelpers.calculateDistance(
                prevPoint.coords,
                point.coords
            );
            prevPoint.distanceToNext = Math.round(distance * 10) / 10; // km, 1 ondalık
        }

        this.routePoints.push(point);

        // Otomatik bağlama açıksa rotayı güncelle
        if (this.isAutoConnectEnabled && this.routePoints.length >= 2) {
            await this.updateRouteLine();
        }

        return point;
    }

    /**
     * Tüm noktalar için mesafeleri hesapla
     */
    calculateAllDistances() {
        for (let i = 0; i < this.routePoints.length - 1; i++) {
            const distance = MapHelpers.calculateDistance(
                this.routePoints[i].coords,
                this.routePoints[i + 1].coords
            );
            this.routePoints[i].distanceToNext = Math.round(distance * 10) / 10;
        }

        // Son nokta için mesafe null
        if (this.routePoints.length > 0) {
            this.routePoints[this.routePoints.length - 1].distanceToNext = null;
        }
    }

    /**
     * OSRM API ile gerçek rota çek
     * @returns {Object|null} { coords: [[lon,lat]...], snappedPoints: [[lon,lat], [lon,lat]] }
     */
    async fetchRealRoute(point1, point2) {
        // Cache kontrolü
        const cacheKey = `${point1[0]},${point1[1]}_${point2[0]},${point2[1]}`;
        if (this.routingCache.has(cacheKey)) {
            return this.routingCache.get(cacheKey);
        }

        try {
            // OSRM API URL
            const url = `https://router.project-osrm.org/route/v1/driving/${point1[0]},${point1[1]};${point2[0]},${point2[1]}?overview=full&geometries=geojson`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('OSRM API hatası');
            }

            const data = await response.json();

            if (data.routes && data.routes.length > 0 && data.waypoints) {
                const route = data.routes[0];
                const routeCoords = route.geometry.coordinates;

                // OSRM'nin yola snap ettiği (yapıştırdığı) koordinatlar
                const snappedPoints = data.waypoints.map(wp => wp.location);

                // Kullanıcının eklediği noktalardan başlasın, oraya bitsin
                // İlk ve son koordinatı kullanıcının orijinal koordinatları ile değiştir
                if (routeCoords.length > 0) {
                    routeCoords[0] = point1; // Başlangıç: kullanıcının tıkladığı nokta
                    routeCoords[routeCoords.length - 1] = point2; // Bitiş: kullanıcının tıkladığı nokta
                }

                const result = {
                    coords: routeCoords,
                    snappedPoints: snappedPoints // [başlangıç, bitiş] - OSRM'nin bulduğu yol noktaları
                };

                // Cache'e kaydet
                this.routingCache.set(cacheKey, result);

                return result;
            }

            throw new Error('Rota bulunamadı');
        } catch (error) {
            console.warn('[RouteManager] OSRM routing başarısız, düz çizgi kullanılıyor:', error);
            return null;
        }
    }

    /**
     * Tüm nokta çiftleri için gerçek rotaları al
     * @returns {Object} { coords: [[lon,lat]...], snappedCoords: Map<pointId, [lon,lat]> }
     */
    async fetchAllRoutes() {
        if (this.routePoints.length < 2) return { coords: [], snappedCoords: new Map() };

        const allRouteCoords = [];
        const snappedCoords = new Map(); // pointId -> yola snap edilmiş koordinat

        for (let i = 0; i < this.routePoints.length - 1; i++) {
            const point1 = this.routePoints[i];
            const point2 = this.routePoints[i + 1];

            if (this.useRealRouting) {
                const routeData = await this.fetchRealRoute(point1.coords, point2.coords);

                if (routeData && routeData.coords) {
                    // İlk nokta için snap edilmiş koordinatı kaydet
                    if (i === 0 && routeData.snappedPoints && routeData.snappedPoints[0]) {
                        snappedCoords.set(point1.id, routeData.snappedPoints[0]);
                    }

                    // İkinci nokta için her zaman snap edilmiş koordinatı kaydet
                    if (routeData.snappedPoints && routeData.snappedPoints[1]) {
                        snappedCoords.set(point2.id, routeData.snappedPoints[1]);
                    }

                    // İlk segment değilse, son noktayı tekrar ekleme (duplikasyon önleme)
                    if (i > 0 && allRouteCoords.length > 0) {
                        allRouteCoords.push(...routeData.coords.slice(1));
                    } else {
                        allRouteCoords.push(...routeData.coords);
                    }
                } else {
                    // Fallback: düz çizgi
                    if (i === 0) {
                        allRouteCoords.push(point1.coords);
                    }
                    allRouteCoords.push(point2.coords);
                }
            } else {
                // Real routing kapalıysa düz çizgi
                if (i === 0) {
                    allRouteCoords.push(point1.coords);
                }
                allRouteCoords.push(point2.coords);
            }
        }

        return { coords: allRouteCoords, snappedCoords };
    }

    /**
     * Rota çizgisini güncelle
     * @param {Array} points - Opsiyonel: Dışarıdan rota noktaları (view mode için)
     */
    async updateRouteLine(points = null) {
        // Eğer points parametresi verilmişse onu kullan
        if (points && points.length >= 2) {
            this.routePoints = points;
        }

        if (!this.map) {
            return;
        }

        // Eğer 2'den az nokta varsa rota çizgisini sil ve çık
        if (this.routePoints.length < 2) {
            this.removeRouteLine();
            return;
        }

        // Gerçek rotayı al (OSRM)
        const { coords } = await this.fetchAllRoutes();

        // Eski source/layer'ı temizle
        this.removeRouteLine();

        // Toplam mesafeyi hesapla
        const totalDistance = this.getTotalDistance();

        // Yeni route line ekle
        this.map.addSource(this.routeLineId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {
                    distance: totalDistance.toFixed(2)
                },
                geometry: {
                    type: 'LineString',
                    coordinates: coords
                }
            }
        });

        // Ana rota çizgisi (geniş, yarı saydam) - %50 incelmiş
        this.map.addLayer({
            id: `${this.routeLineId}-bg`,
            type: 'line',
            source: this.routeLineId,
            paint: {
                'line-color': '#000000',
                'line-width': 3,
                'line-opacity': 0.3
            },
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            }
        });

        // İnce üst çizgi - %50 incelmiş
        this.map.addLayer({
            id: `${this.routeLineId}-top`,
            type: 'line',
            source: this.routeLineId,
            paint: {
                'line-color': '#000000',
                'line-width': 1.25,
                'line-opacity': 0.9
            },
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            }
        });

        // Mesafe etiketi ekle (rota ortasında)
        this.addDistanceLabel(coords, totalDistance);

        // Ok işaretleri (opsiyonel - yön gösterimi)
        this.addRouteArrows(coords);

        // Mesafe güncellendiğinde callback çağır
        if (this.onDistanceUpdate) {
            this.onDistanceUpdate(totalDistance);
        }
    }

    /**
     * Rota ortasına mesafe etiketi ekle
     */
    addDistanceLabel(coords, totalDistance) {
        if (!this.map || coords.length < 2) return;

        // Rota ortasındaki noktayı bul
        const midIndex = Math.floor(coords.length / 2);
        const midPoint = coords[midIndex];

        // Mesafe etiketi için GeoJSON point
        const labelSourceId = `${this.routeLineId}-label-source`;
        const labelLayerId = `${this.routeLineId}-label`;

        // Eski label'ı temizle
        if (this.map.getLayer(labelLayerId)) {
            this.map.removeLayer(labelLayerId);
        }
        if (this.map.getSource(labelSourceId)) {
            this.map.removeSource(labelSourceId);
        }

        // Yeni label source ekle
        this.map.addSource(labelSourceId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: midPoint
                },
                properties: {
                    distance: `${totalDistance.toFixed(2)} km`
                }
            }
        });

        // Label layer ekle
        this.map.addLayer({
            id: labelLayerId,
            type: 'symbol',
            source: labelSourceId,
            layout: {
                'text-field': ['get', 'distance'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 12,
                'text-offset': [0, 0],
                'text-anchor': 'center'
            },
            paint: {
                'text-color': '#000000',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2,
                'text-halo-blur': 1
            }
        });
    }

    /**
     * Rota üzerinde yön oklari ekle
     */
    addRouteArrows(coords) {
        if (coords.length < 2) return;

        const arrowId = `${this.routeLineId}-arrows`;

        // Eski arrow layer'ını temizle
        if (this.map.getLayer(arrowId)) {
            this.map.removeLayer(arrowId);
        }

        // Arrow symbolü ekle
        this.map.addLayer({
            id: arrowId,
            type: 'symbol',
            source: this.routeLineId,
            layout: {
                'symbol-placement': 'line',
                'symbol-spacing': 100,
                'icon-image': 'arrow', // Varsa ok ikonu kullan
                'icon-size': 0.5,
                'icon-rotate': 90,
                'icon-rotation-alignment': 'map',
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
            }
        });
    }

    /**
     * Rota çizgisini kaldır
     */
    removeRouteLine() {
        if (!this.map) {
            console.warn('[RouteManager] removeRouteLine: map not found');
            return;
        }

        const layers = [
            `${this.routeLineId}-arrows`,
            `${this.routeLineId}-label`,
            `${this.routeLineId}-top`,
            `${this.routeLineId}-bg`
        ];

        layers.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
        });

        // Source'ları temizle
        if (this.map.getSource(this.routeLineId)) {
            this.map.removeSource(this.routeLineId);
        }

        const labelSourceId = `${this.routeLineId}-label-source`;
        if (this.map.getSource(labelSourceId)) {
            this.map.removeSource(labelSourceId);
        }
    }

    /**
     * Noktaları otomatik bağla - tüm mevcut noktaları bağlar
     */
    async connectAllPoints(points) {
        this.routePoints = points.map(p => ({
            id: p.id,
            coords: p.coords,
            visitDay: p.visitDay || 1,
            distanceToNext: null
        }));

        this.calculateAllDistances();

        if (this.routePoints.length >= 2) {
            await this.updateRouteLine();
        } else {
            this.removeRouteLine();
        }

        return this.routePoints;
    }

    /**
     * CSV parse - basit CSV parser
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV dosyası en az 2 satır içermelidir (başlık + veri)');
        }

        // Başlık satırını parse et
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Gerekli sütunları kontrol et
        const requiredFields = ['title', 'lat', 'lon'];
        const missingFields = requiredFields.filter(f => !headers.includes(f));

        if (missingFields.length > 0) {
            throw new Error(`CSV'de eksik sütunlar: ${missingFields.join(', ')}`);
        }

        // Veri satırlarını parse et
        const points = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const point = {};

            headers.forEach((header, index) => {
                point[header] = values[index];
            });

            // Koordinatları number'a çevir
            const lat = parseFloat(point.lat);
            const lon = parseFloat(point.lon);

            if (isNaN(lat) || isNaN(lon)) {
                console.warn(`Satır ${i + 1}: Geçersiz koordinatlar atlandı`);
                continue;
            }

            points.push({
                id: Date.now() + i,
                title: point.title || `Nokta ${i}`,
                description: point.description || '',
                coords: [lon, lat], // [lon, lat] formatı
                visitDay: parseInt(point.visitday || point.day || '1'),
                duration: point.duration || '',
                timestamp: point.timestamp || point.time || '',
                distanceToNext: null
            });
        }

        return points;
    }

    /**
     * Excel parse (CSV formatında)
     * Not: Gerçek Excel (.xlsx) parse'ı için SheetJS gibi kütüphane gerekir
     */
    parseExcel(excelText) {
        // Şimdilik CSV parser'ı kullan (Excel'den CSV export edilmiş)
        return this.parseCSV(excelText);
    }

    /**
     * Toplam mesafe hesapla
     */
    getTotalDistance() {
        return this.routePoints.reduce((total, point) => {
            return total + (point.distanceToNext || 0);
        }, 0);
    }

    /**
     * Günlük özet bilgi
     */
    getDaySummary() {
        const summary = {};
        const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

        this.routePoints.forEach(point => {
            const day = point.visitDay || 1;
            if (!summary[day]) {
                // Gün için varsayılan renk (sadece görsel amaçlı)
                const colorIndex = (day - 1) % defaultColors.length;
                summary[day] = {
                    day: day,
                    points: [],
                    totalDistance: 0,
                    color: defaultColors[colorIndex] // Sadece günlük özet görünümü için
                };
            }

            summary[day].points.push(point);
            summary[day].totalDistance += (point.distanceToNext || 0);
        });

        return Object.values(summary);
    }

    /**
     * Başlangıç ve bitiş noktası arası düz mesafe (displacement)
     */
    getDisplacement() {
        if (this.routePoints.length < 2) return 0;

        const start = this.routePoints[0].coords;
        const end = this.routePoints[this.routePoints.length - 1].coords;

        return MapHelpers.calculateDistance(start, end);
    }

    /**
     * Bearing angle (yön açısı) hesapla
     */
    getBearingAngle() {
        if (this.routePoints.length < 2) return 0;

        const start = this.routePoints[0].coords;
        const end = this.routePoints[this.routePoints.length - 1].coords;

        // Bearing angle formülü
        const lat1 = start[1] * Math.PI / 180;
        const lat2 = end[1] * Math.PI / 180;
        const dLon = (end[0] - start[0]) * Math.PI / 180;

        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                  Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

        let bearing = Math.atan2(y, x) * 180 / Math.PI;

        // 0-360 arasına normalize et
        bearing = (bearing + 360) % 360;

        return bearing;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.removeRouteLine();
        this.routePoints = [];
    }
}
