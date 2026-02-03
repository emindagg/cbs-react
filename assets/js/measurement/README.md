# 📏 Measurement - Measurement Tools

Distance and area measurement tools for the map.

## 📋 Contents

- **`index.js`** - Main entry and exports
- **`distance-measurement.js`** - Distance/length measurement
- **`area-measurement.js`** - Area/perimeter measurement
- **`measurement-utils.js`** - Shared utilities

## 🎯 Features

- **Distance:** Line and polyline measurements
- **Area:** Polygon measurements
- **Units:** Metric and imperial
- **Real-time:** Live measurement updates
- **Labels:** Show measurements on map
- **Export:** Save measurements

## 📦 Usage

```javascript
import { DistanceMeasurement, AreaMeasurement } from './measurement/index.js';

// Distance
const distTool = new DistanceMeasurement({ map });
distTool.start();

// Area
const areaTool = new AreaMeasurement({ map });
areaTool.start();
```

---

**Status:** 🟡 To Be Migrated
**Last Updated:** 2025-01-XX
