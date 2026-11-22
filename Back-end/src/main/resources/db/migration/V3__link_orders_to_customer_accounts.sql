ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_user_id UUID REFERENCES store_users(id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_user_id ON orders (customer_user_id);
