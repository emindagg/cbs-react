import { useEffect, useRef } from 'react';
import { useAstroStore } from '../stores/useAstroStore';
import { useMapStore } from '@/stores/useMapStore';
import { computeTerminator, getSunDeclination, getSunHourAngle, getAxialTiltLines, getMoonPosition } from '../utils/astroUtils';
import maplibregl from 'maplibre-gl';

export function useAstroMap() {
    const map = useMapStore(state => state.mapInstance);
    const { isEnabled, currentDate, features, isPlaying, speed, setCurrentDate } = useAstroStore();
    const animationFrameRef = useRef<number | null>(null);
    const lastUpdateRef = useRef<number>(Date.now());

    // Initialize Sources and Layers
    useEffect(() => {
        if (!map || !isEnabled) {
            console.log('AstroMap: Skipping setup - map:', !!map, 'isEnabled:', isEnabled);
            return;
        }

        console.log('AstroMap: Initializing layers on map');

        const setupAstroLayers = () => {
            if (!map.getStyle()) {
                console.log('AstroMap: Map style not ready yet');
                return;
            }

            // Terminator Source
            if (!map.getSource('astro-terminator')) {
                console.log('AstroMap: Adding astro-terminator source and layers');
                map.addSource('astro-terminator', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                });

                map.addLayer({
                    id: 'astro-night-shadow',
                    type: 'fill',
                    source: 'astro-terminator',
                    filter: ['==', ['get', 'description'], 'Gece Bölgesi'],
                    paint: {
                        'fill-color': '#000000',
                        'fill-opacity': 0.3
                    }
                });

                map.addLayer({
                    id: 'astro-terminator-line',
                    type: 'line',
                    source: 'astro-terminator',
                    filter: ['==', ['get', 'description'], 'Gece/Gündüz Sınır Çizgisi (Terminator)'],
                    paint: {
                        'line-color': '#FFB700',
                        'line-width': 2,
                        'line-dasharray': [2, 2],
                        'line-opacity': 0.8
                    }
                });
            }

            // Sun Position Source
            if (!map.getSource('astro-sun-position')) {
                console.log('AstroMap: Adding astro-sun-position source and layers');
                map.addSource('astro-sun-position', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                });

                map.addLayer({
                    id: 'astro-sun-marker',
                    type: 'circle',
                    source: 'astro-sun-position',
                    paint: {
                        'circle-radius': 10,
                        'circle-color': '#FFD700',
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#FFA500'
                    }
                });
            }

            // Moon Position Source
            if (!map.getSource('astro-moon-position')) {
                console.log('AstroMap: Adding astro-moon-position source and layers');
                map.addSource('astro-moon-position', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                });

                map.addLayer({
                    id: 'astro-moon-marker',
                    type: 'circle',
                    source: 'astro-moon-position',
                    paint: {
                        'circle-radius': 8,
                        'circle-color': '#e2e8f0',
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#94a3b8'
                    }
                });

                map.addLayer({
                    id: 'astro-moon-label',
                    type: 'symbol',
                    source: 'astro-moon-position',
                    layout: {
                        'text-field': ['get', 'phaseName'],
                        'text-size': 10,
                        'text-offset': [0, 1.5],
                        'text-anchor': 'top'
                    },
                    paint: {
                        'text-color': '#475569',
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 1
                    }
                });
            }

            // Axial Tilt Source
            if (!map.getSource('astro-axial-tilt')) {
                console.log('AstroMap: Adding astro-axial-tilt source and layers');
                map.addSource('astro-axial-tilt', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: getAxialTiltLines()
                    }
                });

                map.addLayer({
                    id: 'astro-axial-line',
                    type: 'line',
                    source: 'astro-axial-tilt',
                    paint: {
                        'line-color': '#10b981',
                        'line-width': 1,
                        'line-dasharray': [4, 1],
                        'line-opacity': 0.6
                    }
                });

                map.addLayer({
                    id: 'astro-axial-label',
                    type: 'symbol',
                    source: 'astro-axial-tilt',
                    layout: {
                        'text-field': ['get', 'name'],
                        'text-size': 10,
                        'text-offset': [0, 1],
                        'text-anchor': 'top',
                        'symbol-placement': 'line-center'
                    },
                    paint: {
                        'text-color': '#10b981',
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 1
                    }
                });
            }
        };

        if (map.isStyleLoaded()) {
            setupAstroLayers();
        } else {
            map.once('style.load', setupAstroLayers);
        }

        return () => {
            console.log('AstroMap: Cleaning up layers');
            const layers = [
                'astro-night-shadow',
                'astro-terminator-line',
                'astro-sun-marker',
                'astro-moon-marker',
                'astro-moon-label',
                'astro-axial-line',
                'astro-axial-label'
            ];
            const sources = ['astro-terminator', 'astro-sun-position', 'astro-moon-position', 'astro-axial-tilt'];

            layers.forEach(id => {
                if (map.getLayer(id)) map.removeLayer(id);
            });
            sources.forEach(id => {
                if (map.getSource(id)) map.removeSource(id);
            });
        };
    }, [map, isEnabled]);

    // Update Visibility
    useEffect(() => {
        if (!map || !isEnabled) return;

        const setVisibility = (layerId: string, visible: boolean) => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
            }
        };

        setVisibility('astro-sun-marker', features.sunPosition);
        setVisibility('astro-night-shadow', features.terminator);
        setVisibility('astro-terminator-line', features.terminator);
        setVisibility('astro-moon-marker', features.moonPhase);
        setVisibility('astro-moon-label', features.moonPhase);
        setVisibility('astro-axial-line', features.axialTilt);
        setVisibility('astro-axial-label', features.axialTilt);
    }, [map, isEnabled, features]);

    // Update Data
    useEffect(() => {
        if (!map || !isEnabled) return;

        // Update Terminator
        const terminatorSource = map.getSource('astro-terminator') as maplibregl.GeoJSONSource;
        if (terminatorSource) {
            const data = computeTerminator(currentDate);
            terminatorSource.setData({
                type: 'FeatureCollection',
                features: [data.line, data.nightPolygon]
            });
        }

        // Update Sun
        const sunSource = map.getSource('astro-sun-position') as maplibregl.GeoJSONSource;
        if (sunSource) {
            const lat = getSunDeclination(currentDate);
            const lon = getSunHourAngle(currentDate);
            sunSource.setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [lon, lat] },
                    properties: { name: 'Güneş' }
                }]
            });
        }

        // Update Moon
        const moonSource = map.getSource('astro-moon-position') as maplibregl.GeoJSONSource;
        if (moonSource) {
            const moonData = getMoonPosition(currentDate);
            const phase = moonData.illumination.phase;
            let phaseName = 'Ay';
            if (phase < 0.05 || phase > 0.95) phaseName = 'Yeni Ay';
            else if (phase < 0.2) phaseName = 'Hilal (Büyüyen)';
            else if (phase < 0.3) phaseName = 'İlk Dördün';
            else if (phase < 0.45) phaseName = 'Şişkin Ay (Büyüyen)';
            else if (phase < 0.55) phaseName = 'Dolunay';
            else if (phase < 0.7) phaseName = 'Şişkin Ay (Küçülen)';
            else if (phase < 0.8) phaseName = 'Son Dördün';
            else phaseName = 'Hilal (Küçülen)';

            moonSource.setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [moonData.lon, moonData.lat] },
                    properties: {
                        name: 'Ay',
                        phase: phase,
                        phaseName: phaseName
                    }
                }]
            });
        }
    }, [map, isEnabled, currentDate]);

    // Animation Loop
    useEffect(() => {
        if (!isPlaying || !isEnabled) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            return;
        }

        const animate = () => {
            const now = Date.now();
            const delta = now - lastUpdateRef.current;
            lastUpdateRef.current = now;

            const timeStep = delta * speed * 60;

            setCurrentDate(new Date(currentDate.getTime() + timeStep));
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, isEnabled, speed, currentDate, setCurrentDate]);

    return null;
}
