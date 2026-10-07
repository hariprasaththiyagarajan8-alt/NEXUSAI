# NexusBI — AI-Powered Sales Analytics and Business Intelligence System

An end-to-end **M.Sc. Data Science Final-Year / Enterprise BI Project** combining automated data validation and cleaning, relational SQL storage, exploratory data analysis (EDA), machine learning (Sales Forecasting, RFM K-Means Customer Segmentation, Isolation Forest Anomaly Detection), interactive visualization, Power BI star-schema exports, and verified Google Gemini AI executive insights.

---

## Core Architecture Workflow

```text
RAW SALES DATA (CSV / XLSX / 6,500-Row Synthetic Demo)
  ↓
DATA VALIDATION & CLEANING PIPELINE
  ↓
RELATIONAL SQL STORAGE (PostgreSQL Schema)
  ↓
DYNAMIC KPI & EXPLORATORY DATA ANALYTICS
  ↓
MACHINE LEARNING (Forecasting · K-Means RFM · Isolation Forest)
  ↓
VERIFIED JSON PAYLOAD → GOOGLE GEMINI API (Server-Side)
  ↓
EXECUTIVE INSIGHTS, RECOMMENDATIONS & POWER BI EXPORTS
```

---

## Key Features

1. **Automated Data Ingestion & Validation (`/api/upload`, `/api/demo/load`)**:
   - Supports `.CSV` and Excel `.XLSX` uploads plus a 1-click **6,500-row Synthetic Enterprise Demo Dataset** (`DEMO_ENTERPRISE_SALES_6500.CSV`).
   - Validates required schema columns and gracefully explains missing columns without crashing.
2. **Data Cleaning Pipeline**:
   - Composite duplicate removal (`Order_ID`, `Product_ID`, `Order_Date`).
   - Formula-verified missing-value imputation (`Sales = Quantity × Unit_Price × (1 - Discount)`, `Profit = Sales - Cost`).
   - ISO-8601 date standardization, category/region normalization, invalid record filtering, and IQR statistical outlier tagging.
3. **Dynamic Business KPIs & Multi-Dimensional Analytics**:
   - Calculates Total Sales, Total Profit, Total Orders, Total Quantity, Average Order Value, Profit Margin, Sales Growth, Top Product, Top Category, Leading Region, and Underperforming Region dynamically across global filters.
4. **Machine Learning Suite (`/api/ml/evaluation`, `/api/ml/train`, `/api/ml/predict`)**:
   - **Option A — Sales Forecasting**: Compares Gradient Boosting Regressor, Random Forest Regressor, and Seasonal OLS Linear Regression with holdout MAE, RMSE, R², and MAPE metrics.
   - **Option B — Customer Segmentation**: RFM (Recency, Frequency, Monetary) K-Means++ clustering ($k=4$) with Silhouette Score evaluation and data-driven segment labeling (`High Value`, `Regular`, `Low Value`, `At Risk`).
   - **Option C — Anomaly Detection**: Isolation Forest algorithm scoring multi-dimensional transaction extremity to surface unauthorized bulk discounts and margin losses.
5. **Anti-Fabrication Gemini AI Business Insights (`/api/ai/insights`)**:
   - Sends only verified analytical JSON metrics to server-side `gemini-3.8-flash` (`@google/genai`), with a deterministic fallback engine if the AI service is temporarily unavailable.

---

## Quick Start & Execution

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start full-stack server on http://localhost:3000
npm run dev

# Production build
npm run build
npm start
```

---

## Documentation Index

- [`PROJECT_ARCHITECTURE.md`](./PROJECT_ARCHITECTURE.md)
- [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)
- [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)
- [`ML_DOCUMENTATION.md`](./ML_DOCUMENTATION.md)
- [`GEMINI_AI_DOCUMENTATION.md`](./GEMINI_AI_DOCUMENTATION.md)
- [`POWERBI_GUIDE.md`](./POWERBI_GUIDE.md)
