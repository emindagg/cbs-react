# 🎛️ Controls - Map Control Components

Interactive map controls (zoom, search, tools, layer switcher).

## 📋 Contents

- **`index.js`** - Main entry point
- **`zoom-control.js`** - Zoom in/out buttons
- **`search-control.js`** - Geocoding search box
- **`layer-switcher.js`** - Basemap layer switcher
- **`scale-control.js`** - Scale bar
- **`attribution-control.js`** - Map attribution
- **`fullscreen-control.js`** - Fullscreen toggle
- **`geolocate-control.js`** - User location button

## 🎯 Features

- **Zoom Control:** +/- buttons with keyboard shortcuts
- **Search:** Geocoding with autocomplete (Nominatim/Google)
- **Layer Switcher:** Quick basemap switching
- **Scale Bar:** Dynamic scale (metric/imperial)
- **Fullscreen:** Expand map to fullscreen
- **Geolocate:** Find user's current location

## 📦 Usage

```javascript
import { ZoomControl, SearchControl, LayerSwitcher } from './controls/index.js';

// Add zoom control
const zoom = new ZoomControl({ position: 'top-right' });
map.addControl(zoom);

// Add search with geocoding
const search = new SearchControl({
    provider: 'nominatim',
    placeholder: 'Search locations...',
    onSelect: (result) => {
        map.flyTo({ center: result.coordinates, zoom: 14 });
    }
});
map.addControl(search, 'top-left');

// Add layer switcher
const layerSwitcher = new LayerSwitcher({
    layers: [
        { id: 'osm', name: 'OpenStreetMap', default: true },
        { id: 'satellite', name: 'Satellite' },
        { id: 'terrain', name: 'Terrain' }
    ]
});
map.addControl(layerSwitcher, 'top-right');
```

## 🔄 Control Positions

MapLibre GL supports 4 positions:
- `top-left` - Search, geolocate
- `top-right` - Zoom, layer switcher, fullscreen
- `bottom-left` - Scale bar
- `bottom-right` - Attribution

---

**Status:** 🟡 Files Will Be Moved Here
**Last Updated:** 2025-01-XX
