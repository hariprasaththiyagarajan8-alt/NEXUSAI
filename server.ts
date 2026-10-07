import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { dbStore } from './src/server/database';
import { parseUploadedBuffer } from './src/server/dataPipeline';
import {
  applyGlobalFilters,
  calculateBusinessKPIs,
  getCustomerAnalytics,
  getProductAnalytics,
  getSalesTrendsAndBreakdown,
} from './src/server/analyticsService';
import {
  runAnomalyDetection,
  runCustomerSegmentation,
  runSalesForecasting,
} from './src/server/mlService';
import { GlobalFilters } from './src/server/types';

dotenv.config();

function extractFilters(req: Request): GlobalFilters {
  return {
    startDate: typeof req.query.startDate === 'string' ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === 'string' ? req.query.endDate : undefined,
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    product: typeof req.query.product === 'string' ? req.query.product : undefined,
    region: typeof req.query.region === 'string' ? req.query.region : undefined,
    customer: typeof req.query.customer === 'string' ? req.query.customer : undefined,
    segment: typeof req.query.segment === 'string' ? req.query.segment : undefined,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allow up to 50MB JSON payloads for base64 CSV/XLSX file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 1. POST /api/demo/load — Reset / Load Demo Dataset (6,500 records)
  app.post('/api/demo/load', (_req: Request, res: Response) => {
    try {
      dbStore.loadDemoDataset();
      res.status(200).json({
        message: 'Synthetic demo dataset (6,500 records) loaded, validated, and cleaned.',
        validationReport: dbStore.getValidationReport(),
        cleaningSummary: dbStore.getCleaningSummary(),
        filterOptions: dbStore.getFilterOptions(),
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to load demo dataset.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // 2. POST /api/upload — Upload CSV or Excel XLSX (via base64 or JSON rows)
  app.post('/api/upload', (req: Request, res: Response) => {
    try {
      const { filename, fileBase64, rawRows } = req.body as {
        filename?: string;
        fileBase64?: string;
        rawRows?: Record<string, unknown>[];
      };

      const safeFilename = (filename || 'UPLOADED_DATASET.CSV').trim();
      const lower = safeFilename.toLowerCase();
      if (!lower.endsWith('.csv') && !lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
        res.status(400).json({
          error: 'Unsupported file format. Please upload a .CSV or .XLSX file.',
        });
        return;
      }

      let parsedRows: Record<string, unknown>[] = [];
      if (Array.isArray(rawRows) && rawRows.length > 0) {
        parsedRows = rawRows;
      } else if (typeof fileBase64 === 'string' && fileBase64.length > 0) {
        const base64Clean = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
        const buf = Buffer.from(base64Clean, 'base64');
        parsedRows = parseUploadedBuffer(buf, safeFilename);
      } else {
        res.status(400).json({
          error: 'No file content provided. Please select a valid CSV or XLSX file.',
        });
        return;
      }

      const { validationReport, cleaningSummary } = dbStore.ingestRawRecords(
        parsedRows,
        safeFilename,
        false
      );

      res.status(200).json({
        validationReport,
        cleaningSummary,
        filterOptions: dbStore.getFilterOptions(),
      });
    } catch (error) {
      res.status(400).json({
        error: 'Failed to parse uploaded dataset. Please ensure the file is a valid CSV or Excel XLSX.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // 3. GET /api/data/summary — Dataset Validation, Cleaning Summary, Filter Options & Schema
  app.get('/api/data/summary', (_req: Request, res: Response) => {
    try {
      res.status(200).json({
        validationReport: dbStore.getValidationReport(),
        cleaningSummary: dbStore.getCleaningSummary(),
        filterOptions: dbStore.getFilterOptions(),
        schema: dbStore.getDatabaseSchemaSummary(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Unable to fetch data summary.' });
    }
  });

  // 4. GET /api/sales/overview — Executive KPIs & High-Level Breakdown
  app.get('/api/sales/overview', (req: Request, res: Response) => {
    try {
      const filters = extractFilters(req);
      const filtered = applyGlobalFilters(dbStore.getSalesRecords(), filters);
      const kpis = calculateBusinessKPIs(filtered);
      const { monthlyTrends, categories, regions } = getSalesTrendsAndBreakdown(filtered);
      const { topProductsBySales } = getProductAnalytics(filtered);

      res.status(200).json({
        recordCount: filtered.length,
        isDemoData: dbStore.getValidationReport().isDemoData,
        datasetName: dbStore.getValidationReport().datasetName,
        kpis,
        monthlyTrends,
        categories,
        regions,
        topProducts: topProductsBySales.slice(0, 8),
      });
    } catch (error) {
      res.status(500).json({ error: 'Unable to compute sales overview.' });
    }
  });

  // 5. GET /api/sales/trends — Detailed Sales Analytics & Period Comparisons
  app.get('/api/sales/trends', (req: Request, res: Response) => {
    try {
      const filters = extractFilters(req);
      const filtered = applyGlobalFilters(dbStore.getSalesRecords(), filters);
      const kpis = calculateBusinessKPIs(filtered);
      const { monthlyTrends, categories, regions } = getSalesTrendsAndBreakdown(filtered);

      res.status(200).json({
        recordCount: filtered.length,
        kpis,
        monthlyTrends,
        categories,
        regions,
      });
    } catch (error) {
      res.status(500).json({ error: 'Unable to compute sales trends.' });
    }
  });

  // 6. GET /api/sales/table — Interactive Paginated, Searchable, Sortable Sales Table
  app.get('/api/sales/table', (req: Request, res: Response) => {
    try {
      const filters = extractFilters(req);
      let filtered = applyGlobalFilters(dbStore.getSalesRecords(), filters);

      const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
      if (search) {
        filtered = filtered.filter(
          (r) =>
            r.order_id.toLowerCase().includes(search) ||
            r.customer_name.toLowerCase().includes(search) ||
            r.customer_id.toLowerCase().includes(search) ||
            r.product_name.toLowerCase().includes(search) ||
            r.category.toLowerCase().includes(search) ||
            r.region.toLowerCase().includes(search)
        );
      }

      const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'order_date';
      const sortDir = req.query.sortDir === 'asc' ? 1 : -1;

      filtered = [...filtered].sort((a, b) => {
        const valA = (a as unknown as Record<string, unknown>)[sortBy];
        const valB = (b as unknown as Record<string, unknown>)[sortBy];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * sortDir;
        }
        return String(valA ?? '').localeCompare(String(valB ?? '')) * sortDir;
      });

      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const pageSize = Math.min(100, Math.max(10, parseInt(String(req.query.pageSize || '20'), 10)));
      const totalRows = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
      const startIdx = (page - 1) * pageSize;
      const rows = filtered.slice(startIdx, startIdx + pageSize);

      res.status(200).json({
        page,
        pageSize,
        totalRows,
        totalPages,
        rows,
      });
    } catch (error) {
      res.status(500).json({ error: 'Unable to query sales table.' });
    }
  });

  // 7. GET /api/products — Product Performance Analysis
  app.get('/api/products', (req: Request, res: Response) => {
    try {
      const filters = extractFilters(req);
      const filtered = applyGlobalFilters(dbStore.getSalesRecords(), filters);
      const productAnalytics = getProductAnalytics(filtered);
      res.status(200).json(productAnalytics);
    } catch (error) {
      res.status(500).json({ error: 'Unable to compute product analytics.' });
    }
  });

  // 8. GET /api/customers — Customer RFM & Behavioral Analysis
  app.get('/api/customers', (req: Request, res: Response) => {
    try {
      const filters = extractFilters(req);
      const filtered = applyGlobalFilters(dbStore.getSalesRecords(), filters);
      const customerAnalytics = getCustomerAnalytics(filtered);
      res.status(200).json(customerAnalytics);
    } catch (error) {
      res.status(500).json({ error: 'Unable to compute customer analytics.' });
    }
  });

  // 9. GET /api/regions — Regional Performance & Margin Analysis
  app.get('/api/regions', (req: Request, res: Response) => {
    try {
      const filters = extractFilters(req);
      const filtered = applyGlobalFilters(dbStore.getSalesRecords(), filters);
      const { regions, monthlyTrends } = getSalesTrendsAndBreakdown(filtered);

      // Compute region-by-category matrix
      const matrixMap = new Map<string, Record<string, number>>();
      for (const r of filtered) {
        const row = matrixMap.get(r.region) || {};
        row[r.category] = Number(((row[r.category] || 0) + r.sales).toFixed(2));
        matrixMap.set(r.region, row);
      }
      const regionCategoryMatrix = Array.from(matrixMap.entries()).map(([region, cats]) => ({
        region,
        ...cats,
      }));

      res.status(200).json({
        regions,
        regionCategoryMatrix,
        monthlyTrends,
      });
    } catch (error) {
      res.status(500).json({ error: 'Unable to compute regional analytics.' });
    }
  });

  // 10. GET /api/ml/evaluation & POST /api/ml/train — Machine Learning Suite
  app.get('/api/ml/evaluation', (req: Request, res: Response) => {
    try {
      const filters = extractFilters(req);
      const filtered = applyGlobalFilters(dbStore.getSalesRecords(), filters);
      const horizon = Math.min(12, Math.max(3, parseInt(String(req.query.horizon || '6'), 10)));
      const contamination = Math.min(
        0.1,
        Math.max(0.005, parseFloat(String(req.query.contamination || '0.02')))
      );

      const forecasting = runSalesForecasting(filtered, horizon);
      const segmentation = runCustomerSegmentation(filtered).evaluation;
      const anomalies = runAnomalyDetection(filtered, contamination);

      res.status(200).json({
        recommendedTask: 'SALES_FORECASTING_AND_RFM_SEGMENTATION',
        recordCount: filtered.length,
        forecasting,
        segmentation,
        anomalies,
      });
    } catch (error) {
      res.status(500).json({ error: 'Unable to evaluate ML models.' });
    }
  });

  app.post('/api/ml/train', (req: Request, res: Response) => {
    try {
      const { horizon = 6, contamination = 0.02, filters = {} } = req.body || {};
      const filtered = applyGlobalFilters(dbStore.getSalesRecords(), filters);
      const forecasting = runSalesForecasting(filtered, Number(horizon));
      const segmentation = runCustomerSegmentation(filtered).evaluation;
      const anomalies = runAnomalyDetection(filtered, Number(contamination));

      res.status(200).json({
        status: 'TRAINED',
        trainedAt: new Date().toISOString(),
        recordCount: filtered.length,
        forecasting,
        segmentation,
        anomalies,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to train ML pipeline.' });
    }
  });

  // 11. POST /api/ml/predict — Interactive What-If Scenario Sales & Margin Simulator
  app.post('/api/ml/predict', (req: Request, res: Response) => {
    try {
      const {
        category = 'Electronics',
        region = 'North',
        quantity = 10,
        unitPrice = 500,
        discount = 0.05,
        horizonMonths = 6,
      } = req.body || {};

      const allRecords = dbStore.getSalesRecords();
      const catRegionRecords = allRecords.filter(
        (r) =>
          (category === 'ALL' || r.category === category) &&
          (region === 'ALL' || r.region === region)
      );

      const subset = catRegionRecords.length >= 12 ? catRegionRecords : allRecords;
      const forecast = runSalesForecasting(subset, Number(horizonMonths));

      // Calculate average historical cost-to-price ratio for this segment
      const avgCostRatio =
        subset.length > 0
          ? subset.reduce((acc, r) => acc + r.cost / Math.max(1, r.quantity * r.unit_price), 0) /
            subset.length
          : 0.66;

      const simulatedSales = Number((quantity * unitPrice * (1 - discount)).toFixed(2));
      const estimatedCost = Number((quantity * unitPrice * avgCostRatio).toFixed(2));
      const simulatedProfit = Number((simulatedSales - estimatedCost).toFixed(2));
      const simulatedMargin =
        simulatedSales > 0 ? Number(((simulatedProfit / simulatedSales) * 100).toFixed(2)) : 0;

      res.status(200).json({
        simulation: {
          category,
          region,
          quantity,
          unitPrice,
          discount,
          simulatedSales,
          estimatedCost,
          simulatedProfit,
          simulatedMargin,
          isProfitable: simulatedProfit > 0,
        },
        segmentForecast: forecast,
      });
    } catch (error) {
      res.status(500).json({ error: 'Prediction request failed.' });
    }
  });

  // 12. POST /api/ai/insights — Verified Analytics → Gemini API → Business Insights
  app.post('/api/ai/insights', async (req: Request, res: Response) => {
    try {
      const { filters = {}, forceRefresh = false } = req.body || {};
      const filtered = applyGlobalFilters(dbStore.getSalesRecords(), filters);
      const insights = await dbStore.getOrGenerateAIInsights(filtered, Boolean(forceRefresh));
      res.status(200).json(insights);
    } catch (error) {
      res.status(500).json({
        error: 'AI service is temporarily unavailable. Analytics and Machine Learning results are still available.',
      });
    }
  });

  // 13. GET /api/reports — Comprehensive Executive & Power BI Report Bundle
  app.get('/api/reports', async (req: Request, res: Response) => {
    try {
      const filters = extractFilters(req);
      const filtered = applyGlobalFilters(dbStore.getSalesRecords(), filters);
      await dbStore.getOrGenerateAIInsights(filtered, false);
      const bundle = dbStore.getFullReportBundle(filtered);
      res.status(200).json(bundle);
    } catch (error) {
      res.status(500).json({ error: 'Unable to generate report bundle.' });
    }
  });

  // 14. GET /api/export/csv — Clean CSV Export for Power BI & External BI Tools
  app.get('/api/export/csv', (req: Request, res: Response) => {
    try {
      const type = typeof req.query.type === 'string' ? req.query.type : 'sales';
      const filters = extractFilters(req);
      const filtered = applyGlobalFilters(dbStore.getSalesRecords(), filters);

      if (type === 'kpis') {
        const kpis = calculateBusinessKPIs(filtered);
        const csv = [
          'Metric,Value',
          `Total Sales,${kpis.totalSales}`,
          `Total Profit,${kpis.totalProfit}`,
          `Total Cost,${kpis.totalCost}`,
          `Total Orders,${kpis.totalOrders}`,
          `Total Quantity,${kpis.totalQuantity}`,
          `Total Customers,${kpis.totalCustomers}`,
          `Average Order Value,${kpis.averageOrderValue}`,
          `Profit Margin (%),${kpis.profitMargin}`,
          `Sales Growth (%),${kpis.salesGrowth}`,
          `Top Category,"${kpis.topCategory.name}"`,
          `Top Product,"${kpis.topProduct.name}"`,
          `Top Region,"${kpis.topRegion.name}"`,
          `Weakest Region,"${kpis.weakRegion.name}"`,
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="powerbi_kpi_summary.csv"');
        res.status(200).send(csv);
        return;
      }

      if (type === 'ml_forecast') {
        const forecast = runSalesForecasting(filtered, 6);
        const header = 'Period,Actual_Sales,Predicted_Sales,Lower_Bound_95,Upper_Bound_95,Series_Type';
        const lines = forecast.historicalAndForecast.map(
          (r) =>
            `${r.period},${r.actualSales ?? ''},${r.predictedSales ?? ''},${r.lowerBound ?? ''},${r.upperBound ?? ''},${r.type}`
        );
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="powerbi_ml_forecast.csv"');
        res.status(200).send([header, ...lines].join('\n'));
        return;
      }

      if (type === 'customer_segments') {
        const seg = runCustomerSegmentation(filtered).evaluation;
        const header = 'Customer_ID,Customer_Name,Recency_Days,Frequency_Orders,Monetary_Sales,Total_Profit,RFM_Segment';
        const lines = seg.customerSample.map(
          (c) =>
            `"${c.customerId}","${c.customerName.replace(/"/g, '""')}",${c.recency},${c.frequency},${c.monetary},${c.profit},"${c.segment}"`
        );
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="powerbi_customer_rfm_segments.csv"');
        res.status(200).send([header, ...lines].join('\n'));
        return;
      }

      // Default: Full cleaned sales dataset for Power BI fact table
      const header =
        'Order_ID,Order_Date,Year_Month,Customer_ID,Customer_Name,Customer_Segment,Product_ID,Product_Name,Category,Region,Quantity,Unit_Price,Discount,Sales,Cost,Profit,Profit_Margin_Pct,Is_Outlier';
      const lines = filtered.map(
        (r) =>
          `"${r.order_id}",${r.order_date},${r.year_month},"${r.customer_id}","${r.customer_name.replace(/"/g, '""')}","${r.customer_segment || 'Regular'}","${r.product_id}","${r.product_name.replace(/"/g, '""')}","${r.category}","${r.region}",${r.quantity},${r.unit_price},${r.discount},${r.sales},${r.cost},${r.profit},${r.profit_margin},${r.is_outlier}`
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="cleaned_sales_fact_table.csv"');
      res.status(200).send([header, ...lines].join('\n'));
    } catch (error) {
      res.status(500).json({ error: 'CSV export failed.' });
    }
  });

  // Vite middleware for development / static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NexusBI Sales Analytics & AI Server listening on http://localhost:${PORT}`);
  });
}

startServer();
