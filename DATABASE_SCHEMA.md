# Database Schema (`DATABASE_SCHEMA.md`)

## Relational Tables (PostgreSQL 16)

1. **`users`**: Stores platform users, roles, and hashed credentials.
2. **`customers`**: Dimension table storing `customer_id` (PK), `customer_name`, `rfm_recency_days`, `rfm_frequency`, `rfm_monetary`, and K-Means `customer_segment`.
3. **`products`**: Dimension table storing `product_id` (PK), `product_name`, `category`, and `unit_price`.
4. **`sales`**: Central fact table storing cleaned order line items (`id` PK, `order_id`, `order_date`, `customer_id` FK, `product_id` FK, `category`, `region`, `quantity`, `unit_price`, `discount`, `sales`, `cost`, `profit`, `is_outlier`).
5. **`predictions`**: Stores historical validation predictions, future forecast horizons, and evaluation metrics (`mae`, `rmse`, `r2_score`).
6. **`ai_insights`**: Persists verified input JSON payloads and structured Gemini AI executive insights.

See [`database/schema.sql`](./database/schema.sql) for the complete executable DDL and B-tree index definitions.
