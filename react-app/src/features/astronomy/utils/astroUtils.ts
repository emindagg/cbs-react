import * as Astronomy from 'astronomy-engine'

export interface TerminatorResult {
  line: GeoJSON.Feature<GeoJSON.LineString>;
  nightPolygon: GeoJSON.Feature<GeoJSON.Polygon>;
}

const SUN_RISE_DIRECTION = 1
const SUN_SET_DIRECTION = -1
const SUN_SEARCH_WINDOW_DAYS = 2
const SUN_COORD_DECIMALS = 2
const SUN_ANGLE_DECIMALS = 1

interface SunObserverData {
  altitude: string
  azimuth: string
  sunrise: string
  sunset: string
}

export interface LocalAstronomyData {
  latText: string
  lonText: string
  altitude: string
  azimuth: string
  sunrise: string
  sunset: string
  shadowLength: string
}

/**
 * Calculates sun declination (approximate)
 */
export function getSunDeclination(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
  return 23.44 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81))
}

/**
 * Calculates sub-solar point longitude based on UTC time
 */
export function getSunHourAngle(date: Date): number {
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  return -(hour - 12) * 15
}

function formatUtcTime(date: Date): string {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
}

function formatAngle(value: number): string {
  return `${value.toFixed(SUN_ANGLE_DECIMALS)}°`
}

function formatCoord(value: number): string {
  return value.toFixed(SUN_COORD_DECIMALS)
}

function formatShadowLengthMeters(altitudeDegrees: number): string {
  if (altitudeDegrees <= 0) return '-'
  const rad = altitudeDegrees * Math.PI / 180
  const tanAlt = Math.tan(rad)
  if (tanAlt <= 0) return '-'
  const meters = 1 / tanAlt
  return `${meters.toFixed(2)} m`
}

function getSunObserverData(date: Date, lat: number, lon: number): SunObserverData {
  const observer = new Astronomy.Observer(lat, lon, 0)
  const sunEquator = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true)
  const horizon = Astronomy.Horizon(date, observer, sunEquator.ra, sunEquator.dec, 'normal')
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0))
  const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, SUN_RISE_DIRECTION, dayStart, SUN_SEARCH_WINDOW_DAYS)
  const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, SUN_SET_DIRECTION, dayStart, SUN_SEARCH_WINDOW_DAYS)

  return {
    altitude: formatAngle(horizon.altitude),
    azimuth: formatAngle(horizon.azimuth),
    sunrise: sunrise ? `${formatUtcTime(sunrise.date)} UTC` : '-',
    sunset: sunset ? `${formatUtcTime(sunset.date)} UTC` : '-',
  }
}

export function getSunMarkerData(date: Date) {
  const lat = getSunDeclination(date)
  const lon = getSunHourAngle(date)
  const observerData = getSunObserverData(date, lat, lon)

  return {
    lat,
    lon,
    latText: formatCoord(lat),
    lonText: formatCoord(lon),
    ...observerData,
  }
}

export function getLocalAstronomyData(date: Date, lat: number, lon: number): LocalAstronomyData {
  const observer = new Astronomy.Observer(lat, lon, 0)
  const sunEquator = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true)
  const horizon = Astronomy.Horizon(date, observer, sunEquator.ra, sunEquator.dec, 'normal')
  const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, SUN_RISE_DIRECTION, date, SUN_SEARCH_WINDOW_DAYS)
  const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, SUN_SET_DIRECTION, date, SUN_SEARCH_WINDOW_DAYS)

  return {
    latText: formatCoord(lat),
    lonText: formatCoord(lon),
    altitude: formatAngle(horizon.altitude),
    azimuth: formatAngle(horizon.azimuth),
    sunrise: sunrise ? `${formatUtcTime(sunrise.date)} UTC` : '-',
    sunset: sunset ? `${formatUtcTime(sunset.date)} UTC` : '-',
    shadowLength: formatShadowLengthMeters(horizon.altitude),
  }
}

/**
 * Calculates latitude for a given longitude on the terminator line
 */
function computeTerminatorLatForLongitude(lon: number, subSolarLat: number, subSolarLon: number): number {
  const h_rad = (lon - subSolarLon) * Math.PI / 180
  const delta_rad = subSolarLat * Math.PI / 180
  const tan_delta = Math.tan(delta_rad)

  if (Math.abs(tan_delta) < 0.0001) return 0

  const tan_lat = -Math.cos(h_rad) / tan_delta
  const lat = Math.atan(tan_lat) * 180 / Math.PI

  return Math.max(-90, Math.min(90, lat))
}

/**
 * Computes day/night terminator line and night polygon
 */
export function computeTerminator(date: Date): TerminatorResult {
  const subSolarLat = getSunDeclination(date)
  const subSolarLon = getSunHourAngle(date)

  const coordinates: [number, number][] = []
  const steps = 180

  for (let i = 0; i <= steps; i++) {
    const lon = -180 + (i * 360 / steps)
    const lat = computeTerminatorLatForLongitude(lon, subSolarLat, subSolarLon)
    coordinates.push([lon, lat])
  }

  const line: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coordinates,
    },
    properties: {
      description: 'Gece/Gündüz Sınır Çizgisi (Terminator)',
    },
  }

  const nightPolygonCoords = [...coordinates]
  if (subSolarLat >= 0) {
    nightPolygonCoords.push([180, -90])
    nightPolygonCoords.push([-180, -90])
  } else {
    nightPolygonCoords.push([180, 90])
    nightPolygonCoords.push([-180, 90])
  }
  nightPolygonCoords.push(nightPolygonCoords[0])

  const nightPolygon: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [nightPolygonCoords],
    },
    properties: {
      description: 'Gece Bölgesi',
    },
  }

  return { line, nightPolygon }
}

/**
 * Get Moon Phase Position and Info
 */
export function getMoonPosition(date: Date) {
  const observer = new Astronomy.Observer(0, 0, 0)
  const equat = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, true)
  const phaseDegrees = Astronomy.MoonPhase(date)
  const illumination = Astronomy.Illumination(Astronomy.Body.Moon, date)

  // Convert Right Ascension to Longitude: lon = RA - GST
  // This is still a simplified placeholder conversion, 
  // real sub-lunar point needs sidereal time.
  return {
    lat: equat.dec,
    lon: equat.ra * 15 - 180,
    illumination: {
      // 0..1 cycle where 0/1=new, 0.25=first quarter, 0.5=full, 0.75=last quarter
      phase: phaseDegrees / 360,
      fraction: illumination.phase_fraction,
    },
  }
}

/**
 * Get moon phase angle in degrees (0-360)
 */
export function getMoonPhaseAngle(date: Date): number {
  const angle = Astronomy.MoonPhase(date)
  return ((angle % 360) + 360) % 360
}

/**
 * Get Axial Tilt Lines (Equator, Tropics, Polar Circles)
 */
export function getAxialTiltLines() {
  const AXIAL_TILT = 23.44
  const TROPIC_OF_CANCER = AXIAL_TILT
  const TROPIC_OF_CAPRICORN = -AXIAL_TILT
  const ARCTIC_CIRCLE = 90 - AXIAL_TILT
  const ANTARCTIC_CIRCLE = -(90 - AXIAL_TILT)

  const createLine = (lat: number, name: string) => ({
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: Array.from({ length: 361 }, (_, i) => [-180 + i, lat]),
    },
    properties: { name, latitude: lat },
  })

  return [
    createLine(0, 'Ekvator'),
    createLine(TROPIC_OF_CANCER, 'Yengeç Dönencesi'),
    createLine(TROPIC_OF_CAPRICORN, 'Oğlak Dönencesi'),
    createLine(ARCTIC_CIRCLE, 'Kuzey Kutup Dairesi'),
    createLine(ANTARCTIC_CIRCLE, 'Güney Kutup Dairesi'),
  ]
}

/**
 * Get Season based on sun declination
 */
export function getSeason(date: Date) {
  const declination = getSunDeclination(date)
  if (declination > 20) return { name: 'Yaz', icon: 'fa-sun' }
  if (declination < -20) return { name: 'Kış', icon: 'fa-snowflake' }
  if (declination > 0) return { name: 'İlkbahar', icon: 'fa-leaf' }
  return { name: 'Sonbahar', icon: 'fa-canadian-maple-leaf' }
}
