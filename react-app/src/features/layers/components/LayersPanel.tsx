interface LayerItem {
  id: string
  name: string
  color: string
  opacity: number
  enabled: boolean
  loading: boolean
}

interface LayersPanelProps {
  isOpen: boolean
  leftPosition: string
  layers: LayerItem[]
  onClose: () => void
  onToggleLayer: (layerId: string, enabled: boolean) => void
  onOpacityChange: (layerId: string, opacity: number) => void
  onColorChange: (layerId: string, color: string) => void
}

export function LayersPanel({
  isOpen,
  leftPosition,
  layers,
  onClose,
  onToggleLayer,
  onOpacityChange,
  onColorChange,
}: LayersPanelProps) {
  if (!isOpen) return null

  return (
    <div
      id="layers-panel"
      className="fixed z-10000 w-[248px] max-w-[88vw] bg-white rounded-lg shadow-[0_10px_26px_rgba(0,0,0,0.14)] border border-zinc-200 overflow-hidden"
      style={{ left: `calc(${leftPosition} + 46px)`, top: '54px' }}
    >
      <div className="px-2.5 py-2 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
        <h2 className="text-[13px] font-semibold tracking-tight text-zinc-900">Katmanlar</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/70 transition-colors"
          title="Kapat"
        >
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <div className="max-h-[42vh] overflow-auto">
        {layers.map((layer) => (
          <div key={layer.id} className="px-2.5 py-2 border-b border-zinc-100 last:border-b-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="color"
                  value={layer.color}
                  onChange={(e) => onColorChange(layer.id, e.target.value)}
                  className="w-4 h-4 p-0 border border-zinc-300 rounded-[4px] shrink-0"
                  title="Renk"
                />
                <span className="text-[11px] font-medium text-zinc-800 truncate">{layer.name}</span>
                {layer.loading && (
                  <i className="fa-solid fa-spinner fa-spin text-[10px] text-zinc-400"></i>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={layer.enabled}
                  disabled={layer.loading}
                  onChange={(e) => onToggleLayer(layer.id, e.target.checked)}
                />
                <span className="w-9 h-5 bg-zinc-300 rounded-full peer-checked:bg-zinc-900 transition-colors"></span>
                <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.18)] peer-checked:translate-x-4 transition-transform"></span>
              </label>
            </div>

            <div className={`mt-1.5 ${layer.enabled ? 'opacity-100' : 'opacity-45'} transition-opacity`}>
              <div className="flex items-center gap-1.5 pl-5">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(layer.opacity * 100)}
                  disabled={!layer.enabled}
                  onChange={(e) => onOpacityChange(layer.id, Number(e.target.value) / 100)}
                  className="w-full accent-zinc-900 h-1.5"
                />
                <span className="w-8 text-right text-[10px] font-medium text-zinc-600 tabular-nums">
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
