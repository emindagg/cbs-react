import { MapHelpers } from './MapHelpers.js';

/**
 * MapDrawing - Çizim araçları yönetimi
 */
export class MapDrawing {
    constructor(map, mapMarkers) {
        this.map = map;
        this.mapMarkers = mapMarkers; // Route durakları için gerekli
        this.polygons = [];
        this.routes = [];
        this.drawingVertices = [];
        this.currentClickHandler = null;
        this.currentMoveHandler = null;
        this.currentContextMenuHandler = null;
        this.drawMode = null;

        // Mapbox GL Draw kontrolünü arka planda başlat
        this.draw = null;
        if (typeof MapboxDraw !== 'undefined') {
            this.draw = new MapboxDraw({
                displayControlsDefault: false,
                controls: {
                    polygon: false,
                    trash: false
                },
                styles: [
                    // POLYS
                    {
                        'id': 'gl-draw-polygon-fill',
                        'type': 'fill',
                        'filter': ['all', ['==', '$type', 'Polygon']],
                        'paint': {
                            'fill-color': ['case', ['==', ['get', 'active'], 'true'], '#fbb03b', '#3bb2d0'],
                            'fill-opacity': 0.1
                        }
                    },
                    // LINES
                    {
                        'id': 'gl-draw-lines',
                        'type': 'line',
                        'filter': ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
                        'layout': {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        'paint': {
                            'line-color': ['case', ['==', ['get', 'active'], 'true'], '#fbb03b', '#3bb2d0'],
                            'line-width': 2
                        }
                    },
                    // POINTS OUTER
                    {
                        'id': 'gl-draw-point-outer',
                        'type': 'circle',
                        'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
                        'paint': {
                            'circle-radius': ['case', ['==', ['get', 'active'], 'true'], 9, 7],
                            'circle-color': '#fff'
                        }
                    },
                    // POINTS INNER
                    {
                        'id': 'gl-draw-point-inner',
                        'type': 'circle',
                        'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
                        'paint': {
                            'circle-radius': ['case', ['==', ['get', 'active'], 'true'], 6, 4],
                            'circle-color': ['case', ['==', ['get', 'active'], 'true'], '#fbb03b', '#3bb2d0']
                        }
                    },
                    // ACTIVE VERTEX OUTER (Larger radius for touch targets and visibility!)
                    {
                        'id': 'gl-draw-vertex-outer',
                        'type': 'circle',
                        'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex'], ['!=', 'mode', 'simple_select']],
                        'paint': {
                            'circle-radius': ['case', ['==', ['get', 'active'], 'true'], 9, 7],
                            'circle-color': '#fff'
                        }
                    },
                    // ACTIVE VERTEX INNER
                    {
                        'id': 'gl-draw-vertex-inner',
                        'type': 'circle',
                        'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex'], ['!=', 'mode', 'simple_select']],
                        'paint': {
                            'circle-radius': ['case', ['==', ['get', 'active'], 'true'], 6, 4],
                            'circle-color': '#fbb03b'
                        }
                    },
                    // MIDPOINT
                    {
                        'id': 'gl-draw-midpoint',
                        'type': 'circle',
                        'filter': ['all', ['==', 'meta', 'midpoint']],
                        'paint': {
                            'circle-radius': 4,
                            'circle-color': '#fbb03b'
                        }
                    }
                ]
            });
            this.map.addControl(this.draw);
            console.log('[MapDrawing] MapboxDraw control successfully added to the map.');
        }
    }

    // ========================================
    // MOD YÖNETİMİ
    // ========================================

    disableMode() {
        if (this.map) {
            if (this.currentClickHandler) {
                this.map.off('click', this.currentClickHandler);
            }
            if (this.currentMoveHandler) {
                this.map.off('mousemove', this.currentMoveHandler);
            }
            if (this.currentContextMenuHandler) {
                this.map.off('contextmenu', this.currentContextMenuHandler);
            }
            if (this.currentDblClickHandler) {
                this.map.off('dblclick', this.currentDblClickHandler);
            }
            this.map.getCanvas().style.cursor = '';
            
            if (this.map.doubleClickZoom) {
                this.map.doubleClickZoom.enable();
            }
        }
        this.drawMode = null;
        this.currentClickHandler = null;
        this.currentMoveHandler = null;
        this.currentContextMenuHandler = null;
        this.currentDblClickHandler = null;
        
        // Çizim noktalarını temizle
        this.clearDrawingVertices();
    }

    // ========================================
    // POLİGON
    // ========================================

    enablePolygonMode(callback, onFinish) {
        this.disableMode();
        this.drawMode = 'polygon';
        
        if (!this.map) return;

        if (this.map.doubleClickZoom) {
            this.map.doubleClickZoom.disable();
        }

        const points = [];
        const polygonId = `polygon-${Date.now()}`;
        let lastClickTime = 0;
        this.drawingVertices = [];

        const clickHandler = (e) => {
            const now = Date.now();
            const timeSinceLastClick = now - lastClickTime;

            // Çift tıklama durumunda ikinci tıklamayı yoksay (dblclick ile sonlandıracağız)
            if (timeSinceLastClick < 300) {
                return;
            }

            lastClickTime = now;

            const coords = [e.lngLat.lng, e.lngLat.lat];
            points.push(coords);

            const vertex = this.createDrawingVertex(coords);
            this.drawingVertices.push(vertex);

            if (points.length >= 3) {
                this.drawPolygon([...points, points[0]], polygonId);
            }
        };

        const moveHandler = (e) => {
            if (points.length >= 1) {
                const previewCoords = [...points, [e.lngLat.lng, e.lngLat.lat]];
                if (previewCoords.length >= 3) {
                    previewCoords.push(previewCoords[0]);
                    this.updatePreviewPolygon(previewCoords, polygonId);
                } else if (previewCoords.length === 2) {
                    this.updatePreviewLine(previewCoords, polygonId);
                }
            }
        };

        const contextMenuHandler = (e) => {
            e.preventDefault();
            const coords = [e.lngLat.lng, e.lngLat.lat];
            const lastPoint = points[points.length - 1];
            if (!lastPoint || lastPoint[0] !== coords[0] || lastPoint[1] !== coords[1]) {
                points.push(coords);
            }

            if (points.length >= 3) {
                this.clearPreviewPolygon(polygonId);
                this.clearPreviewLine(polygonId);
                this.clearDrawingVertices();
                this.finishPolygon(polygonId, points, callback, onFinish);
            }
        };

        const dblClickHandler = (e) => {
            e.preventDefault();
            if (points.length >= 3) {
                this.clearPreviewPolygon(polygonId);
                this.clearPreviewLine(polygonId);
                this.clearDrawingVertices();
                this.finishPolygon(polygonId, points, callback, onFinish);
            }
        };

        this.map.on('click', clickHandler);
        this.map.on('mousemove', moveHandler);
        this.map.on('contextmenu', contextMenuHandler);
        this.map.on('dblclick', dblClickHandler);
        this.map.getCanvas().style.cursor = 'crosshair';
        this.currentClickHandler = clickHandler;
        this.currentMoveHandler = moveHandler;
        this.currentContextMenuHandler = contextMenuHandler;
        this.currentDblClickHandler = dblClickHandler;
    }

    drawPolygon(coords, id) {
        if (!this.map) return;

        this.removeLayerAndSource(id);

        this.map.addSource(id, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [coords]
                }
            }
        });

        this.map.addLayer({
            id: `${id}-layer`,
            type: 'fill',
            source: id,
            paint: {
                'fill-color': '#3b82f6',
                'fill-opacity': 0.15
            }
        });

        this.map.addLayer({
            id: `${id}-outline`,
            type: 'line',
            source: id,
            paint: {
                'line-color': '#3b82f6',
                'line-width': 2
            },
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            }
        });
    }

    finishPolygon(id, points, callback, onFinish) {
        this.drawPolygon([...points, points[0]], id);
        this.disableMode();
        if (onFinish) onFinish();
        
        if (callback) {
            callback({
                type: 'polygon',
                coords: points,
                id: id
            });
        }
    }

    // ========================================
    // ROTA
    // ========================================

    enableRouteMode(callback, onFinish) {
        this.disableMode();
        this.drawMode = 'route';
        
        if (!this.map) return;

        if (this.map.doubleClickZoom) {
            this.map.doubleClickZoom.disable();
        }

        const points = [];
        const routeId = `route-${Date.now()}`;
        let lastClickTime = 0;

        const clickHandler = (e) => {
            const now = Date.now();
            const timeSinceLastClick = now - lastClickTime;

            if (timeSinceLastClick < 300) {
                return;
            }

            lastClickTime = now;

            const coords = [e.lngLat.lng, e.lngLat.lat];
            points.push(coords);

            // Marker ekle (MapMarkers üzerinden)
            if (this.mapMarkers) {
                this.mapMarkers.addMarker(coords, {
                    color: '#f59e0b',
                    popup: `Durak ${points.length}`
                });
            }

            if (points.length >= 2) {
                this.drawRoute(points, routeId);
            }
        };

        const contextMenuHandler = (e) => {
            e.preventDefault();
            const coords = [e.lngLat.lng, e.lngLat.lat];
            const lastPoint = points[points.length - 1];
            if (!lastPoint || lastPoint[0] !== coords[0] || lastPoint[1] !== coords[1]) {
                points.push(coords);
                // Rota için marker ekleme
                if (this.mapMarkers) {
                    this.mapMarkers.addMarker(coords, {
                        color: '#f59e0b',
                        popup: `Durak ${points.length}`
                      });
                }
            }

            if (points.length >= 2) {
                this.finishRoute(routeId, points, callback, onFinish);
            }
        };

        const dblClickHandler = (e) => {
            e.preventDefault();
            if (points.length >= 2) {
                this.finishRoute(routeId, points, callback, onFinish);
            }
        };

        this.map.on('click', clickHandler);
        this.map.on('contextmenu', contextMenuHandler);
        this.map.on('dblclick', dblClickHandler);
        this.map.getCanvas().style.cursor = 'crosshair';
        this.currentClickHandler = clickHandler;
        this.currentContextMenuHandler = contextMenuHandler;
        this.currentDblClickHandler = dblClickHandler;
    }

    drawRoute(coords, id) {
        if (!this.map) return;

        this.removeLayerAndSource(id);

        this.map.addSource(id, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coords
                }
            }
        });

        this.map.addLayer({
            id: `${id}-layer`,
            type: 'line',
            source: id,
            paint: {
                'line-color': '#f59e0b',
                'line-width': 2
            },
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            }
        });
    }

    finishRoute(id, points, callback, onFinish) {
        this.drawRoute(points, id);
        this.disableMode();
        if (onFinish) onFinish();
        
        if (callback) {
            callback({
                type: 'route',
                coords: points,
                id: id
            });
        }
    }

    // ========================================
    // ÇİZGİ
    // ========================================

    enableLineMode(callback, onFinish) {
        this.disableMode();
        this.drawMode = 'line';
        
        if (!this.map) return;

        if (this.map.doubleClickZoom) {
            this.map.doubleClickZoom.disable();
        }

        const points = [];
        const lineId = `line-${Date.now()}`;
        let lastClickTime = 0;
        this.drawingVertices = [];

        const clickHandler = (e) => {
            const now = Date.now();
            
            if (now - lastClickTime < 300) {
                return;
            }
            lastClickTime = now;

            const coords = [e.lngLat.lng, e.lngLat.lat];
            points.push(coords);

            const vertex = this.createDrawingVertex(coords);
            this.drawingVertices.push(vertex);

            if (points.length >= 2) {
                this.drawLine(points, lineId);
            }
        };

        const moveHandler = (e) => {
            if (points.length > 0) {
                const previewCoords = [...points, [e.lngLat.lng, e.lngLat.lat]];
                this.updatePreviewLine(previewCoords, lineId);
            }
        };

        const contextMenuHandler = (e) => {
            e.preventDefault();
            const coords = [e.lngLat.lng, e.lngLat.lat];
            const lastPoint = points[points.length - 1];
            if (!lastPoint || lastPoint[0] !== coords[0] || lastPoint[1] !== coords[1]) {
                points.push(coords);
            }

            if (points.length >= 2) {
                this.clearPreviewLine(lineId);
                this.clearDrawingVertices();
                this.finishLine(lineId, points, callback, onFinish);
            }
        };

        const dblClickHandler = (e) => {
            e.preventDefault();
            if (points.length >= 2) {
                this.clearPreviewLine(lineId);
                this.clearDrawingVertices();
                this.finishLine(lineId, points, callback, onFinish);
            }
        };

        this.map.on('click', clickHandler);
        this.map.on('mousemove', moveHandler);
        this.map.on('contextmenu', contextMenuHandler);
        this.map.on('dblclick', dblClickHandler);
        this.map.getCanvas().style.cursor = 'crosshair';
        this.currentClickHandler = clickHandler;
        this.currentMoveHandler = moveHandler;
        this.currentContextMenuHandler = contextMenuHandler;
        this.currentDblClickHandler = dblClickHandler;
    }

    drawLine(coords, id) {
        if (!this.map) return;

        this.removeLayerAndSource(id);

        this.map.addSource(id, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coords
                }
            }
        });

        this.map.addLayer({
            id: `${id}-layer`,
            type: 'line',
            source: id,
            paint: {
                'line-color': '#3b82f6',
                'line-width': 2.5
            },
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            }
        });
    }

    finishLine(id, points, callback, onFinish) {
        this.drawLine(points, id);
        this.disableMode();
        if (onFinish) onFinish();
        if (callback) {
            callback({ type: 'line', coords: points, id: id });
        }
    }

    // ========================================
    // DİKDÖRTGEN
    // ========================================

    enableRectangleMode(callback, onFinish) {
        this.disableMode();
        this.drawMode = 'rectangle';
        
        if (!this.map) return;

        if (this.map.doubleClickZoom) {
            this.map.doubleClickZoom.disable();
        }

        const corners = [];
        const rectId = `rect-${Date.now()}`;
        this.drawingVertices = [];

        const clickHandler = (e) => {
            const coords = [e.lngLat.lng, e.lngLat.lat];
            corners.push(coords);

            const vertex = this.createDrawingVertex(coords);
            this.drawingVertices.push(vertex);

            if (corners.length === 2) {
                const [c1, c2] = corners;
                const rectCoords = [
                    c1,
                    [c2[0], c1[1]],
                    c2,
                    [c1[0], c2[1]],
                    c1
                ];
                
                this.clearPreviewPolygon(rectId);
                this.clearDrawingVertices();
                this.drawPolygon(rectCoords, rectId);
                this.disableMode();
                if (onFinish) onFinish();
                
                if (callback) {
                    callback({ type: 'rectangle', coords: rectCoords, id: rectId });
                }
            }
        };

        const moveHandler = (e) => {
            if (corners.length === 1) {
                const c1 = corners[0];
                const c2 = [e.lngLat.lng, e.lngLat.lat];
                const previewCoords = [
                    c1,
                    [c2[0], c1[1]],
                    c2,
                    [c1[0], c2[1]],
                    c1
                ];
                this.updatePreviewPolygon(previewCoords, rectId);
            }
        };

        this.map.on('click', clickHandler);
        this.map.on('mousemove', moveHandler);
        this.map.getCanvas().style.cursor = 'crosshair';
        this.currentClickHandler = clickHandler;
        this.currentMoveHandler = moveHandler;
    }

    // ========================================
    // DAİRE
    // ========================================

    enableCircleMode(callback, onFinish) {
        this.disableMode();
        this.drawMode = 'circle';
        
        if (!this.map) return;

        if (this.map.doubleClickZoom) {
            this.map.doubleClickZoom.disable();
        }

        let center = null;
        const circleId = `circle-${Date.now()}`;
        this.drawingVertices = [];

        const clickHandler = (e) => {
            const coords = [e.lngLat.lng, e.lngLat.lat];

            if (!center) {
                center = coords;
                const vertex = this.createDrawingVertex(coords);
                this.drawingVertices.push(vertex);
            } else {
                const radius = MapHelpers.calculateDistance(center, coords);
                const circleCoords = MapHelpers.createCircleCoords(center, radius);
                
                this.clearPreviewPolygon(circleId);
                this.clearDrawingVertices();
                this.drawPolygon(circleCoords, circleId);
                this.disableMode();
                if (onFinish) onFinish();
                
                if (callback) {
                    callback({ type: 'circle', center: center, radius: radius, coords: circleCoords, id: circleId });
                }
            }
        };

        const moveHandler = (e) => {
            if (center) {
                const coords = [e.lngLat.lng, e.lngLat.lat];
                const radius = MapHelpers.calculateDistance(center, coords);
                const circleCoords = MapHelpers.createCircleCoords(center, radius);
                this.updatePreviewPolygon(circleCoords, circleId);
            }
        };

        this.map.on('click', clickHandler);
        this.map.on('mousemove', moveHandler);
        this.map.getCanvas().style.cursor = 'crosshair';
        this.currentClickHandler = clickHandler;
        this.currentMoveHandler = moveHandler;
    }

    // ========================================
    // METİN
    // ========================================

    enableTextMode(callback, onFinish) {
        this.disableMode();
        this.drawMode = 'text';
        
        if (!this.map) return;

        const clickHandler = (e) => {
            const coords = [e.lngLat.lng, e.lngLat.lat];
            this.disableMode();
            if (onFinish) onFinish();
            
            if (callback) {
                callback({ type: 'text', coords: coords });
            }
        };

        this.map.on('click', clickHandler);
        this.map.getCanvas().style.cursor = 'text';
        this.currentClickHandler = clickHandler;
    }

    // ========================================
    // YARDIMCI METODLAR
    // ========================================

    createDrawingVertex(coords) {
        const el = document.createElement('div');
        el.className = 'drawing-vertex';
        el.style.cssText = `
            width: 12px;
            height: 12px;
            background: rgba(59, 130, 246, 0.3);
            border: 2px solid #1e3a5f;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 0 2px rgba(255,255,255,0.5);
        `;
        
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat(coords)
            .addTo(this.map);
        
        return marker;
    }

    clearDrawingVertices() {
        if (this.drawingVertices) {
            this.drawingVertices.forEach(m => m.remove());
        }
        this.drawingVertices = [];
    }

    updatePreviewLine(coords, id) {
        if (!this.map || coords.length < 2) return;

        const sourceId = `${id}-preview`;
        const layerId = `${id}-preview-layer`;

        if (this.map.getSource(sourceId)) {
            this.map.getSource(sourceId).setData({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: coords }
            });
        } else {
            this.map.addSource(sourceId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: coords }
                }
            });

            this.map.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': '#3b82f6',
                    'line-width': 2,
                    'line-dasharray': [3, 3],
                    'line-opacity': 0.7
                }
            });
        }
    }

    clearPreviewLine(id) {
        const sourceId = `${id}-preview`;
        const layerId = `${id}-preview-layer`;
        
        if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
        if (this.map.getSource(sourceId)) this.map.removeSource(sourceId);
    }

    updatePreviewPolygon(coords, id) {
        if (!this.map || coords.length < 3) return;

        const sourceId = `${id}-preview`;
        const layerId = `${id}-preview-layer`;
        const outlineId = `${id}-preview-outline`;

        const data = {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] }
        };

        if (this.map.getSource(sourceId)) {
            this.map.getSource(sourceId).setData(data);
        } else {
            this.map.addSource(sourceId, { type: 'geojson', data });

            this.map.addLayer({
                id: layerId,
                type: 'fill',
                source: sourceId,
                paint: {
                    'fill-color': '#3b82f6',
                    'fill-opacity': 0.1
                }
            });

            this.map.addLayer({
                id: outlineId,
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': '#3b82f6',
                    'line-width': 2,
                    'line-dasharray': [3, 3],
                    'line-opacity': 0.7
                },
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round'
                }
            });
        }
    }

    clearPreviewPolygon(id) {
        const sourceId = `${id}-preview`;
        const layerId = `${id}-preview-layer`;
        const outlineId = `${id}-preview-outline`;
        
        if (this.map.getLayer(outlineId)) this.map.removeLayer(outlineId);
        if (this.map.getLayer(layerId)) this.map.removeLayer(layerId);
        if (this.map.getSource(sourceId)) this.map.removeSource(sourceId);
    }

    removeLayerAndSource(id) {
        if (this.map.getLayer(`${id}-outline`)) this.map.removeLayer(`${id}-outline`);
        if (this.map.getLayer(`${id}-layer`)) this.map.removeLayer(`${id}-layer`);
        if (this.map.getSource(id)) this.map.removeSource(id);
    }

    updateDrawingColor(layerId, color, drawingType) {
        if (!this.map || !layerId) return false;

        try {
            const mainLayerId = `${layerId}-layer`;
            const outlineLayerId = `${layerId}-outline`;

            if (drawingType === 'polygon' || drawingType === 'circle' || drawingType === 'rectangle') {
                if (this.map.getLayer(mainLayerId)) {
                    this.map.setPaintProperty(mainLayerId, 'fill-color', color);
                }
                if (this.map.getLayer(outlineLayerId)) {
                    this.map.setPaintProperty(outlineLayerId, 'line-color', color);
                }
            } else {
                if (this.map.getLayer(mainLayerId)) {
                    this.map.setPaintProperty(mainLayerId, 'line-color', color);
                }
            }
            return true;
        } catch (e) {
            return false;
        }
    }
}
