import React from 'react';
import {
  CheckCircle2,
  Database,
  ShieldCheck,
  ArrowRight,
  Code2,
} from 'lucide-react';
import {
  CleaningSummary,
  NavPageId,
  ValidationReport,
} from '../types/analytics';
import { formatNumber } from '../services/api';

interface DatabaseSchemaTable {
  tableName: string;
  rowCount: number;
  primaryKey: string;
  foreignKeys: string[];
  indexes: string[];
  description: string;
}

interface DataQualityPageProps {
  validationReport: ValidationReport | null;
  cleaningSummary: CleaningSummary | null;
  schemaSummary: {
    engine: string;
    status: string;
    lastSyncedAt: string;
    tables: DatabaseSchemaTable[];
  } | null;
  onNavigate: (page: NavPageId) => void;
}

export const DataQualityPage: React.FC<DataQualityPageProps> = ({
  validationReport,
  cleaningSummary,
  schemaSummary,
  onNavigate,
}) => {
  if (!cleaningSummary || !validationReport) return null;

  return (
    <div className="space-y-6">
      {/* Data Cleaning Summary Card (Section 9) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Data Cleaning & Normalization Summary
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated ETL preprocessing report for <span className="font-mono text-slate-700">{validationReport.datasetName}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Explore Cleaned Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-5">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div className="text-xs text-slate-500">Original Rows</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {formatNumber(cleaningSummary.originalRows)}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div className="text-xs text-slate-500">Duplicates Removed</div>
            <div className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1">
              {formatNumber(cleaningSummary.duplicatesRemoved)}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div className="text-xs text-slate-500">Missing Values Imputed</div>
            <div className="text-xl font-bold text-blue-700 font-mono tabular-nums mt-1">
              {formatNumber(cleaningSummary.missingValuesImputed)}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div className="text-xs text-slate-500">Invalid Records Removed</div>
            <div className="text-xl font-bold text-red-600 font-mono tabular-nums mt-1">
              {formatNumber(cleaningSummary.invalidRecordsRemoved)}
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-md">
            <div className="text-xs text-emerald-800 font-medium">Final Clean Rows</div>
            <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
              {formatNumber(cleaningSummary.finalRows)}
            </div>
          </div>
        </div>

        {/* Step-by-Step Pipeline Execution Table */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Executed Data Quality Transformation Steps
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-4 font-semibold">Transformation Stage</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Records Affected</th>
                  <th className="py-2.5 px-4 font-semibold">Method & Domain Formula</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cleaningSummary.cleaningSteps.map((step) => (
                  <tr key={step.step} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {step.step}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-right text-slate-800 font-medium">
                      {formatNumber(step.affectedRows)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {step.description}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {step.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PostgreSQL Database Schema & Indexing Architecture (Section 10) */}
      {schemaSummary && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  PostgreSQL Relational Schema & Index Catalog
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {schemaSummary.engine} · Status: <span className="text-emerald-700 font-semibold">{schemaSummary.status}</span>
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Parameterized SQL Queries & Foreign Key Integrity Enabled</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {schemaSummary.tables.map((tbl) => (
              <div
                key={tbl.tableName}
                className="border border-slate-200 rounded-md p-4 bg-slate-50/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {tbl.tableName}
                    </span>
                    <span className="font-mono tabular-nums text-xs text-blue-700 font-semibold">
                      {formatNumber(tbl.rowCount)} rows
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">{tbl.description}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1 text-[11px] font-mono text-slate-600">
                  <div>
                    <span className="text-slate-400">PK:</span> {tbl.primaryKey}
                  </div>
                  {tbl.foreignKeys.length > 0 && (
                    <div>
                      <span className="text-slate-400">FK:</span> {tbl.foreignKeys.join(', ')}
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">IDX:</span> {tbl.indexes.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SQL DDL Preview */}
          <div className="mt-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              <span>PostgreSQL DDL Definition (sales, customers, products, predictions, ai_insights)</span>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-md text-xs font-mono overflow-x-auto leading-relaxed">
{`CREATE TABLE customers (
  customer_id VARCHAR(32) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  rfm_recency_days INT NOT NULL,
  rfm_frequency INT NOT NULL,
  rfm_monetary NUMERIC(12,2) NOT NULL,
  customer_segment VARCHAR(64) NOT NULL
);

CREATE TABLE products (
  product_id VARCHAR(32) PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0)
);

CREATE TABLE sales (
  id BIGSERIAL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  order_date DATE NOT NULL,
  customer_id VARCHAR(32) NOT NULL REFERENCES customers(customer_id),
  product_id VARCHAR(32) NOT NULL REFERENCES products(product_id),
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(128) NOT NULL,
  region VARCHAR(64) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  discount NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  sales NUMERIC(12,2) NOT NULL,
  cost NUMERIC(12,2) NOT NULL,
  profit NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_sales_order_date ON sales(order_date);
CREATE INDEX idx_sales_category ON sales(category);
CREATE INDEX idx_sales_region ON sales(region);`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
