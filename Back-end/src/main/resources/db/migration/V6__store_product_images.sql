CREATE TABLE product_images (
    id UUID PRIMARY KEY,
    content_type VARCHAR(32) NOT NULL,
    image_data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
