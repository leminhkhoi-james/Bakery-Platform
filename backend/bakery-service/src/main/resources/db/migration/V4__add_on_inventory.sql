ALTER TABLE add_ons ADD COLUMN stock_quantity INTEGER CHECK (stock_quantity >= 0);

CREATE TABLE add_on_allocations (
    order_id UUID PRIMARY KEY,
    bakery_id UUID NOT NULL REFERENCES bakeries(id),
    state VARCHAR(16) NOT NULL CHECK (state IN ('ALLOCATED', 'RELEASED')),
    fingerprint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE add_on_allocation_items (
    order_id UUID NOT NULL REFERENCES add_on_allocations(order_id),
    add_on_id UUID NOT NULL REFERENCES add_ons(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (order_id, add_on_id)
);
