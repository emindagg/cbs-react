import { useState, useCallback } from 'react'

import { useGlobeView } from '../hooks/useGlobeView'

interface GlobeToggleButtonProps {
  className?: string
  style?: React.CSSProperties
}

/**
 * GlobeToggleButton Component
 * 2D/3D projection toggle button
 */
export function GlobeToggleButton({ className, style }: GlobeToggleButtonProps) {
  const [isGlobeMode, setIsGlobeMode] = useState(false)
  const { toggle } = useGlobeView()

  const handleClick = useCallback(() => {
    toggle()
    setIsGlobeMode(prev => !prev)
  }, [toggle])

  return (
    <button
      id="globe-toggle-btn"
      onClick={handleClick}
      className={`w-9 h-9 bg-[#1c1c1e] rounded-full shadow-[0_2px_8px_rgba(34,34,34,0.35)] border-none flex items-center justify-center text-[#8e8e93] text-xs font-medium hover:text-white active:text-white transition-colors cursor-pointer ${isGlobeMode ? 'ring-2 ring-emerald-400 text-emerald-400 hover:text-emerald-300' : ''} ${className || ''}`}
      style={{
        letterSpacing: '-0.5px',
        ...style,
      }}
      title="Küre Görünümü"
    >
      <span>{isGlobeMode ? '3D' : '2D'}</span>
    </button>
  )
}

export default GlobeToggleButton
