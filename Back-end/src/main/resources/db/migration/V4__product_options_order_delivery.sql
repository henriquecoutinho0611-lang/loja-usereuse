ALTER TABLE products
    ADD COLUMN iron_colors TEXT NOT NULL DEFAULT '',
    ADD COLUMN wood_colors TEXT NOT NULL DEFAULT '',
    ADD COLUMN wood_types TEXT NOT NULL DEFAULT '',
    ADD COLUMN upholstery_colors TEXT NOT NULL DEFAULT '';

ALTER TABLE order_items
    ADD COLUMN iron_color VARCHAR(80),
    ADD COLUMN wood_color VARCHAR(80),
    ADD COLUMN wood_type VARCHAR(80),
    ADD COLUMN upholstery_color VARCHAR(80);

ALTER TABLE orders
    ADD COLUMN delivery_date DATE,
    ADD COLUMN shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN shipping_category VARCHAR(24) NOT NULL DEFAULT 'CONTACT';
