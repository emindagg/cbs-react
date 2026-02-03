/**
 * Logger Utility
 * Centralized logging system with environment-aware controls
 *
 * Features:
 * - Environment-based logging (dev/production)
 * - Log levels (debug, info, warn, error)
 * - Timestamped logs
 * - Performance tracking
 * - Easy disable in production
 */

class Logger {
    constructor() {
        // Determine environment
        this.isProduction = this._detectProductionEnvironment();

        // Log level hierarchy
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            NONE: 4
        };

        // Current log level (can be changed via setLevel)
        this.currentLevel = this.isProduction ? this.levels.WARN : this.levels.DEBUG;

        // Enable/disable logging entirely
        this.enabled = !this.isProduction;

        // Track performance marks
        this.performanceMarks = new Map();
    }

    /**
     * Detect if running in production environment
     * @private
     */
    _detectProductionEnvironment() {
        // Check various production indicators
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
            return true;
        }

        // Check hostname (production domains)
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            const productionDomains = ['yourdomain.com', 'www.yourdomain.com'];
            if (productionDomains.includes(hostname)) {
                return true;
            }
        }

        // Default to development
        return false;
    }

    /**
     * Set logging level
     */
    setLevel(level) {
        if (Object.prototype.hasOwnProperty.call(this.levels, level)) {
            this.currentLevel = this.levels[level];
        }
    }

    /**
     * Enable or disable logging
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Check if a log level should be output
     * @private
     */
    _shouldLog(level) {
        return this.enabled && level >= this.currentLevel;
    }

    /**
     * Format timestamp
     * @private
     */
    _getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    }

    /**
     * Format log message with timestamp and level
     * @private
     */
    _formatMessage(level, ...args) {
        const timestamp = this._getTimestamp();
        return [`[${timestamp}] [${level}]`, ...args];
    }

    /**
     * Debug level logging
     */
    debug(...args) {
        if (this._shouldLog(this.levels.DEBUG)) {
            console.log(...this._formatMessage('DEBUG', ...args));
        }
    }

    /**
     * Info level logging
     */
    info(...args) {
        if (this._shouldLog(this.levels.INFO)) {
            console.info(...this._formatMessage('INFO', ...args));
        }
    }

    /**
     * Log level logging (alias for info)
     */
    log(...args) {
        this.info(...args);
    }

    /**
     * Warning level logging
     */
    warn(...args) {
        if (this._shouldLog(this.levels.WARN)) {
            console.warn(...this._formatMessage('WARN', ...args));
        }
    }

    /**
     * Error level logging
     */
    error(...args) {
        if (this._shouldLog(this.levels.ERROR)) {
            console.error(...this._formatMessage('ERROR', ...args));
        }
    }

    /**
     * Group logs together
     */
    group(label) {
        if (this.enabled) {
            console.group(label);
        }
    }

    /**
     * End log group
     */
    groupEnd() {
        if (this.enabled) {
            console.groupEnd();
        }
    }

    /**
     * Table logging
     */
    table(data) {
        if (this.enabled && this._shouldLog(this.levels.INFO)) {
            console.table(data);
        }
    }

    /**
     * Start performance measurement
     */
    time(label) {
        if (this.enabled) {
            this.performanceMarks.set(label, performance.now());
        }
    }

    /**
     * End performance measurement and log duration
     */
    timeEnd(label) {
        if (this.enabled && this.performanceMarks.has(label)) {
            const startTime = this.performanceMarks.get(label);
            const duration = performance.now() - startTime;
            this.info(`${label}: ${duration.toFixed(2)}ms`);
            this.performanceMarks.delete(label);
        }
    }

    /**
     * Assert condition and log error if false
     */
    assert(condition, ...args) {
        if (this.enabled && !condition) {
            this.error('Assertion failed:', ...args);
        }
    }

    /**
     * Clear console (dev only)
     */
    clear() {
        if (this.enabled && !this.isProduction) {
            console.clear();
        }
    }

    /**
     * Get logger configuration
     */
    getConfig() {
        return {
            isProduction: this.isProduction,
            enabled: this.enabled,
            currentLevel: Object.keys(this.levels).find(
                key => this.levels[key] === this.currentLevel
            ),
            activeTimes: this.performanceMarks.size
        };
    }
}

// Create singleton instance
const logger = new Logger();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = logger;
}

// Browser global export - provide both static-like access and instance
if (typeof window !== 'undefined') {
    // Create a proxy-like wrapper that binds all methods automatically
    // This ensures Logger.log() works even when destructured or called dynamically
    const boundLogger = {};

    // Get all methods from logger instance
    const methodNames = [
        'debug', 'log', 'info', 'warn', 'error',
        'group', 'groupEnd', 'table', 'time', 'timeEnd',
        'assert', 'clear', 'setLevel', 'setEnabled', 'getConfig'
    ];

    // Bind each method that exists
    methodNames.forEach(method => {
        if (typeof logger[method] === 'function') {
            boundLogger[method] = logger[method].bind(logger);
        }
    });

    // Add direct access to instance if needed
    boundLogger._instance = logger;

    // Export the bound logger
    window.Logger = boundLogger;

    // Also export class for those who want to create new instances
    window.LoggerClass = Logger;

    // Create a safe logging wrapper function for early-stage code
    window.safeLog = function(level, ...args) {
        if (window.Logger && typeof window.Logger[level] === 'function') {
            window.Logger[level](...args);
        } else {
            console[level](...args);
        }
    };
}
