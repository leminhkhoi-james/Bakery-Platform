ALTER TABLE customer_orders
    ADD COLUMN customer_note TEXT;

CREATE TABLE order_idempotency_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation VARCHAR(40) NOT NULL,
    idempotency_key UUID NOT NULL,
    customer_id UUID NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    order_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_idempotency_records_order
        FOREIGN KEY (order_id) REFERENCES customer_orders(id) ON DELETE CASCADE,
    CONSTRAINT uq_order_idempotency_records_operation_customer_key
        UNIQUE (operation, customer_id, idempotency_key)
);

CREATE INDEX idx_order_idempotency_records_order_id ON order_idempotency_records(order_id);