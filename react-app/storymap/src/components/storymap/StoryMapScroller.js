/**
 * STORYMAP SCROLLER
 * Manages scroll-based navigation and map synchronization
 * Uses scroll event to detect active sections
 */

export class StoryMapScroller {
    constructor(map, scenes) {
        this.map = map;
        this.scenes = scenes;
        this.currentScene = null;
        this.isTransitioning = false;
        this.scrollContainer = null;
        this.sections = [];
        this.scrollHandler = null;

        this.init();
    }

    init() {
        this.scrollContainer = document.querySelector('.storymap-content');
        this.sections = Array.from(document.querySelectorAll('.storymap-section'));
        this.setupScrollListener();
        
        // İlk yüklemede aktif section'ı bul
        setTimeout(() => this.checkActiveSection(), 100);
    }

    /**
     * Setup scroll event listener
     */
    setupScrollListener() {
        // Throttle ile scroll performansını artır
        let ticking = false;
        
        this.scrollHandler = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.checkActiveSection();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        if (this.scrollContainer) {
            this.scrollContainer.addEventListener('scroll', this.scrollHandler, { passive: true });
        }
    }

    /**
     * Check which section is most visible and activate it
     */
    checkActiveSection() {
        if (!this.scrollContainer || this.sections.length === 0) return;

        // Viewport center - pencere ortası
        const viewportHeight = window.innerHeight;
        const viewportCenter = viewportHeight / 2;
        
        let closestSection = null;
        let closestDistance = Infinity;

        this.sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const sectionCenter = rect.top + rect.height / 2;
            const distance = Math.abs(sectionCenter - viewportCenter);

            // Section viewport'ta görünüyor mu?
            const isVisible = rect.top < viewportHeight && rect.bottom > 0;

            // Active class güncelle - merkezdekileri aktif yap
            if (isVisible && distance < viewportHeight * 0.4) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }

            // En yakın section'ı bul - sadece görünürlerse
            if (isVisible && distance < closestDistance) {
                closestDistance = distance;
                closestSection = section;
            }
        });

        if (closestSection) {
            const sceneId = closestSection.getAttribute('data-scene');
            if (sceneId && this.scenes[sceneId]) {
                this.activateScene(sceneId);
            }
        }
    }

    /**
     * Activate a scene and update map
     */
    activateScene(sceneId) {
        // Aynı scene ise ve transition devam ediyorsa skip
        if (this.currentScene === sceneId && this.isTransitioning) {
            return;
        }

        // Scene değişti, güncelle
        this.currentScene = sceneId;
        this.isTransitioning = true;

        const scene = this.scenes[sceneId];

        // Fly to the new location
        this.map.flyTo({
            center: scene.coords,
            zoom: scene.zoom || 10,
            duration: 1500, // 1.5 saniye - daha hızlı
            essential: true,
            pitch: scene.pitch || 0,
            bearing: scene.bearing || 0
        });

        // Reset transition flag after animation
        setTimeout(() => {
            this.isTransitioning = false;
        }, 1500);

        // Dispatch custom event for other components
        const event = new CustomEvent('storymap:scenechange', {
            detail: { sceneId, scene }
        });
        document.dispatchEvent(event);
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this.scrollContainer && this.scrollHandler) {
            this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
        }
        this.scrollHandler = null;
        this.scrollContainer = null;
        this.sections = [];
    }

    /**
     * Scroll to a specific section programmatically
     */
    scrollToSection(sceneId) {
        const section = document.querySelector(`[data-scene="${sceneId}"]`);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
}
