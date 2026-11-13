CREATE TABLE order_inventory_intents (
    order_id UUID PRIMARY KEY,
    bakery_id UUID NOT NULL,
    state VARCHAR(24) NOT NULL CHECK (state IN ('RESERVING','COMMITTED','RELEASE_REQUIRED','RELEASED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_order_inventory_recovery ON order_inventory_intents(state, updated_at);
ALTER TABLE order_items ADD COLUMN source_add_on_id UUID;
