import type { Map, GeoJSONSource } from 'maplibre-gl'

const SOURCE_ID = 'isochrone-route-source'
const DEST_SOURCE_ID = 'isochrone-route-dest-source'
const LINE_LAYER_ID = 'isochrone-route-line'
const DEST_LAYER_ID = 'isochrone-route-dest'
const PIN_IMAGE_ID = 'isochrone-dest-pin'

const PIN_SIZE_PX = 48
const PIN_RADIUS_RATIO = 0.28
const PIN_TIP_Y_RATIO = 0.88
const PIN_TOP_Y_RATIO = 0.14
const PIN_CURVE_H_RATIO = 1.05
const PIN_CURVE_V_RATIO = 1.1
const PIN_TEARDROP_RATIO = 2.2
const PIN_INNER_DOT_RATIO = 0.38

/** Draw a teardrop location pin onto a canvas and return ImageData */
function createPinImage(size = PIN_SIZE_PX): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const cx = size / 2
  const r = size * PIN_RADIUS_RATIO        // circle radius
  const tipY = size * PIN_TIP_Y_RATIO     // tip of the pin
  const topY = size * PIN_TOP_Y_RATIO     // top of the circle center

  ctx.clearRect(0, 0, size, size)

  // Shadow
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 2

  // Pin body path: circle top + teardrop bottom
  ctx.beginPath()
  ctx.arc(cx, topY + r, r, Math.PI, 0)  // top semicircle
  ctx.quadraticCurveTo(cx + r, topY + r * PIN_TEARDROP_RATIO, cx, tipY)  // right side to tip
  ctx.quadraticCurveTo(cx - r, topY + r * PIN_TEARDROP_RATIO, cx, tipY)  // left side to tip (already at tip)
  ctx.closePath()

  // Rebuild path cleanly
  ctx.beginPath()
  const pinR = r
  const pinCY = topY + pinR
  // Draw full pin shape
  ctx.moveTo(cx, tipY)
  ctx.quadraticCurveTo(cx - pinR * PIN_CURVE_H_RATIO, pinCY + pinR * PIN_CURVE_V_RATIO, cx - pinR, pinCY)
  ctx.arc(cx, pinCY, pinR, Math.PI, 0)
  ctx.quadraticCurveTo(cx + pinR * PIN_CURVE_H_RATIO, pinCY + pinR * PIN_CURVE_V_RATIO, cx, tipY)
  ctx.closePath()

  ctx.fillStyle = '#2563eb'
  ctx.fill()

  ctx.shadowColor = 'transparent'

  // Inner white dot
  ctx.beginPath()
  ctx.arc(cx, pinCY, pinR * PIN_INNER_DOT_RATIO, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  return ctx.getImageData(0, 0, size, size)
}

export class RouteRenderer {
  private map: Map

  constructor(map: Map) {
    this.map = map
  }

  render(feature: GeoJSON.Feature): void {
    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [feature],
    }

    const coords = (feature.geometry as GeoJSON.LineString).coordinates
    const destCoord = coords[coords.length - 1]
    const destFc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: destCoord },
        properties: {},
      }],
    }

    // Route line
    const existing = this.map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    if (existing) {
      existing.setData(fc)
    } else {
      this.map.addSource(SOURCE_ID, { type: 'geojson', data: fc })
    }

    // Destination point
    const existingDest = this.map.getSource(DEST_SOURCE_ID) as GeoJSONSource | undefined
    if (existingDest) {
      existingDest.setData(destFc)
    } else {
      this.map.addSource(DEST_SOURCE_ID, { type: 'geojson', data: destFc })
    }

    if (!this.map.getLayer(LINE_LAYER_ID)) {
      this.map.addLayer({
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#2563eb',
          'line-width': 4,
          'line-opacity': 0.85,
        },
      })
    }

    // Pin icon layer
    if (!this.map.hasImage(PIN_IMAGE_ID)) {
      const img = createPinImage(PIN_SIZE_PX)
      this.map.addImage(PIN_IMAGE_ID, img, { pixelRatio: 2 })
    }

    if (!this.map.getLayer(DEST_LAYER_ID)) {
      this.map.addLayer({
        id: DEST_LAYER_ID,
        type: 'symbol',
        source: DEST_SOURCE_ID,
        layout: {
          'icon-image': PIN_IMAGE_ID,
          'icon-size': 1,
          'icon-anchor': 'bottom',    // tip of the pin touches the coordinate
          'icon-allow-overlap': true,
        },
      })
    }
  }

  remove(): void {
    if (this.map.getLayer(DEST_LAYER_ID)) this.map.removeLayer(DEST_LAYER_ID)
    if (this.map.getLayer(LINE_LAYER_ID)) this.map.removeLayer(LINE_LAYER_ID)
    if (this.map.getSource(DEST_SOURCE_ID)) this.map.removeSource(DEST_SOURCE_ID)
    if (this.map.getSource(SOURCE_ID)) this.map.removeSource(SOURCE_ID)
    if (this.map.hasImage(PIN_IMAGE_ID)) this.map.removeImage(PIN_IMAGE_ID)
  }
}
