# 🪟 Modals - Modal Dialog Components

Modal windows for settings, help, feature info, and confirmations.

## 📋 Contents

- **`index.js`** - Main entry point
- **`modal-manager.js`** - Modal lifecycle (open, close, stack)
- **`settings-modal.js`** - Application settings dialog
- **`help-modal.js`** - Help and documentation
- **`feature-info-modal.js`** - Feature/marker details popup
- **`confirmation-modal.js`** - Confirm destructive actions
- **`import-wizard-modal.js`** - Multi-step import wizard

## 🎯 Features

- **Modal Stack:** Handle multiple modals (z-index management)
- **Keyboard Support:** ESC to close, focus trap
- **Animations:** Smooth fade-in/fade-out
- **Backdrop:** Click outside to close (configurable)
- **Accessibility:** ARIA attributes, screen reader support

## 📦 Usage

```javascript
import { ModalManager } from './modals/index.js';

const modalMgr = new ModalManager();

// Show settings
modalMgr.open('settings', {
    currentSettings: app.config.getAll()
});

// Confirmation dialog
const confirmed = await modalMgr.confirm({
    title: 'Delete All Data?',
    message: 'This cannot be undone.',
    confirmText: 'Delete',
    confirmStyle: 'danger'
});

if (confirmed) {
    // User clicked "Delete"
}
```

## 🎨 Modal Types

- **Settings Modal:** Map settings, visualization options, preferences
- **Help Modal:** User guide, keyboard shortcuts, FAQ
- **Feature Info:** Display marker/feature properties in formatted table
- **Import Wizard:** Step-by-step data import with preview
- **Confirmation:** Yes/No dialogs for destructive actions

---

**Status:** 🟡 Files Will Be Moved Here
**Last Updated:** 2025-01-XX
