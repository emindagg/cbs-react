import { useMemo } from 'react'

import { buildMoonLitPath, getMoonIlluminationPercent, getMoonPhaseName } from '../utils/moonPhaseVisual'

const MOON_CENTER = 14
const MOON_RADIUS = 12
const MOON_GLOW_ID = 'moonGlowFilter'

interface MoonPhaseDisplayProps {
  phaseAngle: number
}

export function MoonPhaseDisplay({ phaseAngle }: MoonPhaseDisplayProps) {
  const phaseName = useMemo(() => getMoonPhaseName(phaseAngle), [phaseAngle])
  const illuminationPercent = useMemo(() => getMoonIlluminationPercent(phaseAngle), [phaseAngle])
  const litPath = useMemo(() => buildMoonLitPath(phaseAngle), [phaseAngle])

  return (
    <div className="group relative flex w-[38px] shrink-0 flex-col items-center">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-label={phaseName}>
        <defs>
          <filter id={MOON_GLOW_ID} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={MOON_CENTER} cy={MOON_CENTER} r={MOON_RADIUS} fill="#1a1a1a" />
        {litPath && <path d={litPath} fill="#fdfd96" filter={`url(#${MOON_GLOW_ID})`} />}
        <circle cx={MOON_CENTER} cy={MOON_CENTER} r={MOON_RADIUS} fill="none" stroke="#334155" strokeWidth="0.8" />
      </svg>
      <span className="mt-0.5 max-w-[38px] text-center text-[6px] leading-tight font-semibold text-slate-600">
        {phaseName}
      </span>
      <div className="pointer-events-none absolute -top-10 left-1/2 z-20 w-max -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-700 opacity-0 shadow-[0_6px_16px_rgba(15,23,42,0.18)] transition-opacity duration-150 group-hover:opacity-100">
        {phaseName} - %{illuminationPercent}
      </div>
    </div>
  )
}
