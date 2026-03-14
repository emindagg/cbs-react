import type { JSX } from 'react'

export type NorthArrowStyleId =
  | 'classic-star'
  | 'solid-arrow'
  | 'thin-channel'
  | 'four-dir'
  | 'needle'
  | 'split-label'
  | 'modern-compass'

const FONT = 'system-ui, sans-serif'
const RED = '#c0392b'
const DARK = '#1a1a1a'

export const NORTH_ARROW_STYLES: Record<
  NorthArrowStyleId,
  { label: string; render: () => JSX.Element }
> = {
  'classic-star': {
    label: 'Yön Oku 1',
    render: () => (
      <g>
        {/* North - red */}
        <path d="M 0,-22 L 5,-5 L 0,-9 L -5,-5 Z" fill={RED} />
        {/* South */}
        <path d="M 0,22 L 5,5 L 0,9 L -5,5 Z" fill={DARK} />
        {/* East */}
        <path d="M 22,0 L 5,5 L 9,0 L 5,-5 Z" fill={DARK} />
        {/* West */}
        <path d="M -22,0 L -5,5 L -9,0 L -5,-5 Z" fill={DARK} />
        <circle r="5" fill="white" stroke={DARK} strokeWidth="1.5" />
        <circle r="2" fill={DARK} />
        <text x="0" y="-24" textAnchor="middle" dominantBaseline="auto"
          fontSize="10" fontWeight="700" fontFamily={FONT} fill={RED}>K</text>
      </g>
    ),
  },

  'solid-arrow': {
    label: 'Yön Oku 2',
    render: () => (
      <g>
        <text x="0" y="-23" textAnchor="middle" dominantBaseline="auto"
          fontSize="10" fontWeight="700" fontFamily={FONT} fill={DARK}>K</text>
        {/* Full arrow - red */}
        <path d="M 0,-20 L 20,24 L 0,13 L -20,24 Z" fill={RED} />
        {/* Left half shadow */}
        <path d="M 0,-20 L 0,13 L -20,24 Z" fill="rgba(0,0,0,0.12)" />
      </g>
    ),
  },

  'thin-channel': {
    label: 'Yön Oku 3',
    render: () => (
      <g>
        {/* Outline */}
        <path d="M 0,-20 L 20,24 L 0,16 L -20,24 Z"
          fill="none" stroke={DARK} strokeWidth="2" />
        {/* Right half - red translucent */}
        <path d="M 0,-20 L 0,16 L 20,24 Z" fill={RED} fillOpacity="0.35" />
        {/* Center line - red */}
        <line x1="0" y1="-20" x2="0" y2="16" stroke={RED} strokeWidth="1.5" />
        <text x="0" y="-23" textAnchor="middle" dominantBaseline="auto"
          fontSize="10" fontWeight="700" fontFamily={FONT} fill={DARK}>K</text>
      </g>
    ),
  },

  'four-dir': {
    label: 'Yön Oku 4',
    render: () => (
      <g>
        {/* North - red */}
        <path d="M 0,-22 L 5,0 L 0,-4 L -5,0 Z" fill={RED} />
        {/* South */}
        <path d="M 0,22 L 5,0 L 0,4 L -5,0 Z" fill={DARK} />
        {/* East */}
        <path d="M 22,0 L 0,5 L 4,0 L 0,-5 Z" fill={DARK} />
        {/* West */}
        <path d="M -22,0 L 0,5 L -4,0 L 0,-5 Z" fill={DARK} />
        <circle r="6" fill="white" stroke={DARK} strokeWidth="1.5" />
        <circle r="2" fill={DARK} />
        <text x="0" y="-25" textAnchor="middle" dominantBaseline="auto"
          fontSize="10" fontWeight="700" fontFamily={FONT} fill={RED}>K</text>
        <text x="0" y="29" textAnchor="middle" dominantBaseline="auto"
          fontSize="10" fontWeight="700" fontFamily={FONT} fill={DARK}>G</text>
        <text x="26" y="2.5" textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="700" fontFamily={FONT} fill={DARK}>D</text>
        <text x="-26" y="2.5" textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="700" fontFamily={FONT} fill={DARK}>B</text>
      </g>
    ),
  },

  'needle': {
    label: 'Yön Oku 5',
    render: () => (
      <g>
        {/* Vertical line */}
        <line x1="0" y1="-22" x2="0" y2="22" stroke="#999" strokeWidth="2" />
        {/* Red arrowhead at top */}
        <polygon points="0,-26 5,-13 -5,-13" fill={RED} />
        {/* Center circle */}
        <circle r="5" fill="white" stroke={DARK} strokeWidth="1.5" />
        <circle r="2" fill={RED} />
        <text x="0" y="27" textAnchor="middle" dominantBaseline="auto"
          fontSize="10" fontWeight="700" fontFamily={FONT} fill={DARK}>K</text>
      </g>
    ),
  },

  'split-label': {
    label: 'Yön Oku 6',
    render: () => (
      <g>
        {/* Outer circles */}
        <circle r="25" fill="none" stroke={DARK} strokeWidth="0.5" />
        <circle r="23" fill="none" stroke={DARK} strokeWidth="1.5" strokeDasharray="1,3.5" />

        {/* Main 4-point star */}
        <path d="M 0,-24 L 3.5,-3.5 L 0,0 Z" fill={RED} />
        <path d="M 0,-24 L -3.5,-3.5 L 0,0 Z" fill={DARK} />
        <path d="M 24,0 L 3.5,-3.5 L 0,0 Z" fill={DARK} />
        <path d="M 24,0 L 3.5,3.5 L 0,0 Z" fill={RED} />
        <path d="M 0,24 L 3.5,3.5 L 0,0 Z" fill={DARK} />
        <path d="M 0,24 L -3.5,3.5 L 0,0 Z" fill={RED} />
        <path d="M -24,0 L -3.5,-3.5 L 0,0 Z" fill={RED} />
        <path d="M -24,0 L -3.5,3.5 L 0,0 Z" fill={DARK} />

        {/* Diagonal sub-star points */}
        <g opacity="0.8">
          <path d="M -17,-17 L 0,-3.5 L -3.5,0 Z" fill={DARK} />
          <path d="M 17,-17 L 3.5,0 L 0,-3.5 Z" fill={RED} />
          <path d="M 17,17 L 0,3.5 L 3.5,0 Z" fill={DARK} />
          <path d="M -17,17 L -3.5,0 L 0,3.5 Z" fill={RED} />
        </g>

        {/* Center hub */}
        <circle r="2.5" fill="white" stroke={DARK} strokeWidth="1.5" />

        {/* Direction labels */}
        <text x="0" y="-26" textAnchor="middle" dominantBaseline="auto"
          fontSize="10" fontWeight="900" fontFamily={FONT} fill={RED}>K</text>
        <text x="0" y="29" textAnchor="middle" dominantBaseline="auto"
          fontSize="8" fontWeight="700" fontFamily={FONT} fill={DARK}>G</text>
        <text x="28" y="2" textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fontWeight="700" fontFamily={FONT} fill={DARK}>D</text>
        <text x="-28" y="2" textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fontWeight="700" fontFamily={FONT} fill={DARK}>B</text>
      </g>
    ),
  },

  'modern-compass': {
    label: 'Yön Oku 7',
    render: () => (
      <g>
        {/* Thin circle outline */}
        <circle r="24" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
        {/* Diamond outline */}
        <path d="M 0,-24 L 6,0 L 0,24 L -6,0 Z"
          fill="none" stroke={DARK} strokeWidth="1" />
        {/* Top-right quarter - red */}
        <path d="M 0,-24 L 6,0 L 0,0 Z" fill={RED} />
        <text x="0" y="-7" textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="700" fontFamily={FONT} fill={DARK}>K</text>
      </g>
    ),
  },
}
