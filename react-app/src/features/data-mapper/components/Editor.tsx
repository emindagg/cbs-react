/**
 * Data Editor Component
 * Allows users to edit data values before matching
 */

import { useState } from 'react'

interface EditorProps {
  data: Record<string, unknown>[];
  columns: string[];
  onSave: (updatedData: Record<string, unknown>[]) => void;
  onClose: () => void;
}

export default function Editor({ data, columns, onSave, onClose }: EditorProps) {
  const [editedData, setEditedData] = useState<Record<string, unknown>[]>(
    JSON.parse(JSON.stringify(data)),
  )
  const [searchTerm, setSearchTerm] = useState('')

  // Filter data based on search
  const filteredData = editedData.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  )

  const handleCellEdit = (rowIndex: number, column: string, value: string) => {
    const newData = [...editedData]
    const actualRowIndex = editedData.findIndex((row) => row === filteredData[rowIndex])
    newData[actualRowIndex] = {
      ...newData[actualRowIndex],
      [column]: value,
    }
    setEditedData(newData)
  }

  const handleSave = () => {
    onSave(editedData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800">Veri Düzenleyici</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Verileri düzenleyin ve kaydedin
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-zinc-200">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ara..."
              className="w-full pl-9 pr-3 py-2 text-[11px] border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-zinc-700 w-12">#</th>
                {columns.map((col) => (
                  <th key={col} className="px-2 py-2 text-left font-semibold text-zinc-700">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-zinc-100 hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-2 py-2 text-zinc-500">{rowIndex + 1}</td>
                  {columns.map((col) => (
                    <td key={col} className="px-2 py-1">
                      <input
                        type="text"
                        value={String(row[col] ?? '')}
                        onChange={(e) => handleCellEdit(rowIndex, col, e.target.value)}
                        className="w-full px-2 py-1 text-[11px] border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-zinc-300"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="text-center py-8 text-zinc-400 text-[11px]">
              <i className="fa-solid fa-search text-2xl mb-2"></i>
              <p>Sonuç bulunamadı</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-200 flex items-center justify-between">
          <div className="text-[10px] text-zinc-500">
            <i className="fa-solid fa-table text-blue-600 mr-1"></i>
            {editedData.length} satır • {columns.length} sütun
            {searchTerm && ` • ${filteredData.length} eşleşme`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[11px] font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <i className="fa-solid fa-save mr-1.5 text-[10px]"></i>
              Kaydet ve Devam
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
