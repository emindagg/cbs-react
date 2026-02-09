/**
 * OGM Web CBS Platform
 * Data Management Module
 */

// Güvenli Logger helper'ları (Logger.* fonksiyon değilse console fallback)
const safeLogDM = (...args) => (window.Logger && typeof window.Logger.log === 'function') ? window.Logger.log(...args) : console.log(...args);
const safeWarnDM = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorDM = (...args) => (window.Logger && typeof window.Logger.error === 'function') ? window.Logger.error(...args) : console.error(...args);

class DataManager {
    constructor() {
        this.userMarkers = [];
        this.measurements = [];
        this.lastClickedLatLng = null;
        
        // Çember çizimi state'leri
        this.circleDrawing = false;
        this.circleCenter = null;
        this.circleEdge = null;
        this.tempCircle = null;
        this.circleGuide = null;
        this.circleCenterMarker = null;
        this.circleEdgeMarker = null;
        this.circleTooltip = null;
        this.circleInfoPopup = null;
        this.circleMouseMoveHandler = null;
        
        // Çoklu nokta toplama state'leri
        this.collectingPoints = false;
        this.collectedPoints = [];
        this.currentCollectionType = 'point';
        this.tempLayer = null;
        this.tempMarkers = [];
        this.tempPointMarker = null;
    }

    /**
     * Add a new marker to the collection
     */
    addMarker(markerData) {
        const enrichedData = {
            ...markerData,
            id: markerData.id || Date.now()
        };
        
        this.userMarkers.push(enrichedData);
        return enrichedData;
    }

    /**
     * Remove a marker by ID
     */
    removeMarker(markerId) {
        const index = this.userMarkers.findIndex(m => m.id === markerId);
        if (index > -1) {
            const removed = this.userMarkers.splice(index, 1);
            return removed[0];
        }
        return null;
    }

    /**
     * Get all markers
     */
    getAllMarkers() {
        return [...this.userMarkers];
    }

    /**
     * Get all markers (alias for getAllMarkers for backward compatibility)
     */
    getMarkers() {
        return this.getAllMarkers();
    }

    /**
     * Delete marker (alias for removeMarker for backward compatibility)
     */
    deleteMarker(markerId) {
        return this.removeMarker(markerId);
    }

    /**
     * Get markers by type
     */
    getMarkersByType(type) {
        return this.userMarkers.filter(m => m.type === type);
    }

    /**
     * Add measurement result
     */
    addMeasurement(measurement) {
        this.measurements.push({
            ...measurement,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Clear all measurements
     */
    clearMeasurements() {
        this.measurements = [];
    }

    /**
     * Export data to JSON
     */
    exportToJSON() {
        return {
            project: {
                name: document.getElementById('map-purpose')?.value || 'Web CBS Projesi',
                exportDate: new Date().toISOString(),
                version: '2.0'
            },
            data: this.userMarkers,
            measurements: this.measurements,
            statistics: this.getStatistics()
        };
    }

    /**
     * Export to GeoJSON format
     */
    exportToGeoJSON() {
        const features = this.userMarkers.map(marker => {
            let geometry;
            
            if (marker.type === 'circle' && typeof marker.radius === 'number') {
                // Circle'ı merkez noktası olarak export et; radius bilgisini properties'te taşı
                geometry = {
                    type: 'Point',
                    coordinates: [marker.lon, marker.lat]
                };
            } else if (marker.type === 'area' && marker.geometry) {
                // Polygon
                const coordinates = marker.geometry.map(p => [p.lon, p.lat]);
                coordinates.push(coordinates[0]); // Close the ring
                geometry = {
                    type: 'Polygon',
                    coordinates: [coordinates]
                };
            } else if (marker.type === 'route' && marker.geometry) {
                // LineString
                geometry = {
                    type: 'LineString',
                    coordinates: marker.geometry.map(p => [p.lon, p.lat])
                };
            } else {
                // Point
                geometry = {
                    type: 'Point',
                    coordinates: [marker.lon, marker.lat]
                };
            }
            
            return {
                type: 'Feature',
                geometry: geometry,
                properties: {
                    name: marker.name,
                    type: marker.type,
                    ...(marker.type === 'circle' ? {
                        circle: true,
                        radius: marker.radius,
                        centerLat: marker.lat,
                        centerLon: marker.lon
                    } : {})
                }
            };
        });

        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    /**
     * Export to CSV format
     */
    exportToCSV() {
        if (this.userMarkers.length === 0) return '';
        
        const headers = ['ID', 'Ad', 'Enlem', 'Boylam', 'Tür'];
        const rows = this.userMarkers.map(m => [
            m.id,
            m.name,
            m.lat,
            m.lon,
            m.type
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    /**
     * Import from JSON
     */
    importFromJSON(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (data.data && Array.isArray(data.data)) {
                this.userMarkers = data.data;
            }
            
            if (data.measurements && Array.isArray(data.measurements)) {
                this.measurements = data.measurements;
            }
            
            return true;
        } catch (error) {
            safeErrorDM('Import error:', error);
            return false;
        }
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const stats = {
            totalMarkers: this.userMarkers.length,
            byType: {},
            measurements: {
                distances: this.measurements.filter(m => m.type === 'distance').length,
                areas: this.measurements.filter(m => m.type === 'area').length,
                buffers: this.measurements.filter(m => m.type === 'buffer').length
            }
        };

        // Count by type
        this.userMarkers.forEach(marker => {
            stats.byType[marker.type] = (stats.byType[marker.type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Generate analysis report
     */
    generateReport() {
        const stats = this.getStatistics();
        const projectName = document.getElementById('map-purpose')?.value || 'Web CBS Projesi';

        const sections = [
            this._generateReportHeader(projectName),
            this._generateStatisticsSection(stats),
            this._generateMeasurementsSection(stats),
            this._generateSpatialAnalysisSection(),
            this._generateRecommendationsSection(stats),
            this._generateReportFooter()
        ];

        return sections.join('\n');
    }

    /**
     * Generate report header
     * @private
     */
    _generateReportHeader(projectName) {
        return `
========================================
WEB CBS ANALİZ RAPORU
========================================
Proje: ${projectName}
Tarih: ${new Date().toLocaleDateString('tr-TR')}
Saat: ${new Date().toLocaleTimeString('tr-TR')}
`;
    }

    /**
     * Generate statistics section
     * @private
     */
    _generateStatisticsSection(stats) {
        const typeDistribution = Object.entries(stats.byType)
            .map(([k, v]) => `  • ${k}: ${v}`)
            .join('\n');

        return `
----------------------------------------
1. GENEL İSTATİSTİKLER
----------------------------------------
Toplam Veri Noktası: ${stats.totalMarkers}

Veri Türü Dağılımı:
${typeDistribution}
`;
    }

    /**
     * Generate measurements section
     * @private
     */
    _generateMeasurementsSection(stats) {
        let section = `
----------------------------------------
2. ÖLÇÜM SONUÇLARI
----------------------------------------
Mesafe Ölçümleri: ${stats.measurements.distances}
Alan Ölçümleri: ${stats.measurements.areas}
Buffer Analizleri: ${stats.measurements.buffers}
`;

        if (this.measurements.length > 0) {
            section += '\nDetaylı Ölçümler:\n';
            section += this._formatMeasurementDetails();
        }

        return section;
    }

    /**
     * Format measurement details
     * @private
     */
    _formatMeasurementDetails() {
        return this.measurements.map((m, i) => {
            if (m.type === 'distance') {
                return `  ${i + 1}. Mesafe: ${(m.value / 1000).toFixed(2)} km`;
            } else if (m.type === 'area') {
                return `  ${i + 1}. Alan: ${this.formatArea(m.value)}`;
            } else if (m.type === 'buffer') {
                return `  ${i + 1}. Buffer: ${m.value.bufferRadius}m yarıçap, ${m.value.totalPoints} nokta`;
            }
            return '';
        }).filter(line => line).join('\n');
    }

    /**
     * Generate spatial analysis section
     * @private
     */
    _generateSpatialAnalysisSection() {
        let section = `
----------------------------------------
3. MEKANSAL ANALİZ
----------------------------------------
`;

        if (this.userMarkers.length > 0) {
            const bounds = this._calculateBounds();
            section += `Kuzey Sınırı: ${bounds.north}°\n`;
            section += `Güney Sınırı: ${bounds.south}°\n`;
            section += `Doğu Sınırı: ${bounds.east}°\n`;
            section += `Batı Sınırı: ${bounds.west}°\n`;
        }

        return section;
    }

    /**
     * Calculate coordinate bounds
     * @private
     */
    _calculateBounds() {
        const lats = this.userMarkers.map(m => m.lat);
        const lngs = this.userMarkers.map(m => m.lon);

        return {
            north: Math.max(...lats).toFixed(5),
            south: Math.min(...lats).toFixed(5),
            east: Math.max(...lngs).toFixed(5),
            west: Math.min(...lngs).toFixed(5)
        };
    }

    /**
     * Generate recommendations section
     * @private
     */
    _generateRecommendationsSection(stats) {
        let section = `
----------------------------------------
4. ÖNERİLER
----------------------------------------
`;

        const recommendations = this._generateRecommendations(stats);
        if (recommendations.length > 0) {
            section += recommendations.join('\n') + '\n';
        }

        return section;
    }

    /**
     * Generate recommendations based on data
     * @private
     */
    _generateRecommendations(stats) {
        const recommendations = [];

        if (stats.totalMarkers < 5) {
            recommendations.push('• Daha fazla veri noktası eklenerek analizler zenginleştirilebilir.');
        }

        if (stats.measurements.distances === 0) {
            recommendations.push('• Mesafe ölçümleri yapılarak mekansal ilişkiler analiz edilebilir.');
        }

        if (Object.keys(stats.byType).length === 1) {
            recommendations.push('• Farklı veri türlerinde (nokta, alan, rota) veri eklenerek analizler çeşitlendirilebilir.');
        }

        return recommendations;
    }

    /**
     * Generate report footer
     * @private
     */
    _generateReportFooter() {
        return `
========================================
Rapor Sonu
========================================`;
    }

    /**
     * Format area helper
     */
    formatArea(area) {
        if (area > 1000000) {
            return `${(area / 1000000).toFixed(2)} km²`;
        } else if (area > 10000) {
            return `${(area / 10000).toFixed(2)} hektar`;
        } else {
            return `${Math.round(area)} m²`;
        }
    }

    /**
     * Export to KML format
     */
    exportToKML() {
        const projectName = document.getElementById('map-purpose')?.value || 'Web CBS Projesi';

        const kmlParts = [
            this._createKMLHeader(projectName),
            this._createKMLStyles(),
            ...this.userMarkers.map(marker => this._createPlacemark(marker)),
            this._createKMLFooter()
        ];

        return kmlParts.join('');
    }

    /**
     * Create KML header
     * @private
     */
    _createKMLHeader(projectName) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${projectName}</name>
    <description>Export Tarihi: ${new Date().toLocaleString('tr-TR')}</description>
`;
    }

    /**
     * Create KML style definitions
     * @private
     */
    _createKMLStyles() {
        return `    <Style id="pointStyle">
      <IconStyle>
        <Icon><href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="lineStyle">
      <LineStyle><color>ff0000ff</color><width>2</width></LineStyle>
    </Style>
    <Style id="polyStyle">
      <LineStyle><color>ff0000ff</color><width>2</width></LineStyle>
      <PolyStyle><color>4d0000ff</color></PolyStyle>
    </Style>
`;
    }

    /**
     * Create placemark for marker
     * @private
     */
    _createPlacemark(marker) {
        const name = `      <name>${this.escapeXML(marker.name)}</name>\n`;
        const geometry = this._createGeometryKML(marker);

        return `    <Placemark>
${name}${geometry}    </Placemark>
`;
    }

    /**
     * Create geometry KML based on marker type
     * @private
     */
    _createGeometryKML(marker) {
        if (marker.type === 'area' && marker.geometry) {
            return this._createPolygonKML(marker);
        } else if (marker.type === 'route' && marker.geometry) {
            return this._createLineStringKML(marker);
        } else {
            return this._createPointKML(marker);
        }
    }

    /**
     * Create Polygon KML
     * @private
     */
    _createPolygonKML(marker) {
        const coords = marker.geometry.map(p => `              ${p.lon},${p.lat},0`).join('\n');
        const closeCoord = `              ${marker.geometry[0].lon},${marker.geometry[0].lat},0`;

        return `      <styleUrl>#polyStyle</styleUrl>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
${coords}
${closeCoord}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
`;
    }

    /**
     * Create LineString KML
     * @private
     */
    _createLineStringKML(marker) {
        const coords = marker.geometry.map(p => `          ${p.lon},${p.lat},0`).join('\n');

        return `      <styleUrl>#lineStyle</styleUrl>
      <LineString>
        <coordinates>
${coords}
        </coordinates>
      </LineString>
`;
    }

    /**
     * Create Point KML
     * @private
     */
    _createPointKML(marker) {
        return `      <styleUrl>#pointStyle</styleUrl>
      <Point>
        <coordinates>${marker.lon},${marker.lat},0</coordinates>
      </Point>
`;
    }

    /**
     * Create KML footer
     * @private
     */
    _createKMLFooter() {
        return `  </Document>
</kml>`;
    }

    /**
     * Export to KMZ format (zipped KML)
     */
    async exportToKMZ() {
        const kml = this.exportToKML();
        const zip = new JSZip();
        zip.file('doc.kml', kml);
        
        return await zip.generateAsync({ type: 'blob' });
    }

    /**
     * Export to Shapefile format
     */
    exportToShapefile() {
        // Convert to GeoJSON first
        const geojson = this.exportToGeoJSON();
        
        // Return GeoJSON with instructions
        // Note: Browser-based shapefile creation is complex
        // We'll provide GeoJSON and guide users to conversion tools
        return {
            geojson: geojson,
            note: 'Shapefile oluşturma için GeoJSON formatını QGIS veya online dönüştürücülerde kullanın.'
        };
    }

    /**
     * Import from KML format
     * Optimized for large files with better memory management
     */
    importFromKML(kmlText) {
        try {
            const xmlDoc = this._parseKMLDocument(kmlText);
            const placemarks = xmlDoc.getElementsByTagName('Placemark');
            const isLargeFile = this._shouldOptimizeForLargeFile(placemarks.length);

            const importedMarkers = this._processPlacemarks(placemarks, isLargeFile);

            safeLogDM(`✅ KML başarıyla parse edildi: ${importedMarkers.length} öğe`);

            this.userMarkers = importedMarkers;
            return true;
        } catch (error) {
            safeErrorDM('KML import hatası:', error);
            return false;
        }
    }

    /**
     * Parse KML document and check for errors
     * @private
     */
    _parseKMLDocument(kmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(kmlText, 'text/xml');

        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('KML parse hatası');
        }

        return xmlDoc;
    }

    /**
     * Check if file should be optimized for large size
     * @private
     */
    _shouldOptimizeForLargeFile(totalPlacemarks) {
        safeLogDM(`KML içinde ${totalPlacemarks} placemark bulundu`);

        const isLargeFile = totalPlacemarks > 1000;
        if (isLargeFile) {
            safeLogDM('⚡ Büyük dosya tespit edildi, optimize edilmiş mod aktif');
        }

        return isLargeFile;
    }

    /**
     * Extract point coordinates from placemark
     * @private
     */
    _extractPointGeometry(placemark) {
        const point = placemark.querySelector('Point coordinates');
        if (!point) return null;

        const coords = point.textContent.trim().split(',');
        const lon = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);

        if (isNaN(lon) || isNaN(lat)) return null;

        return { lat, lon };
    }

    /**
     * Extract LineString coordinates from placemark
     * @private
     */
    _extractLineStringGeometry(placemark) {
        const lineString = placemark.querySelector('LineString coordinates');
        if (!lineString) return null;

        const coordsText = lineString.textContent.trim().split(/\s+/);
        const geometry = coordsText.map(coord => {
            const [lon, lat] = coord.split(',').map(parseFloat);
            return { lat, lon };
        }).filter(p => !isNaN(p.lat) && !isNaN(p.lon));

        return geometry.length > 0 ? geometry : null;
    }

    /**
     * Extract Polygon coordinates from placemark
     * @private
     */
    _extractPolygonGeometry(placemark) {
        const polygon = placemark.querySelector('Polygon outerBoundaryIs LinearRing coordinates');
        if (!polygon) return null;

        const coordsText = polygon.textContent.trim().split(/\s+/);
        const geometry = coordsText.map(coord => {
            const [lon, lat] = coord.split(',').map(parseFloat);
            return { lat, lon };
        }).filter((p, i, arr) => i < arr.length - 1 && !isNaN(p.lat) && !isNaN(p.lon));

        return geometry.length > 0 ? geometry : null;
    }

    /**
     * Create marker object from placemark
     * @private
     */
    _createMarkerFromPlacemark(placemark, isLargeFile) {
        const name = placemark.querySelector('name')?.textContent || 'İsimsiz';

        // Extract properties from KML ExtendedData
        const properties = this._extractKMLProperties(placemark, name);

        // Try Point
        const pointGeom = this._extractPointGeometry(placemark);
        if (pointGeom) {
            return {
                id: Date.now() + Math.random(),
                name: name,
                lat: pointGeom.lat,
                lon: pointGeom.lon,
                type: 'point',
                properties: properties,
                _skipMetrics: isLargeFile
            };
        }

        // Try LineString
        const lineGeom = this._extractLineStringGeometry(placemark);
        if (lineGeom) {
            return {
                id: Date.now() + Math.random(),
                name: name,
                lat: lineGeom[0].lat,
                lon: lineGeom[0].lon,
                type: 'route',
                geometry: lineGeom,
                properties: properties,
                _skipMetrics: isLargeFile
            };
        }

        // Try Polygon
        const polygonGeom = this._extractPolygonGeometry(placemark);
        if (polygonGeom) {
            return {
                id: Date.now() + Math.random(),
                name: name,
                lat: polygonGeom[0].lat,
                lon: polygonGeom[0].lon,
                type: 'area',
                geometry: polygonGeom,
                properties: properties,
                _skipMetrics: isLargeFile
            };
        }

        return null;
    }

    /**
     * Extract properties from KML ExtendedData
     * @private
     */
    _extractKMLProperties(placemark, name) {
        const properties = { name: name };

        try {
            // Extract from ExtendedData > SchemaData > SimpleData
            const schemaData = placemark.querySelector('ExtendedData SchemaData');
            if (schemaData) {
                const simpleDataElements = schemaData.querySelectorAll('SimpleData');
                simpleDataElements.forEach(element => {
                    const key = element.getAttribute('name');
                    const value = element.textContent;
                    if (key) {
                        properties[key] = value;
                    }
                });
            }

            // Extract from ExtendedData > Data
            const dataElements = placemark.querySelectorAll('ExtendedData > Data');
            dataElements.forEach(element => {
                const key = element.getAttribute('name');
                const value = element.querySelector('value')?.textContent || element.textContent;
                if (key) {
                    properties[key] = value;
                }
            });

            // Extract description
            const description = placemark.querySelector('description')?.textContent;
            if (description) {
                properties.description = description;
            }
        } catch (error) {
            safeWarnDM('KML properties çıkarılırken hata:', error);
        }

        return properties;
    }

    /**
     * Process all placemarks and create markers
     * @private
     */
    _processPlacemarks(placemarks, isLargeFile) {
        const importedMarkers = [];
        let processed = 0;
        const totalPlacemarks = placemarks.length;

        for (let placemark of placemarks) {
            try {
                const marker = this._createMarkerFromPlacemark(placemark, isLargeFile);
                if (marker) {
                    importedMarkers.push(marker);
                }

                processed++;
                this._logProgress(processed, totalPlacemarks);
            } catch (placemarkError) {
                safeWarnDM('Placemark işlenirken hata atlandı:', placemarkError);
            }
        }

        return importedMarkers;
    }

    /**
     * Log progress for large files
     * @private
     */
    _logProgress(processed, total) {
        if (total > 1000 && processed % 1000 === 0) {
        safeLogDM(`KML işleniyor: ${processed}/${total}`);
        }
    }

    /**
     * Import from KMZ format
     * Optimized for large files
     */
    async importFromKMZ(kmzFile) {
        try {
            safeLogDM('KMZ dosyası işleniyor:', kmzFile.name, 'Boyut:', (kmzFile.size / 1024 / 1024).toFixed(2), 'MB');
            
            const zip = new JSZip();
            
            // Load KMZ with optimizations for large files
            const contents = await zip.loadAsync(kmzFile, {
                createFolders: false, // Don't create folder structure
                checkCRC32: false // Skip CRC check for faster loading
            });
            
            // Find doc.kml or first .kml file
            let kmlFile = contents.file('doc.kml');
            if (!kmlFile) {
                const kmlFiles = Object.keys(contents.files).filter(name => name.endsWith('.kml'));
                if (kmlFiles.length > 0) {
                    kmlFile = contents.file(kmlFiles[0]);
                }
            }
            
            if (!kmlFile) {
                throw new Error('KMZ içinde KML dosyası bulunamadı');
            }
            
            safeLogDM('KML dosyası çıkarılıyor...');
            
            // Extract KML with chunked processing for large files
            const kmlText = await kmlFile.async('string');
            
            safeLogDM('KML parse ediliyor... Boyut:', (kmlText.length / 1024).toFixed(2), 'KB');
            
            const result = this.importFromKML(kmlText);
            
            // Clear memory
            kmlFile = null;
            
            return result;
        } catch (error) {
            safeErrorDM('KMZ import hatası:', error);
            
            // Provide more specific error messages
            if (error.message.includes('End of data reached')) {
                throw new Error('KMZ dosyası bozuk veya eksik. Dosyayı kontrol edin.');
            } else if (error.message.includes('out of memory')) {
                throw new Error('Dosya çok büyük. Lütfen daha küçük bir KMZ dosyası deneyin veya GeoJSON formatına çevirin.');
            }
            
            return false;
        }
    }

    /**
     * Import from Shapefile (supports both .shp and .zip)
     * @param {File} file - Shapefile (.shp) or ZIP archive containing shapefile components
     * @returns {Promise<boolean>} - Success status
     */
    async importFromShapefile(file) {
        try {
            this._checkShpLibrary();
            this._checkJSZipLibrary();

            const fileExtension = file.name.split('.').pop().toLowerCase();
            const isZip = fileExtension === 'zip';

            safeLogDM(`📦 ${isZip ? 'ZIP' : 'Shapefile'} okunuyor:`, file.name, 'boyut:', (file.size / 1024).toFixed(2) + ' KB');

            if (isZip) {
                // ZIP dosyası - içeriği kontrol et ve SHP dosyalarını çıkar
                return await this._importShapefileFromZip(file);
            } else {
                // Tek SHP dosyası - eski yöntem
                return await this._importSingleShapefile(file);
            }
        } catch (error) {
            safeErrorDM('Shapefile import hatası:', error);

            // Kullanıcı dostu hata mesajları
            if (error.message.includes('not a valid zip')) {
                throw new Error('❌ Geçersiz ZIP dosyası. Lütfen geçerli bir Shapefile ZIP arşivi seçin.');
            } else if (error.message.includes('No .shp file found')) {
                throw new Error('❌ ZIP içinde .shp dosyası bulunamadı. Shapefile bileşenlerini (.shp, .shx, .dbf) içeren bir ZIP yükleyin.');
            } else if (error.message.includes('shp.js kütüphanesi')) {
                throw new Error('❌ Shapefile kütüphanesi yüklenemedi. Sayfayı yenileyin.');
            } else {
                throw error;
            }
        }
    }

    /**
     * Import shapefile from ZIP archive
     * @private
     */
    async _importShapefileFromZip(zipFile) {
        try {
            safeLogDM('📦 ZIP dosyası açılıyor...');

            // ZIP dosyasını ArrayBuffer olarak oku
            const arrayBuffer = await this._readFileAsArrayBuffer(zipFile);

            // JSZip ile ZIP içeriğini kontrol et
            const zip = await JSZip.loadAsync(arrayBuffer);
            const fileNames = Object.keys(zip.files);

            safeLogDM('📦 ZIP içeriği:', fileNames);

            // .shp dosyası kontrolü
            const shpFile = fileNames.find(name => name.toLowerCase().endsWith('.shp'));
            if (!shpFile) {
                safeWarnDM('⚠️ ZIP içinde .shp dosyası bulunamadı. İçerik:', fileNames);
                throw new Error('No .shp file found in ZIP archive');
            }

            // Diğer Shapefile bileşenlerini kontrol et
            // Klasör yapısını dikkate alarak base path'i bul
            const lastDotIndex = shpFile.lastIndexOf('.');
            const basePath = shpFile.substring(0, lastDotIndex); // "folder/filename"
            
            // Dosya adını (extension olmadan) bul
            // const fileNameOnly = basePath.split('/').pop(); 
            
            // Eşleşme mantığı: basePath ile başlayan ve uzantısı uyan dosyayı bul
            // Not: basePath büyük/küçük harf duyarlı olabilir, o yüzden fileNames içinde ararken dikkatli olmalıyız
            
            const findFile = (ext) => {
                return fileNames.find(name => {
                    // Tam eşleşme veya case-insensitive eşleşme
                    if (name.toLowerCase() === (basePath + ext).toLowerCase()) return true;
                    // Eğer basePath path içeriyorsa ve zip root'ta da dosya varsa? Genelde olmaz.
                    return false;
                });
            };

            const shxFile = findFile('.shx');
            const dbfFile = findFile('.dbf');
            const prjFile = findFile('.prj');
            const cpgFile = findFile('.cpg'); // Encoding dosyası

            safeLogDM('📂 Shapefile bileşenleri:', {
                shp: shpFile,
                shx: shxFile || '❌ eksik',
                dbf: dbfFile || '❌ eksik',
                prj: prjFile || '⚠️ opsiyonel - eksik',
                cpg: cpgFile || 'ℹ️ opsiyonel (encoding)'
            });
            
            // Projeksiyon kontrolü
            let isWGS84 = true;
            if (prjFile) {
                try {
                    const prjContent = await zip.file(prjFile).async("string");
                    if (!prjContent.includes('WGS_1984') && !prjContent.includes('GCS_WGS_1984') && !prjContent.includes('4326')) {
                        isWGS84 = false;
                        safeWarnDM('⚠️ Projeksiyon WGS84 değil:', prjContent.substring(0, 50) + '...');
                    }
                } catch (e) {
                    console.warn('PRJ okuma hatası', e);
                }
            }

            // Kullanıcıya bilgi ver
            if (typeof showEducationalFeedback === 'function') {
                let message = `📦 ZIP içinde ${fileNames.length} dosya bulundu. `;
                if (shpFile) message += `✅ ${shpFile.split('/').pop()}`;
                if (dbfFile) message += ` + attribute verileri`;
                if (!isWGS84) message += ` ⚠️ UYARI: Veri WGS84 projeksiyonunda değil! Haritada yanlış yerde görünebilir.`;
                else if (!prjFile) message += ` (⚠️ Koordinat sistemi bilgisi yok - WGS84 varsayılacak)`;
                showEducationalFeedback(message);
            }

            // shp.js ArrayBuffer'ı doğrudan işleyebilir
            try {
                safeLogDM('🔄 Shapefile parse ediliyor...');
                const geojson = await window.shp(arrayBuffer);

                safeLogDM('✅ Shapefile parse edildi:', geojson);
                
                // Koordinat validasyonu yap
                this._validateGeoJSONCoordinates(geojson);

                return this._processGeoJSONResult(geojson);
            } catch (parseError) {
                safeErrorDM('Parse hatası:', parseError);
                
                // Encoding hatası olabilir mi?
                if (parseError.message.includes('encoding') || parseError.message.includes('decode')) {
                    throw new Error(`Karakter seti hatası (Encoding). Lütfen verinizin UTF-8 veya Windows-1254 formatında olduğundan emin olun.`);
                }
                
                throw new Error(`Shapefile okunamadı: ${parseError.message}`);
            }
        } catch (error) {
            safeErrorDM('ZIP import hatası:', error);
            throw error;
        }
    }

    /**
     * Validate GeoJSON coordinates
     * @private
     */
    _validateGeoJSONCoordinates(geojson) {
        try {
            let sampleCoord = null;
            
            // İlk koordinatı bulmaya çalış
            if (geojson.features && geojson.features.length > 0) {
                const geom = geojson.features[0].geometry;
                if (geom) {
                    if (geom.type === 'Point') sampleCoord = geom.coordinates;
                    else if (geom.type === 'LineString' || geom.type === 'MultiPoint') sampleCoord = geom.coordinates[0];
                    else if (geom.type === 'Polygon' || geom.type === 'MultiLineString') sampleCoord = geom.coordinates[0][0];
                    else if (geom.type === 'MultiPolygon') sampleCoord = geom.coordinates[0][0][0];
                }
            } else if (Array.isArray(geojson)) {
                // shpjs bazen array döndürür
                 const geom = geojson[0]?.features?.[0]?.geometry;
                 if (geom) {
                     // Basitçe point kontrolü
                     if (geom.coordinates && Array.isArray(geom.coordinates)) sampleCoord = geom.coordinates; // Point
                 }
            }

            if (sampleCoord && Array.isArray(sampleCoord) && sampleCoord.length >= 2) {
                const [x, y] = sampleCoord;
                // WGS84 kabaca kontrol (-180..180, -90..90)
                if (Math.abs(x) > 180 || Math.abs(y) > 90) {
                    const msg = `⚠️ KOORDİNAT HATASI: Değerler WGS84 sınırları dışında (${x.toFixed(2)}, ${y.toFixed(2)}). Veriniz projeksiyonlu (UTM vb.) olabilir.`;
                    safeWarnDM(msg);
                    if (typeof showEducationalFeedback === 'function') {
                        showEducationalFeedback(msg);
                    }
                    // Toast mesajı göster (varsa)
                    if (window.Toast) window.Toast.error('Koordinat sistemi uyumsuz (WGS84 değil). Haritada görünmeyebilir.');
                }
            }
        } catch (e) {
            console.warn('Koordinat kontrolü atlandı', e);
        }
    }

    /**
     * Import single shapefile (legacy method)
     * @private
     */
    async _importSingleShapefile(file) {
        const url = URL.createObjectURL(file);

        try {
            const geojson = await this._parseShapefile(url);
            URL.revokeObjectURL(url);

            safeLogDM('Shapefile parse edildi:', geojson);

            return this._processGeoJSONResult(geojson);
        } catch (error) {
            URL.revokeObjectURL(url);
            throw error;
        }
    }

    /**
     * Read file as ArrayBuffer
     * @private
     */
    _readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Dosya okunamadı'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Check if shp.js library is loaded
     * @private
     */
    _checkShpLibrary() {
        if (typeof window.shp === 'undefined') {
            throw new Error('shp.js kütüphanesi yüklenmemiş. Sayfayı yenileyin.');
        }
    }

    /**
     * Check if JSZip library is loaded
     * @private
     */
    _checkJSZipLibrary() {
        if (typeof window.JSZip === 'undefined') {
            throw new Error('JSZip kütüphanesi yüklenmemiş. Sayfayı yenileyin.');
        }
    }

    /**
     * Parse shapefile using shp.js
     * @private
     */
    async _parseShapefile(url) {
        return await window.shp(url);
    }

    /**
     * Process GeoJSON result and import
     * @private
     */
    _processGeoJSONResult(geojson) {
        if (geojson?.type === 'FeatureCollection' && geojson.features) {
            return this._importFeatureCollection(geojson);
        } else if (geojson?.type === 'Feature') {
            return this._importSingleFeature(geojson);
        } else if (Array.isArray(geojson)) {
            return this._importFeatureArray(geojson);
        }

        safeWarnDM('Geçersiz GeoJSON formatı:', geojson);
        return false;
    }

    /**
     * Import FeatureCollection
     * @private
     */
    _importFeatureCollection(geojson) {
        this.importFromGeoJSONObject(geojson);
        return true;
    }

    /**
     * Import single Feature
     * @private
     */
    _importSingleFeature(geojson) {
        this.importFromGeoJSONObject({
            type: 'FeatureCollection',
            features: [geojson]
        });
        return true;
    }

    /**
     * Import array of features
     * @private
     */
    _importFeatureArray(geojson) {
        let hasData = false;
        const allFeatures = [];

        geojson.forEach(item => {
            if (item?.type === 'FeatureCollection' && item.features) {
                // FeatureCollection: tüm feature'ları topla
                allFeatures.push(...item.features);
                hasData = true;
            } else if (item?.type === 'Feature') {
                // Tek Feature: direkt ekle
                allFeatures.push(item);
                hasData = true;
            } else if (item?.type && item.geometry) {
                // Geometry objesi: Feature'a çevir
                allFeatures.push({
                    type: 'Feature',
                    geometry: item,
                    properties: {}
                });
                hasData = true;
            }
        });

        if (hasData && allFeatures.length > 0) {
            this.importFromGeoJSONObject({
                type: 'FeatureCollection',
                features: allFeatures
            });
        }

        return hasData;
    }

    /**
     * Import from GeoJSON object (helper for shapefile)
     */
    importFromGeoJSONObject(geojson) {
        const importedMarkers = [];
        let featureIndex = 0;

        geojson.features.forEach((feature, index) => {
            try {
                const markers = this._createMarkersFromFeature(feature, featureIndex);
                if (markers && markers.length > 0) {
                    importedMarkers.push(...markers);
                    featureIndex += markers.length;
                }
            } catch (error) {
                safeErrorDM(`Feature ${index} import hatası:`, error);
            }
        });

        this.userMarkers = importedMarkers;
        safeLogDM(`✅ ${importedMarkers.length} feature import edildi`);
    }

    /**
     * Create marker(s) from GeoJSON feature - Multi-geometry'ler için birden fazla marker döndürür
     * @private
     */
    _createMarkersFromFeature(feature, startIndex) {
        const geom = feature.geometry;
        const markers = [];

        if (this._shouldSkipFeature(geom, startIndex)) {
            return markers;
        }

        // Multi-geometry tipleri için her öğeyi ayrı marker'a çevir
        if (geom.type === 'MultiPoint' && geom.coordinates) {
            geom.coordinates.forEach((coord, idx) => {
                const marker = this._createBaseMarker(feature.properties, startIndex + idx);
                marker.lat = coord[1];
                marker.lon = coord[0];
                marker.type = 'point';
                if (this._isValidMarker(marker, startIndex + idx)) {
                    markers.push(marker);
                }
            });
        } else if (geom.type === 'MultiLineString' && geom.coordinates) {
            geom.coordinates.forEach((lineCoords, idx) => {
                const marker = this._createBaseMarker(feature.properties, startIndex + idx);
                marker.geometry = lineCoords.map(coord => ({
                    lat: coord[1],
                    lon: coord[0]
                }));
                if (marker.geometry.length > 0) {
                    marker.lat = marker.geometry[0].lat;
                    marker.lon = marker.geometry[0].lon;
                    marker.type = 'route';
                    if (this._isValidMarker(marker, startIndex + idx)) {
                        markers.push(marker);
                    }
                }
            });
        } else if (geom.type === 'MultiPolygon' && geom.coordinates) {
            geom.coordinates.forEach((polygonCoords, idx) => {
                const coords = polygonCoords[0]; // İlk ring (outer boundary)
                if (coords && coords.length > 0) {
                    const marker = this._createBaseMarker(feature.properties, startIndex + idx);
                    marker.geometry = coords.slice(0, -1).map(coord => ({
                        lat: coord[1],
                        lon: coord[0]
                    }));
                    if (marker.geometry.length > 0) {
                        marker.lat = marker.geometry[0].lat;
                        marker.lon = marker.geometry[0].lon;
                        marker.type = 'area';
                        if (this._isValidMarker(marker, startIndex + idx)) {
                            markers.push(marker);
                        }
                    }
                }
            });
        } else {
            // Tek geometry tipi (Point, LineString, Polygon)
            const marker = this._createMarkerFromGeoJSONFeature(feature, startIndex);
            if (marker) {
                markers.push(marker);
            }
        }

        return markers;
    }

    /**
     * Create marker from GeoJSON feature
     * @private
     */
    _createMarkerFromGeoJSONFeature(feature, index) {
        const geom = feature.geometry;

        if (this._shouldSkipFeature(geom, index)) {
            return null;
        }

        const marker = this._createBaseMarker(feature.properties, index);
        this._processFeatureGeometry(marker, geom);

        return this._isValidMarker(marker, index) ? marker : null;
    }

    /**
     * Check if feature should be skipped
     * @private
     */
    _shouldSkipFeature(geom, index) {
        if (!geom || !geom.type || !geom.coordinates) {
            safeWarnDM(`Feature ${index}: Geometry eksik`);
            return true;
        }
        return false;
    }

    /**
     * Create base marker object
     * @private
     */
    _createBaseMarker(props = {}, index) {
        const marker = {
            id: Date.now() + Math.random() + index,
            name: props.name || props.Name || props.NAME || props.ADM1_EN || props.admin || props.ADM1_TR || props.IL_ADI || `Feature ${index + 1}`,
            properties: { ...props } // Tüm properties'i koru
        };
        return marker;
    }

    /**
     * Process geometry and update marker
     * @private
     */
    _processFeatureGeometry(marker, geom) {
        const processors = {
            'Point': this._processPointGeometry.bind(this),
            'LineString': this._processLineStringGeometry.bind(this),
            'Polygon': this._processPolygonGeometry.bind(this),
            'MultiPoint': this._processMultiPointGeometry.bind(this),
            'MultiLineString': this._processMultiLineStringGeometry.bind(this),
            'MultiPolygon': this._processMultiPolygonGeometry.bind(this)
        };

        const processor = processors[geom.type];
        if (processor) {
            processor(marker, geom);
        } else {
            safeWarnDM(`Desteklenmeyen geometry tipi: ${geom.type}`);
        }
    }

    /**
     * Process Point geometry
     * @private
     */
    _processPointGeometry(marker, geom) {
        marker.lat = geom.coordinates[1];
        marker.lon = geom.coordinates[0];
        marker.type = 'point';
    }

    /**
     * Process LineString geometry
     * @private
     */
    _processLineStringGeometry(marker, geom) {
        marker.geometry = geom.coordinates.map(coord => ({
            lat: coord[1],
            lon: coord[0]
        }));

        if (marker.geometry.length > 0) {
            marker.lat = marker.geometry[0].lat;
            marker.lon = marker.geometry[0].lon;
            marker.type = 'route';
        }
    }

    /**
     * Process Polygon geometry
     * @private
     */
    _processPolygonGeometry(marker, geom) {
        const coords = geom.coordinates[0];
        if (coords && coords.length > 0) {
            marker.geometry = coords.slice(0, -1).map(coord => ({
                lat: coord[1],
                lon: coord[0]
            }));

            if (marker.geometry.length > 0) {
                marker.lat = marker.geometry[0].lat;
                marker.lon = marker.geometry[0].lon;
                marker.type = 'area';
            }
        }
    }

    /**
     * Process MultiPoint geometry - Her point için ayrı marker oluşturulmalı
     * Bu fonksiyon sadece ilk point'i işler, diğerleri için importFromGeoJSONObject içinde ayrı feature'lar oluşturulmalı
     * @private
     */
    _processMultiPointGeometry(marker, geom) {
        if (geom.coordinates && geom.coordinates.length > 0) {
            const firstCoord = geom.coordinates[0];
            marker.lat = firstCoord[1];
            marker.lon = firstCoord[0];
            marker.type = 'point';
            // Not: Diğer point'ler için importFromGeoJSONObject içinde ayrı işleme yapılacak
            marker._multiGeometry = {
                type: 'MultiPoint',
                coordinates: geom.coordinates
            };
        }
    }

    /**
     * Process MultiLineString geometry - Her line için ayrı marker oluşturulmalı
     * @private
     */
    _processMultiLineStringGeometry(marker, geom) {
        if (geom.coordinates && geom.coordinates.length > 0) {
            const firstLine = geom.coordinates[0];
            if (firstLine && firstLine.length > 0) {
                marker.geometry = firstLine.map(coord => ({
                    lat: coord[1],
                    lon: coord[0]
                }));
                if (marker.geometry.length > 0) {
                    marker.lat = marker.geometry[0].lat;
                    marker.lon = marker.geometry[0].lon;
                    marker.type = 'route';
                }
            }
            // Not: Diğer line'lar için importFromGeoJSONObject içinde ayrı işleme yapılacak
            marker._multiGeometry = {
                type: 'MultiLineString',
                coordinates: geom.coordinates
            };
        }
    }

    /**
     * Process MultiPolygon geometry - Her polygon için ayrı marker oluştur
     * @private
     */
    _processMultiPolygonGeometry(marker, geom) {
        if (geom.coordinates && geom.coordinates.length > 0) {
            const firstPolygon = geom.coordinates[0];
            const coords = firstPolygon[0];
            if (coords && coords.length > 0) {
                marker.geometry = coords.slice(0, -1).map(coord => ({
                    lat: coord[1],
                    lon: coord[0]
                }));
                if (marker.geometry.length > 0) {
                    marker.lat = marker.geometry[0].lat;
                    marker.lon = marker.geometry[0].lon;
                    marker.type = 'area';
                }
            }
            // Not: Diğer polygon'lar için importFromGeoJSONObject içinde ayrı işleme yapılacak
            marker._multiGeometry = {
                type: 'MultiPolygon',
                coordinates: geom.coordinates
            };
        }
    }

    /**
     * Validate marker coordinates
     * @private
     */
    _isValidMarker(marker, index) {
        if (marker.lat !== undefined && marker.lon !== undefined &&
            !isNaN(marker.lat) && !isNaN(marker.lon)) {
            return true;
        }

        safeWarnDM(`Feature ${index}: Geçersiz koordinatlar`, marker);
        return false;
    }

    /**
     * Import GeoJSON directly to map using L.geoJSON() - FIXED VERSION
     */
    importGeoJSONToMap(geojson) {
        this.userMarkers = [];

        const geoJSONLayer = L.geoJSON(geojson, {
            style: (feature) => this._getStyleForGeometry(feature.geometry.type),
            onEachFeature: (feature, layer) => this._processGeoJSONFeature(feature, layer)
        });

        safeLogDM(`✅ GeoJSON ${geojson.features.length} feature ile haritaya eklendi`);
        return geoJSONLayer;
    }

    /**
     * Get style based on geometry type
     * @private
     */
    _getStyleForGeometry(geomType) {
        const styles = {
            'Point': {
                color: '#2563EB',
                fillColor: '#3B82F6',
                fillOpacity: 0.6,
                weight: 2,
                radius: 6
            },
            'LineString': {
                color: '#EA580C',
                weight: 3
            },
            'Polygon': {
                color: '#059669',
                fillColor: '#10B981',
                fillOpacity: 0.3,
                weight: 2
            },
            'MultiPolygon': {
                color: '#059669',
                fillColor: '#10B981',
                fillOpacity: 0.3,
                weight: 2
            }
        };

        return styles[geomType] || {
            color: '#6B7280',
            weight: 1
        };
    }

    /**
     * Process each GeoJSON feature
     * @private
     */
    _processGeoJSONFeature(feature, layer) {
        const props = feature.properties || {};
        const name = this._extractFeatureName(props, feature.geometry.type);
        const description = this._extractFeatureDescription(props);

        safeLogDM('Feature properties:', props);

        const popupHTML = this._createFeaturePopup(name, description, feature.geometry.type, props);
        layer.bindPopup(popupHTML);

        const markerData = this._createMarkerFromFeature(feature, name);
        this.userMarkers.push(markerData);
    }

    /**
     * Extract feature name from properties
     * @private
     */
    _extractFeatureName(props, geomType) {
        return props.ILCEAD || props.ilcead || props.ILCE_ADI || props.ilce_adi ||
               props.name || props.Name || props.NAME || props.ADM1_EN || props.admin ||
               props.ilce || props.ILCE || props.district || props.DISTRICT ||
               props.district_name || props.DISTRICT_NAME || props.title || props.TITLE ||
               props.label || props.LABEL || `İsimsiz ${geomType}`;
    }

    /**
     * Extract feature description from properties
     * @private
     */
    _extractFeatureDescription(props) {
        return props.description || props.Description || props.desc ||
               props.aciklama || props.ACIKLAMA || props.not || props.NOT || '';
    }

    /**
     * Create popup HTML for feature
     * @private
     */
    _createFeaturePopup(name, description, geomType, props) {
        const descriptionHTML = description ? `<p style="margin: 5px 0;">${description}</p>` : '';
        const propertiesHTML = Object.entries(props)
            .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
            .join('');

        return `
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0; font-weight: bold;">${name}</h4>
                ${descriptionHTML}
                <p style="margin: 5px 0;"><strong>Tür:</strong> ${geomType}</p>
                <details style="margin-top: 10px;">
                    <summary style="cursor: pointer; font-size: 12px; color: #666;">Tüm Özellikler</summary>
                    <div style="font-size: 11px; margin-top: 5px; max-height: 150px; overflow-y: auto;">
                        ${propertiesHTML}
                    </div>
                </details>
            </div>
        `;
    }

    /**
     * Create marker data from GeoJSON feature
     * @private
     */
    _createMarkerFromFeature(feature, name) {
        return {
            id: Date.now() + Math.random(),
            name: name,
            type: this.getMarkerTypeFromGeometry(feature.geometry.type),
            lat: this.getCenterLat(feature),
            lon: this.getCenterLon(feature),
            geometry: this.getGeometryForMarker(feature)
        };
    }

    /**
     * Get marker type from geometry type
     */
    getMarkerTypeFromGeometry(geomType) {
        switch (geomType) {
            case 'Point': return 'point';
            case 'LineString': return 'route';
            case 'Polygon':
            case 'MultiPolygon': return 'area';
            default: return 'point';
        }
    }

    /**
     * Get center latitude from feature
     */
    getCenterLat(feature) {
        const geom = feature.geometry;
        if (geom.type === 'Point') {
            return geom.coordinates[1];
        } else if (geom.type === 'LineString') {
            const coords = geom.coordinates;
            return coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
        } else if (geom.type === 'Polygon') {
            const coords = geom.coordinates[0];
            return coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
        } else if (geom.type === 'MultiPolygon') {
            const coords = geom.coordinates[0][0];
            return coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
        }
        return 0;
    }

    /**
     * Get center longitude from feature
     */
    getCenterLon(feature) {
        const geom = feature.geometry;
        if (geom.type === 'Point') {
            return geom.coordinates[0];
        } else if (geom.type === 'LineString') {
            const coords = geom.coordinates;
            return coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
        } else if (geom.type === 'Polygon') {
            const coords = geom.coordinates[0];
            return coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
        } else if (geom.type === 'MultiPolygon') {
            const coords = geom.coordinates[0][0];
            return coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
        }
        return 0;
    }

    /**
     * Get geometry for marker storage
     */
    getGeometryForMarker(feature) {
        const geom = feature.geometry;
        if (geom.type === 'LineString') {
            return geom.coordinates.map(coord => ({
                lat: coord[1],
                lon: coord[0]
            }));
        } else if (geom.type === 'Polygon') {
            return geom.coordinates[0].slice(0, -1).map(coord => ({
                lat: coord[1],
                lon: coord[0]
            }));
        } else if (geom.type === 'MultiPolygon') {
            return geom.coordinates[0][0].slice(0, -1).map(coord => ({
                lat: coord[1],
                lon: coord[0]
            }));
        }
        return null;
    }

    /**
     * Escape XML special characters
     */
    escapeXML(str) {
        if (!str) return '';
        return str.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    /**
     * Clear all data
     */
    clearAll() {
        this.userMarkers = [];
        this.measurements = [];
        this.lastClickedLatLng = null;
    }

    /**
     * Excel/CSV dosyasından veri yükle
     */
    importExcelCSV(file) {
        return new Promise((resolve, reject) => {
            const isCSV = file.name.toLowerCase().endsWith('.csv');

            const onSuccess = (e) => {
                try {
                    const jsonData = this._parseFileContent(e, isCSV);
                    this._validateParsedData(jsonData, reject);

                    const result = this._createImportResult(jsonData);
                    resolve(result);
                } catch (error) {
                    safeErrorDM('Dosya okuma hatası:', error);
                    reject(error);
                }
            };

            const onError = () => reject(new Error('Dosya okunamadı'));

            this._readFileWithReader(file, isCSV, onSuccess, onError);
        });
    }

    /**
     * Parse file content based on type
     * @private
     */
    _parseFileContent(e, isCSV) {
        return isCSV ?
            this.parseCSV(e.target.result) :
            this._parseExcelFile(e.target.result);
    }

    /**
     * Parse Excel file
     * @private
     */
    _parseExcelFile(arrayBuffer) {
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        return XLSX.utils.sheet_to_json(worksheet);
    }

    /**
     * Validate parsed data
     * @private
     */
    _validateParsedData(jsonData, reject) {
        if (!jsonData || jsonData.length === 0) {
            reject(new Error('Dosyada veri bulunamadı'));
            return false;
        }
        return true;
    }

    /**
     * Create import result object
     * @private
     */
    _createImportResult(jsonData) {
        safeLogDM('Dosya yüklendi:', jsonData.length, 'satır');
        safeLogDM('İlk satır örneği:', jsonData[0]);

        const matchedData = this.matchProvinceData(jsonData);

        return {
            raw: jsonData,
            matched: matchedData,
            columns: Object.keys(jsonData[0])
        };
    }

    /**
     * Read file with FileReader
     * @private
     */
    _readFileWithReader(file, isCSV, onSuccess, onError) {
        const reader = new FileReader();

        reader.onload = onSuccess;
        reader.onerror = onError;

        if (isCSV) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }
    
    /**
     * CSV dosyasını parse et
     */
    parseCSV(text) {
        const lines = text.trim().split(/\r?\n/);
        
        if (lines.length < 2) {
            throw new Error('CSV dosyası en az 2 satır içermelidir (başlık + veri)');
        }
        
        // Başlık satırını al
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Veri satırlarını parse et
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            if (values.length !== headers.length) {
            safeWarnDM(`Satır ${i + 1}: Sütun sayısı uyuşmuyor`);
                continue;
            }
            
            const row = {};
            headers.forEach((header, index) => {
                // Sayıyı dene, değilse string olarak bırak
                const value = values[index];
                const numValue = Number(value);
                row[header] = isNaN(numValue) ? value : numValue;
            });
            
            data.push(row);
        }
        
        return data;
    }

    /**
     * İl sütununu tespit et ve koordinatlarla eşleştir
     */
    matchProvinceData(jsonData) {
        if (!jsonData || jsonData.length === 0) {
            return [];
        }

        const columns = Object.keys(jsonData[0]);
        const provinceColumn = this._detectProvinceColumn(columns);

        safeLogDM('İl sütunu:', provinceColumn);

        const { matched, matchCount } = this._matchAllRows(jsonData, provinceColumn);

        safeLogDM(`${matchCount}/${jsonData.length} il eşleştirildi`);

        return matched;
    }

    /**
     * Detect province column from available columns
     * @private
     */
    _detectProvinceColumn(columns) {
        const provinceColumnNames = ['il', 'şehir', 'sehir', 'province', 'city', 'İl', 'Şehir'];

        for (const col of columns) {
            const normalized = col.toLowerCase().trim();
            if (provinceColumnNames.some(name => normalized.includes(name.toLowerCase()))) {
                return col;
            }
        }

        safeWarnDM('İl sütunu bulunamadı, ilk sütun kullanılıyor:', columns[0]);
        return columns[0];
    }

    /**
     * Match all rows with province data
     * @private
     */
    _matchAllRows(jsonData, provinceColumn) {
        const matched = [];
        let matchCount = 0;

        jsonData.forEach((row, index) => {
            const matchedRow = this._matchRowWithProvince(row, provinceColumn, index);
            if (matchedRow) {
                matched.push(matchedRow);
                if (!matchedRow._notMatched) {
                    matchCount++;
                }
            }
        });

        return { matched, matchCount };
    }

    /**
     * Match a single row with province coordinates
     * @private
     */
    _matchRowWithProvince(row, provinceColumn, index) {
        const provinceName = row[provinceColumn];

        if (!provinceName) {
            safeWarnDM(`Satır ${index + 1}: İl adı boş`);
            return null;
        }

        const province = getProvince(provinceName);

        return province ?
            this._createMatchedRow(row, province, provinceName) :
            this._createUnmatchedRow(row, provinceName);
    }

    /**
     * Create matched row with province coordinates
     * @private
     */
    _createMatchedRow(row, province, provinceName) {
        return {
            ...row,
            il: province.name,
            lat: province.lat,
            lon: province.lon,
            _originalProvinceName: provinceName
        };
    }

    /**
     * Create unmatched row without coordinates
     * @private
     */
    _createUnmatchedRow(row, provinceName) {
        safeWarnDM(`İl koordinatı bulunamadı: ${provinceName}`);
        return {
            ...row,
            il: provinceName,
            lat: null,
            lon: null,
            _originalProvinceName: provinceName,
            _notMatched: true
        };
    }

    /**
     * Sayısal sütunları tespit et
     */
    detectNumericColumns(data) {
        if (!data || data.length === 0) {
            return [];
        }
        
        const firstRow = data[0];
        const columns = Object.keys(firstRow);
        const numericColumns = [];
        
        columns.forEach(col => {
            // İl sütununu, koordinatları ve internal field'ları atla
            const normalized = col.toLowerCase().trim();
            if (normalized.includes('il') || normalized.includes('şehir') || 
                normalized.includes('sehir') || normalized.includes('province') || 
                normalized.includes('city') || normalized === 'lat' || 
                normalized === 'lon' || normalized === 'lng' || 
                normalized === 'latitude' || normalized === 'longitude' ||
                col.startsWith('_')) {
                return;
            }
            
            // Birkaç satırı kontrol et
            const sampleSize = Math.min(5, data.length);
            let numericCount = 0;
            
            for (let i = 0; i < sampleSize; i++) {
                const value = data[i][col];
                if (value !== null && value !== undefined && !isNaN(Number(value))) {
                    numericCount++;
                }
            }
            
            // %80'i sayısal ise kabul et
            if (numericCount / sampleSize >= 0.8) {
                numericColumns.push(col);
            }
        });
        
        return numericColumns;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}

// Browser global export
if (typeof window !== 'undefined') {
    window.DataManager = DataManager;
}