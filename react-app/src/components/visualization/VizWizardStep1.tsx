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
    <div className="space-y-3">
      {/* File upload buttons */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <div className="flex">
          {/* Dosya Aç button */}
          <label className="flex-shrink-0 px-4 py-2 bg-zinc-800 text-white text-[11px] font-medium cursor-pointer hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
            />
            Dosya Aç
          </label>

          {/* File status display */}
          <div className="flex-1 px-3 py-2 bg-white text-[11px] text-zinc-500 flex items-center">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent mr-2"></div>
                Yükleniyor...
              </>
            ) : fileName ? (
              <span className="text-zinc-700 truncate">{fileName}</span>
            ) : (
              'Dosya seçilmedi'
            )}
          </div>
        </div>
      </div>

      {/* Format info */}
      <p className="text-[10px] text-zinc-400">
        Excel (.xlsx, .xls) veya CSV (.csv)
      </p>

      {/* File info display */}
      {!isLoading && fileInfo && fileName && (
        <div className="bg-emerald-50/50 rounded-md p-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
            <p className="text-[11px] font-semibold text-emerald-900 truncate">{fileName}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-emerald-700">
            <span><i className="fa-solid fa-table-rows mr-1"></i>{fileInfo.rowCount} satır</span>
            <span><i className="fa-solid fa-table-columns mr-1"></i>{fileInfo.columns.length} sütun</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!fileName && !isLoading && (
        <div className="flex items-start gap-2 p-2 bg-zinc-50/50 rounded-md">
          <i className="fa-solid fa-lightbulb text-amber-500 text-xs mt-0.5"></i>
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Türkiye il veya ilçe verisi içeren Excel/CSV dosyası yükleyin.
          </p>
        </div>
      )}
    </div>
  );
}
