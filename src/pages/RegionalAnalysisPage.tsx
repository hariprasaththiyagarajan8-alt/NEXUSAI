import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { GlobalFilterState, RegionBreakdown } from '../types/analytics';
import {
  buildFilterQueryString,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../services/api';

interface RegionalAnalysisPageProps {
  filters: GlobalFilterState;
  refreshTrigger: number;
}

export const RegionalAnalysisPage: React.FC<RegionalAnalysisPageProps> = ({
  filters,
  refreshTrigger,
}) => {
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<RegionBreakdown[]>([]);
  const [matrix, setMatrix] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const qs = buildFilterQueryString(filters);
        const res = await fetch(`/api/regions${qs}`);
        if (res.ok && active) {
          const data = await res.json();
          setRegions(data.regions || []);
          setMatrix(data.regionCategoryMatrix || []);
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

  if (loading && regions.length === 0) {
    return <div className="h-96 bg-white border border-slate-200 rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Regional Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {regions.map((r) => (
          <div key={r.region} className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">{r.region} Region</span>
              <span className="text-xs font-mono tabular-nums text-blue-700 font-semibold">
                {r.share.toFixed(1)}% share
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
              {formatCurrency(r.sales, true)}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs font-mono tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Net Profit:</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(r.profit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Profit Margin:</span>
                <span className="text-slate-800">{r.margin.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Avg Discount:</span>
                <span className="text-slate-700">{r.avgDiscountPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Period Growth:</span>
                <span className={r.growth >= 0 ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>
                  {formatPercent(r.growth, true)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Regional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Regional Revenue, Cost & Net Profit Comparison
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Comparing top-line territory volume against cost structure and profit realization
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regions} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#334155' }} />
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
                <Bar dataKey="sales" name="Sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Cost" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Region × Category Revenue Decomposition
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Product category revenue mix across geographic territories
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={matrix} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#334155' }} />
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
                <Bar dataKey="Electronics" stackId="a" fill="#2563eb" />
                <Bar dataKey="Office Systems" stackId="a" fill="#0f172a" />
                <Bar dataKey="Infrastructure" stackId="a" fill="#059669" />
                <Bar dataKey="Security & Peripherals" stackId="a" fill="#d97706" />
                <Bar dataKey="Beverages & Hospitality" stackId="a" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Regional Audit Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Territory Profitability & Discount Pressure Audit
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-4 font-semibold">Region</th>
                <th className="py-2.5 px-4 font-semibold text-right">Active Customers</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Orders</th>
                <th className="py-2.5 px-4 font-semibold text-right">Units Sold</th>
                <th className="py-2.5 px-4 font-semibold text-right">Avg Discount</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Sales</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Cost</th>
                <th className="py-2.5 px-4 font-semibold text-right">Net Profit</th>
                <th className="py-2.5 px-4 font-semibold text-right">Margin %</th>
                <th className="py-2.5 px-4 font-semibold text-right">Period Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regions.map((r) => (
                <tr key={r.region} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{r.region}</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-700">
                    {formatNumber(r.customers)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-700">
                    {formatNumber(r.orders)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-700">
                    {formatNumber(r.quantity)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-700">
                    {r.avgDiscountPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right font-semibold text-slate-900">
                    {formatCurrency(r.sales)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-600">
                    {formatCurrency(r.cost)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right font-semibold text-emerald-700">
                    {formatCurrency(r.profit)}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-right font-semibold text-slate-800">
                    {r.margin.toFixed(1)}%
                  </td>
                  <td
                    className={`py-3 px-4 font-mono tabular-nums text-right font-semibold ${
                      r.growth >= 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {formatPercent(r.growth, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
