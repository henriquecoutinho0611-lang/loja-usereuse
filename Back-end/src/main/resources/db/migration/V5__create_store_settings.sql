CREATE TABLE store_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    whatsapp_number VARCHAR(24) NOT NULL DEFAULT '',
    sao_paulo_city_price NUMERIC(12, 2),
    sao_paulo_state_price NUMERIC(12, 2),
    delivery_outside_state_message VARCHAR(500) NOT NULL,
    payment_message VARCHAR(500) NOT NULL
);
