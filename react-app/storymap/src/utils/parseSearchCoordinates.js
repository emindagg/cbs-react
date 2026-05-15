/**
 * Arama kutusu koordinat parser (React geocoder ile aynı mantık).
 * @see src/utils/parseSearchCoordinates.ts
 */

const DECIMAL_COMMA = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/
const DECIMAL_SPACE = /^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/

const DMS_PART =
  /(-?\d+(?:\.\d+)?)\s*[°º˚]\s*(?:(\d+(?:\.\d+)?)\s*['′´]\s*)?(?:(\d+(?:\.\d+)?)\s*["″]\s*)?\s*([NnSsEeWw])?/gi

const SYMBOLLESS_DMS_PART =
  /(-?\d+(?:\.\d+)?)(?:\s+(-?\d+(?:\.\d+)?))?(?:\s+(-?\d+(?:\.\d+)?))?\s+([NnSsEeWw])\b/gi

const DMS_MARKERS = /[°º˚'′´"″]/

function dmsToDecimal(degrees, minutes, seconds, direction) {
  const absDeg = Math.abs(degrees)
  let value = absDeg + minutes / 60 + seconds / 3600
  const dir = direction?.toUpperCase()
  if (dir === 'S' || dir === 'W' || degrees < 0) {
    value = -value
  }
  return value
}

function isTurkeyLat(value) {
  return value >= 35 && value <= 43
}

function isTurkeyLng(value) {
  return value >= 25 && value <= 46
}

export function resolveDecimalOrder(first, second) {
  const absFirst = Math.abs(first)
  const absSecond = Math.abs(second)

  if (absFirst > 90 && absFirst <= 180 && absSecond <= 90) {
    return { lat: second, lng: first }
  }
  if (absFirst <= 90 && absSecond > 90 && absSecond <= 180) {
    return { lat: first, lng: second }
  }
  if (absFirst <= 90 && absSecond <= 90) {
    if (isTurkeyLat(first) && isTurkeyLng(second)) {
      return { lat: first, lng: second }
    }
    if (isTurkeyLng(first) && isTurkeyLat(second)) {
      return { lat: second, lng: first }
    }
  }

  return { lat: first, lng: second }
}

function assignFromDmsMatches(matches) {
  let lat
  let lng
  const undirected = []

  for (const match of matches.slice(0, 2)) {
    const deg = parseFloat(match[1])
    const part2 = match[2] ? parseFloat(match[2]) : 0
    const part3 = match[3] ? parseFloat(match[3]) : 0
    const dir = match[4]?.toUpperCase()

    let minutes = 0
    let seconds = 0
    if (match[3]) {
      minutes = part2
      seconds = part3
    } else if (match[2]) {
      minutes = part2
    }

    const value = dmsToDecimal(deg, minutes, seconds, dir)

    if (dir === 'N' || dir === 'S') {
      lat = value
    } else if (dir === 'E' || dir === 'W') {
      lng = value
    } else {
      undirected.push(value)
    }
  }

  if (lat === undefined && undirected.length > 0) {
    lat = undirected.shift()
  }
  if (lng === undefined && undirected.length > 0) {
    lng = undirected.shift()
  }

  if (lat === undefined || lng === undefined) {
    return null
  }

  return { lat, lng }
}

function parseDmsWithSymbols(query) {
  if (!DMS_MARKERS.test(query)) {
    return null
  }

  const matches = [...query.matchAll(DMS_PART)]
  if (matches.length < 2) {
    return null
  }

  return assignFromDmsMatches(matches)
}

function parseSymbollessDms(query) {
  if (DMS_MARKERS.test(query)) {
    return null
  }
  if (!/[NnSsEeWw]/.test(query)) {
    return null
  }

  const matches = [...query.matchAll(SYMBOLLESS_DMS_PART)]
  if (matches.length < 2) {
    return null
  }

  const hasLatDir = matches.some((m) => /[NnSs]/.test(m[4]))
  const hasLngDir = matches.some((m) => /[EeWw]/.test(m[4]))
  if (!hasLatDir || !hasLngDir) {
    return null
  }

  return assignFromDmsMatches(matches)
}

function parseDecimalPair(query) {
  const commaMatch = query.match(DECIMAL_COMMA)
  if (commaMatch) {
    return resolveDecimalOrder(
      parseFloat(commaMatch[1]),
      parseFloat(commaMatch[2]),
    )
  }

  const spaceMatch = query.match(DECIMAL_SPACE)
  if (spaceMatch) {
    return resolveDecimalOrder(
      parseFloat(spaceMatch[1]),
      parseFloat(spaceMatch[2]),
    )
  }

  return null
}

export function isValidCoordinateRange(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

export function parseSearchCoordinates(query) {
  const trimmed = query.trim()
  if (!trimmed) {
    return null
  }

  const decimal = parseDecimalPair(trimmed)
  if (decimal) {
    return decimal
  }

  const dmsSymbols = parseDmsWithSymbols(trimmed)
  if (dmsSymbols) {
    return dmsSymbols
  }

  return parseSymbollessDms(trimmed)
}
