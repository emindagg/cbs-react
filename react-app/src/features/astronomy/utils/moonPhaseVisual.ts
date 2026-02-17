const MOON_RADIUS = 12
const MOON_CENTER = 14
const SAMPLE_STEP = 1
const FULL_CIRCLE_DEG = 360
const PHASE_BOUNDARY_STEP = 45
const NEW_MOON_BOUNDARY = PHASE_BOUNDARY_STEP / 2
const HILAL_BUYUYEN_BOUNDARY = NEW_MOON_BOUNDARY + PHASE_BOUNDARY_STEP
const ILK_DORDUN_BOUNDARY = HILAL_BUYUYEN_BOUNDARY + PHASE_BOUNDARY_STEP
const SISKIN_BUYUYEN_BOUNDARY = ILK_DORDUN_BOUNDARY + PHASE_BOUNDARY_STEP
const DOLUNAY_BOUNDARY = SISKIN_BUYUYEN_BOUNDARY + PHASE_BOUNDARY_STEP
const SISKIN_KUCULEN_BOUNDARY = DOLUNAY_BOUNDARY + PHASE_BOUNDARY_STEP
const SON_DORDUN_BOUNDARY = SISKIN_KUCULEN_BOUNDARY + PHASE_BOUNDARY_STEP
const FINAL_HILAL_BOUNDARY = SON_DORDUN_BOUNDARY + PHASE_BOUNDARY_STEP

export function normalizePhaseAngle(angle: number): number {
  return ((angle % FULL_CIRCLE_DEG) + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG
}

export function getMoonPhaseName(angle: number): string {
  const phase = normalizePhaseAngle(angle)
  if (phase < NEW_MOON_BOUNDARY || phase >= FINAL_HILAL_BOUNDARY) return 'Yeni Ay'
  if (phase < HILAL_BUYUYEN_BOUNDARY) return 'Hilal (Büyüyen)'
  if (phase < ILK_DORDUN_BOUNDARY) return 'İlk Dördün'
  if (phase < SISKIN_BUYUYEN_BOUNDARY) return 'Şişkin Ay (Büyüyen)'
  if (phase < DOLUNAY_BOUNDARY) return 'Dolunay'
  if (phase < SISKIN_KUCULEN_BOUNDARY) return 'Şişkin Ay (Küçülen)'
  if (phase < SON_DORDUN_BOUNDARY) return 'Son Dördün'
  return 'Hilal (Küçülen)'
}

export function getMoonIlluminationPercent(angle: number): number {
  const radians = normalizePhaseAngle(angle) * Math.PI / 180
  const fraction = (1 - Math.cos(radians)) / 2
  return Math.round(fraction * 100)
}

export function buildMoonLitPath(angle: number): string {
  const cycle = normalizePhaseAngle(angle) / FULL_CIRCLE_DEG
  const cosine = Math.cos(cycle * 2 * Math.PI)
  const waxing = cycle <= 0.5

  const terminatorPoints: [number, number][] = []
  const rimPoints: [number, number][] = []

  for (let y = -MOON_RADIUS; y <= MOON_RADIUS; y += SAMPLE_STEP) {
    const rimX = Math.sqrt(Math.max(0, MOON_RADIUS * MOON_RADIUS - y * y))
    const terminatorX = waxing ? cosine * rimX : -cosine * rimX
    const edgeX = waxing ? rimX : -rimX
    terminatorPoints.push([MOON_CENTER + terminatorX, MOON_CENTER + y])
    rimPoints.push([MOON_CENTER + edgeX, MOON_CENTER + y])
  }

  const points = [...terminatorPoints, ...rimPoints.reverse()]
  if (points.length === 0) return ''

  const [firstX, firstY] = points[0]
  const path = points
    .slice(1)
    .map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')

  return `M ${firstX.toFixed(2)} ${firstY.toFixed(2)} ${path} Z`
}

export function buildMoonPhaseSvgMarkup(angle: number): string {
  const litPath = buildMoonLitPath(angle)

  return (
    '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
    '<filter id="moonGlowMarker" x="-60%" y="-60%" width="220%" height="220%">' +
    '<feGaussianBlur stdDeviation="1.2" result="blur"/>' +
    '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
    '</filter>' +
    '</defs>' +
    `<circle cx="${MOON_CENTER}" cy="${MOON_CENTER}" r="${MOON_RADIUS}" fill="#1a1a1a"/>` +
    (litPath ? `<path d="${litPath}" fill="#fdfd96" filter="url(#moonGlowMarker)"/>` : '') +
    `<circle cx="${MOON_CENTER}" cy="${MOON_CENTER}" r="${MOON_RADIUS}" fill="none" stroke="#334155" stroke-width="0.8"/>` +
    '</svg>'
  )
}
