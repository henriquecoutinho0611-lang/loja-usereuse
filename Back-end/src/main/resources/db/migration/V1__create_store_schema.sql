CREATE TABLE store_users (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    cpf VARCHAR(11),
    role VARCHAR(20) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_store_users_email UNIQUE (email),
    CONSTRAINT uk_store_users_cpf UNIQUE (cpf)
);

CREATE TABLE products (
    id UUID PRIMARY KEY,
    title VARCHAR(140) NOT NULL,
    description TEXT NOT NULL,
    department VARCHAR(80) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    old_price NUMERIC(12,2),
    width NUMERIC(8,2) NOT NULL,
    height NUMERIC(8,2) NOT NULL,
    image VARCHAR(1000) NOT NULL,
    ambient_image VARCHAR(1000),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_products_department_active ON products (department, active);
CREATE INDEX idx_products_featured ON products (featured, active);

CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_name VARCHAR(120) NOT NULL,
    customer_email VARCHAR(180) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    zip_code VARCHAR(9) NOT NULL,
    address VARCHAR(240) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    status VARCHAR(24) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_orders_customer_email ON orders (customer_email);
CREATE INDEX idx_orders_created_at ON orders (created_at);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_title VARCHAR(140) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    quantity INTEGER NOT NULL,
    line_total NUMERIC(12,2) NOT NULL
);

CREATE TABLE idempotency_records (
    id UUID PRIMARY KEY,
    scope_key VARCHAR(180) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_idempotency_scope_key UNIQUE (scope_key, idempotency_key)
);
CREATE INDEX idx_idempotency_created_at ON idempotency_records (created_at);
