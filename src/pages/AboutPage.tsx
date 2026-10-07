import React from 'react';
import {
  CheckCircle2,
  ArrowDown,
  GraduationCap,
  Layers,
  Database,
  BrainCircuit,
  Sparkles,
} from 'lucide-react';

const PROJECT_OBJECTIVES = [
  '1. Collect and process raw enterprise sales data (CSV / XLSX).',
  '2. Clean and validate data (duplicates, missing values, date & category normalization).',
  '3. Store structured fact and dimension tables in PostgreSQL.',
  '4. Perform exploratory data analysis (EDA) across time, product, customer, and region.',
  '5. Calculate verified business KPIs dynamically without hardcoded statistics.',
  '6. Apply suitable machine learning techniques (Forecasting, RFM K-Means, Isolation Forest).',
  '7. Visualize business performance through an interactive enterprise BI dashboard.',
  '8. Use Google Gemini API to generate natural-language executive insights.',
  '9. Provide actionable, metric-backed management recommendations.',
  '10. Support data-driven decision making and external Power BI integration.',
];

const VIVA_WALKTHROUGH = [
  {
    stage: 'Input',
    title: 'Raw Sales Dataset',
    detail:
      'CSV / Excel XLSX upload or 6,500-row synthetic enterprise sales dataset with realistic seasonal, regional, and customer RFM patterns.',
  },
  {
    stage: 'Processing',
    title: 'Validation & Data Cleaning Pipeline',
    detail:
      'Automated column schema validation, composite duplicate removal, formula-based missing-value imputation, ISO-8601 date standardization, and IQR outlier tagging.',
  },
  {
    stage: 'Database & Analytics',
    title: 'PostgreSQL Storage & Exploratory Data Analysis',
    detail:
      'Normalized star-schema tables (sales, customers, products, predictions, ai_insights) powering dynamic KPI and cohort calculations.',
  },
  {
    stage: 'Machine Learning',
    title: 'Forecasting, RFM Clustering & Anomaly Detection',
    detail:
      'Gradient Boosting / Random Forest / OLS regression with holdout MAE, RMSE, R², MAPE; K-Means++ RFM segmentation with Silhouette Score; Isolation Forest anomaly detection.',
  },
  {
    stage: 'BI & Generative AI',
    title: 'Interactive Dashboard & Verified Gemini AI Insights',
    detail:
      'Verified JSON metrics passed to server-side Gemini 3.8 Flash under strict anti-fabrication guardrails to produce executive summaries and recommendations.',
  },
  {
    stage: 'Output',
    title: 'Data-Driven Business Decisions & Power BI Export',
    detail:
      'Actionable regional pricing reforms, inventory replenishment schedules, customer retention playbooks, and clean CSV exports for Power BI.',
  },
];

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Project Title & Problem Statement (Section 32) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-2">
          <GraduationCap className="w-4 h-4" />
          <span>M.Sc. Data Science Final-Year / Internship Project Documentation</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          AI-Powered Sales Analytics and Business Intelligence System
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5 pt-5 border-t border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Problem Statement</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Businesses generate large amounts of transactional sales data across regions, product categories, and customer segments, but extracting meaningful insights, accurate demand predictions, anomaly audits, and actionable recommendations manually is time-consuming and prone to analytical blind spots.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Proposed Solution</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              An integrated AI-powered sales analytics and business intelligence system that combines{' '}
              <span className="font-semibold text-slate-900">
                Data Analytics + SQL + Python + Machine Learning + Business Intelligence + Generative AI
              </span>{' '}
              into a unified pipeline to support faster, verifiable, and more informed business decisions.
            </p>
          </div>
        </div>
      </div>

      {/* 10 Project Objectives (Section 33) & System Architecture Diagram (Section 34) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Objectives */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            10 Core Project Objectives
          </h3>
          <ul className="space-y-2.5">
            {PROJECT_OBJECTIVES.map((obj) => (
              <li key={obj} className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual System Architecture Diagram (Section 34) */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            End-to-End System Architecture
          </h3>

          <div className="flex flex-col items-center space-y-2 text-xs">
            <div className="w-full max-w-md p-3 bg-slate-900 text-white rounded-md text-center font-semibold">
              USER / BUSINESS ANALYST
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400" />
            <div className="w-full max-w-md p-3 bg-blue-50 border border-blue-200 text-blue-950 rounded-md text-center">
              <div className="font-bold">REACT + TYPESCRIPT FRONTEND</div>
              <div className="text-[11px] text-blue-700">Interactive BI Dashboard · Recharts · Global Filters</div>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400" />
            <div className="w-full max-w-md p-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-md text-center">
              <div className="font-bold">FASTAPI / NODE ANALYTICS BACKEND</div>
              <div className="text-[11px] text-slate-500">REST APIs · Validation · Data Cleaning Pipeline</div>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400" />
            <div className="w-full max-w-md p-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-md text-center flex items-center justify-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-bold">POSTGRESQL DATABASE</div>
                <div className="text-[11px] text-slate-500">Relational Storage · SQLAlchemy · Indexed Tables</div>
              </div>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400" />
            <div className="w-full max-w-md p-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-md text-center flex items-center justify-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="font-bold">PYTHON ANALYTICS & EDA</div>
                <div className="text-[11px] text-slate-500">Pandas · NumPy · Dynamic KPI Computation</div>
              </div>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400" />
            <div className="w-full max-w-md p-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-md text-center flex items-center justify-center gap-2">
              <BrainCircuit className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-bold">MACHINE LEARNING ENGINE</div>
                <div className="text-[11px] text-slate-500">Scikit-learn · Forecasting · K-Means RFM · Isolation Forest</div>
              </div>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400" />
            <div className="w-full max-w-md p-3 bg-blue-600 text-white rounded-md text-center flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <div>
                <div className="font-bold">GOOGLE GEMINI API</div>
                <div className="text-[11px] text-blue-100">Verified Metrics Interpretation · Zero Hallucination</div>
              </div>
            </div>
            <ArrowDown className="w-4 h-4 text-slate-400" />
            <div className="w-full max-w-md p-3 bg-emerald-700 text-white rounded-md text-center font-semibold">
              ACTIONABLE BUSINESS RECOMMENDATIONS & DECISIONS
            </div>
          </div>
        </div>
      </div>

      {/* Academic Viva Demonstration Guide (Section 45) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Academic Viva & Project Review Walkthrough
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {VIVA_WALKTHROUGH.map((item, idx) => (
            <div key={item.stage} className="p-4 border border-slate-200 rounded-md bg-slate-50/40">
              <div className="text-xs font-mono font-bold text-blue-700">
                0{idx + 1}. {item.stage}
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1">{item.title}</div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
