/**
 * Wizard Step 1: File Upload
 * Upload Excel/CSV file
 */

import { useState } from 'react';
import { ColumnMapper } from '../../utils/columnMapper';
import { useVisualizationStore } from '../../stores/useVisualizationStore';

interface VizWizardStep1Props {
  onNext: () => void;
}

export default function VizWizardStep1({ onNext }: VizWizardStep1Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ rowCount: number; columns: string[] } | null>(null);

  const { setFileData, setColumnMapping } = useVisualizationStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    try {
      const mapper = new ColumnMapper();
      const result = await mapper.loadFile(file);

      // Store data in store
      setFileData(mapper.rawData || [], mapper.columns);

      // Auto-detect columns
      const suggestions = mapper.detectColumns();
      if (suggestions) {
        setColumnMapping({
          locationColumn: suggestions.locationColumn,
          districtColumn: suggestions.districtColumn,
          dataColumn: suggestions.dataColumn,
          locationLevel: suggestions.locationLevel as 'province' | 'district' | 'mixed',
        });
      }

      setFileInfo({ rowCount: result.rowCount, columns: result.columns });

      // Auto-advance to next step after successful load
      setTimeout(() => {
        onNext();
      }, 500);
    } catch (error: any) {
      alert('Dosya yüklenemedi: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* File upload input */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-2">
          Excel veya CSV Dosyası Seçin
        </label>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={isLoading}
          className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Desteklenen formatlar: .xlsx, .xls, .csv
        </p>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-xs text-blue-700">Dosya yükleniyor...</p>
        </div>
      )}

      {/* File info display */}
      {!isLoading && fileInfo && fileName && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <i className="fa-solid fa-check-circle text-green-600 mt-0.5"></i>
            <div className="flex-1">
              <p className="text-xs font-semibold text-green-900">{fileName}</p>
              <p className="text-xs text-green-700 mt-1">
                {fileInfo.rowCount} satır, {fileInfo.columns.length} sütun
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!fileName && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
          <p className="text-xs text-zinc-700">
            <i className="fa-solid fa-info-circle mr-1 text-zinc-500"></i>
            Türkiye il veya ilçe verisi içeren Excel/CSV dosyası yükleyin.
          </p>
        </div>
      )}
    </div>
  );
}
