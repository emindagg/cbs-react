/**
 * Datawrapper-Style Configuration Panel
 * Complete panel integrating color scale, interpolation, custom range, and legend
 */

import { LegendConfig } from '@/shared/legend'
import { useVisualizationStore } from '@/stores/useVisualizationStore'

import { ColorScaleConfig } from './ColorScale'
import { CustomRangeConfig } from './CustomRange'


interface StyleConfigProps {
  dataValues?: number[];
}

export default function StyleConfig({ dataValues = [] }: StyleConfigProps) {
  const { colorConfig, setColorConfig, setLegendConfig, setCustomRange, vizSettings } =
    useVisualizationStore()

  const autoMin = dataValues.length > 0 ? Math.min(...dataValues) : 0
  const autoMax = dataValues.length > 0 ? Math.max(...dataValues) : 100

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg border border-zinc-200">
      <div className="border-b border-zinc-200 pb-3">
        <h3 className="text-sm font-semibold text-zinc-800">Renk ve Lejant Ayarları</h3>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          Datawrapper tarzı gelişmiş renk interpolasyonu ve lejant ayarları
        </p>
      </div>

      <div>
        <h4 className="text-xs font-medium text-zinc-700 mb-2">Renk Skalası</h4>
        <ColorScaleConfig
          colorScheme={vizSettings.colorScheme}
          classCount={vizSettings.classCount}
          scaleType={colorConfig.scaleType}
          interpolation={colorConfig.interpolation}
          onScaleTypeChange={(scaleType) => setColorConfig({ scaleType })}
          onInterpolationChange={(interpolation) => setColorConfig({ interpolation })}
        />
      </div>

      {colorConfig.scaleType === 'continuous' && (
        <div>
          <h4 className="text-xs font-medium text-zinc-700 mb-2">Değer Aralığı</h4>
          <CustomRangeConfig
            customRange={colorConfig.customRange!}
            autoMin={autoMin}
            autoMax={autoMax}
            onChange={(range) => setCustomRange(range)}
          />
        </div>
      )}

      <div>
        <h4 className="text-xs font-medium text-zinc-700 mb-2">Lejant</h4>
        <LegendConfig config={colorConfig.legend} onChange={(config) => setLegendConfig(config)} classCount={vizSettings.classCount} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <div className="text-blue-600 text-sm flex-shrink-0">ℹ️</div>
          <div className="text-[10px] text-blue-700 leading-relaxed">
            <strong>Datawrapper Özellikleri:</strong>
            <ul className="mt-1 space-y-0.5 ml-3">
              <li>• <strong>Basamaklı:</strong> Belirgin renk kırılmaları</li>
              <li>• <strong>Sürekli:</strong> Yumuşak geçişli renk gradyanları</li>
              <li>• <strong>İnterpolasyon:</strong> Değerlerin renklere dağılım şekli</li>
              <li>• <strong>Özel Aralık:</strong> Farklı haritaları karşılaştırmak için tutarlı renklendirme</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
