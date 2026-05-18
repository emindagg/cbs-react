/**
 * Marker stilleri sabitleri
 */

export const MARKER_STYLES = [
    { id: 'default', icon: 'fa-map-marker-alt', color: '#ef4444', name: 'Varsayılan', shape: 'circle' },
    { id: 'number', icon: 'number', color: '#3b82f6', name: 'Sayı', shape: 'circle', isNumber: true },
    { id: 'pin', icon: 'fa-thumbtack', color: '#6366f1', name: 'Pin', shape: 'circle' },
    { id: 'star', icon: 'fa-star', color: '#f59e0b', name: 'Yıldız', shape: 'circle' },
    { id: 'heart', icon: 'fa-heart', color: '#ec4899', name: 'Kalp', shape: 'circle' },
    { id: 'flag', icon: 'fa-flag', color: '#10b981', name: 'Bayrak', shape: 'circle' },
    { id: 'home', icon: 'fa-home', color: '#8b5cf6', name: 'Ev', shape: 'circle' },
    { id: 'camera', icon: 'fa-camera', color: '#06b6d4', name: 'Kamera', shape: 'circle' },
    { id: 'tree', icon: 'fa-tree', color: '#22c55e', name: 'Ağaç', shape: 'circle' }
];

export const COLOR_PALETTE = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
    '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', 
    '#22c55e', '#f97316', '#78716c', '#1e293b'
];

export const TEXT_ANNOTATION_STYLES = [
    {
        id: 'boxed',
        name: 'Kutu',
        preview: 'A',
        background: '#ffffff',
        borderColor: '#d1d5db',
        textColor: '#111827',
        shadow: '0 4px 12px rgba(17, 24, 39, 0.12)',
        opacity: 1
    },
    {
        id: 'dark',
        name: 'Koyu',
        preview: 'A',
        background: '#0f172a',
        borderColor: '#0f172a',
        textColor: '#f8fafc',
        shadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
        opacity: 1
    },
    {
        id: 'plain',
        name: 'Düz',
        preview: 'A',
        background: 'transparent',
        borderColor: 'transparent',
        textColor: '#111827',
        shadow: 'none',
        opacity: 1
    },
    {
        id: 'halo',
        name: 'Hale',
        preview: 'A',
        background: 'transparent',
        borderColor: 'transparent',
        textColor: '#ffffff',
        shadow: 'none',
        opacity: 1
    }
];

export const TEXT_PLACEMENTS = [
    { id: 'right', name: 'Sağ' },
    { id: 'left', name: 'Sol' },
    { id: 'top', name: 'Üst' },
    { id: 'bottom', name: 'Alt' }
];

export const LEADER_LINE_STYLES = [
    { id: 'solid', name: 'Düz', borderStyle: 'solid' },
    { id: 'dashed', name: 'Kesik', borderStyle: 'dashed' },
    { id: 'dotted', name: 'Noktalı', borderStyle: 'dotted' }
];

export const DRAWING_TYPE_NAMES = {
    'line': 'Çizgi',
    'rectangle': 'Dörtgen',
    'circle': 'Daire',
    'text': 'Metin',
    'polygon': 'Poligon'
};

export const DRAWING_TYPE_ICONS = {
    'line': 'fa-minus',
    'rectangle': 'fa-vector-square',
    'circle': 'fa-circle',
    'text': 'fa-font',
    'polygon': 'fa-draw-polygon'
};
