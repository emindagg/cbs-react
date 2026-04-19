/// <reference lib="webworker" />
import type { InterpolationWorkerInput, InterpolationWorkerOutput } from '../types'
import { interpolateIDW } from './idwInterpolator'
import { interpolateKriging } from './krigingInterpolator'
import { interpolateIDWRaster, interpolateKrigingRaster } from './rasterInterpolator'

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope

ctx.onmessage = (e: MessageEvent<InterpolationWorkerInput>) => {
  const { points, config } = e.data

  if (!points || !points.features || points.features.length === 0) {
    const out: InterpolationWorkerOutput = { error: 'Geçerli nokta bulunamadı' }
    ctx.postMessage(out)
    return
  }

  try {
    if (config.gridType === 'smooth') {
      // Pürüzsüz raster modu — sadece sayısal değerler döndürülür, renk uygulaması
      // main thread'de canvas üzerinden yapılır.
      const rasterResult = config.method === 'kriging'
        ? interpolateKrigingRaster(points, config)
        : interpolateIDWRaster(points, config)

      const out: InterpolationWorkerOutput = {
        result: {
          grid: null,
          raster: rasterResult.raster,
          min: rasterResult.min,
          max: rasterResult.max,
        },
      }
      // Float32Array transferable olarak geçirilir (kopyalama yok)
      ctx.postMessage(out, [rasterResult.raster.values.buffer])
      return
    }

    const result = config.method === 'kriging'
      ? interpolateKriging(points, config)
      : interpolateIDW(points, config)

    const out: InterpolationWorkerOutput = {
      result: {
        grid: result.grid,
        raster: null,
        min: result.min,
        max: result.max,
      },
    }
    ctx.postMessage(out)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const out: InterpolationWorkerOutput = { error: message }
    ctx.postMessage(out)
  }
}
