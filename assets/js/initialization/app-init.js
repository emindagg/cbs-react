/**
 * App Initialization - MapLibre GL JS
 * Main initialization orchestrator that wires all initialization modules
 *
 * This is a lightweight wrapper that calls modular initialization functions.
 * All actual initialization logic is in /assets/js/initialization/ modules.
 *
 * Initialization Order:
 * 1. Global State (state-initialization.js)
 * 2. UI Panels (ui-panels-initialization.js - auto-executes via IIFE)
 * 3. Map Core (map-core-initialization.js)
 * 4. Map Sources (map-sources-initialization.js)
 * 5. Map Layers (map-layers-initialization.js)
 * 6. Orchestrators (orchestrator-initialization.js)
 */

// Safe Logger helpers
const safeLogInit = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeErrorInit = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

// ==========================================
// STEP 1: INITIALIZE GLOBAL STATE
// ==========================================
if (typeof initializeGlobalState === 'function') {
    initializeGlobalState();
} else {
    safeErrorInit('❌ initializeGlobalState not available. Check state-initialization.js is loaded.');
}

// ==========================================
// STEP 2: UI PANELS
// ==========================================
// UI panels are initialized automatically via IIFE in ui-panels-initialization.js
// Nothing to call here - the script executes when loaded

// ==========================================
// STEP 3: INITIALIZE MAP CORE
// ==========================================
if (typeof initializeMapCore === 'function') {
    initializeMapCore();
} else {
    safeErrorInit('❌ initializeMapCore not available. Check map-core-initialization.js is loaded.');
}

// ==========================================
// STEP 4: INITIALIZE MAP DATA SOURCES
// ==========================================
if (typeof initializeMapSources === 'function') {
    initializeMapSources();
} else {
    safeErrorInit('❌ initializeMapSources not available. Check map-sources-initialization.js is loaded.');
}

// ==========================================
// STEP 5: INITIALIZE MAP LAYERS
// ==========================================
// Map layers are added when map 'load' event fires
if (typeof initializeMapLayers === 'function') {
    initializeMapLayers();
} else {
    safeErrorInit('❌ initializeMapLayers not available. Check map-layers-initialization.js is loaded.');
}

// ==========================================
// STEP 5.5: INITIALIZE LAYER MANAGEMENT
// ==========================================
// Custom layer management system for shapefile layers
if (typeof initializeLayers === 'function') {
    initializeLayers();
} else {
    safeErrorInit('❌ initializeLayers not available. Check layers-initialization.js is loaded.');
}

// ==========================================
// STEP 6: INITIALIZE ORCHESTRATORS
// ==========================================
// MapClickOrchestrator, Timeline, AstroGlobe
if (typeof initializeOrchestrators === 'function') {
    initializeOrchestrators();
} else {
    safeErrorInit('❌ initializeOrchestrators not available. Check orchestrator-initialization.js is loaded.');
}

safeLogInit('✅ App initialization complete (modular)');
