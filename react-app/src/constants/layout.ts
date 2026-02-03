/**
 * Layout Constants
 * Centralized layout configuration for consistent UI
 */
export const LAYOUT = {
  /** Sidebar width in pixels (matches md:w-72) */
  SIDEBAR_WIDTH: 288,

  /** Hamburger button width + gap */
  HAMBURGER_OFFSET: 48,

  /** Base left offset for controls */
  BASE_OFFSET: 9.6,

  /** Sidebar animation duration in ms */
  ANIMATION_DURATION: 300,

  /** Gap between sidebar and controls */
  SIDEBAR_GAP: 16,
} as const

/** Tailwind breakpoint for medium screens */
export const BREAKPOINTS = {
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const
