import React from 'react';
import { RotateCcw, Filter } from 'lucide-react';
import { FilterOptions, GlobalFilterState } from '../types/analytics';

interface GlobalFilterBarProps {
  filters: GlobalFilterState;
  options: FilterOptions;
  onChange: (next: GlobalFilterState) => void;
  onReset: () => void;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  filters,
  options,
  onChange,
  onReset,
}) => {
  const hasActiveFilters =
    filters.category !== 'ALL' ||
    filters.region !== 'ALL' ||
    filters.product !== 'ALL' ||
    filters.segment !== 'ALL' ||
    (filters.startDate && filters.startDate !== options.minDate) ||
    (filters.endDate && filters.endDate !== options.maxDate);

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 pr-2 border-r border-slate-200">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Global Scope</span>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-slate-500 font-medium">From</label>
            <input
              type="date"
              value={filters.startDate || options.minDate}
              min={options.minDate}
              max={options.maxDate}
              onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
            />
            <label className="text-slate-500 font-medium">To</label>
            <input
              type="date"
              value={filters.endDate || options.maxDate}
              min={options.minDate}
              max={options.maxDate}
              onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-slate-500 font-medium">Region</label>
            <select
              value={filters.region}
              onChange={(e) => onChange({ ...filters, region: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Regions</option>
              {options.regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-slate-500 font-medium">Category</label>
            <select
              value={filters.category}
              onChange={(e) =>
                onChange({ ...filters, category: e.target.value, product: 'ALL' })
              }
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Categories</option>
              {options.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-slate-500 font-medium">Product</label>
            <select
              value={filters.product}
              onChange={(e) => onChange({ ...filters, product: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 max-w-[180px] truncate focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Products ({options.products.length})</option>
              {options.products.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Segment Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-slate-500 font-medium">RFM Segment</label>
            <select
              value={filters.segment}
              onChange={(e) => onChange({ ...filters, segment: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">All Segments</option>
              {options.segments.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
