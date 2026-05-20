const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];
const DIRECT_MEDIA_EXTENSIONS = [
    ...VIDEO_EXTENSIONS,
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.bmp',
    '.jfif',
    '.pdf'
];

const TRUSTED_MEB_EMBED_DOMAINS = [
    'eba.gov.tr',
    'meb.gov.tr'
];

function getMediaType(mediaItem) {
    if (!mediaItem || typeof mediaItem !== 'object') return '';
    return String(mediaItem.type || '').toLowerCase();
}

function getUrlHostname(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';

    try {
        return new URL(getEmbedSourceUrl(rawUrl)).hostname.toLowerCase();
    } catch {
        return '';
    }
}

function isTrustedMebDomain(hostname) {
    return TRUSTED_MEB_EMBED_DOMAINS.some(domain => (
        hostname === domain || hostname.endsWith(`.${domain}`)
    ));
}

function hasDirectMediaExtension(rawUrl) {
    const cleanUrl = getEmbedSourceUrl(rawUrl).toLowerCase().split('?')[0].split('#')[0];
    return DIRECT_MEDIA_EXTENSIONS.some(extension => cleanUrl.endsWith(extension));
}

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
 * URL veya iframe kodundan yerleştirilebilir kaynak URL'sini alır.
 * @param {Object|string} mediaItem
 * @returns {string}
 */
export function getEmbedSourceUrl(mediaItem) {
    const rawValue = getMediaRawUrl(mediaItem);
    if (!rawValue || typeof rawValue !== 'string') return '';

    const iframeSrcMatch = rawValue.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    const sourceUrl = iframeSrcMatch?.[1] || rawValue.trim();

    if (/^www\./i.test(sourceUrl)) {
        return `https://${sourceUrl}`;
    }

    return sourceUrl;
}

/**
 * Dosya veya medya öğesinin video olup olmadığını belirler.
 * @param {Object|string} mediaItem
 * @returns {boolean}
 */
export function isVideoMedia(mediaItem) {
    if (!mediaItem) return false;

    if (typeof mediaItem === 'object') {
        const type = getMediaType(mediaItem);
        if (type === 'video' || type.startsWith('video/')) return true;
    }

    const rawUrl = getMediaRawUrl(mediaItem).toLowerCase();
    if (rawUrl.startsWith('data:video/')) return true;

    return VIDEO_EXTENSIONS.some(extension => rawUrl.split('?')[0].split('#')[0].endsWith(extension));
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

/**
 * Video öğesinin harici bir embed (YouTube/Vimeo vb.) videosu olup olmadığını belirler.
 * @param {Object|string} mediaItem
 * @returns {boolean}
 */
export function isEmbedVideo(mediaItem) {
    if (!mediaItem) return false;
    const rawUrl = getEmbedSourceUrl(mediaItem);
    if (typeof rawUrl !== 'string') return false;

    const type = getMediaType(mediaItem);
    if (type.startsWith('image/') || type === 'image') return false;
    if (hasDirectMediaExtension(rawUrl)) return false;

    const hostname = getUrlHostname(rawUrl);
    const isYt = /(?:youtube\.com|youtu\.be)/.test(rawUrl);
    const isVimeo = /vimeo\.com/.test(rawUrl);
    const isDailymotion = /(?:dailymotion\.com|dai\.ly)/.test(rawUrl);
    const isTrustedMeb = isTrustedMebDomain(hostname)
        && (type === 'video' || type === 'embed' || type === 'web' || type === 'link' || !type);

    return isYt || isVimeo || isDailymotion || isTrustedMeb;
}

/**
 * Öğenin ayrı bir yerleştirme bloğu olup olmadığını belirler.
 * @param {Object|string} mediaItem
 * @returns {boolean}
 */
export function isEmbedContent(mediaItem) {
    if (!mediaItem) return false;
    const type = getMediaType(mediaItem);
    if (type !== 'embed') return false;

    const rawUrl = getEmbedSourceUrl(mediaItem);
    if (!rawUrl || hasDirectMediaExtension(rawUrl)) return false;

    try {
        const url = new URL(rawUrl);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * YouTube videosunun benzersiz ID'sini döndürür.
 * @param {string} url
 * @returns {string|null}
 */
export function getYouTubeId(url) {
    if (typeof url !== 'string') return null;
    url = getEmbedSourceUrl(url);
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const match = url.match(ytRegex);
    return match ? match[1] : null;
}

/**
 * Dailymotion videosunun benzersiz ID'sini döndürür.
 * @param {string} url
 * @returns {string|null}
 */
export function getDailymotionId(url) {
    if (typeof url !== 'string') return null;
    url = getEmbedSourceUrl(url);
    const dailymotionRegex = /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/;
    const match = url.match(dailymotionRegex);
    return match ? match[1] : null;
}

/**
 * Harici video URL'lerini embed (iframe) formatına dönüştürür.
 * @param {Object|string} mediaItem
 * @returns {string}
 */
export function getEmbedVideoUrl(mediaItem) {
    const rawUrl = getEmbedSourceUrl(mediaItem);
    if (!rawUrl || typeof rawUrl !== 'string') return '';

    // YouTube kontrolü ve dönüşümü
    const ytId = getYouTubeId(rawUrl);
    if (ytId) {
        return `https://www.youtube.com/embed/${ytId}`;
    }

    // Vimeo kontrolü ve dönüşümü
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
    const vimeoMatch = rawUrl.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Dailymotion kontrolü ve dönüşümü
    const dailymotionId = getDailymotionId(rawUrl);
    if (dailymotionId) {
        return `https://www.dailymotion.com/embed/video/${dailymotionId}`;
    }

    return rawUrl;
}
