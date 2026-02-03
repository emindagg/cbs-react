/**
 * CSV Utilities - CSV Import/Export Helper Functions
 * Provides utilities for converting between marker format and CSV
 */

/**
 * Convert markers array to CSV string
 * @param {Array} markers - Array of marker objects
 * @returns {string} - CSV string
 */
function markersToCsv(markers) {
    const headers = ['Ad', 'Enlem', 'Boylam', 'Tür', 'Geometri Noktaları'];
    const csvContent = [
        headers.join(','),
        ...markers.map(m => {
            let geometryInfo = '';
            if (m.geometry && m.geometry.length > 0) {
                geometryInfo = m.geometry.map(p => `${p.lat},${p.lon}`).join(';');
            }
            return [
                `"${escapeCSVField(m.name)}"`,
                m.lat,
                m.lon,
                `"${m.type}"`,
                `"${escapeCSVField(geometryInfo)}"`
            ].join(',');
        })
    ].join('\n');

    return csvContent;
}

/**
 * Escape CSV field (handle quotes and special characters)
 * @param {string} field - Field value
 * @returns {string} - Escaped field
 */
function escapeCSVField(field) {
    if (!field) return '';
    const str = String(field);
    // If field contains quotes, double them
    return str.replace(/"/g, '""');
}

/**
 * Parse CSV string to markers array
 * @param {string} csvText - CSV text content
 * @returns {Object} - {markers: Array, stats: Object}
 */
function csvToMarkers(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const markers = [];
    const stats = { imported: 0, skipped: 0, errors: [] };

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        try {
            const line = lines[i];
            const fields = parseCSVLine(line);

            if (fields.length < 3) {
                stats.skipped++;
                stats.errors.push(`Satır ${i + 1}: Yetersiz sütun`);
                continue;
            }

            const name = fields[0] || `Marker ${i}`;
            const lat = parseFloat(fields[1]);
            const lon = parseFloat(fields[2]);
            const type = fields[3] || 'point';

            // Validate coordinates
            if (isNaN(lat) || isNaN(lon)) {
                stats.skipped++;
                stats.errors.push(`Satır ${i + 1}: Geçersiz koordinatlar`);
                continue;
            }

            if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
                stats.skipped++;
                stats.errors.push(`Satır ${i + 1}: Koordinatlar aralık dışında`);
                continue;
            }

            const marker = {
                id: `marker-${Date.now()}-${i}`,
                name: name,
                lat: lat,
                lon: lon,
                type: type
            };

            // Parse geometry if present
            if (fields[4]) {
                const geometryStr = fields[4];
                const geometryPoints = parseGeometryString(geometryStr);
                if (geometryPoints && geometryPoints.length > 0) {
                    marker.geometry = geometryPoints;
                }
            }

            markers.push(marker);
            stats.imported++;
        } catch (error) {
            stats.skipped++;
            stats.errors.push(`Satır ${i + 1}: ${error.message}`);
        }
    }

    return { markers, stats };
}

/**
 * Parse a CSV line respecting quoted fields
 * @param {string} line - CSV line
 * @returns {Array} - Array of fields
 */
function parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }

    // Add last field
    fields.push(currentField.trim());

    return fields;
}

/**
 * Parse geometry string from CSV
 * Format: "lat1,lon1;lat2,lon2;..."
 * @param {string} geometryStr - Geometry string
 * @returns {Array|null} - Array of {lat, lon} objects or null
 */
function parseGeometryString(geometryStr) {
    if (!geometryStr || geometryStr.trim() === '') return null;

    try {
        const points = geometryStr.split(';');
        const geometryPoints = [];

        for (const point of points) {
            const [lat, lon] = point.split(',').map(s => parseFloat(s.trim()));
            if (!isNaN(lat) && !isNaN(lon)) {
                geometryPoints.push({ lat, lon });
            }
        }

        return geometryPoints.length > 0 ? geometryPoints : null;
    } catch (error) {
        if (window.Logger && typeof window.Logger.error === 'function') {
            window.Logger.error('Error parsing geometry string:', error);
        } else {
            console.error('Error parsing geometry string:', error);
        }
        return null;
    }
}

/**
 * Detect CSV delimiter
 * @param {string} csvText - CSV text
 * @returns {string} - Detected delimiter (comma, semicolon, tab)
 */
function detectCSVDelimiter(csvText) {
    const firstLine = csvText.split('\n')[0];
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0;
    let detectedDelimiter = ',';

    delimiters.forEach(delimiter => {
        const count = (firstLine.match(new RegExp('\\' + delimiter, 'g')) || []).length;
        if (count > maxCount) {
            maxCount = count;
            detectedDelimiter = delimiter;
        }
    });

    return detectedDelimiter;
}

/**
 * Validate CSV structure
 * @param {string} csvText - CSV text
 * @returns {Object} - {valid: boolean, message: string, rowCount: number}
 */
function validateCSV(csvText) {
    if (!csvText || csvText.trim() === '') {
        return { valid: false, message: 'CSV dosyası boş', rowCount: 0 };
    }

    const lines = csvText.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
        return { valid: false, message: 'CSV en az başlık ve bir veri satırı içermelidir', rowCount: 0 };
    }

    return {
        valid: true,
        message: 'Geçerli CSV',
        rowCount: lines.length - 1 // Exclude header
    };
}

// Legacy: Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.CSVUtils = {
        markersToCsv,
        csvToMarkers,
        detectCSVDelimiter,
        validateCSV
    };

    // Export individual items for tests
    window.csvToMarkers = csvToMarkers;
}
