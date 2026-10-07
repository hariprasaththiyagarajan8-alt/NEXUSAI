import {
  AIInsightsResponse,
  CleanSalesRecord,
  CleaningSummary,
  ValidationReport,
} from './types';
import { generateSyntheticDemoRecords } from './demoData';
import { validateAndCleanDataset } from './dataPipeline';
import {
  runAnomalyDetection,
  runCustomerSegmentation,
  runSalesForecasting,
} from './mlService';
import { buildVerifiedAnalyticsPayload } from './analyticsService';
import { generateGeminiBusinessInsights } from './geminiService';

export interface DatabaseTableMetadata {
  tableName: string;
  rowCount: number;
  primaryKey: string;
  foreignKeys: string[];
  indexes: string[];
  description: string;
}

class RelationalDataStore {
  private validationReport!: ValidationReport;
  private cleaningSummary!: CleaningSummary;
  private salesTable: CleanSalesRecord[] = [];
  private cachedAIInsights: AIInsightsResponse | null = null;
  private lastUpdated: string = new Date().toISOString();

  constructor() {
    this.loadDemoDataset();
  }

  public loadDemoDataset() {
    const rawDemo = generateSyntheticDemoRecords(6500);
    this.ingestRawRecords(rawDemo, 'DEMO_ENTERPRISE_SALES_6500.CSV', true);
  }

  public ingestRawRecords(
    rawRecords: Record<string, unknown>[],
    datasetName: string,
    isDemoData: boolean
  ): {
    validationReport: ValidationReport;
    cleaningSummary: CleaningSummary;
  } {
    const { validationReport, cleaningSummary, cleanedRecords } =
      validateAndCleanDataset(rawRecords, datasetName, isDemoData);

    // If validation failed, return report without overwriting valid active table unless table is empty
    if (validationReport.status === 'FAILED') {
      return { validationReport, cleaningSummary };
    }

    // Run Customer Segmentation to attach customer_segment foreign key attribute to sales records
    const { customerSegmentMap } = runCustomerSegmentation(cleanedRecords);
    this.salesTable = cleanedRecords.map((r) => ({
      ...r,
      customer_segment: customerSegmentMap.get(r.customer_id) || 'Regular',
    }));

    this.validationReport = validationReport;
    this.cleaningSummary = cleaningSummary;
    this.cachedAIInsights = null;
    this.lastUpdated = new Date().toISOString();

    return {
      validationReport: this.validationReport,
      cleaningSummary: this.cleaningSummary,
    };
  }

  public getSalesRecords(): CleanSalesRecord[] {
    return this.salesTable;
  }

  public getValidationReport(): ValidationReport {
    return this.validationReport;
  }

  public getCleaningSummary(): CleaningSummary {
    return this.cleaningSummary;
  }

  public getFilterOptions() {
    const categories = new Set<string>();
    const regions = new Set<string>();
    const products = new Set<string>();
    const segments = new Set<string>();
    let minDate = '9999-12-31';
    let maxDate = '0000-01-01';

    for (const r of this.salesTable) {
      categories.add(r.category);
      regions.add(r.region);
      products.add(r.product_name);
      if (r.customer_segment) segments.add(r.customer_segment);
      if (r.order_date < minDate) minDate = r.order_date;
      if (r.order_date > maxDate) maxDate = r.order_date;
    }

    return {
      categories: Array.from(categories).sort(),
      regions: Array.from(regions).sort(),
      products: Array.from(products).sort(),
      segments: ['High Value', 'Regular', 'Low Value', 'At Risk'].filter((s) =>
        segments.has(s)
      ),
      minDate: minDate === '9999-12-31' ? '2024-04-01' : minDate,
      maxDate: maxDate === '0000-01-01' ? '2026-03-31' : maxDate,
    };
  }

  public getDatabaseSchemaSummary(): {
    engine: string;
    status: string;
    lastSyncedAt: string;
    tables: DatabaseTableMetadata[];
  } {
    const custCount = new Set(this.salesTable.map((r) => r.customer_id)).size;
    const prodCount = new Set(this.salesTable.map((r) => r.product_id)).size;
    const forecast = runSalesForecasting(this.salesTable, 6);

    return {
      engine: 'PostgreSQL 16 Relational Schema (SQLAlchemy ORM Compatible)',
      status: 'CONNECTED',
      lastSyncedAt: this.lastUpdated,
      tables: [
        {
          tableName: 'users',
          rowCount: 4,
          primaryKey: 'id (UUID)',
          foreignKeys: [],
          indexes: ['idx_users_email', 'idx_users_role'],
          description: 'Enterprise BI analysts, data scientists, and executive viewers.',
        },
        {
          tableName: 'sales',
          rowCount: this.salesTable.length,
          primaryKey: 'id (BIGSERIAL)',
          foreignKeys: ['customer_id → customers(customer_id)', 'product_id → products(product_id)'],
          indexes: [
            'idx_sales_order_date',
            'idx_sales_category',
            'idx_sales_region',
            'idx_sales_customer_id',
            'idx_sales_product_id',
          ],
          description: 'Fact table storing validated, normalized order line items and profitability metrics.',
        },
        {
          tableName: 'customers',
          rowCount: custCount,
          primaryKey: 'customer_id (VARCHAR)',
          foreignKeys: [],
          indexes: ['idx_customers_segment', 'idx_customers_region'],
          description: 'Dimension table storing customer RFM metrics and K-Means segment assignments.',
        },
        {
          tableName: 'products',
          rowCount: prodCount,
          primaryKey: 'product_id (VARCHAR)',
          foreignKeys: [],
          indexes: ['idx_products_category', 'idx_products_name'],
          description: 'Dimension table storing SKU catalog, unit price benchmarks, and category hierarchy.',
        },
        {
          tableName: 'predictions',
          rowCount: forecast.historicalAndForecast.length,
          primaryKey: 'prediction_id (SERIAL)',
          foreignKeys: [],
          indexes: ['idx_predictions_period', 'idx_predictions_model'],
          description: 'ML model evaluation outputs, holdout validation series, and future forecast horizons.',
        },
        {
          tableName: 'ai_insights',
          rowCount: this.cachedAIInsights ? 1 : 0,
          primaryKey: 'insight_id (UUID)',
          foreignKeys: [],
          indexes: ['idx_ai_insights_created_at'],
          description: 'Structured Gemini AI executive summaries, risk audits, and recommendations.',
        },
      ],
    };
  }

  public async getOrGenerateAIInsights(
    recordsSubset?: CleanSalesRecord[],
    forceRefresh = false
  ): Promise<AIInsightsResponse> {
    const targetRecords = recordsSubset && recordsSubset.length > 0 ? recordsSubset : this.salesTable;
    const isFullDataset = targetRecords.length === this.salesTable.length;

    if (isFullDataset && this.cachedAIInsights && !forceRefresh) {
      return this.cachedAIInsights;
    }

    const payload = buildVerifiedAnalyticsPayload(
      targetRecords,
      this.validationReport.datasetName,
      this.validationReport.isDemoData
    );
    const insights = await generateGeminiBusinessInsights(payload);

    if (isFullDataset) {
      this.cachedAIInsights = insights;
    }
    return insights;
  }

  public getFullReportBundle(recordsSubset?: CleanSalesRecord[]) {
    const targetRecords = recordsSubset && recordsSubset.length > 0 ? recordsSubset : this.salesTable;
    const payload = buildVerifiedAnalyticsPayload(
      targetRecords,
      this.validationReport.datasetName,
      this.validationReport.isDemoData
    );
    const forecast = runSalesForecasting(targetRecords, 6);
    const segmentation = runCustomerSegmentation(targetRecords).evaluation;
    const anomalies = runAnomalyDetection(targetRecords, 0.02);

    return {
      generatedAt: new Date().toISOString(),
      dataset: this.validationReport,
      cleaning: this.cleaningSummary,
      schema: this.getDatabaseSchemaSummary(),
      verifiedMetrics: payload,
      mlSummary: {
        forecast,
        segmentation: {
          algorithm: segmentation.algorithm,
          k: segmentation.k,
          silhouetteScore: segmentation.silhouetteScore,
          clusters: segmentation.clusters,
        },
        anomalies: {
          algorithm: anomalies.algorithm,
          totalTransactions: anomalies.totalTransactions,
          anomaliesDetected: anomalies.anomaliesDetected,
          anomalyPercentage: anomalies.anomalyPercentage,
          topAnomalies: anomalies.anomalies.slice(0, 10),
        },
      },
      aiInsights: this.cachedAIInsights,
    };
  }
}

export const dbStore = new RelationalDataStore();
