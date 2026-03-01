import { authManager } from '../services/authManager.js';
import { apiService } from '../services/apiService.js';

/**
 * Dual-Mode Depolama Yöneticisi
 * - Backend mode: Authenticated kullanıcılar için (API)
 * - IndexedDB mode: Unauthenticated/fallback için (local)
 */
class StorageManager {
    constructor() {
        this.dbName = 'StoryMapDB';
        this.dbVersion = 1;
        this.db = null;
        this.isReady = false;
        this.useFallback = false;
        this.localStorageKey = 'storymap_data';
        this.initPromise = this.init();
    }

    async init() {
        return new Promise((resolve) => {
            try {
                // IndexedDB desteğini kontrol et
                if (!window.indexedDB) {
                    console.warn('[StorageManager] IndexedDB desteklenmiyor, localStorage kullanılacak');
                    this.useFallback = true;
                    this.isReady = true;
                    resolve(true);
                    return;
                }

                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onerror = (event) => {
                    console.error('[StorageManager] IndexedDB açılırken hata:', event.target.error);
                    console.warn('[StorageManager] localStorage fallback kullanılacak');
                    this.useFallback = true;
                    this.isReady = true;
                    resolve(true);
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.isReady = true;
                    this.useFallback = false;
                    resolve(true);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Haritalar deposu
                    if (!db.objectStoreNames.contains('maps')) {
                        const mapsStore = db.createObjectStore('maps', { keyPath: 'id' });
                        mapsStore.createIndex('title', 'title', { unique: false });
                        mapsStore.createIndex('createdAt', 'createdAt', { unique: false });
                    }

                    // Ayarlar deposu
                    if (!db.objectStoreNames.contains('settings')) {
                        db.createObjectStore('settings', { keyPath: 'key' });
                    }
                };
            } catch (e) {
                console.error('[StorageManager] Init hatası:', e);
                console.warn('[StorageManager] localStorage fallback kullanılacak');
                this.useFallback = true;
                this.isReady = true;
                resolve(true);
            }
        });
    }

    async ensureReady() {
        await this.initPromise;
        return this.isReady;
    }

    // ==================== MODE DETECTION ====================

    /**
     * Check if user is authenticated (backend mode)
     * @returns {boolean}
     */
    isBackendMode() {
        return authManager.isAuthenticated();
    }

    // ==================== BACKEND METHODS ====================

    /**
     * Save map to backend
     * @param {Object} data - Map data
     * @returns {Promise<Object>} Saved map with backend ID
     */
    async saveMapToBackend(data) {
        try {
            let id;

            if (data.id && typeof data.id === 'string' && data.id.length > 20) {
                // Existing backend story (GUID format)
                await apiService.updateStorymap(data.id, data);
                id = data.id;
            } else {
                // Create new
                id = await apiService.createStorymap(data);
            }

            return {
                id,
                title: data.title,
                description: data.description,
                templateName: data.templateName,
                mapData: data.mapData,
                steps: data.steps,
                points: data.points,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                source: 'backend'
            };
        } catch (error) {
            console.error('[StorageManager] Backend save failed:', error);
            throw error;
        }
    }

    /**
     * Get map from backend
     * @param {string} id - Storymap GUID
     * @returns {Promise<Object>} Map data
     */
    async getMapFromBackend(id) {
        try {
            const item = await apiService.getStorymap(id);
            
            // apiService zaten response.data dönüyor

            // Transform backend response to app format
            const jsonDataStr = item.jsondata || item.Jsondata || '{}';
            const jsonData = JSON.parse(jsonDataStr);

            return {
                id: item.id || item.Id,
                title: item.baslik || item.Baslik,
                description: item.aciklama || item.Aciklama,
                templateName: item.sablon || item.Sablon,
                mapData: jsonData.mapData,
                steps: jsonData.steps,
                points: jsonData.points,
                isShared: item.isshared || item.Isshared,
                publicKey: item.publickey || item.Publickey,
                source: 'backend'
            };
        } catch (error) {
            console.error('[StorageManager] Backend get failed:', error);
            throw error;
        }
    }

    /**
     * Get all maps from backend
     * @returns {Promise<Array>} List of maps
     */
    async getAllMapsFromBackend() {
        try {
            const items = await apiService.getAllStorymaps();

            // apiService zaten response.data dönüyor
            const itemsArray = Array.isArray(items) ? items : [];

            return itemsArray.map(item => ({
                id: item.id || item.Id,
                title: item.baslik || item.Baslik,
                description: item.aciklama || item.Aciklama,
                templateName: item.sablon || item.Sablon,
                isShared: item.isshared || item.Isshared,
                publicKey: item.publickey || item.Publickey,
                source: 'backend'
            }));
        } catch (error) {
            console.error('[StorageManager] Backend list failed:', error);
            throw error;
        }
    }

    /**
     * Delete map from backend
     * @param {string} id - Storymap GUID
     * @returns {Promise<boolean>}
     */
    async deleteMapFromBackend(id) {
        try {
            await apiService.deleteStorymap(id);
            return true;
        } catch (error) {
            console.error('[StorageManager] Backend delete failed:', error);
            throw error;
        }
    }

    // ========== LOCALSTORAGE FALLBACK METODLARI ==========

    _getLocalData() {
        try {
            const data = localStorage.getItem(this.localStorageKey);
            return data ? JSON.parse(data) : { maps: [], settings: {} };
        } catch (e) {
            console.error('[StorageManager] LocalStorage okuma hatası:', e);
            return { maps: [], settings: {} };
        }
    }

    _saveLocalData(data) {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('[StorageManager] LocalStorage yazma hatası:', e);
            console.error('[StorageManager] Hata detayı: Depolama kotası dolmuş olabilir veya özel mod aktif olabilir');
            return false;
        }
    }

    // ==================== INDEXEDDB METHODS ====================

    /**
     * Save map to IndexedDB
     * @param {Object} mapData - Map data
     * @returns {Promise<Object>} Saved map
     */
    async saveMapToIndexedDB(mapData) {
        await this.ensureReady();

        const data = {
            ...mapData,
            id: mapData.id || Date.now(),
            createdAt: mapData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'indexeddb'
        };

        if (this.useFallback) {
            const localData = this._getLocalData();
            const existingIndex = localData.maps.findIndex(m => m.id === data.id);
            if (existingIndex >= 0) {
                localData.maps[existingIndex] = data;
            } else {
                localData.maps.push(data);
            }
            this._saveLocalData(localData);
            return data;
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['maps'], 'readwrite');
                const store = transaction.objectStore('maps');
                const request = store.put(data);

                request.onsuccess = () => {
                    resolve(data);
                };

                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Get map from IndexedDB
     * @param {number} id - Local map ID
     * @returns {Promise<Object|null>} Map data
     */
    async getMapFromIndexedDB(id) {
        await this.ensureReady();

        if (this.useFallback) {
            const localData = this._getLocalData();
            const map = localData.maps.find(m => m.id === id) || null;
            if (map) map.source = 'indexeddb';
            return map;
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['maps'], 'readonly');
                const store = transaction.objectStore('maps');
                const request = store.get(id);

                request.onsuccess = () => {
                    const map = request.result || null;
                    if (map) map.source = 'indexeddb';
                    resolve(map);
                };

                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Public cache kayıtları (başkasının görüntülenen haritası) listeye dahil edilmez;
     * böylece Çalışmalarım'da görünmez ve "Sunucuya yükle" ile yüklenemez.
     */
    _isPublicCacheEntry(m) {
        return (m.id && String(m.id).startsWith('public_')) || m.source === 'public_cache';
    }

    /**
     * Get all maps from IndexedDB
     * @returns {Promise<Array>} List of maps (public cache hariç)
     */
    async getAllMapsFromIndexedDB() {
        await this.ensureReady();

        if (this.useFallback) {
            const localData = this._getLocalData();
            const maps = (localData.maps || []).filter(m => !this._isPublicCacheEntry(m));
            maps.forEach(m => m.source = 'indexeddb');
            maps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return maps;
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['maps'], 'readonly');
                const store = transaction.objectStore('maps');
                const request = store.getAll();

                request.onsuccess = () => {
                    const maps = (request.result || []).filter(m => !this._isPublicCacheEntry(m));
                    maps.forEach(m => m.source = 'indexeddb');
                    maps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    resolve(maps);
                };

                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Delete map from IndexedDB
     * @param {number} id - Local map ID
     * @returns {Promise<boolean>}
     */
    async deleteMapFromIndexedDB(id) {
        await this.ensureReady();

        if (this.useFallback) {
            const localData = this._getLocalData();
            localData.maps = localData.maps.filter(m => m.id !== id);
            this._saveLocalData(localData);
            return true;
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['maps'], 'readwrite');
                const store = transaction.objectStore('maps');
                const request = store.delete(id);

                request.onsuccess = () => {
                    resolve(true);
                };

                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    // ==================== UNIFIED API (Dual-Mode) ====================

    /**
     * Save map - routes to backend or IndexedDB based on auth
     * @param {Object} data - Map data
     * @returns {Promise<Object>} Saved map
     */
    async saveMap(data) {
        if (this.isBackendMode()) {
            return await this.saveMapToBackend(data);
        } else {
            return await this.saveMapToIndexedDB(data);
        }
    }

    /**
     * Get map - routes to backend or IndexedDB
     * @param {string|number} id - Map ID
     * @param {string} source - Explicit source ('backend' or 'indexeddb')
     * @returns {Promise<Object|null>} Map data
     */
    async getMap(id, source = null) {
        // If source is explicitly specified
        if (source === 'backend') {
            return await this.getMapFromBackend(id);
        } else if (source === 'indexeddb') {
            return await this.getMapFromIndexedDB(id);
        }

        // Auto-detect based on auth
        if (this.isBackendMode()) {
            try {
                return await this.getMapFromBackend(id);
            } catch (error) {
                // Fallback to IndexedDB if backend fails
                console.warn('[StorageManager] Backend get failed, trying IndexedDB');
                return await this.getMapFromIndexedDB(id);
            }
        } else {
            return await this.getMapFromIndexedDB(id);
        }
    }

    /**
     * Get all maps - hybrid approach
     * Returns backend maps + local IndexedDB maps
     * @returns {Promise<Array>} List of maps
     */
    async getAllMaps() {
        const maps = [];

        // Get backend maps if authenticated
        if (this.isBackendMode()) {
            try {
                const backendMaps = await this.getAllMapsFromBackend();
                maps.push(...backendMaps);
            } catch (error) {
                console.warn('[StorageManager] Failed to fetch backend maps:', error);
            }
        }

        // Always get local maps (for migration/delete/open)
        try {
            const localMaps = await this.getAllMapsFromIndexedDB();
            const processedLocalMaps = localMaps.map(map => ({ ...map, isReadOnly: false }));
            maps.push(...processedLocalMaps);
        } catch (error) {
            console.warn('[StorageManager] Failed to fetch local maps:', error);
        }

        // Sort by creation date (newest first)
        return maps.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });
    }

    /**
     * Delete map - routes to backend or IndexedDB
     * @param {string|number} id - Map ID
     * @param {string} source - Source ('backend' or 'indexeddb')
     * @returns {Promise<boolean>}
     */
    async deleteMap(id, source = 'backend') {
        if (source === 'backend') {
            return await this.deleteMapFromBackend(id);
        } else {
            return await this.deleteMapFromIndexedDB(id);
        }
    }

    // ==================== MIGRATION ====================

    /**
     * Upload local map to backend
     * @param {number} localId - Local IndexedDB map ID
     * @returns {Promise<Object>} Backend map
     */
    async migrateMapToBackend(localId) {
        try {
            // Get local map
            const localMap = await this.getMapFromIndexedDB(localId);

            if (!localMap) {
                throw new Error('Yerel harita bulunamadı');
            }

            // Save to backend (without ID, creates new)
            const backendData = { ...localMap };
            delete backendData.id; // Backend will generate new GUID
            delete backendData.source; // Remove source flag

            const savedMap = await this.saveMapToBackend(backendData);

            return savedMap;
        } catch (error) {
            console.error('[StorageManager] Migration failed:', error);
            throw error;
        }
    }

    // ==================== PUBLIC STORY CACHE (for view.html) ====================

    /**
     * Cache a public story for offline viewing
     * @param {string} publicKey - Public key
     * @param {Object} storyData - Story data
     * @returns {Promise<boolean>}
     */
    async cachePublicStory(publicKey, storyData) {
        await this.ensureReady();

        const cacheKey = `public_${publicKey}`;
        const data = {
            ...storyData,
            id: cacheKey,
            publicKey: publicKey,
            cachedAt: new Date().toISOString(),
            source: 'public_cache'
        };

        if (this.useFallback) {
            const localData = this._getLocalData();
            if (!localData.publicCache) localData.publicCache = {};
            localData.publicCache[publicKey] = data;
            return this._saveLocalData(localData);
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['maps'], 'readwrite');
                const store = transaction.objectStore('maps');
                const request = store.put(data);

                request.onsuccess = () => {
                    resolve(true);
                };

                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Get cached public story
     * @param {string} publicKey - Public key
     * @returns {Promise<Object|null>} Story data or null
     */
    async getCachedPublicStory(publicKey) {
        await this.ensureReady();

        const cacheKey = `public_${publicKey}`;

        if (this.useFallback) {
            const localData = this._getLocalData();
            if (!localData.publicCache) return null;
            return localData.publicCache[publicKey] || null;
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['maps'], 'readonly');
                const store = transaction.objectStore('maps');
                const request = store.get(cacheKey);

                request.onsuccess = () => {
                    const cached = request.result || null;
                    if (cached) {
                    }
                    resolve(cached);
                };

                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    // ========== AYAR İŞLEMLERİ ==========

    async saveSetting(key, value) {
        await this.ensureReady();

        if (this.useFallback) {
            const localData = this._getLocalData();
            localData.settings[key] = value;
            return this._saveLocalData(localData);
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['settings'], 'readwrite');
                const store = transaction.objectStore('settings');
                const request = store.put({ key, value });

                request.onsuccess = () => {
                    resolve(true);
                };

                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    async getSetting(key, defaultValue = null) {
        await this.ensureReady();

        if (this.useFallback) {
            const localData = this._getLocalData();
            return localData.settings[key] !== undefined ? localData.settings[key] : defaultValue;
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['settings'], 'readonly');
                const store = transaction.objectStore('settings');
                const request = store.get(key);

                request.onsuccess = () => {
                    resolve(request.result ? request.result.value : defaultValue);
                };

                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    async deleteSetting(key) {
        await this.ensureReady();

        if (this.useFallback) {
            const localData = this._getLocalData();
            delete localData.settings[key];
            return this._saveLocalData(localData);
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['settings'], 'readwrite');
                const store = transaction.objectStore('settings');
                const request = store.delete(key);

                request.onsuccess = () => {
                    resolve(true);
                };

                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    }
}

// Singleton instance
export const storageManager = new StorageManager();
