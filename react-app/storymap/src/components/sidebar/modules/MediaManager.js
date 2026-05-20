import { apiService } from '../../../services/apiService.js';
import { storageManager } from '../../../utils/storageManager.js';
import { toast } from '../../../utils/toast.js';
import { isVideoFile } from '../../../utils/mediaType.js';

/**
 * MediaManager - Medya yükleme ve yönetimi
 */

export class MediaManager {
    constructor(sidebarComponent) {
        this.sidebar = sidebarComponent;
    }

    /**
     * Dosya yükleme işlemini başlatır
     * @param {FileList} files - Yüklenen dosyalar
     * @param {Object} targetPoint - Hedef nokta
     * @param {Function} onComplete - Tamamlandığında çağrılacak callback
     */
    async handleUpload(files, targetPoint, onComplete) {
        if (!files || files.length === 0) return;

        if (!targetPoint.media) targetPoint.media = [];

        for (const file of Array.from(files)) {
            try {
                const mediaItem = await this.uploadFile(file);
                targetPoint.media.push(mediaItem);
            } catch (error) {
                console.error('[MediaManager] Upload failed:', error);
                toast.error(`${file.name} yüklenemedi: ${error.message}`);
            }
        }

        if (onComplete) onComplete(targetPoint.media);
    }

    /**
     * Single file upload (backend or base64)
     * @param {File} file - File to upload
     * @returns {Promise<Object>} Media item
     */
    async uploadFile(file) {
        if (storageManager.isBackendMode()) {
            // Upload to backend CDN - store only filename
            try {
                const filename = await apiService.uploadFile(file);

                console.log('[MediaManager] File uploaded, filename:', filename);

                return {
                    type: isVideoFile(file) ? 'video' : 'image',
                    url: filename, // Store only filename (e.g. "abc123.webp")
                    name: file.name,
                    caption: '',
                    source: 'cdn'
                };
            } catch (error) {
                console.error('[MediaManager] CDN upload failed, falling back to base64:', error);
                return await this.convertToBase64(file);
            }
        } else {
            // Convert to base64 (IndexedDB mode)
            return await this.convertToBase64(file);
        }
    }

    /**
     * Convert file to base64
     * @param {File} file - File to convert
     * @returns {Promise<Object>} Media item with base64 URL
     */
    convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    type: isVideoFile(file) ? 'video' : 'image',
                    url: e.target.result,
                    name: file.name,
                    caption: '',
                    source: 'base64'
                });
            };
            reader.onerror = (e) => {
                reject(new Error('Dosya okunamadı'));
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Medya öğesi siler
     * @param {Object} targetPoint - Hedef nokta
     * @param {number} index - Silinecek medya indeksi
     * @returns {boolean} Başarılı mı
     */
    removeMedia(targetPoint, index) {
        if (targetPoint.media && targetPoint.media[index]) {
            targetPoint.media.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Medya caption'ını günceller
     * @param {Object} targetPoint - Hedef nokta
     * @param {number} index - Medya indeksi
     * @param {string} caption - Yeni caption
     */
    updateCaption(targetPoint, index, caption) {
        if (targetPoint.media && targetPoint.media[index]) {
            targetPoint.media[index].caption = caption;
        }
    }

    /**
     * Drag & drop handler'larını oluşturur
     * @param {HTMLElement} dropArea - Bırakma alanı
     * @param {Function} onDrop - Dosya bırakıldığında çağrılacak callback
     */
    setupDragDrop(dropArea, onDrop) {
        let dragCounter = 0;

        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('sidebar__media-upload--dragover');
        });

        dropArea.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            dropArea.classList.add('sidebar__media-upload--dragover');
        });
        
        dropArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter = Math.max(0, dragCounter - 1);
            if (dragCounter === 0) {
                dropArea.classList.remove('sidebar__media-upload--dragover');
            }
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            dropArea.classList.remove('sidebar__media-upload--dragover');
            if (onDrop) onDrop(e.dataTransfer.files);
        });
    }
}
