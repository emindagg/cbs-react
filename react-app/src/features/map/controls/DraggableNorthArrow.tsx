import { useDraggable } from '@/hooks'
import { NORTH_ARROW_STYLES } from '@/shared/northArrowStyles'
import { useMapStore } from '@/stores/useMapStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'

const DEFAULT_RIGHT_OFFSET = 80
const DEFAULT_BOTTOM_OFFSET = 200

export default function DraggableNorthArrow() {
  const { mapInstance, northArrowVisible, northArrowStyle, northArrowBearing, northArrowSize } = useMapStore()
  const { currentVisualization } = useVisualizationStore()

  const { position, handlers } = useDraggable({
    initial: () => ({
      x: window.innerWidth - DEFAULT_RIGHT_OFFSET,
      y: window.innerHeight - DEFAULT_BOTTOM_OFFSET,
    }),
    width: northArrowSize,
    height: northArrowSize,
    recomputeOnResize: false,
  })

  if (!northArrowVisible || !mapInstance || currentVisualization.type === null) return null

  return (
    <div
      {...handlers}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1300,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        width: northArrowSize,
        height: northArrowSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={northArrowSize}
        height={northArrowSize}
        viewBox="-30 -30 60 60"
        overflow="visible"
        style={{ transform: `rotate(${northArrowBearing}deg)`, transition: 'transform 0.1s ease' }}
      >
        {NORTH_ARROW_STYLES[northArrowStyle].render()}
      </svg>
    </div>
  )
}
