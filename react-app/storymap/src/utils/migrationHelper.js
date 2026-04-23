import { storageManager } from './storageManager.js';
import { authManager } from '../services/authManager.js';

/**
 * Migration Helper
 * Handles migration of local IndexedDB maps to backend
 */
class MigrationHelper {
    /**
     * Check if user has local maps that can be migrated
     * @returns {Promise<boolean>}
     */
    async hasLocalMaps() {
        const localMaps = await storageManager.getAllMapsFromIndexedDB();
        return localMaps.length > 0;
    }

    /**
     * Get count of local maps
     * @returns {Promise<number>}
     */
    async getLocalMapsCount() {
        const localMaps = await storageManager.getAllMapsFromIndexedDB();
        return localMaps.length;
    }

    /**
     * Show migration prompt to user
     * @returns {Promise<boolean>} True if user wants to migrate
     */
    async promptMigration() {
        if (!authManager.isAuthenticated()) {
            return false;
        }

        const count = await this.getLocalMapsCount();

        if (count === 0) {
            return false;
        }

        const message = `${count} adet lokal haritanız bulundu. Backend'e yüklemek ister misiniz?\n\nYüklenen haritalar tüm cihazlarınızdan erişilebilir olacak.`;

        return confirm(message);
    }

    /**
     * Migrate all local maps to backend
     * @param {Function} progressCallback - Called with (current, total, title)
     * @returns {Promise<Object>} Migration results
     */
    async migrateAllMaps(progressCallback = null) {
        const localMaps = await storageManager.getAllMapsFromIndexedDB();
        const results = {
            total: localMaps.length,
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < localMaps.length; i++) {
            const map = localMaps[i];

            if (progressCallback) {
                progressCallback(i + 1, localMaps.length, map.title || 'İsimsiz Harita');
            }

            try {
                await storageManager.migrateMapToBackend(map.id);

                // Başarılı migration sonrası yerel kopyayı sil
                await this.cleanupAfterMigration(map.id);

                results.success++;
            } catch (error) {
                console.error(`[Migration] Failed to migrate map ${map.id}:`, error);
                results.failed++;
                results.errors.push({
                    mapId: map.id,
                    title: map.title,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Delete local map after successful migration
     * @param {number} localId - Local map ID
     * @returns {Promise<boolean>}
     */
    async cleanupAfterMigration(localId) {
        try {
            await storageManager.deleteMapFromIndexedDB(localId);
            console.log('[Migration] Cleaned up local map:', localId);
            return true;
        } catch (error) {
            console.error('[Migration] Cleanup failed:', error);
            return false;
        }
    }
}

// Singleton instance
export const migrationHelper = new MigrationHelper();
