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
        this.transitionTimers = [];

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

        const hasPreviousScene = this.currentScene !== null;

        // Scene değişti, güncelle
        this.currentScene = sceneId;
        this.isTransitioning = true;
        this.clearTransitionTimers();

        const scene = this.scenes[sceneId];

        if (!hasPreviousScene) {
            this.map.flyTo({
                center: scene.coords,
                zoom: scene.zoom || 10,
                duration: 1500,
                essential: true,
                pitch: scene.pitch || 0,
                bearing: scene.bearing || 0
            });

            this.transitionTimers.push(setTimeout(() => {
                this.isTransitioning = false;
            }, 1500));
        } else {
            const targetZoom = scene.zoom || 10;
            const currentZoom = typeof this.map.getZoom === 'function'
                ? this.map.getZoom()
                : targetZoom;
            const currentCenter = typeof this.map.getCenter === 'function'
                ? this.map.getCenter()
                : null;
            const currentCoords = currentCenter
                ? [currentCenter.lng, currentCenter.lat]
                : scene.coords;
            const overviewZoom = this.calculateOverviewZoom(currentCoords, scene.coords, currentZoom, targetZoom);
            const zoomOutDuration = 2500;
            const zoomInDuration = 5500;

            // Google Earth hissi: önce mevcut noktadan uzaklaş, sonra hedefe yaklaş.
            this.map.easeTo({
                zoom: overviewZoom,
                duration: zoomOutDuration,
                essential: true,
                pitch: 0,
                bearing: this.map.getBearing ? this.map.getBearing() : 0
            });

            this.transitionTimers.push(setTimeout(() => {
                this.map.flyTo({
                    center: scene.coords,
                    zoom: targetZoom,
                    duration: zoomInDuration,
                    essential: true,
                    pitch: scene.pitch || 0,
                    bearing: scene.bearing || 0
                });
            }, zoomOutDuration));

            this.transitionTimers.push(setTimeout(() => {
                this.isTransitioning = false;
            }, zoomOutDuration + zoomInDuration));
        }

        // Dispatch custom event for other components
        const event = new CustomEvent('storymap:scenechange', {
            detail: { sceneId, scene }
        });
        document.dispatchEvent(event);
    }

    calculateOverviewZoom(currentCoords, targetCoords, currentZoom, targetZoom) {
        const distanceKm = this.calculateDistanceKm(currentCoords, targetCoords);
        let zoomStep = 9;

        if (distanceKm < 5) {
            zoomStep = 4;
        } else if (distanceKm < 25) {
            zoomStep = 5;
        } else if (distanceKm < 100) {
            zoomStep = 6;
        } else if (distanceKm < 300) {
            zoomStep = 7;
        } else if (distanceKm < 800) {
            zoomStep = 8;
        } else if (distanceKm < 1000) {
            zoomStep = 10;
        } else if (distanceKm < 1500) {
            zoomStep = 11;
        } else if (distanceKm < 3000) {
            zoomStep = 12;
        } else {
            zoomStep = 13;
        }

        return Math.max(1, Math.min(currentZoom, targetZoom) - zoomStep);
    }

    calculateDistanceKm(coord1, coord2) {
        if (!Array.isArray(coord1) || !Array.isArray(coord2)) return 0;

        const [lng1, lat1] = coord1;
        const [lng2, lat2] = coord2;
        const toRad = value => value * Math.PI / 180;
        const earthRadiusKm = 6371;
        const deltaLat = toRad(lat2 - lat1);
        const deltaLng = toRad(lng2 - lng1);
        const a = Math.sin(deltaLat / 2) ** 2
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
            * Math.sin(deltaLng / 2) ** 2;

        return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        this.clearTransitionTimers();
        if (this.scrollContainer && this.scrollHandler) {
            this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
        }
        this.scrollHandler = null;
        this.scrollContainer = null;
        this.sections = [];
    }

    clearTransitionTimers() {
        this.transitionTimers.forEach(timer => clearTimeout(timer));
        this.transitionTimers = [];
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
