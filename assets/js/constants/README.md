# 🎨 Constants - Application Constants

Centralized constants and configuration values.

## 📋 Contents

- **`colors.js`** - Color schemes, palettes, and themes
- **`analysis-defaults.js`** - Default values for spatial analysis
- **`map-styles.js`** - Basemap styles and configurations

## 🎯 Purpose

Define constants in one place to:
- ✅ Ensure consistency across the app
- ✅ Make changes easier (single source of truth)
- ✅ Improve readability (named constants vs magic numbers)
- ✅ Enable theming and customization

## 📦 Usage

```javascript
import { COLORS, PALETTES } from './constants/colors.js';
import { BUFFER_DEFAULTS, CLUSTER_SETTINGS } from './constants/analysis-defaults.js';
import { BASEMAP_STYLES } from './constants/map-styles.js';

// Use in code
const bufferSize = BUFFER_DEFAULTS.radius;
const clusterColor = COLORS.primary;
```

## 📝 Guidelines

1. **Immutable:** Constants should not be modified at runtime
2. **Descriptive Names:** Use UPPER_SNAKE_CASE for constants
3. **Grouped:** Group related constants together
4. **Documented:** Explain what each constant represents
5. **Typed:** Use Object.freeze() to prevent modifications

## 💡 Example

```javascript
// ✅ Good
export const BUFFER_DEFAULTS = Object.freeze({
    radius: 500,
    unit: 'meters',
    color: '#3b82f6'
});

// ❌ Bad
export let bufferRadius = 500; // Mutable, no context
```

---

**Status:** 🟡 In Progress
**Last Updated:** 2025-01-XX
