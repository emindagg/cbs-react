/**
 * Automated Test Verification Script
 * Run this script in browser console after page loads to verify refactoring
 *
 * Usage:
 * 1. Open index.html in browser
 * 2. Wait for page to load completely
 * 3. Open console (F12)
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 */

(function() {
    'use strict';

    Logger.log('🧪 Starting Automated Test Verification...\n');

    let passed = 0;
    let failed = 0;
    const failures = [];

    function test(name, condition, errorMsg = '') {
        if (condition) {
            Logger.log(`✅ PASS: ${name}`);
            passed++;
        } else {
            Logger.error(`❌ FAIL: ${name}${errorMsg ? ' - ' + errorMsg : ''}`);
            failed++;
            failures.push({ test: name, error: errorMsg });
        }
    }

    Logger.log('═══════════════════════════════════════════════════');
    Logger.log('📦 MODULE LOADING TESTS');
    Logger.log('═══════════════════════════════════════════════════\n');

    // Test 1: Core modules loaded
    test('Window object exists', typeof window !== 'undefined');
    test('Map instance exists', typeof window.map !== 'undefined');

    // Test 2: Data Management modules
    test('DataManager loaded', typeof window.DataManager !== 'undefined');
    test('MarkerManager loaded', typeof window.MarkerManager !== 'undefined');
    test('DataDrawing loaded', typeof window.DataDrawing !== 'undefined');

    // Test 3: Import/Export modules
    test('ImportExport loaded', typeof window.ImportExport !== 'undefined');

    // Test 4: Visualization modules
    test('VisualizationManager loaded', typeof window.VisualizationManager !== 'undefined');

    // Test 5: Spatial Analysis modules
    test('SpatialAnalysis loaded', typeof window.SpatialAnalysis !== 'undefined');

    // Test 6: UI Components
    test('UIComponents loaded', typeof window.UIComponents !== 'undefined');
    test('ModalManager loaded', typeof window.ModalManager !== 'undefined');
    test('ProgressModal loaded', typeof window.ProgressModal !== 'undefined');
    test('SidebarTemplates loaded', typeof window.SidebarTemplates !== 'undefined');
    test('Labels loaded', typeof window.Labels !== 'undefined');

    // Test 7: Features
    test('Timeline loaded', typeof window.Timeline !== 'undefined');
    test('AstroGlobe loaded', typeof window.AstroGlobe !== 'undefined');
    test('GlobeView loaded', typeof window.GlobeView !== 'undefined');

    // Test 8: State Management
    test('UIStateManager loaded', typeof window.UIStateManager !== 'undefined');

    // Test 9: Event Handlers
    test('EventHandlers loaded', typeof window.EventHandlers !== 'undefined');
    test('DataEventHandlers loaded', typeof window.DataEventHandlers !== 'undefined');
    test('MapInteractions loaded', typeof window.MapInteractions !== 'undefined');
    test('MapClickOrchestrator loaded', typeof window.MapClickOrchestrator !== 'undefined');

    // Test 10: Utilities
    test('Utils available', typeof window.utils !== 'undefined' || typeof window.Utils !== 'undefined');

    // Test 11: Constants
    test('MapConfig available', typeof window.MapConfig !== 'undefined' || typeof window.MAP_CONFIG !== 'undefined');

    Logger.log('\n═══════════════════════════════════════════════════');
    Logger.log('🗺️  MAP TESTS');
    Logger.log('═══════════════════════════════════════════════════\n');

    // Test 12: Map initialization
    if (window.map) {
        test('Map is MapLibre instance', window.map.getStyle !== undefined);
        test('Map has sources', Object.keys(window.map.getStyle().sources).length > 0);
        test('Map has layers', window.map.getStyle().layers.length > 0);
        test('Map center defined', window.map.getCenter() !== undefined);
        test('Map zoom defined', typeof window.map.getZoom() === 'number');

        // Test map container
        const container = window.map.getContainer();
        test('Map container exists', container !== null);
        test('Map container has dimensions', container.offsetWidth > 0 && container.offsetHeight > 0);

        // Test map loaded
        test('Map is loaded', window.map.loaded());
    } else {
        test('Map exists', false, 'Map instance not found');
    }

    Logger.log('\n═══════════════════════════════════════════════════');
    Logger.log('🎨 HELPER MODULES TESTS');
    Logger.log('═══════════════════════════════════════════════════\n');

    // Test 13: Visualization helpers
    test('COLOR_SCHEMES available', typeof window.COLOR_SCHEMES !== 'undefined');
    test('getColorPalette available', typeof window.getColorPalette === 'function');
    test('formatLegendValue available', typeof window.formatLegendValue === 'function');
    test('calculateJenksBreaks available', typeof window.calculateJenksBreaks === 'function');
    test('calculateBreaks available', typeof window.calculateBreaks === 'function');

    // Test 14: Spatial analysis helpers
    test('HEATMAP_COLOR_SCHEMES available', typeof window.HEATMAP_COLOR_SCHEMES !== 'undefined');
    test('createHeatmapLayerConfig available', typeof window.createHeatmapLayerConfig === 'function');
    test('calculateBufferStatistics available', typeof window.calculateBufferStatistics === 'function');
    test('createUnionBuffers available', typeof window.createUnionBuffers === 'function');

    // Test 15: Import/Export helpers
    test('markersToGeoJSON available', typeof window.markersToGeoJSON === 'function');
    test('csvToMarkers available', typeof window.csvToMarkers === 'function');
    test('downloadFile available', typeof window.downloadFile === 'function');
    test('readFileAsText available', typeof window.readFileAsText === 'function');

    Logger.log('\n═══════════════════════════════════════════════════');
    Logger.log('🔌 DEPENDENCY INJECTION TESTS');
    Logger.log('═══════════════════════════════════════════════════\n');

    // Test 16: DI Container
    test('ServiceLocator exists', typeof window.ServiceLocator !== 'undefined');

    if (window.ServiceLocator) {
        test('ServiceLocator has get method', typeof window.ServiceLocator.get === 'function');
        test('ServiceLocator has register method', typeof window.ServiceLocator.register === 'function');

        // Try to get a service
        try {
            const mapService = window.ServiceLocator.get('MapService');
            test('Can retrieve MapService', mapService !== undefined);
        } catch(e) {
            test('Can retrieve MapService', false, e.message);
        }
    }

    Logger.log('\n═══════════════════════════════════════════════════');
    Logger.log('📊 FUNCTIONALITY TESTS');
    Logger.log('═══════════════════════════════════════════════════\n');

    // Test 17: Data Manager functionality
    if (window.DataManager) {
        const dm = new window.DataManager();
        test('DataManager instantiates', dm !== undefined);
        test('DataManager has addMarker method', typeof dm.addMarker === 'function');
        test('DataManager has getMarkers method', typeof dm.getMarkers === 'function');
        test('DataManager has deleteMarker method', typeof dm.deleteMarker === 'function');
    }

    // Test 18: Import/Export functionality
    if (window.ImportExport) {
        test('ImportExport has exportGeoJSON method',
             window.ImportExport.prototype.exportGeoJSON !== undefined ||
             typeof window.ImportExport.exportGeoJSON === 'function');
        test('ImportExport has importGeoJSON method',
             window.ImportExport.prototype.importGeoJSON !== undefined ||
             typeof window.ImportExport.importGeoJSON === 'function');
    }

    // Test 19: Visualization functionality
    if (window.VisualizationManager) {
        test('VisualizationManager has createChoropleth method',
             window.VisualizationManager.prototype.createChoropleth !== undefined ||
             typeof window.VisualizationManager.createChoropleth === 'function');
    }

    Logger.log('\n═══════════════════════════════════════════════════');
    Logger.log('🔍 DOM TESTS');
    Logger.log('═══════════════════════════════════════════════════\n');

    // Test 20: Essential DOM elements
    test('Map container exists', document.getElementById('map') !== null);
    test('Body exists', document.body !== null);
    test('Scripts loaded', document.scripts.length > 0);

    // Test 21: Script tags
    const scripts = Array.from(document.scripts);
    const jsScripts = scripts.filter(s => s.src.includes('.js'));
    test('JavaScript files loaded', jsScripts.length > 0);

    // Check for organized folder structure in script srcs
    const hasComponentsFolder = jsScripts.some(s => s.src.includes('/components/'));
    const hasDataFolder = jsScripts.some(s => s.src.includes('/data/'));
    const hasFeaturesFolder = jsScripts.some(s => s.src.includes('/features/'));
    const hasVisualizationFolder = jsScripts.some(s => s.src.includes('/visualization/'));

    test('Components folder scripts loaded', hasComponentsFolder);
    test('Data folder scripts loaded', hasDataFolder);
    test('Features folder scripts loaded', hasFeaturesFolder);
    test('Visualization folder scripts loaded', hasVisualizationFolder);

    Logger.log('\n═══════════════════════════════════════════════════');
    Logger.log('⚠️  CONSOLE ERROR CHECK');
    Logger.log('═══════════════════════════════════════════════════\n');

    // Note: This is informational, errors might have been logged before script runs
    Logger.log('ℹ️  Check the console above for any errors that occurred during page load');
    Logger.log('ℹ️  There should be ZERO errors for refactoring to be successful');

    Logger.log('\n═══════════════════════════════════════════════════');
    Logger.log('📈 TEST SUMMARY');
    Logger.log('═══════════════════════════════════════════════════\n');

    const total = passed + failed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    Logger.log(`Total Tests: ${total}`);
    Logger.log(`✅ Passed: ${passed}`);
    Logger.log(`❌ Failed: ${failed}`);
    Logger.log(`📊 Pass Rate: ${passRate}%\n`);

    if (failed === 0) {
        Logger.log('🎉 ALL TESTS PASSED! 🎉');
        Logger.log('✅ Refactoring successful - all modules loaded correctly');
    } else {
        Logger.log('⚠️  SOME TESTS FAILED');
        Logger.log('Failed tests:');
        failures.forEach((f, i) => {
            Logger.log(`  ${i + 1}. ${f.test}${f.error ? ' - ' + f.error : ''}`);
        });
    }

    Logger.log('\n═══════════════════════════════════════════════════');
    Logger.log('📝 NEXT STEPS');
    Logger.log('═══════════════════════════════════════════════════\n');

    Logger.log('1. Review any failures above');
    Logger.log('2. Check browser console for errors (should be zero)');
    Logger.log('3. Run manual tests from TEST_PLAN.md');
    Logger.log('4. Test critical features:');
    Logger.log('   - Add a marker');
    Logger.log('   - Import GeoJSON');
    Logger.log('   - Create visualization');
    Logger.log('   - Run spatial analysis');
    Logger.log('   - Measure distance');

    Logger.log('\n═══════════════════════════════════════════════════');

    return {
        passed,
        failed,
        total,
        passRate,
        failures,
        success: failed === 0
    };
})();
