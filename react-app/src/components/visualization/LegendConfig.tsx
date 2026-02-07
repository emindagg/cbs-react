/**
 * Legend Configuration Panel
 * Datawrapper-style legend settings interface
 */

import type { LegendConfiguration, LegendPosition } from '../../types/visualization'
import { FORMAT_OPTIONS } from '../../utils/numberFormatter'

interface LegendConfigProps {
  config: LegendConfiguration;
  onChange: (config: Partial<LegendConfiguration>) => void;
}

const POSITION_OPTIONS: Array<{ value: LegendPosition; label: string }> = [
  { value: 'above', label: 'Üstte' },
  { value: 'below', label: 'Altta' },
  { value: 'inside-left-top', label: 'İçeride Sol Üst' },
  { value: 'inside-center-top', label: 'İçeride Orta Üst' },
  { value: 'inside-right-top', label: 'İçeride Sağ Üst' },
  { value: 'inside-left-bottom', label: 'İçeride Sol Alt' },
  { value: 'inside-center-bottom', label: 'İçeride Orta Alt' },
  { value: 'inside-right-bottom', label: 'İçeride Sağ Alt' },
]

export default function LegendConfig({ config, onChange }: LegendConfigProps) {
  return (
    <div className="space-y-4">
      {/* Show/Hide Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">Lejantı Göster</label>
        <button
          onClick={() => onChange({ visible: !config.visible })}
          className={`
            w-12 h-6 rounded-full transition-all relative
            ${config.visible ? 'bg-blue-500' : 'bg-zinc-300'}
          `}
        >
          <div
            className={`
              w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all
              ${config.visible ? 'left-6' : 'left-0.5'}
            `}
          />
        </button>
      </div>

      {config.visible && (
        <>
          {/* Position */}
          <div>
            <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
              Pozisyon
            </label>
            <select
              value={config.position}
              onChange={(e) => onChange({ position: e.target.value as LegendPosition })}
              className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-zinc-600">Boyut</label>
              <span className="text-[10px] text-zinc-400">{config.size}px</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={50}
                max={300}
                step={10}
                value={config.size}
                onChange={(e) => onChange({ size: Number.parseInt(e.target.value) })}
                className="flex-1"
              />
              <input
                type="number"
                min={50}
                max={300}
                value={config.size}
                onChange={(e) => onChange({ size: Number.parseInt(e.target.value) })}
                className="w-16 px-2 py-1 text-[11px] border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
              Yönlendirme
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ orientation: 'horizontal' })}
                className={`
                  flex-1 px-3 py-2 text-[11px] rounded border transition-all
                  ${
                    config.orientation === 'horizontal'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }
                `}
              >
                Yatay
              </button>
              <button
                onClick={() => onChange({ orientation: 'vertical' })}
                className={`
                  flex-1 px-3 py-2 text-[11px] rounded border transition-all
                  ${
                    config.orientation === 'vertical'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }
                `}
              >
                Dikey
              </button>
            </div>
          </div>

          {/* Label Type - Datawrapper style */}
          <div>
            <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
              Etiket Tipi
            </label>
            <div className="flex gap-2">
              {/* Ruler */}
              <label
                className={`
                  flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] rounded border cursor-pointer transition-all
                  ${
                    config.labels.type === 'ruler'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }
                `}
              >
                <input
                  type="radio"
                  name="labelType"
                  value="ruler"
                  checked={config.labels.type === 'ruler'}
                  onChange={(e) => onChange({ labels: { type: e.target.value as 'ruler' | 'ranges' | 'custom' } })}
                  className="w-3 h-3"
                />
                <span>Cetvel</span>
              </label>

              {/* Ranges */}
              <label
                className={`
                  flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] rounded border cursor-pointer transition-all
                  ${
                    config.labels.type === 'ranges'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }
                `}
              >
                <input
                  type="radio"
                  name="labelType"
                  value="ranges"
                  checked={config.labels.type === 'ranges'}
                  onChange={(e) => onChange({ labels: { type: e.target.value as 'ruler' | 'ranges' | 'custom' } })}
                  className="w-3 h-3"
                />
                <span>Aralıklar</span>
              </label>

              {/* Custom */}
              <label
                className={`
                  flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] rounded border cursor-pointer transition-all
                  ${
                    config.labels.type === 'custom'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }
                `}
              >
                <input
                  type="radio"
                  name="labelType"
                  value="custom"
                  checked={config.labels.type === 'custom'}
                  onChange={(e) => onChange({ labels: { type: e.target.value as 'ruler' | 'ranges' | 'custom' } })}
                  className="w-3 h-3"
                />
                <span>Özel</span>
              </label>
            </div>
            <p className="text-[9px] text-zinc-400 mt-1.5">
              {config.labels.type === 'ruler' && 'Sadece kırılma noktalarını gösterir'}
              {config.labels.type === 'ranges' && 'Değer aralıklarını gösterir (ör. 0-1000)'}
              {config.labels.type === 'custom' && 'Özel etiketler kullanır'}
            </p>
          </div>

          {/* Format */}
          <div>
            <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
              Sayı Formatı
            </label>
            <select
              value={config.format}
              onChange={(e) => onChange({ format: e.target.value })}
              className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.example}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-zinc-600">Başlık</label>
              <input
                type="checkbox"
                checked={config.title?.show || false}
                onChange={(e) =>
                  onChange({
                    title: {
                      show: e.target.checked,
                      text: config.title?.text || '',
                      fontSize: config.title?.fontSize || 16,
                    },
                  })}
                className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
              />
            </div>
            {config.title?.show && (
              <>
                <input
                  type="text"
                  value={config.title.text || ''}
                  onChange={(e) =>
                    onChange({
                      title: {
                        show: true,
                        text: e.target.value,
                        fontSize: config.title.fontSize || 16,
                      },
                    })}
                  placeholder="Lejant başlığı..."
                  className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                />
                
                {/* Font Size Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-medium text-zinc-500">Yazı Boyutu</label>
                    <span className="text-[10px] text-zinc-400">{config.title.fontSize || 16}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={5}
                      max={55}
                      step={1}
                      value={config.title.fontSize || 16}
                      onChange={(e) =>
                        onChange({
                          title: {
                            show: true,
                            text: config.title.text || '',
                            fontSize: Number.parseInt(e.target.value),
                          },
                        })}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min={5}
                      max={55}
                      value={config.title.fontSize || 16}
                      onChange={(e) =>
                        onChange({
                          title: {
                            show: true,
                            text: config.title.text || '',
                            fontSize: Number.parseInt(e.target.value),
                          },
                        })}
                      className="w-14 px-2 py-1 text-[10px] border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Advanced Options */}
          <div className="space-y-2 pt-2 border-t border-zinc-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.highlightOnHover}
                onChange={(e) => onChange({ highlightOnHover: e.target.checked })}
                className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
              />
              <span className="text-[11px] text-zinc-600">
                Hover'da vurgulama aktif et
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.reverseOrder}
                onChange={(e) => onChange({ reverseOrder: e.target.checked })}
                className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
              />
              <span className="text-[11px] text-zinc-600">
                Lejant sırasını tersine çevir
              </span>
            </label>
          </div>
        </>
      )}
    </div>
  )
}
