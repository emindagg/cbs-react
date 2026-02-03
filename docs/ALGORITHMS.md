# Algoritmalar ve Hesaplama Yöntemleri

Bu dokümantasyon, AtlasCopy'de kullanılan algoritmaları ve hesaplama yöntemlerini açıklar.

## İçindekiler

- [Coğrafi Hesaplamalar](#coğrafi-hesaplamalar)
- [Sınıflandırma Algoritmaları](#sınıflandırma-algoritmaları)
- [Mekansal Analiz Algoritmaları](#mekansal-analiz-algoritmaları)
- [Timeline Filtreleme](#timeline-filtreleme)
- [Optimizasyon Teknikleri](#optimizasyon-teknikleri)

---

## Coğrafi Hesaplamalar

### Haversine Formülü (Mesafe)

İki nokta arasındaki küresel mesafeyi hesaplar.

```javascript
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Dünya yarıçapı (metre)
    
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // metre
}
```

**Zaman Karmaşıklığı:** O(1)

### Azimut (Yön) Hesaplama

```javascript
function calculateBearing(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360; // Derece
}
```

### Poligon Alan Hesaplama

```javascript
// Turf.js kullanımı
const polygon = turf.polygon([coordinates]);
const area = turf.area(polygon); // m²
```

### Centroid Hesaplama

```javascript
// Turf.js kullanımı
const centroid = turf.centroid(feature);
// { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] } }
```

---

## Sınıflandırma Algoritmaları

### Quantile (Çeyreklik)

Her sınıf eşit sayıda eleman içerir.

```javascript
function quantileClassification(data, classCount) {
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    
    const breaks = [sorted[0]];
    for (let i = 1; i < classCount; i++) {
        const index = Math.floor((i / classCount) * n);
        breaks.push(sorted[index]);
    }
    breaks.push(sorted[n - 1]);
    
    return breaks;
}
```

**Zaman Karmaşıklığı:** O(n log n)

### Equal Interval (Eşit Aralık)

Değer aralıkları eşit genişliktedir.

```javascript
function equalIntervalClassification(data, classCount) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const interval = (max - min) / classCount;
    
    const breaks = [min];
    for (let i = 1; i < classCount; i++) {
        breaks.push(min + (interval * i));
    }
    breaks.push(max);
    
    return breaks;
}
```

**Zaman Karmaşıklığı:** O(n)

### Natural Breaks (Jenks)

Doğal grupları tespit eder, varyansı minimize eder.

```javascript
function jenksNaturalBreaks(data, classCount) {
    const n = data.length;
    const sorted = [...data].sort((a, b) => a - b);
    
    // Dynamic programming matrisleri
    const mat1 = Array(n + 1).fill(null).map(() => 
        Array(classCount + 1).fill(Infinity));
    const mat2 = Array(n + 1).fill(null).map(() => 
        Array(classCount + 1).fill(0));
    
    // Base cases ve DP hesaplama...
    // (Detaylı implementasyon için kaynak koda bakın)
    
    return breaks;
}
```

**Zaman Karmaşıklığı:** O(n² · k)

### Geometric Interval

Geometrik dizi kullanır.

```javascript
function geometricIntervalClassification(data, classCount) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const ratio = Math.pow(max / min, 1 / classCount);
    
    const breaks = [min];
    for (let i = 1; i < classCount; i++) {
        breaks.push(min * Math.pow(ratio, i));
    }
    breaks.push(max);
    
    return breaks;
}
```

**Zaman Karmaşıklığı:** O(n)

---

## Mekansal Analiz Algoritmaları

### Buffer Oluşturma

```javascript
function createBuffer(point, radius, steps = 64) {
    const center = turf.point(point);
    const buffered = turf.buffer(center, radius, {
        units: 'meters',
        steps: steps
    });
    return buffered;
}
```

**Zaman Karmaşıklığı:** O(steps)

### Convex Hull (Graham Scan)

```javascript
function convexHull(points) {
    // 1. En alttaki noktayı bul
    let pivot = points.reduce((min, p) => 
        p[1] < min[1] ? p : min);
    
    // 2. Polar açıya göre sırala
    const sorted = points
        .filter(p => p !== pivot)
        .sort((a, b) => {
            const angleA = Math.atan2(a[1] - pivot[1], a[0] - pivot[0]);
            const angleB = Math.atan2(b[1] - pivot[1], b[0] - pivot[0]);
            return angleA - angleB;
        });
    
    // 3. Stack ile hull oluştur
    const hull = [pivot, sorted[0], sorted[1]];
    
    for (let i = 2; i < sorted.length; i++) {
        while (hull.length > 1 && 
               !isLeftTurn(hull[hull.length-2], hull[hull.length-1], sorted[i])) {
            hull.pop();
        }
        hull.push(sorted[i]);
    }
    
    hull.push(hull[0]); // Kapalı poligon
    return hull;
}

function isLeftTurn(p1, p2, p3) {
    return ((p2[0] - p1[0]) * (p3[1] - p1[1]) - 
            (p2[1] - p1[1]) * (p3[0] - p1[0])) > 0;
}
```

**Zaman Karmaşıklığı:** O(n log n)

### Voronoi Diyagramı

```javascript
function createVoronoi(points, bbox) {
    const features = turf.featureCollection(
        points.map(p => turf.point(p))
    );
    const voronoi = turf.voronoi(features, { bbox });
    return voronoi;
}
```

**Zaman Karmaşıklığı:** O(n log n)

### En Yakın Çift Nokta

```javascript
function findNearestPair(points) {
    let minDistance = Infinity;
    let nearestPair = null;

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const distance = haversineDistance(
                points[i][1], points[i][0],
                points[j][1], points[j][0]
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearestPair = [points[i], points[j]];
            }
        }
    }

    return { pair: nearestPair, distance: minDistance };
}
```

**Zaman Karmaşıklığı:** O(n²)

---

## Timeline Filtreleme

### Tarih Bazlı Filtreleme

```javascript
function filterByDate(features, currentDate, previousDate, mode) {
    return features.filter(feature => {
        const featureDate = parseDate(feature.properties.timestamp);
        
        if (mode === 'cumulative') {
            // Kümülatif: currentDate'e kadar tüm veriler
            return featureDate <= currentDate;
        } else {
            // Interval: previousDate ile currentDate arası
            if (!previousDate) return featureDate <= currentDate;
            return featureDate > previousDate && featureDate <= currentDate;
        }
    });
}
```

### Property Bazlı Filtreleme

```javascript
function filterByProperty(features, property, min, max) {
    if (!property) return features;
    
    return features.filter(feature => {
        const value = feature.properties[property];
        if (value === undefined || value === null) return true;
        return value >= min && value <= max;
    });
}
```

### Web Worker Filtreleme

```javascript
// Main thread
function filterWithWorker(features, currentDate, previousDate) {
    return new Promise((resolve, reject) => {
        const requestId = ++this.workerRequestId;
        
        this.workerCallbacks.set(requestId, (error, data) => {
            if (error) reject(error);
            else resolve(data);
        });
        
        this.worker.postMessage({
            type: 'FILTER',
            requestId,
            features,
            currentDate: currentDate.getTime(),
            previousDate: previousDate?.getTime() || null,
            filterMode: this.filterMode
        });
    });
}

// Worker thread
self.onmessage = function(e) {
    const { type, requestId, features, currentDate, previousDate, filterMode } = e.data;
    
    if (type === 'FILTER') {
        const filtered = filterFeatures(features, currentDate, previousDate, filterMode);
        
        self.postMessage({
            type: 'FILTER_RESULT',
            requestId,
            data: { filteredFeatures: filtered }
        });
    }
};
```

---

## Optimizasyon Teknikleri

### Geometri Basitleştirme (Douglas-Peucker)

```javascript
function simplifyPolyline(points, tolerance) {
    if (points.length <= 2) return points;
    
    let maxDist = 0;
    let index = 0;
    const first = points[0];
    const last = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
        const dist = perpendicularDistance(points[i], first, last);
        if (dist > maxDist) {
            maxDist = dist;
            index = i;
        }
    }

    if (maxDist > tolerance) {
        const left = simplifyPolyline(points.slice(0, index + 1), tolerance);
        const right = simplifyPolyline(points.slice(index), tolerance);
        return [...left.slice(0, -1), ...right];
    } else {
        return [first, last];
    }
}
```

**Zaman Karmaşıklığı:** O(n log n) ortalama

### Date Cache

```javascript
class DateCache {
    constructor(maxSize = 10000) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    
    parse(dateString) {
        if (this.cache.has(dateString)) {
            return this.cache.get(dateString);
        }
        
        const parsed = new Date(dateString);
        
        if (this.cache.size < this.maxSize) {
            this.cache.set(dateString, parsed);
        }
        
        return parsed;
    }
    
    clear() {
        this.cache.clear();
    }
}
```

### Debounce ve Throttle

```javascript
// Debounce: Son çağrıdan sonra bekle
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Throttle: Belirli aralıklarla çağır
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Kullanım
const debouncedSearch = debounce(performSearch, 300);
const throttledFilter = throttle(filterMapByTime, 100);
```

### RequestAnimationFrame

```javascript
function smoothUpdate(callback) {
    let rafId = null;
    
    return function(...args) {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }
        
        rafId = requestAnimationFrame(() => {
            callback(...args);
            rafId = null;
        });
    };
}

// Kullanım
const smoothFilter = smoothUpdate(filterMapByTime);
```

---

## Performans Metrikleri

### Timeline Filtreleme

```
Tipik performans (6000 feature):
- Catalog: 2.1ms
- Cluster: 14.2ms (Worker ile)
- Labels: 2.2ms
- Toplam: ~18.5ms
```

### Görselleştirme

```
Choropleth (81 il):
- GeoJSON yükleme: ~200ms
- Sınıflandırma: ~5ms
- Layer oluşturma: ~50ms
- Toplam: ~255ms
```

---

**Son Güncelleme:** 11 Ocak 2026
**Versiyon:** 1.2.0
