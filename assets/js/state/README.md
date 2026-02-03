# 🗄️ State - State Management

Application-wide state management and persistence.

## 📋 Contents

- **`app-state.js`** - Global application state
- **`state-persistence.js`** - localStorage/sessionStorage sync

## 🎯 Purpose

Manage application state:
- ✅ Single source of truth for app data
- ✅ Reactive updates (state changes trigger UI updates)
- ✅ Persistence across sessions
- ✅ State history (undo/redo capability)

## 🏗️ Architecture

```
┌─────────────┐
│  Components │ → Read state, dispatch actions
└──────┬──────┘
       │
┌──────▼──────┐
│  App State  │ → Central state store
└──────┬──────┘
       │
┌──────▼──────┐
│ Persistence │ → localStorage sync
└─────────────┘
```

## 📦 Usage

```javascript
import { AppState } from './state/app-state.js';

// Get state
const markers = AppState.get('user.markers');

// Update state
AppState.set('user.markers', [...markers, newMarker]);

// Subscribe to changes
AppState.subscribe('user.markers', (newMarkers) => {
    console.log('Markers updated:', newMarkers);
});

// Save to localStorage
AppState.persist();
```

## 📝 State Structure

```javascript
{
    user: {
        markers: [],
        name: 'Guest',
        settings: {}
    },
    map: {
        center: [lat, lon],
        zoom: 10,
        basemap: 'satellite'
    },
    drawing: {
        isDrawing: false,
        currentTool: null
    },
    analysis: {
        clusteringEnabled: false,
        heatmapEnabled: false
    },
    ui: {
        sidebarOpen: true,
        toolsPanelOpen: true
    }
}
```

## 🔗 Integration with DI System

This module works alongside the DI system's StateManager:
- **StateManager** (DI) - Core reactive state engine
- **app-state.js** - Application-specific state structure
- **state-persistence.js** - Persistence layer

---

**Status:** 🟡 In Progress
**Last Updated:** 2025-01-XX
