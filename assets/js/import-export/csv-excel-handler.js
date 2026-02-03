/**
 * CSV/Excel Handler Module
 */
class CSVExcelHandler {
    constructor(manager) {
        this.manager = manager;
        this.log = (...args) => (window.Logger && typeof window.Logger.log === 'function') ? window.Logger.log(...args) : console.log(...args);
        this.warn = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);
    }

    /**
     * Import CSV
     */
    async importCSV(file, userMarkers, clearCallback, requiresCoordinates = true) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const csvText = e.target.result;
                const lines = csvText.split('\n').filter(line => line.trim());
                if (lines.length < 2) return;

                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const autoDetected = this._detectColumns(headers);
                
                let columnMap = await this._resolveColumns(headers, lines, autoDetected, requiresCoordinates);
                if (!columnMap) return; // Cancelled

                const markers = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = this._parseCSVLine(lines[i]);
                    const row = {};
                    headers.forEach((h, idx) => row[h] = values[idx] || '');
                    
                    const marker = this._createMarkerFromRow(row, columnMap, i);
                    if (marker) markers.push(marker);
                }

                await this._processMarkers(markers, userMarkers, clearCallback, 'csv');
            } catch (error) {
                this.warn('CSV Error:', error);
            }
        };
        reader.readAsText(file, 'UTF-8');
    }

    /**
     * Import Excel (XLSX)
     */
    async importXLSX(file, userMarkers, clearCallback, requiresCoordinates = true) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                if (jsonData.length === 0) return;

                const headers = Object.keys(jsonData[0]);
                const autoDetected = this._detectColumns(headers);
                
                // Preview data for column mapper
                const previewRows = jsonData.slice(0, 10);
                let columnMap = autoDetected;

                if (requiresCoordinates && (!autoDetected.lat || !autoDetected.lon)) {
                    try {
                        const mapper = new window.CoordinateMapper();
                        columnMap = await mapper.show(headers, previewRows, autoDetected);
                    } catch (err) { return; }
                }

                const markers = jsonData.map((row, idx) => this._createMarkerFromRow(row, columnMap, idx)).filter(m => m);
                await this._processMarkers(markers, userMarkers, clearCallback, 'xlsx');
            } catch (error) {
                this.warn('Excel Error:', error);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    _detectColumns(headers) {
        // Simple detection logic (expanded in full implementation)
        const map = {};
        headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes('lat') || lower.includes('enlem')) map.lat = h;
            if (lower.includes('lon') || lower.includes('boylam') || lower.includes('lng')) map.lon = h;
            if (lower.includes('name') || lower.includes('ad') || lower.includes('isim')) map.name = h;
            if (lower.includes('type') || lower.includes('tur') || lower.includes('tür')) map.type = h;
        });
        return map;
    }

    async _resolveColumns(headers, lines, autoDetected, requiresCoordinates) {
        let columnMap = autoDetected;
        const hasCoords = columnMap.lat && columnMap.lon;
        
        if (requiresCoordinates && !hasCoords) {
            try {
                const previewRows = [];
                for(let i=1; i<Math.min(10, lines.length); i++) {
                    const vals = this._parseCSVLine(lines[i]);
                    const row = {};
                    headers.forEach((h, idx) => row[h] = vals[idx]);
                    previewRows.push(row);
                }
                const mapper = new window.CoordinateMapper();
                columnMap = await mapper.show(headers, previewRows, autoDetected);
            } catch (e) { return null; }
        }
        return columnMap;
    }

    _parseCSVLine(line) {
        const values = [];
        let current = '', inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { values.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
            else current += char;
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        return values;
    }

    _createMarkerFromRow(row, map, index) {
        let lat = map.lat ? Number(row[map.lat]) : 0;
        let lon = map.lon ? Number(row[map.lon]) : 0;
        
        // Geometry handling
        let geometry = null;
        if (row['Geometri Noktaları']) {
            const points = row['Geometri Noktaları'].split(';').map(p => {
                const [lt, ln] = p.split(',').map(Number);
                return { lat: lt, lon: ln };
            });
            if (points.length) geometry = points;
        }

        return {
            id: Date.now() + index + Math.random(),
            name: map.name ? row[map.name] : `Row ${index}`,
            lat: lat,
            lon: lon,
            type: map.type ? row[map.type] : 'point',
            geometry: geometry,
            properties: row
        };
    }

    async _processMarkers(markers, userMarkers, clearCallback, type) {
        if (markers.length === 0) return;
        clearCallback();

        if (markers.length > 1000 && !window.clusteringEnabled) {
            this.manager.enableClustering();
        }

        const fields = Object.keys(markers[0].properties || {});
        
        if (markers.length > 200) {
            await this.manager.batchProcessor.process(markers, userMarkers, markers.length);
        } else {
            markers.forEach(m => {
                userMarkers.push(m);
                this.manager._addMarkerToMap(m);
            });
        }

        this.manager._callUpdateCallback();
        this.manager.utils.showFeedback(markers.length, type.toUpperCase());
        this.manager._showStylePanelFAB(markers.length, fields);
    }

    exportCSV(fileName, userMarkers) {
        const headers = ['Ad', 'Enlem', 'Boylam', 'Tür', 'Geometri Noktaları'];
        const content = [
            headers.join(','),
            ...userMarkers.map(m => {
                const geom = m.geometry ? m.geometry.map(p => `${p.lat},${p.lon}`).join(';') : '';
                return [`"${m.name}"`, m.lat, m.lon, `"${m.type}"`, `"${geom}"`].join(',');
            })
        ].join('\n');
        this.manager.downloadFile(content, `${fileName}.csv`, 'text/csv');
    }

    exportXLSX(fileName, userMarkers) {
        const data = [['Ad', 'Enlem', 'Boylam', 'Tür', 'Geometri'], ...userMarkers.map(m => [m.name, m.lat, m.lon, m.type, m.geometry ? 'Poly/Line' : 'Point'])];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    }
}

window.CSVExcelHandler = CSVExcelHandler;
