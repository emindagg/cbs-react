# 📊 Sidebar - Left Sidebar Panel

Sidebar panel UI with layer management and data display.

## 📋 Contents

- **`index.js`** - Main entry point
- **`sidebar-manager.js`** - Sidebar state and toggle logic
- **`layer-list.js`** - Layer visibility controls
- **`data-list.js`** - User data listing
- **`legend.js`** - Map legend display

## 🎯 Features

- **Layer Management:** Toggle basemap layers, overlays, labels
- **Data Display:** List of user markers, features, analyses
- **Legend:** Dynamic legend based on active visualizations
- **Collapsible:** Can be toggled open/closed
- **Responsive:** Adapts to mobile/desktop

## 📦 Structure

```
sidebar/
├── index.js                 - Exports all sidebar components
├── sidebar-manager.js       - Toggle, state, persistence
├── layer-list.js           - Layer checkboxes
├── data-list.js            - Feature listing with search/filter
└── legend.js               - Visualization legend renderer
```

## 🔄 Integration

Works with:
- **StateManager** - Persist sidebar open/closed state
- **EventBus** - Emit layer toggle events
- **Visualization** - Auto-update legend when viz changes

---

**Status:** 🟡 Files Will Be Moved Here
**Last Updated:** 2025-01-XX
