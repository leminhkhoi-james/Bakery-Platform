CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE customer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(40) NOT NULL UNIQUE,
    customer_id UUID NOT NULL,
    bakery_id UUID NOT NULL,
    cake_request_id UUID,
    offer_id UUID UNIQUE,
    order_source VARCHAR(30) NOT NULL,
    customer_name_snapshot VARCHAR(120) NOT NULL,
    customer_phone_snapshot VARCHAR(30) NOT NULL,
    bakery_name_snapshot VARCHAR(180) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    needed_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_customer_orders_source CHECK (
        (order_source = 'DIRECT_CATALOG' AND cake_request_id IS NULL AND offer_id IS NULL)
        OR
        (order_source = 'ACCEPTED_OFFER' AND cake_request_id IS NOT NULL AND offer_id IS NOT NULL)
    ),
    CONSTRAINT ck_customer_orders_amounts CHECK (
        subtotal >= 0 AND delivery_fee >= 0 AND total_amount = subtotal + delivery_fee
    ),
    CONSTRAINT ck_customer_orders_status CHECK (status IN ('PENDING', 'CONFIRMED', 'BAKING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    source_product_id UUID,
    source_offer_item_id UUID,
    item_type VARCHAR(30) NOT NULL,
    name_snapshot VARCHAR(180) NOT NULL,
    description_snapshot TEXT,
    configuration_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL,
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    CONSTRAINT ck_order_items_type CHECK (item_type IN ('CAKE', 'ADD_ON', 'SERVICE')),
    CONSTRAINT ck_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT ck_order_items_price CHECK (unit_price >= 0 AND line_total = unit_price * quantity)
);

CREATE TABLE delivery_address_snapshots (
    order_id UUID PRIMARY KEY,
    recipient_name VARCHAR(120) NOT NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    ward VARCHAR(120),
    district VARCHAR(120) NOT NULL,
    city VARCHAR(120) NOT NULL,
    latitude NUMERIC(9,6),
    longitude NUMERIC(10,6),
    delivery_note TEXT,
    CONSTRAINT fk_delivery_address_snapshots_order
        FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    CONSTRAINT ck_delivery_address_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_delivery_address_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by UUID NOT NULL,
    note TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_status_history_order
        FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE
);

CREATE TABLE order_reviews (
    order_id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    rating SMALLINT NOT NULL,
    comment TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_order_reviews_order
        FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    CONSTRAINT ck_order_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT ck_order_reviews_status CHECK (status IN ('PUBLISHED', 'HIDDEN', 'DELETED'))
);

CREATE INDEX idx_customer_orders_customer_id ON customer_orders(customer_id);
CREATE INDEX idx_customer_orders_bakery_status ON customer_orders(bakery_id, status);
CREATE INDEX idx_customer_orders_cake_request_id ON customer_orders(cake_request_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_source_product_id ON order_items(source_product_id);
CREATE INDEX idx_order_status_history_order_time ON order_status_history(order_id, changed_at);
CREATE INDEX idx_order_reviews_customer_id ON order_reviews(customer_id);
