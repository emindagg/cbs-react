const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.m4v'];

/**
 * Medya öğesinden görüntülenebilir ham URL veya dosya adını alır.
 * @param {Object|string} mediaItem
 * @returns {string}
 */
export function getMediaRawUrl(mediaItem) {
    if (!mediaItem) return '';
    if (typeof mediaItem === 'string') return mediaItem;
    return mediaItem.url || mediaItem.name || '';
}

/**
 * Dosya veya medya öğesinin video olup olmadığını belirler.
 * @param {Object|string} mediaItem
 * @returns {boolean}
 */
export function isVideoMedia(mediaItem) {
    if (!mediaItem) return false;

    if (typeof mediaItem === 'object') {
        const type = String(mediaItem.type || '').toLowerCase();
        if (type === 'video' || type.startsWith('video/')) return true;
    }

    const rawUrl = getMediaRawUrl(mediaItem).toLowerCase();
    if (rawUrl.startsWith('data:video/')) return true;

    const cleanUrl = rawUrl.split('?')[0].split('#')[0];
    return VIDEO_EXTENSIONS.some(extension => cleanUrl.endsWith(extension));
}

/**
 * File nesnesinin video olup olmadığını belirler.
 * @param {File} file
 * @returns {boolean}
 */
export function isVideoFile(file) {
    return isVideoMedia({
        type: file?.type || '',
        name: file?.name || ''
    });
}
