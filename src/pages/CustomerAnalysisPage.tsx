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
import { GlobalFilterState } from '../types/analytics';
import {
  buildFilterQueryString,
  formatCurrency,
  formatNumber,
} from '../services/api';

interface CustomerSegmentCluster {
  clusterId: number;
  segmentName: string;
  customerCount: number;
  percentage: number;
  avgRecencyDays: number;
  avgFrequency: number;
  avgMonetary: number;
  totalRevenue: number;
  avgMargin: number;
  description: string;
  recommendedAction: string;
}

interface TopCustomerItem {
  customerId: string;
  customerName: string;
  recency: number;
  frequency: number;
  monetary: number;
  profit: number;
  segment: string;
}

interface CustomerAnalysisPageProps {
  filters: GlobalFilterState;
  refreshTrigger: number;
}

export const CustomerAnalysisPage: React.FC<CustomerAnalysisPageProps> = ({
  filters,
  refreshTrigger,
}) => {
  const [loading, setLoading] = useState(true);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [avgCustomerValue, setAvgCustomerValue] = useState(0);
  const [avgPurchaseFrequency, setAvgPurchaseFrequency] = useState(0);
  const [silhouetteScore, setSilhouetteScore] = useState(0);
  const [segments, setSegments] = useState<CustomerSegmentCluster[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomerItem[]>([]);
  const [freqDist, setFreqDist] = useState<{ label: string; count: number }[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const qs = buildFilterQueryString(filters);
        const res = await fetch(`/api/customers${qs}`);
        if (res.ok && active) {
          const data = await res.json();
          setTotalCustomers(data.totalCustomers || 0);
          setAvgCustomerValue(data.avgCustomerValue || 0);
          setAvgPurchaseFrequency(data.avgPurchaseFrequency || 0);
          setSilhouetteScore(data.silhouetteScore || 0);
          setSegments(data.segments || []);
          setTopCustomers(data.topCustomers || []);
          setFreqDist(data.frequencyDistribution || []);
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

  if (loading && totalCustomers === 0) {
    return <div className="h-96 bg-white border border-slate-200 rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Customer KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Total Active Customers</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5">
            {formatNumber(totalCustomers)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Distinct enterprise accounts in scope
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Average Customer Lifetime Value</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5">
            {formatCurrency(avgCustomerValue)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Formula: <span className="font-mono text-slate-700">Total Revenue ÷ Customers</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Average Purchase Frequency</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5">
            {avgPurchaseFrequency} orders
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Mean order count per account
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">RFM K-Means Silhouette Score</div>
          <div className="text-2xl font-bold text-blue-700 font-mono tabular-nums mt-1.5">
            {silhouetteScore.toFixed(4)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Cluster separation across Recency, Frequency & Monetary
          </div>
        </div>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {segments.map((seg) => (
          <div
            key={seg.segmentName}
            className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{seg.segmentName}</span>
                <span className="text-xs font-mono tabular-nums text-blue-700 font-semibold">
                  {seg.customerCount} ({seg.percentage}%)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{seg.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs font-mono tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Avg Monetary:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(seg.avgMonetary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Avg Frequency:</span>
                <span className="text-slate-800">{seg.avgFrequency} orders</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Avg Recency:</span>
                <span className="text-slate-800">{seg.avgRecencyDays} days ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Segment Revenue:</span>
                <span className="text-emerald-700 font-semibold">{formatCurrency(seg.totalRevenue, true)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row: Segment Revenue vs Frequency Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Revenue & Account Count by RFM Segment
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            K-Means clustering output across Recency, Frequency, and Monetary dimensions
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segments} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="segmentName" tick={{ fontSize: 11, fill: '#334155' }} />
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
                <Bar dataKey="totalRevenue" name="Total Segment Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgMonetary" name="Avg Spend per Customer" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Customer Purchase Frequency Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Number of customers grouped by total repeat order count
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqDist} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#334155' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Customer Count" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 25 Customers Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Top 25 Enterprise Customers by Monetary Value
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual account RFM profiles and K-Means segment classifications
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-4 font-semibold">Customer ID</th>
                <th className="py-2.5 px-4 font-semibold">Account Name</th>
                <th className="py-2.5 px-4 font-semibold">RFM Segment</th>
                <th className="py-2.5 px-4 font-semibold text-right">Recency (Days)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Frequency (Orders)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Monetary (Sales)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topCustomers.map((c) => (
                <tr key={c.customerId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono text-slate-600">{c.customerId}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{c.customerName}</td>
                  <td className="py-2.5 px-4 font-medium text-blue-700">{c.segment}</td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-700">
                    {c.recency}d
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-700">
                    {c.frequency}
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right font-semibold text-slate-900">
                    {formatCurrency(c.monetary)}
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-right font-medium text-emerald-700">
                    {formatCurrency(c.profit)}
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
