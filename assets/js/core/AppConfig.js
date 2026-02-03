/**
 * AppConfig - Centralized Configuration Management
 *
 * Provides a centralized configuration system with type validation,
 * environment-based configs, and immutable production settings.
 *
 * Features:
 * - Dot notation for nested config access
 * - Type validation
 * - Environment-based configuration (dev, prod, test)
 * - Config merging and extending
 * - Immutable production configs
 * - Default values
 * - Config validation schemas
 *
 * @example
 * const config = new AppConfig({
 *   map: {
 *     center: [39.9334, 32.8597],
 *     zoom: 6,
 *     minZoom: 4,
 *     maxZoom: 18
 *   },
 *   api: {
 *     baseUrl: 'https://api.example.com',
 *     timeout: 5000
 *   }
 * }, { environment: 'production' });
 *
 * const mapCenter = config.get('map.center', [0, 0]);
 */

class AppConfig {
    /**
     * Create a new AppConfig instance
     * @param {Object} config - Initial configuration object
     * @param {Object} options - Configuration options
     */
    constructor(config = {}, options = {}) {
        // Environment: 'development', 'production', 'test'
        this._environment = options.environment || this._detectEnvironment();

        // Configuration object
        this._config = this._deepClone(config);

        // Options
        this._options = {
            strict: options.strict !== false,
            frozen: options.frozen || this._environment === 'production',
            validateTypes: options.validateTypes !== false,
            ...options
        };

        // Type definitions for validation
        this._types = new Map();

        // Validation schemas
        this._schemas = new Map();

        // Freeze config in production
        if (this._options.frozen && Object.freeze) {
            this._freezeConfig();
        }

        Logger.log(`✅ AppConfig initialized (environment: ${this._environment})`);
    }

    /**
     * Get a configuration value using dot notation
     * @param {string} key - Dot-separated key (e.g., 'map.center')
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Configuration value
     */
    get(key, defaultValue = undefined) {
        if (!key) {
            return this._deepClone(this._config);
        }

        const keys = key.split('.');
        let value = this._config;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }

        return this._deepClone(value);
    }

    /**
     * Set a configuration value using dot notation
     * @param {string} key - Dot-separated key
     * @param {*} value - Value to set
     * @returns {boolean} Success status
     */
    set(key, value) {
        if (this._options.frozen) {
            Logger.error('AppConfig.set: Cannot modify frozen configuration');
            return false;
        }

        if (!key) {
            Logger.error('AppConfig.set: key is required');
            return false;
        }

        // Type validation
        if (this._options.validateTypes && this._types.has(key)) {
            if (!this._validateType(value, this._types.get(key))) {
                Logger.error(`AppConfig.set: Type mismatch for '${key}'`);
                return false;
            }
        }

        const keys = key.split('.');
        let current = this._config;

        // Navigate to parent object
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current)) {
                current[k] = {};
            }
            current = current[k];
        }

        // Set value
        const lastKey = keys[keys.length - 1];
        current[lastKey] = this._deepClone(value);

        return true;
    }

    /**
     * Check if a configuration key exists
     * @param {string} key - Dot-separated key
     * @returns {boolean} True if key exists
     */
    has(key) {
        const keys = key.split('.');
        let value = this._config;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return false;
            }
        }

        return true;
    }

    /**
     * Merge configuration with another config object
     * @param {Object} config - Configuration object to merge
     * @param {boolean} deep - Deep merge (default: true)
     * @returns {boolean} Success status
     */
    merge(config, deep = true) {
        if (this._options.frozen) {
            Logger.error('AppConfig.merge: Cannot modify frozen configuration');
            return false;
        }

        if (deep) {
            this._config = this._deepMerge(this._config, config);
        } else {
            Object.assign(this._config, config);
        }

        return true;
    }

    /**
     * Get all configuration
     * @returns {Object} All configuration
     */
    getAll() {
        return this._deepClone(this._config);
    }

    /**
     * Get current environment
     * @returns {string} Environment name
     */
    getEnvironment() {
        return this._environment;
    }

    /**
     * Check if running in production
     * @returns {boolean} True if production
     */
    isProduction() {
        return this._environment === 'production';
    }

    /**
     * Check if running in development
     * @returns {boolean} True if development
     */
    isDevelopment() {
        return this._environment === 'development';
    }

    /**
     * Define type for a configuration key
     * @param {string} key - Configuration key
     * @param {string|Function} type - Type name or validator function
     */
    defineType(key, type) {
        this._types.set(key, type);
    }

    /**
     * Define validation schema for a configuration key
     * @param {string} key - Configuration key
     * @param {Object} schema - Validation schema
     */
    defineSchema(key, schema) {
        this._schemas.set(key, schema);
    }

    /**
     * Validate configuration against defined schemas
     * @returns {Object} Validation result { valid: boolean, errors: [] }
     */
    validate() {
        const errors = [];

        for (const [key, schema] of this._schemas.entries()) {
            const value = this.get(key);
            const result = this._validateSchema(value, schema, key);
            if (!result.valid) {
                errors.push(...result.errors);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Reset configuration to initial values
     */
    reset() {
        if (this._options.frozen) {
            Logger.error('AppConfig.reset: Cannot modify frozen configuration');
            return false;
        }

        this._config = {};
        return true;
    }

    // ==========================================
    // PRIVATE METHODS
    // ==========================================

    /**
     * Detect environment from hostname or other indicators
     * @private
     */
    _detectEnvironment() {
        if (typeof window === 'undefined') {
            return 'development';
        }

        const hostname = window.location.hostname;

        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            return 'development';
        }

        return 'production';
    }

    /**
     * Deep clone an object
     * @private
     */
    _deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this._deepClone(item));
        }

        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this._deepClone(obj[key]);
            }
        }
        return cloned;
    }

    /**
     * Deep merge two objects
     * @private
     */
    _deepMerge(target, source) {
        const result = this._deepClone(target);

        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (result[key] && typeof result[key] === 'object') {
                        result[key] = this._deepMerge(result[key], source[key]);
                    } else {
                        result[key] = this._deepClone(source[key]);
                    }
                } else {
                    result[key] = this._deepClone(source[key]);
                }
            }
        }

        return result;
    }

    /**
     * Freeze configuration object
     * @private
     */
    _freezeConfig() {
        const freeze = (obj) => {
            Object.freeze(obj);
            Object.keys(obj).forEach(key => {
                if (obj[key] && typeof obj[key] === 'object') {
                    freeze(obj[key]);
                }
            });
        };
        freeze(this._config);
    }

    /**
     * Validate value against type
     * @private
     */
    _validateType(value, type) {
        if (typeof type === 'function') {
            return type(value);
        }

        const actualType = Array.isArray(value) ? 'array' : typeof value;
        return actualType === type.toLowerCase();
    }

    /**
     * Validate value against schema
     * @private
     */
    _validateSchema(value, schema, path) {
        const errors = [];

        // Required check
        if (schema.required && (value === undefined || value === null)) {
            errors.push(`${path} is required`);
            return { valid: false, errors };
        }

        // Type check
        if (schema.type && value !== undefined && value !== null) {
            if (!this._validateType(value, schema.type)) {
                errors.push(`${path} must be of type ${schema.type}`);
            }
        }

        // Range check for numbers
        if (typeof value === 'number') {
            if (schema.min !== undefined && value < schema.min) {
                errors.push(`${path} must be >= ${schema.min}`);
            }
            if (schema.max !== undefined && value > schema.max) {
                errors.push(`${path} must be <= ${schema.max}`);
            }
        }

        // Enum check
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`${path} must be one of: ${schema.enum.join(', ')}`);
        }

        // Custom validator
        if (schema.validator && typeof schema.validator === 'function') {
            const result = schema.validator(value);
            if (result !== true) {
                errors.push(typeof result === 'string' ? result : `${path} failed custom validation`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.AppConfig = AppConfig;
}
