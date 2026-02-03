import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import { useDataStore } from '@/stores/useDataStore'
import type { FeatureCollection } from 'geojson'

export default function DataLayer() {
    const { items, activeItemId } = useDataStore()

    // Helper to flatten properties and inject consistent style defaults
    const prepareFeatures = (itemType: 'Point' | 'LineString' | 'Polygon') => {
        return items
            .filter(i => i.visible && (i.geometry.type === itemType || i.geometry.type === `Multi${itemType}`))
            .map(i => {
                const style = i.properties.style || {};

                // LEGACY DEFAULTS (Exact match from LayerStylePanel.js)
                // Default Color: #3b82f6 (Blue-500)
                // Default Stroke: #000000 (Black)

                return {
                    type: 'Feature',
                    id: i.id,
                    geometry: i.geometry,
                    properties: {
                        ...i.properties,
                        name: i.name,
                        id: i.id,
                        selected: i.id === activeItemId,
                        // Legacy Style Mapping
                        fillColor: style.fillColor || '#3b82f6',
                        strokeColor: style.strokeColor || '#000000',
                        strokeWidth: style.strokeWidth || 1, // Legacy default is 1
                        opacity: style.opacity !== undefined ? style.opacity : 0.9, // Legacy default opacity is 0.9 (lines/strokes)
                        radius: style.radius || 4, // Legacy default is small (2-4ish)

                        // Calculated Fill Opacity for Polygons (Legacy logic: opacity * 0.3)
                        fillOpacity: (style.opacity !== undefined ? style.opacity : 0.9) * 0.3
                    }
                }
            }) as any
    }

    const pointData = useMemo((): FeatureCollection => ({
        type: 'FeatureCollection',
        features: prepareFeatures('Point')
    }), [items, activeItemId])

    const lineData = useMemo((): FeatureCollection => ({
        type: 'FeatureCollection',
        features: prepareFeatures('LineString')
    }), [items, activeItemId])

    const polygonData = useMemo((): FeatureCollection => ({
        type: 'FeatureCollection',
        features: prepareFeatures('Polygon')
    }), [items, activeItemId])

    return (
        <>
            {/* --- POLYGONS --- */}
            <Source id="data-polygons" type="geojson" data={polygonData}>
                <Layer
                    id="data-layer-polygon-fill"
                    type="fill"
                    paint={{
                        'fill-color': ['case',
                            ['boolean', ['get', 'selected'], false],
                            '#f59e0b', // Amber if selected
                            ['get', 'fillColor']
                        ],
                        'fill-opacity': ['get', 'fillOpacity'] // Uses the * 0.3 logic
                    }}
                />
                <Layer
                    id="data-layer-polygon-outline"
                    type="line"
                    paint={{
                        'line-color': ['case',
                            ['boolean', ['get', 'selected'], false],
                            '#d97706',
                            ['get', 'strokeColor']
                        ],
                        'line-width': ['case',
                            ['boolean', ['get', 'selected'], false],
                            2,
                            ['get', 'strokeWidth']
                        ],
                        'line-opacity': ['get', 'opacity'] // Full opacity for outlines
                    }}
                />
            </Source>

            {/* --- LINES --- */}
            <Source id="data-lines" type="geojson" data={lineData}>
                <Layer
                    id="data-layer-line"
                    type="line"
                    layout={{
                        'line-join': 'round',
                        'line-cap': 'round'
                    }}
                    paint={{
                        'line-color': ['case',
                            ['boolean', ['get', 'selected'], false],
                            '#f59e0b',
                            ['get', 'fillColor'] // Lines usually use 'fillColor' property in this context as main color
                        ],
                        'line-width': ['case',
                            ['boolean', ['get', 'selected'], false],
                            4,
                            2 // Legacy default width for lines
                        ],
                        'line-opacity': ['get', 'opacity']
                    }}
                />
            </Source>

            {/* --- POINTS --- */}
            <Source id="data-points" type="geojson" data={pointData}>
                <Layer
                    id="data-layer-point"
                    type="circle"
                    paint={{
                        'circle-radius': ['get', 'radius'],
                        'circle-color': ['case',
                            ['boolean', ['get', 'selected'], false],
                            '#f59e0b',
                            ['get', 'fillColor']
                        ],
                        'circle-stroke-width': ['get', 'strokeWidth'],
                        'circle-stroke-color': ['get', 'strokeColor'],
                        'circle-opacity': ['get', 'opacity']
                    }}
                />

                {/* Labels for Points - Clean Typography (Legacy style was Noto Sans Regular, Black) */}
                <Layer
                    id="data-layer-point-label"
                    type="symbol"
                    layout={{
                        'text-field': ['get', 'name'],
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], // Keep modern font or switch to Noto if available
                        'text-size': 12,
                        'text-offset': [0, 1.25],
                        'text-anchor': 'top'
                    }}
                    paint={{
                        'text-color': '#000000', // Legacy was Black
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 1
                    }}
                />
            </Source>
        </>
    )
}
