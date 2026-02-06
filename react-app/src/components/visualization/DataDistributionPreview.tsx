/**
 * Data Distribution Preview Component
 * Shows how data will be classified with histogram and color mapping
 * Inspired by Datawrapper's data preview
 */

import { useMemo } from 'react'

import { getColorPalette } from '../../constants/colorSchemes'
import type { ColorScheme, ClassificationMethod } from '../../types/visualization'
import { calculateBreaks, calculateDataStats } from '../../utils/classificationMethods'

interface DataDistributionPreviewProps {
  values: number[];
  colorScheme: ColorScheme;
  classCount: number;
  classificationMethod: ClassificationMethod;
}

export default function DataDistributionPreview({
  values,
  colorScheme,
  classCount,
  classificationMethod,
}: DataDistributionPreviewProps) {
  const stats = useMemo(() => calculateDataStats(values), [values])
  const breaks = useMemo(
    () => calculateBreaks(values, classificationMethod, classCount),
    [values, classificationMethod, classCount],
  )
  const colors = useMemo(() => getColorPalette(colorScheme, classCount), [colorScheme, classCount])

  // Calculate histogram bins
  const histogram = useMemo(() => {
    if (breaks.length < 2) return []

    const bins = breaks.slice(0, -1).map((min, index) => {
      const max = breaks[index + 1]
      const count = values.filter((v) => v >= min && v <= max).length
      return { min, max, count, color: colors[index] }
    })

    return bins
  }, [breaks, values, colors])

  const maxCount = Math.max(...histogram.map((h) => h.count), 1)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(0)
  }

  return (
    <div className="space-y-2">
      {/* Statistics Overview */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-md p-2">
        <div className="text-[10px] font-medium text-zinc-600 mb-1.5">Veri İstatistikleri</div>
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div>
            <div className="text-zinc-400">Min</div>
            <div className="font-semibold text-zinc-700">{formatNumber(stats.min)}</div>
          </div>
          <div>
            <div className="text-zinc-400">Max</div>
            <div className="font-semibold text-zinc-700">{formatNumber(stats.max)}</div>
          </div>
          <div>
            <div className="text-zinc-400">Ortalama</div>
            <div className="font-semibold text-zinc-700">{formatNumber(stats.mean)}</div>
          </div>
          <div>
            <div className="text-zinc-400">Medyan</div>
            <div className="font-semibold text-zinc-700">{formatNumber(stats.median)}</div>
          </div>
        </div>

        {/* CV and Skewness Warning */}
        {(stats.cv > 50 || Math.abs(stats.skewness) > 0.3) && (
          <div className="mt-2 pt-2 border-t border-zinc-200">
            <div className="flex items-start gap-1">
              <i className="fa-solid fa-triangle-exclamation text-amber-600 text-[9px] mt-0.5"></i>
              <div className="flex-1">
                <p className="text-[8px] text-amber-700 leading-relaxed">
                  {stats.cv > 50 && `Yüksek varyasyon (CV: ${stats.cv.toFixed(1)}%). `}
                  {Math.abs(stats.skewness) > 0.3 && 'Veri çarpık dağılımlı. '}
                  {stats.hasOutliers && 'Uç değerler mevcut.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Histogram with Colors */}
      <div className="bg-white border border-zinc-200 rounded-md p-2">
        <div className="text-[10px] font-medium text-zinc-600 mb-2">Veri Dağılımı</div>

        {/* Histogram bars */}
        <div className="space-y-1">
          {histogram.map((bin, index) => {
            const heightPercent = (bin.count / maxCount) * 100

            return (
              <div key={index} className="flex items-center gap-1.5">
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: bin.color }}
                />

                {/* Bar */}
                <div className="flex-1 relative h-5 bg-zinc-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all duration-300"
                    style={{
                      width: `${heightPercent}%`,
                      backgroundColor: bin.color,
                      opacity: 0.7,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-1.5">
                    <span className="text-[8px] font-medium text-zinc-700">
                      {formatNumber(bin.min)} - {formatNumber(bin.max)}
                    </span>
                    <span className="text-[8px] font-semibold text-zinc-700">{bin.count}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-2 pt-2 border-t border-zinc-200">
          <div className="text-[8px] text-zinc-500 leading-relaxed">
            Her çubuk bir renk sınıfını temsil eder. Çubuk uzunluğu o aralıktaki veri sayısını
            gösterir.
          </div>
        </div>
      </div>

      {/* Method Explanation */}
      <div className="bg-blue-50/50 border border-blue-200 rounded-md p-2">
        <div className="flex gap-1.5">
          <i className="fa-solid fa-lightbulb text-blue-600 text-[9px] mt-0.5"></i>
          <div className="flex-1">
            <p className="text-[8px] text-blue-700 leading-relaxed">
              {classificationMethod === 'quantile' &&
                'Quantile: Her renk sınıfında yaklaşık eşit sayıda veri noktası vardır.'}
              {classificationMethod === 'equal' &&
                'Eşit Aralık: Değer aralığı eşit genişlikte sınıflara bölünür.'}
              {classificationMethod === 'jenks' &&
                'Jenks: Verideki doğal grupları ve kırılma noktalarını bulur.'}
              {classificationMethod === 'rounded-sm' &&
                'Yuvarlanmış: Okunması kolay yuvarlak sayılar kullanır.'}
              {classificationMethod === 'logarithmic' &&
                'Logaritmik: Üstel dağılımlı verilerde küçük değerleri daha iyi gösterir.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
