import { RawSalesRecord } from './types';

// Deterministic PRNG (Mulberry32) so demo data is 100% consistent and reproducible
function createRng(seed: number) {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  unitCostRatio: number; // cost as fraction of unitPrice
}

const CATALOG: CatalogProduct[] = [
  // Enterprise Electronics
  { id: 'PRD-1001', name: 'ProBook Workstation X1', category: 'Electronics', unitPrice: 1450, unitCostRatio: 0.72 },
  { id: 'PRD-1002', name: 'UltraWide 34" 4K Monitor', category: 'Electronics', unitPrice: 680, unitCostRatio: 0.68 },
  { id: 'PRD-1003', name: 'Noise-Canceling Conference Hub', category: 'Electronics', unitPrice: 320, unitCostRatio: 0.61 },
  { id: 'PRD-1004', name: 'Thunderbolt 4 Docking Station', category: 'Electronics', unitPrice: 240, unitCostRatio: 0.58 },
  { id: 'PRD-1005', name: 'Enterprise Wi-Fi 7 Mesh Router', category: 'Electronics', unitPrice: 490, unitCostRatio: 0.65 },
  // Cloud & Software Peripherals
  { id: 'PRD-2001', name: 'Biometric Security Key Pack (10x)', category: 'Security & Peripherals', unitPrice: 420, unitCostRatio: 0.52 },
  { id: 'PRD-2002', name: 'Ergonomic Mechanical Keyboard Pro', category: 'Security & Peripherals', unitPrice: 165, unitCostRatio: 0.55 },
  { id: 'PRD-2003', name: 'Precision Laser Trackpad Wireless', category: 'Security & Peripherals', unitPrice: 125, unitCostRatio: 0.54 },
  { id: 'PRD-2004', name: 'Encrypted NVMe External SSD 2TB', category: 'Security & Peripherals', unitPrice: 290, unitCostRatio: 0.64 },
  // Office Furniture
  { id: 'PRD-3001', name: 'ErgoSpine Executive Mesh Chair', category: 'Office Systems', unitPrice: 590, unitCostRatio: 0.66 },
  { id: 'PRD-3002', name: 'Dual-Motor Standing Desk 60"', category: 'Office Systems', unitPrice: 740, unitCostRatio: 0.71 },
  { id: 'PRD-3003', name: 'Acoustic Privacy Pod Panel Set', category: 'Office Systems', unitPrice: 410, unitCostRatio: 0.69 },
  { id: 'PRD-3004', name: 'Modular Cable Management Spine', category: 'Office Systems', unitPrice: 85, unitCostRatio: 0.50 },
  // Beverages & Pantry Supplies
  { id: 'PRD-4001', name: 'Artisan Single-Origin Espresso Beans (5kg)', category: 'Beverages & Hospitality', unitPrice: 145, unitCostRatio: 0.51 },
  { id: 'PRD-4002', name: 'Commercial Cold-Brew Dispenser Keg', category: 'Beverages & Hospitality', unitPrice: 210, unitCostRatio: 0.56 },
  { id: 'PRD-4003', name: 'Organic Matcha & Herbal Tea Crate', category: 'Beverages & Hospitality', unitPrice: 95, unitCostRatio: 0.48 },
  { id: 'PRD-4004', name: 'Sparkling Mineral Water Case (48x)', category: 'Beverages & Hospitality', unitPrice: 68, unitCostRatio: 0.59 },
  // Data Center & Power
  { id: 'PRD-5001', name: 'Rackmount UPS 3000VA Pure Sine', category: 'Infrastructure', unitPrice: 980, unitCostRatio: 0.74 },
  { id: 'PRD-5002', name: '24-Port Managed PoE+ Switch', category: 'Infrastructure', unitPrice: 620, unitCostRatio: 0.67 },
  { id: 'PRD-5003', name: 'Cat8 Shielded Patch Bundle (50m)', category: 'Infrastructure', unitPrice: 190, unitCostRatio: 0.53 },
];

const REGIONS = [
  { name: 'North', weight: 0.28, discountBias: 0.04, growthFactor: 1.14 },
  { name: 'West', weight: 0.30, discountBias: 0.05, growthFactor: 1.18 },
  { name: 'East', weight: 0.24, discountBias: 0.06, growthFactor: 1.07 },
  { name: 'South', weight: 0.18, discountBias: 0.16, growthFactor: 0.88 }, // Underperforming region with heavier discounting
];

const COMPANY_PREFIXES = [
  'Apex', 'Vanguard', 'Meridian', 'Aether', 'Solstice', 'Kinetix', 'Stratos', 'Vertex',
  'Horizon', 'Quantum', 'Pinnacle', 'Atlas', 'Cobalt', 'Nexus', 'Orion', 'lumina',
  'Vector', 'Synergy', 'Boreal', 'Catalyst', 'Obsidian', 'Zenith', 'Summit', 'Prime'
];

const COMPANY_SUFFIXES = [
  'Holdings', 'Technologies', 'Logistics', 'Health', 'Financial', 'Dynamics',
  'Partners', 'Group', 'Labs', 'Enterprise', 'Solutions', 'Industries', 'Ventures', 'Capital'
];

export function generateSyntheticDemoRecords(targetCount = 6500): RawSalesRecord[] {
  const rng = createRng(20260415);
  const records: RawSalesRecord[] = [];

  // Create 320 distinct B2B/Enterprise customers with realistic RFM tiers
  const customers: {
    id: string;
    name: string;
    tier: 'champion' | 'regular' | 'emerging' | 'at_risk';
    preferredRegion: string;
  }[] = [];

  for (let i = 1; i <= 320; i++) {
    const r = rng();
    const tier =
      r < 0.16 ? 'champion' :
      r < 0.55 ? 'regular' :
      r < 0.82 ? 'emerging' : 'at_risk';
    const prefix = COMPANY_PREFIXES[i % COMPANY_PREFIXES.length];
    const suffix = COMPANY_SUFFIXES[(i * 7) % COMPANY_SUFFIXES.length];
    const regPick = rng();
    let preferredRegion = 'North';
    let acc = 0;
    for (const reg of REGIONS) {
      acc += reg.weight;
      if (regPick <= acc) {
        preferredRegion = reg.name;
        break;
      }
    }
    customers.push({
      id: `CUST-${String(1000 + i)}`,
      name: `${prefix} ${suffix} #${i}`,
      tier,
      preferredRegion,
    });
  }

  // Generate 24 months of historical transactions (from 2024-04-01 to 2026-03-31)
  const startMs = Date.UTC(2024, 3, 1); // April 1, 2024
  const endMs = Date.UTC(2026, 2, 31);  // March 31, 2026
  const totalSpanMs = endMs - startMs;

  const cleanCount = targetCount - 35; // Reserve 35 rows for intentional duplicates & invalid records

  for (let i = 1; i <= cleanCount; i++) {
    // Pick customer weighted by tier frequency
    let custIdx = Math.floor(rng() * customers.length);
    const cust = customers[custIdx];

    // Determine transaction timestamp based on customer tier and seasonal curve
    let timeProgress = rng();
    if (cust.tier === 'at_risk') {
      // At-risk customers mostly purchased in the first 14 months
      timeProgress = rng() * 0.58;
    } else if (cust.tier === 'champion') {
      // Champions buy consistently with upward bias in recent months
      timeProgress = Math.pow(rng(), 0.85);
    } else if (cust.tier === 'emerging') {
      // Emerging customers started recently
      timeProgress = 0.55 + rng() * 0.45;
    }

    const orderMs = startMs + Math.floor(timeProgress * totalSpanMs);
    const dt = new Date(orderMs);
    const year = dt.getUTCFullYear();
    const month = dt.getUTCMonth() + 1;
    const day = dt.getUTCDate();

    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // Introduce occasional slash date format to test date normalization
    const rawDate = i % 47 === 0 ? `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}` : isoDate;

    // Pick region (85% customer's preferred region, 15% other)
    const regionObj = rng() < 0.85
      ? REGIONS.find((r) => r.name === cust.preferredRegion) || REGIONS[0]
      : REGIONS[Math.floor(rng() * REGIONS.length)];

    // Pick product with seasonal and regional weighting
    let prodIdx = Math.floor(rng() * CATALOG.length);
    if (month === 11 || month === 12) {
      // Q4 surge in Electronics & Infrastructure
      if (rng() < 0.45) {
        prodIdx = Math.floor(rng() * 5); // Electronics
      }
    }
    const product = CATALOG[prodIdx];

    // Quantity based on tier & upward time growth
    const seasonalBoost = (month === 11 || month === 12) ? 1.25 : (month === 1 || month === 2) ? 0.90 : 1.05;
    const trendMultiplier = 1 + timeProgress * 0.22 * (regionObj.growthFactor);
    let baseQty = cust.tier === 'champion' ? 6 + Math.floor(rng() * 14)
      : cust.tier === 'regular' ? 3 + Math.floor(rng() * 8)
      : 1 + Math.floor(rng() * 5);
    let quantity = Math.max(1, Math.round(baseQty * seasonalBoost * (0.8 + rng() * 0.4) * (trendMultiplier > 1 ? 1.1 : 0.95)));

    // Discount calculation
    const rawDiscount = Math.min(0.35, Math.max(0, Number((regionObj.discountBias + (rng() - 0.35) * 0.12).toFixed(2))));
    let discount = rawDiscount < 0.02 ? 0 : rawDiscount;

    // Inject ~1.4% realistic business anomalies for Isolation Forest detection
    const isAnomaly = i % 73 === 0;
    let unitPrice = product.unitPrice;
    let costRatio = product.unitCostRatio + (rng() - 0.5) * 0.04;

    if (isAnomaly) {
      if (i % 2 === 0) {
        // Extreme unauthorized discount + high quantity causing negative profit margin
        discount = 0.48;
        quantity = 35 + Math.floor(rng() * 25);
      } else {
        // Emergency expedited order with massive quantity spike
        quantity = 45 + Math.floor(rng() * 30);
        costRatio = product.unitCostRatio * 1.18;
      }
    }

    const sales = Number((quantity * unitPrice * (1 - discount)).toFixed(2));
    const cost = Number((quantity * unitPrice * costRatio).toFixed(2));
    const profit = Number((sales - cost).toFixed(2));

    // Introduce occasional unnormalized category/region casing so cleaning summary demonstrates normalization
    const rawCategory = i % 53 === 0 ? `  ${product.category.toLowerCase()} ` : product.category;
    const rawRegion = i % 67 === 0 ? regionObj.name.toUpperCase() : regionObj.name;

    const record: RawSalesRecord = {
      Order_ID: `ORD-${20240000 + i}`,
      Order_Date: rawDate,
      Customer_ID: cust.id,
      Customer_Name: cust.name,
      Product_ID: product.id,
      Product_Name: product.name,
      Category: rawCategory,
      Region: rawRegion,
      Quantity: quantity,
      Unit_Price: unitPrice,
      Discount: discount,
      Sales: i % 89 === 0 ? undefined : sales, // Missing Sales in ~73 rows (can be imputed from Qty * Price * (1-Discount))
      Cost: cost,
      Profit: i % 103 === 0 ? undefined : profit, // Missing Profit in ~63 rows (can be imputed from Sales - Cost)
    };

    records.push(record);
  }

  // Inject 24 exact duplicate rows to test duplicate removal
  for (let d = 0; d < 24; d++) {
    const sourceRecord = records[d * 50];
    if (sourceRecord) {
      records.push({ ...sourceRecord });
    }
  }

  // Inject 11 invalid records (e.g. negative quantity or zero unit price or missing critical date)
  for (let inv = 0; inv < 11; inv++) {
    records.push({
      Order_ID: `ORD-INV-${900 + inv}`,
      Order_Date: inv % 3 === 0 ? 'INVALID_DATE' : '2025-08-14',
      Customer_ID: 'CUST-1005',
      Customer_Name: 'Aether Health #5',
      Product_ID: 'PRD-1001',
      Product_Name: 'ProBook Workstation X1',
      Category: 'Electronics',
      Region: 'South',
      Quantity: inv % 2 === 0 ? -5 : 0,
      Unit_Price: inv % 3 === 0 ? -100 : 1450,
      Discount: 0.1,
      Sales: -7250,
      Cost: 5000,
      Profit: -12250,
    });
  }

  return records;
}
