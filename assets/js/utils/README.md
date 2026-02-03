# 🛠️ Utils - Utility Functions

Reusable utility functions used across the application.

## 📋 Contents

### Core Utilities
- **`index.js`** - Barrel export (exports all utils)
- **`feedback.js`** - User feedback and notifications
- **`formatters.js`** - Number, area, distance formatting
- **`dom-helpers.js`** - DOM manipulation helpers
- **`storage.js`** - localStorage/sessionStorage wrapper
- **`async-helpers.js`** - Async utilities (sleep, debounce, throttle)
- **`geo-helpers.js`** - Geographic calculations

## 🎯 Purpose

Centralize common utility functions to:
- ✅ Reduce code duplication
- ✅ Improve maintainability
- ✅ Enable easy testing
- ✅ Provide consistent behavior

## 📦 Usage

```javascript
// Import specific utility
import { formatNumber } from './utils/formatters.js';

// Or import all via barrel
import * as Utils from './utils/index.js';
```

## 📝 Guidelines

1. **Pure Functions:** Utilities should be pure (no side effects)
2. **Single Responsibility:** Each function does one thing well
3. **Well Documented:** Include JSDoc comments
4. **Type Safe:** Consider TypeScript in future
5. **Tested:** Each utility should have unit tests

## 🚫 What NOT to Include

- Business logic (belongs in modules)
- State management (belongs in state/)
- Component logic (belongs in components/)
- API calls (belongs in services/)

---

**Status:** 🟡 In Progress
**Last Updated:** 2025-01-XX
