export type NavPageId =
  | 'dashboard'
  | 'upload'
  | 'quality'
  | 'sales'
  | 'products'
  | 'customers'
  | 'regions'
  | 'ml'
  | 'predictions'
  | 'ai'
  | 'reports'
  | 'about'
  | 'settings';

export interface GlobalFilterState {
  startDate: string;
  endDate: string;
  category: string;
  product: string;
  region: string;
  customer: string;
  segment: string;
}

export interface FilterOptions {
  categories: string[];
  regions: string[];
  products: string[];
  segments: string[];
  minDate: string;
  maxDate: string;
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

export interface MonthlyTrendPoint {
  period: string;
  sales: number;
  profit: number;
  cost: number;
  orders: number;
  quantity: number;
  margin: number;
  movingAvg3M: number;
  momGrowth: number;
}

export interface CategoryBreakdown {
  category: string;
  sales: number;
  profit: number;
  cost: number;
  orders: number;
  quantity: number;
  margin: number;
  share: number;
}

export interface RegionBreakdown {
  region: string;
  sales: number;
  profit: number;
  cost: number;
  orders: number;
  customers: number;
  quantity: number;
  avgDiscountPct: number;
  margin: number;
  share: number;
  growth: number;
}

export interface ProductPerformanceItem {
  productId: string;
  productName: string;
  category: string;
  sales: number;
  profit: number;
  cost: number;
  quantity: number;
  orders: number;
  avgUnitPrice: number;
  avgDiscountPct: number;
  margin: number;
  share: number;
}

export interface SalesRecordRow {
  id: number;
  order_id: string;
  order_date: string;
  year_month: string;
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
