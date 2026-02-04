import { useMapStore } from '@/stores/useMapStore'

/**
 * ZoomControls Component
 * +/- zoom buttons
 */
export function ZoomControls() {
  const mapInstance = useMapStore((state) => state.mapInstance)

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn()
  }

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut()
  }

  return (
    <div className="flex flex-col bg-[#1c1c1e] rounded-[18px] overflow-hidden shadow-[0_2px_8px_rgba(34,34,34,0.35)]">
      <button
        type="button"
        id="zoom-in-button"
        onClick={handleZoomIn}
        className="w-9 h-9 text-white hover:bg-white/10 active:bg-white/20 flex items-center justify-center text-[1.1rem] font-medium cursor-pointer border-none bg-transparent"
        aria-label="Yakınlaştır"
      >
        <span aria-hidden="true">+</span>
      </button>
      <div className="h-px bg-white/15 w-full"></div>
      <button
        type="button"
        id="zoom-out-button"
        onClick={handleZoomOut}
        className="w-9 h-9 text-white hover:bg-white/10 active:bg-white/20 flex items-center justify-center text-[1.1rem] font-medium cursor-pointer border-none bg-transparent"
        aria-label="Uzaklaştır"
      >
        <span aria-hidden="true">−</span>
      </button>
    </div>
  )
}

export default ZoomControls
