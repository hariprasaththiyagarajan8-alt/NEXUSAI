import React, { useState } from 'react';
import {
  Settings,
  Database,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface SettingsPageProps {
  defaultHorizon: number;
  defaultContamination: number;
  onUpdateMlDefaults: (horizon: number, contamination: number) => void;
  onReloadDemo: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  defaultHorizon,
  defaultContamination,
  onUpdateMlDefaults,
  onReloadDemo,
}) => {
  const [horizon, setHorizon] = useState(defaultHorizon);
  const [contamination, setContamination] = useState(defaultContamination);
  const [savedNotice, setSavedNotice] = useState(false);
  const [reloading, setReloading] = useState(false);

  const handleSave = () => {
    onUpdateMlDefaults(horizon, contamination);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleResetDemo = async () => {
    setReloading(true);
    try {
      await onReloadDemo();
    } finally {
      setReloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ML Hyperparameters & Defaults */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200">
          <Settings className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Analytics & Machine Learning Pipeline Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure default forecasting horizons, anomaly detection sensitivity, and demo dataset state
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Sales Forecast Horizon (Months)
            </label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-mono text-slate-900"
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months (Recommended)</option>
              <option value={9}>9 Months</option>
              <option value={12}>12 Months</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Controls the default projection window for Gradient Boosting, Random Forest, and Seasonal OLS models.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Isolation Forest Contamination Rate
            </label>
            <select
              value={contamination}
              onChange={(e) => setContamination(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-mono text-slate-900"
            >
              <option value={0.01}>0.01 (1.0% Strict Outlier Threshold)</option>
              <option value={0.02}>0.02 (2.0% Standard Enterprise Audit)</option>
              <option value={0.03}>0.03 (3.0% Broad Inspection)</option>
              <option value={0.05}>0.05 (5.0% High Sensitivity)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Controls the proportion of transactions flagged as suspicious in the Isolation Forest module.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Pipeline Preferences
          </button>
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Preferences updated across ML modules.
            </span>
          )}
        </div>
      </div>

      {/* Dataset State Reset */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Reset / Reload Synthetic Enterprise Demo Dataset (6,500 Records)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Re-runs the complete data validation, deduplication, missing-value imputation, RFM K-Means clustering, and PostgreSQL indexing workflow on the 6,500-row synthetic demo dataset.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDemo}
            disabled={reloading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
            {reloading ? 'Reloading Demo Data...' : 'Reload Demo Dataset'}
          </button>
        </div>
      </div>

      {/* Security & Architecture Compliance Checklist (Section 30 & 46) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Security & Anti-Fabrication Governance</span>
        </div>
        <ul className="space-y-2 text-xs text-slate-600">
          <li>
            • <strong>Server-Side Gemini API Protection:</strong> All Google Gemini API calls execute strictly on the backend via <code className="font-mono text-slate-800">process.env.GEMINI_API_KEY</code>. No API keys are ever exposed to client bundles.
          </li>
          <li>
            • <strong>Anti-Fabrication Enforcement:</strong> Every KPI, regional margin, RFM cluster metric, and ML evaluation score (MAE, RMSE, R², MAPE, Silhouette Score) is computed mathematically from the active dataset before being sent to Gemini.
          </li>
          <li>
            • <strong>Graceful AI Fallback:</strong> If the Gemini service is unreachable, the system continues operating seamlessly using its deterministic BI rule engine.
          </li>
        </ul>
      </div>
    </div>
  );
};
