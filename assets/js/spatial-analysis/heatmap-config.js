/**
 * Heatmap Configuration - Color Schemes and Settings
 * Provides heatmap color schemes for MapLibre GL JS heatmap layers
 */

/**
 * Heatmap color schemes
 * Each scheme defines a MapLibre GL JS paint property array for heatmap-color
 */
const HEATMAP_COLOR_SCHEMES = {
    maplibre: {
        name: 'Varsayılan',
        colors: [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',    // Şeffaf mavi (düşük)
            0.2, 'rgb(103,169,207)',    // Açık mavi
            0.4, 'rgb(209,229,240)',    // Çok açık mavi
            0.6, 'rgb(253,219,199)',    // Açık turuncu
            0.8, 'rgb(239,138,98)',     // Turuncu
            1, 'rgb(178,24,43)'         // Koyu kırmızı (yüksek)
        ]
    },
    gradient: {
        name: 'Renk 1',
        colors: [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(14,165,233,0)',    // Şeffaf açık mavi (düşük)
            0.25, 'rgb(14,165,233)',    // Açık mavi
            0.50, 'rgb(34,197,94)',     // Yeşil
            0.75, 'rgb(253,224,71)',    // Sarı
            0.875, 'rgb(251,146,60)',   // Turuncu
            1, 'rgb(185,28,28)'         // Kırmızı (yüksek)
        ]
    },
    viridis: {
        name: 'Renk 2',
        colors: [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(68,1,84,0)',        // Şeffaf mor (düşük)
            0.2, 'rgb(59,82,139)',      // Koyu mavi
            0.4, 'rgb(33,144,140)',     // Turkuaz
            0.6, 'rgb(92,200,99)',      // Yeşil
            0.8, 'rgb(253,231,37)',     // Sarı
            1, 'rgb(253,224,71)'        // Açık sarı (yüksek)
        ]
    },
    sunset: {
        name: 'Renk 3',
        colors: [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(254,237,177,0)',    // Şeffaf açık sarı (düşük)
            0.2, 'rgb(254,204,92)',     // Açık sarı
            0.4, 'rgb(253,141,60)',     // Turuncu
            0.6, 'rgb(240,59,32)',      // Kırmızı-turuncu
            0.8, 'rgb(189,0,38)',       // Koyu kırmızı
            1, 'rgb(128,0,38)'          // Koyu kırmızı (yüksek)
        ]
    },
    custom: {
        name: 'Renk 4',
        colors: [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(137,186,197,0)',    // Şeffaf açık mavi (düşük)
            0.25, 'rgb(137,186,197)',   // #89BAC5 - Açık mavi
            0.50, 'rgb(173,114,164)',   // #AD72A4 - Mor
            0.75, 'rgb(193,78,114)',    // #C14E72 - Pembe
            0.875, 'rgb(210,33,25)',    // #D22119 - Kırmızı
            1, 'rgb(255,241,0)'         // #FFF100 - Sarı (yüksek)
        ]
    }
};

/**
 * Default heatmap color scheme
 */
const DEFAULT_HEATMAP_SCHEME = 'maplibre';

/**
 * Default heatmap configuration
 */
const DEFAULT_HEATMAP_CONFIG = {
    radius: 40,
    blur: 22,
    intensity: 3,
    opacity: 0.8,
    maxZoom: 18,
    minZoom: 0
};

/**
 * Get heatmap color scheme by name
 * @param {string} schemeName - Name of the color scheme
 * @returns {Object|null} - Scheme object or null if not found
 */
function getHeatmapColorScheme(schemeName) {
    return HEATMAP_COLOR_SCHEMES[schemeName] || null;
}

/**
 * Get heatmap paint property for a color scheme
 * @param {string} schemeName - Name of the color scheme
 * @returns {Array} - MapLibre GL JS paint property array
 */
function getHeatmapColorProperty(schemeName) {
    const scheme = getHeatmapColorScheme(schemeName);
    return scheme ? scheme.colors : HEATMAP_COLOR_SCHEMES[DEFAULT_HEATMAP_SCHEME].colors;
}

/**
 * Get all available heatmap color scheme names
 * @returns {Array<string>} - Array of scheme names
 */
function getAvailableHeatmapSchemes() {
    return Object.keys(HEATMAP_COLOR_SCHEMES);
}

/**
 * Get heatmap scheme display name
 * @param {string} schemeName - Name of the color scheme
 * @returns {string} - Display name
 */
function getHeatmapSchemeName(schemeName) {
    const scheme = getHeatmapColorScheme(schemeName);
    return scheme ? scheme.name : 'Unknown';
}

/**
 * Create heatmap layer configuration
 * @param {string} sourceId - MapLibre source ID
 * @param {string} colorScheme - Color scheme name
 * @param {Object} config - Heatmap configuration options
 * @returns {Object} - MapLibre layer configuration object
 */
function createHeatmapLayerConfig(sourceId, colorScheme = DEFAULT_HEATMAP_SCHEME, config = {}) {
    const finalConfig = { ...DEFAULT_HEATMAP_CONFIG, ...config };
    const colors = getHeatmapColorProperty(colorScheme);

    return {
        id: 'heatmap-layer',
        type: 'heatmap',
        source: sourceId,
        maxzoom: finalConfig.maxZoom,
        paint: {
            // Heatmap intensity (0-1)
            'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, finalConfig.intensity,
                finalConfig.maxZoom, finalConfig.intensity
            ],
            // Color scheme
            'heatmap-color': colors,
            // Radius of influence (pixels)
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, finalConfig.radius * 0.5,
                finalConfig.maxZoom, finalConfig.radius
            ],
            // Opacity
            'heatmap-opacity': finalConfig.opacity,
            // Weight (influence of each point)
            'heatmap-weight': 1
        }
    };
}

// Legacy: Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.HeatmapConfig = {
        HEATMAP_COLOR_SCHEMES,
        DEFAULT_HEATMAP_SCHEME,
        DEFAULT_HEATMAP_CONFIG,
        getHeatmapColorScheme,
        getHeatmapColorProperty,
        getAvailableHeatmapSchemes,
        getHeatmapSchemeName,
        createHeatmapLayerConfig
    };

    // Export individual items for tests
    window.HEATMAP_COLOR_SCHEMES = HEATMAP_COLOR_SCHEMES;
    window.createHeatmapLayerConfig = createHeatmapLayerConfig;
}
