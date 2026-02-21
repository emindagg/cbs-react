import * as XLSX from 'xlsx'

export interface WorkerInput {
  buffer: ArrayBuffer
  fileType: 'excel' | 'csv'
}

export type WorkerOutput =
  | { success: true; data: Record<string, unknown>[]; headers: string[] }
  | { success: false; error: string }

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  try {
    const { buffer } = event.data
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      raw: false,
    }) as Record<string, unknown>[]

    if (jsonData.length === 0) {
      const output: WorkerOutput = { success: true, data: [], headers: [] }
      self.postMessage(output)
      return
    }

    const headers = Object.keys(jsonData[0] as object)
    const output: WorkerOutput = { success: true, data: jsonData, headers }
    self.postMessage(output)
  } catch (err) {
    const output: WorkerOutput = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
    self.postMessage(output)
  }
}
