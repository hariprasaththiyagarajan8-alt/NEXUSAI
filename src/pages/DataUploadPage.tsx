import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Database,
  Download,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';
import {
  CleaningSummary,
  NavPageId,
  ValidationReport,
} from '../types/analytics';
import { formatNumber } from '../services/api';

interface DataUploadPageProps {
  validationReport: ValidationReport | null;
  cleaningSummary: CleaningSummary | null;
  onDatasetUpdated: () => void;
  onNavigate: (page: NavPageId) => void;
}

export const DataUploadPage: React.FC<DataUploadPageProps> = ({
  validationReport,
  cleaningSummary,
  onDatasetUpdated,
  onNavigate,
}) => {
  const [uploading, setUploading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [failedValidation, setFailedValidation] = useState<ValidationReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    setErrorBanner(null);
    setFailedValidation(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = String(reader.result || '');
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              fileBase64: base64,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setErrorBanner(data.error || 'Upload failed.');
          } else if (data.validationReport?.status === 'FAILED') {
            setFailedValidation(data.validationReport);
          } else {
            onDatasetUpdated();
          }
        } catch (err) {
          setErrorBanner('Network error while uploading file.');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrorBanner('Could not read the selected file.');
      setUploading(false);
    }
  };

  const handleLoadDemo = async () => {
    setUploading(true);
    setErrorBanner(null);
    setFailedValidation(null);
    try {
      const res = await fetch('/api/demo/load', { method: 'POST' });
      if (res.ok) {
        onDatasetUpdated();
      } else {
        setErrorBanner('Failed to load synthetic demo dataset.');
      }
    } catch (e) {
      setErrorBanner('Network error while loading demo dataset.');
    } finally {
      setUploading(false);
    }
  };

  const handleSimulateMissingColumnsTest = async () => {
    setUploading(true);
    setErrorBanner(null);
    try {
      // Send a deliberate incomplete dataset missing Region and Cost to demonstrate validation guardrails
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'INCOMPLETE_SALES_TEST.CSV',
          rawRows: [
            {
              Order_ID: 'ORD-9001',
              Order_Date: '2026-01-15',
              Customer_ID: 'CUST-101',
              Product_Name: 'ProBook Workstation X1',
              Category: 'Electronics',
              Quantity: 4,
              Unit_Price: 1450,
              Sales: 5800,
              // Intentionally missing Region and Cost/Profit
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.validationReport?.status === 'FAILED') {
        setFailedValidation(data.validationReport);
      }
    } catch (e) {
      setErrorBanner('Validation test failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSampleTemplate = () => {
    const sampleCsv = [
      'Order_ID,Order_Date,Customer_ID,Customer_Name,Product_ID,Product_Name,Category,Region,Quantity,Unit_Price,Discount,Sales,Cost,Profit',
      'ORD-50001,2026-01-10,CUST-2001,Apex Technologies,PRD-1001,ProBook Workstation X1,Electronics,North,5,1450,0.05,6887.50,5220.00,1667.50',
      'ORD-50002,2026-01-12,CUST-2002,Vanguard Logistics,PRD-3001,ErgoSpine Executive Mesh Chair,Office Systems,West,8,590,0.00,4720.00,3115.20,1604.80',
      'ORD-50003,2026-01-15,CUST-2003,Meridian Health,PRD-4001,Artisan Single-Origin Espresso Beans (5kg),Beverages & Hospitality,South,12,145,0.10,1566.00,887.40,678.60',
      'ORD-50004,2026-01-18,CUST-2004,Kinetix Financial,PRD-5001,Rackmount UPS 3000VA Pure Sine,Infrastructure,East,3,980,0.05,2793.00,2175.60,617.40',
    ].join('\n');

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_sales_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportToDisplay = failedValidation || validationReport;

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Data Ingestion & Schema Validation Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Upload raw enterprise sales datasets in CSV or Excel (.XLSX) format, or load the 6,500-record synthetic enterprise demo dataset. All records undergo automated schema validation, missing-value imputation, duplicate removal, and PostgreSQL relational indexing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadSampleTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Sample CSV Template
            </button>

            <button
              type="button"
              onClick={handleSimulateMissingColumnsTest}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors whitespace-nowrap"
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-700" />
              Test Missing-Column Guardrail
            </button>

            <button
              type="button"
              onClick={handleLoadDemo}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5" />
              {uploading ? 'Processing...' : 'Load Demo Dataset (6,500 Rows)'}
            </button>
          </div>
        </div>

        {/* File Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFileSelect(f);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="mt-6 border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-lg p-8 text-center cursor-pointer bg-slate-50/60 hover:bg-blue-50/20 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
              e.target.value = '';
            }}
          />
          <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2.5" />
          <p className="text-sm font-semibold text-slate-900">
            Click to select a CSV or Excel (.XLSX) file, or drag and drop here
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supported columns: Order_ID · Order_Date · Customer_ID · Product_ID · Product_Name · Category · Region · Quantity · Unit_Price · Discount · Sales · Cost · Profit
          </p>
        </div>

        {errorBanner && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">File Upload Error</div>
              <div className="mt-0.5">{errorBanner}</div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Status Summary Card */}
      {reportToDisplay && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {reportToDisplay.datasetName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingested at {new Date(reportToDisplay.uploadedAt).toLocaleString()} ·{' '}
                  {reportToDisplay.isDemoData ? 'DEMO DATA (Synthetic)' : 'Uploaded File'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {reportToDisplay.status === 'VALIDATED' ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Status: VALIDATED ✓</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Status: VALIDATION FAILED ✕</span>
                </div>
              )}

              {reportToDisplay.status === 'VALIDATED' && (
                <button
                  type="button"
                  onClick={() => onNavigate('quality')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
                >
                  Inspect Cleaning Summary <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Failed Validation Explanation Box (Section 8) */}
          {reportToDisplay.status === 'FAILED' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-2">
              <div className="font-bold text-sm text-red-800">
                Dataset validation failed.
              </div>
              <p className="text-red-700">
                The uploaded file is missing required business columns needed for profitability and regional analytics:
              </p>
              <ul className="list-disc list-inside font-mono font-semibold space-y-1">
                {reportToDisplay.missingRequiredColumns.map((col) => (
                  <li key={col}>{col}</li>
                ))}
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setFailedValidation(null)}
                  className="px-3 py-1.5 bg-white border border-red-300 rounded text-xs font-medium text-red-800 hover:bg-red-100"
                >
                  Dismiss & Return to Active Dataset ({validationReport?.datasetName})
                </button>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-5">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-xs text-slate-500">Raw Rows</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatNumber(reportToDisplay.rawRows)}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-xs text-slate-500">Columns Detected</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatNumber(reportToDisplay.rawColumns)}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-xs text-slate-500">Missing Values</div>
              <div className="text-lg font-bold text-amber-700 font-mono tabular-nums mt-1">
                {formatNumber(reportToDisplay.missingValues)}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-xs text-slate-500">Duplicate Rows</div>
              <div className="text-lg font-bold text-amber-700 font-mono tabular-nums mt-1">
                {formatNumber(reportToDisplay.duplicateRows)}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-xs text-slate-500">Invalid Records</div>
              <div className="text-lg font-bold text-red-600 font-mono tabular-nums mt-1">
                {formatNumber(reportToDisplay.invalidRecords)}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-xs text-slate-500">Clean Final Rows</div>
              <div className="text-lg font-bold text-emerald-700 font-mono tabular-nums mt-1">
                {formatNumber(cleaningSummary?.finalRows || 0)}
              </div>
            </div>
          </div>

          {/* Column Schema Mapping Table */}
          <div className="mt-6">
            <h4 className="text-xs font-semibold text-slate-700 mb-2.5">
              Column Schema & Data Type Validation
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <th className="py-2 px-3 font-semibold">Source Column</th>
                    <th className="py-2 px-3 font-semibold">Canonical Schema Mapping</th>
                    <th className="py-2 px-3 font-semibold">Detected Data Type</th>
                    <th className="py-2 px-3 font-semibold text-right">Missing Values</th>
                    <th className="py-2 px-3 font-semibold">Sample Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportToDisplay.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-medium text-slate-900">
                        {col.name}
                      </td>
                      <td className="py-2 px-3 font-mono text-blue-700">
                        {col.mappedTo || '— (Unmapped Attribute)'}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {col.dataType}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-right text-slate-700">
                        {formatNumber(col.missingCount)}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500 truncate max-w-[260px]">
                        {col.sampleValues.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
