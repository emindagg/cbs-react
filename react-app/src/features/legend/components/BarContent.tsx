/**
 * Legend bar content: continuous/stepped, horizontal/vertical
 */

import type { ClassificationMethod, ColorScaleType, LegendConfiguration } from '@/types/visualization'
import { coerceNumberFormat, formatNumber, type NumberFormat } from '@/utils/numberFormatter'

import { disambiguateBoundaryLabels } from '../utils/disambiguateBoundaryLabels'
import { generateContinuousItems, generateSteppedItems, type LegendItem } from '../utils/itemGenerators'

interface BarContentProps {
  config: LegendConfiguration
  breaks: number[]
  colors: string[]
  scaleType: ColorScaleType
  classificationMethod?: ClassificationMethod
  onItemHover: (index: number | null) => void
  hoveredIndex: number | null
}

export function BarContent({
  config,
  breaks,
  colors,
  scaleType,
  classificationMethod,
  onItemHover,
  hoveredIndex,
}: BarContentProps) {
  const configuredFormat = coerceNumberFormat(config.format)

  const formatNumberFn = (value: number, format?: NumberFormat) =>
    formatNumber(value, format ?? configuredFormat)

  const items: LegendItem[] =
    scaleType === 'steps'
      ? generateSteppedItems(config, colors, breaks, formatNumberFn)
      : generateContinuousItems(config, colors, breaks, formatNumberFn)

  const displayItems = config.reverseOrder ? [...items].reverse() : items

  const gradientColors = config.reverseOrder ? [...colors].reverse() : colors
  const gradientString =
    gradientColors.length > 0
      ? `linear-gradient(${config.orientation === 'horizontal' ? 'to right' : 'to bottom'}, ${gradientColors.join(', ')})`
      : 'transparent'

  const verticalBarHeight = `${config.size}px`

  if (scaleType === 'continuous') {
    const continuousValues = config.reverseOrder ? [...breaks].reverse() : breaks
    const continuousLabels = disambiguateBoundaryLabels(
      continuousValues,
      (value) => formatNumber(value, configuredFormat),
      { classificationMethod },
    )
    const continuousItems = displayItems.map((item, index) => ({
      ...item,
      label: continuousLabels[index] ?? item.label,
    }))

    return config.orientation === 'horizontal' ? (
      <div className="space-y-2">
        <div
          className="h-[14px] w-full rounded-none"
          style={{ background: gradientString, boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)' }}
        />
        <div className="flex flex-row justify-between">
          {continuousItems.map((item, index) => (
            <span key={index} className="text-[12px] text-[#333333] font-[450]">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    ) : (
      <div className="flex flex-row items-center gap-2">
        <div
          className="w-[14px] rounded-none"
          style={{ background: gradientString, height: verticalBarHeight, boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)' }}
        />
        <div className="flex flex-col justify-between" style={{ height: verticalBarHeight }}>
          {continuousItems.map((item, index) => (
            <span key={index} className="text-[12px] text-[#333333] font-[450]">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // Stepped
  if (config.orientation === 'vertical') {
    const isRuler = config.labels.type === 'ruler'
    const verticalColors = isRuler
      ? (config.reverseOrder ? [...colors].reverse() : colors)
      : displayItems.map((item) => item.color)
    const stepHeight = Math.max(16, Math.floor(config.size / verticalColors.length))
    const totalHeight = stepHeight * verticalColors.length
    const rawRulerValues = config.reverseOrder ? [...breaks].reverse() : breaks
    const rulerValues = rawRulerValues
    const rulerLabels = isRuler
      ? disambiguateBoundaryLabels(
        rulerValues,
        (value) => formatNumber(value, configuredFormat),
        { classificationMethod },
      )
      : []
    const rulerLabelNodes = rulerLabels.map((label, index) => {
      return (
        <span
          key={index}
          className="text-[12px] text-[#333333] font-[450] whitespace-nowrap leading-none"
          style={{
            position: 'absolute',
            top: `${index * stepHeight}px`,
            transform: 'translateY(-50%)',
          }}
        >
          {label}
        </span>
      )
    })

    return (
      <div className="flex flex-row" style={{ position: 'relative' }}>
        <div className="flex flex-col" style={{ width: '18px', flexShrink: 0 }}>
          {verticalColors.map((color, index) => (
            <div
              key={index}
              className={config.highlightOnHover ? 'cursor-pointer' : ''}
              style={{
                backgroundColor: color,
                height: `${stepHeight}px`,
                width: '100%',
                margin: 0,
                padding: 0,
                lineHeight: 0,
                boxShadow:
                  index < verticalColors.length - 1 ? 'inset 0 -1px 0 rgba(0,0,0,0.08)' : 'none',
              }}
              onMouseEnter={() => onItemHover(index)}
              onMouseLeave={() => onItemHover(null)}
            />
          ))}
        </div>
        <div style={{ position: 'relative', height: `${totalHeight}px`, marginLeft: '6px' }}>
          {isRuler
            ? rulerLabelNodes
            : displayItems.map((item, index) => (
              <span
                key={index}
                className="text-[12px] text-[#333333] font-[450] whitespace-nowrap leading-none"
                style={{
                  position: 'absolute',
                  top: `${index * stepHeight + stepHeight / 2}px`,
                  transform: 'translateY(-50%)',
                }}
              >
                {item.label}
              </span>
            ))}
        </div>
      </div>
    )
  }

  // Stepped horizontal
  return (
    <div className="legend-items flex flex-row gap-1 flex-wrap">
      {displayItems.map((item, index) => (
        <div
          key={index}
          className={`
            legend-item flex items-center gap-2 transition-all
            ${hoveredIndex === index ? 'opacity-100 scale-105' : 'opacity-90'}
            ${config.highlightOnHover ? 'cursor-pointer hover:bg-zinc-50 rounded px-1 -mx-1' : ''}
          `}
          onMouseEnter={() => onItemHover(index)}
          onMouseLeave={() => onItemHover(null)}
        >
          <div
            className="legend-color w-[12px] h-[12px] rounded-none flex-shrink-0"
            style={{ backgroundColor: item.color, border: '1px solid rgba(0, 0, 0, 0.2)' }}
          />
          <span className="legend-label text-[12px] text-[#333333] font-[450] whitespace-nowrap">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
