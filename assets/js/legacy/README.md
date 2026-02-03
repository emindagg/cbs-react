# 🗄️ Legacy - Deprecated Code

Deprecated code kept for backward compatibility during migration.

## ⚠️ Warning

**DO NOT USE CODE FROM THIS FOLDER FOR NEW FEATURES**

This folder contains:
- Old implementations being phased out
- Backward compatibility shims
- Code scheduled for removal
- Deprecated APIs

## 📋 Contents

Files moved here during refactoring that are:
- No longer actively maintained
- Replaced by newer implementations
- Kept only for backward compatibility
- Scheduled for removal in future versions

## 🔄 Migration Status

When all external dependencies are updated to use new APIs, files in this folder will be deleted.

## 📦 Removal Plan

1. **Identify Dependencies:** Find all code using legacy modules
2. **Migrate Consumers:** Update to new APIs
3. **Deprecation Warnings:** Add console warnings
4. **Grace Period:** Keep for 2-3 versions
5. **Final Removal:** Delete from codebase

## 🚨 If You Find Legacy Code

If you find code importing from `legacy/`:

```javascript
// ❌ OLD - Don't do this
import { oldFunction } from './legacy/old-module.js';

// ✅ NEW - Use this instead
import { newFunction } from './utils/new-module.js';
```

Check the REFACTORING_PLAN.md for migration guides.

---

**Status:** 🟡 Deprecation Zone
**Action Required:** Migrate away from these files
**Last Updated:** 2025-01-XX
