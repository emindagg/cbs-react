/**
 * STORYMAP COMPONENT
 * Main component that orchestrates scroll-based story map
 */

// MapLibre GL is loaded via CDN in index.html
const maplibregl = window.maplibregl;
import { StoryMapRenderer } from './StoryMapRenderer.js';
import { StoryMapScroller } from './StoryMapScroller.js';
import { Toggle3DControl } from '../map/modules/Toggle3DControl.js';
import { MapMarkers } from '../map/modules/MapMarkers.js';
import { HGM_TILE_URLS } from '../../config/hgm.js';

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
        /** @type {{ sceneId: string, marker: maplibregl.Marker }[]} */
        this.textMarkerElements = [];
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

        // Create map with CartoDB Voyager raster tiles
        this.map = new maplibregl.Map({
            container: 'storymap-map-view',
            style: {
                version: 8,
                sources: {
                    'basemap': {
                        type: 'raster',
                        tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'],
                        tileSize: 256
                    }
                },
                layers: [
                    {
                        id: 'basemap-layer',
                        type: 'raster',
                        source: 'basemap',
                        minzoom: 0,
                        maxzoom: 19
                    }
                ]
            },
            center: this.data.steps && this.data.steps.length > 0 && Array.isArray(this.data.steps[0].coords)
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
            this.mapMarkers = new MapMarkers(this.map);
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
            const el = this.createMarkerElement(step, index);

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

    createMarkerElement(step, index) {
        const el = document.createElement('div');
        const isNumber = step.isNumber === true || step.style === 'number';
        const shape = step.shape || 'circle';
        const color = step.color || (isNumber ? '#3b82f6' : '#ef4444');

        el.className = 'storymap-marker';
        el.style.cssText = `
            width: ${shape === 'teardrop' ? '30px' : '30px'};
            height: ${shape === 'teardrop' ? '38px' : '30px'};
            background-color: ${color};
            border: 2px solid white;
            border-radius: ${shape === 'teardrop' ? '50% 50% 50% 0' : '50%'};
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            transform: ${shape === 'teardrop' ? 'rotate(-45deg)' : 'none'};
        `;

        if (isNumber) {
            const numberSpan = document.createElement('span');
            numberSpan.textContent = step.number || index + 1;
            numberSpan.style.cssText = `
                color: white;
                font-size: 12px;
                font-weight: bold;
                font-family: Arial, sans-serif;
                transform: ${shape === 'teardrop' ? 'rotate(45deg)' : 'none'};
            `;
            el.appendChild(numberSpan);
        } else {
            const icon = document.createElement('i');
            icon.className = `fa-solid ${step.icon || 'fa-map-marker-alt'}`;
            icon.style.cssText = `
                color: white;
                font-size: 11px;
                transform: ${shape === 'teardrop' ? 'rotate(45deg)' : 'none'};
            `;
            el.appendChild(icon);
        }

        return el;
    }

    /**
     * Aktif sahne marker'ına siyah border, diğerlerine beyaz uygular (önizleme haritası).
     * @param {string|null} activeSceneId - scene-{id} veya null
     */
    setActiveMarkerBorder(activeSceneId) {
        if (this.markerElements && this.markerElements.length > 0) {
            this.markerElements.forEach(({ sceneId, element }) => {
                element.style.border = (activeSceneId && sceneId === activeSceneId)
                    ? '2px solid #18181B'
                    : '2px solid #fff';
            });
        }
        this.setActiveTextMarkers(activeSceneId);
    }

    setActiveTextMarkers(activeSceneId) {
        if (!this.textMarkerElements || this.textMarkerElements.length === 0) return;
        this.textMarkerElements.forEach(({ sceneId, marker }) => {
            if (marker._options && typeof marker._options.setStorySceneVisible === 'function') {
                marker._options.setStorySceneVisible(true);
            }
            if (marker._options && typeof marker._options.setStorySceneActive === 'function') {
                marker._options.setStorySceneActive(!activeSceneId || sceneId === activeSceneId);
            }
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
            } else if (drawing.type === 'text') {
                const text = drawing.text || drawing.title || 'Metin';
                if (this.mapMarkers) {
                    const sceneId = `scene-${drawing.id}`;
                    const marker = this.mapMarkers.addTextMarker(drawing.coords, text, {
                        textStyle: drawing.textStyle || 'boxed',
                        textPlacement: drawing.textPlacement || 'left',
                        leaderLine: drawing.leaderLine !== false,
                        leaderLineStyle: drawing.leaderLineStyle || 'gradient',
                        anchorColor: drawing.color || '#334155',
                        leaderColor: drawing.color || '#334155',
                        labelOffsetX: drawing.labelOffsetX !== undefined ? drawing.labelOffsetX : null,
                        labelOffsetY: drawing.labelOffsetY !== undefined ? drawing.labelOffsetY : null,
                        storySceneVisible: true,
                        storySceneActive: false
                    });
                    if (marker) {
                        this.textMarkerElements.push({ sceneId, marker });
                    }
                }
            }
        });
        this.setActiveTextMarkers(this.scroller?.currentScene || null);
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
        this.playbackSpeed = 9000; // Varsayılan 9 saniye (1.0x)

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

                    // Hız değiştir (0.5x = 18000ms, 1.0x = 9000ms, 3.0x = 3000ms)
                    this.playbackSpeed = 9000 / speed;

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
        this.textMarkerElements = [];
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
            if (this.mapMarkers) {
                this.mapMarkers.clearMarkers();
                this.mapMarkers = null;
            }
        } catch (e) {
            console.error('[StoryMapComponent] mapMarkers clear error:', e);
            this.mapMarkers = null;
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
