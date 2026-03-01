/**
 * Authentication Manager
 * Handles token storage, validation, and session management
 */

class AuthManager {
    constructor() {
        this.storageKey = 'storymap_auth_token';
        this.userIdKey = 'storymap_user_id';
    }

    /**
     * Save token and user ID to sessionStorage
     * @param {string} token - Bearer token from backend
     * @param {string} userId - User GUID from backend
     */
    saveAuth(token, userId) {
        try {
            sessionStorage.setItem(this.storageKey, token);
            sessionStorage.setItem(this.userIdKey, userId);
        } catch (error) {
            console.error('[AuthManager] Failed to save auth:', error);
            throw new Error('Oturum bilgileri kaydedilemedi.');
        }
    }

    /**
     * Get token from sessionStorage
     * @returns {string|null} Bearer token
     */
    getToken() {
        return sessionStorage.getItem(this.storageKey);
    }

    /**
     * Get user ID from sessionStorage
     * @returns {string|null} User GUID
     */
    getUserId() {
        return sessionStorage.getItem(this.userIdKey);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        const token = this.getToken();
        return token !== null && token !== '';
    }

    /**
     * Logout: clear session and redirect to landing
     */
    logout() {
        sessionStorage.removeItem(this.storageKey);
        sessionStorage.removeItem(this.userIdKey);

        // Redirect to landing page
        window.location.href = 'index.html';
    }

    /**
     * Validate authentication on protected pages
     * Redirects to landing if not authenticated
     * @returns {boolean} True if authenticated, false otherwise
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    /**
     * Get MEBBİS login URL
     * @param {string} baseUrl - Application base URL (should include /cbs if deployed in subdirectory)
     * @param {number} userType - 1 for teacher, 0 for student
     * @returns {string} MEBBİS login URL with redirect
     */
    getMebbisLoginUrl(baseUrl, userType = 1) {
        const redirectUrl = encodeURIComponent(`${baseUrl}/LoginRedirect.html`);
        return `https://mebi.eba.gov.tr/login/cbs/${userType}?redirectUrl=${redirectUrl}`;
    }
}

// Singleton instance
export const authManager = new AuthManager();
