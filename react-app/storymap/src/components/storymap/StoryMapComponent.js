/**
 * STORYMAP COMPONENT
 * Main component that orchestrates scroll-based story map
 */

// MapLibre GL is loaded via CDN in index.html
const maplibregl = window.maplibregl;
import { StoryMapRenderer } from './StoryMapRenderer.js';
import { StoryMapScroller } from './StoryMapScroller.js';
import { Toggle3DControl } from '../map/modules/Toggle3DControl.js';

export class StoryMapComponent {
    constructor(containerId, data, template) {
        this.containerId = containerId;
        this.data = data;
        this.template = template;
        this.map = null;
        this.renderer = null;
        this.scroller = null;
        this.scenes = {};
        /** @type {{ sceneId: string, element: HTMLElement }[]} */
        this.markerElements = [];
    }

    /**
     * Initialize the StoryMap
     */
    init() {
        // Render the layout
        this.renderer = new StoryMapRenderer(this.containerId, this.data);
        this.renderer.render();

        // Initialize the map
        this.initMap();

        // Prepare scenes
        this.prepareScenes();

        // Aktif sahne değişince marker border güncelle (önizleme)
        this._sceneChangeHandler = (e) => {
            this.setActiveMarkerBorder(e.detail?.sceneId ?? null);
        };
        document.addEventListener('storymap:scenechange', this._sceneChangeHandler);

        // Initialize scroll observer
        setTimeout(() => {
            this.scroller = new StoryMapScroller(this.map, this.scenes);
            // İlk scene'i hemen aktif et
            if (this.data.steps && this.data.steps.length > 0) {
                const firstSceneId = `scene-${this.data.steps[0].id}`;
                if (this.scroller && this.scenes[firstSceneId]) {
                    this.scroller.activateScene(firstSceneId);
                }
            }
        }, 500); // Wait for map to initialize

        // Setup exit button
        this.setupExitButton();

        // Setup playback controls
        this.setupPlaybackControls();

        return this;
    }

    /**
     * Initialize MapLibre map
     */
    initMap() {
        const mapContainer = document.getElementById('storymap-map-view');

        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        // Create map with HGM Temel raster tiles
        this.map = new maplibregl.Map({
            container: 'storymap-map-view',
            style: {
                version: 8,
                sources: {
                    'hgm-temel': {
                        type: 'raster',
                        tiles: ['https://atlas.harita.gov.tr/webservis/harita/hgm_harita/{z}/{x}/{y}.png?apikey=AlkVjf0YFkkDuvu58l7Ndc1oiHk71IbF'],
                        tileSize: 256
                    }
                },
                layers: [
                    {
                        id: 'hgm-temel-layer',
                        type: 'raster',
                        source: 'hgm-temel',
                        minzoom: 0,
                        maxzoom: 19
                    }
                ]
            },
            center: this.data.steps && this.data.steps.length > 0
                ? this.data.steps[0].coords
                : (this.template?.defaultCenter || [35.0, 39.0]), // Türkiye
            zoom: this.data.steps && this.data.steps.length > 0
                ? this.data.steps[0].zoom
                : (this.template?.defaultZoom || 6), // Türkiye zoom
            pitch: 0,
            bearing: 0,
            scrollZoom: true, // Mouse scroll ile zoom aktif
            dragRotate: false,
            attributionControl: false // View mode'da attribution'ı gizle
        });

        // Add 3D toggle control (üstte)
        this.toggle3DControl = new Toggle3DControl();
        this.map.addControl(this.toggle3DControl, 'top-right');

        // Add navigation controls (altta)
        this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Add markers and drawings when map loads
        this.map.on('load', () => {
            this.addMarkers();
            this.addDrawings();
        });
    }

    /**
     * Prepare scenes object for scroller
     */
    prepareScenes() {
        if (!this.data.steps || this.data.steps.length === 0) {
            return;
        }

        this.data.steps.forEach(step => {
            const sceneId = `scene-${step.id}`;
            // Çizim öğeleri için daha yüksek zoom (alanı görmek için)
            const defaultZoom = step.isDrawing ? 13 : 12;
            this.scenes[sceneId] = {
                coords: step.coords,
                zoom: step.zoom || defaultZoom,
                pitch: step.pitch || 0,
                bearing: step.bearing || 0
            };
        });
    }

    /**
     * Add markers to map for each location (skip drawing items)
     */
    addMarkers() {
        if (!this.data.steps || this.data.steps.length === 0) {
            return;
        }

        // Sadece marker noktaları için (çizim öğeleri hariç)
        const markerSteps = this.data.steps.filter(step => !step.isDrawing);
        this.markerElements = [];

        markerSteps.forEach((step, index) => {
            const sceneId = `scene-${step.id}`;
            // Create marker element
            const el = document.createElement('div');
            el.className = 'storymap-marker';
            el.style.cssText = `
                width: 30px;
                height: 30px;
                background-color: #667eea;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
                cursor: pointer;
            `;
            el.textContent = index + 1;

            this.markerElements.push({ sceneId, element: el });

            // Add click handler to scroll to section
            el.addEventListener('click', () => {
                if (this.scroller) {
                    this.scroller.scrollToSection(sceneId);
                }
            });

            // Add marker to map
            new maplibregl.Marker({ element: el })
                .setLngLat(step.coords)
                .addTo(this.map);
        });
    }

    /**
     * Aktif sahne marker'ına siyah border, diğerlerine beyaz uygular (önizleme haritası).
     * @param {string|null} activeSceneId - scene-{id} veya null
     */
    setActiveMarkerBorder(activeSceneId) {
        if (!this.markerElements || this.markerElements.length === 0) return;
        this.markerElements.forEach(({ sceneId, element }) => {
            element.style.border = (activeSceneId && sceneId === activeSceneId)
                ? '2px solid #1c1c1e'
                : '2px solid #fff';
        });
    }

    /**
     * Add drawings (lines, polygons, circles) to map
     */
    addDrawings() {
        if (!this.data.drawings || this.data.drawings.length === 0) {
            return;
        }

        this.data.drawings.forEach((drawing, index) => {
            const sourceId = `drawing-source-${drawing.id || index}`;
            const layerId = `drawing-layer-${drawing.id || index}`;

            if (drawing.type === 'line' || drawing.type === 'arrow') {
                // Çizgi veya ok
                this.map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: drawing.coords
                        }
                    }
                });

                this.map.addLayer({
                    id: layerId,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': drawing.color,
                        'line-width': 3,
                        'line-opacity': 0.8
                    }
                });
            } else if (drawing.type === 'polygon' || drawing.type === 'rectangle') {
                // Alan veya dikdörtgen
                const coords = drawing.coords;
                // Polygon'u kapat (ilk ve son nokta aynı olmalı)
                const closedCoords = coords[0] === coords[coords.length - 1] 
                    ? coords 
                    : [...coords, coords[0]];

                this.map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [closedCoords]
                        }
                    }
                });

                // Fill layer
                this.map.addLayer({
                    id: `${layerId}-fill`,
                    type: 'fill',
                    source: sourceId,
                    paint: {
                        'fill-color': drawing.color,
                        'fill-opacity': 0.3
                    }
                });

                // Outline layer
                this.map.addLayer({
                    id: `${layerId}-outline`,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': drawing.color,
                        'line-width': 2,
                        'line-opacity': 0.8
                    }
                });
            } else if (drawing.type === 'circle') {
                // Daire - koordinatlar zaten polygon olarak geliyor
                const coords = drawing.coords;
                // Polygon'u kapat (ilk ve son nokta aynı olmalı)
                const closedCoords = coords[coords.length - 1][0] === coords[0][0] && 
                                     coords[coords.length - 1][1] === coords[0][1]
                    ? coords 
                    : [...coords, coords[0]];

                this.map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [closedCoords]
                        }
                    }
                });

                // Fill layer
                this.map.addLayer({
                    id: `${layerId}-fill`,
                    type: 'fill',
                    source: sourceId,
                    paint: {
                        'fill-color': drawing.color,
                        'fill-opacity': 0.3
                    }
                });

                // Outline layer
                this.map.addLayer({
                    id: `${layerId}-outline`,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': drawing.color,
                        'line-width': 2,
                        'line-opacity': 0.8
                    }
                });
            }
        });
    }

    /**
     * Calculate distance between two points in meters
     */
    calculateDistance(coord1, coord2) {
        const R = 6371000; // Earth radius in meters
        const lat1 = coord1[1] * Math.PI / 180;
        const lat2 = coord2[1] * Math.PI / 180;
        const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
        const deltaLng = (coord2[0] - coord1[0]) * Math.PI / 180;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Create circle polygon coordinates
     */
    createCirclePolygon(center, radiusMeters, points = 64) {
        const coords = [];
        const distanceX = radiusMeters / (111320 * Math.cos(center[1] * Math.PI / 180));
        const distanceY = radiusMeters / 110540;

        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const x = center[0] + distanceX * Math.cos(angle);
            const y = center[1] + distanceY * Math.sin(angle);
            coords.push([x, y]);
        }

        return coords;
    }

    /**
     * Setup exit button click handler
     */
    setupExitButton() {
        const exitBtn = document.getElementById('storymap-exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.exitStoryMode();
            });
        }
    }

    /**
     * Setup playback controls
     */
    setupPlaybackControls() {
        this.playbackTimer = null;
        this.playbackIndex = 0;
        this.playbackSpeed = 3000; // Varsayılan 3 saniye (1.0x)

        const playbackToggle = document.getElementById('storymap-playback-toggle');
        const speedButtons = document.querySelectorAll('.storymap-playback__speed-btn');

        if (playbackToggle) {
            playbackToggle.addEventListener('click', () => {
                const isPlaying = playbackToggle.getAttribute('data-playing') === 'true';

                if (isPlaying) {
                    this.stopPlayback();
                    playbackToggle.setAttribute('data-playing', 'false');
                    playbackToggle.innerHTML = '<i class="fa-solid fa-play"></i>';
                    playbackToggle.title = 'Otomatik Oynat';
                } else {
                    this.startPlayback();
                    playbackToggle.setAttribute('data-playing', 'true');
                    playbackToggle.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    playbackToggle.title = 'Duraklat';
                }
            });
        }

        if (speedButtons.length > 0) {
            speedButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const speed = parseFloat(btn.dataset.speed);

                    // Aktif durumu güncelle
                    speedButtons.forEach(b => b.classList.remove('storymap-playback__speed-btn--active'));
                    btn.classList.add('storymap-playback__speed-btn--active');

                    // Hız değiştir (0.5x = 6000ms, 1.0x = 3000ms, 3.0x = 1000ms)
                    this.playbackSpeed = 3000 / speed;

                    // Eğer oynatma aktifse, yeniden başlat
                    const isPlaying = playbackToggle && playbackToggle.getAttribute('data-playing') === 'true';
                    if (isPlaying) {
                        this.stopPlayback();
                        this.startPlayback();
                    }
                });
            });
        }
    }

    /**
     * Start automatic playback
     */
    startPlayback() {
        console.log('[StoryMap Playback] START');
        this.playbackIndex = 0;

        // Mevcut timer'ı temizle
        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
        }

        // Otomatik oynatma başlat
        this.playbackTimer = setInterval(() => {
            if (!this.data.steps || this.data.steps.length === 0) {
                this.stopPlayback();
                return;
            }

            if (this.playbackIndex < this.data.steps.length) {
                const step = this.data.steps[this.playbackIndex];
                const sceneId = `scene-${step.id}`;

                console.log('[StoryMap Playback] Moving to step:', this.playbackIndex, step.title);

                // Scroll to section
                if (this.scroller) {
                    this.scroller.scrollToSection(sceneId);
                }

                this.playbackIndex++;
            } else {
                // Son adıma ulaşıldı, durdur
                console.log('[StoryMap Playback] END');
                this.stopPlayback();

                // Play button'u güncelle
                const playbackToggle = document.getElementById('storymap-playback-toggle');
                if (playbackToggle) {
                    playbackToggle.setAttribute('data-playing', 'false');
                    playbackToggle.innerHTML = '<i class="fa-solid fa-play"></i>';
                    playbackToggle.title = 'Otomatik Oynat';
                }
            }
        }, this.playbackSpeed);
    }

    /**
     * Stop automatic playback
     */
    stopPlayback() {
        console.log('[StoryMap Playback] STOP');
        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
            this.playbackTimer = null;
        }
    }

    /**
     * Exit story mode and return to normal view
     */
    exitStoryMode() {
        const event = new CustomEvent('storymap:exit', {
            bubbles: true,
            detail: { data: this.data }
        });
        document.dispatchEvent(event);
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this._sceneChangeHandler) {
            document.removeEventListener('storymap:scenechange', this._sceneChangeHandler);
            this._sceneChangeHandler = null;
        }
        this.markerElements = [];
        try {
            this.stopPlayback();
        } catch (e) {
            console.error('[StoryMapComponent] stopPlayback error:', e);
        }

        try {
            if (this.scroller) {
                this.scroller.destroy();
                this.scroller = null;
            }
        } catch (e) {
            console.error('[StoryMapComponent] scroller destroy error:', e);
            this.scroller = null;
        }

        try {
            if (this.map) {
                this.map.remove();
                this.map = null;
            }
        } catch (e) {
            console.error('[StoryMapComponent] map remove error:', e);
            this.map = null;
        }

        try {
            if (this.renderer) {
                this.renderer.clear();
                this.renderer = null;
            }
        } catch (e) {
            console.error('[StoryMapComponent] renderer clear error:', e);
            this.renderer = null;
        }
    }
}
