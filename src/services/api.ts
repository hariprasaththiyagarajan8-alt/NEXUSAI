import { GlobalFilterState } from '../types/analytics';

export function buildFilterQueryString(
  filters: GlobalFilterState,
  extraParams?: Record<string, string | number | undefined>
): string {
  const params = new URLSearchParams();
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.category && filters.category !== 'ALL') params.set('category', filters.category);
  if (filters.product && filters.product !== 'ALL') params.set('product', filters.product);
  if (filters.region && filters.region !== 'ALL') params.set('region', filters.region);
  if (filters.customer && filters.customer !== 'ALL') params.set('customer', filters.customer);
  if (filters.segment && filters.segment !== 'ALL') params.set('segment', filters.segment);

  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      if (v !== undefined && v !== '') {
        params.set(k, String(v));
      }
    }
  }

  const str = params.toString();
  return str ? `?${str}` : '';
}

export function formatCurrency(value: number, compact = false): string {
  if (isNaN(value)) return '$0';
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number, includeSign = false): string {
  if (isNaN(value)) return '0.0%';
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
