-- PostgreSQL 16 Schema for AI-Powered Sales Analytics & Business Intelligence System

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL DEFAULT 'analyst',
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(32) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    preferred_region VARCHAR(64),
    rfm_recency_days INT NOT NULL DEFAULT 0,
    rfm_frequency INT NOT NULL DEFAULT 1,
    rfm_monetary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    customer_segment VARCHAR(64) NOT NULL DEFAULT 'Regular',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    product_id VARCHAR(32) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    order_date DATE NOT NULL,
    customer_id VARCHAR(32) NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    product_id VARCHAR(32) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    region VARCHAR(64) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
    discount NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0 AND discount <= 1),
    sales NUMERIC(12, 2) NOT NULL,
    cost NUMERIC(12, 2) NOT NULL,
    profit NUMERIC(12, 2) NOT NULL,
    is_outlier BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS predictions (
    prediction_id SERIAL PRIMARY KEY,
    period VARCHAR(16) NOT NULL,
    model_name VARCHAR(128) NOT NULL,
    actual_sales NUMERIC(12, 2),
    predicted_sales NUMERIC(12, 2) NOT NULL,
    lower_bound NUMERIC(12, 2),
    upper_bound NUMERIC(12, 2),
    mae NUMERIC(12, 2),
    rmse NUMERIC(12, 2),
    r2_score NUMERIC(6, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_insights (
    insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_name VARCHAR(255) NOT NULL,
    verified_payload JSONB NOT NULL,
    executive_summary TEXT NOT NULL,
    recommendations JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_order_date ON sales(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(category);
CREATE INDEX IF NOT EXISTS idx_sales_region ON sales(region);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(customer_segment);
