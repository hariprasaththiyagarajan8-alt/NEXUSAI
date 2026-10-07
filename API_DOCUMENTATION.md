# REST API Documentation (`API_DOCUMENTATION.md`)

## Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/upload` | Upload CSV or Excel `.XLSX` dataset for validation, cleaning, and ingestion. |
| `POST` | `/api/demo/load` | Load and clean the 6,500-row synthetic enterprise sales dataset. |
| `GET` | `/api/data/summary` | Retrieve validation report, cleaning summary, filter options, and PostgreSQL schema metadata. |
| `GET` | `/api/sales/overview` | Compute dynamic Executive KPIs, monthly trends, category shares, regional margins, and top products. |
| `GET` | `/api/sales/trends` | Time-series monthly sales, cost, profit, 3-month moving average, and MoM growth. |
| `GET` | `/api/sales/table` | Server-side paginated, searchable, and sortable sales transaction table. |
| `GET` | `/api/products` | SKU-level top/bottom products, unit price, discount rate, and profit margin matrix. |
| `GET` | `/api/customers` | Customer count, average LTV, purchase frequency distribution, and RFM segments. |
| `GET` | `/api/regions` | Territory sales, profit, margin, growth, and Region × Category revenue matrix. |
| `GET` | `/api/ml/evaluation` | Evaluate Sales Forecasting models, RFM K-Means++ clusters, and Isolation Forest anomalies. |
| `POST` | `/api/ml/train` | Train ML pipeline with custom forecast horizon and anomaly contamination rate. |
| `POST` | `/api/ml/predict` | Run What-If deal profitability simulation and segment-specific demand forecast. |
| `POST` | `/api/ai/insights` | Generate verified Gemini AI executive summary, risks, opportunities, and recommendations. |
| `GET` | `/api/reports` | Retrieve consolidated executive report bundle. |
| `GET` | `/api/export/csv` | Export clean CSV tables (`sales`, `kpis`, `ml_forecast`, `customer_segments`) for Power BI. |
