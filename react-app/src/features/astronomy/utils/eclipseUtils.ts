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

function formatPeakDate(date: Date): string {
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  })
}

function formatPeakTime(date: Date): string {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
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
      const peakDate = globalSolar.peak.date
      features.push(buildFeature(globalSolar.longitude, globalSolar.latitude, {
        label: 'Global Güneş Tutulması',
        eventType: 'solar-global',
        type: 'Güneş Tutulması (Global)',
        kind: globalSolar.kind,
        peakUtc: toIsoString(globalSolar.peak.date),
        date: formatPeakDate(peakDate),
        time: `${formatPeakTime(peakDate)} UTC`,
        magnitude: formatObscuration(globalSolar.obscuration),
        description: 'Dünya genelinde izlenebilen bir sonraki güneş tutulması.',
      }))
    }

    const localPeakDate = localSolar.peak.time.date
    features.push(buildFeature(TURKEY_OBSERVER_LON, TURKEY_OBSERVER_LAT, {
      label: 'Türkiye Güneş Tutulması',
      eventType: 'solar-local',
      type: 'Güneş Tutulması (Türkiye)',
      kind: localSolar.kind,
      peakUtc: toIsoString(localSolar.peak.time.date),
      date: formatPeakDate(localPeakDate),
      time: `${formatPeakTime(localPeakDate)} UTC`,
      magnitude: formatObscuration(localSolar.obscuration),
      description: 'Türkiye merkezli gözlem noktası için hesaplanan tutulma olayı.',
    }))

    const lunarPeakDate = lunar.peak.date
    features.push(buildFeature(TURKEY_OBSERVER_LON + LUNAR_MARKER_OFFSET_LON, TURKEY_OBSERVER_LAT, {
      label: 'Sonraki Ay Tutulması',
      eventType: 'lunar',
      type: 'Ay Tutulması',
      kind: lunar.kind,
      peakUtc: toIsoString(lunar.peak.date),
      date: formatPeakDate(lunarPeakDate),
      time: `${formatPeakTime(lunarPeakDate)} UTC`,
      magnitude: formatObscuration(lunar.obscuration),
      description: 'Bir sonraki ay tutulmasının tepe zamanı ve türü.',
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
