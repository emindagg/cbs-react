export function buildSunMarkerSvgMarkup(): string {
  return (
    '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-label="Gunes">' +
    '<defs>' +
    '<radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">' +
    '<stop offset="0%" stop-color="#fff59d"/>' +
    '<stop offset="70%" stop-color="#facc15"/>' +
    '<stop offset="100%" stop-color="#f59e0b"/>' +
    '</radialGradient>' +
    '<filter id="sunGlow" x="-80%" y="-80%" width="260%" height="260%">' +
    '<feGaussianBlur stdDeviation="2.1" result="blur"/>' +
    '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
    '</filter>' +
    '</defs>' +
    '<circle cx="14" cy="14" r="10" fill="url(#sunGradient)" filter="url(#sunGlow)"/>' +
    '<circle cx="14" cy="14" r="10" fill="none" stroke="#f59e0b" stroke-width="1.2"/>' +
    '</svg>'
  )
}
