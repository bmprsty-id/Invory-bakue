import React, { useState } from 'react';
import { X, FileUp, Download, CheckCircle2, AlertTriangle, FileText, Sparkles } from 'lucide-react';
import { db } from '../services/storage';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted: () => void;
}

const SAMPLE_CSV = `barcode,product_name,category,unit,selling_price,minimum_stock,initial_warehouse
8992000000011,Tepung Maizena Maizenaku 250g,Tepung,pack,7500,20,50
8992000000022,Margarin Blue Band Serbaguna 200g,Mentega & Butter,pack,9500,30,80
8992000000033,Vanili Bubuk Koepoe Koepoe 20g,Perisa & Pewarna,botol,4500,25,60
8992000000044,Chocochips Elmer Dark 250g,Topping & Isian,pack,16000,15,40
8992000000055,SP Ryoto Emulsifier Kue 100g,Ragi & Pengembang,cup,11000,20,35`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportCompleted,
}) => {
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState<{
    totalRows: number;
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleProcessImport = () => {
    if (!csvText.trim()) return;
    const res = db.importCsv(csvText);
    setImportResult(res);
    if (res.imported > 0) {
      onImportCompleted();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        setImportResult(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExportCsv = () => {
    const csvData = db.exportCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bakery_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSample = () => {
    setCsvText(SAMPLE_CSV);
    setImportResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-amber-100">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base">Bulk CSV Import &amp; Export</h2>
              <p className="text-xs text-amber-100">Import product batches or download inventory spreadsheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick sample & Export actions */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Load Sample CSV
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV ({db.getProducts().length} items)
            </button>
          </div>

          {/* File Upload Box */}
          <label className="border-2 border-dashed border-amber-200 hover:border-amber-400 bg-amber-50/40 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
            <FileText className="w-7 h-7 text-amber-600 mb-1" />
            <span className="text-xs font-bold text-neutral-800">
              Choose CSV file from device
            </span>
            <span className="text-[11px] text-neutral-400 mt-0.5">
              or paste CSV data directly into the box below
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Direct CSV Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                CSV Data
              </label>
              <span className="text-[11px] font-mono text-neutral-400">
                barcode,product_name,category,unit,selling_price,minimum_stock
              </span>
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setImportResult(null);
              }}
              placeholder={`barcode,product_name,category,unit,selling_price,minimum_stock\n8991234567890,Chocolate Brownies,Cake,pcs,25000,10`}
              className="w-full text-xs font-mono bg-neutral-50 border border-neutral-300 rounded-xl p-3 focus:outline-hidden focus:border-amber-500 text-neutral-800"
            />
          </div>

          {/* Results Summary */}
          {importResult && (
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-neutral-900">
                  Import Summary: {importResult.imported} added, {importResult.skipped} skipped
                </span>
              </div>
              {importResult.errors.length > 0 && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Skipped Rows / Notices:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-600 max-h-24 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleProcessImport}
            disabled={!csvText.trim()}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <FileUp className="w-4 h-4" />
            Process Import
          </button>
        </div>
      </div>
    </div>
  );
};
