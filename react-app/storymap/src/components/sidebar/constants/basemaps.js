/**
 * Harita altlık sabitleri
 * HGM Atlas API entegrasyonu
 */

export const BASEMAPS = [
    {
        id: 'hgm-temel',
        name: 'HGM Temel',
        thumbnail: 'https://tile.openstreetmap.org/5/15/10.png'
    },
    {
        id: 'hgm-uydu',
        name: 'HGM Uydu',
        thumbnail: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/10/15'
    },
    {
        id: 'hgm-gece',
        name: 'HGM Gece',
        thumbnail: 'https://tiles.basemaps.cartocdn.com/dark_all/5/15/10.png'
    },
    {
        id: 'hgm-siyasi',
        name: 'HGM Siyasi',
        thumbnail: 'https://tile.openstreetmap.org/5/15/10.png'
    },
    {
        id: 'hgm-yukseklik',
        name: 'HGM Yükseklik',
        thumbnail: 'https://tile.opentopomap.org/5/15/10.png'
    }
];

export const DEFAULT_MAP_SETTINGS = {
    baseLayerType: 'basemap',
    selectedBasemap: 'hgm-temel',
    allowNavigation: true,
    showSearch: false
};
