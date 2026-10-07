import React, { useEffect, useState, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Code2,
} from 'lucide-react';
import { GlobalFilterState } from '../types/analytics';

interface AIInsightsPageProps {
  filters: GlobalFilterState;
  refreshTrigger: number;
}

export const AIInsightsPage: React.FC<AIInsightsPageProps> = ({
  filters,
  refreshTrigger,
}) => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [showVerifiedJson, setShowVerifiedJson] = useState(false);

  const fetchInsights = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      try {
        const res = await fetch('/api/ai/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters,
            forceRefresh,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setInsights(data);
        }
      } catch (e) {
        console.error('Error generating AI insights:', e);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchInsights(false);
  }, [fetchInsights, refreshTrigger]);

  if (loading && !insights) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-lg p-6 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-64 mb-3" />
          <div className="h-3.5 bg-slate-100 rounded w-full mb-2" />
          <div className="h-3.5 bg-slate-100 rounded w-4/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-white border border-slate-200 rounded-lg animate-pulse" />
          <div className="h-64 bg-white border border-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      {/* Top Header & Anti-Fabrication Verification Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Gemini AI Business Intelligence & Executive Recommendations
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Strict Anti-Fabrication Architecture: PostgreSQL, Python/TypeScript Analytics, and Scikit-learn ML models compute verified statistics first, then pass structured JSON to Google Gemini API (<span className="font-mono text-slate-700">{insights.modelUsed}</span>) for executive interpretation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowVerifiedJson((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-600" />
              {showVerifiedJson ? 'Hide Verified Metrics JSON' : 'Inspect Verified Input JSON'}
            </button>

            <button
              type="button"
              onClick={() => fetchInsights(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analyzing Verified Metrics...' : 'Regenerate Gemini Insights'}
            </button>
          </div>
        </div>

        {/* Service Notice if Fallback Mode Active (Section 29) */}
        {insights.source === 'rule-based-fallback' && insights.serviceNotice && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Fallback Mode Notice: </span>
              {insights.serviceNotice}
            </div>
          </div>
        )}

        {/* Collapsible Verified Input JSON Payload */}
        {showVerifiedJson && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Verified Analytical Metrics JSON Sent to Gemini API (Zero-Hallucination Source of Truth):
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-md text-xs font-mono overflow-x-auto max-h-72">
              {JSON.stringify(insights.verifiedPayload, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* 1. AI EXECUTIVE SUMMARY */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            AI Executive Summary
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Generated {new Date(insights.generatedAt).toLocaleTimeString()} · Source: {insights.modelUsed}
          </span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {insights.executiveSummary}
        </p>
      </div>

      {/* 2. KEY FINDINGS & FORECAST INTERPRETATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Key Analytical Findings
          </h3>
          <ul className="space-y-2.5">
            {insights.keyFindings?.map((finding: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              ML Forecast Interpretation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {insights.forecastInterpretation}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs font-mono space-y-1 text-slate-600">
            <div>Model: {insights.verifiedPayload?.forecast_model}</div>
            <div>Holdout R²: {insights.verifiedPayload?.forecast_r2}</div>
            <div>Holdout MAPE: {insights.verifiedPayload?.forecast_mape_pct}%</div>
          </div>
        </div>
      </div>

      {/* 3. BUSINESS RISKS & OPPORTUNITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Identified Business Risks
            </h3>
          </div>
          <ul className="space-y-2.5">
            {insights.businessRisks?.map((risk: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="font-mono font-bold text-red-600">0{idx + 1}.</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Strategic Growth Opportunities
            </h3>
          </div>
          <ul className="space-y-2.5">
            {insights.businessOpportunities?.map((opp: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="font-mono font-bold text-emerald-600">0{idx + 1}.</span>
                <span>{opp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. STRATEGIC RECOMMENDATIONS */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Actionable Management Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.recommendations?.map((rec: any, idx: number) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-md p-4 bg-slate-50/40 flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-medium text-blue-700">
                  {rec.category}
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {rec.action}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                <span>Impact: {rec.impact}</span>
                <span className="text-slate-700">{rec.metricReference}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. IMMEDIATE NEXT ACTIONS */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Recommended Executive Next Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.nextActions?.map((act: string, idx: number) => (
            <div
              key={idx}
              className="p-3.5 border border-slate-200 rounded-md flex items-start gap-2.5 text-xs text-slate-800"
            >
              <ArrowUpRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{act}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
