/**
 * Color Scheme Preview Component
 * Shows a preview of the selected color scheme
 */

import { COLOR_SCHEMES } from '../../constants/colorSchemes'
import type { ColorScheme } from '../../types/visualization'


interface ColorSchemePreviewProps {
  colorScheme: ColorScheme;
}

export default function ColorSchemePreview({ colorScheme }: ColorSchemePreviewProps) {
  const colors = COLOR_SCHEMES[colorScheme]

  return (
    <div className="mt-1.5 rounded-sm overflow-hidden shadow-xs">
      <div
        className="h-4"
        style={{
          background: `linear-gradient(to right, ${colors.join(', ')})`,
        }}
      ></div>
    </div>
  )
}
