import React, { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BrainCircuit,
  Play,
  CheckCircle2,
  AlertTriangle,
  Users,
  TrendingUp,
} from 'lucide-react';
import { GlobalFilterState } from '../types/analytics';
import {
  buildFilterQueryString,
  formatCurrency,
  formatNumber,
} from '../services/api';

interface MachineLearningPageProps {
  filters: GlobalFilterState;
  refreshTrigger: number;
  defaultHorizon: number;
  defaultContamination: number;
}

export const MachineLearningPage: React.FC<MachineLearningPageProps> = ({
  filters,
  refreshTrigger,
  defaultHorizon,
  defaultContamination,
}) => {
  const [activeTask, setActiveTask] = useState<'forecasting' | 'segmentation' | 'anomaly'>(
    'forecasting'
  );
  const [horizon, setHorizon] = useState(defaultHorizon || 6);
  const [contamination, setContamination] = useState(defaultContamination || 0.02);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [mlData, setMlData] = useState<any>(null);

  const loadEvaluation = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildFilterQueryString(filters, {
        horizon,
        contamination,
      });
      const res = await fetch(`/api/ml/evaluation${qs}`);
      if (res.ok) {
        const data = await res.json();
        setMlData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, horizon, contamination]);

  useEffect(() => {
    loadEvaluation();
  }, [loadEvaluation, refreshTrigger]);

  const handleTrainModels = async () => {
    setTraining(true);
    try {
      const res = await fetch('/api/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horizon,
          contamination,
          filters,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMlData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTraining(false);
    }
  };

  if (loading && !mlData) {
    return <div className="h-96 bg-white border border-slate-200 rounded-lg animate-pulse" />;
  }
  if (!mlData) return null;

  const { forecasting, segmentation, anomalies } = mlData;

  return (
    <div className="space-y-6">
      {/* Top ML Control Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Machine Learning & Model Evaluation Workbench
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Scikit-learn aligned supervised forecasting, unsupervised RFM K-Means++ clustering, and Isolation Forest transaction anomaly detection
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <label className="text-slate-500 font-medium">Forecast Horizon:</label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={9}>9 Months</option>
                <option value={12}>12 Months</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <label className="text-slate-500 font-medium">Anomaly Contamination:</label>
              <select
                value={contamination}
                onChange={(e) => setContamination(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800"
              >
                <option value={0.01}>1.0%</option>
                <option value={0.02}>2.0%</option>
                <option value={0.03}>3.0%</option>
                <option value={0.05}>5.0%</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleTrainModels}
              disabled={training}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              {training ? 'Training Pipeline...' : 'Train & Evaluate Models'}
            </button>
          </div>
        </div>

        {/* Task Selection Segmented Control */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTask('forecasting')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTask === 'forecasting'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Option A: Sales Forecasting
            </button>
            <button
              type="button"
              onClick={() => setActiveTask('segmentation')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTask === 'segmentation'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              Option B: Customer Segmentation (K-Means)
            </button>
            <button
              type="button"
              onClick={() => setActiveTask('anomaly')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTask === 'anomaly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Option C: Anomaly Detection (Isolation Forest)
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Active Scope: {formatNumber(mlData.recordCount)} validated records
          </div>
        </div>
      </div>

      {/* OPTION A: SALES FORECASTING */}
      {activeTask === 'forecasting' && forecasting && (
        <div className="space-y-6">
          {/* Model Performance KPI Strip (Section 15) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Selected Best Model</div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {forecasting.selectedModel}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Train / Test Split</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {forecasting.trainingRecords}m / {forecasting.testingRecords}m
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">MAE (Mean Abs Error)</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatCurrency(forecasting.models[0]?.mae || 0)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">RMSE (Root Mean Sq)</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatCurrency(forecasting.models[0]?.rmse || 0)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">R² Score</div>
              <div className="text-lg font-bold text-emerald-700 font-mono tabular-nums mt-1">
                {forecasting.models[0]?.r2.toFixed(4)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">MAPE (%)</div>
              <div className="text-lg font-bold text-blue-700 font-mono tabular-nums mt-1">
                {forecasting.models[0]?.mape.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Historical + Holdout Validation + Future Forecast Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Actual vs. Predicted Validation & {forecasting.horizonMonths}-Month Future Sales Forecast
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparing actual monthly sales against holdout validation predictions and future horizon projections
                </p>
              </div>
              <div className="text-xs font-mono tabular-nums text-slate-700">
                Next Month Forecast: <span className="font-bold text-blue-700">{formatCurrency(forecasting.nextMonthForecast)}</span> ({forecasting.forecastGrowthPct >= 0 ? '+' : ''}{forecasting.forecastGrowthPct}%)
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={forecasting.historicalAndForecast}
                  margin={{ top: 10, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    name="Upper 95% Bound"
                    fill="#eff6ff"
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="actualSales"
                    name="Actual Historical Sales"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedSales"
                    name="ML Model Prediction / Forecast"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 3.5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Comparison & Future Horizon Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="text-base font-semibold text-slate-900">
                  Candidate Regression Models Evaluation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Holdout test set metrics across candidate regressors
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <th className="py-2.5 px-4 font-semibold">Model Architecture</th>
                      <th className="py-2.5 px-4 font-semibold text-right">MAE</th>
                      <th className="py-2.5 px-4 font-semibold text-right">RMSE</th>
                      <th className="py-2.5 px-4 font-semibold text-right">R²</th>
                      <th className="py-2.5 px-4 font-semibold text-right">MAPE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {forecasting.models.map((m: any) => (
                      <tr key={m.modelName} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-1.5">
                            {m.isBest && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                            <span>{m.modelName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-700">
                          {formatCurrency(m.mae)}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-700">
                          {formatCurrency(m.rmse)}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-right font-semibold text-emerald-700">
                          {m.r2.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-right text-blue-700 font-medium">
                          {m.mape.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="text-base font-semibold text-slate-900">
                  Future Forecast Horizon Schedule ({forecasting.selectedModel})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Projected monthly sales and 95% prediction intervals
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <th className="py-2.5 px-4 font-semibold">Future Period</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Predicted Sales</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Lower Bound (95%)</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Upper Bound (95%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {forecasting.models[0]?.futurePredictions.map((fp: any) => (
                      <tr key={fp.period} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                          {fp.period}
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums text-right font-bold text-blue-700">
                          {formatCurrency(fp.predictedSales)}
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-600">
                          {formatCurrency(fp.lowerBound)}
                        </td>
                        <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-600">
                          {formatCurrency(fp.upperBound)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPTION B: CUSTOMER SEGMENTATION (K-MEANS RFM) */}
      {activeTask === 'segmentation' && segmentation && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Clustering Algorithm</div>
              <div className="text-sm font-bold text-slate-900 mt-1">{segmentation.algorithm}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Clusters (k) & Customers</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                k = {segmentation.k} · {formatNumber(segmentation.totalCustomers)} accounts
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Silhouette Score</div>
              <div className="text-lg font-bold text-emerald-700 font-mono tabular-nums mt-1">
                {segmentation.silhouetteScore.toFixed(4)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Within-Cluster Inertia</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatNumber(segmentation.inertia)}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">
                K-Means RFM Cluster Centroids & Strategic Playbook
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cluster names dynamically assigned from empirical Recency, Frequency, and Monetary centroids
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-4 font-semibold">Segment Name</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Customers</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Avg Recency</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Avg Frequency</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Avg Monetary</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total Revenue</th>
                    <th className="py-2.5 px-4 font-semibold">Recommended Business Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {segmentation.clusters.map((c: any) => (
                    <tr key={c.clusterId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.segmentName}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right text-blue-700 font-semibold">
                        {c.customerCount} ({c.percentage}%)
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-700">
                        {c.avgRecencyDays} days
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-700">
                        {c.avgFrequency} orders
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right font-semibold text-slate-900">
                        {formatCurrency(c.avgMonetary)}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-right font-semibold text-emerald-700">
                        {formatCurrency(c.totalRevenue)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-md">
                        {c.recommendedAction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* OPTION C: ANOMALY DETECTION (ISOLATION FOREST) */}
      {activeTask === 'anomaly' && anomalies && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Total Transactions Inspected</div>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatNumber(anomalies.totalTransactions)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Normal Transactions</div>
              <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
                {formatNumber(anomalies.normalTransactions)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Anomalies Detected</div>
              <div className="text-xl font-bold text-red-600 font-mono tabular-nums mt-1">
                {formatNumber(anomalies.anomaliesDetected)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500">Anomaly Percentage</div>
              <div className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1">
                {anomalies.anomalyPercentage}%
              </div>
            </div>
          </div>

          {/* Score Distribution Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-base font-semibold text-slate-900">
              Isolation Forest Anomaly Score Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Transactions with shorter average path lengths in random isolation trees score closer to 1.0
            </p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={anomalies.distribution} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#334155' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="normalCount" name="Normal Transactions" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="anomalyCount" name="Isolated Anomalies" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Suspicious Transaction Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">
                Suspicious / Anomalous Transactions Table (Top Flagged Orders)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ranked by Isolation Forest anomaly score s(x, n)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">Order ID</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Product</th>
                    <th className="py-2.5 px-3 font-semibold">Region</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Discount</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Sales</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Profit</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Score</th>
                    <th className="py-2.5 px-3 font-semibold">Isolation Root Cause</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {anomalies.anomalies.slice(0, 25).map((a: any) => (
                    <tr key={a.orderId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{a.orderId}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{a.orderDate}</td>
                      <td className="py-2.5 px-3 text-slate-800 max-w-[160px] truncate" title={a.productName}>
                        {a.productName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{a.region}</td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-800">
                        {a.quantity}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right text-amber-700 font-medium">
                        {(a.discount * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right font-medium text-slate-900">
                        {formatCurrency(a.sales)}
                      </td>
                      <td
                        className={`py-2.5 px-3 font-mono tabular-nums text-right font-semibold ${
                          a.profit < 0 ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(a.profit)}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right font-bold text-red-600">
                        {a.anomalyScore.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{a.reason}</td>
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
