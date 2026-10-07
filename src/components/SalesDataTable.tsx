import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { GlobalFilterState, SalesRecordRow } from '../types/analytics';
import { buildFilterQueryString, formatCurrency, formatNumber } from '../services/api';

interface SalesDataTableProps {
  filters: GlobalFilterState;
  refreshTrigger?: number;
}

interface ColumnDef {
  key: keyof SalesRecordRow;
  label: string;
  align: 'left' | 'right';
  defaultVisible: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'order_id', label: 'Order ID', align: 'left', defaultVisible: true },
  { key: 'order_date', label: 'Date', align: 'left', defaultVisible: true },
  { key: 'customer_name', label: 'Customer', align: 'left', defaultVisible: true },
  { key: 'customer_segment', label: 'Segment', align: 'left', defaultVisible: false },
  { key: 'product_name', label: 'Product', align: 'left', defaultVisible: true },
  { key: 'category', label: 'Category', align: 'left', defaultVisible: true },
  { key: 'region', label: 'Region', align: 'left', defaultVisible: true },
  { key: 'quantity', label: 'Quantity', align: 'right', defaultVisible: true },
  { key: 'unit_price', label: 'Unit Price', align: 'right', defaultVisible: false },
  { key: 'discount', label: 'Discount', align: 'right', defaultVisible: false },
  { key: 'sales', label: 'Sales', align: 'right', defaultVisible: true },
  { key: 'cost', label: 'Cost', align: 'right', defaultVisible: true },
  { key: 'profit', label: 'Profit', align: 'right', defaultVisible: true },
  { key: 'profit_margin', label: 'Margin %', align: 'right', defaultVisible: false },
];

export const SalesDataTable: React.FC<SalesDataTableProps> = ({
  filters,
  refreshTrigger = 0,
}) => {
  const [rows, setRows] = useState<SalesRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof SalesRecordRow>('order_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const c of ALL_COLUMNS) {
      map[c.key] = c.defaultVisible;
    }
    return map;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const fetchTable = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildFilterQueryString(filters, {
        search: debouncedSearch,
        sortBy,
        sortDir,
        page,
        pageSize,
      });
      const res = await fetch(`/api/sales/table${qs}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows || []);
        setTotalRows(data.totalRows || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error('Error loading sales table:', e);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, sortBy, sortDir, page, pageSize]);

  useEffect(() => {
    fetchTable();
  }, [fetchTable, refreshTrigger]);

  const handleSort = (colKey: keyof SalesRecordRow) => {
    if (sortBy === colKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(colKey);
      setSortDir('desc');
    }
  };

  const toggleColumn = (colKey: string) => {
    setVisibleCols((prev) => ({
      ...prev,
      [colKey]: !prev[colKey],
    }));
  };

  const handleExportCsv = () => {
    const qs = buildFilterQueryString(filters, { type: 'sales' });
    window.location.href = `/api/export/csv${qs}`;
  };

  const activeColumns = ALL_COLUMNS.filter((c) => visibleCols[c.key]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Table Header & Controls */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Validated Sales Transaction Ledger
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            Showing {rows.length} of {formatNumber(totalRows)} filtered records · Relational SQL Table: <span className="font-mono text-slate-700">sales</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order ID, Customer, SKU..."
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white w-60"
            />
          </div>

          {/* Column Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              Columns ({activeColumns.length})
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-20">
                <div className="px-3 py-1 text-[11px] font-medium text-slate-400 border-b border-slate-100">
                  Toggle Table Columns
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {ALL_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(visibleCols[col.key])}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {activeColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`py-2.5 px-4 text-xs font-semibold text-slate-600 cursor-pointer select-none hover:text-slate-900 whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortBy === col.key ? 'text-blue-600 opacity-100' : 'text-slate-400 opacity-60'
                      }`}
                    />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {activeColumns.map((c) => (
                    <td key={c.key} className="py-3 px-4">
                      <div className="h-3.5 bg-slate-100 rounded w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={activeColumns.length}
                  className="py-10 text-center text-slate-500 text-sm"
                >
                  No sales transactions match the current search or filter criteria.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={`${row.id}-${row.order_id}`}
                  className="hover:bg-slate-50/90 transition-colors"
                >
                  {activeColumns.map((col) => {
                    const val = row[col.key];
                    if (col.key === 'order_id') {
                      return (
                        <td
                          key={col.key}
                          className="py-2.5 px-4 font-mono text-slate-900 font-medium whitespace-nowrap"
                        >
                          {String(val)}
                        </td>
                      );
                    }
                    if (col.key === 'order_date') {
                      return (
                        <td
                          key={col.key}
                          className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap"
                        >
                          {String(val)}
                        </td>
                      );
                    }
                    if (col.key === 'sales' || col.key === 'cost' || col.key === 'unit_price') {
                      return (
                        <td
                          key={col.key}
                          className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-800 whitespace-nowrap"
                        >
                          {formatCurrency(Number(val))}
                        </td>
                      );
                    }
                    if (col.key === 'profit') {
                      const num = Number(val);
                      return (
                        <td
                          key={col.key}
                          className={`py-2.5 px-4 font-mono tabular-nums text-right font-medium whitespace-nowrap ${
                            num < 0 ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {formatCurrency(num)}
                        </td>
                      );
                    }
                    if (col.key === 'profit_margin') {
                      const num = Number(val);
                      return (
                        <td
                          key={col.key}
                          className={`py-2.5 px-4 font-mono tabular-nums text-right whitespace-nowrap ${
                            num < 0 ? 'text-red-600 font-medium' : 'text-slate-700'
                          }`}
                        >
                          {num.toFixed(1)}%
                        </td>
                      );
                    }
                    if (col.key === 'discount') {
                      return (
                        <td
                          key={col.key}
                          className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-600 whitespace-nowrap"
                        >
                          {(Number(val) * 100).toFixed(0)}%
                        </td>
                      );
                    }
                    if (col.key === 'quantity') {
                      return (
                        <td
                          key={col.key}
                          className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-800 whitespace-nowrap"
                        >
                          {formatNumber(Number(val))}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={col.key}
                        className="py-2.5 px-4 text-slate-700 whitespace-nowrap max-w-[200px] truncate"
                        title={String(val ?? '')}
                      >
                        {String(val ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-3 font-mono tabular-nums">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
