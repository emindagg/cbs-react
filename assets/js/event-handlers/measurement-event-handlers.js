/**
 * Measurement Event Handlers Module
 * Handles measurement tool operations: distance and area measurements
 * Part of the modularized EventHandlers system
 */

// Güvenli Logger helper'ları
const safeLogMeasure = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeWarnMeasure = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorMeasure = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

class MeasurementEventHandlers {
    constructor(config) {
        this.clearAllMeasurements = config.clearAllMeasurements;
    }

    initialize() {
        // Setup measurement handlers with delay to ensure DOM is ready
        setTimeout(() => {
            this.setupMeasurementHandlers();
        }, 100);
    }

    setupMeasurementHandlers() {
        const clearMeasurementsBtn = document.getElementById('clear-measurements');
        safeLogMeasure('Clear measurements button:', clearMeasurementsBtn);
        safeLogMeasure('clearAllMeasurements function:', this.clearAllMeasurements);

        if (clearMeasurementsBtn) {
            clearMeasurementsBtn.addEventListener('click', () => {
                safeLogMeasure('Clear measurements button clicked!');
                if (this.clearAllMeasurements && typeof this.clearAllMeasurements === 'function') {
                    safeLogMeasure('Calling clearAllMeasurements...');
                    this.clearAllMeasurements();
                } else {
                    safeErrorMeasure('clearAllMeasurements fonksiyonu bulunamadı!');
                }
            });
        } else {
            safeErrorMeasure('clear-measurements butonu bulunamadı!');
        }
    }
}

// Make it globally available
window.MeasurementEventHandlers = MeasurementEventHandlers;
