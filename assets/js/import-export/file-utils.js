/**
 * File Utilities - Common File Download Helper Functions
 * Provides utilities for downloading files in various formats
 */

/**
 * Download file to user's computer
 * @param {string|Blob} content - File content (string or Blob)
 * @param {string} fileName - File name with extension
 * @param {string} mimeType - MIME type (e.g., 'text/plain', 'application/json')
 */
function downloadFile(content, fileName, mimeType = 'text/plain') {
    let blob;

    // Handle Blob or create from string
    if (content instanceof Blob) {
        blob = content;
    } else {
        blob = new Blob([content], { type: mimeType });
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', url);
    downloadAnchorNode.setAttribute('download', fileName);

    // Trigger download
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();

    // Cleanup
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
}

/**
 * Read file as text
 * @param {File} file - File object from input
 * @returns {Promise<string>} - File content as text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Read file as ArrayBuffer
 * @param {File} file - File object from input
 * @returns {Promise<ArrayBuffer>} - File content as ArrayBuffer
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Read file as Data URL (base64)
 * @param {File} file - File object from input
 * @returns {Promise<string>} - File content as data URL
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Get file extension from file name
 * @param {string} fileName - File name
 * @returns {string} - File extension (lowercase, without dot)
 */
function getFileExtension(fileName) {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Validate file size
 * @param {File} file - File object
 * @param {number} maxSizeMB - Maximum size in megabytes
 * @returns {Object} - {valid: boolean, message: string}
 */
function validateFileSize(file, maxSizeMB = 50) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            message: `Dosya boyutu ${maxSizeMB}MB'dan büyük olamaz (${(file.size / 1024 / 1024).toFixed(2)}MB)`
        };
    }

    return {
        valid: true,
        message: 'Dosya boyutu uygun'
    };
}

/**
 * Validate file type
 * @param {File} file - File object
 * @param {Array<string>} allowedExtensions - Array of allowed extensions (e.g., ['json', 'geojson'])
 * @returns {Object} - {valid: boolean, message: string}
 */
function validateFileType(file, allowedExtensions) {
    const extension = getFileExtension(file.name);

    if (!allowedExtensions.includes(extension)) {
        return {
            valid: false,
            message: `Desteklenmeyen dosya tipi. İzin verilen: ${allowedExtensions.join(', ')}`
        };
    }

    return {
        valid: true,
        message: 'Dosya tipi uygun'
    };
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size (e.g., "1.5 MB")
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get MIME type for common file extensions
 * @param {string} extension - File extension (without dot)
 * @returns {string} - MIME type
 */
function getMimeType(extension) {
    const mimeTypes = {
        'json': 'application/json',
        'geojson': 'application/geo+json',
        'csv': 'text/csv',
        'txt': 'text/plain',
        'kml': 'application/vnd.google-earth.kml+xml',
        'kmz': 'application/vnd.google-earth.kmz',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xls': 'application/vnd.ms-excel',
        'xml': 'application/xml',
        'zip': 'application/zip',
        'shp': 'application/x-shapefile'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Create a download link element
 * @param {string} href - URL or data URL
 * @param {string} fileName - Download file name
 * @returns {HTMLAnchorElement} - Anchor element
 */
function createDownloadLink(href, fileName) {
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    link.style.display = 'none';
    return link;
}

/**
 * Trigger download from URL
 * @param {string} url - File URL
 * @param {string} fileName - Download file name
 */
function downloadFromURL(url, fileName) {
    const link = createDownloadLink(url, fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - True if successful
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    } catch (error) {
        if (window.Logger && typeof window.Logger.error === 'function') {
            window.Logger.error('Failed to copy to clipboard:', error);
        } else {
            console.error('Failed to copy to clipboard:', error);
        }
        return false;
    }
}

// Legacy: Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.FileUtils = {
        downloadFile,
        readFileAsText,
        readFileAsArrayBuffer,
        readFileAsDataURL,
        getFileExtension,
        validateFileSize,
        validateFileType,
        formatFileSize,
        getMimeType,
        createDownloadLink,
        downloadFromURL,
        copyToClipboard
    };

    // Export individual items for tests
    window.readFileAsText = readFileAsText;
}
