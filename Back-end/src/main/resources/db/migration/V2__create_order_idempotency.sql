CREATE TABLE IF NOT EXISTS idempotency_records (
    id UUID PRIMARY KEY,
    scope_key VARCHAR(180) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_idempotency_scope_key UNIQUE (scope_key, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_created_at ON idempotency_records (created_at);
