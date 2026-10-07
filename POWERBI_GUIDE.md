# Power BI Integration Guide (`POWERBI_GUIDE.md`)

## Connecting Power BI Desktop to NexusBI

NexusBI provides two direct integration paths for Microsoft Power BI:

### Path A: Clean Star-Schema CSV Exports (Recommended for Rapid BI Modeling)
Navigate to the **Reports** page in the web application and export the four pre-modeled datasets:
1. `cleaned_sales_fact_table.csv` (`/api/export/csv?type=sales`) — Central Fact Table.
2. `powerbi_kpi_summary.csv` (`/api/export/csv?type=kpis`) — Executive KPI Summary Table.
3. `powerbi_ml_forecast.csv` (`/api/export/csv?type=ml_forecast`) — Historical + Holdout + Future Forecast Horizon Table.
4. `powerbi_customer_rfm_segments.csv` (`/api/export/csv?type=customer_segments`) — Customer RFM Dimension Table.

### Path B: Direct PostgreSQL Connector
1. In Power BI Desktop, click **Get Data → Database → PostgreSQL database**.
2. Enter your PostgreSQL server and database name (`sales_analytics_db`).
3. Select the `sales`, `customers`, `products`, `predictions`, and `ai_insights` tables.
4. Verify the `1:*` relationships (`customers[customer_id] → sales[customer_id]` and `products[product_id] → sales[product_id]`).

## Recommended Power BI Report Pages
1. **Executive Dashboard**
2. **Sales Analysis**
3. **Product Analysis**
4. **Customer Analysis (RFM)**
5. **Regional Analysis**
6. **ML Insights (Forecasting & Anomalies)**
7. **AI Recommendations**
