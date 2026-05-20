import { authManager } from './authManager.js';

/**
 * Backend API Service
 * Base URL: https://ogmmateryal.eba.gov.tr/cbs-backend/api
 * CDN URL: https://ogm-large-cdn.eba.gov.tr/Cbs/UserFiles
 */

class ApiService {
    constructor() {
        this.baseURL = 'https://ogmmateryal.eba.gov.tr/cbs-backend/api';
        this.cdnURL = 'https://ogm-large-cdn.eba.gov.tr/Cbs/Userfiles';
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * HTTP request wrapper with auth and error handling
     * @private
     */
    async _request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        // Inject Bearer token
        const token = authManager.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle HTTP errors
            if (!response.ok) {
                await this._handleHTTPError(response);
            }

            // Parse JSON if content exists
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            this._handleNetworkError(error);
        }
    }

    /**
     * Handle HTTP error responses
     * @private
     */
    async _handleHTTPError(response) {
        const status = response.status;

        switch (status) {
            case 401: // Unauthorized
                console.error('[ApiService] 401 Unauthorized - Token invalid/expired');
                authManager.logout(); // Clear token and redirect
                throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');

            case 403: // Forbidden
                console.error('[ApiService] 403 Forbidden - Access denied');
                throw new Error('Bu işlem için yetkiniz bulunmuyor.');

            case 404: // Not Found
                console.error('[ApiService] 404 Not Found');
                throw new Error('İstenen kaynak bulunamadı.');

            case 500: // Server Error
                console.error('[ApiService] 500 Server Error');
                throw new Error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');

            default:
                const errorText = await response.text();
                console.error(`[ApiService] HTTP ${status}: ${errorText}`);
                throw new Error(`Bir hata oluştu (${status})`);
        }
    }

    /**
     * Handle network errors (offline, CORS, timeout)
     * @private
     */
    _handleNetworkError(error) {
        console.error('[ApiService] Network error:', error);

        if (error.message.includes('Failed to fetch')) {
            throw new Error('İnternet bağlantınızı kontrol edin.');
        }

        throw error;
    }

    /**
     * Check if browser is online
     */
    isOnline() {
        return navigator.onLine;
    }

    // ==================== AUTH ENDPOINTS ====================

    /**
     * POST /api/Login
     * @param {string} mebbisToken - MEBBİS token from redirect
     * @returns {Promise<{Kullaniciid: string, Token: string}>}
     */
    async login(mebbisToken) {
        return await this._request('/Login', {
            method: 'POST',
            body: JSON.stringify({ token: mebbisToken })
        });
    }

    // ==================== STORYMAP ENDPOINTS ====================

    /**
     * GET /api/Storymap - List all user's storymaps
     * @returns {Promise<Array<{Id, Sablon, Baslik, Aciklama, Isshared, Publickey}>>}
     */
    async getAllStorymaps() {
        const response = await this._request('/Storymap', {
            method: 'GET'
        });
        // Backend { data: [...], errorMessage } formatında dönüyor
        return response?.data || response;
    }

    /**
     * GET /api/Storymap/{id} - Get single storymap with full data
     * @param {string} id - Storymap GUID
     * @returns {Promise<{Id, Sablon, Baslik, Aciklama, Jsondata, Isshared, Publickey}>}
     */
    async getStorymap(id) {
        const response = await this._request(`/Storymap/${id}`, {
            method: 'GET'
        });
        // Backend { data: {...}, errorMessage } formatında dönüyor
        return response?.data || response;
    }

    /**
     * POST /api/Storymap - Create new storymap
     * @param {Object} data - {title, description, templateName, mapData, steps, points}
     * @returns {Promise<string>} - Guid Id
     */
    async createStorymap(data) {
        const payload = {
            Sablon: data.templateName || 'point',
            Baslik: data.title || 'İsimsiz Harita',
            Aciklama: data.description || '',
            Jsondata: JSON.stringify({
                mapData: data.mapData || {},
                steps: data.steps || [],
                points: data.points || []
            })
        };

        const response = await this._request('/Storymap', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        // Backend { data: 'guid', errorMessage } formatında dönüyor
        return response?.data || response;
    }

    /**
     * PUT /api/Storymap/{id} - Update existing storymap
     * @param {string} id - Storymap GUID
     * @param {Object} data - {title, description, templateName, mapData, steps, points}
     */
    async updateStorymap(id, data) {
        const payload = {
            Sablon: data.templateName || 'point',
            Baslik: data.title || 'İsimsiz Harita',
            Aciklama: data.description || '',
            Jsondata: JSON.stringify({
                mapData: data.mapData || {},
                steps: data.steps || [],
                points: data.points || []
            })
        };

        const response = await this._request(`/Storymap/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        
        // Backend { data: ..., errorMessage } formatında dönüyor
        return response?.data || response;
    }

    /**
     * DELETE /api/Storymap/{id}
     * @param {string} id - Storymap GUID
     */
    async deleteStorymap(id) {
        const response = await this._request(`/Storymap/${id}`, {
            method: 'DELETE'
        });
        return response?.data || response;
    }

    /**
     * PATCH /api/Storymap/share/{id} - Share storymap (generate publicKey)
     * @param {string} id - Storymap GUID
     */
    async shareStorymap(id) {
        const response = await this._request(`/Storymap/share/${id}`, {
            method: 'PATCH'
        });
        return response?.data || response;
    }

    /**
     * PATCH /api/Storymap/unshare/{id} - Unshare storymap (revoke publicKey)
     * @param {string} id - Storymap GUID
     */
    async unshareStorymap(id) {
        const response = await this._request(`/Storymap/unshare/${id}`, {
            method: 'PATCH'
        });
        return response?.data || response;
    }

    /**
     * GET /api/Storymap/public/{publicKey} - Get storymap by public key (no auth)
     * @param {string} publicKey - Public share key
     * @returns {Promise<Object>} Storymap data
     */
    async getStorymapByPublicKey(publicKey) {
        // Note: This endpoint does NOT require auth
        const url = `${this.baseURL}/Storymap/public/${publicKey}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Paylaşım kodu geçersiz veya paylaşım iptal edilmiş.');
                }
                throw new Error('Harita yüklenemedi.');
            }

            const data = await response.json();
            // Backend diğer endpoint'ler gibi { data: {...}, errorMessage } formatında dönebilir
            return data?.data || data;
        } catch (error) {
            console.error('[ApiService] Public storymap fetch error:', error);
            throw error;
        }
    }

    // ==================== FILE UPLOAD ====================

    /**
     * POST /api/Dosya - Upload file (multipart/form-data)
     * @param {File} file - File object from input
     * @returns {Promise<string>} - Filename only (e.g., "d66fc060-8eec-48ff-9bb7-ec18a54e1c29.webp")
     */
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('File', file);

        const token = authManager.getToken();
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseURL}/Dosya`, {
                method: 'POST',
                headers, // Don't set Content-Type, browser will set multipart boundary
                body: formData
            });

            if (!response.ok) {
                await this._handleHTTPError(response);
            }

            const result = await response.json();
            // API returns { data: "filename.webp", errorMessage: null }
            return result.data;
        } catch (error) {
            this._handleNetworkError(error);
        }
    }

    /**
     * POST /api/Dosya/video - Upload video (multipart/form-data)
     * @param {File} file - Video file object from input
     * @returns {Promise<string>} - Filename only (e.g., "d66fc060-8eec-48ff-9bb7-ec18a54e1c29.mp4")
     */
    async uploadVideo(file) {
        const formData = new FormData();
        formData.append('File', file);

        const token = authManager.getToken();
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseURL}/Dosya/video`, {
                method: 'POST',
                headers, // Don't set Content-Type, browser will set multipart boundary
                body: formData
            });

            if (!response.ok) {
                await this._handleHTTPError(response);
            }

            const result = await response.json();
            // API returns { data: "filename.mp4", errorMessage: null }
            return result.data;
        } catch (error) {
            this._handleNetworkError(error);
        }
    }

    /**
     * Get full CDN URL for uploaded file
     * @param {string} filename - Filename from uploadFile()
     * @returns {string} Full CDN URL
     */
    getCDNUrl(filename) {
        return `${this.cdnURL}/${filename}`;
    }

    /**
     * Resolve media URL for display - backwards compatible
     * Handles: plain filename, full CDN URL, base64 data URL
     * @param {string} url - Stored media URL/filename
     * @returns {string} Full displayable URL
     */
    getMediaUrl(url) {
        if (!url) return '';
        
        // Eğer url bir nesne ise (örn: { type, name, url, caption }), içinden url veya name alanını çekelim
        if (typeof url === 'object') {
            url = url.url || url.name || '';
        }
        
        if (typeof url !== 'string') return '';
        
        // Already a full URL or base64 data → return as-is
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        // Plain filename → prepend CDN base URL
        return `${this.cdnURL}/${url}`;
    }
}

// Singleton instance
export const apiService = new ApiService();
