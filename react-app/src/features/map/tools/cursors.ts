/**
 * Shared custom cursor for all drawing/editing tools.
 * #312E81 indigo, NW-pointing professional selection arrow.
 */
export const DRAW_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
    <defs>
      <filter id='shadow' x='-20%' y='-20%' width='160%' height='160%'>
        <feDropShadow dx='0.5' dy='1' stdDeviation='0.5' flood-color='rgba(0,0,0,0.3)'/>
      </filter>
    </defs>
    <path d='M4 3v15l4-4 3 7 1.5-0.7-3-7h6z'
      fill='#312E81'
      stroke='#ffffff'
      stroke-width='1.2'
      stroke-linejoin='round'
      filter='url(#shadow)'/>
  </svg>`,
)}") 4 3, auto`

/**
 * Hover/drag variant: same arrow, brighter #4338CA fill to signal "draggable vertex".
 */
export const DRAG_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
    <defs>
      <filter id='sh' x='-20%' y='-20%' width='160%' height='160%'>
        <feDropShadow dx='0.5' dy='1' stdDeviation='0.8' flood-color='rgba(0,0,0,0.45)'/>
      </filter>
    </defs>
    <path d='M4 3v15l4-4 3 7 1.5-0.7-3-7h6z'
      fill='#4338CA'
      stroke='#ffffff'
      stroke-width='1.2'
      stroke-linejoin='round'
      filter='url(#sh)'/>
  </svg>`,
)}") 4 3, auto`
