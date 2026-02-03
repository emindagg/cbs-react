# 🎯 Event Handlers - Application Event Handlers

Centralized event handling for UI interactions.

## 📋 Contents

- **`index.js`** - Main aggregator
- **`data-event-handlers.js`** - Data collection events
- **`catalog-event-handlers.js`** - Catalog events
- **`analysis-event-handlers.js`** - Analysis tool events
- **`measurement-event-handlers.js`** - Measurement tool events
- **`tools-event-handlers.js`** - General tool events
- **`map-event-handlers.js`** - Map interaction events

## 🎯 Purpose

Separate event handling from business logic:
- ✅ Clean separation of concerns
- ✅ Easier testing
- ✅ Better maintainability
- ✅ Reusable handlers

## 📦 Pattern

```javascript
// analysis-event-handlers.js
export function setupAnalysisHandlers({ map, spatialAnalysis, events }) {
    document.getElementById('btn-buffer').addEventListener('click', () => {
        spatialAnalysis.bufferAnalysis();
        events.emit('analysis:buffer:started');
    });
}
```

---

**Status:** 🟡 Files Exist - Will be moved here
**Last Updated:** 2025-01-XX
