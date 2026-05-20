/**
 * StoryMap - CBS Veri İçe Aktarım Yönetim Sınıfı (ImportManager)
 */
export class ImportManager {
    constructor() {
        this.supportedExtensions = ['.zip', '.geojson', '.json', '.kml'];
    }

    /**
     * CBS Dosyasını okur ve çözümler
     * @param {File} file - Kullanıcının seçtiği dosya nesnesi
     * @returns {Promise<Object>} Çözümlenmiş StoryMap noktaları ve çizimleri
     */
    async parseFile(file) {
        const fileName = file.name.toLowerCase();
        const extension = '.' + fileName.split('.').pop();

        if (!this.supportedExtensions.includes(extension)) {
            throw new Error('Desteklenmeyen dosya formatı. Lütfen .shp (zip), .geojson veya .kml yükleyin.');
        }

        try {
            if (extension === '.zip') {
                return await this.parseShapefileZip(file);
            } else if (extension === '.kml') {
                return await this.parseKmlFile(file);
            } else {
                return await this.parseGeoJsonFile(file);
            }
        } catch (error) {
            console.error('[ImportManager] Ayrıştırma Hatası:', error);
            throw new Error(`Dosya ayrıştırılırken hata oluştu: ${error.message}`);
        }
    }

    /**
     * GeoJSON dosyasını okur ve StoryMap formatına çevirir
     */
    async parseGeoJsonFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const geojson = JSON.parse(e.target.result);
                    const result = this.processGeoJson(geojson);
                    resolve(result);
                } catch (err) {
                    reject(new Error('Geçersiz GeoJSON veya JSON dosyası.'));
                }
            };
            reader.onerror = () => reject(new Error('Dosya okunurken hata oluştu.'));
            reader.readAsText(file, 'utf-8');
        });
    }

    /**
     * KML dosyasını okur ve GeoJSON'a çevirip işler
     */
    async parseKmlFile(file) {
        if (typeof toGeoJSON === 'undefined') {
            throw new Error('KML ayrıştırıcı kütüphane (togeojson) yüklenemedi.');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const kmlString = e.target.result;
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(kmlString, 'text/xml');
                    
                    // XML Parse Hatası kontrolü
                    if (xml.getElementsByTagName('parsererror').length > 0) {
                        throw new Error('KML dosyası geçerli bir XML yapısında değil.');
                    }

                    const geojson = toGeoJSON.kml(xml);
                    const result = this.processGeoJson(geojson);
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('KML dosyası okunurken hata oluştu.'));
            reader.readAsText(file, 'utf-8');
        });
    }

    /**
     * Shapefile (.zip) dosyasını okur ve GeoJSON'a çevirip işler
     */
    async parseShapefileZip(file) {
        if (typeof shp === 'undefined') {
            throw new Error('Shapefile ayrıştırıcı kütüphane (shpjs) yüklenemedi.');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    // shpjs kütüphanesi ArrayBuffer kabul eder ve GeoJSON döner
                    const geojson = await shp(arrayBuffer);
                    
                    // shpjs bazen tek bir FeatureCollection yerine FeatureCollection dizisi döner (zip'te birden fazla shp varsa)
                    let combinedGeoJson;
                    if (Array.isArray(geojson)) {
                        combinedGeoJson = {
                            type: 'FeatureCollection',
                            features: geojson.flatMap(collection => collection.features || [])
                        };
                    } else {
                        combinedGeoJson = geojson;
                    }

                    const result = this.processGeoJson(combinedGeoJson);
                    resolve(result);
                } catch (err) {
                    reject(new Error('Shapefile (.zip) ayrıştırılamadı. Lütfen zip içinde .shp ve .dbf dosyalarının bulunduğundan emin olun.'));
                }
            };
            reader.onerror = () => reject(new Error('Zip dosyası okunurken hata oluştu.'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * GeoJSON verisini StoryMap bileşenlerine dönüştürür
     */
    processGeoJson(geojson) {
        const points = [];
        const drawings = [];

        if (!geojson) {
            return { points, drawings };
        }

        // Tek bir Feature ise, FeatureCollection yapısına sokalım
        let features = [];
        if (geojson.type === 'FeatureCollection') {
            features = geojson.features || [];
        } else if (geojson.type === 'Feature') {
            features = [geojson];
        } else if (geojson.type === 'GeometryCollection') {
            features = (geojson.geometries || []).map(geom => ({
                type: 'Feature',
                properties: {},
                geometry: geom
            }));
        } else if (geojson.coordinates && geojson.type) {
            // Doğrudan geometri ise
            features = [{
                type: 'Feature',
                properties: {},
                geometry: geojson
            }];
        }

        features.forEach((feature, index) => {
            if (!feature.geometry) return;

            const geometry = feature.geometry;
            const properties = feature.properties || {};
            const { title, description } = this.extractMetaData(properties, index);

            // Çoklu geometrileri tekil geometrilere açalım (MultiPoint, MultiLineString, MultiPolygon)
            if (geometry.type === 'Point') {
                points.push(this.createStoryPoint(geometry.coordinates, title, description, properties));
            } 
            else if (geometry.type === 'MultiPoint') {
                geometry.coordinates.forEach((coords, subIdx) => {
                    const subTitle = `${title} (${subIdx + 1})`;
                    points.push(this.createStoryPoint(coords, subTitle, description, properties));
                });
            } 
            else if (geometry.type === 'LineString') {
                drawings.push(this.createStoryDrawing('line', geometry.coordinates, title, description, properties, index));
            } 
            else if (geometry.type === 'MultiLineString') {
                geometry.coordinates.forEach((coords, subIdx) => {
                    const subTitle = `${title} (Çizgi ${subIdx + 1})`;
                    drawings.push(this.createStoryDrawing('line', coords, subTitle, description, properties, index + '_' + subIdx));
                });
            } 
            else if (geometry.type === 'Polygon') {
                // Polygon'da coordinates[0] dış halkayı temsil eder
                drawings.push(this.createStoryDrawing('polygon', geometry.coordinates[0], title, description, properties, index));
            } 
            else if (geometry.type === 'MultiPolygon') {
                geometry.coordinates.forEach((polyCoords, subIdx) => {
                    const subTitle = `${title} (Alan ${subIdx + 1})`;
                    drawings.push(this.createStoryDrawing('polygon', polyCoords[0], subTitle, description, properties, index + '_' + subIdx));
                });
            }
        });

        return { points, drawings };
    }

    /**
     * Öznitelik tablosundan (Properties/DBF) başlık ve açıklama çıkarır
     */
    extractMetaData(properties, index) {
        let title = '';
        let description = '';

        // Başlık için olası kolon isimleri
        const titleKeys = ['name', 'title', 'baslik', 'label', 'ad', 'id', 'ogm_ad', 'sehir', 'il', 'poi_name'];
        for (const key of titleKeys) {
            const foundKey = Object.keys(properties).find(k => k.toLowerCase() === key);
            if (foundKey && properties[foundKey]) {
                title = String(properties[foundKey]).trim();
                break;
            }
        }

        if (!title) {
            title = `Öğe ${index + 1}`;
        }

        // Açıklama için olası kolon isimleri
        const descKeys = ['desc', 'description', 'aciklama', 'info', 'detay', 'detail', 'text', 'icerik', 'not'];
        const descParts = [];

        for (const key of descKeys) {
            const foundKey = Object.keys(properties).find(k => k.toLowerCase() === key);
            if (foundKey && properties[foundKey]) {
                description = String(properties[foundKey]).trim();
                break;
            }
        }

        // Eğer doğrudan açıklama kolonu yoksa, tüm öznitelikleri şık bir HTML tablo olarak açıklamaya ekleyelim!
        // Böylece kullanıcının CBS bilgisi kaybolmaz.
        if (!description && Object.keys(properties).length > 0) {
            let tableHtml = '<div class="import-properties"><table style="width:100%; border-collapse:collapse; font-size:11px; margin-top:5px;">';
            let hasData = false;
            
            Object.entries(properties).forEach(([key, val]) => {
                // Başlık olarak kullanılan kolonu açıklamada tekrarlamayalım
                const isTitleCol = titleKeys.some(tk => key.toLowerCase() === tk) && String(val).trim() === title;
                if (val !== null && val !== undefined && val !== '' && !isTitleCol) {
                    tableHtml += `<tr><td style="font-weight:600; padding:2px 4px; border-bottom:1px solid #f1f5f9; color:#64748b;">${key}:</td><td style="padding:2px 4px; border-bottom:1px solid #f1f5f9; color:#334155;">${val}</td></tr>`;
                    hasData = true;
                }
            });
            tableHtml += '</table></div>';
            
            if (hasData) {
                description = tableHtml;
            }
        }

        return { title, description };
    }

    /**
     * Standart StoryMap Nokta (Point) Verisi Oluşturur
     */
    createStoryPoint(coordinates, title, description, properties) {
        return {
            id: `import-point-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: title,
            description: description,
            coords: [coordinates[0], coordinates[1]], // [lng, lat]
            zoom: 12,
            isDrawing: false,
            media: [],
            facts: [],
            tags: [],
            properties: properties // Orijinal öznitelikleri sakla
        };
    }

    /**
     * Standart StoryMap Çizim (Drawing) Verisi Oluşturur
     */
    createStoryDrawing(drawingType, coordinates, title, description, properties, index) {
        const id = `import-draw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return {
            id: id,
            mapLayerId: id,
            title: title,
            description: description,
            coords: coordinates, // [ [lng, lat], ... ]
            isDrawing: true,
            drawingType: drawingType, // 'line' veya 'polygon'
            color: '#3b82f6', // Varsayılan CBS Mavi
            media: [],
            facts: [],
            tags: [],
            properties: properties
        };
    }
}
