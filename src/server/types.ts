export interface RawSalesRecord {
  Order_ID?: string | number;
  Order_Date?: string | number;
  Customer_ID?: string | number;
  Customer_Name?: string;
  Product_ID?: string | number;
  Product_Name?: string;
  Category?: string;
  Region?: string;
  Quantity?: string | number;
  Unit_Price?: string | number;
  Discount?: string | number;
  Sales?: string | number;
  Cost?: string | number;
  Profit?: string | number;
  [key: string]: unknown;
}

export interface CleanSalesRecord {
  id: number;
  order_id: string;
  order_date: string; // YYYY-MM-DD
  year_month: string; // YYYY-MM
  customer_id: string;
  customer_name: string;
  product_id: string;
  product_name: string;
  category: string;
  region: string;
  quantity: number;
  unit_price: number;
  discount: number;
  sales: number;
  cost: number;
  profit: number;
  profit_margin: number;
  is_outlier: boolean;
  customer_segment?: string;
}

export interface ValidationColumnInfo {
  name: string;
  mappedTo: string | null;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  missingCount: number;
  sampleValues: string[];
}

export interface ValidationReport {
  datasetName: string;
  isDemoData: boolean;
  uploadedAt: string;
  rawRows: number;
  rawColumns: number;
  missingValues: number;
  duplicateRows: number;
  invalidRecords: number;
  outliersDetected: number;
  status: 'VALIDATED' | 'WARNING' | 'FAILED';
  missingRequiredColumns: string[];
  derivedColumns: string[];
  columns: ValidationColumnInfo[];
  messages: string[];
}

export interface CleaningSummary {
  originalRows: number;
  duplicatesRemoved: number;
  missingValuesImputed: number;
  invalidRecordsRemoved: number;
  datesNormalized: number;
  categoriesNormalized: number;
  outliersFlagged: number;
  finalRows: number;
  cleaningSteps: {
    step: string;
    affectedRows: number;
    description: string;
    status: 'COMPLETED' | 'SKIPPED';
  }[];
}

export interface GlobalFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  product?: string;
  region?: string;
  customer?: string;
  segment?: string;
}

export interface BusinessKPIs {
  totalSales: number;
  totalProfit: number;
  totalCost: number;
  totalOrders: number;
  totalQuantity: number;
  totalCustomers: number;
  averageOrderValue: number;
  profitMargin: number;
  salesGrowth: number;
  profitGrowth: number;
  topProduct: { name: string; sales: number; profit: number };
  topCategory: { name: string; sales: number; profit: number; share: number };
  topRegion: { name: string; sales: number; profit: number; margin: number };
  weakRegion: { name: string; sales: number; profit: number; margin: number; growth: number };
}

export interface ForecastModelResult {
  modelName: string;
  mae: number;
  rmse: number;
  r2: number;
  mape: number;
  isBest: boolean;
  validationPoints: { period: string; actual: number; predicted: number }[];
  futurePredictions: { period: string; predictedSales: number; lowerBound: number; upperBound: number }[];
}

export interface ForecastingEvaluation {
  selectedModel: string;
  trainingRecords: number;
  testingRecords: number;
  horizonMonths: number;
  nextMonthForecast: number;
  forecastGrowthPct: number;
  models: ForecastModelResult[];
  historicalAndForecast: {
    period: string;
    actualSales: number | null;
    predictedSales: number | null;
    lowerBound: number | null;
    upperBound: number | null;
    type: 'historical' | 'validation' | 'forecast';
  }[];
}

export interface CustomerSegmentCluster {
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

export interface SegmentationEvaluation {
  algorithm: string;
  k: number;
  totalCustomers: number;
  silhouetteScore: number;
  inertia: number;
  clusters: CustomerSegmentCluster[];
  customerSample: {
    customerId: string;
    customerName: string;
    recency: number;
    frequency: number;
    monetary: number;
    profit: number;
    segment: string;
  }[];
}

export interface AnomalyTransaction {
  orderId: string;
  orderDate: string;
  customerId: string;
  productName: string;
  category: string;
  region: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  sales: number;
  cost: number;
  profit: number;
  profitMargin: number;
  anomalyScore: number;
  reason: string;
}

export interface AnomalyEvaluation {
  algorithm: string;
  contamination: number;
  nEstimators: number;
  totalTransactions: number;
  normalTransactions: number;
  anomaliesDetected: number;
  anomalyPercentage: number;
  anomalies: AnomalyTransaction[];
  distribution: {
    bucket: string;
    normalCount: number;
    anomalyCount: number;
  }[];
}

export interface VerifiedAnalyticsPayload {
  dataset_name: string;
  is_demo_data: boolean;
  date_range: { start: string; end: string };
  total_records: number;
  total_sales: number;
  total_profit: number;
  total_orders: number;
  average_order_value: number;
  profit_margin_pct: number;
  sales_growth_pct: number;
  top_category: { name: string; sales: number; share_pct: number };
  top_product: { name: string; sales: number; profit: number };
  top_region: { name: string; sales: number; margin_pct: number };
  weak_region: { name: string; sales: number; margin_pct: number; growth_pct: number };
  negative_margin_orders_count: number;
  forecast_next_month: number;
  forecast_growth_pct: number;
  forecast_model: string;
  forecast_r2: number;
  forecast_mape_pct: number;
  top_customer_segment: { name: string; count: number; revenue: number };
  at_risk_customers_count: number;
  anomalies_detected: number;
  anomaly_rate_pct: number;
}

export interface AIInsightsResponse {
  generatedAt: string;
  source: 'gemini-api' | 'rule-based-fallback';
  modelUsed: string;
  serviceNotice?: string;
  verifiedPayload: VerifiedAnalyticsPayload;
  executiveSummary: string;
  keyFindings: string[];
  businessRisks: string[];
  businessOpportunities: string[];
  recommendations: {
    title: string;
    category: string;
    impact: string;
    action: string;
    metricReference: string;
  }[];
  forecastInterpretation: string;
  nextActions: string[];
}
