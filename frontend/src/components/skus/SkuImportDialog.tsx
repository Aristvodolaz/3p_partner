import { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, AlertTriangle } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { parseSkuExcel, type ParseResult } from '@/lib/importSkuExcel';
import { useImportSkus, useOperations } from '@/hooks/useSkus';
import type { Partner } from '@/types/partner';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  partner: Partner;
}

export function SkuImportDialog({ open, onClose, partner }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [replace, setReplace] = useState(true);

  const { data: operations } = useOperations();
  const importSkus = useImportSkus();

  const reset = () => {
    setParsed(null);
    setFileName('');
    setReplace(true);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !operations) return;
    try {
      const buffer = await file.arrayBuffer();
      const result = parseSkuExcel(buffer, operations);
      if (!result.rows.length) {
        toast.error('В файле не найдено ни одной строки с артикулом');
        return;
      }
      setParsed(result);
      setFileName(file.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось прочитать файл');
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    await importSkus.mutateAsync({
      partnerId: partner.id,
      replace,
      rows: parsed.rows,
    });
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={`Импорт справочника — ${partner.name}`}
      size="xl"
    >
      {!parsed ? (
        <div
          className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet size={40} className="text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">
            Выберите файл шаблона «Справочник по внешнему партнёру»
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Лист «Справочник»: артикул, наименование, атрибуты и операции (.xlsx)
          </p>
          <button type="button" className="btn-primary mt-4">
            <Upload size={16} />
            Выбрать файл
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FileSpreadsheet size={18} className="text-green-600" />
              <span className="font-medium">{fileName}</span>
              <span className="text-gray-400">— {parsed.rows.length} SKU</span>
            </div>
            <button type="button" className="btn-ghost text-xs" onClick={reset}>
              Выбрать другой файл
            </button>
          </div>

          {parsed.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
                <AlertTriangle size={14} />
                Предупреждения
              </div>
              <ul className="text-xs text-amber-600 list-disc pl-5 space-y-0.5 max-h-24 overflow-y-auto">
                {parsed.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Предпросмотр */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-3 py-2 font-medium">Артикул</th>
                    <th className="px-3 py-2 font-medium">Наименование</th>
                    <th className="px-3 py-2 font-medium">Спец. отметки</th>
                    <th className="px-3 py-2 font-medium">Операций</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsed.rows.slice(0, 50).map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono text-xs">{row.article}</td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {row.specialMarks ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.operations?.length ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.rows.length > 50 && (
              <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                ... и ещё {parsed.rows.length - 50}
              </div>
            )}
          </div>

          {/* Режим импорта */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                checked={replace}
                onChange={() => setReplace(true)}
                className="text-primary focus:ring-primary-500"
              />
              <span>
                <b>Полная замена</b> — текущий справочник партнёра будет удалён и загружен заново
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                checked={!replace}
                onChange={() => setReplace(false)}
                className="text-primary focus:ring-primary-500"
              />
              <span>
                <b>Дозагрузка</b> — новые артикулы добавятся, существующие обновятся
              </span>
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={importSkus.isPending}
            >
              Отмена
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleImport}
              disabled={importSkus.isPending}
            >
              {importSkus.isPending
                ? 'Импорт...'
                : `Импортировать ${parsed.rows.length} SKU`}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
