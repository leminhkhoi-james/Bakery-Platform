ALTER TABLE bakery_payments
    ADD COLUMN idempotency_key_hash VARCHAR(64);

CREATE UNIQUE INDEX uq_bakery_payments_idempotency_key_hash
    ON bakery_payments(idempotency_key_hash)
    WHERE idempotency_key_hash IS NOT NULL;
