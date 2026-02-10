/**
 * Color Scale Configuration Component
 * Datawrapper-style interface for color interpolation settings
 */

import { useState } from 'react'

import { COLOR_SCHEMES } from '@/constants/colorSchemes'
import type { ColorScheme, InterpolationMethod, ColorScaleType } from '@/types/visualization'
import { INTERPOLATION_INFO } from '@/utils/interpolation'
import { generateColorScale } from '@/utils/colorInterpolation'

interface ConfigProps {
  colorScheme: ColorScheme;
  classCount: number;
  scaleType: ColorScaleType;
  interpolation?: InterpolationMethod;
  onScaleTypeChange?: (type: ColorScaleType) => void;
  onInterpolationChange?: (interpolation: InterpolationMethod) => void;
}

const INTERPOLATION_OPTIONS: Array<{
  value: InterpolationMethod;
  label: string;
  description: string;
}> = [
  {
    value: 'equidistant',
    label: INTERPOLATION_INFO['equidistant'].name,
    description: INTERPOLATION_INFO['equidistant'].description,
  },
  {
    value: 'quantiles-4',
    label: INTERPOLATION_INFO['quantiles-4'].name,
    description: INTERPOLATION_INFO['quantiles-4'].description,
  },
  {
    value: 'quantiles-5',
    label: INTERPOLATION_INFO['quantiles-5'].name,
    description: INTERPOLATION_INFO['quantiles-5'].description,
  },
  {
    value: 'quantiles-10',
    label: INTERPOLATION_INFO['quantiles-10'].name,
    description: INTERPOLATION_INFO['quantiles-10'].description,
  },
  {
    value: 'natural-9',
    label: INTERPOLATION_INFO['natural-9'].name,
    description: INTERPOLATION_INFO['natural-9'].description,
  },
]

export default function Config({
  colorScheme,
  classCount,
  scaleType,
  interpolation = 'equidistant',
  onScaleTypeChange,
  onInterpolationChange,
}: ConfigProps) {
  const [localInterpolation, setLocalInterpolation] = useState<InterpolationMethod>(interpolation)

  // Generate preview colors
  const steppedColors = COLOR_SCHEMES[colorScheme].slice(0, classCount)
  const continuousColors = generateColorScale(COLOR_SCHEMES[colorScheme], 30, 'lab')

  const handleInterpolationChange = (newInterpolation: InterpolationMethod) => {
    setLocalInterpolation(newInterpolation)
    onInterpolationChange?.(newInterpolation)
  }

  return (
    <div className="space-y-2">
      {/* Type Selection - Minimal */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-medium text-zinc-600">Tip</label>
          <button
            className="w-3.5 h-3.5 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-400 text-[9px]"
            title="Basamaklı ölçekler belirgin renk kırılmalarına sahiptir. Sürekli ölçekler yumuşak geçişler içerir."
          >
            ?
          </button>
        </div>

        <div className="space-y-1.5">
          {/* Steps Option */}
          <button
            onClick={() => onScaleTypeChange?.('steps')}
            className={`
              w-full flex items-center gap-2 px-2 py-1.5 rounded border transition-all
              ${
    scaleType === 'steps'
      ? 'border-blue-500 bg-blue-50/20'
      : 'border-zinc-200 hover:border-zinc-300 bg-white'
    }
            `}
          >
            <div
              className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${scaleType === 'steps' ? 'border-blue-500' : 'border-zinc-300'}
              `}
            >
              {scaleType === 'steps' && (
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              )}
            </div>
            <div className="flex-1 flex gap-px h-4 rounded-sm overflow-hidden">
              {steppedColors.map((color, index) => (
                <div
                  key={index}
                  className="flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-[10px] font-medium text-zinc-700">Basamaklı</span>
          </button>

          {/* Continuous Option */}
          <button
            onClick={() => onScaleTypeChange?.('continuous')}
            className={`
              w-full flex items-center gap-2 px-2 py-1.5 rounded border transition-all
              ${
    scaleType === 'continuous'
      ? 'border-blue-500 bg-blue-50/20'
      : 'border-zinc-200 hover:border-zinc-300 bg-white'
    }
            `}
          >
            <div
              className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${scaleType === 'continuous' ? 'border-blue-500' : 'border-zinc-300'}
              `}
            >
              {scaleType === 'continuous' && (
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              )}
            </div>
            <div className="flex-1 flex h-4 rounded-sm overflow-hidden">
              {continuousColors.map((color, index) => (
                <div
                  key={index}
                  className="flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-[10px] font-medium text-zinc-700">Sürekli</span>
          </button>
        </div>
      </div>

      {scaleType === 'continuous' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-zinc-600">İnterpolasyon</label>
            <button
              className="w-3.5 h-3.5 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-400 text-[9px]"
              title="Değerlerin sürekli renk ölçeğine nasıl dağıtılacağı"
            >
              ?
            </button>
          </div>
          <select
            value={localInterpolation}
            onChange={(e) => handleInterpolationChange(e.target.value as InterpolationMethod)}
            className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            {INTERPOLATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-[9px] text-zinc-400 mt-1 leading-relaxed">
            {INTERPOLATION_OPTIONS.find((o) => o.value === localInterpolation)?.description}
          </p>
        </div>
      )}
    </div>
  )
}
