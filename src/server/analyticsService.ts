import {
  BusinessKPIs,
  CleanSalesRecord,
  GlobalFilters,
  VerifiedAnalyticsPayload,
} from './types';
import {
  runAnomalyDetection,
  runCustomerSegmentation,
  runSalesForecasting,
} from './mlService';

export function applyGlobalFilters(
  records: CleanSalesRecord[],
  filters: GlobalFilters
): CleanSalesRecord[] {
  return records.filter((r) => {
    if (filters.startDate && r.order_date < filters.startDate) return false;
    if (filters.endDate && r.order_date > filters.endDate) return false;
    if (filters.category && filters.category !== 'ALL' && r.category !== filters.category)
      return false;
    if (filters.product && filters.product !== 'ALL' && r.product_name !== filters.product)
      return false;
    if (filters.region && filters.region !== 'ALL' && r.region !== filters.region)
      return false;
    if (filters.customer && filters.customer !== 'ALL' && r.customer_id !== filters.customer)
      return false;
    if (
      filters.segment &&
      filters.segment !== 'ALL' &&
      r.customer_segment !== filters.segment
    )
      return false;
    return true;
  });
}

export function calculateBusinessKPIs(records: CleanSalesRecord[]): BusinessKPIs {
  if (records.length === 0) {
    return {
      totalSales: 0,
      totalProfit: 0,
      totalCost: 0,
      totalOrders: 0,
      totalQuantity: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
      profitMargin: 0,
      salesGrowth: 0,
      profitGrowth: 0,
      topProduct: { name: 'N/A', sales: 0, profit: 0 },
      topCategory: { name: 'N/A', sales: 0, profit: 0, share: 0 },
      topRegion: { name: 'N/A', sales: 0, profit: 0, margin: 0 },
      weakRegion: { name: 'N/A', sales: 0, profit: 0, margin: 0, growth: 0 },
    };
  }

  let totalSales = 0;
  let totalProfit = 0;
  let totalCost = 0;
  let totalQuantity = 0;
  const orderSet = new Set<string>();
  const customerSet = new Set<string>();

  const productAgg = new Map<string, { sales: number; profit: number }>();
  const categoryAgg = new Map<string, { sales: number; profit: number }>();
  const regionAgg = new Map<string, { sales: number; profit: number }>();
  const monthlySales = new Map<string, { sales: number; profit: number }>();

  for (const r of records) {
    totalSales += r.sales;
    totalProfit += r.profit;
    totalCost += r.cost;
    totalQuantity += r.quantity;
    orderSet.add(r.order_id);
    customerSet.add(r.customer_id);

    const prod = productAgg.get(r.product_name) || { sales: 0, profit: 0 };
    prod.sales += r.sales;
    prod.profit += r.profit;
    productAgg.set(r.product_name, prod);

    const cat = categoryAgg.get(r.category) || { sales: 0, profit: 0 };
    cat.sales += r.sales;
    cat.profit += r.profit;
    categoryAgg.set(r.category, cat);

    const reg = regionAgg.get(r.region) || { sales: 0, profit: 0 };
    reg.sales += r.sales;
    reg.profit += r.profit;
    regionAgg.set(r.region, reg);

    const m = monthlySales.get(r.year_month) || { sales: 0, profit: 0 };
    m.sales += r.sales;
    m.profit += r.profit;
    monthlySales.set(r.year_month, m);
  }

  const totalOrders = Math.max(1, orderSet.size);
  const averageOrderValue = totalSales / totalOrders;
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  // Calculate period-over-period growth (second half of months vs first half, or last 3 months vs prior 3 months)
  const sortedMonths = Array.from(monthlySales.keys()).sort();
  let salesGrowth = 0;
  let profitGrowth = 0;
  if (sortedMonths.length >= 6) {
    const recent3 = sortedMonths.slice(-3);
    const prior3 = sortedMonths.slice(-6, -3);
    const recentSales = recent3.reduce((a, m) => a + (monthlySales.get(m)?.sales || 0), 0);
    const priorSales = prior3.reduce((a, m) => a + (monthlySales.get(m)?.sales || 0), 0);
    const recentProfit = recent3.reduce((a, m) => a + (monthlySales.get(m)?.profit || 0), 0);
    const priorProfit = prior3.reduce((a, m) => a + (monthlySales.get(m)?.profit || 0), 0);

    if (priorSales > 0) {
      salesGrowth = ((recentSales - priorSales) / priorSales) * 100;
    }
    if (Math.abs(priorProfit) > 0) {
      profitGrowth = ((recentProfit - priorProfit) / Math.abs(priorProfit)) * 100;
    }
  } else if (sortedMonths.length >= 2) {
    const lastM = monthlySales.get(sortedMonths[sortedMonths.length - 1])!;
    const prevM = monthlySales.get(sortedMonths[sortedMonths.length - 2])!;
    if (prevM.sales > 0) salesGrowth = ((lastM.sales - prevM.sales) / prevM.sales) * 100;
    if (Math.abs(prevM.profit) > 0)
      profitGrowth = ((lastM.profit - prevM.profit) / Math.abs(prevM.profit)) * 100;
  }

  // Top Product
  let topProduct = { name: 'N/A', sales: 0, profit: 0 };
  for (const [name, stats] of productAgg.entries()) {
    if (stats.sales > topProduct.sales) {
      topProduct = {
        name,
        sales: Number(stats.sales.toFixed(2)),
        profit: Number(stats.profit.toFixed(2)),
      };
    }
  }

  // Top Category
  let topCategory = { name: 'N/A', sales: 0, profit: 0, share: 0 };
  for (const [name, stats] of categoryAgg.entries()) {
    if (stats.sales > topCategory.sales) {
      topCategory = {
        name,
        sales: Number(stats.sales.toFixed(2)),
        profit: Number(stats.profit.toFixed(2)),
        share: Number(((stats.sales / totalSales) * 100).toFixed(1)),
      };
    }
  }

  // Top & Weak Region
  const regionList = Array.from(regionAgg.entries()).map(([name, stats]) => {
    // Also compute regional recent vs prior growth
    let regGrowth = 0;
    if (sortedMonths.length >= 6) {
      const recentSet = new Set(sortedMonths.slice(-3));
      const priorSet = new Set(sortedMonths.slice(-6, -3));
      let recS = 0;
      let priS = 0;
      for (const r of records) {
        if (r.region === name) {
          if (recentSet.has(r.year_month)) recS += r.sales;
          if (priorSet.has(r.year_month)) priS += r.sales;
        }
      }
      if (priS > 0) regGrowth = ((recS - priS) / priS) * 100;
    }
    return {
      name,
      sales: Number(stats.sales.toFixed(2)),
      profit: Number(stats.profit.toFixed(2)),
      margin: stats.sales > 0 ? Number(((stats.profit / stats.sales) * 100).toFixed(2)) : 0,
      growth: Number(regGrowth.toFixed(2)),
    };
  });

  regionList.sort((a, b) => b.sales - a.sales);
  const topRegion = regionList[0] || { name: 'N/A', sales: 0, profit: 0, margin: 0 };
  const weakRegion = regionList[regionList.length - 1] || {
    name: 'N/A',
    sales: 0,
    profit: 0,
    margin: 0,
    growth: 0,
  };

  return {
    totalSales: Number(totalSales.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    totalOrders,
    totalQuantity,
    totalCustomers: customerSet.size,
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    profitMargin: Number(profitMargin.toFixed(2)),
    salesGrowth: Number(salesGrowth.toFixed(2)),
    profitGrowth: Number(profitGrowth.toFixed(2)),
    topProduct,
    topCategory,
    topRegion: {
      name: topRegion.name,
      sales: topRegion.sales,
      profit: topRegion.profit,
      margin: topRegion.margin,
    },
    weakRegion,
  };
}

export function getSalesTrendsAndBreakdown(records: CleanSalesRecord[]) {
  const monthlyMap = new Map<
    string,
    { sales: number; profit: number; cost: number; orders: Set<string>; quantity: number }
  >();

  const categoryMap = new Map<
    string,
    { sales: number; profit: number; cost: number; orders: Set<string>; quantity: number }
  >();

  const regionMap = new Map<
    string,
    {
      sales: number;
      profit: number;
      cost: number;
      orders: Set<string>;
      customers: Set<string>;
      quantity: number;
      discountSum: number;
      rowCount: number;
    }
  >();

  const totalSalesAll = records.reduce((a, b) => a + b.sales, 0) || 1;

  for (const r of records) {
    // Monthly
    const m = monthlyMap.get(r.year_month) || {
      sales: 0,
      profit: 0,
      cost: 0,
      orders: new Set<string>(),
      quantity: 0,
    };
    m.sales += r.sales;
    m.profit += r.profit;
    m.cost += r.cost;
    m.orders.add(r.order_id);
    m.quantity += r.quantity;
    monthlyMap.set(r.year_month, m);

    // Category
    const c = categoryMap.get(r.category) || {
      sales: 0,
      profit: 0,
      cost: 0,
      orders: new Set<string>(),
      quantity: 0,
    };
    c.sales += r.sales;
    c.profit += r.profit;
    c.cost += r.cost;
    c.orders.add(r.order_id);
    c.quantity += r.quantity;
    categoryMap.set(r.category, c);

    // Region
    const reg = regionMap.get(r.region) || {
      sales: 0,
      profit: 0,
      cost: 0,
      orders: new Set<string>(),
      customers: new Set<string>(),
      quantity: 0,
      discountSum: 0,
      rowCount: 0,
    };
    reg.sales += r.sales;
    reg.profit += r.profit;
    reg.cost += r.cost;
    reg.orders.add(r.order_id);
    reg.customers.add(r.customer_id);
    reg.quantity += r.quantity;
    reg.discountSum += r.discount;
    reg.rowCount += 1;
    regionMap.set(r.region, reg);
  }

  const sortedPeriods = Array.from(monthlyMap.keys()).sort();
  const monthlyTrends = sortedPeriods.map((period, idx) => {
    const curr = monthlyMap.get(period)!;
    const prev = idx > 0 ? monthlyMap.get(sortedPeriods[idx - 1]) : null;
    const momGrowth =
      prev && prev.sales > 0 ? ((curr.sales - prev.sales) / prev.sales) * 100 : 0;

    // 3-month moving average
    let sumWindow = 0;
    let countWindow = 0;
    for (let w = Math.max(0, idx - 2); w <= idx; w++) {
      sumWindow += monthlyMap.get(sortedPeriods[w])!.sales;
      countWindow++;
    }

    return {
      period,
      sales: Number(curr.sales.toFixed(2)),
      profit: Number(curr.profit.toFixed(2)),
      cost: Number(curr.cost.toFixed(2)),
      orders: curr.orders.size,
      quantity: curr.quantity,
      margin: curr.sales > 0 ? Number(((curr.profit / curr.sales) * 100).toFixed(2)) : 0,
      movingAvg3M: Number((sumWindow / Math.max(1, countWindow)).toFixed(2)),
      momGrowth: Number(momGrowth.toFixed(2)),
    };
  });

  const categories = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      sales: Number(stats.sales.toFixed(2)),
      profit: Number(stats.profit.toFixed(2)),
      cost: Number(stats.cost.toFixed(2)),
      orders: stats.orders.size,
      quantity: stats.quantity,
      margin: stats.sales > 0 ? Number(((stats.profit / stats.sales) * 100).toFixed(2)) : 0,
      share: Number(((stats.sales / totalSalesAll) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.sales - a.sales);

  const regions = Array.from(regionMap.entries())
    .map(([region, stats]) => {
      // Calculate region period growth
      let growth = 0;
      if (sortedPeriods.length >= 6) {
        const recSet = new Set(sortedPeriods.slice(-3));
        const priSet = new Set(sortedPeriods.slice(-6, -3));
        let recSales = 0;
        let priSales = 0;
        for (const r of records) {
          if (r.region === region) {
            if (recSet.has(r.year_month)) recSales += r.sales;
            if (priSet.has(r.year_month)) priSales += r.sales;
          }
        }
        if (priSales > 0) growth = ((recSales - priSales) / priSales) * 100;
      }

      return {
        region,
        sales: Number(stats.sales.toFixed(2)),
        profit: Number(stats.profit.toFixed(2)),
        cost: Number(stats.cost.toFixed(2)),
        orders: stats.orders.size,
        customers: stats.customers.size,
        quantity: stats.quantity,
        avgDiscountPct:
          stats.rowCount > 0 ? Number(((stats.discountSum / stats.rowCount) * 100).toFixed(1)) : 0,
        margin: stats.sales > 0 ? Number(((stats.profit / stats.sales) * 100).toFixed(2)) : 0,
        share: Number(((stats.sales / totalSalesAll) * 100).toFixed(2)),
        growth: Number(growth.toFixed(2)),
      };
    })
    .sort((a, b) => b.sales - a.sales);

  return {
    monthlyTrends,
    categories,
    regions,
  };
}

export function getProductAnalytics(records: CleanSalesRecord[]) {
  const prodMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      category: string;
      sales: number;
      profit: number;
      cost: number;
      quantity: number;
      orders: Set<string>;
      discountSum: number;
      unitPriceSum: number;
      count: number;
    }
  >();

  const totalSalesAll = records.reduce((a, b) => a + b.sales, 0) || 1;

  for (const r of records) {
    const existing = prodMap.get(r.product_name) || {
      productId: r.product_id,
      productName: r.product_name,
      category: r.category,
      sales: 0,
      profit: 0,
      cost: 0,
      quantity: 0,
      orders: new Set<string>(),
      discountSum: 0,
      unitPriceSum: 0,
      count: 0,
    };
    existing.sales += r.sales;
    existing.profit += r.profit;
    existing.cost += r.cost;
    existing.quantity += r.quantity;
    existing.orders.add(r.order_id);
    existing.discountSum += r.discount;
    existing.unitPriceSum += r.unit_price;
    existing.count += 1;
    prodMap.set(r.product_name, existing);
  }

  const allProducts = Array.from(prodMap.values())
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      category: p.category,
      sales: Number(p.sales.toFixed(2)),
      profit: Number(p.profit.toFixed(2)),
      cost: Number(p.cost.toFixed(2)),
      quantity: p.quantity,
      orders: p.orders.size,
      avgUnitPrice: Number((p.unitPriceSum / Math.max(1, p.count)).toFixed(2)),
      avgDiscountPct: Number(((p.discountSum / Math.max(1, p.count)) * 100).toFixed(1)),
      margin: p.sales > 0 ? Number(((p.profit / p.sales) * 100).toFixed(2)) : 0,
      share: Number(((p.sales / totalSalesAll) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.sales - a.sales);

  const topProductsBySales = allProducts.slice(0, 10);
  const bottomProductsBySales = [...allProducts].sort((a, b) => a.sales - b.sales).slice(0, 10);
  const topProductsByProfit = [...allProducts].sort((a, b) => b.profit - a.profit).slice(0, 10);
  const lowestMarginProducts = [...allProducts].sort((a, b) => a.margin - b.margin).slice(0, 10);

  return {
    totalDistinctProducts: allProducts.length,
    allProducts,
    topProductsBySales,
    bottomProductsBySales,
    topProductsByProfit,
    lowestMarginProducts,
  };
}

export function getCustomerAnalytics(records: CleanSalesRecord[]) {
  const { evaluation } = runCustomerSegmentation(records);

  const totalCustomers = evaluation.totalCustomers;
  const totalRevenue = records.reduce((a, b) => a + b.sales, 0);
  const totalProfit = records.reduce((a, b) => a + b.profit, 0);
  const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  const avgFrequency =
    totalCustomers > 0
      ? evaluation.customerSample.reduce((a, b) => a + b.frequency, 0) / totalCustomers
      : 0;

  // Frequency distribution
  const freqBuckets = [
    { label: '1-5 Orders', min: 1, max: 5, count: 0 },
    { label: '6-12 Orders', min: 6, max: 12, count: 0 },
    { label: '13-20 Orders', min: 13, max: 20, count: 0 },
    { label: '21-30 Orders', min: 21, max: 30, count: 0 },
    { label: '31+ Orders', min: 31, max: 99999, count: 0 },
  ];

  for (const c of evaluation.customerSample) {
    for (const b of freqBuckets) {
      if (c.frequency >= b.min && c.frequency <= b.max) {
        b.count++;
        break;
      }
    }
  }

  return {
    totalCustomers,
    avgCustomerValue: Number(avgCustomerValue.toFixed(2)),
    avgPurchaseFrequency: Number(avgFrequency.toFixed(1)),
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2)),
    silhouetteScore: evaluation.silhouetteScore,
    segments: evaluation.clusters,
    topCustomers: evaluation.customerSample.slice(0, 25),
    frequencyDistribution: freqBuckets,
  };
}

export function buildVerifiedAnalyticsPayload(
  records: CleanSalesRecord[],
  datasetName: string,
  isDemoData: boolean
): VerifiedAnalyticsPayload {
  const kpis = calculateBusinessKPIs(records);
  const forecast = runSalesForecasting(records, 6);
  const { evaluation: segEval } = runCustomerSegmentation(records);
  const anomalyEval = runAnomalyDetection(records, 0.02);

  const sortedDates = records.map((r) => r.order_date).sort();
  const negativeMarginOrdersCount = records.filter((r) => r.profit < 0).length;

  const bestModel = forecast.models[0] || {
    modelName: 'Gradient Boosting Regressor',
    r2: 0,
    mape: 0,
  };

  const topCluster = segEval.clusters[0] || {
    segmentName: 'High Value',
    customerCount: 0,
    totalRevenue: 0,
  };

  const atRiskCluster = segEval.clusters.find((c) => c.segmentName === 'At Risk');

  return {
    dataset_name: datasetName,
    is_demo_data: isDemoData,
    date_range: {
      start: sortedDates[0] || 'N/A',
      end: sortedDates[sortedDates.length - 1] || 'N/A',
    },
    total_records: records.length,
    total_sales: kpis.totalSales,
    total_profit: kpis.totalProfit,
    total_orders: kpis.totalOrders,
    average_order_value: kpis.averageOrderValue,
    profit_margin_pct: kpis.profitMargin,
    sales_growth_pct: kpis.salesGrowth,
    top_category: {
      name: kpis.topCategory.name,
      sales: kpis.topCategory.sales,
      share_pct: kpis.topCategory.share,
    },
    top_product: {
      name: kpis.topProduct.name,
      sales: kpis.topProduct.sales,
      profit: kpis.topProduct.profit,
    },
    top_region: {
      name: kpis.topRegion.name,
      sales: kpis.topRegion.sales,
      margin_pct: kpis.topRegion.margin,
    },
    weak_region: {
      name: kpis.weakRegion.name,
      sales: kpis.weakRegion.sales,
      margin_pct: kpis.weakRegion.margin,
      growth_pct: kpis.weakRegion.growth,
    },
    negative_margin_orders_count: negativeMarginOrdersCount,
    forecast_next_month: forecast.nextMonthForecast,
    forecast_growth_pct: forecast.forecastGrowthPct,
    forecast_model: forecast.selectedModel,
    forecast_r2: bestModel.r2,
    forecast_mape_pct: bestModel.mape,
    top_customer_segment: {
      name: topCluster.segmentName,
      count: topCluster.customerCount,
      revenue: topCluster.totalRevenue,
    },
    at_risk_customers_count: atRiskCluster?.customerCount || 0,
    anomalies_detected: anomalyEval.anomaliesDetected,
    anomaly_rate_pct: anomalyEval.anomalyPercentage,
  };
}
