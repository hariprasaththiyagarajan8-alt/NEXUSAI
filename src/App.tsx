import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Upload,
  ShieldCheck,
  TrendingUp,
  Package,
  Users,
  Globe,
  BrainCircuit,
  LineChart,
  Sparkles,
  FileText,
  Info,
  Settings,
  Database,
  Download,
  Menu,
  X,
} from 'lucide-react';
import {
  CleaningSummary,
  FilterOptions,
  GlobalFilterState,
  NavPageId,
  ValidationReport,
} from './types/analytics';
import { buildFilterQueryString } from './services/api';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { DataUploadPage } from './pages/DataUploadPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { SalesAnalyticsPage } from './pages/SalesAnalyticsPage';
import { ProductAnalysisPage } from './pages/ProductAnalysisPage';
import { CustomerAnalysisPage } from './pages/CustomerAnalysisPage';
import { RegionalAnalysisPage } from './pages/RegionalAnalysisPage';
import { MachineLearningPage } from './pages/MachineLearningPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AboutPage } from './pages/AboutPage';
import { SettingsPage } from './pages/SettingsPage';

interface NavItem {
  id: NavPageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIDEBAR_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Data Upload', icon: Upload },
  { id: 'quality', label: 'Data Quality', icon: ShieldCheck },
  { id: 'sales', label: 'Sales Analytics', icon: TrendingUp },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'regions', label: 'Regions', icon: Globe },
  { id: 'ml', label: 'Machine Learning', icon: BrainCircuit },
  { id: 'predictions', label: 'Predictions', icon: LineChart },
  { id: 'ai', label: 'AI Insights', icon: Sparkles },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'about', label: 'About', icon: Info },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function App() {
  const [activePage, setActivePage] = useState<NavPageId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [cleaningSummary, setCleaningSummary] = useState<CleaningSummary | null>(null);
  const [schemaSummary, setSchemaSummary] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const [defaultHorizon, setDefaultHorizon] = useState(6);
  const [defaultContamination, setDefaultContamination] = useState(0.02);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    regions: [],
    products: [],
    segments: [],
    minDate: '2024-04-01',
    maxDate: '2026-03-31',
  });

  const [filters, setFilters] = useState<GlobalFilterState>({
    startDate: '2024-04-01',
    endDate: '2026-03-31',
    category: 'ALL',
    product: 'ALL',
    region: 'ALL',
    customer: 'ALL',
    segment: 'ALL',
  });

  const fetchDataSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/data/summary');
      if (res.ok) {
        const data = await res.json();
        setValidationReport(data.validationReport);
        setCleaningSummary(data.cleaningSummary);
        setSchemaSummary(data.schema);
        if (data.filterOptions) {
          setFilterOptions(data.filterOptions);
          setFilters((prev) => ({
            ...prev,
            startDate: data.filterOptions.minDate,
            endDate: data.filterOptions.maxDate,
          }));
        }
      }
    } catch (e) {
      console.error('Error fetching data summary:', e);
    }
  }, []);

  useEffect(() => {
    fetchDataSummary();
  }, [fetchDataSummary]);

  const handleDatasetUpdated = async () => {
    await fetchDataSummary();
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: filterOptions.minDate,
      endDate: filterOptions.maxDate,
      category: 'ALL',
      product: 'ALL',
      region: 'ALL',
      customer: 'ALL',
      segment: 'ALL',
    });
  };

  const handleQuickLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch('/api/demo/load', { method: 'POST' });
      if (res.ok) {
        await handleDatasetUpdated();
      }
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleQuickExportCsv = () => {
    const qs = buildFilterQueryString(filters, { type: 'sales' });
    window.location.href = `/api/export/csv${qs}`;
  };

  const showFilterBar = [
    'dashboard',
    'sales',
    'products',
    'customers',
    'regions',
    'ml',
    'ai',
    'reports',
  ].includes(activePage);

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900">
      {/* Desktop Sidebar (256px width) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-slate-900 text-slate-300 shrink-0 border-r border-slate-800">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-base font-bold tracking-tight text-white">
            NexusBI
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-medium text-slate-200 truncate">
            {validationReport?.datasetName || 'DEMO_ENTERPRISE_SALES_6500.CSV'}
          </div>
          <div className="font-mono tabular-nums">
            {cleaningSummary?.finalRows?.toLocaleString() || '6,465'} clean records
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 bg-slate-900 text-slate-300 flex flex-col z-10">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-base font-bold text-white">NexusBI</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActivePage(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract (Strictly 3 Zones: Brand Wordmark, 5 Nav Links, 2 Primary Actions) */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900"
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                setActivePage('dashboard');
              }}
              className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap"
            >
              NexusBI Analytics
            </a>
          </div>

          {/* Zone 2: 5 Clean Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActivePage('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                activePage === 'dashboard' ? 'text-blue-600 font-semibold underline underline-offset-4' : ''
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActivePage('upload')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                activePage === 'upload' ? 'text-blue-600 font-semibold underline underline-offset-4' : ''
              }`}
            >
              Data Pipeline
            </button>
            <button
              type="button"
              onClick={() => setActivePage('sales')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                activePage === 'sales' ? 'text-blue-600 font-semibold underline underline-offset-4' : ''
              }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setActivePage('ml')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                activePage === 'ml' ? 'text-blue-600 font-semibold underline underline-offset-4' : ''
              }`}
            >
              Machine Learning
            </button>
            <button
              type="button"
              onClick={() => setActivePage('ai')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                activePage === 'ai' ? 'text-blue-600 font-semibold underline underline-offset-4' : ''
              }`}
            >
              Gemini AI
            </button>
          </nav>

          {/* Zone 3: 2 Primary Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleQuickLoadDemo}
              disabled={loadingDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              {loadingDemo ? 'Loading Demo...' : 'Load Demo Dataset'}
            </button>

            <button
              type="button"
              onClick={handleQuickExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </header>

        {/* Global Filter Bar */}
        {showFilterBar && (
          <GlobalFilterBar
            filters={filters}
            options={filterOptions}
            onChange={setFilters}
            onReset={handleResetFilters}
          />
        )}

        {/* Main Viewport */}
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto">
          {activePage === 'dashboard' && (
            <ExecutiveDashboard
              filters={filters}
              onNavigate={setActivePage}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activePage === 'upload' && (
            <DataUploadPage
              validationReport={validationReport}
              cleaningSummary={cleaningSummary}
              onDatasetUpdated={handleDatasetUpdated}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'quality' && (
            <DataQualityPage
              validationReport={validationReport}
              cleaningSummary={cleaningSummary}
              schemaSummary={schemaSummary}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'sales' && (
            <SalesAnalyticsPage
              filters={filters}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activePage === 'products' && (
            <ProductAnalysisPage
              filters={filters}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activePage === 'customers' && (
            <CustomerAnalysisPage
              filters={filters}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activePage === 'regions' && (
            <RegionalAnalysisPage
              filters={filters}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activePage === 'ml' && (
            <MachineLearningPage
              filters={filters}
              refreshTrigger={refreshTrigger}
              defaultHorizon={defaultHorizon}
              defaultContamination={defaultContamination}
            />
          )}

          {activePage === 'predictions' && (
            <PredictionsPage
              options={filterOptions}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activePage === 'ai' && (
            <AIInsightsPage
              filters={filters}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activePage === 'reports' && (
            <ReportsPage
              filters={filters}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activePage === 'about' && <AboutPage />}

          {activePage === 'settings' && (
            <SettingsPage
              defaultHorizon={defaultHorizon}
              defaultContamination={defaultContamination}
              onUpdateMlDefaults={(h, c) => {
                setDefaultHorizon(h);
                setDefaultContamination(c);
              }}
              onReloadDemo={handleQuickLoadDemo}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
