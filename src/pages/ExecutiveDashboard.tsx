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
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Sparkles,
  BrainCircuit,
  Database,
} from 'lucide-react';
import {
  BusinessKPIs,
  CategoryBreakdown,
  GlobalFilterState,
  MonthlyTrendPoint,
  NavPageId,
  ProductPerformanceItem,
  RegionBreakdown,
} from '../types/analytics';
import {
  buildFilterQueryString,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../services/api';
import { SalesDataTable } from '../components/SalesDataTable';

interface ExecutiveDashboardProps {
  filters: GlobalFilterState;
  onNavigate: (page: NavPageId) => void;
  refreshTrigger: number;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  filters,
  onNavigate,
  refreshTrigger,
}) => {
  const [loading, setLoading] = useState(true);
  const [recordCount, setRecordCount] = useState(0);
  const [isDemoData, setIsDemoData] = useState(true);
  const [datasetName, setDatasetName] = useState('');
  const [kpis, setKpis] = useState<BusinessKPIs | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [regions, setRegions] = useState<RegionBreakdown[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformanceItem[]>([]);

  useEffect(() => {
    let active = true;
    async function loadOverview() {
      setLoading(true);
      try {
        const qs = buildFilterQueryString(filters);
        const res = await fetch(`/api/sales/overview${qs}`);
        if (res.ok && active) {
          const data = await res.json();
          setRecordCount(data.recordCount || 0);
          setIsDemoData(Boolean(data.isDemoData));
          setDatasetName(data.datasetName || '');
          setKpis(data.kpis);
          setMonthlyTrends(data.monthlyTrends || []);
          setCategories(data.categories || []);
          setRegions(data.regions || []);
          setTopProducts(data.topProducts || []);
        }
      } catch (err) {
        console.error('Failed to load executive overview:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadOverview();
    return () => {
      active = false;
    };
  }, [filters, refreshTrigger]);

  if (loading && !kpis) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-lg p-5" />
          ))}
        </div>
        <div className="h-80 bg-white border border-slate-200 rounded-lg" />
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="space-y-6">
      {/* Dataset Source & Quick Pipeline Strip */}
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <Database className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-900">{datasetName}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{formatNumber(recordCount)} active rows</span>
          <span aria-hidden="true">·</span>
          <span className={isDemoData ? 'text-amber-700 font-medium' : 'text-emerald-700 font-medium'}>
            {isDemoData ? 'DEMO DATA (Synthetic Enterprise Sample)' : 'USER UPLOADED DATASET'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('ml')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
            Run ML Forecasting & RFM
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ai')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Gemini AI Insights
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Sales */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Total Sales (Revenue)</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5">
            {formatCurrency(kpis.totalSales, true)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-mono tabular-nums">
            {kpis.salesGrowth >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-600 shrink-0" />
            )}
            <span className={kpis.salesGrowth >= 0 ? 'text-emerald-700 font-medium' : 'text-red-600 font-medium'}>
              {formatPercent(kpis.salesGrowth, true)}
            </span>
            <span className="text-slate-400 font-sans">vs prior period</span>
          </div>
        </div>

        {/* 2. Total Profit */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Total Net Profit</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5">
            {formatCurrency(kpis.totalProfit, true)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
            <span>Cost: {formatCurrency(kpis.totalCost, true)}</span>
            <span aria-hidden="true">·</span>
            <span className={kpis.profitGrowth >= 0 ? 'text-emerald-700' : 'text-red-600'}>
              {formatPercent(kpis.profitGrowth, true)}
            </span>
          </div>
        </div>

        {/* 3. Profit Margin */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Profit Margin</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5">
            {formatPercent(kpis.profitMargin)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Formula: <span className="font-mono text-slate-700">(Profit ÷ Sales) × 100</span>
          </div>
        </div>

        {/* 4. Total Orders & Quantity */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Total Orders</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5">
            {formatNumber(kpis.totalOrders)}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
            {formatNumber(kpis.totalQuantity)} units · {formatNumber(kpis.totalCustomers)} customers
          </div>
        </div>

        {/* 5. Average Order Value */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Average Order Value (AOV)</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5">
            {formatCurrency(kpis.averageOrderValue)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Formula: <span className="font-mono text-slate-700">Sales ÷ Orders</span>
          </div>
        </div>
      </div>

      {/* Secondary Dimension Leader Strip (Top Category, Top Product, Top Region, Weakest Region) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <div className="text-xs text-slate-500">Top Performing Category</div>
          <div className="text-sm font-semibold text-slate-900 mt-1 truncate">
            {kpis.topCategory.name}
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums mt-1">
            {formatCurrency(kpis.topCategory.sales, true)} · {kpis.topCategory.share}% share
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <div className="text-xs text-slate-500">Highest Revenue Product</div>
          <div className="text-sm font-semibold text-slate-900 mt-1 truncate" title={kpis.topProduct.name}>
            {kpis.topProduct.name}
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums mt-1">
            {formatCurrency(kpis.topProduct.sales, true)} sales · {formatCurrency(kpis.topProduct.profit, true)} profit
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <div className="text-xs text-slate-500">Leading Region</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">
            {kpis.topRegion.name} Region
          </div>
          <div className="text-xs text-emerald-700 font-mono tabular-nums mt-1">
            {formatCurrency(kpis.topRegion.sales, true)} · {kpis.topRegion.margin}% margin
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5">
          <div className="text-xs text-slate-500">Underperforming Region</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">
            {kpis.weakRegion.name} Region
          </div>
          <div className="text-xs text-amber-700 font-mono tabular-nums mt-1">
            {formatCurrency(kpis.weakRegion.sales, true)} · {kpis.weakRegion.margin}% margin ({formatPercent(kpis.weakRegion.growth, true)} growth)
          </div>
        </div>
      </div>

      {/* Main Charts Row: Sales & Profit Trend + Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales & Profit Trajectory */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Revenue, Net Profit & 3-Month Moving Average
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly aggregated time-series across validated transactions
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sales')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Full Trend Analysis <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrends} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
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
                  name="Monthly Sales"
                  fill="#dbeafe"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="movingAvg3M"
                  name="3M Moving Avg"
                  stroke="#0f172a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Net Profit"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales & Profit by Category */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Sales by Category
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Revenue vs. Profit contribution per product line
              </p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categories}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
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
                  dataKey="category"
                  width={115}
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
                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row: Regional Performance & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Region */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Regional Performance & Margin Audit
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Identifying regional profitability and discount pressure
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('regions')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Regional Deep Dive <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3 font-semibold">Region</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Sales</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Profit</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Margin</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Avg Discount</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {regions.map((reg) => (
                  <tr key={reg.region} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {reg.region}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-800">
                      {formatCurrency(reg.sales)}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-emerald-700 font-medium">
                      {formatCurrency(reg.profit)}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-700">
                      {reg.margin.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-600">
                      {reg.avgDiscountPct.toFixed(1)}%
                    </td>
                    <td
                      className={`py-2.5 px-3 font-mono tabular-nums text-right font-medium ${
                        reg.growth >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {formatPercent(reg.growth, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Top Performing Products
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ranked by verified total revenue and net profit contribution
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              All Products <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3 font-semibold">Product Name</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Sales</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Profit</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.map((prod) => (
                  <tr key={prod.productId} className="hover:bg-slate-50">
                    <td
                      className="py-2.5 px-3 font-medium text-slate-900 max-w-[180px] truncate"
                      title={prod.productName}
                    >
                      {prod.productName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {prod.category}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-700">
                      {formatNumber(prod.quantity)}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-800 font-medium">
                      {formatCurrency(prod.sales)}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-emerald-700 font-medium">
                      {formatCurrency(prod.profit)}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-700">
                      {prod.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive Sales Data Table */}
      <SalesDataTable filters={filters} refreshTrigger={refreshTrigger} />
    </div>
  );
};
