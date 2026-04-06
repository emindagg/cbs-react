import { analyzeExcelArrayBuffer } from './excelParser'
import type { ExcelParseErrorCode, ExcelWorkerInput, ExcelWorkerOutput } from './types'

function getErrorCode(error: unknown): ExcelParseErrorCode | undefined {
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
    return error.code as ExcelParseErrorCode
  }
  return undefined
}

function getErrorMeta(error: unknown): Record<string, unknown> | undefined {
  if (error instanceof Error && 'meta' in error && typeof error.meta === 'object') {
    return error.meta as Record<string, unknown> | undefined
  }
  return undefined
}

self.onmessage = (event: MessageEvent<ExcelWorkerInput>) => {
  try {
    const result = analyzeExcelArrayBuffer(event.data.buffer)
    const output: ExcelWorkerOutput = {
      success: true,
      result,
    }
    self.postMessage(output)
  } catch (error) {
    const output: ExcelWorkerOutput = {
      success: false,
      error: {
        code: getErrorCode(error),
        message: error instanceof Error ? error.message : String(error),
        meta: getErrorMeta(error),
      },
    }
    self.postMessage(output)
  }
}
