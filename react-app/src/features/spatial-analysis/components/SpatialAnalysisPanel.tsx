import { useCallback } from 'react'

import type { NearestPointsConfig, NearestPointsStats, SpatialAnalysisType, SpatialLayerStyle } from '../types'

interface SpatialAnalysisPanelProps {
  isOpen: boolean
  activeAnalysis: SpatialAnalysisType | null
  convexHullStyle: SpatialLayerStyle
  voronoiStyle: SpatialLayerStyle
  nearestPointsStyle: SpatialLayerStyle
  nearestPointsConfig: NearestPointsConfig
  nearestStats: NearestPointsStats | null
  pointCount: number
  hasData: boolean
  onConvexHullStyleChange: (style: Partial<SpatialLayerStyle>) => void
  onVoronoiStyleChange: (style: Partial<SpatialLayerStyle>) => void
  onNearestPointsStyleChange: (style: Partial<SpatialLayerStyle>) => void
  onNearestPointsConfigChange: (config: Partial<NearestPointsConfig>) => void
  onClose: () => void
  onDeactivate: () => void
}

const FILL_COLORS = [
  { color: '#f97316', label: 'Turuncu' },
  { color: '#ef4444', label: 'Kırmızı' },
  { color: '#3b82f6', label: 'Mavi' },
  { color: '#22c55e', label: 'Yeşil' },
  { color: '#a855f7', label: 'Mor' },
  { color: '#06b6d4', label: 'Cyan' },
  { color: '#eab308', label: 'Sarı' },
  { color: '#ec4899', label: 'Pembe' },
]

export default function SpatialAnalysisPanel({
  isOpen,
  activeAnalysis,
  convexHullStyle,
  voronoiStyle,
  nearestPointsStyle,
  nearestPointsConfig,
  nearestStats,
  pointCount,
  hasData,
  onConvexHullStyleChange,
  onVoronoiStyleChange,
  onNearestPointsStyleChange,
  onNearestPointsConfigChange,
  onClose,
  onDeactivate,
}: SpatialAnalysisPanelProps) {
  const isConvexHull = activeAnalysis === 'convex-hull'
  const isNearest = activeAnalysis === 'nearest-points'
  const style = isConvexHull ? convexHullStyle : isNearest ? nearestPointsStyle : voronoiStyle
  const onStyleChange = isConvexHull ? onConvexHullStyleChange : isNearest ? onNearestPointsStyleChange : onVoronoiStyleChange

  const handleFillOpacity = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onStyleChange({ fillOpacity: Number(e.target.value) })
  }, [onStyleChange])

  const handleStrokeWidth = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onStyleChange({ strokeWidth: Number(e.target.value) })
  }, [onStyleChange])

  if (!isOpen || !activeAnalysis) return null

  const title = isConvexHull
    ? 'Dış Sınır (Convex Hull)'
    : isNearest
      ? 'En Yakın Nokta Analizi'
      : 'En Yakın Alanlar (Voronoi)'
  const icon = isConvexHull ? 'fa-vector-square' : isNearest ? 'fa-arrows-to-dot' : 'fa-border-all'
  const iconColor = isConvexHull ? 'bg-orange-500' : isNearest ? 'bg-violet-500' : 'bg-teal-500'
  const accentColor = isConvexHull
    ? 'ring-orange-400 border-orange-400'
    : isNearest
      ? 'ring-violet-400 border-violet-400'
      : 'ring-teal-400 border-teal-400'
  const minPoints = isConvexHull ? 3 : 2

  return (
    <div className="fixed top-14 right-14 z-1500 w-64 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className={`px-3.5 py-2.5 ${isConvexHull ? 'bg-gradient-to-r from-orange-50 to-amber-50' : isNearest ? 'bg-gradient-to-r from-violet-50 to-purple-50' : 'bg-gradient-to-r from-teal-50 to-cyan-50'} border-b border-zinc-100 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg ${iconColor} flex items-center justify-center`}>
            <i className={`fa-solid ${icon} text-white text-[10px]`}></i>
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-zinc-800">{title}</h3>
            <p className="text-[8px] text-zinc-500">
              {hasData ? `${pointCount} nokta` : 'Veri yok'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
        >
          <i className="fa-solid fa-xmark text-[10px]"></i>
        </button>
      </div>

      {!hasData || pointCount < minPoints ? (
        <div className="px-3.5 py-6 text-center">
          <i className="fa-solid fa-file-import text-zinc-300 text-2xl mb-2"></i>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            {!hasData
              ? <>Analiz için veri içe aktarın<br />veya noktalar ekleyin.</>
              : <>En az {minPoints} nokta gerekli.<br />Şu an {pointCount} nokta var.</>
            }
          </p>
        </div>
      ) : (
        <div className="px-3.5 py-3 space-y-3">
          {/* Fill Color */}
          <div>
            <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Dolgu Rengi
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {FILL_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  onClick={() => onStyleChange({ fillColor: color, strokeColor: color })}
                  className={`w-6 h-6 rounded-md border-2 transition-all ${
                    style.fillColor === color
                      ? `${accentColor} scale-110 shadow-sm`
                      : 'border-zinc-200 hover:border-zinc-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={label}
                />
              ))}
            </div>
          </div>

          {/* Fill Opacity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                Dolgu Opaklık
              </label>
              <span className="text-[9px] text-zinc-600 font-mono bg-zinc-50 px-1.5 py-0.5 rounded">
                {Math.round(style.fillOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={style.fillOpacity}
              onChange={handleFillOpacity}
              className={`w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer ${isConvexHull ? 'accent-orange-500' : isNearest ? 'accent-violet-500' : 'accent-teal-500'}`}
            />
          </div>

          {/* Stroke Width */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                Çizgi Kalınlığı
              </label>
              <span className="text-[9px] text-zinc-600 font-mono bg-zinc-50 px-1.5 py-0.5 rounded">
                {style.strokeWidth.toFixed(1)}px
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={style.strokeWidth}
              onChange={handleStrokeWidth}
              className={`w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer ${isConvexHull ? 'accent-orange-500' : isNearest ? 'accent-violet-500' : 'accent-teal-500'}`}
            />
          </div>

          {/* Nearest Points Toggle Options */}
          {isNearest && (
            <div className="space-y-1.5">
              <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                Gösterim Seçenekleri
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-violet-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={nearestPointsConfig.showShortestOnly}
                  onChange={(e) => onNearestPointsConfigChange({ showShortestOnly: e.target.checked })}
                  className="w-3.5 h-3.5 accent-violet-500 rounded"
                />
                <span className="text-[10px] text-zinc-700">En kısa mesafe çizgisi</span>
                <span className="ml-auto text-[8px] text-red-500 font-medium">kırmızı</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-violet-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={nearestPointsConfig.showAllLines}
                  onChange={(e) => onNearestPointsConfigChange({ showAllLines: e.target.checked })}
                  className="w-3.5 h-3.5 accent-violet-500 rounded"
                />
                <span className="text-[10px] text-zinc-700">Tüm komşu bağlantıları</span>
              </label>
              <label className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-violet-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={nearestPointsConfig.showLabels}
                  onChange={(e) => onNearestPointsConfigChange({ showLabels: e.target.checked })}
                  className="w-3.5 h-3.5 accent-violet-500 rounded"
                />
                <span className="text-[10px] text-zinc-700">Mesafe etiketleri</span>
              </label>
            </div>
          )}

          {/* Nearest Points Stats */}
          {isNearest && nearestStats && (
            <div className="bg-violet-50 rounded-md px-2.5 py-2 space-y-1">
              <div className="flex justify-between text-[9px]">
                <span className="text-violet-600">Toplam çift:</span>
                <span className="font-mono font-bold text-violet-800">{nearestStats.totalPairs}</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-violet-600">En kısa mesafe:</span>
                <span className="font-mono font-bold text-red-600">
                  {nearestStats.shortestDistance < 1
                    ? `${Math.round(nearestStats.shortestDistance * 1000)} m`
                    : `${nearestStats.shortestDistance.toFixed(1)} km`}
                </span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-violet-600">Ortalama mesafe:</span>
                <span className="font-mono font-bold text-violet-800">
                  {nearestStats.averageDistance < 1
                    ? `${Math.round(nearestStats.averageDistance * 1000)} m`
                    : `${nearestStats.averageDistance.toFixed(1)} km`}
                </span>
              </div>
            </div>
          )}

          {/* Info */}
          <div className={`text-[9px] ${isConvexHull ? 'bg-orange-50 text-orange-700' : isNearest ? 'bg-violet-50 text-violet-700' : 'bg-teal-50 text-teal-700'} px-2.5 py-2 rounded-md leading-relaxed`}>
            <i className="fa-solid fa-circle-info mr-1"></i>
            {isConvexHull
              ? 'Tüm noktaları kapsayan en küçük dışbükey çokgen.'
              : isNearest
                ? 'Her noktanın en yakın komşusunu bulur. Kırmızı çizgi en kısa mesafeyi gösterir.'
                : 'Her noktanın kendisine en yakın alanını gösteren bölgeleme.'}
          </div>

          {/* Deactivate Button */}
          <button
            onClick={onDeactivate}
            className={`w-full text-[10px] font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              isConvexHull
                ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                : isNearest
                  ? 'text-violet-600 bg-violet-50 hover:bg-violet-100'
                  : 'text-teal-600 bg-teal-50 hover:bg-teal-100'
            }`}
          >
            <i className="fa-solid fa-power-off text-[9px]"></i>
            Analizi Kapat
          </button>
        </div>
      )}
    </div>
  )
}
