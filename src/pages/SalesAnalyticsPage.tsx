import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BusinessKPIs,
  CategoryBreakdown,
  GlobalFilterState,
  MonthlyTrendPoint,
  RegionBreakdown,
} from '../types/analytics';
import {
  buildFilterQueryString,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../services/api';
import { SalesDataTable } from '../components/SalesDataTable';

interface SalesAnalyticsPageProps {
  filters: GlobalFilterState;
  refreshTrigger: number;
}

export const SalesAnalyticsPage: React.FC<SalesAnalyticsPageProps> = ({
  filters,
  refreshTrigger,
}) => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<BusinessKPIs | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [regions, setRegions] = useState<RegionBreakdown[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const qs = buildFilterQueryString(filters);
        const res = await fetch(`/api/sales/trends${qs}`);
        if (res.ok && active) {
          const data = await res.json();
          setKpis(data.kpis);
          setMonthlyTrends(data.monthlyTrends || []);
          setCategories(data.categories || []);
          setRegions(data.regions || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [filters, refreshTrigger]);

  if (loading && !kpis) {
    return <div className="h-96 bg-white border border-slate-200 rounded-lg animate-pulse" />;
  }
  if (!kpis) return null;

  return (
    <div className="space-y-6">
      {/* Header & Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Time-Series Sales Analytics & Profitability Decomposition
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Period-over-period revenue velocity, gross cost structure, profit margin stability, and category/regional comparisons
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <div>
              <span className="text-slate-500">Revenue: </span>
              <span className="font-bold text-slate-900">{formatCurrency(kpis.totalSales)}</span>
            </div>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <div>
              <span className="text-slate-500">Net Profit: </span>
              <span className="font-bold text-emerald-700">{formatCurrency(kpis.totalProfit)}</span>
            </div>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <div>
              <span className="text-slate-500">Period Growth: </span>
              <span className={kpis.salesGrowth >= 0 ? 'font-bold text-emerald-700' : 'font-bold text-red-600'}>
                {formatPercent(kpis.salesGrowth, true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Sales, Cost, and Profit Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            Monthly Revenue vs. Cost of Goods Sold (COGS) & Net Profit
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluating revenue expansion alongside cost control and 3-month rolling average
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyTrends} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
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
                dataKey="sales"
                name="Total Sales"
                fill="#dbeafe"
                stroke="#2563eb"
                strokeWidth={2}
              />
              <Bar dataKey="cost" name="Total Cost" fill="#94a3b8" barSize={14} radius={[2, 2, 0, 0]} />
              <Line
                type="monotone"
                dataKey="profit"
                name="Net Profit"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 2.5 }}
              />
              <Line
                type="monotone"
                dataKey="movingAvg3M"
                name="3M Moving Avg"
                stroke="#0f172a"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Month-over-Month Growth & Profit Margin Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Month-over-Month (MoM) Sales Growth & Profit Margin (%)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Tracking monthly growth rate acceleration and profit margin percentage
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrends} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => `${Number(value).toFixed(2)}%`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="momGrowth" name="MoM Sales Growth (%)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="margin"
                  name="Profit Margin (%)"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category & Region Profitability Comparison */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Category & Regional Margin Comparison
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Revenue share, net profit, and margin efficiency across business units
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 px-3 font-semibold">Category</th>
                  <th className="py-2 px-3 font-semibold text-right">Orders</th>
                  <th className="py-2 px-3 font-semibold text-right">Sales</th>
                  <th className="py-2 px-3 font-semibold text-right">Profit</th>
                  <th className="py-2 px-3 font-semibold text-right">Margin</th>
                  <th className="py-2 px-3 font-semibold text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((c) => (
                  <tr key={c.category} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{c.category}</td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-600">
                      {formatNumber(c.orders)}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-800">
                      {formatCurrency(c.sales)}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-emerald-700 font-medium">
                      {formatCurrency(c.profit)}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-700">
                      {c.margin.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-blue-700 font-medium">
                      {c.share.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {regions.map((r) => (
              <div key={r.region} className="p-2.5 bg-slate-50 rounded border border-slate-200/80">
                <div className="text-xs font-semibold text-slate-800">{r.region}</div>
                <div className="text-xs font-mono tabular-nums text-slate-600 mt-0.5">
                  {formatCurrency(r.sales, true)} · {r.margin.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Interactive Sales Data Table */}
      <SalesDataTable filters={filters} refreshTrigger={refreshTrigger} />
    </div>
  );
};
