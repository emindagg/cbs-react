/**
 * StoryMap Modal Manager
 * Handles opening/closing StoryMap in a modal overlay
 */

(function() {
    'use strict';

    const StorymapModal = {
        overlay: null,
        iframe: null,
        isOpen: false,

        init() {
            console.log('[StorymapModal] Initializing...');

            // Get button
            const button = document.getElementById('storymap-toggle-btn');
            if (!button) {
                console.warn('[StorymapModal] Button #storymap-toggle-btn not found');
                return;
            }

            // Get modal elements
            this.overlay = document.getElementById('storymap-modal-overlay');
            this.iframe = document.getElementById('storymap-modal-iframe');
            this.loader = this.overlay.querySelector('.storymap-modal-loader');

            if (!this.overlay || !this.iframe) {
                console.error('[StorymapModal] Modal elements not found');
                return;
            }

            // Hide loader when iframe loads
            this.iframe.addEventListener('load', () => {
                console.log('[StorymapModal] Iframe loaded, hiding loader');
                if (this.loader) {
                    this.loader.style.display = 'none';
                }
            });

            // Attach event listeners
            button.addEventListener('click', () => this.open());

            const closeBtn = this.overlay.querySelector('.storymap-modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }

            // Close on overlay click (outside modal)
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });

            // Close on ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });

            // Listen for messages from iframe (when user clicks login/view)
            window.addEventListener('message', (e) => {
                // Check origin for security (adjust for production)
                // if (e.origin !== window.location.origin) return;

                if (e.data?.type === 'storymap-open-new-tab') {
                    console.log('[StorymapModal] Opening in new tab:', e.data.url);
                    window.open(e.data.url, '_blank');
                    this.close();
                }
            });

            console.log('[StorymapModal] Initialized successfully');
        },

        open() {
            console.log('[StorymapModal] Opening modal...');

            // Show loader
            if (this.loader) {
                this.loader.style.display = 'block';
            }

            // Set iframe src (loads StoryMap landing page)
            // Use relative path for both local and production
            this.iframe.src = 'storymap/index.html';

            // Show modal
            this.overlay.classList.add('active');
            this.isOpen = true;

            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        },

        close() {
            console.log('[StorymapModal] Closing modal...');

            // Hide modal
            this.overlay.classList.remove('active');
            this.isOpen = false;

            // Restore body scroll
            document.body.style.overflow = '';

            // Clear iframe src (stops any running scripts)
            setTimeout(() => {
                if (!this.isOpen) {
                    this.iframe.src = 'about:blank';
                }
            }, 300); // Wait for fade out animation
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => StorymapModal.init());
    } else {
        StorymapModal.init();
    }

    // Expose globally for debugging
    window.StorymapModal = StorymapModal;
})();
