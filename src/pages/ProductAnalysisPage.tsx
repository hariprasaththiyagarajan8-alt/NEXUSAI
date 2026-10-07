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
import { GlobalFilterState, ProductPerformanceItem } from '../types/analytics';
import {
  buildFilterQueryString,
  formatCurrency,
  formatNumber,
} from '../services/api';

interface ProductAnalysisPageProps {
  filters: GlobalFilterState;
  refreshTrigger: number;
}

export const ProductAnalysisPage: React.FC<ProductAnalysisPageProps> = ({
  filters,
  refreshTrigger,
}) => {
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<ProductPerformanceItem[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformanceItem[]>([]);
  const [bottomProducts, setBottomProducts] = useState<ProductPerformanceItem[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const qs = buildFilterQueryString(filters);
        const res = await fetch(`/api/products${qs}`);
        if (res.ok && active) {
          const data = await res.json();
          setAllProducts(data.allProducts || []);
          setTopProducts(data.topProductsBySales || []);
          setBottomProducts(data.bottomProductsBySales || []);
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

  if (loading && allProducts.length === 0) {
    return <div className="h-96 bg-white border border-slate-200 rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            SKU-Level Product Performance & Profitability Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluating top revenue drivers, bottom-performing SKUs, unit economics, and discount erosion across {allProducts.length} active products
          </p>
        </div>
      </div>

      {/* Top vs Bottom Products Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Sales & Profit */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Top Performing Products (Sales vs. Profit)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Highest revenue-generating SKUs and their net profit contribution
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts.slice(0, 8)}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  width={150}
                  tick={{ fontSize: 11, fill: '#334155' }}
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
                <Bar dataKey="sales" name="Sales" fill="#2563eb" radius={[0, 4, 4, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Products by Sales */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Bottom Performing Products
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Lowest revenue SKUs requiring promotional bundling or catalog review
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bottomProducts.slice(0, 8)}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  width={150}
                  tick={{ fontSize: 11, fill: '#334155' }}
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
                <Bar dataKey="sales" name="Sales" fill="#64748b" radius={[0, 4, 4, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#d97706" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Complete Product Catalog Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Complete Product Sales, Cost & Margin Ledger
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive SKU profitability table ordered by total revenue
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-4 font-semibold">SKU ID</th>
                <th className="py-2.5 px-4 font-semibold">Product Name</th>
                <th className="py-2.5 px-4 font-semibold">Category</th>
                <th className="py-2.5 px-4 font-semibold text-right">Orders</th>
                <th className="py-2.5 px-4 font-semibold text-right">Units Sold</th>
                <th className="py-2.5 px-4 font-semibold text-right">Unit Price</th>
                <th className="py-2.5 px-4 font-semibold text-right">Avg Discount</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Sales</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Cost</th>
                <th className="py-2.5 px-4 font-semibold text-right">Net Profit</th>
                <th className="py-2.5 px-4 font-semibold text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allProducts.map((p) => (
                <tr key={p.productId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono text-slate-600">{p.productId}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{p.productName}</td>
                  <td className="py-2.5 px-4 text-slate-600">{p.category}</td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-700">
                    {formatNumber(p.orders)}
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-700">
                    {formatNumber(p.quantity)}
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-700">
                    {formatCurrency(p.avgUnitPrice)}
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-600">
                    {p.avgDiscountPct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-900 font-medium">
                    {formatCurrency(p.sales)}
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-600">
                    {formatCurrency(p.cost)}
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right text-emerald-700 font-medium">
                    {formatCurrency(p.profit)}
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right font-semibold text-slate-800">
                    {p.margin.toFixed(1)}%
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
