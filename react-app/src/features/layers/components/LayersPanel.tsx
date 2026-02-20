import { GripVertical, Layers, X } from 'lucide-react'

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
      className="fixed z-10000 w-[256px] max-w-[84vw] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden"
      style={{ left: `calc(${leftPosition} + 46px)`, top: '54px' }}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-300 bg-slate-50">
        <div className="flex items-center gap-2 text-slate-700">
          <Layers size={15} strokeWidth={2} className="text-blue-600" />
          <h2 className="text-[13px] font-semibold">Katman Yöneticisi</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors p-1 rounded"
          title="Kapat"
        >
          <X size={15} strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-col bg-white max-h-[44vh] overflow-auto">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`group flex flex-col px-3 py-2.5 border-b border-slate-200 last:border-0 transition-colors duration-150 ${layer.enabled ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <GripVertical
                  size={14}
                  className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 transition-colors -ml-1 shrink-0"
                />

                <div className="relative shrink-0">
                  <div
                    className={`w-3 h-3 rounded-[2px] border border-black/20 transition-opacity duration-200 ${layer.enabled ? 'opacity-100' : 'opacity-40 grayscale'}`}
                    style={{ backgroundColor: layer.color }}
                  />
                  <input
                    type="color"
                    value={layer.color}
                    onChange={(e) => onColorChange(layer.id, e.target.value)}
                    className="absolute inset-0 w-3 h-3 opacity-0 cursor-pointer"
                    title="Renk"
                  />
                </div>

                <span
                  className={`text-[13px] font-medium truncate transition-colors duration-200 ${layer.enabled ? 'text-slate-800' : 'text-slate-400'}`}
                >
                  {layer.name}
                </span>
                {layer.loading && (
                  <i className="fa-solid fa-spinner fa-spin text-[10px] text-slate-400"></i>
                )}
              </div>
              <button
                type="button"
                onClick={() => onToggleLayer(layer.id, !layer.enabled)}
                disabled={layer.loading}
                className={`relative inline-flex h-[16px] w-[30px] shrink-0 items-center rounded-[10px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-offset-1 ${layer.enabled ? 'bg-zinc-800' : 'bg-slate-300'}`}
                title={layer.enabled ? 'Gizle' : 'Göster'}
              >
                <span className={`inline-block h-[12px] w-[12px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ${layer.enabled ? 'translate-x-[16px]' : 'translate-x-[2px]'}`} />
              </button>
            </div>

            <div className={`flex items-center gap-3 pl-7 pr-1 transition-all duration-200 ${layer.enabled ? 'opacity-100 h-6 mt-1' : 'opacity-0 h-0 overflow-hidden pointer-events-none mt-0'}`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(layer.opacity * 100)}
                  disabled={!layer.enabled}
                  onChange={(e) => onOpacityChange(layer.id, Number(e.target.value) / 100)}
                  className="w-full h-[3px] bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-900"
                  title="Şeffaflık"
                />
                <span className="text-[11px] font-mono font-medium text-slate-500 w-8 text-right tabular-nums">
                  {Math.round(layer.opacity * 100)}%
                </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
