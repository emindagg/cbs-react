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
                return {
                    type: 'Feature',
                    id: i.id,
                    geometry: i.geometry,
                    properties: {
                        ...i.properties,
                        name: i.name,
                        id: i.id,
                        selected: i.id === activeItemId,
                        // Flattened Styled Props with Professional Defaults (OneSoil-ish)
                        fillColor: style.fillColor || '#4ade80', // Bright Green default
                        strokeColor: style.strokeColor || '#ffffff', // White stroke default
                        strokeWidth: style.strokeWidth || 2,
                        opacity: style.opacity !== undefined ? style.opacity : 0.4,
                        radius: style.radius || 6
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
                            '#fbbf24', // Amber-400 for selected
                            ['get', 'fillColor'] // Dynamic fill color
                        ],
                        'fill-opacity': ['get', 'opacity']
                    }}
                />
                <Layer
                    id="data-layer-polygon-outline"
                    type="line"
                    paint={{
                        'line-color': ['case',
                            ['boolean', ['get', 'selected'], false],
                            '#ffffff',
                            ['get', 'strokeColor']
                        ],
                        'line-width': ['case',
                            ['boolean', ['get', 'selected'], false],
                            3,
                            ['get', 'strokeWidth']
                        ]
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
                            '#fbbf24',
                            ['get', 'strokeColor'] // Re-use strokeColor for lines (default white/custom)
                        ],
                        'line-width': ['case',
                            ['boolean', ['get', 'selected'], false],
                            4,
                            ['get', 'strokeWidth']
                        ]
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
                            '#fbbf24',
                            ['get', 'fillColor'] // Re-use fillColor for points
                        ],
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff'
                    }}
                />

                {/* Labels for Points - Clean Professional Typography */}
                <Layer
                    id="data-layer-point-label"
                    type="symbol"
                    layout={{
                        'text-field': ['get', 'name'],
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                        'text-size': 11,
                        'text-offset': [0, 1.5],
                        'text-anchor': 'top',
                        'text-transform': 'uppercase',
                        'text-letter-spacing': 0.05
                    }}
                    paint={{
                        'text-color': '#ffffff',
                        'text-halo-color': '#000000',
                        'text-halo-width': 2,
                        'text-halo-blur': 0.5
                    }}
                />
            </Source>
        </>
    )
}
