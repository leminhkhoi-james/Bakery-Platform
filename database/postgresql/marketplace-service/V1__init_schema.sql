CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE cake_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    target_bakery_id UUID,
    base_product_id UUID,
    selected_design_id UUID,
    request_type VARCHAR(40) NOT NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    occasion VARCHAR(100),
    serving_size INTEGER,
    budget_min NUMERIC(12,2),
    budget_max NUMERIC(12,2),
    needed_at TIMESTAMPTZ NOT NULL,
    delivery_district VARCHAR(120) NOT NULL,
    delivery_city VARCHAR(120) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    offer_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_cake_requests_type CHECK (request_type IN ('OPEN_CUSTOM', 'TARGETED_PRODUCT_CUSTOM')),
    CONSTRAINT ck_cake_requests_target CHECK (
        (request_type = 'OPEN_CUSTOM' AND target_bakery_id IS NULL AND base_product_id IS NULL)
        OR
        (request_type = 'TARGETED_PRODUCT_CUSTOM' AND target_bakery_id IS NOT NULL AND base_product_id IS NOT NULL)
    ),
    CONSTRAINT ck_cake_requests_serving_size CHECK (serving_size IS NULL OR serving_size > 0),
    CONSTRAINT ck_cake_requests_budget CHECK (
        (budget_min IS NULL OR budget_min >= 0)
        AND (budget_max IS NULL OR budget_max >= 0)
        AND (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min)
    ),
    CONSTRAINT ck_cake_requests_status CHECK (status IN ('DRAFT', 'OPEN', 'OFFER_SELECTED', 'CLOSED', 'CANCELLED'))
);

CREATE TABLE request_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cake_request_id UUID NOT NULL,
    object_key VARCHAR(512) NOT NULL,
    media_type VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_request_images_request
        FOREIGN KEY (cake_request_id) REFERENCES cake_requests(id) ON DELETE CASCADE
);

CREATE TABLE cake_preferences (
    cake_request_id UUID PRIMARY KEY,
    cake_size VARCHAR(80),
    cake_shape VARCHAR(80),
    flavor VARCHAR(120),
    filling VARCHAR(120),
    frosting VARCHAR(120),
    color_palette VARCHAR(255),
    decoration_notes TEXT,
    allergy_notes TEXT,
    extra_options JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT fk_cake_preferences_request
        FOREIGN KEY (cake_request_id) REFERENCES cake_requests(id) ON DELETE CASCADE
);

CREATE TABLE request_option_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cake_request_id UUID NOT NULL,
    option_group_id UUID NOT NULL,
    option_value_id UUID NOT NULL,
    group_name_snapshot VARCHAR(120) NOT NULL,
    value_name_snapshot VARCHAR(120) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT fk_request_option_selections_request
        FOREIGN KEY (cake_request_id) REFERENCES cake_requests(id) ON DELETE CASCADE,
    CONSTRAINT ck_request_option_selections_quantity CHECK (quantity > 0)
);

CREATE TABLE request_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cake_request_id UUID NOT NULL,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by UUID NOT NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_request_status_history_request
        FOREIGN KEY (cake_request_id) REFERENCES cake_requests(id) ON DELETE CASCADE
);

CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cake_request_id UUID NOT NULL,
    bakery_id UUID NOT NULL,
    message TEXT,
    cake_price NUMERIC(12,2) NOT NULL,
    delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    add_on_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(12,2) NOT NULL,
    estimated_completion_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uq_offers_request_bakery UNIQUE (cake_request_id, bakery_id),
    CONSTRAINT fk_offers_request
        FOREIGN KEY (cake_request_id) REFERENCES cake_requests(id) ON DELETE CASCADE,
    CONSTRAINT ck_offers_prices CHECK (
        cake_price >= 0 AND delivery_fee >= 0 AND add_on_total >= 0
        AND total_price = cake_price + delivery_fee + add_on_total
    ),
    CONSTRAINT ck_offers_expiry CHECK (expires_at > created_at),
    CONSTRAINT ck_offers_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'))
);

CREATE TABLE offer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL,
    add_on_id UUID,
    item_name_snapshot VARCHAR(160) NOT NULL,
    description_snapshot TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL,
    CONSTRAINT fk_offer_items_offer
        FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    CONSTRAINT ck_offer_items_quantity CHECK (quantity > 0),
    CONSTRAINT ck_offer_items_price CHECK (unit_price >= 0 AND line_total = unit_price * quantity)
);

CREATE TABLE offer_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by UUID NOT NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_offer_status_history_offer
        FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
);

CREATE INDEX idx_cake_requests_customer_id ON cake_requests(customer_id);
CREATE INDEX idx_cake_requests_target_bakery_id ON cake_requests(target_bakery_id);
CREATE INDEX idx_cake_requests_base_product_id ON cake_requests(base_product_id);
CREATE INDEX idx_cake_requests_open_location ON cake_requests(delivery_city, delivery_district, offer_deadline)
    WHERE status = 'OPEN';
CREATE INDEX idx_request_images_request_id ON request_images(cake_request_id);
CREATE INDEX idx_request_option_selections_request_id ON request_option_selections(cake_request_id);
CREATE INDEX idx_request_option_selections_external_options ON request_option_selections(option_group_id, option_value_id);
CREATE INDEX idx_request_status_history_request_time ON request_status_history(cake_request_id, changed_at);
CREATE INDEX idx_offers_bakery_id ON offers(bakery_id);
CREATE INDEX idx_offers_request_status ON offers(cake_request_id, status);
CREATE UNIQUE INDEX uq_offers_one_accepted_per_request
    ON offers(cake_request_id) WHERE status = 'ACCEPTED';
CREATE INDEX idx_offer_items_offer_id ON offer_items(offer_id);
CREATE INDEX idx_offer_status_history_offer_time ON offer_status_history(offer_id, changed_at);
