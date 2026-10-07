import React, { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Sliders, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { FilterOptions } from '../types/analytics';
import { formatCurrency, formatPercent } from '../services/api';

interface PredictionsPageProps {
  options: FilterOptions;
  refreshTrigger: number;
}

export const PredictionsPage: React.FC<PredictionsPageProps> = ({
  options,
  refreshTrigger,
}) => {
  const [category, setCategory] = useState('ALL');
  const [region, setRegion] = useState('ALL');
  const [quantity, setQuantity] = useState(15);
  const [unitPrice, setUnitPrice] = useState(680);
  const [discountPct, setDiscountPct] = useState(5);
  const [horizonMonths, setHorizonMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  const runSimulation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          region,
          quantity,
          unitPrice,
          discount: discountPct / 100,
          horizonMonths,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [category, region, quantity, unitPrice, discountPct, horizonMonths]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation, refreshTrigger]);

  const sim = result?.simulation;
  const forecast = result?.segmentForecast;

  return (
    <div className="space-y-6">
      {/* Simulator Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Predictive Forecasting & What-If Margin Simulator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate segment-specific sales forecasts and test order pricing/discount structures before execution
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={runSimulation}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            {loading ? 'Computing Prediction...' : 'Run Forecast & Pricing Simulation'}
          </button>
        </div>

        {/* Parameter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Target Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
            >
              <option value="ALL">All Categories</option>
              {options.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Target Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
            >
              <option value="ALL">All Regions</option>
              {options.regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Forecast Horizon
            </label>
            <select
              value={horizonMonths}
              onChange={(e) => setHorizonMonths(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono text-slate-900"
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={9}>9 Months</option>
              <option value={12}>12 Months</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Simulated Quantity
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Unit Price ($)
            </label>
            <input
              type="number"
              min={10}
              max={50000}
              value={unitPrice}
              onChange={(e) => setUnitPrice(Math.max(1, Number(e.target.value)))}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Proposed Discount ({discountPct}%)
            </label>
            <input
              type="range"
              min={0}
              max={45}
              step={1}
              value={discountPct}
              onChange={(e) => setDiscountPct(Number(e.target.value))}
              className="w-full mt-2 accent-blue-600"
            />
          </div>
        </div>

        {/* Simulated Deal Outcome */}
        {sim && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-200">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-xs text-slate-500">Projected Net Order Revenue</div>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatCurrency(sim.simulatedSales)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                {sim.quantity} × ${sim.unitPrice} × (1 - {(sim.discount * 100).toFixed(0)}%)
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-xs text-slate-500">Estimated Historical COGS</div>
              <div className="text-xl font-bold text-slate-800 font-mono tabular-nums mt-1">
                {formatCurrency(sim.estimatedCost)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Derived from segment empirical cost ratio
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-xs text-slate-500">Simulated Net Profit</div>
              <div
                className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                  sim.simulatedProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {formatCurrency(sim.simulatedProfit)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Revenue minus estimated unit cost
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-xs text-slate-500">Simulated Profit Margin</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xl font-bold font-mono tabular-nums ${
                    sim.simulatedMargin >= 12
                      ? 'text-emerald-700'
                      : sim.simulatedMargin >= 0
                      ? 'text-amber-700'
                      : 'text-red-600'
                  }`}
                >
                  {sim.simulatedMargin.toFixed(2)}%
                </span>
                {sim.simulatedProfit >= 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {sim.simulatedMargin < 0
                  ? 'Warning: Discount exceeds unit margin threshold'
                  : 'Profitable deal configuration'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Segment Forecast Trajectory */}
      {forecast && (
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Segment Demand Forecast ({category === 'ALL' ? 'All Categories' : category} ·{' '}
                {region === 'ALL' ? 'All Regions' : `${region} Region`})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Model: {forecast.selectedModel} · Next Month Projected Sales:{' '}
                <span className="font-mono font-semibold text-blue-700">
                  {formatCurrency(forecast.nextMonthForecast)}
                </span>{' '}
                ({formatPercent(forecast.forecastGrowthPct, true)})
              </p>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={forecast.historicalAndForecast}
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
                  name="95% Confidence Ceiling"
                  fill="#eff6ff"
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="actualSales"
                  name="Actual Sales"
                  stroke="#0f172a"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="predictedSales"
                  name="Predicted / Forecast Sales"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 3.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
