/**
 * Excel Utilities - Excel Export Helper Functions
 * Provides utilities for exporting markers to Excel format using XLSX.js
 * Note: Requires XLSX.js library to be loaded
 */

/**
 * Convert markers to Excel workbook data
 * @param {Array} markers - Array of marker objects
 * @returns {Object} - Workbook data structure
 */
function markersToExcelData(markers) {
    // Main data worksheet
    const mainData = [
        ['Ad', 'Enlem', 'Boylam', 'Tür', 'Geometri Noktaları'],
        ...markers.map(m => {
            let geometryInfo = '';
            if (m.geometry && m.geometry.length > 0) {
                geometryInfo = m.geometry.map(p => `${p.lat},${p.lon}`).join('; ');
            }
            return [m.name, m.lat, m.lon, m.type, geometryInfo];
        })
    ];

    // Statistics worksheet
    const statsData = [
        ['CBS Proje İstatistikleri'],
        [''],
        ['Toplam Veri', markers.length],
        ['Nokta Verisi', markers.filter(m => m.type === 'point').length],
        ['Alan Verisi', markers.filter(m => m.type === 'area').length],
        ['Rota Verisi', markers.filter(m => m.type === 'route').length],
        ['Çember Verisi', markers.filter(m => m.type === 'circle').length],
        [''],
        ['Export Tarihi', new Date().toLocaleString('tr-TR')]
    ];

    return {
        mainData: mainData,
        statsData: statsData,
        columnWidths: [
            { wch: 20 }, // Ad
            { wch: 12 }, // Enlem
            { wch: 12 }, // Boylam
            { wch: 10 }, // Tür
            { wch: 40 }  // Geometri
        ]
    };
}

/**
 * Create Excel workbook from markers using XLSX.js
 * @param {Array} markers - Array of marker objects
 * @param {string} fileName - File name (without extension)
 * @returns {Object|null} - Workbook object or null if XLSX not available
 */
function createExcelWorkbook(markers, fileName = 'cbs-data') {
    // Check if XLSX is available
    if (typeof XLSX === 'undefined') {
        if (window.Logger && typeof window.Logger.error === 'function') { window.Logger.error('XLSX.js library not loaded'); } else { console.error('XLSX.js library not loaded'); }
        return null;
    }

    const excelData = markersToExcelData(markers);

    // Create main worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData.mainData);
    ws['!cols'] = excelData.columnWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CBS Verileri');

    // Create statistics worksheet
    const ws_stats = XLSX.utils.aoa_to_sheet(excelData.statsData);
    XLSX.utils.book_append_sheet(wb, ws_stats, 'İstatistikler');

    return wb;
}

/**
 * Export markers to Excel file
 * @param {Array} markers - Array of marker objects
 * @param {string} fileName - File name (without extension)
 * @returns {boolean} - True if successful, false otherwise
 */
function exportMarkersToExcel(markers, fileName = 'cbs-data') {
    if (typeof XLSX === 'undefined') {
        if (window.Logger && typeof window.Logger.error === 'function') { window.Logger.error('XLSX.js library not loaded'); } else { console.error('XLSX.js library not loaded'); }
        if (typeof window.showFeedback === 'function') {
            window.showFeedback('❌ Excel kütüphanesi yüklü değil', 'error', 3000);
        }
        return false;
    }

    try {
        const wb = createExcelWorkbook(markers, fileName);
        if (wb) {
            XLSX.writeFile(wb, `${fileName}.xlsx`);
            return true;
        }
        return false;
    } catch (error) {
        if (window.Logger && typeof window.Logger.error === 'function') { window.Logger.error('Error exporting to Excel:', error); } else { console.error('Error exporting to Excel:', error); }
        return false;
    }
}

/**
 * Get marker statistics for Excel export
 * @param {Array} markers - Array of marker objects
 * @returns {Object} - Statistics object
 */
function getMarkerStatistics(markers) {
    const stats = {
        total: markers.length,
        byType: {
            point: markers.filter(m => m.type === 'point' || !m.type).length,
            area: markers.filter(m => m.type === 'area').length,
            route: markers.filter(m => m.type === 'route').length,
            circle: markers.filter(m => m.type === 'circle').length
        },
        withGeometry: markers.filter(m => m.geometry && m.geometry.length > 0).length,
        exportDate: new Date().toLocaleString('tr-TR')
    };

    return stats;
}

/**
 * Format statistics for display
 * @param {Object} stats - Statistics object from getMarkerStatistics
 * @returns {string} - Formatted message
 */
function formatExcelExportMessage(stats) {
    return `📗 Excel export edildi: ${stats.total} veri ` +
           `(${stats.byType.point} nokta, ${stats.byType.route} rota, ` +
           `${stats.byType.area} alan, ${stats.byType.circle} çember)`;
}

/**
 * Validate XLSX library availability
 * @returns {Object} - {available: boolean, message: string}
 */
function validateXLSXAvailability() {
    if (typeof XLSX === 'undefined') {
        return {
            available: false,
            message: 'XLSX.js kütüphanesi yüklü değil. Excel export için gerekli.'
        };
    }

    return {
        available: true,
        message: 'XLSX.js kütüphanesi hazır'
    };
}

/**
 * Create summary statistics worksheet data
 * @param {Array} markers - Array of marker objects
 * @returns {Array} - 2D array for worksheet
 */
function createSummaryWorksheetData(markers) {
    const stats = getMarkerStatistics(markers);

    return [
        ['🗺️ CBS Proje Özeti'],
        [''],
        ['Genel Bilgiler'],
        ['Toplam Veri Sayısı', stats.total],
        ['Export Tarihi', stats.exportDate],
        [''],
        ['Veri Türleri'],
        ['📍 Nokta Verisi', stats.byType.point],
        ['📏 Rota Verisi', stats.byType.route],
        ['🔷 Alan Verisi', stats.byType.area],
        ['⭕ Çember Verisi', stats.byType.circle],
        [''],
        ['Geometri İstatistikleri'],
        ['Geometriye Sahip Veri', stats.withGeometry],
        ['Basit Nokta Verisi', stats.total - stats.withGeometry]
    ];
}

// Legacy: Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.ExcelUtils = {
        markersToExcelData,
        createExcelWorkbook,
        exportMarkersToExcel,
        getMarkerStatistics,
        formatExcelExportMessage,
        validateXLSXAvailability,
        createSummaryWorksheetData
    };
}
