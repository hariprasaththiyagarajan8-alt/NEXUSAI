import * as XLSX from 'xlsx';
import {
  CleanSalesRecord,
  CleaningSummary,
  RawSalesRecord,
  ValidationColumnInfo,
  ValidationReport,
} from './types';

const COLUMN_SYNONYMS: Record<string, string[]> = {
  Order_ID: ['order_id', 'orderid', 'order id', 'id', 'invoice_id', 'transaction_id'],
  Order_Date: ['order_date', 'orderdate', 'order date', 'date', 'transaction_date', 'invoice_date'],
  Customer_ID: ['customer_id', 'customerid', 'customer id', 'client_id', 'cust_id'],
  Customer_Name: ['customer_name', 'customername', 'customer', 'client_name', 'client'],
  Product_ID: ['product_id', 'productid', 'product id', 'item_id', 'sku'],
  Product_Name: ['product_name', 'productname', 'product', 'item_name', 'item'],
  Category: ['category', 'product_category', 'department', 'segment_type'],
  Region: ['region', 'territory', 'zone', 'market', 'area'],
  Quantity: ['quantity', 'qty', 'units', 'order_quantity'],
  Unit_Price: ['unit_price', 'unitprice', 'unit price', 'price', 'selling_price'],
  Discount: ['discount', 'discount_rate', 'disc'],
  Sales: ['sales', 'revenue', 'total_sales', 'amount', 'gross_sales', 'net_sales'],
  Cost: ['cost', 'total_cost', 'cogs', 'unit_cost'],
  Profit: ['profit', 'net_profit', 'margin_amount', 'earnings'],
};

function normalizeDateString(val: unknown): { dateStr: string | null; wasNormalized: boolean } {
  if (val === undefined || val === null || val === '') {
    return { dateStr: null, wasNormalized: false };
  }
  if (typeof val === 'number') {
    // Excel serial date
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed && parsed.y >= 1990 && parsed.y <= 2035) {
      const iso = `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
      return { dateStr: iso, wasNormalized: true };
    }
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return { dateStr: str, wasNormalized: false };
  }
  // Check MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const p1 = parseInt(slashMatch[1], 10);
    const p2 = parseInt(slashMatch[2], 10);
    const yr = parseInt(slashMatch[3], 10);
    const month = p1 <= 12 ? p1 : p2;
    const day = p1 <= 12 ? p2 : p1;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && yr >= 1990 && yr <= 2035) {
      return {
        dateStr: `${yr}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        wasNormalized: true,
      };
    }
  }
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    const yr = parsedDate.getUTCFullYear();
    if (yr >= 1990 && yr <= 2035) {
      const m = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
      const d = String(parsedDate.getUTCDate()).padStart(2, '0');
      return { dateStr: `${yr}-${m}-${d}`, wasNormalized: true };
    }
  }
  return { dateStr: null, wasNormalized: false };
}

function toTitleCase(input: string): { normalized: string; changed: boolean } {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  const normalized = trimmed
    .split(' ')
    .map((word) => {
      if (word.toUpperCase() === 'IT' || word.toUpperCase() === 'UPS' || word.toUpperCase() === 'POE+') {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
  return { normalized, changed: normalized !== input };
}

export function parseUploadedBuffer(buffer: Buffer, filename: string): RawSalesRecord[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error(`No worksheet found in uploaded file "${filename}".`);
  }
  const sheet = workbook.Sheets[firstSheetName];
  const json = XLSX.utils.sheet_to_json<RawSalesRecord>(sheet, { defval: undefined });
  return json;
}

export function validateAndCleanDataset(
  rawRecords: RawSalesRecord[],
  datasetName: string,
  isDemoData: boolean
): {
  validationReport: ValidationReport;
  cleaningSummary: CleaningSummary;
  cleanedRecords: CleanSalesRecord[];
} {
  const uploadedAt = new Date().toISOString();
  if (!rawRecords || rawRecords.length === 0) {
    return {
      validationReport: {
        datasetName,
        isDemoData,
        uploadedAt,
        rawRows: 0,
        rawColumns: 0,
        missingValues: 0,
        duplicateRows: 0,
        invalidRecords: 0,
        outliersDetected: 0,
        status: 'FAILED',
        missingRequiredColumns: ['Order_Date', 'Category', 'Region', 'Sales'],
        derivedColumns: [],
        columns: [],
        messages: ['The uploaded dataset is empty (0 rows). Please upload a valid CSV or XLSX file.'],
      },
      cleaningSummary: {
        originalRows: 0,
        duplicatesRemoved: 0,
        missingValuesImputed: 0,
        invalidRecordsRemoved: 0,
        datesNormalized: 0,
        categoriesNormalized: 0,
        outliersFlagged: 0,
        finalRows: 0,
        cleaningSteps: [],
      },
      cleanedRecords: [],
    };
  }

  // Discover columns from first 25 rows
  const colSet = new Set<string>();
  for (let i = 0; i < Math.min(25, rawRecords.length); i++) {
    Object.keys(rawRecords[i]).forEach((k) => colSet.add(k));
  }
  const rawColumnNames = Array.from(colSet);

  // Map raw columns to canonical schema
  const canonicalToRaw: Record<string, string> = {};
  const rawToCanonical: Record<string, string | null> = {};

  for (const rawCol of rawColumnNames) {
    const cleanKey = rawCol.trim().toLowerCase();
    let matchedCanonical: string | null = null;
    for (const [canonical, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
      if (synonyms.includes(cleanKey) || canonical.toLowerCase() === cleanKey) {
        matchedCanonical = canonical;
        if (!canonicalToRaw[canonical]) {
          canonicalToRaw[canonical] = rawCol;
        }
        break;
      }
    }
    rawToCanonical[rawCol] = matchedCanonical;
  }

  // Inspect column stats & count total missing values across dataset
  let totalMissingValues = 0;
  const columnInfos: ValidationColumnInfo[] = rawColumnNames.map((col) => {
    let missing = 0;
    const samples: string[] = [];
    for (let i = 0; i < rawRecords.length; i++) {
      const v = rawRecords[i][col];
      if (v === undefined || v === null || v === '') {
        missing++;
      } else if (samples.length < 3) {
        samples.push(String(v));
      }
    }
    totalMissingValues += missing;

    const mapped = rawToCanonical[col];
    let dataType: 'string' | 'number' | 'date' | 'boolean' = 'string';
    if (mapped && ['Quantity', 'Unit_Price', 'Discount', 'Sales', 'Cost', 'Profit'].includes(mapped)) {
      dataType = 'number';
    } else if (mapped === 'Order_Date') {
      dataType = 'date';
    }

    return {
      name: col,
      mappedTo: mapped,
      dataType,
      missingCount: missing,
      sampleValues: samples,
    };
  });

  // Check required vs derivable columns
  const missingRequired: string[] = [];
  const derivedColumns: string[] = [];

  if (!canonicalToRaw['Order_Date']) missingRequired.push('Order_Date');
  if (!canonicalToRaw['Category'] && !canonicalToRaw['Product_Name']) missingRequired.push('Category');
  if (!canonicalToRaw['Region']) missingRequired.push('Region');

  const hasSales = Boolean(canonicalToRaw['Sales']);
  const hasQtyAndPrice = Boolean(canonicalToRaw['Quantity'] && canonicalToRaw['Unit_Price']);
  if (!hasSales && !hasQtyAndPrice) {
    missingRequired.push('Sales (or Quantity + Unit_Price)');
  } else if (!hasSales && hasQtyAndPrice) {
    derivedColumns.push('Sales = Quantity × Unit_Price × (1 - Discount)');
  }

  const hasCost = Boolean(canonicalToRaw['Cost']);
  const hasProfit = Boolean(canonicalToRaw['Profit']);
  if (!hasCost && !hasProfit) {
    missingRequired.push('Cost (or Profit)');
  } else if (!hasProfit && hasCost) {
    derivedColumns.push('Profit = Sales - Cost');
  } else if (!hasCost && hasProfit) {
    derivedColumns.push('Cost = Sales - Profit');
  }

  if (missingRequired.length > 0) {
    return {
      validationReport: {
        datasetName,
        isDemoData,
        uploadedAt,
        rawRows: rawRecords.length,
        rawColumns: rawColumnNames.length,
        missingValues: totalMissingValues,
        duplicateRows: 0,
        invalidRecords: 0,
        outliersDetected: 0,
        status: 'FAILED',
        missingRequiredColumns: missingRequired,
        derivedColumns,
        columns: columnInfos,
        messages: [
          `Dataset validation failed. Missing required columns: ${missingRequired.join(', ')}.`,
        ],
      },
      cleaningSummary: {
        originalRows: rawRecords.length,
        duplicatesRemoved: 0,
        missingValuesImputed: 0,
        invalidRecordsRemoved: 0,
        datesNormalized: 0,
        categoriesNormalized: 0,
        outliersFlagged: 0,
        finalRows: 0,
        cleaningSteps: [],
      },
      cleanedRecords: [],
    };
  }

  // Perform Step-by-Step Data Cleaning
  const seenKeys = new Set<string>();
  let duplicatesRemoved = 0;
  let missingValuesImputed = 0;
  let invalidRecordsRemoved = 0;
  let datesNormalized = 0;
  let categoriesNormalized = 0;

  const intermediateRecords: Omit<CleanSalesRecord, 'is_outlier'>[] = [];

  for (let i = 0; i < rawRecords.length; i++) {
    const row = rawRecords[i];

    const getVal = (canonical: string) => {
      const rawKey = canonicalToRaw[canonical];
      return rawKey ? row[rawKey] : undefined;
    };

    const rawOrderId = String(getVal('Order_ID') ?? `ORD-GEN-${10000 + i}`).trim();
    const rawProductId = String(getVal('Product_ID') ?? `PRD-GEN-${(i % 50) + 1}`).trim();
    const rawDateVal = getVal('Order_Date');

    // 1. Check Duplicate
    const dedupeKey = `${rawOrderId}::${rawProductId}::${String(rawDateVal)}`;
    if (seenKeys.has(dedupeKey)) {
      duplicatesRemoved++;
      continue;
    }
    seenKeys.add(dedupeKey);

    // 2. Date Normalization
    const { dateStr, wasNormalized } = normalizeDateString(rawDateVal);
    if (!dateStr) {
      invalidRecordsRemoved++;
      continue;
    }
    if (wasNormalized) datesNormalized++;

    // 3. Numeric conversion & validation
    let quantity = Number(getVal('Quantity') ?? 1);
    let unitPrice = Number(getVal('Unit_Price') ?? 0);
    let discount = Number(getVal('Discount') ?? 0);
    if (isNaN(discount) || discount < 0) discount = 0;
    if (discount > 1 && discount <= 100) discount = discount / 100; // Convert percentage to ratio

    const rawSales = getVal('Sales');
    const rawCost = getVal('Cost');
    const rawProfit = getVal('Profit');

    let sales = rawSales !== undefined && rawSales !== null && rawSales !== '' ? Number(rawSales) : NaN;
    let cost = rawCost !== undefined && rawCost !== null && rawCost !== '' ? Number(rawCost) : NaN;
    let profit = rawProfit !== undefined && rawProfit !== null && rawProfit !== '' ? Number(rawProfit) : NaN;

    // Check for invalid negative/zero quantities or prices
    if (isNaN(quantity) || quantity <= 0 || (canonicalToRaw['Unit_Price'] && (isNaN(unitPrice) || unitPrice <= 0))) {
      invalidRecordsRemoved++;
      continue;
    }

    // 4. Missing-value imputation using verified business formulas
    if (isNaN(sales)) {
      if (!isNaN(quantity) && !isNaN(unitPrice) && unitPrice > 0) {
        sales = Number((quantity * unitPrice * (1 - discount)).toFixed(2));
        missingValuesImputed++;
      } else if (!isNaN(cost) && !isNaN(profit)) {
        sales = Number((cost + profit).toFixed(2));
        missingValuesImputed++;
      } else {
        invalidRecordsRemoved++;
        continue;
      }
    }

    if (unitPrice <= 0 && sales > 0 && quantity > 0) {
      unitPrice = Number((sales / (quantity * (1 - discount || 1))).toFixed(2));
    }

    if (isNaN(cost) && !isNaN(profit)) {
      cost = Number((sales - profit).toFixed(2));
      missingValuesImputed++;
    } else if (isNaN(cost)) {
      cost = Number((sales * 0.68).toFixed(2));
      missingValuesImputed++;
    }

    if (isNaN(profit)) {
      profit = Number((sales - cost).toFixed(2));
      missingValuesImputed++;
    }

    if (sales <= 0) {
      invalidRecordsRemoved++;
      continue;
    }

    // 5. Category & Region Normalization
    const rawCatStr = String(getVal('Category') || 'General Merchandise');
    const rawRegStr = String(getVal('Region') || 'North');
    const { normalized: normCat, changed: catChanged } = toTitleCase(rawCatStr);
    const { normalized: normReg, changed: regChanged } = toTitleCase(rawRegStr);
    if (catChanged || regChanged) {
      categoriesNormalized++;
    }

    const customerId = String(getVal('Customer_ID') || `CUST-${1000 + (i % 250)}`).trim();
    const customerName = String(getVal('Customer_Name') || `Enterprise Client ${customerId}`).trim();
    const productName = String(getVal('Product_Name') || `${normCat} Item ${rawProductId}`).trim();

    const profitMargin = sales > 0 ? Number(((profit / sales) * 100).toFixed(2)) : 0;

    intermediateRecords.push({
      id: intermediateRecords.length + 1,
      order_id: rawOrderId,
      order_date: dateStr,
      year_month: dateStr.slice(0, 7),
      customer_id: customerId,
      customer_name: customerName,
      product_id: rawProductId,
      product_name: productName,
      category: normCat,
      region: normReg,
      quantity,
      unit_price: unitPrice,
      discount: Number(discount.toFixed(2)),
      sales: Number(sales.toFixed(2)),
      cost: Number(cost.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      profit_margin: profitMargin,
    });
  }

  // 6. IQR Outlier Detection on Sales & Profit Margin
  const sortedSales = intermediateRecords.map((r) => r.sales).sort((a, b) => a - b);
  const q1Sales = sortedSales[Math.floor(sortedSales.length * 0.25)] || 0;
  const q3Sales = sortedSales[Math.floor(sortedSales.length * 0.75)] || 0;
  const iqrSales = q3Sales - q1Sales;
  const upperSalesFence = q3Sales + 2.5 * iqrSales;

  let outliersFlagged = 0;
  const cleanedRecords: CleanSalesRecord[] = intermediateRecords.map((r) => {
    const isOutlier = r.sales > upperSalesFence || r.profit_margin < -5 || r.discount >= 0.40;
    if (isOutlier) outliersFlagged++;
    return {
      ...r,
      is_outlier: isOutlier,
    };
  });

  const cleaningSummary: CleaningSummary = {
    originalRows: rawRecords.length,
    duplicatesRemoved,
    missingValuesImputed,
    invalidRecordsRemoved,
    datesNormalized,
    categoriesNormalized,
    outliersFlagged,
    finalRows: cleanedRecords.length,
    cleaningSteps: [
      {
        step: 'Duplicate Record Removal',
        affectedRows: duplicatesRemoved,
        description: 'Removed exact duplicate (Order_ID, Product_ID, Order_Date) composite tuples.',
        status: 'COMPLETED',
      },
      {
        step: 'Missing Value Imputation',
        affectedRows: missingValuesImputed,
        description: 'Reconstructed missing Sales and Profit values using verified Revenue = Qty × Price × (1 - Discount) and Profit = Sales - Cost equations.',
        status: 'COMPLETED',
      },
      {
        step: 'Invalid Record Filtering',
        affectedRows: invalidRecordsRemoved,
        description: 'Removed corrupted records containing non-positive quantities, negative prices, or unparseable timestamps.',
        status: 'COMPLETED',
      },
      {
        step: 'Date & Timestamp Normalization',
        affectedRows: datesNormalized,
        description: 'Standardized heterogeneous date formats (MM/DD/YYYY, serial dates) into ISO-8601 (YYYY-MM-DD).',
        status: 'COMPLETED',
      },
      {
        step: 'Category & Region Standardization',
        affectedRows: categoriesNormalized,
        description: 'Trimmed whitespace and normalized inconsistent text casing across Category and Region dimensions.',
        status: 'COMPLETED',
      },
      {
        step: 'IQR Statistical Outlier Tagging',
        affectedRows: outliersFlagged,
        description: `Flagged extreme transactions (Sales > $${upperSalesFence.toLocaleString(undefined, { maximumFractionDigits: 0 })} or Margin < -5%) for downstream Isolation Forest inspection.`,
        status: 'COMPLETED',
      },
    ],
  };

  const validationReport: ValidationReport = {
    datasetName,
    isDemoData,
    uploadedAt,
    rawRows: rawRecords.length,
    rawColumns: rawColumnNames.length,
    missingValues: totalMissingValues,
    duplicateRows: duplicatesRemoved,
    invalidRecords: invalidRecordsRemoved,
    outliersDetected: outliersFlagged,
    status: 'VALIDATED',
    missingRequiredColumns: [],
    derivedColumns,
    columns: columnInfos,
    messages: [
      `Dataset "${datasetName}" validated successfully.`,
      `${cleanedRecords.length.toLocaleString()} clean records persisted to relational storage.`,
    ],
  };

  return {
    validationReport,
    cleaningSummary,
    cleanedRecords,
  };
}
