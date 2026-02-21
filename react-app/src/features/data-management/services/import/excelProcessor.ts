import type { ParseResult } from '../../types'
import { detectColumns } from '../../utils/columnDetector'
import { transformToGeoItems } from '../../utils/dataMapper'
import type { WorkerOutput } from './xlsxWorker'

function parseWithWorker(buffer: ArrayBuffer): Promise<WorkerOutput> {
  return new Promise((resolve) => {
    const worker = new Worker(
      new URL('./xlsxWorker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (event: MessageEvent<WorkerOutput>) => {
      worker.terminate()
      resolve(event.data)
    }

    worker.onerror = (err) => {
      worker.terminate()
      resolve({ success: false, error: err.message })
    }

    worker.postMessage({ buffer }, [buffer])
  })
}

/**
 * Process Excel/CSV files - uses Web Worker for heavy parsing
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const result = await parseWithWorker(buffer)

  if (!result.success) {
    throw new Error(result.error)
  }

  const { data: jsonData, headers } = result

  if (jsonData.length === 0) {
    return { items: [] }
  }

  const mapping = detectColumns(headers)

  if (!mapping.lat || !mapping.lon) {
    return {
      needsMapping: true,
      data: jsonData,
      headers,
      mapping,
    }
  }

  const items = transformToGeoItems(jsonData, mapping)
  return { items }
}
