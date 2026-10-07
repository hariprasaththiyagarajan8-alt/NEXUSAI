import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Table,
  BarChart3,
  BrainCircuit,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { GlobalFilterState } from '../types/analytics';
import {
  buildFilterQueryString,
  formatCurrency,
  formatNumber,
} from '../services/api';

interface ReportsPageProps {
  filters: GlobalFilterState;
  refreshTrigger: number;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  filters,
  refreshTrigger,
}) => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    let active = true;
    async function loadReport() {
      setLoading(true);
      try {
        const qs = buildFilterQueryString(filters);
        const res = await fetch(`/api/reports${qs}`);
        if (res.ok && active) {
          const data = await res.json();
          setReport(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReport();
    return () => {
      active = false;
    };
  }, [filters, refreshTrigger]);

  const handleDownloadCsv = (type: string) => {
    const qs = buildFilterQueryString(filters, { type });
    window.location.href = `/api/export/csv${qs}`;
  };

  const handleDownloadMarkdownReport = () => {
    if (!report) return;
    const m = report.verifiedMetrics;
    const ai = report.aiInsights;
    const md = `# NEXUSBI EXECUTIVE BUSINESS INTELLIGENCE REPORT
Generated: ${new Date(report.generatedAt).toLocaleString()}
Dataset: ${m.dataset_name} (${m.is_demo_data ? 'DEMO DATA' : 'USER UPLOADED'})
Date Range: ${m.date_range.start} to ${m.date_range.end}

## 1. EXECUTIVE SUMMARY
${ai?.executiveSummary || 'N/A'}

## 2. VERIFIED BUSINESS KPIs
- Total Sales: ${formatCurrency(m.total_sales)}
- Total Net Profit: ${formatCurrency(m.total_profit)}
- Profit Margin: ${m.profit_margin_pct}%
- Total Orders: ${formatNumber(m.total_orders)}
- Average Order Value: ${formatCurrency(m.average_order_value)}
- Sales Growth: ${m.sales_growth_pct}%
- Top Category: ${m.top_category.name} (${formatCurrency(m.top_category.sales)}, ${m.top_category.share_pct}% share)
- Top Product: ${m.top_product.name} (${formatCurrency(m.top_product.sales)} sales, ${formatCurrency(m.top_product.profit)} profit)
- Leading Region: ${m.top_region.name} (${formatCurrency(m.top_region.sales)}, ${m.top_region.margin_pct}% margin)
- Weakest Region: ${m.weak_region.name} (${formatCurrency(m.weak_region.sales)}, ${m.weak_region.margin_pct}% margin, ${m.weak_region.growth_pct}% growth)

## 3. MACHINE LEARNING RESULTS
- Selected Forecasting Model: ${m.forecast_model} (R² = ${m.forecast_r2}, MAPE = ${m.forecast_mape_pct}%)
- Next Month Projected Sales: ${formatCurrency(m.forecast_next_month)} (${m.forecast_growth_pct}%)
- Customer Segmentation (RFM K-Means): ${m.top_customer_segment.count} accounts in ${m.top_customer_segment.name} (${formatCurrency(m.top_customer_segment.revenue)}), ${m.at_risk_customers_count} At-Risk accounts
- Anomaly Detection (Isolation Forest): ${m.anomalies_detected} suspicious orders detected (${m.anomaly_rate_pct}% anomaly rate)

## 4. KEY FINDINGS
${(ai?.keyFindings || []).map((f: string) => `- ${f}`).join('\n')}

## 5. BUSINESS RISKS
${(ai?.businessRisks || []).map((r: string) => `- ${r}`).join('\n')}

## 6. BUSINESS OPPORTUNITIES
${(ai?.businessOpportunities || []).map((o: string) => `- ${o}`).join('\n')}

## 7. ACTIONABLE RECOMMENDATIONS
${(ai?.recommendations || []).map((rec: any) => `- **${rec.title}** (${rec.category}): ${rec.action} [${rec.metricReference}]`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NexusBI_Executive_Report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !report) {
    return <div className="h-96 bg-white border border-slate-200 rounded-lg animate-pulse" />;
  }
  if (!report) return null;

  const m = report.verifiedMetrics;
  const ai = report.aiInsights;

  return (
    <div className="space-y-6">
      {/* Power BI Export Hub (Section 35) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Power BI Export & External BI Integration Layer
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Export clean star-schema analytical tables for direct ingestion into Microsoft Power BI, Tableau, or Python notebooks. Recommended Power BI workbook pages: Executive Dashboard, Sales Analysis, Product Analysis, Customer Analysis, Regional Analysis, ML Insights, and AI Recommendations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-4 border border-slate-200 rounded-md bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Table className="w-4 h-4 text-blue-600" />
                <span>1. Clean Sales Fact Table</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Validated, deduplicated, and normalized transaction rows with RFM segment and outlier flags.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadCsv('sales')}
              className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Fact CSV
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-md bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>2. Verified KPI Summary</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Aggregated executive metrics (Total Sales, Profit, AOV, Margin, Growth, Top Leaders).
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadCsv('kpis')}
              className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export KPI CSV
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-md bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <BrainCircuit className="w-4 h-4 text-blue-600" />
                <span>3. ML Forecast Output</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Historical actuals, holdout validation predictions, and future horizon confidence intervals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadCsv('ml_forecast')}
              className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Forecast CSV
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-md bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Users className="w-4 h-4 text-amber-600" />
                <span>4. Customer RFM Segments</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Customer dimension table with Recency, Frequency, Monetary metrics and K-Means cluster labels.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadCsv('customer_segments')}
              className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export RFM CSV
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive Consolidated Executive Report (Section 36) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Consolidated Executive & Viva Demonstration Report
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dataset: <span className="font-mono text-slate-700">{m.dataset_name}</span> · Period: {m.date_range.start} to {m.date_range.end}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadMarkdownReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Report (.MD)
            </button>
          </div>
        </div>

        <div className="space-y-6 mt-5 text-xs text-slate-700">
          {/* Section 1: Executive Summary */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-1.5">
              01. Executive Summary
            </h4>
            <p className="leading-relaxed bg-slate-50 p-4 rounded border border-slate-200">
              {ai?.executiveSummary}
            </p>
          </div>

          {/* Section 2: Sales, Product, Customer & Regional Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-slate-200 rounded-md">
              <div className="font-bold text-slate-900 mb-2">02. Sales Performance</div>
              <div className="space-y-1 font-mono tabular-nums">
                <div>Total Sales: {formatCurrency(m.total_sales)}</div>
                <div>Net Profit: {formatCurrency(m.total_profit)}</div>
                <div>Profit Margin: {m.profit_margin_pct}%</div>
                <div>Total Orders: {formatNumber(m.total_orders)}</div>
                <div>Period Growth: {m.sales_growth_pct}%</div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-md">
              <div className="font-bold text-slate-900 mb-2">03. Product Performance</div>
              <div className="space-y-1">
                <div>
                  Top Category: <span className="font-semibold">{m.top_category.name}</span> ({m.top_category.share_pct}%)
                </div>
                <div>
                  Top Product: <span className="font-semibold">{m.top_product.name}</span>
                </div>
                <div className="font-mono tabular-nums">
                  Top SKU Sales: {formatCurrency(m.top_product.sales)}
                </div>
                <div className="font-mono tabular-nums">
                  Top SKU Profit: {formatCurrency(m.top_product.profit)}
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-md">
              <div className="font-bold text-slate-900 mb-2">04. Customer Analysis</div>
              <div className="space-y-1">
                <div>
                  Top RFM Cluster: <span className="font-semibold">{m.top_customer_segment.name}</span> ({m.top_customer_segment.count} accts)
                </div>
                <div className="font-mono tabular-nums">
                  Cluster Revenue: {formatCurrency(m.top_customer_segment.revenue)}
                </div>
                <div className="font-mono tabular-nums text-amber-700">
                  At-Risk Accounts: {m.at_risk_customers_count}
                </div>
                <div className="font-mono tabular-nums">
                  Silhouette Score: {report.mlSummary.segmentation.silhouetteScore}
                </div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-md">
              <div className="font-bold text-slate-900 mb-2">05. Regional Analysis</div>
              <div className="space-y-1">
                <div>
                  Leading: <span className="font-semibold">{m.top_region.name}</span> ({formatCurrency(m.top_region.sales, true)}, {m.top_region.margin_pct}%)
                </div>
                <div>
                  Weakest: <span className="font-semibold">{m.weak_region.name}</span> ({formatCurrency(m.weak_region.sales, true)}, {m.weak_region.margin_pct}%)
                </div>
                <div className="font-mono tabular-nums text-red-600">
                  Weak Region Growth: {m.weak_region.growth_pct}%
                </div>
                <div className="font-mono tabular-nums">
                  Loss Orders: {m.negative_margin_orders_count}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: ML Results & AI Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-md">
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                06. Machine Learning Evaluation Summary
              </h4>
              <ul className="space-y-1.5 font-mono text-xs text-slate-700">
                <li>• Forecasting Model: {m.forecast_model}</li>
                <li>• Holdout R² = {m.forecast_r2} · MAPE = {m.forecast_mape_pct}%</li>
                <li>• Next-Month Forecast: {formatCurrency(m.forecast_next_month)} ({m.forecast_growth_pct}%)</li>
                <li>• Isolation Forest Anomalies: {m.anomalies_detected} orders ({m.anomaly_rate_pct}%)</li>
              </ul>
            </div>

            <div className="p-4 border border-slate-200 rounded-md">
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                07. Strategic Recommendations & Next Steps
              </h4>
              <ul className="space-y-1.5">
                {ai?.recommendations?.map((r: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>{r.title}:</strong> {r.action}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
