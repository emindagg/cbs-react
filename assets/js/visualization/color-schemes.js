/**
 * Color Schemes - Visualization Color Utilities
 * Provides color palettes and color calculation utilities
 */

/**
 * Available color schemes for visualizations
 */
const COLOR_SCHEMES = {
    viridis: ['#440154', '#472777', '#3b528b', '#2c728e', '#21918c', '#27ad81', '#5ec962', '#aadc32', '#fde725'],
    reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
    blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
    oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
    purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
    topographic: ['#4a6741', '#7b9971', '#b4c8a8', '#e8f1e1', '#f6e8c3', '#dfc27d', '#bf812d', '#8c510a', '#543005'],
    diverging_orange_blue: ['#c66b20', '#dd8a4b', '#eeaa7b', '#f4c9a8', '#dcdcdc', '#90b9d7', '#5393c3', '#2a6ba1', '#11415c']
};

/**
 * Default color scheme (Viridis)
 */
const DEFAULT_COLOR_SCHEME = COLOR_SCHEMES.viridis;

/**
 * Get a color palette with specified number of colors from a full color scale
 * @param {Array<string>} colorScaleFull - Full color scale array
 * @param {number} count - Number of colors to sample
 * @returns {Array<string>} - Array of sampled colors
 */
function getColorPalette(colorScaleFull, count) {
    const step = Math.floor((colorScaleFull.length - 1) / (count - 1));
    const palette = [];
    for (let i = 0; i < count; i++) {
        const index = Math.min(i * step, colorScaleFull.length - 1);
        palette.push(colorScaleFull[index]);
    }
    return palette;
}

/**
 * Get color for a specific value based on classification breaks
 * @param {number} value - The data value
 * @param {Array<number>} breaks - Classification break points
 * @param {Array<string>} colorScale - Color palette to use
 * @returns {string} - Hex color code
 */
function getColorForValue(value, breaks, colorScale) {
    for (let i = 0; i < breaks.length - 1; i++) {
        if (value >= breaks[i] && value < breaks[i + 1]) {
            return colorScale[i];
        }
    }
    return colorScale[colorScale.length - 1];
}

/**
 * Validate and get color scheme by name
 * @param {string} schemeName - Name of the color scheme
 * @returns {Array<string>|null} - Color scheme array or null if not found
 */
function getColorScheme(schemeName) {
    return COLOR_SCHEMES[schemeName] || null;
}

/**
 * Get all available color scheme names
 * @returns {Array<string>} - Array of scheme names
 */
function getAvailableSchemes() {
    return Object.keys(COLOR_SCHEMES);
}

// Legacy: Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.ColorSchemes = {
        COLOR_SCHEMES,
        DEFAULT_COLOR_SCHEME,
        getColorPalette,
        getColorForValue,
        getColorScheme,
        getAvailableSchemes
    };

    // Export individual items for tests
    window.COLOR_SCHEMES = COLOR_SCHEMES;
    window.getColorPalette = getColorPalette;
}
