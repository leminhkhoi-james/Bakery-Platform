CREATE TABLE order_offer_creations (
 idempotency_key VARCHAR(160) PRIMARY KEY,
 offer_id UUID NOT NULL UNIQUE REFERENCES customer_orders(offer_id),
 payload_fingerprint VARCHAR(64) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
