import * as Astronomy from 'astronomy-engine'

const TURKEY_OBSERVER_LAT = 39
const TURKEY_OBSERVER_LON = 35
const TURKEY_OBSERVER_HEIGHT = 0
const LUNAR_MARKER_OFFSET_LON = 0.8

const eclipseObserver = new Astronomy.Observer(
  TURKEY_OBSERVER_LAT,
  TURKEY_OBSERVER_LON,
  TURKEY_OBSERVER_HEIGHT,
)

let cachedBucket = ''
let cachedCollection: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: 'FeatureCollection',
  features: [],
}

function toBucket(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toIsoString(date: Date): string {
  return date.toISOString().replace('.000Z', 'Z')
}

function formatObscuration(value: number | undefined): string {
  if (typeof value !== 'number') return '-'
  return `${(value * 100).toFixed(1)}%`
}

function buildFeature(
  lon: number,
  lat: number,
  properties: Record<string, string>,
): GeoJSON.Feature<GeoJSON.Point> {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lon, lat],
    },
    properties,
  }
}

export function getEclipseAnalysisCollection(currentDate: Date): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const bucket = toBucket(currentDate)
  if (bucket === cachedBucket) {
    return cachedCollection
  }

  const features: GeoJSON.Feature<GeoJSON.Point>[] = []
  try {
    const globalSolar = Astronomy.SearchGlobalSolarEclipse(currentDate)
    const localSolar = Astronomy.SearchLocalSolarEclipse(currentDate, eclipseObserver)
    const lunar = Astronomy.SearchLunarEclipse(currentDate)

    if (typeof globalSolar.latitude === 'number' && typeof globalSolar.longitude === 'number') {
      features.push(buildFeature(globalSolar.longitude, globalSolar.latitude, {
        label: 'Global Güneş Tutulması',
        eventType: 'solar-global',
        kind: globalSolar.kind,
        peakUtc: toIsoString(globalSolar.peak.date),
        obscuration: formatObscuration(globalSolar.obscuration),
      }))
    }

    features.push(buildFeature(TURKEY_OBSERVER_LON, TURKEY_OBSERVER_LAT, {
      label: 'Türkiye Güneş Tutulması',
      eventType: 'solar-local',
      kind: localSolar.kind,
      peakUtc: toIsoString(localSolar.peak.time.date),
      obscuration: formatObscuration(localSolar.obscuration),
    }))

    features.push(buildFeature(TURKEY_OBSERVER_LON + LUNAR_MARKER_OFFSET_LON, TURKEY_OBSERVER_LAT, {
      label: 'Sonraki Ay Tutulması',
      eventType: 'lunar',
      kind: lunar.kind,
      peakUtc: toIsoString(lunar.peak.date),
      obscuration: formatObscuration(lunar.obscuration),
    }))
  } catch {
    // Eclipse search can fail in edge cases; return what we have instead of breaking the map updates.
  }

  cachedBucket = bucket
  cachedCollection = {
    type: 'FeatureCollection',
    features,
  }

  return cachedCollection
}
